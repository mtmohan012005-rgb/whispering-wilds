/**
 * The Whispering Wilds - Game Director
 * Orchestrates encounter pacing, world event timing, NPC spawning cues,
 * weather transitions, and moment-to-moment dynamic narrative tension.
 * Reads from WorldMemory, GameState, and player behaviour telemetry.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.GameDirector = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost');

  // ─── Tension Levels ───────────────────────────────────────────────────────────
  const TensionLevel = Object.freeze({
    TRANQUIL:  0,
    LOW:       1,
    MEDIUM:    2,
    HIGH:      3,
    CRITICAL:  4
  });

  // ─── Encounter Slot ───────────────────────────────────────────────────────────
  class EncounterSlot {
    constructor(id, trigger, config = {}) {
      this.id          = id;
      this.trigger     = trigger;
      this.config      = config;
      this.cooldown    = config.cooldown    ?? 180;  // seconds
      this._lastFired  = -Infinity;
      this.active      = true;
    }

    canFire(now) {
      return this.active && (now - this._lastFired) >= this.cooldown;
    }

    fire(now) {
      this._lastFired = now;
    }
  }

  // ─── Game Director ────────────────────────────────────────────────────────────
  class GameDirector {
    constructor() {
      this._tension        = TensionLevel.TRANQUIL;
      this._encounters     = new Map();
      this._gameState      = null;
      this._eventBus       = null;
      this._worldMemory    = null;
      this._npcManager     = null;
      this._wildlifeAI     = null;
      this._spatialQuery   = null;

      // Player telemetry (rolling window)
      this._telemetry = {
        idleTime:       0,    // Seconds since last meaningful action
        encounterCount: 0,    // Encounters in last 10 min
        distance:       0,    // Distance traveled this session
        lastBoredomCheck: 0
      };

      this._updateInterval = 5.0;  // Director ticks every 5s
      this._tick           = 0;

      this._globalCooldown = 0;    // Director-wide quiet period after major event
    }

    init(deps) {
      this._gameState    = deps.gameState;
      this._eventBus     = deps.eventBus;
      this._worldMemory  = deps.worldMemory;
      this._npcManager   = deps.npcManager;
      this._wildlifeAI   = deps.wildlifeAI;
      this._spatialQuery = deps.spatialQuery;

      if (deps.eventBus) {
        deps.eventBus.on('QUEST_COMPLETED',  () => { this._telemetry.encounterCount++; this._globalCooldown = 30; });
        deps.eventBus.on('WILDLIFE_ALERT',   () => { this._tension = Math.max(this._tension, TensionLevel.LOW); });
        deps.eventBus.on('PLAYER_LANDED',    ({ category }) => {
          if (category === 'large') this._setTension(TensionLevel.HIGH);
        });
        deps.eventBus.on('SURVIVAL_CRITICAL', () => this._setTension(TensionLevel.CRITICAL));
      }

      this._registerDefaultEncounters();
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    update(dt) {
      this._tick += dt;

      // Track player idle time
      const gs = this._gameState;
      if (gs?.player) {
        const vel = gs.player.velocity;
        const moving = vel && (Math.abs(vel.x) > 0.2 || Math.abs(vel.z) > 0.2);
        if (moving) {
          this._telemetry.idleTime = 0;
        } else {
          this._telemetry.idleTime += dt;
        }
      }

      if (this._globalCooldown > 0) { this._globalCooldown -= dt; return; }

      if (this._tick < this._updateInterval) return;
      this._tick = 0;

      this._decayTension();
      this._evaluateEncounters();
      this._evaluateBoredom();
    }

    _decayTension() {
      if (this._telemetry.idleTime > 60 && this._tension > TensionLevel.TRANQUIL) {
        this._tension = Math.max(TensionLevel.TRANQUIL, this._tension - 1);
      }
    }

    _setTension(level) {
      this._tension = Math.max(this._tension, level);
      if (this._eventBus) {
        this._eventBus.emit('DIRECTOR_TENSION_CHANGED', { level: this._tension });
      }
    }

    // ─── Encounter Orchestration ──────────────────────────────────────────────

    _evaluateEncounters() {
      const now = this._gameState?.world?.time?.totalSeconds ?? 0;
      const playerPos = this._gameState?.player?.position;
      if (!playerPos) return;

      for (const slot of this._encounters.values()) {
        if (!slot.canFire(now)) continue;
        if (!this._checkEncounterConditions(slot, playerPos)) continue;

        this._fireEncounter(slot, playerPos, now);
        break; // Only one encounter per director tick
      }
    }

    _checkEncounterConditions(slot, playerPos) {
      const cfg = slot.config;

      // Tension gate
      if (cfg.minTension != null && this._tension < cfg.minTension) return false;
      if (cfg.maxTension != null && this._tension > cfg.maxTension) return false;

      // Time of day
      const hour = this._gameState?.world?.time?.hour ?? 12;
      if (cfg.dayOnly    && (hour < 6  || hour > 18)) return false;
      if (cfg.nightOnly  && (hour > 6  && hour < 18)) return false;

      // Region
      const region = this._worldMemory?.getFlag?.('current_region') || '';
      if (cfg.region && cfg.region !== region) return false;

      // World flag
      if (cfg.requiredFlag && !this._worldMemory?.getFlag(cfg.requiredFlag)) return false;

      return true;
    }

    _fireEncounter(slot, playerPos, now) {
      slot.fire(now);
      this._telemetry.encounterCount++;

      if (IS_DEV) console.log(`[Director] Firing encounter: ${slot.id}`);

      if (this._eventBus) {
        this._eventBus.emit('DIRECTOR_ENCOUNTER', {
          encounterId: slot.id,
          trigger:     slot.trigger,
          config:      slot.config,
          playerPos
        });
      }

      // Spawn NPC or wildlife if configured
      if (slot.config.spawnNPC && this._npcManager) {
        this._npcManager.spawn(slot.config.spawnNPC, {
          x: playerPos.x + (Math.random() - 0.5) * 20,
          y: 0,
          z: playerPos.z + (Math.random() - 0.5) * 20
        });
      }

      if (slot.config.spawnWildlife && this._wildlifeAI) {
        this._wildlifeAI.spawn(slot.config.spawnWildlife, {
          x: playerPos.x + 15 + Math.random() * 10,
          y: 0,
          z: playerPos.z + (Math.random() - 0.5) * 20
        });
      }

      // Weather shift
      if (slot.config.weatherShift && this._eventBus) {
        this._eventBus.emit('WEATHER_SHIFT_REQUESTED', { type: slot.config.weatherShift });
      }
    }

    // ─── Boredom Prevention ───────────────────────────────────────────────────

    _evaluateBoredom() {
      const idle = this._telemetry.idleTime;
      if (idle > 120) {
        // Player has been idle > 2 minutes — spawn ambient activity
        if (IS_DEV) console.log('[Director] Anti-boredom: spawning ambient NPC');
        if (this._eventBus) {
          this._eventBus.emit('DIRECTOR_AMBIENT_SPAWN', { reason: 'boredom', idleTime: idle });
        }
        this._telemetry.idleTime = 0;
      }
    }

    // ─── Default Encounters ───────────────────────────────────────────────────

    _registerDefaultEncounters() {
      // Morning: peacock crossing near forest paths
      this._encounters.set('peacock_morning', new EncounterSlot('peacock_morning', 'ambient', {
        cooldown: 300, dayOnly: true, minTension: TensionLevel.TRANQUIL, maxTension: TensionLevel.LOW,
        spawnWildlife: 'peacock'
      }));

      // Deer grazing in open clearings
      this._encounters.set('deer_grazing', new EncounterSlot('deer_grazing', 'ambient', {
        cooldown: 240, dayOnly: true, minTension: TensionLevel.TRANQUIL, maxTension: TensionLevel.MEDIUM,
        spawnWildlife: 'spotted_deer'
      }));

      // Tea stall vendor appears along road
      this._encounters.set('tea_vendor_road', new EncounterSlot('tea_vendor_road', 'exploration', {
        cooldown: 600, dayOnly: true,
        spawnNPC: 'tea_vendor'
      }));

      // Night: langur alarm calls (creates atmospheric tension)
      this._encounters.set('langur_alarm_night', new EncounterSlot('langur_alarm_night', 'ambient', {
        cooldown: 180, nightOnly: true, maxTension: TensionLevel.MEDIUM,
        spawnWildlife: 'langur'
      }));

      if (IS_DEV) console.log('[Director] Default encounters registered');
    }

    // ─── Query ────────────────────────────────────────────────────────────────

    getTensionLevel() { return this._tension; }
    getTensionLabel() {
      return Object.entries(TensionLevel).find(([, v]) => v === this._tension)?.[0] ?? 'UNKNOWN';
    }

    destroy() {
      this._encounters.clear();
    }
  }

  return { TensionLevel, EncounterSlot, GameDirector };
});
