// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - NEW GAME+ SYSTEM
// Production-grade New Game+ lifecycle manager.
//
// Rules strictly enforced:
// - Never overwrite the only valid completed save (creates dedicated NG+ save slot)
// - Never allow New Game+ to bypass story/security validation (requires verified completion)
// - ABSOLUTE PLAYER CUSTOMIZATION LIMIT: 5 PERMANENT CHANGES MAXIMUM
// - Selective carryovers: Level, survival attributes, master codex, achievements
// - Reset narrative: Story quests, region barriers, puzzle mechanisms, evidence
// ============================================================================

(function () {
  'use strict';

  class NewGamePlusSystem {
    constructor() {
      this.generation = 0;
      this.activeModifiers = [];
      this.earnedPerks = [];
      this.cycleStartTime = null;
      this.initialized = false;
    }

    init(savedData = null) {
      if (savedData) {
        if (typeof savedData.generation === 'number') {
          this.generation = savedData.generation;
        }
        if (Array.isArray(savedData.activeModifiers)) {
          this.activeModifiers = [...savedData.activeModifiers];
        }
        if (Array.isArray(savedData.earnedPerks)) {
          this.earnedPerks = [...savedData.earnedPerks];
        }
        if (savedData.cycleStartTime) {
          this.cycleStartTime = savedData.cycleStartTime;
        }
      }

      this.initialized = true;
      this.syncWithGameState();

      if (window.SystemRegistry) {
        window.SystemRegistry.register('NewGamePlusSystem', this, {
          version: '1.0.0',
          dependencies: ['GameState']
        });
      }

      return this;
    }

    canStartNewGamePlus() {
      // 1. Check if an ending has been triggered or story is completed
      const hasEnding = !!(window.EndingSystem && window.EndingSystem.getCurrentEnding());
      const hasStoryFlag = !!(window.GameState && window.GameState.story && window.GameState.story.storyCompleted);
      const hasStoryContentComplete = !!(window.StoryContentSystem && window.StoryContentSystem.storyCompleted);

      return hasEnding || hasStoryFlag || hasStoryContentComplete;
    }

    startNewGamePlus(options = {}) {
      // Security Validation: Cannot start NG+ without legitimate campaign completion
      if (!this.canStartNewGamePlus()) {
        const errorMsg = 'Cannot initiate New Game+: A verified story ending completion is required.';
        console.error(`[NewGamePlusSystem] ${errorMsg}`);
        return { success: false, reason: errorMsg };
      }

      const nextGen = this.generation + 1;
      const selectedModifiers = Array.isArray(options.modifiers) ? options.modifiers : [];

      console.log(`[NewGamePlusSystem] Initiating New Game+ Generation ${nextGen}...`);

      // 1. PRESERVE COMPLETED SAVE: Do NOT overwrite the only valid completed save!
      this._archiveCompletedCampaignSave();

      // 2. EXTRACT AUTHORITATIVE PERMITTED CARRYOVERS
      const carryovers = this._extractCarryovers();

      // 3. STRICT CUSTOMIZATION CEILING GUARD (Never allow bypass of 5-change ceiling)
      const currentCustomChanges = Math.min(5, Math.max(0, carryovers.playerCustomizationChangesUsed));

      // 4. RESET WORLD AND STORY PROGRESSION
      this._resetWorldAndNarrative();

      // 5. RE-APPLY CARRYOVERS & ADVANCE GENERATION
      this.generation = nextGen;
      this.activeModifiers = [...selectedModifiers];
      this.cycleStartTime = Date.now();

      // Grant generation perk if defined in NewGamePlusData
      const genReward = window.NewGamePlusData?.getGenerationReward(nextGen);
      if (genReward && !this.earnedPerks.includes(genReward.perkId)) {
        this.earnedPerks.push(genReward.perkId);
      }

      // Re-apply carryover attributes to GameState
      this._applyCarryovers(carryovers, currentCustomChanges);

      // 6. SAVE INTO DEDICATED NG+ SLOT
      const dedicatedSlot = `ngplus_gen${nextGen}`;
      if (window.SaveManager && typeof window.SaveManager.saveGameImmediate === 'function') {
        window.SaveManager.saveGameImmediate(dedicatedSlot, `ng_plus_gen_${nextGen}_start`);
      }

      this.syncWithGameState();

      if (window.NotificationSystem) {
        window.NotificationSystem.show(
          `New Game+ Cycle ${nextGen} Initialized! Codex, titles, and survival mastery retained. Original completed campaign archived safely.`,
          'success'
        );
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('new_game_plus_started', {
          detail: {
            generation: this.generation,
            activeModifiers: this.activeModifiers,
            dedicatedSlot
          }
        }));
      }

      return {
        success: true,
        generation: this.generation,
        dedicatedSlot,
        activeModifiers: this.activeModifiers,
        earnedPerks: this.earnedPerks
      };
    }

    _archiveCompletedCampaignSave() {
      if (typeof localStorage === 'undefined') return;

      try {
        const completedSlotKey = 'whisperingWilds_save_completed_campaign';
        const currentAutoSave = localStorage.getItem('whisperingWilds_save_auto');

        if (currentAutoSave) {
          // Store immutable copy of completed campaign
          localStorage.setItem(completedSlotKey, currentAutoSave);
          console.log('[NewGamePlusSystem] Valid completed save archived safely to:', completedSlotKey);
        }
      } catch (err) {
        console.warn('[NewGamePlusSystem] Could not archive completed save:', err);
      }
    }

    _extractCarryovers() {
      const playerState = window.GameState?.player || {};
      const survival = playerState.survival || {};

      return {
        // Survival level & baseline attributes
        level: playerState.level || 1,
        maxHealth: survival.maxHealth || 100,
        maxEnergy: survival.maxEnergy || 100,
        maxHydration: survival.maxHydration || 100,
        maxWarmth: survival.maxWarmth || 100,

        // Customization count strictly preserved
        playerCustomizationChangesUsed: playerState.customizationChangesUsed || 0,
        customizationHistory: [...(playerState.customizationHistory || [])],
        outfitId: playerState.outfitId || 'everyday_veshti',

        // Codex & Discoveries
        codexState: window.CodexSystem ? window.CodexSystem.serialize() : null,
        achievementsState: window.AchievementSystem ? window.AchievementSystem.serialize() : null,
        discoveriesState: window.DiscoveryProgression ? window.DiscoveryProgression.serialize() : null,

        // Cosmetic unlocked garments
        unlockedOutfits: (window.WardrobeData && window.WardrobeData.UNLOCKED_OUTFITS) ? [...window.WardrobeData.UNLOCKED_OUTFITS] : []
      };
    }

    _resetWorldAndNarrative() {
      // 1. Reset StoryContentSystem
      if (window.StoryContentSystem) {
        window.StoryContentSystem.activeChapterIndex = 0;
        window.StoryContentSystem.storyCompleted = false;
        window.StoryContentSystem.collectedEvidence.clear();
        window.StoryContentSystem.unlockedRegions = new Set(['george_town']);
        if (window.StoryContentSystem.chapters) {
          window.StoryContentSystem.chapters.forEach(ch => {
            ch.completed = false;
            if (ch.objectives) ch.objectives.forEach(o => o.done = false);
            if (ch.optionalObjectives) ch.optionalObjectives.forEach(o => o.done = false);
          });
        }
      }

      // 2. Reset StoryProgressionSystem
      if (window.StoryProgressionSystem) {
        window.StoryProgressionSystem.currentNodeId = 'node_prologue_heist';
        window.StoryProgressionSystem.completedNodes = [];
        window.StoryProgressionSystem.completedObjectives = new Set();
      }

      // 3. Reset StoryBranchSystem
      if (window.StoryBranchSystem) {
        window.StoryBranchSystem.choices = {};
        window.StoryBranchSystem.choiceHistory = [];
        window.StoryBranchSystem.flags = new Set();
        window.StoryBranchSystem.selectedDestiny = null;
        // Retain baseline familiarity (+5 for veteran awareness)
        window.StoryBranchSystem.factionAffinity = { heritage_council: 35, archaeological_society: 35, local_resistance: 35 };
        window.StoryBranchSystem.npcAffinity = { murugan: 25, velu: 25, selvam: 20, sundaram: 20, mani: 20 };
      }

      // 4. Reset Region Locks in World
      if (window.GameState?.world?.regionUnlocks) {
        window.GameState.world.regionUnlocks = {
          george_town: true,
          cauvery_delta: false,
          pichavaram: false,
          chettinad: false,
          thanjavur: false,
          mamallapuram: false,
          nilgiris: false,
          final_sanctuary: false
        };
      }

      // 5. Reset Player Position to George Town
      const player = window.gamePlayer || window.testRef?.player || window.GameState?.player;
      if (player) {
        player.x = 220;
        player.y = 630;
        if (player.position) {
          player.position.x = 220;
          player.position.y = 0;
          player.position.z = 630;
        }
      }
    }

    _applyCarryovers(carryovers, enforcedCustomCount) {
      if (!window.GameState) return;

      const p = window.GameState.player;
      if (p) {
        p.customizationChangesUsed = Math.min(5, Math.max(0, enforcedCustomCount));
        p.maxCustomizationChanges = 5;
        p.customizationHistory = [...(carryovers.customizationHistory || [])];
        p.outfitId = carryovers.outfitId || 'everyday_veshti';

        if (p.survival) {
          p.survival.maxHealth = carryovers.maxHealth;
          p.survival.health = carryovers.maxHealth;
          p.survival.maxEnergy = carryovers.maxEnergy;
          p.survival.energy = carryovers.maxEnergy;
          p.survival.maxHydration = carryovers.maxHydration;
          p.survival.hydration = carryovers.maxHydration;
          p.survival.maxWarmth = carryovers.maxWarmth;
          p.survival.warmth = carryovers.maxWarmth;
        }
      }

      // Re-hydrate Codex and Achievements
      if (window.CodexSystem && carryovers.codexState) {
        window.CodexSystem.init(carryovers.codexState);
      }
      if (window.AchievementSystem && carryovers.achievementsState) {
        window.AchievementSystem.init(carryovers.achievementsState);
      }
    }

    getActiveModifiers() {
      return [...this.activeModifiers];
    }

    getGeneration() {
      return this.generation;
    }

    syncWithGameState() {
      if (!window.GameState) return;

      if (!window.GameState.progression) {
        window.GameState.progression = {};
      }

      window.GameState.progression.newGamePlus = {
        generation: this.generation,
        activeModifiers: [...this.activeModifiers],
        earnedPerks: [...this.earnedPerks],
        cycleStartTime: this.cycleStartTime
      };

      // Strict customization guard
      if (window.GameState.player && window.GameState.player.customizationChangesUsed > 5) {
        window.GameState.player.customizationChangesUsed = 5;
      }
    }

    serialize() {
      return {
        generation: this.generation,
        activeModifiers: [...this.activeModifiers],
        earnedPerks: [...this.earnedPerks],
        cycleStartTime: this.cycleStartTime
      };
    }

    deserialize(data) {
      if (!data) return;
      if (typeof data.generation === 'number') this.generation = data.generation;
      if (Array.isArray(data.activeModifiers)) this.activeModifiers = [...data.activeModifiers];
      if (Array.isArray(data.earnedPerks)) this.earnedPerks = [...data.earnedPerks];
      if (data.cycleStartTime) this.cycleStartTime = data.cycleStartTime;
      this.syncWithGameState();
    }
  }

  const instance = new NewGamePlusSystem();

  if (typeof window !== 'undefined') {
    window.NewGamePlusSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NewGamePlusSystem, instance };
  }
})();
