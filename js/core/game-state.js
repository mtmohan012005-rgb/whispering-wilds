/**
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative Game State Engine
 * Single Source of Truth across Player, World, Quests, Settings, and Multiplayer.
 * Enforces strict validation, currency integrity, 5-change customization limit,
 * region prerequisites, and bidirectional reactive adapters for legacy systems.
 */

class GameStateEngine {
  constructor() {
    this._initAuthoritativeState();
    this._listeners = new Map();
  }

  _initAuthoritativeState() {
    this.player = {
      id: 'explorer_tamil_01',
      name: 'Tamizh Iniyan',
      position: { x: 220, y: 0, z: 630 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },

      // ONE AUTHORITATIVE SURVIVAL STATE
      survival: {
        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        hydration: 100,
        maxHydration: 100,

        warmth: 80,
        maxWarmth: 100,

        hunger: 100,
        maxHunger: 100,

        wetness: 0,
        statusEffects: [],

        isExhausted: false,
        isDehydrated: false,
        isCold: false,
        isOverheated: false
      },

      // Single Authoritative Currency Source (Rupees ₹)
      currency: 75,

      // Inventory Array of Objects
      inventory: [
        { id: 'wood', name: 'Firewood (விறகு)', count: 8, weight: 4.0 },
        { id: 'stone', name: 'Granite Stone (கருங்கல்)', count: 4, weight: 3.2 },
        { id: 'cloth', name: 'Handloom Khadi Cloth (கதர் துணி)', count: 3, weight: 0.9 },
        { id: 'herbs', name: 'Medicinal Herbs (மூலிகை)', count: 2, weight: 0.2 },
        { id: 'canteenWater', name: 'Brass Chembu Water (தீர்த்தம்)', count: 3, weight: 1.5 },
        { id: 'vadai', name: 'Medu Vadai (மெதுவடை)', count: 1, weight: 0.2 }
      ],

      // Customization Configuration
      outfitId: 'everyday_veshti',
      hairstyleId: 'short_traditional_part',
      accessoryId: 'none',
      footwearId: 'kolhapuri_sandals',
      appearancePresetId: 'everyday_explorer',

      // Permanent 5-Change Customization Limit
      customizationChangesUsed: 0,
      maxCustomizationChanges: 5,
      customizationHistory: []
    };

    // Attach non-enumerable reactive bridge properties to player for legacy compatibility
    Object.defineProperty(this.player, 'health', {
      get: () => this.player.survival.health,
      set: (v) => { this.player.survival.health = Math.max(0, Math.min(this.player.survival.maxHealth, Number(v) || 0)); },
      configurable: true
    });
    Object.defineProperty(this.player, 'energy', {
      get: () => this.player.survival.energy,
      set: (v) => { this.player.survival.energy = Math.max(0, Math.min(this.player.survival.maxEnergy, Number(v) || 0)); },
      configurable: true
    });
    Object.defineProperty(this.player, 'hydration', {
      get: () => this.player.survival.hydration,
      set: (v) => { this.player.survival.hydration = Math.max(0, Math.min(this.player.survival.maxHydration, Number(v) || 0)); },
      configurable: true
    });
    Object.defineProperty(this.player, 'hunger', {
      get: () => this.player.survival.hunger,
      set: (v) => { this.player.survival.hunger = Math.max(0, Math.min(this.player.survival.maxHunger, Number(v) || 0)); },
      configurable: true
    });
    Object.defineProperty(this.player, 'warmth', {
      get: () => this.player.survival.warmth,
      set: (v) => { this.player.survival.warmth = Math.max(0, Math.min(this.player.survival.maxWarmth, Number(v) || 0)); },
      configurable: true
    });
    Object.defineProperty(this.player, 'wetness', {
      get: () => this.player.survival.wetness,
      set: (v) => { this.player.survival.wetness = Math.max(0, Math.min(100, Number(v) || 0)); },
      configurable: true
    });

    this.world = {
      seed: 133742,
      currentRegion: 'george_town',
      currentCell: 'CELL_CHE_001',
      activeCells: ['CELL_CHE_001'],
      unlockedStops: {
        stop_che_high_court: true,
        stop_cau_anicut: true
      },
      discoveredLocations: ['madras_high_court'],
      discoveredWildlife: [],
      culturalDiscoveries: [],

      // 8 Region Unlock Registry
      regionUnlocks: {
        george_town: true,
        cauvery_delta: true,
        pichavaram: false,
        chettinad: false,
        thanjavur: false,
        mamallapuram: false,
        nilgiris: false,
        final_sanctuary: false
      },

      environmentStates: {},
      puzzleStates: {},

      // Authoritative Environmental Interactions State
      interactions: {
        persistentProps: {},
        mechanisms: {},
        openedDoors: {},
        openedContainers: {},
        solvedEnvironmentalObjects: {},
        discoveredInteractiveObjects: []
      },

      festivalState: {
        activeFestival: 'PONGAL',
        currentPhaseIndex: 0,
        dayOfFestival: 1
      },
      marketStates: {},

      // World Clock (24-hour cycle)
      time: 9.0, // 09:00 AM
      season: 'harvest_thai',
      weather: 'clear'
    };

    this.quests = {
      active: ['main_missing_trail'],
      completed: [],
      failed: [],
      objectives: {},
      storyFlags: ['prologue_heist_witnessed'],
      evidence: [],
      rewardGranted: {} // questId -> boolean
    };

    this.settings = {
      graphics: {
        preset: 'HIGH',
        shadowQuality: 'HIGH',
        drawDistance: 'FAR',
        anisotropy: 8,
        antiAliasing: 'FXAA',
        resolutionScale: 1.0,
        targetFps: 60
      },
      audio: {
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
      controls: {
        mouseSensitivity: 1.0,
        invertY: false
      },
      accessibility: {
        subtitlesEnabled: true,
        highContrastText: false,
        survivalAssist: 'NORMAL' // 'NORMAL' or 'ASSISTED'
      }
    };

    Object.defineProperty(this.player, 'money', {
      get: () => this.player.currency,
      set: (v) => { this.player.currency = Math.max(0, Math.floor(Number(v) || 0)); },
      configurable: true
    });

    this.multiplayer = {
      connected: false,
      roomId: null,
      role: 'EXPLORER',
      remotePlayers: {}
    };

    // ── CENTRAL SINGLE SOURCE OF TRUTH DOMAINS (Section 2) ──────────────────
    this.equipment = {
      head: null,
      body: 'everyday_veshti',
      feet: 'kolhapuri_sandals',
      accessory: null,
      tool: 'brass_compass'
    };

    this.dialogue = {
      activeSpeaker: null,
      dialogueHistory: [],
      choiceHistory: []
    };

    this.npcs = {
      schedules: {},
      dispositions: {},
      states: {}
    };
    this.NPCs = this.npcs;

    this.wildlife = {
      trackedTracks: [],
      sightings: [],
      behaviorStates: {}
    };

    this.relationships = {};
    this.reputation = {
      george_town: 10,
      cauvery_delta: 5,
      pichavaram: 0,
      chettinad: 0,
      thanjavur: 0,
      mamallapuram: 0,
      nilgiris: 0,
      final_sanctuary: 0
    };

    this.discoveries = [];
    this.collectibles = [];
    this.achievements = [];

    const that = this;

    this.economy = {
      currencyName: 'Rupees (₹)',
      get currency() { return that.player.currency; },
      transactions: []
    };

    this.vehicles = {
      activeVehicle: null,
      unlockedVehicles: ['vintage_royal_enfield']
    };

    this.camera = {
      mode: 'THIRD_PERSON',
      distance: 4.5,
      pitch: 0,
      yaw: 0,
      fov: 60
    };

    this.saveMetadata = {
      gameVersion: '1.4.0',
      contentVersion: '1.4.0',
      schemaVersion: 4,
      timestamp: Date.now()
    };

    this.story = {
      storyCompleted: false,
      currentChapter: 1,
      branches: {},
      activeEnding: null
    };

    // Root-level reactive accessors for seamless subsystem integration
    Object.defineProperty(this, 'time', {
      get: () => this.world.time,
      set: (v) => { this.world.time = Number(v) || 0; },
      configurable: true
    });

    Object.defineProperty(this, 'weather', {
      get: () => this.world.weather,
      set: (v) => { this.setWeather(v); },
      configurable: true
    });

    Object.defineProperty(this, 'survival', {
      get: () => this.player.survival,
      configurable: true
    });

    Object.defineProperty(this, 'outfit', {
      get: () => this.player.outfitId,
      set: (v) => { this.player.outfitId = v; },
      configurable: true
    });

    Object.defineProperty(this, 'locations', {
      get: () => this.world.discoveredLocations,
      set: (arr) => { if (Array.isArray(arr)) this.world.discoveredLocations = arr; },
      configurable: true
    });

    // Authoritative Inventory facade preserving both array methods and .items access
    this.inventory = {
      get items() { return that.player.inventory; },
      set items(arr) { if (Array.isArray(arr)) that.player.inventory = arr; },
      slice: (...args) => that.player.inventory.slice(...args),
      find: (...args) => that.player.inventory.find(...args),
      filter: (...args) => that.player.inventory.filter(...args),
      reduce: (...args) => that.player.inventory.reduce(...args),
      forEach: (...args) => that.player.inventory.forEach(...args)
    };
  }

  // --------------------------------------------------------------------------
  // AUTHORITATIVE STATE ACTIONS (Section 3, controlled & validated mutations)
  // --------------------------------------------------------------------------

  setPlayerPosition(x, y, z) {
    if (window.GameRuntime && typeof window.GameRuntime.setPlayerPosition === 'function') {
      return window.GameRuntime.setPlayerPosition(x, y, z);
    }
    if (isNaN(x) || isNaN(y) || isNaN(z)) return false;
    this.player.position = { x, y, z };
    this.player.x = x;
    this.player.y = z;
    this.emit('playerMoved', this.player.position);
    return true;
  }

  setPlayerRotation(x, y, z) {
    this.player.rotation = { x: x || 0, y: y || 0, z: z || 0 };
    return true;
  }

  setPlayerMovement(vx, vy, vz, movementState = 'idle') {
    this.player.velocity = { x: vx || 0, y: vy || 0, z: vz || 0 };
    this.player.movementState = movementState;
    return true;
  }

  movePlayer(dx, dz, dt = 0.016) {
    if (window.GameRuntime && typeof window.GameRuntime.movePlayer === 'function') {
      return window.GameRuntime.movePlayer(dx, dz, dt);
    }
    const p = this.player.position;
    return this.setPlayerPosition(p.x + dx, p.y, p.z + dz);
  }

  changeCurrency(amount, reason = '') {
    if (window.GameRuntime && typeof window.GameRuntime.changeCurrency === 'function') {
      return window.GameRuntime.changeCurrency(amount, reason);
    }
    const cost = Math.floor(Number(amount) || 0);
    if (cost < 0) return this.deductCurrency(-cost);
    return this.addCurrency(cost);
  }

  addItem(item, count = 1) {
    return this.addInventoryItem({ ...(typeof item === 'string' ? { id: item } : item), count });
  }

  removeItem(itemId, count = 1) {
    return this.removeInventoryItem(itemId, count);
  }

  equipItem(slot, itemId) {
    if (!slot || !this.equipment) return false;
    this.equipment[slot] = itemId;
    this.emit('equipmentChanged', { slot, itemId });
    return true;
  }

  setOutfit(outfitId) {
    return this.applyCustomization({ outfitId });
  }

  startQuest(questId) {
    if (window.QuestStateMachine) return window.QuestStateMachine.startQuest(questId);
    if (!this.quests.active.includes(questId)) {
      this.quests.active.push(questId);
      this.emit('questStarted', questId);
      return true;
    }
    return false;
  }

  advanceQuest(questId, objectiveId) {
    if (window.QuestStateMachine) return window.QuestStateMachine.advanceObjective(questId, objectiveId);
    this.emit('objectiveCompleted', { questId, objectiveId });
    return true;
  }

  completeObjective(questId, objectiveId) {
    return this.advanceQuest(questId, objectiveId);
  }

  failQuest(questId, reason = '') {
    if (window.QuestStateMachine) return window.QuestStateMachine.failQuest(questId, reason);
    this.quests.active = this.quests.active.filter(q => q !== questId);
    if (!this.quests.failed.includes(questId)) this.quests.failed.push(questId);
    this.emit('questFailed', { questId, reason });
    return true;
  }

  discoverLocation(locationId) {
    if (window.GameRuntime && typeof window.GameRuntime.discoverLocation === 'function') {
      return window.GameRuntime.discoverLocation(locationId);
    }
    if (!this.world.discoveredLocations.includes(locationId)) {
      this.world.discoveredLocations.push(locationId);
      this.emit('locationDiscovered', locationId);
      return true;
    }
    return false;
  }

  discoverWildlife(speciesId) {
    if (window.GameRuntime && typeof window.GameRuntime.discoverWildlife === 'function') {
      return window.GameRuntime.discoverWildlife(speciesId);
    }
    if (!this.world.discoveredWildlife.includes(speciesId)) {
      this.world.discoveredWildlife.push(speciesId);
      this.emit('wildlifeDiscovered', speciesId);
      return true;
    }
    return false;
  }

  unlockAchievement(achievementId) {
    if (window.GameRuntime && typeof window.GameRuntime.unlockAchievement === 'function') {
      return window.GameRuntime.unlockAchievement(achievementId);
    }
    if (!this.achievements.includes(achievementId)) {
      this.achievements.push(achievementId);
      this.emit('achievementUnlocked', achievementId);
      return true;
    }
    return false;
  }

  changeRelationship(npcId, delta) {
    const curr = this.relationships[npcId] || 0;
    this.relationships[npcId] = Math.max(-100, Math.min(100, curr + delta));
    return this.relationships[npcId];
  }

  changeReputation(regionId, delta) {
    const curr = this.reputation[regionId] || 0;
    this.reputation[regionId] = Math.max(-100, Math.min(100, curr + delta));
    return this.reputation[regionId];
  }

  setWeather(weatherConfig) {
    if (typeof weatherConfig === 'string') {
      this.world.weather = weatherConfig;
    } else if (weatherConfig && typeof weatherConfig === 'object') {
      this.world.weather = weatherConfig.type || 'clear';
    }
    this.emit('weatherChanged', this.world.weather);
    return true;
  }

  setTime(hour, minute = 0) {
    this.world.time = hour + (minute / 60);
    this.emit('timeChanged', this.world.time);
    return true;
  }

  startWorldEvent(eventId, data = {}) {
    this.emit('worldEventStarted', { eventId, data });
    return true;
  }

  finishWorldEvent(eventId, outcome = 'completed') {
    this.emit('worldEventFinished', { eventId, outcome });
    return true;
  }

  enterVehicle(vehicleId, vehicleType = 'auto') {
    this.player.vehicleState = { inVehicle: true, vehicleId, vehicleType };
    this.emit('vehicleEntered', { vehicleId, vehicleType });
    return true;
  }

  exitVehicle() {
    this.player.vehicleState = { inVehicle: false, vehicleId: null, vehicleType: null };
    this.emit('vehicleExited', {});
    return true;
  }

  consumeFood(foodItem) {
    const s = this.player.survival;
    s.hunger = Math.min(s.maxHunger || 100, (s.hunger || 0) + (foodItem?.nourishment || 25));
    s.health = Math.min(s.maxHealth || 100, (s.health || 0) + (foodItem?.healthGain || 10));
    return true;
  }

  drinkWater(amount = 35) {
    const s = this.player.survival;
    s.hydration = Math.min(s.maxHydration || 100, (s.hydration || 0) + amount);
    return true;
  }

  rest(durationHours = 1) {
    const s = this.player.survival;
    s.energy = Math.min(s.maxEnergy || 100, (s.energy || 0) + durationHours * 20);
    return true;
  }

  sleep(hours = 8) {
    const s = this.player.survival;
    s.energy = s.maxEnergy || 100;
    s.health = Math.min(s.maxHealth || 100, (s.health || 0) + 30);
    s.warmth = 85;
    return true;
  }

  warmUp(delta = 10) {
    this.player.survival.warmth = Math.min(100, (this.player.survival.warmth || 80) + delta);
    return true;
  }

  coolDown(delta = 10) {
    this.player.survival.warmth = Math.max(0, (this.player.survival.warmth || 80) - delta);
    return true;
  }

  // Transaction API
  beginTransaction(txId = null) {
    if (window.GameRuntime) return window.GameRuntime.beginTransaction(txId);
    return `tx_${Date.now()}`;
  }

  validate() {
    if (window.StateValidator) return window.StateValidator.validateState(this);
    return { isValid: true, errors: [] };
  }

  commit() {
    if (window.GameRuntime) return window.GameRuntime.commit();
    return true;
  }

  rollback() {
    if (window.GameRuntime) return window.GameRuntime.rollback();
    return true;
  }

  // --------------------------------------------------------------------------
  // ECONOMY INTEGRITY METHODS (Prevent duplicate charges and negative balances)
  // --------------------------------------------------------------------------

  deductCurrency(amount) {
    const cost = Math.max(0, Math.floor(amount || 0));
    if (cost === 0) return true;
    if (this.player.currency >= cost) {
      this.player.currency -= cost;
      this._syncLegacySurvivalCurrency();
      this.emit('currencyChanged', this.player.currency);
      return true;
    }
    return false;
  }

  addCurrency(amount) {
    const gain = Math.max(0, Math.floor(amount || 0));
    this.player.currency += gain;
    this._syncLegacySurvivalCurrency();
    this.emit('currencyChanged', this.player.currency);
    return this.player.currency;
  }

  // --------------------------------------------------------------------------
  // CUSTOMIZATION LIMIT INTEGRITY (Strictly <= 5 changes rule)
  // --------------------------------------------------------------------------

  canCustomize() {
    return this.player.customizationChangesUsed < this.player.maxCustomizationChanges;
  }

  applyCustomization(newConfig) {
    if (!newConfig || typeof newConfig !== 'object') {
      return { success: false, reason: 'Invalid configuration payload.' };
    }
    if (!this.canCustomize()) {
      return {
        success: false,
        reason: 'Maximum 5 permanent appearance changes reached.',
        changesRemaining: 0
      };
    }

    // Check if configuration actually differs
    const isDifferent =
      (newConfig.outfitId && newConfig.outfitId !== this.player.outfitId) ||
      (newConfig.hairstyleId && newConfig.hairstyleId !== this.player.hairstyleId) ||
      (newConfig.accessoryId && newConfig.accessoryId !== this.player.accessoryId) ||
      (newConfig.footwearId && newConfig.footwearId !== this.player.footwearId);

    if (!isDifferent) {
      return { success: true, reason: 'No changes made.', changesRemaining: this.getRemainingCustomizationChanges() };
    }

    if (newConfig.outfitId) this.player.outfitId = newConfig.outfitId;
    if (newConfig.hairstyleId) this.player.hairstyleId = newConfig.hairstyleId;
    if (newConfig.accessoryId) this.player.accessoryId = newConfig.accessoryId;
    if (newConfig.footwearId) this.player.footwearId = newConfig.footwearId;
    if (newConfig.appearancePresetId) this.player.appearancePresetId = newConfig.appearancePresetId;

    this.player.customizationChangesUsed++;
    this.player.customizationHistory.push({
      changeNumber: this.player.customizationChangesUsed,
      timestamp: Date.now(),
      config: { ...newConfig }
    });

    // Sync legacy player object
    if (window.gamePlayer) {
      window.gamePlayer.outfitId = this.player.outfitId;
      window.gamePlayer.customizationChangesUsed = this.player.customizationChangesUsed;
      if (typeof window.gamePlayer.setOutfit === 'function') {
        window.gamePlayer.setOutfit(this.player.outfitId);
      }
    }
    if (window.threeWorld && window.threeWorld.player) {
      window.threeWorld.player.setOutfit(this.player.outfitId);
    }
    if (window.playerCustomizationSystem) {
      window.playerCustomizationSystem.customizationChangesUsed = this.player.customizationChangesUsed;
      window.playerCustomizationSystem.activeConfiguration = {
        outfitId: this.player.outfitId,
        hairstyleId: this.player.hairstyleId,
        accessoryId: this.player.accessoryId,
        footwearId: this.player.footwearId,
        appearancePresetId: this.player.appearancePresetId
      };
    }

    this.emit('customizationApplied', {
      config: this.player,
      changesUsed: this.player.customizationChangesUsed,
      changesRemaining: this.getRemainingCustomizationChanges()
    });

    return {
      success: true,
      changesUsed: this.player.customizationChangesUsed,
      changesRemaining: this.getRemainingCustomizationChanges()
    };
  }

  getRemainingCustomizationChanges() {
    return Math.max(0, this.player.maxCustomizationChanges - this.player.customizationChangesUsed);
  }

  // --------------------------------------------------------------------------
  // QUEST PROGRESSION & REWARD INTEGRITY (No duplicate rewards, no bypass)
  // --------------------------------------------------------------------------

  rewardQuest(questId, rewardData = {}) {
    if (this.quests.rewardGranted[questId]) {
      console.warn(`[GameState] Quest '${questId}' has already granted rewards. Duplicate claim rejected.`);
      return false;
    }
    this.quests.rewardGranted[questId] = true;

    if (rewardData.currency) {
      this.addCurrency(rewardData.currency);
    }
    if (Array.isArray(rewardData.items)) {
      rewardData.items.forEach(it => this.addInventoryItem(it));
    }
    this.emit('questRewarded', { questId, reward: rewardData });
    return true;
  }

  // --------------------------------------------------------------------------
  // INVENTORY INTEGRITY (Max 20kg satchel, quest item protection)
  // --------------------------------------------------------------------------

  getTotalInventoryWeight() {
    return this.player.inventory.reduce((sum, it) => sum + (it.weight || 0.1) * (it.count || 1), 0);
  }

  addInventoryItem(item) {
    if (!item || !item.id) return false;
    const currentWeight = this.getTotalInventoryWeight();
    const itemWeight = (item.weight || 0.2) * (item.count || 1);
    if (currentWeight + itemWeight > 20.0) {
      console.warn('[GameState] Satchel capacity exceeded (Max 20kg).');
      return false;
    }

    const existing = this.player.inventory.find(i => i.id === item.id);
    if (existing) {
      existing.count = (existing.count || 1) + (item.count || 1);
    } else {
      this.player.inventory.push({ ...item, count: item.count || 1 });
    }
    this.emit('inventoryChanged', this.player.inventory);
    return true;
  }

  removeInventoryItem(itemId, count = 1) {
    const idx = this.player.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    const item = this.player.inventory[idx];
    if (item.isQuestItem) {
      console.warn(`[GameState] Cannot discard protected quest item '${itemId}'.`);
      return false;
    }

    if (item.count > count) {
      item.count -= count;
    } else {
      this.player.inventory.splice(idx, 1);
    }
    this.emit('inventoryChanged', this.player.inventory);
    return true;
  }

  // --------------------------------------------------------------------------
  // REGION UNLOCK INTEGRITY (Validates prerequisites strictly)
  // --------------------------------------------------------------------------

  unlockRegion(regionId) {
    if (this.world.regionUnlocks[regionId]) return true;

    // Prerequisite rules
    const prereqs = {
      george_town: [],
      cauvery_delta: [],
      pichavaram: ['side_selvam_bull:completed'],
      chettinad: ['main_pichavaram_water:completed'],
      thanjavur: ['main_pichavaram_water:completed'],
      mamallapuram: ['main_chettinad_mansion:completed'],
      nilgiris: ['main_mamallapuram_carvings:completed'],
      final_sanctuary: ['main_nilgiris_mist:completed']
    };

    const required = prereqs[regionId];
    if (required) {
      const allMet = required.every(flag => {
        if (flag.endsWith(':completed')) {
          const qId = flag.split(':')[0];
          return this.quests.completed.includes(qId);
        }
        return this.quests.storyFlags.includes(flag);
      });

      if (!allMet) {
        console.warn(`[GameState] Cannot unlock region '${regionId}'. Prerequisites not satisfied:`, required);
        return false;
      }
    }

    this.world.regionUnlocks[regionId] = true;
    if (window.worldUnlockSystem) {
      window.worldUnlockSystem.unlockRegion(regionId);
    }
    this.emit('regionUnlocked', regionId);
    return true;
  }

  // --------------------------------------------------------------------------
  // STREAMING STATE SYNCHRONIZATION
  // --------------------------------------------------------------------------

  setStreamingCell(regionId, cellId, activeCells = []) {
    if (regionId) this.world.currentRegion = String(regionId).toLowerCase();
    if (cellId) this.world.currentCell = cellId;
    if (Array.isArray(activeCells)) this.world.activeCells = [...activeCells];
    this.emit('streamingCellChanged', { regionId: this.world.currentRegion, cellId: this.world.currentCell, activeCells: this.world.activeCells });
  }

  getStreamingState() {
    return {
      currentRegion: this.world.currentRegion,
      currentCell: this.world.currentCell || 'CELL_CHE_001',
      activeCells: this.world.activeCells || ['CELL_CHE_001']
    };
  }

  // --------------------------------------------------------------------------
  // REACTIVE BRIDGES & LEGACY SYNCHRONIZATION
  // --------------------------------------------------------------------------

  _syncLegacySurvivalCurrency() {
    if (window.gameSurvival) {
      window.gameSurvival.currency = this.player.currency;
    }
  }

  bindLegacyAdapters() {
    // Adapter for window.gameSurvival
    if (window.gameSurvival && !window.gameSurvival._gameStateBound) {
      window.gameSurvival._gameStateBound = true;
      Object.defineProperty(window.gameSurvival, 'survival', {
        get: () => this.player.survival,
        configurable: true
      });
      Object.defineProperty(window.gameSurvival, 'currency', {
        get: () => this.player.currency,
        set: (v) => { this.player.currency = Math.max(0, Math.floor(v || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gameSurvival, 'health', {
        get: () => this.player.survival.health,
        set: (v) => { this.player.survival.health = Math.max(0, Math.min(this.player.survival.maxHealth, Number(v) || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gameSurvival, 'energy', {
        get: () => this.player.survival.energy,
        set: (v) => { this.player.survival.energy = Math.max(0, Math.min(this.player.survival.maxEnergy, Number(v) || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gameSurvival, 'hunger', {
        get: () => this.player.survival.hunger,
        set: (v) => { this.player.survival.hunger = Math.max(0, Math.min(this.player.survival.maxHunger, Number(v) || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gameSurvival, 'thirst', {
        get: () => this.player.survival.hydration,
        set: (v) => { this.player.survival.hydration = Math.max(0, Math.min(this.player.survival.maxHydration, Number(v) || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gameSurvival, 'coreTemp', {
        get: () => this.player.survival.warmth,
        set: (v) => { this.player.survival.warmth = Math.max(0, Math.min(this.player.survival.maxWarmth, Number(v) || 0)); },
        configurable: true
      });
    }

    // Adapter for window.gamePlayer
    if (window.gamePlayer && !window.gamePlayer._gameStateBound) {
      window.gamePlayer._gameStateBound = true;
      Object.defineProperty(window.gamePlayer, 'survival', {
        get: () => this.player.survival,
        configurable: true
      });
      Object.defineProperty(window.gamePlayer, 'health', {
        get: () => this.player.survival.health,
        set: (v) => { this.player.survival.health = Math.max(0, Math.min(this.player.survival.maxHealth, Number(v) || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gamePlayer, 'energy', {
        get: () => this.player.survival.energy,
        set: (v) => { this.player.survival.energy = Math.max(0, Math.min(this.player.survival.maxEnergy, Number(v) || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gamePlayer, 'currency', {
        get: () => this.player.currency,
        set: (v) => { this.player.currency = Math.max(0, Math.floor(v || 0)); },
        configurable: true
      });
      Object.defineProperty(window.gamePlayer, 'outfitId', {
        get: () => this.player.outfitId,
        set: (v) => { this.player.outfitId = v; },
        configurable: true
      });
      Object.defineProperty(window.gamePlayer, 'customizationChangesUsed', {
        get: () => this.player.customizationChangesUsed,
        set: (v) => {
          this.player.customizationChangesUsed = Math.max(0, Math.min(5, Math.floor(v || 0)));
        },
        configurable: true
      });
    }
  }

  // --------------------------------------------------------------------------
  // INVENTORY METHODS (Controlled item mutations)
  // --------------------------------------------------------------------------

  addItemToInventory(itemId, count = 1, name = '', weight = 0.5) {
    if (!itemId) return false;
    const item = this.player.inventory.find(i => i.id === itemId);
    if (item) {
      item.count = (item.count || 0) + count;
    } else {
      this.player.inventory.push({ id: itemId, name: name || itemId, count, weight });
    }
    this.emit('inventoryChanged', this.player.inventory);
    return true;
  }

  removeItemFromInventory(itemId, count = 1) {
    const item = this.player.inventory.find(i => i.id === itemId);
    if (!item || item.count < count) return false;
    item.count -= count;
    if (item.count <= 0) {
      const idx = this.player.inventory.indexOf(item);
      if (idx !== -1) this.player.inventory.splice(idx, 1);
    }
    this.emit('inventoryChanged', this.player.inventory);
    return true;
  }

  // --------------------------------------------------------------------------
  // LEGACY SAVE MIGRATION (Safely migrates old player.health/energy into player.survival)
  // --------------------------------------------------------------------------

  migrateLegacySave(saveData) {
    if (!saveData || !saveData.player) return saveData;
    const p = saveData.player;
    if (!p.survival) {
      p.survival = {
        health: typeof p.health === 'number' ? p.health : 100,
        maxHealth: 100,
        energy: typeof p.energy === 'number' ? p.energy : 100,
        maxEnergy: 100,
        hydration: typeof p.hydration === 'number' ? p.hydration : 100,
        maxHydration: 100,
        warmth: typeof p.warmth === 'number' ? p.warmth : 80,
        maxWarmth: 100,
        hunger: typeof p.hunger === 'number' ? p.hunger : 100,
        maxHunger: 100,
        wetness: 0,
        statusEffects: [],
        isExhausted: false,
        isDehydrated: false,
        isCold: false,
        isOverheated: false
      };
    }
    return saveData;
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE INTEGRATION & ANTI-TAMPER VALIDATION
  // --------------------------------------------------------------------------
  get lifecycleState() {
    return window.GameLifecycle ? window.GameLifecycle.state : 'PLAYING';
  }

  validateLoadedState(saveData) {
    if (!saveData || typeof saveData !== 'object') {
      return { valid: false, reason: 'Invalid save payload structure' };
    }

    const migrated = this.migrateLegacySave(saveData);
    const p = migrated.player;

    if (!p) {
      return { valid: false, reason: 'Missing player state in save payload' };
    }

    // 1. Anti-Tamper Customization Limit Check
    if (typeof p.customizationChangesUsed === 'number') {
      if (p.customizationChangesUsed < 0 || p.customizationChangesUsed > 5) {
        console.warn(`[GameState] Clamping tampered customization count: ${p.customizationChangesUsed} -> 5`);
        p.customizationChangesUsed = Math.min(Math.max(0, p.customizationChangesUsed), 5);
      }
    } else {
      p.customizationChangesUsed = 0;
    }
    p.maxCustomizationChanges = 5;

    // 2. Currency Validation (>= 0)
    if (typeof p.currency === 'number' && p.currency < 0) {
      console.warn(`[GameState] Negative currency detected (${p.currency}). Resetting to 0.`);
      p.currency = 0;
    }

    // 3. Region Validation
    const validRegions = [
      'george_town', 'cauvery_delta', 'pichavaram',
      'chettinad', 'thanjavur', 'mamallapuram',
      'nilgiris', 'final_sanctuary'
    ];
    if (migrated.world?.currentRegion && !validRegions.includes(migrated.world.currentRegion)) {
      console.warn(`[GameState] Unknown region '${migrated.world.currentRegion}'. Fallback to 'george_town'.`);
      migrated.world.currentRegion = 'george_town';
    }

    // 4. Inventory Validation
    if (Array.isArray(p.inventory)) {
      p.inventory = p.inventory.filter(item => {
        if (!item || typeof item !== 'object' || !item.id) return false;
        if (typeof item.count === 'number' && item.count < 0) return false;
        return true;
      });
    }

    // 5. Environmental Interactions Validation
    if (!migrated.world) migrated.world = {};
    if (!migrated.world.interactions || typeof migrated.world.interactions !== 'object') {
      migrated.world.interactions = {
        persistentProps: {},
        mechanisms: {},
        openedDoors: {},
        openedContainers: {},
        solvedEnvironmentalObjects: {},
        discoveredInteractiveObjects: []
      };
    } else {
      if (!migrated.world.interactions.persistentProps) migrated.world.interactions.persistentProps = {};
      if (!migrated.world.interactions.mechanisms) migrated.world.interactions.mechanisms = {};
      if (!migrated.world.interactions.openedDoors) migrated.world.interactions.openedDoors = {};
      if (!migrated.world.interactions.openedContainers) migrated.world.interactions.openedContainers = {};
      if (!migrated.world.interactions.solvedEnvironmentalObjects) migrated.world.interactions.solvedEnvironmentalObjects = {};
      if (!Array.isArray(migrated.world.interactions.discoveredInteractiveObjects)) {
        migrated.world.interactions.discoveredInteractiveObjects = [];
      }
    }

    return { valid: true, state: migrated };
  }

  // Event dispatcher
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }

  emit(event, data) {
    const cbs = this._listeners.get(event);
    if (cbs) {
      cbs.forEach(cb => {
        try { cb(data); } catch (e) { console.error(`[GameState] Error in '${event}' listener:`, e); }
      });
    }
  }
}

// Instantiate Global Authoritative GameState
window.GameState = new GameStateEngine();
