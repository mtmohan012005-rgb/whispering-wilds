// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WORLD EVENT SYSTEM
// Manages life cycle, physical world mutations, durations, and rewards.
// ============================================================================

(function() {
    class WorldEventSystem {
        constructor() {
            this.activeEvents = new Map(); // eventId -> { event, timeRemaining, timerId }
            this.cooldowns = new Map(); // eventId -> timestampWhenAvailable
        }

        init() {
            return this;
        }

        getActiveEvents() {
            return Array.from(this.activeEvents.values()).map(v => v.event);
        }

        isEventActive(eventId) {
            return this.activeEvents.has(eventId);
        }

        isOnCooldown(eventId) {
            const until = this.cooldowns.get(eventId);
            if (!until) return false;
            return Date.now() < until;
        }

        triggerEvent(eventId) {
            if (this.isEventActive(eventId) || this.isOnCooldown(eventId)) {
                return false;
            }

            const eventData = (window.WorldEventData && window.WorldEventData.getEventById) 
                ? window.WorldEventData.getEventById(eventId) 
                : null;
            if (!eventData) return false;

            const durationSec = eventData.durationSeconds || 180;
            const entry = {
                event: eventData,
                timeRemaining: durationSec,
                startedAt: Date.now()
            };

            this.activeEvents.set(eventId, entry);

            // Apply physical world effects
            this.applyWorldEffects(eventData.effects);

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`World Event Started: ${eventData.title} (${eventData.tamilTitle || ''})`, 'info');
            }

            if (window.WorldEventUI) {
                window.WorldEventUI.showEventBanner(eventData);
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('world_event_started', { detail: { event: eventData } }));
            }
            return true;
        }

        resolveEvent(eventId, completedSuccessfully = true) {
            const entry = this.activeEvents.get(eventId);
            if (!entry) return false;

            const eventData = entry.event;
            this.activeEvents.delete(eventId);

            // Set cooldown
            const cooldownMs = (eventData.cooldownSeconds || 600) * 1000;
            this.cooldowns.set(eventId, Date.now() + cooldownMs);

            // Revert effects
            this.revertWorldEffects(eventData.effects);

            if (completedSuccessfully && eventData.reward) {
                if (window.GameState) {
                    if (eventData.reward.currency && typeof window.GameState.addCurrency === 'function') {
                        window.GameState.addCurrency(eventData.reward.currency);
                    }
                    if (eventData.reward.xp && typeof window.GameState.addXP === 'function') {
                        window.GameState.addXP(eventData.reward.xp);
                    }
                }
                if (eventData.reward.codexUnlock && window.CodexSystem) {
                    window.CodexSystem.unlockEntry('culture', eventData.reward.codexUnlock);
                }
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('world_event_ended', { detail: { event: eventData, completedSuccessfully } }));
            }
            return true;
        }

        applyWorldEffects(effects) {
            if (!effects) return;
            // E.g. modify scene fog or water level if 3D scene active
            if (effects.fogDensity && window.scene && window.scene.fog) {
                window.scene.fog.density = effects.fogDensity;
            }
        }

        revertWorldEffects(effects) {
            if (!effects) return;
            if (effects.fogDensity && window.scene && window.scene.fog) {
                window.scene.fog.density = 0.002;
            }
        }

        update(deltaTimeSec) {
            for (const [eventId, entry] of this.activeEvents.entries()) {
                entry.timeRemaining -= deltaTimeSec;
                if (entry.timeRemaining <= 0) {
                    this.resolveEvent(eventId, true);
                }
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.WorldEventSystem = new WorldEventSystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { WorldEventSystem };
    }
})();
