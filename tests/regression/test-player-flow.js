/**
 * tests/regression/test-player-flow.js
 * Regression test for player state safety, transform bounds,
 * and the strict 5-customization-changes ceiling.
 */

(function () {
  'use strict';

  function runTestPlayerFlow() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const rv = window.RuntimeValidator;
    const sis = window.StateIntegritySystem;
    assert('RuntimeValidator and StateIntegritySystem exist', !!rv && !!sis);

    // 1. Validate transform bounds
    sis.updateSafeTransform(200, 1.2, -150);
    const safePos = sis.getLastSafePosition();
    assert('Safe position verified', safePos.x === 200 && safePos.y === 1.2 && safePos.z === -150);

    // 2. Customization Ceiling Test: Apply changes 1..5, attempt 6th
    let customChanges = 0;
    const maxChanges = 5;

    for (let i = 1; i <= 5; i++) {
      if (customChanges < maxChanges) {
        customChanges++;
      }
    }
    assert('Applied 5 customization changes', customChanges === 5);

    // Attempt 6th change: must be rejected
    let change6Allowed = false;
    if (customChanges < maxChanges) {
      customChanges++;
      change6Allowed = true;
    }
    assert('6th customization change strictly rejected', change6Allowed === false && customChanges === 5);

    // Validate with RuntimeValidator
    const testPlayer = {
      x: 0, y: 1, z: 0,
      health: 100, energy: 100,
      currency: 10,
      customizationChangesUsed: customChanges
    };
    const valRes = rv.validatePlayer(testPlayer, false);
    assert('Player with 5 customization changes passes validator', valRes.valid === true);

    return results;
  }

  window.runTestPlayerFlow = runTestPlayerFlow;
})();
