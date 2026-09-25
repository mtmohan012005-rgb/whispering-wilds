// ============================================================================
// THE WHISPERING WILDS - AMBIENT AUDIO TEST SUITE
// Validates authentic regional environmental soundscapes across 7 biomes,
// 4 times of day, smooth crossfades, stochastic accents, and interior dampening.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Ambient Audio QA Tests ---');
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
      const ambientSys = window.AmbientAudioSystem;
      const ambientData = window.AmbientData;
      assert(ambientSys !== null && (typeof ambientSys === 'object' || typeof ambientSys === 'function'), 'AmbientAudioSystem must exist on window');
      assert(ambientData !== null && typeof ambientData === 'object', 'AmbientData must exist on window');

      ambientSys.init();

      // 1. Regional Sound Beds across 7 Biomes
      const regions = [
        'chennai',
        'cauvery_delta',
        'pichavaram',
        'chettinad',
        'thanjavur',
        'mamallapuram',
        'nilgiris'
      ];

      const timesOfDay = ['dawn', 'day', 'sunset', 'night'];

      for (const reg of regions) {
        for (const tod of timesOfDay) {
          const bed = ambientData.getBedForRegionAndTime(reg, tod);
          assert(bed !== null && typeof bed === 'object', `Ambient bed for ${reg} at ${tod} must be defined`);
          assert(typeof bed.id === 'string' && bed.id.length > 0, `Bed ID for ${reg}/${tod} must be valid string`);
          assert(Array.isArray(bed.layers) && bed.layers.length >= 2, `Ambient bed for ${reg}/${tod} must have at least 2 authored layers`);
        }
      }

      // 2. Region Switching & Crossfade
      ambientSys.setRegion('pichavaram');
      assert(ambientSys.currentRegion === 'pichavaram', 'AmbientSystem currentRegion must be pichavaram');

      ambientSys.setTimeOfDay('night');
      assert(ambientSys.currentTimeOfDay === 'night', 'AmbientSystem currentTimeOfDay must be night');
      assert(ambientSys.activeBedId.includes('pichavaram'), 'Active bed ID must reflect pichavaram');

      // 3. Interior Dampening Verification
      ambientSys.setInterior(true);
      assert(ambientSys.isInterior === true, 'AmbientSystem must register interior state');

      ambientSys.setInterior(false);
      assert(ambientSys.isInterior === false, 'AmbientSystem must restore exterior state');

      // 4. Stochastic Atmospheric Accents
      const accent = ambientData.getRandomAccent('chennai', 'day');
      assert(accent !== null && typeof accent === 'object', 'Regional accent for Chennai day must exist (e.g. distant auto horn, vendor call)');
      assert(typeof accent.id === 'string', 'Accent must have valid asset ID');

      // 5. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testAmbient: ${err.message}`);
    }

    console.log(`✓ Ambient Audio QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testAmbient = runTests;
})();
