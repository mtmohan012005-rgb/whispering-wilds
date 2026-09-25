// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENDING SYSTEM
// Evaluates player choices, alliances, quest consequences, and exploration
// milestones to resolve the final campaign conclusion.
//
// Rules strictly enforced:
// - Never invent missing ending content (evaluates exclusively from authored endings)
// - Never expose hidden/secret ending content in the gallery until unlocked
// - Customization ceiling strictly preserved (changesUsed <= 5)
// ============================================================================

(function () {
  'use strict';

  class EndingSystem {
    constructor() {
      this.currentEnding = null;
      this.unlockedEndings = new Set();
      this.endingTimestamp = null;
      this.initialized = false;
    }

    init(savedData = null) {
      if (savedData) {
        if (savedData.currentEnding) {
          this.currentEnding = savedData.currentEnding;
        }
        if (Array.isArray(savedData.unlockedEndings)) {
          this.unlockedEndings = new Set(savedData.unlockedEndings);
        }
        if (savedData.endingTimestamp) {
          this.endingTimestamp = savedData.endingTimestamp;
        }
      }

      this.initialized = true;
      this.syncWithGameState();

      if (window.SystemRegistry) {
        window.SystemRegistry.register('EndingSystem', this, {
          version: '1.0.0',
          dependencies: ['GameState', 'StoryBranchSystem']
        });
      }

      return this;
    }

    evaluateEnding() {
      const endingData = window.EndingData;
      if (!endingData) {
        throw new Error('[EndingSystem] EndingData module is not loaded.');
      }

      const branchSystem = window.StoryBranchSystem;
      const metrics = branchSystem
        ? branchSystem.getStorySummaryMetrics()
        : {
            factionAffinity: { heritage_council: 30, archaeological_society: 30, local_resistance: 30 },
            npcAffinity: { murugan: 20, velu: 20, selvam: 15, sundaram: 15, mani: 15 },
            npcTrustAverage: 20,
            evidenceCount: 0,
            milestonesCompletedCount: 0,
            selectedDestiny: 'sanctuary_living_trust',
            flags: []
          };

      return endingData.evaluateEnding(metrics);
    }

    triggerEnding(overrideEndingId = null) {
      let resolvedEnding = null;

      if (overrideEndingId) {
        resolvedEnding = window.EndingData?.getEnding(overrideEndingId);
      }

      if (!resolvedEnding) {
        resolvedEnding = this.evaluateEnding();
      }

      if (!resolvedEnding) {
        throw new Error('[EndingSystem] Unable to resolve valid ending. Check EndingData integrity.');
      }

      this.currentEnding = resolvedEnding;
      this.unlockedEndings.add(resolvedEnding.id);
      this.endingTimestamp = Date.now();

      // Mark main story as completed in StoryContentSystem & GameState
      if (window.StoryContentSystem) {
        window.StoryContentSystem.storyCompleted = true;
      }
      if (window.ReplaySystem) {
        window.ReplaySystem.enableFreeRoam();
      }

      // Grant ending title/trophy in AchievementSystem if present
      if (window.AchievementSystem && resolvedEnding.rewards?.title) {
        window.AchievementSystem.unlockTitle?.(resolvedEnding.rewards.title);
      }

      this.syncWithGameState();

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ending_triggered', {
          detail: {
            ending: resolvedEnding,
            unlockedEndings: Array.from(this.unlockedEndings)
          }
        }));
      }

      // Automatically display Ending UI if available
      if (window.EndingUI && typeof window.EndingUI.showEndingScreen === 'function') {
        window.EndingUI.showEndingScreen(resolvedEnding);
      }

      return resolvedEnding;
    }

    getCurrentEnding() {
      return this.currentEnding;
    }

    isEndingUnlocked(endingId) {
      return this.unlockedEndings.has(endingId);
    }

    getEndingGallery() {
      const endingData = window.EndingData;
      if (!endingData) return [];

      // Masks secret ending unless player has legitimately unlocked it
      return endingData.getAllEndings(false, Array.from(this.unlockedEndings));
    }

    syncWithGameState() {
      if (!window.GameState) return;

      if (!window.GameState.progression) {
        window.GameState.progression = {};
      }

      window.GameState.progression.ending = {
        currentEndingId: this.currentEnding ? this.currentEnding.id : null,
        unlockedEndings: Array.from(this.unlockedEndings),
        endingTimestamp: this.endingTimestamp
      };

      if (!window.GameState.story) {
        window.GameState.story = {};
      }
      if (this.currentEnding) {
        window.GameState.story.storyCompleted = true;
      }

      // Strict enforcement of 5-change customization ceiling
      if (window.GameState.player && window.GameState.player.customizationChangesUsed > 5) {
        window.GameState.player.customizationChangesUsed = 5;
      }
    }

    serialize() {
      return {
        currentEnding: this.currentEnding ? { id: this.currentEnding.id, code: this.currentEnding.code } : null,
        unlockedEndings: Array.from(this.unlockedEndings),
        endingTimestamp: this.endingTimestamp
      };
    }

    deserialize(data) {
      if (!data) return;
      if (data.currentEnding && window.EndingData) {
        this.currentEnding = window.EndingData.getEnding(data.currentEnding.id);
      }
      if (Array.isArray(data.unlockedEndings)) {
        this.unlockedEndings = new Set(data.unlockedEndings);
      }
      if (data.endingTimestamp) {
        this.endingTimestamp = data.endingTimestamp;
      }
      this.syncWithGameState();
    }
  }

  const instance = new EndingSystem();

  if (typeof window !== 'undefined') {
    window.EndingSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EndingSystem, instance };
  }
})();
