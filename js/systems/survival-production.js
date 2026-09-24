// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION SURVIVAL ENGINE
// Single authoritative simulation engine for survival vitals, exposure & status
// ============================================================================

(function() {
  'use strict';

  class SurvivalProductionSystem {
    constructor() {
      this.data = window.SurvivalProductionData || {
        vitals: {},
        movementDrains: {},
        thresholds: {},
        criticalHealthDecay: {},
        consumables: {},
        assistMode: {}
      };

      this.lastUpdateTime = 0;
      this.updateStepCount = 0;
      this.statusEffectsTimer = {};
    }

    /**
     * Authoritative Survival Update Method
     * ONLY this method modifies survival vitals.
     * @param {number} deltaTime - Frame delta time in seconds
     * @param {Object} context - Environmental and player locomotion context
     */
    updateSurvival(deltaTime, context = {}) {
      if (!window.GameState || !window.GameState.player || !window.GameState.player.survival) {
        return;
      }

      // Check pause state
      if (context.isPaused) {
        return;
      }

      // Safe delta time handling: guard against unbounded background tab drain while supporting test/simulation steps
      const isTabHidden = typeof document !== 'undefined' && document.hidden;
      const maxDt = isTabHidden ? 0.25 : (context.maxDelta !== undefined ? context.maxDelta : 60.0);
      const dt = Math.min(maxDt, Math.max(0.001, deltaTime));
      this.updateStepCount++;

      const s = window.GameState.player.survival;
      const isAssisted = window.GameState.settings &&
                         window.GameState.settings.accessibility &&
                         window.GameState.settings.accessibility.survivalAssist === 'ASSISTED';
      const assistMult = isAssisted ? (this.data.assistMode.drainMultiplier || 0.5) : 1.0;

      // 1. Locomotion & Movement Drain
      const moveState = (context.movementState || 'IDLE').toUpperCase();
      const drainConfig = (this.data.movementDrains && this.data.movementDrains[moveState]) ||
                          (this.data.movementDrains && this.data.movementDrains.IDLE) ||
                          { energy: 0.05, hydration: 0.02, hunger: 0.015, warmthLossMult: 1.0 };

      // Energy consumption
      if (context.resting) {
        // Natural resting recovery handled in RestSystem or continuous passive rest
        s.energy = Math.min(s.maxEnergy, s.energy + (10.0 * dt));
      } else {
        s.energy = Math.max(0, s.energy - (drainConfig.energy * dt * assistMult));
      }

      // 2. Hydration Drain
      let hydrationDrain = drainConfig.hydration * dt * assistMult;
      const ambientTemp = context.ambientTemperature !== undefined ? context.ambientTemperature : 28.0;

      // Heat exposure accelerates hydration drain
      if (ambientTemp > 32.0) {
        const heatFactor = 1.0 + ((ambientTemp - 32.0) * 0.12);
        hydrationDrain *= Math.min(2.5, heatFactor);
      }
      if (context.shelter || context.isIndoor) {
        hydrationDrain *= 0.75; // Cooler in shade
      }
      s.hydration = Math.max(0, s.hydration - hydrationDrain);

      // 3. Hunger Drain (slow, gradual)
      let hungerDrain = drainConfig.hunger * dt * assistMult;
      if (context.shelter || context.resting) {
        hungerDrain *= 0.6;
      }
      s.hunger = Math.max(0, s.hunger - hungerDrain);

      // 4. Wetness Management (0 - 100)
      if (moveState === 'SWIM' || context.waterExposure) {
        s.wetness = Math.min(100, s.wetness + ((drainConfig.wetnessGain || 60.0) * dt));
      } else if (context.isNearCampfire) {
        s.wetness = Math.max(0, s.wetness - ((this.data.thresholds.wetnessEvaporationRate || 3.5) * 3.0 * dt));
      } else if (context.shelter || context.isIndoor) {
        s.wetness = Math.max(0, s.wetness - ((this.data.thresholds.wetnessEvaporationRate || 3.5) * 1.8 * dt));
      } else if (ambientTemp > 30.0) {
        s.wetness = Math.max(0, s.wetness - ((this.data.thresholds.wetnessEvaporationRate || 3.5) * 1.4 * dt));
      } else {
        s.wetness = Math.max(0, s.wetness - ((this.data.thresholds.wetnessEvaporationRate || 3.5) * dt));
      }

      // 5. Warmth & Thermal Model (0 - 100)
      // Comfortable equilibrium is ~80 warmth.
      let targetWarmth = 80.0;
      if (ambientTemp < 20.0) {
        // Cold environment (e.g. Nilgiris)
        const coldDeficit = (20.0 - ambientTemp) * 2.8;
        targetWarmth = Math.max(10.0, 80.0 - coldDeficit);
      } else if (ambientTemp > 36.0) {
        // Hot environment (e.g. Chettinad afternoon)
        targetWarmth = Math.min(95.0, 80.0 + (ambientTemp - 36.0) * 2.5);
      }

      // Wetness severely lowers target warmth
      if (s.wetness > 15.0) {
        targetWarmth -= (s.wetness * 0.35);
      }

      // Campfire warmth aura
      if (context.isNearCampfire) {
        targetWarmth = Math.min(95.0, targetWarmth + 45.0);
      }

      // Shelter insulation
      if (context.shelter || context.isIndoor) {
        targetWarmth = Math.min(90.0, targetWarmth + 15.0);
      }

      // Clothing insulation
      const outfitData = context.outfitData || {};
      if (targetWarmth < 80.0 && outfitData.coldProtection) {
        targetWarmth += (80.0 - targetWarmth) * outfitData.coldProtection;
      } else if (targetWarmth > 80.0 && outfitData.heatDissipation) {
        targetWarmth -= (targetWarmth - 80.0) * outfitData.heatDissipation;
      }

      // Approach target warmth smoothly
      const warmthRate = (context.isNearCampfire ? 0.35 : 0.08) * dt;
      s.warmth += (targetWarmth - s.warmth) * warmthRate;

      // 6. Prolonged Critical Conditions & Health Impact
      const crit = this.data.criticalHealthDecay || { dehydration: 0.35, starvation: 0.25, extremeCold: 0.50, extremeHeat: 0.30 };
      let healthDamage = 0;

      // Dehydration health decay
      if (s.hydration <= (this.data.thresholds.dehydrationCrit || 10.0)) {
        healthDamage += crit.dehydration * dt * assistMult;
      }
      // Starvation health decay
      if (s.hunger <= (this.data.thresholds.hungerCrit || 10.0)) {
        healthDamage += crit.starvation * dt * assistMult;
      }
      // Extreme cold health decay
      if (s.warmth <= (this.data.thresholds.coldCrit || 15.0)) {
        healthDamage += crit.extremeCold * dt * assistMult;
      }
      // Extreme overheating health decay
      if (s.warmth >= 94.0 && ambientTemp >= (this.data.thresholds.overheatTemp || 38.0)) {
        healthDamage += crit.extremeHeat * dt * assistMult;
      }

      if (healthDamage > 0) {
        s.health = Math.max(0, s.health - healthDamage);
      } else if (s.energy > 50 && s.hunger > 50 && s.hydration > 50 && s.warmth > 50 && (context.resting || context.shelter)) {
        // Natural gradual health recovery in safe shelter when well supplied
        s.health = Math.min(s.maxHealth, s.health + (2.0 * dt));
      }

      // 7. Update Flags & Status Effects
      s.isExhausted = s.energy <= (this.data.thresholds.exhaustion || 12.0);
      s.isDehydrated = s.hydration <= (this.data.thresholds.dehydrationWarn || 25.0);
      s.isCold = s.warmth <= (this.data.thresholds.coldWarn || 35.0);
      s.isOverheated = s.warmth >= 90.0 && ambientTemp >= 36.0;

      this._updateStatusEffects(s);

      // Clamp all vitals strictly within [0, max] and reject NaN/Infinity
      this._sanitizeVitals(s);
    }

    _updateStatusEffects(s) {
      const effects = [];

      if (s.hunger >= 75) effects.push('WELL_FED');
      else if (s.hunger <= 20) effects.push('HUNGRY');

      if (s.hydration >= 80) effects.push('HYDRATED');
      else if (s.hydration <= 20) effects.push('DEHYDRATED');

      if (s.energy <= 12) effects.push('EXHAUSTED');

      if (s.warmth <= 15) effects.push('VERY_COLD');
      else if (s.warmth <= 35) effects.push('COLD');

      if (s.wetness >= 30) effects.push('WET');

      // Preserve RESTED if it was active
      if (s.statusEffects.includes('RESTED')) {
        effects.push('RESTED');
      }

      s.statusEffects = effects;
    }

    _sanitizeVitals(s) {
      const clamp = (val, min, max, def) => {
        if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return def;
        return Math.max(min, Math.min(max, val));
      };

      s.health = clamp(s.health, 0, s.maxHealth, 100);
      s.energy = clamp(s.energy, 0, s.maxEnergy, 100);
      s.hydration = clamp(s.hydration, 0, s.maxHydration, 100);
      s.hunger = clamp(s.hunger, 0, s.maxHunger, 100);
      s.warmth = clamp(s.warmth, 0, s.maxWarmth, 80);
      s.wetness = clamp(s.wetness, 0, 100, 0);
    }

    /**
     * Consume item through authoritative survival system
     */
    consumeItem(itemId) {
      const consumable = this.data.consumables && this.data.consumables[itemId];
      if (!consumable) return false;

      const s = window.GameState && window.GameState.player && window.GameState.player.survival;
      if (!s) return false;

      if (consumable.health) s.health = Math.min(s.maxHealth, s.health + consumable.health);
      if (consumable.energy) s.energy = Math.min(s.maxEnergy, s.energy + consumable.energy);
      if (consumable.hydration) s.hydration = Math.min(s.maxHydration, s.hydration + consumable.hydration);
      if (consumable.hunger) s.hunger = Math.min(s.maxHunger, s.hunger + consumable.hunger);
      if (consumable.warmth) s.warmth = Math.min(s.maxWarmth, s.warmth + consumable.warmth);

      if (consumable.statusAdd && !s.statusEffects.includes(consumable.statusAdd)) {
        s.statusEffects.push(consumable.statusAdd);
      }

      this._sanitizeVitals(s);
      return true;
    }

    /**
     * Clamp vitals to safe authoritative bounds
     */
    clampVitals() {
      const s = window.GameState && window.GameState.player && window.GameState.player.survival;
      if (s) {
        this._sanitizeVitals(s);
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SurvivalProductionSystem;
  } else {
    window.SurvivalProductionSystem = SurvivalProductionSystem;
  }
})();
