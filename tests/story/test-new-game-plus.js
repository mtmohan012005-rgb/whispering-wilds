// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - NEW GAME+ TEST SUITE
// Verifies completion security guard, safe archive preservation, carryovers,
// and permanent <= 5 customization limit invariant.
// ============================================================================

(function () {
  'use strict';

  async function testNewGamePlus() {
    const results = { passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(msg);
        console.error(`[TestNewGamePlus] FAIL: ${msg}`);
      }
    }

    try {
      const dataModule = window.NewGamePlusData;
      assert(!!dataModule, 'NewGamePlusData module must be loaded');

      const sys = window.NewGamePlusSystem;
      assert(!!sys, 'NewGamePlusSystem must be loaded');

      // Test 1: Security guard - cannot bypass story completion validation
      if (window.GameState?.story) {
        window.GameState.story.storyCompleted = false;
      }
      if (window.EndingSystem) {
        window.EndingSystem.currentEnding = null;
      }
      if (window.StoryContentSystem) {
        window.StoryContentSystem.storyCompleted = false;
      }

      const blockedAttempt = sys.startNewGamePlus();
      assert(!blockedAttempt.success, 'New Game+ MUST be blocked if story is not completed');
      assert(!sys.canStartNewGamePlus(), 'canStartNewGamePlus must return false when uncompleted');

      // Test 2: Enable legitimate completion
      if (window.GameState?.story) {
        window.GameState.story.storyCompleted = true;
      }
      assert(sys.canStartNewGamePlus(), 'canStartNewGamePlus must return true after campaign completion');

      // Setup mock save to verify archive preservation
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('whisperingWilds_save_auto', JSON.stringify({ version: 3, storyCompleted: true }));
      }

      // Setup player customization state
      if (window.GameState?.player) {
        window.GameState.player.customizationChangesUsed = 3;
      }

      // Test 3: Start New Game+ with modifier
      const launchRes = sys.startNewGamePlus({
        modifiers: ['mod_intense_monsoon']
      });

      assert(launchRes.success, 'New Game+ launch must succeed with verified completion');
      assert(sys.getGeneration() === 1, 'Generation must advance to 1');
      assert(sys.activeModifiers.includes('mod_intense_monsoon'), 'Selected modifier must be active');
      assert(launchRes.dedicatedSlot === 'ngplus_gen1', 'Dedicated save slot ngplus_gen1 must be assigned');

      // Test 4: Verify completed save was NEVER overwritten
      if (typeof localStorage !== 'undefined') {
        const archivedSave = localStorage.getItem('whisperingWilds_save_completed_campaign');
        assert(!!archivedSave, 'Completed campaign save must be safely archived and NOT overwritten');
      }

      // Test 5: Verify strict customization ceiling invariant: <= 5
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed >= 0 && customUsed <= 5, `Customization changes used (${customUsed}) must strictly respect <= 5 ceiling`);

      // Test 6: Verify world/story reset for fresh playthrough
      assert(window.StoryProgressionSystem?.currentNodeId === 'node_prologue_heist', 'Story progression must reset to prologue');
      assert(window.StoryContentSystem?.activeChapterIndex === 0, 'Active chapter index must reset to 0');

    } catch (err) {
      results.failed++;
      results.errors.push(`Exception: ${err.message}`);
    }

    return results;
  }

  if (typeof window !== 'undefined') {
    window.testNewGamePlus = testNewGamePlus;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testNewGamePlus };
  }
})();
