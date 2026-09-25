/**
 * The Whispering Wilds - Test Suite: Automatic Recovery System
 */
(function(root) {
  'use strict';

  async function testAutomaticRecovery() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const AutomaticRecoverySystem = root.AutomaticRecoverySystem || (typeof require !== 'undefined' && require('../../js/systems/automatic-recovery-system'));
      if (!AutomaticRecoverySystem) throw new Error('AutomaticRecoverySystem class not available');

      const recovery = new AutomaticRecoverySystem();

      // Test 1: Delta clamping protection (large delta from alt-tab / freeze)
      const hugeDelta = 5.0; // 5 seconds freeze
      const clampedDelta = recovery.sanitizeDelta(hugeDelta);
      if (clampedDelta <= 0.1 && clampedDelta > 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Delta was not clamped safely: ${clampedDelta}`);
      }

      // Test 2: Normal delta passes through
      const normalDelta = 0.0166;
      if (Math.abs(recovery.sanitizeDelta(normalDelta) - normalDelta) < 0.0001) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Normal delta was modified unexpectedly');
      }

      // Test 3: Streaming stall recovery
      recovery.handleStreamingStall('cell_delta_01');
      if (recovery.recoveryCount > 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Streaming stall recovery handler failed to increment recovery count');
      }

      // Test 4: Memory pressure recovery
      recovery.handleMemoryPressure();
      if (recovery.recoveryCount >= 2) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Memory pressure recovery handler failed');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testAutomaticRecovery;
  } else {
    root.testAutomaticRecovery = testAutomaticRecovery;
  }
})(typeof window !== 'undefined' ? window : global);
