// ============================================================================
// THE WHISPERING WILDS - NETWORK TRANSFORM INTERPOLATION BUFFER
// ============================================================================

class NetworkInterpolator {
    constructor(interpolationDelayMs = 100) {
        this.delayMs = interpolationDelayMs;
        this.snapshots = []; // [{ timestamp, x, y, z, rotY, anim }]
        this.maxSnapshots = 20;
    }

    pushSnapshot(x, y, z, rotY, anim, timestamp = Date.now()) {
        this.snapshots.push({ timestamp, x, y, z, rotY, anim });
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }

    /**
     * Interpolate transform at current time with delay buffer.
     * @param {number} renderTimeMs - Date.now() or game timestamp
     */
    interpolate(renderTimeMs = Date.now()) {
        if (this.snapshots.length === 0) return null;
        if (this.snapshots.length === 1) {
            const s = this.snapshots[0];
            return { x: s.x, y: s.y, z: s.z, rotY: s.rotY, anim: s.anim };
        }

        const targetTime = renderTimeMs - this.delayMs;

        // If target time is earlier than our oldest snapshot, use oldest
        if (targetTime <= this.snapshots[0].timestamp) {
            const s = this.snapshots[0];
            return { x: s.x, y: s.y, z: s.z, rotY: s.rotY, anim: s.anim };
        }

        // If target time is newer than newest snapshot, extrapolate gently or use newest
        const newest = this.snapshots[this.snapshots.length - 1];
        if (targetTime >= newest.timestamp) {
            return { x: newest.x, y: newest.y, z: newest.z, rotY: newest.rotY, anim: newest.anim };
        }

        // Find surrounding snapshots
        let prev = this.snapshots[0];
        let next = this.snapshots[1];
        for (let i = 0; i < this.snapshots.length - 1; i++) {
            if (this.snapshots[i].timestamp <= targetTime && targetTime <= this.snapshots[i + 1].timestamp) {
                prev = this.snapshots[i];
                next = this.snapshots[i + 1];
                break;
            }
        }

        const span = next.timestamp - prev.timestamp;
        const alpha = span > 0 ? (targetTime - prev.timestamp) / span : 0;
        const clampedAlpha = Math.max(0, Math.min(1, alpha));

        // Linear position interp
        const x = prev.x + (next.x - prev.x) * clampedAlpha;
        const y = prev.y + (next.y - prev.y) * clampedAlpha;
        const z = prev.z + (next.z - prev.z) * clampedAlpha;

        // Angular rotation interp with shortest-path wrap
        let diff = next.rotY - prev.rotY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const rotY = prev.rotY + diff * clampedAlpha;

        return {
            x,
            y,
            z,
            rotY,
            anim: next.anim || prev.anim
        };
    }

    clear() {
        this.snapshots = [];
    }
}

if (typeof window !== 'undefined') {
    window.NetworkInterpolator = NetworkInterpolator;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkInterpolator;
}
