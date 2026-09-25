/**
 * The Whispering Wilds - Spatial Query System
 * Centralised, reusable spatial queries used by all game systems.
 * Uses spatial partitioning (grid) to avoid full-world scans every frame.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SpatialQuery = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Spatial Grid ────────────────────────────────────────────────────────────
  class SpatialGrid {
    /**
     * @param {number} cellSize - Grid cell size in world units
     */
    constructor(cellSize = 32) {
      this._cellSize = cellSize;
      this._cells    = new Map();  // "cx:cz" → Set of entity IDs
      this._positions = new Map(); // entityId → { x, y, z, radius, tags }
    }

    _cellKey(cx, cz) { return `${cx}:${cz}`; }
    _cellFor(x, z) {
      return {
        cx: Math.floor(x / this._cellSize),
        cz: Math.floor(z / this._cellSize)
      };
    }

    /** Insert or update an entity in the grid. */
    upsert(id, x, y, z, radius = 0.5, tags = []) {
      // Remove from old cell if exists
      const old = this._positions.get(id);
      if (old) {
        const { cx, cz } = this._cellFor(old.x, old.z);
        const key = this._cellKey(cx, cz);
        const cell = this._cells.get(key);
        if (cell) { cell.delete(id); if (cell.size === 0) this._cells.delete(key); }
      }
      // Insert into new cell
      const { cx, cz } = this._cellFor(x, z);
      const key = this._cellKey(cx, cz);
      if (!this._cells.has(key)) this._cells.set(key, new Set());
      this._cells.get(key).add(id);
      this._positions.set(id, { x, y, z, radius, tags });
    }

    remove(id) {
      const pos = this._positions.get(id);
      if (!pos) return;
      const { cx, cz } = this._cellFor(pos.x, pos.z);
      const key = this._cellKey(cx, cz);
      const cell = this._cells.get(key);
      if (cell) { cell.delete(id); if (cell.size === 0) this._cells.delete(key); }
      this._positions.delete(id);
    }

    /**
     * Query all entities within 'radius' of (x, z), optionally filtered by tag.
     * @param {number} x
     * @param {number} z
     * @param {number} radius
     * @param {string|null} [tag]
     * @returns {Array<{id, x, y, z, dist}>}
     */
    query(x, z, radius, tag = null) {
      const cs = this._cellSize;
      const minCX = Math.floor((x - radius) / cs);
      const maxCX = Math.floor((x + radius) / cs);
      const minCZ = Math.floor((z - radius) / cs);
      const maxCZ = Math.floor((z + radius) / cs);

      const results = [];
      const rSq = radius * radius;

      for (let cx = minCX; cx <= maxCX; cx++) {
        for (let cz = minCZ; cz <= maxCZ; cz++) {
          const cell = this._cells.get(this._cellKey(cx, cz));
          if (!cell) continue;
          for (const id of cell) {
            const p = this._positions.get(id);
            if (!p) continue;
            if (tag && !p.tags.includes(tag)) continue;
            const dx = p.x - x;
            const dz = p.z - z;
            const distSq = dx * dx + dz * dz;
            if (distSq <= rSq) {
              results.push({ id, x: p.x, y: p.y, z: p.z, dist: Math.sqrt(distSq), tags: p.tags });
            }
          }
        }
      }

      // Sort nearest first
      results.sort((a, b) => a.dist - b.dist);
      return results;
    }

    getPosition(id) { return this._positions.get(id) || null; }
    has(id) { return this._positions.has(id); }
    clear() { this._cells.clear(); this._positions.clear(); }
    get size() { return this._positions.size; }
  }

  // ─── SpatialQuery facade ─────────────────────────────────────────────────────
  class SpatialQuery {
    constructor() {
      this._grid      = new SpatialGrid(32);
      this._water     = [];    // Array of WaterProxy references
      this._climbable = [];    // Array of climbable surface descriptors
      this._gameState = null;
    }

    init(gameState, proxyRegistry) {
      this._gameState       = gameState;
      this._proxyRegistry   = proxyRegistry;
    }

    /** Sync entity positions into the grid. Call once per frame for relevant agents. */
    syncEntity(id, x, y, z, radius, tags) {
      this._grid.upsert(id, x, y, z, radius, tags || []);
    }

    removeEntity(id) { this._grid.remove(id); }

    registerWaterProxy(proxy) { this._water.push(proxy); }
    registerClimbable(desc)   { this._climbable.push(desc); }

    // ─── Public Query API ───────────────────────────────────────────────────

    /** Ground query — delegates to GroundDetector if available */
    queryGround(x, y, z) {
      const gd = (typeof window !== 'undefined' && window.GroundDetector) ||
                 (typeof globalThis !== 'undefined' && globalThis.GroundDetector);
      if (gd && typeof gd.query === 'function') return gd.query(x, y, z);
      return null;
    }

    /** Returns the nearest water proxy containing (x,y,z) or null */
    queryWater(x, y, z) {
      for (const wp of this._water) {
        if (wp.active && wp.containsPoint(x, y, z)) return wp;
      }
      return null;
    }

    /**
     * Returns nearby entities tagged 'npc' within radius.
     * @param {number} x @param {number} z @param {number} radius @param {number} [max=10]
     * @returns {Array}
     */
    queryNearbyNPCs(x, z, radius, max = 10) {
      return this._grid.query(x, z, radius, 'npc').slice(0, max);
    }

    queryNearbyWildlife(x, z, radius, max = 8) {
      return this._grid.query(x, z, radius, 'wildlife').slice(0, max);
    }

    queryNearbyVehicles(x, z, radius, max = 6) {
      return this._grid.query(x, z, radius, 'vehicle').slice(0, max);
    }

    /**
     * Returns interactable objects within radius, sorted by distance.
     * Uses the proxy registry INTERACTABLE layer.
     * @param {number} x @param {number} y @param {number} z @param {number} radius
     * @returns {Array}
     */
    queryInteractables(x, y, z, radius) {
      return this._grid.query(x, z, radius, 'interactable');
    }

    /**
     * Query climbable surfaces near position.
     */
    queryClimbable(x, y, z, radius) {
      const results = [];
      for (const c of this._climbable) {
        if (!c.active) continue;
        const dx = c.x - x;
        const dy = c.y - y;
        const dz = c.z - z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= radius) results.push({ ...c, dist });
      }
      return results.sort((a, b) => a.dist - b.dist);
    }

    /**
     * Query obstacle presence at a position.
     * Returns true if a WORLD-layer proxy occupies the point.
     */
    queryObstacle(x, y, z) {
      if (!this._proxyRegistry) return false;
      const margin = 0.3;
      const qMin = { x: x - margin, y: y, z: z - margin };
      const qMax = { x: x + margin, y: y + 1.8, z: z + margin };
      const hits = this._proxyRegistry.queryAABBOverlap(qMin, qMax, 0x0008 /*WORLD*/);
      return hits.some(h => h.containsPoint(x, y + 0.9, z));
    }

    /**
     * Simplified path cost query between two points.
     * Returns { reachable, estimatedCost }.
     */
    queryPath(fromX, fromZ, toX, toZ) {
      const dx = toX - fromX;
      const dz = toZ - fromZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      // Check for water obstacle
      const midX = (fromX + toX) * 0.5;
      const midZ = (fromZ + toZ) * 0.5;
      const water = this.queryWater(midX, 0, midZ);
      if (water && !water.isShallow()) {
        return { reachable: false, estimatedCost: Infinity, reason: 'water' };
      }
      return { reachable: true, estimatedCost: dist };
    }
  }

  return { SpatialGrid, SpatialQuery };
});
