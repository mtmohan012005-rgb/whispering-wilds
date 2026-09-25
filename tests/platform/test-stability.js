/**
 * The Whispering Wilds - Test Suite: Stability Manager
 */
(function(root) {
  'use strict';

  async function testStability() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const StabilityManager = root.StabilityManager || (typeof require !== 'undefined' && require('../../js/systems/stability-manager'));
      if (!StabilityManager) throw new Error('StabilityManager class not available');

      const mgr = new StabilityManager();

      // Test 1: Single session render loop registration & duplicate block
      const firstReg = mgr.registerRenderLoop('main_game_loop');
      const dupReg = mgr.registerRenderLoop('main_game_loop'); // duplicate
      if (firstReg === true && dupReg === false) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('StabilityManager failed to block duplicate render loop registration');
      }
      mgr.unregisterRenderLoop('main_game_loop');

      // Test 2: Event listener registry & cleanup by owner
      let dummyCalled = false;
      const dummyTarget = {
        addEventListener: () => {},
        removeEventListener: () => { dummyCalled = true; }
      };
      mgr.registerEventListener(dummyTarget, 'click', () => {}, 'TEST_OWNER');
      mgr.cleanupOwnerListeners('TEST_OWNER');
      if (dummyCalled) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Event listener cleanup failed');
      }

      // Test 3: Shared asset protection ref counting
      let disposed = false;
      mgr.registerResource('mesh_temple_pillar', 'GEOMETRY', 'REGION');
      mgr.registerResource('mesh_temple_pillar', 'GEOMETRY', 'REGION'); // refCount 2
      mgr.releaseResource('mesh_temple_pillar', () => { disposed = true; }); // refCount 1
      if (!disposed) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Shared resource was prematurely disposed with remaining users');
      }
      mgr.releaseResource('mesh_temple_pillar', () => { disposed = true; }); // refCount 0
      if (disposed) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Resource was not disposed when refCount hit zero');
      }

      // Test 4: Bounded log ring buffer
      for (let i = 0; i < 150; i++) {
        mgr.log(`Log entry ${i}`);
      }
      if (mgr.getLogs().length <= mgr.maxLogEntries) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Logs exceeded bound: ${mgr.getLogs().length}`);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testStability;
  } else {
    root.testStability = testStability;
  }
})(typeof window !== 'undefined' ? window : global);
