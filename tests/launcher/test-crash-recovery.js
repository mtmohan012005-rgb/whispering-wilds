/**
 * tests/launcher/test-crash-recovery.js
 * Verifies crash loop detection (repeated crashes immediately after launch)
 * and Safe Mode recommendation.
 */

(function () {
  'use strict';

  function runTestLauncherCrashRecovery() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const LauncherState = window.LauncherState;
    const LauncherUI = window.LauncherUI;
    assert('LauncherState and LauncherUI loaded for crash tests', !!LauncherState && !!LauncherUI);

    const state = new LauncherState();
    const ui = new LauncherUI(state);

    // Initial state: 0 crashes
    assert('Initial crash count is 0', state.consecutiveCrashes === 0);
    assert('Not in crash loop initially', state.isCrashLoop() === false);

    // Crash 1: launch and exit with error code 1 within 5 seconds
    state.recordLaunch(1001);
    state.recordGameExit(1);
    assert('Consecutive crash count is 1', state.consecutiveCrashes === 1);
    assert('Crash loop not triggered at 1 crash', state.isCrashLoop() === false);

    // Crash 2
    state.recordLaunch(1002);
    state.recordGameExit(1);
    assert('Consecutive crash count is 2', state.consecutiveCrashes === 2);

    // Crash 3: Hits threshold (3)
    state.recordLaunch(1003);
    state.recordGameExit(1);
    assert('Consecutive crash count is 3', state.consecutiveCrashes === 3);
    assert('Crash loop state detected after 3 crashes', state.isCrashLoop() === true);

    // UI recommendation check
    const rec = ui.checkCrashRecoveryRecommendation();
    assert('UI triggers crash recovery recommendation', rec.recommended === true);
    assert('Recommended options include SAFE_MODE and VERIFY_FILES', rec.options.includes('SAFE_MODE') && rec.options.includes('VERIFY_FILES'));

    // Safe mode launch arguments
    const launchArgs = ui.getLaunchArguments(true);
    assert('Safe mode arguments include --safe-mode and --windowed', launchArgs.safeMode === true && launchArgs.args.includes('--safe-mode') && launchArgs.args.includes('--windowed'));

    // Reset crash count after safe recovery
    state.resetCrashCount();
    assert('Crash count reset to 0 after recovery', state.consecutiveCrashes === 0 && state.isCrashLoop() === false);

    return results;
  }

  window.runTestLauncherCrashRecovery = runTestLauncherCrashRecovery;
})();
