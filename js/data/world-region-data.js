/**
 * The Whispering Wilds (Kaattu Vazhi) - World Region Data
 * Authoritative regional definitions for all 7 Tamil Nadu Open-World Zones:
 * CHENNAI, CAUVERY_DELTA, PICHAVARAM, THANJAVUR, CHETTINAD, MAMALLAPURAM, NILGIRIS.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WORLD_REGION_DATA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const REGIONS = {
    CHENNAI: {
      id: 'CHENNAI',
      legacyKey: 'george_town',
      name: 'Chennai & George Town Commercial Corridor',
      tamilName: 'மதராஸ் ஜார்ஜ் டவுன் & வணிக வீதிகள்',
      thinai: 'Neythal / Urban Marutham Transition',
      bounds: { minX: -290, maxX: -200, minY: -5, maxY: 60, minZ: -45, maxZ: 45 },
      centerCoords: { x: -245, y: 1.5, z: 0 },
      defaultEntryCell: 'CELL_CHE_001',
      cells: ['CELL_CHE_001', 'CELL_CHE_002', 'CELL_CHE_003', 'CELL_CHE_004'],
      neighborRegions: ['CAUVERY_DELTA'],
      ambientThemes: {
        morning: 'chennai_morning_traffic_flower_market',
        day: 'busy_bazaar_auto_horns_vendors',
        evening: 'evening_tea_chatter_temple_bells',
        night: 'coastal_harbor_foghorn_quiet_chatter'
      },
      weatherTendencies: ['storm', 'rain', 'sunny'],
      climate: { baseTempC: 32, humidity: 0.82 },
      landmarks: ['madras_high_court', 'kotwal_chavadi', 'central_station_tracks']
    },

    CAUVERY_DELTA: {
      id: 'CAUVERY_DELTA',
      legacyKey: 'cauvery_delta',
      name: 'Cauvery River Basin & Granary Farmlands',
      tamilName: 'காவிரி டெல்டா நெற்களஞ்சியம் & ஆற்றுப்படுகை',
      thinai: 'Marutham (Fertile Riparian Farmlands)',
      bounds: { minX: -200, maxX: -110, minY: -10, maxY: 50, minZ: -45, maxZ: 45 },
      centerCoords: { x: -155, y: 1.2, z: 0 },
      defaultEntryCell: 'CELL_CAU_001',
      cells: ['CELL_CAU_001', 'CELL_CAU_002', 'CELL_CAU_003', 'CELL_CAU_004'],
      neighborRegions: ['CHENNAI', 'PICHAVARAM', 'CHETTINAD', 'THANJAVUR'],
      ambientThemes: {
        morning: 'rooster_crows_canal_water_flow',
        day: 'paddy_field_work_bullock_bells',
        evening: 'temple_conch_cattle_returning',
        night: 'crickets_frog_chorus_river_rustle'
      },
      weatherTendencies: ['rain', 'sunny', 'mist'],
      climate: { baseTempC: 30, humidity: 0.78 },
      landmarks: ['grand_anicut_sluice', 'kumbakonam_paddy', 'vennar_ferry']
    },

    PICHAVARAM: {
      id: 'PICHAVARAM',
      legacyKey: 'pichavaram',
      name: 'Pichavaram Mangrove Wetlands & Tidal Canals',
      tamilName: 'பிச்சாவரம் அலையாத்திக்காடு & சதுப்புநிலக் கால்வாய்கள்',
      thinai: 'Neythal (Estuary & Tidal Brackish Wetlands)',
      bounds: { minX: -110, maxX: -30, minY: -15, maxY: 40, minZ: -70, maxZ: 0 },
      centerCoords: { x: -70, y: -0.2, z: -35 },
      defaultEntryCell: 'CELL_PIC_001',
      cells: ['CELL_PIC_001', 'CELL_PIC_002', 'CELL_PIC_003', 'CELL_PIC_004'],
      neighborRegions: ['CAUVERY_DELTA', 'CHETTINAD', 'MAMALLAPURAM'],
      ambientThemes: {
        morning: 'estuary_water_lapping_heron_cries',
        day: 'boat_paddle_splashes_mud_crabs',
        evening: 'tidal_surge_kingfisher_calls',
        night: 'nocturnal_waterfowl_cicadas'
      },
      weatherTendencies: ['rain', 'storm', 'mist'],
      climate: { baseTempC: 28, humidity: 0.92 },
      landmarks: ['tidal_moorings_dock', 'root_maze_sanctuary', 'watchtower_outlook']
    },

    CHETTINAD: {
      id: 'CHETTINAD',
      legacyKey: 'chettinad',
      name: 'Chettinad Heritage Belt & Palatial Mansions',
      tamilName: 'செட்டிநாடு பாரம்பரிய வளவு வீடுகள் & ஆத்தங்குடி',
      thinai: 'Mullai / Semi-Arid Red Clay Parkland',
      bounds: { minX: -30, maxX: 50, minY: -5, maxY: 60, minZ: -30, maxZ: 45 },
      centerCoords: { x: 10, y: 2.2, z: 10 },
      defaultEntryCell: 'CELL_CHT_001',
      cells: ['CELL_CHT_001', 'CELL_CHT_002', 'CELL_CHT_003', 'CELL_CHT_004'],
      neighborRegions: ['CAUVERY_DELTA', 'PICHAVARAM', 'THANJAVUR', 'NILGIRIS'],
      ambientThemes: {
        morning: 'courtyard_sweeping_ammi_grinding',
        day: 'brass_vessel_clinking_wood_polishing',
        evening: 'kuthu_vilakku_lighting_temple_bells',
        night: 'breeze_through_teak_lattices'
      },
      weatherTendencies: ['sunny', 'clear', 'rain'],
      climate: { baseTempC: 34, humidity: 0.55 },
      landmarks: ['kanadukathan_portal', 'athangudi_tile_workshop', 'palmyra_belt']
    },

    THANJAVUR: {
      id: 'THANJAVUR',
      legacyKey: 'thanjavur',
      name: 'Thanjavur Chola Temple Plains & Classical Arts',
      tamilName: 'தஞ்சாவூர் சோழர் பெருங்கோயில் & செவ்வியல் கலைகள்',
      thinai: 'Marutham (Classical Temple Delta)',
      bounds: { minX: 50, maxX: 120, minY: -5, maxY: 75, minZ: -40, maxZ: 40 },
      centerCoords: { x: 85, y: 1.8, z: 0 },
      defaultEntryCell: 'CELL_THA_001',
      cells: ['CELL_THA_001', 'CELL_THA_002', 'CELL_THA_003', 'CELL_THA_004'],
      neighborRegions: ['CAUVERY_DELTA', 'CHETTINAD', 'MAMALLAPURAM'],
      ambientThemes: {
        morning: 'nadaswaram_morning_raga_chisel_strikes',
        day: 'bronze_polishing_veena_tuning_hammering',
        evening: 'temple_drum_beating_cymbals',
        night: 'distant_flute_crickets'
      },
      weatherTendencies: ['sunny', 'rain', 'clear'],
      climate: { baseTempC: 31, humidity: 0.68 },
      landmarks: ['brihadisvara_western_gopuram', 'shivaganga_tank', 'swamimalai_bronze_forge']
    },

    MAMALLAPURAM: {
      id: 'MAMALLAPURAM',
      legacyKey: 'mamallapuram',
      name: 'Mamallapuram Coastal Monoliths & Rock-Cut Rathas',
      tamilName: 'மாமல்லபுரம் கடற்கரை ஒற்றைக்கல் பாறைச் சிற்பங்கள்',
      thinai: 'Neythal (Monolithic Granite Sea Bluffs)',
      bounds: { minX: 120, maxX: 195, minY: -10, maxY: 55, minZ: -65, maxZ: 15 },
      centerCoords: { x: 155, y: 1.8, z: -25 },
      defaultEntryCell: 'CELL_MAM_001',
      cells: ['CELL_MAM_001', 'CELL_MAM_002', 'CELL_MAM_003', 'CELL_MAM_004'],
      neighborRegions: ['PICHAVARAM', 'THANJAVUR', 'NILGIRIS'],
      ambientThemes: {
        morning: 'ocean_breakers_chisel_rhythmic_taps',
        day: 'stone_hammer_resonances_seagull_screeches',
        evening: 'rolling_surf_flute_coastal_wind',
        night: 'heavy_breakers_against_shore_granite'
      },
      weatherTendencies: ['sunny', 'rain', 'storm'],
      climate: { baseTempC: 31, humidity: 0.85 },
      landmarks: ['shore_temple_monolith', 'arjunas_penance_relief', 'pancha_rathas_cluster']
    },

    NILGIRIS: {
      id: 'NILGIRIS',
      legacyKey: 'nilgiris',
      name: 'Nilgiris Cloud Forests, High Shola & Tea Slopes',
      tamilName: 'நீலகிரி மூடுபனி முகடுகள் & சோலைக்காடுகள்',
      thinai: 'Kurinji (High Altitude Montane Rainforest)',
      bounds: { minX: 195, maxX: 290, minY: 0, maxY: 160, minZ: -45, maxZ: 45 },
      centerCoords: { x: 240, y: 35.0, z: 0 },
      defaultEntryCell: 'CELL_NIL_001',
      cells: ['CELL_NIL_001', 'CELL_NIL_002', 'CELL_NIL_003', 'CELL_NIL_004'],
      neighborRegions: ['CHETTINAD', 'MAMALLAPURAM'],
      ambientThemes: {
        morning: 'whistling_thrush_mountain_breeze',
        day: 'tea_plucking_shears_waterfall_hum',
        evening: 'mountain_mist_owl_crickets',
        night: 'chilly_gale_wind_creaking_branches'
      },
      weatherTendencies: ['fog', 'mist', 'rain'],
      climate: { baseTempC: 16, humidity: 0.95 },
      landmarks: ['kallar_mountain_checkpost', 'terraced_tea_slopes', 'doddabetta_cairn', 'toda_mund_sanctuary']
    }
  };

  /**
   * Normalizes region identifiers (handling legacy lowercase and spaces)
   */
  function normalizeRegionId(id) {
    if (!id) return 'CHENNAI';
    const clean = String(id).trim().toUpperCase().replace(/[\s-]/g, '_');
    if (REGIONS[clean]) return clean;
    for (const key in REGIONS) {
      if (REGIONS[key].legacyKey === String(id).toLowerCase()) return key;
    }
    return 'CHENNAI';
  }

  function getRegion(id) {
    const key = normalizeRegionId(id);
    return REGIONS[key] || REGIONS.CHENNAI;
  }

  function getAllRegions() {
    return Object.values(REGIONS);
  }

  return {
    REGIONS,
    normalizeRegionId,
    getRegion,
    getAllRegions
  };
});
