// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CLOUD PROFILE CONTROLLER
// Synchronizes player profile, cosmetic titles, and exploration stats.
// ============================================================================

(function() {
    class CloudProfile {
        constructor() {
            this.profile = null;
            this.lastSynced = null;
        }

        async fetchProfile() {
            if (!window.CloudSaveClient) return null;
            const res = await window.CloudSaveClient.getProfile();
            if (res.ok && res.data.profile) {
                this.profile = res.data.profile;
                this.lastSynced = new Date();
                return this.profile;
            }
            return null;
        }

        async updateProfile(updates) {
            if (!window.CloudSaveClient) return { success: false };

            // Ensure customizationChangesUsed ceiling is guarded
            if (updates.customization_changes_used !== undefined) {
                updates.customization_changes_used = Math.min(updates.customization_changes_used, 5);
            }

            const res = await window.CloudSaveClient.updateProfile(updates);
            if (res.ok && res.data.profile) {
                this.profile = res.data.profile;
                this.lastSynced = new Date();
                return { success: true, profile: this.profile };
            }
            return { success: false, errors: res.data?.errors || [res.error || 'Update failed'] };
        }

        gatherStatsFromGameState() {
            const stats = {
                playtime_seconds: 0,
                discoveries_count: 0,
                codex_entries_count: 0,
                achievements_count: 0,
                customization_changes_used: 0
            };

            if (window.GameState) {
                stats.playtime_seconds = window.GameState.playTime || 0;
                stats.customization_changes_used = Math.min(window.GameState.customizationChangesUsed || 0, 5);
            }

            if (window.AchievementSystem) {
                stats.achievements_count = window.AchievementSystem.getUnlockedCount();
                stats.active_title = window.AchievementSystem.getActiveTitle();
            }

            if (window.CodexSystem) {
                stats.codex_entries_count = window.CodexSystem.getUnlockedCount();
            }

            if (window.DiscoveryProgression) {
                stats.discoveries_count = window.DiscoveryProgression.getTotalDiscoveredPoints();
            }

            return stats;
        }

        async syncStats() {
            const stats = this.gatherStatsFromGameState();
            return this.updateProfile(stats);
        }
    }

    if (typeof window !== 'undefined') {
        window.CloudProfile = new CloudProfile();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CloudProfile };
    }
})();
