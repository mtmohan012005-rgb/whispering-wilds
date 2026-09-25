/**
 * The Whispering Wilds - Device Adaptation System
 * Continuous runtime performance observer that scales visual & simulation parameters.
 * Uses hysteresis, minimum intervals, and rolling windows to eliminate quality oscillation.
 * Preserves user-chosen manual settings unless sustained critical instability occurs.
 */
(function(root) {
  'use strict';

  class DeviceAdaptationSystem {
    constructor() {
      const FallbackRules = root.DeviceFallbackRules || (typeof require !== 'undefined' && require('../config/device-fallback-rules'));
      this.config = (FallbackRules && FallbackRules.HYSTERESIS_CONFIG) || {
        ROLLING_WINDOW_SIZE: 60,
        DOWNGRADE_FRAME_TIME_MS: 33.3,
        UPGRADE_FRAME_TIME_MS: 16.0,
        SUSTAINED_THRESHOLD_FRAMES: 45,
        MIN_ADAPTATION_INTERVAL_MS: 8000,
        MAX_AUTOMATIC_DOWNGRADES: 4
      };

      this.frameTimes = [];
      this.lastAdaptationTime = performance.now();
      this.adaptationCount = 0;
      this.isManualMode = false;
      this.adaptationLevel = 0; // 0 = standard, 1-4 = degraded

      // Runtime adaptation state (separate from user saved settings!)
      this.runtimeModifiers = {
        renderScaleMultiplier: 1.0,
        shadowQualityOverride: null,
        waterQualityOverride: null,
        vegetationDensityMultiplier: 1.0,
        particleDensityMultiplier: 1.0,
        npcUpdateFrequencyDivider: 1,
        wildlifeUpdateFrequencyDivider: 1,
        trafficDensityMultiplier: 1.0
      };
    }

    setManualMode(enabled) {
      this.isManualMode = !!enabled;
    }

    recordFrameTime(frameTimeMs) {
      this.frameTimes.push(frameTimeMs);
      if (this.frameTimes.length > this.config.ROLLING_WINDOW_SIZE) {
        this.frameTimes.shift();
      }

      // Check if adaptation evaluation is due
      const now = performance.now();
      if (now - this.lastAdaptationTime >= this.config.MIN_ADAPTATION_INTERVAL_MS &&
          this.frameTimes.length >= this.config.ROLLING_WINDOW_SIZE) {
        this.evaluateAdaptation(now);
      }
    }

    evaluateAdaptation(now) {
      const slowFrames = this.frameTimes.filter(t => t > this.config.DOWNGRADE_FRAME_TIME_MS).length;
      const fastFrames = this.frameTimes.filter(t => t < this.config.UPGRADE_FRAME_TIME_MS).length;

      // In manual mode, only downgrade if SEVERELY unstable (> 50ms / < 20 FPS for almost all frames)
      if (this.isManualMode) {
        const severeFrames = this.frameTimes.filter(t => t > 50.0).length;
        if (severeFrames >= this.config.SUSTAINED_THRESHOLD_FRAMES && this.adaptationLevel < this.config.MAX_AUTOMATIC_DOWNGRADES) {
          console.warn('[DeviceAdaptationSystem] Emergency stability protection triggered in Manual Mode.');
          this.stepDown(now);
        }
        return;
      }

      // Automatic mode: downgrade if sustained slow frames
      if (slowFrames >= this.config.SUSTAINED_THRESHOLD_FRAMES && this.adaptationLevel < this.config.MAX_AUTOMATIC_DOWNGRADES) {
        this.stepDown(now);
      }
      // Upgrade if consistently fast frames and we are currently adapted downwards
      else if (fastFrames >= this.config.SUSTAINED_THRESHOLD_FRAMES && this.adaptationLevel > 0) {
        this.stepUp(now);
      }
    }

    stepDown(now) {
      this.adaptationLevel++;
      this.lastAdaptationTime = now;
      this.applyAdaptationStep(this.adaptationLevel);
      this.notifyQualityAdjustment();
    }

    stepUp(now) {
      this.adaptationLevel--;
      this.lastAdaptationTime = now;
      this.applyAdaptationStep(this.adaptationLevel);
      this.notifyQualityAdjustment();
    }

    applyAdaptationStep(level) {
      switch (level) {
        case 1:
          // Step 1: Reduce post-processing & NPC update rate slightly
          this.runtimeModifiers.renderScaleMultiplier = 0.9;
          this.runtimeModifiers.npcUpdateFrequencyDivider = 2; // Every 2nd frame
          break;
        case 2:
          // Step 2: Scale down render resolution, reduce particles & wildlife
          this.runtimeModifiers.renderScaleMultiplier = 0.8;
          this.runtimeModifiers.particleDensityMultiplier = 0.7;
          this.runtimeModifiers.wildlifeUpdateFrequencyDivider = 2;
          this.runtimeModifiers.trafficDensityMultiplier = 0.75;
          break;
        case 3:
          // Step 3: Reduce shadows, vegetation, and water
          this.runtimeModifiers.renderScaleMultiplier = 0.7;
          this.runtimeModifiers.vegetationDensityMultiplier = 0.5;
          this.runtimeModifiers.shadowQualityOverride = 'LOW';
          this.runtimeModifiers.waterQualityOverride = 'LOW';
          this.runtimeModifiers.trafficDensityMultiplier = 0.5;
          break;
        case 4:
          // Step 4: Emergency safe mode
          this.runtimeModifiers.renderScaleMultiplier = 0.6;
          this.runtimeModifiers.vegetationDensityMultiplier = 0.3;
          this.runtimeModifiers.particleDensityMultiplier = 0.3;
          this.runtimeModifiers.shadowQualityOverride = 'OFF';
          this.runtimeModifiers.waterQualityOverride = 'SAFE';
          this.runtimeModifiers.trafficDensityMultiplier = 0.25;
          break;
        default:
          // Level 0: Standard unmodified
          this.runtimeModifiers.renderScaleMultiplier = 1.0;
          this.runtimeModifiers.shadowQualityOverride = null;
          this.runtimeModifiers.waterQualityOverride = null;
          this.runtimeModifiers.vegetationDensityMultiplier = 1.0;
          this.runtimeModifiers.particleDensityMultiplier = 1.0;
          this.runtimeModifiers.npcUpdateFrequencyDivider = 1;
          this.runtimeModifiers.wildlifeUpdateFrequencyDivider = 1;
          this.runtimeModifiers.trafficDensityMultiplier = 1.0;
          break;
      }

      console.log(`[DeviceAdaptationSystem] Applied adaptation level ${level}:`, this.runtimeModifiers);
    }

    notifyQualityAdjustment() {
      if (root.AdaptiveNotificationUI && typeof root.AdaptiveNotificationUI.show === 'function') {
        root.AdaptiveNotificationUI.show('Graphics quality adjusted for smoother performance.');
      }
    }

    getModifiers() {
      return Object.assign({}, this.runtimeModifiers);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceAdaptationSystem;
  } else {
    root.DeviceAdaptationSystem = DeviceAdaptationSystem;
  }
})(typeof window !== 'undefined' ? window : global);
