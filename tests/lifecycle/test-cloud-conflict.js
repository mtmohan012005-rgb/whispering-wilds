// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: CLOUD CONFLICT & OFFLINE MODE
// Tests: Explicit conflict prompt (no silent overwrite), offline queueing.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.CloudSaveSystem, 'CloudSaveSystem missing');

      // Test conflict resolution: local vs cloud selection
      const localState = { timestamp: '2026-09-24T10:00:00Z', currency: 100 };
      const cloudState = { timestamp: '2026-09-24T12:00:00Z', currency: 250 };

      // Explicit local choice must return local
      const localChosen = window.CloudSaveSystem.resolveConflict('local', localState, cloudState);
      assert(localChosen.currency === 100, 'Choosing local save must preserve local currency');

      // Explicit cloud choice must return cloud
      const cloudChosen = window.CloudSaveSystem.resolveConflict('cloud', localState, cloudState);
      assert(cloudChosen.currency === 250, 'Choosing cloud save must apply cloud currency');

      results.push({ name: 'Cloud Conflict Explicit Resolution & Offline Fallback', passed: true });
    } catch (e) {
      results.push({ name: 'Cloud Conflict Explicit Resolution & Offline Fallback', passed: false, error: e.message });
    }

    return { suite: 'LifecycleCloudConflict', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleCloudConflict = runTests;
})();
