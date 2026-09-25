/**
 * Platform Overlay & Input Lock Guard Unit Tests
 */

(function(root) {
  const PlatformOverlay = typeof require !== 'undefined' ? require('../../platform/platform-overlay') : root.PlatformOverlay;
  const DevelopmentPlatformProvider = typeof require !== 'undefined' ? require('../../platform/providers/development-provider') : root.DevelopmentPlatformProvider;

  function runOverlayTests() {
    const results = { name: 'PlatformOverlayTests', passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) results.passed++;
      else { results.failed++; results.errors.push(msg); }
    }

    const provider = new DevelopmentPlatformProvider();
    const overlay = new PlatformOverlay(provider);
    overlay.init();

    // 1. Initial state inactive
    assert(overlay.isOverlayActive === false, 'Overlay initially inactive');

    // 2. Mock input reset and pause listener
    let inputResetCalled = false;
    let pauseOpened = false;

    if (typeof window !== 'undefined') {
      window.InputManager = window.InputManager || {};
      const origReset = window.InputManager.resetTransientInputs;
      window.InputManager.resetTransientInputs = () => { inputResetCalled = true; };

      window.PauseMenu = window.PauseMenu || {};
      const origPause = window.PauseMenu.open;
      window.PauseMenu.open = () => { pauseOpened = true; };

      // 3. Trigger overlay open
      provider.showOverlay('friends');
      assert(overlay.isOverlayActive === true, 'Overlay state marked active');
      assert(inputResetCalled === true, 'InputManager.resetTransientInputs called when overlay opened');
      assert(pauseOpened === true, 'PauseMenu opened when overlay activated');

      // 4. Close overlay
      provider.closeOverlay();
      assert(overlay.isOverlayActive === false, 'Overlay marked inactive when closed');

      // Restore
      window.InputManager.resetTransientInputs = origReset;
      window.PauseMenu.open = origPause;
    } else {
      overlay.setOverlayActive(true);
      assert(overlay.isOverlayActive === true, 'Overlay active flag set');
      overlay.setOverlayActive(false);
      assert(overlay.isOverlayActive === false, 'Overlay inactive flag set');
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runOverlayTests };
    if (require.main === module) {
      const r = runOverlayTests();
      console.log(`[OverlayTest] Passed: ${r.passed}, Failed: ${r.failed}`);
      if (r.failed > 0) process.exit(1);
    }
  } else {
    root.testOverlay = runOverlayTests;
  }
})(typeof window !== 'undefined' ? window : global);
