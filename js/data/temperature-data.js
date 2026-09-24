// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REGIONAL TEMPERATURE DATA
// Gameplay model calibrated for authentic Tamil Nadu climates & microclimates
// ============================================================================

(function() {
  'use strict';

  const TemperatureData = {
    // Regional Baseline Profiles (Degrees Celsius - Gameplay Model)
    regions: {
      george_town: {
        name: 'George Town & Madras Coast',
        baseTemp: 32.0,
        humidity: 0.75,
        windExposure: 0.5,
        description: 'Warm coastal metropolis with high humidity and sea breezes'
      },
      cauvery_delta: {
        name: 'Cauvery River Delta',
        baseTemp: 31.0,
        humidity: 0.65,
        windExposure: 0.4,
        description: 'Vibrant alluvial agricultural floodplain with warm humid air'
      },
      pichavaram: {
        name: 'Pichavaram Mangrove Forests',
        baseTemp: 29.5,
        humidity: 0.90,
        windExposure: 0.3,
        description: 'Dense estuarine mangrove labyrinth with heavy humidity & water mist'
      },
      chettinad: {
        name: 'Chettinad Heritage Plains',
        baseTemp: 34.5,
        humidity: 0.35,
        windExposure: 0.6,
        description: 'Semi-arid, red laterite soil plains with intense afternoon heat'
      },
      thanjavur: {
        name: 'Thanjavur Temple Valley',
        baseTemp: 32.5,
        humidity: 0.55,
        windExposure: 0.4,
        description: 'Rich agricultural interior basin, warm days and mild evenings'
      },
      mamallapuram: {
        name: 'Mamallapuram Shorelines',
        baseTemp: 30.0,
        humidity: 0.80,
        windExposure: 0.7,
        description: 'Rocky coastal headland with constant maritime sea-spray & winds'
      },
      nilgiris: {
        name: 'Nilgiris Blue Mountains',
        baseTemp: 13.5,
        humidity: 0.70,
        windExposure: 0.8,
        description: 'High-altitude Western Ghats cloud forest, cool montane climate'
      },
      final_sanctuary: {
        name: 'Pasumai Thadam Botanical Valley',
        baseTemp: 18.0,
        humidity: 0.60,
        windExposure: 0.3,
        description: 'Sheltered highland sacred grove with temperate microclimate'
      }
    },

    // Diurnal variation curve (Offset relative to base temperature across 24h)
    diurnalOffsets: [
      { hour: 0, offset: -4.0 },
      { hour: 4, offset: -5.0 }, // Pre-dawn chill
      { hour: 6, offset: -3.0 }, // Sunrise
      { hour: 9, offset: 0.0 },  // Mid-morning
      { hour: 12, offset: +3.5 },// Midday peak
      { hour: 14, offset: +4.5 },// Afternoon heat peak
      { hour: 17, offset: +1.5 },// Sunset
      { hour: 20, offset: -2.0 },// Dusk
      { hour: 24, offset: -4.0 }
    ],

    // Elevation lapse rate: degrees Celsius change per 10 meters of elevation
    elevationLapseRate: -0.18,

    // Weather impact on ambient temperature and warmth loss multiplier
    weatherModifiers: {
      clear: {
        tempOffset: 0.0,
        warmthLossMult: 1.0,
        sunExposure: 1.0
      },
      sunny: {
        tempOffset: +3.0,
        warmthLossMult: 0.8,
        sunExposure: 1.5
      },
      overcast: {
        tempOffset: -1.5,
        warmthLossMult: 1.1,
        sunExposure: 0.5
      },
      fog: {
        tempOffset: -3.0,
        warmthLossMult: 1.35,
        sunExposure: 0.3
      },
      rain: {
        tempOffset: -4.5,
        warmthLossMult: 1.8,
        sunExposure: 0.1,
        wetnessGainRate: 4.0
      },
      heavy_rain: {
        tempOffset: -6.0,
        warmthLossMult: 2.3,
        sunExposure: 0.0,
        wetnessGainRate: 8.5
      },
      storm: {
        tempOffset: -7.5,
        warmthLossMult: 2.8,
        sunExposure: 0.0,
        wetnessGainRate: 12.0
      }
    },

    // Outfit Thermal Insulation & Protection Ratings (0.0 to 1.0 scale)
    outfits: {
      nilgiri_warmwear: {
        coldProtection: 0.85,
        coldInsulation: 0.85,
        heatDissipation: 0.20,
        rainResistance: 0.65,
        description: 'Thick woven Toda shawl and layered wool vest; exceptional cold protection'
      },
      everyday_veshti: {
        coldProtection: 0.15,
        coldInsulation: 0.15,
        heatDissipation: 0.85,
        rainResistance: 0.10,
        description: 'Pure handloom cotton veshti & angavastram; maximizes airflow and heat relief'
      },
      urban_explorer: {
        coldProtection: 0.40,
        coldInsulation: 0.40,
        heatDissipation: 0.50,
        rainResistance: 0.40,
        description: 'Lightweight linen shirt and durable cotton trousers; balanced all-region wear'
      },
      village_workwear: {
        coldProtection: 0.30,
        coldInsulation: 0.30,
        heatDissipation: 0.60,
        rainResistance: 0.25,
        description: 'Rugged cotton dhoti and rolled sleeve shirt with head towel for sun shade'
      },
      festival_veshti: {
        coldProtection: 0.20,
        coldInsulation: 0.20,
        heatDissipation: 0.70,
        rainResistance: 0.15,
        description: 'Silk-bordered ceremonial pattu veshti; comfortable in warm evenings'
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemperatureData;
  } else {
    window.TemperatureData = TemperatureData;
  }
})();
