/**
 * tests/core/test-lifecycle-validator.js
 * Unit tests for LifecycleValidator transition rules and watchdogs.
 */

(function () {
  'use strict';

  function runTestLifecycleValidator() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const lv = window.LifecycleValidator;
    assert('LifecycleValidator is loaded', !!lv);

    // Test 1: Legal transitions
    assert('MAIN_MENU -> LOADING_GAME is allowed', lv.canTransition('MAIN_MENU', 'LOADING_GAME') === true);
    assert('LOADING_GAME -> PLAYING is allowed', lv.canTransition('LOADING_GAME', 'PLAYING') === true);
    assert('PLAYING -> PAUSED is allowed', lv.canTransition('PLAYING', 'PAUSED') === true);
    assert('PAUSED -> PLAYING is allowed', lv.canTransition('PAUSED', 'PLAYING') === true);

    // Test 2: Illegal transitions
    assert('BOOT -> PLAYING directly is blocked', lv.canTransition('BOOT', 'PLAYING') === false);
    assert('EXITING -> PLAYING is blocked', lv.canTransition('EXITING', 'PLAYING') === false);

    // Test 3: Save watchdog concurrent protection
    const firstSave = lv.startSaveWatchdog();
    assert('First save acquisition succeeds', firstSave === true);
    const concurrentSave = lv.startSaveWatchdog();
    assert('Concurrent save acquisition is blocked by SaveWatchdog', concurrentSave === false);
    lv.completeSaveWatchdog();
    assert('SaveWatchdog resets after completion', lv.isSaveInProgress() === false);

    return results;
  }

  window.runTestLifecycleValidator = runTestLifecycleValidator;
})();
