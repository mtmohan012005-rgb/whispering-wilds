// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENVIRONMENT PROP DATA REGISTRY
// Authoritative definitions for interactive environmental props across Tamil Nadu
// ============================================================================

(function() {
  'use strict';

  // Mass Classes determining pushability and physics reaction
  const PROP_MASS_CLASS = {
    STATIC: 'STATIC',   // Immovable (pillars, wells, heavy stone structures, trees)
    HEAVY:  'HEAVY',    // Very heavy (wooden trunks, large stone chests, heavy carts)
    MEDIUM: 'MEDIUM',   // Movable with sustained effort (benches, small barrels, stools)
    LIGHT:  'LIGHT'     // Readily pushable (crates, cane baskets, clay pots, light boards)
  };

  // Save Policy determining persistence in GameState.world.interactions
  const PROP_SAVE_POLICY = {
    PERSISTENT:  'PERSISTENT',   // Saved permanently (gates, doors, containers, puzzles)
    QUEST_BOUND: 'QUEST_BOUND',  // Saved while relevant to quest state
    TRANSIENT:   'TRANSIENT'     // Resets on region reload (minor physics shifts, temporary nudges)
  };

  // Authored Interactive Props Catalog across Tamil Nadu regions
  const ENVIRONMENT_PROPS = {
    // -------------------------------------------------------------------------
    // 1. DOORS & GATES
    // -------------------------------------------------------------------------
    'door_heritage_chettinad_01': {
      id: 'door_heritage_chettinad_01',
      name: { en: 'Carved Teak Heritage Door', ta: 'செட்டிநாட்டு மரக்கதவு' },
      type: 'door',
      subType: 'heritage_door',
      region: 'chettinad',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['OPEN', 'CLOSE', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 1.2, y: 2.4, z: 0.15 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'DOOR_HANDLE',
      soundId: 'door_wood_heavy',
      isLocked: true,
      requiredKey: 'key_chettinad_mansion',
      lockHint: { en: 'Requires the carved mansion brass key', ta: 'செதுக்கப்பட்ட பித்தளை சாவி தேவை' },
      defaultState: 'CLOSED'
    },
    'gate_village_farm_01': {
      id: 'gate_village_farm_01',
      name: { en: 'Bamboo Farm Gate', ta: 'மூங்கில் பண்ணை வாயில்' },
      type: 'gate',
      subType: 'farm_gate',
      region: 'cauvery_delta',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['OPEN', 'CLOSE'],
      collisionProfile: { type: 'box', size: { x: 2.4, y: 1.5, z: 0.1 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'GATE_LATCH',
      soundId: 'gate_creak_wood',
      isLocked: false,
      defaultState: 'CLOSED'
    },
    'gate_temple_compound_01': {
      id: 'gate_temple_compound_01',
      name: { en: 'Temple Outer Compound Gate', ta: 'கோயில் வெளிப் பிரகார வாயில்' },
      type: 'gate',
      subType: 'temple_gate',
      region: 'thanjavur',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['OPEN', 'CLOSE', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 3.2, y: 3.5, z: 0.25 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'GATE_LATCH',
      soundId: 'gate_brass_heavy',
      isLocked: false,
      defaultState: 'OPEN'
    },
    'door_warehouse_george_town_01': {
      id: 'door_warehouse_george_town_01',
      name: { en: 'Colonial Warehouse Iron Door', ta: 'பழைய கிடங்கு இரும்புக்கதவு' },
      type: 'door',
      subType: 'metal_door',
      region: 'george_town',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['OPEN', 'CLOSE', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 1.4, y: 2.6, z: 0.15 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'DOOR_HANDLE',
      soundId: 'door_iron_latch',
      isLocked: true,
      requiredKey: 'key_harbor_warehouse',
      lockHint: { en: 'Locked with a heavy rusted colonial padlock', ta: 'துருப்பிடித்த கனமான பூட்டு போடப்பட்டுள்ளது' },
      defaultState: 'CLOSED'
    },
    'door_forest_outpost_01': {
      id: 'door_forest_outpost_01',
      name: { en: 'Forest Service Wooden Door', ta: 'வனத்துறை அலுவலக மரக்கதவு' },
      type: 'door',
      subType: 'wooden_door',
      region: 'nilgiris',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['OPEN', 'CLOSE'],
      collisionProfile: { type: 'box', size: { x: 1.1, y: 2.2, z: 0.1 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'DOOR_HANDLE',
      soundId: 'door_wood_creak',
      isLocked: false,
      defaultState: 'CLOSED'
    },

    // -------------------------------------------------------------------------
    // 2. WELLS & WATER MECHANISMS
    // -------------------------------------------------------------------------
    'well_village_stone_01': {
      id: 'well_village_stone_01',
      name: { en: 'Traditional Granite Ring Well', ta: 'பாரம்பரிய கருங்கல் உறை கிணறு' },
      type: 'well',
      subType: 'stone_well',
      region: 'cauvery_delta',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['INSPECT', 'WATER_INTERACT'],
      collisionProfile: { type: 'cylinder', radius: 1.1, height: 1.1 },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'WELL_PULLEY',
      soundId: 'well_pulley_water',
      evidenceId: 'evidence_well_depth',
      drawWaterEffect: { hydrationGain: 35, canteenRefill: true }
    },
    'pump_agricultural_01': {
      id: 'pump_agricultural_01',
      name: { en: 'Cast-Iron Field Hand Pump', ta: 'விவசாய கைக்குழாய் பம்பு' },
      type: 'water_pump',
      subType: 'hand_pump',
      region: 'cauvery_delta',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['ACTIVATE', 'INSPECT'],
      collisionProfile: { type: 'cylinder', radius: 0.5, height: 1.4 },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'PUMP_HANDLE',
      soundId: 'water_pump_crank',
      drawWaterEffect: { hydrationGain: 40, canteenRefill: true }
    },

    // -------------------------------------------------------------------------
    // 3. AUTHENTIC TAMIL NADU LAMPS
    // -------------------------------------------------------------------------
    'lamp_kuthu_vilakku_01': {
      id: 'lamp_kuthu_vilakku_01',
      name: { en: 'Brass Kuthu Vilakku', ta: 'பித்தளை குத்துவிளக்கு' },
      type: 'lamp',
      subType: 'kuthu_vilakku',
      region: 'thanjavur',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['LIGHT', 'EXTINGUISH', 'INSPECT'],
      collisionProfile: { type: 'cylinder', radius: 0.3, height: 1.3 },
      savePolicy: PROP_SAVE_POLICY.QUEST_BOUND,
      anchorPoint: 'LAMP_WICK',
      soundId: 'lamp_ignite_match',
      isLit: false,
      lightProperties: { color: 0xffaa44, intensity: 1.4, distance: 4.5 }
    },
    'lamp_agal_vilakku_01': {
      id: 'lamp_agal_vilakku_01',
      name: { en: 'Clay Agal Vilakku', ta: 'மண் அகல் விளக்கு' },
      type: 'lamp',
      subType: 'agal_lamp',
      region: 'thanjavur',
      massClass: PROP_MASS_CLASS.LIGHT,
      interactionTypes: ['LIGHT', 'EXTINGUISH'],
      collisionProfile: { type: 'sphere', radius: 0.15 },
      savePolicy: PROP_SAVE_POLICY.TRANSIENT,
      anchorPoint: 'LAMP_WICK',
      soundId: 'lamp_ignite_match',
      isLit: true,
      lightProperties: { color: 0xff8833, intensity: 0.8, distance: 2.5 }
    },
    'lamp_street_colonial_01': {
      id: 'lamp_street_colonial_01',
      name: { en: 'Colonial Gaslight Street Post', ta: 'பழைய தெரு விளக்கு கம்பம்' },
      type: 'lamp',
      subType: 'street_lamp',
      region: 'george_town',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['INSPECT'],
      collisionProfile: { type: 'cylinder', radius: 0.35, height: 4.0 },
      savePolicy: PROP_SAVE_POLICY.STATIC,
      soundId: 'lamp_buzz_hum',
      isLit: true,
      lightProperties: { color: 0xffeedd, intensity: 2.2, distance: 8.0 }
    },

    // -------------------------------------------------------------------------
    // 4. CULTURAL & HERITAGE PROPS
    // -------------------------------------------------------------------------
    'prop_grinding_stone_01': {
      id: 'prop_grinding_stone_01',
      name: { en: 'Granite Aattukal (Grinding Stone)', ta: 'பாரம்பரிய ஆட்டுக்கல்' },
      type: 'cultural',
      subType: 'grinding_stone',
      region: 'chettinad',
      massClass: PROP_MASS_CLASS.HEAVY,
      interactionTypes: ['INSPECT'],
      collisionProfile: { type: 'cylinder', radius: 0.45, height: 0.4 },
      savePolicy: PROP_SAVE_POLICY.STATIC,
      evidenceId: 'evidence_traditional_spices',
      description: {
        en: 'A hand-hewn heavy granite grinding stone with visible cardamom and turmeric residue.',
        ta: 'ஏலக்காய் மற்றும் மஞ்சள் துகள்கள் படிந்த கனமான பாரம்பரிய ஆட்டுக்கல்.'
      }
    },
    'prop_palm_leaf_manuscript_01': {
      id: 'prop_palm_leaf_manuscript_01',
      name: { en: 'Inscribed Palm-Leaf Manuscript (Olai Chuvadi)', ta: 'பண்டைய ஓலைச்சுவடி' },
      type: 'cultural',
      subType: 'palm_leaf_manuscript',
      region: 'thanjavur',
      massClass: PROP_MASS_CLASS.LIGHT,
      interactionTypes: ['READ', 'INSPECT', 'COLLECT'],
      collisionProfile: { type: 'box', size: { x: 0.35, y: 0.08, z: 0.12 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      evidenceId: 'evidence_chola_canal_diagram',
      description: {
        en: 'Ancient Tamil script etched with an iron stylus detailing Pichavaram waterway sluice controls.',
        ta: 'பிச்சாவரம் மதகு திறப்பு அமைப்புகளை விவரிக்கும் எழுத்தாணி கொண்டு செதுக்கப்பட்ட ஓலைச்சுவடி.'
      }
    },
    'prop_brass_vessel_kudam_01': {
      id: 'prop_brass_vessel_kudam_01',
      name: { en: 'Hammered Brass Kudam (Water Pot)', ta: 'பித்தளை நீர் குடம்' },
      type: 'cultural',
      subType: 'brass_vessel',
      region: 'chettinad',
      massClass: PROP_MASS_CLASS.MEDIUM,
      interactionTypes: ['INSPECT', 'PUSH'],
      collisionProfile: { type: 'sphere', radius: 0.28 },
      savePolicy: PROP_SAVE_POLICY.TRANSIENT,
      soundId: 'brass_pot_ring',
      pushFriction: 0.88
    },
    'prop_fishing_net_pichavaram_01': {
      id: 'prop_fishing_net_pichavaram_01',
      name: { en: 'Coir & Nylon Mangrove Cast Net', ta: 'பிச்சாவரம் மீன்பிடி வீச்சு வலை' },
      type: 'cultural',
      subType: 'fishing_net',
      region: 'pichavaram',
      massClass: PROP_MASS_CLASS.LIGHT,
      interactionTypes: ['INSPECT'],
      collisionProfile: { type: 'box', size: { x: 0.8, y: 0.3, z: 0.8 } },
      savePolicy: PROP_SAVE_POLICY.TRANSIENT,
      soundId: 'rope_cloth_rustle'
    },

    // -------------------------------------------------------------------------
    // 5. MOVABLE PHYSICS PROPS (Pushable lightweight objects)
    // -------------------------------------------------------------------------
    'crate_wooden_market_01': {
      id: 'crate_wooden_market_01',
      name: { en: 'Wooden Produce Crate', ta: 'மரக் காய்கறிப் பெட்டி' },
      type: 'physics_prop',
      subType: 'wooden_crate',
      region: 'george_town',
      massClass: PROP_MASS_CLASS.LIGHT,
      interactionTypes: ['PUSH', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 0.65, y: 0.55, z: 0.65 } },
      savePolicy: PROP_SAVE_POLICY.TRANSIENT,
      massKg: 12.0,
      pushFriction: 0.82,
      soundId: 'wood_scrape_pavement',
      breakable: true,
      breakHealth: 1,
      replacementAsset: 'crate_broken_01'
    },
    'basket_cane_woven_01': {
      id: 'basket_cane_woven_01',
      name: { en: 'Woven Cane Basket', ta: 'பிரம்பு கூடை' },
      type: 'physics_prop',
      subType: 'cane_basket',
      region: 'cauvery_delta',
      massClass: PROP_MASS_CLASS.LIGHT,
      interactionTypes: ['PUSH', 'INSPECT'],
      collisionProfile: { type: 'cylinder', radius: 0.32, height: 0.45 },
      savePolicy: PROP_SAVE_POLICY.TRANSIENT,
      massKg: 3.5,
      pushFriction: 0.75,
      soundId: 'cane_basket_rustle',
      breakable: false
    },
    'pot_clay_cooking_01': {
      id: 'pot_clay_cooking_01',
      name: { en: 'Earthen Terracotta Pot', ta: 'மண் சட்டி' },
      type: 'physics_prop',
      subType: 'clay_pot',
      region: 'thanjavur',
      massClass: PROP_MASS_CLASS.LIGHT,
      interactionTypes: ['PUSH', 'INSPECT'],
      collisionProfile: { type: 'sphere', radius: 0.22 },
      savePolicy: PROP_SAVE_POLICY.TRANSIENT,
      massKg: 2.8,
      pushFriction: 0.70,
      soundId: 'clay_clink_roll',
      breakable: true,
      breakHealth: 1,
      replacementAsset: 'clay_shards_01'
    },
    'stool_wooden_manai_01': {
      id: 'stool_wooden_manai_01',
      name: { en: 'Low Teak Kitchen Stool (Manai)', ta: 'மர மனைப் பலகை' },
      type: 'physics_prop',
      subType: 'wooden_stool',
      region: 'chettinad',
      massClass: PROP_MASS_CLASS.MEDIUM,
      interactionTypes: ['PUSH', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 0.45, y: 0.18, z: 0.3 } },
      savePolicy: PROP_SAVE_POLICY.TRANSIENT,
      massKg: 6.0,
      pushFriction: 0.85,
      soundId: 'wood_slide_floor'
    },

    // -------------------------------------------------------------------------
    // 6. CONTAINERS (Chests, Trunks, Storage)
    // -------------------------------------------------------------------------
    'container_antique_chest_01': {
      id: 'container_antique_chest_01',
      name: { en: 'Brass-Bound Rosewood Trunk', ta: 'பித்தளை பூட்டிய ஈட்டி மரப் பெட்டி' },
      type: 'container',
      subType: 'wooden_chest',
      region: 'chettinad',
      massClass: PROP_MASS_CLASS.HEAVY,
      interactionTypes: ['OPEN', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 0.95, y: 0.65, z: 0.6 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'CHEST_LID',
      soundId: 'chest_open_creak',
      isOpen: false,
      lootTable: [
        { itemId: 'rupees', count: 65, weight: 0 },
        { itemId: 'historical_notes', count: 1, weight: 0.1 }
      ]
    },
    'container_fisherman_tackle_box_01': {
      id: 'container_fisherman_tackle_box_01',
      name: { en: 'Mangrove Fisherman Tackle Box', ta: 'மீனவர் கருவிப் பெட்டி' },
      type: 'container',
      subType: 'storage_box',
      region: 'pichavaram',
      massClass: PROP_MASS_CLASS.MEDIUM,
      interactionTypes: ['OPEN', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 0.55, y: 0.35, z: 0.4 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      anchorPoint: 'CHEST_LID',
      soundId: 'metal_latches_open',
      isOpen: false,
      lootTable: [
        { itemId: 'cordage', count: 2, weight: 0.4 },
        { itemId: 'canteenWater', count: 1, weight: 0.5 }
      ]
    },

    // -------------------------------------------------------------------------
    // 7. BRIDGES & WATER CROSSINGS
    // -------------------------------------------------------------------------
    'bridge_canal_footbridge_01': {
      id: 'bridge_canal_footbridge_01',
      name: { en: 'Mangrove Timber Footbridge', ta: 'சதுப்புநில மர நடைபாலம்' },
      type: 'bridge',
      subType: 'wooden_bridge',
      region: 'pichavaram',
      massClass: PROP_MASS_CLASS.STATIC,
      interactionTypes: ['CROSS', 'INSPECT'],
      collisionProfile: { type: 'box', size: { x: 3.5, y: 0.3, z: 1.4 } },
      savePolicy: PROP_SAVE_POLICY.PERSISTENT,
      soundId: 'bridge_wood_plank_step',
      hasSecondarySway: true
    }
  };

  // Global Export
  window.PROP_MASS_CLASS = PROP_MASS_CLASS;
  window.PROP_SAVE_POLICY = PROP_SAVE_POLICY;
  window.ENVIRONMENT_PROPS = ENVIRONMENT_PROPS;

  console.log('[EnvironmentPropData] Registered', Object.keys(ENVIRONMENT_PROPS).length, 'production environmental props.');
})();
