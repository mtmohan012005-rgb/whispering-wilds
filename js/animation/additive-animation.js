/**
 * js/animation/additive-animation.js
 * The Whispering Wilds (Kaattu Vazhi) - Additive Procedural Layers
 *
 * Implements subtle secondary additive layers (breathing oscillation, fatigue,
 * cold shivering tension, and wind lean) without distorting base locomotion.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AdditiveAnimation = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AdditiveAnimation {
    constructor() {
      this.breathPhase = 0.0;
      this.shiverPhase = 0.0;

      // Status inputs
      this.staminaPercent = 100; // 0 - 100
      this.temperatureCelsius = 28;
      this.windForce = 0.0;

      // Breathing tuning
      this.baseBpm = 14;     // Rest breaths per minute
      this.maxBpm = 36;      // Heavy exertion
      this.breathDepth = 0.025; // Chest scale / pitch delta
    }

    setVitals(staminaPercent, temperatureCelsius, windForce = 0.0) {
      this.staminaPercent = Math.max(0, Math.min(100, staminaPercent));
      this.temperatureCelsius = temperatureCelsius;
      this.windForce = Math.max(0, windForce);
    }

    /**
     * Calculates additive offsets for chest, spine, and head
     * @param {number} deltaTime
     * @returns {{ chestPitch: number, chestScale: number, headDroop: number, shiverOffset: number, windLean: number }}
     */
    update(deltaTime) {
      // 1. Fatigue breathing frequency
      const fatigueFactor = 1.0 - (this.staminaPercent / 100.0); // 0 (rest) to 1 (exhausted)
      const currentBpm = this.baseBpm + (this.maxBpm - this.baseBpm) * fatigueFactor;
      const breathHz = currentBpm / 60.0;

      this.breathPhase += deltaTime * breathHz * Math.PI * 2;
      if (this.breathPhase > Math.PI * 2) this.breathPhase -= Math.PI * 2;

      const breathSin = Math.sin(this.breathPhase);
      const chestPitch = breathSin * this.breathDepth * (1.0 + fatigueFactor * 1.5);
      const chestScale = 1.0 + breathSin * (0.01 + fatigueFactor * 0.02);

      // 2. Head droop from exhaustion
      const headDroop = fatigueFactor * 0.18; // ~10 deg max droop

      // 3. Cold shivering micro-jitter (under 12 deg C)
      let shiverOffset = 0.0;
      if (this.temperatureCelsius < 12) {
        const coldSeverity = Math.min(1.0, (12 - this.temperatureCelsius) / 12);
        this.shiverPhase += deltaTime * 28.0; // Fast ~28 rad/sec flutter
        shiverOffset = Math.sin(this.shiverPhase) * 0.008 * coldSeverity;
      }

      // 4. Wind resistance lean
      const windLean = Math.min(0.12, this.windForce * 0.015);

      return {
        chestPitch,
        chestScale,
        headDroop,
        shiverOffset,
        windLean,
        fatigueFactor
      };
    }
  }

  return AdditiveAnimation;
});
