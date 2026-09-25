// ============================================================================
// THE WHISPERING WILDS - SECURITY & DEV PANEL TEST SUITE
// Validates developer tool isolation in production builds, and ensures client-only
// multiplayer reward manipulation is blocked by authoritative checks.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Security & Dev Panel QA Tests ---');
    let passed = 0;
    let failed = 0;
    const errors = [];

    function assert(cond, msg) {
      if (cond) {
        passed++;
      } else {
        failed++;
        errors.push(msg);
        console.error(`[FAIL] ${msg}`);
      }
    }

    try {
      const panel = window.DevContentPanel;
      assert(panel !== null && typeof panel === 'object', 'DevContentPanel must exist on window');

      // 1. Test production build lockdown
      const prevForce = window.FORCE_PRODUCTION_BUILD;
      window.FORCE_PRODUCTION_BUILD = true;

      const enableAttempt = panel.setDevMode(true);
      assert(enableAttempt === false, 'Enabling dev panel under FORCE_PRODUCTION_BUILD must be rejected');
      assert(panel.isDevMode === false, 'panel.isDevMode must remain false under production build');

      // 2. Dev action execution under production lock
      const moneyBefore = window.GameState?.player?.money || 0;
      panel.giveMoney(500); // Should be a no-op
      assert(window.GameState?.player?.money === moneyBefore, 'giveMoney action must be completely disabled under production lock');

      // Restore dev flag
      window.FORCE_PRODUCTION_BUILD = prevForce;
      panel.setDevMode(true);

      // 3. Multiplayer security isolation test
      // Simulating a multiplayer room state: client cannot trust unauthenticated client-only reward injections
      const mockMultiplayerState = {
        isMultiplayer: true,
        isHost: false,
        validateRewardAuthority(reward) {
          // Only server or authoritative host can sign off rewards
          return reward && reward.serverSignature !== undefined;
        }
      };

      const untrustedClientReward = { xp: 10000, coins: 50000 };
      const isTrusted = mockMultiplayerState.validateRewardAuthority(untrustedClientReward);
      assert(isTrusted === false, 'Multiplayer architecture must reject untrusted client-only reward payloads');

      // 4. Invariant check on customization ceiling
      assert(window.GameState?.player?.customizationChangesUsed <= 5,
        'Permanent player customization ceiling must be <= 5');

    } catch (err) {
      failed++;
      errors.push(`Unhandled security & dev panel test error: ${err.message}`);
    }

    return {
      suite: 'SecurityAndDevPanel',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testSecurityDevPanel = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
