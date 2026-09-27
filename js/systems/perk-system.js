// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLAYER PERK SYSTEM
// Resolves earned perk identifiers into concrete gameplay modifiers and
// exposes them as a single read-only surface for survival, traversal,
// vegetation and discovery systems.
// ============================================================================

(function () {
  'use strict';

  class PerkSystem {
    constructor(data, earnedPerks) {
      this.data = data || window.PERK_DATA || null;
      this.earnedPerks = Array.isArray(earnedPerks) ? [...earnedPerks] : [];
      this._cache = null;
      this._listeners = { perkAwarded: [], perksChanged: [] };
    }

    /** Adopts the perk list owned by NewGamePlusSystem, if present. */
    adoptEarnedPerks(earnedPerks) {
      if (!Array.isArray(earnedPerks)) return false;
      this.earnedPerks = [...earnedPerks];
      this.invalidate();
      return true;
    }

    has(perkId) {
      return this.earnedPerks.indexOf(perkId) !== -1;
    }

    hasPerk(perkId) {
      return this.has(perkId);
    }

    listEarned() {
      return [...this.earnedPerks];
    }

    listAll() {
      const perks = this.data && this.data.perks;
      if (!perks) return [];
      return Object.keys(perks).map((id) => perks[id]);
    }

    getPerk(perkId) {
      const perks = this.data && this.data.perks;
      return (perks && perks[perkId]) || null;
    }

    award(perkId) {
      if (!this.getPerk(perkId)) {
        console.warn(`[PerkSystem] Unknown perk "${perkId}" ignored.`);
        return false;
      }
      if (this.has(perkId)) return false;
      this.earnedPerks.push(perkId);
      this.invalidate();
      this._emit('perkAwarded', { perkId, perk: this.getPerk(perkId) });
      this._emit('perksChanged', { earnedPerks: this.listEarned(), added: perkId });
      return true;
    }

    revoke(perkId) {
      const index = this.earnedPerks.indexOf(perkId);
      if (index === -1) return false;
      this.earnedPerks.splice(index, 1);
      this.invalidate();
      this._emit('perksChanged', { earnedPerks: this.listEarned(), added: null });
      return true;
    }

    invalidate() {
      this._cache = null;
    }

    /** Resolves every modifier into a flat object, cached until invalidated. */
    getModifiers() {
      if (this._cache) return this._cache;

      const data = this.data;
      const resolved = {};
      if (!data) {
        this._cache = resolved;
        return resolved;
      }

      const defaults = data.modifierDefaults || {};
      for (const key of data.multiplicativeModifiers || []) resolved[key] = defaults[key] !== undefined ? defaults[key] : 1.0;
      for (const key of data.additiveModifiers || []) resolved[key] = defaults[key] !== undefined ? defaults[key] : 0;

      const perks = data.perks || {};
      for (const perkId of this.earnedPerks) {
        const perk = perks[perkId];
        if (!perk || !perk.effects) continue;
        for (const key of Object.keys(perk.effects)) {
          const value = perk.effects[key];
          if (resolved[key] === undefined) resolved[key] = value;
          else if ((data.multiplicativeModifiers || []).indexOf(key) !== -1) resolved[key] *= value;
          else resolved[key] += value;
        }
      }

      // Guard rails so a malformed perk table can never invert or negate a cost.
      if (resolved.staminaDrainMultiplier !== undefined) {
        resolved.staminaDrainMultiplier = Math.max(0.1, Math.min(2.0, resolved.staminaDrainMultiplier));
      }
      if (resolved.staminaRecoveryMultiplier !== undefined) {
        resolved.staminaRecoveryMultiplier = Math.max(0.1, Math.min(3.0, resolved.staminaRecoveryMultiplier));
      }
      if (resolved.vegetationSpeedMultiplier !== undefined) {
        resolved.vegetationSpeedMultiplier = Math.max(0.1, Math.min(3.0, resolved.vegetationSpeedMultiplier));
      }

      this._cache = resolved;
      return resolved;
    }

    getModifier(key, fallback) {
      const mods = this.getModifiers();
      if (mods[key] !== undefined) return mods[key];
      return fallback !== undefined ? fallback : 0;
    }

    staminaDrainMultiplier() { return this.getModifier('staminaDrainMultiplier', 1.0); }
    staminaRecoveryMultiplier() { return this.getModifier('staminaRecoveryMultiplier', 1.0); }
    vegetationSpeedMultiplier() { return this.getModifier('vegetationSpeedMultiplier', 1.0); }
    clueYieldBonus() { return Math.floor(this.getModifier('clueYieldBonus', 0)); }
    codexRevealBonus() { return Math.floor(this.getModifier('codexRevealBonus', 0)); }
    photoSuccessBonus() { return this.getModifier('photoSuccessBonus', 0); }
    wildlifeApproachBonus() { return this.getModifier('wildlifeApproachBonus', 0); }

    addEventListener(event, callback) {
      if (this._listeners[event]) this._listeners[event].push(callback);
    }

    _emit(event, payload) {
      const handlers = this._listeners[event] || [];
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[PerkSystem] Listener for "${event}" threw:`, err);
        }
      }
    }

    serialize() {
      return [...this.earnedPerks];
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerkSystem;
  } else {
    window.PerkSystem = PerkSystem;
    // Self-instantiating singleton. Consumers such as TraversalSystem read
    // window.perkSystem during their own update loop, which may run before any
    // explicit construction, so the instance is created at load time.
    if (!window.perkSystem) {
      window.perkSystem = new PerkSystem(window.PERK_DATA || null, null);
    }
  }
})();
