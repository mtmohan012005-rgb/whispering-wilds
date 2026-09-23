/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Production Tamil Nadu Audio Engine
 * Validates AUDIO_DATA schema, missing audio contract, Web Audio bus gain staging,
 * terrain material footstep acoustics, 3D spatial sound, regional ambience,
 * 9 dynamic music states, wildlife vocalisations, and audio settings persistence.
 */

window.runAudioProductionTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[AUDIO TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING PRODUCTION TAMIL NADU AUDIO TEST SUITE <<<');

  try {
    const audioData = window.AUDIO_DATA;
    if (!audioData) throw new Error('AUDIO_DATA not defined');

    // -------------------------------------------------------------
    // TEST 1: Centralized AUDIO_DATA Schema & Regional Definitions
    // -------------------------------------------------------------
    const hasAmbience = audioData.ambience && Object.keys(audioData.ambience).length >= 7;
    const hasFootsteps = audioData.footsteps && Object.keys(audioData.footsteps).length >= 6;
    const hasWildlife = audioData.wildlife && Object.keys(audioData.wildlife).length >= 5;
    const hasDynamicMusic = audioData.dynamicMusic && Object.keys(audioData.dynamicMusic).length === 9;
    const hasVehicles = audioData.vehicles && Object.keys(audioData.vehicles).length >= 3;
    const hasDialogue = audioData.dialogueVoices && Object.keys(audioData.dialogueVoices).length >= 3;

    const schemaValid = hasAmbience && hasFootsteps && hasWildlife && hasDynamicMusic && hasVehicles && hasDialogue;

    log('Centralized AUDIO_DATA Schema & Regional Integrity',
      schemaValid,
      `Ambience(7+): ${hasAmbience}, Footsteps(6): ${hasFootsteps}, DynamicMusic(9): ${hasDynamicMusic}, Wildlife(5+): ${hasWildlife}`);

    // -------------------------------------------------------------
    // TEST 2: Missing Audio Contract & Procedural Synthesis Fallback
    // -------------------------------------------------------------
    let warnLogged = false;
    const origWarn = console.warn;
    console.warn = function(...args) {
      const msg = args.join(' ');
      if (msg.includes('[AUDIO MISSING]')) {
        warnLogged = true;
      }
      origWarn.apply(console, args);
    };

    const manager = new window.AudioManager(audioData, window.gameAudio);
    manager.play('amb_chennai_george_town', { category: 'ambience', file: 'assets/audio/ambience/chennai/george_town_market.mp3' });
    console.warn = origWarn;

    const missingContractValid = warnLogged && manager.missingAssetLogged.has('amb_chennai_george_town');

    log('Missing Audio Contract & Procedural Fallback',
      missingContractValid,
      `WarningLogged: ${warnLogged}, LoggedInRegistry: ${manager.missingAssetLogged.has('amb_chennai_george_town')}`);

    // -------------------------------------------------------------
    // TEST 3: Multi-Bus Gain Staging & Volume Control
    // -------------------------------------------------------------
    manager.setMasterVolume(0.75);
    manager.setMusicVolume(0.5);
    manager.setAmbienceVolume(0.65);
    manager.setSfxVolume(0.85);

    const busValid = manager.volumes.master === 0.75 &&
      manager.volumes.music === 0.5 &&
      manager.volumes.ambience === 0.65 &&
      manager.volumes.sfx === 0.85;

    log('Multi-Bus Gain Staging & Volume Control',
      busValid,
      `Master: ${manager.volumes.master}, Music: ${manager.volumes.music}, Ambience: ${manager.volumes.ambience}`);

    // -------------------------------------------------------------
    // TEST 4: Footstep Terrain Material Detection & Cadence
    // -------------------------------------------------------------
    const footSystem = new window.FootstepAudioSystem(manager);
    const matSand = footSystem.detectMaterial(-200, 0, {});
    const matMud = footSystem.detectMaterial(0, 0, {});
    const matGrass = footSystem.detectMaterial(250, 0, {});
    const matWater = footSystem.detectMaterial(10, 0, { isSwimming: true });

    const materialsDetected = matSand === 'sand' && matMud === 'mud' && matGrass === 'grass' && matWater === 'water';

    // Test cadence timing
    const mockPlayer = { isMoving: true, state: 'SPRINT', isSprinting: true, x: 0, y: 0 };
    footSystem.update(0.35, mockPlayer); // Should trigger step
    const cadenceValid = footSystem.lastMaterial === 'mud';

    log('Footstep Terrain Material Detection & Cadence Timing',
      materialsDetected && cadenceValid,
      `Sand: ${matSand}, Mud: ${matMud}, Grass: ${matGrass}, Water: ${matWater}, CadenceTrigger: ${cadenceValid}`);

    // -------------------------------------------------------------
    // TEST 5: 3D Spatial Audio & Distance Falloff
    // -------------------------------------------------------------
    const spatialSys = new window.AudioSpatialSystem(manager);
    spatialSys.updateListener({ position: { x: 0, y: 0, z: 0 } });

    const closeSource = spatialSys.playSpatial('pichavaram_boat_creak', { x: 5, y: 0, z: 0 }, { minDistance: 5, maxDistance: 50 });
    const farSource = spatialSys.playSpatial('pichavaram_boat_creak', { x: 45, y: 0, z: 0 }, { minDistance: 5, maxDistance: 50 });

    const spatialFalloffValid = closeSource && farSource && closeSource.attenuation > farSource.attenuation && farSource.attenuation < 0.2;

    log('3D Spatial Sound & Distance Attenuation',
      spatialFalloffValid,
      `CloseAttenuation: ${closeSource.attenuation.toFixed(2)}, FarAttenuation: ${farSource.attenuation.toFixed(2)}`);

    // -------------------------------------------------------------
    // TEST 6: Regional Ambience Multi-Layering & Time-of-Day
    // -------------------------------------------------------------
    const ambientSys = new window.AmbientWorldAudioSystem(manager);
    ambientSys.setRegion('george_town');
    ambientSys.setTimeOfDay('morning');
    const hasChennaiLayers = ambientSys.activeLayers.size > 0;

    ambientSys.setRegion('nilgiris');
    const hasNilgirisLayers = ambientSys.activeLayers.size > 0;

    log('Regional Ambience Multi-Layering & Time-of-Day Cycles',
      hasChennaiLayers && hasNilgirisLayers,
      `ChennaiActive: ${hasChennaiLayers}, NilgirisActive: ${hasNilgirisLayers}`);

    // -------------------------------------------------------------
    // TEST 7: Dynamic Music State Machine (9 States)
    // -------------------------------------------------------------
    const musicSys = new window.DynamicMusicSystem(manager);
    const expectedStates = [
      'EXPLORATION', 'DISCOVERY', 'INVESTIGATION', 'TENSION', 'PUZZLE',
      'WILDLIFE_OBSERVATION', 'CHAPTER_EVENT', 'DANGER', 'REST'
    ];

    let statesValid = true;
    for (const state of expectedStates) {
      musicSys.transitionTo(state);
      if (musicSys.currentState !== state) {
        statesValid = false;
        break;
      }
    }

    log('Dynamic Music State Machine (9 Authoritative States)',
      statesValid,
      `All 9 states transitioned cleanly: ${statesValid}`);

    // -------------------------------------------------------------
    // TEST 8: Wildlife Acoustic Calls & Behavior Throttling
    // -------------------------------------------------------------
    const wildSys = new window.WildlifeAudioSystem(manager);
    wildSys.triggerCall('nilgiri_tahr', 'alert', { x: 10, y: 0, z: 10 }, 'tahr_01');
    const firstCallTime = wildSys.lastCallTimes.get('tahr_01');

    // Immediate second call attempt must be throttled
    wildSys.triggerCall('nilgiri_tahr', 'alert', { x: 10, y: 0, z: 10 }, 'tahr_01');
    const secondCallTime = wildSys.lastCallTimes.get('tahr_01');
    const throttled = firstCallTime === secondCallTime;

    log('Wildlife Acoustic Calls & Interval Throttling',
      !!firstCallTime && throttled,
      `FirstCallRecorded: ${!!firstCallTime}, ThrottledDuplicate: ${throttled}`);

    // -------------------------------------------------------------
    // TEST 9: Audio Settings Persistence & SaveManager Round-Trip
    // -------------------------------------------------------------
    const settings = manager.getSettings();
    const hasAllSettings = settings.masterVolume === 0.75 &&
      settings.musicVolume === 0.5 &&
      settings.ambienceVolume === 0.65 &&
      settings.sfxVolume === 0.85 &&
      settings.language === 'tamil';

    // Apply mutated settings
    manager.applySettings({ masterVolume: 0.9, language: 'english' });
    const appliedValid = manager.volumes.master === 0.9 && manager.language === 'english';

    // Revert
    manager.applySettings(settings);

    log('Audio Settings Persistence & SaveManager Round-Trip',
      hasAllSettings && appliedValid,
      `ExportSettings: ${hasAllSettings}, ApplyMutated: ${appliedValid}`);

  } catch (err) {
    log('Audio Production Test Suite Error', false, err.message);
  }

  const allPassed = results.every(r => r.passed);
  console.log(`>>> AUDIO PRODUCTION TEST SUITE ${allPassed ? 'ALL PASSED' : 'HAS FAILURES'} <<<`);

  return {
    passed: allPassed,
    results: results
  };
};
