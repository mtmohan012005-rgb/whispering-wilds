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
        outfitId: player.outfitId || player.currentOutfit || 'everyday_veshti',
        currentOutfit: player.currentOutfit || player.outfitId || 'everyday_veshti',
        equippedOutfit: player.equippedOutfit ? {
          itemId: player.equippedOutfit.itemId,
          outfitId: player.equippedOutfit.outfitId || player.equippedOutfit.outfitKey,
          outfitKey: player.equippedOutfit.outfitKey,
          stats: player.equippedOutfit.stats
        } : null,
        inventory: player.inventory || []
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

      // Quest progress
      quests: quests ? quests.quests.map(q => ({
        id: q.id,
        status: q.status,
        objectives: q.objectives.map(o => ({ id: o.id, done: o.done }))
      })) : [],

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
      player.currentOutfit = targetOutfit;
      if (player.setOutfit) player.setOutfit(targetOutfit);
      if (window.threeWorld && window.threeWorld.player) {
        window.threeWorld.player.setOutfit(targetOutfit);
      }
      player.equippedOutfit = state.player.equippedOutfit || null;
      player.inventory = state.player.inventory || [];
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

    // --- Quests ---
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
