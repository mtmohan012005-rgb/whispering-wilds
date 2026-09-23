/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Player Customization & 5-Change Progression Limit
 * Validates authoritative 5-change maximum, preview without consumption, cancel reversion,
 * anti-duplication protection, change 1..5 sequence, strict change 6 failure,
 * save/load persistence, corrupted counter clamping, and new-game reset.
 */

window.runPlayerCustomizationTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[CUSTOMIZATION TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING PLAYER CUSTOMIZATION & 5-CHANGE LIMIT TEST SUITE <<<');

  try {
    const config = window.PLAYER_CUSTOMIZATION_CONFIG;
    if (!config) throw new Error('PLAYER_CUSTOMIZATION_CONFIG not defined');

    const testSystem = new window.PlayerCustomizationSystem(config);

    // -------------------------------------------------------------
    // TEST 1: Initial State & Limit Configuration
    // -------------------------------------------------------------
    const initialUsed = testSystem.customizationChangesUsed === 0;
    const maxLimit = testSystem.maxCustomizationChanges === 5;
    const canCustInit = testSystem.canCustomize() === true;
    const remInit = testSystem.getRemainingChanges() === 5;

    log('Initial State & 5-Change Limit Configuration',
      initialUsed && maxLimit && canCustInit && remInit,
      `Used: ${testSystem.customizationChangesUsed}/5, Remaining: ${testSystem.getRemainingChanges()}, CanCustomize: ${canCustInit}`);

    // -------------------------------------------------------------
    // TEST 2: Preview Mode (Zero Changes Consumed)
    // -------------------------------------------------------------
    let previewEventFired = false;
    testSystem.addEventListener('playerCustomizationPreview', () => { previewEventFired = true; });

    testSystem.preview({ outfitId: 'urban_explorer' });
    const isPreviewActive = testSystem.previewConfiguration && testSystem.previewConfiguration.outfitId === 'urban_explorer';
    const activeRemainsUnchanged = testSystem.activeConfiguration.outfitId === 'everyday_veshti';
    const previewConsumedZero = testSystem.customizationChangesUsed === 0;

    log('Preview Mode (Zero Changes Consumed)',
      previewEventFired && isPreviewActive && activeRemainsUnchanged && previewConsumedZero,
      `PreviewActive: ${isPreviewActive}, ActiveOutfit: ${testSystem.activeConfiguration.outfitId}, ChangesUsed: ${testSystem.customizationChangesUsed}`);

    // -------------------------------------------------------------
    // TEST 3: Cancel Preview (Visual Reversion & Zero Consumption)
    // -------------------------------------------------------------
    let cancelEventFired = false;
    testSystem.addEventListener('playerCustomizationCancelled', () => { cancelEventFired = true; });

    testSystem.cancel();
    const previewCleared = testSystem.previewConfiguration === null;
    const cancelConsumedZero = testSystem.customizationChangesUsed === 0;

    log('Cancel Preview (Reversion & Zero Changes Consumed)',
      cancelEventFired && previewCleared && cancelConsumedZero,
      `PreviewCleared: ${previewCleared}, ChangesUsed: ${testSystem.customizationChangesUsed}`);

    // -------------------------------------------------------------
    // TEST 4: Anti-Duplication Protection
    // -------------------------------------------------------------
    // Confirming the SAME configuration must NOT consume a change
    const dupResult = testSystem.confirm({
      outfitId: 'everyday_veshti',
      hairstyleId: 'short_traditional_part',
      accessoryId: 'none',
      footwearId: 'kolhapuri_sandals',
      appearancePresetId: 'everyday_explorer'
    });

    const dupNotConsumed = dupResult.success && dupResult.changeConsumed === false;
    const dupCounterUnchanged = testSystem.customizationChangesUsed === 0;

    log('Anti-Duplication Protection (Same Configuration Consumes 0)',
      dupNotConsumed && dupCounterUnchanged,
      `ChangeConsumed: ${dupResult.changeConsumed}, Reason: ${dupResult.reason}, ChangesUsed: ${testSystem.customizationChangesUsed}`);

    // -------------------------------------------------------------
    // TEST 5: Change 1 of 5
    // -------------------------------------------------------------
    const res1 = testSystem.confirm({ outfitId: 'urban_explorer', footwearId: 'trekking_boots' });
    const c1Valid = res1.success && res1.changeConsumed && testSystem.customizationChangesUsed === 1 && testSystem.getRemainingChanges() === 4;

    log('Customization Change 1 of 5', c1Valid,
      `Outfit: ${testSystem.activeConfiguration.outfitId}, Used: ${testSystem.customizationChangesUsed}/5, Remaining: ${testSystem.getRemainingChanges()}`);

    // -------------------------------------------------------------
    // TEST 6: Change 2 of 5
    // -------------------------------------------------------------
    const res2 = testSystem.confirm({ outfitId: 'festival_veshti', footwearId: 'heritage_sandals' });
    const c2Valid = res2.success && res2.changeConsumed && testSystem.customizationChangesUsed === 2 && testSystem.getRemainingChanges() === 3;

    log('Customization Change 2 of 5', c2Valid,
      `Outfit: ${testSystem.activeConfiguration.outfitId}, Used: ${testSystem.customizationChangesUsed}/5, Remaining: ${testSystem.getRemainingChanges()}`);

    // -------------------------------------------------------------
    // TEST 7: Change 3 of 5
    // -------------------------------------------------------------
    const res3 = testSystem.confirm({ outfitId: 'nilgiri_warmwear', footwearId: 'insulated_spiked_boots' });
    const c3Valid = res3.success && res3.changeConsumed && testSystem.customizationChangesUsed === 3 && testSystem.getRemainingChanges() === 2;

    log('Customization Change 3 of 5', c3Valid,
      `Outfit: ${testSystem.activeConfiguration.outfitId}, Used: ${testSystem.customizationChangesUsed}/5, Remaining: ${testSystem.getRemainingChanges()}`);

    // -------------------------------------------------------------
    // TEST 8: Change 4 of 5
    // -------------------------------------------------------------
    const res4 = testSystem.confirm({ outfitId: 'village_workwear', footwearId: 'rubber_field_chappals' });
    const c4Valid = res4.success && res4.changeConsumed && testSystem.customizationChangesUsed === 4 && testSystem.getRemainingChanges() === 1;

    log('Customization Change 4 of 5', c4Valid,
      `Outfit: ${testSystem.activeConfiguration.outfitId}, Used: ${testSystem.customizationChangesUsed}/5, Remaining: ${testSystem.getRemainingChanges()}`);

    // -------------------------------------------------------------
    // TEST 9: Change 5 of 5 & Limit Reached Lock
    // -------------------------------------------------------------
    let limitReachedFired = false;
    testSystem.addEventListener('playerCustomizationLimitReached', () => { limitReachedFired = true; });

    const res5 = testSystem.confirm({ outfitId: 'everyday_veshti', footwearId: 'kolhapuri_sandals' });
    const c5Valid = res5.success && res5.changeConsumed && testSystem.customizationChangesUsed === 5 && testSystem.getRemainingChanges() === 0;
    const isNowLocked = testSystem.canCustomize() === false;

    log('Customization Change 5 of 5 & Progression Lock (0 Left)',
      c5Valid && isNowLocked && limitReachedFired,
      `Used: ${testSystem.customizationChangesUsed}/5, Remaining: ${testSystem.getRemainingChanges()}, Locked: ${isNowLocked}, EventFired: ${limitReachedFired}`);

    // -------------------------------------------------------------
    // TEST 10: Attempt Change 6 (STRICT FAILURE EXPECTED)
    // -------------------------------------------------------------
    const res6 = testSystem.confirm({ outfitId: 'urban_explorer' });
    const change6Blocked = res6.success === false && res6.changeConsumed === false;
    const countRemains5 = testSystem.customizationChangesUsed === 5;
    const remainingRemains0 = testSystem.getRemainingChanges() === 0;

    log('Attempted Change 6 (Strictly Blocked by Authoritative State)',
      change6Blocked && countRemains5 && remainingRemains0,
      `Success: ${res6.success}, ChangeConsumed: ${res6.changeConsumed}, Errors: "${res6.errors ? res6.errors.join('; ') : ''}", Used: ${testSystem.customizationChangesUsed}`);

    // -------------------------------------------------------------
    // TEST 11: History Log (5 Records with Timestamps & Flows)
    // -------------------------------------------------------------
    const historyValid = testSystem.history.length === 5 &&
      testSystem.history[0].changeIndex === 1 &&
      testSystem.history[4].changeIndex === 5 &&
      testSystem.history.every(h => !!h.timestamp && !!h.previousConfiguration && !!h.newConfiguration);

    log('Customization History Log (5 Authoritative Records)',
      historyValid,
      `HistoryEntries: ${testSystem.history.length}, FirstChange: ${testSystem.history[0].previousConfiguration.outfitId} -> ${testSystem.history[0].newConfiguration.outfitId}`);

    // -------------------------------------------------------------
    // TEST 12: Invalid Outfit Rejection
    // -------------------------------------------------------------
    const invalidCheck = testSystem.validatePlayerCustomization({ outfitId: 'fantasy_space_armor_999' });
    const invalidRejected = invalidCheck.valid === false && invalidCheck.errors.some(e => e.includes('Invalid outfit ID'));

    log('Data Validation (Invalid Outfit Rejection)',
      invalidRejected,
      `Rejected: ${invalidRejected}, Errors: ${invalidCheck.errors.join(', ')}`);

    // -------------------------------------------------------------
    // TEST 13: Save / Restore Persistence & Clamping
    // -------------------------------------------------------------
    const serialized = testSystem.serialize();
    const isSerializedCorrect = serialized.customizationChangesUsed === 5 && serialized.maxCustomizationChanges === 5;

    // Test corrupted counter clamping (e.g. hack attempting 99 changes or -5)
    const hackHigh = { ...serialized, customizationChangesUsed: 99 };
    const testHighSystem = new window.PlayerCustomizationSystem(config);
    testHighSystem.deserialize(hackHigh);
    const clampedHigh = testHighSystem.customizationChangesUsed === 5;

    const hackLow = { ...serialized, customizationChangesUsed: -10 };
    const testLowSystem = new window.PlayerCustomizationSystem(config);
    testLowSystem.deserialize(hackLow);
    const clampedLow = testLowSystem.customizationChangesUsed === 0;

    log('Save / Restore Persistence & Strict Counter Clamping [0, 5]',
      isSerializedCorrect && clampedHigh && clampedLow,
      `Serialized: ${isSerializedCorrect}, ClampedHigh(99->5): ${clampedHigh}, ClampedLow(-10->0): ${clampedLow}`);

    // -------------------------------------------------------------
    // TEST 14: Deliberate New Game Reset
    // -------------------------------------------------------------
    testSystem.resetForNewGame();
    const resetValid = testSystem.customizationChangesUsed === 0 &&
      testSystem.getRemainingChanges() === 5 &&
      testSystem.canCustomize() === true &&
      testSystem.history.length === 0;

    log('New Game Reset (Strict Counter Cleared to 0/5)',
      resetValid,
      `UsedAfterReset: ${testSystem.customizationChangesUsed}/5, Remaining: ${testSystem.getRemainingChanges()}, HistoryCleared: ${testSystem.history.length === 0}`);

  } catch (err) {
    log('Player Customization Test Suite Error', false, err.message);
  }

  const allPassed = results.every(r => r.passed);
  console.log(`>>> PLAYER CUSTOMIZATION TEST SUITE ${allPassed ? 'ALL PASSED' : 'HAS FAILURES'} <<<`);

  return {
    passed: allPassed,
    results: results
  };
};
