/**
 * tests/launcher/test-offline.js
 * Verifies that the launcher allows launching the installed game
 * when update services or internet connectivity are unavailable.
 */

(function () {
  'use strict';

  function runTestLauncherOffline() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const LauncherState = window.LauncherState;
    const LauncherUI = window.LauncherUI;
    const VersionManager = window.VersionManager;

    assert('LauncherState and LauncherUI are loaded', !!LauncherState && !!LauncherUI);

    const state = new LauncherState();
    const ui = new LauncherUI(state);
    const vm = new VersionManager();

    // 1. Installed game is present
    state.installedVersion = '1.2.0';

    // 2. Remote update check fails (network offline / server down)
    const remoteManifest = null;
    const updateEval = vm.evaluateUpdateRequirement(state.installedVersion, remoteManifest);

    assert('Update evaluation gracefully handles missing remote manifest', updateEval.type === 'NONE');

    // 3. User can still transition to READY_TO_PLAY and launch offline
    state.transitionTo('READY_TO_PLAY', { offline: true });
    assert('State transitions to READY_TO_PLAY in offline mode', state.currentState === 'READY_TO_PLAY');

    // 4. Offline message is clear and non-alarmist
    const offlineMsg = ui.t('offlineAlert');
    assert('Offline status alert message is available', typeof offlineMsg === 'string' && offlineMsg.length > 0);

    return results;
  }

  window.runTestLauncherOffline = runTestLauncherOffline;
})();
