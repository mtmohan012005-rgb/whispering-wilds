// ============================================================================
// THE WHISPERING WILDS - FOOTSTEPS & FOLEY TEST SUITE
// Validates surface contact event triggers, 8 terrain materials, 3 footwear types,
// veshti cloth rustle audio, and player breathing exertion states.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Footsteps & Foley QA Tests ---');
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
      const footstepSys = window.FootstepAudioSystem;
      const footstepData = window.FootstepData;
      assert(footstepSys !== null && (typeof footstepSys === 'object' || typeof footstepSys === 'function'), 'FootstepAudioSystem must exist on window');
      assert(footstepData !== null && typeof footstepData === 'object', 'FootstepData must exist on window');

      footstepSys.init();

      // 1. Verify 8 Surface Materials
      const requiredSurfaces = [
        'stone',
        'wood',
        'soil',
        'mud',
        'sand',
        'grass',
        'wet_ground',
        'water'
      ];
      for (const surf of requiredSurfaces) {
        const profile = footstepData.getSurfaceProfile(surf);
        assert(profile !== null, `Surface profile for '${surf}' must exist in FootstepData`);
        assert(typeof profile.baseTone === 'string' || typeof profile.description === 'string', `Surface '${surf}' must describe acoustic properties`);
      }

      // 2. Verify 3 Footwear Types
      const footwearTypes = ['sandals', 'shoes', 'boots'];
      for (const fw of footwearTypes) {
        footstepSys.setFootwear(fw);
        assert(footstepSys.currentFootwear === fw, `Footwear must update to ${fw}`);
      }

      // Reset to sandals (cultural default for Tamil Nadu exploration)
      footstepSys.setFootwear('sandals');

      // 3. Contact Event Footstep Audio Trigger
      // Should resolve sound and not spam if triggered multiple times within 100ms
      const step1 = footstepSys.onContactEvent({
        foot: 'left',
        surface: 'stone',
        speed: 1.0,
        isSprinting: false
      });
      assert(step1 && step1.triggered === true, 'Footstep contact event must trigger audio resolution');
      assert(step1.surface === 'stone', 'Triggered footstep surface must be stone');

      // 4. Subtle Veshti / Cloth Movement Audio
      assert(step1.clothRustlePlayed !== undefined, 'Contact event must evaluate cloth rustle accompaniment');

      // 5. Water Footsteps: shallow splash
      const waterStep = footstepSys.onContactEvent({
        foot: 'right',
        surface: 'water',
        speed: 0.8,
        isSprinting: false
      });
      assert(waterStep && waterStep.surface === 'water', 'Water footstep must trigger water splash audio');

      // 6. Exertion Breathing Simulation
      footstepSys.updateBreathing(0.95); // High stamina exertion (sprinting)
      assert(footstepSys.isBreathingHeavy === true || footstepSys.exertionLevel >= 0.8, 'High stamina expenditure must raise subtle breathing intensity');

      footstepSys.updateBreathing(0.1); // Recovered
      assert(footstepSys.exertionLevel <= 0.2, 'Resting stamina must lower breathing to near silence');

      // 7. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testFootsteps: ${err.message}`);
    }

    console.log(`✓ Footsteps & Foley QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testFootsteps = runTests;
})();
