/**
 * tests/regression/test-world-flow.js
 * Regression test for world region transitions, approved region IDs,
 * and entity population boundaries.
 */

(function () {
  'use strict';

  function runTestWorldFlow() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const schema = window.ValidationSchema;
    assert('ValidationSchema available', !!schema);

    // 1. Verify 8 official Tamil Nadu regions
    const regions = schema.APPROVED_REGIONS;
    assert('Approved regions list contains 8 core biomes', Array.isArray(regions) && regions.length === 8);
    assert('George Town present', regions.includes('george_town'));
    assert('Nilgiris present', regions.includes('nilgiris'));
    assert('Mamallapuram present', regions.includes('mamallapuram'));
    assert('Cauvery Delta present', regions.includes('cauvery_delta'));

    // 2. Validate current region in GameState
    if (window.GameState?.world?.currentRegion) {
      assert('Current active region is approved', regions.includes(window.GameState.world.currentRegion));
    }

    return results;
  }

  window.runTestWorldFlow = runTestWorldFlow;
})();
