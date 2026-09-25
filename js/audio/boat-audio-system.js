// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - BOAT AUDIO SYSTEM
// Authentic watercraft acoustics for Pichavaram mangrove waterways:
// wooden paddle strokes, hull wakes, timber creaks, and mangrove root brushes.
// ============================================================================

(function () {
  'use strict';

  class BoatAudioSystem {
    constructor() {
      this.isPaddling = false;
      this.lastPaddleTime = 0;
      this.lastOarStrokeTime = 0;
      this.lastRootContactTime = 0;
      this.wakeIntensity = 0.0;
      this.minPaddleIntervalMs = 600;
      this.wakeLoopActive = false;
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      console.log('[BoatAudioSystem] Initialized boat acoustic dynamics engine.');
      return this;
    }

    onOarStroke(options = {}) {
      const now = Date.now();
      this.lastOarStrokeTime = now;
      this.lastPaddleTime = now;

      const isStrong = (options.velocity || 0.5) > 0.7;
      const soundId = isStrong ? 'sfx_boat_paddle_deep' : 'sfx_boat_paddle_gentle';

      if (window.audioManager) {
        window.audioManager.play(soundId, {
          category: 'sfx',
          busName: 'SFX',
          volume: isStrong ? 0.75 : 0.55
        });
      }

      if (Math.random() < 0.4) {
        this.playWoodCreak();
      }

      return true;
    }

    playPaddleStroke(isStrong = false) {
      return this.onOarStroke({ velocity: isStrong ? 0.9 : 0.4 });
    }

    updateWake(speed = 0.5) {
      this.wakeIntensity = Math.max(0.0, Math.min(1.0, Number(speed) || 0.0));
      this.setBoatMoving(this.wakeIntensity > 0.1, this.wakeIntensity);
    }

    setBoatMoving(isMoving, speed = 1.0) {
      if (isMoving && !this.wakeLoopActive) {
        this.wakeLoopActive = true;
        if (window.audioManager) {
          window.audioManager.play('sfx_boat_wake_loop', {
            category: 'sfx',
            busName: 'SFX',
            loop: true,
            volume: Math.min(0.6, 0.35 * speed)
          });
        }
      } else if (!isMoving && this.wakeLoopActive) {
        this.wakeLoopActive = false;
        if (window.audioManager) {
          window.audioManager.stop('sfx_boat_wake_loop', 0.8);
        }
      }
    }

    onMangroveRootContact() {
      this.lastRootContactTime = Date.now();
      this.playMangroveRootBrush();
      return true;
    }

    playWoodCreak() {
      if (window.audioManager) {
        window.audioManager.play('sfx_boat_wood_creak', {
          category: 'sfx',
          busName: 'SFX',
          volume: 0.35
        });
      }
    }

    playMangroveRootBrush() {
      if (window.audioManager) {
        window.audioManager.play('sfx_boat_mangrove_brush', {
          category: 'sfx',
          busName: 'SFX',
          volume: 0.45
        });
      }
    }
  }

  const instance = new BoatAudioSystem();
  BoatAudioSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(BoatAudioSystem.prototype)) {
    if (prop !== 'constructor' && typeof BoatAudioSystem.prototype[prop] === 'function') {
      BoatAudioSystem[prop] = function (...args) {
        return BoatAudioSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(BoatAudioSystem, {
    lastOarStrokeTime: {
      get() { return BoatAudioSystem._instance.lastOarStrokeTime; },
      set(v) { BoatAudioSystem._instance.lastOarStrokeTime = v; }
    },
    wakeIntensity: {
      get() { return BoatAudioSystem._instance.wakeIntensity; },
      set(v) { BoatAudioSystem._instance.wakeIntensity = v; }
    },
    lastRootContactTime: {
      get() { return BoatAudioSystem._instance.lastRootContactTime; },
      set(v) { BoatAudioSystem._instance.lastRootContactTime = v; }
    }
  });

  if (typeof window !== 'undefined') {
    window.BoatAudioSystem = BoatAudioSystem;
    window.boatAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BoatAudioSystem, instance };
  }
})();
