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
      version: 1,
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
        appearancePresetId: player.appearancePresetId || 'everyday_explorer',
        customizationChangesUsed: window.playerCustomizationSystem ? window.playerCustomizationSystem.customizationChangesUsed : (player.customizationChangesUsed || 0),
        maxCustomizationChanges: 5,
        customizationHistory: window.playerCustomizationSystem ? window.playerCustomizationSystem.history : (player.customizationHistory || []),
        equippedOutfit: player.equippedOutfit ? {
          itemId: player.equippedOutfit.itemId,
          outfitId: player.equippedOutfit.outfitId || player.equippedOutfit.outfitKey,
          outfitKey: player.equippedOutfit.outfitKey,
          stats: player.equippedOutfit.stats
        } : null,
        inventory: player.inventory || []
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
        hunger: survival.hunger,
        thirst: survival.thirst,
        energy: survival.energy,
        coreTemp: survival.coreTemp,
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
      localStorage.setItem(key, JSON.stringify(state));
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

  // ------------------------------------------------------------------
  // PUBLIC: Load game state from localStorage
  // ------------------------------------------------------------------
  loadGame(slot = 'auto') {
    try {
      const key = this.STORAGE_PREFIX + slot;
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const state = JSON.parse(raw);
      console.log(`[SaveManager] Found save (slot: ${slot}), saved at ${state.formattedTime}, reason: ${state.saveReason}`);
      return state;
    } catch (err) {
      console.error('[SaveManager] Load failed:', err);
      return null;
    }
  }

  // ------------------------------------------------------------------
  // PUBLIC: Restore game state to live objects
  // ------------------------------------------------------------------
  restoreState(state) {
    if (!state) return false;

    const player   = window.gamePlayer;
    const survival = window.gameSurvival;
    const journal  = window.gameJournal;
    const quests   = window.gameQuests;
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
    }

    // --- Audio Settings ---
    if (window.audioManager && state.audioSettings) {
      window.audioManager.applySettings(state.audioSettings);
    }

    // --- Survival ---
    if (survival && state.survival) {
      survival.hunger = state.survival.hunger;
      survival.thirst = state.survival.thirst;
      survival.energy = state.survival.energy;
      survival.coreTemp = state.survival.coreTemp;
      survival.currency = state.survival.currency;
      survival.baseTier = state.survival.baseTier;
      survival.hasRestedBuff = state.survival.hasRestedBuff;
      survival.restedTimer = state.survival.restedTimer;
      survival.inventory = { ...state.survival.inventory };
      survival.campfires = (state.survival.campfires || []).map(f => ({ ...f, createdAt: Date.now() }));
      survival.tents = (state.survival.tents || []).map(t => ({ ...t, createdAt: Date.now() }));
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

    // --- Story Flags ---
    if (state.storyFlags) {
      window.STORY_FLAGS = new Set(state.storyFlags);
    }

    // --- Lighting (time of day) ---
    if (lighting && state.world) {
      lighting.timeOfDay = state.world.timeOfDay;
    }

    // --- Biome unlock flags ---
    if (state.biomes && window.WORLD_DATA && window.WORLD_DATA.biomes) {
      if (state.biomes.pichavaram_delta) {
        window.WORLD_DATA.biomes.pichavaram_delta.unlocked = true;
      }
      if (state.biomes.western_ghats) {
        window.WORLD_DATA.biomes.western_ghats.unlocked = true;
      }
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
