/**
 * The Whispering Wilds - Test Suite: Context Loss
 */
(function(root) {
  'use strict';

  async function testContextLoss() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const GPURecoveryManager = root.GPURecoveryManager || (typeof require !== 'undefined' && require('../../js/graphics/gpu-recovery-manager'));
      if (!GPURecoveryManager) throw new Error('GPURecoveryManager class not available');

      let restoredCalled = false;
      const dummyCanvas = (typeof document !== 'undefined') ? document.createElement('canvas') : {
        addEventListener: () => {},
        getContext: () => null
      };

      const recovery = new GPURecoveryManager(dummyCanvas, () => {
        restoredCalled = true;
      });

      // Test 1: Context lost handler pauses simulation
      recovery.handleContextLost();
      if (recovery.isContextLost === true && recovery.lossCount === 1) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Context loss state did not update cleanly');
      }

      // Test 2: Context restored handler triggers rebuild callback
      recovery.handleContextRestored();
      if (recovery.isContextLost === false && restoredCalled === true) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Context restored handler failed to trigger recovery callback');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testContextLoss;
  } else {
    root.testContextLoss = testContextLoss;
  }
})(typeof window !== 'undefined' ? window : global);
