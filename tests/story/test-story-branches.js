// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY BRANCH & CONSEQUENCE TEST SUITE
// Verifies choice registration, faction affinity, NPC relationships, and flags.
// ============================================================================

(function () {
  'use strict';

  async function testStoryBranches() {
    const results = { passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(msg);
        console.error(`[TestStoryBranches] FAIL: ${msg}`);
      }
    }

    try {
      const dataModule = window.StoryBranchData;
      assert(!!dataModule, 'StoryBranchData must be loaded');
      assert(dataModule.getAllBranches().length >= 5, 'Must have at least 5 authored branches');

      const sys = window.StoryBranchSystem;
      assert(!!sys, 'StoryBranchSystem must be loaded');

      sys.init();

      // Test 1: Record Cauvery sluice choice
      const initialSelvamAffinity = sys.getNpcAffinity('selvam');
      const res = sys.recordChoice('branch_ch2_sluice_verdict', 'sluice_balanced_heritage');

      assert(res.success, 'Recording sluice balanced heritage choice must succeed');
      assert(sys.getChoice('branch_ch2_sluice_verdict') === 'sluice_balanced_heritage', 'Branch choice must be recorded');
      assert(sys.getNpcAffinity('selvam') > initialSelvamAffinity, 'Selvam affinity must increase after heritage sluice choice');
      assert(sys.hasFlag('flag_sluice_balanced_flow'), 'Consequence flag flag_sluice_balanced_flow must be granted');

      // Test 2: Faction standings
      assert(sys.getFactionAffinity('heritage_council') > 30, 'Heritage Council affinity must increase');

      // Test 3: Climax sanctuary choice
      const resClimax = sys.recordChoice('branch_ch7_sanctuary_destiny', 'sanctuary_living_trust');
      assert(resClimax.success, 'Sanctuary destiny choice must succeed');
      assert(sys.selectedDestiny === 'sanctuary_living_trust', 'Selected destiny must be sanctuary_living_trust');

      // Test 4: Customization limit invariant
      if (window.GameState?.player) {
        window.GameState.player.customizationChangesUsed = 4;
        sys.syncWithGameState();
        assert(window.GameState.player.customizationChangesUsed <= 5, 'Customization ceiling <= 5 preserved');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(`Exception: ${err.message}`);
    }

    return results;
  }

  if (typeof window !== 'undefined') {
    window.testStoryBranches = testStoryBranches;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testStoryBranches };
  }
})();
