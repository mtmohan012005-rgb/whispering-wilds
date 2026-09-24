// ============================================================================
// THE WHISPERING WILDS - ENVIRONMENT LIGHTING SYSTEM
// ============================================================================

(function() {
    class EnvironmentLighting {
        constructor(scene) {
            this.scene = scene;
            this.sunLight = null;
            this.ambientLight = null;
            this.initLights();
        }

        initLights() {
            if (!this.scene) return;

            // Ambient / Hemispheric light
            this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.65);
            this.scene.add(this.ambientLight);

            // Primary Sun Directional Light with Shadows
            this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
            this.sunLight.castShadow = true;
            this.sunLight.shadow.mapSize.width = 2048;
            this.sunLight.shadow.mapSize.height = 2048;
            this.sunLight.shadow.camera.near = 0.5;
            this.sunLight.shadow.camera.far = 250;
            this.sunLight.shadow.camera.left = -60;
            this.sunLight.shadow.camera.right = 60;
            this.sunLight.shadow.camera.top = 60;
            this.sunLight.shadow.camera.bottom = -60;
            this.sunLight.shadow.bias = -0.0005;

            this.scene.add(this.sunLight);
        }

        update(worldTime = 12.0, region = 'GEORGE_TOWN', playerPos = null) {
            if (!this.sunLight || !this.ambientLight) return;

            const regProfile = window.VISUAL_QUALITY_DATA?.REGIONS?.[region] || window.VISUAL_QUALITY_DATA?.REGIONS?.GEORGE_TOWN;

            // Sun trajectory based on 24h clock:
            // 6:00 is sunrise (angle 0), 12:00 is noon (angle PI/2), 18:00 is sunset (angle PI)
            const sunAngle = ((worldTime - 6.0) / 12.0) * Math.PI;
            const isDay = worldTime >= 5.5 && worldTime <= 18.5;

            if (isDay) {
                const height = Math.sin(sunAngle);
                const forward = Math.cos(sunAngle);

                this.sunLight.position.set(forward * 80, Math.max(10, height * 120), 40);
                this.sunLight.intensity = Math.max(0.2, height * 1.5);
                this.sunLight.color.setHex(regProfile.sunColor || 0xfff5e6);

                this.ambientLight.intensity = 0.55 + height * 0.25;
                this.ambientLight.color.setHex(regProfile.ambientColor || 0x6e8075);
            } else {
                // Night Moon Lighting
                this.sunLight.position.set(30, 70, -40);
                this.sunLight.intensity = 0.2; // soft moonlight
                this.sunLight.color.setHex(0xaaccff);

                this.ambientLight.intensity = 0.25;
                this.ambientLight.color.setHex(0x1a2233);
            }

            // Keep shadow camera focused around player position
            if (playerPos) {
                this.sunLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
                this.sunLight.target.updateMatrixWorld();
            }
        }
    }

    window.EnvironmentLighting = EnvironmentLighting;
})();
