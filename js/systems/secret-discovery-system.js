// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SECRET DISCOVERY SYSTEM
// Spatial proximity detection for hidden viewpoints, rooms, and chambers.
// ============================================================================

(function() {
    class SecretDiscoverySystem {
        constructor() {
            this.secrets = [];
            this.discoveredCount = 0;
            this.initialized = false;
        }

        init(savedData = null) {
            const raw = (window.SecretDiscoveryData && window.SecretDiscoveryData.SECRET_DISCOVERIES) ? window.SecretDiscoveryData.SECRET_DISCOVERIES : [];
            this.secrets = JSON.parse(JSON.stringify(raw));

            if (savedData && Array.isArray(savedData.discoveredSecrets)) {
                savedData.discoveredSecrets.forEach(id => {
                    const s = this.secrets.find(item => item.id === id);
                    if (s) s.discovered = true;
                });
            }

            this.discoveredCount = this.secrets.filter(s => s.discovered).length;
            this.initialized = true;
            this.syncWithGameState();
            return this;
        }

        getAllSecrets() {
            return this.secrets;
        }

        getDiscoveredSecrets() {
            return this.secrets.filter(s => s.discovered);
        }

        checkProximity(playerPosition) {
            if (!playerPosition) return null;

            for (const secret of this.secrets) {
                if (secret.discovered) continue;

                const dx = playerPosition.x - secret.coordinates.x;
                const dy = (playerPosition.y || 0) - secret.coordinates.y;
                const dz = playerPosition.z - secret.coordinates.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist <= secret.radius) {
                    return this.discoverSecret(secret.id);
                }
            }
            return null;
        }

        discoverSecret(secretId) {
            const secret = this.secrets.find(s => s.id === secretId);
            if (!secret || secret.discovered) return null;

            secret.discovered = true;
            this.discoveredCount++;

            // Authoritative rewards
            if (window.GameState && typeof window.GameState.addXP === 'function') {
                window.GameState.addXP(secret.xpReward);
            }

            // Codex unlock
            if (secret.codexUnlockId && window.CodexSystem) {
                window.CodexSystem.unlockEntry('world', secret.codexUnlockId);
            }

            // Achievement progress
            if (window.AchievementSystem) {
                window.AchievementSystem.progressAchievement('curious_wanderer', 1);
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`Secret Discovered: ${secret.name} (+${secret.xpReward} XP)`, 'success');
            }

            this.syncWithGameState();

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('secret_discovered', {
                    detail: { secret }
                }));
            }
            return secret;
        }

        syncWithGameState() {
            if (!window.GameState) return;

            // Guard customization ceiling
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            window.GameState.secrets = {
                discoveredSecrets: this.secrets.filter(s => s.discovered).map(s => s.id),
                totalDiscovered: this.discoveredCount
            };
        }

        serialize() {
            return {
                discoveredSecrets: this.secrets.filter(s => s.discovered).map(s => s.id),
                totalDiscovered: this.discoveredCount
            };
        }
    }

    if (typeof window !== 'undefined') {
        window.SecretDiscoverySystem = new SecretDiscoverySystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SecretDiscoverySystem };
    }
})();
