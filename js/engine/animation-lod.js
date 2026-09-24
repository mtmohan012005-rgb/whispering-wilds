// ============================================================================
// THE WHISPERING WILDS - ANIMATION LOD SYSTEM
// ============================================================================

(function() {
    class AnimationLOD {
        static getTier(distanceToPlayer) {
            if (distanceToPlayer < 25.0) return 'NEAR';
            if (distanceToPlayer < 65.0) return 'MEDIUM';
            return 'FAR';
        }

        static getUpdateInterval(distanceToPlayer) {
            const tier = this.getTier(distanceToPlayer);
            if (tier === 'NEAR') return 0; // every frame (60Hz)
            if (tier === 'MEDIUM') return 0.066; // ~15Hz
            return 0.5; // ~2Hz schedule simulation only
        }

        static shouldUpdate(elapsedSinceLastUpdate, distanceToPlayer) {
            const minInterval = this.getUpdateInterval(distanceToPlayer);
            return elapsedSinceLastUpdate >= minInterval;
        }
    }

    window.AnimationLOD = AnimationLOD;
})();
