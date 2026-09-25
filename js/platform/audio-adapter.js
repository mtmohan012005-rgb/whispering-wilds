/**
 * The Whispering Wilds - Audio Adapter
 * Detects Web Audio capabilities and provides a guaranteed silent fallback
 * so that missing or failing audio hardware NEVER prevents gameplay.
 */
(function(root) {
  'use strict';

  class AudioAdapter {
    constructor() {
      this.webAudioSupported = false;
      this.spatialAudioSupported = false;
      this.isSilentFallback = false;
      this.sampleRate = 44100;
      this.maxChannels = 2;
      this.detect();
      this.bindEvents();
    }

    detect() {
      const AudioCtx = (typeof window !== 'undefined') &&
        (window.AudioContext || window.webkitAudioContext);

      if (!AudioCtx) {
        this.webAudioSupported = false;
        this.spatialAudioSupported = false;
        this.isSilentFallback = true;
        return;
      }

      try {
        const testCtx = new AudioCtx();
        this.webAudioSupported = true;
        this.sampleRate = testCtx.sampleRate || 44100;
        this.maxChannels = (testCtx.destination && testCtx.destination.maxChannelCount) || 2;
        this.spatialAudioSupported = typeof testCtx.createPanner === 'function';
        
        // Clean up test context
        if (typeof testCtx.close === 'function') {
          testCtx.close().catch(() => {});
        }
      } catch (err) {
        console.warn('[AudioAdapter] AudioContext initialization failed. Enabling silent fallback.', err);
        this.webAudioSupported = false;
        this.isSilentFallback = true;
      }
    }

    bindEvents() {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
        navigator.mediaDevices.addEventListener('devicechange', () => {
          console.log('[AudioAdapter] Audio output device hot-swap detected.');
          if (root.AudioManager && typeof root.AudioManager.onDeviceChange === 'function') {
            root.AudioManager.onDeviceChange();
          }
        });
      }
    }

    getCapabilities() {
      return {
        webAudioSupported: this.webAudioSupported,
        spatialAudioSupported: this.spatialAudioSupported,
        isSilentFallback: this.isSilentFallback,
        sampleRate: this.sampleRate,
        maxChannels: this.maxChannels
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioAdapter;
  } else {
    root.AudioAdapter = AudioAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
