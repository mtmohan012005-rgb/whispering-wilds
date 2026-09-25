// ============================================================================
// THE WHISPERING WILDS - NPC CONTENT TEST SUITE
// Validates data-driven NPC definitions, schedules, occupations, and locations.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running NPC Content QA Tests ---');
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
      const reg = window.ContentRegistry;
      assert(reg !== null, 'ContentRegistry must exist on window');

      // 1. Author a test NPC without editing main.js
      const testNpcDef = {
        id: 'npc_test_chettinad_cook',
        version: '1.0.0',
        name: 'Meenakshi Aachi',
        nameTa: 'மீனாட்சி ஆச்சி',
        role: 'Master of Chettinad Spice & Feast Cooking',
        region: 'chettinad',
        occupation: 'traditional_cook',
        homeLocationId: 'loc_chettinad_mansion',
        workplaceLocationId: 'loc_chettinad_kitchen',
        schedule: [
          { time: '05:00', activity: 'grind_spices_in_ammi_kal', location: 'workplace' },
          { time: '12:00', activity: 'serve_banana_leaf_lunch', location: 'workplace' },
          { time: '19:00', activity: 'evening_prayers_in_courtyard', location: 'home' }
        ]
      };

      reg.register('npc', testNpcDef);
      const retrieved = reg.get('npc', 'npc_test_chettinad_cook');

      assert(retrieved !== null, 'NPC added from data must be retrievable without touching main.js');
      assert(retrieved.nameTa === 'மீனாட்சி ஆச்சி', 'Tamil name must match authored data');
      assert(Array.isArray(retrieved.schedule) && retrieved.schedule.length === 3, 'NPC schedule must contain all authored entries');
      assert(retrieved.region === 'chettinad', 'NPC region must be chettinad');

      // Clean up test NPC
      reg.stores.get('npc').delete('npc_test_chettinad_cook');
      reg.idIndex.delete('npc_test_chettinad_cook');

    } catch (err) {
      failed++;
      errors.push(`Unhandled NPC content test error: ${err.message}`);
    }

    return {
      suite: 'NPCContent',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testNpcContent = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
