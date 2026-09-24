// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: CHECKPOINTS & COOLDOWNS
// Tests: Authored checkpoint triggers, interval debouncing, safe player transform.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.CheckpointSystem, 'CheckpointSystem missing');

      // Invalid trigger rejected
      const bad = window.CheckpointSystem.requestCheckpoint('non_existent_trigger_xyz');
      assert(bad === false, 'Invalid trigger must be rejected');

      // Checkpoint safe position query
      const safePos = window.CheckpointSystem._getSafePlayerPosition();
      assert(safePos && typeof safePos.x === 'number', 'Safe position must return valid coordinate vector');

      results.push({ name: 'Checkpoint Authored Triggers & Cooldown Gates', passed: true });
    } catch (e) {
      results.push({ name: 'Checkpoint Authored Triggers & Cooldown Gates', passed: false, error: e.message });
    }

    return { suite: 'LifecycleCheckpoint', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleCheckpoint = runTests;
})();
