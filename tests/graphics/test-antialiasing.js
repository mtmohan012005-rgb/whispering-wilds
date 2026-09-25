/**
 * The Whispering Wilds - Test Suite: Antialiasing
 */
(function(root) {
  'use strict';

  async function testAntialiasing() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const AntialiasingManager = root.AntialiasingManager || (typeof require !== 'undefined' && require('../../js/graphics/antialiasing-manager'));
      if (!AntialiasingManager) throw new Error('AntialiasingManager class not available');

      // Test 1: Hardware supporting MSAA 4x
      const highHardware = new AntialiasingManager({ msaaSupported: true, maxMsaaSamples: 4 });
      const highRes = highHardware.resolveAntialiasing('HIGH');
      if (highRes.mode === 'HIGH' && highRes.samples === 4) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`High AA resolution failed: ${JSON.stringify(highRes)}`);
      }

      // Test 2: Low-end hardware lacking MSAA gracefully falls back to post FXAA
      const lowHardware = new AntialiasingManager({ msaaSupported: false, maxMsaaSamples: 1 });
      const lowRes = lowHardware.resolveAntialiasing('HIGH');
      if (lowRes.mode === 'LOW' && lowRes.postFxaa === true) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Low-end hardware did not fallback to FXAA: ${JSON.stringify(lowRes)}`);
      }

      // Test 3: NONE mode
      const noneRes = lowHardware.resolveAntialiasing('NONE');
      if (noneRes.mode === 'NONE' && noneRes.samples === 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('NONE mode failed');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testAntialiasing;
  } else {
    root.testAntialiasing = testAntialiasing;
  }
})(typeof window !== 'undefined' ? window : global);
