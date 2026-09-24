// ============================================================================
// THE WHISPERING WILDS - SKY DOME & ATMOSPHERE SYSTEM
// ============================================================================

(function() {
    class SkySystem {
        constructor(scene) {
            this.scene = scene;
            this.skyMesh = null;
            this.initSky();
        }

        initSky() {
            if (!this.scene) return;

            const skyGeo = new THREE.SphereGeometry(450, 24, 24);
            const skyMat = new THREE.MeshBasicMaterial({
                color: 0x87ceeb,
                side: THREE.BackSide
            });

            this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
            this.scene.add(this.skyMesh);
        }

        update(worldTime = 12.0, playerPos = null) {
            if (!this.skyMesh) return;

            // Interpolate sky colors based on world hour
            let skyColor = 0x87ceeb; // midday blue
            if (worldTime >= 5.0 && worldTime < 7.0) {
                skyColor = 0xfcb077; // dawn golden orange
            } else if (worldTime >= 7.0 && worldTime < 16.5) {
                skyColor = 0x8ecae6; // midday clear
            } else if (worldTime >= 16.5 && worldTime < 19.0) {
                skyColor = 0xf28e2b; // sunset amber
            } else if (worldTime >= 19.0 && worldTime < 21.0) {
                skyColor = 0x2b3a55; // dusk indigo
            } else {
                skyColor = 0x0a0e17; // night deep navy
            }

            this.skyMesh.material.color.setHex(skyColor);

            if (playerPos) {
                this.skyMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
            }
        }
    }

    window.SkySystem = SkySystem;
})();
