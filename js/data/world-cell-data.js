/**
 * The Whispering Wilds (Kaattu Vazhi) - World Cell Data
 * 28 Interlocking Spatial Cells across all 7 Tamil Nadu Regions:
 * CHENNAI, CAUVERY_DELTA, PICHAVARAM, CHETTINAD, THANJAVUR, MAMALLAPURAM, NILGIRIS.
 *
 * Each cell defines authoritative spatial bounds (AABB), asset dependencies,
 * gameplay objects, neighbor topology, terrain characteristics, and entity links.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WORLD_CELL_DATA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CELLS = {
    // =========================================================================
    // 1. CHENNAI (Historic George Town, Harbor & Red Soil Plains)
    // =========================================================================
    CELL_CHE_001: {
      id: 'CELL_CHE_001',
      regionId: 'CHENNAI',
      name: 'High Court & North Gate',
      tamilName: 'மதராஸ் உயர் நீதிமன்றம் & வடக்கு வாயில்',
      bounds: { minX: -290, maxX: -245, minY: -5, maxY: 60, minZ: -45, maxZ: 0 },
      priority: 1,
      assets: ['chennai_arch_gate', 'high_court_facade', 'terracotta_brick_wall', 'british_pillar_lantern'],
      gameplayObjects: ['evidence_court_briefcase', 'tea_kadai_bench_01', 'notice_board_madras'],
      neighbors: ['CELL_CHE_002', 'CELL_CHE_003'],
      terrain: { baseHeight: 1.5, biome: 'chennai_plains', groundMaterial: 'red_laterite_soil' },
      water: null,
      npcs: ['tea_master', 'archivist_natarajan'],
      wildlife: ['stray_dog_01', 'urban_crow_flock'],
      trafficRoutes: ['route_che_gt_01'],
      ambientAudio: 'chennai_morning_traffic_flower_market'
    },
    CELL_CHE_002: {
      id: 'CELL_CHE_002',
      regionId: 'CHENNAI',
      name: 'Kotwal Chavadi Flower Bazaar',
      tamilName: 'கொத்தவால் சாவடி பூ மார்க்கெட்',
      bounds: { minX: -290, maxX: -245, minY: -5, maxY: 60, minZ: 0, maxZ: 45 },
      priority: 2,
      assets: ['bazaar_stall_cluster', 'flower_basket_rows', 'marigold_canopy', 'wooden_cart_props'],
      gameplayObjects: ['jasmine_crate_interactive', 'fragrant_garland_stall'],
      neighbors: ['CELL_CHE_001', 'CELL_CHE_004'],
      terrain: { baseHeight: 1.2, biome: 'chennai_plains', groundMaterial: 'cobble_red_earth' },
      water: null,
      npcs: ['flower_seller_selvi', 'auto_driver_kumar'],
      wildlife: ['stray_dog_02', 'city_pigeon_cluster'],
      trafficRoutes: ['route_che_gt_02'],
      ambientAudio: 'busy_bazaar_auto_horns_vendors'
    },
    CELL_CHE_003: {
      id: 'CELL_CHE_003',
      regionId: 'CHENNAI',
      name: 'Central Rail Terminal Outskirts',
      tamilName: 'மத்திய ரயில் நிலைய எல்லை',
      bounds: { minX: -245, maxX: -200, minY: -5, maxY: 60, minZ: -45, maxZ: 0 },
      priority: 2,
      assets: ['brick_overpass_bridge', 'telegraph_poles', 'railway_signal_post', 'cargo_wooden_pallets'],
      gameplayObjects: ['signal_control_lever', 'railway_freight_crate'],
      neighbors: ['CELL_CHE_001', 'CELL_CHE_004', 'CELL_CAU_001'],
      terrain: { baseHeight: 1.8, biome: 'chennai_plains', groundMaterial: 'gravel_iron_tracks' },
      water: null,
      npcs: ['provision_merchant', 'scooter_mechanic'],
      wildlife: ['black_kite_soaring'],
      trafficRoutes: ['route_che_express_01'],
      ambientAudio: 'rail_whistle_distance_diesel'
    },
    CELL_CHE_004: {
      id: 'CELL_CHE_004',
      regionId: 'CHENNAI',
      name: 'Grand Southern Trunk Highway Boundary',
      tamilName: 'ஜிஎஸ்டி சாலை எல்லை வழி',
      bounds: { minX: -245, maxX: -200, minY: -5, maxY: 60, minZ: 0, maxZ: 45 },
      priority: 3,
      assets: ['milestone_granite_marker', 'roadside_neem_tree', 'tea_shack_asbestos', 'highway_barrier'],
      gameplayObjects: ['milestone_inspect_chennai_0', 'water_pandal_clay_pot'],
      neighbors: ['CELL_CHE_002', 'CELL_CHE_003', 'CELL_CAU_002'],
      terrain: { baseHeight: 2.1, biome: 'chennai_plains', groundMaterial: 'red_laterite_soil' },
      water: null,
      npcs: ['highway_tea_stall_boy'],
      wildlife: ['highway_cow_cluster'],
      trafficRoutes: ['route_che_gst_trunk'],
      ambientAudio: 'coastal_harbor_foghorn_quiet_chatter'
    },

    // =========================================================================
    // 2. CAUVERY_DELTA (Granary Basin, Sluice Canals & Farmlands)
    // =========================================================================
    CELL_CAU_001: {
      id: 'CELL_CAU_001',
      regionId: 'CAUVERY_DELTA',
      name: 'Grand Anicut Sluice Waterways',
      tamilName: 'கல்லணை நீர் மதகுகள்',
      bounds: { minX: -200, maxX: -155, minY: -10, maxY: 50, minZ: -45, maxZ: 0 },
      priority: 1,
      assets: ['chola_granite_weir', 'iron_gear_sluice_gate', 'irrigation_bamboo_flume', 'mud_dyke_mesh'],
      gameplayObjects: ['sluice_crank_mechanism', 'water_flow_measuring_stick'],
      neighbors: ['CELL_CHE_003', 'CELL_CAU_002', 'CELL_CAU_003', 'CELL_PIC_001'],
      terrain: { baseHeight: 1.0, biome: 'cauvery_delta', groundMaterial: 'river_silt_loam' },
      water: { level: 0.2, flowDirection: { x: 1, z: 0 }, type: 'river' },
      npcs: ['sluice_operator_marimuthu'],
      wildlife: ['pond_heron', 'water_snake_diver'],
      trafficRoutes: ['route_cau_canal_boat'],
      ambientAudio: 'canal_water_flow_gurgle'
    },
    CELL_CAU_002: {
      id: 'CELL_CAU_002',
      regionId: 'CAUVERY_DELTA',
      name: 'Kumbakonam Green Paddy Terraces',
      tamilName: 'கும்பகோணம் பசுமை நெல்வயல்கள்',
      bounds: { minX: -200, maxX: -155, minY: -10, maxY: 50, minZ: 0, maxZ: 45 },
      priority: 2,
      assets: ['paddy_water_mesh_grid', 'scarecrow_straw_effigy', 'thatched_watch_shed', 'banana_grove_patch'],
      gameplayObjects: ['grain_sheaf_harvest_bundle', 'scarecrow_inspect_secret'],
      neighbors: ['CELL_CHE_004', 'CELL_CAU_001', 'CELL_CAU_004'],
      terrain: { baseHeight: 1.4, biome: 'cauvery_delta', groundMaterial: 'fertile_alluvial_mud' },
      water: null,
      npcs: ['paddy_farmer_vellaiyan'],
      wildlife: ['cattle_pair_yoked', 'egret_stalking_fish'],
      trafficRoutes: ['route_cau_bullock_track'],
      ambientAudio: 'paddy_field_work_bullock_bells'
    },
    CELL_CAU_003: {
      id: 'CELL_CAU_003',
      regionId: 'CAUVERY_DELTA',
      name: 'Vennar River Crossing & Ferry',
      tamilName: 'வெண்ணாறு நதி படகுத்துறை',
      bounds: { minX: -155, maxX: -110, minY: -10, maxY: 50, minZ: -45, maxZ: 0 },
      priority: 2,
      assets: ['wooden_ferry_raft', 'river_boulder_stepping_stones', 'tall_reeds_cluster', 'banyan_roots_hanging'],
      gameplayObjects: ['ferry_pull_rope_mechanism', 'ferryman_bell_signal'],
      neighbors: ['CELL_CAU_001', 'CELL_CAU_004', 'CELL_PIC_002', 'CELL_THA_001'],
      terrain: { baseHeight: 0.6, biome: 'cauvery_delta', groundMaterial: 'fine_river_sand' },
      water: { level: 0.3, flowDirection: { x: 0.8, z: 0.2 }, type: 'river' },
      npcs: ['ferryman_ramasamy'],
      wildlife: ['river_tern_diving', 'freshwater_turtle'],
      trafficRoutes: ['route_cau_ferry_line'],
      ambientAudio: 'delta_river_flow'
    },
    CELL_CAU_004: {
      id: 'CELL_CAU_004',
      regionId: 'CAUVERY_DELTA',
      name: 'Agrarian Hamlet & Terracotta Kilns',
      tamilName: 'கிராமப்புற களம் & மண்பாண்ட சூளை',
      bounds: { minX: -155, maxX: -110, minY: -10, maxY: 50, minZ: 0, maxZ: 45 },
      priority: 3,
      assets: ['village_mud_house_tile_roof', 'grain_kuthir_silo', 'potters_wheel_shed', 'haystack_cone'],
      gameplayObjects: ['clay_potters_wheel_spin', 'grain_storage_inspection'],
      neighbors: ['CELL_CAU_002', 'CELL_CAU_003', 'CELL_CHT_001', 'CELL_THA_002'],
      terrain: { baseHeight: 1.6, biome: 'cauvery_delta', groundMaterial: 'hard_baked_earth' },
      water: null,
      npcs: ['village_potter_arasan', 'cattle_herder_palanisamy'],
      wildlife: ['desi_chickens_free_range', 'spotted_deer_boundary'],
      trafficRoutes: ['route_cau_village_cart'],
      ambientAudio: 'temple_conch_cattle_returning'
    },

    // =========================================================================
    // 3. PICHAVARAM (Mangrove Wetlands, Tidal Estuary & Brackish Canals)
    // =========================================================================
    CELL_PIC_001: {
      id: 'CELL_PIC_001',
      regionId: 'PICHAVARAM',
      name: 'Chidambaram Tidal Channel & Moorings',
      tamilName: 'சிதம்பரம் சதுப்புநில முகத்துவாரம் & படகுத்துறை',
      bounds: { minX: -110, maxX: -70, minY: -15, maxY: 40, minZ: -70, maxZ: -35 },
      priority: 1,
      assets: ['timber_dock_jetty', 'rhizophora_mangrove_arch', 'tide_gauge_bamboo_pole', 'coir_tied_pirogue'],
      gameplayObjects: ['boat_boarding_cleat', 'tide_chart_carved_plank'],
      neighbors: ['CELL_CAU_001', 'CELL_PIC_002', 'CELL_PIC_003'],
      terrain: { baseHeight: -0.8, biome: 'pichavaram_delta', groundMaterial: 'estuary_black_mud' },
      water: { level: 0.1, flowDirection: { x: 0.3, z: 0.7 }, type: 'brackish_tidal' },
      npcs: ['boat_navigator_chidambaram'],
      wildlife: ['mudskipper_cluster', 'mangrove_crab_blue'],
      trafficRoutes: ['route_pic_tourist_boat'],
      ambientAudio: 'estuary_water_lapping_heron_cries'
    },
    CELL_PIC_002: {
      id: 'CELL_PIC_002',
      regionId: 'PICHAVARAM',
      name: 'Estuary Lagoon & Cast Net Racks',
      tamilName: 'காயல் நீர் பரப்பு & வீச்சு வலை உலர்த்தி',
      bounds: { minX: -110, maxX: -70, minY: -15, maxY: 40, minZ: -35, maxZ: 0 },
      priority: 2,
      assets: ['cast_net_bamboo_drying_rack', 'palm_thatch_angler_hut', 'saline_driftwood_snag', 'stilt_roots_dense'],
      gameplayObjects: ['cast_net_repair_spot', 'fisherman_fish_trap_basket'],
      neighbors: ['CELL_CAU_003', 'CELL_PIC_001', 'CELL_PIC_004'],
      terrain: { baseHeight: -0.4, biome: 'pichavaram_delta', groundMaterial: 'brackish_marsh_soil' },
      water: { level: 0.1, flowDirection: { x: 0.5, z: 0.2 }, type: 'brackish_tidal' },
      npcs: ['estuary_fisher_muthu', 'net_repairer_kali'],
      wildlife: ['white_bellied_sea_eagle', 'smooth_coated_otter'],
      trafficRoutes: ['route_pic_fisher_canoe'],
      ambientAudio: 'boat_paddle_splashes_mud_crabs'
    },
    CELL_PIC_003: {
      id: 'CELL_PIC_003',
      regionId: 'PICHAVARAM',
      name: 'Submerged Mangrove Root Maze',
      tamilName: 'மூழ்கிய வேர் வளைவுகள் & நடுக்காட்டு வழி',
      bounds: { minX: -70, maxX: -30, minY: -15, maxY: 40, minZ: -70, maxZ: -35 },
      priority: 2,
      assets: ['intertwined_stilt_canopy', 'overhanging_creeper_vines', 'sunken_dugout_canoe_remains', 'floating_marsh_pads'],
      gameplayObjects: ['sunken_cargo_chest_salvage', 'botanical_rare_mangrove_specimen'],
      neighbors: ['CELL_PIC_001', 'CELL_PIC_004', 'CELL_MAM_001'],
      terrain: { baseHeight: -1.2, biome: 'pichavaram_delta', groundMaterial: 'deep_saline_sludge' },
      water: { level: 0.1, flowDirection: { x: 0.2, z: -0.4 }, type: 'brackish_tidal' },
      npcs: ['hermit_mangrove_botanist'],
      wildlife: ['water_monitor_lizard', 'pied_kingfisher_hover'],
      trafficRoutes: ['route_pic_secret_channel'],
      ambientAudio: 'tidal_surge_kingfisher_calls'
    },
    CELL_PIC_004: {
      id: 'CELL_PIC_004',
      regionId: 'PICHAVARAM',
      name: 'Watchtower & Avian Sanctuary Outlook',
      tamilName: 'பறவைகள் சரணாலயம் கண்காணிப்பு கோபுரம்',
      bounds: { minX: -70, maxX: -30, minY: -15, maxY: 40, minZ: -35, maxZ: 0 },
      priority: 3,
      assets: ['timber_watchtower_triangular', 'rope_ladder_observation', 'birding_telescope_tripod', 'saline_bush_cover'],
      gameplayObjects: ['watchtower_vantage_telescope', 'migratory_bird_logbook'],
      neighbors: ['CELL_PIC_002', 'CELL_PIC_003', 'CELL_CHT_001', 'CELL_MAM_002'],
      terrain: { baseHeight: 0.5, biome: 'pichavaram_delta', groundMaterial: 'coastal_shell_sand' },
      water: null,
      npcs: ['sanctuary_ranger_anbarasan'],
      wildlife: ['greater_flamingo_flock', 'painted_stork_nest'],
      trafficRoutes: ['route_pic_patrol_skiff'],
      ambientAudio: 'nocturnal_waterfowl_cicadas'
    },

    // =========================================================================
    // 4. CHETTINAD (Palatial Mansions, Athangudi Tiles & Red Clay Parkland)
    // =========================================================================
    CELL_CHT_001: {
      id: 'CELL_CHT_001',
      regionId: 'CHETTINAD',
      name: 'Kanadukathan Valavu Veedu Portal',
      tamilName: 'கானாடுகாத்தான் வளவு வீடு முகப்பு',
      bounds: { minX: -30, maxX: 10, minY: -5, maxY: 60, minZ: -30, maxZ: 10 },
      priority: 1,
      assets: ['chettinad_teak_arch_doorway', 'brass_lion_door_knocker', 'granite_thinnai_veranda', 'carved_burmese_teak_pillars'],
      gameplayObjects: ['heavy_teak_door_lock_puzzle', 'veranda_brass_urinai_inspect'],
      neighbors: ['CELL_CAU_004', 'CELL_PIC_004', 'CELL_CHT_002', 'CELL_CHT_003', 'CELL_THA_002'],
      terrain: { baseHeight: 2.2, biome: 'chettinad_heritage', groundMaterial: 'red_gravel_clay' },
      water: null,
      npcs: ['mansion_caretaker_meenakshi'],
      wildlife: ['village_myna_cluster'],
      trafficRoutes: ['route_cht_mansion_lane'],
      ambientAudio: 'breeze_through_teak_lattices'
    },
    CELL_CHT_002: {
      id: 'CELL_CHT_002',
      regionId: 'CHETTINAD',
      name: 'Open Sky Muttam & Athangudi Tile Hall',
      tamilName: 'திறந்தவெளி முற்றம் & ஆத்தங்குடி தரை மண்டபம்',
      bounds: { minX: -30, maxX: 10, minY: -5, maxY: 60, minZ: 10, maxZ: 45 },
      priority: 2,
      assets: ['athangudi_pattern_tile_floor', 'granite_rainwater_drain_cistern', 'brass_kuthu_vilakku', 'teak_grain_storage_loft'],
      gameplayObjects: ['rainwater_cistern_water_collection', 'athangudi_tile_geometry_puzzle'],
      neighbors: ['CELL_CHT_001', 'CELL_CHT_004'],
      terrain: { baseHeight: 2.4, biome: 'chettinad_heritage', groundMaterial: 'athangudi_tiled_pavement' },
      water: null,
      npcs: ['chettinad_cook_karuppiah'],
      wildlife: ['house_sparrow_roosting'],
      trafficRoutes: [],
      ambientAudio: 'brass_vessel_clinking_wood_polishing'
    },
    CELL_CHT_003: {
      id: 'CELL_CHT_003',
      regionId: 'CHETTINAD',
      name: 'Athangudi Artisan Workshop & Tile Press',
      tamilName: 'ஆத்தங்குடி கைவினைஞர் கூடம் & கண்ணாடி வார்ப்பு',
      bounds: { minX: 10, maxX: 50, minY: -5, maxY: 60, minZ: -30, maxZ: 10 },
      priority: 2,
      assets: ['manual_tile_hydraulic_press', 'glass_casting_mould_rack', 'mineral_pigment_jars', 'curing_water_vat'],
      gameplayObjects: ['mineral_pigment_mixing_table', 'custom_tile_press_lever'],
      neighbors: ['CELL_CHT_001', 'CELL_CHT_004', 'CELL_THA_003'],
      terrain: { baseHeight: 2.0, biome: 'chettinad_heritage', groundMaterial: 'red_soil_mortar_dust' },
      water: null,
      npcs: ['athangudi_tilemaker_gandhi'],
      wildlife: ['squirrel_palmyra_scamper'],
      trafficRoutes: ['route_cht_artisan_cart'],
      ambientAudio: 'wood_polishing_courtyard_sweeping'
    },
    CELL_CHT_004: {
      id: 'CELL_CHT_004',
      regionId: 'CHETTINAD',
      name: 'Dry Scrub Forest & Ancient Palmyra Belt',
      tamilName: 'முல்லை முட்புதர் காடு & பனை மரத்தோப்பு',
      bounds: { minX: 10, maxX: 50, minY: -5, maxY: 60, minZ: 10, maxZ: 45 },
      priority: 3,
      assets: ['palmyra_palm_grove', 'tamarind_shade_canopy', 'dry_clay_water_bund', 'thorny_carissa_bushes'],
      gameplayObjects: ['palmyra_nectar_pot_harvest', 'tamarind_foraging_cluster'],
      neighbors: ['CELL_CHT_002', 'CELL_CHT_003', 'CELL_THA_004', 'CELL_NIL_001'],
      terrain: { baseHeight: 2.6, biome: 'chettinad_heritage', groundMaterial: 'parched_red_laterite' },
      water: null,
      npcs: ['palmyra_climber_muthuvel'],
      wildlife: ['indian_grey_hornbill', 'blackbuck_antelope_herd'],
      trafficRoutes: ['route_cht_rural_highway'],
      ambientAudio: 'palmyra_wind_dry_rustle'
    },

    // =========================================================================
    // 5. THANJAVUR (Chola Classical Arts, Granite Temple & Cauvery Silt)
    // =========================================================================
    CELL_THA_001: {
      id: 'CELL_THA_001',
      regionId: 'THANJAVUR',
      name: 'Brihadisvara Temple Western Gateway',
      tamilName: 'பிரகதீஸ்வரர் மேற்கு கோபுர நுழைவாயில்',
      bounds: { minX: 50, maxX: 85, minY: -5, maxY: 75, minZ: -40, maxZ: 0 },
      priority: 1,
      assets: ['chola_granite_gopuram_monolith', 'carved_dwarapalaka_sentinels', 'stepped_theertham_tank', 'stone_inscribed_wall'],
      gameplayObjects: ['ancient_tamil_stone_inscription', 'sacred_theertham_water_cleansing'],
      neighbors: ['CELL_CAU_003', 'CELL_THA_002', 'CELL_THA_003'],
      terrain: { baseHeight: 1.8, biome: 'thanjavur_temple', groundMaterial: 'polished_granite_flags' },
      water: null,
      npcs: ['vedic_scholar_raghavan'],
      wildlife: ['temple_bat_colony', 'peacock_roosting'],
      trafficRoutes: ['route_tha_temple_chariot'],
      ambientAudio: 'nadaswaram_morning_raga_chisel_strikes'
    },
    CELL_THA_002: {
      id: 'CELL_THA_002',
      regionId: 'THANJAVUR',
      name: 'Shivaganga Sacred Tank & Mandapams',
      tamilName: 'சிவகங்கை திருக்குளம் & தூண் மண்டபங்கள்',
      bounds: { minX: 50, maxX: 85, minY: -5, maxY: 75, minZ: 0, maxZ: 40 },
      priority: 2,
      assets: ['granite_colonnade_mandapam', 'stepped_ghat_stone_bank', 'lotus_theertham_surface', 'carved_nandi_shrine'],
      gameplayObjects: ['sacred_lotus_flower_harvest', 'mandapam_acoustic_resonance_spot'],
      neighbors: ['CELL_CAU_004', 'CELL_CHT_001', 'CELL_THA_001', 'CELL_THA_004'],
      terrain: { baseHeight: 1.5, biome: 'thanjavur_temple', groundMaterial: 'dressed_granite_ashlar' },
      water: { level: 0.4, flowDirection: { x: 0, z: 0 }, type: 'temple_tank' },
      npcs: ['temple_priest_sundaram'],
      wildlife: ['sacred_koi_cluster', 'temple_pigeon_flock'],
      trafficRoutes: [],
      ambientAudio: 'temple_drum_beating_cymbals'
    },
    CELL_THA_003: {
      id: 'CELL_THA_003',
      regionId: 'THANJAVUR',
      name: 'Swamimalai Lost-Wax Bronze Foundries',
      tamilName: 'சுவாமிமலை வெண்கல வார்ப்பு பட்டறை',
      bounds: { minX: 85, maxX: 120, minY: -5, maxY: 75, minZ: -40, maxZ: 0 },
      priority: 2,
      assets: ['charcoal_clay_furnace', 'beeswax_sculpture_armature', 'crucible_pouring_rig', 'cast_bronze_nataraja_statue'],
      gameplayObjects: ['furnace_bellows_operation', 'bronze_chisel_detailing_station'],
      neighbors: ['CELL_THA_001', 'CELL_CHT_003', 'CELL_THA_004', 'CELL_MAM_003'],
      terrain: { baseHeight: 2.0, biome: 'thanjavur_temple', groundMaterial: 'foundry_brick_ash' },
      water: null,
      npcs: ['bronze_sculptor_devasenapathy'],
      wildlife: ['village_crow_perched'],
      trafficRoutes: ['route_tha_craftsman_lane'],
      ambientAudio: 'bronze_polishing_veena_tuning_hammering'
    },
    CELL_THA_004: {
      id: 'CELL_THA_004',
      regionId: 'THANJAVUR',
      name: 'Saraswathi Mahal & Tanjore Painting Agrahara',
      tamilName: 'சரஸ்வதி மகால் & தஞ்சாவூர் ஓவிய அக்ரஹாரம்',
      bounds: { minX: 85, maxX: 120, minY: -5, maxY: 75, minZ: 0, maxZ: 40 },
      priority: 3,
      assets: ['palm_leaf_manuscript_racks', 'gold_foil_easel_station', 'jackfruit_wood_veena_bodies', 'agrahara_sloped_roof_row'],
      gameplayObjects: ['palm_leaf_manuscript_reading', 'veena_tuning_peg_interaction'],
      neighbors: ['CELL_THA_002', 'CELL_THA_003', 'CELL_CHT_004', 'CELL_MAM_004'],
      terrain: { baseHeight: 2.2, biome: 'thanjavur_temple', groundMaterial: 'red_brick_paver' },
      water: null,
      npcs: ['veena_maker_narayanan', 'tanjore_painter_jayalakshmi'],
      wildlife: ['brahminy_starling'],
      trafficRoutes: ['route_tha_heritage_car'],
      ambientAudio: 'distant_flute_crickets'
    },

    // =========================================================================
    // 6. MAMALLAPURAM (Shore Temple, Rock-Cut Caves & Monolithic Rathas)
    // =========================================================================
    CELL_MAM_001: {
      id: 'CELL_MAM_001',
      regionId: 'MAMALLAPURAM',
      name: 'Shore Temple Monolithic Sea Wall',
      tamilName: 'மாமல்லபுரம் கடற்கரை கோயில் & அலைத்தடுப்பு பாறை',
      bounds: { minX: 120, maxX: 155, minY: -10, maxY: 55, minZ: -65, maxZ: -25 },
      priority: 1,
      assets: ['pallava_shore_temple_vimana', 'granite_bull_parapet_row', 'sea_breaker_monolith_blocks', 'salt_encrusted_carvings'],
      gameplayObjects: ['coastal_driftwood_salvage', 'submerged_chola_coin_cache'],
      neighbors: ['CELL_PIC_003', 'CELL_MAM_002', 'CELL_MAM_003'],
      terrain: { baseHeight: 0.8, biome: 'mamallapuram_rock', groundMaterial: 'saline_beach_sand_granite' },
      water: { level: 0.2, flowDirection: { x: -0.5, z: 0.8 }, type: 'ocean_surf' },
      npcs: ['catamaran_fisher_munusamy'],
      wildlife: ['sea_turtle_nesting', 'seagull_flock_surf'],
      trafficRoutes: ['route_mam_shore_catamaran'],
      ambientAudio: 'ocean_breakers_chisel_rhythmic_taps'
    },
    CELL_MAM_002: {
      id: 'CELL_MAM_002',
      regionId: 'MAMALLAPURAM',
      name: "Arjuna's Penance & Descent of the Ganges",
      tamilName: 'அர்ச்சுனன் தபசு பாறைச் சிற்பம்',
      bounds: { minX: 120, maxX: 155, minY: -10, maxY: 55, minZ: -25, maxZ: 15 },
      priority: 2,
      assets: ['bas_relief_elephant_monolith', 'cleft_rock_naga_crevasse', 'butterball_granite_boulder', 'cave_mandapam_portico'],
      gameplayObjects: ['butterball_boulder_leverage_check', 'descent_ganges_carving_clue'],
      neighbors: ['CELL_PIC_004', 'CELL_MAM_001', 'CELL_MAM_004'],
      terrain: { baseHeight: 3.5, biome: 'mamallapuram_rock', groundMaterial: 'solid_grey_granite_bedrock' },
      water: null,
      npcs: ['stone_carver_shanmugam'],
      wildlife: ['bonnet_macaque_troop', 'rock_agama_lizard'],
      trafficRoutes: ['route_mam_bazaar_rickshaw'],
      ambientAudio: 'stone_hammer_resonances_seagull_screeches'
    },
    CELL_MAM_003: {
      id: 'CELL_MAM_003',
      regionId: 'MAMALLAPURAM',
      name: 'Pancha Rathas Five Chariot Monoliths',
      tamilName: 'ஐந்து ரதங்கள் ஒற்றைக்கல் தேர்கள்',
      bounds: { minX: 155, maxX: 195, minY: -10, maxY: 55, minZ: -65, maxZ: -25 },
      priority: 2,
      assets: ['dharmaraja_ratha_spire', 'monolithic_granite_elephant', 'draupadi_ratha_hut', 'nandi_rock_carving'],
      gameplayObjects: ['ratha_hidden_chamber_alcove', 'monolith_compass_alignment_puzzle'],
      neighbors: ['CELL_THA_003', 'CELL_MAM_001', 'CELL_MAM_004', 'CELL_NIL_001'],
      terrain: { baseHeight: 2.0, biome: 'mamallapuram_rock', groundMaterial: 'dune_sand_drift' },
      water: null,
      npcs: ['heritage_guide_balan'],
      wildlife: ['coastal_plover', 'spotted_sandpiper'],
      trafficRoutes: ['route_mam_coastal_bus'],
      ambientAudio: 'rolling_surf_flute_coastal_wind'
    },
    CELL_MAM_004: {
      id: 'CELL_MAM_004',
      regionId: 'MAMALLAPURAM',
      name: 'Modern Stone Sculptors Agrahara & Docks',
      tamilName: 'நவீன சிற்பக் கலைக்கூடம் & படகுத்துறை',
      bounds: { minX: 155, maxX: 195, minY: -10, maxY: 55, minZ: -25, maxZ: 15 },
      priority: 3,
      assets: ['diamond_stone_saw_rig', 'unfinished_granite_boulder_blocks', 'sculptors_thatched_shed', 'conch_shell_shop_display'],
      gameplayObjects: ['granite_polishing_stone_station', 'rare_conch_valampuri_inspection'],
      neighbors: ['CELL_THA_004', 'CELL_MAM_002', 'CELL_MAM_003', 'CELL_NIL_002'],
      terrain: { baseHeight: 1.5, biome: 'mamallapuram_rock', groundMaterial: 'granite_dust_pavement' },
      water: null,
      npcs: ['seashell_artisan_kamala', 'apprentice_sculptor_vijay'],
      wildlife: ['stray_cat_harbor'],
      trafficRoutes: ['route_mam_freight_truck'],
      ambientAudio: 'heavy_breakers_against_shore_granite'
    },

    // =========================================================================
    // 7. NILGIRIS (Cloud Forests, High Shola, Terraced Tea & Toda Lands)
    // =========================================================================
    CELL_NIL_001: {
      id: 'CELL_NIL_001',
      regionId: 'NILGIRIS',
      name: 'Kallar Foothills & Mountain Checkpost',
      tamilName: 'கல்லாறு மலை அடிவாரம் & வன சோதனைச்சாவடி',
      bounds: { minX: 195, maxX: 240, minY: 0, maxY: 120, minZ: -45, maxZ: 0 },
      priority: 1,
      assets: ['mountain_hairpin_stone_barrier', 'forestry_checkpost_wooden_gate', 'giant_bamboo_culm_grove', 'mist_valley_rock_face'],
      gameplayObjects: ['checkpost_gate_clearance_lever', 'mountain_survival_supply_cache'],
      neighbors: ['CELL_CHT_004', 'CELL_MAM_003', 'CELL_NIL_002', 'CELL_NIL_003'],
      terrain: { baseHeight: 18.0, biome: 'western_ghats', groundMaterial: 'dark_humus_mountain_soil' },
      water: { level: 16.5, flowDirection: { x: -0.6, z: 0.8 }, type: 'mountain_cascade' },
      npcs: ['forest_eco_guard_kumaran'],
      wildlife: ['wild_boar_sounder', 'malabar_giant_squirrel'],
      trafficRoutes: ['route_nil_ghat_hairpin_bus'],
      ambientAudio: 'whistling_thrush_mountain_breeze'
    },
    CELL_NIL_002: {
      id: 'CELL_NIL_002',
      regionId: 'NILGIRIS',
      name: 'Terraced Tea Slopes & Valley Mist',
      tamilName: 'படிமுறை தேயிலைத் தோட்டங்கள் & பள்ளத்தாக்கு மூடுபனி',
      bounds: { minX: 195, maxX: 240, minY: 0, maxY: 120, minZ: 0, maxZ: 45 },
      priority: 2,
      assets: ['contoured_tea_bush_hedges', 'tin_roof_tea_weighing_shed', 'rhododendron_scarlet_blooms', 'mountain_cable_winch'],
      gameplayObjects: ['fresh_tea_leaves_basket_plucking', 'winch_mechanism_cargo_hoist'],
      neighbors: ['CELL_MAM_004', 'CELL_NIL_001', 'CELL_NIL_004'],
      terrain: { baseHeight: 28.0, biome: 'western_ghats', groundMaterial: 'terrace_steep_humus' },
      water: null,
      npcs: ['tea_estate_worker_malliga'],
      wildlife: ['nilgiri_langur_troop', 'emerald_dove'],
      trafficRoutes: ['route_nil_tea_estate_tractor'],
      ambientAudio: 'tea_plucking_shears_waterfall_hum'
    },
    CELL_NIL_003: {
      id: 'CELL_NIL_003',
      regionId: 'NILGIRIS',
      name: 'Doddabetta Cloud Ridgeline & Shola Grove',
      tamilName: 'தொட்டபெட்டா முகில் முகடு & சோலைக்காடு',
      bounds: { minX: 240, maxX: 290, minY: 0, maxY: 160, minZ: -45, maxZ: 0 },
      priority: 2,
      assets: ['shola_stunted_hardwood_mossy', 'craggy_gneiss_summit_pinnacle', 'weathered_stone_cairn_marker', 'wild_kurinji_shrub_patch'],
      gameplayObjects: ['summit_cairn_discovery_inscription', 'rare_kurinji_flower_harvest'],
      neighbors: ['CELL_NIL_001', 'CELL_NIL_004'],
      terrain: { baseHeight: 48.0, biome: 'western_ghats', groundMaterial: 'highland_granite_outcrop' },
      water: null,
      npcs: ['sanctuary_botanist_elango'],
      wildlife: ['nilgiri_tahr_crag_climber', 'black_and_orange_flycatcher'],
      trafficRoutes: ['route_nil_mountain_trail'],
      ambientAudio: 'mountain_mist_owl_crickets'
    },
    CELL_NIL_004: {
      id: 'CELL_NIL_004',
      regionId: 'NILGIRIS',
      name: 'Toda Clan Barrel-Vaulted Mund Sanctuary',
      tamilName: 'தோடர் இன உருளை வளைவு வாழ்விடம் & திருத்தலம்',
      bounds: { minX: 240, maxX: 290, minY: 0, maxY: 160, minZ: 0, maxZ: 45 },
      priority: 3,
      assets: ['toda_barrel_vault_dwelling', 'buffalo_dry_granite_pen', 'sacred_dairy_temple_poothkuli', 'mountain_grassland_knolls'],
      gameplayObjects: ['toda_dairy_temple_sanctuary_gate', 'poothkuli_shawl_loom_station'],
      neighbors: ['CELL_NIL_002', 'CELL_NIL_003'],
      terrain: { baseHeight: 38.0, biome: 'western_ghats', groundMaterial: 'montane_grassland_turf' },
      water: null,
      npcs: ['toda_elder_pellekan'],
      wildlife: ['toda_buffalo_sacred_herd', 'mountain_leopard_prowl'],
      trafficRoutes: ['route_nil_highland_pass'],
      ambientAudio: 'chilly_gale_wind_creaking_branches'
    }
  };

  /**
   * Spatial query to find which cell contains given coordinates (X, Y, Z)
   */
  function getCellForPosition(x, y, z) {
    for (const cellId in CELLS) {
      const b = CELLS[cellId].bounds;
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
        return CELLS[cellId];
      }
    }
    // Fallback nearest boundary clamp
    let closestCell = null;
    let minDistSq = Infinity;
    for (const cellId in CELLS) {
      const b = CELLS[cellId].bounds;
      const cx = (b.minX + b.maxX) * 0.5;
      const cz = (b.minZ + b.maxZ) * 0.5;
      const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestCell = CELLS[cellId];
      }
    }
    return closestCell;
  }

  /**
   * Returns list of cells belonging to a given region ID
   */
  function getCellsForRegion(regionId) {
    const list = [];
    const norm = String(regionId).toUpperCase();
    for (const cellId in CELLS) {
      if (CELLS[cellId].regionId === norm) {
        list.push(CELLS[cellId]);
      }
    }
    return list;
  }

  return {
    CELLS,
    getCellForPosition,
    getCellsForRegion
  };
});
