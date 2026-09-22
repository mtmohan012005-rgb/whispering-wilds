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

  // Attach global references
  window.gameQuests = quests;
  window.gameJournal = journal;
  window.gameSurvival = survival;
  window.gamePlayer = player;
  window.gameSaveManager = saveManager;
  window.testRef = { player, renderer, lighting, particles, tracksManager, weather, survival, camera: explorerCamera, journal, quests, entities, saveManager };
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
    if (!player.nearbyInteractable) return;
    const item = player.nearbyInteractable;

    if (item.id === 'tea_kadai' || item.id === 'murugan') {
      openTeaKadai();
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
      journal.toggle(audio);
      journal.switchTab('quests', audio);
    } else if (item.id === 'enfield_tracks_site') {
      quests.completeObjective('main_prologue', 'follow_tracks', audio);
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
      quests.completeObjective('main_ghats', 'unlock_portal', audio);
      audio.playDiscoveryJingle();
      alert('🌟 CONGRATULATIONS! You have unlocked the fabled subterranean Pasumai Thadam Eco-Sanctuary, preserving Tamil Nadu’s ancient botanical heritage from the corporate syndicate!');
    } else if (item.type === 'tent') {
      survival.sleepInTent(lighting, audio);
      quests.showQuestNotification('Rested until dawn! Gained Stamina Recovery Buff.');
      // Diegetic save: slept in tent
      saveManager.saveGame('auto', 'tent_sleep');
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

  // 7. Chola Waterwheel Puzzle
  let waterwheelDial1 = 0;
  let waterwheelDial2 = 0;
  function openWaterwheelPuzzle() {
    puzzleModal.classList.remove('hidden');
    audio.playPinTap();
    renderWaterwheelPuzzle();
  }

  function renderWaterwheelPuzzle() {
    const dial1El = document.getElementById('puzzle-dial-1');
    const dial2El = document.getElementById('puzzle-dial-2');
    if (dial1El) dial1El.style.transform = `rotate(${waterwheelDial1}deg)`;
    if (dial2El) dial2El.style.transform = `rotate(${waterwheelDial2}deg)`;

    // Check solution (Lotus at 90 deg, Tiger at 270 deg)
    if (waterwheelDial1 === 90 && waterwheelDial2 === 270) {
      document.getElementById('puzzle-status').textContent = '✓ MECHANISM ALIGNED: Sluice gates open! Western Ghats unlocked!';
      quests.completeObjective('main_delta', 'solve_waterwheel', audio);
      window.WORLD_DATA.biomes.western_ghats.unlocked = true;
      // Diegetic save: puzzle solved
      saveManager.saveGameImmediate('auto', 'puzzle_solved');
    } else {
      document.getElementById('puzzle-status').textContent = 'Rotate granite gears to align the Chola Tiger with the Lotus rune.';
    }
  }

  document.getElementById('rotate-dial-1-btn')?.addEventListener('click', () => {
    waterwheelDial1 = (waterwheelDial1 + 90) % 360;
    audio.playFootstep('dirt');
    renderWaterwheelPuzzle();
  });

  document.getElementById('rotate-dial-2-btn')?.addEventListener('click', () => {
    waterwheelDial2 = (waterwheelDial2 + 90) % 360;
    audio.playFootstep('dirt');
    renderWaterwheelPuzzle();
  });

  // 8. Camera Capture Listener
  snapPhotoBtn.addEventListener('click', () => {
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

    const snap = explorerCamera.captureSnapshot(canvas, detected, currentBiome.name, audio, journal);
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
    player.update(input, deltaTime, worldBounds, tracksManager, audio, survival);
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

    // 4. Living NPCs & Wildlife
    entities.draw(ctx, renderer.camera);

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
  }

  // Start game loop
  requestAnimationFrame(gameLoop);
});
