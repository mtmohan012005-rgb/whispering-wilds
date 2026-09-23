/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Regional World Simulation & Daily Life Data
 * Comprehensive cultural profiles for all 7 authentic Tamil Nadu regions,
 * defining architectural styles, flora, soundscapes, NPC occupations,
 * market types, transport modes, and weather responses.
 */

window.REGIONAL_LIFE_DATA = {
  GEORGE_TOWN: {
    id: 'GEORGE_TOWN',
    name: 'George Town & North Madras Commercial Corridor',
    tamilName: 'மதராஸ் ஜார்ஜ் டவுன் வணிக வீதி',
    thinaiEcosystem: 'Neythal / Urban Marutham Transition',
    centerCoords: { x: -250, z: 0 },
    bounds: { minX: -290, maxX: -200, minZ: -45, maxZ: 45 },
    architecture: {
      style: 'Indo-Saracenic & British Colonial Madras Terraced Rowhouses',
      materials: ['terracotta_red_brick', 'lime_plaster', 'corrugated_iron_shutters', 'teak_verandas'],
      elements: ['electrical_poles_overhead_cables', 'roadside_water_pots', 'chalk_board_signs', 'narrow_lanes']
    },
    vegetation: ['gulmohar_tree', 'flamboyant_peepal', 'roadside_neem', 'potted_tulasi'],
    soundscape: {
      morning: 'chennai_morning_traffic_flower_market',
      day: 'busy_bazaar_auto_horns_vendors',
      evening: 'evening_tea_chatter_temple_bells',
      night: 'coastal_harbor_foghorn_quiet_chatter'
    },
    occupations: [
      { id: 'tea_master', title: 'Tea Kadai Master', schedule: '05:00-22:30', defaultAttire: 'everyday_veshti' },
      { id: 'flower_seller', title: 'Jasmine Flower Artisan', schedule: '05:30-19:00', defaultAttire: 'madurai_sungudi_saree' },
      { id: 'auto_driver', title: 'Auto-Rickshaw Driver', schedule: '06:00-21:30', defaultAttire: 'khaki_uniform_shirt' },
      { id: 'provision_merchant', title: 'Spice & Dry Goods Merchant', schedule: '08:00-21:00', defaultAttire: 'white_cotton_veshti' },
      { id: 'scooter_mechanic', title: 'Royal Enfield Mechanic', schedule: '08:30-20:00', defaultAttire: 'oil_stained_workwear' }
    ],
    marketType: 'FLOWER_TEA_COMMERCIAL',
    weatherAdaptations: {
      rain: { activityReduction: 0.3, canopyExtends: true, chaiSalesSpike: true },
      hot_afternoon: { outdoorDwellDrops: 0.5, roadsideWaterPatronsRise: true }
    }
  },

  CAUVERY_DELTA: {
    id: 'CAUVERY_DELTA',
    name: 'Cauvery River Basin & Granary Farmlands',
    tamilName: 'காவிரி டெல்டா நெற்களஞ்சியம்',
    thinaiEcosystem: 'Marutham (Fertile Riparian Farmlands)',
    centerCoords: { x: -160, z: 0 },
    bounds: { minX: -200, maxX: -110, minZ: -45, maxZ: 45 },
    architecture: {
      style: 'Thatch-roofed Agrarian Mud-Brick & Madras Tiled Country Houses',
      materials: ['country_burnt_brick', 'thatch_palm_leaves', 'mangalore_tiles', 'river_silt_render'],
      elements: ['grain_storage_kuthir', 'cowsheds_thozhu', 'bamboo_irrigation_flumes', 'threshing_floors']
    },
    vegetation: ['paddy_fields', 'coconut_palms', 'banana_groves', 'banyan_village_trees'],
    soundscape: {
      morning: 'rooster_crows_canal_water_flow',
      day: 'paddy_field_work_bullock_bells',
      evening: 'temple_conch_cattle_returning',
      night: 'crickets_frog_chorus_river_rustle'
    },
    occupations: [
      { id: 'paddy_farmer', title: 'Rice Cultivator', schedule: '05:00-17:30', defaultAttire: 'village_workwear' },
      { id: 'sluice_operator', title: 'Irrigation Sluice Warden', schedule: '06:00-18:00', defaultAttire: 'village_workwear' },
      { id: 'cattle_herder', title: 'Livestock Caretaker', schedule: '05:30-18:30', defaultAttire: 'short_veshti_thundu' },
      { id: 'village_potter', title: 'Terracotta Craftsman', schedule: '07:30-17:00', defaultAttire: 'clay_stained_dhoti' }
    ],
    marketType: 'AGRICULTURAL_GRAIN_VEGETABLE',
    weatherAdaptations: {
      rain: { farmingActive: true, bullocksSheltered: true, floodAlertsWatch: true },
      hot_afternoon: { shadeUnderNeemRest: true, canalBathing: true }
    }
  },

  PICHAVARAM: {
    id: 'PICHAVARAM',
    name: 'Pichavaram Mangrove Wetlands & Tidal Canals',
    tamilName: 'பிச்சாவரம் சதுப்புநிலக் காடுகள்',
    thinaiEcosystem: 'Neythal (Estuary & Tidal Brackish Wetlands)',
    centerCoords: { x: -80, z: -40 },
    bounds: { minX: -110, maxX: -30, minZ: -70, maxZ: 0 },
    architecture: {
      style: 'Raised Timber Stilt Docks & Palm-Thatch Fishing Shelters',
      materials: ['water_resistant_teak_poles', 'bamboo_screens', 'coir_matting', 'saline_resistant_timbers'],
      elements: ['wooden_jetties', 'net_drying_racks', 'tide_marker_poles', 'canoe_moorings']
    },
    vegetation: ['rhizophora_mangrove_roots', 'avicennia_shrubs', 'sea_grass', 'creek_reeds'],
    soundscape: {
      morning: 'estuary_water_lapping_heron_cries',
      day: 'boat_paddle_splashes_mud_crabs',
      evening: 'tidal_surge_kingfisher_calls',
      night: 'nocturnal_waterfowl_cicadas'
    },
    occupations: [
      { id: 'boat_navigator', title: 'Thoni Boat Guide', schedule: '04:30-18:00', defaultAttire: 'folded_lungi_barefoot' },
      { id: 'estuary_fisher', title: 'Cast Net Fisherman', schedule: '05:00-16:00', defaultAttire: 'weathered_cotton_shorts' },
      { id: 'net_repairer', title: 'Coir & Nylon Net Artisan', schedule: '09:00-17:00', defaultAttire: 'coastal_workwear' }
    ],
    marketType: 'FISH_SEAFOOD_SUPPLIES',
    weatherAdaptations: {
      rain: { highTideNavigationLimits: true, oilclothCapesWorn: true },
      hot_afternoon: { mangroveCanopyShadeShelter: true }
    }
  },

  CHETTINAD: {
    id: 'CHETTINAD',
    name: 'Chettinad Heritage Towns & Palatial Mansions',
    tamilName: 'செட்டிநாடு பாரம்பரிய அரண்மனை ஊர்கள்',
    thinaiEcosystem: 'Mullai / Semi-Arid Red Clay Parkland',
    centerCoords: { x: 10, z: 15 },
    bounds: { minX: -30, maxX: 50, minZ: -30, maxZ: 45 },
    architecture: {
      style: 'Grand Chettinad Mansions (Valavu Veedu)',
      materials: ['burmese_teak_pillars', 'athangudi_tiles', 'egg_white_lime_plaster', 'cast_brass_fittings'],
      elements: ['double_story_courtyards_muttam', 'heavy_teak_portals', 'raised_outer_verandas_thinnai', 'granite_rainwater_cisterns']
    },
    vegetation: ['tamarind_trees', 'palmyra_palms', 'bougainvillea_creepers', 'drumstick_trees'],
    soundscape: {
      morning: 'courtyard_sweeping_ammi_grinding',
      day: 'brass_vessel_clinking_wood_polishing',
      evening: 'kuthu_vilakku_lighting_temple_bells',
      night: 'breeze_through_teak_lattices'
    },
    occupations: [
      { id: 'athangudi_tilemaker', title: 'Tile Artisan', schedule: '07:30-17:30', defaultAttire: 'workwear_veshti' },
      { id: 'chettinad_cook', title: 'Master Traditional Chef', schedule: '06:00-20:00', defaultAttire: 'white_cotton_apron_veshti' },
      { id: 'textile_merchant', title: 'Kandangi Saree Trader', schedule: '09:00-19:30', defaultAttire: 'crisp_angavasthram_veshti' },
      { id: 'mansion_caretaker', title: 'Heritage Housekeeper', schedule: '06:00-19:00', defaultAttire: 'traditional_khadi_veshti' }
    ],
    marketType: 'TEXTILE_SPICE_CRAFT',
    weatherAdaptations: {
      rain: { rainwaterHarvestingCisternsFill: true, muttamDrainageActive: true },
      hot_afternoon: { coolVerandaThinnaiRetreat: true }
    }
  },

  THANJAVUR: {
    id: 'THANJAVUR',
    name: 'Thanjavur Chola Heritage & Classical Arts Cradle',
    tamilName: 'தஞ்சாவூர் சோழர் கலை நகரம்',
    thinaiEcosystem: 'Marutham (Classical Temple Delta)',
    centerCoords: { x: 80, z: -10 },
    bounds: { minX: 50, maxX: 120, minZ: -40, maxZ: 40 },
    architecture: {
      style: 'Dravidian Granite Temple Architecture & Artisan Agrahara Rows',
      materials: ['carved_granite', 'fired_brick_gopurams', 'terracotta_roof_ridges', 'brass_sheet_plating'],
      elements: ['temple_stepped_tanks_theertham', 'sculptor_courtyards', 'veena_drying_racks', 'brass_foundries']
    },
    vegetation: ['kadamba_trees', 'parijata_night_jasmine', 'sacred_fig', 'coconut_corridors'],
    soundscape: {
      morning: 'nadaswaram_morning_raga_chisel_strikes',
      day: 'bronze_polishing_veena_tuning_hammering',
      evening: 'temple_drum_beating_cymbals',
      night: 'distant_flute_crickets'
    },
    occupations: [
      { id: 'bronze_sculptor', title: 'Lost-Wax Bronze Master', schedule: '07:00-18:00', defaultAttire: 'forge_workwear' },
      { id: 'veena_maker', title: 'Classical Luthier', schedule: '08:30-18:30', defaultAttire: 'cotton_kurta_veshti' },
      { id: 'tanjore_painter', title: 'Gold-Foil Icon Artist', schedule: '09:00-17:30', defaultAttire: 'silk_border_cotton' },
      { id: 'vedic_teacher', title: 'Heritage Scholar', schedule: '06:00-16:00', defaultAttire: 'traditional_panchakacham' }
    ],
    marketType: 'FINE_ARTS_BRONZE_INSTRUMENTS',
    weatherAdaptations: {
      rain: { outdoorBronzeCoolingAdjusts: true, indoorPaintingOnly: true },
      hot_afternoon: { brassFurnaceWorkEarlyMorningOnly: true }
    }
  },

  MAMALLAPURAM: {
    id: 'MAMALLAPURAM',
    name: 'Mamallapuram Coastal Rocks & Pallava Sculptures',
    tamilName: 'மாமல்லபுரம் பல்லவர் கடற்கரை பாறைச் சிற்பங்கள்',
    thinaiEcosystem: 'Neythal (Monolithic Granite Sea Bluffs)',
    centerCoords: { x: 160, z: -30 },
    bounds: { minX: 120, maxX: 195, minZ: -65, maxZ: 15 },
    architecture: {
      style: 'Pallava Monolithic Rock-Cut Cave Temples & Coastal Stone Yards',
      materials: ['solid_grey_granite', 'coastal_gneiss', 'palm_thatch_canopies', 'saline_timber'],
      elements: ['granite_boulder_terraces', 'stone_dust_open_yards', 'shore_catamaran_landings', 'carved_ratha_mandapams']
    },
    vegetation: ['coastal_casuarina_groves', 'screwpine_thalai', 'wild_cactus', 'wind_bent_palms'],
    soundscape: {
      morning: 'ocean_breakers_chisel_rhythmic_taps',
      day: 'stone_hammer_resonances_seagull_screeches',
      evening: 'rolling_surf_flute_coastal_wind',
      night: 'heavy_breakers_against_shore_granite'
    },
    occupations: [
      { id: 'stone_carver', title: 'Granite Monolith Sculptor', schedule: '06:30-17:30', defaultAttire: 'dust_apron_veshti' },
      { id: 'catamaran_fisher', title: 'Deep Sea Fisherman', schedule: '04:00-14:00', defaultAttire: 'tied_lungi_conical_cap' },
      { id: 'seashell_artisan', title: 'Conch & Shell Craftsman', schedule: '09:00-18:30', defaultAttire: 'coastal_cotton' }
    ],
    marketType: 'STONE_CRAFT_SEASHELL_PRODUCE',
    weatherAdaptations: {
      rain: { outdoorCarvingHaltedForSafety: true, rockSlicknessHigh: true },
      hot_afternoon: { stoneBlocksCoveredWithWetStraw: true }
    }
  },

  NILGIRIS: {
    id: 'NILGIRIS',
    name: 'Nilgiris Cloud Forests & High Shola Ridgelines',
    tamilName: 'நீலகிரி மலைத் தொடர் & சோலைக் காடுகள்',
    thinaiEcosystem: 'Kurinji (High Altitude Montane Rainforest & Shola Grassland)',
    centerCoords: { x: 245, z: 0 },
    bounds: { minX: 195, maxX: 290, minZ: -45, maxZ: 45 },
    architecture: {
      style: 'Toda Clan Barrel-Vaulted Dwellings & British Colonial Hill Cottages',
      materials: ['dry_granite_rubble', 'thatch_mountain_grass', 'pine_timber', 'corrugated_tin_slopes'],
      elements: ['barrel_arched_entrances', 'tea_drying_sheds', 'mountain_checkposts', 'steep_stone_stairways']
    },
    vegetation: ['shola_stunted_hardwoods', 'rhododendron_arboreum', 'tea_bushes_terraced', 'wild_kurinji_shrubs'],
    soundscape: {
      morning: 'whistling_thrush_mountain_breeze',
      day: 'tea_plucking_shears_waterfall_hum',
      evening: 'mountain_mist_owl_crickets',
      night: 'chilly_gale_wind_creaking_branches'
    },
    occupations: [
      { id: 'tea_estate_worker', title: 'Tea Plucker & Processor', schedule: '06:30-16:00', defaultAttire: 'nilgiri_warmwear' },
      { id: 'forest_eco_guard', title: 'Sanctuary Ranger', schedule: '06:00-18:00', defaultAttire: 'mountain_jacket_boots' },
      { id: 'toda_tribal_elder', title: 'Clan Lorekeeper', schedule: '07:00-17:00', defaultAttire: 'embroidered_poothkuli_shawl' }
    ],
    marketType: 'HILL_TEA_SPICES_OUTDOOR',
    weatherAdaptations: {
      cold_mist: { woolShawlsDonned: true, teaKadaiStoveCrowded: true, visibilityDrops: true },
      heavy_rain: { landslidesAvoidanceGating: true, estateWorkReduced: true }
    }
  }
};
