// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EMERGENCY & HAZARD DATA CONFIGURATION
// Non-combat safety, downed state recovery, fall damage, and safe checkpoints
// ============================================================================

(function() {
  'use strict';

  const EmergencyData = {
    // Authoritative Emergency States
    states: {
      NORMAL: 'NORMAL',
      WARNING: 'WARNING',
      CRITICAL: 'CRITICAL',
      DOWNED: 'DOWNED',
      RECOVERING: 'RECOVERING'
    },

    // Downed state parameters
    downed: {
      message: "You have collapsed from exhaustion. Local villagers guided you to safety.",
      respawnFadeDurationSec: 2.5,
      recoveryRestore: {
        health: 35,
        energy: 50,
        hydration: 60,
        hunger: 50,
        warmth: 75,
        wetness: 0
      },
      // INVENTORY, CURRENCY, QUESTS & CUSTOMIZATION MUST NEVER BE DELETED
      preserveInventory: true,
      preserveCurrency: true,
      preserveQuests: true,
      preserveCustomizationLimit: true
    },

    // Fall damage velocity thresholds and formulas
    fallDamage: {
      minDamageVelocity: 14.5,      // Vertical velocity below this = 0 damage (small safe jump)
      moderateVelocity: 19.0,       // Moderate fall threshold
      maxVelocity: 28.0,            // Extreme fall threshold
      baseDamageRate: 4.0,          // Damage multiplier for (v - minDamageVelocity)
      maxPossibleDamage: 65.0       // Never instant kill from normal cliff steps
    },

    // Safe Checkpoints & Medical / Rest Respawns per Region
    safeRespawns: {
      george_town: {
        name: 'George Town Medical Dispensary',
        position: { x: 220, y: 0, z: 630 },
        region: 'george_town'
      },
      cauvery_delta: {
        name: 'Cauvery Riverbank Farmer Homestead',
        position: { x: 1200, y: 0, z: 800 },
        region: 'cauvery_delta'
      },
      pichavaram: {
        name: 'Pichavaram Forest Ranger Post',
        position: { x: 2500, y: 0, z: 1200 },
        region: 'pichavaram'
      },
      chettinad: {
        name: 'Kanadukathan Heritage Courtyard',
        position: { x: 3800, y: 0, z: 1500 },
        region: 'chettinad'
      },
      thanjavur: {
        name: 'Thanjavur Temple Chathiram (Dharmashala)',
        position: { x: 4900, y: 0, z: 2100 },
        region: 'thanjavur'
      },
      mamallapuram: {
        name: 'Mamallapuram Fisherman Cottage',
        position: { x: 6200, y: 0, z: 2800 },
        region: 'mamallapuram'
      },
      nilgiris: {
        name: 'Nilgiri Tea Planter Rest Bungalow',
        position: { x: 7800, y: 0, z: 3500 },
        region: 'nilgiris'
      },
      final_sanctuary: {
        name: 'Pasumai Thadam Herbalist Shrine',
        position: { x: 9200, y: 0, z: 4200 },
        region: 'final_sanctuary'
      }
    },

    // Certified safe drinking water points
    safeWaterSources: [
      { id: 'water_pot_chennai', name: 'Clay Pot Drinking Water (மண்பானை தண்ணீர்)', safeToDrink: true },
      { id: 'temple_theertham_thanjavur', name: 'Temple Holy Water Well (தீர்த்த குளம்)', safeToDrink: true },
      { id: 'mountain_spring_nilgiris', name: 'Filtered Mountain Spring Stream', safeToDrink: true },
      { id: 'tea_kadai_water_pot', name: 'Murugan Tea Stall Clean Water Pot', safeToDrink: true }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyData;
  } else {
    window.EmergencyData = EmergencyData;
  }
})();
