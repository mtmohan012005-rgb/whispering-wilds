/**
 * The Whispering Wilds - Runtime Compatibility System
 * The SOLE AUTHORITY for platform capabilities, device adaptation, fallbacks,
 * and runtime recovery across Windows, macOS, and Linux.
 * Enforces the strict player customization ceiling (<= 5).
 */
(function(root) {
  'use strict';

  class RuntimeCompatibilitySystem {
    constructor() {
      // Singleton pattern enforcement
      if (root.RuntimeCompatibilitySystemInstance) {
        return root.RuntimeCompatibilitySystemInstance;
      }

      const UniversalPlatformLayer = root.UniversalPlatformLayer || (typeof require !== 'undefined' && require('../platform/universal-platform-layer'));
      const DeviceProfileSystem = root.DeviceProfileSystem || (typeof require !== 'undefined' && require('./device-profile-system'));

      this.platformLayer = UniversalPlatformLayer ? new UniversalPlatformLayer() : null;
      this.profileSystem = DeviceProfileSystem ? new DeviceProfileSystem(this.platformLayer?.getProfile()) : null;

      this.currentTier = this.profileSystem ? this.profileSystem.getProfileTier() : 'MEDIUM';
      this.emulationMode = null; // 'EMULATE_VERY_LOW' | 'EMULATE_LOW' | etc.
      this.safeModeActive = false;
      this.launchCrashCount = 0;
      this.isFirstLaunch = false;
      this.initialized = false;

      this.checkCrashLoopState();
      root.RuntimeCompatibilitySystemInstance = this;
    }

    checkCrashLoopState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const crashKey = 'ww_unclean_exits';
          const count = parseInt(window.localStorage.getItem(crashKey) || '0', 10);
          this.launchCrashCount = count;

          // If 3 consecutive crashes occurred, engage emergency safe mode
          if (count >= 3) {
            console.warn('[RuntimeCompatibilitySystem] Repeated crash loop detected (>= 3). Engaging SAFE MODE.');
            this.safeModeActive = true;
          }

          // Mark current session as starting
          window.localStorage.setItem(crashKey, (count + 1).toString());

          // Clean exit handler
          window.addEventListener('beforeunload', () => {
            window.localStorage.setItem(crashKey, '0');
          });
        }
      } catch (_) {}
    }

    /**
     * Mark session healthy (called after world loaded and stable)
     */
    markSessionStable() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('ww_unclean_exits', '0');
        }
      } catch (_) {}
    }

    /**
     * Sequence: detect -> validate -> safe graphics -> short benchmark -> recommend -> launch
     */
    async runStartupSequence() {
      console.log('[RuntimeCompatibilitySystem] Commencing universal startup sequence...');
      
      // 1. Detect
      const profile = this.platformLayer ? this.platformLayer.getProfile() : {};
      
      // 2. Validate
      const isValid = root.DeviceCapabilitySchema ? root.DeviceCapabilitySchema.validateProfile(profile) : true;
      if (!isValid) {
        console.warn('[RuntimeCompatibilitySystem] Profile validation warning. Defaulting to SAFE_MEDIUM.');
        this.currentTier = 'MEDIUM';
      }

      // 3. Short benchmark
      if (this.profileSystem) {
        await this.profileSystem.runMicroBenchmark();
        this.currentTier = this.profileSystem.getProfileTier();
      }

      // 4. Check emulation override (for developer test matrices)
      if (this.emulationMode) {
        this.applyEmulation(this.emulationMode);
      }

      // 5. Notify PerformanceManager if present
      if (root.PerformanceManager && typeof root.PerformanceManager.setQualityProfile === 'function') {
        const targetQuality = this.safeModeActive ? 'VERY_LOW' : this.currentTier;
        root.PerformanceManager.setQualityProfile(targetQuality);
      }

      // Invariant check: Customization limit must never exceed 5
      this.verifyCustomizationCeiling();

      this.initialized = true;
      console.log(`[RuntimeCompatibilitySystem] Startup sequence complete. Active Tier: ${this.getActiveTier()}, Safe Mode: ${this.safeModeActive}`);
      return {
        activeTier: this.getActiveTier(),
        safeMode: this.safeModeActive,
        platform: profile
      };
    }

    setEmulationMode(emulationModeString) {
      this.emulationMode = emulationModeString;
      this.applyEmulation(emulationModeString);
    }

    applyEmulation(mode) {
      switch (mode) {
        case 'EMULATE_VERY_LOW':
          this.currentTier = 'VERY_LOW';
          break;
        case 'EMULATE_LOW':
          this.currentTier = 'LOW';
          break;
        case 'EMULATE_MEDIUM':
          this.currentTier = 'MEDIUM';
          break;
        case 'EMULATE_HIGH':
          this.currentTier = 'HIGH';
          break;
        case 'EMULATE_ULTRA':
          this.currentTier = 'ULTRA';
          break;
        default:
          this.emulationMode = null;
          if (this.profileSystem) this.currentTier = this.profileSystem.getProfileTier();
      }
    }

    enableSafeMode() {
      this.safeModeActive = true;
      if (root.PerformanceManager && typeof root.PerformanceManager.setQualityProfile === 'function') {
        root.PerformanceManager.setQualityProfile('VERY_LOW');
      }
    }

    disableSafeMode() {
      this.safeModeActive = false;
      if (this.profileSystem) this.currentTier = this.profileSystem.getProfileTier();
      if (root.PerformanceManager && typeof root.PerformanceManager.setQualityProfile === 'function') {
        root.PerformanceManager.setQualityProfile(this.currentTier);
      }
    }

    getActiveTier() {
      return this.safeModeActive ? 'VERY_LOW' : this.currentTier;
    }

    getPlatformProfile() {
      return this.platformLayer ? this.platformLayer.getProfile() : {};
    }

    verifyCustomizationCeiling() {
      if (root.GameState && root.GameState.player) {
        const used = root.GameState.player.customizationChangesUsed ?? 0;
        if (used < 0) root.GameState.player.customizationChangesUsed = 0;
        if (used > 5) {
          console.error('[RuntimeCompatibilitySystem] CRITICAL VIOLATION: Customization exceeded 5! Clamping to 5.');
          root.GameState.player.customizationChangesUsed = 5;
        }
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuntimeCompatibilitySystem;
  } else {
    root.RuntimeCompatibilitySystem = RuntimeCompatibilitySystem;
  }
})(typeof window !== 'undefined' ? window : global);
