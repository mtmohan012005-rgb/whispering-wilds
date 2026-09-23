/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Player Explorer Avatar & Controller
 * Procedural low-poly avatar with biomechanics-driven locomotion,
 * IK-approximated foot placement, inertial momentum, and lantern shadow caster
 */

class ThreePlayer {
    constructor(scene, initialX = -250, initialZ = 0) {
        this.scene = scene;
        this.x = initialX;
        this.z = initialZ;
        this.y = 0;
        this.speed = 34.0;
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.isMoving = false;
        this.walkTime = 0;
        this.time = 0;

        // Locomotion engine (shared with 2D)
        this.locomotion = new window.LocomotionEngine();

        // IK foot placement offsets
        this.leftFootY = 0;
        this.rightFootY = 0;
        this.leftFootAngle = 0;
        this.rightFootAngle = 0;

        // Rigged Skeletal Character & Animation Mixer
        this.gltfMesh = null;
        this.mixer = null;
        this.animations = {};
        this.activeAction = null;
        this.isRiggedModelLoaded = false;
        this.modelPath = window.CHARACTER_MODEL_URL || 'assets/characters/player/player.glb';

        this.group = new THREE.Group();
        this.buildAvatarMesh();
        this.scene.add(this.group);

        // Attempt asynchronous rigged GLTF character load
        this.loadRiggedModel();
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
        const bootMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });

        // 1. Torso & Kurta/Explorer Coat
        const torsoGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.4, 7);
        this.torso = new THREE.Mesh(torsoGeo, jacketMat);
        this.torso.position.y = 1.6;
        this.torso.castShadow = true;
        this.avatarMesh.add(this.torso);

        // 2. Dhoti / Veshti lower half (pelvis)
        const dhotiGeo = new THREE.CylinderGeometry(0.62, 0.7, 1.2, 7);
        this.dhoti = new THREE.Mesh(dhotiGeo, vestMat);
        this.dhoti.position.y = 0.8;
        this.dhoti.castShadow = true;
        this.avatarMesh.add(this.dhoti);

        // 3. Left Leg (upper + lower for IK approximation)
        this.leftLegGroup = new THREE.Group();
        this.leftLegGroup.position.set(-0.25, 0.4, 0);
        this.avatarMesh.add(this.leftLegGroup);

        const legGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.8, 6);
        this.leftLeg = new THREE.Mesh(legGeo, vestMat);
        this.leftLeg.castShadow = true;
        this.leftLegGroup.add(this.leftLeg);

        // Left foot
        const footGeo = new THREE.BoxGeometry(0.22, 0.1, 0.35);
        this.leftFoot = new THREE.Mesh(footGeo, bootMat);
        this.leftFoot.position.set(0, -0.4, 0.05);
        this.leftFoot.castShadow = true;
        this.leftLegGroup.add(this.leftFoot);

        // 4. Right Leg (upper + lower for IK approximation)
        this.rightLegGroup = new THREE.Group();
        this.rightLegGroup.position.set(0.25, 0.4, 0);
        this.avatarMesh.add(this.rightLegGroup);

        this.rightLeg = new THREE.Mesh(legGeo, vestMat);
        this.rightLeg.castShadow = true;
        this.rightLegGroup.add(this.rightLeg);

        // Right foot
        this.rightFoot = new THREE.Mesh(footGeo, bootMat);
        this.rightFoot.position.set(0, -0.4, 0.05);
        this.rightFoot.castShadow = true;
        this.rightLegGroup.add(this.rightFoot);

        // 5. Head & Pith / Explorer Hat
        this.headGroup = new THREE.Group();
        this.headGroup.position.y = 2.55;
        this.avatarMesh.add(this.headGroup);

        const headGeo = new THREE.SphereGeometry(0.38, 8, 8);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.castShadow = true;
        this.headGroup.add(this.head);

        // Hat brim
        const hatBrimGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 10);
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
        hatBrim.position.y = 0.25;
        hatBrim.castShadow = true;
        this.headGroup.add(hatBrim);

        // Hat dome
        const hatDomeGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.45, 8);
        const hatDome = new THREE.Mesh(hatDomeGeo, hatMat);
        hatDome.position.y = 0.47;
        hatDome.castShadow = true;
        this.headGroup.add(hatDome);

        // Hat gold ribbon
        const hatBandGeo = new THREE.CylinderGeometry(0.53, 0.53, 0.1, 8);
        const hatBand = new THREE.Mesh(hatBandGeo, hatBandMat);
        hatBand.position.y = 0.3;
        this.headGroup.add(hatBand);

        // 6. Jhola Shoulder Bag (with inertia)
        this.jholaGroup = new THREE.Group();
        this.jholaGroup.position.set(-0.65, 1.4, 0.1);
        this.avatarMesh.add(this.jholaGroup);

        const jholaGeo = new THREE.BoxGeometry(0.35, 0.5, 0.5);
        this.jhola = new THREE.Mesh(jholaGeo, jholaMat);
        this.jhola.rotation.z = 0.2;
        this.jhola.castShadow = true;
        this.jholaGroup.add(this.jhola);

        // 7. Right Arm holding Lantern
        this.armRight = new THREE.Group();
        this.armRight.position.set(0.65, 1.9, 0);
        this.avatarMesh.add(this.armRight);

        const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.85, 6);
        const armMesh = new THREE.Mesh(armGeo, jacketMat);
        armMesh.position.set(0.15, -0.35, 0.2);
        armMesh.rotation.x = -0.5;
        this.armRight.add(armMesh);

        // 8. Hurricane Kerosene Brass Lantern
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

        // Dynamic Lantern Point Light with Shadows
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

    loadRiggedModel() {
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('GLTFLoader not found, using procedural biomechanical avatar');
            return;
        }

        const loader = new THREE.GLTFLoader();
        loader.load(this.modelPath, (gltf) => {
            this.gltfMesh = gltf.scene;
            this.gltfMesh.scale.set(1.15, 1.15, 1.15);
            this.gltfMesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.roughness = 0.65;
                    }
                }
            });

            // Setup skeletal animation mixer
            this.mixer = new THREE.AnimationMixer(this.gltfMesh);

            // Map animation clips (idle, walk, sprint)
            gltf.animations.forEach((clip) => {
                const name = clip.name.toLowerCase();
                if (name.includes('idle') || (!this.animations['idle'] && name.includes('0'))) {
                    this.animations['idle'] = this.mixer.clipAction(clip);
                }
                if (name.includes('walk') || name.includes('walking')) {
                    this.animations['walk'] = this.mixer.clipAction(clip);
                }
                if (name.includes('run') || name.includes('sprint')) {
                    this.animations['sprint'] = this.mixer.clipAction(clip);
                }
            });

            // Fallbacks for standard asset indices
            if (!this.animations['idle'] && gltf.animations[0]) this.animations['idle'] = this.mixer.clipAction(gltf.animations[0]);
            if (!this.animations['walk'] && gltf.animations[1]) this.animations['walk'] = this.mixer.clipAction(gltf.animations[1]);
            if (!this.animations['sprint'] && gltf.animations[2]) this.animations['sprint'] = this.mixer.clipAction(gltf.animations[2]);

            if (this.animations['idle']) {
                this.activeAction = this.animations['idle'];
                this.activeAction.play();
            }

            // Hide procedural body meshes while keeping lantern
            if (this.torso) this.torso.visible = false;
            if (this.dhoti) this.dhoti.visible = false;
            if (this.headGroup) this.headGroup.visible = false;
            if (this.leftLegGroup) this.leftLegGroup.visible = false;
            if (this.rightLegGroup) this.rightLegGroup.visible = false;
            if (this.armLeft) this.armLeft.visible = false;
            if (this.armRight) this.armRight.visible = false;
            if (this.jholaGroup) this.jholaGroup.visible = false;

            this.avatarMesh.add(this.gltfMesh);
            this.isRiggedModelLoaded = true;
            console.log(`[LivingWorld] Loaded local production player GLB: ${this.modelPath}`);
        }, undefined, (err) => {
            console.warn(`[LivingWorld] Missing local player asset: ${this.modelPath}. Using procedural biomechanical avatar.`);
        });
    }

    transitionTo(name, duration = 0.25) {
        if (!this.mixer) return;
        const nextAction = this.animations[name];
        if (this.activeAction !== nextAction && nextAction) {
            nextAction.reset();
            nextAction.weight = 1.0;
            nextAction.crossFadeFrom(this.activeAction, duration, true);
            nextAction.play();
            this.activeAction = nextAction;
        }
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
            this.targetRotation = Math.atan2(dx, dz);
        } else {
            this.isMoving = false;
        }

        // Map 3D position to 2D-equivalent X for surface resolver
        const equivalent2DX = ((this.x + 290) / 580) * 6000;
        const equivalent2DY = ((this.z + 100) / 200) * 1200;

        // Get weather context from global if available
        const weatherType = (window.testRef && window.testRef.weather) ? window.testRef.weather.current.type : 'storm';
        const weatherIntensity = (window.testRef && window.testRef.weather) ? window.testRef.weather.current.intensity : 0.8;
        const energy = (window.testRef && window.testRef.survival) ? window.testRef.survival.energy : 80;
        const coreTemp = (window.testRef && window.testRef.survival) ? window.testRef.survival.coreTemp : 36;
        const outfitId = (window.gamePlayer) ? window.gamePlayer.outfitId : 'baseOutfit';

        // Sprint input handling
        const isSprinting = !!(inputState.sprint || inputState.shift);
        const sprintMultiplier = isSprinting ? 1.85 : 1.0;
        const targetSpeed = this.speed * sprintMultiplier;

        // Run locomotion engine
        const inputAngle = this.targetRotation;
        const gait = this.locomotion.updateGait(
            deltaTime,
            inputAngle,
            length,
            targetSpeed * 4.7, // scale 3D speed to 2D-equivalent for gait calc
            equivalent2DX,
            equivalent2DY,
            energy,
            coreTemp,
            weatherType,
            weatherIntensity,
            outfitId
        );

        // Apply inertial speed from locomotion engine
        const effectiveSpeed3D = (gait.effectiveSpeed / (targetSpeed * 4.7)) * targetSpeed;

        if (length > 0) {
            this.x += dx * effectiveSpeed3D * deltaTime;
            this.z += dz * effectiveSpeed3D * deltaTime;

            // Foot slip on wet surfaces
            if (gait.isSlipping) {
                this.x -= dx * gait.slipAmount * 0.5 * deltaTime;
                this.z -= dz * gait.slipAmount * 0.5 * deltaTime;
            }
        }

        // World bounds clamp
        this.x = Math.max(-290, Math.min(290, this.x));
        this.z = Math.max(-100, Math.min(100, this.z));

        // Smooth rotation interpolation
        let rotDiff = this.targetRotation - this.currentRotation;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;

        // Pivot turn: snap faster during pivot state
        const rotSpeed = gait.gaitState === 'pivot' ? 25.0 : 12.0;
        this.currentRotation += rotDiff * Math.min(1.0, deltaTime * rotSpeed);
        this.avatarMesh.rotation.y = this.currentRotation;

        // --- SKELETAL ANIMATION MIXER & CROSS-FADING ---
        if (this.mixer) {
            if (length > 0) {
                this.transitionTo(isSprinting ? 'sprint' : 'walk', 0.2);
                if (this.activeAction) {
                    this.activeAction.timeScale = (gait.cadence / 92) * (isSprinting ? 1.25 : 1.0);
                }
            } else {
                this.transitionTo('idle', 0.25);
                if (this.activeAction) this.activeAction.timeScale = 1.0;
            }
            this.mixer.update(deltaTime);
        }

        // --- PROCEDURAL BIOMECHANICS FALLBACK (Active when GLTF model is loading or procedural mode) ---
        if (!this.isRiggedModelLoaded) {
            // Leg swing from locomotion engine (outfit-constrained stride)
            this.leftLegGroup.rotation.x = gait.leftLegSwing * 1.2;
            this.rightLegGroup.rotation.x = gait.rightLegSwing * 1.2;
        }

        // IK-approximated foot placement via terrain sampling
        if (terrain && typeof terrain.getElevation === 'function') {
            const footSpread = 0.3;
            const leftFootWorldX = this.x - Math.sin(this.currentRotation) * footSpread;
            const leftFootWorldZ = this.z - Math.cos(this.currentRotation) * footSpread;
            const rightFootWorldX = this.x + Math.sin(this.currentRotation) * footSpread;
            const rightFootWorldZ = this.z + Math.cos(this.currentRotation) * footSpread;

            const centerY = terrain.getElevation(this.x, this.z);
            const leftY = terrain.getElevation(leftFootWorldX, leftFootWorldZ);
            const rightY = terrain.getElevation(rightFootWorldX, rightFootWorldZ);

            // Foot angle from slope
            const slopeNormalLeft = Math.atan2(leftY - centerY, footSpread);
            const slopeNormalRight = Math.atan2(rightY - centerY, footSpread);

            // Smoothly interpolate foot placement
            this.leftFootY += (leftY - centerY - this.leftFootY) * Math.min(1, deltaTime * 10);
            this.rightFootY += (rightY - centerY - this.rightFootY) * Math.min(1, deltaTime * 10);
            this.leftFootAngle += (slopeNormalLeft - this.leftFootAngle) * Math.min(1, deltaTime * 8);
            this.rightFootAngle += (slopeNormalRight - this.rightFootAngle) * Math.min(1, deltaTime * 8);

            // Apply foot IK offsets
            this.leftFoot.position.y = -0.4 + this.leftFootY * 0.3;
            this.leftFoot.rotation.x = this.leftFootAngle * 0.5;
            this.rightFoot.position.y = -0.4 + this.rightFootY * 0.3;
            this.rightFoot.rotation.x = this.rightFootAngle * 0.5;

            // Pelvis offset — shift down when feet are on uneven ground
            const pelvisShift = Math.min(this.leftFootY, this.rightFootY) * 0.15;
            this.dhoti.position.y = 0.8 + pelvisShift;

            // Lateral pelvis tilt from uneven foot heights
            const heightDiff = this.leftFootY - this.rightFootY;
            this.dhoti.rotation.z = heightDiff * 0.08;

            // Spine compensation (torso counter-rotates to maintain balance)
            this.torso.rotation.z = -heightDiff * 0.05;

            this.y = centerY;
        } else {
            this.y = 0;
        }

        // Torso bob from locomotion pelvis offset
        this.torso.position.y = 1.6 + gait.pelvisOffset * 0.03;

        // Torso forward lean
        this.torso.rotation.x = gait.lean * 0.8;

        // Head droop (fatigue)
        this.headGroup.rotation.x = gait.headDroop;

        // Jhola / gear inertia sway
        this.jholaGroup.rotation.z = 0.2 + gait.gearSwayX * 0.02;
        this.jholaGroup.position.y = 1.4 - gait.gearSwayY * 0.02;

        // Lantern sway (lagged from movement)
        this.lanternGroup.rotation.z = gait.gearSwayX * 0.04;

        // Arm pose adjustments
        if (gait.armPose === 'rain_shield') {
            this.armRight.rotation.x = -1.2; // arm raised to shield face
            this.armRight.rotation.z = -0.3;
        } else if (gait.armPose === 'hands_on_knees') {
            this.armRight.rotation.x = 0.8;
            this.armRight.rotation.z = 0.2;
        } else {
            // Normal lantern-hold pose
            this.armRight.rotation.x = 0;
            this.armRight.rotation.z = 0;
        }

        // Set world position
        this.group.position.set(this.x, this.y, this.z);

        // Organic lantern flickering (hurricane lantern in gale wind)
        const flicker = Math.sin(this.time * 11) * 0.18 + Math.cos(this.time * 19) * 0.12 + (Math.random() - 0.5) * 0.15;
        this.lanternLight.intensity = Math.max(1.8, 2.6 + flicker);
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
