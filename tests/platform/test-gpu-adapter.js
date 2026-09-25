/**
 * The Whispering Wilds - Test Suite: GPU Adapter
 */
(function(root) {
  'use strict';

  async function testGPUAdapter() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const GPUAdapter = root.GPUAdapter || (typeof require !== 'undefined' && require('../../js/platform/gpu-adapter'));
      if (!GPUAdapter) throw new Error('GPUAdapter class not available');

      const adapter = new GPUAdapter();
      const caps = adapter.getCapabilities();

      // Validate capability fields
      if (typeof caps.webgl1 === 'boolean' && typeof caps.webgl2 === 'boolean') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('webgl1/webgl2 capability flags missing');
      }

      if (['INTEGRATED', 'ENTRY_DEDICATED', 'MID_DEDICATED', 'HIGH_DEDICATED', 'APPLE_SILICON', 'UNKNOWN'].includes(caps.gpuClass)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid GPU class: ${caps.gpuClass}`);
      }

      if (typeof caps.maxTextureSize === 'number' && caps.maxTextureSize >= 2048) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Unexpected maxTextureSize: ${caps.maxTextureSize}`);
      }

      if (['highp', 'mediump', 'lowp'].includes(caps.precision)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid shader precision: ${caps.precision}`);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testGPUAdapter;
  } else {
    root.testGPUAdapter = testGPUAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
