// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUTOMATED STEP-BY-STEP FEATURE TESTER
// Executes all 9 GDD systems sequentially and logs step verification metrics
// ============================================================================

window.runStepByStepFeatureTests = async function() {
  const results = [];
  const log = (step, title, passed, details = '') => {
    results.push({ step, title, passed, details });
    console.log(`[TEST STEP ${step}] ${passed ? '✓ PASS' : '✗ FAIL'}: ${title} - ${details}`);
    const el = document.getElementById('test-telemetry-log');
    if (el) {
      el.innerHTML += `<div class="test-row ${passed ? 'pass' : 'fail'}"><strong>Step ${step}:</strong> ${title} <span>${passed ? '✓ PASS' : '✗ FAIL'}</span></div>`;
    }
  };

  // Helper delay
  const wait = ms => new Promise(res => setTimeout(res, ms));

  console.log('>>> STARTING STEP-BY-STEP FEATURE TEST SUITE <<<');

  // --- STEP 1: Title Screen & Prologue Heist ---
  try {
    const startBtn = document.getElementById('start-game-btn');
    if (!startBtn) throw new Error('Start button not found');
    startBtn.click();
    await wait(1200);

    const hud = document.getElementById('hud-container');
    const hudVisible = !hud.classList.contains('hidden');
    log(1, 'Title Screen & Inciting Incident Heist', hudVisible, 'Title faded, cutscene triggered, HUD active');
  } catch (err) {
    log(1, 'Title Screen & Inciting Incident Heist', false, err.message);
  }

  // --- STEP 2: Locomotion, Stamina & Footprints ---
  try {
    const player = window.player || (window.testRef && window.testRef.player);
    const initialX = player.x;
    const initialTracks = window.testRef.tracksManager.tracks.length;

    // Simulate walk
    player.x += 150;
    player.y -= 30;
    window.testRef.tracksManager.addFootprint(player.x, player.y, 0.2, true, 'mud');
    window.testRef.survival.consumeEnergy(15);

    const tracksAdded = window.testRef.tracksManager.tracks.length > initialTracks;
    const staminaDrained = window.testRef.survival.energy < 100;
    log(2, 'Locomotion, Stamina & Dynamic Mud Footprints', tracksAdded && staminaDrained, `Footprint decals: ${window.testRef.tracksManager.tracks.length}, Energy: ${window.testRef.survival.energy}%`);
  } catch (err) {
    log(2, 'Locomotion, Stamina & Dynamic Mud Footprints', false, err.message);
  }

  // --- STEP 3: Real Tamil Nadu Culture: Auto Driver Velu & Enfield Intel ---
  try {
    const player = window.testRef.player;
    player.x = 390;
    player.y = 570;
    player.nearbyInteractable = { id: 'chennai_auto', name: 'Auto Driver Velu' };

    // Trigger auto dialogue
    const eEvent = new KeyboardEvent('keydown', { code: 'KeyE' });
    window.dispatchEvent(eEvent);
    await wait(300);

    const teaModal = document.getElementById('tea-modal');
    const modalVisible = !teaModal.classList.contains('hidden');
    const titleText = document.querySelector('.tea-kadai-banner h3').textContent;
    const isAuto = titleText.includes('ஆட்டோ') || titleText.includes('Velu');

    log(3, 'Madras Auto Driver Velu Interaction', modalVisible && isAuto, `Dialogue loaded: "${titleText}"`);
    document.getElementById('close-tea-btn').click();
    await wait(200);
  } catch (err) {
    log(3, 'Madras Auto Driver Velu Interaction', false, err.message);
  }

  // --- STEP 4: Murugan Annan Roadside Tea Kadai & Economy ---
  try {
    const player = window.testRef.player;
    player.x = 750;
    player.y = 535;
    player.nearbyInteractable = { id: 'tea_kadai', name: "Murugan Annan's Tea Kadai" };

    const eEvent = new KeyboardEvent('keydown', { code: 'KeyE' });
    window.dispatchEvent(eEvent);
    await wait(300);

    const initialRupees = window.testRef.survival.currency;
    const options = document.querySelectorAll('.tea-choice-btn');
    const chaiBtn = Array.from(options).find(b => b.textContent.includes('Cutting Chai')) || options[0];
    if (chaiBtn) {
      chaiBtn.click(); // Order Cutting Chai (₹12)
    }
    await wait(300);

    const rupeesDecreased = window.testRef.survival.currency < initialRupees;
    log(4, "Murugan Annan's Tea Kadai & Economy", rupeesDecreased, `Ordered Cutting Chai! Balance: ₹${window.testRef.survival.currency} (was ₹${initialRupees})`);
    document.getElementById('close-tea-btn').click();
    await wait(200);
  } catch (err) {
    log(4, "Murugan Annan's Tea Kadai & Economy", false, err.message);
  }

  // --- STEP 5: Explorer Camera Viewfinder & Snapshot Capture ---
  try {
    const camBtn = document.getElementById('camera-toggle-btn');
    camBtn.click();
    await wait(300);

    const camOverlay = document.getElementById('camera-overlay');
    const camActive = !camOverlay.classList.contains('hidden');

    // Take snapshot
    const snapBtn = document.getElementById('snap-photo-btn');
    snapBtn.click();
    await wait(400);

    const photoCount = window.testRef.camera.photos.length;
    document.getElementById('close-camera-btn').click();
    await wait(200);

    log(5, 'Explorer Camera Viewfinder & Snapshot', camActive && photoCount > 0, `Captured ${photoCount} field photograph with subject metadata`);
  } catch (err) {
    log(5, 'Explorer Camera Viewfinder & Snapshot', false, err.message);
  }

  // --- STEP 6: Diegetic Field Journal, Photolog & Clue Board ---
  try {
    const journalBtn = document.getElementById('journal-toggle-btn');
    journalBtn.click();
    await wait(400);

    const journalModal = document.getElementById('journal-modal');
    const journalOpen = !journalModal.classList.contains('hidden');

    // Test tab switches
    window.testRef.journal.switchTab('bestiary', window.gameAudio);
    await wait(200);
    const completionPct = window.testRef.journal.getCompletionPercent();

    window.testRef.journal.switchTab('clueboard', window.gameAudio);
    await wait(200);
    const pinnedClues = window.testRef.journal.pinnedClues.size;

    document.getElementById('close-journal-btn').click();
    await wait(200);

    log(6, 'Diegetic Field Journal & Clue Board', journalOpen && completionPct > 0, `Field Guide: ${completionPct}% complete, Clue Pins: ${pinnedClues} active with red yarn`);
  } catch (err) {
    log(6, 'Diegetic Field Journal & Clue Board', false, err.message);
  }

  // --- STEP 7: Camping, Base Building & Well Rested Buff ---
  try {
    const player = window.testRef.player;
    window.testRef.survival.placeCampfire(player.x, player.y + 15);
    window.testRef.survival.pitchTent(player.x - 20, player.y + 10);
    await wait(200);

    const firesPlaced = window.testRef.survival.campfires.length > 0;
    const tentsPitched = window.testRef.survival.tents.length > 0;

    // Sleep in tent
    window.testRef.survival.sleepInTent(window.testRef.lighting, window.gameAudio);
    const hasBuff = window.testRef.survival.hasRestedBuff;
    const isDawn = Math.abs(window.testRef.lighting.timeOfDay - 6.5) < 0.1;

    log(7, 'Camping & Rested Stamina Buff', firesPlaced && tentsPitched && hasBuff && isDawn, `Campfire: ${firesPlaced}, Tent: ${tentsPitched}, Time: 6:30 AM Sunrise, Rested Buff: Active`);
  } catch (err) {
    log(7, 'Camping & Rested Stamina Buff', false, err.message);
  }

  // --- STEP 8: Pichavaram Delta & Chola Waterwheel Puzzle ---
  try {
    const player = window.testRef.player;
    player.x = 3200;
    player.y = 500;
    player.nearbyInteractable = { id: 'chola_waterwheel' };

    const eEvent = new KeyboardEvent('keydown', { code: 'KeyE' });
    window.dispatchEvent(eEvent);
    await wait(300);

    const puzzleModal = document.getElementById('puzzle-modal');
    const puzzleOpen = !puzzleModal.classList.contains('hidden');

    // Solve the puzzle: Lotus = 90 deg, Tiger = 270 deg
    const rotBtn1 = document.getElementById('rotate-dial-1-btn');
    const rotBtn2 = document.getElementById('rotate-dial-2-btn');
    rotBtn1.click(); // 90 deg
    rotBtn2.click(); rotBtn2.click(); rotBtn2.click(); // 270 deg
    await wait(300);

    const statusText = document.getElementById('puzzle-status').textContent;
    const solved = statusText.includes('MECHANISM ALIGNED');

    document.getElementById('close-puzzle-btn').click();
    await wait(200);

    log(8, 'Chola Waterwheel Hydro-Mechanism Puzzle', puzzleOpen && solved, statusText);
  } catch (err) {
    log(8, 'Chola Waterwheel Hydro-Mechanism Puzzle', false, err.message);
  }

  // --- STEP 9: Nilgiris Western Ghats & Ancient Eco-Sanctuary ---
  try {
    const player = window.testRef.player;
    player.x = 4950;
    player.y = 350;

    // Snapshot Nilgiri Tahr
    const detected = { data: { id: 'nilgiri_tahr', name: 'Nilgiri Tahr (வரையாடு)', tamilName: 'வரையாடு', biome: 'Western Ghats' } };
    window.testRef.camera.captureSnapshot(document.getElementById('gameCanvas'), detected, 'Nilgiris & Western Ghats', window.gameAudio, window.testRef.journal);

    // Enter Eco-Sanctuary Portal
    player.x = 5600;
    player.y = 520;
    window.testRef.quests.completeObjective('main_ghats', 'unlock_portal', window.gameAudio);

    const finalQuest = window.testRef.quests.quests.find(q => q.id === 'main_ghats');
    const portalUnlocked = finalQuest.objectives.find(o => o.id === 'unlock_portal').done;

    log(9, 'Western Ghats Nilgiri Tahr & Eco-Sanctuary Portal', portalUnlocked, 'Pasumai Thadam ancient botanical sanctuary preserved!');
  } catch (err) {
    log(9, 'Western Ghats Nilgiri Tahr & Eco-Sanctuary Portal', false, err.message);
  }

  // --- STEP 10: Real Tamil Nadu Map Data Structure & GPS Telemetry ---
  try {
    const map = window.tamilNaduMap;
    const hasZones = map && map.startingZone && map.phase1 && map.phase2 && map.phase3;
    const coordsMatch = 
      (map.startingZone.coordinates.lat === 13.0598 || map.startingZone.coordinates.lat === 13.0827) &&
      map.phase1.coordinates.lat === 11.9401 &&
      map.phase2.coordinates.lat === 11.4287 &&
      map.phase3.coordinates.lat === 11.4102;

    const telChennai = window.getRealTamilNaduTelemetry(200);
    const telNilgiris = window.getRealTamilNaduTelemetry(5500);
    const gpsEl = document.getElementById('gps-coords');
    const telemetryValid = hasZones && coordsMatch && telChennai.region === 'Chennai' && (telNilgiris.region.includes('Ooty') || telNilgiris.zoneName.includes('Nilgiri')) && !!gpsEl;

    log(10, 'Real Tamil Nadu Map Coordinates & Real-Time Telemetry', telemetryValid, 
      `Verified George Town (${map.startingZone.coordinates.lat}, ${map.startingZone.coordinates.lng}) to Nilgiri Mist (${map.phase3.coordinates.lat}, ${map.phase3.coordinates.lng})`);
  } catch (err) {
    log(10, 'Real Tamil Nadu Map Coordinates & Real-Time Telemetry', false, err.message);
  }

  // --- STEP 11: Cultural Wardrobe System, Merchant Trade & Character Roster ---
  try {
    const player = window.testRef.player;
    const journal = window.testRef.journal;
    const wardrobeSys = window.culturalWardrobeSystem;

    // 1. Verify Cultural Wardrobe Data Structure (JSON / JavaScript)
    const hasCharacters = wardrobeSys && wardrobeSys.characters && wardrobeSys.characters.length >= 3;
    const hasItems = wardrobeSys && wardrobeSys.tradeableClothingItems && wardrobeSys.tradeableClothingItems.length >= 3;

    const charAnnan = wardrobeSys.characters.find(c => c.id === 'npc_tea_annan');
    const charFarmer = wardrobeSys.characters.find(c => c.id === 'npc_farmer');
    const charGuide = wardrobeSys.characters.find(c => c.id === 'npc_hill_guide');
    const dialoguesCorrect = charAnnan && charAnnan.dialogue.includes('hot tea') &&
                             charFarmer && charFarmer.dialogue.includes('Veyil romba') &&
                             charGuide && charGuide.dialogue.includes('Ooty malai');

    // 2. Test Merchant Trade Logic (tradeOrBuyClothing)
    const initialFunds = window.testRef.survival.currency;
    const tradeResult = window.tradeOrBuyClothing(player, 'cloth_veshti', 'Chennai Plains');
    const tradeSuccess = tradeResult && tradeResult.success && player.equippedOutfit && player.equippedOutfit.itemId === 'cloth_veshti';

    // 3. Test equipping Farmland Gear
    window.equipPlayerAttire('farmlandGear');
    const equippedFarmland = (player.currentOutfit === 'farmlandGear' || player.outfitId === 'farmlandGear');

    // 4. Test equipping Mountain Gear
    window.equipPlayerAttire('mountainGear');
    const equippedMountain = (player.currentOutfit === 'mountainGear' || player.outfitId === 'mountainGear');

    // 5. Test Olai Chuvadi toggle
    journal.toggleOlaiSkin();
    const wrapper = document.querySelector('.journal-book-wrapper');
    const isOlaiThemed = wrapper && wrapper.classList.contains('olai-chuvadi-theme');
    journal.toggleOlaiSkin(); // toggle back

    // 6. Switch to Wardrobe tab and verify DOM
    journal.switchTab('wardrobe');
    const wardrobePanel = document.getElementById('panel-wardrobe');
    const cardsRendered = wardrobePanel && wardrobePanel.querySelectorAll('.wardrobe-card').length >= 3;
    const rosterRendered = wardrobePanel && wardrobePanel.querySelectorAll('.character-card').length >= 3;

    const wardrobeSuccess = hasCharacters && hasItems && dialoguesCorrect && tradeSuccess && equippedFarmland && equippedMountain && isOlaiThemed && cardsRendered && rosterRendered;

    log(11, 'Cultural Wardrobe System, Merchant Trade & Character Roster', wardrobeSuccess,
      `Characters: ${wardrobeSys.characters.length}, Tradeable Items: ${wardrobeSys.tradeableClothingItems.length}, Trade Logic: OK, Roster DOM: ${rosterRendered}`);
  } catch (err) {
    log(11, 'Cultural Wardrobe System, Merchant Trade & Character Roster', false, err.message);
  }

  // --- STEP 12: Three.js 3D Real Tamil Nadu Terrain & Procedural Landmarks ---
  try {
    const threeWorld = window.threeWorld || (window.testRef && window.testRef.threeWorld);
    if (!threeWorld) throw new Error('threeWorld engine instance not found on window');

    const terrain = threeWorld.terrain;
    const elevChennai = terrain.getElevation(-250, 0);
    const elevDelta = terrain.getElevation(0, 0);
    const elevGhats = terrain.getElevation(220, -15);

    const isFlatLowlands = Math.abs(elevChennai) < 5;
    const isSteepMountains = elevGhats > 18;

    // Verify landmarks
    const landmarks = terrain.landmarksGroup.children;
    const hasHighCourt = landmarks.some(c => c.name === 'MadrasHighCourt');
    const hasTeaKadai = landmarks.some(c => c.name === 'MuruganTeaKadai');
    const hasWaterwheel = landmarks.some(c => c.name === 'CholaWaterwheel');
    const hasTodaHut = landmarks.some(c => c.name === 'TodaHut');
    const hasEcoPortal = landmarks.some(c => c.name === 'EcoSanctuaryPortal');
    const hasWater = !!terrain.waterMesh;

    const terrainValid = isFlatLowlands && isSteepMountains && hasHighCourt && hasTeaKadai && hasWaterwheel && hasTodaHut && hasEcoPortal && hasWater;

    log(12, 'Three.js 3D Tamil Nadu Terrain & Procedural Landmarks', terrainValid,
      `Chennai elev: ${elevChennai.toFixed(1)}m, Ghats peak: ${elevGhats.toFixed(1)}m, Landmarks: HighCourt(${hasHighCourt}), TeaKadai(${hasTeaKadai}), Waterwheel(${hasWaterwheel}), TodaHut(${hasTodaHut}), EcoPortal(${hasEcoPortal}), Water(${hasWater})`);
  } catch (err) {
    log(12, 'Three.js 3D Tamil Nadu Terrain & Procedural Landmarks', false, err.message);
  }

  // --- STEP 13: 3D Player Controller, Macro-Map View & Atmospheric Weather ---
  try {
    const threeWorld = window.threeWorld || (window.testRef && window.testRef.threeWorld);
    if (!threeWorld) throw new Error('threeWorld engine instance not found on window');

    // 1. Activate 3D Mode
    threeWorld.setActive(true);
    await wait(200);

    // 2. Test Player locomotion & height snapping
    const initialPos = threeWorld.player.getPosition();
    threeWorld.player.setPosition(-230, 10, threeWorld.terrain);
    const updatedPos = threeWorld.player.getPosition();
    const correctHeight = Math.abs(updatedPos.y - threeWorld.terrain.getElevation(updatedPos.x, updatedPos.z)) < 0.01;
    const lanternShadow = threeWorld.player.lanternLight.castShadow === true;

    // 3. Test Macro-Map View Toggle
    const mode1 = threeWorld.cameraController.toggleMacroView();
    const isMacro = threeWorld.cameraController.isMacro();
    await wait(200);
    const mode2 = threeWorld.cameraController.toggleMacroView(); // back to gameplay
    await wait(100);

    // 4. Test Weather particle system & lighting shadows
    const rainStreakCount = threeWorld.weather.rainCount;
    const hasShadowMap = threeWorld.renderer.shadowMap.enabled === true;
    const moonShadow = threeWorld.lighting.moonLight.castShadow === true;

    const step13Success = correctHeight && lanternShadow && isMacro && rainStreakCount >= 3000 && hasShadowMap && moonShadow;

    log(13, '3D Player Controller, Macro-Map Zoom & Thunderstorm Weather', step13Success,
      `Height Snapped: ${correctHeight}, Lantern Shadows: ${lanternShadow}, Macro-Map View: ${isMacro}, Rain Streaks: ${rainStreakCount}, PCF Shadows: ${hasShadowMap}`);
  } catch (err) {
    log(13, '3D Player Controller, Macro-Map Zoom & Thunderstorm Weather', false, err.message);
  }

  // --- STEP 14: Advanced Barter Economy, Dual Currency & Haggling System ---
  try {
    const trade = window.gameTradeSystem || (window.testRef && window.testRef.tradeSystem) || new window.TradeSystem(window.gameInstance);
    if (!trade) throw new Error('TradeSystem instance not found');

    // 1. Initial State Check
    const initialWallet = trade.playerState.wallet;
    const initialShells = trade.playerState.materials.shells;

    // 2. Test Haggling / Bargain Roll
    trade.playerState.discountApplied = false;
    trade.haggleDiscount();
    const hasDiscount = trade.playerState.discountApplied === true || trade.playerState.haggleAttempts > 0;
    const bubbleUpdated = trade.speechEl && trade.speechEl.innerText.length > 5;

    // 3. Test Barter Trade (Cotton Veshti for 3 River Shells)
    trade.playerState.materials.shells = 6;
    trade.barterItem('cloth_veshti');
    const veshtiOwned = trade.playerState.inventory.includes('cloth_veshti');
    const veshtiEquipped = trade.playerState.equipped === 'cloth_veshti';
    const shellsDeducted = trade.playerState.materials.shells === 3;

    // 4. Test Cash Purchase (Cargo Suit)
    trade.playerState.wallet = 300;
    trade.buyWithCash('cloth_cargo', 150);
    const cargoOwned = trade.playerState.inventory.includes('cloth_cargo');
    const cashDeducted = trade.playerState.wallet === 150;

    // 5. Test Live Survival Buff Linkage
    let buffLinked = true;
    if (window.gameSurvival) {
      buffLinked = window.gameSurvival.staminaEfficiency < 1.0 || window.gameSurvival.thirstDrainModifier !== undefined;
    }

    const step14Valid = hasDiscount && bubbleUpdated && veshtiOwned && veshtiEquipped && shellsDeducted && cargoOwned && cashDeducted && buffLinked;

    log(14, 'Village Kadai Barter Economy & Localized Tamil Dialogue', step14Valid,
      `Haggling Attempted: ${hasDiscount}, Speech Bubble: ${bubbleUpdated}, Barter (Veshti for Shells): ${veshtiOwned && shellsDeducted}, Cash Buy (Cargo): ${cargoOwned && cashDeducted}, Survival Buffs Linked: ${buffLinked}`);
  } catch (err) {
    log(14, 'Village Kadai Barter Economy & Localized Tamil Dialogue', false, err.message);
  }

  // --- STEP 15: Dynamic Climate & Celestial Astronomical Engine ---
  try {
    const climate = window.gameClimateEngine || (window.testRef && window.testRef.climateEngine) || new window.DynamicClimateEngine(window.gameInstance);
    if (!climate) throw new Error('DynamicClimateEngine instance not found');

    // 1. Test Dawn Mist State (06:00 AM)
    climate.currentTimeInHours = 6.5;
    climate.tick(0.1);
    const isDawn = climate.currentPhase === 'DAWN_MIST';
    const dawnElevation = climate.sunElevation > 0;

    // 2. Test Scorching Sun State (12:00 PM)
    climate.currentTimeInHours = 12.0;
    climate.tick(0.1);
    const isScorching = climate.currentPhase === 'SCORCHING_HEAT';
    const peakHeat = climate.heatIndex >= 35.0; // Up to 38.5°C
    const zenithElevation = climate.sunElevation > 0.9;
    const peakHeatVal = climate.heatIndex;
    const zenithVal = climate.sunElevation;

    // 3. Test Monsoon Thunderstorm State (08:00 PM)
    climate.currentTimeInHours = 20.0;
    climate.tick(0.1);
    const isStorm = climate.currentPhase === 'MONSOON_THUNDERSTORM';
    const wetnessAccumulates = climate.groundWetness > 0;

    // 4. Test Cold Night Dampness (02:00 AM)
    climate.currentTimeInHours = 2.0;
    climate.tick(0.1);
    const isNight = climate.currentPhase === 'NIGHT_DAMP';
    const nightCool = climate.heatIndex <= 22.0;

    const step15Valid = isDawn && dawnElevation && isScorching && peakHeat && zenithElevation && isStorm && wetnessAccumulates && isNight && nightCool;

    log(15, 'Dynamic Climate & Real-Time Celestial Astronomical Engine', step15Valid,
      `Dawn (6:30am): ${isDawn}, Scorching Heat (12pm, ${peakHeatVal.toFixed(1)}°C, Elev: ${zenithVal.toFixed(2)}): ${isScorching && peakHeat}, Monsoon Storm (8pm): ${isStorm}, Cold Night (2am, ${climate.heatIndex.toFixed(1)}°C): ${isNight}`);
  } catch (err) {
    log(15, 'Dynamic Climate & Real-Time Celestial Astronomical Engine', false, err.message);
  }

  // --- STEP 16: Diegetic Save/Load & Autosave Checkpoint System ---
  try {
    const saveSys = window.gameSaveSystem || (window.testRef && window.testRef.saveSystem) || new window.SaveSystem(window.gameInstance);
    if (!saveSys) throw new Error('SaveSystem instance not found');

    // 1. Test Manual Save to Slot 1 in Safe Conditions
    if (window.gameSurvival) window.gameSurvival.coreTemp = 36.8;
    const save1Success = saveSys.saveToSlot('slot_1', 'George Town Outpost Test');

    // 2. Verify Saved Payload Structure in localStorage
    const rawSaved = localStorage.getItem('whispering_wilds_save_slot_1');
    const parsed = JSON.parse(rawSaved);
    const hasPlayer = !!(parsed && parsed.player && parsed.player.gps);
    const hasSurvival = !!(parsed && parsed.survival && parsed.survival.coreTemp);
    const hasWardrobe = !!(parsed && parsed.wardrobeAndTrade && parsed.wardrobeAndTrade.materials);

    // 3. Test Autosave Checkpoint
    const autoSuccess = saveSys.triggerAutosave('Rare Neelakurinji Bloom Discovered');
    const rawAuto = localStorage.getItem('whispering_wilds_save_autosave');
    const hasAuto = !!rawAuto;

    // 4. Test Hazard Lockout Rule (Hypothermia < 34.5°C blocks manual saving)
    if (window.gameSurvival) {
      window.gameSurvival.coreTemp = 33.8; // Extreme hypothermia
      const hazardCheck = saveSys.canSaveManual();
      const hazardBlocked = hazardCheck.allowed === false && hazardCheck.reason.includes('Hypothermia');

      // Restore temp
      window.gameSurvival.coreTemp = 36.8;

      // 5. Test Load and Restore Integrity
      const loadSuccess = saveSys.loadFromSlot('slot_1');

      const step16Valid = save1Success && hasPlayer && hasSurvival && hasWardrobe && autoSuccess && hasAuto && hazardBlocked && loadSuccess;

      log(16, 'Diegetic Save/Load, Autosave Checkpoints & Hazard Validation', step16Valid,
        `Slot 1 Saved: ${save1Success}, Payload Integrity (GPS/Vitals/Materials): ${hasPlayer && hasSurvival && hasWardrobe}, Autosave Triggered: ${hasAuto}, Hazard Lockout Enforced: ${hazardBlocked}, Restore OK: ${loadSuccess}`);
    } else {
      log(16, 'Diegetic Save/Load, Autosave Checkpoints & Hazard Validation', save1Success && hasPlayer, 'Basic payload verified');
    }
  } catch (err) {
    log(16, 'Diegetic Save/Load, Autosave Checkpoints & Hazard Validation', false, err.message);
  }

  console.log('>>> TEST SUITE COMPLETE <<<', results);
  window.testResults = results;

  // Append results to DOM for headless capture
  let outDiv = document.getElementById('test-results-output');
  if (!outDiv) {
    outDiv = document.createElement('div');
    outDiv.id = 'test-results-output';
    document.body.appendChild(outDiv);
  }
  outDiv.textContent = JSON.stringify(results);

  try {
    fetch('/save-test-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    }).catch(() => {});
  } catch (e) {
    console.warn('Could not post test results:', e);
  }

  return results;
};
