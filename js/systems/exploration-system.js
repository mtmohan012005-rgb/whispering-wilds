/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Core Exploration & Discovery System (ExplorationSystem)
 * Orchestrates the exploration loop (Move -> Observe -> Discover -> Inspect -> Interact -> Solve -> Record),
 * authoritative exploration state machine, landmark discoveries, photographable evidence validation,
 * accessibility options, and developer telemetry.
 */

class ExplorationSystem {
  /**
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(scene = null, collision = null) {
    this.scene = scene;
    this.collision = collision;

    // Authoritative State Machine (Section 3)
    this.currentState = window.EXPLORATION_STATE ? window.EXPLORATION_STATE.NORMAL : 'NORMAL';

    // Discovery Records
    this.discoveredLandmarks = new Map(); // id -> { id, name, region, position, timestamp }
    this.activeLandmarks = (typeof window.REGIONAL_LANDMARKS !== 'undefined') ? [...window.REGIONAL_LANDMARKS] : [];

    // Inspection State
    this.inspectedTarget = null;
    this.inspectionOriginalCam = null;

    // Accessibility Configuration (Section 40)
    this.accessibility = {
      toggleCrouch: false,
      cameraSensitivity: 1.0,
      reducedScreenMovement: false,
      interactionHintSize: 'normal',
      subtitleSize: 'normal',
      puzzleAssistance: false
    };

    // Developer Debug Flags (Section 41) - Strictly disabled by default
    this.debug = {
      showInteractableIDs: false,
      showCollisionBoxes: false,
      showClimbSurfaces: false,
      showPuzzleStates: false,
      showWaterVolumes: false,
      showBoatNavigationZones: false
    };
  }

  setExplorationState(newState) {
    if (!window.EXPLORATION_STATE || !window.EXPLORATION_STATE[newState]) {
      console.warn(`[ExplorationSystem] Invalid exploration state: ${newState}`);
      return;
    }
    const previous = this.currentState;
    this.currentState = newState;

    // Maintain single authoritative state on player if present
    if (window.threeWorld && window.threeWorld.player) {
      if (newState === 'CROUCHING') {
        window.threeWorld.player.state = window.PLAYER_STATE.CROUCH_IDLE;
      } else if (newState === 'SWIMMING') {
        window.threeWorld.player.state = window.PLAYER_STATE.SWIM;
      } else if (newState === 'CLIMBING') {
        window.threeWorld.player.state = window.PLAYER_STATE.CLIMB;
      } else if (newState === 'NORMAL' && previous !== 'NORMAL') {
        window.threeWorld.player.state = window.PLAYER_STATE.IDLE;
      }
    }
    return this.currentState;
  }

  getExplorationState() {
    return this.currentState;
  }

  /**
   * Check proximity to regional landmarks to trigger natural discovery
   */
  update(playerPos, deltaTime) {
    if (!playerPos) return;

    // Check undiscovered landmarks
    for (const lm of this.activeLandmarks) {
      if (this.discoveredLandmarks.has(lm.id)) continue;

      const dx = playerPos.x - lm.position.x;
      const dy = (playerPos.y || 0) - lm.position.y;
      const dz = playerPos.z - lm.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= lm.radius) {
        this.discoverLocation(lm);
      }
    }
  }

  /**
   * Records a landmark discovery event (Section 31)
   */
  discoverLocation(landmark) {
    if (!landmark || this.discoveredLandmarks.has(landmark.id)) return;

    const record = {
      id: landmark.id,
      name: landmark.name,
      tamilName: landmark.tamilName || '',
      region: landmark.region,
      position: { ...landmark.position },
      timestamp: Date.now(),
      discoveryXP: landmark.discoveryXP || 100
    };

    this.discoveredLandmarks.set(landmark.id, record);

    // 1. Reward XP and Journal
    if (window.gameSurvival && typeof window.gameSurvival.gainXP === 'function') {
      window.gameSurvival.gainXP(record.discoveryXP);
    }

    if (window.gameJournal && typeof window.gameJournal.unlockEntry === 'function') {
      window.gameJournal.unlockEntry(landmark.loreKey || landmark.id);
    }

    // 2. Play audio cue
    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('landmark_discover', landmark.position, 1.0);
    }

    // 3. UI Toast Banner
    if (window.explorationUI && typeof window.explorationUI.showDiscoveryToast === 'function') {
      window.explorationUI.showDiscoveryToast(record);
    }

    // 4. Save state
    if (window.gameSaveManager) {
      window.gameSaveManager.saveGame('auto', 'landmark_discovery');
    }

    return record;
  }

  /**
   * Validates photo evidence against photographable 3D entities (Section 33)
   */
  validatePhotograph(targetObject, cameraFov = 60) {
    if (!targetObject || !targetObject.userData) {
      return { valid: false, reason: 'No object in focus' };
    }

    const ud = targetObject.userData;
    if (!ud.photographable) {
      return { valid: false, reason: 'Object has no evidence significance' };
    }

    // Validate distance
    const playerPos = (window.threeWorld && window.threeWorld.player) ? window.threeWorld.player.getPosition() : { x: 0, y: 0, z: 0 };
    const objPos = targetObject.position || (targetObject.getWorldPosition ? targetObject.getWorldPosition(new THREE.Vector3()) : { x: 0, y: 0, z: 0 });
    const dx = playerPos.x - objPos.x;
    const dz = playerPos.z - objPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 18.0) {
      return { valid: false, reason: 'Too far away for clear photographic evidence' };
    }

    // Register evidence with investigation system
    if (ud.evidenceKey && window.investigationSystem) {
      window.investigationSystem.discoverEvidence(ud.evidenceKey);
    }

    return {
      valid: true,
      subjectId: ud.interactionId || ud.id,
      evidenceKey: ud.evidenceKey,
      name: ud.name || 'Photographable Subject'
    };
  }

  // Accessibility Controls
  setAccessibilityOption(key, val) {
    if (this.accessibility[key] !== undefined) {
      this.accessibility[key] = val;
    }
  }

  // Developer Debug Controls
  setDebugOption(key, val) {
    if (this.debug[key] !== undefined) {
      this.debug[key] = !!val;
    }
  }

  getState() {
    return {
      currentState: this.currentState,
      discoveredLandmarks: Array.from(this.discoveredLandmarks.entries())
    };
  }

  applyState(saved) {
    if (!saved) return;
    if (saved.currentState) this.currentState = saved.currentState;
    if (Array.isArray(saved.discoveredLandmarks)) {
      this.discoveredLandmarks = new Map(saved.discoveredLandmarks);
    }
  }
}

window.ExplorationSystem = ExplorationSystem;
