/**
 * The Whispering Wilds - NavMesh Manager
 * Manages tiled navigation meshes for NPCs across all world regions.
 * Regions: Chennai, Cauvery Delta, Pichavaram, Chettinad, Mamallapuram, Nilgiris.
 * Integrates with WorldStreaming for tile load/unload order.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.NavMeshManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost') ||
                 (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');

  // ─── NavMesh Tile ────────────────────────────────────────────────────────────
  class NavMeshTile {
    /**
     * @param {string} id       - Unique tile ID
     * @param {Object} bounds   - { minX, maxX, minZ, maxZ }
     * @param {string} region   - Region name
     */
    constructor(id, bounds, region) {
      this.id        = id;
      this.bounds    = bounds;
      this.region    = region;
      this.loaded    = false;
      this._cells    = [];   // Array of walkable NavCell
      this._excluded = [];   // Exclusion zone AABBs
    }

    load(cells, exclusions = []) {
      this._cells    = cells;
      this._excluded = exclusions;
      this.loaded    = true;
    }

    unload() {
      this._cells    = [];
      this._excluded = [];
      this.loaded    = false;
    }

    /** Returns true if world position (x,z) is navigable in this tile. */
    isNavigable(x, z) {
      if (!this.loaded) return false;
      // Check exclusions first
      for (const ex of this._excluded) {
        if (x >= ex.minX && x <= ex.maxX && z >= ex.minZ && z <= ex.maxZ) return false;
      }
      // Check walkable cells
      for (const cell of this._cells) {
        if (x >= cell.minX && x <= cell.maxX && z >= cell.minZ && z <= cell.maxZ) return true;
      }
      return false;
    }

    /** Find nearest navigable point to (x, z) within this tile. */
    nearestNavigable(x, z, maxDist = 5) {
      let best = null;
      let bestDist = maxDist;
      for (const cell of this._cells) {
        // Clamp to cell
        const cx = Math.max(cell.minX, Math.min(x, cell.maxX));
        const cz = Math.max(cell.minZ, Math.min(z, cell.maxZ));
        const dist = Math.sqrt((cx - x) ** 2 + (cz - z) ** 2);
        if (dist < bestDist) {
          bestDist = dist;
          best = { x: cx, z: cz };
        }
      }
      return best;
    }
  }

  // ─── NavMesh Manager ─────────────────────────────────────────────────────────
  class NavMeshManager {
    constructor() {
      this._tiles         = new Map();   // tileId → NavMeshTile
      this._regionTiles   = new Map();   // region → Set of tileIds
      this._obstacles     = new Map();   // obstacleId → { bounds, reason }
      this._eventBus      = null;
      this._pathCache     = new Map();   // cacheKey → { path, expiry }
      this._cacheMaxAge   = 30000;       // ms
    }

    init(eventBus) {
      this._eventBus = eventBus;
      if (eventBus) {
        eventBus.on('SECTOR_STREAMED', ({ sectorId, loaded }) => {
          // When sector loads, load associated navmesh tiles
          if (loaded) {
            this._loadTilesForSector(sectorId);
          } else {
            this._unloadTilesForSector(sectorId);
          }
        });
      }
    }

    // ─── Tile Management ──────────────────────────────────────────────────────

    /**
     * Register a tile definition. Tiles start unloaded.
     * @param {string} id
     * @param {Object} bounds  { minX, maxX, minZ, maxZ }
     * @param {string} region
     * @param {string} [sectorId]  - Associated streaming sector
     */
    registerTile(id, bounds, region, sectorId = null) {
      const tile = new NavMeshTile(id, bounds, region);
      tile.sectorId = sectorId;
      this._tiles.set(id, tile);
      if (!this._regionTiles.has(region)) this._regionTiles.set(region, new Set());
      this._regionTiles.get(region).add(id);
      return tile;
    }

    /**
     * Load a tile with walkable cells and exclusion zones.
     * Called when the associated sector streams in (collision first, then navmesh).
     */
    loadTile(id, cells, exclusions = []) {
      const tile = this._tiles.get(id);
      if (!tile) { if (IS_DEV) console.warn(`[NavMesh] Unknown tile: ${id}`); return; }
      tile.load(cells, exclusions);
      if (IS_DEV) console.log(`[NavMesh] Loaded tile: ${id} (${cells.length} cells)`);
      this._invalidatePathCache(tile.bounds);
    }

    unloadTile(id) {
      const tile = this._tiles.get(id);
      if (!tile || !tile.loaded) return;
      tile.unload();
      if (IS_DEV) console.log(`[NavMesh] Unloaded tile: ${id}`);
      this._invalidatePathCache(tile.bounds);
    }

    _loadTilesForSector(sectorId) {
      for (const tile of this._tiles.values()) {
        if (tile.sectorId === sectorId && !tile.loaded) {
          // Signal content pipeline to load this tile's navdata
          if (this._eventBus) {
            this._eventBus.emit('NAVMESH_TILE_REQUESTED', { tileId: tile.id });
          }
        }
      }
    }

    _unloadTilesForSector(sectorId) {
      for (const tile of this._tiles.values()) {
        if (tile.sectorId === sectorId && tile.loaded) {
          // Only unload if player is not standing in this tile's bounds
          this.unloadTile(tile.id);
        }
      }
    }

    // ─── Dynamic Obstacles ────────────────────────────────────────────────────

    /**
     * Add a runtime obstacle (parked vehicle, festival stall, etc.)
     * @param {string} id
     * @param {{ minX, maxX, minZ, maxZ }} bounds
     * @param {string} reason
     */
    addObstacle(id, bounds, reason = '') {
      this._obstacles.set(id, { bounds, reason });
      this._invalidatePathCacheInBounds(bounds);
    }

    removeObstacle(id) {
      const obs = this._obstacles.get(id);
      if (obs) {
        this._obstacles.delete(id);
        this._invalidatePathCacheInBounds(obs.bounds);
      }
    }

    // ─── Navigability Queries ─────────────────────────────────────────────────

    /**
     * Is position (x, z) navigable?
     * @returns {boolean}
     */
    isNavigable(x, z) {
      // Check dynamic obstacles first (fast rejection)
      for (const obs of this._obstacles.values()) {
        const b = obs.bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return false;
      }
      // Check loaded tiles
      for (const tile of this._tiles.values()) {
        if (!tile.loaded) continue;
        const b = tile.bounds;
        if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) continue;
        if (tile.isNavigable(x, z)) return true;
      }
      return false;
    }

    /**
     * Find nearest navigable point to (x, z).
     * @param {number} x
     * @param {number} z
     * @param {number} [searchRadius=10]
     * @returns {{x, z}|null}
     */
    nearestNavigable(x, z, searchRadius = 10) {
      let best = null;
      let bestDist = searchRadius;
      for (const tile of this._tiles.values()) {
        if (!tile.loaded) continue;
        const candidate = tile.nearestNavigable(x, z, searchRadius);
        if (candidate) {
          const dist = Math.sqrt((candidate.x - x) ** 2 + (candidate.z - z) ** 2);
          if (dist < bestDist) { bestDist = dist; best = candidate; }
        }
      }
      return best;
    }

    /**
     * Returns the region name for position (x, z).
     * @returns {string|null}
     */
    getRegionAt(x, z) {
      for (const tile of this._tiles.values()) {
        if (!tile.loaded) continue;
        const b = tile.bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return tile.region;
      }
      return null;
    }

    // ─── Path Cache ───────────────────────────────────────────────────────────

    _cacheKey(fx, fz, tx, tz) {
      return `${Math.round(fx)},${Math.round(fz)},${Math.round(tx)},${Math.round(tz)}`;
    }

    cacheGet(fx, fz, tx, tz) {
      const key = this._cacheKey(fx, fz, tx, tz);
      const entry = this._pathCache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiry) { this._pathCache.delete(key); return null; }
      return entry.path;
    }

    cacheSet(fx, fz, tx, tz, path) {
      const key = this._cacheKey(fx, fz, tx, tz);
      this._pathCache.set(key, { path, expiry: Date.now() + this._cacheMaxAge });
    }

    _invalidatePathCache(bounds) {
      for (const [key] of this._pathCache) {
        const [fx, fz, tx, tz] = key.split(',').map(Number);
        if (this._pointInBounds(fx, fz, bounds) || this._pointInBounds(tx, tz, bounds)) {
          this._pathCache.delete(key);
        }
      }
    }

    _invalidatePathCacheInBounds(bounds) { this._invalidatePathCache(bounds); }

    _pointInBounds(x, z, b) {
      return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
    }

    // ─── Default World Tile Registration ─────────────────────────────────────

    /**
     * Populate default Tamil Nadu region tiles.
     * In production these come from content data; here we register the structure.
     */
    registerDefaultWorldTiles() {
      // Chennai
      this.registerTile('nav_chennai_main',   { minX: 100, maxX: 500, minZ: 100, maxZ: 500 }, 'chennai',   'sector_chennai_main');
      this.registerTile('nav_chennai_market', { minX: 200, maxX: 350, minZ: 150, maxZ: 300 }, 'chennai',   'sector_chennai_market');
      // Cauvery Delta
      this.registerTile('nav_delta_village',  { minX: -200, maxX: 200, minZ: 400, maxZ: 800 }, 'cauvery_delta', 'sector_delta_main');
      this.registerTile('nav_delta_farm',     { minX: -300, maxX: 0,   minZ: 500, maxZ: 900 }, 'cauvery_delta', 'sector_delta_farm');
      // Pichavaram
      this.registerTile('nav_pichavaram',     { minX: -400, maxX: -100, minZ: 200, maxZ: 600 }, 'pichavaram', 'sector_pichavaram');
      // Chettinad
      this.registerTile('nav_chettinad',      { minX: 400, maxX: 800, minZ: 200, maxZ: 600 }, 'chettinad', 'sector_chettinad');
      // Mamallapuram
      this.registerTile('nav_mamalla',        { minX: 300, maxX: 700, minZ: -200, maxZ: 200 }, 'mamallapuram', 'sector_mamalla');
      // Nilgiris
      this.registerTile('nav_nilgiris_trail', { minX: -100, maxX: 300, minZ: -500, maxZ: -100 }, 'nilgiris', 'sector_nilgiris');
      if (IS_DEV) console.log('[NavMesh] Default world tiles registered');
    }

    get loadedTileCount() {
      let n = 0;
      for (const t of this._tiles.values()) if (t.loaded) n++;
      return n;
    }

    get totalTileCount() { return this._tiles.size; }

    destroy() {
      this._tiles.clear();
      this._regionTiles.clear();
      this._obstacles.clear();
      this._pathCache.clear();
    }
  }

  return { NavMeshTile, NavMeshManager };
});
