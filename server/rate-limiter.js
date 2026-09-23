// ============================================================================
// THE WHISPERING WILDS - IN-MEMORY RATE LIMITER (SLIDING WINDOW)
// ============================================================================

class RateLimiter {
    constructor() {
        // Map of clientId -> { [bucket]: [timestamps] }
        this.records = new Map();
        // Periodic cleanup every 60s
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        if (this.cleanupInterval.unref) this.cleanupInterval.unref();
    }

    /**
     * Check if an action is permitted under the rate limit.
     * @param {string} id - Client ID or IP
     * @param {string} bucket - Action type (e.g., 'chat', 'movement', 'action')
     * @param {number} max - Max events allowed in window
     * @param {number} windowMs - Window duration in milliseconds
     * @returns {boolean} True if allowed, false if rate limited
     */
    check(id, bucket, max, windowMs) {
        const now = Date.now();
        if (!this.records.has(id)) {
            this.records.set(id, {});
        }
        const clientData = this.records.get(id);
        if (!clientData[bucket]) {
            clientData[bucket] = [];
        }

        const timestamps = clientData[bucket];
        // Filter out timestamps outside window
        const cutoff = now - windowMs;
        while (timestamps.length > 0 && timestamps[0] < cutoff) {
            timestamps.shift();
        }

        if (timestamps.length >= max) {
            return false;
        }

        timestamps.push(now);
        return true;
    }

    reset(id) {
        this.records.delete(id);
    }

    cleanup() {
        const now = Date.now();
        for (const [id, buckets] of this.records.entries()) {
            let hasActive = false;
            for (const key of Object.keys(buckets)) {
                buckets[key] = buckets[key].filter(t => (now - t) < 60000);
                if (buckets[key].length > 0) hasActive = true;
            }
            if (!hasActive) {
                this.records.delete(id);
            }
        }
    }

    dispose() {
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        this.records.clear();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = new RateLimiter();
}
