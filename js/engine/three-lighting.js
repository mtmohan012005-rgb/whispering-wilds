/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Lighting & Shadows System
 * Nocturnal directional moonlight with PCF soft shadows, ambient bounce, and dynamic thunderstorm flashes
 */

class ThreeLighting {
    constructor(scene) {
        this.scene = scene;

        // 1. Ambient & Directional Lighting (Simulating Storm / Night from user boilerplate)
        this.ambientLight = new THREE.AmbientLight(0x404050, 0.7);
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0x2d4363, 0x0b0f19, 0.3);
        this.scene.add(this.hemiLight);

        // 2. Directional Moonlight / Storm Light (Shadow Caster)
        this.moonLight = new THREE.DirectionalLight(0x88bbff, 1.2);
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
            morning:   { sunCol: 0xffd194, sunInt: 1.3, ambCol: 0x78909c, ambInt: 0.8, hemiSky: 0xffd8a8, hemiGround: 0x3e2723 },
            day:       { sunCol: 0xfff8e7, sunInt: 1.5, ambCol: 0xb0bec5, ambInt: 0.9, hemiSky: 0x90caf9, hemiGround: 0x4e342e },
            afternoon: { sunCol: 0xffb74d, sunInt: 1.4, ambCol: 0x90a4ae, ambInt: 0.8, hemiSky: 0xffcc80, hemiGround: 0x3e2723 },
            sunset:    { sunCol: 0xff7043, sunInt: 1.2, ambCol: 0x5c6bc0, ambInt: 0.6, hemiSky: 0xf4511e, hemiGround: 0x1a237e },
            night:     { sunCol: 0x88bbff, sunInt: 1.0, ambCol: 0x404050, ambInt: 0.7, hemiSky: 0x2d4363, hemiGround: 0x0b0f19 },
            rain:      { sunCol: 0x64b5f6, sunInt: 0.8, ambCol: 0x37474f, ambInt: 0.6, hemiSky: 0x455a64, hemiGround: 0x102027 },
            mist:      { sunCol: 0x90a4ae, sunInt: 0.7, ambCol: 0x546e7a, ambInt: 0.8, hemiSky: 0x78909c, hemiGround: 0x263238 }
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
}

window.ThreeLighting = ThreeLighting;

