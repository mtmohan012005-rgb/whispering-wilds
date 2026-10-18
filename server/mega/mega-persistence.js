// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MEGA PERSISTENCE SERVICE
// ============================================================================
//
// MEGA-based replacement for Firebase/Firestore persistence.
// This module provides the same interface as persistence-service.js but uses
// MEGA Cloud Drive as the storage backend instead of Firestore.
//
// The server validates all save data before storing it in MEGA:
// - Checksum verification to detect corruption
// - Save version validation
// - Size limits (512 KB per save)
// - User isolation (each user's saves are in their own folder)
//
// If MEGA is not configured or unreachable, the service fails closed
// (returns error) rather than silently accepting writes.
// ============================================================================

const megaAdapter = require('./mega-adapter');
const { ERROR_CODES, toAppError } = require('../error-codes');
const Logger = require('../logger');

const DEFAULT_SAVE_ID = 'slot_0';
const SUPPORTED_SAVE_VERSIONS = new Set([1, 2, 3, 4]);
const MAX_SAVE_BYTES = 512 * 1024; // 512 KB

/**
 * FNV-1a 32-bit checksum for integrity verification.
 */
function computeChecksum(payload) {
    const json = stableStringify(payload);
    let hash = 0x811c9dc5;
    for (let i = 0; i < json.length; i += 1) {
        hash ^= json.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/**
 * Validates a save submission from the client.
 */
function validateSave(body) {
    if (!body || typeof body !== 'object') {
        throw toAppError(ERROR_CODES.INVALID_PAYLOAD, 'Request body must be an object.');
    }

    const saveVersion = body.saveVersion === undefined ? 3 : body.saveVersion;
    if (!SUPPORTED_SAVE_VERSIONS.has(saveVersion)) {
        throw toAppError(
            ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
            `Unsupported saveVersion: ${saveVersion}`,
            { supported: Array.from(SUPPORTED_SAVE_VERSIONS) }
        );
    }

    if (!body.data || typeof body.data !== 'object') {
        throw toAppError(ERROR_CODES.INVALID_PAYLOAD, 'save.data must be an object.');
    }

    if (!body.checksum || typeof body.checksum !== 'string') {
        throw toAppError(ERROR_CODES.MISSING_CHECKSUM);
    }

    // Validate checksum
    const expected = computeChecksum(body.data);
    if (body.checksum !== expected) {
        throw toAppError(
            ERROR_CODES.VALIDATION_FAILED,
            'Checksum does not match payload.',
            { expected }
        );
    }

    // Estimate size
    const byteLength = Buffer.byteLength(JSON.stringify(body.data), 'utf8');
    if (byteLength > MAX_SAVE_BYTES) {
        throw toAppError(
            ERROR_CODES.INVALID_PAYLOAD,
            `Save data exceeds maximum size of ${MAX_SAVE_BYTES} bytes.`,
            { size: byteLength, max: MAX_SAVE_BYTES }
        );
    }

    return {
        saveId: body.saveId || DEFAULT_SAVE_ID,
        saveVersion,
        data: body.data,
        checksum: body.checksum,
        baseRevision: body.baseRevision || 0,
        idempotencyKey: body.idempotencyKey || null
    };
}

/**
 * Saves a game to MEGA Cloud Drive.
 * 
 * @param {string} uid - Server-verified user ID from auth token
 * @param {object} body - Save submission from client
 * @returns {Promise<{revision: number, savedAt: string, region?: string, replayed?: boolean}>}
 */
async function saveGame(uid, body) {
    const validated = validateSave(body);
    
    const result = await megaAdapter.uploadSave(
        uid,
        validated.saveId,
        JSON.stringify({
            version: validated.saveVersion,
            data: validated.data,
            checksum: validated.checksum,
            revision: (validated.baseRevision || 0) + 1,
            savedAt: new Date().toISOString()
        })
    );

    if (!result.success) {
        throw toAppError(
            ERROR_CODES.STORAGE_ERROR,
            `Failed to save to cloud: ${result.error}`
        );
    }

    Logger.info('[MEGAPersistence] Save uploaded to MEGA.', {
        uid,
        saveId: validated.saveId,
        revision: (validated.baseRevision || 0) + 1
    });

    return {
        revision: (validated.baseRevision || 0) + 1,
        savedAt: result.savedAt,
        region: validated.data.region || null,
        replayed: false
    };
}

/**
 * Loads a game from MEGA Cloud Drive.
 * 
 * @param {string} uid - Server-verified user ID
 * @param {string} saveId - Save slot identifier
 * @returns {Promise<object|null> - Save data or null if not found
 */
async function loadSave(uid, saveId) {
    const result = await megaAdapter.downloadSave(uid, saveId || DEFAULT_SAVE_ID);
    
    if (!result.success) {
        if (result.error === 'Save not found' || result.error === 'No saves found for this user') {
            return null;
        }
        throw toAppError(
            ERROR_CODES.STORAGE_ERROR,
            `Failed to load from cloud: ${result.error}`
        );
    }

    // Parse and validate the save data
    let saveData;
    try {
        saveData = JSON.parse(result.data);
    } catch (err) {
        throw toAppError(
            ERROR_CODES.VALIDATION_FAILED,
            'Saved data is corrupted and cannot be parsed.'
        );
    }

    // Verify checksum
    if (saveData.checksum) {
        const expected = computeChecksum(saveData.data);
        if (saveData.checksum !== expected) {
            Logger.warn('[MEGAPersistence] Checksum mismatch on load — data may be corrupted.', {
                uid,
                saveId: saveId || DEFAULT_SAVE_ID
            });
        }
    }

    return saveData;
}

module.exports = {
    saveGame,
    loadSave,
    validateSave,
    computeChecksum
};
