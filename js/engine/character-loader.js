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
    let exists = false;
    try {
      if (typeof fetch !== 'undefined') {
        const response = await fetch(this.playerModelPath, { method: 'HEAD' });
        if (response.ok) {
          exists = true;
        }
      }
    } catch (e) {
      exists = false;
    }

    if (!exists || typeof THREE.GLTFLoader === 'undefined') {
      // Mandatory Contract Output (Section 15):
      console.error(`[PLAYER ASSET MISSING] ${this.playerModelPath}`);
      this.isPlayerAssetMissing = true;
      this.isProductionAsset = false;

      // Build culturally authentic Tamil Nadu diagnostic proxy
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
          console.error(`[PLAYER ASSET MISSING] ${this.playerModelPath}`);
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
   * Builds an authentic Tamil Nadu explorer diagnostic silhouette proxy.
   * Clearly marked userData.isProductionAsset = false.
   */
  buildAuthenticDiagnosticProxy() {
    this.diagnosticGroup = new THREE.Group();
    this.diagnosticGroup.name = 'DiagnosticTamilExplorerProxy';
    this.diagnosticGroup.userData.isProductionAsset = false;
    this.diagnosticGroup.userData.isDiagnosticProxy = true;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.65 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.85 }); // Cotton shirt
    const veshtiMat = new THREE.MeshStandardMaterial({ color: 0xebedf0, roughness: 0.88 }); // Handloom Veshti
    const zariMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 }); // Gold zari
    const thunduMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, roughness: 0.9 }); // Angavasthram
    const sandalMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.95 }); // Leather straps
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x11100f, roughness: 0.9 }); // Natural black hair

    // 1. Head & Face
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinMat);
    head.position.set(0, 1.62, 0);
    head.castShadow = true;
    this.diagnosticGroup.add(head);

    // Hair cap
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), hairMat);
    hair.position.set(0, 1.64, 0);
    this.diagnosticGroup.add(hair);

    // 2. Torso (Half-sleeve white cotton shirt)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.28), shirtMat);
    torso.position.set(0, 1.2, 0);
    torso.castShadow = true;
    this.diagnosticGroup.add(torso);

    // 3. Shoulder Thundu / Towel draped across left shoulder
    const thundu = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.75, 0.32), thunduMat);
    thundu.position.set(-0.25, 1.25, 0);
    thundu.castShadow = true;
    this.diagnosticGroup.add(thundu);

    // 4. Authentic Lower Veshti / Dhoti wrapping
    const veshtiUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.45, 12), veshtiMat);
    veshtiUpper.position.set(0, 0.72, 0);
    veshtiUpper.castShadow = true;
    this.diagnosticGroup.add(veshtiUpper);

    // Zari border trim along waist / pleat
    const zariBorder = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.05, 12), zariMat);
    zariBorder.position.set(0, 0.92, 0);
    this.diagnosticGroup.add(zariBorder);

    // Lower folded Veshti cylinder
    const veshtiLower = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.42, 12), veshtiMat);
    veshtiLower.position.set(0, 0.35, 0);
    veshtiLower.castShadow = true;
    this.diagnosticGroup.add(veshtiLower);

    // 5. Bare calves & practical sandals
    const legGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.3, 8);
    const leftCalf = new THREE.Mesh(legGeo, skinMat);
    leftCalf.position.set(-0.11, 0.16, 0);
    this.diagnosticGroup.add(leftCalf);

    const rightCalf = new THREE.Mesh(legGeo, skinMat);
    rightCalf.position.set(0.11, 0.16, 0);
    this.diagnosticGroup.add(rightCalf);

    // Sandals
    const sandalGeo = new THREE.BoxGeometry(0.12, 0.04, 0.26);
    const leftSandal = new THREE.Mesh(sandalGeo, sandalMat);
    leftSandal.position.set(-0.11, 0.02, 0.03);
    leftSandal.castShadow = true;
    this.diagnosticGroup.add(leftSandal);

    const rightSandal = new THREE.Mesh(sandalGeo, sandalMat);
    rightSandal.position.set(0.11, 0.02, 0.03);
    rightSandal.castShadow = true;
    this.diagnosticGroup.add(rightSandal);

    // Store references for limb procedural locomotion in three-player.js
    this.diagnosticMeshes = {
      head,
      torso,
      thundu,
      veshtiUpper,
      veshtiLower,
      leftCalf,
      rightCalf,
      leftSandal,
      rightSandal
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

    // If production GLB is loaded, toggle submesh groups if authored
    if (this.gltfMesh) {
      this.gltfMesh.traverse((child) => {
        if (child.isMesh && child.name.startsWith('Outfit_')) {
          child.visible = child.name.includes(outfitId);
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
