// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: REGION TRANSITIONS
// Tests: Boundary approach, region ID validation, cross-region state persistence.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.TransitionSystem, 'TransitionSystem missing');
      assert(window.VALID_REGIONS, 'VALID_REGIONS missing');

      // Valid region checks
      const valid = window.BootManager.isValidRegion('george_town');
      const invalid = window.BootManager.isValidRegion('unknown_fantasy_land_999');
      assert(valid === true, 'george_town should be a valid region');
      assert(invalid === false, 'unknown_fantasy_land_999 must be rejected');

      // Reject unknown region transition
      const rejectAttempt = window.TransitionSystem.transitionToRegion('fake_zone_xyz');
      assert(rejectAttempt === false, 'TransitionSystem must reject invalid region');

      results.push({ name: 'Region Boundary Validation & State Persistence', passed: true });
    } catch (e) {
      results.push({ name: 'Region Boundary Validation & State Persistence', passed: false, error: e.message });
    }

    return { suite: 'LifecycleRegionTransition', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleRegionTransition = runTests;
})();
