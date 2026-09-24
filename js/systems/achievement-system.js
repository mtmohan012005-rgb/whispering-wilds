// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUTHORITATIVE ACHIEVEMENT SYSTEM
// Manages achievement progress, one-time reward granting, and cosmetic titles.
// Preserves strict permanent customization limit <= 5.
// ============================================================================

(function() {
    class AchievementSystem {
        constructor() {
            this.categories = [];
            this.achievements = [];
            this.achievementsMap = new Map();
            this.unlockedTitles = new Set(['Explorer', 'Wanderer of Tamil Nadu']);
            this.activeTitle = 'Wanderer of Tamil Nadu';
            this.progressMap = {};

            this.init();
        }

        init(savedData = null) {
            const rawCats = (window.ACHIEVEMENT_DATA && window.ACHIEVEMENT_DATA.CATEGORIES) 
                ? Object.values(window.ACHIEVEMENT_DATA.CATEGORIES) 
                : ['EXPLORATION', 'OBSERVATION', 'CULTURE', 'LANDMARKS', 'STORY', 'PHOTOGRAPHY', 'PUZZLES', 'CRAFTING', 'SURVIVAL'];
            this.categories = rawCats;

            const list = (window.ACHIEVEMENT_DATA && window.ACHIEVEMENT_DATA.LIST) ? window.ACHIEVEMENT_DATA.LIST : [];
            this.achievements = JSON.parse(JSON.stringify(list));
            this.achievementsMap.clear();

            for (const ach of this.achievements) {
                ach.completed = false;
                ach.completedAt = null;
                ach.rewardClaimed = false;
                this.achievementsMap.set(ach.id, ach);
            }

            if (savedData) {
                this.deserialize(savedData);
            } else {
                this.loadFromGameState();
            }
            return this;
        }

        loadFromGameState() {
            if (!window.GameState) return;

            if (!window.GameState.achievements) {
                window.GameState.achievements = {
                    completed: {},
                    unlockedAt: {},
                    rewardsClaimed: {},
                    unlocked: [],
                    titles: ['Explorer', 'Wanderer of Tamil Nadu'],
                    activeTitle: 'Wanderer of Tamil Nadu'
                };
            }

            const state = window.GameState.achievements;
            for (const [id, ach] of this.achievementsMap) {
                if ((state.completed && state.completed[id]) || (Array.isArray(state.unlocked) && state.unlocked.includes(id))) {
                    ach.completed = true;
                    ach.completedAt = (state.unlockedAt && state.unlockedAt[id]) || Date.now();
                    ach.rewardClaimed = !!(state.rewardsClaimed && state.rewardsClaimed[id]);
                }
            }

            if (Array.isArray(state.titles)) {
                state.titles.forEach(t => this.unlockedTitles.add(t));
            }
            if (state.activeTitle) {
                this.activeTitle = state.activeTitle;
            }
        }

        syncToGameState() {
            if (!window.GameState) return;

            // Enforce customization limit
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            const completed = {};
            const unlockedAt = {};
            const rewardsClaimed = {};
            const unlockedList = [];

            for (const [id, ach] of this.achievementsMap) {
                if (ach.completed) {
                    completed[id] = true;
                    unlockedAt[id] = ach.completedAt;
                    rewardsClaimed[id] = ach.rewardClaimed;
                    unlockedList.push(id);
                }
            }

            window.GameState.achievements = {
                completed,
                unlockedAt,
                rewardsClaimed,
                unlocked: unlockedList,
                titles: Array.from(this.unlockedTitles),
                activeTitle: this.activeTitle,
                progress: { ...this.progressMap }
            };
        }

        isUnlocked(achievementId) {
            const ach = this.achievementsMap.get(achievementId);
            return ach ? ach.completed : false;
        }

        getUnlockedCount() {
            let count = 0;
            for (const ach of this.achievementsMap.values()) {
                if (ach.completed) count++;
            }
            return count;
        }

        unlock(achievementId) {
            return this.unlockAchievement(achievementId);
        }

        unlockAchievement(achievementId) {
            const ach = this.achievementsMap.get(achievementId);
            if (!ach) {
                // If not found in map, search in array
                const inArr = this.achievements.find(a => a.id === achievementId);
                if (inArr) {
                    this.achievementsMap.set(achievementId, inArr);
                    return this.unlockAchievement(achievementId);
                }
                return false;
            }

            if (ach.completed) {
                return false; // Already unlocked — prevent duplicate grants
            }

            ach.completed = true;
            ach.completedAt = Date.now();

            this.grantReward(ach);
            this.syncToGameState();

            // Display non-intrusive toast notification
            if (window.NotificationSystem) {
                const titleStr = ach.tamilTitle ? `${ach.title} (${ach.tamilTitle})` : ach.title;
                window.NotificationSystem.show(`Achievement Unlocked: ${titleStr}`, 'success');
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('achievement_unlocked', { detail: { achievement: ach } }));
            }

            return true;
        }

        progressAchievement(categoryOrId, amount = 1) {
            if (!this.progressMap[categoryOrId]) this.progressMap[categoryOrId] = 0;
            this.progressMap[categoryOrId] += amount;

            // Check if any achievement with this category or id is now fulfilled
            for (const ach of this.achievementsMap.values()) {
                if (ach.completed) continue;
                const req = ach.requirement;
                if (!req) continue;

                if (ach.id === categoryOrId || ach.category === categoryOrId || req.type === categoryOrId) {
                    if (this.progressMap[categoryOrId] >= (req.count || 1)) {
                        this.unlockAchievement(ach.id);
                    }
                }
            }
            this.syncToGameState();
        }

        grantReward(ach) {
            if (ach.rewardClaimed) return;
            ach.rewardClaimed = true;

            const reward = ach.reward;
            if (!reward) return;

            // 1. Authoritative Currency grant
            if (reward.currency || (reward.type === 'currency' && reward.value)) {
                const amount = reward.currency || reward.value;
                if (window.GameState && typeof window.GameState.addCurrency === 'function') {
                    window.GameState.addCurrency(amount);
                } else if (window.gameSurvival) {
                    window.gameSurvival.currency = (window.gameSurvival.currency || 0) + amount;
                }
            }

            // 2. Cosmetic Title grant
            if (reward.title) {
                this.unlockedTitles.add(reward.title);
            }

            // STRICT CONSTRAINT: NEVER alter or increment customization changes used!
            if (window.GameState) {
                if (window.GameState.customizationChangesUsed > 5) {
                    window.GameState.customizationChangesUsed = 5;
                }
            }
        }

        getAvailableTitles() {
            return Array.from(this.unlockedTitles);
        }

        getActiveTitle() {
            return this.activeTitle;
        }

        setActiveTitle(title) {
            this.unlockedTitles.add(title);
            this.activeTitle = title;
            this.syncToGameState();
            return true;
        }

        serialize() {
            const unlocked = [];
            for (const [id, ach] of this.achievementsMap) {
                if (ach.completed) unlocked.push(id);
            }
            return {
                unlocked,
                titles: Array.from(this.unlockedTitles),
                activeTitle: this.activeTitle,
                progress: { ...this.progressMap }
            };
        }

        deserialize(savedData) {
            if (!savedData) return;
            if (Array.isArray(savedData.unlocked)) {
                savedData.unlocked.forEach(id => {
                    const ach = this.achievementsMap.get(id);
                    if (ach) {
                        ach.completed = true;
                        ach.completedAt = Date.now();
                        ach.rewardClaimed = true;
                    }
                });
            }
            if (Array.isArray(savedData.titles)) {
                savedData.titles.forEach(t => this.unlockedTitles.add(t));
            }
            if (savedData.activeTitle) {
                this.activeTitle = savedData.activeTitle;
            }
            if (savedData.progress) {
                this.progressMap = { ...savedData.progress };
            }
            this.syncToGameState();
        }
    }

    const instance = new AchievementSystem();

    if (typeof window !== 'undefined') {
        window.AchievementSystem = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})();
