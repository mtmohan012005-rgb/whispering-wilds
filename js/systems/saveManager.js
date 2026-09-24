// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DIEGETIC SAVE SYSTEM (SaveManager)
// Persist game state via journal entries, tea-stall rests, and key milestones.
// Uses localStorage — fully diegetic, no explicit "Save" button.
// ============================================================================

class SaveManager {
  constructor() {
    this.STORAGE_PREFIX = 'whisperingWilds_save_';
    this._debounceTimer = null;
    this._debounceMs = 600; // prevent rapid duplicate writes
    this._lastSaveTimestamp = 0;
  }

  // ------------------------------------------------------------------
  // CORE: Serialize the full game state into a storable JSON object
  // ------------------------------------------------------------------
  _gatherState() {
    const player   = window.gamePlayer;
    const survival = window.gameSurvival;
    const journal  = window.gameJournal;
    const quests   = window.gameQuests;
    const lighting = window.testRef && window.testRef.lighting;
    const weather  = window.testRef && window.testRef.weather;

    if (!player || !survival) {
      console.warn('[SaveManager] Cannot gather state — player or survival not ready.');
      return null;
    }

    return {
      version: 3,
      saveVersion: 3,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleString('en-IN'),

      // Player position & status
      player: {
        x: player.x,
        y: player.y,
        angle: player.angle || 0,
        isLanternOn: player.isLanternOn || false,
        outfitId: player.outfitId || 'everyday_veshti',
        hairstyleId: player.hairstyleId || 'short_traditional_part',
        accessoryId: player.accessoryId || 'none',
        footwearId: player.footwearId || 'kolhapuri_sandals',
        customizationChangesUsed: (window.GameState && window.GameState.player && typeof window.GameState.player.customizationChangesUsed === 'number')
          ? window.GameState.player.customizationChangesUsed
          : (window.playerCustomizationSystem ? window.playerCustomizationSystem.customizationChangesUsed : (player.customizationChangesUsed || 0)),
        maxCustomizationChanges: 5,
        customizationHistory: window.playerCustomizationSystem ? window.playerCustomizationSystem.history : (player.customizationHistory || []),
        equippedOutfit: player.equippedOutfit ? {
          itemId: player.equippedOutfit.itemId,
          outfitId: player.equippedOutfit.outfitId || player.equippedOutfit.outfitKey,
          outfitKey: player.equippedOutfit.outfitKey,
          stats: player.equippedOutfit.stats
        } : null,
        inventory: player.inventory || [],
        survival: (window.GameState && window.GameState.player && window.GameState.player.survival) ? JSON.parse(JSON.stringify(window.GameState.player.survival)) : null
      },

      // Audio Settings
      audioSettings: window.audioManager ? window.audioManager.getSettings() : {
        masterVolume: 0.8,
        musicVolume: 0.6,
        ambienceVolume: 0.7,
        sfxVolume: 0.8,
        dialogueVolume: 0.9,
        wildlifeVolume: 0.7,
        isMuted: false,
        language: 'tamil',
        subtitleMode: 'bilingual'
      },

      // Survival vitals & supplies
      survival: {
        health: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.health : (survival.health || 100),
        maxHealth: 100,
        energy: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.energy : survival.energy,
        maxEnergy: 100,
        hydration: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.hydration : (survival.thirst || 100),
        maxHydration: 100,
        hunger: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.hunger : survival.hunger,
        maxHunger: 100,
        warmth: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.warmth : (survival.coreTemp || 80),
        maxWarmth: 100,
        wetness: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.wetness : 0,
        statusEffects: (window.GameState && window.GameState.player && window.GameState.player.survival) ? [...window.GameState.player.survival.statusEffects] : [],
        persistentCamps: window.campingSystem ? window.campingSystem.serializePersistentCamps() : [],
        safeRespawn: window.emergencySystem ? window.emergencySystem.lastSafePosition : null,
        thirst: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.hydration : (survival.thirst || 100),
        coreTemp: (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.warmth : (survival.coreTemp || 80),
        currency: survival.currency,
        baseTier: survival.baseTier,
        hasRestedBuff: survival.hasRestedBuff,
        restedTimer: survival.restedTimer,
        inventory: { ...survival.inventory },
        campfires: survival.campfires.map(f => ({ x: f.x, y: f.y })),
        tents: survival.tents.map(t => ({ x: t.x, y: t.y }))
      },

      // Journal / progress
      journal: {
        unlockedEntries: journal ? [...journal.unlockedEntries] : [],
        pinnedClues: journal ? [...journal.pinnedClues] : [],
        yarnConnections: journal ? journal.yarnConnections : [],
        photoCount: journal ? journal.photos.length : 0
        // Note: actual photo dataUrls are NOT persisted (too large).
      },

      // Quest progress (legacy compatibility)
      quests: quests ? quests.quests.map(q => ({
        id: q.id,
        status: q.status,
        objectives: q.objectives.map(o => ({ id: o.id, done: o.done }))
      })) : [],

      // Authoritative Quest Progression
      questProgression: window.questProgression ? window.questProgression.getState() : null,

      // Investigation System & Evidence
      investigation: window.investigationSystem ? window.investigationSystem.getState() : null,

      // World Unlock System (8 Regions)
      worldUnlocks: window.worldUnlockSystem ? window.worldUnlockSystem.getState() : null,

      // Reusable Delta Puzzle States
      puzzles: {
        waterwheel: {
          dial1: window.waterwheelDial1 !== undefined ? window.waterwheelDial1 : 0,
          dial2: window.waterwheelDial2 !== undefined ? window.waterwheelDial2 : 0,
          sluiceA: window.sluiceGateA !== undefined ? window.sluiceGateA : false,
          sluiceB: window.sluiceGateB !== undefined ? window.sluiceGateB : false,
          sluiceC: window.sluiceGateC !== undefined ? window.sluiceGateC : false,
          waterLevel: window.deltaWaterLevel !== undefined ? window.deltaWaterLevel : 100,
          pathRevealed: window.deltaPathRevealed !== undefined ? window.deltaPathRevealed : false
        },
        deltaWaterwheel: window.deltaWaterwheelPuzzleState ? { ...window.deltaWaterwheelPuzzleState } : {
          waterwheelDial1: window.waterwheelDial1 !== undefined ? window.waterwheelDial1 : 0,
          waterwheelDial2: window.waterwheelDial2 !== undefined ? window.waterwheelDial2 : 0,
          sluiceGateA: window.sluiceGateA !== undefined ? window.sluiceGateA : false,
          sluiceGateB: window.sluiceGateB !== undefined ? window.sluiceGateB : false,
          deltaWaterLevel: window.deltaWaterLevel !== undefined ? window.deltaWaterLevel : 1.0,
          deltaPathRevealed: window.deltaPathRevealed !== undefined ? window.deltaPathRevealed : false
        }
      },

      // Reusable Puzzle System
      puzzleSystem: window.puzzleSystem ? window.puzzleSystem.getState() : null,

      // Exploration & Traversal State
      exploration: window.explorationSystem ? window.explorationSystem.getState() : null,

      // Cultural Life & Festival System
      culturalLife: window.culturalLifeSystem ? window.culturalLifeSystem.getState() : null,
      festival: window.festivalSystem ? window.festivalSystem.getState() : null,

      // Phase 1: Progression, Achievements & Codex
      achievements: window.AchievementSystem ? window.AchievementSystem.serialize() : null,
      codex: window.CodexSystem ? window.CodexSystem.serialize() : null,
      discoveries: window.DiscoveryProgression ? window.DiscoveryProgression.serialize() : null,

      // Phase 2: Main Story, Side Quests, Secrets & Collectibles
      storyContent: window.StoryContentSystem ? window.StoryContentSystem.serialize() : null,
      sideQuests: window.SideQuestSystem ? window.SideQuestSystem.serialize() : null,
      secrets: window.SecretDiscoverySystem ? window.SecretDiscoverySystem.serialize() : null,
      collectibles: window.CollectibleSystem ? window.CollectibleSystem.serialize() : null,
      replay: window.ReplaySystem ? window.ReplaySystem.serialize() : null,

      // Story flags
      storyFlags: window.STORY_FLAGS ? Array.from(window.STORY_FLAGS) : [],

      // Day/night & weather snapshot
      world: {
        timeOfDay: lighting ? lighting.timeOfDay : 21,
        weatherType: weather ? weather.current.type : 'storm'
      },

      // Biome unlock flags
      biomes: {
        chennai_plains: true,
        pichavaram_delta: window.WORLD_DATA?.biomes?.pichavaram_delta?.unlocked ?? false,
        western_ghats: window.WORLD_DATA?.biomes?.western_ghats?.unlocked ?? false
      }
    };
  }

  // ------------------------------------------------------------------
  // PUBLIC: Save current game state (debounced)
  // ------------------------------------------------------------------
  saveGame(slot = 'auto', reason = 'autosave') {
    // Debounce rapid-fire saves (e.g. multiple quest completions)
    if (this._debounceTimer) clearTimeout(this._debounceTimer);

    this._debounceTimer = setTimeout(() => {
      this._performSave(slot, reason);
    }, this._debounceMs);
  }

  // Immediate save (bypass debounce — for manual / critical saves)
  saveGameImmediate(slot = 'auto', reason = 'manual') {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._performSave(slot, reason);
  }

  _performSave(slot, reason) {
    const state = this._gatherState();
    if (!state) return false;

    state.saveReason = reason;

    try {
      const key = this.STORAGE_PREFIX + slot;
      const backupKey = key + '_backup';
      const tmpKey = key + '_tmp';

      // 1. Atomic write to temporary slot first
      const serialized = JSON.stringify(state);
      localStorage.setItem(tmpKey, serialized);

      // 2. Validate written temporary payload
      const readBack = localStorage.getItem(tmpKey);
      if (!readBack || readBack.length !== serialized.length) {
        throw new Error('Atomic write validation failed: length mismatch');
      }
      JSON.parse(readBack); // verify JSON integrity

      // 3. Keep previous valid save snapshot as backup
      const existingRaw = localStorage.getItem(key);
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (parsed && (parsed.saveVersion || parsed.version)) {
            localStorage.setItem(backupKey, existingRaw);
          }
        } catch (_) {}
      } else if (!localStorage.getItem(backupKey)) {
        localStorage.setItem(backupKey, readBack);
      }

      // 4. Commit temporary key to main key
      localStorage.setItem(key, readBack);
      localStorage.removeItem(tmpKey);

      // 5. Store last known safe state for crash recovery
      try {
        localStorage.setItem('ww_last_safe_state', readBack);
      } catch (_) {}

      this._lastSaveTimestamp = state.timestamp;

      console.log(`[SaveManager] ✓ Game saved (slot: ${slot}, reason: ${reason}) at ${state.formattedTime}`);

      // Fire visual feedback toast
      this._showSaveToast(reason);
      return true;
    } catch (err) {
      console.error('[SaveManager] Save failed:', err);
      return false;
    }
  }

  _showSaveToast(reason = '') {
    if (typeof document === 'undefined' || !document.body) return;
    let toast = document.getElementById('ww-save-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ww-save-toast';
      toast.style.cssText = [
        'position:fixed;bottom:24px;right:24px;z-index:9000;',
        'background:rgba(15,25,35,0.85);backdrop-filter:blur(8px);',
        'border:1px solid rgba(226,201,126,0.3);color:#e2c97e;',
        'padding:8px 16px;border-radius:6px;font-family:Inter,sans-serif;',
        'font-size:12px;display:flex;align-items:center;gap:8px;',
        'transition:opacity 0.3s ease;pointer-events:none;opacity:0;'
      ].join('');
      document.body.appendChild(toast);
    }

    toast.innerHTML = '<span>💾</span> <span>சேமிக்கப்படுகிறது... (Saving...)</span>';
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.innerHTML = '<span>✓</span> <span>சேமிக்கப்பட்டது (Saved)</span>';
      setTimeout(() => {
        toast.style.opacity = '0';
      }, 1200);
    }, 400);
  }

  // ------------------------------------------------------------------
  // SAVE MIGRATION PIPELINE (v1 -> v2 -> v3)
  // ------------------------------------------------------------------
  migrateSave(rawState) {
    if (!rawState || typeof rawState !== 'object') return null;
    const state = JSON.parse(JSON.stringify(rawState));
    let ver = state.saveVersion || state.version || 1;

    // Version 1 -> Version 2: Ensure quest progression, investigation, and world unlock structures
    if (ver === 1) {
      if (!state.questProgression && state.quests) {
        state.questProgression = { active: [], completed: [], objectives: {} };
      }
      if (!state.worldUnlocks) {
        state.worldUnlocks = { unlockedRegions: ['george_town', 'cauvery_delta'] };
      }
      ver = 2;
    }

    // Version 2 -> Version 3: Authoritative GameState consolidation
    if (ver === 2) {
      if (state.player) {
        state.player.customizationChangesUsed = Math.max(0, Math.min(5, Number(state.player.customizationChangesUsed) || 0));
        state.player.maxCustomizationChanges = 5;
        if (!state.player.outfitId && state.player.currentOutfit) {
          state.player.outfitId = state.player.currentOutfit;
        }
      }
      if (state.survival) {
        state.survival.currency = Math.max(0, Math.floor(Number(state.survival.currency) || 0));
      }
      state.saveVersion = 3;
      state.version = 3;
      ver = 3;
    }

    return state;
  }

  // ------------------------------------------------------------------
  // STRICT DATA VALIDATION & SANITIZATION
  // ------------------------------------------------------------------
  validateSaveData(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Save data is not an object.'], sanitized: null };
    }

    const sanitized = JSON.parse(JSON.stringify(data));

    // 1. Validate & clamp player fields
    if (sanitized.player) {
      const p = sanitized.player;
      p.x = (typeof p.x === 'number' && isFinite(p.x)) ? Math.max(0, Math.min(10000, p.x)) : 220;
      p.y = (typeof p.y === 'number' && isFinite(p.y)) ? Math.max(0, Math.min(3000, p.y)) : 630;
      p.customizationChangesUsed = Math.max(0, Math.min(5, Math.floor(Number(p.customizationChangesUsed) || 0)));
      p.maxCustomizationChanges = 5;
    } else {
      errors.push('Missing player state in save payload.');
    }

    // 2. Validate & clamp survival vitals
    if (sanitized.survival) {
      const s = sanitized.survival;
      const sanitizeNum = (v, min, max, def) => {
        if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) return def;
        return Math.max(min, Math.min(max, v));
      };

      s.health = sanitizeNum(s.health, 0, 100, 100);
      s.energy = sanitizeNum(s.energy, 0, 100, 100);
      s.hydration = sanitizeNum(s.hydration !== undefined ? s.hydration : s.thirst, 0, 100, 100);
      s.hunger = sanitizeNum(s.hunger, 0, 100, 100);
      s.warmth = sanitizeNum(s.warmth !== undefined ? s.warmth : s.coreTemp, 0, 100, 80);
      s.wetness = sanitizeNum(s.wetness, 0, 100, 0);

      s.thirst = s.hydration;
      s.coreTemp = s.warmth;
      s.currency = Math.max(0, Math.floor(Number(s.currency) || 0));
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }

  createSavePayload(slot = 'manual', reason = 'save') {
    return this._gatherState();
  }

  loadFromPayload(payload) {
    if (!payload) return false;
    const validated = this.validateSaveData(payload);
    if (!validated.valid && !validated.sanitized) return false;
    return this.restoreState(validated.sanitized || payload);
  }

  _validateAndSanitizeSurvival(survival) {
    const valObj = { player: { x: 0, y: 0 }, survival };
    const res = this.validateSaveData(valObj);
    return res.sanitized ? res.sanitized.survival : survival;
  }

  // ------------------------------------------------------------------
  // PUBLIC: Load game state from localStorage with migration & validation
  // ------------------------------------------------------------------
  loadGame(slot = 'auto') {
    const key = this.STORAGE_PREFIX + slot;
    let raw = localStorage.getItem(key);
    let fromBackup = false;

    // If primary save is missing, try backup snapshot
    if (!raw) {
      raw = localStorage.getItem(key + '_backup');
      if (raw) fromBackup = true;
    }

    if (!raw) return null;

    try {
      let parsed = JSON.parse(raw);
      let migrated = this.migrateSave(parsed);
      let validation = this.validateSaveData(migrated);

      // If primary save failed validation, attempt fallback to backup
      if (!validation.valid && !fromBackup) {
        console.warn('[SaveManager] Primary save corrupt, attempting recovery from backup snapshot...');
        const backupRaw = localStorage.getItem(key + '_backup');
        if (backupRaw) {
          try {
            parsed = JSON.parse(backupRaw);
            migrated = this.migrateSave(parsed);
            validation = this.validateSaveData(migrated);
            if (validation.valid) {
              console.log('[SaveManager] ✓ Successfully recovered state from backup snapshot!');
              fromBackup = true;
            }
          } catch (_) {}
        }
      }

      if (!validation.valid) {
        console.warn('[SaveManager] Corrupt save rejected:', validation.errors);
        return null;
      }

      console.log(`[SaveManager] Found save (slot: ${slot}${fromBackup ? ' [BACKUP]' : ''}, v${validation.sanitized.saveVersion || validation.sanitized.version}), saved at ${validation.sanitized.formattedTime}`);
      return validation.sanitized;
    } catch (err) {
      console.error('[SaveManager] Load failed:', err);
      // Attempt emergency recovery from backup
      if (!fromBackup) {
        try {
          const backupRaw = localStorage.getItem(key + '_backup');
          if (backupRaw) {
            const parsed = JSON.parse(backupRaw);
            const migrated = this.migrateSave(parsed);
            const validation = this.validateSaveData(migrated);
            if (validation.valid) {
              console.log('[SaveManager] ✓ Recovered from emergency backup after error.');
              return validation.sanitized;
            }
          }
        } catch (_) {}
      }
      return null;
    }
  }

  // ------------------------------------------------------------------
  // PUBLIC: Restore game state to live objects
  // ------------------------------------------------------------------
  restoreState(state) {
    if (!state) return false;

    const player   = window.gamePlayer || (window.testRef && window.testRef.player);
    const survival = window.gameSurvival || (window.testRef && window.testRef.survival);
    const journal  = window.gameJournal || (window.testRef && window.testRef.journal);
    const quests   = window.gameQuests || (window.testRef && window.testRef.quests);
    const lighting = window.testRef && window.testRef.lighting;

    // --- Player ---
    if (player && state.player) {
      player.x = state.player.x;
      player.y = state.player.y;
      player.angle = state.player.angle || 0;
      player.isLanternOn = state.player.isLanternOn || false;
      const targetOutfit = state.player.outfitId || state.player.currentOutfit || 'everyday_veshti';
      player.outfitId = targetOutfit;
      player.hairstyleId = state.player.hairstyleId || 'short_traditional_part';
      player.accessoryId = state.player.accessoryId || 'none';
      player.footwearId = state.player.footwearId || 'kolhapuri_sandals';
      player.appearancePresetId = state.player.appearancePresetId || 'everyday_explorer';

      // Clamp changes used strictly between 0 and 5
      const rawUsed = Number(state.player.customizationChangesUsed);
      player.customizationChangesUsed = isNaN(rawUsed) ? 0 : Math.max(0, Math.min(5, Math.floor(rawUsed)));
      player.maxCustomizationChanges = 5;
      player.customizationHistory = Array.isArray(state.player.customizationHistory) ? state.player.customizationHistory.slice(0, 5) : [];

      if (player.setOutfit) player.setOutfit(targetOutfit);
      if (window.threeWorld && window.threeWorld.player) {
        window.threeWorld.player.setOutfit(targetOutfit);
      }
      player.equippedOutfit = state.player.equippedOutfit || null;
      player.inventory = state.player.inventory || [];

      // Restore to PlayerCustomizationSystem
      if (window.playerCustomizationSystem) {
        window.playerCustomizationSystem.deserialize({
          outfitId: player.outfitId,
          hairstyleId: player.hairstyleId,
          accessoryId: player.accessoryId,
          footwearId: player.footwearId,
          appearancePresetId: player.appearancePresetId,
          customizationChangesUsed: player.customizationChangesUsed,
          maxCustomizationChanges: 5,
          history: player.customizationHistory
        });
      }

      if (window.GameState && window.GameState.player) {
        window.GameState.player.customizationChangesUsed = player.customizationChangesUsed;
      }
    }

    // --- Audio Settings ---
    if (window.audioManager && state.audioSettings) {
      window.audioManager.applySettings(state.audioSettings);
    }

    // --- Authoritative Survival & Camping State ---
    if (state.survival) {
      if (window.GameState && window.GameState.player && window.GameState.player.survival) {
        const gs = window.GameState.player.survival;
        gs.health = typeof state.survival.health === 'number' ? state.survival.health : 100;
        gs.energy = typeof state.survival.energy === 'number' ? state.survival.energy : 100;
        gs.hydration = typeof state.survival.hydration === 'number' ? state.survival.hydration : (state.survival.thirst || 100);
        gs.hunger = typeof state.survival.hunger === 'number' ? state.survival.hunger : 100;
        gs.warmth = typeof state.survival.warmth === 'number' ? state.survival.warmth : (state.survival.coreTemp || 80);
        gs.wetness = typeof state.survival.wetness === 'number' ? state.survival.wetness : 0;
        gs.statusEffects = Array.isArray(state.survival.statusEffects) ? [...state.survival.statusEffects] : [];
      }

      if (survival) {
        survival.hunger = state.survival.hunger;
        survival.thirst = state.survival.hydration !== undefined ? state.survival.hydration : state.survival.thirst;
        survival.energy = state.survival.energy;
        survival.coreTemp = state.survival.warmth !== undefined ? state.survival.warmth : state.survival.coreTemp;
        survival.currency = state.survival.currency;
        survival.baseTier = state.survival.baseTier;
        survival.hasRestedBuff = state.survival.hasRestedBuff;
        survival.restedTimer = state.survival.restedTimer;
        survival.inventory = { ...state.survival.inventory };
        survival.campfires = (state.survival.campfires || []).map(f => ({ ...f, createdAt: Date.now() }));
        survival.tents = (state.survival.tents || []).map(t => ({ ...t, createdAt: Date.now() }));
      }

      if (window.campingSystem && state.survival.persistentCamps) {
        window.campingSystem.loadPersistentCamps(state.survival.persistentCamps);
      }
      if (window.emergencySystem && state.survival.safeRespawn) {
        window.emergencySystem.setSafeCheckpoint(state.survival.safeRespawn);
      }
    }

    // --- Journal ---
    if (journal && state.journal) {
      journal.unlockedEntries = new Set(state.journal.unlockedEntries || []);
      journal.pinnedClues = new Set(state.journal.pinnedClues || []);
      journal.yarnConnections = state.journal.yarnConnections || [];
    }

    // --- Quests (Legacy + Authoritative) ---
    if (quests && state.quests) {
      state.quests.forEach(sq => {
        const liveQuest = quests.quests.find(q => q.id === sq.id);
        if (liveQuest) {
          liveQuest.status = sq.status;
          sq.objectives.forEach(so => {
            const obj = liveQuest.objectives.find(o => o.id === so.id);
            if (obj) obj.done = so.done;
          });
        }
      });
    }

    // --- Authoritative Quest Progression Engine ---
    if (window.questProgression && state.questProgression) {
      window.questProgression.restoreState(state.questProgression);
      if (quests && quests.syncLegacyQuests) {
        quests.syncLegacyQuests();
      }
    }

    // --- Investigation System & Clues ---
    if (window.investigationSystem && state.investigation) {
      window.investigationSystem.restoreState(state.investigation);
    }

    // --- World Unlock System ---
    if (window.worldUnlockSystem && state.worldUnlocks) {
      window.worldUnlockSystem.restoreState(state.worldUnlocks);
    }

    // --- Reusable Delta Puzzle States ---
    if (state.puzzles) {
      if (state.puzzles.waterwheel) {
        const pw = state.puzzles.waterwheel;
        window.waterwheelDial1 = pw.dial1 !== undefined ? pw.dial1 : 0;
        window.waterwheelDial2 = pw.dial2 !== undefined ? pw.dial2 : 0;
        window.sluiceGateA = pw.sluiceA !== undefined ? pw.sluiceA : false;
        window.sluiceGateB = pw.sluiceB !== undefined ? pw.sluiceB : false;
        window.sluiceGateC = pw.sluiceC !== undefined ? pw.sluiceC : false;
        window.deltaWaterLevel = pw.waterLevel !== undefined ? pw.waterLevel : 100;
        window.deltaPathRevealed = pw.pathRevealed !== undefined ? pw.pathRevealed : false;
      }
      if (state.puzzles.deltaWaterwheel) {
        if (!window.deltaWaterwheelPuzzleState) window.deltaWaterwheelPuzzleState = {};
        Object.assign(window.deltaWaterwheelPuzzleState, state.puzzles.deltaWaterwheel);
      }
    }

    // --- Reusable Puzzle Engine State ---
    if (window.puzzleSystem && state.puzzleSystem) {
      window.puzzleSystem.applyState(state.puzzleSystem);
    }

    // --- Exploration & Traversal State ---
    if (window.explorationSystem && state.exploration) {
      window.explorationSystem.applyState(state.exploration);
    }

    // --- Cultural Life & Festival System ---
    if (window.culturalLifeSystem && state.culturalLife) {
      window.culturalLifeSystem.applyState(state.culturalLife);
    }
    if (window.festivalSystem && state.festival) {
      window.festivalSystem.applyState(state.festival);
    }

    // --- Story Flags ---
    if (state.storyFlags) {
      window.STORY_FLAGS = new Set(state.storyFlags);
    }

    // --- Lighting (time of day) ---
    if (lighting && state.world) {
      lighting.timeOfDay = state.world.timeOfDay;
    }

    // --- Authoritative GameState Sync ---
    if (window.GameState) {
      if (state.player) {
        window.GameState.player.position.x = state.player.x;
        window.GameState.player.position.y = state.player.y;
        window.GameState.player.outfitId = state.player.outfitId;
        window.GameState.player.customizationChangesUsed = state.player.customizationChangesUsed;
        window.GameState.player.customizationHistory = state.player.customizationHistory || [];
      }
      if (state.survival) {
        if (window.GameState.player.hunger !== undefined && state.survival.hunger !== undefined) {
          window.GameState.player.hunger = state.survival.hunger;
        }
        window.GameState.player.currency = state.survival.currency;
        window.GameState.player.energy = state.survival.energy;
        window.GameState.player.hydration = state.survival.thirst;
        window.GameState.player.warmth = state.survival.coreTemp;
      }
      if (state.quests && window.GameState.quests) {
        window.GameState.quests.active = state.quests.filter(q => q.status === 'active').map(q => q.id);
        window.GameState.quests.completed = state.quests.filter(q => q.status === 'completed' || q.status === 'rewarded').map(q => q.id);
      }
    }

    // --- Phase 1: Progression, Achievements & Codex ---
    if (window.AchievementSystem && state.achievements) {
      window.AchievementSystem.init(state.achievements);
    }
    if (window.CodexSystem && state.codex) {
      window.CodexSystem.init(state.codex);
    }
    if (window.DiscoveryProgression && state.discoveries) {
      window.DiscoveryProgression.init(state.discoveries);
    }

    // --- Phase 2: Main Story, Side Quests, Secrets & Collectibles ---
    if (window.StoryContentSystem && state.storyContent) {
      window.StoryContentSystem.init(state.storyContent);
    }
    if (window.SideQuestSystem && state.sideQuests) {
      window.SideQuestSystem.init(state.sideQuests);
    }
    if (window.SecretDiscoverySystem && state.secrets) {
      window.SecretDiscoverySystem.init(state.secrets);
    }
    if (window.CollectibleSystem && state.collectibles) {
      window.CollectibleSystem.init(state.collectibles);
    }
    if (window.ReplaySystem && state.replay) {
      window.ReplaySystem.init(state.replay);
    }

    console.log('[SaveManager] ✓ Game state restored successfully.');
    return true;
  }

  // ------------------------------------------------------------------
  // PUBLIC: Check if a save exists
  // ------------------------------------------------------------------
  hasSave(slot = 'auto') {
    return localStorage.getItem(this.STORAGE_PREFIX + slot) !== null;
  }

  // ------------------------------------------------------------------
  // PUBLIC: Clear a specific save slot
  // ------------------------------------------------------------------
  clearSave(slot = 'auto') {
    localStorage.removeItem(this.STORAGE_PREFIX + slot);
    console.log(`[SaveManager] Save slot '${slot}' cleared.`);
  }

  // ------------------------------------------------------------------
  // VISUAL FEEDBACK: Diegetic save toast (ink splash / page shimmer)
  // ------------------------------------------------------------------
  _showSaveToast(reason) {
    const toast = document.getElementById('save-toast');
    if (!toast) return;

    // Contextual message based on save reason
    const messages = {
      'journal_entry':  '📓 Journal entry inked… progress preserved.',
      'tea_stall_rest': '☕ Rested at kadai… journey saved.',
      'campfire_rest':  '🔥 Campfire warmth… memories safe.',
      'tent_sleep':     '⛺ Slept soundly… dream saved.',
      'biome_enter':    '🗺️ New territory charted… path remembered.',
      'trade_complete': '🛒 Trade complete… ledger updated.',
      'photo_capture':  '📸 Snapshot filed… moment preserved.',
      'quest_complete': '📜 Quest milestone… tale recorded.',
      'puzzle_solved':  '⚙️ Mechanism aligned… progress locked.',
      'manual':         '📓 Journal secured… progress saved.',
      'autosave':       '🪶 Progress preserved…'
    };

    const msg = messages[reason] || messages['autosave'];

    toast.innerHTML = `
      <div class="save-toast-inner">
        <span class="save-toast-icon">🪶</span>
        <span class="save-toast-msg">${msg}</span>
      </div>
    `;

    toast.classList.remove('hidden');
    toast.classList.add('toast-show');

    // Remove after animation
    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('toast-hide');
      }, 600);
    }, 2200);
  }
}

window.SaveManager = SaveManager;
