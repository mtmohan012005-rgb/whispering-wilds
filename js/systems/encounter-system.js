// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENCOUNTER SYSTEM
// Spatial proximity detection, choice prompt routing, and non-combat resolution.
// ============================================================================

(function() {
    class EncounterSystem {
        constructor() {
            this.encounters = [];
            this.resolvedCount = 0;
        }

        init(savedData = null) {
            const raw = (window.EncounterData && window.EncounterData.ENCOUNTERS) ? window.EncounterData.ENCOUNTERS : [];
            this.encounters = JSON.parse(JSON.stringify(raw));

            if (savedData && Array.isArray(savedData.resolvedEncounters)) {
                savedData.resolvedEncounters.forEach(id => {
                    const enc = this.encounters.find(e => e.id === id);
                    if (enc) enc.resolved = true;
                });
            }

            this.resolvedCount = this.encounters.filter(e => e.resolved).length;
            return this;
        }

        checkProximity(playerPos, radius = 10.0) {
            if (!playerPos) return null;

            for (const enc of this.encounters) {
                if (enc.resolved) continue;

                const dx = playerPos.x - enc.coordinates.x;
                const dy = (playerPos.y || 0) - enc.coordinates.y;
                const dz = playerPos.z - enc.coordinates.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist <= radius) {
                    if (window.EncounterUI) {
                        window.EncounterUI.prompt(enc);
                    }
                    return enc;
                }
            }
            return null;
        }

        resolveEncounter(encounterId, choiceId) {
            const enc = this.encounters.find(e => e.id === encounterId);
            if (!enc || enc.resolved) return false;

            const choice = enc.choices.find(c => c.id === choiceId);
            if (!choice) return false;

            enc.resolved = true;
            this.resolvedCount++;

            // Authoritative rewards
            if (choice.reward) {
                if (window.GameState) {
                    if (choice.reward.currency && typeof window.GameState.addCurrency === 'function') {
                        window.GameState.addCurrency(choice.reward.currency);
                    }
                    if (choice.reward.xp && typeof window.GameState.addXP === 'function') {
                        window.GameState.addXP(choice.reward.xp);
                    }
                }
                if (choice.reward.codexUnlock && window.CodexSystem) {
                    window.CodexSystem.unlockEntry('culture', choice.reward.codexUnlock);
                }
            }

            // Achievement progress
            if (window.AchievementSystem) {
                window.AchievementSystem.progressAchievement('curious_wanderer', 1);
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`Encounter Resolved: ${enc.title}`, 'success');
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('encounter_resolved', { detail: { encounter: enc, choice } }));
            }
            return true;
        }
    }

    if (typeof window !== 'undefined') {
        window.EncounterSystem = new EncounterSystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EncounterSystem };
    }
})();
