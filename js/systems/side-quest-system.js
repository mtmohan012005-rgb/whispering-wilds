// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SIDE QUEST SYSTEM
// Regional authored quest progression, multi-step objective tracking,
// authoritative reward distribution, and codex cross-unlocks.
// ============================================================================

(function() {
    class SideQuestSystem {
        constructor() {
            this.quests = [];
            this.activeQuestId = null;
            this.initialized = false;
        }

        init(savedData = null) {
            const raw = (window.SideQuestData && window.SideQuestData.SIDE_QUESTS) ? window.SideQuestData.SIDE_QUESTS : [];
            this.quests = JSON.parse(JSON.stringify(raw));

            if (savedData) {
                if (Array.isArray(savedData.completedQuests)) {
                    savedData.completedQuests.forEach(id => {
                        const q = this.quests.find(item => item.id === id);
                        if (q) {
                            q.completed = true;
                            q.steps.forEach(s => s.done = true);
                        }
                    });
                }
                if (savedData.activeQuestId) {
                    this.activeQuestId = savedData.activeQuestId;
                }
                if (savedData.questProgress && typeof savedData.questProgress === 'object') {
                    for (const qId in savedData.questProgress) {
                        const q = this.quests.find(item => item.id === qId);
                        if (q && Array.isArray(savedData.questProgress[qId])) {
                            savedData.questProgress[qId].forEach((done, idx) => {
                                if (q.steps[idx]) q.steps[idx].done = done;
                            });
                        }
                    }
                }
            }

            this.initialized = true;
            this.syncWithGameState();
            return this;
        }

        getAllQuests() {
            return this.quests;
        }

        getQuest(id) {
            return this.quests.find(q => q.id === id) || null;
        }

        setActiveQuest(id) {
            if (this.quests.some(q => q.id === id)) {
                this.activeQuestId = id;
                this.syncWithGameState();
                return true;
            }
            return false;
        }

        completeStep(questId, stepIndex) {
            const q = this.getQuest(questId);
            if (!q || q.completed) return false;
            if (!q.steps[stepIndex] || q.steps[stepIndex].done) return false;

            q.steps[stepIndex].done = true;

            const allDone = q.steps.every(s => s.done);
            if (allDone) {
                this.completeQuest(questId);
            } else {
                this.syncWithGameState();
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('side_quest_step_completed', {
                    detail: { questId, stepIndex }
                }));
            }
            return true;
        }

        completeQuest(questId) {
            const q = this.getQuest(questId);
            if (!q || q.completed) return false;

            q.completed = true;
            q.steps.forEach(s => s.done = true);

            // Authoritative rewards
            if (window.GameState) {
                if (q.rewards.currency && typeof window.GameState.addCurrency === 'function') {
                    window.GameState.addCurrency(q.rewards.currency);
                }
                if (q.rewards.xp && typeof window.GameState.addXP === 'function') {
                    window.GameState.addXP(q.rewards.xp);
                }
            }

            // Codex cross-unlock
            if (q.rewards.codexId && window.CodexSystem) {
                window.CodexSystem.unlockEntry('culture', q.rewards.codexId);
            }

            // Achievement progress
            if (q.rewards.achievementProgress && window.AchievementSystem) {
                window.AchievementSystem.progressAchievement(
                    q.rewards.achievementProgress.category,
                    q.rewards.achievementProgress.amount
                );
            }

            if (this.activeQuestId === questId) {
                this.activeQuestId = null;
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`Side Quest Completed: ${q.title} (+${q.rewards.currency} Coins, +${q.rewards.xp} XP)`, 'success');
            }

            this.syncWithGameState();

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('side_quest_completed', {
                    detail: { questId: q.id }
                }));
            }
            return true;
        }

        syncWithGameState() {
            if (!window.GameState) return;

            // Guard customization ceiling
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            const questProgress = {};
            this.quests.forEach(q => {
                questProgress[q.id] = q.steps.map(s => s.done);
            });

            window.GameState.sideQuests = {
                activeQuestId: this.activeQuestId,
                completedQuests: this.quests.filter(q => q.completed).map(q => q.id),
                questProgress: questProgress
            };
        }

        serialize() {
            const questProgress = {};
            this.quests.forEach(q => {
                questProgress[q.id] = q.steps.map(s => s.done);
            });

            return {
                activeQuestId: this.activeQuestId,
                completedQuests: this.quests.filter(q => q.completed).map(q => q.id),
                questProgress: questProgress
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.SideQuestSystem = new SideQuestSystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SideQuestSystem };
    }
})();
