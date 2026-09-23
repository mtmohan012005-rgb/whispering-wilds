// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION WILDLIFE ENTITY
// Species-Specific Behaviors, Perception, Herding, Local GLB Failsafe & Animation
// ============================================================================

class ProductionWildlife {
  /**
   * @param {Object} speciesConfig - Species definition from wildlife-production-data.js
   * @param {Object} spawnConfig - Instance spawn parameters (id, x, z, herdLeader)
   * @param {THREE.Scene} scene - Three.js World Scene
   * @param {Object} terrain - ThreeTerrain procedural elevation reference
   */
  constructor(speciesConfig, spawnConfig, scene, terrain) {
    this.speciesConfig = speciesConfig;
    this.species = speciesConfig.species;
    this.id = spawnConfig.id || `${this.species}_${Math.floor(Math.random() * 10000)}`;
    this.scene = scene;
    this.terrain = terrain;

    // Home Habitat Anchor
    this.homeLocation = {
      x: spawnConfig.homeX !== undefined ? spawnConfig.homeX : speciesConfig.homeLocation.x,
      z: spawnConfig.homeZ !== undefined ? spawnConfig.homeZ : speciesConfig.homeLocation.z
    };
    this.wanderRadius = speciesConfig.wanderRadius || 25.0;

    // Transform State
    this.x = spawnConfig.x !== undefined ? spawnConfig.x : this.homeLocation.x;
    this.z = spawnConfig.z !== undefined ? spawnConfig.z : this.homeLocation.z;
    this.y = terrain && typeof terrain.getElevation === 'function' ? terrain.getElevation(this.x, this.z) : 0;
    this.flightAltitude = 0; // Additional Y for flying birds (egret / kingfisher)

    this.currentRotation = (Math.PI * 2 * ((spawnConfig.initialSeed || 50) % 100)) / 100;
    this.targetRotation = this.currentRotation;

    // Target Destination Vector
    this.target = new THREE.Vector3(this.x, this.y, this.z);

    // AI & Behavior State
    this.state = speciesConfig.defaultState || 'IDLE';
    this.stateTimer = 4.0 + (spawnConfig.initialSeed ? (spawnConfig.initialSeed % 5) : 2);
    this.alertTimer = 0;
    this.returnTimer = 0;
    this.isHerdLeader = !!spawnConfig.isHerdLeader;
    this.herdLeader = spawnConfig.herdLeader || null;

    // 3D Scene Node
    this.group = new THREE.Group();
    this.group.position.set(this.x, this.y, this.z);
    this.scene.add(this.group);

    // Animation & Mesh state
    this.modelLoaded = false;
    this.gltfRoot = null;
    this.mixer = null;
    this.animations = {};
    this.currentAction = null;

    // Procedural Fallback Mesh references
    this.proceduralMesh = null;
    this.legSwingCycle = 0;
    this.wingFlapCycle = 0;
    this.leftWing = null;
    this.rightWing = null;

    this.initModel();
  }

  /**
   * Attempts local GLB load from assets/characters/wildlife/<species>.glb
   * Failsafe: logs warning, does not crash, does not fetch from external CDN.
   * Builds an anatomically proportioned procedural silhouette.
   */
  initModel() {
    const modelPath = this.speciesConfig.modelPath || `assets/characters/wildlife/${this.species}.glb`;

    if (typeof THREE.GLTFLoader !== 'undefined') {
      const loader = new THREE.GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          this.onGLBSuccess(gltf);
        },
        undefined,
        (error) => {
          console.warn(`[LivingWorld] Missing local wildlife asset: ${modelPath}. Using modular procedural silhouette.`);
          this.buildProceduralSilhouette();
        }
      );
    } else {
      console.warn(`[LivingWorld] GLTFLoader unavailable. Building procedural wildlife for ${this.species}.`);
      this.buildProceduralSilhouette();
    }
  }

  onGLBSuccess(gltf) {
    if (this.proceduralMesh) {
      this.group.remove(this.proceduralMesh);
      this.proceduralMesh = null;
    }

    this.gltfRoot = gltf.scene;
    this.gltfRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.group.add(this.gltfRoot);
    this.modelLoaded = true;

    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.gltfRoot);
      gltf.animations.forEach((clip) => {
        const name = clip.name.toLowerCase();
        this.animations[name] = this.mixer.clipAction(clip);
      });
      this.playAnimation('idle');
    }

    console.log(`[LivingWorld] Loaded local production wildlife GLB: ${this.speciesConfig.modelPath}`);
  }

  /**
   * Graceful fallback animation clip mapping
   */
  playAnimation(animName) {
    if (!this.mixer) return;

    const fallbackMap = {
      graze: ['graze', 'eat', 'forage', 'idle'],
      forage: ['forage', 'graze', 'eat', 'idle'],
      eat: ['eat', 'graze', 'idle'],
      drink: ['drink', 'graze', 'idle'],
      alert: ['alert', 'observe', 'idle'],
      defend: ['defend', 'alert', 'idle'],
      fly: ['fly', 'run', 'walk'],
      land: ['land', 'walk', 'idle'],
      climb: ['climb', 'walk', 'idle'],
      run: ['run', 'sprint', 'flee', 'walk', 'idle'],
      walk: ['walk', 'run', 'idle'],
      idle: ['idle', 'walk']
    };

    const candidates = fallbackMap[animName] || [animName, 'idle'];
    let targetAction = null;

    for (const key of candidates) {
      if (this.animations[key]) {
        targetAction = this.animations[key];
        break;
      }
    }

    if (!targetAction) return;

    if (this.currentAction !== targetAction) {
      if (this.currentAction) this.currentAction.fadeOut(0.2);
      targetAction.reset().fadeIn(0.2).play();
      this.currentAction = targetAction;
    }
  }

  /**
   * Builds an anatomically characteristic procedural silhouette for each of the 9 species
   */
  buildProceduralSilhouette() {
    if (this.proceduralMesh) return;

    const root = new THREE.Group();
    this.proceduralMesh = root;

    const color = this.speciesConfig.silhouetteColor || 0x4a4a4a;
    const dims = this.speciesConfig.dimensions || { width: 0.6, height: 1.0, length: 1.2 };
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 });

    switch (this.species) {
      case 'elephant': {
        // Heavy rounded torso
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, dims.length, 8), mat);
        body.rotation.x = Math.PI / 2;
        body.position.y = dims.height * 0.65;
        body.castShadow = true;
        root.add(body);

        // Huge domed head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), mat);
        head.position.set(0, dims.height * 0.75, dims.length * 0.55);
        head.castShadow = true;
        root.add(head);

        // Trunk
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.3, 6), mat);
        trunk.position.set(0, dims.height * 0.4, dims.length * 0.75);
        trunk.rotation.x = 0.3;
        root.add(trunk);

        // Tusks
        const tuskMat = new THREE.MeshStandardMaterial({ color: 0xfffae6, roughness: 0.3 });
        const leftTusk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.7, 6), tuskMat);
        leftTusk.position.set(-0.25, dims.height * 0.45, dims.length * 0.7);
        leftTusk.rotation.x = -0.4;
        root.add(leftTusk);
        const rightTusk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.7, 6), tuskMat);
        rightTusk.position.set(0.25, dims.height * 0.45, dims.length * 0.7);
        rightTusk.rotation.x = -0.4;
        root.add(rightTusk);

        // 4 Sturdy Pillar Legs
        const legGeo = new THREE.CylinderGeometry(0.22, 0.26, dims.height * 0.55, 6);
        [[-0.55, 0.8], [0.55, 0.8], [-0.55, -0.8], [0.55, -0.8]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, mat);
          leg.position.set(lx, dims.height * 0.28, lz);
          leg.castShadow = true;
          root.add(leg);
        });
        break;
      }

      case 'nilgiri_tahr': {
        // Compact muscular body
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, dims.length, 6), mat);
        body.rotation.x = Math.PI / 2;
        body.position.y = dims.height * 0.6;
        body.castShadow = true;
        root.add(body);

        // Head with prominent curved horns
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), mat);
        head.position.set(0, dims.height * 0.85, dims.length * 0.45);
        root.add(head);

        // Backward curved horns
        const hornGeo = new THREE.CylinderGeometry(0.02, 0.06, 0.45, 5);
        const leftHorn = new THREE.Mesh(hornGeo, hornMat);
        leftHorn.position.set(-0.1, dims.height * 1.05, dims.length * 0.38);
        leftHorn.rotation.x = -0.6;
        leftHorn.rotation.z = -0.2;
        root.add(leftHorn);
        const rightHorn = new THREE.Mesh(hornGeo, hornMat);
        rightHorn.position.set(0.1, dims.height * 1.05, dims.length * 0.38);
        rightHorn.rotation.x = -0.6;
        rightHorn.rotation.z = 0.2;
        root.add(rightHorn);

        // 4 Slender Hoofed Legs
        const legGeo = new THREE.CylinderGeometry(0.06, 0.05, dims.height * 0.55, 5);
        [[-0.2, 0.4], [0.2, 0.4], [-0.2, -0.4], [0.2, -0.4]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, mat);
          leg.position.set(lx, dims.height * 0.28, lz);
          leg.castShadow = true;
          root.add(leg);
        });
        break;
      }

      case 'egret': {
        // Slender aquatic bird
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), mat);
        body.position.y = dims.height * 0.65;
        body.scale.set(0.7, 0.8, 1.4);
        root.add(body);

        // S-curved long neck & yellow beak
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 5), mat);
        neck.position.set(0, dims.height * 0.95, 0.18);
        neck.rotation.x = 0.2;
        root.add(neck);

        const beakMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.25, 4), beakMat);
        beak.position.set(0, dims.height * 1.15, 0.35);
        beak.rotation.x = Math.PI / 2;
        root.add(beak);

        // Wings for flight flap
        const wingGeo = new THREE.BoxGeometry(0.45, 0.04, 0.55);
        this.leftWing = new THREE.Mesh(wingGeo, mat);
        this.leftWing.position.set(-0.3, dims.height * 0.68, 0);
        root.add(this.leftWing);
        this.rightWing = new THREE.Mesh(wingGeo, mat);
        this.rightWing.position.set(0.3, dims.height * 0.68, 0);
        root.add(this.rightWing);

        // Long stilt legs
        const stiltLegGeo = new THREE.CylinderGeometry(0.02, 0.02, dims.height * 0.65, 4);
        const legMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const leftLeg = new THREE.Mesh(stiltLegGeo, legMat);
        leftLeg.position.set(-0.08, dims.height * 0.32, 0);
        root.add(leftLeg);
        const rightLeg = new THREE.Mesh(stiltLegGeo, legMat);
        rightLeg.position.set(0.08, dims.height * 0.32, 0);
        root.add(rightLeg);
        break;
      }

      default: {
        // Generic quadruped / creature baseline (Cattle, Gaur, Peafowl, Goat, Langur, Kingfisher)
        const body = new THREE.Mesh(new THREE.BoxGeometry(dims.width, dims.height * 0.5, dims.length), mat);
        body.position.y = dims.height * 0.55;
        body.castShadow = true;
        root.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(dims.width * 0.45, 6, 6), mat);
        head.position.set(0, dims.height * 0.8, dims.length * 0.45);
        root.add(head);

        const legGeo = new THREE.CylinderGeometry(dims.width * 0.12, dims.width * 0.1, dims.height * 0.5, 5);
        [[-dims.width * 0.35, dims.length * 0.35], [dims.width * 0.35, dims.length * 0.35],
         [-dims.width * 0.35, -dims.length * 0.35], [dims.width * 0.35, -dims.length * 0.35]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(legGeo, mat);
          leg.position.set(lx, dims.height * 0.25, lz);
          leg.castShadow = true;
          root.add(leg);
        });
        break;
      }
    }

    this.group.add(root);
  }

  /**
   * Perception system: evaluates distance to player and updates awareness
   */
  perceive(playerDistance, playerPos) {
    const alertRadius = this.speciesConfig.alertRadius || 15.0;
    const fleeRadius = this.speciesConfig.fleeRadius || 8.0;

    // Defend standoff for elephants
    if (this.species === 'elephant') {
      const defendRadius = this.speciesConfig.defendRadius || 4.5;
      if (playerDistance < defendRadius) {
        if (this.state !== 'DEFEND') {
          this.state = 'DEFEND';
          this.playAnimation('defend');
          this.facePosition(playerPos);
        }
        return;
      } else if (playerDistance < alertRadius) {
        if (this.state !== 'ALERT' && this.state !== 'DEFEND') {
          this.state = 'ALERT';
          this.playAnimation('alert');
          this.facePosition(playerPos);
        }
        return;
      }
    }

    // Flee threshold
    if (fleeRadius > 0 && playerDistance < fleeRadius) {
      if (this.state !== 'FLEE') {
        this.triggerFlee(playerPos);
      }
      return;
    }

    // Alert threshold
    if (playerDistance < alertRadius) {
      if (this.state !== 'ALERT' && this.state !== 'FLEE') {
        this.state = 'ALERT';
        this.alertTimer = 3.5;
        this.playAnimation('alert');
        this.facePosition(playerPos);
      }
    }
  }

  /**
   * Triggers flee away from threat
   */
  triggerFlee(sourcePos) {
    this.state = 'FLEE';
    this.returnTimer = this.speciesConfig.returnDelay || 10.0;

    if (sourcePos) {
      // Calculate opposite vector
      const dx = this.x - sourcePos.x;
      const dz = this.z - sourcePos.z;
      const dist = Math.hypot(dx, dz) || 1.0;

      // Flee destination 20m away from threat
      const fleeDist = 18.0;
      this.target.set(this.x + (dx / dist) * fleeDist, 0, this.z + (dz / dist) * fleeDist);
    }

    // For aerial birds, lift off into flight
    if (this.species === 'egret' || this.species === 'kingfisher') {
      this.flightAltitude = 4.5;
      this.playAnimation('fly');
    } else {
      this.playAnimation('run');
    }
  }

  /**
   * Returns smoothly to original home habitat anchor
   */
  returnToHabitat() {
    this.state = 'RETURN';
    this.target.set(
      this.homeLocation.x + (Math.random() - 0.5) * 6.0,
      0,
      this.homeLocation.z + (Math.random() - 0.5) * 6.0
    );
    this.playAnimation('walk');
  }

  facePosition(pos) {
    if (!pos) return;
    const dx = pos.x - this.x;
    const dz = pos.z - this.z;
    this.targetRotation = Math.atan2(dx, dz);
  }

  /**
   * Main per-frame update called by LivingWorldSystem
   */
  update(deltaTime, playerDistance, playerPos, terrain, lodTier = 1) {
    // 1. Perception check
    this.perceive(playerDistance, playerPos);

    // 2. State machine timers & transitions
    this.updateStateMachine(deltaTime);

    // 3. Distance-based LOD
    if (lodTier === 3) {
      // Tier 3 (Far, > 160m): Cull mesh; cheap linear interpolation
      this.group.visible = false;
      this.stepMovement(deltaTime, 0.4);
      return;
    }

    this.group.visible = true;

    // 4. Smooth movement towards target
    const isMoving = this.stepMovement(deltaTime, 1.0);

    // 5. Elevation sampling (IK ground or flight altitude)
    if (terrain && typeof terrain.getElevation === 'function') {
      this.y = terrain.getElevation(this.x, this.z) + this.flightAltitude;
    }
    this.group.position.set(this.x, this.y, this.z);

    // 6. Smooth rotation heading
    let rotDiff = this.targetRotation - this.currentRotation;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    this.currentRotation += rotDiff * Math.min(1.0, deltaTime * 6.0);
    this.group.rotation.y = this.currentRotation;

    // 7. Animation updates
    if (this.mixer) {
      this.mixer.update(deltaTime);
    } else if (this.proceduralMesh) {
      // Procedural wing flap or leg cycle
      if (this.flightAltitude > 0.5 && this.leftWing && this.rightWing) {
        this.wingFlapCycle += deltaTime * 18.0;
        const flap = Math.sin(this.wingFlapCycle) * 0.45;
        this.leftWing.rotation.z = flap;
        this.rightWing.rotation.z = -flap;
      }
    }
  }

  updateStateMachine(deltaTime) {
    // Return timer when in FLEE state
    if (this.state === 'FLEE') {
      this.returnTimer -= deltaTime;
      if (this.returnTimer <= 0) {
        this.returnToHabitat();
      }
      return;
    }

    // Alert countdown
    if (this.state === 'ALERT') {
      this.alertTimer -= deltaTime;
      if (this.alertTimer <= 0) {
        this.state = this.speciesConfig.defaultState || 'IDLE';
        this.playAnimation(this.state.toLowerCase());
      }
      return;
    }

    // Return to home finished
    if (this.state === 'RETURN') {
      const distToHome = Math.hypot(this.x - this.homeLocation.x, this.z - this.homeLocation.z);
      if (distToHome < 4.0) {
        this.state = this.speciesConfig.defaultState || 'GRAZE';
        if (this.flightAltitude > 0) {
          this.flightAltitude = 0; // Landed
        }
        this.playAnimation(this.state.toLowerCase());
      }
      return;
    }

    // Normal ambient wandering countdown
    this.stateTimer -= deltaTime;
    if (this.stateTimer <= 0) {
      this.stateTimer = 5.0 + Math.random() * 6.0;
      this.pickAmbientAction();
    }
  }

  pickAmbientAction() {
    const validStates = this.speciesConfig.validStates || ['IDLE', 'GRAZE'];
    const chosenState = validStates[Math.floor(Math.random() * validStates.length)];
    this.state = chosenState;

    if (chosenState === 'GRAZE' || chosenState === 'FORAGE' || chosenState === 'GROUP_MOVE') {
      // Pick random destination within wanderRadius of home
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.wanderRadius;
      this.target.set(
        this.homeLocation.x + Math.cos(angle) * radius,
        0,
        this.homeLocation.z + Math.sin(angle) * radius
      );
      this.playAnimation('walk');
    } else {
      this.playAnimation(chosenState.toLowerCase());
    }
  }

  stepMovement(deltaTime, speedScale = 1.0) {
    if (this.state === 'IDLE' || this.state === 'REST' || this.state === 'DEFEND') return false;

    const dx = this.target.x - this.x;
    const dz = this.target.z - this.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.5) {
      this.targetRotation = Math.atan2(dx, dz);

      const baseSpeed = this.state === 'FLEE'
        ? (this.speciesConfig.movementSpeed.run || 6.5)
        : (this.speciesConfig.movementSpeed.walk || 2.0);

      const step = Math.min(dist, baseSpeed * speedScale * deltaTime);
      this.x += (dx / dist) * step;
      this.z += (dz / dist) * step;
      return true;
    } else {
      if (this.state === 'FLEE') {
        this.returnToHabitat();
      }
      return false;
    }
  }
}

// Global browser and module exports
if (typeof window !== 'undefined') {
  window.ProductionWildlife = ProductionWildlife;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProductionWildlife };
}
