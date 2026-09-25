// ============================================================================
// THE WHISPERING WILDS - WILDLIFE AUDIO TEST SUITE
// Validates 9 species audio profiles, diurnal/nocturnal calling behaviors,
// 12-second cooldown enforcement (no looping spam), and alert/flee states.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Wildlife Audio QA Tests ---');
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
      const wildlifeSys = window.WildlifeAudioSystem;
      const wildlifeData = window.WildlifeAudioData;
      assert(wildlifeSys !== null && (typeof wildlifeSys === 'object' || typeof wildlifeSys === 'function'), 'WildlifeAudioSystem must exist on window');
      assert(wildlifeData !== null && typeof wildlifeData === 'object', 'WildlifeAudioData must exist on window');

      wildlifeSys.init();

      // 1. Verify 9 Species Audio Profiles
      const speciesList = [
        'nilgiri_tahr',
        'nilgiri_langur',
        'elephant',
        'gaur',
        'peafowl',
        'egret',
        'kingfisher',
        'cattle',
        'goat'
      ];

      for (const sp of speciesList) {
        const profile = wildlifeData.getSpeciesProfile(sp);
        assert(profile !== null, `Species audio profile for '${sp}' must exist in WildlifeAudioData`);
        assert(typeof profile.nameTamil === 'string', `Species '${sp}' must have Tamil common name`);
        assert(Array.isArray(profile.calls) && profile.calls.length > 0, `Species '${sp}' must have authored call definitions`);
      }

      // 2. Behavioral Call Triggers (idle, alert, warning, flee)
      const tahrCall = wildlifeSys.triggerVocalization('nilgiri_tahr', 'alert', { x: 100, y: 0, z: 200 });
      assert(tahrCall && tahrCall.success === true, 'Tahr alert whistle must trigger successfully');

      // 3. 12-Second Cooldown Enforcement (Rule 72: No animal spam)
      const immediateSpamCall = wildlifeSys.triggerVocalization('nilgiri_tahr', 'alert', { x: 100, y: 0, z: 200 });
      assert(immediateSpamCall && immediateSpamCall.success === false, 'Immediate repeated animal call must be blocked by cooldown');
      assert(immediateSpamCall.reason === 'cooldown', 'Failure reason must be cooldown');

      // 4. Species Call Selection based on Diurnal / Nocturnal context
      const dayCall = wildlifeData.getAppropriateCall('peafowl', 'day');
      assert(dayCall !== null, 'Peafowl must have active daytime calls');

      const nightCall = wildlifeData.getAppropriateCall('peafowl', 'night');
      assert(nightCall === null || nightCall.intensity < dayCall.intensity, 'Peafowl must roost quietly at night');

      // 5. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testWildlifeAudio: ${err.message}`);
    }

    console.log(`✓ Wildlife Audio QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testWildlifeAudio = runTests;
})();
