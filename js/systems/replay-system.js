// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REPLAY & FREE-ROAM SYSTEM
// Post-campaign free-roaming mode, chapter scenario replay, and exploration stats.
// ============================================================================

(function() {
    class ReplaySystem {
        constructor() {
            this.freeRoamEnabled = false;
            this.replayedChapters = new Set();
        }

        init(savedData = null) {
            if (savedData) {
                if (savedData.freeRoamEnabled) this.freeRoamEnabled = true;
                if (Array.isArray(savedData.replayedChapters)) {
                    savedData.replayedChapters.forEach(id => this.replayedChapters.add(id));
                }
            } else if (window.GameState && window.GameState.story && window.GameState.story.storyCompleted) {
                this.freeRoamEnabled = true;
            }
            return this;
        }

        enableFreeRoam() {
            this.freeRoamEnabled = true;
            if (window.NotificationSystem) {
                window.NotificationSystem.show('Free-Roam Mode Activated: All regions accessible without story restrictions.', 'success');
            }
            this.syncWithGameState();
        }

        replayChapter(chapterId) {
            if (!this.freeRoamEnabled && (!window.GameState || !window.GameState.story || !window.GameState.story.storyCompleted)) {
                if (window.NotificationSystem) {
                    window.NotificationSystem.show('Finish the main story campaign to unlock chapter replay mode.', 'warning');
                }
                return false;
            }

            if (window.StoryContentSystem) {
                const ch = window.StoryContentSystem.getChapters().find(c => c.id === chapterId);
                if (ch) {
                    // Mark as replayed
                    this.replayedChapters.add(chapterId);
                    if (window.NotificationSystem) {
                        window.NotificationSystem.show(`Replaying Chapter: ${ch.title}. Permanent codex and inventory are preserved.`, 'info');
                    }
                    this.syncWithGameState();
                    return true;
                }
            }
            return false;
        }

        getSummary() {
            return {
                freeRoamEnabled: this.freeRoamEnabled,
                replayedChapters: Array.from(this.replayedChapters)
            };
        }

        syncWithGameState() {
            if (!window.GameState) return;

            // Guard customization ceiling
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            window.GameState.replay = {
                freeRoamEnabled: this.freeRoamEnabled,
                replayedChapters: Array.from(this.replayedChapters)
            };
        }

        serialize() {
            return {
                freeRoamEnabled: this.freeRoamEnabled,
                replayedChapters: Array.from(this.replayedChapters)
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.ReplaySystem = new ReplaySystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ReplaySystem };
    }
})();
