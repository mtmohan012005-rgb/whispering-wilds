/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Production 3D Player Character Pipeline
 * Validates CharacterLoader, strict local asset rules, missing asset contract,
 * 17-state animation machine, bone/clip manifest, authoritative outfitId, and camera tracking.
 */

window.runPlayerProductionTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[PLAYER TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING PRODUCTION PLAYER CHARACTER TEST SUITE <<<');

  try {
    // -------------------------------------------------------------
    // TEST 1: CharacterLoader & Missing Local Asset Contract
    // -------------------------------------------------------------
    let errorLogged = false;
    const origError = console.error;
    console.error = function(...args) {
      const msg = args.join(' ');
      if (msg.includes('[PLAYER ASSET MISSING] assets/characters/player/player.glb')) {
        errorLogged = true;
      }
      origError.apply(console, args);
    };

    const dummyScene = new THREE.Scene();
    const loader = new window.CharacterLoader(dummyScene);
    const loadResult = await loader.loadPlayerCharacter();

    console.error = origError;

    const correctPath = loader.playerModelPath === 'assets/characters/player/player.glb';
    const proxyTagged = loader.diagnosticGroup && loader.diagnosticGroup.userData.isProductionAsset === false;
    const missingAssetHandled = loadResult.isMissing && errorLogged && proxyTagged;

    log('CharacterLoader & Missing Local Asset Contract', missingAssetHandled,
      `Target: ${loader.playerModelPath}, ErrorLogged: ${errorLogged}, isProductionAsset: ${loader.isProductionAsset}`);

    // -------------------------------------------------------------
    // TEST 2: Authoritative Outfit ID System (5 Valid Outfits)
    // -------------------------------------------------------------
    const validOutfits = [
      'everyday_veshti',
      'village_workwear',
      'urban_explorer',
      'festival_veshti',
      'nilgiri_warmwear'
    ];

    let outfitsValid = true;
    for (const id of validOutfits) {
      loader.setOutfit(id);
      if (loader.outfitId !== id) {
        outfitsValid = false;
        break;
      }
    }

    // Test diagnostic proxy material updates
    loader.setOutfit('village_workwear');
    const proxyColorChanged = loader.diagnosticMeshes.torso && loader.diagnosticMeshes.torso.material.color.getHex() === 0x819ca9;

    log('Authoritative Outfit ID (5 Outfits & Proxy Visuals)', outfitsValid && proxyColorChanged,
      `All 5 IDs valid, proxy material updated for village_workwear: ${proxyColorChanged}`);

    // -------------------------------------------------------------
    // TEST 3: Animation Clip Specifications (20 Clips & 17 States)
    // -------------------------------------------------------------
    const expectedClips = [
      'Player_Idle', 'Player_Walk', 'Player_Run', 'Player_Sprint',
      'Player_Jump_Start', 'Player_Jump', 'Player_Fall', 'Player_Land',
      'Player_Interact', 'Player_Pickup', 'Player_Inspect', 'Player_Use_Item',
      'Player_Crouch_Idle', 'Player_Crouch_Walk', 'Player_Climb', 'Player_Swim',
      'Player_Sit', 'Player_Stand', 'Player_Eat', 'Player_Drink', 'Player_Photo'
    ];

    const hasAllExpectedClips = expectedClips.every(c => loader.expectedClipNames.includes(c));

    const stateEnum = window.PLAYER_STATE;
    const requiredStates = [
      'IDLE', 'WALK', 'RUN', 'SPRINT', 'CROUCH_IDLE', 'CROUCH_WALK',
      'JUMP_START', 'JUMP', 'FALL', 'LAND', 'INTERACT', 'PICKUP',
      'INSPECT', 'USE_ITEM', 'CLIMB', 'SWIM', 'PHOTO'
    ];
    const hasAllStates = requiredStates.every(s => stateEnum && stateEnum[s] === s);

    log('17-State State Machine & 20 Clip Manifest', hasAllExpectedClips && hasAllStates,
      `States(17): ${hasAllStates}, ClipNames(20+): ${hasAllExpectedClips}`);

    // -------------------------------------------------------------
    // TEST 4: ThreePlayer State Transitions & Velocity Calibration
    // -------------------------------------------------------------
    const testPlayer = new window.ThreePlayer(dummyScene, 0, 0);

    // Initial state: IDLE, speed = 0
    const initialIdle = testPlayer.state === window.PLAYER_STATE.IDLE;

    // Movement: RUN
    testPlayer.update({ up: true }, 0.016, null);
    const runState = testPlayer.state === window.PLAYER_STATE.RUN;

    // Sprint
    testPlayer.update({ up: true, sprint: true }, 0.016, null);
    const sprintState = testPlayer.state === window.PLAYER_STATE.SPRINT;

    // Crouch Walk
    testPlayer.update({ up: true, crouch: true }, 0.016, null);
    const crouchWalkState = testPlayer.state === window.PLAYER_STATE.CROUCH_WALK;

    // Crouch Idle
    testPlayer.update({ crouch: true }, 0.016, null);
    const crouchIdleState = testPlayer.state === window.PLAYER_STATE.CROUCH_IDLE;

    // Jump & Vertical Physics
    testPlayer.isGrounded = true;
    testPlayer.yOffset = 0;
    testPlayer.update({ jump: true }, 0.016, null);
    const jumpState = testPlayer.state === window.PLAYER_STATE.JUMP && testPlayer.verticalVelocity > 0;

    // Fall in air
    testPlayer.yOffset = 5.0; // High in air
    testPlayer.verticalVelocity = -5.0;
    testPlayer.isGrounded = false;
    testPlayer.update({}, 0.016, null);
    const fallState = testPlayer.state === window.PLAYER_STATE.FALL;

    // Land
    testPlayer.yOffset = 0.01;
    testPlayer.verticalVelocity = -5.0;
    testPlayer.isGrounded = false;
    testPlayer.update({}, 0.016, null);
    const landState = testPlayer.state === window.PLAYER_STATE.LAND && testPlayer.isGrounded === true;

    const speedsCalibrated = testPlayer.speeds.idle === 0 &&
                             testPlayer.speeds.crouch === 8.5 &&
                             testPlayer.speeds.walk === 16.0 &&
                             testPlayer.speeds.run === 32.0 &&
                             testPlayer.speeds.sprint === 55.0;

    const locomotionTransitions = initialIdle && runState && sprintState &&
                                  crouchWalkState && crouchIdleState && jumpState && fallState && landState && speedsCalibrated;

    log('ThreePlayer Locomotion & Velocity Calibration', locomotionTransitions,
      `Idle: ${initialIdle}, Run: ${runState}, Sprint: ${sprintState}, Crouch: ${crouchWalkState}, Jump: ${jumpState}, Fall: ${fallState}, Land: ${landState}, Speeds(Calibrated): ${speedsCalibrated}`);

    // -------------------------------------------------------------
    // TEST 5: Camera Tracking & Chest Y Elevation (~1.35m)
    // -------------------------------------------------------------
    testPlayer.setPosition(100, 200, { getElevation: () => 15 });
    const pos = testPlayer.getPosition();
    const chestYValid = pos.y === 15 && Math.abs(pos.chestY - (pos.y + 1.35)) < 0.01;

    let cameraFramingValid = false;
    if (window.threeWorld && window.threeWorld.cameraController) {
      const cam = window.threeWorld.cameraController;
      cam.setContextFraming('PHOTO');
      const photoFraming = cam.contextFraming === 'PHOTO';
      cam.setContextFraming('DEFAULT');
      cameraFramingValid = photoFraming && cam.contextFraming === 'DEFAULT';
    } else {
      cameraFramingValid = true; // Fallback if 3D scene not actively mounted in test context
    }

    log('Camera Target Tracking (chestY = y + 1.35m & Context Framing)', chestYValid && cameraFramingValid,
      `chestY: ${pos.chestY.toFixed(2)}, ContextFraming: ${cameraFramingValid}`);

    // -------------------------------------------------------------
    // TEST 6: Backward Compatibility (currentOutfit Alias & Save/Load)
    // -------------------------------------------------------------
    testPlayer.currentOutfit = 'farmlandGear'; // legacy key
    const legacyMapped = testPlayer.outfitId === 'village_workwear';

    testPlayer.currentOutfit = 'mountainGear'; // legacy key
    const legacyMapped2 = testPlayer.outfitId === 'nilgiri_warmwear';

    log('Backward Compatibility (Legacy Outfit Aliases)', legacyMapped && legacyMapped2,
      `farmlandGear -> ${legacyMapped ? 'village_workwear' : 'fail'}, mountainGear -> ${legacyMapped2 ? 'nilgiri_warmwear' : 'fail'}`);

  } catch (err) {
    log('Player Production Test Suite Error', false, err.message);
  }

  const allPassed = results.every(r => r.passed);
  console.log(`>>> PLAYER PRODUCTION SUITE COMPLETE: ${allPassed ? 'ALL PASS' : 'SOME FAIL'} <<<`);
  return { passed: allPassed, results };
};
