/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Food Culture & Traditional Culinary System (FoodCultureSystem)
 * Manages authentic regional food database, interactive preparation loops (cutting chai, degree coffee),
 * survival vital replenishment (hunger, thirst, energy, core warmth), and 3D prop links.
 */

class FoodCultureSystem {
  constructor() {
    this.foods = new Map();

    if (typeof window.FOOD_CULTURE_DATA !== 'undefined') {
      for (const item of window.FOOD_CULTURE_DATA) {
        this.foods.set(item.id, item);
      }
    }
  }

  getFood(id) {
    return this.foods.get(id) || null;
  }

  getAllFoods() {
    return Array.from(this.foods.values());
  }

  /**
   * Prepares and serves an interactive dish (e.g. tea kadai cutting chai)
   */
  prepareDish(foodId) {
    const food = this.getFood(foodId);
    if (!food) return { success: false, message: 'Dish recipe not found' };

    // Play preparation audio if available
    if (food.audioHooks && food.audioHooks.brew && window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('tea_preparation', null, 1.0);
    }

    return {
      success: true,
      food: food,
      steps: food.interactiveRecipe ? food.interactiveRecipe.steps : ['prepare', 'serve']
    };
  }

  /**
   * Orders/purchases and consumes food item from a vendor stall
   */
  orderFoodItem(foodId) {
    if (foodId === 'kumbakonam_degree_coffee' && !this.getFood(foodId)) {
      const existing = this.getFood('food_degree_filter_coffee');
      if (existing) {
        return this.consumeFood('food_degree_filter_coffee');
      }
    }
    return this.consumeFood(foodId);
  }

  /**
   * Consumes food item, applying authoritative survival stats and currency deduction
   */
  consumeFood(foodId) {
    const food = this.getFood(foodId);
    if (!food) return { success: false, message: 'Unknown food item' };

    const cost = food.costRupees || 0;
    if (cost > 0) {
      if (window.GameState && typeof window.GameState.deductCurrency === 'function') {
        if (!window.GameState.deductCurrency(cost)) {
          return { success: false, message: `Insufficient rupees (Requires ₹${cost}, has ₹${window.GameState.player.currency})` };
        }
      } else if (window.gameSurvival) {
        if (window.gameSurvival.currency < cost) {
          return { success: false, message: `Insufficient rupees (Requires ₹${cost}, has ₹${window.gameSurvival.currency})` };
        }
        window.gameSurvival.currency -= cost;
      }
    }

    const survival = window.gameSurvival;
    if (survival) {

      const eff = food.survivalEffect || {};
      if (eff.hunger) {
        survival.hunger = Math.min(100, Math.max(0, survival.hunger + eff.hunger));
      }
      if (eff.thirst) {
        survival.thirst = Math.min(100, Math.max(0, survival.thirst + eff.thirst));
      }
      if (eff.energy) {
        survival.energy = Math.min(100, Math.max(0, survival.energy + eff.energy));
      }
      if (eff.warmth && survival.coreTemp) {
        survival.coreTemp = Math.min(37.5, Math.max(35.0, survival.coreTemp + eff.warmth));
      }
    }

    // Play consumption sound
    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('food_consume', null, 0.9);
    }

    // Add journal discovery if special feast
    if (food.mealType === 'grand_feast' || food.mealType === 'festival_sweet') {
      if (window.culturalLifeSystem) {
        window.culturalLifeSystem.recordCulturalDiscovery({
          id: food.id,
          name: food.name,
          tamilName: food.tamilName,
          region: food.region,
          lore: food.description
        });
      }
    }

    return {
      success: true,
      food: food,
      vitals: survival ? { hunger: survival.hunger, thirst: survival.thirst, energy: survival.energy, coreTemp: survival.coreTemp } : null
    };
  }
}

window.FoodCultureSystem = FoodCultureSystem;
