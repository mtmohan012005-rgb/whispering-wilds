// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION NPC ENTITY
// Realistic Daily Schedules, Smooth Waypoints, Local GLB Failsafe & Animations
// ============================================================================

class ProductionNPC {
  /**
   * @param {Object} config - NPC definition from npc-production-data.js
   * @param {THREE.Scene} scene - Three.js World Scene
   * @param {Object} terrain - ThreeTerrain procedural elevation reference
   */
  constructor(config, scene, terrain) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.tamilName = config.tamilName;
    this.occupation = config.occupation;
    this.region = config.region;
    this.scene = scene;
    this.terrain = terrain;

    // Transform state
    this.x = config.homeLocation.x;
    this.z = config.homeLocation.z;
    this.y = terrain && typeof terrain.getElevation === 'function' ? terrain.getElevation(this.x, this.z) : 0;
    this.currentRotation = 0;
    this.targetRotation = 0;
    this.moveSpeed = 1.95; // meters per second walking cadence

    // AI & Schedule State
    this.currentState = 'HOME';
    this.currentTaskLabel = '';
    this.targetPosition = new THREE.Vector3(this.x, this.y, this.z);
    this.currentWaypointIndex = 0;
    this.waypointDwellRemaining = 0;

    // Dialogue & Interaction state
    this.isInteracting = false;
    this.interactionTimeout = 0;
    this.preInteractionState = 'HOME';

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
    this.proceduralAvatar = null;
    this.leftLegGroup = null;
    this.rightLegGroup = null;
    this.leftArmGroup = null;
    this.rightArmGroup = null;
    this.headGroup = null;
    this.walkCycle = 0;

    // Build or Load
    this.initModel();
  }

  /**
   * Attempts to load local GLB file from assets/characters/npcs/<name>.glb
   * Failsafe: If missing, logs development warning, does NOT crash, does NOT download from external CDN,
   * does NOT fall back to Xbot.glb. Uses authentic culturally styled procedural silhouette.
   */
  initModel() {
    const modelPath = this.config.modelPath || `assets/characters/npcs/${this.id}.glb`;

    if (typeof THREE.GLTFLoader !== 'undefined') {
      const loader = new THREE.GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          this.onGLBSuccess(gltf);
        },
        undefined, // onProgress
        (error) => {
          // Explicit requirement: Log clear development warning without crashing
          console.warn(`[LivingWorld] Missing local NPC asset: ${modelPath}. Using modular procedural silhouette.`);
          this.buildProceduralSilhouette();
        }
      );
    } else {
      console.warn(`[LivingWorld] GLTFLoader unavailable. Building procedural avatar for ${this.name}.`);
      this.buildProceduralSilhouette();
    }
  }

  onGLBSuccess(gltf) {
    // If procedural avatar was already attached, remove it
    if (this.proceduralAvatar) {
      this.group.remove(this.proceduralAvatar);
      this.proceduralAvatar = null;
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

    // Set up AnimationMixer
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.gltfRoot);
      gltf.animations.forEach((clip) => {
        const name = clip.name.toLowerCase();
        this.animations[name] = this.mixer.clipAction(clip);
      });

      // Start initial idle
      this.playAnimation('idle');
    }

    console.log(`[LivingWorld] Loaded local production NPC GLB: ${this.config.modelPath}`);
  }

  /**
   * Graceful animation play with fallback mapping
   */
  playAnimation(animName) {
    if (!this.mixer) return;

    // Fallback hierarchy if requested clip does not exist in model
    const fallbackMap = {
      work: ['work', 'interact', 'idle'],
      eat: ['eat', 'sit', 'idle'],
      sit: ['sit', 'idle'],
      interact: ['interact', 'talk', 'idle'],
      run: ['run', 'sprint', 'walk', 'idle'],
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
      if (this.currentAction) {
        this.currentAction.fadeOut(0.25);
      }
      targetAction.reset().fadeIn(0.25).play();
      this.currentAction = targetAction;
    }
  }

  /**
   * Builds an authentic, culturally accurate Tamil procedural silhouette
   * matching the NPC's assigned clothingSet (veshti, shirt, thundu, warmwear)
   */
  buildProceduralSilhouette() {
    if (this.proceduralAvatar) return;

    const clothing = CLOTHING_SETS[this.config.clothingSet] || CLOTHING_SETS.everyday_veshti;
    const colors = clothing.colors;

    const root = new THREE.Group();
    this.proceduralAvatar = root;

    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: colors.skin });
    const shirtMat = new THREE.MeshStandardMaterial({ color: colors.shirt, roughness: 0.7 });
    const veshtiMat = new THREE.MeshStandardMaterial({ color: colors.veshti, roughness: 0.8 });
    const accentMat = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4 });
    const sandalMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });

    // Torso / Shirt
    const torsoGeo = new THREE.CylinderGeometry(0.36, 0.42, 1.15, 8);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    root.add(torso);

    // Dhoti / Veshti (or warm trousers)
    const dhotiGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.9, 8);
    const dhoti = new THREE.Mesh(dhotiGeo, veshtiMat);
    dhoti.position.y = 0.65;
    dhoti.castShadow = true;
    root.add(dhoti);

    // Shoulder Thundu (Draped towel / Angavastram)
    const thunduGeo = new THREE.BoxGeometry(0.22, 0.8, 0.35);
    const thundu = new THREE.Mesh(thunduGeo, accentMat);
    thundu.position.set(-0.35, 1.45, 0.05);
    thundu.rotation.z = 0.15;
    root.add(thundu);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 2.15;
    root.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.26, 8, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Headwear based on occupation/clothingSet
    if (this.config.clothingSet === 'village_workwear') {
      // Cotton sun turban towel
      const turbanGeo = new THREE.TorusGeometry(0.28, 0.08, 6, 8);
      const turban = new THREE.Mesh(turbanGeo, accentMat);
      turban.rotation.x = Math.PI / 2;
      turban.position.y = 0.12;
      this.headGroup.add(turban);
    } else if (this.config.clothingSet === 'nilgiri_warmwear') {
      // Woolen cap
      const capGeo = new THREE.SphereGeometry(0.28, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, accentMat);
      cap.position.y = 0.1;
      this.headGroup.add(cap);
    }

    // Left Leg Group
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.2, 0.65, 0);
    root.add(this.leftLegGroup);
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.65, 6);
    const leftLeg = new THREE.Mesh(legGeo, veshtiMat);
    leftLeg.position.y = -0.32;
    this.leftLegGroup.add(leftLeg);
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.32), sandalMat);
    leftFoot.position.set(0, -0.65, 0.08);
    this.leftLegGroup.add(leftFoot);

    // Right Leg Group
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.2, 0.65, 0);
    root.add(this.rightLegGroup);
    const rightLeg = new THREE.Mesh(legGeo, veshtiMat);
    rightLeg.position.y = -0.32;
    this.rightLegGroup.add(rightLeg);
    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.32), sandalMat);
    rightFoot.position.set(0, -0.65, 0.08);
    this.rightLegGroup.add(rightFoot);

    // Left Arm Group
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.48, 1.8, 0);
    root.add(this.leftArmGroup);
    const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.65, 6);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.y = -0.32;
    this.leftArmGroup.add(leftArm);

    // Right Arm Group
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.48, 1.8, 0);
    root.add(this.rightArmGroup);
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.y = -0.32;
    this.rightArmGroup.add(rightArm);

    // Floating Name Banner Billboard
    const nameSprite = this.createNameSprite(`${this.name} (${this.occupation.replace(/_/g, ' ')})`);
    nameSprite.position.y = 2.75;
    root.add(nameSprite);

    this.group.add(root);
  }

  createNameSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(20, 26, 38, 0.85)';
    ctx.roundRect(8, 8, 240, 48, [10]);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.8, 0.7, 1);
    return sprite;
  }

  /**
   * Evaluates the in-game clock (0 - 1440 minutes) against the individual schedule
   */
  evaluateSchedule(worldClockMinutes) {
    if (this.isInteracting) return;

    const schedule = this.config.schedule;
    if (!schedule || schedule.length === 0) return;

    let activeEntry = null;
    for (let i = 0; i < schedule.length; i++) {
      const entry = schedule[i];
      if (worldClockMinutes >= entry.startMinute && worldClockMinutes < entry.endMinute) {
        activeEntry = entry;
        break;
      }
    }

    if (!activeEntry) {
      activeEntry = schedule[0];
    }

    if (this.currentState !== activeEntry.state) {
      this.currentState = activeEntry.state;
      this.currentTaskLabel = activeEntry.label;
      this.onStateTransition(this.currentState);
    }
  }

  onStateTransition(newState) {
    switch (newState) {
      case 'SLEEPING':
      case 'HOME':
        this.targetPosition.set(this.config.homeLocation.x, 0, this.config.homeLocation.z);
        this.playAnimation('idle');
        break;

      case 'WORKING':
        this.targetPosition.set(this.config.workplace.x, 0, this.config.workplace.z);
        this.playAnimation('work');
        break;

      case 'TRAVELING':
      case 'RETURNING_HOME':
        this.advanceToNextWaypoint();
        this.playAnimation('walk');
        break;

      case 'EATING':
      case 'RESTING':
        this.playAnimation('sit');
        break;

      case 'MARKET':
      case 'COMMUNITY':
        this.playAnimation('interact');
        break;

      default:
        this.playAnimation('idle');
        break;
    }
  }

  advanceToNextWaypoint() {
    const route = this.config.route;
    if (!route || route.length === 0) return;

    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % route.length;
    const wp = route[this.currentWaypointIndex];
    this.targetPosition.set(wp.x, 0, wp.z);
    this.waypointDwellRemaining = (wp.dwellMinutes || 10) * 0.5;
  }

  /**
   * Main per-frame update called by LivingWorldSystem
   */
  update(deltaTime, worldClockMinutes, playerPosition, terrain, lodTier = 1) {
    // 1. Evaluate schedule transitions
    this.evaluateSchedule(worldClockMinutes);

    // 2. Interaction countdown if active
    if (this.isInteracting) {
      this.interactionTimeout -= deltaTime;
      if (this.interactionTimeout <= 0) {
        this.endInteraction();
      }
    }

    // 3. Distance-based LOD execution
    if (lodTier === 3) {
      // Tier 3 (Far, > 160m): Low-cost mathematical position drift; mesh culled
      this.group.visible = false;
      this.stepWaypointNavigation(deltaTime, 0.4);
      return;
    }

    // Tier 1 & 2: Mesh visible
    this.group.visible = true;

    // 4. Movement along waypoints
    const isMoving = this.stepWaypointNavigation(deltaTime, 1.0);

    // 5. Update terrain elevation (IK foot grounding)
    if (terrain && typeof terrain.getElevation === 'function') {
      this.y = terrain.getElevation(this.x, this.z);
    }
    this.group.position.set(this.x, this.y, this.z);

    // 6. Smooth rotation heading
    let rotDiff = this.targetRotation - this.currentRotation;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    this.currentRotation += rotDiff * Math.min(1.0, deltaTime * 8.0);
    this.group.rotation.y = this.currentRotation;

    // 7. Update animation
    if (this.mixer) {
      if (isMoving) {
        this.playAnimation('walk');
      } else if (!this.isInteracting && this.currentState === 'WORKING') {
        this.playAnimation('work');
      } else {
        this.playAnimation('idle');
      }
      this.mixer.update(deltaTime);
    } else if (this.proceduralAvatar) {
      // Procedural walking arm/leg pendulum swings
      if (isMoving) {
        this.walkCycle += deltaTime * 8.5;
        const swing = Math.sin(this.walkCycle) * 0.45;
        if (this.leftLegGroup) this.leftLegGroup.rotation.x = swing;
        if (this.rightLegGroup) this.rightLegGroup.rotation.x = -swing;
        if (this.leftArmGroup) this.leftArmGroup.rotation.x = -swing * 0.8;
        if (this.rightArmGroup) this.rightArmGroup.rotation.x = swing * 0.8;
      } else {
        // Return to resting stance
        if (this.leftLegGroup) this.leftLegGroup.rotation.x *= 0.85;
        if (this.rightLegGroup) this.rightLegGroup.rotation.x *= 0.85;
        if (this.leftArmGroup) this.leftArmGroup.rotation.x *= 0.85;
        if (this.rightArmGroup) this.rightArmGroup.rotation.x *= 0.85;
      }
    }
  }

  /**
   * Smooth waypoint movement without teleporting
   */
  stepWaypointNavigation(deltaTime, speedMultiplier = 1.0) {
    if (this.isInteracting) return false;
    if (this.currentState === 'SLEEPING') return false;

    const dx = this.targetPosition.x - this.x;
    const dz = this.targetPosition.z - this.z;
    const distToTarget = Math.hypot(dx, dz);

    if (distToTarget > 0.45) {
      // Turn towards target
      this.targetRotation = Math.atan2(dx, dz);

      // Translate forward smoothly
      const step = Math.min(distToTarget, this.moveSpeed * speedMultiplier * deltaTime);
      this.x += (dx / distToTarget) * step;
      this.z += (dz / distToTarget) * step;
      return true;
    } else {
      // Arrived at waypoint
      if (this.currentState === 'TRAVELING' || this.currentState === 'RETURNING_HOME') {
        this.advanceToNextWaypoint();
      }
      return false;
    }
  }

  /**
   * Player proximity check
   */
  isPlayerNearby(playerPos, maxDist = 3.5) {
    if (!playerPos) return false;
    const d = Math.hypot(this.x - playerPos.x, this.z - playerPos.z);
    return d <= maxDist;
  }

  /**
   * Interacts with player: faces player, pauses schedule, returns authentic bilingual dialogue
   */
  interact(playerPos) {
    this.isInteracting = true;
    this.interactionTimeout = 8.0; // 8 seconds of attention before resuming
    this.preInteractionState = this.currentState;
    this.currentState = 'TALKING';

    // Face player
    if (playerPos) {
      const dx = playerPos.x - this.x;
      const dz = playerPos.z - this.z;
      this.targetRotation = Math.atan2(dx, dz);
    }

    this.playAnimation('interact');

    // Select contextual dialogue
    let textPair = this.config.dialogue.greeting;
    if (this.preInteractionState === 'WORKING') {
      textPair = this.config.dialogue.work || this.config.dialogue.greeting;
    } else if (this.preInteractionState === 'SLEEPING' || this.preInteractionState === 'RETURNING_HOME') {
      textPair = this.config.dialogue.night || this.config.dialogue.greeting;
    }

    return {
      id: this.id,
      name: this.name,
      tamilName: this.tamilName,
      occupation: this.occupation,
      region: this.region,
      state: this.currentState,
      dialogue: textPair,
      questHooks: this.config.questHooks || []
    };
  }

  endInteraction() {
    this.isInteracting = false;
    this.currentState = this.preInteractionState;
    this.onStateTransition(this.currentState);
  }
}

// Global browser and module exports
if (typeof window !== 'undefined') {
  window.ProductionNPC = ProductionNPC;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProductionNPC };
}
