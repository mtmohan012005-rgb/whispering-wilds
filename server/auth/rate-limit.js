// ============================================================================
// THE WHISPERING WILDS - AUTH RATE LIMITER
// ============================================================================

class AuthRateLimiter {
    constructor() {
        this.buckets = new Map();
        // Clean expired buckets every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    getKey(type, id) {
        return `${type}:${id}`;
    }

    check(type, id, max = 5, windowMs = 15 * 60 * 1000) {
        const key = this.getKey(type, id);
        const now = Date.now();
        let record = this.buckets.get(key);

        if (!record || now - record.startTime > windowMs) {
            record = { count: 1, startTime: now };
            this.buckets.set(key, record);
            return { allowed: true, remaining: max - 1 };
        }

        if (record.count >= max) {
            return { allowed: false, remaining: 0 };
        }

        record.count++;
        return { allowed: true, remaining: max - record.count };
    }

    reset(type, id) {
        this.buckets.delete(this.getKey(type, id));
    }

    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.buckets.entries()) {
            if (now - record.startTime > 30 * 60 * 1000) {
                this.buckets.delete(key);
            }
        }
    }
}

const rateLimiter = new AuthRateLimiter();
module.exports = rateLimiter;
