// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLAYER PERK DATA
// Authoritative perk definitions and aggregate modifier resolution.
// Perk identifiers are persisted inside NewGamePlusSystem.earnedPerks.
// ============================================================================

(function () {
  'use strict';

  const PERK_DATA = {
    // Multiplier semantics: 1.0 = no change, below 1.0 = cost reduced,
    // above 1.0 = benefit increased.
    perks: {
      tea_master: {
        id: 'tea_master',
        name: 'Tea Master',
        nameTa: 'சோம்பு மேஸ்டர்',
        description: 'Years pulling steaming tumblers at Kangayam roadside stalls. You have learned to spend nothing on effort you do not need.',
        descriptionTa: 'ஆண்டுகள் சோம்பு இடமாற்றும் அனுபவம். தேவையில்லாத உயிர்ப்பை வீணாகாமல் செலவிடுகிறீர்கள்.',
        category: 'stamina',
        effects: {
          staminaDrainMultiplier: 0.75,
          staminaRecoveryMultiplier: 1.25
        },
        unlockHint: 'Complete the roadside tea stall encounters in the plains.'
      },

      shola_tracker: {
        id: 'shola_tracker',
        name: 'Shola Tracker',
        nameTa: 'ஷோலா வழிகாட்டி',
        description: 'You read shola grass the way others read signage, and the forest parts for you instead of against you.',
        descriptionTa: 'ஷோலா புற்றை நீங்கள் அறிகுறிகளாகவும், அவை உங்களுக்காகவே பிரிகின்றன.',
        category: 'mobility',
        effects: {
          vegetationSpeedMultiplier: 1.30,
          staminaDrainMultiplier: 0.90
        },
        unlockHint: 'Traverse the high-altitude shola grassland in the Nilgiris.'
      },

      heritage_archivist: {
        id: 'heritage_archivist',
        name: 'Heritage Archivist',
        nameTa: 'பாரம்பரிய ஆர்க்கைவிஸ்ட்',
        description: 'You keep careful notes, and the marginalia turn out to be evidence. Clues surface that others walked straight past.',
        descriptionTa: 'நீங்கள் கவனமாகக் குறிப்புகள் வைக்கிறீர்கள், மற்றும் அவையே சான்றாகின்றன.',
        category: 'discovery',
        effects: {
          clueYieldBonus: 1,
          codexRevealBonus: 1
        },
        unlockHint: 'Recover archival records and complete the master codex.'
      },

      wildlife_photographer: {
        id: 'wildlife_photographer',
        name: 'Wildlife Photographer',
        nameTa: 'விலங்கு புகைப்படக்காரர்',
        description: 'Steady hands and a patient shutter. Subjects that would bolt from most observers hold still for you.',
        descriptionTa: 'நிலையான கைகள், பொறுமையான ஷட்டர். பெரும்பாலோர் ஓடுவவை இயற்கை நிற்கவே முடியும்.',
        category: 'photography',
        effects: {
          photoSuccessBonus: 0.25,
          wildlifeApproachBonus: 0.20,
          clueYieldBonus: 0
        },
        unlockHint: 'Log rare species in the wildlife journal.'
      }
    },

    // Modifier keys that resolve multiplicatively (product of all holders).
    multiplicativeModifiers: [
      'staminaDrainMultiplier',
      'staminaRecoveryMultiplier',
      'vegetationSpeedMultiplier'
    ],

    // Modifier keys that resolve additively (sum of all holders). These are
    // "bonus" style values layered on top of a neutral zero baseline.
    additiveModifiers: [
      'clueYieldBonus',
      'codexRevealBonus',
      'photoSuccessBonus',
      'wildlifeApproachBonus'
    ],

    // Neutral baselines. Multiplicative defaults are 1.0, additive defaults 0.
    modifierDefaults: {
      staminaDrainMultiplier: 1.0,
      staminaRecoveryMultiplier: 1.0,
      vegetationSpeedMultiplier: 1.0,
      photoSuccessBonus: 0,
      wildlifeApproachBonus: 0,
      clueYieldBonus: 0,
      codexRevealBonus: 0
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PERK_DATA;
  } else {
    window.PERK_DATA = PERK_DATA;
  }
})();
