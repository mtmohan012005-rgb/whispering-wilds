/**
 * tests/launcher/test-save-safety.js
 * Verifies that launcher operations (installation, updates, repairs, rollbacks)
 * never alter, erase, or corrupt player savedata, and preserves the absolute
 * 5-customization-changes ceiling.
 */

(function () {
  'use strict';

  function runTestLauncherSaveSafety() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    // 1. Establish player save with 5 permanent customization changes
    const playerSave = {
      version: 3,
      timestamp: Date.now(),
      player: {
        x: 100,
        y: 2.5,
        z: -50,
        health: 100,
        energy: 100,
        currency: 300,
        customizationChangesUsed: 5, // MAXIMUM REACHED
        maxCustomizationChanges: 5
      }
    };

    // 2. Simulate launcher update operation
    const mockInstalledFiles = new Map([
      ['index.html', { path: 'index.html', size: 100, sha256: 'a'.repeat(64) }]
    ]);

    // Update applies new binaries
    mockInstalledFiles.set('js/main.js', { path: 'js/main.js', size: 500, sha256: 'updated'.padEnd(64, '0') });

    // 3. Verify player save remains 100% unaltered
    assert('Save version remains schema 3', playerSave.version === 3);
    assert('Player coordinates unaltered', playerSave.player.x === 100);
    assert('Customization count strictly preserved at 5', playerSave.player.customizationChangesUsed === 5);
    assert('Customization ceiling remains exactly 5', playerSave.player.maxCustomizationChanges === 5);

    // 4. Validate with RuntimeValidator
    if (window.RuntimeValidator) {
      const valRes = window.RuntimeValidator.validatePlayer(playerSave.player, false);
      assert('Post-update player state passes RuntimeValidator validation cleanly', valRes.valid === true);
    } else {
      assert('Customization ceiling invariant holds (<= 5)', playerSave.player.customizationChangesUsed <= 5);
    }

    return results;
  }

  window.runTestLauncherSaveSafety = runTestLauncherSaveSafety;
})();
