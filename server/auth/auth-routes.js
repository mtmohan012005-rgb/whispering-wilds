// ============================================================================
// THE WHISPERING WILDS - AUTH ROUTES
// ============================================================================

const express = require('express');
const router = express.Router();
const AuthController = require('./auth-controller');
const { authMiddleware, requireAuth, csrfProtection } = require('./auth-middleware');
const emailVerificationRoutes = require('./routes/email-verification');
const passwordResetRoutes = require('./routes/password-reset');

// Apply auth extraction to all routes in router
router.use(authMiddleware);

// Specialized Email Verification and Password Reset / OTP Sub-routers
router.use('/', emailVerificationRoutes);
router.use('/', passwordResetRoutes);

// Public Core Auth Endpoints
router.post('/register', csrfProtection, AuthController.register);
router.post('/login', csrfProtection, AuthController.login);
router.post('/logout', csrfProtection, AuthController.logout);
router.post('/forgot-password', csrfProtection, AuthController.forgotPassword);
router.post('/reset-password', csrfProtection, AuthController.resetPassword);
router.post('/verify-email', csrfProtection, AuthController.verifyEmail);

// Session Profile Endpoint
router.get('/me', AuthController.getMe);

// Authenticated Cloud Save Endpoints
router.get('/cloud-save', requireAuth, AuthController.getCloudSave);
router.post('/cloud-save', requireAuth, csrfProtection, AuthController.saveCloudSave);

module.exports = router;
