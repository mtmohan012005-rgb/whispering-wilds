// ============================================================================
// THE WHISPERING WILDS - PROFILE ROUTES
// Express router for /api/profile
// ============================================================================

const express = require('express');
const profileController = require('./profile-controller');
const { authMiddleware, requireAuth, csrfProtection } = require('../auth/auth-middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAuth);

router.get('/', (req, res) => profileController.getProfile(req, res));
router.put('/', csrfProtection, (req, res) => profileController.updateProfile(req, res));

module.exports = router;
