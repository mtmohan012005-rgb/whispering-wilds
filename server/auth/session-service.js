// ============================================================================
// THE WHISPERING WILDS - SESSION SERVICE
// ============================================================================

const crypto = require('crypto');
const db = require('./db');

const SESSION_COOKIE_NAME = 'ww_auth_session';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

class SessionService {
    static getCookieName() {
        return SESSION_COOKIE_NAME;
    }

    /**
     * Creates a new session and writes to db.
     */
    static createSession(userId, remember = false) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const ttl = remember ? REMEMBER_TTL_MS : DEFAULT_TTL_MS;
        const expiresAt = new Date(Date.now() + ttl).toISOString();
        return db.createSession(sessionId, userId, expiresAt, remember);
    }

    /**
     * Validates a session by ID.
     */
    static validateSession(sessionId) {
        if (!sessionId || typeof sessionId !== 'string') return null;
        const session = db.getSession(sessionId);
        if (!session) return null;
        const user = db.findUserById(session.user_id);
        if (!user || user.status !== 'ACTIVE') {
            db.deleteSession(sessionId);
            return null;
        }
        return { session, user };
    }

    /**
     * Destroys a session (logout).
     */
    static destroySession(sessionId) {
        if (sessionId) {
            db.deleteSession(sessionId);
        }
    }

    /**
     * Regenerates session on login to prevent session fixation.
     */
    static rotateSession(oldSessionId, userId, remember = false) {
        if (oldSessionId) {
            db.deleteSession(oldSessionId);
        }
        return this.createSession(userId, remember);
    }

    /**
     * Formats cookie options.
     */
    static getCookieOptions(remember = false, isProduction = false) {
        const ttl = remember ? REMEMBER_TTL_MS : DEFAULT_TTL_MS;
        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'None' : 'Lax',
            maxAge: ttl,
            path: '/'
        };
    }
}

module.exports = SessionService;
