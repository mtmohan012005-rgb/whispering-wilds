/**
 * The Whispering Wilds - Test Suite: GPU Recovery
 */
(function(root) {
  'use strict';

  async function testGPURecovery() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const GraphicsHealthSystem = root.GraphicsHealthSystem || (typeof require !== 'undefined' && require('../../js/systems/graphics-health-system'));
      const GraphicsFallbackSystem = root.GraphicsFallbackSystem || (typeof require !== 'undefined' && require('../../js/systems/graphics-fallback-system'));

      if (!GraphicsHealthSystem || !GraphicsFallbackSystem) {
        throw new Error('Graphics health/fallback systems not available');
      }

      const health = new GraphicsHealthSystem();
      const fallback = new GraphicsFallbackSystem();

      // Test 1: Health check recognizes connected canvas
      const dummyCanvas = (typeof document !== 'undefined') ? document.body : { isConnected: true };
      const status = health.checkHealth(dummyCanvas, null);
      if (status.healthy === true) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Health check failed on normal canvas: ${status.reason}`);
      }

      // Test 2: Feature degradation tracking
      fallback.reportFeatureError('water', 'Test water shader compile failure');
      if (fallback.getFeatureState('water') === 'degraded') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Expected water state 'degraded', got '${fallback.getFeatureState('water')}'`);
      }

      // Second error disables feature safely
      fallback.reportFeatureError('water', 'Repeated failure');
      if (fallback.getFeatureState('water') === 'disabled') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Expected water state 'disabled', got '${fallback.getFeatureState('water')}'`);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testGPURecovery;
  } else {
    root.testGPURecovery = testGPURecovery;
  }
})(typeof window !== 'undefined' ? window : global);
