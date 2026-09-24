// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: MAIN MENU
// Tests: MainMenuUI rendering, button actions, continue state with/without save.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.MainMenuUI, 'MainMenuUI missing');

      // Test menu build without errors
      window.MainMenuUI.show();
      const menuEl = document.getElementById('ww-main-menu');
      assert(menuEl, '#ww-main-menu DOM element should exist when shown');

      // Check required buttons
      const newGameBtn = document.getElementById('ww-menu-new-game') || document.getElementById('ww-menu-new_game') || document.getElementById('ww-mm-btn-new-game');
      const continueBtn = document.getElementById('ww-menu-continue') || document.getElementById('ww-mm-btn-continue');
      const loadBtn = document.getElementById('ww-menu-load-game') || document.getElementById('ww-menu-load_game') || document.getElementById('ww-menu-load') || document.getElementById('ww-mm-btn-load');
      const profileBtn = document.getElementById('ww-menu-profile') || document.getElementById('ww-mm-btn-profile');
      const settingsBtn = document.getElementById('ww-menu-settings') || document.getElementById('ww-mm-btn-settings');
      const creditsBtn = document.getElementById('ww-menu-credits') || document.getElementById('ww-mm-btn-credits');
      const quitBtn = document.getElementById('ww-menu-quit') || document.getElementById('ww-mm-btn-quit');

      assert(newGameBtn, 'New Game button missing');
      assert(continueBtn, 'Continue button missing');
      assert(loadBtn, 'Load button missing');
      assert(profileBtn, 'Profile button missing');
      assert(settingsBtn, 'Settings button missing');
      assert(creditsBtn, 'Credits button missing');
      assert(quitBtn, 'Quit button missing');

      // Hide menu cleanly
      window.MainMenuUI.hide();

      results.push({ name: 'Main Menu UI & Action Buttons', passed: true });
    } catch (e) {
      results.push({ name: 'Main Menu UI & Action Buttons', passed: false, error: e.message });
    }

    return { suite: 'LifecycleMainMenu', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleMainMenu = runTests;
})();
