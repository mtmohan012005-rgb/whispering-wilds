/**
 * tests/animation/test-blending.js
 * Verifies animation blend duration calculation, stride-phase normalization,
 * and smooth cross-fading without sudden snapping.
 */

(function () {
  'use strict';

  function runTestBlending() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const AnimationBlender = window.AnimationBlender;
    assert('AnimationBlender class is available', !!AnimationBlender);

    const blender = new AnimationBlender();

    // 1. Transition duration matrix checks
    assert('Calculates calibrated blend duration for IDLE->START', blender.getBlendDuration('IDLE', 'START') === 0.15);
    assert('Calculates calibrated blend duration for WALK->RUN', blender.getBlendDuration('WALK', 'RUN') <= 0.25);
    assert('Calculates quick blend duration for ANY->JUMP', blender.getBlendDuration('WALK', 'JUMP') === 0.1);
    assert('Default blend duration fallback', blender.getBlendDuration('UNKNOWN', 'UNKNOWN') === 0.25);

    // 2. Mock Three.js Action for Phase-sync test
    let crossFaded = false;
    let played = false;

    const mockWalkClip = { duration: 1.05 };
    const mockWalkAction = {
      enabled: true,
      time: 0.525, // 50% through walk cycle
      getClip: () => mockWalkClip,
      setEffectiveTimeScale: () => {},
      setEffectiveWeight: () => {},
      play: () => { played = true; },
      crossFadeFrom: () => { crossFaded = true; }
    };

    const mockRunClip = { duration: 0.72 };
    const mockRunAction = {
      enabled: true,
      time: 0.0,
      getClip: () => mockRunClip,
      setEffectiveTimeScale: () => {},
      setEffectiveWeight: () => {},
      play: () => { played = true; },
      crossFadeFrom: () => { crossFaded = true; }
    };

    // Transition from Walk to Run
    blender.currentAction = mockWalkAction;
    blender.currentClipId = 'Player_Walk';

    const success = blender.transitionToAction(mockRunAction, 'Player_Run', 'WALK', 'RUN');
    assert('Transition executed successfully', success === true);
    assert('Cross-fade was called on target action', crossFaded === true);
    assert('Target action was played', played === true);

    // Stride phase sync check: Walk at 50% phase -> Run should start at 50% (0.36s)
    const expectedRunTime = (0.525 / 1.05) * 0.72; // 0.36
    assert('Run action phase matched walk stride phase (~0.36s)', Math.abs(mockRunAction.time - expectedRunTime) < 0.01);

    return results;
  }

  window.runTestBlending = runTestBlending;
})();
