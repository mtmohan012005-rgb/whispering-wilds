// ============================================================================
// THE WHISPERING WILDS - AUDIO OCCLUSION & DISTANCE TEST SUITE
// Validates 3D spatial distance culling (60m), wall/door acoustic obstruction,
// low-pass filter high-cut dampening, and cached throttling (150ms).
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Audio Occlusion & Distance QA Tests ---');
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
      const occlusionSys = window.AudioOcclusionSystem;
      const distanceSys = window.AudioDistanceSystem;
      assert(occlusionSys !== null && (typeof occlusionSys === 'object' || typeof occlusionSys === 'function'), 'AudioOcclusionSystem must exist on window');
      assert(distanceSys !== null && (typeof distanceSys === 'object' || typeof distanceSys === 'function'), 'AudioDistanceSystem must exist on window');

      occlusionSys.init();
      distanceSys.init();

      // 1. Distance Culling at 60m threshold (Rule 108)
      const listenerPos = { x: 0, y: 0, z: 0 };
      const nearPos = { x: 10, y: 0, z: 15 }; // ~18m (audible)
      const farPos = { x: 70, y: 0, z: 80 };  // ~106m (culled)

      const nearCheck = distanceSys.evaluateDistance(listenerPos, nearPos, 60.0);
      assert(nearCheck.isAudible === true, 'Nearby audio source (18m) must be audible');
      assert(nearCheck.distance < 60.0, 'Distance must be less than 60m');

      const farCheck = distanceSys.evaluateDistance(listenerPos, farPos, 60.0);
      assert(farCheck.isAudible === false, 'Distant audio source (106m) must be culled at 60m threshold');

      // 2. Audio Occlusion Calculation
      // Emitter behind stone wall
      const occludedResult = occlusionSys.calculateOcclusion({
        emitterPos: { x: 10, y: 0, z: 20 },
        listenerPos: { x: 10, y: 0, z: -5 },
        obstructions: [{ type: 'granite_wall', thickness: 0.5 }]
      });

      assert(occludedResult.isOccluded === true, 'Source behind granite wall must be marked occluded');
      assert(occludedResult.cutoffFrequency <= 1200, `Occluded cutoff frequency must be high-cut (got ${occludedResult.cutoffFrequency}Hz)`);
      assert(occludedResult.gainMultiplier < 0.7, `Occluded gain multiplier must be attenuated (got ${occludedResult.gainMultiplier})`);

      // 3. Clear Line of Sight (Unoccluded)
      const clearResult = occlusionSys.calculateOcclusion({
        emitterPos: { x: 5, y: 0, z: 5 },
        listenerPos: { x: 0, y: 0, z: 0 },
        obstructions: []
      });

      assert(clearResult.isOccluded === false, 'Source with clear line of sight must not be occluded');
      assert(clearResult.cutoffFrequency >= 18000, 'Unoccluded source must have full acoustic bandwidth');
      assert(clearResult.gainMultiplier === 1.0, 'Unoccluded source must have unity gain multiplier');

      // 4. Cache & Throttle Interval (Rule 22 / 110)
      assert(occlusionSys.updateIntervalMs >= 100, 'Occlusion check must be throttled (>= 100ms) to preserve frame rate');

      // 5. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testOcclusion: ${err.message}`);
    }

    console.log(`✓ Audio Occlusion & Distance QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testOcclusion = runTests;
})();
