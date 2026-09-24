/**
 * Automated QA Test: Save System Hardening, Version 3 Schema & Migrations
 */

window.testSaveSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA SAVE] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const sm = new window.SaveManager();

    // 1. Gather state version 3 check
    const state = sm._gatherState();
    const hasV3 = state && state.saveVersion === 3 && state.version === 3;
    log('Save Schema Version 3 Verification', hasV3, `saveVersion: ${state ? state.saveVersion : 'null'}`);

    // 2. Migration Pipeline (v1 -> v2 -> v3)
    const legacyV1 = {
      version: 1,
      timestamp: 1600000000000,
      player: { x: 100, y: 500, currentOutfit: 'village_workwear', customizationChangesUsed: 2 },
      survival: { currency: 80, hunger: 50, energy: 70 }
    };
    const migrated = sm.migrateSave(legacyV1);
    const migrationSuccess = migrated && migrated.saveVersion === 3 && migrated.player.outfitId === 'village_workwear';
    log('Save Migration Pipeline (v1 -> v2 -> v3)', migrationSuccess,
      `MigratedVersion: ${migrated ? migrated.saveVersion : 'null'}, Outfit: ${migrated ? migrated.player.outfitId : 'null'}`);

    // 3. Validation & Sanitization (Reject corrupted / out-of-bounds data)
    const corruptPayload = {
      saveVersion: 3,
      player: { x: 999999, y: -500, customizationChangesUsed: 999 }, // Corrupt!
      survival: { hunger: 999, currency: -50 } // Corrupt!
    };
    const validation = sm.validateSaveData(corruptPayload);
    const sanitized = validation.sanitized;
    const clampedCustomization = sanitized.player.customizationChangesUsed === 5;
    const clampedVitals = sanitized.survival.hunger === 100 && sanitized.survival.currency === 0;
    const clampedCoords = sanitized.player.x <= 10000 && sanitized.player.y >= 0;
    log('Strict Data Validation & Sanitization', clampedCustomization && clampedVitals && clampedCoords,
      `ClampedChanges: ${sanitized.player.customizationChangesUsed}, Hunger: ${sanitized.survival.hunger}, Currency: ${sanitized.survival.currency}`);

    // 4. Roundtrip Save & Restore
    sm.clearSave('test_qa');
    const saved = sm._performSave('test_qa', 'qa_roundtrip');
    const loaded = sm.loadGame('test_qa');
    const roundtripOk = saved && loaded && loaded.saveVersion === 3;
    sm.clearSave('test_qa');
    log('Complete Diegetic Save Roundtrip', roundtripOk, `Saved: ${saved}, Loaded: ${!!loaded}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Save Test Failure', false, err.message);
    return { passed: false, results };
  }
};
