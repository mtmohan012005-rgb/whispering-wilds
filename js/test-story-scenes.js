/**
 * Automated QA Test: Data-Driven Story Scenes, Prerequisites & Milestone Commits
 */

window.testStoryScenesSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA SCENES] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const ui = window.cinematicUI || new window.CinematicUI();
    const camera = window.cameraDirector || new window.CameraDirector(null);
    const cinematicSys = window.cinematicSystem || new window.CinematicSystem(ui, camera);
    const dialogue = window.dialogueController || new window.DialogueController(ui, new window.DialogueChoiceUI());
    const sceneSys = new window.StorySceneSystem(cinematicSys, dialogue, camera);

    // 1. Data Integrity: 8 Chapters & Key Discovery Scenes Present
    const allScenes = window.STORY_SCENE_DATA || [];
    const hasKeyScenes = allScenes.some(s => s.id === 'scene_george_town_arrival') &&
                         allScenes.some(s => s.id === 'scene_waterwheel_solved') &&
                         allScenes.some(s => s.id === 'scene_nilgiris_tahr_discovery') &&
                         allScenes.some(s => s.id === 'scene_sanctuary_ending');
    log('Story Scenes Database Schema Validation', hasKeyScenes && allScenes.length >= 7,
      `Scenes Loaded: ${allScenes.length}`);

    // 2. Play Scene & Verify Flag / Unlock Commits
    let sceneDone = false;
    sceneSys.playScene('scene_george_town_arrival', () => {
      sceneDone = true;
    });

    // Fast-forward / complete scene
    sceneSys.finishScene();

    const gs = window.GameState;
    const hasFlags = gs.quests.storyFlags instanceof Set ? gs.quests.storyFlags.has('played_scene_george_town_arrival') : !!gs.quests.storyFlags['played_scene_george_town_arrival'];
    log('Scene Completion & Story Flag Commit', hasFlags, `Flag recorded: ${hasFlags}`);

    // 3. One-Shot Scene Idempotency
    const replayAttempt = sceneSys.playScene('scene_george_town_arrival');
    log('One-Shot Idempotency Enforcement', replayAttempt === false, 'Blocked re-trigger of one-shot scene');

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Story Scene System Test Failure', false, err.message);
    return { passed: false, results };
  }
};
