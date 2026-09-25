/**
 * The Whispering Wilds - World Memory System
 * Tracks every meaningful player action that affects the world state.
 * NPCs remember interactions. World changes persist across sessions.
 * Integrates with Story Branch and Quest Consequence systems.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldMemory = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Memory Event Types ───────────────────────────────────────────────────────
  const MemoryEventType = Object.freeze({
    // Player actions
    HELPED_NPC:         'helped_npc',
    REFUSED_NPC:        'refused_npc',
    GAVE_ITEM:          'gave_item',
    STOLE:              'stole',
    COMPLETED_QUEST:    'completed_quest',
    FAILED_QUEST:       'failed_quest',
    BETRAYED_TRUST:     'betrayed_trust',
    EARNED_TRUST:       'earned_trust',
    DISCOVERED:         'discovered',
    PHOTOGRAPHED:       'photographed',
    TRADED:             'traded',
    // World changes
    DOOR_OPENED:        'door_opened',
    ITEM_PLACED:        'item_placed',
    FIRE_LIT:           'fire_lit',
    CAMP_USED:          'camp_used',
    BOAT_USED:          'boat_used',
    VEHICLE_USED:       'vehicle_used',
    // NPC relations
    NPC_DIALOGUE:       'npc_dialogue',
    NPC_THANKED:        'npc_thanked',
    NPC_ANGERED:        'npc_angered'
  });

  // ─── Memory Record ────────────────────────────────────────────────────────────
  class MemoryRecord {
    constructor(eventType, data, gameTimestamp) {
      this.eventType      = eventType;
      this.data           = { ...data };
      this.gameTimestamp  = gameTimestamp; // In-game seconds
      this.realTimestamp  = Date.now();
      this.id             = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    }
  }

  // ─── NPC Relationship ────────────────────────────────────────────────────────
  class NPCRelationship {
    constructor(npcId) {
      this.npcId     = npcId;
      this.trust     = 0;      // -100 to +100
      this.known     = false;
      this.history   = [];     // Array of event types that affected this NPC
      this.lastMet   = null;
    }

    applyEvent(eventType, amount) {
      this.trust = Math.max(-100, Math.min(100, this.trust + amount));
      this.history.push(eventType);
      if (this.history.length > 20) this.history.shift(); // Rolling window
    }

    getLabel() {
      if (this.trust >= 75)  return 'trusted_friend';
      if (this.trust >= 40)  return 'friendly';
      if (this.trust >= 10)  return 'acquaintance';
      if (this.trust >= -10) return 'neutral';
      if (this.trust >= -40) return 'suspicious';
      return 'hostile';
    }
  }

  // ─── World Memory System ──────────────────────────────────────────────────────
  class WorldMemorySystem {
    constructor() {
      this._records      = [];       // All memory records (capped)
      this._maxRecords   = 500;
      this._relations    = new Map(); // npcId → NPCRelationship
      this._worldFlags   = new Map(); // flagId → value  (persistent world changes)
      this._gameState    = null;
      this._eventBus     = null;
    }

    init(gameState, eventBus) {
      this._gameState = gameState;
      this._eventBus  = eventBus;

      // Restore from GameState if it exists (loaded save)
      this._restoreFromGameState();

      // Subscribe to events that should auto-record
      if (eventBus) {
        eventBus.on('QUEST_COMPLETED', d => this.record(MemoryEventType.COMPLETED_QUEST, d));
        eventBus.on('QUEST_FAILED',    d => this.record(MemoryEventType.FAILED_QUEST, d));
        eventBus.on('NPC_DIALOGUE_ENDED', d => this.record(MemoryEventType.NPC_DIALOGUE, d));
        eventBus.on('LOCATION_DISCOVERED', d => this.record(MemoryEventType.DISCOVERED, d));
        eventBus.on('PHOTO_TAKEN',     d => this.record(MemoryEventType.PHOTOGRAPHED, d));
        eventBus.on('TRANSACTION_COMMITTED', d => this.record(MemoryEventType.TRADED, d));
      }
    }

    // ─── Recording ────────────────────────────────────────────────────────────

    record(eventType, data = {}) {
      const gameTs = this._gameState?.world?.time?.totalSeconds ?? 0;
      const rec = new MemoryRecord(eventType, data, gameTs);
      this._records.push(rec);

      // Cap records
      if (this._records.length > this._maxRecords) {
        this._records.shift();
      }

      // Auto-update NPC relationships
      const trustDelta = this._getTrustDelta(eventType);
      if (data.npcId && trustDelta !== 0) {
        this.modifyRelationship(data.npcId, eventType, trustDelta);
      }

      // Set world flag
      if (data.flagId) this.setFlag(data.flagId, data.flagValue ?? true);

      // Mirror critical events to GameState
      this._mirrorToGameState(rec);

      if (this._eventBus) {
        this._eventBus.emit('MEMORY_RECORDED', { eventType, data });
      }
    }

    _getTrustDelta(eventType) {
      const deltas = {
        [MemoryEventType.HELPED_NPC]:      +15,
        [MemoryEventType.GAVE_ITEM]:       +10,
        [MemoryEventType.COMPLETED_QUEST]: +20,
        [MemoryEventType.EARNED_TRUST]:    +25,
        [MemoryEventType.TRADED]:          +5,
        [MemoryEventType.NPC_THANKED]:     +8,
        [MemoryEventType.REFUSED_NPC]:     -5,
        [MemoryEventType.STOLE]:           -30,
        [MemoryEventType.BETRAYED_TRUST]:  -40,
        [MemoryEventType.FAILED_QUEST]:    -10,
        [MemoryEventType.NPC_ANGERED]:     -20
      };
      return deltas[eventType] ?? 0;
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    getRelationship(npcId) {
      if (!this._relations.has(npcId)) {
        this._relations.set(npcId, new NPCRelationship(npcId));
      }
      return this._relations.get(npcId);
    }

    modifyRelationship(npcId, eventType, amount) {
      const rel = this.getRelationship(npcId);
      rel.applyEvent(eventType, amount);
      rel.known = true;
      rel.lastMet = this._gameState?.world?.time?.totalSeconds ?? 0;
    }

    getTrustLevel(npcId)   { return this.getRelationship(npcId).trust; }
    getRelationLabel(npcId){ return this.getRelationship(npcId).getLabel(); }

    // ─── World Flags ──────────────────────────────────────────────────────────

    setFlag(id, value) {
      this._worldFlags.set(id, value);
      if (this._gameState) {
        if (!this._gameState.world) this._gameState.world = {};
        if (!this._gameState.world.flags) this._gameState.world.flags = {};
        this._gameState.world.flags[id] = value;
      }
    }

    getFlag(id, defaultValue = false) {
      return this._worldFlags.has(id) ? this._worldFlags.get(id) : defaultValue;
    }

    hasFlag(id) { return this._worldFlags.has(id); }

    // ─── Memory Queries ───────────────────────────────────────────────────────

    getRecordsByType(eventType, limit = 20) {
      return this._records.filter(r => r.eventType === eventType).slice(-limit);
    }

    getRecordsByNPC(npcId, limit = 10) {
      return this._records.filter(r => r.data.npcId === npcId).slice(-limit);
    }

    hasPlayerEver(eventType, filterFn = null) {
      return this._records.some(r => {
        if (r.eventType !== eventType) return false;
        if (filterFn && !filterFn(r)) return false;
        return true;
      });
    }

    getRecentRecords(count = 10) {
      return this._records.slice(-count);
    }

    // ─── Persistence ──────────────────────────────────────────────────────────

    _mirrorToGameState(rec) {
      const gs = this._gameState;
      if (!gs) return;
      if (!gs.world) gs.world = {};
      if (!gs.world.memory) gs.world.memory = { recentEvents: [] };
      gs.world.memory.recentEvents.push({
        type: rec.eventType,
        ts:   rec.gameTimestamp
      });
      // Keep last 50 in GameState
      if (gs.world.memory.recentEvents.length > 50) {
        gs.world.memory.recentEvents.shift();
      }
    }

    _restoreFromGameState() {
      const gs = this._gameState;
      if (!gs?.world?.flags) return;
      for (const [id, value] of Object.entries(gs.world.flags)) {
        this._worldFlags.set(id, value);
      }
    }

    exportSaveData() {
      return {
        flags:     Object.fromEntries(this._worldFlags),
        relations: Object.fromEntries(
          [...this._relations.entries()].map(([id, rel]) => [id, {
            trust: rel.trust, known: rel.known, lastMet: rel.lastMet
          }])
        ),
        recentRecords: this._records.slice(-50).map(r => ({
          type: r.eventType, data: r.data, ts: r.gameTimestamp
        }))
      };
    }

    importSaveData(data) {
      if (!data) return;
      if (data.flags) {
        for (const [id, val] of Object.entries(data.flags)) this._worldFlags.set(id, val);
      }
      if (data.relations) {
        for (const [npcId, rel] of Object.entries(data.relations)) {
          const r = this.getRelationship(npcId);
          r.trust   = rel.trust   ?? 0;
          r.known   = rel.known   ?? false;
          r.lastMet = rel.lastMet ?? null;
        }
      }
    }

    destroy() {
      this._records    = [];
      this._relations.clear();
      this._worldFlags.clear();
    }
  }

  return { MemoryEventType, MemoryRecord, NPCRelationship, WorldMemorySystem };
});
