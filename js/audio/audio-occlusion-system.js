// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO OCCLUSION SYSTEM
// Low-overhead cached obstruction testing between player and 3D audio emitters.
// Applies progressive low-pass filter dampening when behind walls or doors.
// ============================================================================

(function () {
  'use strict';

  class AudioOcclusionSystem {
    constructor() {
      this.registeredEmitters = new Map(); // id -> emitter
      this.cachedOcclusion = new Map(); // id -> { occluded: boolean, lastCheck: number }
      this.checkIntervalMs = 150; // Throttled 6.6Hz check
      this.listenerPosition = { x: 0, y: 0, z: 0 };
      this.updateTimer = null;
      this.initialized = false;
    }

    get updateIntervalMs() {
      return this.checkIntervalMs;
    }

    init() {
      this.initialized = true;
      this._startUpdateLoop();
      console.log('[AudioOcclusionSystem] Initialized low-overhead audio occlusion engine.');
      return this;
    }

    calculateOcclusion(options = {}) {
      const obstructions = options.obstructions || [];
      const hasObstruction = obstructions.length > 0;

      if (hasObstruction) {
        return {
          isOccluded: true,
          cutoffFrequency: 900, // Low-pass filter cutoff (Hz)
          gainMultiplier: 0.55
        };
      }

      return {
        isOccluded: false,
        cutoffFrequency: 20000,
        gainMultiplier: 1.0
      };
    }

    registerEmitter(emitter) {
      if (emitter && emitter.id) {
        this.registeredEmitters.set(emitter.id, emitter);
      }
    }

    unregisterEmitter(id) {
      this.registeredEmitters.delete(id);
      this.cachedOcclusion.delete(id);
    }

    updateListenerPosition(x, y, z) {
      this.listenerPosition.x = x;
      this.listenerPosition.y = y;
      this.listenerPosition.z = z;
    }

    _startUpdateLoop() {
      if (this.updateTimer) clearInterval(this.updateTimer);

      this.updateTimer = setInterval(() => {
        this._evaluateOcclusion();
      }, this.checkIntervalMs);
    }

    _evaluateOcclusion() {
      const now = Date.now();
      const lx = this.listenerPosition.x;
      const lz = this.listenerPosition.z;

      for (const [id, emitter] of this.registeredEmitters) {
        if (!emitter.isPlaying) continue;

        const ep = emitter.position;
        const dx = ep.x - lx;
        const dz = ep.z - lz;
        const distSq = dx * dx + dz * dz;

        // Skip distant emitters (> 50m) from occlusion ray testing
        if (distSq > 2500) continue;

        const isBlocked = this._testObstruction(this.listenerPosition, ep);

        const prev = this.cachedOcclusion.get(id);
        if (!prev || prev.occluded !== isBlocked) {
          this.cachedOcclusion.set(id, { occluded: isBlocked, lastCheck: now });
          emitter.setOcclusion(isBlocked, 900);
        }
      }
    }

    _testObstruction(fromPos, toPos) {
      if (window.InteriorAudioSystem?.isInterior) {
        return true;
      }
      if (window.CollisionResolver?.isLineBlocked) {
        return window.CollisionResolver.isLineBlocked(fromPos, toPos);
      }
      return false;
    }

    destroy() {
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null;
      }
    }
  }

  const instance = new AudioOcclusionSystem();
  AudioOcclusionSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(AudioOcclusionSystem.prototype)) {
    if (prop !== 'constructor' && typeof AudioOcclusionSystem.prototype[prop] === 'function') {
      AudioOcclusionSystem[prop] = function (...args) {
        return AudioOcclusionSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(AudioOcclusionSystem, {
    updateIntervalMs: {
      get() { return AudioOcclusionSystem._instance.updateIntervalMs; }
    }
  });

  if (typeof window !== 'undefined') {
    window.AudioOcclusionSystem = AudioOcclusionSystem;
    window.audioOcclusionSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioOcclusionSystem, instance };
  }
})();
