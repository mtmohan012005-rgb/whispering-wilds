// ============================================================================
// THE WHISPERING WILDS - SAVE & MIGRATION TEST SUITE
// Validates content version tracking, schema migrations (v1 -> v4),
// and strict permanent preservation of customizationChangesUsed <= 5 ceiling.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Save Migration QA Tests ---');
    let passed = 0;
    let failed = 0;
    const errors = [];

    function assert(cond, msg) {
      if (cond) {
        passed++;
      } else {
        failed++;
        errors.push(msg);
        console.error(`[FAIL] ${msg}`);
      }
    }

    try {
      const migrator = window.ContentSaveMigration;
      assert(migrator !== null && typeof migrator === 'object', 'ContentSaveMigration must exist on window');

      // 1. Prepare save payload with current schema tags
      const currentSave = migrator.prepareSavePayload({
        player: { money: 150, experience: 200, customizationChangesUsed: 3 },
        quests: { active: [], completed: [], states: {} }
      });

      assert(currentSave !== null, 'prepareSavePayload must return valid payload');
      assert(currentSave.meta.schemaVersion === 4, 'Prepared save must have schemaVersion 4');
      assert(currentSave.meta.contentVersion === '2026.09.25', 'Prepared save must have current contentVersion');

      // 2. Test migration from legacy v1 save (missing quests.states and social)
      const legacyV1Save = {
        meta: { schemaVersion: 1, gameVersion: '1.0.0' },
        data: {
          player: { money: 50, customizationChangesUsed: 2 },
          inventory: { items: ['item_cutting_chai'] }
        }
      };

      const migrationResult = migrator.migrateSave(legacyV1Save);
      assert(migrationResult.success === true, 'Legacy v1 save migration must succeed');
      assert(migrationResult.migrated === true, 'Migration flag must be true');
      assert(migrationResult.toVersion === 4, 'Must migrate up to schema v4');
      assert(migrationResult.payload.data.quests !== undefined, 'Migrated data must include quests container');
      assert(migrationResult.payload.data.social !== undefined, 'Migrated data must include social relationships');

      // 3. CRITICAL INVARIANT: 5-Customization Rule
      // Attempting to migrate a save with invalid/corrupted customization changes (e.g. 9)
      const corruptedCustomizationSave = {
        meta: { schemaVersion: 2 },
        data: {
          player: { money: 80, customizationChangesUsed: 9 } // Illegal: > 5
        }
      };

      const clampedResult = migrator.migrateSave(corruptedCustomizationSave);
      assert(clampedResult.success === true, 'Migration of corrupted save must succeed');
      assert(clampedResult.payload.data.player.customizationChangesUsed === 5,
        `Corrupted customization count (9) must be clamped to absolute maximum 5 (was ${clampedResult.payload.data.player.customizationChangesUsed})`);

      // Test prepareSavePayload with clamped count
      const clampedPrepared = migrator.prepareSavePayload({
        player: { money: 100, customizationChangesUsed: 8 }
      });
      assert(clampedPrepared.data.player.customizationChangesUsed === 5,
        'prepareSavePayload must strictly clamp customizationChangesUsed <= 5');

    } catch (err) {
      failed++;
      errors.push(`Unhandled save migration test error: ${err.message}`);
    }

    return {
      suite: 'SaveMigration',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testSaveMigration = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
