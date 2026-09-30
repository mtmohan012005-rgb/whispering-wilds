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
// Every route below requires a verified Firebase ID token (Authorization:
// Bearer <idToken>). The uid is taken from the token, never from the body.
// ============================================================================

const express = require('express');
const FirebaseAdmin = require('../firebase/admin');
const persistence = require('../firebase/persistence-service');
const { ERROR_CODES } = require('../error-codes');
const { asyncHandler } = require('../middleware/request-context');
const Logger = require('../logger');

const router = express.Router();

// Fail fast and loudly if someone mounts this router without the guard.
router.use(FirebaseAdmin.requireAuthAsync);

// GET /api/v1/persistence/saves/slot_0
router.get('/saves/:saveId', asyncHandler(async (req, res) => {
    const uid = req.uid;
    const save = await persistence.loadSave(uid, req.params.saveId);
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

// POST /api/v1/persistence/saves  { saveId, saveVersion, data, checksum, baseRevision, idempotencyKey }
router.post('/saves', asyncHandler(async (req, res) => {
    const uid = req.uid;
    const result = await persistence.saveGame(uid, req.body || {});
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
    const budget = await persistence.getCustomizationBudget(req.uid);
    res.json({ success: true, budget, requestId: req.requestId });
}));

// POST /api/v1/persistence/customization  { slot, assetId, cost }
router.post('/customization', asyncHandler(async (req, res) => {
    const result = await persistence.applyAppearanceChange(req.uid, req.body || {});
    Logger.info('[Persistence] Appearance change applied', {
        requestId: req.requestId,
        uid: req.uid,
        slot: result.slot,
        changeIndex: result.changeIndex
    });
    res.status(201).json({ success: true, change: result, requestId: req.requestId });
}));

// GET /api/v1/persistence/checksum?data=... is intentionally absent: checksums
// are computed client-side over the exact payload, and server recomputation is
// the authoritative check performed during saveGame().

module.exports = router;
