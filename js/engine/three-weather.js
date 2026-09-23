/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Weather System
 * High-performance 3D rain streaks with wind vector inclination and volumetric storm fog
 */

class ThreeWeather {
    constructor(scene) {
        this.scene = scene;
        this.rainCount = 3200;
        this.rainBoxSize = { x: 120, y: 65, z: 120 };

        // Wind vectors matching the monsoon thunderstorm
        this.windX = -12.0;
        this.windZ = 4.5;
        this.fallSpeed = 75.0;
        this.dropLength = 1.4;

        // Setup atmospheric fog (Night atmospheric tone from user boilerplate)
        this.baseFogColor = new THREE.Color(0x0b0f19);
        this.scene.fog = new THREE.FogExp2(this.baseFogColor.getHex(), 0.0042);

        // Lightning state
        this.isFlashing = false;
        this.flashIntensity = 0;

        this.buildRainSystem();
    }

    buildRainSystem() {
        const positions = new Float32Array(this.rainCount * 2 * 3); // 2 vertices per line streak
        this.velocities = new Float32Array(this.rainCount);

        // Initialize rain particles
        for (let i = 0; i < this.rainCount; i++) {
            const px = (Math.random() - 0.5) * this.rainBoxSize.x;
            const py = Math.random() * this.rainBoxSize.y;
            const pz = (Math.random() - 0.5) * this.rainBoxSize.z;

            // Top of streak
            positions[i * 6] = px;
            positions[i * 6 + 1] = py;
            positions[i * 6 + 2] = pz;

            // Bottom of streak (inclined with wind)
            positions[i * 6 + 3] = px + (this.windX / this.fallSpeed) * this.dropLength;
            positions[i * 6 + 4] = py - this.dropLength;
            positions[i * 6 + 5] = pz + (this.windZ / this.fallSpeed) * this.dropLength;

            this.velocities[i] = this.fallSpeed + (Math.random() - 0.5) * 15.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({
            color: 0x82b1ff,
            transparent: true,
            opacity: 0.5,
            linewidth: 1
        });

        this.rainLines = new THREE.LineSegments(geometry, material);
        this.scene.add(this.rainLines);
    }

    triggerLightning(intensity = 1.0) {
        this.isFlashing = true;
        this.flashIntensity = intensity;
    }

    update(centerPos, deltaTime) {
        if (!this.rainLines) return;

        const positions = this.rainLines.geometry.attributes.position.array;
        const halfX = this.rainBoxSize.x / 2;
        const halfZ = this.rainBoxSize.z / 2;
        const minY = centerPos.y - 5;
        const maxY = centerPos.y + this.rainBoxSize.y;

        for (let i = 0; i < this.rainCount; i++) {
            const vIndex = i * 6;
            const speed = this.velocities[i];

            // Move particle with fall speed and wind vector
            positions[vIndex] += (this.windX * deltaTime);
            positions[vIndex + 1] -= speed * deltaTime;
            positions[vIndex + 2] += (this.windZ * deltaTime);

            // Re-anchor streak tail
            positions[vIndex + 3] = positions[vIndex] + (this.windX / this.fallSpeed) * this.dropLength;
            positions[vIndex + 4] = positions[vIndex + 1] - this.dropLength;
            positions[vIndex + 5] = positions[vIndex + 2] + (this.windZ / this.fallSpeed) * this.dropLength;

            // Reposition / recycle if out of bounding box relative to center
            if (positions[vIndex + 1] < minY ||
                positions[vIndex] < centerPos.x - halfX ||
                positions[vIndex] > centerPos.x + halfX ||
                positions[vIndex + 2] < centerPos.z - halfZ ||
                positions[vIndex + 2] > centerPos.z + halfZ) {

                const rx = centerPos.x + (Math.random() - 0.5) * this.rainBoxSize.x;
                const ry = maxY + Math.random() * 8.0;
                const rz = centerPos.z + (Math.random() - 0.5) * this.rainBoxSize.z;

                positions[vIndex] = rx;
                positions[vIndex + 1] = ry;
                positions[vIndex + 2] = rz;

                positions[vIndex + 3] = rx + (this.windX / this.fallSpeed) * this.dropLength;
                positions[vIndex + 4] = ry - this.dropLength;
                positions[vIndex + 5] = rz + (this.windZ / this.fallSpeed) * this.dropLength;
            }
        }

        this.rainLines.geometry.attributes.position.needsUpdate = true;

        // Localized Highland Mist: Stronger in Nilgiris & Western Ghats (X > 100), clear in lowlands
        if (this.scene.fog && centerPos) {
            let targetFogDensity = 0.0035;
            if (centerPos.x > 100) {
                // Gradient increasing up the Western Ghats (up to 0.014 in high Nilgiris summits)
                const highlandFactor = Math.min(1.0, (centerPos.x - 100) / 150);
                targetFogDensity = 0.0035 + highlandFactor * 0.0105;
            }
            this.scene.fog.density += (targetFogDensity - this.scene.fog.density) * Math.min(1.0, deltaTime * 2.0);
        }

        // Lightning flash decay
        if (this.isFlashing && this.flashIntensity > 0) {
            this.flashIntensity -= deltaTime * 4.5;
            if (this.flashIntensity <= 0) {
                this.flashIntensity = 0;
                this.isFlashing = false;
                this.scene.fog.color.copy(this.baseFogColor);
            } else {
                const flashCol = new THREE.Color(0xd0e8ff);
                this.scene.fog.color.lerpColors(this.baseFogColor, flashCol, this.flashIntensity * 0.85);
            }
        }
    }

    /**
     * Rain wetness multiplier for PBR materials (0.0 dry to 1.0 drenched)
     */
    getRainWetness() {
        return 0.85; // Active monsoon thunderstorm
    }
}

window.ThreeWeather = ThreeWeather;

