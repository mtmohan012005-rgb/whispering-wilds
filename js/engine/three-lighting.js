/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Lighting & Shadows System
 * Nocturnal directional moonlight with PCF soft shadows, ambient bounce, and dynamic thunderstorm flashes
 */

class ThreeLighting {
    constructor(scene) {
        this.scene = scene;

        // 1. Ambient & Directional Lighting (Atmospheric nocturnal storm ambience)
        this.ambientLight = new THREE.AmbientLight(0x606c7e, 0.95);
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0x4a6b8c, 0x1a202c, 0.55);
        this.scene.add(this.hemiLight);

        // 2. Directional Moonlight / Storm Light (Shadow Caster)
        this.moonLight = new THREE.DirectionalLight(0x99ccff, 1.35);
        this.moonLight.position.set(20, 60, 30);
        this.moonLight.castShadow = true;

        // Shadow frustum setup (wide coverage around player)
        this.moonLight.shadow.mapSize.width = 2048;
        this.moonLight.shadow.mapSize.height = 2048;
        this.moonLight.shadow.camera.near = 10;
        this.moonLight.shadow.camera.far = 380;
        const d = 95;
        this.moonLight.shadow.camera.left = -d;
        this.moonLight.shadow.camera.right = d;
        this.moonLight.shadow.camera.top = d;
        this.moonLight.shadow.camera.bottom = -d;
        this.moonLight.shadow.bias = -0.0006;
        this.moonLight.shadow.normalBias = 0.04;

        this.scene.add(this.moonLight);
        this.scene.add(this.moonLight.target);

        // 3. Lightning Flash Light
        this.lightningLight = new THREE.DirectionalLight(0xe0f0ff, 0);
        this.lightningLight.position.set(0, 180, 0);
        this.scene.add(this.lightningLight);

        this.flashIntensity = 0;
        this.currentTimePhase = 'night';
        this.timePresets = {
            morning:   { sunCol: 0xffd194, sunInt: 1.4, ambCol: 0x88a0b0, ambInt: 0.95, hemiSky: 0xffd8a8, hemiGround: 0x3e2723 },
            day:       { sunCol: 0xfff8e7, sunInt: 1.6, ambCol: 0xb8c5cc, ambInt: 1.05, hemiSky: 0x90caf9, hemiGround: 0x4e342e },
            afternoon: { sunCol: 0xffb74d, sunInt: 1.5, ambCol: 0x9cb0bc, ambInt: 0.95, hemiSky: 0xffcc80, hemiGround: 0x3e2723 },
            sunset:    { sunCol: 0xff7043, sunInt: 1.3, ambCol: 0x6e7ec8, ambInt: 0.75, hemiSky: 0xf4511e, hemiGround: 0x1a237e },
            night:     { sunCol: 0x99ccff, sunInt: 1.15, ambCol: 0x556075, ambInt: 0.85, hemiSky: 0x3d5373, hemiGround: 0x151b26 },
            rain:      { sunCol: 0x74bbf6, sunInt: 0.95, ambCol: 0x4a5b66, ambInt: 0.8, hemiSky: 0x556a74, hemiGround: 0x1c2b33 },
            mist:      { sunCol: 0xa0b4be, sunInt: 0.85, ambCol: 0x647e8a, ambInt: 0.9, hemiSky: 0x88a0ac, hemiGround: 0x323e44 }
        };
    }

    setTimePhase(phase) {
        if (!this.timePresets[phase]) return;
        this.currentTimePhase = phase;
        const p = this.timePresets[phase];
        this.moonLight.color.setHex(p.sunCol);
        this.moonLight.intensity = p.sunInt;
        this.ambientLight.color.setHex(p.ambCol);
        this.ambientLight.intensity = p.ambInt;
        this.hemiLight.color.setHex(p.hemiSky);
        this.hemiLight.groundColor.setHex(p.hemiGround);
    }

    triggerLightning(intensity = 1.0) {
        this.flashIntensity = intensity * 3.5;
        this.lightningLight.intensity = this.flashIntensity;
    }

    update(playerPos, deltaTime) {
        // Track the moon shadow camera with player movement
        if (playerPos) {
            this.moonLight.position.set(
                playerPos.x - 60,
                playerPos.y + 140,
                playerPos.z + 70
            );
            this.moonLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
            this.moonLight.target.updateMatrixWorld();
        }

        // Lightning decay
        if (this.flashIntensity > 0) {
            this.flashIntensity -= deltaTime * 5.0;
            if (this.flashIntensity < 0) this.flashIntensity = 0;
            this.lightningLight.intensity = this.flashIntensity;
        }
    }

    setShadowQuality(quality, distance) {
        if (!this.moonLight) return;

        if (quality === 'off') {
            this.moonLight.castShadow = false;
            return;
        }

        this.moonLight.castShadow = true;
        const sizeMap = { low: 1024, medium: 2048, high: 2048, ultra: 4096 };
        const sz = sizeMap[quality] || 2048;
        this.moonLight.shadow.mapSize.width = sz;
        this.moonLight.shadow.mapSize.height = sz;

        if (distance && this.moonLight.shadow && this.moonLight.shadow.camera) {
            const d = Math.max(30, Math.min(220, distance));
            this.moonLight.shadow.camera.left = -d;
            this.moonLight.shadow.camera.right = d;
            this.moonLight.shadow.camera.top = d;
            this.moonLight.shadow.camera.bottom = -d;
            this.moonLight.shadow.camera.updateProjectionMatrix();
        }
    }
}

window.ThreeLighting = ThreeLighting;

