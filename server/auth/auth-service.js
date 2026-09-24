// ============================================================================
// THE WHISPERING WILDS - AUTH SERVICE (CORE BUSINESS LOGIC)
// ============================================================================

const crypto = require('crypto');
const db = require('./db');
const PasswordService = require('./password-service');
const SessionService = require('./session-service');
const Validation = require('./validation');
const rateLimiter = require('./rate-limit');
const emailService = require('./email-service');

class AuthService {
    /**
     * Registers a new account.
     */
    static async register({ email, password, confirmPassword, displayName }, clientIp) {
        // Rate limit check for registrations per IP (max 5 per hour)
        const ipLimit = rateLimiter.check('register_ip', clientIp, 5, 60 * 60 * 1000);
        if (!ipLimit.allowed) {
            return { success: false, status: 429, message: 'Too many registration attempts. Please try again later.' };
        }

        // Validate email
        const emailCheck = Validation.validateEmail(email);
        if (!emailCheck.valid) {
            return { success: false, status: 400, message: emailCheck.message };
        }

        // Validate display name
        const nameCheck = Validation.validateDisplayName(displayName);
        if (!nameCheck.valid) {
            return { success: false, status: 400, message: nameCheck.message };
        }

        // Validate password
        const passCheck = Validation.validatePassword(password, confirmPassword);
        if (!passCheck.valid) {
            return { success: false, status: 400, message: passCheck.message };
        }

        // Check duplicate email
        const existing = db.findUserByEmail(emailCheck.normalized);
        if (existing) {
            // Generic security check: avoid leaking account existence where appropriate,
            // but for registration an already-registered notice is standard.
            return { success: false, status: 409, message: 'An account with this email already exists.' };
        }

        // Hash password
        const passwordHash = PasswordService.hashPassword(password);

        // Create user
        const newUser = db.createUser({
            email: emailCheck.normalized,
            password_hash: passwordHash,
            display_name: nameCheck.sanitized,
            email_verified: false
        });

        // Generate email verification token (secure random 32 bytes)
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        db.createEmailVerificationToken(tokenHash, newUser.id, expiresAt);

        // Attempt email send
        const mailResult = await emailService.sendVerificationEmail(newUser.email, rawToken);

        return {
            success: true,
            status: 201,
            message: mailResult.configured ? 'Account created. Please verify your email.' : 'Account created. Email verification is not configured on this server.',
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    displayName: newUser.display_name,
                    createdAt: newUser.created_at,
                    emailVerified: newUser.email_verified
                },
                emailConfigured: mailResult.configured
            }
        };
    }

    /**
     * Authenticates user credentials and generates a session.
     */
    static async login({ email, password, remember = false }, clientIp, existingSessionId = null) {
        const normalized = Validation.normalizeEmail(email);

        // Rate limit check by IP (max 10 failed attempts per 15 min) and by email
        const ipLimit = rateLimiter.check('login_ip', clientIp, 10, 15 * 60 * 1000);
        if (!ipLimit.allowed) {
            return { success: false, status: 429, message: 'Too many attempts. Please try again later.' };
        }

        const emailLimit = rateLimiter.check('login_email', normalized, 5, 15 * 60 * 1000);
        if (!emailLimit.allowed) {
            return { success: false, status: 429, message: 'Too many attempts. Please try again later.' };
        }

        const user = db.findUserByEmail(normalized);
        if (!user) {
            return { success: false, status: 401, message: 'Email or password is incorrect.' };
        }

        const isMatch = PasswordService.verifyPassword(password, user.password_hash);
        if (!isMatch) {
            return { success: false, status: 401, message: 'Email or password is incorrect.' };
        }

        // Reset rate limiters on successful login
        rateLimiter.reset('login_ip', clientIp);
        rateLimiter.reset('login_email', normalized);

        // Session fixation protection: rotate/create session
        const session = SessionService.rotateSession(existingSessionId, user.id, !!remember);

        // Update last login timestamp
        const updatedUser = db.updateUser(user.id, { last_login_at: new Date().toISOString() });

        return {
            success: true,
            status: 200,
            message: 'Signed in successfully.',
            sessionId: session.id,
            remember: !!remember,
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    displayName: updatedUser.display_name,
                    createdAt: updatedUser.created_at,
                    lastLoginAt: updatedUser.last_login_at,
                    emailVerified: updatedUser.email_verified
                }
            }
        };
    }

    /**
     * Terminates session on logout.
     */
    static logout(sessionId) {
        if (sessionId) {
            SessionService.destroySession(sessionId);
        }
        return { success: true, status: 200, message: 'Signed out successfully.' };
    }

    /**
     * Resolves authenticated profile from active session.
     */
    static getProfile(sessionId) {
        const validated = SessionService.validateSession(sessionId);
        if (!validated) {
            return { success: false, status: 401, message: 'Not authenticated.' };
        }
        const { user } = validated;
        return {
            success: true,
            status: 200,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                    createdAt: user.created_at,
                    lastLoginAt: user.last_login_at,
                    emailVerified: user.email_verified
                }
            }
        };
    }

    /**
     * Safe forgot-password request. Always returns generic response.
     */
    static async forgotPassword({ email }, clientIp) {
        const RecoveryService = require('./recovery-service');
        const result = await RecoveryService.requestPasswordReset(email, clientIp);
        return {
            success: true,
            status: 200,
            message: result.message
        };
    }

    /**
     * Resets password using valid single-use token.
     */
    static async resetPassword({ token, newPassword, confirmPassword }, clientIp) {
        const RecoveryService = require('./recovery-service');
        const result = await RecoveryService.resetPassword(token, newPassword, confirmPassword, clientIp);
        return {
            success: result.success,
            status: result.success ? 200 : 400,
            message: result.message || result.reason
        };
    }

    /**
     * Verifies email with token.
     */
    static verifyEmail(token, clientIp) {
        const EmailVerificationService = require('./email-verification-service');
        const result = EmailVerificationService.verifyToken(token, clientIp);
        return {
            success: result.success,
            status: result.success ? 200 : 400,
            message: result.message || result.reason
        };
    }

    /**
     * Saves cloud progression (strictly enforcing 5-customization limit).
     */
    static saveCloudProgression(sessionId, saveData) {
        const validated = SessionService.validateSession(sessionId);
        if (!validated) {
            return { success: false, status: 401, message: 'Not authenticated.' };
        }
        const saveCheck = Validation.validateCloudSave(saveData);
        if (!saveCheck.valid) {
            return { success: false, status: 400, message: saveCheck.message };
        }

        const saved = db.saveCloudSave(validated.user.id, saveData);
        return {
            success: true,
            status: 200,
            message: 'Cloud save updated successfully.',
            data: { updatedAt: saved.updated_at }
        };
    }

    /**
     * Retrieves cloud progression.
     */
    static getCloudProgression(sessionId) {
        const validated = SessionService.validateSession(sessionId);
        if (!validated) {
            return { success: false, status: 401, message: 'Not authenticated.' };
        }
        const cloudRecord = db.getCloudSave(validated.user.id);
        return {
            success: true,
            status: 200,
            data: {
                cloudSave: cloudRecord ? cloudRecord.data : null,
                updatedAt: cloudRecord ? cloudRecord.updated_at : null
            }
        };
    }
}

module.exports = AuthService;
