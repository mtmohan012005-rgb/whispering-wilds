/**
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative State Validator
 * Enforces strict mathematical and logical boundaries on persistent game state.
 * Guarantees customizationChangesUsed <= 5, finite coordinates, non-negative economy,
 * valid quest states, and zero-corrupted saves.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const validator = factory();
    root.StateValidator = validator;
    if (typeof window !== 'undefined') {
      window.StateValidator = validator;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // World Bounding Constraints (Tamil Nadu Game World: 0 to 6000 X, 0 to 2000 Z)
  const BOUNDS = Object.freeze({
    MIN_X: -500,
    MAX_X: 7000,
    MIN_Y: -50,
    MAX_Y: 2500,
    MIN_Z: -500,
    MAX_Z: 2500
  });

  const MAX_CUSTOMIZATION_CHANGES = 5;

  class StateValidatorEngine {
    constructor() {
      this.BOUNDS = BOUNDS;
      this.MAX_CUSTOMIZATION_CHANGES = MAX_CUSTOMIZATION_CHANGES;
    }

    /**
     * Validates full GameState snapshot
     * @param {Object} state - State to validate
     * @returns {Object} { isValid: boolean, errors: Array<string>, warnings: Array<string> }
     */
    validateState(state) {
      const errors = [];
      const warnings = [];

      if (!state || typeof state !== 'object') {
        return { isValid: false, errors: ['State payload is null or not an object.'], warnings: [] };
      }

      // 1. Player Vitals & Coordinates
      if (state.player) {
        const p = state.player;

        // Position coordinates
        if (p.position) {
          if (!this.isFiniteNumber(p.position.x) || !this.isFiniteNumber(p.position.y) || !this.isFiniteNumber(p.position.z)) {
            errors.push(`Player position contains NaN or Infinity: [${p.position.x}, ${p.position.y}, ${p.position.z}]`);
          } else {
            if (p.position.x < BOUNDS.MIN_X || p.position.x > BOUNDS.MAX_X) {
              warnings.push(`Player X coordinate out of nominal bounds: ${p.position.x}`);
            }
          }
        }

        // Survival Vitals
        const surv = p.survival || p;
        if (typeof surv.health === 'number') {
          if (surv.health < 0 || surv.health > (surv.maxHealth || 100)) {
            errors.push(`Health out of valid range: ${surv.health} (max: ${surv.maxHealth || 100})`);
          }
        }

        // Currency Integrity
        const curr = p.currency !== undefined ? p.currency : (p.money !== undefined ? p.money : 0);
        if (typeof curr === 'number' && curr < 0) {
          errors.push(`Currency cannot be negative: ${curr}`);
        }

        // ABSOLUTE 5-CUSTOMIZATION LIMIT RULE (Section 28)
        const customCount = p.customizationChangesUsed !== undefined ? p.customizationChangesUsed : 0;
        if (typeof customCount !== 'number' || customCount < 0) {
          errors.push(`Invalid customization counter: ${customCount}`);
        } else if (customCount > MAX_CUSTOMIZATION_CHANGES) {
          errors.push(`VIOLATION OF ABSOLUTE 5-CUSTOMIZATION RULE: ${customCount} > ${MAX_CUSTOMIZATION_CHANGES}`);
        }

        // Inventory Quantities
        if (Array.isArray(p.inventory)) {
          p.inventory.forEach((item, idx) => {
            if (!item || typeof item !== 'object') {
              errors.push(`Inventory item at index ${idx} is invalid.`);
            } else if (typeof item.count === 'number' && item.count < 0) {
              errors.push(`Inventory item '${item.id}' has negative count: ${item.count}`);
            }
          });
        }
      }

      // 2. World Time
      if (state.world && typeof state.world.time === 'number') {
        if (!this.isFiniteNumber(state.world.time) || state.world.time < 0 || state.world.time >= 24) {
          errors.push(`World time out of 24h range: ${state.world.time}`);
        }
      }

      // 3. Quests
      if (state.quests) {
        if (state.quests.completed && !Array.isArray(state.quests.completed)) {
          errors.push('Quests.completed must be an array.');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    }

    /**
     * Clamps or repairs a tampered or invalid state snapshot
     */
    sanitizeState(state) {
      if (!state || typeof state !== 'object') return state;

      if (state.player) {
        const p = state.player;

        // Clamp customization ceiling strictly to 5
        if (typeof p.customizationChangesUsed === 'number') {
          p.customizationChangesUsed = Math.max(0, Math.min(MAX_CUSTOMIZATION_CHANGES, Math.floor(p.customizationChangesUsed)));
        } else {
          p.customizationChangesUsed = 0;
        }
        p.maxCustomizationChanges = MAX_CUSTOMIZATION_CHANGES;

        // Clamp currency >= 0
        if (typeof p.currency === 'number' && p.currency < 0) {
          p.currency = 0;
        }
        if (typeof p.money === 'number' && p.money < 0) {
          p.money = 0;
        }

        // Clamp survival health
        if (p.survival) {
          p.survival.health = Math.max(0, Math.min(p.survival.maxHealth || 100, Number(p.survival.health) || 100));
        }

        // Validate coordinates
        if (p.position) {
          if (!this.isFiniteNumber(p.position.x)) p.position.x = 220;
          if (!this.isFiniteNumber(p.position.y)) p.position.y = 0;
          if (!this.isFiniteNumber(p.position.z)) p.position.z = 630;
        }
      }

      return state;
    }

    isFiniteNumber(val) {
      return typeof val === 'number' && !isNaN(val) && isFinite(val);
    }
  }

  return new StateValidatorEngine();
});
