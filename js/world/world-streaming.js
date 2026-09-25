/**
 * The Whispering Wilds (Kaattu Vazhi) - Master World Streaming System
 * Single authoritative coordinator uniting WorldGrid, WorldSector, WorldOrigin,
 * WorldVisibility, WorldLOD, WorldPrefetch, WorldMemory, WorldAssetCache, and WorldUnload.
 * Implements 5-zone distance hierarchy, predictive prefetching, WorldPersistenceManager,
 * benchmark routes A-L, and safe sector loading/unloading without hitching.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([
      './world-sector',
      './world-grid',
      './world-origin',
      './world-visibility',
      './world-lod',
      './world-prefetch',
      './world-memory',
      './world-asset-cache',
      './world-unload'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./world-sector'),
      require('./world-grid'),
      require('./world-origin'),
      require('./world-visibility'),
      require('./world-lod'),
      require('./world-prefetch'),
      require('./world-memory'),
      require('./world-asset-cache'),
      require('./world-unload')
    );
  } else {
    root.WorldStreaming = factory(
      root.WorldSector || (typeof window !== 'undefined' ? window.WorldSector : null),
      root.WorldGrid || (typeof window !== 'undefined' ? window.WorldGrid : null),
      root.WorldOrigin || (typeof window !== 'undefined' ? window.WorldOrigin : null),
      root.WorldVisibility || (typeof window !== 'undefined' ? window.WorldVisibility : null),
      root.WorldLOD || (typeof window !== 'undefined' ? window.WorldLOD : null),
      root.WorldPrefetch || (typeof window !== 'undefined' ? window.WorldPrefetch : null),
      root.WorldMemory || (typeof window !== 'undefined' ? window.WorldMemory : null),
      root.WorldAssetCache || (typeof window !== 'undefined' ? window.WorldAssetCache : null),
      root.WorldUnload || (typeof window !== 'undefined' ? window.WorldUnload : null)
    );
    if (typeof window !== 'undefined') {
      window.WorldStreaming = root.WorldStreaming;
      // Provide WorldPersistenceManager globally
      window.WorldPersistenceManager = root.WorldStreaming.persistence;
    }
  }
})(typeof self !== 'undefined' ? self : this, function (
  WorldSector,
  WorldGrid,
  WorldOrigin,
  WorldVisibility,
  WorldLOD,
  WorldPrefetch,
  WorldMemory,
  WorldAssetCache,
  WorldUnload
) {
  'use strict';

  // Distance Zone Thresholds (Meters from Player)
  const ZONE_DISTANCES = Object.freeze({
    ZONE_0_IMMEDIATE: 40.0,   // Full simulation, collision, audio, animations
    ZONE_1_NEAR: 90.0,        // Full visual quality, standard AI frequency
    ZONE_2_VISIBLE: 180.0,     // LOD assets, reduced AI and audio complexity
    ZONE_3_BACKGROUND: 320.0,  // Background visuals only, very low tick
    ZONE_4_UNLOAD: 450.0       // Unloaded
  });

  // ── WORLD PERSISTENCE MANAGER ─────────────────────────────────────────────
  class WorldPersistenceManager {
    constructor() {
      this.persistentState = {
        openedContainers: {},
        destroyedProps: {},
        completedEvents: {},
        discoveredSecrets: {},
        sectorStates: {}
      };
    }

    saveSectorState(sectorId, data) {
      if (sectorId) this.persistentState.sectorStates[sectorId] = { ...data };
    }

    getSectorState(sectorId) {
      return this.persistentState.sectorStates[sectorId] || null;
    }

    markContainerOpened(containerId) {
      this.persistentState.openedContainers[containerId] = true;
    }

    isContainerOpened(containerId) {
      return !!this.persistentState.openedContainers[containerId];
    }

    markPropDestroyed(propId) {
      this.persistentState.destroyedProps[propId] = true;
    }

    isPropDestroyed(propId) {
      return !!this.persistentState.destroyedProps[propId];
    }

    serialize() {
      return JSON.parse(JSON.stringify(this.persistentState));
    }

    deserialize(data) {
      if (data && typeof data === 'object') {
        Object.assign(this.persistentState, data);
      }
    }
  }

  // ── MASTER STREAMING ENGINE ───────────────────────────────────────────────
  class WorldStreamingEngine {
    constructor() {
      this.grid = WorldGrid || (typeof window !== 'undefined' ? window.WorldGrid : null);
      this.origin = WorldOrigin || (typeof window !== 'undefined' ? window.WorldOrigin : null);
      this.visibility = WorldVisibility || (typeof window !== 'undefined' ? window.WorldVisibility : null);
      this.lod = WorldLOD || (typeof window !== 'undefined' ? window.WorldLOD : null);
      this.prefetch = WorldPrefetch || (typeof window !== 'undefined' ? window.WorldPrefetch : null);
      this.memory = WorldMemory || (typeof window !== 'undefined' ? window.WorldMemory : null);
      this.cache = WorldAssetCache || (typeof window !== 'undefined' ? window.WorldAssetCache : null);

      this.persistence = new WorldPersistenceManager();
      this.unloader = new (WorldUnload || (typeof window !== 'undefined' ? window.WorldUnload : null))(this.persistence, this.cache);

      this.activeSectors = new Set();
      this.currentSector = null;
      this.activeQuestSectors = [];

      this.isUpdating = false;
      this.telemetry = {
        activeSectorsCount: 0,
        prefetchedCount: 0,
        unloadedCount: 0,
        streamingWaitMs: 0
      };
    }

    /**
     * Update streaming system around player position
     * @param {Object} playerState - { pos: {x,y,z}, velocity: {x,y,z}, inVehicle: boolean }
     */
    update(playerState, scene = null, audioManager = null) {
      if (!playerState || !playerState.pos || !this.grid) return;

      const p = playerState.pos;
      const t0 = performance.now();

      // 1. Check Floating Origin Recentering
      if (this.origin) {
        this.origin.checkRecentering(p);
      }

      // 2. Determine Current Player Sector
      const current = this.grid.getSectorAt(p.x, p.z || p.y || 0);
      if (current && current !== this.currentSector) {
        this.currentSector = current;
        if (typeof window !== 'undefined' && window.GameState) {
          window.GameState.setStreamingCell(current.region, current.id, Array.from(this.activeSectors).map(s => s.id));
        }
      }

      // 3. Evaluate All Sectors and Assign Distance Zones
      const allSectors = this.grid.getAllSectors();
      const newlyActive = new Set();

      for (let i = 0; i < allSectors.length; i++) {
        const sec = allSectors[i];
        const dist = sec.distanceTo(p);

        let zone = 4;
        if (dist <= ZONE_DISTANCES.ZONE_0_IMMEDIATE) zone = 0;
        else if (dist <= ZONE_DISTANCES.ZONE_1_NEAR) zone = 1;
        else if (dist <= ZONE_DISTANCES.ZONE_2_VISIBLE) zone = 2;
        else if (dist <= ZONE_DISTANCES.ZONE_3_BACKGROUND) zone = 3;

        sec.setZone(zone);

        if (zone <= 1) {
          newlyActive.add(sec);
          this.activeSectors.add(sec);
        } else if (zone === 4) {
          // Candidates for safe unload
          if (this.activeSectors.has(sec)) {
            this.unloader.unloadSector(sec, {
              playerPos: p,
              activeQuestSectors: this.activeQuestSectors,
              scene,
              audioManager
            });
            this.activeSectors.delete(sec);
          }
        }
      }

      // 4. Predictive Prefetching
      if (this.prefetch) {
        const prefetchList = this.prefetch.getPrefetchCandidates(this.grid, playerState, this.activeQuestSectors);
        for (let i = 0; i < prefetchList.length; i++) {
          const pSec = prefetchList[i];
          if (pSec.state === 'UNLOADED') {
            pSec.state = 'PREFETCHED';
          }
        }
      }

      this.telemetry.activeSectorsCount = this.activeSectors.size;
      this.telemetry.unloadedCount = this.unloader.unloadedCount;
      this.telemetry.streamingWaitMs = performance.now() - t0;
    }

    /**
     * Preloads destination sector before fast-travel teleportation
     */
    prepareFastTravel(targetPos) {
      if (!this.grid || !targetPos) return Promise.resolve(false);
      const destSector = this.grid.getSectorAt(targetPos.x, targetPos.z || targetPos.y || 0);
      if (!destSector) return Promise.resolve(false);

      destSector.setZone(0);
      destSector.state = 'ACTIVE';
      this.activeSectors.add(destSector);

      return Promise.resolve(true);
    }

    setActiveQuestSectors(sectorIds = []) {
      this.activeQuestSectors = Array.isArray(sectorIds) ? [...sectorIds] : [];
    }

    // ── PERFORMANCE BENCHMARK ROUTE SCENARIOS (Section 52) ──────────────────
    getBenchmarkRoute(routeKey) {
      const routes = {
        'BENCHMARK_A': { name: 'Dense Chennai Street & Parrys Corner', start: { x: -220, z: 630 }, speed: 6.0 },
        'BENCHMARK_B': { name: 'Cauvery River Village Settlement', start: { x: 1200, z: 450 }, speed: 5.0 },
        'BENCHMARK_C': { name: 'Paddy Fields & Irrigation Canals', start: { x: 1600, z: 400 }, speed: 8.0 },
        'BENCHMARK_D': { name: 'Pichavaram Mangrove Wetland Waterways', start: { x: 2500, z: 850 }, speed: 4.5 },
        'BENCHMARK_E': { name: 'Chettinad Heritage Mansion Courtyard', start: { x: 3200, z: 500 }, speed: 4.0 },
        'BENCHMARK_F': { name: 'Mamallapuram Coastal Granite Shore', start: { x: 4300, z: 700 }, speed: 7.0 },
        'BENCHMARK_G': { name: 'Nilgiris High Elevation Shola Forest', start: { x: 5000, z: 300 }, speed: 5.0 },
        'BENCHMARK_H': { name: 'Ooty Misty Tea Plantation Trails', start: { x: 5200, z: 250 }, speed: 6.0 },
        'BENCHMARK_I': { name: 'Thanjavur Temple Festival Night Lights', start: { x: 3800, z: 350 }, speed: 5.0 },
        'BENCHMARK_J': { name: 'Monsoon Heavy Thunderstorm & Squall', start: { x: 100, z: 600 }, speed: 6.5 },
        'BENCHMARK_K': { name: 'Royal Enfield Rapid Traversal Arterial', start: { x: 800, z: 500 }, speed: 18.0 },
        'BENCHMARK_L': { name: 'Fast Travel Stress Test across 8 Regions', start: { x: 5500, z: 300 }, speed: 0.0 }
      };
      return routes[routeKey] || null;
    }
  }

  const engine = new WorldStreamingEngine();
  engine.persistence = engine.persistence;
  return engine;
});
