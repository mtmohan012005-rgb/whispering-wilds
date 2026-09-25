/**
 * tests/core/test-runtime-validator.js
 * Unit tests for RuntimeValidator self-healing, bounds checking,
 * and absolute 5-customization-changes ceiling enforcement.
 */

(function () {
  'use strict';

  function runTestRuntimeValidator() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const rv = window.RuntimeValidator;
    assert('RuntimeValidator is loaded and instantiated', !!rv);

    // Test 1: NaN coordinates repaired
    const badPlayer = {
      x: NaN, y: -100, z: Infinity,
      health: 120, energy: -5,
      currency: -50,
      customizationChangesUsed: 8
    };

    const valRes = rv.validatePlayer(badPlayer, true);
    assert('Detected invalid player coordinates, health, currency, customization', valRes.valid === false);
    assert('Repaired NaN coordinates to safe finite values', Number.isFinite(badPlayer.x) && Number.isFinite(badPlayer.z));
    assert('Clamped health to 100 max', badPlayer.health === 100);
    assert('Clamped energy to 0 min', badPlayer.energy === 0);
    assert('Restored negative currency to 0', badPlayer.currency === 0);
    assert('Clamped customizationChangesUsed to absolute 5 max ceiling', badPlayer.customizationChangesUsed === 5);

    // Test 2: Valid player passes cleanly
    const goodPlayer = {
      x: 100, y: 5, z: 200,
      health: 85, energy: 90,
      currency: 250,
      customizationChangesUsed: 3
    };
    const goodRes = rv.validatePlayer(goodPlayer, false);
    assert('Valid player passes without errors', goodRes.valid === true && goodRes.errors.length === 0);

    // Test 3: Save payload size limit protection
    const hugePayload = 'A'.repeat(6 * 1024 * 1024);
    const saveCheck = rv.validateSavePayload(hugePayload);
    assert('Rejects oversized save payloads (>5MB)', saveCheck.valid === false);

    return results;
  }

  window.runTestRuntimeValidator = runTestRuntimeValidator;
})();
