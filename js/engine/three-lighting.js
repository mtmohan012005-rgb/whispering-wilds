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
