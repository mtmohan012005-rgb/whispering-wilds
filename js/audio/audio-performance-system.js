// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO PERFORMANCE & RECOVERY SYSTEM
// Dynamic hardware scaling (LOW, MED, HIGH, ULTRA), AudioContext crash recovery,
// OS device-change listener, and alt-tab / minimize lifecycle handling.
// ============================================================================

(function () {
  'use strict';

  class AudioPerformanceSystem {
    constructor() {
      this.hardwareTier = 'HIGH';
      this.currentTier = 'high';
      this.maxVoices = 28;
      this.isRecoveringContext = false;
      this.isTabHidden = false;
      this.isBackgrounded = false;
      this.isSilentFallbackActive = false;
      this.initialized = false;
    }

    init(tier = 'high') {
      this.setTier(tier);
      this._bindLifecycleAndDeviceEvents();
      this.initialized = true;
      console.log(`[AudioPerformanceSystem] Initialized audio performance manager (Tier: ${this.currentTier}).`);
      return this;
    }

    setTier(tier) {
      const lower = (tier || 'high').toLowerCase();
      this.currentTier = lower;
      this.hardwareTier = lower.toUpperCase();

      switch (lower) {
        case 'low':
          this.maxVoices = 12;
          break;
        case 'medium':
        case 'med':
          this.maxVoices = 20;
          break;
        case 'high':
          this.maxVoices = 28;
          break;
        case 'ultra':
          this.maxVoices = 36;
          break;
        default:
          this.maxVoices = 28;
      }

      if (window.AudioPrioritySystem) {
        window.AudioPrioritySystem.maxConcurrentVoices = this.maxVoices;
      }
      if (window.audioManager) {
        window.audioManager.maxSimultaneousVoices = this.maxVoices;
      }
    }

    setHardwareTier(tier) {
      this.setTier(tier);
    }

    onVisibilityChange(isVisible) {
      this.isBackgrounded = !isVisible;
      this.isTabHidden = !isVisible;
      if (this.isBackgrounded) {
        this.onWindowBlur();
      } else {
        this.onWindowFocus();
      }
    }

    handleContextFailure() {
      this.enableSilentFallback();
      return {
        recoveryStatus: 'silent_mode',
        gameplaySafe: true
      };
    }

    _bindLifecycleAndDeviceEvents() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      document.addEventListener('visibilitychange', () => {
        this.onVisibilityChange(!document.hidden);
      });

      if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
        navigator.mediaDevices.addEventListener('devicechange', () => {
          this.handleAudioDeviceChange();
        });
      }
    }

    onWindowBlur() {
      this.isTabHidden = true;
      this.isBackgrounded = true;
      if (window.AudioBusMatrix) {
        window.AudioBusMatrix.applyDucking('MASTER', 0.05, 0.2);
      }
    }

    onWindowFocus() {
      this.isTabHidden = false;
      this.isBackgrounded = false;
      if (window.AudioBusMatrix) {
        window.AudioBusMatrix.applyDucking('MASTER', 1.0, 0.35);
      }
      this.verifyAndRecoverContext();
    }

    handleAudioDeviceChange() {
      console.log('[AudioPerformanceSystem] OS audio output device change detected.');
      this.verifyAndRecoverContext();
    }

    verifyAndRecoverContext() {
      const am = window.audioManager;
      if (!am || !am.ctx) return;

      if (am.ctx.state === 'suspended') {
        am.ctx.resume().catch((err) => {
          console.warn('[AudioPerformanceSystem] AudioContext resume failed:', err);
          this.enableSilentFallback();
        });
      }
    }

    enableSilentFallback() {
      if (this.isSilentFallbackActive) return;
      this.isSilentFallbackActive = true;
      console.warn('[AudioPerformanceSystem] Enabling silent mode fallback. Game remains 100% playable.');
    }

    getPerformanceMetrics() {
      return {
        hardwareTier: this.hardwareTier,
        isTabHidden: this.isTabHidden,
        isSilentFallbackActive: this.isSilentFallbackActive,
        activeVoices: window.AudioPrioritySystem?.getActiveVoiceCount() || 0,
        contextState: window.audioManager?.ctx?.state || 'uninitialized'
      };
    }
  }

  const instance = new AudioPerformanceSystem();
  AudioPerformanceSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(AudioPerformanceSystem.prototype)) {
    if (prop !== 'constructor' && typeof AudioPerformanceSystem.prototype[prop] === 'function') {
      AudioPerformanceSystem[prop] = function (...args) {
        return AudioPerformanceSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(AudioPerformanceSystem, {
    currentTier: {
      get() { return AudioPerformanceSystem._instance.currentTier; },
      set(v) { AudioPerformanceSystem._instance.currentTier = v; }
    },
    maxVoices: {
      get() { return AudioPerformanceSystem._instance.maxVoices; },
      set(v) { AudioPerformanceSystem._instance.maxVoices = v; }
    },
    isBackgrounded: {
      get() { return AudioPerformanceSystem._instance.isBackgrounded; },
      set(v) { AudioPerformanceSystem._instance.isBackgrounded = v; }
    }
  });

  if (typeof window !== 'undefined') {
    window.AudioPerformanceSystem = AudioPerformanceSystem;
    window.audioPerformanceSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioPerformanceSystem, instance };
  }
})();
