/**
 * tests/animation/test-foot-ik.js
 * Verifies analytical Two-Bone Foot IK, terrain elevation conform,
 * pelvis drop, slope pitch adaptation, and stretch limit clamping.
 */

(function () {
  'use strict';

  function runTestFootIK() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const FootIKSystem = window.FootIKSystem;
    assert('FootIKSystem class is available', !!FootIKSystem);

    const ik = new FootIKSystem();

    // 1. Analytical Two-Bone IK Solver math
    const totalLegLength = ik.upperLegLength + ik.lowerLegLength; // ~0.86m
    const solveFull = ik.solveTwoBoneIK(0.7); // Valid reachable distance
    assert('Two-bone solver returns valid result', solveFull.valid === true);
    assert('Knee flexion angle is greater than 0', solveFull.kneeAngle > 0.1);
    assert('Leg is not overstretched at 0.7m', solveFull.isStretched === false);

    // Overstretched distance clamps cleanly without producing NaN
    const solveStretched = ik.solveTwoBoneIK(1.5); // Greater than total leg length
    assert('Solver clamps extreme distance without NaN', !Number.isNaN(solveStretched.kneeAngle) && solveStretched.isStretched === true);

    // 2. Terrain elevation conformity
    // Mock terrain: flat at Y=0 except a step up of +0.2m under left foot
    const mockTerrain = (x, z) => {
      if (x < 0) return 0.2; // Left foot step
      return 0.0;           // Right foot flat
    };

    const leftFootPos = { x: -0.2, y: 0.08, z: 0.0 };
    const rightFootPos = { x: 0.2, y: 0.08, z: 0.0 };

    const evaluated = ik.evaluateFeet(leftFootPos, rightFootPos, mockTerrain, { leftPlanted: true, rightPlanted: true });
    assert('Left foot positive offset computed for elevated step', evaluated.leftOffset > 0.03);
    assert('Evaluated offsets remain within safe correction bounds', Math.abs(evaluated.leftOffset) <= ik.maxCorrectionMeters);

    // 3. Slope pitch calculation
    // Mock sloped terrain: rising forward (z)
    const slopedTerrain = (x, z) => z * 0.2; // 20% slope
    const slopeEvaluated = ik.evaluateFeet(leftFootPos, rightFootPos, slopedTerrain);
    assert('Foot pitch adapts to ground slope', Math.abs(slopeEvaluated.leftPitch) > 0.02);

    // 4. Quality level toggling
    ik.setQualityLevel('LOW');
    assert('Foot IK disabled when quality set to LOW', ik.enabled === false);

    return results;
  }

  window.runTestFootIK = runTestFootIK;
})();
