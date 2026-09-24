// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY CONTENT SYSTEM
// Authoritative 7-chapter narrative management, evidence discovery,
// regional progression unlocking, and post-game free-roam transition.
// ============================================================================

(function() {
    class StoryContentSystem {
        constructor() {
            this.chapters = [];
            this.activeChapterIndex = 0;
            this.storyCompleted = false;
            this.collectedEvidence = new Set();
            this.unlockedRegions = new Set(['george_town']);
            this.initialized = false;
        }

        init(savedData = null) {
            const rawChapters = (window.MainStoryData && window.MainStoryData.MAIN_STORY_CHAPTERS) 
                ? window.MainStoryData.MAIN_STORY_CHAPTERS 
                : (window.MAIN_STORY_DATA || []);
            this.chapters = JSON.parse(JSON.stringify(rawChapters));

            if (savedData) {
                if (Array.isArray(savedData.completedChapters)) {
                    savedData.completedChapters.forEach(chId => {
                        const ch = this.chapters.find(c => c.id === chId);
                        if (ch) {
                            ch.completed = true;
                            if (ch.unlockedRegion) this.unlockedRegions.add(ch.unlockedRegion);
                        }
                    });
                }
                if (typeof savedData.activeChapterIndex === 'number') {
                    this.activeChapterIndex = Math.min(Math.max(0, savedData.activeChapterIndex), this.chapters.length - 1);
                }
                if (Array.isArray(savedData.collectedEvidence)) {
                    savedData.collectedEvidence.forEach(ev => this.collectedEvidence.add(ev));
                }
                if (Array.isArray(savedData.unlockedRegions)) {
                    savedData.unlockedRegions.forEach(r => this.unlockedRegions.add(r));
                }
                if (savedData.storyCompleted) {
                    this.storyCompleted = true;
                }
            }

            this.initialized = true;
            this.syncWithGameState();
            return this;
        }

        getCurrentChapter() {
            if (this.chapters.length === 0) return null;
            return this.chapters[this.activeChapterIndex] || null;
        }

        getChapters() {
            return this.chapters;
        }

        completeObjective(chapterId, objectiveId) {
            const ch = this.chapters.find(c => c.id === chapterId);
            if (!ch) return false;

            const obj = ch.objectives.find(o => o.id === objectiveId);
            if (obj) {
                obj.done = true;
            }

            // Check if all mandatory objectives in chapter are done
            const allDone = ch.objectives.every(o => o.done);
            if (allDone && !ch.completed) {
                this.completeChapter(ch.id);
            } else {
                this.syncWithGameState();
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('story_objective_completed', {
                    detail: { chapterId, objectiveId }
                }));
            }
            return true;
        }

        completeChapter(chapterId) {
            const ch = this.chapters.find(c => c.id === chapterId);
            if (!ch || ch.completed) return false;

            ch.completed = true;

            // Collect evidence if any
            if (ch.primaryEvidence) {
                this.collectedEvidence.add(ch.primaryEvidence);
                if (window.CodexSystem) {
                    window.CodexSystem.unlockEntry('story', ch.primaryEvidence);
                }
            }

            // Unlock next region
            if (ch.unlockedRegion) {
                this.unlockedRegions.add(ch.unlockedRegion);
                if (window.NotificationSystem) {
                    window.NotificationSystem.show(`New Region Unlocked: ${ch.unlockedRegion.replace('_', ' ').toUpperCase()}`, 'info');
                }
            }

            // Reward player via authoritative GameState
            if (window.GameState) {
                if (typeof window.GameState.addCurrency === 'function') {
                    window.GameState.addCurrency(200);
                }
                if (typeof window.GameState.addXP === 'function') {
                    window.GameState.addXP(350);
                }
            }

            // Advance chapter index
            if (this.activeChapterIndex < this.chapters.length - 1) {
                this.activeChapterIndex++;
            } else {
                // Final Chapter 7 complete -> post-game free roam
                this.storyCompleted = true;
                if (window.NotificationSystem) {
                    window.NotificationSystem.show('Main Narrative Concluded: The Whispering Wilds Sanctuary is open for Free Exploration!', 'success');
                }
                if (window.AchievementSystem) {
                    window.AchievementSystem.progressAchievement('story_campaign_finish', 1);
                }
            }

            // Achievement progress
            if (window.AchievementSystem) {
                window.AchievementSystem.progressAchievement('story_seeker', 1);
            }

            this.syncWithGameState();

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('story_chapter_completed', {
                    detail: { chapterId: ch.id, storyCompleted: this.storyCompleted }
                }));
            }
            return true;
        }

        isRegionUnlocked(regionId) {
            return this.unlockedRegions.has(regionId) || this.storyCompleted;
        }

        hasEvidence(evidenceId) {
            return this.collectedEvidence.has(evidenceId);
        }

        syncWithGameState() {
            if (!window.GameState) return;

            // Guard customization ceiling
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            window.GameState.story = {
                activeChapterIndex: this.activeChapterIndex,
                storyCompleted: this.storyCompleted,
                completedChapters: this.chapters.filter(c => c.completed).map(c => c.id),
                collectedEvidence: Array.from(this.collectedEvidence),
                unlockedRegions: Array.from(this.unlockedRegions)
            };
        }

        serialize() {
            return {
                activeChapterIndex: this.activeChapterIndex,
                storyCompleted: this.storyCompleted,
                completedChapters: this.chapters.filter(c => c.completed).map(c => c.id),
                collectedEvidence: Array.from(this.collectedEvidence),
                unlockedRegions: Array.from(this.unlockedRegions)
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.StoryContentSystem = new StoryContentSystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { StoryContentSystem };
    }
})();
