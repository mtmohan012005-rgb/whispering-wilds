/**
 * js/systems/animation-performance-system.js
 * The Whispering Wilds (Kaattu Vazhi) - Animation Performance & Adaptive LOD System
 *
 * Dynamically computes distance-based animation LODs (LOD0 to LOD3), manages
 * update frequencies, integrates with PerformanceManager, and prevents CPU overload.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationPerformanceSystem = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationPerformanceSystem {
    constructor() {
      this.controllers = new Set();
      this.qualityTier = 'HIGH'; // 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'

      // Distance LOD boundaries (meters)
      this.lodDistances = {
        lod0: 25.0,  // Full animation + IK + cloth + facial
        lod1: 65.0,  // Normal animation + medium IK
        lod2: 130.0, // Reduced rate + no IK
        lod3: 200.0  // Minimal distant animation
      };

      // Frame throttling counters
      this.frameCounter = 0;

      // Telemetry
      this.metrics = {
        totalControllers: 0,
        lod0Count: 0,
        lod1Count: 0,
        lod2Count: 0,
        lod3Count: 0,
        lastUpdateMs: 0
      };
    }

    registerController(controller) {
      if (controller) {
        this.controllers.add(controller);
      }
    }

    unregisterController(controller) {
      if (controller) {
        this.controllers.delete(controller);
      }
    }

    setQualityTier(tier) {
      this.qualityTier = tier;
      for (const ctrl of this.controllers) {
        ctrl.setQualityLevel(tier);
      }
    }

    /**
     * Updates LOD tiers for all registered controllers based on player distance
     * @param {Object} playerPosition - { x, y, z }
     */
    updateLODs(playerPosition) {
      if (!playerPosition) return;

      let l0 = 0, l1 = 0, l2 = 0, l3 = 0;

      for (const ctrl of this.controllers) {
        // Player itself is always LOD0
        if (ctrl.entityType === 'PLAYER') {
          ctrl.setLOD(0);
          l0++;
          continue;
        }

        const obj = ctrl.rootObject;
        if (!obj || !obj.position) {
          ctrl.setLOD(2);
          l2++;
          continue;
        }

        const dx = obj.position.x - playerPosition.x;
        const dy = obj.position.y - playerPosition.y;
        const dz = obj.position.z - playerPosition.z;
        const dist = Math.hypot(dx, dy, dz);

        let tier = 0;
        if (dist > this.lodDistances.lod2) {
          tier = 3;
          l3++;
        } else if (dist > this.lodDistances.lod1) {
          tier = 2;
          l2++;
        } else if (dist > this.lodDistances.lod0) {
          tier = 1;
          l1++;
        } else {
          tier = 0;
          l0++;
        }

        ctrl.setLOD(tier);
      }

      this.metrics.totalControllers = this.controllers.size;
      this.metrics.lod0Count = l0;
      this.metrics.lod1Count = l1;
      this.metrics.lod2Count = l2;
      this.metrics.lod3Count = l3;
    }

    /**
     * Batch updates registered controllers respecting LOD frame skip rates
     * @param {number} deltaTime
     * @param {Object} playerPos
     */
    update(deltaTime, playerPos = null) {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.frameCounter++;

      if (playerPos) {
        this.updateLODs(playerPos);
      }

      for (const ctrl of this.controllers) {
        // LOD2 updates every 2nd frame; LOD3 updates every 4th frame
        if (ctrl.lodTier === 2 && (this.frameCounter % 2 !== 0)) continue;
        if (ctrl.lodTier === 3 && (this.frameCounter % 4 !== 0)) continue;

        // Perform frame step
        ctrl.update(deltaTime);
      }

      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.metrics.lastUpdateMs = endTime - startTime;
    }

    clear() {
      this.controllers.clear();
      this.frameCounter = 0;
    }
  }

  // Global singleton
  if (typeof window !== 'undefined') {
    window.ProductionAnimationPerformanceSystem = new AnimationPerformanceSystem();
  }

  return AnimationPerformanceSystem;
});
