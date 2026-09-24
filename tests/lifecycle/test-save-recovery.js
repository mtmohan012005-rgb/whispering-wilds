// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: SAVE INTEGRITY & RECOVERY
// Tests: Corrupted save detection, automatic backup recovery, crash safe-state.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.RecoverySystem, 'RecoverySystem missing');
      assert(window.RecoveryUI, 'RecoveryUI missing');

      const sm = window.saveManager || window.gameSaveManager;
      assert(sm, 'SaveManager missing');

      // Test backup recovery: corrupt primary slot and ensure backup is loaded
      const slot = 'recovery_test_slot';
      const key = sm.STORAGE_PREFIX + slot;
      const backupKey = key + '_backup';

      // Save a valid state
      sm.saveGameImmediate(slot, 'test_initial');

      // Overwrite primary with corrupted text
      localStorage.setItem(key, '{ corrupted_non_json ...');

      // Load save — should fallback to backup
      const recovered = sm.loadGame(slot);
      assert(recovered, 'Corrupted primary slot should automatically recover from backup');
      assert(recovered.player, 'Recovered save must have player state');

      // Clean up test slots
      localStorage.removeItem(key);
      localStorage.removeItem(backupKey);
      localStorage.removeItem(key + '_tmp');

      results.push({ name: 'Save Corruption Detection & Backup Recovery', passed: true });
    } catch (e) {
      results.push({ name: 'Save Corruption Detection & Backup Recovery', passed: false, error: e.message });
    }

    return { suite: 'LifecycleSaveRecovery', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleSaveRecovery = runTests;
})();
