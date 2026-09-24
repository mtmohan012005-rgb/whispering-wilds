// ============================================================================
// THE WHISPERING WILDS - ACTIVITY POINT ENTITY
// ============================================================================

(function() {
    class ActivityPoint {
        constructor(config = {}) {
            this.id = config.id || `act_${Date.now()}`;
            this.region = config.region || 'GEORGE_TOWN';
            this.position = config.position || { x: 0, y: 0, z: 0 };
            this.radius = config.radius || 3.0;
            this.activityType = config.activityType || 'tea_counter';
            this.allowedOccupations = config.allowedOccupations || [];
            this.schedule = config.schedule || { startHour: 6, endHour: 22 };

            this.occupiedBy = null;
            this.queue = [];
            this.maxQueue = config.maxQueue || 3;
        }

        isAvailable(currentHour = 12) {
            if (this.occupiedBy !== null) return false;
            if (this.schedule) {
                if (currentHour < this.schedule.startHour || currentHour >= this.schedule.endHour) {
                    return false;
                }
            }
            return true;
        }

        assign(agentId) {
            if (this.occupiedBy === null) {
                this.occupiedBy = agentId;
                return true;
            }
            return false;
        }

        release(agentId) {
            if (this.occupiedBy === agentId) {
                this.occupiedBy = null;
                // Auto promote next from queue
                if (this.queue.length > 0) {
                    this.occupiedBy = this.queue.shift();
                }
                return true;
            }
            return false;
        }

        enqueue(agentId) {
            if (this.queue.length < this.maxQueue && !this.queue.includes(agentId)) {
                this.queue.push(agentId);
                return this.queue.length; // queue position
            }
            return -1;
        }

        removeFromQueue(agentId) {
            const idx = this.queue.indexOf(agentId);
            if (idx !== -1) {
                this.queue.splice(idx, 1);
            }
        }
    }

    window.ActivityPoint = ActivityPoint;
})();
