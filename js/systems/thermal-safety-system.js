// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - THERMAL SAFETY & POWER ADVISOR
// Infers thermal throttling from sustained frame-time variance & advises battery saver
// ============================================================================

(function() {
  'use strict';

  class ThermalSafetySystem {
    constructor() {
      this.isThermalThrottlingInferred = false;
      this.isBatterySaverActive = false;
      this.isOnBattery = false;
      this.batteryLevel = 1.0;
      this.baselineFrameTimeMs = 16.67;
      this.degradedDurationSeconds = 0;
      this.lastEvaluationTime = performance.now();

      this._initBatteryMonitoring();
    }

    async _initBatteryMonitoring() {
      if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
        try {
          const battery = await navigator.getBattery();
          this.isOnBattery = !battery.charging;
          this.batteryLevel = battery.level;

          battery.addEventListener('chargingchange', () => {
            this.isOnBattery = !battery.charging;
          });
          battery.addEventListener('levelchange', () => {
            this.batteryLevel = battery.level;
          });
        } catch (_) {}
      }
    }

    /**
     * Periodically called by PerformanceManager to evaluate sustained degradation.
     * @param {number} currentAverageFrameTimeMs
     * @param {number} deltaTimeSeconds
     */
    evaluate(currentAverageFrameTimeMs, deltaTimeSeconds = 1.0) {
      if (!this.baselineFrameTimeMs) {
        this.baselineFrameTimeMs = currentAverageFrameTimeMs;
      }

      // If average frame time degraded by >40% relative to baseline for > 35 seconds
      if (currentAverageFrameTimeMs > this.baselineFrameTimeMs * 1.4 && currentAverageFrameTimeMs > 25.0) {
        this.degradedDurationSeconds += deltaTimeSeconds;
        if (this.degradedDurationSeconds >= 35.0) {
          this.isThermalThrottlingInferred = true;
        }
      } else {
        this.degradedDurationSeconds = Math.max(0, this.degradedDurationSeconds - deltaTimeSeconds * 0.5);
        if (this.degradedDurationSeconds === 0) {
          this.isThermalThrottlingInferred = false;
        }
      }
    }

    getRecommendations() {
      return {
        isOnBattery: this.isOnBattery,
        batteryLevel: Math.round(this.batteryLevel * 100),
        thermalThrottlingInferred: this.isThermalThrottlingInferred,
        recommendPowerSaver: this.isOnBattery && this.batteryLevel < 0.35,
        recommendProfileCap: this.isThermalThrottlingInferred ? 'LOW' : null
      };
    }
  }

  const instance = new ThermalSafetySystem();

  if (typeof window !== 'undefined') {
    window.ThermalSafetySystem = ThermalSafetySystem;
    window.thermalSafetySystem = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThermalSafetySystem, thermalSafetySystem: instance };
  }
})();
