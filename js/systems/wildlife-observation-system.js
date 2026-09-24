// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WILDLIFE OBSERVATION SYSTEM
// Validates genuine spatial observation, distance bounds, and dwell times.
// Preserves living wildlife AI and prevents long-distance menu exploits.
// ============================================================================

(function() {
    class WildlifeObservationSystem {
        constructor() {
            this.activeTargets = new Map(); // targetId -> { timeObserved, speciesId, position }
            this.observedSpecies = new Map(); // speciesId -> { timesObserved, firstObservedAt }

            this.init();
        }

        init() {
            this.loadFromGameState();
            return this;
        }

        loadFromGameState() {
            if (!window.GameState) return;
            if (!window.GameState.world) return;

            const list = window.GameState.world.discoveredWildlife || [];
            list.forEach(spId => {
                this.observedSpecies.set(spId, { timesObserved: 1, firstObservedAt: Date.now() });
            });
        }

        syncToGameState() {
            if (!window.GameState || !window.GameState.world) return;
            window.GameState.world.discoveredWildlife = Array.from(this.observedSpecies.keys());
        }

        recordObservation(speciesId, distance = 15.0, duration = 6.0, hasPhoto = true) {
            let config = null;
            if (window.WILDLIFE_CODEX_DATA && window.WILDLIFE_CODEX_DATA[speciesId]) {
                config = window.WILDLIFE_CODEX_DATA[speciesId];
            } else if (window.WildlifeCodexData && typeof window.WildlifeCodexData.getSpecies === 'function') {
                config = window.WildlifeCodexData.getSpecies(speciesId);
            }

            const minD = config?.observationRequirements?.minDistance || 4.0;
            const maxD = config?.observationRequirements?.maxDistance || 35.0;
            const reqDur = config?.observationRequirements?.dwellDurationSeconds || 5.0;

            const withinBounds = distance >= minD && distance <= maxD;
            const durationMet = duration >= reqDur;
            const photoMet = !config?.observationRequirements?.photoRequired || hasPhoto;

            if (withinBounds && durationMet && photoMet) {
                this.confirmObservation(speciesId, config || { displayName: speciesId }, hasPhoto);
                return { completed: true, speciesId };
            }
            return { completed: false, speciesId };
        }

        update(deltaTime, playerPosition, activeWildlifeList = []) {
            if (!playerPosition || !Array.isArray(activeWildlifeList)) return;

            const currentVisibleIds = new Set();

            for (const animal of activeWildlifeList) {
                if (!animal || !animal.position || !animal.speciesId) continue;
                const config = window.WILDLIFE_CODEX_DATA?.[animal.speciesId] || (window.WildlifeCodexData?.getSpecies(animal.speciesId));
                if (!config) continue;

                const dist = Math.hypot(animal.position.x - playerPosition.x, animal.position.z - (playerPosition.z || playerPosition.y || 0));
                const req = config.observationRequirements || { minDistance: 5, maxDistance: 30, dwellDurationSeconds: 5 };

                // Validate spatial observation bounds
                if (dist >= req.minDistance && dist <= req.maxDistance) {
                    const trackingId = animal.id || `${animal.speciesId}_${animal.position.x}_${animal.position.z}`;
                    currentVisibleIds.add(trackingId);

                    let record = this.activeTargets.get(trackingId);
                    if (!record) {
                        record = { timeObserved: 0, speciesId: animal.speciesId, animalRef: animal };
                        this.activeTargets.set(trackingId, record);
                    }

                    record.timeObserved += deltaTime;

                    // Check if observation dwell duration is satisfied
                    if (record.timeObserved >= req.dwellDurationSeconds) {
                        this.confirmObservation(animal.speciesId, config, false);
                    }
                }
            }

            // Cleanup targets no longer in active observation zone
            for (const id of this.activeTargets.keys()) {
                if (!currentVisibleIds.has(id)) {
                    this.activeTargets.delete(id);
                }
            }
        }

        confirmObservation(speciesId, config, hasPhoto = false) {
            let spRecord = this.observedSpecies.get(speciesId);
            const isFirst = !spRecord;

            if (isFirst) {
                spRecord = { timesObserved: 1, firstObservedAt: Date.now() };
                this.observedSpecies.set(speciesId, spRecord);
                this.syncToGameState();

                // Sync with Codex
                if (window.CodexSystem) {
                    window.CodexSystem.unlockEntry('wildlife', `wildlife_${speciesId}`);
                }

                // Trigger achievement events
                if (window.AchievementSystem) {
                    window.AchievementSystem.progressAchievement('wildlife_watcher', 1);
                }

                if (window.NotificationSystem) {
                    window.NotificationSystem.show(`Wildlife Observed: ${config.displayName || speciesId}`, 'info');
                }

                console.log(`[WildlifeObservation] ✓ First observation recorded: ${config.displayName || speciesId}`);
            } else {
                spRecord.timesObserved++;
            }

            return true;
        }

        onPhotoAccepted(detectedSubject) {
            if (!detectedSubject || !detectedSubject.data) return;
            const speciesId = detectedSubject.data.id;
            const config = window.WILDLIFE_CODEX_DATA?.[speciesId] || (window.WildlifeCodexData?.getSpecies(speciesId));
            if (config) {
                this.confirmObservation(speciesId, config, true);
                if (window.AchievementSystem) {
                    window.AchievementSystem.progressAchievement('field_observer', 1);
                }
            }
        }
    }

    const instance = new WildlifeObservationSystem();

    if (typeof window !== 'undefined') {
        window.WildlifeObservationSystem = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})();
