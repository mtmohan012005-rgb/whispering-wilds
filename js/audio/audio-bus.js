// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO BUS SYSTEM
// 10 Authoritative Audio Buses rolling up into MASTER:
// MASTER, MUSIC, VOICE, AMBIENCE, SFX, UI, WEATHER, VEHICLE, WILDLIFE, CINEMATIC.
// Provides independent volume, mute states, ducking multiplier, and gain nodes.
// ============================================================================

(function () {
  'use strict';

  class AudioBus {
    constructor(name, context, parentBus = null) {
      this.name = name;
      this.context = context;
      this.parentBus = parentBus;

      this.gainNode = null;
      this.volume = 1.0;
      this.isMuted = false;
      this.duckingFactor = 1.0; // Dynamic ducking multiplier (e.g. 0.35 during dialogue)

      this._initNodes();
    }

    _initNodes() {
      if (!this.context) return;
      this.gainNode = this.context.createGain();
      this._applyGain();

      if (this.parentBus && this.parentBus.gainNode) {
        this.gainNode.connect(this.parentBus.gainNode);
      } else if (this.name === 'MASTER') {
        this.gainNode.connect(this.context.destination);
      }
    }

    _applyGain(fadeDuration = 0.05) {
      if (!this.gainNode || !this.context) return;
      const targetGain = this.isMuted ? 0.0 : (this.volume * this.duckingFactor);
      const now = this.context.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, targetGain), now + fadeDuration);
    }

    setVolume(val, fadeDuration = 0.05) {
      this.volume = Math.max(0.0, Math.min(1.0, Number(val) || 0.0));
      this._applyGain(fadeDuration);
    }

    setMute(muteState, fadeDuration = 0.05) {
      this.isMuted = !!muteState;
      this._applyGain(fadeDuration);
    }

    setDucking(factor, fadeDuration = 0.2) {
      this.duckingFactor = Math.max(0.0, Math.min(1.0, Number(factor) || 0.0));
      this._applyGain(fadeDuration);
    }

    getEffectiveGain() {
      if (this.isMuted) return 0.0;
      let eff = this.volume * this.duckingFactor;
      if (this.parentBus) {
        eff *= this.parentBus.getEffectiveGain();
      }
      return eff;
    }
  }

  class AudioBusMatrix {
    constructor() {
      this.buses = new Map();
      this.context = null;
      this.initialized = false;
    }

    init(context) {
      this.context = context;
      this.buses.clear();

      // 1. MASTER Bus
      const master = new AudioBus('MASTER', this.context, null);
      this.buses.set('MASTER', master);

      // 2. 9 Sub-Buses rolling up into MASTER
      const subBusNames = [
        'MUSIC',
        'VOICE',
        'AMBIENCE',
        'SFX',
        'UI',
        'WEATHER',
        'VEHICLE',
        'WILDLIFE',
        'CINEMATIC'
      ];

      for (const name of subBusNames) {
        const bus = new AudioBus(name, this.context, master);
        this.buses.set(name, bus);
      }

      this.initialized = true;
      console.log('[AudioBusMatrix] Initialized 10 authoritative audio buses rolling into MASTER.');
      return this;
    }

    getBus(name) {
      const upper = (name || '').toUpperCase();
      return this.buses.get(upper) || this.buses.get('SFX');
    }

    getGainNode(name) {
      const bus = this.getBus(name);
      return bus ? bus.gainNode : null;
    }

    setVolume(busName, volume, fade = 0.05) {
      const bus = this.getBus(busName);
      if (bus) bus.setVolume(volume, fade);
    }

    setMute(busName, isMuted, fade = 0.05) {
      const bus = this.getBus(busName);
      if (bus) bus.setMute(isMuted, fade);
    }

    applyDucking(busName, factor, fade = 0.2) {
      const bus = this.getBus(busName);
      if (bus) bus.setDucking(factor, fade);
    }

    resetAllDucking(fade = 0.3) {
      for (const bus of this.buses.values()) {
        bus.setDucking(1.0, fade);
      }
    }

    getAllBuses() {
      return Array.from(this.buses.values());
    }
  }

  const instance = new AudioBusMatrix();

  if (typeof window !== 'undefined') {
    window.AudioBusMatrix = instance;
    window.AudioBus = AudioBus;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioBusMatrix, AudioBus, instance };
  }
})();
