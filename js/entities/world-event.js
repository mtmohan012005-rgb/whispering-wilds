// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WORLD EVENT ENTITY
// Represents an instantiated world event occurrence with spatial anchors and effects.
// ============================================================================

(function() {
    class WorldEventEntity {
        constructor(definition) {
            this.id = definition.id;
            this.title = definition.title;
            this.tamilTitle = definition.tamilTitle || '';
            this.region = definition.region;
            this.type = definition.type;
            this.durationSeconds = definition.durationSeconds || 180;
            this.timeRemaining = this.durationSeconds;
            this.effects = definition.effects || {};
            this.reward = definition.reward || {};
            this.active = false;
        }

        start() {
            this.active = true;
            this.timeRemaining = this.durationSeconds;
        }

        update(dt) {
            if (!this.active) return false;
            this.timeRemaining -= dt;
            if (this.timeRemaining <= 0) {
                this.active = false;
                return true; // Finished
            }
            return false;
        }

        stop() {
            this.active = false;
        }
    }

    if (typeof window !== 'undefined') {
        window.WorldEventEntity = WorldEventEntity;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { WorldEventEntity };
    }
})();
