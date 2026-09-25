/**
 * tests/streaming/test-world-origin.js
 * Verifies floating origin shifts, safe point gating (never shift during cinematics/saves),
 * listener notifications, and coordinate stability.
 */

(function () {
  'use strict';

  async function runTestWorldOrigin() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const OriginMgrClass = window.WorldOriginManager;
    assert('WorldOriginManager class is available', !!OriginMgrClass);

    const originMgr = new OriginMgrClass(1000.0); // 1000m threshold for test

    // 1. Threshold Detection (Section 62)
    const mockEntities = {
      player: { position: { x: 1200, y: 10, z: 800 } },
      cameraController: { camera: { position: { x: 1200, y: 30, z: 820 } }, currentTarget: { x: 1200, y: 10, z: 800 } }
    };

    let shiftEventReceived = null;
    originMgr.onOriginShift((data) => {
      shiftEventReceived = data;
    });

    const didShift = originMgr.checkAndShift(mockEntities.player.position, mockEntities);
    assert('Origin shift triggered when player passed 1000m threshold', didShift === true);
    assert('Accumulated offset recorded X shift (+1200)', originMgr.accumulatedOffset.x === 1200);
    assert('Accumulated offset recorded Z shift (+800)', originMgr.accumulatedOffset.z === 800);
    assert('Player local position recentered to (0, 10, 0)', mockEntities.player.position.x === 0 && mockEntities.player.position.z === 0);
    assert('Shift listener notified with delta values', shiftEventReceived && shiftEventReceived.deltaX === -1200);

    // 2. Coordinate System Round-Trip Invariant (Section 62)
    const localPoint = { x: 50, y: 5, z: -30 };
    const absPoint = originMgr.toAbsoluteWorld(localPoint);
    assert('Absolute world coordinate correctly includes offset (1250)', absPoint.x === 1250);
    assert('Absolute world coordinate correctly includes offset (770)', absPoint.z === 770);

    const backToLocal = originMgr.toLocalCoordinates(absPoint);
    assert('Round-trip coordinate transformation perfectly preserved', backToLocal.x === 50 && backToLocal.z === -30);

    // 3. Safe Point Gating (Section 63)
    // Never shift origin during: cinematics, save serialization, or critical interaction
    originMgr.isCinematicActive = true;
    const cinematicShiftOk = originMgr.executeShift(500, 500, mockEntities);
    assert('Origin shift BLOCKED during active cinematic', cinematicShiftOk === false);
    originMgr.isCinematicActive = false;

    originMgr.isSavingActive = true;
    const savingShiftOk = originMgr.executeShift(500, 500, mockEntities);
    assert('Origin shift BLOCKED during save serialization', savingShiftOk === false);
    originMgr.isSavingActive = false;

    originMgr.isInteractionActive = true;
    const interactShiftOk = originMgr.executeShift(500, 500, mockEntities);
    assert('Origin shift BLOCKED during dialogue/interaction', interactShiftOk === false);
    originMgr.isInteractionActive = false;

    return results;
  }

  window.runTestWorldOrigin = runTestWorldOrigin;
})();
