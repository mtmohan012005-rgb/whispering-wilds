// ============================================================================
// THE WHISPERING WILDS - SURFACE WETNESS & PUDDLE SYSTEM
// ============================================================================

(function() {
    class SurfaceSystem {
        constructor() {
            this.wetness = 0.0; // 0.0 to 1.0
            this.puddles = [];
        }

        update(deltaTime, weather = 'clear') {
            const isRaining = weather === 'rain' || weather === 'heavy_rain' || weather === 'storm';

            if (isRaining) {
                this.wetness = Math.min(1.0, this.wetness + deltaTime * 0.15); // accumulate wetness
            } else {
                this.wetness = Math.max(0.0, this.wetness - deltaTime * 0.04); // dry gradually
            }

            // Update puddles opacity
            for (const p of this.puddles) {
                if (p.material) {
                    p.material.opacity = this.wetness * 0.7;
                    p.visible = this.wetness > 0.05;
                }
            }
        }

        registerPuddle(mesh) {
            if (mesh) this.puddles.push(mesh);
        }

        getWetness() {
            return this.wetness;
        }
    }

    window.SurfaceSystem = new SurfaceSystem();
})();
