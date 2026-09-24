// ============================================================================
// THE WHISPERING WILDS - WATER RENDERER & SURFACE WAVE SYSTEM
// ============================================================================

(function() {
    class WaterRenderer {
        constructor(scene) {
            this.scene = scene;
            this.waterPlanes = [];
            this.time = 0;
        }

        createWaterPlane(width, length, waterType = 'RIVER', position = { x: 0, y: -0.2, z: 0 }) {
            const geo = new THREE.PlaneGeometry(width, length, 16, 16);
            geo.rotateX(-Math.PI / 2);

            let color = 0x1b4965; // ocean/river blue
            let roughness = 0.12;

            if (waterType === 'MANGROVE') {
                color = 0x1c3b2b; // brackish mangrove green
                roughness = 0.25;
            } else if (waterType === 'CANAL') {
                color = 0x244234;
                roughness = 0.20;
            }

            const mat = new THREE.MeshStandardMaterial({
                color,
                roughness,
                metalness: 0.15,
                transparent: true,
                opacity: 0.88
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(position.x, position.y, position.z);
            mesh.receiveShadow = true;

            if (this.scene) {
                this.scene.add(mesh);
            }

            const waterObj = { mesh, geo, waterType, basePos: { ...position } };
            this.waterPlanes.push(waterObj);
            return waterObj;
        }

        update(deltaTime) {
            this.time += deltaTime;

            // Subtle vertical wave ripple
            for (const item of this.waterPlanes) {
                item.mesh.position.y = item.basePos.y + Math.sin(this.time * 1.5 + item.basePos.x * 0.1) * 0.04;
            }
        }

        clear() {
            for (const item of this.waterPlanes) {
                if (this.scene && item.mesh) {
                    this.scene.remove(item.mesh);
                }
            }
            this.waterPlanes = [];
        }
    }

    window.WaterRenderer = WaterRenderer;
})();
