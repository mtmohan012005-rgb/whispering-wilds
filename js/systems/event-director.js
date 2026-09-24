// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EVENT DIRECTOR
// Deterministic ambient orchestration driven by WorldRNG, evaluating conditions,
// cooldowns, and non-repetition rules.
// ============================================================================

(function() {
    class EventDirector {
        constructor() {
            this.evaluationIntervalMs = 30000; // Check every 30 seconds
            this.timerId = null;
            this.lastTriggeredEventId = null;
            this.seed = 1337;
        }

        init(seed = 1337) {
            this.seed = seed;
            return this;
        }

        start() {
            if (this.timerId) return;
            this.timerId = setInterval(() => {
                this.evaluateAndTrigger();
            }, this.evaluationIntervalMs);
        }

        stop() {
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        }

        pseudoRandom() {
            this.seed = (this.seed * 9301 + 49297) % 233280;
            return this.seed / 233280;
        }

        evaluateAndTrigger() {
            if (!window.WorldEventData || !window.WorldEventSystem || !window.EventConditionSystem) return;

            const context = window.EventConditionSystem.getCurrentContext();
            const events = window.WorldEventData.getEventsByRegion(context.region);

            // Filter eligible events: matches conditions, not active, not on cooldown, not same as last
            const candidates = events.filter(e => {
                if (window.WorldEventSystem.isEventActive(e.id)) return false;
                if (window.WorldEventSystem.isOnCooldown(e.id)) return false;
                if (e.id === this.lastTriggeredEventId && events.length > 1) return false;
                return window.EventConditionSystem.checkEventConditions(e, context);
            });

            if (candidates.length === 0) return;

            // Pick candidate deterministically
            const roll = this.pseudoRandom();
            const index = Math.floor(roll * candidates.length);
            const chosen = candidates[index];

            if (chosen) {
                const triggered = window.WorldEventSystem.triggerEvent(chosen.id);
                if (triggered) {
                    this.lastTriggeredEventId = chosen.id;
                }
            }
        }

        update(deltaTimeSec) {
            if (window.WorldEventSystem) {
                window.WorldEventSystem.update(deltaTimeSec);
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.EventDirector = new EventDirector();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EventDirector };
    }
})();
