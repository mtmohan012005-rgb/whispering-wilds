// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO EMITTER SYSTEM
// 3D spatial sound source with distance attenuation, occlusion filtering,
// and interior acoustic sends.
// ============================================================================

(function () {
  'use strict';

  class AudioEmitter {
    constructor(id, options = {}) {
      this.id = id;
      this.context = options.context || window.audioManager?.ctx;
      this.busName = options.busName || 'SFX';
      this.position = { x: options.x || 0, y: options.y || 0, z: options.z || 0 };

      // Attenuation parameters
      this.minDistance = options.minDistance || 3.0; // Full volume within 3m
      this.maxDistance = options.maxDistance || 45.0; // Inaudible beyond 45m
      this.rolloff = options.rolloff || 1.2;

      // Nodes
      this.gainNode = null;
      this.pannerNode = null;
      this.filterNode = null; // Low-pass filter for occlusion / interior dampening
      this.sourceNode = null;

      this.isOccluded = false;
      this.isPlaying = false;

      this._initNodes();
    }

    _initNodes() {
      if (!this.context) return;

      try {
        this.gainNode = this.context.createGain();
        this.filterNode = this.context.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(22000, this.context.currentTime); // Open by default

        // Spatial panner
        if (typeof this.context.createPanner === 'function') {
          this.pannerNode = this.context.createPanner();
          this.pannerNode.panningModel = 'HRTF';
          this.pannerNode.distanceModel = 'inverse';
          this.pannerNode.refDistance = this.minDistance;
          this.pannerNode.maxDistance = this.maxDistance;
          this.pannerNode.rolloffFactor = this.rolloff;
          this.pannerNode.coneInnerAngle = 360;

          // Wire: Filter -> Panner -> Gain -> Bus
          this.filterNode.connect(this.pannerNode);
          this.pannerNode.connect(this.gainNode);
        } else {
          this.filterNode.connect(this.gainNode);
        }

        // Connect to authoritative target bus
        const targetGain = window.AudioBusMatrix?.getGainNode(this.busName) || this.context.destination;
        this.gainNode.connect(targetGain);
      } catch (err) {
        console.warn(`[AudioEmitter] Node init failed for ${this.id}:`, err);
      }
    }

    setPosition(x, y, z) {
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;

      if (this.pannerNode && this.context) {
        const now = this.context.currentTime;
        if (this.pannerNode.positionX) {
          this.pannerNode.positionX.setValueAtTime(x, now);
          this.pannerNode.positionY.setValueAtTime(y, now);
          this.pannerNode.positionZ.setValueAtTime(z, now);
        } else if (typeof this.pannerNode.setPosition === 'function') {
          this.pannerNode.setPosition(x, y, z);
        }
      }
    }

    setOcclusion(isOccluded, cutoffHz = 1200) {
      this.isOccluded = isOccluded;
      if (this.filterNode && this.context) {
        const now = this.context.currentTime;
        const targetFreq = isOccluded ? cutoffHz : 22000;
        this.filterNode.frequency.setTargetAtTime(targetFreq, now, 0.15);
      }
    }

    setVolume(val, fade = 0.05) {
      if (this.gainNode && this.context) {
        const now = this.context.currentTime;
        this.gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, Number(val) || 0), now + fade);
      }
    }

    stop() {
      if (this.sourceNode) {
        try {
          this.sourceNode.stop();
        } catch (_) {}
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      this.isPlaying = false;
    }

    destroy() {
      this.stop();
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.filterNode) {
        this.filterNode.disconnect();
        this.filterNode = null;
      }
      if (this.pannerNode) {
        this.pannerNode.disconnect();
        this.pannerNode = null;
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.AudioEmitter = AudioEmitter;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioEmitter };
  }
})();
