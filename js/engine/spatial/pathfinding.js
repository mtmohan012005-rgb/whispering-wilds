/**
 * The Whispering Wilds - Pathfinding System
 * Efficient A* pathfinding over NavMesh tiles.
 * Supports local and regional paths, NPC schedules, vehicle routes, wildlife patrols.
 * Uses path caching. Never runs full-world pathfinding every frame.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Pathfinding = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost') ||
                 (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');

  /**
   * Simple 2D A* on a grid of navigability cells.
   * Grid is derived from NavMeshManager at query time.
   */
  class AStarPathfinder {
    /**
     * @param {Object} navMesh - NavMeshManager
     * @param {number} [step=2] - Grid step size in world units
     */
    constructor(navMesh, step = 2) {
      this._navMesh = navMesh;
      this._step    = step;
    }

    /**
     * Find path from (fx, fz) to (tx, tz).
     * Returns array of {x, z} waypoints or null if no path.
     * @param {number} fx @param {number} fz
     * @param {number} tx @param {number} tz
     * @param {number} [maxNodes=200]  - Safety cap
     * @returns {Array<{x,z}>|null}
     */
    findPath(fx, fz, tx, tz, maxNodes = 200) {
      // Check cache first
      const cached = this._navMesh.cacheGet(fx, fz, tx, tz);
      if (cached) return cached;

      const step = this._step;
      const start = this._snap(fx, fz);
      const goal  = this._snap(tx, tz);

      // If start or goal not navigable, try nearest
      if (!this._navMesh.isNavigable(start.x, start.z)) {
        const nearest = this._navMesh.nearestNavigable(start.x, start.z, 8);
        if (!nearest) return null;
        start.x = nearest.x; start.z = nearest.z;
      }
      if (!this._navMesh.isNavigable(goal.x, goal.z)) {
        const nearest = this._navMesh.nearestNavigable(goal.x, goal.z, 8);
        if (!nearest) return null;
        goal.x = nearest.x; goal.z = nearest.z;
      }

      // A* open set: MinHeap approximation using sorted array
      const openSet = [];
      const cameFrom = new Map();
      const gScore   = new Map();
      const fScore   = new Map();

      const key = (x, z) => `${Math.round(x)},${Math.round(z)}`;
      const h   = (x, z) => Math.sqrt((x - goal.x) ** 2 + (z - goal.z) ** 2);

      const sk = key(start.x, start.z);
      gScore.set(sk, 0);
      fScore.set(sk, h(start.x, start.z));
      openSet.push({ x: start.x, z: start.z, f: fScore.get(sk) });

      let iterations = 0;

      while (openSet.length > 0 && iterations < maxNodes) {
        iterations++;
        // Pop lowest f
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        const ck = key(current.x, current.z);

        if (Math.abs(current.x - goal.x) <= step && Math.abs(current.z - goal.z) <= step) {
          // Reconstruct path
          const path = [];
          let cur = ck;
          while (cur) {
            const [cx, cz] = cur.split(',').map(Number);
            path.unshift({ x: cx, z: cz });
            cur = cameFrom.get(cur) || null;
          }
          // Smooth and simplify
          const smoothed = this._smoothPath(path);
          this._navMesh.cacheSet(fx, fz, tx, tz, smoothed);
          return smoothed;
        }

        // Explore 8-connected neighbours
        for (const [dx, dz] of [
          [step, 0], [-step, 0], [0, step], [0, -step],
          [step, step], [step, -step], [-step, step], [-step, -step]
        ]) {
          const nx = current.x + dx;
          const nz = current.z + dz;
          if (!this._navMesh.isNavigable(nx, nz)) continue;

          const moveCost = (dx !== 0 && dz !== 0) ? step * 1.414 : step;
          const ng = (gScore.get(ck) || 0) + moveCost;
          const nk = key(nx, nz);

          if (ng < (gScore.get(nk) ?? Infinity)) {
            cameFrom.set(nk, ck);
            gScore.set(nk, ng);
            const nf = ng + h(nx, nz);
            fScore.set(nk, nf);
            if (!openSet.find(o => key(o.x, o.z) === nk)) {
              openSet.push({ x: nx, z: nz, f: nf });
            }
          }
        }
      }

      if (IS_DEV && iterations >= maxNodes) {
        console.warn(`[Pathfinding] Max nodes (${maxNodes}) reached for path (${fx},${fz})→(${tx},${tz})`);
      }
      return null;
    }

    _snap(x, z) {
      const s = this._step;
      return { x: Math.round(x / s) * s, z: Math.round(z / s) * s };
    }

    /** Remove collinear waypoints to reduce path complexity. */
    _smoothPath(path) {
      if (path.length <= 2) return path;
      const result = [path[0]];
      for (let i = 1; i < path.length - 1; i++) {
        const prev = result[result.length - 1];
        const cur  = path[i];
        const next = path[i + 1];
        // Cross product to detect collinearity
        const cross = (cur.x - prev.x) * (next.z - prev.z) - (cur.z - prev.z) * (next.x - prev.x);
        if (Math.abs(cross) > this._step * 0.5) {
          result.push(cur);
        }
      }
      result.push(path[path.length - 1]);
      return result;
    }
  }

  /**
   * PathfindingSystem manages path requests from agents.
   * Rate-limits computation: max N path queries per frame.
   */
  class PathfindingSystem {
    constructor() {
      this._finder    = null;
      this._navMesh   = null;
      this._queue     = [];   // Pending path requests
      this._maxPerFrame = 4;  // Max A* runs per frame
    }

    init(navMeshManager) {
      this._navMesh = navMeshManager;
      this._finder  = new AStarPathfinder(navMeshManager, 2);
    }

    /**
     * Request a path. Callback receives (path|null).
     * @param {number} fx @param {number} fz @param {number} tx @param {number} tz
     * @param {Function} callback
     * @param {number} [priority=5]
     */
    requestPath(fx, fz, tx, tz, callback, priority = 5) {
      // Check cache immediately
      const cached = this._navMesh?.cacheGet(fx, fz, tx, tz);
      if (cached) { callback(cached); return; }

      this._queue.push({ fx, fz, tx, tz, callback, priority });
      this._queue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Process queued path requests. Call from GameRuntime update.
     */
    update() {
      const count = Math.min(this._maxPerFrame, this._queue.length);
      for (let i = 0; i < count; i++) {
        const req = this._queue.shift();
        if (!req) break;
        try {
          const path = this._finder ? this._finder.findPath(req.fx, req.fz, req.tx, req.tz) : null;
          req.callback(path);
        } catch (err) {
          if (IS_DEV) console.error('[Pathfinding] Error:', err);
          req.callback(null);
        }
      }
    }

    /**
     * Synchronous path query (for small local paths only).
     */
    findPathSync(fx, fz, tx, tz, maxNodes = 100) {
      if (!this._finder) return null;
      return this._finder.findPath(fx, fz, tx, tz, maxNodes);
    }

    get queueLength() { return this._queue.length; }
  }

  return { AStarPathfinder, PathfindingSystem };
});
