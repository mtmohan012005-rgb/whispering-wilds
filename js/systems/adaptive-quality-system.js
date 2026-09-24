// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ADAPTIVE QUALITY SYSTEM
// Multi-step quality adaptation, hysteresis, manual override & user settings preservation
// ============================================================================

(function() {
  'use strict';

  class AdaptiveQualitySystem {
    constructor() {
      this.isAutoQualityEnabled = true;

      // Quality scale: 100 -> 90 -> 80 -> 70 -> 60 -> 50
      this.qualityStep = 100;
      this.minQualityStep = 50;
      this.maxQualityStep = 100;

      // Hysteresis timing
      this.lowPerformanceDuration = 0; // seconds below budget
      this.highPerformanceDuration = 0; // seconds above budget
      this.cooldownTimer = 0;
      this.stepDownThresholdSeconds = 3.5;
      this.stepUpThresholdSeconds = 6.5;

      // Dynamic runtime override values (separated from user saved settings)
      this.runtimeOverrides = {
        renderScale: 1.0,
        postProcessing: 'HIGH',
        shadowQuality: 'high',
        foliageDensity: 1.0,
        particleBudget: 2000,
        waterQuality: 'HIGH',
        simulationRadius: 90
      };

      this.notificationCallback = null;
    }

    setAutoQualityEnabled(enabled) {
      this.isAutoQualityEnabled = !!enabled;
      console.log(`[AdaptiveQualitySystem] Auto quality ${this.isAutoQualityEnabled ? 'enabled' : 'disabled (manual user override active)'}`);
    }

    onQualityAdjusted(callback) {
      this.notificationCallback = callback;
    }

    update(frameBudgetSnapshot, deltaTimeSeconds = 0.016) {
      if (!this.isAutoQualityEnabled || !frameBudgetSnapshot) return;

      if (this.cooldownTimer > 0) {
        this.cooldownTimer -= deltaTimeSeconds;
        return;
      }

      const targetFPS = frameBudgetSnapshot.targetFPS || 60;
      const currentFPS = frameBudgetSnapshot.averageFPS || 60;
      const underThreshold = targetFPS - 6; // e.g. 54 FPS
      const overThreshold = targetFPS - 1;  // e.g. 59 FPS

      if (currentFPS < underThreshold) {
        this.lowPerformanceDuration += deltaTimeSeconds;
        this.highPerformanceDuration = 0;

        if (this.lowPerformanceDuration >= this.stepDownThresholdSeconds) {
          this.stepDown();
          this.lowPerformanceDuration = 0;
          this.cooldownTimer = 4.5; // 4.5s cooldown
        }
      } else if (currentFPS >= overThreshold && this.qualityStep < this.maxQualityStep) {
        this.highPerformanceDuration += deltaTimeSeconds;
        this.lowPerformanceDuration = 0;

        if (this.highPerformanceDuration >= this.stepUpThresholdSeconds) {
          this.stepUp();
          this.highPerformanceDuration = 0;
          this.cooldownTimer = 6.0; // 6s cooldown
        }
      } else {
        this.lowPerformanceDuration = Math.max(0, this.lowPerformanceDuration - deltaTimeSeconds * 0.5);
        this.highPerformanceDuration = Math.max(0, this.highPerformanceDuration - deltaTimeSeconds * 0.5);
      }
    }

    /**
     * Preferred Downgrade Sequence (Section 191)
     * 1. post-processing
     * 2. render scale
     * 3. shadows
     * 4. vegetation
     * 5. particles
     * 6. water effects
     * 7. distant simulation density
     * 8. texture quality
     */
    stepDown() {
      if (this.qualityStep <= this.minQualityStep) return false;
      this.qualityStep -= 10;
      this._applyQualityStep(this.qualityStep);

      console.log(`[AdaptiveQualitySystem] 📉 Scaled down quality step to ${this.qualityStep}%`);
      if (typeof this.notificationCallback === 'function') {
        this.notificationCallback({
          direction: 'down',
          step: this.qualityStep,
          message: { en: 'Graphics adjusted for smoother performance.', ta: 'மென்மையான இயக்கத்திற்கு வரைகலை சரிசெய்யப்பட்டது.' }
        });
      }
      return true;
    }

    stepUp() {
      if (this.qualityStep >= this.maxQualityStep) return false;
      this.qualityStep += 10;
      this._applyQualityStep(this.qualityStep);

      console.log(`[AdaptiveQualitySystem] 📈 Restored quality step to ${this.qualityStep}%`);
      if (typeof this.notificationCallback === 'function') {
        this.notificationCallback({
          direction: 'up',
          step: this.qualityStep,
          message: { en: 'Graphics quality restored.', ta: 'வரைகலை தரம் மீட்டமைக்கப்பட்டது.' }
        });
      }
      return true;
    }

    _applyQualityStep(step) {
      // 100% -> Base user settings
      // 90%  -> Disable bloom/SSAO, renderScale = 0.95
      // 80%  -> renderScale = 0.85, shadow map = 1024, foliage = 0.8
      // 70%  -> renderScale = 0.75, foliage = 0.6, particles = 800, water = MEDIUM
      // 60%  -> renderScale = 0.65, shadows = low, particles = 400, simulationRadius = 50
      // 50%  -> renderScale = 0.55, shadows = none, foliage = 0.35, particles = 200

      if (step >= 100) {
        this.runtimeOverrides.renderScale = 1.0;
        this.runtimeOverrides.postProcessing = 'HIGH';
        this.runtimeOverrides.shadowQuality = 'high';
        this.runtimeOverrides.foliageDensity = 1.0;
        this.runtimeOverrides.particleBudget = 2500;
        this.runtimeOverrides.waterQuality = 'HIGH';
        this.runtimeOverrides.simulationRadius = 90;
      } else if (step === 90) {
        this.runtimeOverrides.renderScale = 0.95;
        this.runtimeOverrides.postProcessing = 'MEDIUM';
        this.runtimeOverrides.shadowQuality = 'high';
        this.runtimeOverrides.foliageDensity = 0.9;
      } else if (step === 80) {
        this.runtimeOverrides.renderScale = 0.85;
        this.runtimeOverrides.postProcessing = 'LOW';
        this.runtimeOverrides.shadowQuality = 'medium';
        this.runtimeOverrides.foliageDensity = 0.75;
        this.runtimeOverrides.particleBudget = 1200;
      } else if (step === 70) {
        this.runtimeOverrides.renderScale = 0.75;
        this.runtimeOverrides.postProcessing = 'LOW';
        this.runtimeOverrides.shadowQuality = 'medium';
        this.runtimeOverrides.foliageDensity = 0.6;
        this.runtimeOverrides.particleBudget = 800;
        this.runtimeOverrides.waterQuality = 'MEDIUM';
        this.runtimeOverrides.simulationRadius = 65;
      } else if (step === 60) {
        this.runtimeOverrides.renderScale = 0.65;
        this.runtimeOverrides.postProcessing = 'NONE';
        this.runtimeOverrides.shadowQuality = 'low';
        this.runtimeOverrides.foliageDensity = 0.45;
        this.runtimeOverrides.particleBudget = 400;
        this.runtimeOverrides.waterQuality = 'LOW';
        this.runtimeOverrides.simulationRadius = 45;
      } else { // 50%
        this.runtimeOverrides.renderScale = 0.55;
        this.runtimeOverrides.postProcessing = 'NONE';
        this.runtimeOverrides.shadowQuality = 'none';
        this.runtimeOverrides.foliageDensity = 0.3;
        this.runtimeOverrides.particleBudget = 200;
        this.runtimeOverrides.waterQuality = 'LOW';
        this.runtimeOverrides.simulationRadius = 30;
      }

      // Propagate runtime overrides to render quality system
      if (window.renderQualitySystem && window.threeWorld?.renderer) {
        window.renderQualitySystem.setDynamicRenderScale(this.runtimeOverrides.renderScale, window.threeWorld.renderer);
      }
    }
  }

  const instance = new AdaptiveQualitySystem();

  if (typeof window !== 'undefined') {
    window.AdaptiveQualitySystem = AdaptiveQualitySystem;
    window.adaptiveQualitySystem = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdaptiveQualitySystem, adaptiveQualitySystem: instance };
  }
})();
