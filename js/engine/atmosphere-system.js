// ============================================================================
// THE WHISPERING WILDS - ATMOSPHERIC PARTICLES SYSTEM
// ============================================================================

(function() {
    class AtmosphereSystem {
        constructor(scene) {
            this.scene = scene;
            this.particleSystem = null;
            this.count = 200;
            this.initParticles();
        }

        initParticles() {
            if (!this.scene) return;

            const geo = new THREE.BufferGeometry();
            const posArray = new Float32Array(this.count * 3);

            for (let i = 0; i < this.count * 3; i += 3) {
                posArray[i] = (Math.random() - 0.5) * 80;
                posArray[i + 1] = Math.random() * 20;
                posArray[i + 2] = (Math.random() - 0.5) * 80;
            }

            geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

            const mat = new THREE.PointsMaterial({
                color: 0xdddddd,
                size: 0.15,
                transparent: true,
                opacity: 0.45
            });

            this.particleSystem = new THREE.Points(geo, mat);
            this.scene.add(this.particleSystem);
        }

        update(deltaTime, playerPos = null) {
            if (!this.particleSystem) return;

            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= deltaTime * 0.8;
                if (positions[i] < 0) {
                    positions[i] = 20;
                }
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;

            if (playerPos) {
                this.particleSystem.position.set(playerPos.x, 0, playerPos.z);
            }
        }
    }

    window.AtmosphereSystem = AtmosphereSystem;
})();
