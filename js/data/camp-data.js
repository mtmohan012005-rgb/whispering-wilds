// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CAMP & REST DATA CONFIGURATION
// Camp deployment rules, campfire properties, fuel resources, and shelter tiers
// ============================================================================

(function() {
  'use strict';

  const CampData = {
    // Camp deployment constraints & restrictions
    placement: {
      minDistanceToWater: 5.0,        // Meters from river/lake/sea shorelines
      maxTerrainSlope: 22.0,          // Maximum slope angle in degrees
      minDistanceBetweenCamps: 25.0,  // Prevents clustered camp stacking
      restrictedZones: [
        'madras_high_court_interior',
        'thanjavur_sanctum_sanctorum',
        'market_square_chennai'
      ]
    },

    // Campfire specifications
    campfire: {
      maxFuelSeconds: 720.0,          // 12 real minutes of burning
      defaultInitialFuel: 240.0,      // 4 real minutes per lighting
      warmthRadius: 6.5,              // Effective thermal radius in meters
      warmthBonusPerSec: 8.0,         // Rate at which warmth recovers near fire
      maxFireWarmthCap: 95.0,         // Caps maximum warmth from fire to prevent overheated
      wetnessDryingBonus: 10.0,       // Wetness evaporated per sec near fire
      lightRadius: 11.0,              // Dynamic light illumination radius
      restEfficiencyBonus: 0.35,      // +35% recovery multiplier when resting near fire
      fuelItems: {
        wood: {
          burnTimeSeconds: 180.0,
          inventoryName: 'wood'
        },
        firewood: {
          burnTimeSeconds: 240.0,
          inventoryName: 'firewood'
        }
      }
    },

    // Shelter classifications & protective traits
    shelters: {
      house: {
        id: 'house',
        name: 'Traditional Homestead (வீடு)',
        warmthBonus: 4.0,
        weatherProtection: 0.95,      // 95% protection from rain/wind/cold
        restEfficiency: 1.5,
        safeZone: true
      },
      tea_shop: {
        id: 'tea_shop',
        name: 'Village Tea Stall (தேநீர் கடை)',
        warmthBonus: 3.5,
        weatherProtection: 0.85,
        restEfficiency: 1.25,
        safeZone: true
      },
      heritage_house: {
        id: 'heritage_house',
        name: 'Chettinad Heritage Mansion (செட்டிநாடு அரண்மனை)',
        warmthBonus: 5.0,
        weatherProtection: 0.98,
        restEfficiency: 1.6,
        safeZone: true
      },
      forest_station: {
        id: 'forest_station',
        name: 'Nilgiri Forest Guard Station (வனத்துறை நிலையம்)',
        warmthBonus: 6.0,
        weatherProtection: 0.95,
        restEfficiency: 1.4,
        safeZone: true
      },
      camp_tent: {
        id: 'camp_tent',
        name: 'Canvas Expedition Tent (கூடாரம்)',
        warmthBonus: 2.5,
        weatherProtection: 0.75,
        restEfficiency: 1.2,
        safeZone: true
      },
      toda_hut: {
        id: 'toda_hut',
        name: 'Traditional Toda Arched Dwelling (தோடர் குடிசை)',
        warmthBonus: 5.5,
        weatherProtection: 0.90,
        restEfficiency: 1.45,
        safeZone: true
      }
    },

    // Rest duration profiles
    restOptions: {
      SHORT_REST: {
        id: 'SHORT_REST',
        label: 'Short Rest (சிறு ஓய்வு)',
        durationGameMinutes: 45,
        energyRestorePct: 35,
        healthRestorePct: 15,
        hungerCostPct: 5,
        hydrationCostPct: 8
      },
      LONG_REST: {
        id: 'LONG_REST',
        label: 'Full Overnight Rest (முழு உறக்கம்)',
        durationGameMinutes: 480, // 8 hours
        targetWakeHour: 6.5,     // 06:30 AM Sunrise
        energyRestorePct: 100,
        healthRestorePct: 40,
        hungerCostPct: 18,
        hydrationCostPct: 22,
        grantsRestedBuff: true,
        restedBuffDurationSec: 360
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampData;
  } else {
    window.CampData = CampData;
  }
})();
