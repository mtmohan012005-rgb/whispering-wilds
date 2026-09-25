// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REGIONAL ACOUSTIC & INTERIOR DATA
// Environmental acoustic parameters, interior reverb decay times, and dampening.
// ============================================================================

(function () {
  'use strict';

  const REGIONAL_ACOUSTICS = {
    'george_town': {
      name: 'Chennai & George Town',
      airAbsorption: 0.05,
      openSpaceScale: 1.0,
      dominantFreq: 'broadband_urban'
    },
    'cauvery_delta': {
      name: 'Cauvery River Basin & Thiruvaiyaru',
      airAbsorption: 0.08,
      openSpaceScale: 1.2,
      dominantFreq: 'low_water_rush'
    },
    'pichavaram': {
      name: 'Pichavaram Mangrove Wetlands',
      airAbsorption: 0.12, // High humidity dampening
      openSpaceScale: 0.8,
      dominantFreq: 'mid_leaf_diffuse'
    },
    'chettinad': {
      name: 'Chettinad Ancestral Mansions',
      airAbsorption: 0.06,
      openSpaceScale: 0.9,
      dominantFreq: 'high_teak_reflection'
    },
    'thanjavur': {
      name: 'Thanjavur Temple City',
      airAbsorption: 0.05,
      openSpaceScale: 1.1,
      dominantFreq: 'stone_resonant'
    },
    'mamallapuram': {
      name: 'Mamallapuram Coastal Rocks',
      airAbsorption: 0.07,
      openSpaceScale: 1.4,
      dominantFreq: 'ocean_surge_white_noise'
    },
    'nilgiris': {
      name: 'Nilgiris Western Ghats',
      airAbsorption: 0.04, // Low humidity high altitude crispness
      openSpaceScale: 1.5,
      dominantFreq: 'wind_whisper'
    }
  };

  const INTERIOR_ZONES = {
    'tea_shop': {
      name: 'Murugan Tea Kadai (தேநீர்க்கடை)',
      decayTimeSec: 0.6,
      exteriorLowpassCutoffHz: 1100,
      reverbWetLevel: 0.15
    },
    'chettinad_mansion': {
      name: 'Kanadukathan Ancestral Valavu Courtyard (செட்டிநாட்டு மாளிகை)',
      decayTimeSec: 1.4,
      exteriorLowpassCutoffHz: 800,
      reverbWetLevel: 0.28
    },
    'temple_sanctum': {
      name: 'Granite Temple Mandapam (கோவில் மண்டபம்)',
      decayTimeSec: 2.2,
      exteriorLowpassCutoffHz: 650,
      reverbWetLevel: 0.40
    },
    'swamimalai_foundry': {
      name: 'Bronze Casting Workshop (சுவாமிமலை பட்டறை)',
      decayTimeSec: 0.9,
      exteriorLowpassCutoffHz: 950,
      reverbWetLevel: 0.20
    },
    'mountain_shelter': {
      name: 'Forest Watcher Hut (வனக் குடில்)',
      decayTimeSec: 0.5,
      exteriorLowpassCutoffHz: 1200,
      reverbWetLevel: 0.12
    }
  };

  const RegionAudioData = {
    REGIONS: REGIONAL_ACOUSTICS,
    INTERIORS: INTERIOR_ZONES,

    getRegionAcoustics(region) {
      return REGIONAL_ACOUSTICS[region] || REGIONAL_ACOUSTICS['george_town'];
    },

    getInteriorZone(zoneId) {
      return INTERIOR_ZONES[zoneId] || INTERIOR_ZONES['tea_shop'];
    }
  };

  if (typeof window !== 'undefined') {
    window.RegionAudioData = RegionAudioData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegionAudioData;
  }
})();
