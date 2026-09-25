/**
 * The Whispering Wilds - Test Suite: Backend Selection
 */
(function(root) {
  'use strict';

  async function testBackendSelection() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const Manager = root.GraphicsBackendManager || (typeof require !== 'undefined' && require('../../js/graphics/graphics-backend-manager'));
      if (!Manager) throw new Error('GraphicsBackendManager class not available');

      const mgr = new Manager();
      const status = mgr.getStatus();

      // Test 1: Sole authority check
      const secondMgr = new Manager();
      if (mgr === secondMgr) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Singleton violation: Multiple GraphicsBackendManager instances exist');
      }

      // Test 2: Safe backend status
      if (['WEBGL2', 'WEBGL_FALLBACK', 'WEBGPU', 'UNAVAILABLE'].includes(status.backend)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid backend state: ${status.backend}`);
      }

      // Test 3: Capability tier classification
      if (['MINIMAL', 'BASIC', 'STANDARD', 'ADVANCED', 'EXTREME'].includes(status.tier)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid capability tier: ${status.tier}`);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testBackendSelection;
  } else {
    root.testBackendSelection = testBackendSelection;
  }
})(typeof window !== 'undefined' ? window : global);
