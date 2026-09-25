// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - NEW GAME+ CONFIGURATION DATA
// Authoritative rules for New Game+ cycles (NG+ 1, NG+ 2, etc.):
// - Strict preservation of valid completed saves (dedicated save slot)
// - Strict customization ceiling enforcement: customizationChangesUsed <= 5
// - Carryovers: Level, survival attributes, master codex, achievements, cosmetics
// - World resets: Story quests, region barriers, puzzle mechanisms
// - NG+ Exclusive Modifiers & Per-Cycle Rewards
// ============================================================================

(function () {
  'use strict';

  const NEW_GAME_PLUS_CONFIG = {
    maxGeneration: 5,
    customizationCeiling: 5,
    saveSlotPrefix: 'whisperingWilds_save_ngplus_gen',

    // Attributes strictly permitted to carry over
    permittedCarryovers: [
      'player_attributes',     // Health/stamina/energy maximums & level
      'master_codex',          // All unlocked cultural & wildlife knowledge
      'wildlife_journal',      // Observed species entries & photos
      'achievements',          // Unlocked trophies and cosmetic titles
      'unlocked_recipes',      // Camp craft recipes & traditional remedies
      'customization_records', // Persisted customizationHistory (changesUsed remains <= 5)
      'cosmetic_outfits',      // Earned traditional garments and accessories
      'ending_badges'          // Badges from previous campaign completions
    ],

    // State elements strictly reset to preserve story progression integrity
    requiredResets: [
      'quests',                // Main story and side quests reset to Chapter 1
      'evidence',              // Physical clues reset so detective work can be re-experienced
      'branch_choices',        // Branch decisions cleared for alternate path discovery
      'region_locks',          // World locks reset (with optional veteran fast-scout routes)
      'puzzle_states',         // Environmental mechanisms reset to initial unsolved state
      'temporary_world_events' // Active atmospheric events reset to initial seed
    ],

    // Selectable NG+ Gameplay Modifiers
    selectableModifiers: [
      {
        id: 'mod_intense_monsoon',
        name: 'Fierce Tamil Monsoon (கடும் பருவமழை)',
        description: 'Heavy downpours, gale winds, and rising river swells occur with double frequency. Wetness cools player rapidly.',
        xpMultiplier: 1.25,
        defaultActive: false
      },
      {
        id: 'mod_master_investigator',
        name: 'Master Detective (புலனாய்வு முறை)',
        description: 'HUD objective markers and clue halos are disabled. Navigation requires reading topographical clues and terrain tracks.',
        xpMultiplier: 1.35,
        defaultActive: false
      },
      {
        id: 'mod_arduous_trek',
        name: 'Arduous Wilderness Trek (கடும் நடைப்பயணம்)',
        description: 'Stamina and hydration deplete 20% faster under noon sun. Survival rest stops are paramount.',
        xpMultiplier: 1.20,
        defaultActive: false
      }
    ],

    // Generation-specific unlocks & unique narrative perks
    generationRewards: [
      {
        generation: 1,
        title: 'Trail Veteran (தடத்தின் முன்னோடி)',
        tamilTitle: 'தடத்தின் முன்னோடி',
        perkId: 'perk_ancestral_chembu',
        perkName: 'Ancestral Brass Chembu (பாரம்பரிய பித்தளை செம்பு)',
        perkDescription: 'Carries 25% more spring water and provides +10% hydration efficiency.',
        exclusiveDialogueUnlocked: true
      },
      {
        generation: 2,
        title: 'Wayfarer of the Ghats (மலைநாட்டு வழிகாட்டி)',
        tamilTitle: 'மலைநாட்டு வழிகாட்டி',
        perkId: 'perk_shola_strider',
        perkName: 'Shola Strider Footwear (சோலை நடை காலணி)',
        perkDescription: 'Reduces mud locomotion friction penalty by 30%.',
        exclusiveDialogueUnlocked: true
      },
      {
        generation: 3,
        title: 'Master of the Five Landscapes (ஐந்திணை நாயகன்)',
        tamilTitle: 'ஐந்திணை நாயகன்',
        perkId: 'perk_pancha_thinai_harmony',
        perkName: 'Harmony of the Five Soils (ஐந்திணை நல்லிணக்கம்)',
        perkDescription: 'NPC base trust in all 6 regions begins at +15 affinity.',
        exclusiveDialogueUnlocked: true
      }
    ]
  };

  const NewGamePlusData = {
    CONFIG: NEW_GAME_PLUS_CONFIG,

    getModifier(modifierId) {
      return NEW_GAME_PLUS_CONFIG.selectableModifiers.find(m => m.id === modifierId) || null;
    },

    getAllModifiers() {
      return [...NEW_GAME_PLUS_CONFIG.selectableModifiers];
    },

    getGenerationReward(gen) {
      return NEW_GAME_PLUS_CONFIG.generationRewards.find(r => r.generation === gen) || null;
    },

    getDedicatedSaveSlot(generation) {
      return `${NEW_GAME_PLUS_CONFIG.saveSlotPrefix}${generation}`;
    }
  };

  if (typeof window !== 'undefined') {
    window.NEW_GAME_PLUS_CONFIG = NEW_GAME_PLUS_CONFIG;
    window.NewGamePlusData = NewGamePlusData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewGamePlusData;
  }
})();
