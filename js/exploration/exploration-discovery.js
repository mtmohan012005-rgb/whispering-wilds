/**
 * The Whispering Wilds - Exploration Discovery System
 * Handles POI discovery, environmental mystery flags, clue collection,
 * wildlife observation unlocks, heritage site documentation, and codex entries.
 * All discovery state lives in authoritative GameState only.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ExplorationDiscovery = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost');

  // ─── Discovery Types ──────────────────────────────────────────────────────────
  const DiscoveryType = Object.freeze({
    LOCATION:   'location',       // Named region / village / forest zone
    LANDMARK:   'landmark',       // Heritage structure, temple, rock formation
    WILDLIFE:   'wildlife',       // Animal species
    PLANT:      'plant',          // Medicinal herb, rare flower, crop
    CLUE:       'clue',           // Investigation clue
    SECRET:     'secret',         // Hidden passage, buried artefact
    CULTURAL:   'cultural',       // Festival, craft, cuisine
    WATER:      'water',          // Spring, waterfall, river crossing
    RUIN:       'ruin',           // Ancient site
    PHOTO:      'photo'           // Photograph taken
  });

  // ─── Discovery Entry ──────────────────────────────────────────────────────────
  class DiscoveryEntry {
    constructor(id, type, nameKey, options = {}) {
      this.id          = id;
      this.type        = type;
      this.nameKey     = nameKey;
      this.descKey     = options.descKey || `${id}_desc`;
      this.position    = options.position || null;  // { x, z } for map marking
      this.region      = options.region   || 'unknown';
      this.rarity      = options.rarity   || 'common'; // common|uncommon|rare|legendary
      this.discovered  = false;
      this.discoveredAt = null; // Game timestamp
      this.photographed = false;
      this.codexUnlocked = false;
      this.questLinked  = options.questLinked || null;
      this.conditions   = options.conditions  || [];
      this._meta        = options.meta || {};
    }
  }

  // ─── Investigation Clue ───────────────────────────────────────────────────────
  class InvestigationClue {
    constructor(id, caseId, options = {}) {
      this.id          = id;
      this.caseId      = caseId;
      this.type        = options.type       || 'physical';  // physical|testimony|document|environmental
      this.nameKey     = options.nameKey    || id;
      this.descKey     = options.descKey    || `${id}_desc`;
      this.location    = options.location   || null;
      this.found       = false;
      this.analysed    = false;
      this.connections = options.connections || []; // Other clue IDs this points to
      this.weight      = options.weight     || 1.0; // How significant to the case
    }
  }

  // ─── Environmental Mystery ────────────────────────────────────────────────────
  class EnvironmentalMystery {
    constructor(id, options = {}) {
      this.id           = id;
      this.nameKey      = options.nameKey   || id;
      this.active       = true;
      this.stage        = 0;
      this.maxStages    = options.maxStages || 3;
      this.clues        = [];    // Clue IDs associated
      this.resolved     = false;
      this.resolution   = null;
      this.onProgress   = options.onProgress  || null;
      this.onResolve    = options.onResolve    || null;
    }

    progress(clueId) {
      if (!this.clues.includes(clueId)) this.clues.push(clueId);
      this.stage = Math.min(this.stage + 1, this.maxStages);
      if (typeof this.onProgress === 'function') this.onProgress(this);
      if (this.stage >= this.maxStages) this.resolve();
    }

    resolve(resolution = 'discovered') {
      this.resolved  = true;
      this.resolution = resolution;
      if (typeof this.onResolve === 'function') this.onResolve(this);
    }
  }

  // ─── Exploration Discovery System ─────────────────────────────────────────────
  class ExplorationDiscoverySystem {
    constructor() {
      this._entries       = new Map();   // discoveryId → DiscoveryEntry
      this._clues         = new Map();   // clueId → InvestigationClue
      this._mysteries     = new Map();   // mysteryId → EnvironmentalMystery
      this._gameState     = null;
      this._eventBus      = null;
      this._spatialQuery  = null;
      this._photoProxRadius = 12;        // Photograph range
    }

    init(gameState, eventBus, spatialQuery) {
      this._gameState    = gameState;
      this._eventBus     = eventBus;
      this._spatialQuery = spatialQuery;

      // Subscribe to wildlife discovery event
      if (eventBus) {
        eventBus.on('WILDLIFE_DISCOVERED', ({ templateId }) => {
          const entryId = `wildlife_${templateId}`;
          if (this._entries.has(entryId)) this.discover(entryId);
        });
        eventBus.on('LOCATION_DISCOVERED', ({ locationId }) => {
          if (this._entries.has(locationId)) this.discover(locationId);
        });
      }

      this._registerDefaultEntries();
    }

    // ─── Entry Registration ──────────────────────────────────────────────────

    registerEntry(entry) {
      if (!(entry instanceof DiscoveryEntry)) throw new TypeError('Must be DiscoveryEntry');
      this._entries.set(entry.id, entry);
    }

    registerClue(clue) {
      if (!(clue instanceof InvestigationClue)) throw new TypeError('Must be InvestigationClue');
      this._clues.set(clue.id, clue);
    }

    registerMystery(mystery) {
      this._mysteries.set(mystery.id, mystery);
    }

    // ─── Discovery ────────────────────────────────────────────────────────────

    /**
     * Mark a discovery entry as found.
     * Updates authoritative GameState. Emits events.
     * @param {string} id
     * @param {Object} [context]
     * @returns {boolean} Whether this was a new discovery
     */
    discover(id, context = {}) {
      const entry = this._entries.get(id);
      if (!entry || entry.discovered) return false;

      entry.discovered   = true;
      entry.discoveredAt = this._gameState?.world?.time?.totalSeconds ?? 0;

      // Mirror to GameState for save system
      this._mirrorToGameState(entry);

      if (this._eventBus) {
        this._eventBus.emit('LOCATION_DISCOVERED', {
          id,
          type:    entry.type,
          nameKey: entry.nameKey,
          rarity:  entry.rarity,
          region:  entry.region
        });
        // Cultural first-discover bonus
        if (entry.type === DiscoveryType.CULTURAL || entry.type === DiscoveryType.RUIN) {
          this._eventBus.emit('CULTURAL_DISCOVERY', { id, nameKey: entry.nameKey });
        }
      }

      if (IS_DEV) console.log(`[Exploration] Discovered: ${id} (${entry.type})`);
      return true;
    }

    // ─── Clue Collection ──────────────────────────────────────────────────────

    collectClue(clueId, mysteryId = null) {
      const clue = this._clues.get(clueId);
      if (!clue || clue.found) return false;

      clue.found = true;

      // Progress associated mystery
      const mid = mysteryId || clue.caseId;
      const mystery = mid ? this._mysteries.get(mid) : null;
      if (mystery) mystery.progress(clueId);

      if (this._eventBus) {
        this._eventBus.emit('CLUE_COLLECTED', {
          id:      clueId,
          caseId:  clue.caseId,
          type:    clue.type,
          nameKey: clue.nameKey
        });
      }
      return true;
    }

    analyseClue(clueId) {
      const clue = this._clues.get(clueId);
      if (!clue || !clue.found || clue.analysed) return false;
      clue.analysed = true;
      if (this._eventBus) this._eventBus.emit('CLUE_ANALYSED', { id: clueId });
      return true;
    }

    // ─── Photography ──────────────────────────────────────────────────────────

    /**
     * Attempt to photograph subject at world position from player position.
     * @param {string} subjectId - Discovery entry ID
     * @param {{x,y,z}} playerPos
     * @param {{x,y,z}} subjectPos
     * @returns {{ success: boolean, reason: string }}
     */
    photograph(subjectId, playerPos, subjectPos) {
      const entry = this._entries.get(subjectId);
      if (!entry) return { success: false, reason: 'unknown_subject' };
      if (!entry.discovered) {
        // Photography counts as discovery too
        this.discover(subjectId);
      }

      const dx = subjectPos.x - playerPos.x;
      const dz = subjectPos.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > this._photoProxRadius) {
        return { success: false, reason: `too_far(${dist.toFixed(1)}m)` };
      }

      entry.photographed = true;

      if (this._eventBus) {
        this._eventBus.emit('PHOTO_TAKEN', { subjectId, dist });
      }

      // Create photo discovery entry
      const photoId = `photo_${subjectId}_${Date.now()}`;
      const photoEntry = new DiscoveryEntry(photoId, DiscoveryType.PHOTO, `photo_of_${entry.nameKey}`, {
        region: entry.region, rarity: entry.rarity
      });
      photoEntry.discovered = true;
      this._entries.set(photoId, photoEntry);

      return { success: true, reason: '' };
    }

    // ─── GameState Mirror ─────────────────────────────────────────────────────

    _mirrorToGameState(entry) {
      const gs = this._gameState;
      if (!gs) return;
      if (!gs.world) gs.world = {};
      if (!gs.world.discoveries) gs.world.discoveries = {};
      gs.world.discoveries[entry.id] = {
        discovered: true,
        type:   entry.type,
        region: entry.region,
        at:     entry.discoveredAt
      };
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    isDiscovered(id)    { return this._entries.get(id)?.discovered ?? false; }
    isPhotographed(id)  { return this._entries.get(id)?.photographed ?? false; }
    isClueFound(id)     { return this._clues.get(id)?.found ?? false; }
    getMystery(id)      { return this._mysteries.get(id) || null; }

    getDiscoveryCount(type = null) {
      let count = 0;
      for (const e of this._entries.values()) {
        if (e.discovered && (!type || e.type === type)) count++;
      }
      return count;
    }

    getFoundClues(caseId) {
      const found = [];
      for (const clue of this._clues.values()) {
        if (clue.found && (caseId == null || clue.caseId === caseId)) found.push(clue);
      }
      return found;
    }

    // ─── Default Tamil Nadu Entries ───────────────────────────────────────────

    _registerDefaultEntries() {
      // Regions
      this.registerEntry(new DiscoveryEntry('region_chennai',      DiscoveryType.LOCATION, 'region_chennai_name',      { region: 'chennai',      position: { x: 220, z: 280 } }));
      this.registerEntry(new DiscoveryEntry('region_pichavaram',   DiscoveryType.LOCATION, 'region_pichavaram_name',   { region: 'pichavaram',   position: { x: -300, z: 400 } }));
      this.registerEntry(new DiscoveryEntry('region_chettinad',    DiscoveryType.LOCATION, 'region_chettinad_name',    { region: 'chettinad',    position: { x: 600, z: 400 } }));
      this.registerEntry(new DiscoveryEntry('region_mamallapuram', DiscoveryType.LOCATION, 'region_mamalla_name',      { region: 'mamallapuram', position: { x: 500, z: 0 } }));
      this.registerEntry(new DiscoveryEntry('region_nilgiris',     DiscoveryType.LOCATION, 'region_nilgiris_name',     { region: 'nilgiris',     position: { x: 100, z: -300 } }));

      // Wildlife
      this.registerEntry(new DiscoveryEntry('wildlife_spotted_deer',   DiscoveryType.WILDLIFE, 'wildlife_deer_name',    { rarity: 'common' }));
      this.registerEntry(new DiscoveryEntry('wildlife_peacock',         DiscoveryType.WILDLIFE, 'wildlife_peacock_name', { rarity: 'common' }));
      this.registerEntry(new DiscoveryEntry('wildlife_elephant',        DiscoveryType.WILDLIFE, 'wildlife_elephant_name', { rarity: 'uncommon' }));
      this.registerEntry(new DiscoveryEntry('wildlife_fish_eagle',      DiscoveryType.WILDLIFE, 'wildlife_eagle_name',   { rarity: 'uncommon' }));
      this.registerEntry(new DiscoveryEntry('wildlife_monitor_lizard',  DiscoveryType.WILDLIFE, 'wildlife_lizard_name',  { rarity: 'common' }));
      this.registerEntry(new DiscoveryEntry('wildlife_langur',          DiscoveryType.WILDLIFE, 'wildlife_langur_name',  { rarity: 'common' }));

      // Landmarks / Ruins
      this.registerEntry(new DiscoveryEntry('landmark_shore_temple',   DiscoveryType.RUIN,     'shore_temple_name',    { rarity: 'rare', region: 'mamallapuram' }));
      this.registerEntry(new DiscoveryEntry('landmark_pichavaram_grove',DiscoveryType.LANDMARK, 'pichavaram_grove_name',{ rarity: 'uncommon', region: 'pichavaram' }));
      this.registerEntry(new DiscoveryEntry('landmark_chettinad_mansion',DiscoveryType.LANDMARK,'chettinad_mansion_name',{ rarity: 'rare', region: 'chettinad' }));

      if (IS_DEV) console.log('[ExplorationDiscovery] Default entries registered');
    }

    destroy() {
      this._entries.clear();
      this._clues.clear();
      this._mysteries.clear();
    }
  }

  return {
    DiscoveryType, DiscoveryEntry, InvestigationClue,
    EnvironmentalMystery, ExplorationDiscoverySystem
  };
});
