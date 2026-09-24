// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CULTURE DISCOVERY SYSTEM
// Manages authentic Tamil Nadu cultural discoveries, prevents duplicates,
// dispatches codex and achievement milestones, and respects customization ceiling.
// ============================================================================

(function() {
    class CultureDiscoverySystem {
        constructor() {
            this.discoveredItems = new Set();
            this.init();
        }

        init(savedData = null) {
            this.discoveredItems.clear();
            if (savedData && Array.isArray(savedData.discoveredItems)) {
                savedData.discoveredItems.forEach(id => this.discoveredItems.add(id));
            } else {
                this.loadFromGameState();
            }
            return this;
        }

        loadFromGameState() {
            if (!window.GameState || !window.GameState.culture) return;
            const items = window.GameState.culture.discoveredItems || [];
            items.forEach(id => this.discoveredItems.add(id));
        }

        syncToGameState() {
            if (!window.GameState) return;

            // Enforce customization limit
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            if (!window.GameState.culture) {
                window.GameState.culture = {};
            }
            window.GameState.culture.discoveredItems = Array.from(this.discoveredItems);
        }

        isDiscovered(itemId) {
            return this.discoveredItems.has(itemId);
        }

        discoverHeritage(itemId) {
            return this.discoverItem(itemId);
        }

        discoverItem(itemId) {
            if (this.discoveredItems.has(itemId)) {
                return null; // Already discovered
            }

            let entry = null;
            if (window.CULTURE_CODEX_DATA && window.CULTURE_CODEX_DATA.ENTRIES && window.CULTURE_CODEX_DATA.ENTRIES[itemId]) {
                entry = window.CULTURE_CODEX_DATA.ENTRIES[itemId];
            } else if (window.CultureCodexData && typeof window.CultureCodexData.getEntry === 'function') {
                entry = window.CultureCodexData.getEntry(itemId);
            }

            if (!entry) {
                entry = {
                    id: itemId,
                    title: itemId.replace('chet_', '').replace(/_/g, ' ').toUpperCase(),
                    realContext: 'Authentic Tamil Nadu cultural artifact.'
                };
            }

            this.discoveredItems.add(itemId);
            this.syncToGameState();

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`Cultural Heritage Discovered: ${entry.title}`, 'info');
            }

            // Sync with Codex
            if (window.CodexSystem) {
                window.CodexSystem.unlockEntry('culture', `culture_${itemId}`);
            }

            // Sync with Achievements
            if (window.AchievementSystem) {
                window.AchievementSystem.progressAchievement('heritage_discoverer', 1);
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('culture_discovered', { detail: { itemId, entry } }));
            }

            return entry;
        }

        getDiscoveredCount() {
            return this.discoveredItems.size;
        }

        serialize() {
            return {
                discoveredItems: Array.from(this.discoveredItems)
            };
        }

        deserialize(savedData) {
            if (!savedData) return;
            if (Array.isArray(savedData.discoveredItems)) {
                savedData.discoveredItems.forEach(id => this.discoveredItems.add(id));
            }
            this.syncToGameState();
        }
    }

    const instance = new CultureDiscoverySystem();

    if (typeof window !== 'undefined') {
        window.CultureDiscoverySystem = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})();
