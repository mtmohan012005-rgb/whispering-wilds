// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO MIXER & DUCKING ENGINE
// Coordinates gain staging, master compression limiter, dynamic ducking
// during NPC/cinematic dialogue, and headroom management.
// ============================================================================

(function () {
  'use strict';

  class AudioMixer {
    constructor() {
      this.context = null;
      this.busMatrix = null;
      this.limiterNode = null;
      this.isDuckedForDialogue = false;
      this.isDuckedForCinematic = false;
      this.duckingIntensity = 0.45;
      this.initialized = false;
    }

    get isDuckingDialogue() {
      return this.isDuckedForDialogue;
    }

    init(busMatrix, context) {
      // Allow calling init(busMatrix) or init(context, busMatrix)
      if (busMatrix && busMatrix.getBus) {
        this.busMatrix = busMatrix;
        this.context = context || busMatrix.context || window.audioManager?.ctx;
      } else {
        this.context = busMatrix || window.audioManager?.ctx;
        this.busMatrix = context || window.AudioBusMatrix;
      }

      if (!this.context) return this;

      try {
        this.limiterNode = this.context.createDynamicsCompressor();
        this.limiterNode.threshold.setValueAtTime(-3.0, this.context.currentTime);
        this.limiterNode.knee.setValueAtTime(6.0, this.context.currentTime);
        this.limiterNode.ratio.setValueAtTime(12.0, this.context.currentTime);
        this.limiterNode.attack.setValueAtTime(0.003, this.context.currentTime);
        this.limiterNode.release.setValueAtTime(0.25, this.context.currentTime);

        const masterBus = this.busMatrix?.getBus('MASTER');
        if (masterBus && masterBus.gainNode) {
          masterBus.gainNode.disconnect();
          masterBus.gainNode.connect(this.limiterNode);
          this.limiterNode.connect(this.context.destination);
        }
      } catch (err) {
        console.warn('[AudioMixer] Could not attach master limiter:', err);
      }

      this.initialized = true;
      console.log('[AudioMixer] Initialized with master dynamics limiter and ducking matrix.');
      return this;
    }

    onDialogueStart(priority = 'normal') {
      if (!this.busMatrix) return;
      this.isDuckedForDialogue = true;

      // Dialogue ducks MUSIC, WEATHER, AMBIENCE, VEHICLE modestly (Rule: Never mute world completely)
      const factor = priority === 'critical' ? 0.35 : 0.45;
      this.busMatrix.applyDucking('MUSIC', factor, 0.25);
      this.busMatrix.applyDucking('AMBIENCE', factor, 0.3);
      this.busMatrix.applyDucking('WEATHER', factor + 0.1, 0.3);
      this.busMatrix.applyDucking('VEHICLE', factor + 0.1, 0.2);
    }

    onDialogueEnd() {
      if (!this.busMatrix) return;
      this.isDuckedForDialogue = false;

      if (!this.isDuckedForCinematic) {
        this.busMatrix.applyDucking('MUSIC', 1.0, 0.4);
        this.busMatrix.applyDucking('AMBIENCE', 1.0, 0.4);
        this.busMatrix.applyDucking('WEATHER', 1.0, 0.4);
        this.busMatrix.applyDucking('VEHICLE', 1.0, 0.4);
      }
    }

    onCinematicStart() {
      if (!this.busMatrix) return;
      this.isDuckedForCinematic = true;

      this.busMatrix.applyDucking('AMBIENCE', 0.2, 0.4);
      this.busMatrix.applyDucking('WEATHER', 0.25, 0.4);
      this.busMatrix.applyDucking('VEHICLE', 0.2, 0.3);
      this.busMatrix.applyDucking('WILDLIFE', 0.15, 0.3);
    }

    onCinematicEnd() {
      if (!this.busMatrix) return;
      this.isDuckedForCinematic = false;

      this.busMatrix.applyDucking('AMBIENCE', 1.0, 0.5);
      this.busMatrix.applyDucking('WEATHER', 1.0, 0.5);
      this.busMatrix.applyDucking('VEHICLE', 1.0, 0.4);
      this.busMatrix.applyDucking('WILDLIFE', 1.0, 0.4);
    }
  }

  const instance = new AudioMixer();
  AudioMixer._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(AudioMixer.prototype)) {
    if (prop !== 'constructor' && typeof AudioMixer.prototype[prop] === 'function') {
      AudioMixer[prop] = function (...args) {
        return AudioMixer._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(AudioMixer, {
    isDuckingDialogue: {
      get() { return AudioMixer._instance.isDuckingDialogue; }
    }
  });

  if (typeof window !== 'undefined') {
    window.AudioMixer = AudioMixer;
    window.audioMixer = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioMixer, instance };
  }
})();
