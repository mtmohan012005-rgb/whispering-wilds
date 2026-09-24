// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CLOUD CONFLICT ENGINE
// Deterministic 3-way merge and comparison between local and cloud save states.
// ============================================================================

(function() {
    class CloudConflictEngine {
        compare(localData, cloudData) {
            const diff = {
                currency: {
                    local: localData.currency || 0,
                    cloud: cloudData.currency || 0
                },
                chapter: {
                    local: localData.story?.activeChapterIndex || 0,
                    cloud: cloudData.story?.activeChapterIndex || 0
                },
                achievements: {
                    local: (localData.achievements?.unlocked || []).length,
                    cloud: (cloudData.achievements?.unlocked || []).length
                },
                codex: {
                    local: (localData.codex?.unlockedEntries || []).length,
                    cloud: (cloudData.codex?.unlockedEntries || []).length
                },
                customizationChangesUsed: {
                    local: localData.customizationChangesUsed || 0,
                    cloud: cloudData.customizationChangesUsed || 0
                }
            };
            return diff;
        }

        createMergedPayload(localData, cloudData) {
            const merged = { ...cloudData, ...localData };

            // 1. Union Achievements
            const localAch = (localData.achievements && localData.achievements.unlocked) || [];
            const cloudAch = (cloudData.achievements && cloudData.achievements.unlocked) || [];
            const unionAch = Array.from(new Set([...localAch, ...cloudAch]));
            merged.achievements = {
                ...(localData.achievements || {}),
                unlocked: unionAch
            };

            // 2. Union Codex
            const localCodex = (localData.codex && localData.codex.unlockedEntries) || [];
            const cloudCodex = (cloudData.codex && cloudData.codex.unlockedEntries) || [];
            merged.codex = {
                ...(localData.codex || {}),
                unlockedEntries: Array.from(new Set([...localCodex, ...cloudCodex]))
            };

            // 3. Union Discoveries
            const localDisc = (localData.discoveries && localData.discoveries.discoveredPoints) || [];
            const cloudDisc = (cloudData.discoveries && cloudData.discoveries.discoveredPoints) || [];
            merged.discoveries = {
                ...(localData.discoveries || {}),
                discoveredPoints: Array.from(new Set([...localDisc, ...cloudDisc]))
            };

            // 4. Union Secrets
            const localSec = (localData.secrets && localData.secrets.discoveredSecrets) || [];
            const cloudSec = (cloudData.secrets && cloudData.secrets.discoveredSecrets) || [];
            const unionSec = Array.from(new Set([...localSec, ...cloudSec]));
            merged.secrets = {
                discoveredSecrets: unionSec,
                totalDiscovered: unionSec.length
            };

            // 5. Authoritative Max Currency
            merged.currency = Math.max(localData.currency || 0, cloudData.currency || 0);

            // 6. Highest Story Progression
            const localChIdx = localData.story?.activeChapterIndex || 0;
            const cloudChIdx = cloudData.story?.activeChapterIndex || 0;
            merged.story = {
                ...(cloudData.story || {}),
                ...(localData.story || {}),
                activeChapterIndex: Math.max(localChIdx, cloudChIdx),
                storyCompleted: !!(localData.story?.storyCompleted || cloudData.story?.storyCompleted)
            };

            // 7. Strict Permanent Ceiling Guard: customizationChangesUsed <= 5
            const localCust = localData.customizationChangesUsed || 0;
            const cloudCust = cloudData.customizationChangesUsed || 0;
            merged.customizationChangesUsed = Math.min(Math.max(localCust, cloudCust), 5);

            return merged;
        }
    }

    if (typeof window !== 'undefined') {
        window.CloudConflictEngine = new CloudConflictEngine();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CloudConflictEngine };
    }
})();
