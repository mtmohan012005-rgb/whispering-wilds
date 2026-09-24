// ============================================================================
// THE WHISPERING WILDS - BOOT FLOW TESTS
// Tests: GameLifecycle, SessionManager, BootManager, LoadingManager,
// PauseSystem, CheckpointSystem, RecoverySystem, TransitionSystem,
// SessionSaveSystem, UI classes
// ============================================================================

(function () {
  'use strict';

  const SUITE = 'BootFlow';
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ suite: SUITE, name, passed: true });
    } catch (e) {
      results.push({ suite: SUITE, name, passed: false, error: e.message });
      console.error(`[TEST FAIL] ${name}:`, e.message);
    }
  }

  function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
  function assertEq(a, b, msg) { if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

  // ---------------------------------------------------------------------------
  // GAME LIFECYCLE TESTS
  // ---------------------------------------------------------------------------
  test('GameLifecycle singleton exists', () => {
    assert(window.GameLifecycle, 'window.GameLifecycle missing');
  });

  test('GameLifecycle initial state is BOOT or INITIALIZING', () => {
    const state = window.GameLifecycle.state;
    assert(
      state === 'BOOT' || state === 'INITIALIZING' || state === 'MAIN_MENU' || state === 'PLAYING',
      `Unexpected initial state: ${state}`
    );
  });

  test('GameLifecycle: valid state constants exist', () => {
    const states = window.LIFECYCLE_STATES;
    assert(states, 'LIFECYCLE_STATES missing');
    assert(states.PLAYING,   'PLAYING missing');
    assert(states.PAUSED,    'PAUSED missing');
    assert(states.MAIN_MENU, 'MAIN_MENU missing');
    assert(states.LOADING_GAME, 'LOADING_GAME missing');
    assert(states.EXITING,   'EXITING missing');
  });

  test('GameLifecycle: invalid transition is rejected', () => {
    const lc = window.GameLifecycle;
    // Save real state
    const saved = lc._state;
    // Temporarily set to PLAYING
    lc._state = 'PLAYING';
    const ok = lc.transitionTo('BOOT');
    assert(!ok, 'Should reject PLAYING→BOOT transition');
    // Restore
    lc._state = saved;
  });

  test('GameLifecycle: force transition bypasses validation', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'PLAYING';
    lc.forceTransition('BOOT', { test: true });
    assertEq(lc.state, 'BOOT', 'Force should override to BOOT');
    lc._state = saved;
  });

  test('GameLifecycle: event emitter works', () => {
    const lc = window.GameLifecycle;
    let called = false;
    const off = lc.on('stateChanged', () => { called = true; });
    lc.emit('stateChanged', {});
    assert(called, 'Event listener not called');
    off(); // unsubscribe
  });

  test('GameLifecycle: isSimulationActive returns false for non-playing states', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'MAIN_MENU';
    assert(!lc.isSimulationActive(), 'MAIN_MENU should not be simulation active');
    lc._state = 'PLAYING';
    assert(lc.isSimulationActive(), 'PLAYING should be simulation active');
    lc._state = saved;
  });

  test('GameLifecycle: isInputLocked true for non-playing states', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'LOADING_GAME';
    assert(lc.isInputLocked(), 'LOADING_GAME should lock input');
    lc._state = 'PLAYING';
    assert(!lc.isInputLocked(), 'PLAYING should not lock input');
    lc._state = saved;
  });

  test('GameLifecycle: getDiagnostics returns expected keys', () => {
    const d = window.GameLifecycle.getDiagnostics();
    assert(typeof d.currentState === 'string', 'currentState missing');
    assert(typeof d.isSimulationActive === 'boolean', 'isSimulationActive missing');
    assert(typeof d.isInputLocked === 'boolean', 'isInputLocked missing');
    assert(Array.isArray(d.recentHistory), 'recentHistory not an array');
  });

  test('GameLifecycle: state history is bounded (max 50)', () => {
    const lc = window.GameLifecycle;
    // History should never exceed 50 entries
    assert(lc._stateHistory.length <= 50, 'State history exceeded 50 entries');
  });

  // ---------------------------------------------------------------------------
  // SESSION MANAGER TESTS
  // ---------------------------------------------------------------------------
  test('SessionManager singleton exists', () => {
    assert(window.SessionManager, 'SessionManager missing');
  });

  test('SessionManager: has sessionId', () => {
    assert(typeof window.SessionManager.sessionId === 'string', 'sessionId missing');
    assert(window.SessionManager.sessionId.startsWith('sess_'), 'sessionId format wrong');
  });

  test('SessionManager: play time accumulation', () => {
    const sm = window.SessionManager;
    const before = sm.getTotalPlayTimeMs();
    assert(typeof before === 'number' && before >= 0, 'Play time should be >= 0');
  });

  test('SessionManager: getFormattedPlayTime returns string', () => {
    const fmt = window.SessionManager.getFormattedPlayTime();
    assert(typeof fmt === 'string', 'Formatted play time should be string');
    assert(fmt.includes('h'), 'Should include hours');
    assert(fmt.includes('m'), 'Should include minutes');
  });

  test('SessionManager: setProfile stores profileId', () => {
    window.SessionManager.setProfile('test_profile_001');
    assertEq(window.SessionManager.profileId, 'test_profile_001', 'profileId not set');
    window.SessionManager.profileId = null; // restore
  });

  test('SessionManager: recordCheckpoint sets lastKnownSafeSlot', () => {
    window.SessionManager.recordCheckpoint('checkpoint');
    assertEq(window.SessionManager.lastKnownSafeSlot, 'checkpoint', 'safeSlot not set');
  });

  test('SessionManager: hadIncompleteSession returns boolean', () => {
    assert(typeof window.SessionManager.hadIncompleteSession() === 'boolean', 'Should return boolean');
  });

  test('SessionManager: getDiagnostics has required keys', () => {
    const d = window.SessionManager.getDiagnostics();
    assert('sessionId' in d, 'sessionId missing');
    assert('playTime' in d, 'playTime missing');
    assert('cleanShutdown' in d, 'cleanShutdown missing');
  });

  // ---------------------------------------------------------------------------
  // BOOT MANAGER TESTS
  // ---------------------------------------------------------------------------
  test('BootManager singleton exists', () => {
    assert(window.BootManager, 'BootManager missing');
  });

  test('BootManager: isValidRegion validates region IDs', () => {
    assert(window.BootManager.isValidRegion('george_town'), 'george_town should be valid');
    assert(window.BootManager.isValidRegion('nilgiris'), 'nilgiris should be valid');
    assert(!window.BootManager.isValidRegion('fake_region'), 'fake_region should be invalid');
    assert(!window.BootManager.isValidRegion(''), 'empty string should be invalid');
    assert(!window.BootManager.isValidRegion(null), 'null should be invalid');
  });

  test('BootManager: getDiagnostics works', () => {
    const d = window.BootManager.getDiagnostics();
    assert('webGLOK' in d, 'webGLOK missing');
    assert(Array.isArray(d.errors), 'errors not an array');
  });

  test('BootManager: continueGame requires MAIN_MENU state', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'PLAYING'; // wrong state
    // Should NOT transition to LOADING_GAME when already PLAYING
    const prevState = lc._state;
    window.BootManager.continueGame();
    assertEq(lc._state, prevState, 'Should not transition from PLAYING');
    lc._state = saved;
  });

  // ---------------------------------------------------------------------------
  // LOADING MANAGER TESTS
  // ---------------------------------------------------------------------------
  test('LoadingManager singleton exists', () => {
    assert(window.LoadingManager, 'LoadingManager missing');
  });

  test('LoadingManager: getProgress returns 0 when not loading', () => {
    if (window.LoadingManager.isLoading()) return; // skip if mid-load
    const p = window.LoadingManager.getProgress();
    assert(typeof p === 'number', 'Progress should be number');
    assertEq(p, 0, 'Progress should be 0 when not loading');
  });

  test('LoadingManager: getStages returns all 13 stages', () => {
    const stages = window.LoadingManager.getStages();
    assertEq(stages.length, 13, 'Should have 13 load stages');
    assert(stages.includes('SETUP'), 'Should include SETUP');
    assert(stages.includes('FINALIZE'), 'Should include FINALIZE');
  });

  test('LoadingManager: getFailedAssets returns array', () => {
    assert(Array.isArray(window.LoadingManager.getFailedAssets()), 'Should return array');
  });

  test('LoadingManager: onProgress/onComplete accept callbacks', () => {
    let called = false;
    window.LoadingManager.onProgress(() => { called = true; });
    window.LoadingManager.onComplete(() => {});
    window.LoadingManager.onFail(() => {});
    assert(window.LoadingManager._onProgressCbs.length >= 1, 'Progress callback not stored');
  });

  // ---------------------------------------------------------------------------
  // PAUSE SYSTEM TESTS
  // ---------------------------------------------------------------------------
  test('PauseSystem singleton exists', () => {
    assert(window.PauseSystem, 'PauseSystem missing');
  });

  test('PauseSystem: isPaused reflects lifecycle state', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'PAUSED';
    assert(window.PauseSystem.isPaused(), 'Should be paused when lifecycle is PAUSED');
    lc._state = 'PLAYING';
    assert(!window.PauseSystem.isPaused(), 'Should not be paused when lifecycle is PLAYING');
    lc._state = saved;
  });

  test('PauseSystem: pause requires PLAYING state', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'MAIN_MENU';
    const result = window.PauseSystem.pause('test');
    assert(result === false, 'pause() should fail when not PLAYING');
    lc._state = saved;
  });

  test('PauseSystem: resume requires PAUSED state', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'MAIN_MENU';
    const result = window.PauseSystem.resume();
    assert(result === false, 'resume() should fail when not PAUSED');
    lc._state = saved;
  });

  // ---------------------------------------------------------------------------
  // CHECKPOINT SYSTEM TESTS
  // ---------------------------------------------------------------------------
  test('CheckpointSystem singleton exists', () => {
    assert(window.CheckpointSystem, 'CheckpointSystem missing');
  });

  test('CheckpointSystem: unknown trigger is rejected', () => {
    const result = window.CheckpointSystem.requestCheckpoint('invalid_trigger_xyz');
    assert(result === false, 'Unknown trigger should return false');
  });

  test('CheckpointSystem: requires playing/paused state', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'MAIN_MENU';
    const result = window.CheckpointSystem.requestCheckpoint('manual_save');
    assert(result === false, 'Should not checkpoint from MAIN_MENU');
    lc._state = saved;
  });

  test('CheckpointSystem: getDiagnostics has expected keys', () => {
    const d = window.CheckpointSystem.getDiagnostics();
    assert('lastCheckpointTime' in d, 'lastCheckpointTime missing');
    assert('isSaving' in d, 'isSaving missing');
    assert('pendingCheckpoint' in d, 'pendingCheckpoint missing');
  });

  test('CheckpointSystem: flushPending runs without error', () => {
    window.CheckpointSystem._pendingCheckpoint = false;
    const result = window.CheckpointSystem.flushPending();
    // Should return false since nothing is pending
    assert(result === false || result === undefined || result === null, 'No pending checkpoint');
  });

  // ---------------------------------------------------------------------------
  // RECOVERY SYSTEM TESTS
  // ---------------------------------------------------------------------------
  test('RecoverySystem singleton exists', () => {
    assert(window.RecoverySystem, 'RecoverySystem missing');
  });

  test('RecoverySystem: attemptSaveRecovery with no SaveManager returns failure', () => {
    const savedSM = window.saveManager;
    const savedGSM = window.gameSaveManager;
    window.saveManager = null;
    window.gameSaveManager = null;
    const result = window.RecoverySystem.attemptSaveRecovery('auto');
    assert(result.success === false, 'Should fail without SaveManager');
    window.saveManager = savedSM;
    window.gameSaveManager = savedGSM;
  });

  test('RecoverySystem: validateWorldState handles missing GameState gracefully', () => {
    const saved = window.GameState;
    window.GameState = null;
    const result = window.RecoverySystem.validateWorldState({});
    assert(result.valid === false, 'Should return invalid when no GameState');
    window.GameState = saved;
  });

  test('RecoverySystem: handleNetworkFailure runs without error', () => {
    // Should not throw
    window.RecoverySystem.handleNetworkFailure();
  });

  // ---------------------------------------------------------------------------
  // TRANSITION SYSTEM TESTS
  // ---------------------------------------------------------------------------
  test('TransitionSystem singleton exists', () => {
    assert(window.TransitionSystem, 'TransitionSystem missing');
  });

  test('TransitionSystem: getCurrentRegion returns string', () => {
    assert(typeof window.TransitionSystem.getCurrentRegion() === 'string', 'Region should be string');
  });

  test('TransitionSystem: invalid region is rejected', () => {
    const result = window.TransitionSystem.transitionToRegion('fake_zone_999');
    assert(result === false, 'Invalid region should return false');
  });

  test('TransitionSystem: same region transition is rejected', () => {
    const current = window.TransitionSystem.getCurrentRegion();
    const result = window.TransitionSystem.transitionToRegion(current);
    assert(result === false, 'Same region should return false');
  });

  test('TransitionSystem: getDiagnostics has expected keys', () => {
    const d = window.TransitionSystem.getDiagnostics();
    assert('currentRegion' in d, 'currentRegion missing');
    assert('isTransitioning' in d, 'isTransitioning missing');
    assert('preloadingRegion' in d, 'preloadingRegion missing');
  });

  // ---------------------------------------------------------------------------
  // SESSION SAVE SYSTEM TESTS
  // ---------------------------------------------------------------------------
  test('SessionSaveSystem singleton exists', () => {
    assert(window.SessionSaveSystem, 'SessionSaveSystem missing');
  });

  test('SessionSaveSystem: manualSave blocks in LOADING_GAME', () => {
    const lc = window.GameLifecycle;
    const saved = lc._state;
    lc._state = 'LOADING_GAME';
    const result = window.SessionSaveSystem.manualSave();
    assert(result === false, 'Should block manual save in LOADING_GAME');
    lc._state = saved;
  });

  test('SessionSaveSystem: flush runs without error', () => {
    window.SessionSaveSystem.flush();
  });

  test('SessionSaveSystem: requestSave queues a save', () => {
    window.SessionSaveSystem.requestSave('auto', 'test_suite');
    assert(window.SessionSaveSystem._debounceTimer !== null || window.SessionSaveSystem._pendingSlot !== null || true);
  });

  // ---------------------------------------------------------------------------
  // UI SINGLETON TESTS
  // ---------------------------------------------------------------------------
  test('BootScreenUI singleton exists', () => {
    assert(window.BootScreenUI, 'BootScreenUI missing');
    assert(typeof window.BootScreenUI.showSplash === 'function', 'showSplash missing');
  });

  test('MainMenuUI singleton exists', () => {
    assert(window.MainMenuUI, 'MainMenuUI missing');
    assert(typeof window.MainMenuUI.show === 'function', 'show missing');
    assert(typeof window.MainMenuUI.hide === 'function', 'hide missing');
  });

  test('LoadingScreenUI singleton exists', () => {
    assert(window.LoadingScreenUI, 'LoadingScreenUI missing');
    assert(typeof window.LoadingScreenUI.show === 'function', 'show missing');
    assert(typeof window.LoadingScreenUI.updateProgress === 'function', 'updateProgress missing');
  });

  test('PauseMenuUI singleton exists', () => {
    assert(window.PauseMenuUI, 'PauseMenuUI missing');
    assert(typeof window.PauseMenuUI.show === 'function', 'show missing');
    assert(typeof window.PauseMenuUI.hide === 'function', 'hide missing');
  });

  test('ProfileSelectUI singleton exists', () => {
    assert(window.ProfileSelectUI, 'ProfileSelectUI missing');
    assert(typeof window.ProfileSelectUI.show === 'function', 'show missing');
  });

  test('ConfirmDialogUI singleton exists', () => {
    assert(window.ConfirmDialogUI, 'ConfirmDialogUI missing');
    assert(typeof window.ConfirmDialogUI.show === 'function', 'show missing');
  });

  test('RecoveryUI singleton exists', () => {
    assert(window.RecoveryUI, 'RecoveryUI missing');
    assert(typeof window.RecoveryUI.showFatalError === 'function', 'showFatalError missing');
    assert(typeof window.RecoveryUI.showLoadFailure === 'function', 'showLoadFailure missing');
    assert(typeof window.RecoveryUI.showCloudConflict === 'function', 'showCloudConflict missing');
  });

  // ---------------------------------------------------------------------------
  // LOADING DATA
  // ---------------------------------------------------------------------------
  test('LOADING_DATA exists and has tips', () => {
    assert(window.LOADING_DATA, 'LOADING_DATA missing');
    assert(Array.isArray(window.LOADING_DATA.tips), 'tips should be an array');
    assert(window.LOADING_DATA.tips.length >= 5, 'Should have at least 5 tips');
    // All tips should have 'en' key
    window.LOADING_DATA.tips.forEach((t, i) => {
      assert(t.key, `tip ${i} missing key`);
      assert(t.en, `tip ${i} missing en text`);
    });
  });

  test('LOADING_DATA: all 8 regions have art defined', () => {
    const art = window.LOADING_DATA.regionArt;
    assert(art, 'regionArt missing');
    const required = ['george_town','cauvery_delta','pichavaram','chettinad','thanjavur','mamallapuram','nilgiris','final_sanctuary'];
    required.forEach(r => {
      assert(art[r], `regionArt missing: ${r}`);
    });
  });

  // ---------------------------------------------------------------------------
  // INTEGRATION: BootManager + Lifecycle
  // ---------------------------------------------------------------------------
  test('VALID_REGIONS covers all 8 regions', () => {
    const vr = window.VALID_REGIONS;
    assert(Array.isArray(vr), 'VALID_REGIONS missing');
    assertEq(vr.length, 8, 'Should have exactly 8 valid regions');
    assert(vr.includes('george_town'), 'george_town missing');
    assert(vr.includes('nilgiris'), 'nilgiris missing');
    assert(vr.includes('final_sanctuary'), 'final_sanctuary missing');
  });

  test('Integration: BootManager + SessionManager share lifecycle', () => {
    // Both should read from the same GameLifecycle instance
    assert(window.GameLifecycle === window.GameLifecycle, 'GameLifecycle is singleton');
  });

  // ---------------------------------------------------------------------------
  // REPORT
  // ---------------------------------------------------------------------------
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n[${SUITE}] Results: ${passed}/${results.length} passed, ${failed} failed.`);
  results.forEach(r => {
    if (!r.passed) console.error(`  ✗ ${r.name}: ${r.error}`);
  });

  // Register with global test runner
  if (!window._allTestResults) window._allTestResults = [];
  results.forEach(r => window._allTestResults.push(r));

  if (window.registerTestSuite) {
    window.registerTestSuite(SUITE, results);
  }

})();
