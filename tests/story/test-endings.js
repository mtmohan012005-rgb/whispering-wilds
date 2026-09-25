// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENDINGS & GALLERY TEST SUITE
// Verifies evaluation of all 4 endings, spoiler protection, and completion flags.
// ============================================================================

(function () {
  'use strict';

  async function testEndings() {
    const results = { passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(msg);
        console.error(`[TestEndings] FAIL: ${msg}`);
      }
    }

    try {
      const dataModule = window.EndingData;
      assert(!!dataModule, 'EndingData module must be loaded');
      assert(dataModule.ENDINGS.length === 4, 'Must have exactly 4 authored endings (Never invent missing content)');

      const sys = window.EndingSystem;
      assert(!!sys, 'EndingSystem must be loaded');
      sys.init();

      // Test 1: Secret Ending evaluation
      const secretMetrics = {
        factionAffinity: { heritage_council: 80, archaeological_society: 40, local_resistance: 60 },
        npcAffinity: { murugan: 85, velu: 80, selvam: 80, sundaram: 80, mani: 85 },
        npcTrustAverage: 82,
        evidenceCount: 7,
        milestonesCompletedCount: 4,
        selectedDestiny: 'sanctuary_living_trust',
        flags: ['flag_destiny_living_sanctuary']
      };
      const secretEnding = dataModule.evaluateEnding(secretMetrics);
      assert(secretEnding.id === 'ending_ancestral_soil', 'Secret True Ending must be resolved when all 7 clues, 4 milestones, and high trust are met');

      // Test 2: Good Ending evaluation
      const goodMetrics = {
        factionAffinity: { heritage_council: 65, archaeological_society: 30, local_resistance: 50 },
        npcAffinity: { murugan: 55, velu: 50, selvam: 60, sundaram: 55, mani: 50 },
        npcTrustAverage: 54,
        evidenceCount: 5,
        milestonesCompletedCount: 2,
        selectedDestiny: 'sanctuary_living_trust',
        flags: []
      };
      const goodEnding = dataModule.evaluateEnding(goodMetrics);
      assert(goodEnding.id === 'ending_heritage_preserved', 'Good Ending must be resolved for living sanctuary with solid trust');

      // Test 3: Neutral Ending evaluation
      const neutralMetrics = {
        factionAffinity: { heritage_council: 20, archaeological_society: 65, local_resistance: 20 },
        npcAffinity: { murugan: 40, velu: 30, selvam: 30, sundaram: 40, mani: 40 },
        npcTrustAverage: 36,
        evidenceCount: 4,
        milestonesCompletedCount: 1,
        selectedDestiny: 'sanctuary_state_biosphere',
        flags: []
      };
      const neutralEnding = dataModule.evaluateEnding(neutralMetrics);
      assert(neutralEnding.id === 'ending_recorded_chronicle', 'Neutral Ending must be resolved for state biosphere route');

      // Test 4: Tragic Ending evaluation
      const tragicMetrics = {
        factionAffinity: { heritage_council: 10, archaeological_society: 10, local_resistance: 10 },
        npcAffinity: { murugan: 10, velu: 10, selvam: 10, sundaram: 10, mani: 10 },
        npcTrustAverage: 10,
        evidenceCount: 2,
        milestonesCompletedCount: 0,
        selectedDestiny: 'sanctuary_sealed_vault',
        flags: []
      };
      const tragicEnding = dataModule.evaluateEnding(tragicMetrics);
      assert(tragicEnding.id === 'ending_shadowed_sanctuary', 'Tragic Ending must be resolved when vault is sealed or trust collapses');

      // Test 5: Never expose hidden story content in gallery until earned
      const galleryBeforeUnlock = sys.getEndingGallery();
      const secretInGallery = galleryBeforeUnlock.find(e => e.id === 'ending_ancestral_soil');
      assert(secretInGallery && secretInGallery.isLocked, 'Secret ending must be locked and masked in gallery initially');
      assert(secretInGallery.title.includes('???'), 'Secret ending title must be masked with ???');

      // Test 6: Triggering ending unlocks it in gallery
      sys.triggerEnding('ending_heritage_preserved');
      assert(sys.isEndingUnlocked('ending_heritage_preserved'), 'Heritage preserved ending must be unlocked in system');
      assert(window.GameState?.story?.storyCompleted === true, 'GameState storyCompleted flag must be set');

    } catch (err) {
      results.failed++;
      results.errors.push(`Exception: ${err.message}`);
    }

    return results;
  }

  if (typeof window !== 'undefined') {
    window.testEndings = testEndings;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testEndings };
  }
})();
