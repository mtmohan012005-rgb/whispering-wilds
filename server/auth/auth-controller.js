// ============================================================================
// THE WHISPERING WILDS - AUTH CONTROLLER
// ============================================================================

const AuthService = require('./auth-service');
const SessionService = require('./session-service');

class AuthController {
    static async register(req, res) {
        try {
            const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
            const result = await AuthService.register(req.body, clientIp);
            return res.status(result.status).json({
                success: result.success,
                message: result.message,
                data: result.data || null
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static async login(req, res) {
        try {
            const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
            const existingSessionId = req.sessionId;
            const result = await AuthService.login(req.body, clientIp, existingSessionId);

            if (result.success && result.sessionId) {
                const isProduction = process.env.NODE_ENV === 'production';
                const cookieOpts = SessionService.getCookieOptions(result.remember, isProduction);
                res.cookie(SessionService.getCookieName(), result.sessionId, cookieOpts);
            }

            return res.status(result.status).json({
                success: result.success,
                message: result.message,
                data: result.data || null,
                token: result.sessionId || null // fallback for clients not using cookies
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static logout(req, res) {
        try {
            const sessionId = req.sessionId;
            AuthService.logout(sessionId);
            res.clearCookie(SessionService.getCookieName(), { path: '/' });
            return res.status(200).json({ success: true, message: 'Signed out successfully.' });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static getMe(req, res) {
        try {
            const sessionId = req.sessionId;
            const result = AuthService.getProfile(sessionId);
            return res.status(result.status).json({
                success: result.success,
                message: result.message,
                data: result.data || null
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
            const result = await AuthService.forgotPassword(req.body, clientIp);
            return res.status(result.status).json({
                success: result.success,
                message: result.message
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static async resetPassword(req, res) {
        try {
            const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
            const result = await AuthService.resetPassword(req.body, clientIp);
            return res.status(result.status).json({
                success: result.success,
                message: result.message
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static verifyEmail(req, res) {
        try {
            const { token } = req.body;
            const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
            const result = AuthService.verifyEmail(token, clientIp);
            return res.status(result.status).json({
                success: result.success,
                message: result.message
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static saveCloudSave(req, res) {
        try {
            const sessionId = req.sessionId;
            const result = AuthService.saveCloudProgression(sessionId, req.body.saveData);
            return res.status(result.status).json({
                success: result.success,
                message: result.message,
                data: result.data || null
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }

    static getCloudSave(req, res) {
        try {
            const sessionId = req.sessionId;
            const result = AuthService.getCloudProgression(sessionId);
            return res.status(result.status).json({
                success: result.success,
                message: result.message,
                data: result.data || null
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Account service is temporarily unavailable.' });
        }
    }
}

module.exports = AuthController;
