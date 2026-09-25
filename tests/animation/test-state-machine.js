/**
 * tests/animation/test-state-machine.js
 * Verifies animation state transitions, locomotion speed thresholds,
 * start/stop dynamics, aerial cycles, vehicle states, and action commitment locks.
 */

(function () {
  'use strict';

  function runTestStateMachine() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const ASM = window.AnimationStateMachine;
    assert('AnimationStateMachine class is available', !!ASM);

    const sm = new ASM();

    // 1. Initial State
    assert('Initial state is IDLE', sm.currentState === 'IDLE');

    // 2. Locomotion start from rest: speed 1.5 -> START then WALK
    sm.update(0.016, { speed: 1.5, isGrounded: true });
    assert('Transitions to START when moving from rest', sm.currentState === 'START');

    // Advance past start duration
    sm.update(0.3, { speed: 1.5, isGrounded: true });
    assert('Transitions from START to WALK', sm.currentState === 'WALK');

    // 3. Acceleration to RUN and SPRINT
    sm.update(0.1, { speed: 3.6, isGrounded: true });
    assert('Transitions to RUN at 3.6 m/s', sm.currentState === 'RUN');

    sm.update(0.1, { speed: 5.6, isGrounded: true });
    assert('Transitions to SPRINT at 5.6 m/s', sm.currentState === 'SPRINT');

    // 4. Abrupt stop triggers STOP state
    sm.update(0.1, { speed: 0.0, isGrounded: true });
    assert('Sudden stop from sprint triggers STOP state', sm.currentState === 'STOP');

    sm.update(0.4, { speed: 0.0, isGrounded: true });
    assert('Transitions to IDLE after STOP completes', sm.currentState === 'IDLE');

    // 5. Aerial physics: Jump -> Fall -> Land
    sm.update(0.016, { isGrounded: false, verticalVelocity: 4.0 });
    assert('Enters JUMP state when airborne with positive vertical velocity', sm.currentState === 'JUMP');

    sm.update(0.3, { isGrounded: false, verticalVelocity: -2.0 });
    assert('Enters FALL state when airborne and falling', sm.currentState === 'FALL');

    sm.update(0.016, { isGrounded: true, verticalVelocity: 0.0 });
    assert('Enters LAND state upon touching ground', sm.currentState === 'LAND');

    // 6. Action commitment lock: non-cancellable interact cannot be broken by movement
    sm.update(0.4, { speed: 0.0, isGrounded: true }); // Clear land lock
    sm.update(0.016, { actionRequest: { type: 'open', duration: 1.2 } });
    assert('Enters OPEN action state with lock', sm.currentState === 'OPEN' && sm.isLocked);

    // Attempt to interrupt with movement during lock
    sm.update(0.2, { speed: 4.0, isGrounded: true });
    assert('Committed action cannot be interrupted during lock duration', sm.currentState === 'OPEN');

    // Advance past lock duration
    sm.update(1.2, { speed: 0.0, isGrounded: true });
    assert('Action completes and unlocks', sm.currentState === 'IDLE');

    // 7. Vehicle states
    sm.update(0.016, { transportMode: 'bicycle', speed: 4.0 });
    assert('Enters BICYCLE state when on bicycle', sm.currentState === 'BICYCLE');

    return results;
  }

  window.runTestStateMachine = runTestStateMachine;
})();
