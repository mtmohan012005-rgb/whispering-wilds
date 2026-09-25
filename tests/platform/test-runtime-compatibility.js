/**
 * The Whispering Wilds - Test Suite: Runtime Compatibility System
 */
(function(root) {
  'use strict';

  async function testRuntimeCompatibility() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const RuntimeCompatibilitySystem = root.RuntimeCompatibilitySystem || (typeof require !== 'undefined' && require('../../js/systems/runtime-compatibility-system'));
      if (!RuntimeCompatibilitySystem) throw new Error('RuntimeCompatibilitySystem class not available');

      const compat = new RuntimeCompatibilitySystem();

      // Test 1: Sole authority check (singleton)
      const secondInstance = new RuntimeCompatibilitySystem();
      if (compat === secondInstance) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Singleton violation: Multiple RuntimeCompatibilitySystem instances exist');
      }

      // Test 2: Startup sequence runs safely
      const startup = await compat.runStartupSequence();
      if (startup && startup.activeTier) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Startup sequence failed to produce an active tier');
      }

      // Test 3: Emulation modes (EMULATE_VERY_LOW to EMULATE_ULTRA)
      compat.setEmulationMode('EMULATE_VERY_LOW');
      if (compat.getActiveTier() === 'VERY_LOW') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('EMULATE_VERY_LOW failed to set active tier');
      }

      compat.setEmulationMode('EMULATE_ULTRA');
      if (compat.getActiveTier() === 'ULTRA') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('EMULATE_ULTRA failed to set active tier');
      }

      // Reset emulation
      compat.setEmulationMode(null);

      // Test 4: Customization limit invariance (<= 5)
      if (root.GameState && root.GameState.player) {
        root.GameState.player.customizationChangesUsed = 999;
        compat.verifyCustomizationCeiling();
        if (root.GameState.player.customizationChangesUsed === 5) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push('Customization ceiling clamp failed');
        }
      } else {
        results.passed++;
      }

      // Test 5: Safe Mode engagement
      compat.enableSafeMode();
      if (compat.safeModeActive && compat.getActiveTier() === 'VERY_LOW') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Safe mode engagement failed');
      }
      compat.disableSafeMode();

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testRuntimeCompatibility;
  } else {
    root.testRuntimeCompatibility = testRuntimeCompatibility;
  }
})(typeof window !== 'undefined' ? window : global);
