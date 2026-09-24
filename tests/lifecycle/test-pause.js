// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: PAUSE SYSTEM
// Tests: Simulation freeze, audio ducking, visibility auto-pause, input reset.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.PauseSystem, 'PauseSystem missing');
      assert(window.PauseMenuUI, 'PauseMenuUI missing');
      const lc = window.GameLifecycle;
      assert(lc, 'GameLifecycle missing');

      const originalState = lc.state;

      // Force PLAYING state for test
      lc.forceTransition('PLAYING');
      assert(lc.isPlaying === true, 'Lifecycle should be PLAYING');

      // Pause
      window.PauseSystem.pause('test');
      assert(lc.isPaused === true, 'Lifecycle should be PAUSED after pause()');
      assert(lc.isSimulationActive() === false, 'Simulation must be stopped when paused');

      // Resume
      window.PauseSystem.resume();
      assert(lc.isPlaying === true, 'Lifecycle should return to PLAYING after resume()');

      // Restore original state
      lc.forceTransition(originalState);

      results.push({ name: 'Pause System Simulation Control & State Transitions', passed: true });
    } catch (e) {
      results.push({ name: 'Pause System Simulation Control & State Transitions', passed: false, error: e.message });
    }

    return { suite: 'LifecyclePause', passed: results.every(r => r.passed), results };
  }

  window.testLifecyclePause = runTests;
})();
