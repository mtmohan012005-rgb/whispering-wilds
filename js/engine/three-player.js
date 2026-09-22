/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Player Explorer Avatar & Controller
 * Procedural low-poly avatar with lantern point-light shadow caster
 */

class ThreePlayer {
    constructor(scene, initialX = -250, initialZ = 0) {
        this.scene = scene;
        this.x = initialX;
        this.z = initialZ;
        this.y = 0;
        this.speed = 34.0; // units per second in 3D space
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.isMoving = false;
        this.walkTime = 0;
        this.time = 0;

        this.group = new THREE.Group();
        this.buildAvatarMesh();
        this.scene.add(this.group);
    }

    buildAvatarMesh() {
        // Group root
        this.avatarMesh = new THREE.Group();
        this.group.add(this.avatarMesh);

        // Materials
        const skinMat = new THREE.MeshLambertMaterial({ color: 0x8d5b4c });
        const jacketMat = new THREE.MeshLambertMaterial({ color: 0x4e3629 });
        const vestMat = new THREE.MeshLambertMaterial({ color: 0xc8b79b }); // Cream khadi/veshti
        const hatMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const hatBandMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
        const jholaMat = new THREE.MeshLambertMaterial({ color: 0xb9770e });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.7 });
        const glassMat = new THREE.MeshBasicMaterial({ color: 0xffe082, transparent: true, opacity: 0.85 });

        // 1. Torso & Kurta/Explorer Coat
        const torsoGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.4, 7);
        this.torso = new THREE.Mesh(torsoGeo, jacketMat);
        this.torso.position.y = 1.6;
        this.torso.castShadow = true;
        this.avatarMesh.add(this.torso);

        // 2. Dhoti / Veshti lower half
        const dhotiGeo = new THREE.CylinderGeometry(0.62, 0.7, 1.2, 7);
        this.dhoti = new THREE.Mesh(dhotiGeo, vestMat);
        this.dhoti.position.y = 0.8;
        this.dhoti.castShadow = true;
        this.avatarMesh.add(this.dhoti);

        // 3. Legs
        const legGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.8, 6);
        this.leftLeg = new THREE.Mesh(legGeo, vestMat);
        this.leftLeg.position.set(-0.25, 0.4, 0);
        this.leftLeg.castShadow = true;
        this.avatarMesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, vestMat);
        this.rightLeg.position.set(0.25, 0.4, 0);
        this.rightLeg.castShadow = true;
        this.avatarMesh.add(this.rightLeg);

        // 4. Head & Pith / Explorer Hat
        const headGeo = new THREE.SphereGeometry(0.38, 8, 8);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.y = 2.55;
        this.head.castShadow = true;
        this.avatarMesh.add(this.head);

        // Hat brim
        const hatBrimGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 10);
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
        hatBrim.position.y = 2.8;
        hatBrim.castShadow = true;
        this.avatarMesh.add(hatBrim);

        // Hat dome
        const hatDomeGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.45, 8);
        const hatDome = new THREE.Mesh(hatDomeGeo, hatMat);
        hatDome.position.y = 3.02;
        hatDome.castShadow = true;
        this.avatarMesh.add(hatDome);

        // Hat gold ribbon
        const hatBandGeo = new THREE.CylinderGeometry(0.53, 0.53, 0.1, 8);
        const hatBand = new THREE.Mesh(hatBandGeo, hatBandMat);
        hatBand.position.y = 2.85;
        this.avatarMesh.add(hatBand);

        // 5. Jhola Shoulder Bag
        const jholaGeo = new THREE.BoxGeometry(0.35, 0.5, 0.5);
        this.jhola = new THREE.Mesh(jholaGeo, jholaMat);
        this.jhola.position.set(-0.65, 1.4, 0.1);
        this.jhola.rotation.z = 0.2;
        this.jhola.castShadow = true;
        this.avatarMesh.add(this.jhola);

        // 6. Right Arm holding Lantern
        this.armRight = new THREE.Group();
        this.armRight.position.set(0.65, 1.9, 0);
        this.avatarMesh.add(this.armRight);

        const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.85, 6);
        const armMesh = new THREE.Mesh(armGeo, jacketMat);
        armMesh.position.set(0.15, -0.35, 0.2);
        armMesh.rotation.x = -0.5;
        this.armRight.add(armMesh);

        // 7. Hurrican Kerosene Brass Lantern
        this.lanternGroup = new THREE.Group();
        this.lanternGroup.position.set(0.25, -0.85, 0.45);
        this.armRight.add(this.lanternGroup);

        // Top cap & handle
        const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.15, 6), brassMat);
        lanternCap.position.y = 0.35;
        this.lanternGroup.add(lanternCap);

        // Glass chamber
        const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 6), glassMat);
        lanternGlass.position.y = 0.1;
        this.lanternGroup.add(lanternGlass);

        // Base
        const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.15, 6), brassMat);
        lanternBase.position.y = -0.15;
        lanternBase.castShadow = true;
        this.lanternGroup.add(lanternBase);

        // Real-time Dynamic Lantern Point Light with Shadows
        this.lanternLight = new THREE.PointLight(0xffaa33, 2.6, 45, 2.0);
        this.lanternLight.position.set(0, 0.1, 0);
        this.lanternLight.castShadow = true;
        this.lanternLight.shadow.bias = -0.002;
        this.lanternLight.shadow.mapSize.width = 512;
        this.lanternLight.shadow.mapSize.height = 512;
        this.lanternLight.shadow.camera.near = 0.5;
        this.lanternLight.shadow.camera.far = 45;
        this.lanternGroup.add(this.lanternLight);

        // Subtle glow bulb inside lantern
        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xffe57f })
        );
        this.lanternGroup.add(bulb);
    }

    update(inputState, deltaTime, terrain) {
        this.time += deltaTime;

        // Input vector calculation
        let dx = 0;
        let dz = 0;

        if (inputState.up) dz -= 1;
        if (inputState.down) dz += 1;
        if (inputState.left) dx -= 1;
        if (inputState.right) dx += 1;

        const length = Math.sqrt(dx * dx + dz * dz);
        if (length > 0) {
            dx /= length;
            dz /= length;
            this.isMoving = true;
            this.walkTime += deltaTime * 8.0;

            // Move position
            this.x += dx * this.speed * deltaTime;
            this.z += dz * this.speed * deltaTime;

            // World bounds clamp
            this.x = Math.max(-290, Math.min(290, this.x));
            this.z = Math.max(-100, Math.min(100, this.z));

            // Target facing rotation
            this.targetRotation = Math.atan2(dx, dz);
        } else {
            this.isMoving = false;
        }

        // Smooth rotation interpolation
        let rotDiff = this.targetRotation - this.currentRotation;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        this.currentRotation += rotDiff * Math.min(1.0, deltaTime * 12.0);
        this.avatarMesh.rotation.y = this.currentRotation;

        // Walking leg swing & torso bob
        if (this.isMoving) {
            const swing = Math.sin(this.walkTime);
            this.leftLeg.rotation.x = swing * 0.5;
            this.rightLeg.rotation.x = -swing * 0.5;
            this.torso.position.y = 1.6 + Math.abs(Math.sin(this.walkTime * 2)) * 0.08;
            this.lanternGroup.rotation.z = Math.sin(this.walkTime) * 0.2;
        } else {
            this.leftLeg.rotation.x *= 0.8;
            this.rightLeg.rotation.x *= 0.8;
            this.torso.position.y = 1.6;
            this.lanternGroup.rotation.z *= 0.9;
        }

        // Snap precisely to 3D terrain elevation
        if (terrain && typeof terrain.getElevation === 'function') {
            this.y = terrain.getElevation(this.x, this.z);
        } else {
            this.y = 0;
        }

        this.group.position.set(this.x, this.y, this.z);

        // Organic lantern flickering (hurricane lantern in gale wind)
        const flicker = Math.sin(this.time * 11) * 0.18 + Math.cos(this.time * 19) * 0.12 + (Math.random() - 0.5) * 0.15;
        this.lanternLight.intensity = Math.max(1.8, 2.6 + flicker);
    }

    updateAttireColors(itemId) {
        if (!this.torso || !this.dhoti) return;
        if (itemId === 'cloth_veshti') {
            this.dhoti.material.color.setHex(0xf5f6fa); // Handloom white veshti
            this.torso.material.color.setHex(0xe8ecef);
        } else if (itemId === 'cloth_cargo') {
            this.dhoti.material.color.setHex(0x535c68); // Tough cargo khaki
            this.torso.material.color.setHex(0x2f3542);
        } else if (itemId === 'cloth_woolen') {
            this.dhoti.material.color.setHex(0x303952);
            this.torso.material.color.setHex(0x786fa6); // Toda mountain wool
        }
    }

    setPosition(x, z, terrain) {
        this.x = x;
        this.z = z;
        if (terrain && typeof terrain.getElevation === 'function') {
            this.y = terrain.getElevation(this.x, this.z);
        }
        this.group.position.set(this.x, this.y, this.z);
    }

    getPosition() {
        return { x: this.x, y: this.y, z: this.z };
    }
}

window.ThreePlayer = ThreePlayer;
