// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - COLLECTIBLE SYSTEM
// Manages field notes, craft patterns, archival documents, and regional maps.
// ============================================================================

(function() {
    class CollectibleSystem {
        constructor() {
            this.collectibles = [];
            this.foundCount = 0;
            this.initialized = false;
        }

        init(savedData = null) {
            const raw = (window.CollectibleData && window.CollectibleData.COLLECTIBLES) ? window.CollectibleData.COLLECTIBLES : [];
            this.collectibles = JSON.parse(JSON.stringify(raw));

            if (savedData && Array.isArray(savedData.foundCollectibles)) {
                savedData.foundCollectibles.forEach(id => {
                    const c = this.collectibles.find(item => item.id === id);
                    if (c) c.found = true;
                });
            }

            this.foundCount = this.collectibles.filter(c => c.found).length;
            this.initialized = true;
            this.syncWithGameState();
            return this;
        }

        getAllCollectibles() {
            return this.collectibles;
        }

        getFoundCollectibles() {
            return this.collectibles.filter(c => c.found);
        }

        collectItem(collectibleId) {
            const item = this.collectibles.find(c => c.id === collectibleId);
            if (!item || item.found) return false;

            item.found = true;
            this.foundCount++;

            // Authoritative rewards
            if (window.GameState && typeof window.GameState.addXP === 'function') {
                window.GameState.addXP(75);
            }

            // Cross-unlock in codex
            if (window.CodexSystem) {
                const section = (item.category === 'craft_pattern') ? 'craft' : 'story';
                window.CodexSystem.unlockEntry(section, item.id);
            }

            // Achievement progress
            if (window.AchievementSystem) {
                window.AchievementSystem.progressAchievement('heritage_discoverer', 1);
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`Collectible Found: ${item.name}`, 'info');
            }

            this.syncWithGameState();

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('collectible_found', {
                    detail: { item }
                }));
            }
            return true;
        }

        checkProximity(playerPos, radius = 5.0) {
            if (!playerPos) return null;

            for (const item of this.collectibles) {
                if (item.found) continue;

                const dx = playerPos.x - item.coordinates.x;
                const dy = (playerPos.y || 0) - item.coordinates.y;
                const dz = playerPos.z - item.coordinates.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist <= radius) {
                    this.collectItem(item.id);
                    return item;
                }
            }
            return null;
        }

        syncWithGameState() {
            if (!window.GameState) return;

            // Guard customization ceiling
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            window.GameState.collectibles = {
                foundCollectibles: this.collectibles.filter(c => c.found).map(c => c.id),
                totalFound: this.foundCount
            };
        }

        serialize() {
            return {
                foundCollectibles: this.collectibles.filter(c => c.found).map(c => c.id),
                totalFound: this.foundCount
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.CollectibleSystem = new CollectibleSystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CollectibleSystem };
    }
})();
