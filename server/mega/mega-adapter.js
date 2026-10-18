// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MEGA CLOUD DRIVE ADAPTER
// ============================================================================
//
// This module provides a storage abstraction layer for MEGA Cloud Drive,
// replacing the Firebase/Firestore persistence backend.
//
// IMPORTANT: This uses the UNOFFICIAL megajs SDK (v1.3.10). MEGA does not
// provide an official Node.js SDK. The official SDK is C++ only.
//
// RISKS OF UNOFFICIAL SDK:
// - No official support from MEGA
// - API may break if MEGA changes their internal protocol
// - Maintenance depends on community contributors
// - No sharing features implemented
//
// DESIGN PRINCIPLES:
// 1. CREDENTIALS NEVER LEAVE THE SERVER — MEGA email/password are server-side
//    secrets. Unity clients never see them.
// 2. FAIL-CLOSED — if MEGA is unreachable or unconfigured, the server returns
//    503 rather than silently accepting writes.
// 3. USER ISOLATION — each player's saves are stored in a subfolder named
//    by their server-verified user ID, not by client-supplied data.
// 4. LOCAL FALLBACK — if cloud storage fails, local saves remain authoritative.
//
// CREDENTIAL SOURCES (in priority order):
//   1. MEGA_EMAIL + MEGA_PASSWORD — direct credentials (Render secret env vars)
//   2. MEGA_SESSION — pre-existing session ID (for stateless deployments)
//
// No credential is ever read from the repository, and none is ever logged.
// ============================================================================

const Logger = require('../logger');
const { ERROR_CODES, toAppError } = require('../error-codes');
const config = require('../config');

// Lazy require so the server still boots when the optional dependency is not
// installed, allowing the service to report NOT_CONFIGURED cleanly.
let Mega = null;
try {
    // eslint-disable-next-line global-require
    Mega = require('megajs');
} catch (err) {
    Logger.warn('[MEGAAdapter] megajs package not installed. Cloud saves disabled.', {
        hint: 'Run: npm install megajs'
    });
}

const SAVES_FOLDER = 'WhisperingWildsSaves';
const MAX_SAVE_BYTES = 512 * 1024; // 512 KB per save file

let storage = null;
let initialized = false;
let initError = null;

/**
 * Checks whether MEGA credentials are configured in environment variables.
 */
function isConfigured() {
    return Boolean(config.MEGA_EMAIL && config.MEGA_PASSWORD);
}

/**
 * Initializes the MEGA storage connection. This is a one-time operation that
 * logs into the MEGA account and creates the saves folder if needed.
 *
 * Returns a promise that resolves when ready or rejects if configuration is
 * missing or login fails.
 */
async function initialize() {
    if (initialized) return storage;
    
    // Mark as attempted so repeated calls don't retry indefinitely
    initialized = true;

    if (!isConfigured()) {
        initError = 'MEGA_EMAIL or MEGA_PASSWORD is not set';
        Logger.warn('[MEGAAdapter] Not configured. Persistent operations are disabled.', {
            hint: 'Set MEGA_EMAIL and MEGA_PASSWORD environment variables to enable MEGA cloud saves.'
        });
        return null;
    }

    if (!Mega) {
        initError = 'megajs package is not installed';
        Logger.error('[MEGAAdapter] Missing dependency. Run: npm install megajs');
        return null;
    }

    try {
        Logger.info('[MEGAAdapter] Logging in to MEGA Cloud Drive...');
        
        storage = new Mega({
            email: config.MEGA_EMAIL,
            password: config.MEGA_PASSWORD,
            autoload: true,
            keepalive: true
        });

        // Wait for ready event
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('MEGA login timed out after 30 seconds'));
            }, 30000);

            storage.once('ready', () => {
                clearTimeout(timeout);
                resolve();
            });

            storage.once('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        Logger.info('[MEGAAdapter] MEGA login successful.', {
            name: storage.name,
            user: storage.user
        });

        // Create the saves folder if it doesn't exist
        await ensureSavesFolder();

        return storage;
    } catch (err) {
        initError = err.message;
        Logger.error('[MEGAAdapter] Failed to initialize MEGA storage.', { error: err.message });
        storage = null;
        return null;
    }
}

/**
 * Ensures the WhisperingWildsSaves folder exists in the MEGA Cloud Drive root.
 */
async function ensureSavesFolder() {
    if (!storage || !storage.root) {
        return;
    }

    try {
        // Check if folder already exists
        const existing = storage.root.find(SAVES_FOLDER);
        if (existing && existing.length > 0) {
            Logger.debug('[MEGAAdapter] Saves folder already exists.');
            return;
        }

        // Create the folder
        await storage.mkdir(SAVES_FOLDER).complete;
        Logger.info('[MEGAAdapter] Created saves folder:', SAVES_FOLDER);
    } catch (err) {
        Logger.warn('[MEGAAdapter] Failed to create saves folder.', { error: err.message });
        // Non-fatal: folder may already exist or will be created on first upload
    }
}

/**
 * Returns the folder path for a specific user's saves.
 * Each user gets their own subfolder to ensure isolation.
 */
function getUserFolder(userId) {
    // Sanitize user ID to prevent path traversal
    const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${SAVES_FOLDER}/${sanitized}`;
}

/**
 * Uploads a save file to MEGA Cloud Drive.
 * 
 * @param {string} userId - Server-verified user ID (never client-supplied)
 * @param {string} saveId - Save slot identifier (e.g., 'slot_0')
 * @param {string} jsonContent - JSON string of the save data
 * @returns {Promise<{success: boolean, savedAt: string, error?: string}>}
 */
async function uploadSave(userId, saveId, jsonContent) {
    if (!storage) {
        return { success: false, error: initError || 'MEGA storage not initialized' };
    }

    try {
        // Validate save size
        const byteLength = Buffer.byteLength(jsonContent, 'utf8');
        if (byteLength > MAX_SAVE_BYTES) {
            throw toAppError(
                ERROR_CODES.INVALID_PAYLOAD,
                `Save data exceeds maximum size of ${MAX_SAVE_BYTES} bytes.`,
                { size: byteLength, max: MAX_SAVE_BYTES }
            );
        }

        // Create user folder if needed
        const userFolderName = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userFolder = storage.root.find(userFolderName);
        
        let targetFolder;
        if (!userFolder || userFolder.length === 0) {
            // Create the user's subfolder inside WhisperingWildsSaves
            const savesFolder = storage.root.find(SAVES_FOLDER);
            if (!savesFolder || savesFolder.length === 0) {
                await storage.mkdir(SAVES_FOLDER).complete;
                targetFolder = storage.root.find(SAVES_FOLDER)[0];
            } else {
                targetFolder = savesFolder[0];
            }
            
            await targetFolder.mkdir(userFolderName).complete;
            targetFolder = targetFolder.find(userFolderName)[0];
        } else {
            targetFolder = userFolder[0];
        }

        // Upload the save file
        const fileName = `${saveId}.json`;
        const uploadedFile = await targetFolder.upload(fileName, jsonContent).complete;

        Logger.info('[MEGAAdapter] Save uploaded successfully.', {
            userId,
            saveId,
            fileSize: byteLength,
            nodeId: uploadedFile.nodeId
        });

        return {
            success: true,
            savedAt: new Date().toISOString(),
            nodeId: uploadedFile.nodeId
        };
    } catch (err) {
        Logger.error('[MEGAAdapter] Failed to upload save.', {
            userId,
            saveId,
            error: err.message
        });
        return { success: false, error: err.message };
    }
}

/**
 * Downloads a save file from MEGA Cloud Drive.
 * 
 * @param {string} userId - Server-verified user ID
 * @param {string} saveId - Save slot identifier
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function downloadSave(userId, saveId) {
    if (!storage) {
        return { success: false, error: initError || 'MEGA storage not initialized' };
    }

    try {
        // Find the user's folder inside WhisperingWildsSaves/
        const userFolderPath = getUserFolder(userId);
        const savesFolder = storage.root.find(SAVES_FOLDER);
        
        if (!savesFolder || savesFolder.length === 0) {
            return { success: false, error: 'No saves found for this user' };
        }

        const userFolder = savesFolder[0].find(userId.replace(/[^a-zA-Z0-9_-]/g, '_'));
        if (!userFolder || userFolder.length === 0) {
            return { success: false, error: 'No saves found for this user' };
        }

        // Find the specific save file
        const fileName = `${saveId}.json`;
        const saveFile = userFolder[0].find(fileName);
        
        if (!saveFile || saveFile.length === 0) {
            return { success: false, error: 'Save not found' };
        }

        // Download the file content
        const content = await saveFile[0].text();

        Logger.info('[MEGAAdapter] Save downloaded successfully.', {
            userId,
            saveId,
            fileSize: Buffer.byteLength(content, 'utf8')
        });

        return { success: true, data: content };
    } catch (err) {
        Logger.error('[MEGAAdapter] Failed to download save.', {
            userId,
            saveId,
            error: err.message
        });
        return { success: false, error: err.message };
    }
}

/**
 * Lists all save slots for a user.
 * 
 * @param {string} userId - Server-verified user ID
 * @returns {Promise<{success: boolean, saves?: string[], error?: string}>}
 */
async function listSaves(userId) {
    if (!storage) {
        return { success: false, error: initError || 'MEGA storage not initialized' };
    }

    try {
        // Find the saves root folder first
        const savesFolder = storage.root.find(SAVES_FOLDER);
        if (!savesFolder || savesFolder.length === 0) {
            return { success: true, saves: [] };
        }

        // Find the user's folder inside WhisperingWildsSaves/
        const userFolderName = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userFolder = savesFolder[0].find(userFolderName);
        
        if (!userFolder || userFolder.length === 0) {
            return { success: true, saves: [] };
        }

        // List all .json files in the user's folder
        const files = userFolder[0].filter(f => f.name.endsWith('.json') && !f.dir);
        const saveIds = files.map(f => f.name.replace('.json', ''));

        return { success: true, saves: saveIds };
    } catch (err) {
        Logger.error('[MEGAAdapter] Failed to list saves.', {
            userId,
            error: err.message
        });
        return { success: false, error: err.message };
    }
}

/**
 * Deletes a save file from MEGA Cloud Drive.
 * 
 * @param {string} userId - Server-verified user ID
 * @param {string} saveId - Save slot identifier
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteSave(userId, saveId) {
    if (!storage) {
        return { success: false, error: initError || 'MEGA storage not initialized' };
    }

    try {
        // Find the saves root folder first
        const savesFolder = storage.root.find(SAVES_FOLDER);
        if (!savesFolder || savesFolder.length === 0) {
            return { success: true }; // Already doesn't exist
        }

        // Find the user's folder inside WhisperingWildsSaves/
        const userFolderName = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userFolder = savesFolder[0].find(userFolderName);
        
        if (!userFolder || userFolder.length === 0) {
            return { success: true }; // Already doesn't exist
        }

        const fileName = `${saveId}.json`;
        const saveFile = userFolder[0].find(fileName);
        
        if (!saveFile || saveFile.length === 0) {
            return { success: true }; // Already doesn't exist
        }

        // Move to trash (MEGA doesn't have permanent delete via SDK)
        await saveFile[0].remove().complete;

        Logger.info('[MEGAAdapter] Save deleted.', { userId, saveId });
        return { success: true };
    } catch (err) {
        Logger.error('[MEGAAdapter] Failed to delete save.', {
            userId,
            saveId,
            error: err.message
        });
        return { success: false, error: err.message };
    }
}

/**
 * Probes the MEGA connection status for the /ready endpoint.
 * 
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function probe() {
    if (!isConfigured()) {
        return {
            ok: false,
            reason: 'MEGA credentials not configured'
        };
    }

    if (!Mega) {
        return {
            ok: false,
            reason: 'megajs package not installed'
        };
    }

    if (!storage) {
        return {
            ok: false,
            reason: initError || 'MEGA storage not initialized'
        };
    }

    return { ok: true };
}

module.exports = {
    initialize,
    uploadSave,
    downloadSave,
    listSaves,
    deleteSave,
    probe,
    isConfigured
};
