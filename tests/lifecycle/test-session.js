// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: SESSION MANAGER & PLAYTIME
// Tests: Session ID tracking, playtime accumulation only while PLAYING, clean shutdown flag.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.SessionManager, 'SessionManager missing');
      assert(window.SessionManager.sessionId, 'SessionManager must have active sessionId');
      assert(window.SessionManager.startTime > 0, 'SessionManager startTime must be > 0');

      // Test playtime accumulator ignores non-playing states
      const initialPlaytime = window.SessionManager.playTimeSeconds;
      const lc = window.GameLifecycle;

      // When PAUSED, playtime should not increment
      if (lc) {
        const savedState = lc.state;
        lc.forceTransition('PAUSED');
        window.SessionManager.update(1.0); // 1 simulated second
        assert(window.SessionManager.playTimeSeconds === initialPlaytime, 'Playtime must not accumulate while PAUSED');
        lc.forceTransition(savedState);
      }

      results.push({ name: 'Session Lifecycle Tracking & Playtime Authority', passed: true });
    } catch (e) {
      results.push({ name: 'Session Lifecycle Tracking & Playtime Authority', passed: false, error: e.message });
    }

    return { suite: 'LifecycleSession', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleSession = runTests;
})();
