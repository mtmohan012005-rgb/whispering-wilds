// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REPLAY & PLAYTHROUGH SUMMARY SYSTEM
// Post-campaign free-roaming mode, chapter scenario replay, comprehensive
// timeline recording, and statistical playthrough recaps.
// ============================================================================

(function () {
  'use strict';

  class ReplaySystem {
    constructor() {
      this.freeRoamEnabled = false;
      this.replayedChapters = new Set();
      this.currentPlaythrough = null;
      this.playthroughHistory = [];
      this.initialized = false;
    }

    init(savedData = null) {
      if (savedData) {
        if (savedData.freeRoamEnabled) this.freeRoamEnabled = true;
        if (Array.isArray(savedData.replayedChapters)) {
          savedData.replayedChapters.forEach(id => this.replayedChapters.add(id));
        }
        if (savedData.currentPlaythrough) {
          this.currentPlaythrough = { ...savedData.currentPlaythrough };
        }
        if (Array.isArray(savedData.playthroughHistory)) {
          this.playthroughHistory = [...savedData.playthroughHistory];
        }
      } else if (window.GameState?.story?.storyCompleted) {
        this.freeRoamEnabled = true;
      }

      if (!this.currentPlaythrough) {
        this._startNewPlaythroughTracking();
      }

      this.initialized = true;
      this.syncWithGameState();

      if (window.SystemRegistry) {
        window.SystemRegistry.register('ReplaySystem', this, {
          version: '2.0.0',
          dependencies: ['GameState']
        });
      }

      return this;
    }

    _startNewPlaythroughTracking() {
      const template = window.ReplayData?.PLAYTHROUGH_STATS_TEMPLATE || {};
      this.currentPlaythrough = {
        ...template,
        playthroughId: 'playthrough_' + Date.now(),
        startTime: Date.now(),
        branchChoices: {},
        evidenceCollected: []
      };
    }

    enableFreeRoam() {
      this.freeRoamEnabled = true;
      if (window.NotificationSystem) {
        window.NotificationSystem.show(
          'Free-Roam Mode Activated: All regions accessible without story restrictions.',
          'success'
        );
      }
      this.syncWithGameState();
    }

    replayChapter(chapterId) {
      const isCompleted = this.freeRoamEnabled || !!window.GameState?.story?.storyCompleted;
      if (!isCompleted) {
        if (window.NotificationSystem) {
          window.NotificationSystem.show('Finish the main story campaign to unlock chapter replay mode.', 'warning');
        }
        return false;
      }

      const scenario = window.ReplayData?.getScenario?.(chapterId) ||
                       window.ReplayData?.CHAPTER_REPLAY_SCENARIOS?.find(s => s.chapterId === chapterId || s.id === chapterId);

      if (scenario) {
        this.replayedChapters.add(scenario.chapterId);

        // Position player at scenario start if World/Player is active
        const player = window.gamePlayer || window.testRef?.player || window.GameState?.player;
        if (player && scenario.startingCoords) {
          player.x = scenario.startingCoords.x;
          player.y = scenario.startingCoords.y;
          if (player.position) {
            player.position.x = scenario.startingCoords.x;
            player.position.y = scenario.startingCoords.y;
            player.position.z = scenario.startingCoords.z || 0;
          }
        }

        // Set time of day if lighting exists
        if (window.testRef?.lighting && scenario.recommendedTime !== undefined) {
          window.testRef.lighting.timeOfDay = scenario.recommendedTime;
        }

        if (window.NotificationSystem) {
          window.NotificationSystem.show(`Replaying Chapter: ${scenario.title}. Permanent codex and inventory are preserved.`, 'info');
        }

        this.syncWithGameState();
        return true;
      }

      // Fallback check against StoryContentSystem
      if (window.StoryContentSystem) {
        const ch = window.StoryContentSystem.getChapters().find(c => c.id === chapterId);
        if (ch) {
          this.replayedChapters.add(chapterId);
          if (window.NotificationSystem) {
            window.NotificationSystem.show(`Replaying Chapter: ${ch.title}.`, 'info');
          }
          this.syncWithGameState();
          return true;
        }
      }

      return false;
    }

    generatePlaythroughSummary() {
      const branchSystem = window.StoryBranchSystem;
      const endingSystem = window.EndingSystem;

      const summary = {
        playthroughId: this.currentPlaythrough?.playthroughId || 'playthrough_final',
        startTime: this.currentPlaythrough?.startTime || (Date.now() - 3600000),
        endTime: Date.now(),
        totalPlaytimeMinutes: Math.round(((Date.now() - (this.currentPlaythrough?.startTime || Date.now())) / 60000)),
        ending: endingSystem?.getCurrentEnding() || null,
        branchChoices: branchSystem ? { ...branchSystem.choices } : {},
        factionStandings: branchSystem ? { ...branchSystem.factionAffinity } : {},
        npcRelationships: branchSystem ? { ...branchSystem.npcAffinity } : {},
        evidenceCollected: window.StoryContentSystem ? Array.from(window.StoryContentSystem.collectedEvidence) : [],
        milestonesAchieved: branchSystem ? Array.from(branchSystem.flags).filter(f => f.startsWith('milestone_')) : [],
        customizationChangesUsed: window.GameState?.player?.customizationChangesUsed ?? 0,
        freeRoamEnabled: this.freeRoamEnabled,
        replayedChaptersCount: this.replayedChapters.size
      };

      return summary;
    }

    recordCompletion(ending) {
      const summary = this.generatePlaythroughSummary();
      summary.ending = ending;
      this.playthroughHistory.push(summary);
      this.enableFreeRoam();
      this.syncWithGameState();
      return summary;
    }

    getSummary() {
      return {
        freeRoamEnabled: this.freeRoamEnabled,
        replayedChapters: Array.from(this.replayedChapters),
        playthroughHistoryCount: this.playthroughHistory.length
      };
    }

    syncWithGameState() {
      if (!window.GameState) return;

      // Strict customization guard: 5 permanent changes maximum
      if (window.GameState.player && window.GameState.player.customizationChangesUsed > 5) {
        window.GameState.player.customizationChangesUsed = 5;
      }

      window.GameState.replay = {
        freeRoamEnabled: this.freeRoamEnabled,
        replayedChapters: Array.from(this.replayedChapters),
        playthroughHistory: [...this.playthroughHistory]
      };
    }

    serialize() {
      return {
        freeRoamEnabled: this.freeRoamEnabled,
        replayedChapters: Array.from(this.replayedChapters),
        currentPlaythrough: this.currentPlaythrough ? { ...this.currentPlaythrough } : null,
        playthroughHistory: [...this.playthroughHistory]
      };
    }

    deserialize(data) {
      if (!data) return;
      if (data.freeRoamEnabled) this.freeRoamEnabled = true;
      if (Array.isArray(data.replayedChapters)) {
        this.replayedChapters = new Set(data.replayedChapters);
      }
      if (data.currentPlaythrough) this.currentPlaythrough = { ...data.currentPlaythrough };
      if (Array.isArray(data.playthroughHistory)) this.playthroughHistory = [...data.playthroughHistory];
      this.syncWithGameState();
    }
  }

  const instance = new ReplaySystem();

  if (typeof window !== 'undefined') {
    window.ReplaySystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReplaySystem, instance };
  }
})();
