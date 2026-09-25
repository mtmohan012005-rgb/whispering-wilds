/**
 * The Whispering Wilds (Kaattu Vazhi) - World Prefetch Manager
 * Predicts player trajectory, velocity, vehicle speeds, fast-travel targets,
 * and quest objectives to pre-warm sectors ahead of arrival without hitching.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldPrefetch = factory();
    if (typeof window !== 'undefined') {
      window.WorldPrefetch = root.WorldPrefetch;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldPrefetchEngine {
    constructor() {
      this.baseLookaheadSec = 4.0; // 4 seconds trajectory prediction
      this.vehicleMultiplier = 2.5; // Look ahead 10 seconds if in vehicle
      this.minPrefetchSpeed = 1.0;
    }

    /**
     * Compute predicted destination coordinates based on player movement
     * @param {Object} pos - Current position { x, y, z }
     * @param {Object} velocity - Current velocity { x, y, z }
     * @param {boolean} inVehicle - Whether player is driving
     * @returns {Object} Predicted future position { x, y, z }
     */
    predictTrajectory(pos, velocity, inVehicle = false) {
      if (!pos) return { x: 0, y: 0, z: 0 };
      if (!velocity) return { ...pos };

      const speed = Math.hypot(velocity.x, velocity.z || velocity.y || 0);
      if (speed < this.minPrefetchSpeed) {
        return { ...pos };
      }

      const lookahead = inVehicle
        ? this.baseLookaheadSec * this.vehicleMultiplier
        : this.baseLookaheadSec;

      return {
        x: pos.x + velocity.x * lookahead,
        y: pos.y || 0,
        z: (pos.z !== undefined ? pos.z : (pos.y || 0)) + (velocity.z || velocity.y || 0) * lookahead
      };
    }

    /**
     * Identifies sectors that need pre-warming given player state and active quests
     * @param {WorldGrid} worldGrid - Grid containing all sectors
     * @param {Object} playerState - { pos, velocity, inVehicle }
     * @param {Array<string>} activeQuestSectors - Sector IDs with active objectives
     * @returns {Array<WorldSector>} Prioritized list of sectors to prefetch
     */
    getPrefetchCandidates(worldGrid, playerState, activeQuestSectors = []) {
      if (!worldGrid || !playerState || !playerState.pos) return [];

      const candidates = new Set();

      // 1. Sector containing predicted future position
      const futurePos = this.predictTrajectory(playerState.pos, playerState.velocity, playerState.inVehicle);
      const futureSector = worldGrid.getSectorAt(futurePos.x, futurePos.z);
      if (futureSector && futureSector.currentZone >= 2) {
        candidates.add(futureSector);
      }

      // 2. Active Quest target sectors
      if (Array.isArray(activeQuestSectors)) {
        for (let i = 0; i < activeQuestSectors.length; i++) {
          const sec = worldGrid.getSector(activeQuestSectors[i]);
          if (sec && sec.currentZone >= 2) {
            sec.markQuestActive(true);
            candidates.add(sec);
          }
        }
      }

      return Array.from(candidates);
    }
  }

  return new WorldPrefetchEngine();
});
