// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REPLAY & RECAP TEST SUITE
// Verifies free-roam, chapter replay scenarios, recap generation, and spoiler shields.
// ============================================================================

(function () {
  'use strict';

  async function testReplaySystem() {
    const results = { passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(msg);
        console.error(`[TestReplaySystem] FAIL: ${msg}`);
      }
    }

    try {
      const dataModule = window.ReplayData;
      assert(!!dataModule, 'ReplayData module must be loaded');
      assert(dataModule.getAllScenarios().length >= 7, 'Must have at least 7 chapter replay scenarios');

      const replaySys = window.ReplaySystem;
      assert(!!replaySys, 'ReplaySystem must be loaded');

      const recapSys = window.StoryRecapSystem;
      assert(!!recapSys, 'StoryRecapSystem must be loaded');

      // Test 1: Enable free roam
      replaySys.enableFreeRoam();
      assert(replaySys.freeRoamEnabled === true, 'Free-roam mode must be enabled');

      // Test 2: Replay Chapter 3 (Chettinad)
      const replaySuccess = replaySys.replayChapter('chapter_3');
      assert(replaySuccess, 'Replaying Chapter 3 scenario must succeed in free-roam');
      assert(replaySys.replayedChapters.has('chapter_3'), 'Chapter 3 must be registered in replayedChapters');

      // Test 3: Playthrough summary generation
      const summary = replaySys.generatePlaythroughSummary();
      assert(summary && typeof summary.totalPlaytimeMinutes === 'number', 'Playthrough summary must generate numeric playtime');
      assert(Array.isArray(summary.evidenceCollected), 'Summary must list evidence array');

      // Test 4: Story Recap generation
      const recap = recapSys.generateRecap();
      assert(recap && recap.ending, 'Recap must include ending outcome');
      assert(Array.isArray(recap.timeline), 'Recap must include decision timeline');
      assert(Array.isArray(recap.npcBonds), 'Recap must include NPC bonds list');
      assert(Array.isArray(recap.factionStandings), 'Recap must include faction standings');

      // Test 5: Verify spoiler shield (Never expose unvisited branches)
      // Check that timeline only contains registered choices
      const branchSystem = window.StoryBranchSystem;
      if (branchSystem) {
        const recordedCount = Object.keys(branchSystem.choices).length;
        assert(recap.timeline.length <= recordedCount, 'Recap timeline must never invent unvisited story branches');
      }

      // Test 6: Customization ceiling invariant
      const customUsed = recap.customizationChangesUsed;
      assert(customUsed >= 0 && customUsed <= 5, 'Recap must confirm customization changes used <= 5');

    } catch (err) {
      results.failed++;
      results.errors.push(`Exception: ${err.message}`);
    }

    return results;
  }

  if (typeof window !== 'undefined') {
    window.testReplaySystem = testReplaySystem;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testReplaySystem };
  }
})();
