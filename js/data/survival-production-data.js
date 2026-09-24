// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION SURVIVAL DATA CONFIGURATION
// GAMEPLAY BALANCE VALUES: Tuned for atmospheric exploration without punishing grind
// ============================================================================

(function() {
  'use strict';

  const SurvivalProductionData = {
    // Stat ranges & limits
    vitals: {
      health: { min: 0, max: 100, default: 100 },
      energy: { min: 0, max: 100, default: 100 },
      hydration: { min: 0, max: 100, default: 100 },
      hunger: { min: 0, max: 100, default: 100 },
      warmth: { min: 0, max: 100, default: 80 },
      wetness: { min: 0, max: 100, default: 0 }
    },

    // Per-second decay rates by movement activity (Gameplay values)
    movementDrains: {
      IDLE: {
        energy: 0.05,
        hydration: 0.015,
        hunger: 0.01,
        warmthLossMult: 1.0
      },
      WALK: {
        energy: 0.25,
        hydration: 0.035,
        hunger: 0.02,
        warmthLossMult: 0.95
      },
      RUN: {
        energy: 0.75,
        hydration: 0.08,
        hunger: 0.035,
        warmthLossMult: 0.85
      },
      SPRINT: {
        energy: 2.2,
        hydration: 0.16,
        hunger: 0.05,
        warmthLossMult: 0.8
      },
      CLIMB: {
        energy: 1.8,
        hydration: 0.14,
        hunger: 0.045,
        warmthLossMult: 0.9
      },
      SWIM: {
        energy: 2.0,
        hydration: 0.12,
        hunger: 0.04,
        warmthLossMult: 2.5,
        wetnessGain: 60.0
      },
      BOAT: {
        energy: 0.3,
        hydration: 0.04,
        hunger: 0.025,
        warmthLossMult: 1.1
      }
    },

    // Critical threshold points triggering debuffs
    thresholds: {
      exhaustion: 12.0,       // Energy <= 12: sprinting blocked, movement slow
      dehydrationWarn: 25.0,  // Hydration <= 25: warning notification
      dehydrationCrit: 10.0,  // Hydration <= 10: speed penalty, slow health decay
      hungerWarn: 25.0,       // Hunger <= 25: warning notification
      hungerCrit: 10.0,       // Hunger <= 10: energy regeneration locked, slow health decay
      coldWarn: 35.0,         // Warmth <= 35: shivering, stamina recovery slowed
      coldCrit: 15.0,         // Warmth <= 15: gradual health decay
      overheatTemp: 38.0,     // Ambient temp >= 38C: increased hydration & energy drain
      wetnessEvaporationRate: 3.5 // Normal drying per second in shelter / warm air
    },

    // Gradual damage rates when in prolonged critical condition (HP/sec)
    criticalHealthDecay: {
      dehydration: 0.35,
      starvation: 0.25,
      extremeCold: 0.50,
      extremeHeat: 0.30
    },

    // Standard consumable restoration mappings
    consumables: {
      canteenWater: {
        hydration: 35,
        energy: 5,
        statusAdd: 'HYDRATED'
      },
      vadai: {
        hunger: 40,
        energy: 20,
        statusAdd: 'WELL_FED'
      },
      tea: {
        hydration: 20,
        warmth: 25,
        energy: 15
      },
      elaneer: {
        hydration: 45,
        energy: 15,
        hunger: 10
      },
      idliSambar: {
        hunger: 60,
        energy: 30,
        statusAdd: 'WELL_FED'
      },
      purifiedWater: {
        hydration: 50,
        energy: 10,
        statusAdd: 'HYDRATED'
      },
      herbalDecoction: {
        health: 25,
        warmth: 20,
        energy: 20
      }
    },

    // Accessibility Mode Modifiers
    assistMode: {
      drainMultiplier: 0.5,
      recoveryMultiplier: 1.5,
      damageMultiplier: 0.4
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SurvivalProductionData;
  } else {
    window.SurvivalProductionData = SurvivalProductionData;
  }
})();
