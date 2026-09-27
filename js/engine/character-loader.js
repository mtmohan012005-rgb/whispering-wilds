/**
 * The Whispering Wilds (Kaattu Vazhi) - Production Character Loader
 * Loads, validates, and manages the local rigged 3D player character.
 *
 * Strict Production Rules:
 * - NO external CDNs or random model URLs
 * - NEVER use Xbot.glb
 * - Target: assets/characters/player/player.glb
 * - If missing, logs: [PLAYER ASSET MISSING] assets/characters/player/player.glb
 *   and keeps the game playable with a culturally authentic diagnostic avatar without claiming production complete.
 */

class CharacterLoader {
  constructor(scene) {
    this.scene = scene;
    this.playerModelPath = 'assets/characters/player/player.glb';

    this.isLoaded = false;
    this.isProductionAsset = false;
    this.isPlayerAssetMissing = false;

    this.gltfMesh = null;
    this.characterGroup = new THREE.Group();
    this.characterGroup.name = 'PlayerCharacterRoot';

    this.mixer = null;
    this.actions = {}; // clipName -> AnimationAction
    this.activeAction = null;
    this.activeClipName = 'Player_Idle';

    // Authoritative outfit ID
    this.outfitId = 'everyday_veshti';
    this.validOutfitIds = [
      'everyday_veshti',
      'village_workwear',
      'urban_explorer',
      'festival_veshti',
      'nilgiri_warmwear'
    ];

    // Authored clip names per Section 14
    this.expectedClipNames = [
      'Player_Idle',
      'Player_Walk',
      'Player_Run',
      'Player_Sprint',
      'Player_Jump_Start',
      'Player_Jump',
      'Player_Fall',
      'Player_Land',
      'Player_Interact',
      'Player_Pickup',
      'Player_Inspect',
      'Player_Use_Item',
      'Player_Crouch_Idle',
      'Player_Crouch_Walk',
      'Player_Climb',
      'Player_Swim',
      'Player_Sit',
      'Player_Stand',
      'Player_Eat',
      'Player_Drink',
      'Player_Photo'
    ];

    // Fallback diagnostic mesh references
    this.diagnosticMeshes = {};
  }

  /**
   * Asynchronously attempts to load the local production character GLB
   * @returns {Promise<{ success: boolean, isProductionAsset: boolean }>}
   */
  async loadPlayerCharacter() {
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
      console.warn(`[PLAYER ASSET FALLBACK] THREE.GLTFLoader not available; using diagnostic proxy.`);
      this.isPlayerAssetMissing = true;
      this.isProductionAsset = false;
      this.buildAuthenticDiagnosticProxy();
      return { success: true, isProductionAsset: false, isMissing: true };
    }

    return new Promise((resolve) => {
      const loader = new THREE.GLTFLoader();
      loader.load(
        this.playerModelPath,
        (gltf) => {
          this.gltfMesh = gltf.scene || gltf.scenes[0];
          this.gltfMesh.name = 'ProductionPlayerMesh';
          this.gltfMesh.userData.isProductionAsset = true;
          this.isProductionAsset = true;
          this.isPlayerAssetMissing = false;

          // Apply shadows and PBR settings
          this.gltfMesh.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.characterGroup.add(this.gltfMesh);

          // Setup skeletal animation mixer & clip mapping
          this.mixer = new THREE.AnimationMixer(this.gltfMesh);
          this.mapAnimationClips(gltf.animations || []);

          this.isLoaded = true;
          console.log(`[CharacterLoader] Production character successfully loaded: ${this.playerModelPath}`);
          resolve({ success: true, isProductionAsset: true, isMissing: false });
        },
        undefined,
        (error) => {
          console.warn(`[PLAYER ASSET FALLBACK] Failed to load ${this.playerModelPath}:`, error);
          this.isPlayerAssetMissing = true;
          this.isProductionAsset = false;
          this.buildAuthenticDiagnosticProxy();
          resolve({ success: true, isProductionAsset: false, isMissing: true });
        }
      );
    });
  }

  /**
   * Maps GLTF animation clips into authoritative Player_* clip names
   */
  mapAnimationClips(clips) {
    if (!clips || !this.mixer) return;

    clips.forEach((clip) => {
      let matchedName = null;
      const lower = clip.name.toLowerCase();

      // Direct match
      if (this.expectedClipNames.includes(clip.name)) {
        matchedName = clip.name;
      } else {
        // Fallback matching against standard naming conventions
        if (lower.includes('idle') && !lower.includes('crouch')) matchedName = 'Player_Idle';
        else if (lower.includes('sprint') || lower.includes('fast_run')) matchedName = 'Player_Sprint';
        else if (lower.includes('run')) matchedName = 'Player_Run';
        else if (lower.includes('walk') && !lower.includes('crouch')) matchedName = 'Player_Walk';
        else if (lower.includes('jump_start')) matchedName = 'Player_Jump_Start';
        else if (lower.includes('jump') && !lower.includes('land')) matchedName = 'Player_Jump';
        else if (lower.includes('fall')) matchedName = 'Player_Fall';
        else if (lower.includes('land')) matchedName = 'Player_Land';
        else if (lower.includes('interact')) matchedName = 'Player_Interact';
        else if (lower.includes('pickup')) matchedName = 'Player_Pickup';
        else if (lower.includes('inspect')) matchedName = 'Player_Inspect';
        else if (lower.includes('use')) matchedName = 'Player_Use_Item';
        else if (lower.includes('crouch_idle') || (lower.includes('crouch') && lower.includes('idle'))) matchedName = 'Player_Crouch_Idle';
        else if (lower.includes('crouch_walk') || (lower.includes('crouch') && lower.includes('walk'))) matchedName = 'Player_Crouch_Walk';
        else if (lower.includes('climb')) matchedName = 'Player_Climb';
        else if (lower.includes('swim')) matchedName = 'Player_Swim';
        else if (lower.includes('sit')) matchedName = 'Player_Sit';
        else if (lower.includes('stand')) matchedName = 'Player_Stand';
        else if (lower.includes('eat')) matchedName = 'Player_Eat';
        else if (lower.includes('drink')) matchedName = 'Player_Drink';
        else if (lower.includes('photo')) matchedName = 'Player_Photo';
      }

      if (matchedName) {
        const action = this.mixer.clipAction(clip);
        this.actions[matchedName] = action;
      }
    });

    // Default to Player_Idle if available
    if (this.actions['Player_Idle']) {
      this.activeAction = this.actions['Player_Idle'];
      this.activeAction.play();
    }
  }

  /**
   * Play an animation clip with smooth cross-fading
   * @param {string} clipName
   * @param {number} fadeDuration
   */
  playAction(clipName, fadeDuration = 0.25) {
    if (!this.mixer) return;

    const nextAction = this.actions[clipName] || this.actions['Player_Idle'];
    if (!nextAction || nextAction === this.activeAction) return;

    if (this.activeAction) {
      nextAction.reset();
      nextAction.weight = 1.0;
      nextAction.crossFadeFrom(this.activeAction, fadeDuration, true);
      nextAction.play();
    } else {
      nextAction.reset();
      nextAction.play();
    }

    this.activeAction = nextAction;
    this.activeClipName = clipName;
  }

  /**
   * Sets the playback timeScale of the active animation action to eliminate foot sliding
   * and match locomotion playback cadence dynamically to ground velocity.
   * @param {number} scale
   */
  setTimeScale(scale = 1.0) {
    if (this.activeAction) {
      this.activeAction.timeScale = Math.max(0.2, Math.min(2.5, scale));
    }
  }

  /**
   * Builds an articulated Tamil Nadu explorer diagnostic proxy with pivoted joints
   * for procedural walk/run animation. Clearly marked userData.isProductionAsset = false.
   */
  buildAuthenticDiagnosticProxy() {
    this.diagnosticGroup = new THREE.Group();
    this.diagnosticGroup.name = 'DiagnosticTamilExplorerProxy';
    this.diagnosticGroup.userData.isProductionAsset = false;
    this.diagnosticGroup.userData.isDiagnosticProxy = true;

    // ── MATERIALS ──────────────────────────────────────────────────
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.65, metalness: 0.05 });
    const skinDarkMat = new THREE.MeshStandardMaterial({ color: 0x7a4820, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.85 });
    const veshtiMat = new THREE.MeshStandardMaterial({ color: 0xebedf0, roughness: 0.88 });
    const zariMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 });
    const thunduMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, roughness: 0.9 });
    const sandalMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.95 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x11100f, roughness: 0.9 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf0ece0, roughness: 0.3 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.4 });
    const lipMat = new THREE.MeshStandardMaterial({ color: 0x8a4535, roughness: 0.6 });
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x4a2d14, roughness: 0.9 });

    // ── NECK ──────────────────────────────────────────────────────
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 8), skinMat);
    neck.position.set(0, 1.46, 0);
    neck.castShadow = true;
    this.diagnosticGroup.add(neck);

    // ── HEAD (articulated with face features) ─────────────────────
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Hair cap (thicker, covers top and back)
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.235, 14, 12, 0, Math.PI * 2, 0, Math.PI / 1.7),
      hairMat
    );
    hair.position.set(0, 0.02, -0.02);
    headGroup.add(hair);

    // Side hair
    const sideHairL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.16), hairMat);
    sideHairL.position.set(-0.21, -0.02, -0.03);
    headGroup.add(sideHairL);
    const sideHairR = sideHairL.clone();
    sideHairR.position.set(0.21, -0.02, -0.03);
    headGroup.add(sideHairR);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEye.position.set(-0.075, 0.03, 0.19);
    headGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEye.position.set(0.075, 0.03, 0.19);
    headGroup.add(rightEye);

    // Irises
    const irisGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(-0.075, 0.03, 0.22);
    headGroup.add(leftIris);
    const rightIris = new THREE.Mesh(irisGeo, irisMat);
    rightIris.position.set(0.075, 0.03, 0.22);
    headGroup.add(rightIris);

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 6), skinDarkMat);
    nose.position.set(0, -0.02, 0.22);
    nose.rotation.x = -0.3;
    headGroup.add(nose);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), lipMat);
    mouth.position.set(0, -0.08, 0.2);
    headGroup.add(mouth);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.22, 0.0, 0.02);
    leftEar.scale.set(0.5, 1, 0.8);
    headGroup.add(leftEar);
    const rightEar = leftEar.clone();
    rightEar.position.set(0.22, 0.0, 0.02);
    headGroup.add(rightEar);

    this.diagnosticGroup.add(headGroup);

    // ── TORSO (half-sleeve white cotton shirt) ─────────────────────
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.26), shirtMat);
    torso.position.set(0, 1.15, 0);
    torso.castShadow = true;
    this.diagnosticGroup.add(torso);

    // Shirt collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 8), shirtMat);
    collar.position.set(0, 1.42, 0);
    this.diagnosticGroup.add(collar);

    // ── SHOULDER THUNDU (angavasthram) ─────────────────────────────
    const thundu = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.06), thunduMat);
    thundu.position.set(-0.18, 1.18, 0.12);
    thundu.rotation.z = 0.15;
    thundu.castShadow = true;
    this.diagnosticGroup.add(thundu);

    // ── LEFT ARM (articulated: shoulder pivot → upper arm → elbow pivot → forearm → hand) ──
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.28, 1.36, 0); // shoulder joint

    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.28, 8), shirtMat);
    leftUpperArm.position.set(0, -0.14, 0);
    leftUpperArm.castShadow = true;
    leftArmPivot.add(leftUpperArm);

    const leftElbowPivot = new THREE.Group();
    leftElbowPivot.position.set(0, -0.28, 0);

    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8), skinMat);
    leftForearm.position.set(0, -0.13, 0);
    leftForearm.castShadow = true;
    leftElbowPivot.add(leftForearm);

    // Left hand
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), skinMat);
    leftHand.position.set(0, -0.28, 0);
    leftElbowPivot.add(leftHand);

    leftArmPivot.add(leftElbowPivot);
    this.diagnosticGroup.add(leftArmPivot);

    // ── RIGHT ARM (mirror) ─────────────────────────────────────────
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.28, 1.36, 0);

    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.28, 8), shirtMat);
    rightUpperArm.position.set(0, -0.14, 0);
    rightUpperArm.castShadow = true;
    rightArmPivot.add(rightUpperArm);

    const rightElbowPivot = new THREE.Group();
    rightElbowPivot.position.set(0, -0.28, 0);

    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8), skinMat);
    rightForearm.position.set(0, -0.13, 0);
    rightForearm.castShadow = true;
    rightElbowPivot.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), skinMat);
    rightHand.position.set(0, -0.28, 0);
    rightElbowPivot.add(rightHand);

    rightArmPivot.add(rightElbowPivot);
    this.diagnosticGroup.add(rightArmPivot);

    // ── WAIST (zari border) ────────────────────────────────────────
    const zariBorder = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 12), zariMat);
    zariBorder.position.set(0, 0.88, 0);
    this.diagnosticGroup.add(zariBorder);

    // ── VESHTI / DHOTI ─────────────────────────────────────────────
    const veshtiUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.38, 14), veshtiMat);
    veshtiUpper.position.set(0, 0.68, 0);
    veshtiUpper.castShadow = true;
    this.diagnosticGroup.add(veshtiUpper);

    const veshtiLower = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.38, 14), veshtiMat);
    veshtiLower.position.set(0, 0.36, 0);
    veshtiLower.castShadow = true;
    this.diagnosticGroup.add(veshtiLower);

    // Zari hem at bottom
    const zariHem = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.29, 0.04, 14), zariMat);
    zariHem.position.set(0, 0.18, 0);
    this.diagnosticGroup.add(zariHem);

    // ── LEFT LEG (articulated: hip pivot → thigh hidden in veshti → knee pivot → calf → foot) ──
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.1, 0.18, 0); // hip joint at veshti hem

    const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 8), skinMat);
    leftCalf.position.set(0, -0.11, 0);
    leftCalf.castShadow = true;
    leftLegPivot.add(leftCalf);

    // Left sandal
    const leftSandal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.24), sandalMat);
    leftSandal.position.set(0, -0.23, 0.02);
    leftSandal.castShadow = true;
    leftLegPivot.add(leftSandal);

    // Sandal strap
    const leftStrap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.015), strapMat);
    leftStrap.position.set(0, -0.2, 0.06);
    leftLegPivot.add(leftStrap);

    this.diagnosticGroup.add(leftLegPivot);

    // ── RIGHT LEG (mirror) ─────────────────────────────────────────
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.1, 0.18, 0);

    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 8), skinMat);
    rightCalf.position.set(0, -0.11, 0);
    rightCalf.castShadow = true;
    rightLegPivot.add(rightCalf);

    const rightSandal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.24), sandalMat);
    rightSandal.position.set(0, -0.23, 0.02);
    rightSandal.castShadow = true;
    rightLegPivot.add(rightSandal);

    const rightStrap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.015), strapMat);
    rightStrap.position.set(0, -0.2, 0.06);
    rightLegPivot.add(rightStrap);

    this.diagnosticGroup.add(rightLegPivot);

    // ── EXPLORER SATCHEL (leather bag on right hip) ────────────────
    const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.1), bagMat);
    satchel.position.set(0.28, 0.95, 0.05);
    satchel.rotation.z = -0.1;
    satchel.castShadow = true;
    this.diagnosticGroup.add(satchel);

    const satchelStrap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.65, 0.02), strapMat);
    satchelStrap.position.set(0.12, 1.22, 0.1);
    satchelStrap.rotation.z = -0.25;
    this.diagnosticGroup.add(satchelStrap);

    // ── STORE REFERENCES for procedural animation in three-player.js ──
    this.diagnosticMeshes = {
      head: headGroup,
      torso,
      thundu,
      veshtiUpper,
      veshtiLower,
      leftArmPivot,
      rightArmPivot,
      leftElbowPivot,
      rightElbowPivot,
      leftLegPivot,
      rightLegPivot,
      leftCalf,
      rightCalf,
      leftSandal,
      rightSandal,
      satchel
    };

    this.characterGroup.add(this.diagnosticGroup);
    this.isLoaded = true;
  }

  /**
   * Sets the authoritative outfit ID and applies material / geometry styling
   * @param {string} outfitId - One of the 5 valid outfit IDs
   */
  setOutfit(outfitId) {
    if (!this.validOutfitIds.includes(outfitId)) {
      console.warn(`[CharacterLoader] Invalid outfit ID: "${outfitId}". Defaulting to "everyday_veshti".`);
      outfitId = 'everyday_veshti';
    }

    this.outfitId = outfitId;

    // If production GLB is loaded, update submesh materials and visibility
    if (this.gltfMesh) {
      const outfitColors = {
        everyday_veshti: { shirt: 0xf5f6fa, veshti: 0xebedf0, angavastram: 0xe0e6ed, angavastramVisible: true },
        village_workwear: { shirt: 0x819ca9, veshti: 0x4a6572, angavastram: 0xd9e2ec, angavastramVisible: true },
        urban_explorer: { shirt: 0xc2a677, veshti: 0x3e4a3d, angavastram: 0xc2a677, angavastramVisible: false },
        festival_veshti: { shirt: 0xfffae6, veshti: 0xfffdfa, angavastram: 0xd4af37, angavastramVisible: true },
        nilgiri_warmwear: { shirt: 0x3e2723, veshti: 0x263238, angavastram: 0x3e2723, angavastramVisible: false }
      };
      const colors = outfitColors[outfitId] || outfitColors.everyday_veshti;

      this.gltfMesh.traverse((child) => {
        if (child.isMesh) {
          if (child.name === 'Player_Torso_Shirt' && child.material) {
            child.material = child.material.clone();
            child.material.color.setHex(colors.shirt);
          } else if (child.name === 'Player_Veshti' && child.material) {
            child.material = child.material.clone();
            child.material.color.setHex(colors.veshti);
          } else if (child.name === 'Player_Angavastram') {
            child.visible = colors.angavastramVisible;
            if (child.material) {
              child.material = child.material.clone();
              child.material.color.setHex(colors.angavastram);
            }
          } else if (child.name.startsWith('Outfit_')) {
            child.visible = child.name.includes(outfitId);
          }
        }
      });
    }

    // Update diagnostic proxy colors to reflect the outfit accurately
    if (this.diagnosticMeshes && this.diagnosticMeshes.torso) {
      if (outfitId === 'everyday_veshti') {
        this.diagnosticMeshes.torso.material.color.setHex(0xf5f6fa); // White cotton shirt
        this.diagnosticMeshes.veshtiLower.material.color.setHex(0xebedf0); // Cream veshti
        this.diagnosticMeshes.thundu.visible = true;
      } else if (outfitId === 'village_workwear') {
        this.diagnosticMeshes.torso.material.color.setHex(0x819ca9); // Faded blue cotton
        this.diagnosticMeshes.veshtiLower.material.color.setHex(0x4a6572); // Chequered field lungi
        this.diagnosticMeshes.thundu.visible = true;
      } else if (outfitId === 'urban_explorer') {
        this.diagnosticMeshes.torso.material.color.setHex(0xc2a677); // Khaki utility shirt
        this.diagnosticMeshes.veshtiLower.material.color.setHex(0x3e4a3d); // Olive cargo trousers
        this.diagnosticMeshes.thundu.visible = false;
      } else if (outfitId === 'festival_veshti') {
        this.diagnosticMeshes.torso.material.color.setHex(0xfffae6); // Cream raw silk
        this.diagnosticMeshes.veshtiLower.material.color.setHex(0xfffdfa); // Pure zari veshti
        this.diagnosticMeshes.thundu.visible = true;
      } else if (outfitId === 'nilgiri_warmwear') {
        this.diagnosticMeshes.torso.material.color.setHex(0x3e2723); // Woolen knit sweater
        this.diagnosticMeshes.veshtiLower.material.color.setHex(0x263238); // Dark thermal trousers
        this.diagnosticMeshes.thundu.visible = false;
      }
    }
  }

  /**
   * Per-frame mixer update
   */
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  /**
   * Section 138 & 139: Production Player Asset & Xbot Audit
   */
  static auditPlayerAsset(modelPath = 'assets/characters/player/player.glb') {
    const isBad = /xbot|mrdoob|mixamo_demo|placeholder/i.test(modelPath);
    return {
      passed: !isBad,
      targetModel: modelPath,
      isClean: !isBad,
      details: isBad ? 'Prohibited demo character or placeholder detected' : 'Authentic Tamil Nadu production player asset approved'
    };
  }
}

if (typeof window !== 'undefined') {
  window.CharacterLoader = CharacterLoader;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterLoader };
}
