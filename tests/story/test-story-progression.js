// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY PROGRESSION TEST SUITE
// Verifies graph node transitions, objective completion, sequence-break guards.
// ============================================================================

(function () {
  'use strict';

  async function testStoryProgression() {
    const results = { passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(msg);
        console.error(`[TestStoryProgression] FAIL: ${msg}`);
      }
    }

    try {
      const dataModule = window.StoryProgressionData;
      assert(!!dataModule, 'StoryProgressionData must be loaded');
      assert(dataModule.getAllNodes().length >= 8, 'Story progression must have at least 8 canonical nodes');

      const sys = window.StoryProgressionSystem;
      assert(!!sys, 'StoryProgressionSystem must be loaded');

      // Test 1: Initial state
      sys.init();
      assert(sys.currentNodeId === 'node_prologue_heist', 'Initial node must be node_prologue_heist');

      // Test 2: Sequence break prevention
      const invalidTransition = sys.canTransitionTo('node_ch7_pasumai_sanctuary');
      assert(!invalidTransition.valid, 'Direct jump to Chapter 7 without prerequisites must be blocked');

      // Test 3: Valid objective completion
      sys.completeObjective('witness_high_court_heist');
      sys.completeObjective('speak_with_murugan_annan');
      sys.completeObjective('photograph_enfield_tracks');

      assert(sys.isNodeCompleted('node_prologue_heist'), 'Prologue node must be marked completed after all objectives done');
      assert(sys.currentNodeId === 'node_ch1_investigation', 'Should auto-transition to Chapter 1 investigation');

      // Test 4: Can transition to chapter 2 only after chapter 1 is completed
      sys.completedNodes.push('node_ch1_investigation');
      const validCh2Transition = sys.canTransitionTo('node_ch2_cauvery_sluice');
      assert(validCh2Transition.valid, 'Transition to Chapter 2 should be valid after Chapter 1 is completed');

      // Test 5: Serialization
      const serialized = sys.serialize();
      assert(serialized && Array.isArray(serialized.completedNodes), 'Progression must serialize valid state');

    } catch (err) {
      results.failed++;
      results.errors.push(`Exception: ${err.message}`);
    }

    return results;
  }

  if (typeof window !== 'undefined') {
    window.testStoryProgression = testStoryProgression;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testStoryProgression };
  }
})();
