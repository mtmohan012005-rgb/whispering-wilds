// ============================================================================
// THE WHISPERING WILDS - EMAIL VERIFICATION SERVICE
// Token generation, hashed storage, single-use validation & resend rate-limiting
// ============================================================================

const crypto = require('crypto');
const db = require('./db');
const EmailService = require('./email-service');

class EmailVerificationService {
    constructor() {
        this.TOKEN_EXPIRY_HOURS = 24;
        this.resendTracker = new Map(); // userId -> Array of timestamps
        this.MAX_RESENDS = 3;
        this.RESEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    }

    _hash(token) {
        return crypto.createHash('sha256').update(String(token).trim()).digest('hex');
    }

    /**
     * Check if user is allowed to resend verification email
     */
    canResend(userId) {
        const now = Date.now();
        const timestamps = this.resendTracker.get(userId) || [];
        const activeTimestamps = timestamps.filter(t => (now - t) < this.RESEND_WINDOW_MS);
        this.resendTracker.set(userId, activeTimestamps);

        if (activeTimestamps.length >= this.MAX_RESENDS) {
            return {
                allowed: false,
                reason: 'Too many verification requests. Please wait 15 minutes before requesting again.',
                retryAfterSec: Math.ceil((this.RESEND_WINDOW_MS - (now - activeTimestamps[0])) / 1000)
            };
        }
        return { allowed: true };
    }

    /**
     * Create and send verification email
     */
    async sendVerificationEmail(user, ip = '127.0.0.1') {
        if (!user || !user.id || !user.email) {
            return { success: false, reason: 'Invalid user account.' };
        }

        if (user.email_verified) {
            return { success: true, message: 'Email is already verified.' };
        }

        const resendCheck = this.canResend(user.id);
        if (!resendCheck.allowed) {
            return { success: false, reason: resendCheck.reason, retryAfterSec: resendCheck.retryAfterSec };
        }

        // Generate 32-byte crypto token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this._hash(rawToken);
        const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

        // Invalidate older unused verification tokens for this user
        this._invalidatePriorTokens(user.id);

        // Store hashed token
        db.createEmailVerificationToken(tokenHash, user.id, expiresAt);

        // Record resend attempt
        const timestamps = this.resendTracker.get(user.id) || [];
        timestamps.push(Date.now());
        this.resendTracker.set(user.id, timestamps);

        // Record security audit
        this._recordSecurityEvent(user.id, 'verification_sent', ip);

        // Send verification email
        try {
            await EmailService.sendVerificationEmail(user, rawToken);
        } catch (err) {
            console.error('[EmailVerificationService] Delivery error:', err.message);
        }

        return {
            success: true,
            message: 'Verification email sent. Please check your inbox and spam folder.'
        };
    }

    /**
     * Validate verification token and activate account
     */
    verifyToken(token, ip = '127.0.0.1') {
        if (!token || typeof token !== 'string') {
            return { success: false, reason: 'This verification link is invalid or expired.' };
        }

        const tokenHash = this._hash(token);
        const record = db.getEmailVerificationToken(tokenHash);

        if (!record || record.used || new Date(record.expires_at) < new Date()) {
            return { success: false, reason: 'This verification link is invalid or expired.' };
        }

        const user = db.findUserById(record.user_id);
        if (!user) {
            return { success: false, reason: 'Associated user account not found.' };
        }

        if (user.email_verified) {
            db.consumeEmailVerificationToken(tokenHash);
            return { success: true, message: 'Your email is already verified.' };
        }

        // Mark verified in DB and activate
        db.updateUser(user.id, {
            email_verified: true,
            status: 'ACTIVE'
        });

        // Consume token
        db.consumeEmailVerificationToken(tokenHash);

        // Record audit
        this._recordSecurityEvent(user.id, 'verification_success', ip);

        return {
            success: true,
            message: 'Your email address has been successfully verified! Your account is now secure.'
        };
    }

    _invalidatePriorTokens(userId) {
        if (!db.data.email_verification_tokens) return;
        for (const hash in db.data.email_verification_tokens) {
            const r = db.data.email_verification_tokens[hash];
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

const emailVerificationService = new EmailVerificationService();
module.exports = emailVerificationService;
