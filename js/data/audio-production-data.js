/**
 * The Whispering Wilds (Kaattu Vazhi) - Audio Production Data Model
 * Centralized catalog of authentic Tamil Nadu regional ambience, weather,
 * footsteps, wildlife, vehicles, interactions, dialogue, and dynamic music.
 */

window.AUDIO_DATA = {
  // -------------------------------------------------------------------------
  // 1. REGIONAL AMBIENCE LAYERS
  // -------------------------------------------------------------------------
  ambience: {
    // Chennai / George Town
    chennai_market_bed: {
      id: "chennai_market_bed",
      file: "assets/audio/ambience/chennai/george_town_market.mp3",
      category: "ambience",
      volume: 0.65,
      loop: true,
      spatial: false,
      priority: 3,
      region: "george_town",
      timeOfDay: ["morning", "afternoon", "evening"],
      weather: ["clear", "cloudy"],
      tags: ["urban", "bazaar", "traffic", "tea_stall"]
    },
    chennai_night_breeze: {
      id: "chennai_night_breeze",
      file: "assets/audio/ambience/chennai/coastal_night_breeze.mp3",
      category: "ambience",
      volume: 0.5,
      loop: true,
      spatial: false,
      priority: 2,
      region: "george_town",
      timeOfDay: ["night", "dawn"],
      weather: ["clear", "cloudy"],
      tags: ["coastal", "night", "distant_sea"]
    },

    // Cauvery Delta
    delta_paddy_breeze: {
      id: "delta_paddy_breeze",
      file: "assets/audio/ambience/cauvery-delta/farmland_breeze.mp3",
      category: "ambience",
      volume: 0.6,
      loop: true,
      spatial: false,
      priority: 3,
      region: "cauvery_delta",
      timeOfDay: ["dawn", "morning", "afternoon"],
      weather: ["clear", "cloudy"],
      tags: ["rural", "paddy", "wind", "irrigation"]
    },
    delta_night_insects: {
      id: "delta_night_insects",
      file: "assets/audio/ambience/cauvery-delta/night_crickets.mp3",
      category: "ambience",
      volume: 0.55,
      loop: true,
      spatial: false,
      priority: 2,
      region: "cauvery_delta",
      timeOfDay: ["evening", "night"],
      weather: ["clear", "cloudy"],
      tags: ["insects", "night", "frogs"]
    },

    // Pichavaram Wetlands
    pichavaram_mangrove_bed: {
      id: "pichavaram_mangrove_bed",
      file: "assets/audio/ambience/pichavaram/mangrove_water.mp3",
      category: "ambience",
      volume: 0.6,
      loop: true,
      spatial: false,
      priority: 3,
      region: "pichavaram",
      timeOfDay: ["dawn", "morning", "afternoon", "evening", "night"],
      weather: ["clear", "cloudy", "mist"],
      tags: ["mangrove", "wetlands", "water", "insects"]
    },
    pichavaram_boat_creak: {
      id: "pichavaram_boat_creak",
      file: "assets/audio/ambience/pichavaram/wooden_boat_creak.mp3",
      category: "ambience",
      volume: 0.45,
      loop: true,
      spatial: true,
      maxDistance: 60,
      minDistance: 5,
      priority: 4,
      region: "pichavaram",
      tags: ["boat", "wood", "water"]
    },

    // Chettinad Heritage Belt
    chettinad_courtyard_reverb: {
      id: "chettinad_courtyard_reverb",
      file: "assets/audio/ambience/chettinad/courtyard_reverb.mp3",
      category: "ambience",
      volume: 0.5,
      loop: true,
      spatial: false,
      priority: 3,
      region: "chettinad",
      timeOfDay: ["morning", "afternoon", "evening"],
      tags: ["mansion", "courtyard", "acoustic_reverb", "interior"]
    },

    // Thanjavur Delta & Great Temple
    thanjavur_artisan_bed: {
      id: "thanjavur_artisan_bed",
      file: "assets/audio/ambience/thanjavur/temple_bronze_hammer.mp3",
      category: "ambience",
      volume: 0.6,
      loop: true,
      spatial: false,
      priority: 3,
      region: "thanjavur",
      timeOfDay: ["morning", "afternoon"],
      tags: ["bronze_craft", "temple_bell", "chola_heritage"]
    },

    // Mamallapuram Shore
    mamallapuram_surf_bed: {
      id: "mamallapuram_surf_bed",
      file: "assets/audio/ambience/mamallapuram/coastal_waves.mp3",
      category: "ambience",
      volume: 0.7,
      loop: true,
      spatial: false,
      priority: 3,
      region: "mamallapuram",
      timeOfDay: ["dawn", "morning", "afternoon", "evening", "night"],
      tags: ["ocean", "waves", "seabirds", "granite_monolith"]
    },

    // Nilgiris Mountain Cloud Forest
    nilgiris_shola_wind: {
      id: "nilgiris_shola_wind",
      file: "assets/audio/ambience/nilgiris/mountain_wind_shola.mp3",
      category: "ambience",
      volume: 0.7,
      loop: true,
      spatial: false,
      priority: 3,
      region: "nilgiris",
      weather: ["clear", "cloudy", "mist"],
      tags: ["high_altitude", "shola", "mountain_wind", "tea_estate"]
    }
  },

  // -------------------------------------------------------------------------
  // 2. DYNAMIC WEATHER AUDIO
  // -------------------------------------------------------------------------
  weather: {
    weather_rain_light: {
      id: "weather_rain_light",
      file: "assets/audio/weather/rain/rain_light.mp3",
      category: "weather",
      volume: 0.5,
      loop: true,
      priority: 4,
      weather: ["rain"]
    },
    weather_rain_heavy: {
      id: "weather_rain_heavy",
      file: "assets/audio/weather/rain/rain_heavy.mp3",
      category: "weather",
      volume: 0.8,
      loop: true,
      priority: 5,
      weather: ["heavy_rain", "storm"]
    },
    weather_thunder_strike: {
      id: "weather_thunder_strike",
      file: "assets/audio/weather/thunder/thunder_distant.mp3",
      category: "weather",
      volume: 0.9,
      loop: false,
      priority: 6,
      weather: ["storm"]
    },
    weather_wind_gale: {
      id: "weather_wind_gale",
      file: "assets/audio/weather/wind/wind_mountain_gust.mp3",
      category: "weather",
      volume: 0.65,
      loop: true,
      priority: 4,
      weather: ["storm", "mist"]
    }
  },

  // -------------------------------------------------------------------------
  // 3. FOOTSTEPS ACROSS TAMIL NADU TERRAIN MATERIALS
  // -------------------------------------------------------------------------
  footsteps: {
    stone: {
      walk: ["assets/audio/footsteps/stone/step_stone_01.mp3", "assets/audio/footsteps/stone/step_stone_02.mp3"],
      run: ["assets/audio/footsteps/stone/run_stone_01.mp3", "assets/audio/footsteps/stone/run_stone_02.mp3"],
      sprint: ["assets/audio/footsteps/stone/sprint_stone_01.mp3"],
      crouch: ["assets/audio/footsteps/stone/crouch_stone_01.mp3"],
      volume: 0.65
    },
    mud: {
      walk: ["assets/audio/footsteps/mud/step_mud_01.mp3", "assets/audio/footsteps/mud/step_mud_02.mp3"],
      run: ["assets/audio/footsteps/mud/run_mud_01.mp3"],
      sprint: ["assets/audio/footsteps/mud/sprint_mud_01.mp3"],
      crouch: ["assets/audio/footsteps/mud/crouch_mud_01.mp3"],
      volume: 0.7
    },
    grass: {
      walk: ["assets/audio/footsteps/grass/step_grass_01.mp3", "assets/audio/footsteps/grass/step_grass_02.mp3"],
      run: ["assets/audio/footsteps/grass/run_grass_01.mp3"],
      sprint: ["assets/audio/footsteps/grass/sprint_grass_01.mp3"],
      crouch: ["assets/audio/footsteps/grass/crouch_grass_01.mp3"],
      volume: 0.55
    },
    sand: {
      walk: ["assets/audio/footsteps/sand/step_sand_01.mp3", "assets/audio/footsteps/sand/step_sand_02.mp3"],
      run: ["assets/audio/footsteps/sand/run_sand_01.mp3"],
      sprint: ["assets/audio/footsteps/sand/sprint_sand_01.mp3"],
      crouch: ["assets/audio/footsteps/sand/crouch_sand_01.mp3"],
      volume: 0.6
    },
    wood: {
      walk: ["assets/audio/footsteps/wood/step_wood_01.mp3", "assets/audio/footsteps/wood/step_wood_02.mp3"],
      run: ["assets/audio/footsteps/wood/run_wood_01.mp3"],
      sprint: ["assets/audio/footsteps/wood/sprint_wood_01.mp3"],
      crouch: ["assets/audio/footsteps/wood/crouch_wood_01.mp3"],
      volume: 0.65
    },
    water: {
      walk: ["assets/audio/footsteps/water/step_water_01.mp3", "assets/audio/footsteps/water/step_water_02.mp3"],
      run: ["assets/audio/footsteps/water/run_water_01.mp3"],
      sprint: ["assets/audio/footsteps/water/sprint_water_01.mp3"],
      crouch: ["assets/audio/footsteps/water/crouch_water_01.mp3"],
      volume: 0.75
    }
  },

  // -------------------------------------------------------------------------
  // 4. CLOTHING MOVEMENT FOLEY
  // -------------------------------------------------------------------------
  clothMovement: {
    everyday_veshti: { file: "assets/audio/footsteps/cloth/veshti_swish.mp3", volume: 0.25 },
    village_workwear: { file: "assets/audio/footsteps/cloth/cotton_rustle.mp3", volume: 0.2 },
    urban_explorer: { file: "assets/audio/footsteps/cloth/canvas_gear.mp3", volume: 0.3 },
    festival_veshti: { file: "assets/audio/footsteps/cloth/silk_soft.mp3", volume: 0.2 },
    nilgiri_warmwear: { file: "assets/audio/footsteps/cloth/wool_heavy.mp3", volume: 0.35 }
  },

  // -------------------------------------------------------------------------
  // 5. WILDLIFE SPECIES CALLS & BEHAVIORS
  // -------------------------------------------------------------------------
  wildlife: {
    nilgiri_tahr: {
      idle: "assets/audio/wildlife/mammals/nilgiri_tahr_snort.mp3",
      alert: "assets/audio/wildlife/mammals/nilgiri_tahr_whistle.mp3",
      flee: "assets/audio/wildlife/mammals/nilgiri_tahr_scramble.mp3",
      volume: 0.75,
      maxDistance: 70
    },
    nilgiri_langur: {
      idle: "assets/audio/wildlife/mammals/langur_whoop.mp3",
      alert: "assets/audio/wildlife/mammals/langur_alarm_bark.mp3",
      volume: 0.8,
      maxDistance: 80
    },
    elephant: {
      idle: "assets/audio/wildlife/mammals/elephant_low_rumble.mp3",
      alert: "assets/audio/wildlife/mammals/elephant_trumpet.mp3",
      volume: 0.95,
      maxDistance: 120
    },
    gaur: {
      idle: "assets/audio/wildlife/mammals/gaur_deep_grunt.mp3",
      alert: "assets/audio/wildlife/mammals/gaur_snort.mp3",
      volume: 0.85,
      maxDistance: 75
    },
    peafowl: {
      call: "assets/audio/wildlife/birds/peacock_shrill_mayil.mp3",
      fly: "assets/audio/wildlife/birds/peacock_heavy_wings.mp3",
      volume: 0.7,
      maxDistance: 90
    },
    kingfisher: {
      call: "assets/audio/wildlife/birds/kingfisher_high_pip.mp3",
      dive: "assets/audio/wildlife/wetland/water_dive_splash.mp3",
      volume: 0.65,
      maxDistance: 50
    },
    cattle: {
      idle: "assets/audio/wildlife/mammals/kangayam_bull_bellow.mp3",
      graze: "assets/audio/wildlife/mammals/cow_chew_grass.mp3",
      volume: 0.6,
      maxDistance: 45
    }
  },

  // -------------------------------------------------------------------------
  // 6. VEHICLES ACOUSTICS
  // -------------------------------------------------------------------------
  vehicles: {
    auto_rickshaw: {
      idle: "assets/audio/vehicles/auto-rickshaw/auto_two_stroke_idle.mp3",
      moving: "assets/audio/vehicles/auto-rickshaw/auto_two_stroke_drive.mp3",
      horn: "assets/audio/vehicles/auto-rickshaw/auto_bulb_horn.mp3",
      volume: 0.75,
      maxDistance: 80
    },
    bullock_cart: {
      moving: "assets/audio/vehicles/bullock-cart/wooden_cart_creak.mp3",
      bell: "assets/audio/vehicles/bullock-cart/bullock_brass_bell.mp3",
      volume: 0.6,
      maxDistance: 50
    },
    boat: {
      moving: "assets/audio/vehicles/boat/oar_dip_water.mp3",
      creak: "assets/audio/vehicles/boat/hull_wood_groan.mp3",
      volume: 0.6,
      maxDistance: 40
    }
  },

  // -------------------------------------------------------------------------
  // 7. PLAYER INTERACTIONS & OBJECTS
  // -------------------------------------------------------------------------
  interactions: {
    door_open: { id: "door_open", category: "sfx", file: "assets/audio/interaction/doors/chettinad_teak_door_open.mp3", volume: 0.7 },
    door_close: { id: "door_close", category: "sfx", file: "assets/audio/interaction/doors/chettinad_teak_door_close.mp3", volume: 0.7 },
    wood_pickup: { id: "wood_pickup", category: "sfx", file: "assets/audio/interaction/wood/wood_stick_pickup.mp3", volume: 0.6 },
    metal_pickup: { id: "metal_pickup", category: "sfx", file: "assets/audio/interaction/metal/bronze_relic_pickup.mp3", volume: 0.75 },
    stone_pickup: { id: "stone_pickup", category: "sfx", file: "assets/audio/interaction/stone/granite_keystone_lift.mp3", volume: 0.7 },
    water_fill: { id: "water_fill", category: "sfx", file: "assets/audio/interaction/water/brass_chembu_fill.mp3", volume: 0.65 },
    camera_capture: { id: "camera_capture", category: "sfx", file: "assets/audio/interaction/objects/mechanical_shutter_click.mp3", volume: 0.8 },
    inventory_open: { id: "inventory_open", category: "sfx", file: "assets/audio/interaction/objects/canvas_satchel_open.mp3", volume: 0.5 },
    inventory_close: { id: "inventory_close", category: "sfx", file: "assets/audio/interaction/objects/canvas_satchel_close.mp3", volume: 0.5 },
    tea_kadai_pour: { id: "tea_kadai_pour", category: "sfx", file: "assets/audio/interaction/objects/samovar_chai_meter_pour.mp3", volume: 0.8 },
    climb_grab: { id: "climb_grab", category: "sfx", file: "assets/audio/traversal/climb_grab_wood.mp3", volume: 0.75 },
    metal_turn: { id: "metal_turn", category: "sfx", file: "assets/audio/puzzles/granite_waterwheel_turn.mp3", volume: 0.8 },
    sluice_open: { id: "sluice_open", category: "sfx", file: "assets/audio/puzzles/chola_sluice_open.mp3", volume: 0.85 },
    water_splash: { id: "water_splash", category: "sfx", file: "assets/audio/traversal/water_wade_splash.mp3", volume: 0.7 },
    landmark_discover: { id: "landmark_discover", category: "sfx", file: "assets/audio/music/discovery/temple_chime_stinger.mp3", volume: 0.8 },
    tea_preparation: { id: "tea_preparation", category: "sfx", file: "assets/audio/interaction/objects/samovar_chai_meter_pour.mp3", volume: 0.8 },
    food_consume: { id: "food_consume", category: "sfx", file: "assets/audio/interaction/food/banana_leaf_serve.mp3", volume: 0.7 }
  },

  // -------------------------------------------------------------------------
  // 8. DYNAMIC MUSIC SUITE (9 AUTHORITATIVE STATES)
  // -------------------------------------------------------------------------
  dynamicMusic: {
    EXPLORATION: {
      id: "music_exploration",
      file: "assets/audio/music/exploration/tamil_folk_acoustic.mp3",
      volume: 0.5,
      loop: true,
      fadeDuration: 2.0,
      scale: [164.81, 196.00, 220.00, 246.94, 293.66, 329.63] // Pentatonic acoustic
    },
    DISCOVERY: {
      id: "music_discovery",
      file: "assets/audio/music/discovery/temple_chime_stinger.mp3",
      volume: 0.7,
      loop: false,
      fadeDuration: 0.5
    },
    INVESTIGATION: {
      id: "music_investigation",
      file: "assets/audio/music/investigation/mystery_veena_pulse.mp3",
      volume: 0.55,
      loop: true,
      fadeDuration: 1.5,
      scale: [146.83, 164.81, 196.00, 220.00, 261.63] // Minor modal mystery
    },
    TENSION: {
      id: "music_tension",
      file: "assets/audio/music/tension/low_drone_percussion.mp3",
      volume: 0.65,
      loop: true,
      fadeDuration: 1.2
    },
    PUZZLE: {
      id: "music_puzzle",
      file: "assets/audio/music/village/chola_waterwheel_theme.mp3",
      volume: 0.5,
      loop: true,
      fadeDuration: 2.0
    },
    WILDLIFE_OBSERVATION: {
      id: "music_wildlife",
      file: "assets/audio/music/wetlands/peaceful_shola_nature.mp3",
      volume: 0.45,
      loop: true,
      fadeDuration: 2.5
    },
    CHAPTER_EVENT: {
      id: "music_chapter",
      file: "assets/audio/music/chapter/nadaswaram_triumphant.mp3",
      volume: 0.75,
      loop: false,
      fadeDuration: 1.0
    },
    DANGER: {
      id: "music_danger",
      file: "assets/audio/music/tension/storm_danger_beat.mp3",
      volume: 0.8,
      loop: true,
      fadeDuration: 0.8
    },
    REST: {
      id: "music_rest",
      file: "assets/audio/music/exploration/campfire_dawn_peace.mp3",
      volume: 0.4,
      loop: true,
      fadeDuration: 3.0
    }
  },

  // -------------------------------------------------------------------------
  // 9. BILINGUAL DIALOGUE VOICE REPOSITORY (TAMIL / ENGLISH)
  // -------------------------------------------------------------------------
  dialogueVoices: {
    murugan_greeting_01: {
      id: "murugan_greeting_01",
      speaker: "murugan_annan",
      language: "tamil",
      textTamil: "என்ன தம்பி? இவ்வளவு நேரம் எங்கே போறீங்க? ஒரு சூடான டீ குடிச்சிட்டு போங்க.",
      textEnglish: "Where are you heading at this hour? Drink a hot tea before moving on.",
      file: "assets/audio/dialogue/tamil/murugan_greeting_01.mp3",
      volume: 0.9
    },
    selvam_bull_lost_01: {
      id: "selvam_bull_lost_01",
      speaker: "farmer_selvam",
      language: "tamil",
      textTamil: "தம்பி, என் காங்கேயம் காளை காணாம போயிடுச்சு! வயல் வரப்பெல்லாம் தேடிட்டேன்.",
      textEnglish: "Brother, my Kangayam stud bull went missing! I searched the entire canal bund.",
      file: "assets/audio/dialogue/tamil/selvam_bull_lost_01.mp3",
      volume: 0.9
    },
    karthik_guide_warn_01: {
      id: "karthik_guide_warn_01",
      speaker: "hill_guide_karthik",
      language: "tamil",
      textTamil: "நீலகிரி பனி ரொம்ப அடர்த்தியானது தம்பி. கம்பளி சட்டை இல்லாம மேல போக முடியாது.",
      textEnglish: "Nilgiri mountain mist is treacherous. You cannot ascend without a woolen thermal suit.",
      file: "assets/audio/dialogue/tamil/karthik_guide_warn_01.mp3",
      volume: 0.9
    }
  }
};
