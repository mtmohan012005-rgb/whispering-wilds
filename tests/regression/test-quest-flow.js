/**
 * tests/regression/test-quest-flow.js
 * Regression test for quest progression, prerequisite integrity,
 * and zero-reward-duplication rules.
 */

(function () {
  'use strict';

  function runTestQuestFlow() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const sis = window.StateIntegritySystem;
    assert('StateIntegritySystem available for quest rules', !!sis);

    // Test 1: Single Reward Claim
    const claim1 = sis.claimQuestReward('quest_lost_inscription', 'reward_temple_key');
    assert('First quest reward claim granted', claim1.granted === true);

    // Test 2: Duplicate Reward Claim Prevention
    const claim2 = sis.claimQuestReward('quest_lost_inscription', 'reward_temple_key');
    assert('Second claim for same reward rejected', claim2.granted === false && claim2.reason === 'DUPLICATE_CLAIM');

    // Test 3: Quest status validity in GameState
    if (window.GameState?.quests) {
      assert('GameState quest tracking initialized', typeof window.GameState.quests === 'object');
    }

    return results;
  }

  window.runTestQuestFlow = runTestQuestFlow;
})();
