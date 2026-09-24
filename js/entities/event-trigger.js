// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EVENT TRIGGER ENTITY
// Spatial zone detection trigger for world events and encounters.
// ============================================================================

(function() {
    class EventTriggerEntity {
        constructor(id, position, radius, onTriggerCallback) {
            this.id = id;
            this.position = position || { x: 0, y: 0, z: 0 };
            this.radius = radius || 8.0;
            this.onTrigger = onTriggerCallback;
            this.triggered = false;
        }

        check(playerPosition) {
            if (this.triggered || !playerPosition) return false;

            const dx = playerPosition.x - this.position.x;
            const dy = (playerPosition.y || 0) - this.position.y;
            const dz = playerPosition.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist <= this.radius) {
                this.triggered = true;
                if (typeof this.onTrigger === 'function') {
                    this.onTrigger(this);
                }
                return true;
            }
            return false;
        }

        reset() {
            this.triggered = false;
        }
    }

    if (typeof window !== 'undefined') {
        window.EventTriggerEntity = EventTriggerEntity;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EventTriggerEntity };
    }
})();
