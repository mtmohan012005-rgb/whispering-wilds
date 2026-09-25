/**
 * The Whispering Wilds - Living Crowd System
 * Manages ambient crowds at markets, temples, ghats, festivals.
 * Uses pooled ghost agents (no full collision/navmesh) for distant crowds.
 * Only close NPCs get full AI treatment; distant ones are atmosphere-only.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.LivingCrowd = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Crowd Zone Types ─────────────────────────────────────────────────────────
  const CrowdZoneType = Object.freeze({
    MARKET:      'market',
    TEMPLE:      'temple',
    GHAT:        'ghat',
    FESTIVAL:    'festival',
    STREET:      'street',
    FARM:        'farm',
    BUS_STAND:   'bus_stand',
    SCHOOL_GATE: 'school_gate',
    HARBOUR:     'harbour'
  });

  // ─── Ghost Agent (atmosphere-only crowd member) ───────────────────────────────
  class GhostAgent {
    constructor(id, zone) {
      this.id       = id;
      this.zone     = zone;
      this.x        = zone.centerX + (Math.random() - 0.5) * zone.radius;
      this.z        = zone.centerZ + (Math.random() - 0.5) * zone.radius;
      this.vx       = (Math.random() - 0.5) * 1.5;
      this.vz       = (Math.random() - 0.5) * 1.5;
      this.rotation = Math.random() * Math.PI * 2;
      this.activity = 'walk';
      this._wanderTimer = Math.random() * 5;
      this.visible  = true;
    }

    update(dt) {
      this._wanderTimer -= dt;
      if (this._wanderTimer <= 0) {
        // Change direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random();
        this.vx = Math.cos(angle) * speed;
        this.vz = Math.sin(angle) * speed;
        this.activity = Math.random() > 0.7 ? 'idle' : 'walk';
        this._wanderTimer = 3 + Math.random() * 8;
      }

      if (this.activity === 'idle') { this.vx *= 0.8; this.vz *= 0.8; }

      this.x += this.vx * dt;
      this.z += this.vz * dt;

      // Keep within zone bounds
      const zone = this.zone;
      const dx = this.x - zone.centerX;
      const dz = this.z - zone.centerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > zone.radius) {
        // Push back
        this.x = zone.centerX + (dx / dist) * zone.radius * 0.9;
        this.z = zone.centerZ + (dz / dist) * zone.radius * 0.9;
        // Reverse velocity
        this.vx = -this.vx * 0.5;
        this.vz = -this.vz * 0.5;
      }
    }
  }

  // ─── Crowd Zone ───────────────────────────────────────────────────────────────
  class CrowdZone {
    constructor(id, type, centerX, centerZ, radius, options = {}) {
      this.id       = id;
      this.type     = type;
      this.centerX  = centerX;
      this.centerZ  = centerZ;
      this.radius   = radius;
      this.active   = true;
      this.baseDensity  = options.density    || 8;
      this.peakHours    = options.peakHours  || [8, 18];
      this.quietHours   = options.quietHours || [1, 5];
      this._agents      = [];
      this._maxAgents   = Math.min(options.maxAgents || 20, 40);
    }

    populate() {
      this._agents = [];
      for (let i = 0; i < this.baseDensity; i++) {
        this._agents.push(new GhostAgent(`${this.id}_g${i}`, this));
      }
    }

    getCurrentDensity(hour) {
      if (hour >= this.peakHours[0] && hour < this.peakHours[1]) {
        return Math.min(this.baseDensity * 1.5, this._maxAgents);
      }
      if (hour >= this.quietHours[0] && hour < this.quietHours[1]) {
        return Math.max(1, this.baseDensity * 0.2);
      }
      return this.baseDensity;
    }
  }

  // ─── Living Crowd System ──────────────────────────────────────────────────────
  class LivingCrowdSystem {
    constructor() {
      this._zones         = new Map();
      this._gameState     = null;
      this._eventBus      = null;
      this._spatialQuery  = null;
      this._npcManager    = null;

      // Only update ghost agents within this radius of player
      this.GHOST_UPDATE_RADIUS = 50;
      this.GHOST_SHOW_RADIUS   = 30;  // Only render within this distance

      this._updateInterval  = 0.1;  // 10 Hz for ghost agents
      this._updateTick      = 0;
    }

    init(deps) {
      this._gameState    = deps.gameState;
      this._eventBus     = deps.eventBus;
      this._spatialQuery = deps.spatialQuery;
      this._npcManager   = deps.npcManager;

      // Register default Tamil Nadu crowd zones
      this._registerDefaultZones();
    }

    _registerDefaultZones() {
      // Chennai markets
      this.addZone('market_chennai_central',  CrowdZoneType.MARKET,   220, 280, 25, { density: 15, peakHours: [8, 20] });
      this.addZone('temple_kapaleeshwarar',   CrowdZoneType.TEMPLE,   240, 310, 15, { density: 10, peakHours: [5, 9]  });
      this.addZone('bus_stand_chennai',       CrowdZoneType.BUS_STAND, 200, 270, 10, { density: 20, peakHours: [6, 21] });
      // Cauvery delta
      this.addZone('market_sirkali',          CrowdZoneType.MARKET,   -50, 500, 20, { density: 12 });
      this.addZone('farm_workers',            CrowdZoneType.FARM,     -100, 600, 30, { density: 8, peakHours: [5, 12] });
      // Pichavaram
      this.addZone('harbour_pichavaram',      CrowdZoneType.HARBOUR,  -200, 350, 12, { density: 6, peakHours: [5, 10] });
    }

    addZone(id, type, cx, cz, radius, options = {}) {
      const zone = new CrowdZone(id, type, cx, cz, radius, options);
      zone.populate();
      this._zones.set(id, zone);
    }

    removeZone(id) { this._zones.delete(id); }

    update(dt) {
      this._updateTick += dt;
      if (this._updateTick < this._updateInterval) return;
      this._updateTick = 0;

      if (!this._gameState?.player) return;
      const player = this._gameState.player;
      const px     = player.position.x;
      const pz     = player.position.z;
      const hour   = this._gameState.world?.time?.hour ?? 12;

      for (const zone of this._zones.values()) {
        if (!zone.active) continue;

        // Distance from zone centre to player
        const dx = zone.centerX - px;
        const dz = zone.centerZ - pz;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Only update agents in zones near the player
        if (dist > this.GHOST_UPDATE_RADIUS + zone.radius) continue;

        // Dynamically scale density based on time
        const targetDensity = Math.round(zone.getCurrentDensity(hour));
        while (zone._agents.length < targetDensity) {
          zone._agents.push(new GhostAgent(`${zone.id}_g${zone._agents.length}`, zone));
        }
        while (zone._agents.length > targetDensity) {
          zone._agents.pop();
        }

        // Update agents
        const effectiveDt = this._updateInterval;
        for (const agent of zone._agents) {
          agent.visible = dist < this.GHOST_SHOW_RADIUS + zone.radius;
          agent.update(effectiveDt);
        }
      }
    }

    /**
     * Returns all visible ghost agents in a given radius of (px, pz).
     * Used by the renderer to draw low-LOD crowd meshes.
     */
    getVisibleAgents(px, pz, radius) {
      const results = [];
      for (const zone of this._zones.values()) {
        for (const agent of zone._agents) {
          if (!agent.visible) continue;
          const dx = agent.x - px;
          const dz = agent.z - pz;
          if (dx * dx + dz * dz <= radius * radius) {
            results.push(agent);
          }
        }
      }
      return results;
    }

    getZone(id) { return this._zones.get(id) || null; }
    get zoneCount() { return this._zones.size; }

    destroy() {
      this._zones.clear();
    }
  }

  return { CrowdZoneType, GhostAgent, CrowdZone, LivingCrowdSystem };
});
