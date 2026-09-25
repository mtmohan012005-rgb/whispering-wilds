/**
 * tests/core/test-state-integrity.js
 * Unit tests for StateIntegritySystem safe position tracking,
 * zero-reward duplication, and interaction distance limits.
 */

(function () {
  'use strict';

  function runTestStateIntegrity() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const sis = window.StateIntegritySystem;
    assert('StateIntegritySystem is loaded', !!sis);

    // Test 1: Update safe transform and retrieve
    sis.updateSafeTransform(150, 4.2, -80, 1.57);
    const safePos = sis.getLastSafePosition();
    assert('Stored valid safe position accurately', safePos.x === 150 && safePos.y === 4.2 && safePos.z === -80);

    // Test 2: Reject NaN transform update
    sis.updateSafeTransform(NaN, 10, 20);
    const safePosAfterNaN = sis.getLastSafePosition();
    assert('Rejected NaN position update and retained prior safe coordinates', safePosAfterNaN.x === 150);

    // Test 3: Zero-Reward Duplication
    const q1 = sis.claimQuestReward('quest_chola_secret', 'ancient_coin');
    assert('First reward claim succeeds', q1.granted === true);
    const q2 = sis.claimQuestReward('quest_chola_secret', 'ancient_coin');
    assert('Duplicate reward claim is strictly rejected', q2.granted === false && q2.reason === 'DUPLICATE_CLAIM');

    // Test 4: Interaction Distance Bounds
    const nearInt = sis.validateInteraction({ x: 10, y: 0, z: 10 }, { x: 12, y: 0, z: 11 });
    assert('Nearby interaction (< 6m) allowed', nearInt.valid === true);
    const farInt = sis.validateInteraction({ x: 10, y: 0, z: 10 }, { x: 50, y: 0, z: 50 });
    assert('Distant interaction (> 6m) rejected as OUT_OF_RANGE', farInt.valid === false && farInt.reason === 'OUT_OF_RANGE');

    // Test 5: Safe Currency Deduction
    const afterDeduct = sis.safelyUpdateCurrency(100, -30);
    assert('Valid deduction updates balance correctly', afterDeduct === 70);
    const overDeduct = sis.safelyUpdateCurrency(70, -150);
    assert('Over-deduction (negative balance) rejected and balance preserved', overDeduct === 70);

    return results;
  }

  window.runTestStateIntegrity = runTestStateIntegrity;
})();
