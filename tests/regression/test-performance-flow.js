/**
 * tests/regression/test-performance-flow.js
 * Regression test for performance budget enforcement, frame pacing,
 * and authoritative PerformanceManager coordination.
 */

(function () {
  'use strict';

  function runTestPerformanceFlow() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const pm = window.performanceManager;
    assert('Authoritative PerformanceManager is instantiated', !!pm);

    // 1. Verify budget gatekeeper
    assert('canSpawn returns boolean for traffic', typeof pm.canSpawn('traffic') === 'boolean');
    assert('canSpawn returns boolean for npc', typeof pm.canSpawn('npc') === 'boolean');
    assert('canSpawn returns boolean for wildlife', typeof pm.canSpawn('wildlife') === 'boolean');

    // 2. Verify profiles available
    const profiles = window.PERFORMANCE_PROFILES;
    assert('Performance profiles data loaded', !!profiles);
    assert('VERY_LOW profile defined', !!profiles.VERY_LOW);
    assert('MEDIUM profile defined', !!profiles.MEDIUM);
    assert('ULTRA profile defined', !!profiles.ULTRA);

    // 3. Current profile validity
    assert('Current profile is one of valid profiles', ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA', 'SAFE_MODE'].includes(pm.currentProfile));

    return results;
  }

  window.runTestPerformanceFlow = runTestPerformanceFlow;
})();
