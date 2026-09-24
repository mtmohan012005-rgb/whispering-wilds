/**
 * Automated QA Test: Player Controller, Movement Authority & Rig Asset Contract
 */

window.testPlayerSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA PLAYER] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const scene = new THREE.Scene();
    const player = new window.ThreePlayer(scene, 0, 0);

    // 1. Locomotion speeds & state machine integrity
    const hasSpeeds = player.speeds && player.speeds.walk === 16.0 && player.speeds.sprint === 55.0;
    const hasStates = window.PLAYER_STATE && window.PLAYER_STATE.CLIMB === 'CLIMB';
    log('Player Speeds & 17-State Machine Enum', hasSpeeds && hasStates, `Speeds: ${hasSpeeds}, States: ${hasStates}`);

    // 2. CharacterLoader Production Contract (No Xbot, Target player.glb)
    const loader = player.characterLoader;
    const targetsLocalGLB = loader && loader.playerModelPath === 'assets/characters/player/player.glb';
    const noXbotReference = !JSON.stringify(loader).includes('Xbot') && !JSON.stringify(loader).includes('mixamo');
    log('CharacterLoader Rig Contract (Local GLB, Zero Xbot)', targetsLocalGLB && noXbotReference,
      `Target: ${loader ? loader.playerModelPath : 'none'}, NoXbot: ${noXbotReference}`);

    // 3. Movement Authority & Terrain Adaptation
    const dummyTerrain = {
      getInterpolatedHeight: () => 3.5,
      getElevation: () => 3.5,
      getSurfaceType: () => 'red_soil'
    };
    player.update({ up: true, shift: true }, 0.1, dummyTerrain);
    const hasMoved = player.isMoving === true;
    const snappedHeight = player.y === 3.5;
    log('Movement Authority & Terrain Elevation Snapping', hasMoved && snappedHeight,
      `Moved: ${hasMoved}, Elevation: ${player.y}m`);

    // 4. Input Hardening (No movement without input)
    player.update({ up: false, down: false, left: false, right: false }, 0.1, dummyTerrain);
    const stopped = player.isMoving === false;
    log('Zero Inertial Drift on Input Release', stopped, `Stopped: ${stopped}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Player Test Failure', false, err.message);
    return { passed: false, results };
  }
};
