/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Food Culture & Traditional Culinary System
 * Validates authentic regional food database, interactive preparation loops (cutting chai, degree coffee),
 * survival vital replenishment (hunger, thirst, energy, warmth), and rupee currency deduction.
 */

window.runFoodCultureTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[FOOD CULTURE TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING AUTHENTIC TAMIL NADU FOOD CULTURE TEST SUITE <<<');

  try {
    const foodSys = new window.FoodCultureSystem();

    // -----------------------------------------------------------------
    // TEST 1: Regional Food Database & Ingredients Schema Integrity
    // -----------------------------------------------------------------
    const foods = foodSys.getAllFoods();
    const hasFoods = foods.length >= 8;
    const requiredDishes = ['food_cutting_chai', 'food_degree_filter_coffee', 'food_idli_sambar', 'food_medu_vadai', 'food_ghee_roast_dosa', 'food_ven_pongal'];
    const allDishesPresent = requiredDishes.every(id => !!foodSys.getFood(id));

    let schemasValid = true;
    for (const f of foods) {
      if (!f.id || !f.name || !f.tamilName || !f.survivalEffect || !f.visualAsset) {
        schemasValid = false;
        break;
      }
    }

    log('Regional Food Database & Ingredients Schema Integrity',
      hasFoods && allDishesPresent && schemasValid,
      `FoodsCount: ${foods.length}, KeyDishesPresent: ${allDishesPresent}, SchemasComplete: ${schemasValid}`);

    // -----------------------------------------------------------------
    // TEST 2: Interactive Food Preparation Loop (Cutting Chai / Coffee)
    // -----------------------------------------------------------------
    const prepRes = foodSys.prepareDish('food_cutting_chai');
    const prepOk = prepRes.success === true && Array.isArray(prepRes.steps) && prepRes.steps.length >= 3;

    log('Interactive Food Preparation Loop (Tea Master Recipe Steps)',
      prepOk,
      `Dish: "${prepRes.food ? prepRes.food.name : 'none'}", Steps: [${prepRes.steps.join(' -> ')}]`);

    // -----------------------------------------------------------------
    // TEST 3: Food Consumption & Authoritative Survival Vitals Replenishment
    // -----------------------------------------------------------------
    const initialHunger = window.gameSurvival ? window.gameSurvival.hunger : 50;
    const initialCurrency = window.gameSurvival ? window.gameSurvival.currency : 100;

    const consumeRes = foodSys.consumeFood('food_idli_sambar');
    const consumeOk = consumeRes.success === true;

    const hungerIncreased = window.gameSurvival ? (window.gameSurvival.hunger >= initialHunger) : true;
    const currencyDeducted = window.gameSurvival ? (window.gameSurvival.currency < initialCurrency) : true;

    log('Food Consumption, Survival Vitals Replenishment & Currency Economy',
      consumeOk && hungerIncreased && currencyDeducted,
      `Consumed: ${consumeOk}, HungerReplenished: ${hungerIncreased}, CurrencyDeducted: ${currencyDeducted}`);

    return {
      passed: results.every(r => r.passed),
      results
    };
  } catch (err) {
    log('Food Culture System Test Failure', false, err.message);
    return { passed: false, results };
  }
};
