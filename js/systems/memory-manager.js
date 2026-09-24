// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MEMORY MANAGER
// Resource tracking, memory pressure management & safe shared asset disposal
// ============================================================================

(function() {
  'use strict';

  class MemoryManager {
    constructor() {
      this.resourceCounters = {
        geometries: 0,
        textures: 0,
        materials: 0,
        sceneObjects: 0,
        particles: 0,
        audioNodes: 0
      };

      this.sharedResourceRefs = new Map(); // resourceId -> refCount
      this.memoryPressureLevel = 'NORMAL'; // 'NORMAL' | 'ELEVATED' | 'CRITICAL'
      this.lastCleanupTimestamp = performance.now();
      this.cleanupIntervalMs = 15000; // 15 seconds periodic check
    }

    registerSharedResource(id) {
      const count = this.sharedResourceRefs.get(id) || 0;
      this.sharedResourceRefs.set(id, count + 1);
    }

    releaseSharedResource(id, disposeCallback) {
      const count = this.sharedResourceRefs.get(id) || 0;
      if (count <= 1) {
        this.sharedResourceRefs.delete(id);
        if (typeof disposeCallback === 'function') {
          disposeCallback();
        }
      } else {
        this.sharedResourceRefs.set(id, count - 1);
      }
    }

    canSafelyDispose(id) {
      return !this.sharedResourceRefs.has(id) || this.sharedResourceRefs.get(id) <= 0;
    }

    getMemorySnapshot() {
      let jsHeapUsedMB = 0;
      let jsHeapTotalMB = 0;
      let jsHeapLimitMB = 0;

      if (typeof performance !== 'undefined' && performance.memory) {
        jsHeapUsedMB = parseFloat((performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1));
        jsHeapTotalMB = parseFloat((performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1));
        jsHeapLimitMB = parseFloat((performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1));
      }

      // Check Three.js renderer info if available
      if (window.threeWorld?.renderer?.info?.memory) {
        const info = window.threeWorld.renderer.info.memory;
        this.resourceCounters.geometries = info.geometries || 0;
        this.resourceCounters.textures = info.textures || 0;
      }

      // Evaluate pressure level
      if (jsHeapLimitMB > 0) {
        const usageRatio = jsHeapUsedMB / jsHeapLimitMB;
        if (usageRatio > 0.85) {
          this.memoryPressureLevel = 'CRITICAL';
        } else if (usageRatio > 0.70) {
          this.memoryPressureLevel = 'ELEVATED';
        } else {
          this.memoryPressureLevel = 'NORMAL';
        }
      }

      return {
        pressureLevel: this.memoryPressureLevel,
        jsHeapUsedMB,
        jsHeapTotalMB,
        jsHeapLimitMB,
        counters: { ...this.resourceCounters }
      };
    }

    /**
     * Responds to memory pressure by trimming pools and deferring non-critical streaming.
     * Protects active player and current region assets.
     */
    handleMemoryPressure(force = false) {
      const now = performance.now();
      if (!force && (now - this.lastCleanupTimestamp < this.cleanupIntervalMs)) {
        return;
      }
      this.lastCleanupTimestamp = now;

      console.log(`[MemoryManager] Executing memory pressure management (Level: ${this.memoryPressureLevel})...`);

      // 1. Trim particle pools
      if (window.waterReactionEngine?.trimPool) {
        window.waterReactionEngine.trimPool();
      }

      // 2. Clear old decals
      if (window.gamePlayer?.footprintDecals && window.gamePlayer.footprintDecals.length > 32) {
        const excess = window.gamePlayer.footprintDecals.splice(0, window.gamePlayer.footprintDecals.length - 32);
        excess.forEach(d => {
          if (d && d.mesh && window.threeWorld?.scene) {
            window.threeWorld.scene.remove(d.mesh);
            if (d.mesh.geometry) d.mesh.geometry.dispose();
            if (d.mesh.material) d.mesh.material.dispose();
          }
        });
      }

      // 3. Unload far region assets if streaming system is present
      if (window.worldStreamingSystem?.pruneDistantChunks) {
        window.worldStreamingSystem.pruneDistantChunks();
      }
    }
  }

  const instance = new MemoryManager();

  if (typeof window !== 'undefined') {
    window.MemoryManager = MemoryManager;
    window.memoryManager = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MemoryManager, memoryManager: instance };
  }
})();
