// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - FIREBASE PERSISTENCE ROUTES
// ============================================================================
//
// Mounted at /api/v1/persistence.
//
// These are the canonical endpoints for persistent state. The legacy
// /api/saves (PostgreSQL) and /api/profile (JSON) routes remain mounted for
// backwards compatibility but are DEPRECATED and must not be treated as an
// authority. See docs/BACKEND_CLASSIFICATION.md.
//
// Authentication: Uses session-based auth matching the game login flow
// (/api/auth/login). The userId is derived server-side from the verified
// session, never from the client request body. This avoids requiring the
// Firebase Auth SDK in the Unity client.
// ============================================================================

const express = require('express');
const persistence = require('../firebase/persistence-service');
const { ERROR_CODES } = require('../error-codes');
const { asyncHandler } = require('../middleware/request-context');
const { authMiddleware, requireAuth } = require('../auth/auth-middleware');
const Logger = require('../logger');

const router = express.Router();

// First, populate req.user from session cookie or Bearer token.
// Then, require that the user is authenticated.
// The userId comes from req.user.id, never from the client request body.
router.use(authMiddleware);
router.use(requireAuth);

// GET /api/v1/persistence/saves/slot_0
router.get('/saves/:saveId', asyncHandler(async (req, res) => {
    // userId from verified server session, never from client
    const userId = req.user.id;
    const save = await persistence.loadSave(userId, req.params.saveId);
    if (!save) {
        return res.status(404).json({
            success: false,
            code: 'NOT_FOUND',
            message: 'No save found.',
            requestId: req.requestId
        });
    }
    // Return the save data directly nested under "save" so Unity can extract it
    res.json({ success: true, save, requestId: req.requestId });
}));

// POST /api/v1/persistence/saves
// Expected body: { saveId, saveVersion, data, checksum, baseRevision, idempotencyKey }
// If only raw GameSaveData is sent, wrap it automatically for backwards compatibility.
router.post('/saves', asyncHandler(async (req, res) => {
    // userId from verified server session, never from client
    const userId = req.user.id;
    let body = req.body || {};

    // Backwards compatibility: if the client sends raw GameSaveData (has schemaVersion
    // but no "data" envelope), wrap it automatically so the persistence service accepts it.
    if (body.schemaVersion && !body.data) {
        body = {
            saveId: body.saveId || 'slot_0',
            saveVersion: body.schemaVersion,
            data: body,
            checksum: body.checksum || '',
            baseRevision: body.revision || 0,
            idempotencyKey: body.idempotencyKey || null
        };
    }

    const result = await persistence.saveGame(userId, body);
    res.status(result.replayed ? 200 : 201).json({
        success: true,
        revision: result.revision,
        savedAt: result.savedAt,
        region: result.region,
        replayed: Boolean(result.replayed),
        requestId: req.requestId
    });
}));

// GET /api/v1/persistence/customization
router.get('/customization', asyncHandler(async (req, res) => {
    const budget = await persistence.getCustomizationBudget(req.user.id);
    res.json({ success: true, budget, requestId: req.requestId });
}));

// POST /api/v1/persistence/customization  { slot, assetId, cost }
router.post('/customization', asyncHandler(async (req, res) => {
    const result = await persistence.applyAppearanceChange(req.user.id, req.body || {});
    Logger.info('[Persistence] Appearance change applied', {
        requestId: req.requestId,
        userId: req.user.id,
        slot: result.slot,
        changeIndex: result.changeIndex
    });
    res.status(201).json({ success: true, change: result, requestId: req.requestId });
}));

// GET /api/v1/persistence/checksum?data=... is intentionally absent: checksums
// are computed client-side over the exact payload, and server recomputation is
// the authoritative check performed during saveGame().

module.exports = router;
