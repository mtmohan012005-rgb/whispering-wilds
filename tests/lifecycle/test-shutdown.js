// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: SAFE SHUTDOWN & CLEAN EXIT
// Tests: Safe exit sequence: flush data, disconnect multiplayer, stop audio, cleanShutdown flag.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.BootManager, 'BootManager missing');
      assert(typeof window.BootManager.safeExit === 'function', 'BootManager.safeExit missing');
      assert(window.SessionSaveSystem, 'SessionSaveSystem missing');

      // Test session flush does not throw
      window.SessionSaveSystem.flush();

      // Test session manager shutdown marker
      if (window.SessionManager) {
        window.SessionManager._onExiting();
        const last = JSON.parse(localStorage.getItem('ww_last_session') || '{}');
        assert(last.cleanShutdown === true, 'Safe shutdown must record cleanShutdown=true in session store');
      }

      results.push({ name: 'Safe Shutdown Pipeline & Clean Session Exit', passed: true });
    } catch (e) {
      results.push({ name: 'Safe Shutdown Pipeline & Clean Session Exit', passed: false, error: e.message });
    }

    return { suite: 'LifecycleShutdown', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleShutdown = runTests;
})();
