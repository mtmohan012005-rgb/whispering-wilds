// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - FIREBASE ADMIN SDK WRAPPER
// ============================================================================
//
// CANONICAL IDENTITY RULE
// -----------------------
// The Firebase Auth UID is the ONLY canonical player identity. A client-supplied
// uid / email / displayName is NEVER trusted. Any route that persists data
// derives the uid from a verified Firebase ID token via `requireAuth`.
//
// FAIL-CLOSED BY DESIGN
// ---------------------
// This project currently has NO Firebase credentials wired in (the browser
// config is the `debug-c26abc33` demo project with an empty apiKey, which is
// explicitly treated as "not configured"). Rather than silently degrading to a
// permissive no-op, every privileged operation throws FIREBASE_NOT_CONFIGURED
// so that a missing secret can never be mistaken for a successful write.
//
// CREDENTIAL SOURCES (in priority order)
// ---------------------------------------
//   1. GOOGLE_APPLICATION_CREDENTIALS   - file path, or
//   2. FIREBASE_SERVICE_ACCOUNT_JSON    - inline JSON (Render secret env var)
//   3. Application Default Credentials  - automatic on GCP / Render
//
// No credential is ever read from the repository, and none is ever logged.
// ============================================================================

const config = require('../config');
const Logger = require('../logger');
const { ERROR_CODES, toAppError } = require('../error-codes');

let adminApp = null;
let initError = null;
let initAttempted = false;

// Injected for unit tests; null in production.
let sdkOverride = null;

function setSdkForTesting(sdk) {
    sdkOverride = sdk;
    initAttempted = false;
    adminApp = null;
    initError = null;
}

function resetForTesting() {
    sdkOverride = null;
    initAttempted = false;
    adminApp = null;
    initError = null;
}

function loadSdk() {
    if (sdkOverride) return sdkOverride;
    // Lazy require so the server still boots (and reports NOT_CONFIGURED
    // cleanly) when the optional dependency is not installed.
    try {
        // eslint-disable-next-line global-require
        return require('firebase-admin');
    } catch (err) {
        return null;
    }
}

function isConfigured() {
    if (config.FIREBASE_MOCK) return true;
    return Boolean(config.FIREBASE_PROJECT_ID);
}

function parseServiceAccount() {
    const raw = config.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (err) {
        initError = 'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON';
        return null;
    }
}

function initializeApp() {
    if (initAttempted) return adminApp;
    initAttempted = true;

    if (!isConfigured()) {
        initError = 'FIREBASE_PROJECT_ID is not set';
        Logger.warn('[FirebaseAdmin] Not configured. Persistent operations are disabled.', {
            hint: 'Set FIREBASE_PROJECT_ID and provide credentials to enable Firebase persistence.'
        });
        return null;
    }

    const sdk = loadSdk();
    if (!sdk) {
        initError = 'firebase-admin package is not installed';
        Logger.error('[FirebaseAdmin] Missing dependency. Run: npm install firebase-admin');
        return null;
    }

    try {
        const existing = sdk.apps && sdk.apps.length ? sdk.app() : null;
        if (existing) {
            adminApp = existing;
            return adminApp;
        }

        const options = { projectId: config.FIREBASE_PROJECT_ID };

        if (config.FIREBASE_DATABASE_URL) {
            options.databaseURL = config.FIREBASE_DATABASE_URL;
        }

        const serviceAccount = parseServiceAccount();
        if (serviceAccount) {
            options.credential = sdk.credential.cert(serviceAccount);
        }
        // Otherwise fall through to Application Default Credentials.

        adminApp = sdk.initializeApp(options);
        Logger.info('[FirebaseAdmin] Initialized', { projectId: config.FIREBASE_PROJECT_ID });
        return adminApp;
    } catch (err) {
        initError = err.message;
        Logger.error('[FirebaseAdmin] Initialization failed', { error: err.message });
        adminApp = null;
        return null;
    }
}

function getApp() {
    return adminApp || initializeApp();
}

function getSdk() {
    return loadSdk();
}

/**
 * Returns a Firestore handle, or throws if Firebase is unavailable.
 * Fail-closed: callers must not treat null as success.
 */
function requireFirestore() {
    const app = getApp();
    if (!app) {
        throw toAppError(ERROR_CODES.FIREBASE_NOT_CONFIGURED, initError || 'Firebase is not configured');
    }
    const sdk = getSdk();
    if (!sdk) {
        throw toAppError(ERROR_CODES.FIREBASE_NOT_CONFIGURED, 'firebase-admin is not installed');
    }
    return app.firestore();
}

function isAvailable() {
    return getApp() !== null;
}

/**
 * Verifies a Firebase ID token and returns the decoded claims.
 * The returned uid is canonical; callers must not accept a client uid.
 *
 * @param {string} idToken
 * @param {object} [opts]
 * @param {boolean} [opts.checkRevoked=true]
 * @returns {Promise<{uid: string, email: string|null, emailVerified: boolean, name: string|null}>}
 */
async function verifyIdToken(idToken, opts = {}) {
    const { checkRevoked = true } = opts;
    const app = getApp();
    if (!app) {
        throw toAppError(ERROR_CODES.FIREBASE_NOT_CONFIGURED, initError || 'Firebase is not configured');
    }

    let decoded;
    try {
        decoded = await app.auth().verifyIdToken(idToken, checkRevoked);
    } catch (err) {
        if (err && err.code === 'auth/id-token-revoked') {
            throw toAppError(ERROR_CODES.INVALID_TOKEN, 'ID token has been revoked');
        }
        if (err && err.code === 'auth/id-token-expired') {
            throw toAppError(ERROR_CODES.INVALID_TOKEN, 'ID token has expired');
        }
        throw toAppError(ERROR_CODES.INVALID_TOKEN, 'ID token could not be verified');
    }

    if (!decoded || !decoded.uid) {
        throw toAppError(ERROR_CODES.INVALID_TOKEN, 'ID token has no uid');
    }

    return {
        uid: decoded.uid,
        email: decoded.email || null,
        emailVerified: Boolean(decoded.email_verified),
        name: decoded.name || null
    };
}

function extractBearer(headerValue) {
    if (!headerValue || typeof headerValue !== 'string') return null;
    if (!headerValue.startsWith('Bearer ')) return null;
    const token = headerValue.substring(7).trim();
    return token || null;
}

/**
 * Express middleware: requires a valid Firebase ID token and pins
 * req.firebaseUser. Also accepts a legacy session so the existing
 * transitional multiplayer flow keeps working during migration.
 */
function requireAuthAsync(req, res, next) {
    const token = extractBearer(req.headers.authorization);
    if (!token) {
        return res.status(401).json({
            success: false,
            code: ERROR_CODES.UNAUTHENTICATED,
            message: 'Firebase ID token required.'
        });
    }

    verifyIdToken(token)
        .then((user) => {
            req.firebaseUser = user;
            req.uid = user.uid;
            next();
        })
        .catch((err) => {
            const status = err.code === ERROR_CODES.FIREBASE_NOT_CONFIGURED ? 503 : 401;
            res.status(status).json({
                success: false,
                code: err.code || ERROR_CODES.INVALID_TOKEN,
                message: err.message
            });
        });
}

/**
 * Non-throwing readiness probe used by /ready.
 */
async function probe() {
    if (!isConfigured()) {
        return { ok: false, configured: false, reason: 'FIREBASE_PROJECT_ID is not set' };
    }
    const app = getApp();
    if (!app) {
        return { ok: false, configured: true, reason: initError || 'unavailable' };
    }
    return { ok: true, configured: true, projectId: config.FIREBASE_PROJECT_ID };
}

module.exports = {
    isConfigured,
    isAvailable,
    getApp,
    getFirestore: requireFirestore,
    verifyIdToken,
    requireAuthAsync,
    extractBearer,
    probe,
    setSdkForTesting,
    resetForTesting
};
