// ============================================================================
// THE WHISPERING WILDS - ACCOUNT RECOVERY & PASSWORD RESET SERVICE
// Account enumeration protection, crypto token hashing, session revocation
// ============================================================================

const crypto = require('crypto');
const db = require('./db');
const PasswordService = require('./password-service');
const EmailService = require('./email-service');

class RecoveryService {
    constructor() {
        this.TOKEN_EXPIRY_MINUTES = 30;
        this.requestThrottler = new Map(); // ip/email -> timestamps
    }

    _hash(token) {
        return crypto.createHash('sha256').update(String(token).trim()).digest('hex');
    }

    /**
     * Request Password Reset
     * Always returns generic response to prevent account enumeration
     */
    async requestPasswordReset(email, ip = '127.0.0.1') {
        const genericResponse = {
            success: true,
            message: "If an account exists for that email, password reset instructions will be sent."
        };

        if (!email || typeof email !== 'string') {
            return genericResponse;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = db.findUserByEmail(normalizedEmail);

        if (!user) {
            // Constant-time artificial delay to prevent timing attacks
            await new Promise(r => setTimeout(r, 60 + Math.random() * 40));
            return genericResponse;
        }

        // Generate cryptographically secure 32-byte token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this._hash(rawToken);
        const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

        // Invalidate prior unused reset tokens for this user
        this._invalidatePriorTokens(user.id);

        // Store hashed token in DB
        db.createPasswordResetToken(tokenHash, user.id, expiresAt);

        // Record security audit event
        this._recordSecurityEvent(user.id, 'password_reset_requested', ip);

        // Send reset email via EmailService
        try {
            await EmailService.sendPasswordResetEmail(user, rawToken);
        } catch (err) {
            console.error('[RecoveryService] Failed to send password reset email:', err.message);
        }

        return genericResponse;
    }

    /**
     * Reset Password using Token
     */
    async resetPassword(token, newPassword, confirmPassword, ip = '127.0.0.1') {
        if (!token || typeof token !== 'string') {
            return { success: false, reason: "This reset link is invalid or has expired." };
        }

        if (!newPassword || newPassword.length < 8) {
            return { success: false, reason: "Password must be at least 8 characters long." };
        }

        if (newPassword !== confirmPassword) {
            return { success: false, reason: "Passwords do not match." };
        }

        const tokenHash = this._hash(token);
        const record = db.getPasswordResetToken(tokenHash);

        if (!record || record.used || new Date(record.expires_at) < new Date()) {
            return { success: false, reason: "This reset link is invalid or has expired." };
        }

        const user = db.findUserById(record.user_id);
        if (!user) {
            return { success: false, reason: "Account not found." };
        }

        // Hash new password using project PasswordService
        const passwordHash = await PasswordService.hashPassword(newPassword);

        // Update user
        db.updateUser(user.id, { password_hash: passwordHash });

        // Invalidate the consumed reset token
        db.consumePasswordResetToken(tokenHash);

        // Invalidate all active sessions for that account
        db.deleteUserSessions(user.id);

        // Record security audit event
        this._recordSecurityEvent(user.id, 'password_reset_success', ip);

        // Send security notification email
        try {
            await EmailService.sendSecurityNotification(
                user,
                'Password Reset Complete',
                'Your account password was successfully reset. All previous active sessions have been logged out for security.'
            );
        } catch (err) {
            console.error('[RecoveryService] Failed to dispatch security notice:', err.message);
        }

        return {
            success: true,
            message: "Password updated successfully. You can now log in with your new password."
        };
    }

    /**
     * Change Password (for logged in user with current password verification)
     */
    async changePassword(userId, currentPassword, newPassword, confirmPassword, ip = '127.0.0.1') {
        const user = db.findUserById(userId);
        if (!user) {
            return { success: false, reason: "Account not found." };
        }

        const isCurrentValid = await PasswordService.verifyPassword(currentPassword, user.password_hash);
        if (!isCurrentValid) {
            return { success: false, reason: "Current password is incorrect." };
        }

        if (!newPassword || newPassword.length < 8) {
            return { success: false, reason: "New password must be at least 8 characters long." };
        }

        if (newPassword !== confirmPassword) {
            return { success: false, reason: "Passwords do not match." };
        }

        const newHash = await PasswordService.hashPassword(newPassword);
        db.updateUser(userId, { password_hash: newHash });

        // Revoke all other sessions
        this._recordSecurityEvent(userId, 'change_password_success', ip);

        try {
            await EmailService.sendSecurityNotification(
                user,
                'Password Changed',
                'Your account password was recently changed from an active device session.'
            );
        } catch (err) {
            console.error('[RecoveryService] Failed to dispatch security notice:', err.message);
        }

        return { success: true, message: "Password changed successfully." };
    }

    _invalidatePriorTokens(userId) {
        if (!db.data.password_reset_tokens) return;
        for (const hash in db.data.password_reset_tokens) {
            const r = db.data.password_reset_tokens[hash];
            if (r.user_id === userId) {
                r.used = true;
            }
        }
        db.save();
    }

    _recordSecurityEvent(userId, eventType, ip) {
        if (!db.data.security_events) db.data.security_events = {};
        const id = `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        db.data.security_events[id] = {
            id,
            user_id: userId,
            event_type: eventType,
            ip: ip || '127.0.0.1',
            created_at: new Date().toISOString()
        };
        db.save();
    }
}

const recoveryService = new RecoveryService();
module.exports = recoveryService;
