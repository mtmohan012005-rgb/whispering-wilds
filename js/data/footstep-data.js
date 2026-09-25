// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - FOOTSTEP & SURFACE MATERIAL DATA
// 8 physical surfaces x 3 footwear types with authentic variation pools
// and subtle veshti cotton fabric movement audio.
// ============================================================================

(function () {
  'use strict';

  const FOOTSTEP_POOLS = {
    // Stone: clear crisp contact
    'stone_sandals': ['sfx_step_stone_sandal_01', 'sfx_step_stone_sandal_02', 'sfx_step_stone_sandal_03'],
    'stone_shoes': ['sfx_step_stone_shoe_01', 'sfx_step_stone_shoe_02', 'sfx_step_stone_shoe_03'],
    'stone_boots': ['sfx_step_stone_boot_01', 'sfx_step_stone_boot_02', 'sfx_step_stone_boot_03'],

    // Mud: soft, squelching wet red clay
    'mud_sandals': ['sfx_step_mud_sandal_01', 'sfx_step_mud_sandal_02', 'sfx_step_mud_sandal_03'],
    'mud_shoes': ['sfx_step_mud_shoe_01', 'sfx_step_mud_shoe_02', 'sfx_step_mud_shoe_03'],
    'mud_boots': ['sfx_step_mud_boot_01', 'sfx_step_mud_boot_02', 'sfx_step_mud_boot_03'],

    // Sand: coastal dry soft grit
    'sand_sandals': ['sfx_step_sand_sandal_01', 'sfx_step_sand_sandal_02', 'sfx_step_sand_sandal_03'],
    'sand_shoes': ['sfx_step_sand_shoe_01', 'sfx_step_sand_shoe_02', 'sfx_step_sand_shoe_03'],
    'sand_boots': ['sfx_step_sand_boot_01', 'sfx_step_sand_boot_02', 'sfx_step_sand_boot_03'],

    // Wood: hollow timber planks & temple courtyard decks
    'wood_sandals': ['sfx_step_wood_sandal_01', 'sfx_step_wood_sandal_02', 'sfx_step_wood_sandal_03'],
    'wood_shoes': ['sfx_step_wood_shoe_01', 'sfx_step_wood_shoe_02', 'sfx_step_wood_shoe_03'],
    'wood_boots': ['sfx_step_wood_boot_01', 'sfx_step_wood_boot_02', 'sfx_step_wood_boot_03'],

    // Soil: firm packed dry earth
    'soil_sandals': ['sfx_step_soil_sandal_01', 'sfx_step_soil_sandal_02', 'sfx_step_soil_sandal_03'],
    'soil_shoes': ['sfx_step_soil_shoe_01', 'sfx_step_soil_shoe_02', 'sfx_step_soil_shoe_03'],
    'soil_boots': ['sfx_step_soil_boot_01', 'sfx_step_soil_boot_02', 'sfx_step_soil_boot_03'],

    // Grass: soft meadow / tea shrub brush
    'grass_sandals': ['sfx_step_grass_sandal_01', 'sfx_step_grass_sandal_02', 'sfx_step_grass_sandal_03'],
    'grass_shoes': ['sfx_step_grass_shoe_01', 'sfx_step_grass_shoe_02', 'sfx_step_grass_shoe_03'],
    'grass_boots': ['sfx_step_grass_boot_01', 'sfx_step_grass_boot_02', 'sfx_step_grass_boot_03'],

    // Wet ground: damp soil
    'wet_ground_sandals': ['sfx_step_wet_ground_sandal_01', 'sfx_step_wet_ground_sandal_02'],
    'wet_ground_shoes': ['sfx_step_wet_ground_shoe_01', 'sfx_step_wet_ground_shoe_02'],
    'wet_ground_boots': ['sfx_step_wet_ground_boot_01', 'sfx_step_wet_ground_boot_02'],

    // Water: shallow canal / puddle wading
    'water_sandals': ['sfx_step_water_sandal_01', 'sfx_step_water_sandal_02', 'sfx_step_water_sandal_03'],
    'water_shoes': ['sfx_step_water_shoe_01', 'sfx_step_water_shoe_02', 'sfx_step_water_shoe_03'],
    'water_boots': ['sfx_step_water_boot_01', 'sfx_step_water_boot_02', 'sfx_step_water_boot_03']
  };

  const SURFACE_PROFILES = {
    stone: { id: 'stone', baseTone: 'crisp_granite', description: 'Hard granite stone impact' },
    wood: { id: 'wood', baseTone: 'hollow_wood', description: 'Resonant timber planks' },
    soil: { id: 'soil', baseTone: 'packed_earth', description: 'Firm packed dry soil' },
    mud: { id: 'mud', baseTone: 'squelch_wet', description: 'Soft wet red mud' },
    sand: { id: 'sand', baseTone: 'soft_grit', description: 'Coastal dry loose sand' },
    grass: { id: 'grass', baseTone: 'vegetation_brush', description: 'Soft brush against blades and turf' },
    wet_ground: { id: 'wet_ground', baseTone: 'damp_soil', description: 'Post-monsoon dampened earth' },
    water: { id: 'water', baseTone: 'water_splash', description: 'Shallow wading splash' }
  };

  const FootstepData = {
    POOLS: FOOTSTEP_POOLS,
    PROFILES: SURFACE_PROFILES,

    getSurfaceProfile(surface) {
      if (!surface) return SURFACE_PROFILES.mud;
      const key = surface.toLowerCase();
      return SURFACE_PROFILES[key] || SURFACE_PROFILES.mud;
    },

    getFootstepSoundId(surface = 'mud', footwear = 'sandals') {
      const key = `${surface.toLowerCase()}_${footwear.toLowerCase()}`;
      const pool = FOOTSTEP_POOLS[key] || FOOTSTEP_POOLS['mud_sandals'];
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx];
    },

    getClothRustleSoundId(gait = 'walk') {
      return gait === 'run' ? 'sfx_cloth_veshti_rustle_run' : 'sfx_cloth_veshti_rustle_walk';
    }
  };

  if (typeof window !== 'undefined') {
    window.FootstepData = FootstepData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FootstepData;
  }
})();
