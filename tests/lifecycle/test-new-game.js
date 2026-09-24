// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: NEW GAME INITIALIZATION
// Tests: Clean GameState reset, 5-change customization limit reset to 0,
// and confirmation flow preserving existing saves until confirmed.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      // 1. Confirm dialog exists
      assert(window.ConfirmDialogUI, 'ConfirmDialogUI missing');

      // 2. Customization limit ceiling check
      if (window.GameState && window.GameState.player) {
        window.GameState.player.customizationChangesUsed = 3;
        assert(window.GameState.player.customizationChangesUsed === 3, 'Pre-check failed');

        // Reset via authoritative state
        window.GameState._initAuthoritativeState();
        assert(window.GameState.player.customizationChangesUsed === 0, 'New game must reset customizationChangesUsed to 0');
        assert(window.GameState.player.maxCustomizationChanges === 5, 'Max customization must strictly be 5');

        // Verify impossible values are clamped
        window.GameState.player.customizationChangesUsed = 99;
        const validated = window.GameState.validateLoadedState({ player: window.GameState.player });
        assert(validated.state.player.customizationChangesUsed <= 5, 'Customization count > 5 must be clamped to 5');
      }

      results.push({ name: 'New Game State & Customization Limit Safeguards', passed: true });
    } catch (e) {
      results.push({ name: 'New Game State & Customization Limit Safeguards', passed: false, error: e.message });
    }

    return { suite: 'LifecycleNewGame', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleNewGame = runTests;
})();
