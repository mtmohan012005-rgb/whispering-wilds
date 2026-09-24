// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: INPUT LOCKING & STUCK KEY RESET
// Tests: Input suppression in non-playing states, clean key clearing on focus/state changes.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      const lc = window.GameLifecycle;
      assert(lc, 'GameLifecycle missing');

      // Check input locked in non-playing states
      const savedState = lc.state;
      lc.forceTransition('LOADING_GAME');
      assert(lc.isInputLocked() === true, 'Input must be locked in LOADING_GAME');

      lc.forceTransition('TRANSITIONING');
      assert(lc.isInputLocked() === true, 'Input must be locked in TRANSITIONING');

      lc.forceTransition('SAVING');
      assert(lc.isInputLocked() === true, 'Input must be locked in SAVING');

      lc.forceTransition('PLAYING');
      assert(lc.isInputLocked() === false, 'Input must be unlocked in PLAYING');

      // Test input state clearance
      if (window.threeWorld && typeof window.threeWorld.clearInputState === 'function') {
        window.threeWorld.inputState.up = true;
        window.threeWorld.inputState.sprint = true;
        window.threeWorld.clearInputState();
        assert(window.threeWorld.inputState.up === false, 'clearInputState must reset up key');
        assert(window.threeWorld.inputState.sprint === false, 'clearInputState must reset sprint key');
      }

      lc.forceTransition(savedState);

      results.push({ name: 'Input Locking State & Stuck Key Safeguards', passed: true });
    } catch (e) {
      results.push({ name: 'Input Locking State & Stuck Key Safeguards', passed: false, error: e.message });
    }

    return { suite: 'LifecycleInputReset', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleInputReset = runTests;
})();
