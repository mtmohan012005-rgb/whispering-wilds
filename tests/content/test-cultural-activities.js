// ============================================================================
// THE WHISPERING WILDS - CULTURAL ACTIVITIES TEST SUITE
// Validates data-driven cultural activity definitions, step execution,
// bilingual cultural explanations, and completion events.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Cultural Activities QA Tests ---');
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
      const cas = window.CulturalActivitySystem;
      const reg = window.ContentRegistry;
      const bus = window.ContentEvents;
      assert(cas !== null && typeof cas === 'object', 'CulturalActivitySystem must exist on window');

      // 1. Author a cultural activity entirely from data
      const testActivity = {
        id: 'culture_test_pongal_boil',
        version: '1.0.0',
        titleEn: 'Clay Pot Pongal Preparation',
        titleTa: 'மண்பானை பொங்கல் வைத்தல்',
        region: 'cauvery_delta',
        culturalExplanationEn: 'The overflowing of milk represents abundance and agricultural gratitude to the Sun god.',
        culturalExplanationTa: 'பால் பொங்கி வழிவது விளைச்சலின் செழிப்பையும் இயற்கைக்கும் கதிரவனுக்கும் செலுத்தும் நன்றியையும் குறிக்கிறது.',
        steps: [
          { id: 'step_decorate_pot', instructionEn: 'Tie ginger and turmeric plants around the pot neck' },
          { id: 'step_pour_milk', instructionEn: 'Pour fresh farm milk into the earthen pot' },
          { id: 'step_shout_pongalo', instructionEn: 'Wait for milk to boil over and exclaim Pongalo Pongal!' }
        ],
        rewards: {
          culturalKnowledge: 75
        }
      };

      reg.register('culture', testActivity);
      cas.init(reg, bus);

      // 2. Start activity
      const startRes = cas.startActivity('culture_test_pongal_boil');
      assert(startRes.success === true, 'Activity must start successfully');
      assert(startRes.totalSteps === 3, 'Activity must register 3 steps');
      assert(typeof startRes.culturalExplanationTa === 'string' && startRes.culturalExplanationTa.length > 0, 'Tamil explanation must be present');

      // 3. Step execution
      const step1 = cas.completeStep({ accuracy: 0.95 });
      assert(step1.success === true && step1.isFinished === false, 'Step 1 must complete and advance');
      assert(step1.stepIndex === 1, 'Current step index must be 1');

      const step2 = cas.completeStep({ accuracy: 1.0 });
      assert(step2.success === true && step2.isFinished === false, 'Step 2 must complete and advance');

      // 4. Final step execution -> finish
      let eventFired = false;
      const unsub = bus.on('complete_cultural_activity', (payload) => {
        if (payload.activityId === 'culture_test_pongal_boil') eventFired = true;
      });

      const step3 = cas.completeStep({ accuracy: 1.0 });
      unsub();

      assert(step3.success === true && step3.isFinished === true, 'Final step must finish the cultural activity');
      assert(cas.isCompleted('culture_test_pongal_boil') === true, 'Activity must be marked as completed');
      assert(eventFired === true, 'complete_cultural_activity event must fire on ContentEvents bus');

      // Clean up test culture definition
      reg.stores.get('culture').delete('culture_test_pongal_boil');
      reg.idIndex.delete('culture_test_pongal_boil');

    } catch (err) {
      failed++;
      errors.push(`Unhandled cultural activities test error: ${err.message}`);
    }

    return {
      suite: 'CulturalActivities',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testCulturalActivities = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
