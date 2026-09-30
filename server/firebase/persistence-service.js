// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SERVER-AUTHORITATIVE PERSISTENCE
// ============================================================================
//
// This is the ONLY module permitted to write economy / progression fields.
// Clients may stage intent; the server validates, authorizes, and commits.
//
// DESIGN RULES ENFORCED HERE
// ---------------------------
// 1. CANONICAL IDENTITY   - uid comes from a verified Firebase ID token only.
// 2. OPTIMISTIC CONCURRENCY - every save carries the revision it was based on.
//    Inside a Firestore transaction we compare it to the stored revision; a
//    mismatch aborts with SAVE_CONFLICT instead of silently overwriting.
// 3. CHECKSUM             - every save carries a checksum over its payload so
//    corruption is detectable rather than silently persisted.
// 4. IDEMPOTENCY          - an optional idempotency key makes retries safe.
// 5. FIVE-CHANGE CAP      - permanent appearance changes are counted and
//    incremented inside a transaction, so concurrent requests cannot exceed 5.
// 6. BOUNDED RETRY        - transaction retries are capped with backoff.
// ============================================================================

const FirebaseAdmin = require('./admin');
const { ERROR_CODES, toAppError } = require('../error-codes');
const config = require('../config');
const Logger = require('../logger');

const SAVES_COLLECTION = 'saves';
const DEFAULT_SAVE_ID = 'slot_0';

// Firestore transaction retry budget (§17: bounded retries, no infinite loops).
const MAX_TRANSACTION_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 25;
const MAX_BACKOFF_MS = 400;

// Bound on serialized save payload size (Firestore hard limit is ~1 MiB).
const MAX_SAVE_BYTES = 512 * 1024;

const SUPPORTED_SAVE_VERSIONS = new Set([1, 2, 3]);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt) {
    return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, attempt));
}

/**
 * FNV-1a 32-bit, hex encoded. Deterministic and dependency-free.
 * This is an integrity checksum, not a cryptographic MAC; it detects accidental
 * corruption and truncation, not adversarial tampering. Authenticity comes from
 * the verified token + transaction, not from this value.
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

function estimateBytes(value) {
    try {
        return Buffer.byteLength(stableStringify(value), 'utf8');
    } catch (err) {
        return Infinity;
    }
}

/**
 * Validates a save submission. Returns a normalized, safe payload.
 * Throws AppError on any violation.
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

    // Validate checksum over the exact data we are about to persist.
    const expected = computeChecksum(body.data);
    if (body.checksum !== expected) {
        throw toAppError(
            ERROR_CODES.VALIDATION_FAILED,
            'Checksum does not match payload.',
            { expected }
        );
    }

    if (estimateBytes(body.data) > MAX_SAVE_BYTES) {
        throw toAppError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Save data exceeds the size limit.', {
            maxBytes: MAX_SAVE_BYTES
        });
    }

    // Client may not set privileged fields. Strip defensively so a client
    // cannot inject economy values even if rules are not yet deployed.
    const {
        currency: _c,
        premium: _p,
        achievements: _a,
        permanentAppearanceChanges: _pac,
        appearanceChangeCount: _acc,
        antiCheat: _ac,
        role: _r,
        uid: _u,
        ...safeData
    } = body.data;

    return {
        saveVersion,
        data: safeData,
        checksum: expected,
        baseRevision: Number.isInteger(body.baseRevision) ? body.baseRevision : 0,
        idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey.slice(0, 128) : null
    };
}

/**
 * Runs a Firestore transaction with bounded retry on contention.
 */
async function runTransaction(db, fn) {
    let lastError = null;
    for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
        try {
            return await db.runTransaction(fn);
        } catch (err) {
            lastError = err;
            const contended = err && (err.code === 10 || err.code === 'aborted' || /contention|retry/i.test(err.message || ''));
            if (!contended || attempt === MAX_TRANSACTION_ATTEMPTS - 1) throw err;
            await sleep(backoffDelay(attempt));
        }
    }
    throw lastError;
}

/**
 * Loads the current save for a uid.
 */
async function loadSave(uid, saveId = DEFAULT_SAVE_ID) {
    const db = FirebaseAdmin.getFirestore();
    const ref = db.collection('players').doc(uid).collection(SAVES_COLLECTION).doc(saveId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    return { saveId, ...snap.data() };
}

/**
 * Commits a save with optimistic concurrency control.
 *
 * @param {string} uid  canonical uid from a verified token
 * @param {object} body raw request body
 * @returns {Promise<{revision:number, savedAt:string, region:string|null}>}
 */
async function saveGame(uid, body) {
    const normalized = validateSave(body);
    const saveId = typeof body.saveId === 'string' && body.saveId ? body.saveId.slice(0, 64) : DEFAULT_SAVE_ID;

    const db = FirebaseAdmin.getFirestore();
    const playerRef = db.collection('players').doc(uid);
    const saveRef = playerRef.collection(SAVES_COLLECTION).doc(saveId);

    const result = await runTransaction(db, async (tx) => {
        const [playerSnap, saveSnap] = await Promise.all([
            tx.get(playerRef),
            tx.get(saveRef)
        ]);

        const playerData = playerSnap.exists ? playerSnap.data() : {};
        const existingSave = saveSnap.exists ? saveSnap.data() : null;

        // ---- Idempotency -------------------------------------------------
        const idempotency = playerData.idempotencyKeys || {};
        if (normalized.idempotencyKey && idempotency[normalized.idempotencyKey]) {
            const prior = idempotency[normalized.idempotencyKey];
            return {
                revision: prior.revision,
                savedAt: prior.savedAt,
                region: prior.region,
                replayed: true
            };
        }

        // ---- Optimistic concurrency -------------------------------------
        const currentRevision = existingSave && Number.isInteger(existingSave.revision)
            ? existingSave.revision
            : 0;

        if (normalized.baseRevision !== currentRevision) {
            throw toAppError(
                ERROR_CODES.SAVE_CONFLICT,
                'Stored save has changed since it was loaded.',
                { baseRevision: normalized.baseRevision, currentRevision }
            );
        }

        const nextRevision = currentRevision + 1;
        const savedAt = new Date().toISOString();
        const region = normalized.data.region || null;

        const saveDoc = {
            uid,
            saveVersion: normalized.saveVersion,
            revision: nextRevision,
            checksum: normalized.checksum,
            data: normalized.data,
            clientTime: typeof body.clientTime === 'string' ? body.clientTime : savedAt,
            savedAt
        };

        tx.set(saveRef, saveDoc, { merge: false });

        // Server-owned header fields. Clients cannot write these under rules.
        const header = {
            uid,
            lastSaveTime: savedAt,
            // Set server-side so a modified client cannot spoof presence.
            lastLogin: playerData.lastLogin || savedAt,
            currentRegion: region || playerData.currentRegion || 'george_town',
            revision: nextRevision
        };
        if (typeof normalized.data.playTime === 'number') {
            header.playTime = normalized.data.playTime;
        }
        if (!playerSnap.exists) {
            header.createdAt = savedAt;
            header.role = 'explorer';
            header.maxCustomizationChanges = config.CUSTOMIZATION_RULES.MAX_PLAYER_CHANGES;
            header.appearanceChangeCount = 0;
        }
        tx.set(playerRef, header, { merge: true });

        if (normalized.idempotencyKey) {
            // Keep the most recent 16 keys to bound document growth.
            const nextKeys = { ...idempotency };
            nextKeys[normalized.idempotencyKey] = { revision: nextRevision, savedAt, region };
            const ordered = Object.keys(nextKeys)
                .sort((a, b) => String(nextKeys[a].savedAt).localeCompare(String(nextKeys[b].savedAt)))
                .slice(-16);
            const bounded = {};
            for (const key of ordered) bounded[key] = nextKeys[key];
            tx.set(playerRef, { idempotencyKeys: bounded }, { merge: true });
        }

        return { revision: nextRevision, savedAt, region, replayed: false };
    });

    Logger.info('[Persistence] Save committed', {
        uid,
        saveId,
        revision: result.revision,
        replayed: result.replayed
    });

    return result;
}

/**
 * Applies a permanent appearance change, enforcing the 5-change cap
 * atomically. The cap is a server-owned counter incremented in the same
 * transaction as the change record, so parallel requests cannot exceed 5.
 *
 * @param {string} uid
 * @param {object} change  { slot, assetId, cost }
 */
async function applyAppearanceChange(uid, change) {
    if (!change || typeof change !== 'object') {
        throw toAppError(ERROR_CODES.INVALID_PAYLOAD, 'change must be an object.');
    }
    const slot = String(change.slot || '').trim();
    const assetId = String(change.assetId || '').trim();
    if (!slot || !assetId) {
        throw toAppError(ERROR_CODES.VALIDATION_FAILED, 'change.slot and change.assetId are required.');
    }
    if (slot.length > 64 || assetId.length > 128) {
        throw toAppError(ERROR_CODES.VALIDATION_FAILED, 'change.slot or change.assetId is too long.');
    }

    const cost = Number.isInteger(change.cost) && change.cost >= 0 ? change.cost : 0;
    const max = config.CUSTOMIZATION_RULES.MAX_PLAYER_CHANGES;

    const db = FirebaseAdmin.getFirestore();
    const playerRef = db.collection('players').doc(uid);
    const changesRef = playerRef.collection('appearanceChanges').doc(slot);

    return runTransaction(db, async (tx) => {
        const [playerSnap, changeSnap] = await Promise.all([
            tx.get(playerRef),
            tx.get(changesRef)
        ]);

        const player = playerSnap.exists ? playerSnap.data() : {};
        const cap = Number.isInteger(player.maxCustomizationChanges)
            ? player.maxCustomizationChanges
            : max;
        const used = Number.isInteger(player.appearanceChangeCount) ? player.appearanceChangeCount : 0;

        if (changeSnap.exists) {
            const existing = changeSnap.data();
            if (existing.assetId === assetId) {
                throw toAppError(
                    ERROR_CODES.DUPLICATE_CUSTOMIZATION,
                    'This slot already holds that asset.',
                    { slot, assetId }
                );
            }
        }

        if (used >= cap) {
            throw toAppError(
                ERROR_CODES.CUSTOMIZATION_LIMIT_REACHED,
                `Maximum of ${cap} permanent appearance changes reached.`,
                { cap, used, remaining: 0 }
            );
        }

        const currency = Number.isInteger(player.currency) ? player.currency : 0;
        if (cost > 0 && currency < cost) {
            throw toAppError(ERROR_CODES.INSUFFICIENT_FUNDS, 'Not enough currency.', {
                currency, cost
            });
        }

        const appliedAt = new Date().toISOString();

        tx.set(changesRef, {
            uid,
            slot,
            assetId,
            cost,
            appliedAt,
            changeIndex: used + 1
        }, { merge: true });

        const updates = {
            uid,
            appearanceChangeCount: used + 1,
            permanentAppearanceChanges: used + 1
        };
        if (cost > 0) updates.currency = currency - cost;
        if (!playerSnap.exists) {
            updates.role = 'explorer';
            updates.maxCustomizationChanges = cap;
            updates.createdAt = appliedAt;
        }
        tx.set(playerRef, updates, { merge: true });

        return {
            slot,
            assetId,
            changeIndex: used + 1,
            remaining: Math.max(0, cap - (used + 1)),
            currency: cost > 0 ? currency - cost : currency
        };
    });
}

/**
 * Reads the player's customization budget. Never mutates.
 */
async function getCustomizationBudget(uid) {
    const db = FirebaseAdmin.getFirestore();
    const playerRef = db.collection('players').doc(uid);
    const snap = await playerRef.get();
    const player = snap.exists ? snap.data() : {};
    const cap = Number.isInteger(player.maxCustomizationChanges)
        ? player.maxCustomizationChanges
        : config.CUSTOMIZATION_RULES.MAX_PLAYER_CHANGES;
    const used = Number.isInteger(player.appearanceChangeCount) ? player.appearanceChangeCount : 0;
    return {
        max: cap,
        used,
        remaining: Math.max(0, cap - used),
        currency: Number.isInteger(player.currency) ? player.currency : 0
    };
}

module.exports = {
    computeChecksum,
    stableStringify,
    validateSave,
    saveGame,
    loadSave,
    applyAppearanceChange,
    getCustomizationBudget,
    MAX_SAVE_BYTES,
    SUPPORTED_SAVE_VERSIONS,
    MAX_TRANSACTION_ATTEMPTS
};
