/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Authentic Tamil Nadu Food Culture Data
 * Database of regional dishes, survival effects, preparation recipes,
 * local 3D assets, and diegetic food culture rituals.
 */

window.FOOD_CULTURE_DATA = [
  {
    id: 'food_cutting_chai',
    name: 'Roadside Cutting Chai',
    tamilName: 'சுடச்சுட கட்டிங் டீ',
    region: 'GEORGE_TOWN',
    mealType: 'beverage',
    description: 'Strong Assam black dust brewed with crushed green cardamom, fresh ginger, thick whole buffalo milk, and unrefined cane sugar. Poured high to create frothy head.',
    ingredients: ['black_tea_dust', 'cardamom', 'fresh_ginger', 'buffalo_milk', 'sugar'],
    visualAsset: 'assets/props/food/tea_glass.glb',
    audioHooks: { brew: 'tea_boiling_pot', pour: 'tea_high_pour', sip: 'tea_hot_sip' },
    survivalEffect: { hunger: 5, thirst: 15, energy: 25, warmth: 2.0 },
    costRupees: 12,
    interactiveRecipe: {
      steps: ['boil_water_spices', 'add_tea_dust', 'pour_milk', 'strain_high_pour'],
      difficulty: 'simple'
    }
  },
  {
    id: 'food_degree_filter_coffee',
    name: 'Thanjavur Degree Filter Coffee',
    tamilName: 'தஞ்சாவூர் டிகிரி பில்டர் காபி',
    region: 'THANJAVUR',
    mealType: 'beverage',
    description: 'Dark roasted plantation Arabica and Peaberry beans freshly ground with 15% chicory. Brewed in a stainless steel brass gravity filter with thick boiled cow milk.',
    ingredients: ['coffee_chicory_grounds', 'boiling_water', 'pure_cows_milk', 'sugar'],
    visualAsset: 'assets/props/food/filter_coffee_tumbler.glb',
    audioHooks: { brew: 'coffee_decoction_drip', pour: 'dabarah_froth_pour', sip: 'coffee_relish_sip' },
    survivalEffect: { hunger: 5, thirst: 10, energy: 35, warmth: 1.8 },
    costRupees: 20,
    interactiveRecipe: {
      steps: ['pack_filter_press', 'pour_scalding_water', 'collect_thick_decoction', 'froth_in_dabarah'],
      difficulty: 'moderate'
    }
  },
  {
    id: 'food_elaneer',
    name: 'Fresh Tender Coconut (Elaneer)',
    tamilName: 'செவ்விளநீர்',
    region: 'CAUVERY_DELTA',
    mealType: 'natural_drink',
    description: 'Chilled sweet electrolyte water sliced open with a swift machete strike, with delicate gelatinous coconut meat (vazhukkai) scooped with a palm slice.',
    ingredients: ['fresh_green_coconut'],
    visualAsset: 'assets/props/food/tender_coconut.glb',
    audioHooks: { chop: 'machete_coconut_slice', drink: 'coconut_refresh_drink' },
    survivalEffect: { hunger: 10, thirst: 50, energy: 20, warmth: -1.0 },
    costRupees: 35
  },
  {
    id: 'food_idli_sambar',
    name: 'Steamed Idli with Drumstick Sambar',
    tamilName: 'மல்லிகைப் பூ இட்லி & முருங்கைக்காய் சாம்பார்',
    region: 'GEORGE_TOWN',
    mealType: 'breakfast',
    description: 'Four pillowy soft naturally fermented parboiled rice and urad dal steamed cakes submerged in piping hot shallot-drumstick toor dal sambar.',
    ingredients: ['steamed_idlis', 'shallot_drumstick_sambar', 'fresh_coconut_chutney', 'gunpowder_podi'],
    visualAsset: 'assets/props/food/idli_plate.glb',
    audioHooks: { steam: 'idli_pot_whistle', eat: 'eating_enjoyment' },
    survivalEffect: { hunger: 40, thirst: 10, energy: 45, warmth: 0.5 },
    costRupees: 40
  },
  {
    id: 'food_medu_vadai',
    name: 'Crispy Medu Vadai',
    tamilName: 'மொறுமொறு மெதுவடை',
    region: 'GEORGE_TOWN',
    mealType: 'snack',
    description: 'Golden-fried fluffy urad dal fritter with a donut hole, studded with crushed black peppercorns, curry leaves, and ginger slivers.',
    ingredients: ['urad_dal_batter', 'crushed_peppercorns', 'fresh_curry_leaves', 'shallots'],
    visualAsset: 'assets/props/food/vadai_plate.glb',
    audioHooks: { fry: 'oil_sizzle_deepfry', crunch: 'vadai_crispy_crunch' },
    survivalEffect: { hunger: 25, thirst: -5, energy: 20, warmth: 1.0 },
    costRupees: 15
  },
  {
    id: 'food_ghee_roast_dosa',
    name: 'Chettinad Ghee Roast Dosa',
    tamilName: 'நெய் ரோஸ்ட் தோசை',
    region: 'CHETTINAD',
    mealType: 'tiffin',
    description: 'Paper-thin, golden crisp cone fermented rice crepe roasted on a cast-iron tawa with fragrant country cow ghee. Served with spicy tomato-garlic kara chutney.',
    ingredients: ['fermented_dosa_batter', 'country_cow_ghee', 'kara_chutney', 'coriander_chutney'],
    visualAsset: 'assets/props/food/dosa_plate.glb',
    audioHooks: { sizzle: 'tawa_batter_sizzle', crunch: 'dosa_crack_crisp' },
    survivalEffect: { hunger: 45, thirst: 5, energy: 50, warmth: 1.0 },
    costRupees: 65
  },
  {
    id: 'food_ven_pongal',
    name: 'Ghee Khara Ven Pongal',
    tamilName: 'நெய் வெண் பொங்கல்',
    region: 'THANJAVUR',
    mealType: 'breakfast',
    description: 'Creamy soft raw rice and split yellow moong dal cooked with generous cumin seeds, whole peppercorns, grated ginger, and golden fried cashew nuts.',
    ingredients: ['raw_rice', 'moong_dal', 'cumin_peppercorn_tadka', 'roasted_cashews', 'ghee'],
    visualAsset: 'assets/props/food/pongal_pot.glb',
    audioHooks: { sizzle: 'ghee_cashew_splutter', eat: 'warm_comfort_eat' },
    survivalEffect: { hunger: 60, thirst: 10, energy: 60, warmth: 1.5 },
    costRupees: 55
  },
  {
    id: 'food_sakkarai_pongal',
    name: 'Jaggery Sweet Sakkarai Pongal',
    tamilName: 'சர்க்கரைப் பொங்கல்',
    region: 'CAUVERY_DELTA',
    mealType: 'festival_sweet',
    description: 'Harvest feast specialty: freshly harvested rice cooked in boiling milk with dark organic palm jaggery, cardamom powder, nutmeg, and ghee-roasted raisins.',
    ingredients: ['harvest_new_rice', 'dark_palm_jaggery', 'cardamom_raisins', 'pure_ghee'],
    visualAsset: 'assets/props/food/sweet_pongal_earthen.glb',
    audioHooks: { boil: 'milk_jaggery_bubbling', eat: 'sweet_delight' },
    survivalEffect: { hunger: 55, thirst: 5, energy: 75, warmth: 2.2 },
    costRupees: 50
  },
  {
    id: 'food_curd_rice',
    name: 'Thayir Sadam (Curd Rice)',
    tamilName: 'தாளித்த தயிர் சாதம்',
    region: 'MAMALLAPURAM',
    mealType: 'cooling_meal',
    description: 'Mashed soft rice folded into fresh creamy cultured curd, tempered with mustard seeds, green chillies, curry leaves, and ginger, garnished with pomegranate seeds.',
    ingredients: ['soft_cooked_rice', 'fresh_curd', 'mustard_curryleaf_tempering', 'tender_mango_pickle'],
    visualAsset: 'assets/props/food/curd_rice_plate.glb',
    audioHooks: { stir: 'soft_curd_creamy_stir', eat: 'cooling_bite' },
    survivalEffect: { hunger: 40, thirst: 35, energy: 40, warmth: -2.0 },
    costRupees: 35
  },
  {
    id: 'food_banana_leaf_virundhu',
    name: 'Grand Tamil Nadu Virundhu Feast',
    tamilName: 'வாழை இலை முழு விருந்து',
    region: 'CHETTINAD',
    mealType: 'grand_feast',
    description: 'Elaborate festival meal on a fresh green plantain leaf with salt, sweet pachadi, cabbage kootu, potato roast, vadai, appalam, steaming rice, sambar, rasam, and payasam.',
    ingredients: ['banana_leaf', 'steaming_rice', 'sambar', 'pepper_rasam', 'paruppu_ghee', 'elaneer_payasam'],
    visualAsset: 'assets/props/food/banana_leaf_feast.glb',
    audioHooks: { rustle: 'leaf_unfurl', feast: 'grand_feast_enjoyment' },
    survivalEffect: { hunger: 100, thirst: 40, energy: 100, warmth: 1.0 },
    costRupees: 180
  },
  {
    id: 'food_sugarcane_stalk',
    name: 'Fresh Harvest Sugarcane',
    tamilName: 'கரும்புத் துண்டு',
    region: 'CAUVERY_DELTA',
    mealType: 'natural_sweet',
    description: 'Juicy fibrous cane stalks harvested during Thai Pongal. Peeling with teeth yields bursts of mineral-rich natural sucrose juice.',
    ingredients: ['raw_sugarcane_stalk'],
    visualAsset: 'assets/props/food/sugarcane_bundle.glb',
    audioHooks: { snap: 'sugarcane_teeth_snap', chew: 'sugarcane_chewing' },
    survivalEffect: { hunger: 15, thirst: 20, energy: 30, warmth: 0.0 },
    costRupees: 10
  }
];
