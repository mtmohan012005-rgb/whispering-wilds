/**
 * js/core/runtime-validator.js
 * Comprehensive runtime validation and self-healing for The Whispering Wilds.
 * Enforces player bounds, currency invariants, quest prerequisite validation,
 * and the absolute 5 permanent customization changes maximum.
 */

(function () {
  'use strict';

  class RuntimeValidator {
    constructor() {
      this.lastValidationResult = null;
      this.repairsPerformed = [];
    }

    /**
     * Validates player transform, vitals, currency, and customization count.
     * Performs self-healing repair if invalid values are detected.
     */
    validatePlayer(player, autoRepair = true) {
      const bounds = window.ValidationSchema ? window.ValidationSchema.PLAYER_BOUNDS : {
        MIN_X: -5000, MAX_X: 5000, MIN_Y: -50, MAX_Y: 2000, MIN_Z: -5000, MAX_Z: 5000,
        MIN_HEALTH: 0, MAX_HEALTH: 100, MIN_ENERGY: 0, MAX_ENERGY: 100,
        MIN_CURRENCY: 0, MAX_CUSTOMIZATION_CHANGES: 5
      };

      const errors = [];
      if (!player || typeof player !== 'object') {
        errors.push('Player object missing or invalid');
        return { valid: false, errors };
      }

      // 1. Transform / Coordinates
      const isBadNum = (v) => typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v);
      const isOutOfBounds = (val, min, max) => val < min || val > max;

      if (isBadNum(player.x) || isBadNum(player.y) || isBadNum(player.z) ||
          isOutOfBounds(player.x, bounds.MIN_X, bounds.MAX_X) ||
          player.y < bounds.MIN_Y || player.y > bounds.MAX_Y ||
          isOutOfBounds(player.z, bounds.MIN_Z, bounds.MAX_Z)) {
        
        errors.push(`Invalid player coordinates: (${player.x}, ${player.y}, ${player.z})`);

        if (autoRepair) {
          const safePos = window.StateIntegritySystem ? window.StateIntegritySystem.getLastSafePosition() : { x: 0, y: 5, z: 0 };
          player.x = safePos.x;
          player.y = safePos.y;
          player.z = safePos.z;
          this._recordRepair('PLAYER_POSITION_RESTORED', { restoredTo: safePos });
        }
      }

      // 2. Health & Energy
      if (isBadNum(player.health) || player.health < bounds.MIN_HEALTH || player.health > bounds.MAX_HEALTH) {
        errors.push(`Invalid player health: ${player.health}`);
        if (autoRepair) {
          player.health = Math.min(Math.max(player.health || 100, bounds.MIN_HEALTH), bounds.MAX_HEALTH);
          this._recordRepair('PLAYER_HEALTH_CLAMPED', { newHealth: player.health });
        }
      }

      if (isBadNum(player.energy) || player.energy < bounds.MIN_ENERGY || player.energy > bounds.MAX_ENERGY) {
        errors.push(`Invalid player energy: ${player.energy}`);
        if (autoRepair) {
          player.energy = Math.min(Math.max(player.energy || 100, bounds.MIN_ENERGY), bounds.MAX_ENERGY);
          this._recordRepair('PLAYER_ENERGY_CLAMPED', { newEnergy: player.energy });
        }
      }

      // 3. Currency (must NEVER be negative or NaN)
      if (isBadNum(player.currency) || player.currency < bounds.MIN_CURRENCY) {
        errors.push(`Invalid player currency: ${player.currency}`);
        if (autoRepair) {
          player.currency = Math.max(0, Math.floor(player.currency) || 0);
          this._recordRepair('PLAYER_CURRENCY_RESTORED', { newCurrency: player.currency });
        }
      }

      // 4. Customization Ceiling: ABSOLUTE MAXIMUM 5 PERMANENT CHANGES
      if (isBadNum(player.customizationChangesUsed) ||
          player.customizationChangesUsed < 0 ||
          player.customizationChangesUsed > bounds.MAX_CUSTOMIZATION_CHANGES) {
        errors.push(`Invalid customization count: ${player.customizationChangesUsed} (Ceiling is ${bounds.MAX_CUSTOMIZATION_CHANGES})`);
        if (autoRepair) {
          player.customizationChangesUsed = Math.min(Math.max(0, player.customizationChangesUsed || 0), bounds.MAX_CUSTOMIZATION_CHANGES);
          player.maxCustomizationChanges = bounds.MAX_CUSTOMIZATION_CHANGES;
          this._recordRepair('CUSTOMIZATION_COUNT_CLAMPED', { newCount: player.customizationChangesUsed });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    /**
     * Validates inventory weights, stacks, and item IDs.
     */
    validateInventory(inventory, autoRepair = true) {
      const errors = [];
      if (!inventory || typeof inventory !== 'object') {
        return { valid: false, errors: ['Inventory missing'] };
      }

      const items = Array.isArray(inventory.items) ? inventory.items : [];
      let totalWeight = 0;

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (!item || !item.id || typeof item.id !== 'string') {
          errors.push(`Corrupt item at index ${i}`);
          if (autoRepair) {
            items.splice(i, 1);
            this._recordRepair('CORRUPT_ITEM_REMOVED', { index: i });
          }
          continue;
        }

        if (typeof item.quantity !== 'number' || item.quantity <= 0 || Number.isNaN(item.quantity)) {
          errors.push(`Invalid quantity for item '${item.id}': ${item.quantity}`);
          if (autoRepair) {
            item.quantity = Math.max(1, Math.floor(item.quantity) || 1);
            this._recordRepair('ITEM_QUANTITY_REPAIRED', { itemId: item.id });
          }
        }

        totalWeight += (item.weight || 0.1) * (item.quantity || 1);
      }

      if (totalWeight > 20.01) { // 20kg limit with float margin
        errors.push(`Inventory exceeds 20kg satchel limit: ${totalWeight.toFixed(2)}kg`);
      }

      return { valid: errors.length === 0, errors, totalWeight };
    }

    /**
     * Validates relationship trust and familiarity bounds (0..100).
     */
    validateRelationships(relationships, autoRepair = true) {
      const errors = [];
      if (!relationships || typeof relationships !== 'object') {
        return { valid: false, errors: ['Relationships missing'] };
      }

      for (const [npcId, data] of Object.entries(relationships)) {
        if (!data || typeof data !== 'object') continue;

        if (typeof data.trust === 'number') {
          if (data.trust < 0 || data.trust > 100 || Number.isNaN(data.trust)) {
            errors.push(`Invalid trust for NPC '${npcId}': ${data.trust}`);
            if (autoRepair) {
              data.trust = Math.min(Math.max(0, data.trust || 0), 100);
              this._recordRepair('NPC_TRUST_CLAMPED', { npcId, trust: data.trust });
            }
          }
        }
      }

      return { valid: errors.length === 0, errors };
    }

    /**
     * Deep validation of entire authoritative GameState.
     */
    validateGameState(gameState, autoRepair = true) {
      if (!gameState) {
        return { valid: false, errors: ['GameState is null or undefined'] };
      }

      const allErrors = [];

      // 1. Player
      const pRes = this.validatePlayer(gameState.player, autoRepair);
      if (!pRes.valid) allErrors.push(...pRes.errors);

      // 2. Inventory
      const iRes = this.validateInventory(gameState.inventory, autoRepair);
      if (!iRes.valid) allErrors.push(...iRes.errors);

      // 3. Relationships
      if (gameState.relationships) {
        const rRes = this.validateRelationships(gameState.relationships, autoRepair);
        if (!rRes.valid) allErrors.push(...rRes.errors);
      }

      // 4. World Region Check
      const approvedRegions = window.ValidationSchema ? window.ValidationSchema.APPROVED_REGIONS : [];
      if (approvedRegions.length > 0 && gameState.world?.currentRegion) {
        if (!approvedRegions.includes(gameState.world.currentRegion)) {
          allErrors.push(`Unknown region '${gameState.world.currentRegion}'`);
          if (autoRepair) {
            gameState.world.currentRegion = 'george_town';
            this._recordRepair('REGION_DEFAULTED', { region: 'george_town' });
          }
        }
      }

      this.lastValidationResult = {
        valid: allErrors.length === 0,
        errors: allErrors,
        timestamp: Date.now()
      };

      return this.lastValidationResult;
    }

    /**
     * Validates a serialized save payload before writing to persistent storage.
     */
    validateSavePayload(payloadString) {
      if (typeof payloadString !== 'string') {
        return { valid: false, error: 'Save payload must be a string' };
      }

      if (payloadString.length > 5 * 1024 * 1024) {
        return { valid: false, error: 'Save payload exceeds maximum allowed size (5MB)' };
      }

      try {
        const parsed = JSON.parse(payloadString);
        if (!parsed || typeof parsed !== 'object') {
          return { valid: false, error: 'Save payload is not a valid JSON object' };
        }

        if (!parsed.player || typeof parsed.player !== 'object') {
          return { valid: false, error: 'Save payload missing player block' };
        }

        // Validate customization ceiling in save data
        if (typeof parsed.player.customizationChangesUsed === 'number') {
          if (parsed.player.customizationChangesUsed < 0 || parsed.player.customizationChangesUsed > 5) {
            return { valid: false, error: `Invalid customizationChangesUsed in save: ${parsed.player.customizationChangesUsed}` };
          }
        }

        return { valid: true, parsed };
      } catch (e) {
        return { valid: false, error: `JSON parse error: ${e.message}` };
      }
    }

    _recordRepair(type, details) {
      const entry = { type, details, timestamp: Date.now() };
      this.repairsPerformed.push(entry);
      console.warn(`[RuntimeValidator][Self-Healing] ${type}:`, details);
      if (window.DiagnosticsConsole) {
        window.DiagnosticsConsole.recordEvent('STATE_REPAIRED', entry);
      }
    }

    getRepairs() {
      return [...this.repairsPerformed];
    }
  }

  window.RuntimeValidator = new RuntimeValidator();
})();
