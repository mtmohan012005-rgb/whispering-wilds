// ============================================================================
// THE WHISPERING WILDS - SAVE ROUTES
// Express router for /api/saves
// ============================================================================

const express = require('express');
const saveController = require('./save-controller');
const { authMiddleware, requireAuth, csrfProtection } = require('../auth/auth-middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAuth);

router.get('/latest', (req, res) => saveController.getLatest(req, res));
router.post('/', csrfProtection, (req, res) => saveController.saveGame(req, res));
router.post('/resolve-conflict', csrfProtection, (req, res) => saveController.resolveConflict(req, res));

module.exports = router;
