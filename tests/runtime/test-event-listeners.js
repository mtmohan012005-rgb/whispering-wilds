/**
 * tests/runtime/test-event-listeners.js
 * Verifies EventListenerRegistry duplicate listener prevention,
 * owner-based tracking, and mass cleanup.
 */

(function () {
  'use strict';

  function runTestEventListeners() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const elr = window.EventListenerRegistry;
    assert('EventListenerRegistry is instantiated', !!elr);

    const dummyTarget = document.createElement('div');
    const handler = () => {};

    // Test 1: Register listener under owner 'dialogue_modal'
    const added1 = elr.addEventListener(dummyTarget, 'click', handler, false, 'dialogue_modal');
    assert('Listener successfully registered under owner', added1 === true);

    // Test 2: Prevent duplicate registration by same owner
    const added2 = elr.addEventListener(dummyTarget, 'click', handler, false, 'dialogue_modal');
    assert('Duplicate listener registration blocked', added2 === false);

    // Test 3: Cleanup by owner
    const removedCount = elr.cleanupByOwner('dialogue_modal');
    assert('Cleaned up listener by owner', removedCount === 1);
    assert('No listeners remaining for dialogue_modal', elr.getCountByOwner('dialogue_modal') === 0);

    return results;
  }

  window.runTestEventListeners = runTestEventListeners;
})();
