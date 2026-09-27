// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CRAFTING SYSTEM
// Data-driven regional crafting. Reads js/data/crafting-data.js.
//
// Inventory contract (js/core/game-state.js):
//   addInventoryItem(item)  - enforces the 20kg satchel cap, returns false if over
//   removeInventoryItem(id,n)- splits stacks, but SILENTLY removes the whole
//                              stack if you ask for more than you hold
// Both of those mean crafting must verify counts and capacity itself, and must
// roll back if the result cannot be added.
// ============================================================================

(function () {
  'use strict';

  const DATA = (typeof window !== 'undefined' && window.CRAFTING_DATA) || {};
  const RECIPES = DATA.recipes || {};
  const ITEMS = DATA.items || {};
  const DEFAULTS = DATA.effectDefaults || {};

  const MAX_SATCHEL_KG = 20.0;

  function state() {
    return typeof window !== 'undefined' ? window.GameState : null;
  }

  const CraftingSystem = {
    MAX_SATCHEL_KG,

    // ---- Queries -----------------------------------------------------------

    getRecipes() {
      return Object.keys(RECIPES).map((id) => RECIPES[id]);
    },

    getRecipe(recipeId) {
      return RECIPES[recipeId] || null;
    },

    getItem(itemId) {
      return ITEMS[itemId] || null;
    },

    /** Total units of an item held, summed across every stack. */
    countItem(itemId) {
      const gs = state();
      if (!gs || !Array.isArray(gs.player.inventory)) return 0;
      return gs.player.inventory.reduce(
        (sum, stack) => (stack && stack.id === itemId ? sum + (stack.count || 1) : sum),
        0
      );
    },

    /** { ok, reason, missing:[{itemId, required, held}] } */
    checkIngredients(recipe) {
      const missing = [];
      for (const ing of recipe.ingredients || []) {
        const held = this.countItem(ing.itemId);
        if (held < ing.quantity) {
          missing.push({
            itemId: ing.itemId,
            name: (ITEMS[ing.itemId] || {}).name || ing.itemId,
            required: ing.quantity,
            held
          });
        }
      }
      return missing.length === 0
        ? { ok: true, reason: null, missing: [] }
        : { ok: false, reason: 'MISSING_INGREDIENTS', missing };
    },

    /** Full craftability: has ingredients AND the result will fit in the satchel. */
    canCraft(recipeId) {
      const recipe = RECIPES[recipeId];
      if (!recipe) return { ok: false, reason: 'UNKNOWN_RECIPE', missing: [] };

      const ing = this.checkIngredients(recipe);
      if (!ing.ok) return ing;

      const gs = state();
      if (!gs) return { ok: false, reason: 'NO_GAME_STATE', missing: [] };

      const def = ITEMS[recipe.result.itemId] || {};
      const resultWeight = (def.weight || 0.2) * recipe.result.quantity;
      const carried = gs.getTotalInventoryWeight
        ? gs.getTotalInventoryWeight()
        : 0;

      // Crafted items are usually unique, so only check capacity when the
      // result is not already stacked. Stacking an existing item adds weight too.
      if (carried + resultWeight > MAX_SATCHEL_KG) {
        return {
          ok: false,
          reason: 'SATCHEL_FULL',
          missing: [],
          detail: `Needs ${resultWeight.toFixed(1)}kg, ${(MAX_SATCHEL_KG - carried).toFixed(1)}kg free`
        };
      }

      return { ok: true, reason: null, missing: [] };
    },

    // ---- Crafting ----------------------------------------------------------

    /**
     * Atomically consumes ingredients and grants the result.
     * Rolls back the ingredients if the result cannot be added.
     */
    craft(recipeId) {
      const recipe = RECIPES[recipeId];
      if (!recipe) {
        return { ok: false, reason: 'UNKNOWN_RECIPE' };
      }

      const gs = state();
      if (!gs) return { ok: false, reason: 'NO_GAME_STATE' };

      const check = this.canCraft(recipeId);
      if (!check.ok) return check;

      // Snapshot for rollback before we touch anything.
      const snapshot = gs.player.inventory.map((s) => ({ ...s }));

      for (const ing of recipe.ingredients || []) {
        const removed = gs.removeInventoryItem(ing.itemId, ing.quantity);
        if (!removed) {
          // Should be unreachable given canCraft(), but never leave the player
          // half-crafting.
          this._restore(gs, snapshot);
          return { ok: false, reason: 'REMOVE_FAILED', itemId: ing.itemId };
        }
      }

      const def = ITEMS[recipe.result.itemId] || {};
      const added = gs.addInventoryItem({
        id: recipe.result.itemId,
        name: def.name || recipe.result.itemId,
        tamilName: def.tamilName || '',
        weight: def.weight,
        value: def.value,
        icon: def.icon,
        category: def.category,
        count: recipe.result.quantity
      });

      if (!added) {
        this._restore(gs, snapshot);
        return { ok: false, reason: 'SATCHEL_FULL' };
      }

      if (typeof gs.emit === 'function') {
        gs.emit('craftingCrafted', { recipeId, result: recipe.result });
      }

      return {
        ok: true,
        reason: null,
        recipe,
        result: recipe.result,
        itemName: def.name || recipe.result.itemId
      };
    },

    _restore(gs, snapshot) {
      gs.player.inventory = snapshot.map((s) => ({ ...s }));
      if (typeof gs.emit === 'function') {
        gs.emit('inventoryChanged', gs.player.inventory);
      }
    },

    // ---- Effects -----------------------------------------------------------

    /**
     * Aggregate effects of every crafted tool/equipment currently carried.
     * Multipliers stack conservatively (best value wins) rather than
     * compounding, so two umbrellas do not become a 0.12x soak rate.
     */
    getActiveEffects() {
      const out = {
        wetnessGainMultiplier: DEFAULTS.wetnessGainMultiplier != null
          ? DEFAULTS.wetnessGainMultiplier
          : 1.0,
        nightLightBonus: DEFAULTS.nightLightBonus || 0.0,
        gatheringYieldBonus: DEFAULTS.gatheringYieldBonus || 0.0,
        rainShelter: DEFAULTS.rainShelter || false
      };

      const gs = state();
      if (!gs || !Array.isArray(gs.player.inventory)) return out;

      for (const stack of gs.player.inventory) {
        if (!stack || stack.id === undefined) continue;
        const def = ITEMS[stack.id];
        if (!def) continue;
        const recipe = RECIPES[stack.id];
        if (!recipe || !recipe.effects) continue;

        const e = recipe.effects;
        if (typeof e.wetnessGainMultiplier === 'number') {
          out.wetnessGainMultiplier = Math.min(
            out.wetnessGainMultiplier,
            e.wetnessGainMultiplier
          );
        }
        if (typeof e.nightLightBonus === 'number') {
          out.nightLightBonus = Math.max(out.nightLightBonus, e.nightLightBonus);
        }
        if (typeof e.gatheringYieldBonus === 'number') {
          out.gatheringYieldBonus = Math.max(
            out.gatheringYieldBonus,
            e.gatheringYieldBonus
          );
        }
        if (e.rainShelter) out.rainShelter = true;
      }

      return out;
    },

    /** True if the player is carrying at least one umbrella. */
    hasRainShelter() {
      return this.getActiveEffects().rainShelter === true;
    },

    // ---- Consumables -------------------------------------------------------

    /**
     * Use a consumable crafted item (e.g. the poultice): applies its restore
     * values to the player, then consumes one from the satchel.
     */
    useItem(itemId) {
      const gs = state();
      if (!gs) return { ok: false, reason: 'NO_GAME_STATE' };

      const recipe = RECIPES[itemId];
      if (!recipe || !recipe.effects || !recipe.effects.consumable) {
        return { ok: false, reason: 'NOT_CONSUMABLE' };
      }
      if (this.countItem(itemId) < 1) {
        return { ok: false, reason: 'NOT_HELD' };
      }

      const restore = recipe.effects.restore || {};
      const survival = (gs.player && gs.player.survival) || {};
      const applied = {};

      for (const key of Object.keys(restore)) {
        if (typeof survival[key] !== 'number') continue;
        const max = key === 'coreTemp' ? 100 : 100;
        const before = survival[key];
        survival[key] = Math.max(0, Math.min(max, before + restore[key]));
        applied[key] = { before, after: survival[key] };
      }

      if (typeof gs.emit === 'function') {
        gs.emit('vitalsChanged', survival);
      }

      gs.removeInventoryItem(itemId, 1);

      return { ok: true, reason: null, applied, itemId };
    }
  };

  if (typeof window !== 'undefined') {
    window.CraftingSystem = CraftingSystem;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraftingSystem;
  }
})();
