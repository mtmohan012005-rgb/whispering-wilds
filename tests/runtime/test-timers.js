/**
 * tests/runtime/test-timers.js
 * Verifies TimerRegistry timer tracking and owner-scoped cleanup.
 */

(function () {
  'use strict';

  function runTestTimers() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const tr = window.TimerRegistry;
    assert('TimerRegistry is instantiated', !!tr);

    // Test 1: Register timeout and interval under 'region_delta'
    const t1 = tr.setTimeout(() => {}, 5000, 'region_delta', 'weather_shift');
    const t2 = tr.setInterval(() => {}, 1000, 'region_delta', 'river_ambient_pulse');

    assert('Timeout registered with valid id', typeof t1 === 'number');
    assert('Interval registered with valid id', typeof t2 === 'number');
    assert('Owner region_delta has 2 active timers', tr.getActiveTimerCount('region_delta') === 2);

    // Test 2: Cleanup by owner
    const cleaned = tr.cleanupByOwner('region_delta');
    assert('Cleaned up 2 timers for region_delta', cleaned === 2);
    assert('Owner region_delta has 0 active timers after cleanup', tr.getActiveTimerCount('region_delta') === 0);

    return results;
  }

  window.runTestTimers = runTestTimers;
})();
