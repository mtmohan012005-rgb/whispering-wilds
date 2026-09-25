/**
 * tests/animation/test-hand-ik.js
 * Verifies two-bone hand IK solver, interaction anchor targeting,
 * reach limit verification, and safe fallback for out-of-reach targets.
 */

(function () {
  'use strict';

  function runTestHandIK() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const HandIKSystem = window.HandIKSystem;
    assert('HandIKSystem class is available', !!HandIKSystem);

    const handIK = new HandIKSystem();

    // 1. Reachable anchor test
    const shoulderPos = { x: 0.25, y: 1.4, z: 0.0 };
    const doorHandlePos = { x: 0.25, y: 1.1, z: 0.45 }; // Distance ~0.54m (< max reach ~0.65m)

    const reachResult = handIK.solveArmIK(shoulderPos, doorHandlePos);
    assert('Door handle anchor is reachable', reachResult.reachable === true);
    assert('Calculates valid non-zero elbow flexion angle', reachResult.elbowAngle > 0.1 && reachResult.elbowAngle < Math.PI);
    assert('Calculates valid shoulder angle', reachResult.shoulderAngle > 0.0);

    // 2. Out-of-reach anchor fallback test (never stretch arms unnaturally)
    const distantAnchorPos = { x: 0.25, y: 1.4, z: 2.5 }; // 2.5m away
    const outOfReachResult = handIK.solveArmIK(shoulderPos, distantAnchorPos);
    assert('Distant anchor flagged as not reachable', outOfReachResult.reachable === false);
    assert('Out of reach anchor signals overshoot distance', outOfReachResult.outOfReachBy > 1.0);

    // 3. Anchor target assignment
    handIK.setTarget('right', doorHandlePos);
    assert('Right hand target assigned', handIK.rightHandTarget !== null && handIK.rightHandTarget.z === 0.45);

    handIK.clearTargets();
    assert('Targets cleared cleanly', handIK.rightHandTarget === null && handIK.leftHandTarget === null);

    return results;
  }

  window.runTestHandIK = runTestHandIK;
})();
