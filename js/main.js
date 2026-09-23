// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI / THADAM) - MAIN ENGINE ORCHESTRATOR
// Game Loop, Input Controller, Cutscenes, Audio Sync & Modal Management
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize DOM Elements
  const canvas = document.getElementById('gameCanvas');
  const titleScreen = document.getElementById('title-screen');
  const hudContainer = document.getElementById('hud-container');
  const startBtn = document.getElementById('start-game-btn');
  const audioBtn = document.getElementById('toggle-audio-btn');
  const journalBtn = document.getElementById('journal-toggle-btn');
  const cameraBtn = document.getElementById('camera-toggle-btn');
  const lanternBtn = document.getElementById('lantern-toggle-btn');
  const campfireBtn = document.getElementById('campfire-btn');
  const tentBtn = document.getElementById('tent-btn');

  // Modal elements
  const journalModal = document.getElementById('journal-modal');
  const closeJournalBtn = document.getElementById('close-journal-btn');
  const teaModal = document.getElementById('tea-modal');
  const closeTeaBtn = document.getElementById('close-tea-btn');
  const puzzleModal = document.getElementById('puzzle-modal');
  const closePuzzleBtn = document.getElementById('close-puzzle-btn');

  // Lobby elements (Multiplayer Co-op)
  const lobbyModal = document.getElementById('lobbyUI');
  const closeLobbyBtn = document.getElementById('close-lobby-btn');
  const playSoloBtn = document.getElementById('play-solo-btn');
  const enterServerBtn = document.getElementById('enter-server-btn');
  const multiplayerTitleBtn = document.getElementById('multiplayer-title-btn');
  const toggleMultiplayerBtn = document.getElementById('toggle-multiplayer-btn');
  const multiplayerBtnLabel = document.getElementById('multiplayer-btn-label');
  const lobbyStatus = document.getElementById('lobbyStatus');
  const nameInput = document.getElementById('nameInput');
  const roomInput = document.getElementById('roomInput');
  const serverUrlInput = document.getElementById('serverUrlInput');

  // Camera elements
  const cameraOverlay = document.getElementById('camera-overlay');
  const cameraSubjectTag = document.getElementById('camera-subject-tag');
  const snapPhotoBtn = document.getElementById('snap-photo-btn');
  const closeCameraBtn = document.getElementById('close-camera-btn');
  const zoomSlider = document.getElementById('zoom-slider');

  // HUD elements
  const hungerBar = document.getElementById('hunger-fill');
  const thirstBar = document.getElementById('thirst-fill');
  const energyBar = document.getElementById('energy-fill');
  const tempGauge = document.getElementById('temp-value');
  const timeDisplay = document.getElementById('time-display');
  const weatherBadge = document.getElementById('weather-badge');
  const biomeTitle = document.getElementById('biome-title');
  const compassNeedle = document.getElementById('compass-needle');
  const rupeeCount = document.getElementById('rupee-count');

  // 2. Initialize Game Systems
  const audio = window.gameAudio;
  const worldUnlocks = typeof window.WorldUnlockSystem !== 'undefined' ? new window.WorldUnlockSystem() : null;
  window.worldUnlockSystem = worldUnlocks;
  const investigation = typeof window.InvestigationSystem !== 'undefined' ? new window.InvestigationSystem() : null;
  window.investigationSystem = investigation;

  const renderer = new window.WorldRenderer(canvas);
  const lighting = new window.LightingEngine();
  const particles = new window.ParticleEngine();
  const tracksManager = new window.TerrainTracksManager();
  const weather = new window.WeatherSystem();
  const survival = new window.SurvivalSystem();
  const explorerCamera = new window.ExplorerCamera();
  const journal = new window.FieldJournal();
  const quests = new window.QuestManager();
  const entities = new window.EntityManager();
  const player = new window.Player(220, 630);
  const saveManager = new window.SaveManager();
  const multiplayer = window.MultiplayerManager ? new window.MultiplayerManager() : null;

  // Initialize Production Audio System
  const audioManager = (typeof window.AudioManager !== 'undefined')
    ? new window.AudioManager(window.AUDIO_DATA, audio)
    : null;
  window.audioManager = audioManager;
  if (audioManager) {
    audioManager.spatial = new window.AudioSpatialSystem(audioManager);
    audioManager.ambient = new window.AmbientWorldAudioSystem(audioManager);
    audioManager.footsteps = new window.FootstepAudioSystem(audioManager);
    audioManager.dynamicMusic = new window.DynamicMusicSystem(audioManager);
    audioManager.wildlife = new window.WildlifeAudioSystem(audioManager);
  }

  // Initialize Player Customization System & UI (5-Change Limit)
  const customizationSystem = (typeof window.PlayerCustomizationSystem !== 'undefined')
    ? new window.PlayerCustomizationSystem(window.PLAYER_CUSTOMIZATION_CONFIG)
    : null;
  window.playerCustomizationSystem = customizationSystem;
  const customizationUI = (typeof window.PlayerCustomizationUI !== 'undefined')
    ? new window.PlayerCustomizationUI(customizationSystem)
    : null;
  window.playerCustomizationUI = customizationUI;

  // Initialize Professional PC UI & Inventory Subsystems
  const inventorySystem = (typeof window.InventorySystem !== 'undefined') ? new window.InventorySystem() : null;
  window.inventorySystem = inventorySystem;

  const gameHUD = (typeof window.GameHUD !== 'undefined') ? new window.GameHUD() : null;
  window.gameHUD = gameHUD;

  const pauseMenuUI = (typeof window.PauseMenuUI !== 'undefined') ? new window.PauseMenuUI() : null;
  window.pauseMenuUI = pauseMenuUI;

  const worldMapUI = (typeof window.WorldMapUI !== 'undefined') ? new window.WorldMapUI() : null;
  window.worldMapUI = worldMapUI;

  const journalUI = (typeof window.JournalUI !== 'undefined') ? new window.JournalUI() : null;
  window.journalUI = journalUI;

  const inventoryUI = (typeof window.InventoryUI !== 'undefined') ? new window.InventoryUI() : null;
  window.inventoryUI = inventoryUI;

  const dialogueUI = (typeof window.DialogueUI !== 'undefined') ? new window.DialogueUI() : null;
  window.dialogueUI = dialogueUI;

  const photoUI = (typeof window.PhotoModeUI !== 'undefined') ? new window.PhotoModeUI() : null;
  window.photoUI = photoUI;

  const unifiedSettingsUI = (typeof window.UnifiedSettingsUI !== 'undefined') ? new window.UnifiedSettingsUI() : null;
  window.unifiedSettingsUI = unifiedSettingsUI;

  const uiManager = (typeof window.UIManager !== 'undefined') ? new window.UIManager() : null;
  window.uiManager = uiManager;
  if (uiManager) {
    uiManager.hud = gameHUD;
    uiManager.pauseMenu = pauseMenuUI;
    uiManager.worldMapUI = worldMapUI;
    uiManager.journalUI = journalUI;
    uiManager.inventoryUI = inventoryUI;
    uiManager.dialogueUI = dialogueUI;
    uiManager.photoUI = photoUI;
    uiManager.settingsUI = unifiedSettingsUI;
  }

  // Attach global references
  window.gameQuests = quests;
  window.gameJournal = journal;
  window.gameSurvival = survival;
  window.gamePlayer = player;
  window.gameSaveManager = saveManager;
  window.multiplayerManager = multiplayer;
  window.testRef = {
    player, renderer, lighting, particles, tracksManager, weather,
    survival, camera: explorerCamera, journal, quests, entities,
    saveManager, multiplayer, audioManager, playerCustomization: customizationSystem,
    playerCustomizationUI: customizationUI,
    inventory: inventorySystem,
    uiManager: uiManager,
    hud: gameHUD,
    worldMapUI: worldMapUI,
    photoUI: photoUI
  };
  explorerCamera.init(cameraOverlay, cameraSubjectTag);

  // Initialize 3D World Engine
  const threeCanvas = document.getElementById('threeCanvas');
  const toggle3dBtn = document.getElementById('toggle-3d-view-btn');
  const toggleMacroBtn = document.getElementById('toggle-macro-map-btn');

  let threeWorld = null;
  if (threeCanvas && window.ThreeWorld) {
    try {
      threeWorld = new window.ThreeWorld(threeCanvas);
      window.threeWorld = threeWorld;
      window.testRef.threeWorld = threeWorld;
      threeWorld.onTelemetryUpdate = (data) => {
        player.x = data.x2D;
        player.y = data.y2D;
        if (data.isMoving) {
          survival.consumeEnergy(0.035);
        }
      };
    } catch (e) {
      console.warn("ThreeWorld initialization error:", e);
    }
  }

  function toggle3DMode(forceState) {
    if (!threeWorld) return;
    const newState = (forceState !== undefined) ? forceState : !threeWorld.isActive;
    if (newState) {
      threeWorld.syncPlayerFrom2D(player);
      threeWorld.setActive(true);
      if (toggle3dBtn) {
        toggle3dBtn.innerHTML = '🗺️ 2D Canvas [V]';
        toggle3dBtn.classList.add('active');
      }
    } else {
      threeWorld.syncPlayerTo2D(player);
      threeWorld.setActive(false);
      if (toggle3dBtn) {
        toggle3dBtn.innerHTML = '🌐 3D World [V]';
        toggle3dBtn.classList.remove('active');
      }
      if (toggleMacroBtn) {
        toggleMacroBtn.innerHTML = '🗺️ Macro View [M]';
        toggleMacroBtn.classList.remove('active');
      }
    }
  }

  function toggleMacroView() {
    if (!threeWorld) return;
    if (!threeWorld.isActive) {
      toggle3DMode(true);
    }
    const newMode = threeWorld.toggleMacroView();
    if (toggleMacroBtn) {
      if (newMode === 'macro') {
        toggleMacroBtn.innerHTML = '🎯 Player View [M]';
        toggleMacroBtn.classList.add('active');
      } else {
        toggleMacroBtn.innerHTML = '🗺️ Macro View [M]';
        toggleMacroBtn.classList.remove('active');
      }
    }
  }

  toggle3dBtn?.addEventListener('click', () => toggle3DMode());
  toggleMacroBtn?.addEventListener('click', () => toggleMacroView());

  // Auto-run test runner or visual modes if requested via URL
  if (window.location.search.includes('runTests=true')) {
    setTimeout(() => {
      if (window.runStepByStepFeatureTests) {
        window.runStepByStepFeatureTests();
      }
    }, 1000);
  }

  if (window.location.search.includes('view=3d')) {
    titleScreen.style.display = 'none';
    titleScreen.classList.add('hidden');
    hudContainer.classList.remove('hidden');
    toggle3DMode(true);
  } else if (window.location.search.includes('view=macro')) {
    titleScreen.style.display = 'none';
    titleScreen.classList.add('hidden');
    hudContainer.classList.remove('hidden');
    toggle3DMode(true);
    toggleMacroView();
  } else if (window.location.search.includes('showWardrobe=true')) {
    titleScreen.style.display = 'none';
    titleScreen.classList.add('hidden');
    hudContainer.classList.remove('hidden');
    journal.isOpen = true;
    journalModal.classList.remove('hidden');
    journal.currentTab = 'wardrobe';
    journal.isOlaiSkin = true;
    const wrapper = document.querySelector('.journal-book-wrapper');
    if (wrapper) wrapper.classList.add('olai-chuvadi-theme');
    const olaiBtn = document.getElementById('toggle-olai-chuvadi');
    if (olaiBtn) olaiBtn.innerHTML = '📔 Leather Journal';
    journal.render();
  } else if (window.location.search.includes('gameplay=true')) {
    titleScreen.style.display = 'none';
    titleScreen.classList.add('hidden');
    hudContainer.classList.remove('hidden');
  }

  // Pre-seed the tyre skids left by the fleeing Enfield
  tracksManager.seedPrologueEnfieldTracks();

  // Generate procedural trees from WORLD_DATA
  const generatedTrees = [];
  window.WORLD_DATA.trees.forEach(group => {
    for (let i = 0; i < group.count; i++) {
      generatedTrees.push({
        type: group.type,
        x: group.xRange[0] + Math.random() * (group.xRange[1] - group.xRange[0]),
        y: group.yRange[0] + Math.random() * (group.yRange[1] - group.yRange[0])
      });
    }
  });

  // 3. Resize handling
  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.resize(w, h);
    lighting.resize(w, h);
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // 4. Input System
  const input = {
    keys: {},
    mouse: { x: 0, y: 0, down: false }
  };

  window.addEventListener('keydown', e => {
    input.keys[e.code] = true;

    // Hotkeys
    if (e.code === 'KeyV') {
      toggle3DMode();
    }
    if (e.code === 'KeyP') {
      if (customizationUI) customizationUI.toggle();
    }
    if (e.code === 'KeyO') {
      toggleLobby();
    }
    if (e.code === 'KeyF') {
      const active = explorerCamera.toggle();
      if (active) audio.playCameraShutter();
    }
    if (e.code === 'KeyJ') {
      journal.toggle(audio);
    }
    if (e.code === 'KeyL') {
      player.toggleLantern(audio);
      lanternBtn.classList.toggle('active', player.isLanternOn);
    }
    if (e.code === 'KeyB') {
      handleDeployCampfire();
    }
    if (e.code === 'KeyT') {
      handleDeployTent();
    }
    if (e.code === 'KeyE') {
      handleInteraction();
    }
    if (e.code === 'KeyM') {
      if (threeWorld && threeWorld.isActive) {
        toggleMacroView();
      } else {
        const muted = audio.toggleMute();
        audioBtn.textContent = muted ? '🔇 Unmute' : '🔊 Audio';
      }
    }
  });

  window.addEventListener('keyup', e => {
    input.keys[e.code] = false;
  });

  // 5. Interactions Logic
  function handleInteraction() {
    // Prioritize explicit player nearby interactable target if set
    if (player.nearbyInteractable) {
      handleItemInteraction(player.nearbyInteractable);
      return;
    }

    // 1. Check for nearby 3D Living World NPCs if in 3D mode
    if (threeWorld && threeWorld.isActive && threeWorld.livingWorld) {
      const nearby3DNPC = threeWorld.livingWorld.getNearbyInteractableNPC(threeWorld.player.getPosition(), 4.0);
      if (nearby3DNPC) {
        const interactionData = nearby3DNPC.interact(threeWorld.player.getPosition());
        openProductionNPCDialogue(interactionData);
        return;
      }
    }

    // 1b. Check for nearby 3D Production World Assets
    if (threeWorld && threeWorld.isActive && threeWorld.worldAssets) {
      const pPos = threeWorld.player.getPosition();
      for (const inst of threeWorld.worldAssets.activeInstances) {
        if (!inst.userData || !inst.userData.interactable) continue;
        const dx = inst.position.x - pPos.x;
        const dz = inst.position.z - pPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 5.0) {
          handle3DAssetInteraction(inst.userData);
          return;
        }
      }
    }
  }

  function handleItemInteraction(item) {

    if (item.id === 'tea_kadai' || item.id === 'murugan') {
      openTeaKadai();
    } else if (item.id === 'farmer_selvam' || item.id === 'selvam') {
      openFarmerSelvamDialogue();
    } else if (item.id === 'hill_guide_karthik' || item.id === 'karthik') {
      openHillGuideDialogue();
    } else if (item.id === 'chennai_auto') {
      openAutoDialogue();
    } else if (item.id === 'elaneer_cart') {
      survival.thirst = Math.min(100, survival.thirst + 45);
      survival.energy = Math.min(100, survival.energy + 15);
      audio.playFootstep('water');
      quests.showQuestNotification('Drank cool, sweet tender coconut water! (+45 Thirst, +15 Energy)');
    } else if (item.id === 'toda_hut') {
      journal.unlockEntry('toda_hut');
      audio.playDiscoveryJingle();
      quests.showQuestNotification('Inspected Sacred Toda Buffalo Mund! Discovered indigenous Nilgiri lore.');
    } else if (item.id === 'kurinji_shola') {
      journal.unlockEntry('kurinji_shola');
      audio.playDiscoveryJingle();
      quests.showQuestNotification('Documented rare Neelakurinji 12-year bloom! (+180 XP)');
    } else if (item.id === 'high_court_gates') {
      quests.completeObjective('main_prologue', 'inspect_heist', audio);
      if (window.investigationSystem) window.investigationSystem.inspectObject('high_court_gates');
      journal.toggle(audio);
      journal.switchTab('quests', audio);
    } else if (item.id === 'enfield_tracks_site') {
      quests.completeObjective('main_prologue', 'follow_tracks', audio);
      if (window.investigationSystem) window.investigationSystem.inspectObject('enfield_tracks_site');
      quests.showQuestNotification('Discovered: Deep tyre tracks curve towards Pichavaram!');
    } else if (item.id === 'panchayat_well') {
      survival.refillCanteen();
      audio.playFootstep('water');
      quests.showQuestNotification('Canteen refilled with fresh well groundwater! (+100 Thirst)');
    } else if (item.id === 'chola_waterwheel') {
      openWaterwheelPuzzle();
    } else if (item.id === 'nilgiri_tea_factory') {
      survival.coreTemp = 37.0;
      quests.completeObjective('main_ghats', 'survive_cold', audio);
      quests.showQuestNotification('Warmed up by the stone cottage hearth! Core temp restored.');
    } else if (item.id === 'eco_sanctuary_portal') {
      // Validated entry check (Section 13 & 26)
      const isSanctuaryUnlocked = window.worldUnlockSystem ? window.worldUnlockSystem.isUnlocked('final_sanctuary') : false;
      const canUnlock = window.worldUnlockSystem ? window.worldUnlockSystem.canUnlock('final_sanctuary', window.questProgression) : true;
      const hasWarmwear = (player.outfitId === 'nilgiri_warmwear');

      if (isSanctuaryUnlocked || (canUnlock && hasWarmwear)) {
        quests.completeObjective('main_ghats', 'unlock_portal', audio);
        if (window.worldUnlockSystem) window.worldUnlockSystem.unlock('final_sanctuary', audio);
        audio.playDiscoveryJingle();
        alert('🌟 CONGRATULATIONS! You have unsealed the fabled subterranean Pasumai Thadam Eco-Sanctuary, preserving Tamil Nadu’s ancient botanical heritage!');
      } else {
        audio.playFootstep('dirt');
        const reason = !hasWarmwear
          ? 'Freezing mountain frost numbs your limbs! Equip Nilgiri Warmwear (கம்பளி சூட்) first.'
          : 'The ancient stone portal remains sealed. Assemble the Chola relics and complete the previous chapters.';
        quests.showQuestNotification(reason);
      }
    } else if (item.type === 'tent') {
      survival.sleepInTent(lighting, audio);
      quests.showQuestNotification('Rested until dawn! Gained Stamina Recovery Buff.');
      // Diegetic save: slept in tent
      saveManager.saveGame('auto', 'tent_sleep');
    }

    // Event notification to quest progression
    if (window.questProgression) {
      window.questProgression.onInteraction(item.id, { audio });
    }
  }

  function handle3DAssetInteraction(data) {
    if (!data) return;
    const type = data.interactionType;
    if (type === 'tea_shop') {
      openTeaKadai();
    } else if (type === 'boat') {
      quests.showQuestNotification('Boarded wooden boat! Navigating Pichavaram mangrove waterways.');
      audio.playFootstep('water');
    } else if (type === 'irrigation_sluice' || type === 'waterwheel') {
      openWaterwheelPuzzle();
    } else if (type === 'door') {
      quests.showQuestNotification('Inspected heritage carved threshold. Entrance unlocked.');
      audio.playDiscoveryJingle();
    } else if (type === 'well') {
      survival.refillCanteen();
      audio.playFootstep('water');
      quests.showQuestNotification('Refilled water pot with cool fresh water! (+100 Thirst)');
    } else if (type === 'lamp') {
      quests.showQuestNotification('Lit brass sacred kuthu vilakku lamp! (+10 Stamina)');
      survival.energy = Math.min(100, survival.energy + 10);
    } else if (type === 'craft_table') {
      quests.showQuestNotification('Examined traditional artisan workshop craft table.');
    } else if (type === 'paddy_field') {
      quests.showQuestNotification('Inspected fertile green paddy fields in Cauvery Delta.');
    } else if (type === 'bell') {
      quests.showQuestNotification('Rung resonant bronze temple bell!');
      audio.playDiscoveryJingle();
    } else if (data.isFictionalWriting) {
      quests.showQuestNotification('[Fictional Game-World Writing] Deciphered ancient stone inscription.');
      journal.unlockEntry('stone_inscription');
    } else {
      quests.showQuestNotification(data.interactionPrompt || `Interacted with ${data.assetId || 'world object'}`);
    }
  }

  function openProductionNPCDialogue(data) {
    if (!data) return;
    teaModal.classList.remove('hidden');
    audio.playPinTap();
    const titleEl = document.querySelector('.tea-kadai-banner h3');
    if (titleEl) {
      titleEl.textContent = `${data.tamilName || data.name} • ${data.occupation.replace(/_/g, ' ').toUpperCase()}`;
    }
    const bubbleEl = document.getElementById('tea-dialogue-text');
    if (bubbleEl) {
      const ta = (data.dialogue && data.dialogue.ta) || '';
      const en = (data.dialogue && data.dialogue.en) || '';
      bubbleEl.innerHTML = `<strong style="color:#d4af37;">${ta}</strong><br><span style="color:#bdc3c7; font-size:0.92rem; display:block; margin-top:6px;">"${en}"</span>`;
    }
    const optContainer = document.getElementById('tea-options');
    if (optContainer) {
      optContainer.innerHTML = '';
      const farewellBtn = document.createElement('button');
      farewellBtn.className = 'tea-choice-btn';
      farewellBtn.textContent = 'சரிங்க, நான் பாத்து போயிட்டு வர்றேன் (Farewell)';
      farewellBtn.onclick = () => {
        teaModal.classList.add('hidden');
      };
      optContainer.appendChild(farewellBtn);
    }
  }

  function openAutoDialogue() {
    teaModal.classList.remove('hidden');
    audio.playPinTap();
    const data = window.DIALOGUE_DATA.chennai_auto;
    document.querySelector('.tea-kadai-banner h3').textContent = 'மதராஸ் ஆட்டோ • Auto Driver Velu';
    document.getElementById('tea-dialogue-text').textContent = data.greeting;
    const optContainer = document.getElementById('tea-options');
    optContainer.innerHTML = '';
    data.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'tea-choice-btn';
      btn.textContent = opt.label;
      btn.onclick = () => {
        document.getElementById('tea-dialogue-text').textContent = opt.response;
      };
      optContainer.appendChild(btn);
    });
  }

  function openHillGuideDialogue() {
    teaModal.classList.remove('hidden');
    audio.playPinTap();
    const data = window.DIALOGUE_DATA.hill_guide_karthik;
    document.querySelector('.tea-kadai-banner h3').textContent = 'கார்த்திக் • Nilgiri Mountain Guide';
    document.getElementById('tea-dialogue-text').textContent = data.greeting;
    const optContainer = document.getElementById('tea-options');
    optContainer.innerHTML = '';
    data.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'tea-choice-btn';
      btn.textContent = opt.label;
      btn.onclick = () => {
        if (opt.action === 'buy_woolen') {
          const res = window.tradeOrBuyClothing(player, 'cloth_woolen_set', 'Ooty Mountain Ghats');
          if (res.success) {
            document.getElementById('tea-dialogue-text').textContent = opt.response;
          } else {
            document.getElementById('tea-dialogue-text').textContent = "Aiyo thambi! Need ₹350 for the woolen suit. Complete missions to earn rupees!";
          }
        } else if (opt.action === 'buy_cargo') {
          const res = window.tradeOrBuyClothing(player, 'cloth_cargo', 'Villupuram / Delta');
          if (res.success) {
            document.getElementById('tea-dialogue-text').textContent = opt.response;
          } else {
            document.getElementById('tea-dialogue-text').textContent = "Aiyo thambi! Need ₹150 for the cargo set.";
          }
        } else {
          document.getElementById('tea-dialogue-text').textContent = opt.response;
        }
      };
      optContainer.appendChild(btn);
    });
  }

  function handleDeployCampfire() {
    const success = survival.placeCampfire(player.x, player.y + 15);
    if (success) {
      audio.playPinTap();
      quests.showQuestNotification('Campfire built! Sit near to warm up.');
      // Diegetic save: campfire warmth
      saveManager.saveGame('auto', 'campfire_rest');
    } else {
      quests.showQuestNotification('Need at least 2 Wood to build a campfire!');
    }
  }

  function handleDeployTent() {
    const success = survival.pitchTent(player.x - 25, player.y + 10);
    if (success) {
      audio.playPinTap();
      quests.showQuestNotification('Canvas tent pitched! Press [E] to sleep and gain Rested Buff.');
    } else {
      quests.showQuestNotification('Need at least 2 Cloth to pitch a tent!');
    }
  }

  // 6. Murugan Annan's Tea Kadai Hub UI
  function openTeaKadai() {
    teaModal.classList.remove('hidden');
    audio.playTeaPour();
    quests.completeObjective('main_prologue', 'talk_murugan', audio);

    const bannerTitle = document.querySelector('.tea-kadai-banner h3');
    if (bannerTitle) bannerTitle.textContent = "🍵 Murugan Annan's Tea Kadai (டீக்கடை)";

    const dialogData = window.DIALOGUE_DATA.tea_kadai;
    document.getElementById('tea-dialogue-text').textContent = dialogData.greeting;

    const optionsContainer = document.getElementById('tea-options');
    optionsContainer.innerHTML = '';

    dialogData.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'tea-choice-btn';
      btn.textContent = opt.label;
      btn.onclick = () => {
        if (opt.action === 'buy_veshti') {
          const res = window.tradeOrBuyClothing(player, 'cloth_veshti', 'Chennai Plains');
          if (res.success) {
            document.getElementById('tea-dialogue-text').textContent = opt.response;
            // Diegetic save: trade complete
            saveManager.saveGame('auto', 'trade_complete');
          } else {
            document.getElementById('tea-dialogue-text').textContent = "Aiyo thala! Kaasu pathala! Need ₹50 for the cotton veshti.";
          }
        } else if (opt.cost) {
          if (survival.currency >= opt.cost) {
            survival.currency -= opt.cost;
            if (opt.effect.thirst) survival.thirst = Math.min(100, survival.thirst + opt.effect.thirst);
            if (opt.effect.energy) survival.energy = Math.min(100, survival.energy + opt.effect.energy);
            if (opt.effect.hunger) survival.hunger = Math.min(100, survival.hunger + opt.effect.hunger);
            if (opt.effect.temp) survival.coreTemp = Math.min(37.5, survival.coreTemp + 1.2);
            audio.playTeaPour();
            document.getElementById('tea-dialogue-text').textContent = opt.response;
          } else {
            document.getElementById('tea-dialogue-text').textContent = "Aiyo thala! Kaasu pathala! (Not enough rupees!)";
          }
        } else {
          document.getElementById('tea-dialogue-text').textContent = opt.response;
          if (opt.id === 'farewell') {
            setTimeout(() => teaModal.classList.add('hidden'), 1500);
          }
        }
      };
      optionsContainer.appendChild(btn);
    });
  }

  // 6b. Farmer Selvam Dialogue UI (Fixes missing report_selvam branch)
  function openFarmerSelvamDialogue() {
    teaModal.classList.remove('hidden');
    audio.playPinTap();

    const bannerTitle = document.querySelector('.tea-kadai-banner h3');
    if (bannerTitle) bannerTitle.textContent = "🌾 Murugan / Farmer Selvam (விவசாயி செல்வம்)";

    const dialogData = window.DIALOGUE_DATA.farmer_selvam;
    document.getElementById('tea-dialogue-text').textContent = dialogData.greeting;

    const optionsContainer = document.getElementById('tea-options');
    optionsContainer.innerHTML = '';

    dialogData.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'tea-choice-btn';
      btn.textContent = opt.label;
      btn.onclick = () => {
        if (opt.action === 'complete_report_selvam') {
          quests.completeObjective('side_bull', 'report_selvam', audio);
          if (window.investigationSystem) {
            window.investigationSystem.addEvidence('clue_chola_seal');
          }
          if (window.worldUnlockSystem) {
            window.worldUnlockSystem.unlock('pichavaram', audio);
          }
          document.getElementById('tea-dialogue-text').textContent = opt.response;
          saveManager.saveGameImmediate('auto', 'selvam_report_complete');
        } else {
          document.getElementById('tea-dialogue-text').textContent = opt.response;
        }
      };
      optionsContainer.appendChild(btn);
    });
  }
  window.openFarmerSelvamDialogue = openFarmerSelvamDialogue;

  // 7. Chola Waterwheel Puzzle (Reusable Delta Engine)
  window.waterwheelDial1 = window.waterwheelDial1 !== undefined ? window.waterwheelDial1 : 0;
  window.waterwheelDial2 = window.waterwheelDial2 !== undefined ? window.waterwheelDial2 : 0;
  window.sluiceGateA = window.sluiceGateA !== undefined ? window.sluiceGateA : false;
  window.sluiceGateB = window.sluiceGateB !== undefined ? window.sluiceGateB : false;
  window.sluiceGateC = window.sluiceGateC !== undefined ? window.sluiceGateC : false;
  window.deltaWaterLevel = window.deltaWaterLevel !== undefined ? window.deltaWaterLevel : 100;
  window.deltaPathRevealed = window.deltaPathRevealed !== undefined ? window.deltaPathRevealed : false;

  function openWaterwheelPuzzle() {
    puzzleModal.classList.remove('hidden');
    audio.playPinTap();
    renderWaterwheelPuzzle();
  }

  function renderWaterwheelPuzzle() {
    const dial1El = document.getElementById('puzzle-dial-1');
    const dial2El = document.getElementById('puzzle-dial-2');
    if (dial1El) dial1El.style.transform = `rotate(${window.waterwheelDial1}deg)`;
    if (dial2El) dial2El.style.transform = `rotate(${window.waterwheelDial2}deg)`;

    // Check solution (Lotus at 90 deg, Tiger at 270 deg)
    if (window.waterwheelDial1 === 90 && window.waterwheelDial2 === 270) {
      window.sluiceGateA = true;
      window.sluiceGateB = true;
      window.deltaWaterLevel = 25;
      window.deltaPathRevealed = true;

      document.getElementById('puzzle-status').textContent = '✓ MECHANISM ALIGNED: Sluice gates open! Sunken route revealed!';
      quests.completeObjective('main_delta', 'solve_waterwheel', audio);

      if (window.questProgression) {
        window.questProgression.onPuzzleSolved('delta_waterwheel_gears');
        window.questProgression.onPuzzleSolved('sluice_valve_system');
      }
      if (window.investigationSystem) {
        window.investigationSystem.addEvidence('clue_waterwheel_glyph');
      }
      if (window.worldUnlockSystem) {
        window.worldUnlockSystem.unlock('chettinad', audio);
        window.worldUnlockSystem.unlock('thanjavur', audio);
      }
      window.WORLD_DATA.biomes.western_ghats.unlocked = true;

      // Diegetic save: puzzle solved
      saveManager.saveGameImmediate('auto', 'puzzle_solved');
    } else {
      window.deltaPathRevealed = false;
      document.getElementById('puzzle-status').textContent = 'Rotate granite gears to align the Chola Tiger (270°) with the Lotus rune (90°).';
    }
  }

  document.getElementById('rotate-dial-1-btn')?.addEventListener('click', () => {
    window.waterwheelDial1 = (window.waterwheelDial1 + 90) % 360;
    audio.playFootstep('dirt');
    renderWaterwheelPuzzle();
  });

  document.getElementById('rotate-dial-2-btn')?.addEventListener('click', () => {
    window.waterwheelDial2 = (window.waterwheelDial2 + 90) % 360;
    audio.playFootstep('dirt');
    renderWaterwheelPuzzle();
  });

  // 8. Camera Capture Listener (Using 3D Canvas in 3D Mode, Fixes Bug #4)
  snapPhotoBtn.addEventListener('click', () => {
    const is3D = !!(threeWorld && threeWorld.isActive);
    const activeCanvas = is3D ? (threeWorld.renderer ? threeWorld.renderer.domElement : canvas) : canvas;

    const currentBiome = getCurrentBiome(player.x);
    const detected = explorerCamera.scanSubjects(player, window.WORLD_DATA, entities, renderer.camera);
    
    // Check specific quest photo triggers
    if (detected && detected.data.id === 'jallikattu_bull') {
      quests.completeObjective('side_bull', 'photo_bull', audio);
      quests.showQuestNotification('Photo Taken: Farmer Selvam’s prize bull identified!');
    }
    if (detected && detected.data.id === 'nilgiri_tahr') {
      quests.completeObjective('main_ghats', 'photo_tahr', audio);
      quests.showQuestNotification('Photo Taken: Endangered Nilgiri Tahr documented!');
    }

    if (detected && window.investigationSystem) {
      window.investigationSystem.photographEvidence(detected.data.id);
    }
    if (detected && window.questProgression) {
      window.questProgression.onPhotoCaptured(detected.data.id, { audio });
    }

    const snap = explorerCamera.captureSnapshot(activeCanvas, detected, currentBiome.name, audio, journal);
    quests.showQuestNotification(`Snapshot Saved to Journal: ${snap.subjectName}`);
  });

  zoomSlider?.addEventListener('input', e => {
    explorerCamera.setZoom(parseFloat(e.target.value));
  });

  // 9. Buttons & Modal Listeners
  startBtn.addEventListener('click', () => {
    audio.init();
    audio.resume();
    audio.startExplorationMusic();
    audio.setWeatherAmbience('storm', 0.9);

    // Play Inciting Incident cutscene
    titleScreen.classList.add('fade-out');
    setTimeout(() => {
      titleScreen.classList.add('hidden');
      hudContainer.classList.remove('hidden');

      // Inciting Enfield roar & muddy splash
      audio.playEnfieldRoar();
      audio.playThunder();
      quests.showQuestNotification('THIEF ON ROYAL ENFIELD STOLE YOUR BLUEPRINT! Track the skids in the rain!');

      // Diegetic load: check for existing save
      const existingSave = saveManager.loadGame('auto');
      if (existingSave) {
        saveManager.restoreState(existingSave);
        quests.showQuestNotification(`📓 Journey resumed from ${existingSave.formattedTime}`);
        console.log('[Main] Restored save from', existingSave.formattedTime);
      }

      // Activate Photorealistic 3D Mode as primary view
      if (threeWorld) {
        toggle3DMode(true);
      }
    }, 900);
  });

  audioBtn.addEventListener('click', () => {
    audio.init();
    audio.resume();
    const muted = audio.toggleMute();
    audioBtn.textContent = muted ? '🔇 Unmute' : '🔊 Audio';
  });

  journalBtn.addEventListener('click', () => journal.toggle(audio));
  closeJournalBtn?.addEventListener('click', () => journal.toggle(audio));
  closeTeaBtn?.addEventListener('click', () => teaModal.classList.add('hidden'));
  closePuzzleBtn?.addEventListener('click', () => puzzleModal.classList.add('hidden'));
  cameraBtn.addEventListener('click', () => explorerCamera.toggle());
  closeCameraBtn?.addEventListener('click', () => explorerCamera.toggle());
  lanternBtn.addEventListener('click', () => {
    player.toggleLantern(audio);
    lanternBtn.classList.toggle('active', player.isLanternOn);
  });
  campfireBtn.addEventListener('click', handleDeployCampfire);
  tentBtn.addEventListener('click', handleDeployTent);

  // Multiplayer Expedition Lobby Controls & Callbacks
  function toggleLobby(forceState) {
    if (!lobbyModal) return;
    const isHidden = lobbyModal.classList.contains('hidden') || lobbyModal.style.display === 'none';
    const show = (forceState !== undefined) ? forceState : isHidden;
    if (show) {
      lobbyModal.classList.remove('hidden');
      lobbyModal.style.display = 'flex';
      if (lobbyStatus) {
        lobbyStatus.textContent = multiplayer && multiplayer.isConnected ? `Connected to server (${multiplayer.currentRoom || 'No room joined'})` : 'Ready to connect.';
        lobbyStatus.style.color = '#bdc3c7';
      }
    } else {
      lobbyModal.classList.add('hidden');
      lobbyModal.style.display = 'none';
    }
  }

  multiplayerTitleBtn?.addEventListener('click', () => toggleLobby(true));
  toggleMultiplayerBtn?.addEventListener('click', () => toggleLobby());
  closeLobbyBtn?.addEventListener('click', () => toggleLobby(false));
  playSoloBtn?.addEventListener('click', () => toggleLobby(false));

  const toggleCustomizationBtn = document.getElementById('toggle-customization-btn');
  toggleCustomizationBtn?.addEventListener('click', () => customizationUI?.toggle());

  if (multiplayer) {
    multiplayer.onStatusChange = (msg, isError) => {
      if (lobbyStatus) {
        lobbyStatus.textContent = msg;
        lobbyStatus.style.color = isError ? '#e74c3c' : '#2ecc71';
      }
    };
    multiplayer.onRoleChange = (role, isHost) => {
      if (multiplayerBtnLabel) {
        multiplayerBtnLabel.textContent = isHost ? '👑 Co-op Host' : '🧭 Explorer';
      }
    };
    multiplayer.onPlayerCountChange = (count, max) => {
      if (multiplayerBtnLabel) {
        multiplayerBtnLabel.textContent = `👥 Co-op (${count}/${max})`;
      }
    };
  }

  enterServerBtn?.addEventListener('click', () => {
    if (!multiplayer) {
      if (lobbyStatus) {
        lobbyStatus.textContent = 'Multiplayer system not initialized.';
        lobbyStatus.style.color = '#e74c3c';
      }
      return;
    }

    const name = nameInput ? nameInput.value.trim() : 'Explorer';
    const room = roomInput ? roomInput.value.trim() : 'CHENNAI_EXP';
    const serverUrl = serverUrlInput ? serverUrlInput.value.trim() : '';

    if (!room) {
      if (lobbyStatus) {
        lobbyStatus.textContent = 'Please enter a valid Expedition Room Code.';
        lobbyStatus.style.color = '#e74c3c';
      }
      return;
    }

    if (lobbyStatus) {
      lobbyStatus.textContent = 'Connecting to expedition room...';
      lobbyStatus.style.color = '#f39c12';
    }

    multiplayer.joinRoom(room, name, serverUrl || undefined);

    // If starting from title screen, launch the game
    setTimeout(() => {
      if (titleScreen && !titleScreen.classList.contains('hidden')) {
        startBtn.click();
      }
      toggleLobby(false);
    }, 800);
  });

  // Journal tab switcher buttons
  document.querySelectorAll('.journal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      journal.switchTab(btn.dataset.tab, audio);
    });
  });

  function getCurrentBiome(px) {
    if (px < 2000) return window.WORLD_DATA.biomes.chennai_plains;
    if (px < 4000) return window.WORLD_DATA.biomes.pichavaram_delta;
    return window.WORLD_DATA.biomes.western_ghats;
  }

  // 10. Main Game Loop
  let lastTime = performance.now();
  let lastBiomeName = null; // Track biome transitions for autosave

  function gameLoop(now) {
    const deltaTime = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    const currentBiome = getCurrentBiome(player.x);

    // Diegetic autosave on biome transition
    if (lastBiomeName && currentBiome.name !== lastBiomeName) {
      saveManager.saveGame('auto', 'biome_enter');
    }
    lastBiomeName = currentBiome.name;

    // Update Systems
    weather.update(deltaTime, player.x, audio);
    lighting.update(deltaTime, weather);

    // Check if player is near campfire
    const isNearFire = survival.campfires.some(f => Math.hypot(f.x - player.x, f.y - player.y) < 130);
    survival.update(deltaTime, player.x, weather, isNearFire);

    // Update Player & Entities
    const worldBounds = { minX: 0, maxX: 6000, minY: 100, maxY: 1100 };
    player.update(input, deltaTime, worldBounds, tracksManager, audio, survival, weather);
    entities.update(deltaTime);
    tracksManager.update(weather.current, deltaTime);
    particles.update(weather.current, deltaTime, canvas.width, canvas.height, renderer.camera);

    // Check nearest interactable
    player.nearbyInteractable = null;
    let closestDist = 85;

    // Check landmarks
    window.WORLD_DATA.landmarks.forEach(lm => {
      const d = Math.hypot(lm.x - player.x, lm.y - player.y);
      if (d < closestDist && lm.interactable) {
        closestDist = d;
        player.nearbyInteractable = lm;
      }
    });

    // Check NPCs
    entities.npcs.forEach(npc => {
      const d = Math.hypot(npc.x - player.x, npc.y - player.y);
      if (d < closestDist) {
        closestDist = d;
        player.nearbyInteractable = {
          id: npc.interactId,
          x: npc.x,
          y: npc.y,
          interactionPrompt: `Talk to ${npc.name}`
        };
      }
    });

    // Check tents
    survival.tents.forEach(tent => {
      const d = Math.hypot(tent.x - player.x, tent.y - player.y);
      if (d < 60) {
        player.nearbyInteractable = {
          type: 'tent',
          x: tent.x,
          y: tent.y,
          interactionPrompt: 'Rest in Tent (Gain Rested Buff)'
        };
      }
    });

    // Update Camera
    renderer.updateCamera(player, worldBounds);

    // Camera Scan HUD Tag
    if (explorerCamera.isActive) {
      const detected = explorerCamera.scanSubjects(player, window.WORLD_DATA, entities, renderer.camera);
      if (detected) {
        cameraSubjectTag.textContent = `[TARGET ACQUIRED: ${detected.data.tamilName || detected.data.name}]`;
        cameraSubjectTag.style.color = '#55efc4';
      } else {
        cameraSubjectTag.textContent = '[SEARCHING LANDSCAPE...]';
        cameraSubjectTag.style.color = '#ffeaa7';
      }
    }

    // --- RENDERING PIPELINE ---
    const ctx = renderer.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Terrain & Water Channels
    renderer.drawTerrain(window.WORLD_DATA, weather.current, deltaTime);

    // 2. Footprints & Tyre Tracks Decals
    tracksManager.draw(ctx, renderer.camera);

    // 3. Depth-sorted Entities & World Objects
    const renderList = [];

    // Add trees/foliage
    generatedTrees.forEach(t => {
      if (t.x >= renderer.camera.x - 100 && t.x <= renderer.camera.x + renderer.camera.viewportWidth + 100) {
        renderList.push({ type: 'tree', y: t.y, obj: t });
      }
    });

    // Add landmarks
    window.WORLD_DATA.landmarks.forEach(lm => {
      if (lm.x >= renderer.camera.x - 200 && lm.x <= renderer.camera.x + renderer.camera.viewportWidth + 200) {
        renderList.push({ type: 'landmark', y: lm.y, obj: lm });
      }
    });

    // Add camp items
    survival.campfires.forEach(f => renderList.push({ type: 'campfire', y: f.y, obj: f }));
    survival.tents.forEach(t => renderList.push({ type: 'tent', y: t.y, obj: t }));

    // Add player
    renderList.push({ type: 'player', y: player.y, obj: player });

    // Sort by Y for 2.5D depth
    renderList.sort((a, b) => a.y - b.y);

    // Draw sorted items
    renderList.forEach(item => {
      if (item.type === 'tree') {
        renderer.drawFoliage(ctx, item.obj, renderer.camera);
      } else if (item.type === 'landmark') {
        renderer.drawStructure(ctx, item.obj, renderer.camera);
      } else if (item.type === 'campfire') {
        renderer.drawCampItems(ctx, [item.obj], [], renderer.camera);
        particles.spawnEmbers(item.obj.x, item.obj.y - 6);
      } else if (item.type === 'tent') {
        renderer.drawCampItems(ctx, [], [item.obj], renderer.camera);
      } else if (item.type === 'player') {
        player.draw(ctx, renderer.camera, survival, explorerCamera);
      }
    });

    // 4. Update and Draw Living Entities
    entities.update(deltaTime, player, survival, lighting.timeOfDay, weather.current);
    entities.draw(ctx, renderer.camera);

    // 4b. Update Footstep & Biomechanics Audio & Spatial Listener
    if (audioManager && audioManager.footsteps) {
      const activeP = (threeWorld && threeWorld.isActive && threeWorld.player) ? threeWorld.player : player;
      audioManager.footsteps.update(deltaTime, activeP);
    }
    if (audioManager && audioManager.spatial && threeWorld && threeWorld.camera) {
      audioManager.spatial.updateListener(threeWorld.camera);
    }

    // 5. World particles (Ripples, Embers, Mountain Fog)
    particles.drawWorldParticles(ctx, renderer.camera, weather.current);

    // 6. Dynamic Day/Night Lighting Pass
    lighting.drawLightingPass(ctx, renderer.camera, player, survival.campfires);

    // 7. Screen-space Weather Rain Streaks
    particles.drawWeather(ctx, canvas.width, canvas.height);

    // Sync 3D lightning flash if active
    if (weather.isLightning && threeWorld && threeWorld.isActive) {
      threeWorld.triggerLightning(1.0);
    }

    // 8. Interaction Prompt overlay
    renderer.drawInteractionPrompt(ctx, player, renderer.camera);

    // 9. Sync 2D position with multiplayer room if 3D engine is inactive
    if ((!threeWorld || !threeWorld.isActive) && multiplayer && multiplayer.isConnected && multiplayer.currentRoom) {
      const pos3D = threeWorld ? threeWorld.world2DTo3D(player.x, player.y) : { x: (player.x / 10.0) - 300.0, z: (player.y - 600.0) / 5.0 };
      const isSprint = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
      multiplayer.emitMyTransform(
        { x: pos3D.x, y: 0, z: pos3D.z },
        player.angle || 0,
        player.isMoving ? (isSprint ? 'sprint' : 'walk') : 'idle'
      );
    }

    // --- UPDATE HUD ---
    updateHUD(currentBiome);

    requestAnimationFrame(gameLoop);
  }

  function updateHUD(biome) {
    if (hungerBar) hungerBar.style.width = `${survival.hunger}%`;
    if (thirstBar) thirstBar.style.width = `${survival.thirst}%`;
    if (energyBar) energyBar.style.width = `${survival.energy}%`;
    if (tempGauge) {
      tempGauge.textContent = `${survival.coreTemp.toFixed(1)}°C`;
      tempGauge.style.color = survival.coreTemp < 34 ? '#74b9ff' : (survival.coreTemp > 38 ? '#ff7675' : '#55efc4');
    }
    if (timeDisplay) timeDisplay.textContent = lighting.getFormattedTime();
    if (weatherBadge) weatherBadge.textContent = weather.getDisplayName();
    if (biomeTitle) {
      if (threeWorld && threeWorld.isActive && threeWorld.isMacroView()) {
        biomeTitle.textContent = 'TAMIL NADU REGIONAL SURVEY (மேக்ரோ வரைபடம்)';
      } else {
        biomeTitle.textContent = biome.name;
      }
    }
    if (rupeeCount) rupeeCount.textContent = `₹${survival.currency}`;

    // Real Tamil Nadu GPS Telemetry
    if (window.getRealTamilNaduTelemetry) {
      const telemetry = window.getRealTamilNaduTelemetry(player.x);
      const gpsBadge = document.getElementById('gps-coords');
      if (gpsBadge) {
        gpsBadge.textContent = `📍 ${telemetry.lat}° N, ${telemetry.lng}° E • ${telemetry.region}`;
      }
    }

    // Compass heading
    if (compassNeedle) {
      const headingDeg = (player.angle * 180 / Math.PI) + 90;
      compassNeedle.style.transform = `rotate(${headingDeg}deg)`;
    }

    // Professional PC Game HUD update
    if (gameHUD) {
      gameHUD.update(player.angle || 0, survival, player.nearbyInteractable);
    }
  }

  // Start game loop
  requestAnimationFrame(gameLoop);
});
