// ============================================================================
// THE WHISPERING WILDS - QUEST STATE MACHINE & PROGRESSION TEST SUITE
// Validates 8 quest states, prerequisite checks, anti-skip ordering,
// event-driven objective triggers, and duplicate reward protection.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Quest State Machine QA Tests ---');
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
      const qm = window.QuestStateMachine;
      const reg = window.ContentRegistry;
      const bus = window.ContentEvents;
      assert(qm !== null && typeof qm === 'object', 'QuestStateMachine must exist on window');
      assert(reg !== null && typeof reg === 'object', 'ContentRegistry must exist on window');

      // 1. Author a test quest entirely from data
      const dataDrivenQuest = {
        id: 'quest_test_paddy_irrigation',
        version: '1.0.0',
        title: 'Cauvery Sluice Gate Alignment',
        titleTa: 'காவிரி மதகு சீரமைப்பு',
        region: 'cauvery_delta',
        isDefaultUnlocked: true,
        objectives: [
          { id: 'step_1_inspect_sluice', type: 'inspect_clue', target: 'clue_stone_sluice_crank' },
          { id: 'step_2_rotate_wheel', type: 'solve_puzzle', target: 'puzzle_cauvery_waterwheel' },
          { id: 'step_3_report_back', type: 'return_to_npc', target: 'npc_murugan' }
        ],
        rewards: {
          xp: 150,
          coins: 40,
          items: ['item_murugan_special_chai_token']
        }
      };

      reg.register('quest', dataDrivenQuest);
      qm.init(reg, bus);

      // 2. Initial state verification
      const stateObj = qm.getQuestState('quest_test_paddy_irrigation');
      assert(stateObj.state === 'AVAILABLE', 'Newly registered default-unlocked quest must be in AVAILABLE state');

      // 3. Start quest
      const startRes = qm.startQuest('quest_test_paddy_irrigation');
      assert(startRes.success === true, 'Quest must start successfully');
      assert(stateObj.state === 'ACTIVE', 'Quest state must transition to ACTIVE');
      assert(stateObj.currentObjectiveIndex === 0, 'Initial active objective index must be 0');

      // 4. Anti-skip guard: Attempt to complete step 2 or 3 prematurely
      const skipAttempt = qm.progressObjective('quest_test_paddy_irrigation', 'step_3_report_back');
      assert(skipAttempt.success === false && skipAttempt.reason === 'OBJECTIVE_OUT_OF_SEQUENCE',
        'Anti-skip guard must block completing objective out of sequence');

      // 5. Complete step 1 via Event Bus
      const initialCoins = window.GameState?.player?.money || 0;
      bus.inspectClue('clue_stone_sluice_crank');
      assert(stateObj.currentObjectiveIndex === 1, 'Objective 1 must complete via inspectClue event');

      // 6. Complete step 2 via Event Bus
      bus.solvePuzzle('puzzle_cauvery_waterwheel');
      assert(stateObj.currentObjectiveIndex === 2, 'Objective 2 must complete via solvePuzzle event');

      // 7. Complete step 3 -> Final Quest Completion
      bus.returnToNPC('npc_murugan');
      assert(stateObj.state === 'COMPLETED', 'Quest state must transition to COMPLETED upon last objective');

      // 8. Reward verification: Coins increased by 40
      const currentCoins = window.GameState?.player?.money || 0;
      assert(currentCoins === initialCoins + 40, `Player money must increase exactly by reward coins (+40)`);

      // 9. Duplicate completion and duplicate reward guard
      const duplicateStart = qm.startQuest('quest_test_paddy_irrigation');
      assert(duplicateStart.success === false && duplicateStart.reason === 'ALREADY_COMPLETED',
        'Starting an already completed quest must be rejected');

      const duplicateComplete = qm.completeQuest('quest_test_paddy_irrigation');
      assert(duplicateComplete.success === false && duplicateComplete.reason === 'ALREADY_COMPLETED',
        'Completing an already completed quest must be rejected without duplicate rewards');
      assert(window.GameState.player.money === currentCoins, 'Player coins must remain unchanged after blocked duplicate completion');

      // 10. Save and reload verification
      qm._saveToGameState();
      assert(window.GameState.quests.completed.includes('quest_test_paddy_irrigation'),
        'Completed quest must persist in GameState.quests.completed');

      // Re-initialize from GameState
      const freshQm = new (window.QuestStateMachine.constructor)(reg, bus);
      freshQm.loadFromGameState();
      const reloadedState = freshQm.getQuestState('quest_test_paddy_irrigation');
      assert(reloadedState.state === 'COMPLETED', 'Reloaded quest state must retain COMPLETED status across restarts');

      // Clean up test quest
      reg.stores.get('quest').delete('quest_test_paddy_irrigation');
      reg.idIndex.delete('quest_test_paddy_irrigation');

    } catch (err) {
      failed++;
      errors.push(`Unhandled quest system test error: ${err.message}`);
    }

    return {
      suite: 'QuestSystem',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testQuestSystem = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
