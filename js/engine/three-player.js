/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Player Explorer Avatar & Controller
 * Production-ready character architecture supporting rigged GLTF character (assets/characters/player/player.glb),
 * 17-state animation machine, calibrated velocities, cultural wardrobe system,
 * biomechanics-driven locomotion, and terrain adaptation.
 */

// 17-State Animation State Machine Enum (Section 13)
window.PLAYER_STATE = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  SPRINT: 'SPRINT',
  CROUCH_IDLE: 'CROUCH_IDLE',
  CROUCH_WALK: 'CROUCH_WALK',
  JUMP_START: 'JUMP_START',
  JUMP: 'JUMP',
  FALL: 'FALL',
  LAND: 'LAND',
  INTERACT: 'INTERACT',
  PICKUP: 'PICKUP',
  INSPECT: 'INSPECT',
  USE_ITEM: 'USE_ITEM',
  CLIMB: 'CLIMB',
  SWIM: 'SWIM',
  PHOTO: 'PHOTO'
};

class ThreePlayer {
  constructor(scene, initialX = -250, initialZ = 0) {
    this.scene = scene;
    this.x = initialX;
    this.z = initialZ;
    this.y = 0;
    this.yOffset = 0; // vertical offset for jumping/falling
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.landTimer = 0;
    this.actionLockTimer = 0;

    // Movement Speeds (Calibrated to game units / scale, Section 13)
    // Real scale: Idle (0), Crouch (~0.8m/s), Walk (~1.5m/s), Run (~3.2m/s), Sprint (~5.5m/s)
    this.speeds = {
      idle: 0,
      crouch: 8.5,
      walk: 16.0,
      run: 32.0,
      sprint: 55.0
    };
    this.speed = this.speeds.run;

    // State machine
    this.state = window.PLAYER_STATE.IDLE;
    this.targetRotation = 0;
    this.currentRotation = 0;
    this.isMoving = false;
    this.time = 0;

    // Authoritative Outfit Property (Section 13)
    this.outfitId = 'everyday_veshti';
    this.validOutfitIds = [
      'everyday_veshti',
      'village_workwear',
      'urban_explorer',
      'festival_veshti',
      'nilgiri_warmwear'
    ];

    // Locomotion engine for surface friction & gait biomechanics
    this.locomotion = (typeof window.LocomotionEngine !== 'undefined')
      ? new window.LocomotionEngine()
      : { updateGait: () => ({ effectiveSpeed: 32, isSlipping: false, slipAmount: 0, cadence: 90, lean: 0, pelvisOffset: 0, headDroop: 0, gearSwayX: 0, gearSwayY: 0, leftLegSwing: 0, rightLegSwing: 0 }) };

    // Root groups
    this.group = new THREE.Group();
    this.avatarMesh = new THREE.Group();
    this.group.add(this.avatarMesh);
    this.scene.add(this.group);

    // Kerosene Brass Lantern with point light & shadow caster
    this.buildLantern();

    // Instantiate Production Character Loader
    this.characterLoader = new window.CharacterLoader(this.scene);
    this.avatarMesh.add(this.characterLoader.characterGroup);

    // Trigger local GLB character load
    this.characterLoader.loadPlayerCharacter().then((res) => {
      if (res.isProductionAsset) {
        console.log('[ThreePlayer] Rigged production GLB character loaded into scene.');
      } else {
        console.log('[ThreePlayer] Diagnostic Tamil explorer proxy active awaiting production GLB.');
      }
      this.setOutfit(this.outfitId);
    });
  }

  // Authoritative outfit getter/setter (replaces legacy currentOutfit)
  get currentOutfit() {
    return this.outfitId;
  }

  set currentOutfit(val) {
    this.setOutfit(val);
  }

  /**
   * Sets the authoritative outfit ID and applies material / geometry styling
   * @param {string} outfitId - One of the 5 valid outfit IDs
   */
  setOutfit(outfitId) {
    // Map legacy names if passed
    if (outfitId === 'baseOutfit') outfitId = 'everyday_veshti';
    else if (outfitId === 'farmlandGear') outfitId = 'village_workwear';
    else if (outfitId === 'mountainGear') outfitId = 'nilgiri_warmwear';

    if (!this.validOutfitIds.includes(outfitId)) {
      console.warn(`[ThreePlayer] Invalid outfit ID: "${outfitId}". Defaulting to "everyday_veshti".`);
      outfitId = 'everyday_veshti';
    }

    this.outfitId = outfitId;
    if (this.characterLoader) {
      this.characterLoader.setOutfit(outfitId);
    }
  }

  setCustomization(config) {
    if (!config) return;
    if (config.outfitId) {
      this.setOutfit(config.outfitId);
    }
    this.customization = { ...config };
  }

  buildLantern() {
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.7 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xffe082, transparent: true, opacity: 0.85 });

    this.lanternGroup = new THREE.Group();
    this.lanternGroup.position.set(0.35, 0.85, 0.25);
    this.avatarMesh.add(this.lanternGroup);

    const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.1, 6), brassMat);
    lanternCap.position.y = 0.22;
    this.lanternGroup.add(lanternCap);

    const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 6), glassMat);
    lanternGlass.position.y = 0.08;
    this.lanternGroup.add(lanternGlass);

    const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 6), brassMat);
    lanternBase.position.y = -0.08;
    lanternBase.castShadow = true;
    this.lanternGroup.add(lanternBase);

    // Dynamic Lantern Point Light with Shadows
    this.lanternLight = new THREE.PointLight(0xffaa33, 2.6, 45, 2.0);
    this.lanternLight.position.set(0, 0.08, 0);
    this.lanternLight.castShadow = true;
    this.lanternLight.shadow.bias = -0.002;
    this.lanternLight.shadow.mapSize.width = 512;
    this.lanternLight.shadow.mapSize.height = 512;
    this.lanternLight.shadow.camera.near = 0.5;
    this.lanternLight.shadow.camera.far = 45;
    this.lanternGroup.add(this.lanternLight);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe57f })
    );
    this.lanternGroup.add(bulb);
  }

  /**
   * Triggers a temporary action state (e.g. INTERACT, INSPECT, PHOTO)
   */
  triggerAction(stateName, duration = 0.8) {
    if (!window.PLAYER_STATE[stateName]) return;
    this.state = stateName;
    this.actionLockTimer = duration;

    const clipMap = {
      INTERACT: 'Player_Interact',
      PICKUP: 'Player_Pickup',
      INSPECT: 'Player_Inspect',
      USE_ITEM: 'Player_Use_Item',
      PHOTO: 'Player_Photo'
    };

    const clipName = clipMap[stateName] || 'Player_Idle';
    if (this.characterLoader) {
      this.characterLoader.playAction(clipName, 0.15);
    }
  }

  /**
   * Cross-fade to an animation clip by name (backward compatibility with legacy test assertions)
   */
  transitionTo(clipName, duration = 0.25) {
    if (this.characterLoader) {
      let mapped = clipName;
      if (clipName === 'idle') mapped = 'Player_Idle';
      else if (clipName === 'walk') mapped = 'Player_Walk';
      else if (clipName === 'run') mapped = 'Player_Run';
      else if (clipName === 'sprint') mapped = 'Player_Sprint';
      this.characterLoader.playAction(mapped, duration);
    }
  }

  update(inputState, deltaTime, terrain) {
    this.time += deltaTime;

    // Handle action lock (e.g. interacting, taking a photo)
    if (this.actionLockTimer > 0) {
      this.actionLockTimer -= deltaTime;
      if (this.characterLoader) this.characterLoader.update(deltaTime);
      this.group.position.set(this.x, this.y + this.yOffset, this.z);
      return;
    }

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

    // Input modifiers
    const isSprinting = !!(inputState.sprint || inputState.shift);
    const isCrouching = !!(inputState.crouch || inputState.ctrl);
    const isWalking = !!(inputState.walk);

    // Jump Physics (Section 13)
    const gravity = 35.0;
    if (this.isGrounded) {
      if (inputState.jump) {
        this.verticalVelocity = 12.0;
        this.isGrounded = false;
        this.state = window.PLAYER_STATE.JUMP;
        this.yOffset = 0.1;
        if (this.characterLoader) this.characterLoader.playAction('Player_Jump', 0.15);
      }
    } else {
      // Airborne
      this.verticalVelocity -= gravity * deltaTime;
      this.yOffset += this.verticalVelocity * deltaTime;

      if (this.verticalVelocity < 0 && this.state !== window.PLAYER_STATE.FALL) {
        this.state = window.PLAYER_STATE.FALL;
        if (this.characterLoader) this.characterLoader.playAction('Player_Fall', 0.2);
      }

      if (this.yOffset <= 0) {
        this.yOffset = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.state = window.PLAYER_STATE.LAND;
        this.landTimer = 0.15;
        if (this.characterLoader) this.characterLoader.playAction('Player_Land', 0.1);
      }
    }

    // Land recovery
    if (this.isGrounded && this.landTimer > 0) {
      this.landTimer -= deltaTime;
    }

    // Ground Locomotion State Selection
    let currentSpeed = 0;
    let targetClip = 'Player_Idle';

    if (this.isGrounded && this.landTimer <= 0) {
      if (isCrouching) {
        if (this.isMoving) {
          this.state = window.PLAYER_STATE.CROUCH_WALK;
          currentSpeed = this.speeds.crouch;
          targetClip = 'Player_Crouch_Walk';
        } else {
          this.state = window.PLAYER_STATE.CROUCH_IDLE;
          currentSpeed = this.speeds.idle;
          targetClip = 'Player_Crouch_Idle';
        }
      } else if (this.isMoving) {
        if (isSprinting) {
          this.state = window.PLAYER_STATE.SPRINT;
          currentSpeed = this.speeds.sprint;
          targetClip = 'Player_Sprint';
        } else if (isWalking) {
          this.state = window.PLAYER_STATE.WALK;
          currentSpeed = this.speeds.walk;
          targetClip = 'Player_Walk';
        } else {
          this.state = window.PLAYER_STATE.RUN;
          currentSpeed = this.speeds.run;
          targetClip = 'Player_Run';
        }
      } else {
        this.state = window.PLAYER_STATE.IDLE;
        currentSpeed = this.speeds.idle;
        targetClip = 'Player_Idle';
      }

      if (this.characterLoader) {
        this.characterLoader.playAction(targetClip, 0.2);
      }
    }

    // Biomechanics & Surface Friction from Locomotion Engine
    const equivalent2DX = ((this.x + 290) / 580) * 6000;
    const equivalent2DY = ((this.z + 100) / 200) * 1200;
    const weatherType = (window.testRef && window.testRef.weather) ? window.testRef.weather.current.type : 'storm';
    const weatherIntensity = (window.testRef && window.testRef.weather) ? window.testRef.weather.current.intensity : 0.8;
    const energy = (window.testRef && window.testRef.survival) ? window.testRef.survival.energy : 80;
    const coreTemp = (window.testRef && window.testRef.survival) ? window.testRef.survival.coreTemp : 36;

    const gait = this.locomotion.updateGait(
      deltaTime,
      this.targetRotation,
      length,
      currentSpeed * 4.7,
      equivalent2DX,
      equivalent2DY,
      energy,
      coreTemp,
      weatherType,
      weatherIntensity,
      this.outfitId
    );

    // Apply movement
    const effectiveSpeed = (currentSpeed > 0) ? ((gait.effectiveSpeed / (currentSpeed * 4.7)) * currentSpeed) : 0;
    if (length > 0 && effectiveSpeed > 0) {
      this.x += dx * effectiveSpeed * deltaTime;
      this.z += dz * effectiveSpeed * deltaTime;

      // Surface slip
      if (gait.isSlipping) {
        this.x -= dx * gait.slipAmount * 0.5 * deltaTime;
        this.z -= dz * gait.slipAmount * 0.5 * deltaTime;
      }

      // Obstacle collision resolution against registered production world assets
      if (window.productionWorldAssets && typeof window.productionWorldAssets.resolveCollision === 'function') {
        const colResult = window.productionWorldAssets.resolveCollision(this.x, this.z, 0.65);
        this.x = colResult.x;
        this.z = colResult.z;
      }
    }

    // World bounds clamp
    this.x = Math.max(-290, Math.min(290, this.x));
    this.z = Math.max(-100, Math.min(100, this.z));

    // Smooth rotation interpolation
    let rotDiff = this.targetRotation - this.currentRotation;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    this.currentRotation += rotDiff * Math.min(1.0, deltaTime * 14.0);
    this.avatarMesh.rotation.y = this.currentRotation;

    // Terrain elevation alignment
    if (terrain && typeof terrain.getElevation === 'function') {
      this.y = terrain.getElevation(this.x, this.z);
    } else {
      this.y = 0;
    }

    // Update Character Loader mixer
    if (this.characterLoader) {
      this.characterLoader.update(deltaTime);

      // Procedural biomechanics on diagnostic proxy when real GLB is missing
      if (!this.characterLoader.isProductionAsset && this.characterLoader.diagnosticMeshes) {
        const dMeshes = this.characterLoader.diagnosticMeshes;
        if (dMeshes.leftCalf && dMeshes.rightCalf) {
          const legSwing = (this.isMoving && currentSpeed > 0) ? Math.sin(this.time * (currentSpeed > 40 ? 16 : 10)) * 0.45 : 0;
          dMeshes.leftCalf.rotation.x = legSwing;
          dMeshes.rightCalf.rotation.x = -legSwing;
          if (dMeshes.leftSandal) dMeshes.leftSandal.rotation.x = legSwing * 0.5;
          if (dMeshes.rightSandal) dMeshes.rightSandal.rotation.x = -legSwing * 0.5;
        }

        // Torso bob and lean
        if (dMeshes.torso) {
          const bob = (this.isMoving) ? Math.abs(Math.sin(this.time * 12)) * 0.05 : Math.sin(this.time * 2) * 0.01;
          dMeshes.torso.position.y = 1.2 + bob;
          dMeshes.torso.rotation.x = (this.isMoving) ? (isSprinting ? 0.25 : 0.1) : 0;
        }

        // Angavasthram thundu inertia sway
        if (dMeshes.thundu) {
          dMeshes.thundu.rotation.z = Math.sin(this.time * 8) * 0.08;
        }
      }
    }

    // Apply final group world position
    this.group.position.set(this.x, this.y + this.yOffset, this.z);

    // Dynamic lantern sway and organic flicker
    if (this.lanternGroup && this.lanternLight) {
      const sway = (this.isMoving) ? Math.sin(this.time * 10) * 0.15 : Math.sin(this.time * 2) * 0.03;
      this.lanternGroup.rotation.z = sway;
      const flicker = Math.sin(this.time * 11) * 0.18 + Math.cos(this.time * 19) * 0.12 + (Math.random() - 0.5) * 0.15;
      this.lanternLight.intensity = Math.max(1.8, 2.6 + flicker);
    }
  }

  setPosition(x, z, terrain) {
    this.x = x;
    this.z = z;
    if (terrain && typeof terrain.getElevation === 'function') {
      this.y = terrain.getElevation(this.x, this.z);
    }
    this.group.position.set(this.x, this.y + this.yOffset, this.z);
  }

  getPosition() {
    return {
      x: this.x,
      y: this.y + this.yOffset,
      z: this.z,
      chestY: (this.y + this.yOffset) + 1.35
    };
  }
}

window.ThreePlayer = ThreePlayer;
