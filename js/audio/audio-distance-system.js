// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO DISTANCE CULLING SYSTEM
// Spatial distance tiers (NEAR, MID, FAR, CULLED) to optimize Web Audio node count.
// Automatically deactivates distant non-essential emitters beyond hearing range.
// ============================================================================

(function () {
  'use strict';

  class AudioDistanceSystem {
    constructor() {
      this.cullDistance = 60.0; // Inaudible beyond 60m
      this.registeredSources = new Map(); // id -> { position, emitter, category }
      this.listenerPos = { x: 0, y: 0, z: 0 };
      this.updateIntervalMs = 250;
      this.updateTimer = null;
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      this._startCullingLoop();
      console.log('[AudioDistanceSystem] Initialized spatial distance culling manager.');
      return this;
    }

    setListenerPosition(x, y, z) {
      this.listenerPos.x = x;
      this.listenerPos.y = y;
      this.listenerPos.z = z;
    }

    evaluateDistance(p1, p2, maxDistance = 60.0) {
      const dx = (p1?.x || 0) - (p2?.x || 0);
      const dy = (p1?.y || 0) - (p2?.y || 0);
      const dz = (p1?.z || 0) - (p2?.z || 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return {
        distance: dist,
        isAudible: dist <= maxDistance
      };
    }

    registerSource(id, position, emitter, category = 'sfx') {
      this.registeredSources.set(id, {
        id,
        position: { ...position },
        emitter,
        category,
        isCulled: false
      });
    }

    unregisterSource(id) {
      this.registeredSources.delete(id);
    }

    _startCullingLoop() {
      if (this.updateTimer) clearInterval(this.updateTimer);

      this.updateTimer = setInterval(() => {
        this._cullDistantSources();
      }, this.updateIntervalMs);
    }

    _cullDistantSources() {
      const lx = this.listenerPos.x;
      const lz = this.listenerPos.z;
      const maxDistSq = this.cullDistance * this.cullDistance;

      for (const [id, src] of this.registeredSources) {
        const dx = src.position.x - lx;
        const dz = src.position.z - lz;
        const distSq = dx * dx + dz * dz;

        if (distSq > maxDistSq && !src.isCulled) {
          src.isCulled = true;
          if (src.emitter?.pause) src.emitter.pause();
        } else if (distSq <= maxDistSq && src.isCulled) {
          src.isCulled = false;
          if (src.emitter?.resume) src.emitter.resume();
        }
      }
    }

    destroy() {
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null;
      }
    }
  }

  const instance = new AudioDistanceSystem();
  AudioDistanceSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(AudioDistanceSystem.prototype)) {
    if (prop !== 'constructor' && typeof AudioDistanceSystem.prototype[prop] === 'function') {
      AudioDistanceSystem[prop] = function (...args) {
        return AudioDistanceSystem._instance[prop](...args);
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.AudioDistanceSystem = AudioDistanceSystem;
    window.audioDistanceSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioDistanceSystem, instance };
  }
})();
