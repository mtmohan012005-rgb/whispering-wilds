// ============================================================================
// THE WHISPERING WILDS - AMBIENT ACTIVITY SYSTEM (ENVIRONMENTAL PROPS)
// ============================================================================

(function() {
    class AmbientActivitySystem {
        constructor(scene) {
            this.scene = scene;
            this.tarps = [];
            this.lamps = [];
            this.time = 0;
        }

        registerTarp(mesh) {
            if (mesh) this.tarps.push(mesh);
        }

        registerLamp(mesh, light = null) {
            if (mesh) this.lamps.push({ mesh, light, baseIntensity: light ? light.intensity : 1.0 });
        }

        update(deltaTime, windSpeed = 1.0) {
            this.time += deltaTime;

            // Subtle cloth/tarp flutter
            for (const tarp of this.tarps) {
                tarp.rotation.z = Math.sin(this.time * 2.5 * windSpeed) * 0.04;
                tarp.rotation.x = Math.cos(this.time * 1.8 * windSpeed) * 0.03;
            }

            // Subtle temple lamp flicker
            for (const item of this.lamps) {
                const flicker = 0.85 + Math.sin(this.time * 8.0) * 0.1 + Math.sin(this.time * 19.0) * 0.05;
                if (item.light) {
                    item.light.intensity = item.baseIntensity * flicker;
                }
            }
        }
    }

    window.AmbientActivitySystem = AmbientActivitySystem;
})();
