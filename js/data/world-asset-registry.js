/**
 * The Whispering Wilds (Kaattu Vazhi) - World Asset Registry
 * Definitive registry of rights-cleared, local production 3D assets across all 7 Tamil Nadu regions.
 * PC ONLY - Target 60 FPS.
 */

const WORLD_ASSETS = {
  chennai: {
    buildings: [
      "street_row",
      "tea_kadai",
      "market_building",
      "old_tamil_house"
    ],
    props: [
      "flower_cart",
      "tea_stall",
      "old_bicycle",
      "wooden_bench",
      "brass_vessels",
      "water_pot",
      "street_sign",
      "electrical_pole"
    ],
    vehicles: [
      "auto_rickshaw",
      "old_motorcycle",
      "city_bus"
    ]
  },

  cauvery_delta: {
    buildings: [
      "village_house",
      "cattle_shed",
      "granary"
    ],
    props: [
      "paddy_bundle",
      "farm_tools",
      "water_pump",
      "irrigation_sluice",
      "clay_pot",
      "wooden_stool",
      "palm_leaf_basket",
      "bullock_cart"
    ]
  },

  pichavaram: {
    environment: [
      "mangrove_cluster",
      "canal",
      "mud_bank"
    ],
    props: [
      "wooden_boat",
      "fishing_net",
      "fish_crate",
      "boat_dock",
      "paddle",
      "rope"
    ]
  },

  chettinad: {
    buildings: [
      "courtyard_mansion",
      "heritage_house"
    ],
    props: [
      "carved_door",
      "wooden_column",
      "brass_vessel",
      "brass_lamp",
      "heritage_furniture",
      "athangudi_floor"
    ]
  },

  thanjavur: {
    buildings: [
      "heritage_temple_area",
      "artisan_workshop"
    ],
    props: [
      "granite_column",
      "stone_inscription",
      "bronze_art_object",
      "kuthu_vilakku",
      "temple_bell",
      "artisan_tools"
    ]
  },

  mamallapuram: {
    environment: [
      "granite_boulder",
      "coastal_rock"
    ],
    buildings: [
      "stone_workshop",
      "heritage_structure"
    ],
    props: [
      "stone_sculpture",
      "stone_carving_tools",
      "fishing_boat"
    ]
  },

  nilgiris: {
    buildings: [
      "hill_house",
      "forest_station"
    ],
    environment: [
      "tea_rows",
      "shola_tree",
      "grassland",
      "waterfall",
      "forest_path"
    ],
    props: [
      "stone_wall",
      "wooden_fence",
      "tea_basket",
      "forest_sign"
    ]
  }
};

/**
 * Metadata, local file mapping, collision proxies, and interaction definitions for all registered assets.
 * Maps directly into the 33 local directory categories under assets/.
 */
const WORLD_ASSET_METADATA = {
  // --- CHENNAI ---
  "street_row": {
    region: "chennai",
    category: "buildings",
    path: "assets/architecture/chennai/street_row.glb",
    collider: { type: "box", size: [18.0, 10.0, 7.0] },
    interactable: false,
    lod: { lod0: 25, lod1: 70, lod2: 150 }
  },
  "tea_kadai": {
    region: "chennai",
    category: "buildings",
    path: "assets/architecture/chennai/tea_kadai.glb",
    collider: { type: "box", size: [12.0, 6.0, 7.0] },
    interactable: true,
    interactionType: "tea_shop",
    interactionPrompt: "Order Fresh Meter Chai (சூடான டீ)",
    lod: { lod0: 30, lod1: 80, lod2: 160 }
  },
  "market_building": {
    region: "chennai",
    category: "buildings",
    path: "assets/architecture/chennai/market_building.glb",
    collider: { type: "box", size: [22.0, 12.0, 14.0] },
    interactable: true,
    interactionType: "market",
    interactionPrompt: "Explore Kothawal Chavadi Market",
    lod: { lod0: 35, lod1: 90, lod2: 180 }
  },
  "old_tamil_house": {
    region: "chennai",
    category: "buildings",
    path: "assets/architecture/chennai/old_tamil_house.glb",
    collider: { type: "box", size: [14.0, 8.0, 10.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Inspect Carved Teak Entrance Door",
    lod: { lod0: 25, lod1: 70, lod2: 150 }
  },
  "flower_cart": {
    region: "chennai",
    category: "props",
    path: "assets/props/market/flower_cart.glb",
    collider: { type: "box", size: [3.0, 1.8, 2.0] },
    interactable: true,
    interactionType: "craft_table",
    interactionPrompt: "Purchase Fragrant Jasmine (மல்லிகைப் பூ)",
    lod: { lod0: 20, lod1: 50, lod2: 100 }
  },
  "tea_stall": {
    region: "chennai",
    category: "props",
    path: "assets/props/food/tea_stall.glb",
    collider: { type: "box", size: [4.0, 2.5, 3.0] },
    interactable: true,
    interactionType: "tea_shop",
    lod: { lod0: 25, lod1: 60, lod2: 120 }
  },
  "old_bicycle": {
    region: "chennai",
    category: "props",
    path: "assets/vehicles/bicycle/old_bicycle.glb",
    collider: { type: "box", size: [2.0, 1.5, 0.8] },
    interactable: false,
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "wooden_bench": {
    region: "chennai",
    category: "props",
    path: "assets/props/household/wooden_bench.glb",
    collider: { type: "box", size: [3.2, 1.0, 1.0] },
    interactable: true,
    interactionType: "bench",
    interactionPrompt: "Rest on Teak Bench (ஆற்றல் மீட்டெடு)",
    lod: { lod0: 20, lod1: 50, lod2: 100 }
  },
  "brass_vessels": {
    region: "chennai",
    category: "props",
    path: "assets/props/food/brass_vessels.glb",
    collider: null, // Tiny prop - non-collidable
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Inspect Vintage Brass Samovar",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "water_pot": {
    region: "chennai",
    category: "props",
    path: "assets/props/household/water_pot.glb",
    collider: null,
    interactable: true,
    interactionType: "well",
    interactionPrompt: "Drink Cold Water (குளிர்ந்த நீர்)",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "street_sign": {
    region: "chennai",
    category: "props",
    path: "assets/props/market/street_sign.glb",
    collider: { type: "cylinder", radius: 0.15, height: 3.5 },
    interactable: false,
    lod: { lod0: 20, lod1: 50, lod2: 110 }
  },
  "electrical_pole": {
    region: "chennai",
    category: "props",
    path: "assets/architecture/chennai/electrical_pole.glb",
    collider: { type: "cylinder", radius: 0.35, height: 9.0 },
    interactable: false,
    lod: { lod0: 30, lod1: 80, lod2: 150 }
  },
  "auto_rickshaw": {
    region: "chennai",
    category: "vehicles",
    path: "assets/vehicles/auto/auto_rickshaw.glb",
    collider: { type: "box", size: [3.2, 2.2, 1.8] },
    interactable: true,
    interactionType: "auto",
    interactionPrompt: "Talk to Auto Annan Velu",
    lod: { lod0: 25, lod1: 65, lod2: 140 }
  },
  "old_motorcycle": {
    region: "chennai",
    category: "vehicles",
    path: "assets/vehicles/motorcycle/old_motorcycle.glb",
    collider: { type: "box", size: [2.4, 1.4, 1.0] },
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Inspect Vintage Bullet Tyre Tread",
    lod: { lod0: 25, lod1: 60, lod2: 120 }
  },
  "city_bus": {
    region: "chennai",
    category: "vehicles",
    path: "assets/vehicles/bus/city_bus.glb",
    collider: { type: "box", size: [11.0, 3.4, 2.8] },
    interactable: false,
    lod: { lod0: 40, lod1: 90, lod2: 180 }
  },

  // --- CAUVERY DELTA ---
  "village_house": {
    region: "cauvery_delta",
    category: "buildings",
    path: "assets/architecture/village/village_house.glb",
    collider: { type: "box", size: [10.0, 5.5, 8.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Enter Thinnai (திண்ணை)",
    lod: { lod0: 25, lod1: 70, lod2: 150 }
  },
  "cattle_shed": {
    region: "cauvery_delta",
    category: "buildings",
    path: "assets/architecture/village/cattle_shed.glb",
    collider: { type: "box", size: [8.0, 4.0, 6.0] },
    interactable: false,
    lod: { lod0: 25, lod1: 65, lod2: 130 }
  },
  "granary": {
    region: "cauvery_delta",
    category: "buildings",
    path: "assets/architecture/village/granary.glb",
    collider: { type: "box", size: [7.0, 6.0, 7.0] },
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Inspect Grain Storage (நெற்களஞ்சியம்)",
    lod: { lod0: 25, lod1: 70, lod2: 150 }
  },
  "paddy_bundle": {
    region: "cauvery_delta",
    category: "props",
    path: "assets/props/agriculture/paddy_bundle.glb",
    collider: null,
    interactable: true,
    interactionType: "paddy_field",
    interactionPrompt: "Harvest Golden Paddy Sheaf (நெற்கதிர்)",
    lod: { lod0: 15, lod1: 35, lod2: 80 }
  },
  "farm_tools": {
    region: "cauvery_delta",
    category: "props",
    path: "assets/props/agriculture/farm_tools.glb",
    collider: null,
    interactable: true,
    interactionType: "craft_table",
    interactionPrompt: "Examine Traditional Plough (ஏர் கலப்பை)",
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "water_pump": {
    region: "cauvery_delta",
    category: "props",
    path: "assets/props/agriculture/water_pump.glb",
    collider: { type: "box", size: [2.5, 2.0, 2.0] },
    interactable: true,
    interactionType: "waterwheel",
    interactionPrompt: "Activate Irrigation Pump (மின் மோட்டார்)",
    lod: { lod0: 20, lod1: 50, lod2: 110 }
  },
  "irrigation_sluice": {
    region: "cauvery_delta",
    category: "props",
    path: "assets/props/agriculture/irrigation_sluice.glb",
    collider: { type: "box", size: [5.0, 3.5, 3.0] },
    interactable: true,
    interactionType: "irrigation_sluice",
    interactionPrompt: "Adjust Canal Sluice Gate (மதகு திற)",
    lod: { lod0: 25, lod1: 65, lod2: 130 }
  },
  "clay_pot": {
    region: "cauvery_delta",
    category: "props",
    path: "assets/props/household/clay_pot.glb",
    collider: null,
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Drink from Cool Terracotta Matka (மண்பானை)",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "wooden_stool": {
    region: "cauvery_delta",
    category: "props",
    path: "assets/props/household/wooden_stool.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "palm_leaf_basket": {
    region: "cauvery_delta",
    category: "props",
    path: "assets/props/agriculture/palm_leaf_basket.glb",
    collider: null,
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Search Woven Palm Basket (ஓலைக் கூடை)",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "bullock_cart": {
    region: "cauvery_delta",
    category: "vehicles",
    path: "assets/vehicles/bullock_cart/bullock_cart.glb",
    collider: { type: "box", size: [4.5, 2.6, 2.4] },
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Examine Cart Tyre Mud Splatters",
    lod: { lod0: 25, lod1: 65, lod2: 140 }
  },

  // --- PICHAVARAM ---
  "mangrove_cluster": {
    region: "pichavaram",
    category: "environment",
    path: "assets/vegetation/mangroves/mangrove_cluster.glb",
    collider: { type: "cylinder", radius: 2.8, height: 6.0 },
    interactable: false,
    lod: { lod0: 25, lod1: 70, lod2: 150 }
  },
  "canal": {
    region: "pichavaram",
    category: "environment",
    path: "assets/environment/pichavaram/canal.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 40, lod1: 90, lod2: 180 }
  },
  "mud_bank": {
    region: "pichavaram",
    category: "environment",
    path: "assets/environment/pichavaram/mud_bank.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 30, lod1: 80, lod2: 160 }
  },
  "wooden_boat": {
    region: "pichavaram",
    category: "props",
    path: "assets/vehicles/boat/wooden_boat.glb",
    collider: { type: "box", size: [5.2, 1.6, 2.0] },
    interactable: true,
    interactionType: "boat",
    interactionPrompt: "Board Mangrove Rowboat (படகு பயணம்)",
    lod: { lod0: 25, lod1: 65, lod2: 140 }
  },
  "fishing_net": {
    region: "pichavaram",
    category: "props",
    path: "assets/props/fishing/fishing_net.glb",
    collider: null,
    interactable: true,
    interactionType: "craft_table",
    interactionPrompt: "Mend Hand-Knotted Net (மீன் வலை)",
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "fish_crate": {
    region: "pichavaram",
    category: "props",
    path: "assets/props/fishing/fish_crate.glb",
    collider: { type: "box", size: [1.2, 0.8, 1.0] },
    interactable: true,
    interactionType: "quest_item",
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "boat_dock": {
    region: "pichavaram",
    category: "props",
    path: "assets/props/fishing/boat_dock.glb",
    collider: { type: "box", size: [8.0, 1.2, 3.5] },
    interactable: false,
    lod: { lod0: 25, lod1: 65, lod2: 140 }
  },
  "paddle": {
    region: "pichavaram",
    category: "props",
    path: "assets/props/fishing/paddle.glb",
    collider: null,
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Pick Up Carved Wood Paddle (துடுப்பு)",
    lod: { lod0: 15, lod1: 30, lod2: 60 }
  },
  "rope": {
    region: "pichavaram",
    category: "props",
    path: "assets/props/fishing/rope.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 15, lod1: 30, lod2: 60 }
  },

  // --- CHETTINAD ---
  "courtyard_mansion": {
    region: "chettinad",
    category: "buildings",
    path: "assets/architecture/chettinad/courtyard_mansion.glb",
    collider: { type: "box", size: [30.0, 12.0, 24.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Enter Grand Valavu Courtyard (வளவு)",
    lod: { lod0: 40, lod1: 100, lod2: 200 }
  },
  "heritage_house": {
    region: "chettinad",
    category: "buildings",
    path: "assets/architecture/chettinad/heritage_house.glb",
    collider: { type: "box", size: [18.0, 9.0, 14.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Inspect Burmese Teak Main Threshold",
    lod: { lod0: 30, lod1: 80, lod2: 160 }
  },
  "carved_door": {
    region: "chettinad",
    category: "props",
    path: "assets/architecture/chettinad/carved_door.glb",
    collider: { type: "box", size: [2.5, 3.5, 0.6] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Unlock Intricately Carved Door (கதவு)",
    lod: { lod0: 20, lod1: 50, lod2: 100 }
  },
  "wooden_column": {
    region: "chettinad",
    category: "props",
    path: "assets/architecture/chettinad/wooden_column.glb",
    collider: { type: "cylinder", radius: 0.45, height: 6.0 },
    interactable: false,
    lod: { lod0: 20, lod1: 55, lod2: 110 }
  },
  "brass_vessel": {
    region: "chettinad",
    category: "props",
    path: "assets/props/household/brass_vessel.glb",
    collider: null,
    interactable: true,
    interactionType: "quest_item",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "brass_lamp": {
    region: "chettinad",
    category: "props",
    path: "assets/props/temple/brass_lamp.glb",
    collider: null,
    interactable: true,
    interactionType: "lamp",
    interactionPrompt: "Light Chettinad Kuthu Vilakku (விளக்கேற்று)",
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "heritage_furniture": {
    region: "chettinad",
    category: "props",
    path: "assets/props/household/heritage_furniture.glb",
    collider: { type: "box", size: [2.4, 1.8, 1.2] },
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Search Antique Rosewood Chest (பழைய பெட்டி)",
    lod: { lod0: 20, lod1: 50, lod2: 100 }
  },
  "athangudi_floor": {
    region: "chettinad",
    category: "props",
    path: "assets/architecture/chettinad/athangudi_floor.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 25, lod1: 60, lod2: 130 }
  },

  // --- THANJAVUR ---
  "heritage_temple_area": {
    region: "thanjavur",
    category: "buildings",
    path: "assets/architecture/thanjavur/heritage_temple_area.glb",
    collider: { type: "box", size: [28.0, 18.0, 22.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Enter Chola Granite Mandapam",
    lod: { lod0: 45, lod1: 110, lod2: 240 }
  },
  "artisan_workshop": {
    region: "thanjavur",
    category: "buildings",
    path: "assets/architecture/thanjavur/artisan_workshop.glb",
    collider: { type: "box", size: [12.0, 5.0, 9.0] },
    interactable: true,
    interactionType: "craft_table",
    interactionPrompt: "Examine Lost-Wax Bronze Casting Crucible",
    lod: { lod0: 25, lod1: 70, lod2: 150 }
  },
  "granite_column": {
    region: "thanjavur",
    category: "props",
    path: "assets/props/temple/granite_column.glb",
    collider: { type: "cylinder", radius: 0.6, height: 7.0 },
    interactable: false,
    lod: { lod0: 25, lod1: 65, lod2: 130 }
  },
  "stone_inscription": {
    region: "thanjavur",
    category: "props",
    path: "assets/props/temple/stone_inscription.glb",
    collider: { type: "box", size: [2.0, 3.0, 0.8] },
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Decipher Ancient Script [Fictional Game-World Writing]",
    isFictionalWriting: true, // Note: explicitly labeled per Requirement 8
    lod: { lod0: 20, lod1: 50, lod2: 100 }
  },
  "bronze_art_object": {
    region: "thanjavur",
    category: "props",
    path: "assets/props/craft/bronze_art_object.glb",
    collider: null,
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Study Thanjavur Bronze Sculpture",
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "kuthu_vilakku": {
    region: "thanjavur",
    category: "props",
    path: "assets/props/temple/kuthu_vilakku.glb",
    collider: null,
    interactable: true,
    interactionType: "lamp",
    interactionPrompt: "Ignite Sacred Brass Diya",
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "temple_bell": {
    region: "thanjavur",
    category: "props",
    path: "assets/props/temple/temple_bell.glb",
    collider: null,
    interactable: true,
    interactionType: "bell",
    interactionPrompt: "Ring Resonant Bronze Bell (மணி ஓசை)",
    lod: { lod0: 15, lod1: 40, lod2: 80 }
  },
  "artisan_tools": {
    region: "thanjavur",
    category: "props",
    path: "assets/props/craft/artisan_tools.glb",
    collider: null,
    interactable: true,
    interactionType: "craft_table",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },

  // --- MAMALLAPURAM ---
  "granite_boulder": {
    region: "mamallapuram",
    category: "environment",
    path: "assets/environment/mamallapuram/granite_boulder.glb",
    collider: { type: "box", size: [6.0, 5.0, 6.0] },
    interactable: false,
    lod: { lod0: 30, lod1: 80, lod2: 160 }
  },
  "coastal_rock": {
    region: "mamallapuram",
    category: "environment",
    path: "assets/environment/mamallapuram/coastal_rock.glb",
    collider: { type: "box", size: [8.0, 4.0, 7.0] },
    interactable: false,
    lod: { lod0: 30, lod1: 80, lod2: 160 }
  },
  "stone_workshop": {
    region: "mamallapuram",
    category: "buildings",
    path: "assets/architecture/mamallapuram/stone_workshop.glb",
    collider: { type: "box", size: [14.0, 6.0, 10.0] },
    interactable: true,
    interactionType: "craft_table",
    interactionPrompt: "Inspect Shore Sculptor Workshop",
    lod: { lod0: 30, lod1: 80, lod2: 160 }
  },
  "heritage_structure": {
    region: "mamallapuram",
    category: "buildings",
    path: "assets/architecture/mamallapuram/heritage_structure.glb",
    collider: { type: "box", size: [16.0, 14.0, 14.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Examine Monolithic Shore Shrine",
    lod: { lod0: 40, lod1: 100, lod2: 220 }
  },
  "stone_sculpture": {
    region: "mamallapuram",
    category: "props",
    path: "assets/props/craft/stone_sculpture.glb",
    collider: { type: "box", size: [2.5, 3.5, 2.0] },
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Inspect Bas-Relief Carving (சிற்பம்)",
    lod: { lod0: 20, lod1: 50, lod2: 110 }
  },
  "stone_carving_tools": {
    region: "mamallapuram",
    category: "props",
    path: "assets/props/craft/stone_carving_tools.glb",
    collider: null,
    interactable: true,
    interactionType: "craft_table",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "fishing_boat": {
    region: "mamallapuram",
    category: "props",
    path: "assets/vehicles/boat/fishing_boat.glb",
    collider: { type: "box", size: [6.5, 2.2, 2.4] },
    interactable: true,
    interactionType: "boat",
    interactionPrompt: "Inspect Catamaran Fishing Craft (கட்டுமரம்)",
    lod: { lod0: 25, lod1: 65, lod2: 140 }
  },

  // --- NILGIRIS ---
  "hill_house": {
    region: "nilgiris",
    category: "buildings",
    path: "assets/architecture/nilgiris/hill_house.glb",
    collider: { type: "box", size: [12.0, 7.0, 9.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Seek Warmth in Tea Estate Bungalow",
    lod: { lod0: 30, lod1: 80, lod2: 170 }
  },
  "forest_station": {
    region: "nilgiris",
    category: "buildings",
    path: "assets/architecture/nilgiris/forest_station.glb",
    collider: { type: "box", size: [14.0, 7.5, 10.0] },
    interactable: true,
    interactionType: "door",
    interactionPrompt: "Report to Nilgiri Biosphere Ranger Outpost",
    lod: { lod0: 30, lod1: 85, lod2: 175 }
  },
  "tea_rows": {
    region: "nilgiris",
    category: "environment",
    path: "assets/vegetation/tea/tea_rows.glb",
    collider: null,
    interactable: true,
    interactionType: "paddy_field",
    interactionPrompt: "Pluck Fresh Two Leaves & A Bud (தேயிலை)",
    lod: { lod0: 25, lod1: 65, lod2: 140 }
  },
  "shola_tree": {
    region: "nilgiris",
    category: "environment",
    path: "assets/vegetation/shola/shola_tree.glb",
    collider: { type: "cylinder", radius: 0.9, height: 12.0 },
    interactable: false,
    lod: { lod0: 30, lod1: 80, lod2: 170 }
  },
  "grassland": {
    region: "nilgiris",
    category: "environment",
    path: "assets/environment/nilgiris/grassland.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 35, lod1: 85, lod2: 180 }
  },
  "waterfall": {
    region: "nilgiris",
    category: "environment",
    path: "assets/environment/nilgiris/waterfall.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 45, lod1: 110, lod2: 240 }
  },
  "forest_path": {
    region: "nilgiris",
    category: "environment",
    path: "assets/environment/nilgiris/forest_path.glb",
    collider: null,
    interactable: false,
    lod: { lod0: 30, lod1: 80, lod2: 160 }
  },
  "stone_wall": {
    region: "nilgiris",
    category: "props",
    path: "assets/props/agriculture/stone_wall.glb",
    collider: { type: "box", size: [10.0, 1.8, 0.8] },
    interactable: false,
    lod: { lod0: 25, lod1: 65, lod2: 130 }
  },
  "wooden_fence": {
    region: "nilgiris",
    category: "props",
    path: "assets/props/agriculture/wooden_fence.glb",
    collider: { type: "box", size: [8.0, 1.4, 0.3] },
    interactable: false,
    lod: { lod0: 20, lod1: 55, lod2: 110 }
  },
  "tea_basket": {
    region: "nilgiris",
    category: "props",
    path: "assets/props/agriculture/tea_basket.glb",
    collider: null,
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Inspect Woven Bamboo Tea Picker Basket",
    lod: { lod0: 15, lod1: 35, lod2: 70 }
  },
  "forest_sign": {
    region: "nilgiris",
    category: "props",
    path: "assets/props/agriculture/forest_sign.glb",
    collider: { type: "cylinder", radius: 0.15, height: 2.5 },
    interactable: true,
    interactionType: "quest_item",
    interactionPrompt: "Read Wildlife Trail Warning Sign",
    lod: { lod0: 20, lod1: 45, lod2: 90 }
  }
};

if (typeof window !== 'undefined') {
  window.WORLD_ASSETS = WORLD_ASSETS;
  window.WORLD_ASSET_METADATA = WORLD_ASSET_METADATA;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WORLD_ASSETS, WORLD_ASSET_METADATA };
}
