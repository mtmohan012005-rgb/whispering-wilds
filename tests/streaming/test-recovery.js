/**
 * tests/streaming/test-recovery.js
 * Verifies collision fallback, void fall prevention, stuck player restoration,
 * infinite retry lockout, and camera target recovery.
 */

(function () {
  'use strict';

  async function runTestRecovery() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const RecovSysClass = window.StreamingRecoverySystem;
    assert('StreamingRecoverySystem class is available', !!RecovSysClass);

    const recovSys = new RecovSysClass();

    // 1. Safe Position Recording
    recovSys.recordSafePosition({ x: -250, y: 1.5, z: 0 }, true);
    assert('Safe ground position recorded', recovSys.lastSafePosition.x === -250);

    // 2. Void Fall Prevention & Restoration (Section 65, 66, 147)
    // Simulate player falling below -25 meters into the void
    const mockPlayer = {
      position: { x: -248, y: -45.0, z: 5 },
      velocity: { x: 0, y: -30, z: 0 }
    };

    const wasRecovered = recovSys.checkPlayerSafety(mockPlayer, 'ACTIVE');
    assert('Void fall detected and recovery triggered', wasRecovered === true);
    assert('Player position restored to last safe ground point (-250, 1.5, 0)', mockPlayer.position.x === -250 && mockPlayer.position.y === 1.5);
    assert('Player velocity zeroed out', mockPlayer.velocity.y === 0);
    assert('STREAMING_COLLISION_RECOVERY history logged event', recovSys.recoveryHistory.length === 1);

    // 3. Infinite Retry Protection (Section 81, 82)
    const testCellId = 'CELL_TEST_FAIL_001';
    assert('Fresh cell initially permitted to try load', recovSys.canRetryCell(testCellId) === true);

    // Fail 3 times
    recovSys.recordCellFailure(testCellId, 'Simulated asset parse error');
    recovSys.recordCellFailure(testCellId, 'Simulated network timeout');
    const rec = recovSys.recordCellFailure(testCellId, 'Simulated WebGL error');
    assert('Retry count reached 3', rec.retries === 3);

    // Immediate 4th retry must be locked out
    const canRetryNow = recovSys.canRetryCell(testCellId);
    assert('Rapid 4th retry is BLOCKED by exponential backoff cooldown', canRetryNow === false);

    // Success clears retry record
    recovSys.recordCellSuccess(testCellId);
    assert('Success clears failure record', !recovSys.cellRetryRecords.has(testCellId));

    // 4. Missing Asset Fallback Mesh (Section 80, 140)
    const fallbackMesh = recovSys.createFallbackMesh('prop_missing_lantern', 'prop');
    assert('Generated diagnostic fallback mesh for missing prop', !!fallbackMesh && fallbackMesh.isFallbackMesh === true);

    // 5. Camera Target Recovery (Section 148)
    const mockCamera = {
      currentTarget: { x: NaN, y: NaN, z: NaN } // Glitched/disposed target
    };
    recovSys.recoverCameraTarget(mockCamera, { x: -250, y: 1.5, z: 0 });
    assert('Corrupt camera target re-anchored to valid player position', !Number.isNaN(mockCamera.currentTarget.x));

    return results;
  }

  window.runTestRecovery = runTestRecovery;
})();
