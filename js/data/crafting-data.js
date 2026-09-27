// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CRAFTING DATA
// Regional survival crafting: raw materials gathered from each biome combine
// into tools, equipment, and vital-restoring poultices.
//
// Recipe shape:
//   id, name, tamilName, description,
//   category: 'tool' | 'equipment' | 'vital',
//   ingredients: [{ itemId, quantity }],
//   result:     { itemId, quantity },
//   effects:    applied while the crafted item is carried
//
// Items are registered into ContentRegistry so content-validator's
// _validateItems (weight/value) and _validateIds actually have input to check.
// ============================================================================

(function () {
  'use strict';

  // ---- Raw materials -------------------------------------------------------
  // biome marks where the material is gathered, for later harvest wiring.
  const ITEMS = {
    bamboo_stem: {
      id: 'bamboo_stem',
      name: 'Bamboo Stem',
      tamilName: 'மூங்குத் தண்டு',
      description: 'A cut length of green bamboo, light and hollow. Gathers in the delta and village scrub.',
      category: 'material',
      weight: 0.6,
      value: 4,
      biome: 'cauvery_delta',
      icon: '🎋'
    },
    palm_frond: {
      id: 'palm_frond',
      name: 'Palmyra Frond',
      tamilName: 'பனை ஓலை',
      description: 'A fan of stiff palmyra leaflets. Stripped from the panai maram of the red-soil plains.',
      category: 'material',
      weight: 0.4,
      value: 3,
      biome: 'chennai',
      icon: '🌴'
    },
    nilgiri_herb: {
      id: 'nilgiri_herb',
      name: 'Nilgiri Medicinal Herb',
      tamilName: 'நீலகிரி மூலி',
      description: 'A high-altitude alpine herb bundle, bitter to the tongue and prized in the shola for poultices.',
      category: 'material',
      weight: 0.1,
      value: 12,
      biome: 'nilgiris',
      icon: '🌿'
    },
    chola_granite_shard: {
      id: 'chola_granite_shard',
      name: 'Chola Granite Shard',
      tamilName: 'சோழர் கற்கட்டுப் பாளம்',
      description: 'A worked shard of the pink granite quarried for the Chola hydraulic works. Strikes true and heavy.',
      category: 'material',
      weight: 2.4,
      value: 15,
      biome: 'thanjavur',
      icon: '🪨'
    },

    // ---- Crafted: tools ----------------------------------------------------
    bamboo_torch: {
      id: 'bamboo_torch',
      name: 'Bamboo Torch',
      tamilName: 'மூங்கில் தீப்பந்தம்',
      description: 'Resin-soaked bamboo in a palm-frond wrap. Burns steady and throws light far enough to read a trail by.',
      category: 'tool',
      weight: 1.2,
      value: 28,
      icon: '🔥'
    },
    palm_leaf_umbrella: {
      id: 'palm_leaf_umbrella',
      name: 'Palm Leaf Umbrella',
      tamilName: 'பனை ஓலை குடை',
      description: 'A layered palmyra-leaf canopy on a bamboo shaft. Keeps the monsoon off you and your fire from going out.',
      category: 'equipment',
      weight: 1.5,
      value: 34,
      icon: '☂️'
    },
    chola_stone_axe: {
      id: 'chola_stone_axe',
      name: 'Chola Stone Axe',
      tamilName: 'சோழர் கல் கோடாரி',
      description: 'A Chola-quarried granite blade lashed to a bamboo haft. Heavy, unglamorous, and it never chips.',
      category: 'tool',
      weight: 3.8,
      value: 62,
      icon: '🪓'
    },

    // ---- Crafted: vital ----------------------------------------------------
    nilgiri_herbal_poultice: {
      id: 'nilgiri_herbal_poultice',
      name: 'Nilgiri Herbal Poultice',
      tamilName: 'மலை மூலிகை மருந்து',
      description: 'Crushed alpine herbs bound in palm fibre. The remedy the shola trackers carry for fever and frostbite.',
      category: 'vital',
      weight: 0.3,
      value: 40,
      icon: '🧪'
    }
  };

  // ---- Recipes -------------------------------------------------------------
  const RECIPES = {
    bamboo_torch: {
      id: 'bamboo_torch',
      name: 'Bamboo Torch',
      tamilName: 'மூங்கில் தீப்பந்தம்',
      description: 'Wrap resin-slick palm fibre around a cut bamboo shaft and it will burn for hours.',
      category: 'tool',
      ingredients: [
        { itemId: 'bamboo_stem', quantity: 1 },
        { itemId: 'palm_frond', quantity: 2 }
      ],
      result: { itemId: 'bamboo_torch', quantity: 1 },
      effects: {
        // Extra radius/intensity on the player's carried light at night.
        nightLightBonus: 1.0
      }
    },

    palm_leaf_umbrella: {
      id: 'palm_leaf_umbrella',
      name: 'Palm Leaf Umbrella',
      tamilName: 'பனை ஓலை குடை',
      description: 'Layer palmyra leaflets over a split bamboo frame until the rain runs off the edges.',
      category: 'equipment',
      ingredients: [
        { itemId: 'palm_frond', quantity: 4 },
        { itemId: 'bamboo_stem', quantity: 2 }
      ],
      result: { itemId: 'palm_leaf_umbrella', quantity: 1 },
      effects: {
        // Multiplier on wetness gain. 0.35 = you soak 65% slower.
        wetnessGainMultiplier: 0.35,
        rainShelter: true
      }
    },

    nilgiri_herbal_poultice: {
      id: 'nilgiri_herbal_poultice',
      name: 'Nilgiri Herbal Poultice',
      tamilName: 'மலை மூலிகை மருந்து',
      description: 'Crush the alpine herb with a little water and press it to the affected place.',
      category: 'vital',
      ingredients: [
        { itemId: 'nilgiri_herb', quantity: 3 },
        { itemId: 'palm_frond', quantity: 1 }
      ],
      result: { itemId: 'nilgiri_herbal_poultice', quantity: 2 },
      effects: {
        // Applied on use, not passively.
        consumable: true,
        restore: { health: 25, warmth: 30, hydration: 10 }
      }
    },

    chola_stone_axe: {
      id: 'chola_stone_axe',
      name: 'Chola Stone Axe',
      tamilName: 'சோழர் கல் கோடாரி',
      description: 'Knock a wedge from a granite block and lash it to a haft. The old quarrymen did exactly this.',
      category: 'tool',
      ingredients: [
        { itemId: 'chola_granite_shard', quantity: 2 },
        { itemId: 'bamboo_stem', quantity: 1 }
      ],
      result: { itemId: 'chola_stone_axe', quantity: 1 },
      effects: {
        gatheringYieldBonus: 0.25
      }
    }
  };

  const CRAFTING_DATA = {
    items: ITEMS,
    recipes: RECIPES,
    categories: ['tool', 'equipment', 'vital'],
    // Applied only while the player is in rain/water exposure.
    effectDefaults: {
      wetnessGainMultiplier: 1.0,
      nightLightBonus: 0.0,
      gatheringYieldBonus: 0.0,
      rainShelter: false
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CRAFTING_DATA;
  }

  if (typeof window !== 'undefined') {
    window.CRAFTING_DATA = CRAFTING_DATA;

    // Register into the content registry so the existing validator has real
    // input. Previously ContentRegistry had no 'item' or 'crafting' entries at
    // all, so content-validator's _validateItems iterated an empty list.
    const registry = window.ContentRegistry;
    if (registry && typeof registry.registerBatch === 'function') {
      try {
        registry.registerBatch('item', Object.keys(ITEMS).map((k) => ITEMS[k]));
        // ContentRegistry enforces globally unique IDs across every type, and a
        // recipe's canonical id IS the id of the item it produces. So the
        // registry copy gets a 'recipe_' prefix to avoid colliding with the
        // item store; RECIPES itself keeps the item id so item -> recipe
        // lookups (getActiveEffects, useItem) stay a direct map hit.
        registry.registerBatch(
          'crafting',
          Object.keys(RECIPES).map((k) =>
            Object.assign({}, RECIPES[k], { id: 'recipe_' + RECIPES[k].id })
          )
        );
      } catch (err) {
        console.warn('[CraftingData] Registry registration failed:', err);
      }
    }
  }
})();
