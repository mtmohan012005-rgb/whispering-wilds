/**
 * tests/runtime/test-render-loops.js
 * Verifies single authoritative RAF render loop enforcement
 * and duplicate render loop prevention.
 */

(function () {
  'use strict';

  function runTestRenderLoops() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const rlr = window.RenderLoopRegistry;
    assert('RenderLoopRegistry is instantiated', !!rlr);

    let loop1Calls = 0;
    const loop1 = (t) => { loop1Calls++; };
    const loop2 = (t) => {};

    // Test 1: Register and start authoritative loop
    rlr.registerLoop('main_gameplay_loop', 'engine', loop1);
    const start1 = rlr.startLoop('main_gameplay_loop');
    assert('Authoritative loop started successfully', start1 === true);
    assert('Registry indicates active render loop', rlr.hasActiveLoop() === true);
    assert('Active loop matches main_gameplay_loop', rlr.getActiveLoopId() === 'main_gameplay_loop');

    // Test 2: Duplicate render loop blocked
    rlr.registerLoop('duplicate_secondary_loop', 'rogue_subsystem', loop2);
    const start2 = rlr.startLoop('duplicate_secondary_loop');
    assert('Secondary concurrent loop start is strictly blocked', start2 === false);
    assert('Authoritative loop remains main_gameplay_loop', rlr.getActiveLoopId() === 'main_gameplay_loop');

    // Test 3: Stop active loop
    const stopped = rlr.stopLoop('main_gameplay_loop');
    assert('Authoritative loop stopped cleanly', stopped === true);
    assert('Registry indicates no active loop', rlr.hasActiveLoop() === false);

    return results;
  }

  window.runTestRenderLoops = runTestRenderLoops;
})();
