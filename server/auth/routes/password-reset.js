// ============================================================================
// THE WHISPERING WILDS - PASSWORD RESET & OTP ROUTES
// Secure password reset request/completion, OTP sending/verifying, and session revocation
// ============================================================================

const express = require('express');
const router = express.Router();
const RecoveryService = require('../recovery-service');
const OtpService = require('../otp-service');
const EmailService = require('../email-service');
const db = require('../db');
const { csrfProtection, requireAuth } = require('../auth-middleware');

// POST /api/auth/request-password-reset
router.post('/request-password-reset', csrfProtection, async (req, res) => {
    try {
        const { email } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const result = await RecoveryService.requestPasswordReset(email, ip);
        return res.status(200).json(result);
    } catch (err) {
        console.error('[PasswordResetRoutes] request error:', err.message);
        return res.status(200).json({
            success: true,
            message: "If an account exists for that email, password reset instructions will be sent."
        });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', csrfProtection, async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const result = await RecoveryService.resetPassword(token, newPassword, confirmPassword, ip);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('[PasswordResetRoutes] reset error:', err.message);
        return res.status(500).json({ success: false, reason: "Unable to complete password reset." });
    }
});

// POST /api/auth/change-password (Authenticated)
router.post('/change-password', requireAuth, csrfProtection, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const result = await RecoveryService.changePassword(
            req.user.id,
            currentPassword,
            newPassword,
            confirmPassword,
            ip
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('[PasswordResetRoutes] change-password error:', err.message);
        return res.status(500).json({ success: false, reason: "Failed to change password." });
    }
});

// POST /api/auth/send-otp
router.post('/send-otp', csrfProtection, async (req, res) => {
    try {
        let user = null;
        if (req.user) {
            user = db.findUserById(req.user.id);
        } else if (req.body.email) {
            user = db.findUserByEmail(req.body.email);
        }

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If the account exists, an OTP code has been dispatched."
            });
        }

        const purpose = req.body.purpose || 'VERIFICATION';
        const otpResult = OtpService.createOtp(user.id, purpose);

        if (!otpResult.success) {
            return res.status(429).json({ success: false, reason: otpResult.reason, retryAfterSec: otpResult.retryAfterSec });
        }

        // Send OTP via EmailService
        await EmailService.sendOtpEmail(user, otpResult.rawCode, purpose);

        return res.status(200).json({
            success: true,
            message: "A 6-digit verification code has been sent to your email address."
        });
    } catch (err) {
        console.error('[PasswordResetRoutes] send-otp error:', err.message);
        return res.status(500).json({ success: false, reason: "Failed to dispatch verification code." });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', csrfProtection, (req, res) => {
    try {
        let userId = req.user ? req.user.id : null;
        if (!userId && req.body.email) {
            const user = db.findUserByEmail(req.body.email);
            if (user) userId = user.id;
        }

        if (!userId) {
            return res.status(400).json({ success: false, reason: "Invalid account reference." });
        }

        const code = req.body.code;
        const purpose = req.body.purpose || 'VERIFICATION';
        const result = OtpService.verifyOtp(userId, code, purpose);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // If purpose was account verification, mark email verified!
        if (purpose === 'VERIFICATION') {
            db.updateUser(userId, { email_verified: true, status: 'ACTIVE' });
        }

        return res.status(200).json({ success: true, message: "Verification code confirmed successfully." });
    } catch (err) {
        console.error('[PasswordResetRoutes] verify-otp error:', err.message);
        return res.status(500).json({ success: false, reason: "Verification failed." });
    }
});

// POST /api/auth/revoke-sessions (Log Out Other Devices)
router.post('/revoke-sessions', requireAuth, csrfProtection, (req, res) => {
    try {
        const currentSessionId = req.sessionId;
        const userId = req.user.id;

        let count = 0;
        if (db.data.sessions) {
            for (const sid in db.data.sessions) {
                if (db.data.sessions[sid].user_id === userId && sid !== currentSessionId) {
                    delete db.data.sessions[sid];
                    count++;
                }
            }
            db.save();
        }

        return res.status(200).json({
            success: true,
            revokedCount: count,
            message: `Successfully logged out ${count} other active device session(s).`
        });
    } catch (err) {
        console.error('[PasswordResetRoutes] revoke-sessions error:', err.message);
        return res.status(500).json({ success: false, reason: "Failed to revoke sessions." });
    }
});

module.exports = router;
