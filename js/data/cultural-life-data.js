/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Authentic Tamil Nadu Cultural Life Data
 * Production definitions for cultural props, human-reviewed Tamil signage,
 * regional transport vehicles, and cultural quality guidelines.
 */

window.CULTURAL_PROPS_DATA = [
  {
    id: 'prop_kuthu_vilakku',
    category: 'household_sacred',
    region: 'CHETTINAD',
    tamilName: 'குத்து விளக்கு (Kuthu Vilakku)',
    interactionType: 'light',
    description: 'Heavy ornate cast-brass pedestal oil lamp with five wick spouts topped by an Annam bird finial. Lit with sesame oil during dusk.',
    assetPath: 'assets/props/cultural/kuthu_vilakku.glb',
    discoverable: true,
    questRelevant: true,
    discoveryLore: 'The brass Kuthu Vilakku represents prosperity and enlightenment across Tamil homes, cast via lost-wax brass methods.'
  },
  {
    id: 'prop_agal_lamp',
    category: 'household_sacred',
    region: 'THANJAVUR',
    tamilName: 'அகல் விளக்கு (Agal Vilakku)',
    interactionType: 'light',
    description: 'Traditional unglazed terracotta clay pinch lamp holding castor oil and a hand-rolled cotton wick.',
    assetPath: 'assets/props/cultural/agal_lamp.glb',
    discoverable: true,
    questRelevant: false,
    discoveryLore: 'Fired from alluvial clay along riverbeds, agal lamps illuminate courtyards and doorsteps during Karthigai Deepam.'
  },
  {
    id: 'prop_ammi_kallu',
    category: 'kitchen_tool',
    region: 'CHETTINAD',
    tamilName: 'அம்மிக்கல் & குழவி (Ammi Stone & Roller)',
    interactionType: 'inspect',
    description: 'Rectangular granite grinding slab with a cylindrical hand stone used to grind fresh shallots, peppercorns, and roasted spices into aromatic masala pastes.',
    assetPath: 'assets/props/cultural/ammi_kallu.glb',
    discoverable: true,
    questRelevant: true,
    discoveryLore: 'The friction of rough granite slowly crushes whole spices without overheating the essential aromatic oils.'
  },
  {
    id: 'prop_ural_ulakkai',
    category: 'kitchen_tool',
    region: 'CAUVERY_DELTA',
    tamilName: 'உரல் & உலக்கை (Ural Stone Mortar & Pestle)',
    interactionType: 'inspect',
    description: 'Deep stone cavity mortar and a brass-collared seasoned heavy wooden pounding staff used for dehusking harvested paddy and pounding rice flour.',
    assetPath: 'assets/props/cultural/ural_ulakkai.glb',
    discoverable: true,
    questRelevant: false,
    discoveryLore: 'Hand-pounding rice in a stone ural preserves the nutritious bran layer compared to modern mechanized hullers.'
  },
  {
    id: 'prop_brass_vessel_kudam',
    category: 'water_storage',
    region: 'CAUVERY_DELTA',
    tamilName: 'பித்தளை குடம் (Brass Water Kudam)',
    interactionType: 'lift',
    description: 'Hand-hammered brass pot with a narrow neck and flared rim, polished bright with tamarind and wood ash for drawing drinking water.',
    assetPath: 'assets/props/cultural/brass_kudam.glb',
    discoverable: true,
    questRelevant: true,
    discoveryLore: 'Stored drinking water in copper and brass vessels naturally purifies through the oligodynamic oligometallic effect.'
  },
  {
    id: 'prop_clay_pot_matka',
    category: 'water_storage',
    region: 'GEORGE_TOWN',
    tamilName: 'மண் பானை (Terracotta Water Pot)',
    interactionType: 'inspect',
    description: 'Porous earthen clay pot draped with wet jute cloth to provide evaporative natural cool water during hot humid afternoons.',
    assetPath: 'assets/props/cultural/clay_pot.glb',
    discoverable: true,
    questRelevant: false,
    discoveryLore: 'Roadside water containers placed freely outside shops (Thanneer Pandal) remain an age-old Tamil tradition of hospitality.'
  },
  {
    id: 'prop_palm_leaf_basket_kottan',
    category: 'craft_utility',
    region: 'CHETTINAD',
    tamilName: 'பனை ஓலைக் கொட்டான் (Palm Kottan Basket)',
    interactionType: 'pickup',
    description: 'Intricately dyed and hand-plaited palmyra leaf container woven by Chettinad women artisans.',
    assetPath: 'assets/props/cultural/palm_kottan.glb',
    discoverable: true,
    questRelevant: true,
    discoveryLore: 'Palmyra (Borassus flabellifer) is the official state tree of Tamil Nadu, utilized from root to leaf tip.'
  },
  {
    id: 'prop_agricultural_sickle',
    category: 'farming_tool',
    region: 'CAUVERY_DELTA',
    tamilName: 'அரிவாள் (Harvesting Sickle)',
    interactionType: 'pickup',
    description: 'Curved forged-iron sickle with a serrated inner blade and neem wood handle, tempered for reaping golden paddy stalks.',
    assetPath: 'assets/props/cultural/sickle.glb',
    discoverable: true,
    questRelevant: true,
    discoveryLore: 'Each village blacksmith tempers sickle curvature to suit local paddy stalk density and harvesting postures.'
  },
  {
    id: 'prop_fishing_cast_net',
    category: 'fishing_tool',
    region: 'PICHAVARAM',
    tamilName: 'வீச்சு வலை (Cast Fishing Net)',
    interactionType: 'inspect',
    description: 'Circular braided nylon fishing net bordered with lead sinkers, designed for skilled hand casting across shallow tidal estuaries.',
    assetPath: 'assets/props/cultural/cast_net.glb',
    discoverable: true,
    questRelevant: true,
    discoveryLore: 'Pichavaram fishermen read surface ripple movements to cast nets precisely over schools of grey mullet and mangrove mud crabs.'
  },
  {
    id: 'prop_wooden_manai_stool',
    category: 'household_furniture',
    region: 'CHETTINAD',
    tamilName: 'மரப்பலகை மனை (Low Wooden Stool)',
    interactionType: 'inspect',
    description: 'Heavy low-profile seasoned teak seat carved from single timber pieces, elevated 4 inches above courtyards.',
    assetPath: 'assets/props/cultural/manai_stool.glb',
    discoverable: true,
    questRelevant: false,
    discoveryLore: 'Floor-level seating on wooden manais encourages healthy digestive postures and communal warmth.'
  },
  {
    id: 'prop_filter_coffee_dabarah',
    category: 'food_service',
    region: 'THANJAVUR',
    tamilName: 'காபி டவரா செட் (Brass Dabarah & Tumbler)',
    interactionType: 'use',
    description: 'Polished heavy brass lip-turned tumbler and shallow wide bowl (dabarah) for frothing and sipping hot chicory degree coffee.',
    assetPath: 'assets/props/cultural/coffee_dabarah.glb',
    discoverable: true,
    questRelevant: true,
    discoveryLore: 'Pouring coffee back and forth between tumbler and dabarah aerates the brew, creating a golden frothy crema without scalding the mouth.'
  },
  {
    id: 'prop_korai_pai_mat',
    category: 'household_furniture',
    region: 'CAUVERY_DELTA',
    tamilName: 'பத்தமடை பாய் (Pattamadai Sedge Mat)',
    interactionType: 'inspect',
    description: 'Silky smooth sleeping mat woven from split korai river sedge grass and dyed with natural madder and turmeric.',
    assetPath: 'assets/props/cultural/korai_mat.glb',
    discoverable: true,
    questRelevant: false,
    discoveryLore: 'Fine korai grass mats naturally wick moisture and stay cool against human skin even on the most sultry tropical nights.'
  }
];

window.TAMIL_SIGNAGE_DICTIONARY = [
  {
    id: 'sign_tea_stall',
    tamilText: 'தேநீர் கடை',
    englishText: 'TEA STALL',
    phonetic: 'The-neer Ka-dai',
    context: 'Roadside stall selling tea, vadai, and snacks',
    colorScheme: { bg: '#8B4513', text: '#FFF8DC', border: '#D2691E' }
  },
  {
    id: 'sign_flower_stall',
    tamilText: 'மலர் அங்காடி',
    englishText: 'FLOWER BAZAAR',
    phonetic: 'Ma-lar Ang-gaadi',
    context: 'Fresh jasmine (malligai), marigold, and rose garland stall',
    colorScheme: { bg: '#4A154B', text: '#FFD700', border: '#FF69B4' }
  },
  {
    id: 'sign_grocery_store',
    tamilText: 'மளிகைக் கடை',
    englishText: 'PROVISION STORE',
    phonetic: 'Ma-li-gai Ka-dai',
    context: 'Daily dry goods, spices, grains, and sesame oil shop',
    colorScheme: { bg: '#1E3F20', text: '#E8F5E9', border: '#4CAF50' }
  },
  {
    id: 'sign_fish_market',
    tamilText: 'மீன் அங்காடி',
    englishText: 'FISH MARKET',
    phonetic: 'Meen Ang-gaadi',
    context: 'Fresh coastal sea fish and estuary crab stalls',
    colorScheme: { bg: '#0A3D62', text: '#E0F7FA', border: '#00A8FF' }
  },
  {
    id: 'sign_vegetable_stall',
    tamilText: 'காய்கறி அங்காடி',
    englishText: 'VEGETABLE MARKET',
    phonetic: 'Kaay-ka-ri Ang-gaadi',
    context: 'Local farm produce including plantain stems, drumsticks, and shallots',
    colorScheme: { bg: '#2E7D32', text: '#FFFDE7', border: '#81C784' }
  },
  {
    id: 'sign_artisan_workshop',
    tamilText: 'கைவினைப் பட்டறை',
    englishText: 'HERITAGE CRAFT ATELIER',
    phonetic: 'Kai-vi-nai Pat-ta-rai',
    context: 'Sculpture carving, bronze casting, and woodwork workshops',
    colorScheme: { bg: '#4E342E', text: '#FFE082', border: '#BCAAA4' }
  },
  {
    id: 'sign_traditional_eatery',
    tamilText: 'பாரம்பரிய உணவகம்',
    englishText: 'HERITAGE MESS',
    phonetic: 'Paa-ram-ba-ri-ya U-na-va-gam',
    context: 'Banana leaf meals serving hot sambar, rasam, and fresh kootu',
    colorScheme: { bg: '#B71C1C', text: '#FFF8E1', border: '#FF8A65' }
  },
  {
    id: 'sign_weaving_shed',
    tamilText: 'கைத்தறி நெசவுக்கூடம்',
    englishText: 'HANDLOOM WEAVING SHED',
    phonetic: 'Kait-tha-ri Ne-sa-vuk-koo-dam',
    context: 'Traditional pit looms weaving cotton veshtis and silk borders',
    colorScheme: { bg: '#311B92', text: '#EDE7F6', border: '#9575CD' }
  }
];

window.REGIONAL_TRANSPORT_CONFIG = {
  GEORGE_TOWN: [
    { type: 'auto_rickshaw', model: 'black_yellow_bajaj', count: 6, ambientNoise: 'auto_idle' },
    { type: 'vintage_bicycle', model: 'hercules_king', count: 12, ambientNoise: 'bicycle_bell' },
    { type: 'motorcycle', model: 'bullet_enfield_350', count: 3, ambientNoise: 'bullet_thump' },
    { type: 'city_bus', model: 'pallavan_mtc_green', count: 2, ambientNoise: 'bus_airbrake' }
  ],
  CAUVERY_DELTA: [
    { type: 'bullock_cart', model: 'wood_spoke_double_ox', count: 4, ambientNoise: 'cart_creak' },
    { type: 'vintage_bicycle', model: 'hercules_carrier', count: 14, ambientNoise: 'bicycle_bell' },
    { type: 'agricultural_tractor', model: 'red_mahindra_farm', count: 2, ambientNoise: 'diesel_chug' }
  ],
  PICHAVARAM: [
    { type: 'wooden_boat', model: 'traditional_thoni_canoe', count: 8, ambientNoise: 'boat_paddle' },
    { type: 'vintage_bicycle', model: 'hercules_coastal', count: 4, ambientNoise: 'bicycle_bell' }
  ],
  CHETTINAD: [
    { type: 'vintage_bicycle', model: 'hercules_gentleman', count: 8, ambientNoise: 'bicycle_bell' },
    { type: 'bullock_cart', model: 'ornate_temple_cart', count: 2, ambientNoise: 'cart_creak' }
  ],
  THANJAVUR: [
    { type: 'vintage_bicycle', model: 'roadster_single_speed', count: 10, ambientNoise: 'bicycle_bell' },
    { type: 'auto_rickshaw', model: 'classic_yellow', count: 3, ambientNoise: 'auto_idle' }
  ],
  MAMALLAPURAM: [
    { type: 'fishing_catamaran', model: 'tied_log_kattumaram', count: 6, ambientNoise: 'surf_slap' },
    { type: 'vintage_bicycle', model: 'beach_cruiser', count: 8, ambientNoise: 'bicycle_bell' }
  ],
  NILGIRIS: [
    { type: 'estate_transport_jeep', model: 'mahindra_4x4_mountain', count: 4, ambientNoise: 'engine_whine' },
    { type: 'vintage_bicycle', model: 'mountain_gear_bicycle', count: 3, ambientNoise: 'bicycle_bell' }
  ]
};

window.CULTURAL_QUALITY_GATE = {
  validateAsset: (asset) => {
    if (!asset || !asset.region || !asset.category) return { valid: false, reason: 'Missing metadata' };
    const validRegions = ['GEORGE_TOWN', 'CAUVERY_DELTA', 'PICHAVARAM', 'CHETTINAD', 'THANJAVUR', 'MAMALLAPURAM', 'NILGIRIS'];
    if (!validRegions.includes(asset.region)) return { valid: false, reason: 'Invalid cultural region' };
    if (!asset.tamilName || asset.tamilName.length < 3) return { valid: false, reason: 'Missing reviewed Tamil name' };
    return { valid: true };
  }
};
