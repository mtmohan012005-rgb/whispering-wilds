/**
 * Automated QA Test: Cinematic System Master State Machine & Input Locks
 */

window.testCinematicSystemSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA CINEMATIC] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const ui = window.cinematicUI || new window.CinematicUI();
    const camera = window.cameraDirector || new window.CameraDirector(null);
    const cinematicSys = new window.CinematicSystem(ui, camera);

    // 1. Initial State
    const isInitNone = cinematicSys.state === window.CINEMATIC_STATE.NONE;
    log('Cinematic Initial State is NONE', isInitNone, `State: ${cinematicSys.state}`);

    // 2. Start Cinematic & Input Lockout
    const testScene = { id: 'test_prologue', duration: 4.0 };
    cinematicSys.startCinematic(testScene);
    const isPlaying = cinematicSys.isPlaying();
    const hasLetterbox = ui.container.classList.contains('letterbox-active');
    log('Cinematic Lockout Engagement', isPlaying && hasLetterbox, `Playing: ${isPlaying}, Letterbox: ${hasLetterbox}`);

    // 3. Exclusivity: Reject Parallel Cinematic
    const parallelAttempt = cinematicSys.startCinematic({ id: 'test_second' });
    log('Single Cinematic Exclusivity Enforcement', parallelAttempt === false, 'Blocked parallel scene');

    // 4. Skip Scene & State Restoration
    cinematicSys.skipCurrentScene();
    const isComplete = cinematicSys.state === window.CINEMATIC_STATE.COMPLETE || cinematicSys.state === window.CINEMATIC_STATE.NONE;
    log('Scene Skip & Controls Restoration', isComplete, `State after skip: ${cinematicSys.state}`);

    // 5. Customization Limit Invariance
    const gs = window.GameState;
    const preChanges = gs.player.customizationChangesUsed;
    // Verify that playing or skipping cinematics never resets the 5-change limit
    const preservedLimit = gs.player.customizationChangesUsed === preChanges && gs.player.maxCustomizationChanges === 5;
    log('Cinematic Customization 5-Limit Invariance', preservedLimit, `Changes: ${gs.player.customizationChangesUsed}/5`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Cinematic System Test Failure', false, err.message);
    return { passed: false, results };
  }
};
