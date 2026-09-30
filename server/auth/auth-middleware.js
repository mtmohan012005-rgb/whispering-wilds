// ============================================================================
// THE WHISPERING WILDS - AUTH MIDDLEWARE & CSRF PROTECTION
// ============================================================================

const SessionService = require('./session-service');
const config = require('../config');

function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach((cookie) => {
        let [name, ...rest] = cookie.split('=');
        name = name?.trim();
        if (!name) return;
        const value = rest.join('=').trim();
        list[name] = decodeURIComponent(value);
    });
    return list;
}

function extractSessionId(req) {
    // 1. From Cookie
    const cookies = parseCookies(req.headers.cookie);
    const cookieName = SessionService.getCookieName();
    if (cookies[cookieName]) {
        return cookies[cookieName];
    }
    // 2. From Authorization Bearer header (for API clients/testing)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }
    return null;
}

function authMiddleware(req, res, next) {
    const sessionId = extractSessionId(req);
    req.sessionId = sessionId;
    if (sessionId) {
        const validated = SessionService.validateSession(sessionId);
        if (validated) {
            req.session = validated.session;
            req.user = validated.user;
        }
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    next();
}

/**
 * CSRF Protection for state-changing HTTP methods (POST, PUT, DELETE, PATCH).
 *
 * Rationale: session cookies are issued with SameSite=None so the game can be
 * embedded/cross-origin, which removes the browser's built-in CSRF defence.
 * A cross-site attacker therefore needs something the browser will not attach
 * on its own. A request is accepted only if it carries at least one of:
 *
 *   1. A custom request header (X-Requested-With / X-WW-CSRF) - a cross-origin
 *      request with a custom header triggers a CORS preflight, and the server's
 *      `cors()` allowlist blocks it unless the origin is trusted.
 *   2. An explicit Authorization: Bearer header - browsers never auto-attach
 *      this, so it is not CSRF-able.
 *   3. An Origin/Referer that matches the configured allowlist.
 *
 * Requests with no Origin/Referer and no header (native clients, Unity) are
 * rejected unless they present a Bearer token. Unity clients must send
 * `X-WW-CSRF: 1` or a Bearer token.
 */
function csrfProtection(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const allowed = Array.isArray(config.CORS_ORIGIN)
        ? config.CORS_ORIGIN
        : [config.CORS_ORIGIN];

    // 1. Custom header (implies a successful CORS preflight for cross-origin).
    const customHeader = req.headers['x-requested-with'] || req.headers['x-ww-csrf'];
    if (customHeader) {
        return next();
    }

    // 2. Bearer token - not automatically attached by the browser.
    if (req.headers.authorization) {
        return next();
    }

    // 3. Same-origin / allowlisted Origin or Referer.
    const origin = req.headers.origin;
    if (origin && allowed.includes(origin)) {
        return next();
    }
    const referer = req.headers.referer;
    if (referer) {
        try {
            if (allowed.includes(new URL(referer).origin)) {
                return next();
            }
        } catch (err) {
            // Malformed Referer: fall through to rejection.
        }
    }

    return res.status(403).json({
        success: false,
        code: 'CSRF_FAILED',
        message: 'Request rejected: missing CSRF proof. Send X-WW-CSRF: 1 or a Bearer token.'
    });
}


/**
 * Socket.IO handshake authenticator.
 *
 * Accepts either:
 *   - a Firebase ID token (canonical identity, preferred), or
 *   - a legacy custom session id (transitional).
 *
 * A guest handshake is permitted and produces socket.user === null; the room
 * layer is responsible for enforcing the 5-player cap regardless of identity.
 */
function socketAuthMiddleware(socket, next) {
    try {
        const cookieHeader = socket.handshake.headers.cookie;
        const cookies = parseCookies(cookieHeader);
        const cookieName = SessionService.getCookieName();
        let sessionId = cookies[cookieName];

        const bearer = socket.handshake.auth && socket.handshake.auth.token
            ? socket.handshake.auth.token
            : null;

        // Preferred path: Firebase ID token. Resolves asynchronously, so finish
        // the handshake once verification settles.
        if (bearer) {
            // Lazy require to avoid a load-order cycle with the persistence layer.
            // eslint-disable-next-line global-require
            const FirebaseAdmin = require('../firebase/admin');
            if (FirebaseAdmin.isAvailable()) {
                FirebaseAdmin.verifyIdToken(bearer)
                    .then((user) => {
                        socket.user = { id: user.uid, uid: user.uid, email: user.email, provider: 'firebase' };
                        socket.accountId = user.uid;
                        next();
                    })
                    .catch(() => {
                        // Fall through to legacy session handling below, then guest.
                        tryLegacySession();
                    });
                return;
            }
        }

        tryLegacySession();
    } catch (err) {
        next();
    }

    function tryLegacySession() {
        try {
            if (!sessionId && socket.handshake.auth && socket.handshake.auth.session) {
                sessionId = socket.handshake.auth.session;
            }
            if (sessionId) {
                const validated = SessionService.validateSession(sessionId);
                if (validated) {
                    socket.user = Object.assign({}, validated.user, { provider: 'legacy' });
                    socket.accountId = validated.user.id;
                }
            }
            next();
        } catch (err) {
            next();
        }
    }
}


module.exports = {
    authMiddleware,
    requireAuth,
    csrfProtection,
    extractSessionId,
    socketAuthMiddleware
};
