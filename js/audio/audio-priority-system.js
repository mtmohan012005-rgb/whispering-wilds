// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO PRIORITY & VOICE STEALING SYSTEM
// 4-Tier priority scheduling ensuring critical dialogue and story scenes
// are never starved or dropped by background environmental sound effects.
// ============================================================================

(function () {
  'use strict';

  const AUDIO_PRIORITIES = {
    CRITICAL_STORY: 100,
    ACTIVE_INTERACTION: 75,
    ENVIRONMENT_PRIMARY: 50,
    BACKGROUND_FLUFF: 25
  };

  class AudioPrioritySystem {
    constructor() {
      this.maxConcurrentVoices = 28;
      this.activeVoices = new Map(); // voiceId -> { priority, source, timestamp, category }
      this.initialized = false;
    }

    init(maxVoices = 28) {
      this.maxConcurrentVoices = maxVoices;
      this.initialized = true;
      console.log(`[AudioPrioritySystem] Initialized priority manager (Max Voices: ${this.maxConcurrentVoices}).`);
      return this;
    }

    canAllocateVoice(def = {}) {
      const priority = typeof def.priority === 'number' ? def.priority : 50;
      if (priority >= AUDIO_PRIORITIES.CRITICAL_STORY) return true;
      return this.activeVoices.size < this.maxConcurrentVoices;
    }

    registerVoice(id, priority = 50) {
      this.activeVoices.set(id, {
        priority,
        timestamp: Date.now()
      });
    }

    getActiveVoiceCount() {
      return this.activeVoices.size;
    }

    reset() {
      this.activeVoices.clear();
    }

    requestVoiceSlot(voiceId, priorityLevel = AUDIO_PRIORITIES.ACTIVE_INTERACTION) {
      const priority = typeof priorityLevel === 'number' ? priorityLevel : (AUDIO_PRIORITIES[priorityLevel] || 50);

      // Under budget
      if (this.activeVoices.size < this.maxConcurrentVoices) {
        this.activeVoices.set(voiceId, {
          priority,
          timestamp: Date.now()
        });
        return { allocated: true, evictedVoiceId: null };
      }

      // Voice stealing
      let candidateKey = null;
      let lowestPriority = priority;
      let oldestTime = Date.now();

      for (const [key, voice] of this.activeVoices) {
        if (voice.priority < lowestPriority || (voice.priority === lowestPriority && voice.timestamp < oldestTime)) {
          if (voice.priority < AUDIO_PRIORITIES.CRITICAL_STORY) {
            lowestPriority = voice.priority;
            oldestTime = voice.timestamp;
            candidateKey = key;
          }
        }
      }

      if (candidateKey) {
        this.activeVoices.delete(candidateKey);
        this.activeVoices.set(voiceId, {
          priority,
          timestamp: Date.now()
        });
        return { allocated: true, evictedVoiceId: candidateKey };
      }

      return { allocated: false, evictedVoiceId: null };
    }

    requestVoice(voiceId, priorityLevel = AUDIO_PRIORITIES.ACTIVE_INTERACTION, sourceHandle = null, category = 'sfx') {
      const res = this.requestVoiceSlot(voiceId, priorityLevel);
      return { granted: res.allocated };
    }

    releaseVoice(voiceId) {
      this.activeVoices.delete(voiceId);
    }
  }

  const instance = new AudioPrioritySystem();
  AudioPrioritySystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(AudioPrioritySystem.prototype)) {
    if (prop !== 'constructor' && typeof AudioPrioritySystem.prototype[prop] === 'function') {
      AudioPrioritySystem[prop] = function (...args) {
        return AudioPrioritySystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(AudioPrioritySystem, {
    maxConcurrentVoices: {
      get() { return AudioPrioritySystem._instance.maxConcurrentVoices; },
      set(v) { AudioPrioritySystem._instance.maxConcurrentVoices = Number(v) || 28; }
    }
  });

  if (typeof window !== 'undefined') {
    window.AudioPrioritySystem = AudioPrioritySystem;
    window.audioPrioritySystem = instance;
    window.AUDIO_PRIORITIES = AUDIO_PRIORITIES;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioPrioritySystem, AUDIO_PRIORITIES, instance };
  }
})();
