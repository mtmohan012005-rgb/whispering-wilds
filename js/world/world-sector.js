/**
 * The Whispering Wilds (Kaattu Vazhi) - World Sector Definition
 * Represents a single spatial sector in the Tamil Nadu open world.
 * Manages metadata, boundaries, assets, NPCs, wildlife, audio, and lifecycle state.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldSector = factory();
    if (typeof window !== 'undefined') {
      window.WorldSector = root.WorldSector;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Sector Lifecycle States
  const SECTOR_STATE = Object.freeze({
    UNLOADED: 'UNLOADED',
    PREFETCHED: 'PREFETCHED',
    LOADING: 'LOADING',
    ACTIVE: 'ACTIVE',
    DEACTIVATED: 'DEACTIVATED',
    ERROR: 'ERROR'
  });

  class WorldSector {
    /**
     * @param {Object} config - Sector configuration
     */
    constructor(config = {}) {
      this.id = config.id || 'sector_unknown';
      this.name = config.name || this.id;
      this.region = config.region || 'george_town';
      this.biome = config.biome || 'plains';
      this.priority = config.priority || 1; // 1 = normal, 2 = high, 3 = critical

      // Spatial Bounds [minX, maxX, minZ, maxZ]
      this.bounds = config.bounds || { minX: 0, maxX: 500, minZ: 0, maxZ: 500 };
      this.center = {
        x: (this.bounds.minX + this.bounds.maxX) / 2,
        y: config.center?.y || 0,
        z: (this.bounds.minZ + this.bounds.maxZ) / 2
      };

      // Content Associations
      this.assetBundle = config.assetBundle || [];
      this.npcSet = config.npcSet || [];
      this.wildlifeSet = config.wildlifeSet || [];
      this.audioProfile = config.audioProfile || { ambience: 'day_ambient', music: 'regional_theme' };
      this.weatherProfile = config.weatherProfile || 'clear';
      this.navigationData = config.navigationData || null;
      this.collisionData = config.collisionData || [];
      this.questContent = config.questContent || [];
      this.worldEventContent = config.worldEventContent || [];
      this.lodSettings = config.lodSettings || { maxDistance: 450, lodBias: 1.0 };
      this.isCulturalLandmark = !!config.isCulturalLandmark;

      // Runtime State
      this.state = SECTOR_STATE.UNLOADED;
      this.currentZone = 4; // 0 = Immediate, 1 = Near, 2 = Visible, 3 = Background, 4 = Unloaded
      this.loadedObjects = [];
      this.activeInstances = new Set();
      this.loadTimestamp = 0;
      this.hasActiveQuest = false;
    }

    isPlayerInside(pos) {
      if (!pos) return false;
      return (
        pos.x >= this.bounds.minX &&
        pos.x <= this.bounds.maxX &&
        pos.z >= this.bounds.minZ &&
        pos.z <= this.bounds.maxZ
      );
    }

    distanceTo(pos) {
      if (!pos) return Infinity;
      // Closest point on AABB to pos
      const cx = Math.max(this.bounds.minX, Math.min(pos.x, this.bounds.maxX));
      const cz = Math.max(this.bounds.minZ, Math.min(pos.z, this.bounds.maxZ));
      return Math.hypot(pos.x - cx, pos.z - cz);
    }

    setZone(zone) {
      this.currentZone = zone;
      if (zone <= 1 && this.state !== SECTOR_STATE.ACTIVE) {
        this.state = SECTOR_STATE.ACTIVE;
      } else if (zone === 2 || zone === 3) {
        if (this.state === SECTOR_STATE.UNLOADED) {
          this.state = SECTOR_STATE.PREFETCHED;
        }
      }
    }

    markQuestActive(active = true) {
      this.hasActiveQuest = active;
      if (active) this.priority = Math.max(this.priority, 3);
    }

    serializePersistentState() {
      return {
        id: this.id,
        state: this.state,
        hasActiveQuest: this.hasActiveQuest
      };
    }
  }

  WorldSector.SECTOR_STATE = SECTOR_STATE;
  return WorldSector;
});
