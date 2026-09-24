// ============================================================================
// THE WHISPERING WILDS - CRYPTOGRAPHIC OTP SERVICE
// 6-digit numeric OTP generation, hashed storage, attempt limits & resend throttling
// ============================================================================

const crypto = require('crypto');
const db = require('./db');

class OtpService {
    constructor() {
        this.resendTracker = new Map(); // key: `${userId}:${purpose}` -> Array of timestamps
        this.MAX_ATTEMPTS = 5;
        this.OTP_EXPIRY_MINUTES = 10;
        this.MAX_RESENDS = 3;
        this.RESEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    }

    _hash(code) {
        return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
    }

    /**
     * Generate 6-digit cryptographically secure OTP
     */
    generateSecureCode() {
        // Secure random integer between 100000 and 999999 inclusive
        return String(crypto.randomInt(100000, 1000000));
    }

    /**
     * Check if user is allowed to request a new OTP
     */
    canRequestOtp(userId, purpose = 'VERIFICATION') {
        const key = `${userId}:${purpose}`;
        const now = Date.now();
        const timestamps = this.resendTracker.get(key) || [];
        const activeTimestamps = timestamps.filter(t => (now - t) < this.RESEND_WINDOW_MS);
        this.resendTracker.set(key, activeTimestamps);

        if (activeTimestamps.length >= this.MAX_RESENDS) {
            return {
                allowed: false,
                reason: 'Too many OTP requests. Please wait 15 minutes before requesting a new code.',
                retryAfterSec: Math.ceil((this.RESEND_WINDOW_MS - (now - activeTimestamps[0])) / 1000)
            };
        }
        return { allowed: true };
    }

    /**
     * Create and store a new hashed OTP
     */
    createOtp(userId, purpose = 'VERIFICATION') {
        const check = this.canRequestOtp(userId, purpose);
        if (!check.allowed) {
            return { success: false, reason: check.reason, retryAfterSec: check.retryAfterSec };
        }

        const rawCode = this.generateSecureCode();
        const codeHash = this._hash(rawCode);
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

        // Invalidate any previously active OTPs for this user & purpose
        this._invalidatePreviousOtps(userId, purpose);

        // Store hashed OTP in database
        const otpRecord = {
            id: `otp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            user_id: userId,
            purpose,
            code_hash: codeHash,
            expires_at: expiresAt,
            attempt_count: 0,
            created_at: new Date().toISOString(),
            used_at: null
        };

        if (!db.data.otp_codes) db.data.otp_codes = {};
        db.data.otp_codes[otpRecord.id] = otpRecord;
        db.save();

        // Track resend rate limit
        const key = `${userId}:${purpose}`;
        const timestamps = this.resendTracker.get(key) || [];
        timestamps.push(Date.now());
        this.resendTracker.set(key, timestamps);

        return {
            success: true,
            rawCode, // For emailing to the user; never send to frontend API response
            expiresAt,
            id: otpRecord.id
        };
    }

    /**
     * Verify an entered OTP code
     */
    verifyOtp(userId, inputCode, purpose = 'VERIFICATION') {
        if (!inputCode || String(inputCode).trim().length !== 6) {
            return { success: false, reason: 'Invalid 6-digit code format.' };
        }

        const cleanCode = String(inputCode).trim();
        const candidateHash = this._hash(cleanCode);

        // Find active OTP record for user and purpose
        const activeRecord = this._findActiveOtp(userId, purpose);
        if (!activeRecord) {
            return { success: false, reason: 'No active code found or code has expired. Please request a new code.' };
        }

        // Check expiration against server time
        if (new Date(activeRecord.expires_at) < new Date()) {
            activeRecord.used_at = new Date().toISOString();
            db.save();
            return { success: false, reason: 'This verification code has expired. Please request a new one.' };
        }

        // Increment attempt count
        activeRecord.attempt_count = (activeRecord.attempt_count || 0) + 1;

        // Check if exceeded max attempts
        if (activeRecord.attempt_count > this.MAX_ATTEMPTS) {
            activeRecord.used_at = new Date().toISOString(); // Invalidate
            db.save();
            return { success: false, reason: 'Too many incorrect attempts. This code has been invalidated. Please request a new one.' };
        }

        // Constant-time hash comparison
        const storedHashBuf = Buffer.from(activeRecord.code_hash, 'hex');
        const candidateHashBuf = Buffer.from(candidateHash, 'hex');

        let isMatch = false;
        if (storedHashBuf.length === candidateHashBuf.length) {
            isMatch = crypto.timingSafeEqual(storedHashBuf, candidateHashBuf);
        }

        if (isMatch) {
            activeRecord.used_at = new Date().toISOString();
            db.save();
            return { success: true };
        }

        db.save();
        const remaining = Math.max(0, this.MAX_ATTEMPTS - activeRecord.attempt_count);
        return {
            success: false,
            reason: `Incorrect code. ${remaining} attempt(s) remaining.`
        };
    }

    _findActiveOtp(userId, purpose) {
        if (!db.data.otp_codes) return null;
        for (const id in db.data.otp_codes) {
            const r = db.data.otp_codes[id];
            if (r.user_id === userId && r.purpose === purpose && !r.used_at) {
                return r;
            }
        }
        return null;
    }

    _invalidatePreviousOtps(userId, purpose) {
        if (!db.data.otp_codes) return;
        let changed = false;
        for (const id in db.data.otp_codes) {
            const r = db.data.otp_codes[id];
            if (r.user_id === userId && r.purpose === purpose && !r.used_at) {
                r.used_at = new Date().toISOString();
                changed = true;
            }
        }
        if (changed) db.save();
    }
}

const otpService = new OtpService();
module.exports = otpService;
