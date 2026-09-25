// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WILDLIFE AUDIO CATALOG
// Authentic vocalization and movement audio for 9 Tamil Nadu species.
// ============================================================================

(function () {
  'use strict';

  function createSpecies(name, nameTamil, calls) {
    return {
      name,
      nameTamil,
      calls,
      callMap: calls.reduce((acc, c) => {
        acc[c.behavior] = c.id;
        return acc;
      }, {})
    };
  }

  const SPECIES_AUDIO_PROFILES = {
    'nilgiri_tahr': createSpecies('Nilgiri Tahr', 'வரையாடு', [
      { id: 'sfx_wildlife_tahr_snort', behavior: 'idle', intensity: 0.5, timeOfDay: 'day' },
      { id: 'sfx_wildlife_tahr_alarm_whistle', behavior: 'alert', intensity: 0.9, timeOfDay: 'any' },
      { id: 'sfx_wildlife_tahr_alarm_whistle', behavior: 'warning', intensity: 0.95, timeOfDay: 'any' },
      { id: 'sfx_wildlife_tahr_hoof_scramble', behavior: 'flee', intensity: 0.85, timeOfDay: 'any' }
    ]),
    'nilgiri_langur': createSpecies('Nilgiri Langur', 'கருங்குரங்கு', [
      { id: 'sfx_wildlife_langur_whoop_call', behavior: 'idle', intensity: 0.6, timeOfDay: 'day' },
      { id: 'sfx_wildlife_langur_alarm_bark', behavior: 'alert', intensity: 0.9, timeOfDay: 'any' },
      { id: 'sfx_wildlife_langur_alarm_bark', behavior: 'warning', intensity: 0.95, timeOfDay: 'any' },
      { id: 'sfx_wildlife_langur_canopy_shake', behavior: 'flee', intensity: 0.8, timeOfDay: 'any' }
    ]),
    'elephant': createSpecies('Asian Elephant', 'ஆசிய யானை', [
      { id: 'sfx_wildlife_elephant_low_rumble', behavior: 'idle', intensity: 0.7, timeOfDay: 'any' },
      { id: 'sfx_wildlife_elephant_trumpet', behavior: 'alert', intensity: 1.0, timeOfDay: 'any' },
      { id: 'sfx_wildlife_elephant_trumpet', behavior: 'warning', intensity: 1.0, timeOfDay: 'any' },
      { id: 'sfx_wildlife_elephant_heavy_thud', behavior: 'flee', intensity: 0.9, timeOfDay: 'any' }
    ]),
    'gaur': createSpecies('Indian Gaur', 'காட்டு மாடு', [
      { id: 'sfx_wildlife_gaur_huff', behavior: 'idle', intensity: 0.6, timeOfDay: 'any' },
      { id: 'sfx_wildlife_gaur_snort_alert', behavior: 'alert', intensity: 0.85, timeOfDay: 'any' },
      { id: 'sfx_wildlife_gaur_snort_alert', behavior: 'warning', intensity: 0.9, timeOfDay: 'any' },
      { id: 'sfx_wildlife_gaur_trample', behavior: 'flee', intensity: 0.8, timeOfDay: 'any' }
    ]),
    'peafowl': createSpecies('Indian Peafowl', 'மயில்', [
      { id: 'sfx_wildlife_peafowl_call_mayaw', behavior: 'idle', intensity: 0.75, timeOfDay: 'day' },
      { id: 'sfx_wildlife_peafowl_alarm_shriek', behavior: 'alert', intensity: 0.95, timeOfDay: 'day' },
      { id: 'sfx_wildlife_peafowl_alarm_shriek', behavior: 'warning', intensity: 0.95, timeOfDay: 'day' },
      { id: 'sfx_wildlife_peafowl_wing_burst', behavior: 'flee', intensity: 0.8, timeOfDay: 'any' }
    ]),
    'egret': createSpecies('Little Egret', 'சின்ன கொக்கு', [
      { id: 'sfx_wildlife_egret_croak', behavior: 'idle', intensity: 0.5, timeOfDay: 'day' },
      { id: 'sfx_wildlife_egret_wing_flutter', behavior: 'alert', intensity: 0.7, timeOfDay: 'any' },
      { id: 'sfx_wildlife_egret_wing_flutter', behavior: 'warning', intensity: 0.7, timeOfDay: 'any' },
      { id: 'sfx_wildlife_egret_water_skitter', behavior: 'flee', intensity: 0.75, timeOfDay: 'any' }
    ]),
    'kingfisher': createSpecies('White-throated Kingfisher', 'மீன்கொத்தி', [
      { id: 'sfx_wildlife_kingfisher_chatter', behavior: 'idle', intensity: 0.6, timeOfDay: 'day' },
      { id: 'sfx_wildlife_kingfisher_piping_call', behavior: 'alert', intensity: 0.8, timeOfDay: 'day' },
      { id: 'sfx_wildlife_kingfisher_piping_call', behavior: 'warning', intensity: 0.8, timeOfDay: 'day' },
      { id: 'sfx_wildlife_kingfisher_water_dive', behavior: 'flee', intensity: 0.7, timeOfDay: 'day' }
    ]),
    'cattle': createSpecies('Kangayam Cattle', 'நாட்டு மாடு', [
      { id: 'sfx_wildlife_cattle_moo_gentle', behavior: 'idle', intensity: 0.5, timeOfDay: 'any' },
      { id: 'sfx_wildlife_cattle_bell_clink', behavior: 'alert', intensity: 0.6, timeOfDay: 'any' },
      { id: 'sfx_wildlife_cattle_snort', behavior: 'warning', intensity: 0.7, timeOfDay: 'any' },
      { id: 'sfx_wildlife_cattle_trot', behavior: 'flee', intensity: 0.75, timeOfDay: 'any' }
    ]),
    'goat': createSpecies('Domestic Goat', 'வெள்ளாடு', [
      { id: 'sfx_wildlife_goat_bleat_soft', behavior: 'idle', intensity: 0.45, timeOfDay: 'any' },
      { id: 'sfx_wildlife_goat_bleat_loud', behavior: 'alert', intensity: 0.75, timeOfDay: 'any' },
      { id: 'sfx_wildlife_goat_bleat_loud', behavior: 'warning', intensity: 0.8, timeOfDay: 'any' },
      { id: 'sfx_wildlife_goat_scurry', behavior: 'flee', intensity: 0.65, timeOfDay: 'any' }
    ])
  };

  // Aliases for shorter keys
  SPECIES_AUDIO_PROFILES['tahr'] = SPECIES_AUDIO_PROFILES['nilgiri_tahr'];
  SPECIES_AUDIO_PROFILES['langur'] = SPECIES_AUDIO_PROFILES['nilgiri_langur'];

  const WildlifeAudioData = {
    PROFILES: SPECIES_AUDIO_PROFILES,

    getSpeciesProfile(speciesId) {
      if (!speciesId) return null;
      const key = speciesId.toLowerCase();
      return SPECIES_AUDIO_PROFILES[key] || SPECIES_AUDIO_PROFILES[key.replace('nilgiri_', '')] || null;
    },

    getCallSoundId(speciesId, behavior = 'idle', isNight = false) {
      const profile = this.getSpeciesProfile(speciesId);
      if (!profile) return null;
      return profile.callMap[behavior] || profile.callMap['idle'] || null;
    },

    getAppropriateCall(speciesId, timeOfDay = 'day') {
      const profile = this.getSpeciesProfile(speciesId);
      if (!profile) return null;

      if (timeOfDay === 'night') {
        // Peafowls roost quietly at night
        if (speciesId === 'peafowl') return null;
        const nightCall = profile.calls.find(c => c.timeOfDay === 'any' || c.timeOfDay === 'night');
        return nightCall || null;
      }

      return profile.calls[0] || null;
    }
  };

  if (typeof window !== 'undefined') {
    window.WildlifeAudioData = WildlifeAudioData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WildlifeAudioData;
  }
})();
