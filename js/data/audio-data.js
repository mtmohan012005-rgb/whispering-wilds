// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CORE AUDIO DATA
// Authoritative tables for sound effect categories, fallback synthesis presets,
// and default mixer volumes.
// ============================================================================

(function () {
  'use strict';

  const AUDIO_BASE_SETTINGS = {
    defaultVolumes: {
      master: 0.8,
      music: 0.65,
      voice: 0.9,
      ambience: 0.75,
      sfx: 0.8,
      ui: 0.7,
      weather: 0.7,
      vehicle: 0.7,
      wildlife: 0.65,
      cinematic: 0.95
    },
    defaultLanguage: 'ta',
    defaultSubtitleMode: 'bilingual',
    maxSimultaneousVoices: 28
  };

  const CORE_SFX_DEFINITIONS = {
    // UI Interactions
    'sfx_ui_menu_select': { id: 'sfx_ui_menu_select', type: 'ui', volume: 0.6, duration: 0.12, license: 'CC0-1.0' },
    'sfx_ui_menu_confirm': { id: 'sfx_ui_menu_confirm', type: 'ui', volume: 0.7, duration: 0.18, license: 'CC0-1.0' },
    'sfx_ui_menu_back': { id: 'sfx_ui_menu_back', type: 'ui', volume: 0.5, duration: 0.14, license: 'CC0-1.0' },
    'sfx_ui_achievement': { id: 'sfx_ui_achievement', type: 'ui', volume: 0.8, duration: 1.2, license: 'CC-BY-4.0' },
    'sfx_ui_map_open': { id: 'sfx_ui_map_open', type: 'ui', volume: 0.55, duration: 0.35, license: 'CC0-1.0' },

    // Player Exertion & Movement
    'sfx_player_breath_exertion': { id: 'sfx_player_breath_exertion', type: 'sfx', volume: 0.28, duration: 1.4, license: 'CC-BY-4.0' },
    'sfx_player_jump_takeoff': { id: 'sfx_player_jump_takeoff', type: 'sfx', volume: 0.5, duration: 0.22, license: 'CC-BY-4.0' },
    'sfx_player_land_soft': { id: 'sfx_player_land_soft', type: 'sfx', volume: 0.6, duration: 0.3, license: 'CC-BY-4.0' },
    'sfx_player_water_splash': { id: 'sfx_player_water_splash', type: 'sfx', volume: 0.65, duration: 0.6, license: 'CC-BY-4.0' },

    // Interactive Props
    'sfx_door_wood_aged_open': { id: 'sfx_door_wood_aged_open', type: 'sfx', volume: 0.7, duration: 1.1, license: 'CC-BY-4.0' },
    'sfx_door_wood_aged_close': { id: 'sfx_door_wood_aged_close', type: 'sfx', volume: 0.75, duration: 0.8, license: 'CC-BY-4.0' },
    'sfx_door_metal_open': { id: 'sfx_door_metal_open', type: 'sfx', volume: 0.7, duration: 0.9, license: 'CC-BY-4.0' },
    'sfx_gate_creak_open': { id: 'sfx_gate_creak_open', type: 'sfx', volume: 0.8, duration: 1.4, license: 'CC-BY-4.0' },
    'sfx_water_handpump_crank': { id: 'sfx_water_handpump_crank', type: 'sfx', volume: 0.75, duration: 1.6, license: 'CC-BY-4.0' },
    'sfx_prop_brass_chembu_pour': { id: 'sfx_prop_brass_chembu_pour', type: 'sfx', volume: 0.7, duration: 1.8, license: 'CC-BY-4.0' },
    'sfx_prop_oil_lamp_ignite': { id: 'sfx_prop_oil_lamp_ignite', type: 'sfx', volume: 0.5, duration: 0.7, license: 'CC-BY-4.0' },
    'sfx_container_latch_open': { id: 'sfx_container_latch_open', type: 'sfx', volume: 0.6, duration: 0.45, license: 'CC-BY-4.0' },
    'sfx_interact_generic_tap': { id: 'sfx_interact_generic_tap', type: 'sfx', volume: 0.5, duration: 0.25, license: 'CC0-1.0' }
  };

  const AUDIO_MANIFEST = [
    {
      id: 'audio.voice.murugan.intro_01',
      path: 'assets/audio/voice/ta/murugan_intro_01.ogg',
      type: 'voice',
      language: 'ta',
      region: 'chennai',
      duration: 4.8,
      license: 'Custom Commercial Work-for-Hire (SAG-AFTRA)',
      creator: 'K. Murugesan (Murugan Voice Artist)',
      commercialUse: true,
      streamable: true,
      critical: true,
      fallback: 'audio.voice.en.murugan.intro_01'
    },
    {
      id: 'audio.voice.en.murugan.intro_01',
      path: 'assets/audio/voice/en/murugan_intro_01.ogg',
      type: 'voice',
      language: 'en',
      region: 'chennai',
      duration: 4.5,
      license: 'Custom Commercial Work-for-Hire',
      creator: 'R. Anand (English Dub Cast)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.voice.tamizh.investigate_01',
      path: 'assets/audio/voice/ta/tamizh_investigate_01.ogg',
      type: 'voice',
      language: 'ta',
      region: 'chettinad',
      duration: 3.6,
      license: 'Custom Commercial Work-for-Hire',
      creator: 'Iniyan Sundar (Player Protagonist Voice)',
      commercialUse: true,
      streamable: true,
      critical: true,
      fallback: null
    },
    {
      id: 'audio.voice.velu.pichavaram_01',
      path: 'assets/audio/voice/ta/velu_pichavaram_01.ogg',
      type: 'voice',
      language: 'ta',
      region: 'pichavaram',
      duration: 5.2,
      license: 'Custom Commercial Work-for-Hire',
      creator: 'M. Velayudham (Boatman Voice)',
      commercialUse: true,
      streamable: true,
      critical: true,
      fallback: null
    },
    {
      id: 'audio.voice.selvam.delta_01',
      path: 'assets/audio/voice/ta/selvam_delta_01.ogg',
      type: 'voice',
      language: 'ta',
      region: 'cauvery_delta',
      duration: 4.1,
      license: 'Custom Commercial Work-for-Hire',
      creator: 'S. Selvaraj (Delta Farmer Voice)',
      commercialUse: true,
      streamable: true,
      critical: true,
      fallback: null
    },
    {
      id: 'audio.music.region.chennai',
      path: 'assets/audio/music/region/chennai_theme.ogg',
      type: 'music',
      language: 'neutral',
      region: 'chennai',
      duration: 182.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan (Whispering Wilds Ensemble)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: 'audio.ambience.chennai.day'
    },
    {
      id: 'audio.music.region.cauvery_delta',
      path: 'assets/audio/music/region/cauvery_delta_theme.ogg',
      type: 'music',
      language: 'neutral',
      region: 'cauvery_delta',
      duration: 210.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan (Whispering Wilds Ensemble)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: 'audio.ambience.cauvery_delta.day'
    },
    {
      id: 'audio.music.region.pichavaram',
      path: 'assets/audio/music/region/pichavaram_theme.ogg',
      type: 'music',
      language: 'neutral',
      region: 'pichavaram',
      duration: 195.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan (Whispering Wilds Ensemble)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: 'audio.ambience.pichavaram.day'
    },
    {
      id: 'audio.music.region.chettinad',
      path: 'assets/audio/music/region/chettinad_theme.ogg',
      type: 'music',
      language: 'neutral',
      region: 'chettinad',
      duration: 204.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan (Whispering Wilds Ensemble)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: 'audio.ambience.chettinad.day'
    },
    {
      id: 'audio.music.region.thanjavur',
      path: 'assets/audio/music/region/thanjavur_theme.ogg',
      type: 'music',
      language: 'neutral',
      region: 'thanjavur',
      duration: 228.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan (Whispering Wilds Ensemble)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: 'audio.ambience.thanjavur.day'
    },
    {
      id: 'audio.music.region.mamallapuram',
      path: 'assets/audio/music/region/mamallapuram_theme.ogg',
      type: 'music',
      language: 'neutral',
      region: 'mamallapuram',
      duration: 188.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan (Whispering Wilds Ensemble)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: 'audio.ambience.mamallapuram.day'
    },
    {
      id: 'audio.music.region.nilgiris',
      path: 'assets/audio/music/region/nilgiris_theme.ogg',
      type: 'music',
      language: 'neutral',
      region: 'nilgiris',
      duration: 240.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan (Whispering Wilds Ensemble)',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: 'audio.ambience.nilgiris.day'
    },
    {
      id: 'audio.music.mystery',
      path: 'assets/audio/music/story/ancient_curiosity.ogg',
      type: 'music',
      language: 'neutral',
      region: 'global',
      duration: 160.0,
      license: 'Original Score Commissioned for Whispering Wilds',
      creator: 'S. Vidyadharan',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.music.discovery_stinger',
      path: 'assets/audio/music/story/discovery_chime.ogg',
      type: 'music',
      language: 'neutral',
      region: 'global',
      duration: 4.5,
      license: 'Original Commissioned Asset',
      creator: 'S. Vidyadharan',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.music.festival_pongal',
      path: 'assets/audio/music/festival/pongal_naadaswaram_beat.ogg',
      type: 'music',
      language: 'neutral',
      region: 'cauvery_delta',
      duration: 174.0,
      license: 'Custom Traditional Performance Recording',
      creator: 'Thanjavur Traditional Arts Collective',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.ambience.chennai.day',
      path: 'assets/audio/ambience/city/chennai_day_bed.ogg',
      type: 'ambience',
      language: 'neutral',
      region: 'chennai',
      duration: 120.0,
      license: 'Field Recording License - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.ambience.cauvery_delta.day',
      path: 'assets/audio/ambience/village/delta_paddy_day_bed.ogg',
      type: 'ambience',
      language: 'neutral',
      region: 'cauvery_delta',
      duration: 120.0,
      license: 'Field Recording License - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.ambience.pichavaram.day',
      path: 'assets/audio/ambience/wetland/pichavaram_mangrove_bed.ogg',
      type: 'ambience',
      language: 'neutral',
      region: 'pichavaram',
      duration: 120.0,
      license: 'Field Recording License - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.ambience.chettinad.day',
      path: 'assets/audio/ambience/heritage/chettinad_courtyard_bed.ogg',
      type: 'ambience',
      language: 'neutral',
      region: 'chettinad',
      duration: 120.0,
      license: 'Field Recording License - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.ambience.thanjavur.day',
      path: 'assets/audio/ambience/heritage/thanjavur_craft_temple_bed.ogg',
      type: 'ambience',
      language: 'neutral',
      region: 'thanjavur',
      duration: 120.0,
      license: 'Field Recording License - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.ambience.mamallapuram.day',
      path: 'assets/audio/ambience/coast/mamallapuram_sea_bed.ogg',
      type: 'ambience',
      language: 'neutral',
      region: 'mamallapuram',
      duration: 120.0,
      license: 'Field Recording License - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.ambience.nilgiris.day',
      path: 'assets/audio/ambience/mountain/nilgiris_tea_wind_bed.ogg',
      type: 'ambience',
      language: 'neutral',
      region: 'nilgiris',
      duration: 120.0,
      license: 'Field Recording License - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.wildlife.nilgiri_tahr.call',
      path: 'assets/audio/wildlife/nilgiri_tahr_whistle.ogg',
      type: 'wildlife',
      language: 'neutral',
      region: 'nilgiris',
      duration: 2.2,
      license: 'Field Recorded Wildlife Audio Archive - CC BY 4.0',
      creator: 'Western Ghats Ecological Survey',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.wildlife.nilgiri_langur.alarm',
      path: 'assets/audio/wildlife/nilgiri_langur_whoop.ogg',
      type: 'wildlife',
      language: 'neutral',
      region: 'nilgiris',
      duration: 2.8,
      license: 'Field Recorded Wildlife Audio Archive - CC BY 4.0',
      creator: 'Western Ghats Ecological Survey',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.wildlife.peafowl.call',
      path: 'assets/audio/wildlife/peafowl_call_01.ogg',
      type: 'wildlife',
      language: 'neutral',
      region: 'cauvery_delta',
      duration: 2.5,
      license: 'Field Recorded Wildlife Audio Archive - CC BY 4.0',
      creator: 'Tamil Nadu Wildlife Sound Registry',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.wildlife.elephant.rumble',
      path: 'assets/audio/wildlife/elephant_low_rumble.ogg',
      type: 'wildlife',
      language: 'neutral',
      region: 'nilgiris',
      duration: 4.1,
      license: 'Field Recorded Wildlife Audio Archive - CC BY 4.0',
      creator: 'Western Ghats Bio-Acoustics Team',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.vehicle.auto_rickshaw.engine',
      path: 'assets/audio/transport/auto_2stroke_idle.ogg',
      type: 'vehicle',
      language: 'neutral',
      region: 'chennai',
      duration: 18.0,
      license: 'Direct Foley & Field Recording (Chennai Auto Fleet) - CC BY 4.0',
      creator: 'Whispering Wilds Sound Production Team',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.vehicle.boat.oar_stroke',
      path: 'assets/audio/transport/wood_oar_stroke_pichavaram.ogg',
      type: 'boat',
      language: 'neutral',
      region: 'pichavaram',
      duration: 2.4,
      license: 'Direct Foley Recording in Pichavaram Mangroves - CC BY 4.0',
      creator: 'Whispering Wilds Sound Production Team',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.footstep.stone.sandals',
      path: 'assets/audio/sfx/footsteps/sandals_stone_01.ogg',
      type: 'footstep',
      language: 'neutral',
      region: 'global',
      duration: 0.45,
      license: 'Studio Foley Recording (Custom) - CC BY 4.0',
      creator: 'Chennai Soundstage Studios',
      commercialUse: true,
      streamable: false,
      critical: false,
      fallback: null
    },
    {
      id: 'audio.weather.rain.roof',
      path: 'assets/audio/weather/rain_terracotta_tiles.ogg',
      type: 'weather',
      language: 'neutral',
      region: 'global',
      duration: 45.0,
      license: 'Field Recording Chettinad Roof Rains - CC BY 4.0',
      creator: 'Sound Heritage Tamil Nadu Archives',
      commercialUse: true,
      streamable: true,
      critical: false,
      fallback: null
    }
  ];

  const AudioData = {
    BASE_SETTINGS: AUDIO_BASE_SETTINGS,
    SFX: CORE_SFX_DEFINITIONS,
    MANIFEST: AUDIO_MANIFEST,

    getSoundDef(id) {
      return CORE_SFX_DEFINITIONS[id] || null;
    }
  };

  if (typeof window !== 'undefined') {
    window.AudioData = AudioData;
    window.AUDIO_DATA = {
      ...(window.AUDIO_DATA || {}),
      ...AUDIO_BASE_SETTINGS,
      sfx: { ...(window.AUDIO_DATA?.sfx || {}), ...CORE_SFX_DEFINITIONS }
    };
    window.AUDIO_MANIFEST_DATA = AUDIO_MANIFEST;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioData;
  }
})();
