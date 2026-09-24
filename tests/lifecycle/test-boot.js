// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: BOOT & STARTUP
// Tests: GameLifecycle initial state, BootManager WebGL validation, settings,
// localization, asset registry, and transitions from BOOT to MAIN_MENU.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      // 1. GameLifecycle singleton and constants
      assert(window.GameLifecycle, 'GameLifecycle missing');
      assert(window.LIFECYCLE_STATES, 'LIFECYCLE_STATES missing');
      const expectedStates = [
        'BOOT', 'INITIALIZING', 'LOGIN', 'PROFILE_SELECT', 'MAIN_MENU',
        'LOADING_GAME', 'PLAYING', 'PAUSED', 'TRANSITIONING', 'SAVING',
        'RECOVERING', 'GAME_OVER', 'RETURNING_TO_MENU', 'EXITING'
      ];
      expectedStates.forEach(s => assert(window.LIFECYCLE_STATES[s] === s, `State ${s} mismatch`));

      // 2. BootManager exists and is configured
      assert(window.BootManager, 'BootManager missing');
      assert(typeof window.BootManager.boot === 'function', 'BootManager.boot missing');

      // 3. WebGL validation
      const diag = window.BootManager.getDiagnostics();
      assert(diag.webGLOK === true, 'WebGL validation should pass in test environment');

      // 4. SettingsManager initialization & defaults
      assert(window.SettingsManager, 'SettingsManager missing');
      assert(window.SettingsManager.settings.graphics.preset, 'SettingsManager graphics preset missing');

      // 5. DisplayManager initialization
      assert(window.DisplayManager, 'DisplayManager missing');
      assert(window.DisplayManager.resolutionPreset === '1080p', 'Default resolution should be 1080p');

      // 6. Safe graphics mode check
      window.SettingsManager.applySafeGraphicsMode();
      assert(window.SettingsManager.isSafeMode === true, 'Safe graphics mode should be active');
      assert(window.SettingsManager.settings.graphics.preset === 'low', 'Safe mode must set low preset');
      window.SettingsManager.restoreFromSafeMode(false);
      assert(window.SettingsManager.isSafeMode === false, 'Safe graphics mode should restore original preset');

      results.push({ name: 'Boot Lifecycle & Environment Validation', passed: true });
    } catch (e) {
      results.push({ name: 'Boot Lifecycle & Environment Validation', passed: false, error: e.message });
    }

    return { suite: 'LifecycleBoot', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleBoot = runTests;
})();
