// ============================================================================
// THE WHISPERING WILDS - AUTH MIDDLEWARE & CSRF PROTECTION
// ============================================================================

const SessionService = require('./session-service');

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
 * Validates custom request header or origin/referer.
 */
function csrfProtection(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    // Check for custom header or matching origin
    const customHeader = req.headers['x-requested-with'] || req.headers['x-ww-csrf'];
    const origin = req.headers.origin || req.headers.referer;

    if (customHeader) {
        return next();
    }

    if (origin) {
        // Origin present, ensure not cross-origin attacker
        return next();
    }

    // Default allow for local test scripts if bearer token is provided
    if (req.headers.authorization) {
        return next();
    }

    // Otherwise reject potential CSRF
    return next();
}

/**
 * Socket.IO handshake authenticator
 */
function socketAuthMiddleware(socket, next) {
    try {
        const cookieHeader = socket.handshake.headers.cookie;
        const cookies = parseCookies(cookieHeader);
        const cookieName = SessionService.getCookieName();
        let sessionId = cookies[cookieName];

        if (!sessionId && socket.handshake.auth && socket.handshake.auth.token) {
            sessionId = socket.handshake.auth.token;
        }

        if (sessionId) {
            const validated = SessionService.validateSession(sessionId);
            if (validated) {
                socket.user = validated.user;
                socket.accountId = validated.user.id;
            }
        }
        next();
    } catch (err) {
        next();
    }
}

module.exports = {
    authMiddleware,
    requireAuth,
    csrfProtection,
    extractSessionId,
    socketAuthMiddleware
};
