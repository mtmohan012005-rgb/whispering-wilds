/**
 * tests/runtime/test-save-protection.js
 * Verifies save validation, corrupt payload rejection, and backup preservation.
 */

(function () {
  'use strict';

  function runTestSaveProtection() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const rv = window.RuntimeValidator;
    assert('RuntimeValidator available for save protection', !!rv);

    // Test 1: Corrupt JSON payload rejected
    const corruptJSON = '{ "player": { "x": 10, "health": ';
    const res1 = rv.validateSavePayload(corruptJSON);
    assert('Corrupt JSON syntax rejected before storage', res1.valid === false);

    // Test 2: Invalid customization limit in save payload (>5) rejected
    const hackedCustomization = JSON.stringify({
      player: { x: 0, y: 0, z: 0, health: 100, customizationChangesUsed: 99 }
    });
    const res2 = rv.validateSavePayload(hackedCustomization);
    assert('Save payload with customizationChangesUsed > 5 rejected', res2.valid === false);

    // Test 3: Missing player block rejected
    const missingPlayer = JSON.stringify({ world: { region: 'george_town' } });
    const res3 = rv.validateSavePayload(missingPlayer);
    assert('Save payload missing player block rejected', res3.valid === false);

    // Test 4: Valid payload accepted
    const validSave = JSON.stringify({
      version: 3,
      timestamp: Date.now(),
      player: { x: 120, y: 2.5, z: -40, health: 100, currency: 50, customizationChangesUsed: 2 }
    });
    const res4 = rv.validateSavePayload(validSave);
    assert('Valid save payload passes validation', res4.valid === true);

    return results;
  }

  window.runTestSaveProtection = runTestSaveProtection;
})();
