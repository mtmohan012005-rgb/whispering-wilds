// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AMBIENT AUDIO SYSTEM
// Authentic regional environmental soundscapes across 7 Tamil Nadu biomes
// with smooth day/night crossfades, stochastic layer merging, and interior dampening.
// ============================================================================

(function () {
  'use strict';

  class AmbientAudioSystem {
    constructor() {
      this.currentRegion = 'george_town';
      this.currentTimeOfDay = 'morning';
      this.isInterior = false;
      this.activeBedId = null;
      this.activeBedGain = null;
      this.stochasticTimer = null;
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      this._startStochasticAccents();
      console.log('[AmbientAudioSystem] Initialized authentic regional ambient audio engine.');
      return this;
    }

    setRegion(region) {
      const reg = (region || '').toLowerCase();
      if (this.currentRegion === reg && this.activeBedId) return;
      this.currentRegion = reg;
      this._updateAmbientBed(2.5);
    }

    setTimeOfDay(timeOfDay) {
      const t = (timeOfDay || '').toLowerCase();
      if (this.currentTimeOfDay === t) return;
      this.currentTimeOfDay = t;
      this._updateAmbientBed(3.0); // Smooth 3-second crossfade (Rule 33)
    }

    setInterior(isInterior) {
      if (this.isInterior === isInterior) return;
      this.isInterior = isInterior;
      if (this.activeBedGain && window.audioManager?.ctx) {
        // Dampen exterior ambience when entering buildings
        const targetVol = this.isInterior ? 0.35 : 0.8;
        this.activeBedGain.gain.setTargetAtTime(targetVol, window.audioManager.ctx.currentTime, 0.4);
      }
    }

    _updateAmbientBed(fadeDuration = 2.5) {
      const dataModule = window.AmbientData;
      if (!dataModule) return;

      const bedDef = dataModule.getBedForRegionAndTime(this.currentRegion, this.currentTimeOfDay);
      if (!bedDef || bedDef.id === this.activeBedId) return;

      console.log(`[AmbientAudioSystem] Crossfading ambient bed to: ${bedDef.id} (${this.currentRegion}, ${this.currentTimeOfDay})`);

      // 1. Fade out old bed
      if (this.activeBedGain && window.audioManager?.ctx) {
        const ctx = window.audioManager.ctx;
        const now = ctx.currentTime;
        this.activeBedGain.gain.cancelScheduledValues(now);
        this.activeBedGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
      }

      // 2. Play new bed through AMBIENCE bus
      const targetBus = window.AudioBusMatrix?.getGainNode('AMBIENCE') || window.audioManager?.ambienceGain;
      const ctx = targetBus?.context || window.audioManager?.ctx;

      if (ctx && targetBus) {
        try {
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          const targetVol = this.isInterior ? (bedDef.volume || 0.8) * 0.4 : (bedDef.volume || 0.8);
          gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + fadeDuration);
          gain.connect(targetBus);
          this.activeBedGain = gain;
        } catch (err) {
          console.warn('[AmbientAudioSystem] Could not connect bed gain:', err);
        }
      }

      this.activeBedId = bedDef.id;

      if (window.audioManager) {
        window.audioManager.play(bedDef.id, {
          category: 'ambience',
          busName: 'AMBIENCE',
          loop: true,
          volume: bedDef.volume || 0.8
        });
      }
    }

    _startStochasticAccents() {
      // Periodically trigger subtle regional atmospheric accents (e.g. distant temple bell, crow caw, horn)
      if (this.stochasticTimer) clearInterval(this.stochasticTimer);

      this.stochasticTimer = setInterval(() => {
        if (this.isInterior) return; // Quieter indoors

        const dataModule = window.AmbientData;
        const accent = dataModule?.getRandomAccent(this.currentRegion, this.currentTimeOfDay);
        if (accent && window.audioManager) {
          window.audioManager.play(accent.id, {
            category: 'ambience',
            busName: 'AMBIENCE',
            volume: accent.volume || 0.4
          });
        }
      }, 14000); // Trigger every 14-20 seconds
    }

    destroy() {
      if (this.stochasticTimer) {
        clearInterval(this.stochasticTimer);
        this.stochasticTimer = null;
      }
    }
  }

  const instance = new AmbientAudioSystem();
  AmbientAudioSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(AmbientAudioSystem.prototype)) {
    if (prop !== 'constructor' && typeof AmbientAudioSystem.prototype[prop] === 'function') {
      AmbientAudioSystem[prop] = function (...args) {
        return AmbientAudioSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(AmbientAudioSystem, {
    currentRegion: {
      get() { return AmbientAudioSystem._instance.currentRegion; },
      set(v) { AmbientAudioSystem._instance.currentRegion = v; }
    },
    currentTimeOfDay: {
      get() { return AmbientAudioSystem._instance.currentTimeOfDay; },
      set(v) { AmbientAudioSystem._instance.currentTimeOfDay = v; }
    },
    isInterior: {
      get() { return AmbientAudioSystem._instance.isInterior; },
      set(v) { AmbientAudioSystem._instance.isInterior = v; }
    },
    activeBedId: {
      get() { return AmbientAudioSystem._instance.activeBedId; },
      set(v) { AmbientAudioSystem._instance.activeBedId = v; }
    }
  });

  if (typeof window !== 'undefined') {
    window.AmbientAudioSystem = AmbientAudioSystem;
    window.ambientAudioSystem = instance;
    if (!window.AmbientWorldAudioSystem) {
      window.AmbientWorldAudioSystem = AmbientAudioSystem;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AmbientAudioSystem, instance };
  }
})();
