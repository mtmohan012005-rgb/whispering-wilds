/**
 * The Whispering Wilds (Kaattu Vazhi) - World Origin (Floating Origin)
 * Separates authoritative logical coordinates from 32-bit floating point render coordinates.
 * Recenters local rendering space when travel distance exceeds threshold (e.g. 1500m)
 * to prevent vertex jitter and z-fighting in large open world environments.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldOrigin = factory();
    if (typeof window !== 'undefined') {
      window.WorldOrigin = root.WorldOrigin;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldOriginEngine {
    constructor(threshold = 1500.0) {
      this.threshold = threshold; // Max distance from render origin before recentering
      this.originShift = { x: 0, y: 0, z: 0 }; // World offset applied to rendering
      this._shiftListeners = new Set();
    }

    /**
     * Convert authoritative world coordinates to local rendering coordinates
     * @param {Object} worldPos - { x, y, z }
     * @returns {Object} { x, y, z }
     */
    worldToRender(worldPos) {
      if (!worldPos) return { x: 0, y: 0, z: 0 };
      return {
        x: worldPos.x - this.originShift.x,
        y: (worldPos.y || 0) - this.originShift.y,
        z: (worldPos.z !== undefined ? worldPos.z : (worldPos.y || 0)) - this.originShift.z
      };
    }

    /**
     * Convert local rendering coordinates back to authoritative world coordinates
     * @param {Object} renderPos - { x, y, z }
     * @returns {Object} { x, y, z }
     */
    renderToWorld(renderPos) {
      if (!renderPos) return { x: 0, y: 0, z: 0 };
      return {
        x: renderPos.x + this.originShift.x,
        y: (renderPos.y || 0) + this.originShift.y,
        z: renderPos.z + this.originShift.z
      };
    }

    /**
     * Evaluates player position and triggers origin recentering if threshold exceeded
     * @param {Object} playerWorldPos - { x, y, z }
     * @returns {boolean} true if origin was recentered
     */
    checkRecentering(playerWorldPos) {
      if (!playerWorldPos) return false;

      const renderPos = this.worldToRender(playerWorldPos);
      const distFromRenderOrigin = Math.hypot(renderPos.x, renderPos.z);

      if (distFromRenderOrigin >= this.threshold) {
        // Shift origin directly to player's current world position
        const deltaX = playerWorldPos.x - this.originShift.x;
        const deltaZ = playerWorldPos.z - this.originShift.z;

        this.originShift.x = Math.round(playerWorldPos.x);
        this.originShift.z = Math.round(playerWorldPos.z);

        console.log(`[WorldOrigin] 🌐 Floating origin recentered. New offset: [${this.originShift.x}, ${this.originShift.z}]`);

        // Notify rendering layers (Three.js Scene, Camera, Particles)
        for (const cb of this._shiftListeners) {
          try {
            cb(this.originShift, { deltaX, deltaZ });
          } catch (e) {
            console.error('[WorldOrigin] Error in recentering listener:', e);
          }
        }
        return true;
      }
      return false;
    }

    onOriginShift(callback) {
      this._shiftListeners.add(callback);
      return () => this._shiftListeners.delete(callback);
    }

    reset() {
      this.originShift = { x: 0, y: 0, z: 0 };
    }
  }

  return new WorldOriginEngine();
});
