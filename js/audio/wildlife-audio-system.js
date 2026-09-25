// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WILDLIFE AUDIO SYSTEM
// Species-specific behavioral calls for 9 authentic Tamil Nadu species:
// Tahr, Langur, Elephant, Gaur, Peafowl, Egret, Kingfisher, Cattle, Goat.
// ============================================================================

(function () {
  'use strict';

  class WildlifeAudioSystem {
    constructor(audioManager) {
      if (WildlifeAudioSystem._instance) {
        if (audioManager) WildlifeAudioSystem._instance.init(audioManager);
        return WildlifeAudioSystem._instance;
      }

      this.audioManager = audioManager || window.audioManager;
      this.lastCallTimestamps = new Map(); // speciesKey -> timestamp
      this.lastCallTimes = this.lastCallTimestamps;
      this.minSpeciesCooldownMs = 12000; // 12-second minimum cooldown per species
      this.isNight = false;
      this.initialized = false;

      WildlifeAudioSystem._instance = this;
    }

    init(audioManager) {
      if (audioManager) this.audioManager = audioManager;
      this.lastCallTimestamps.clear();
      this.initialized = true;
      console.log('[WildlifeAudioSystem] Initialized authentic species behavioral vocalization engine.');
      return this;
    }

    setTimeOfDay(timeOfDay) {
      this.isNight = timeOfDay === 'night' || timeOfDay === 'sunset';
    }

    triggerVocalization(speciesId, behavior = 'idle', position = null) {
      const now = Date.now();
      const lastCall = this.lastCallTimestamps.get(speciesId) || 0;

      // 12-second cooldown enforcement (Rule 72)
      if (now - lastCall < this.minSpeciesCooldownMs) {
        return { success: false, reason: 'cooldown' };
      }

      const dataModule = window.WildlifeAudioData;
      const soundId = dataModule?.getCallSoundId ? dataModule.getCallSoundId(speciesId, behavior, this.isNight) : `audio.wildlife.${speciesId}.${behavior}`;

      this.lastCallTimestamps.set(speciesId, now);

      const am = this.audioManager || window.audioManager;
      if (position && am?.playSpatial) {
        am.playSpatial(soundId, position, {
          category: 'wildlife',
          busName: 'WILDLIFE',
          volume: behavior === 'warning' || behavior === 'alert' ? 0.85 : 0.6
        });
      } else if (am) {
        am.play(soundId, {
          category: 'wildlife',
          busName: 'WILDLIFE',
          volume: behavior === 'warning' || behavior === 'alert' ? 0.85 : 0.6
        });
      }

      return { success: true, soundId };
    }

    triggerCall(species, behavior = 'idle', position = { x: 0, y: 0, z: 0 }, entityId = null) {
      const id = entityId || `${species}_${behavior}`;
      const now = Date.now();
      const lastTime = this.lastCallTimes.get(id) || 0;
      if (now - lastTime < (this.minSpeciesCooldownMs || 8000)) {
        return; // Throttled to prevent cacophony
      }
      this.lastCallTimes.set(id, now);
      const am = this.audioManager || window.audioManager;
      const soundId = `audio.wildlife.${species}.${behavior}`;
      if (position && am?.playSpatial) {
        am.playSpatial(soundId, position, { category: 'wildlife', busName: 'WILDLIFE', volume: 0.7 });
      } else if (am) {
        am.play(soundId, { category: 'wildlife', busName: 'WILDLIFE', volume: 0.7 });
      }
    }

    playAnimalCall(speciesId, behavior = 'idle', position = null) {
      return this.triggerVocalization(speciesId, behavior, position).success;
    }
  }

  const instance = new WildlifeAudioSystem();
  WildlifeAudioSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(WildlifeAudioSystem.prototype)) {
    if (prop !== 'constructor' && typeof WildlifeAudioSystem.prototype[prop] === 'function') {
      WildlifeAudioSystem[prop] = function (...args) {
        return WildlifeAudioSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(WildlifeAudioSystem, {
    lastCallTimes: {
      get() { return WildlifeAudioSystem._instance.lastCallTimes; },
      set(v) { WildlifeAudioSystem._instance.lastCallTimes = v; }
    }
  });

  if (typeof window !== 'undefined') {
    window.WildlifeAudioSystem = WildlifeAudioSystem;
    window.wildlifeAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WildlifeAudioSystem, instance };
  }
})();
