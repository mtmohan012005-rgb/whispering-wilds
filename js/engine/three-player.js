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
    this.velocityX = 0;
    this.velocityZ = 0;
    this.currentSpeed = 0;
    this.slopeFactor = 1.0;

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

    // Custom Animation State Machine & Procedural Bone Blending
    this.animSystem = (typeof window.CustomAnimationSystem !== 'undefined')
      ? new window.CustomAnimationSystem(this, this.characterLoader)
      : null;

    // Trigger local GLB character load
    this.characterLoader.loadPlayerCharacter().then((res) => {
      if (res.isProductionAsset) {
        console.log('[ThreePlayer] Rigged production GLB character loaded into scene.');
      } else {
        console.log('[ThreePlayer] Diagnostic Tamil explorer proxy active awaiting production GLB.');
      }
      if (this.animSystem && this.characterLoader.characterGroup) {
        this.animSystem.bindSkeleton(this.characterLoader.characterGroup);
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

    // Crafted bamboo torch: a wider, warmer light than the brass lantern.
    // Hidden by default; CraftingSystem enables it when a torch is carried.
    this.torchGroup = new THREE.Group();
    this.torchGroup.position.set(0.32, 0.10, -0.18);
    this.torchGroup.visible = false;
    this.group.add(this.torchGroup);

    this.torchLight = new THREE.PointLight(0xff7a2a, 0.0, 30, 1.7);
    this.torchLight.castShadow = false; // budget: lantern already pays for shadows
    this.torchGroup.add(this.torchLight);

    const torchHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffa64d })
    );
    this.torchGroup.add(torchHead);
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

  update(inputState, deltaTime, terrain, cameraController) {
    this.time += deltaTime;

    // Handle action lock (e.g. interacting, taking a photo)
    if (this.actionLockTimer > 0) {
      this.actionLockTimer -= deltaTime;
      if (this.characterLoader) this.characterLoader.update(deltaTime);
      this.group.position.set(this.x, this.y + this.yOffset, this.z);
      return;
    }

    // Skip standard ground locomotion if player is actively climbing an authored surface
    if (window.traversalSystem && window.traversalSystem.isClimbing) {
      if (this.characterLoader) this.characterLoader.update(deltaTime);
      return;
    }

    // 1. Camera-relative movement input calculation
    let rawForward = 0;
    let rawRight = 0;
    if (inputState.up) rawForward += 1;
    if (inputState.down) rawForward -= 1;
    if (inputState.left) rawRight -= 1;
    if (inputState.right) rawRight += 1;

    let moveDirX = 0;
    let moveDirZ = 0;
    const inputMag = Math.sqrt(rawForward * rawForward + rawRight * rawRight);

    if (inputMag > 0) {
      const normForward = rawForward / inputMag;
      const normRight = rawRight / inputMag;

      if (cameraController && cameraController.camera) {
        const cam = cameraController.camera;
        const fwdX = this.x - cam.position.x;
        const fwdZ = this.z - cam.position.z;
        const fwdLen = Math.sqrt(fwdX * fwdX + fwdZ * fwdZ);

        let camFwdX = 0;
        let camFwdZ = -1;
        if (fwdLen > 0.001) {
          camFwdX = fwdX / fwdLen;
          camFwdZ = fwdZ / fwdLen;
        }
        const camRightX = -camFwdZ;
        const camRightZ = camFwdX;

        moveDirX = camFwdX * normForward + camRightX * normRight;
        moveDirZ = camFwdZ * normForward + camRightZ * normRight;
      } else {
        moveDirX = normRight;
        moveDirZ = -normForward;
      }

      const moveLen = Math.sqrt(moveDirX * moveDirX + moveDirZ * moveDirZ);
      if (moveLen > 0.001) {
        moveDirX /= moveLen;
        moveDirZ /= moveLen;
      }
    }

    // Input modifiers
    const isExhausted = !!(window.GameState && window.GameState.player && window.GameState.player.survival && window.GameState.player.survival.isExhausted);
    const isSprinting = !isExhausted && !!(inputState.sprint || inputState.shift);
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
    }

    // Ground Locomotion Target Speed Selection
    let targetSpeed = 0;
    let targetClip = 'Player_Idle';

    if (this.isGrounded && this.landTimer <= 0) {
      if (window.traversalSystem && window.traversalSystem.isSwimming) {
        this.state = window.PLAYER_STATE.SWIM;
        targetSpeed = this.speeds.walk * 0.48;
        targetClip = 'Player_Swim';
      } else if (isCrouching) {
        if (inputMag > 0) {
          this.state = window.PLAYER_STATE.CROUCH_WALK;
          targetSpeed = this.speeds.crouch;
          targetClip = 'Player_Crouch_Walk';
        } else {
          this.state = window.PLAYER_STATE.CROUCH_IDLE;
          targetSpeed = 0;
          targetClip = 'Player_Crouch_Idle';
        }
      } else if (inputMag > 0) {
        if (isSprinting) {
          this.state = window.PLAYER_STATE.SPRINT;
          targetSpeed = this.speeds.sprint;
          targetClip = 'Player_Sprint';
        } else if (isWalking) {
          this.state = window.PLAYER_STATE.WALK;
          targetSpeed = this.speeds.walk;
          targetClip = 'Player_Walk';
        } else {
          this.state = window.PLAYER_STATE.RUN;
          targetSpeed = this.speeds.run;
          targetClip = 'Player_Run';
        }
      } else {
        this.state = window.PLAYER_STATE.IDLE;
        targetSpeed = 0;
        targetClip = 'Player_Idle';
      }

      if (this.characterLoader) {
        this.characterLoader.playAction(targetClip, 0.2);
      }
    }

    // Slope resistance & assistance (grounded incline dynamics)
    this.slopeFactor = 1.0;
    if (terrain && typeof terrain.getElevation === 'function' && inputMag > 0) {
      const curElev = terrain.getElevation(this.x, this.z);
      const nextElev = terrain.getElevation(this.x + moveDirX * 1.5, this.z + moveDirZ * 1.5);
      const elevDiff = nextElev - curElev;
      if (elevDiff > 0.35) {
        this.slopeFactor = Math.max(0.4, 1.0 - (elevDiff - 0.35) * 0.9);
      } else if (elevDiff < -0.35) {
        this.slopeFactor = Math.min(1.2, 1.0 + Math.abs(elevDiff) * 0.25);
      }
    }
    const finalTargetSpeed = targetSpeed * this.slopeFactor;

    // Smooth Velocity Inertia & Acceleration/Deceleration Damping (No foot sliding)
    const targetVx = inputMag > 0 ? (moveDirX * finalTargetSpeed) : 0;
    const targetVz = inputMag > 0 ? (moveDirZ * finalTargetSpeed) : 0;
    const accelRate = (inputMag > 0) ? 14.0 : 18.0;
    const damp = Math.min(1.0, deltaTime * accelRate);
    this.velocityX += (targetVx - this.velocityX) * damp;
    this.velocityZ += (targetVz - this.velocityZ) * damp;

    this.currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityZ * this.velocityZ);

    if (this.currentSpeed < 0.12) {
      this.currentSpeed = 0;
      this.velocityX = 0;
      this.velocityZ = 0;
      this.isMoving = false;
      if (this.characterLoader && typeof this.characterLoader.setTimeScale === 'function') {
        this.characterLoader.setTimeScale(1.0);
      }
    } else {
      this.isMoving = true;
      this.targetRotation = Math.atan2(this.velocityX, this.velocityZ);

      // Dynamically scale animation timeScale to eliminate foot sliding
      if (this.characterLoader && typeof this.characterLoader.setTimeScale === 'function') {
        let nominalSpeed = this.speeds.run;
        if (this.state === window.PLAYER_STATE.WALK) nominalSpeed = this.speeds.walk;
        else if (this.state === window.PLAYER_STATE.SPRINT) nominalSpeed = this.speeds.sprint;
        else if (this.state === window.PLAYER_STATE.CROUCH_WALK) nominalSpeed = this.speeds.crouch;

        const cadenceScale = nominalSpeed > 0 ? (this.currentSpeed / nominalSpeed) : 1.0;
        this.characterLoader.setTimeScale(cadenceScale);
      }
    }

    // Apply horizontal translation
    if (this.currentSpeed > 0) {
      this.x += this.velocityX * deltaTime;
      this.z += this.velocityZ * deltaTime;

      // Obstacle collision resolution
      if (window.productionWorldAssets && typeof window.productionWorldAssets.resolveCollision === 'function') {
        const colResult = window.productionWorldAssets.resolveCollision(this.x, this.z, 0.65);
        this.x = colResult.x;
        this.z = colResult.z;
      }
      if (window.worldCollision && typeof window.worldCollision.resolveCircle === 'function') {
        const wCol = window.worldCollision.resolveCircle(this.x, this.z, this.x, this.z, 0.65);
        this.x = wCol.x;
        this.z = wCol.z;
      }
    }

    // World bounds clamp
    this.x = Math.max(-290, Math.min(290, this.x));
    this.z = Math.max(-100, Math.min(100, this.z));

    // Smooth rotation interpolation
    let rotDiff = this.targetRotation - this.currentRotation;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    this.currentRotation += rotDiff * Math.min(1.0, deltaTime * 12.0);
    this.avatarMesh.rotation.y = this.currentRotation;

    // Terrain elevation alignment & ledge fall detection
    let targetTerrainY = 0;
    if (terrain && typeof terrain.getElevation === 'function') {
      targetTerrainY = terrain.getElevation(this.x, this.z);
    } else if (terrain && typeof terrain.getInterpolatedHeight === 'function') {
      targetTerrainY = terrain.getInterpolatedHeight(this.x, this.z);
    }

    if (this.isGrounded) {
      // Stepped off a ledge or cliff
      if (this.y - targetTerrainY > 0.65 && this.yOffset <= 0) {
        this.isGrounded = false;
        this.verticalVelocity = -2.0;
        this.yOffset = this.y - targetTerrainY;
        this.state = window.PLAYER_STATE.FALL;
        if (this.characterLoader) this.characterLoader.playAction('Player_Fall', 0.2);
      } else {
        // Grounded: smoothly adapt to elevation
        this.y += (targetTerrainY - this.y) * Math.min(1.0, deltaTime * 18.0);
      }
    } else {
      // Airborne simulation
      this.verticalVelocity -= gravity * deltaTime;
      this.yOffset += this.verticalVelocity * deltaTime;

      if (this.verticalVelocity < 0 && this.state !== window.PLAYER_STATE.FALL) {
        this.state = window.PLAYER_STATE.FALL;
        if (this.characterLoader) this.characterLoader.playAction('Player_Fall', 0.2);
      }

      if (this.yOffset <= 0) {
        const impactVelocity = Math.abs(this.verticalVelocity);
        this.yOffset = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.y = targetTerrainY;
        this.state = window.PLAYER_STATE.LAND;
        this.landTimer = 0.16;
        if (this.characterLoader) this.characterLoader.playAction('Player_Land', 0.1);

        if (window.emergencySystem && typeof window.emergencySystem.handleFallDamage === 'function') {
          window.emergencySystem.handleFallDamage(impactVelocity);
        }
      }
    }

    // Land recovery timer
    if (this.isGrounded && this.landTimer > 0) {
      this.landTimer -= deltaTime;
    }

    // Synchronize Authoritative Movement State for Survival Calculations (Section 6 & 7)
    if (window.GameState && window.GameState.player) {
      window.GameState.player.movementState = this.state;
    }

    // Update Character Loader mixer & biomechanics
    if (this.characterLoader) {
      this.characterLoader.update(deltaTime);

      // Procedural biomechanics on diagnostic proxy when real GLB is missing
      if (!this.characterLoader.isProductionAsset && this.characterLoader.diagnosticMeshes) {
        const dm = this.characterLoader.diagnosticMeshes;
        const speedFactor = this.currentSpeed > 0 ? Math.min(this.currentSpeed / this.speeds.sprint, 1.0) : 0;
        const cadence = this.isMoving ? (10 + speedFactor * 8) : 2; // Hz
        const phase = this.time * cadence;

        // ── LEG SWING (pivot-based, natural gait) ──────────────────
        if (dm.leftLegPivot && dm.rightLegPivot) {
          const legAmplitude = this.isMoving ? (0.3 + speedFactor * 0.5) : 0;
          dm.leftLegPivot.rotation.x = Math.sin(phase) * legAmplitude;
          dm.rightLegPivot.rotation.x = Math.sin(phase + Math.PI) * legAmplitude;
        }

        // ── ARM SWING (opposite to legs, natural counter-balance) ──
        if (dm.leftArmPivot && dm.rightArmPivot) {
          const armAmplitude = this.isMoving ? (0.25 + speedFactor * 0.45) : 0;
          // Arms swing opposite to legs
          dm.leftArmPivot.rotation.x = Math.sin(phase + Math.PI) * armAmplitude;
          dm.rightArmPivot.rotation.x = Math.sin(phase) * armAmplitude;

          // Elbow bend during forward swing
          if (dm.leftElbowPivot && dm.rightElbowPivot) {
            const elbowBend = this.isMoving ? 0.3 + speedFactor * 0.3 : 0.1;
            dm.leftElbowPivot.rotation.x = -elbowBend - Math.max(0, Math.sin(phase + Math.PI)) * 0.3;
            dm.rightElbowPivot.rotation.x = -elbowBend - Math.max(0, Math.sin(phase)) * 0.3;
          }
        }

        // ── TORSO bob, lean, and breathing ──────────────────────────
        if (dm.torso) {
          const bob = this.isMoving
            ? Math.abs(Math.sin(phase * 2)) * 0.04 * speedFactor
            : Math.sin(this.time * 1.5) * 0.008; // idle breathing
          dm.torso.position.y = 1.15 + bob;
          dm.torso.rotation.x = this.isMoving ? (0.05 + speedFactor * 0.18) : 0;
          // Slight lateral sway during walk
          dm.torso.rotation.z = this.isMoving ? Math.sin(phase) * 0.03 : 0;
        }

        // ── HEAD (subtle nod, look direction) ──────────────────────
        if (dm.head) {
          dm.head.position.y = 1.62 + (this.isMoving ? Math.abs(Math.sin(phase * 2)) * 0.02 : Math.sin(this.time * 1.5) * 0.005);
          dm.head.rotation.x = this.isMoving ? -0.05 : Math.sin(this.time * 0.7) * 0.02;
        }

        // ── THUNDU (angavasthram cloth inertia sway) ───────────────
        if (dm.thundu) {
          dm.thundu.rotation.z = 0.15 + Math.sin(phase * 0.8) * (this.isMoving ? 0.12 : 0.03);
          dm.thundu.rotation.x = this.isMoving ? Math.sin(phase) * 0.06 : 0;
        }

        // ── SATCHEL (bag sway with movement) ───────────────────────
        if (dm.satchel) {
          dm.satchel.rotation.z = -0.1 + (this.isMoving ? Math.sin(phase * 0.9) * 0.08 : 0);
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

    // Crafted torch: lit only at night, and only while carried.
    if (this.torchLight && this.torchGroup) {
      const cs = window.CraftingSystem;
      const bonus = (cs && typeof cs.getActiveEffects === 'function')
        ? cs.getActiveEffects().nightLightBonus
        : 0;
      const clock = window.GameClock;
      const isNight = clock ? !!clock.isNight : false;
      const lit = isNight && bonus > 0;

      this.torchGroup.visible = lit;
      if (lit) {
        const tflicker = Math.sin(this.time * 13) * 0.30 + Math.cos(this.time * 23) * 0.18 + (Math.random() - 0.5) * 0.22;
        this.torchLight.intensity = Math.max(1.2, 2.2 * bonus + tflicker);
        this.torchGroup.rotation.z = this.isMoving ? Math.sin(this.time * 9) * 0.22 : 0.04;
      }
    }

    // ── CUSTOM ANIMATION SYSTEM & GAIT CADENCE ─────────────────
    if (this.animSystem) {
      this.animSystem.transitionTo(this.state);
      this.animSystem.update(deltaTime, this.currentSpeed, this.currentRotation, this.slopeFactor);
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
