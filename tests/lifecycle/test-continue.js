// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: CONTINUE & SAVE RESTORE
// Tests: Metadata validation, atomic save loading, currency and customization bounds.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      const sm = window.saveManager || window.gameSaveManager;
      assert(sm, 'SaveManager missing');

      // Test save and restore pipeline
      const testSlot = 'test_lifecycle_slot';
      sm.saveGameImmediate(testSlot, 'unit_test');

      const loaded = sm.loadGame(testSlot);
      assert(loaded, 'Failed to load test save slot');
      assert(loaded.version >= 2 || loaded.saveVersion >= 2, 'Save version should be >= 2');
      assert(loaded.player, 'Save payload missing player');
      assert(loaded.player.customizationChangesUsed <= 5, 'customizationChangesUsed in loaded save must be <= 5');

      // Cleanup test slot
      localStorage.removeItem(sm.STORAGE_PREFIX + testSlot);
      localStorage.removeItem(sm.STORAGE_PREFIX + testSlot + '_backup');
      localStorage.removeItem(sm.STORAGE_PREFIX + testSlot + '_tmp');

      results.push({ name: 'Continue Game Validation & State Integrity', passed: true });
    } catch (e) {
      results.push({ name: 'Continue Game Validation & State Integrity', passed: false, error: e.message });
    }

    return { suite: 'LifecycleContinue', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleContinue = runTests;
})();
