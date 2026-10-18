// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MEGA PERSISTENCE ROUTES
// ============================================================================
//
// Mounted at /api/v1/mega-persistence.
//
// These routes use MEGA Cloud Drive as the storage backend instead of Firebase.
// They require authentication via the same session-based auth middleware used
// by the rest of the API.
//
// If MEGA is not configured, these routes fail closed with 503 rather than
// silently accepting writes.
// ============================================================================

const express = require('express');
const megaPersistence = require('../mega/mega-persistence');
const megaAdapter = require('../mega/mega-adapter');
const { ERROR_CODES, toAppError } = require('../error-codes');
const { asyncHandler } = require('../middleware/request-context');
const Logger = require('../logger');

const router = express.Router();

// Authentication middleware — uses the same session-based auth as the rest
// of the API. The userId is derived from the verified session, never from
// the client request body.
const { requireAuth } = require('../auth/auth-middleware');
router.use(requireAuth);

// GET /api/v1/mega-persistence/ready
router.get('/ready', asyncHandler(async (req, res) => {
    const probe = await megaAdapter.probe();
    if (!probe.ok) {
        return res.status(503).json({
            success: false,
            code: 'STORAGE_NOT_CONFIGURED',
            message: 'MEGA cloud storage is not configured or not connected.',
            reason: probe.reason,
            requestId: req.requestId
        });
    }
    res.json({ success: true, requestId: req.requestId });
}));

// GET /api/v1/mega-persistence/saves/slot_0
router.get('/saves/:saveId', asyncHandler(async (req, res) => {
    const userId = req.user.id; // From auth middleware, never client-supplied
    const save = await megaPersistence.loadSave(userId, req.params.saveId);
    
    if (!save) {
        return res.status(404).json({
            success: false,
            code: 'NOT_FOUND',
            message: 'No save found.',
            requestId: req.requestId
        });
    }
    
    res.json({ success: true, save, requestId: req.requestId });
}));

// POST /api/v1/mega-persistence/saves
// { saveId, saveVersion, data, checksum, baseRevision, idempotencyKey }
router.post('/saves', asyncHandler(async (req, res) => {
    const userId = req.user.id; // From auth middleware, never client-supplied
    const result = await megaPersistence.saveGame(userId, req.body || {});
    
    res.status(201).json({
        success: true,
        revision: result.revision,
        savedAt: result.savedAt,
        region: result.region,
        replayed: Boolean(result.replayed),
        requestId: req.requestId
    });
}));

module.exports = router;
