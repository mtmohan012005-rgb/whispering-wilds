/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Environment Object Base Entity (EnvironmentObject)
 * Base class for all physical 3D interactive, inspectable, and story-driven world entities.
 */

class EnvironmentObject {
  /**
   * @param {Object} config - Configuration object
   * @param {THREE.Scene} scene - Three.js World Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    this.id = config.id || `env_${Math.random().toString(36).substr(2, 9)}`;
    this.name = config.name || 'Ancient Environmental Relic';
    this.tamilName = config.tamilName || 'தொன்மைச் சுவடு';
    this.region = config.region || 'CAUVERY_DELTA';
    this.scene = scene;
    this.collision = collision;

    // Position & Transform
    this.position = new THREE.Vector3(
      config.position ? config.position.x : (config.x || 0),
      config.position ? config.position.y : (config.y || 0),
      config.position ? config.position.z : (config.z || 0)
    );
    this.rotation = new THREE.Euler(0, config.rotationY || 0, 0);
    this.scale = new THREE.Vector3(config.scale || 1, config.scale || 1, config.scale || 1);

    // Authoritative Story & Environmental State
    // Supported states: 'normal', 'damaged', 'used', 'hidden', 'locked', 'opened', 'solved', 'questRelevant'
    this.storyState = config.storyState || 'normal';

    // Three.js Root Group
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.rotation.copy(this.rotation);
    this.group.scale.copy(this.scale);

    // Standard userData specification (Section 4 & 7)
    this.group.userData = {
      interactable: config.interactable !== undefined ? config.interactable : true,
      interactionType: config.interactionType || 'inspect',
      interactionId: this.id,
      questObject: !!config.questObject,
      puzzleId: config.puzzleId || null,
      photographable: !!config.photographable,
      storyState: this.storyState,
      description: config.description || 'An environmental object bearing witness to centuries of Tamil civilization.',
      evidenceKey: config.evidenceKey || null,
      entityRef: this
    };

    // Inspection highlight material cache
    this.isInspected = false;
    this.originalMaterials = new Map();

    // Attach to scene
    if (this.scene) {
      this.scene.add(this.group);
    }

    // Register physical collider if specified
    if (this.collision && config.collider) {
      this.colliderId = `col_${this.id}`;
      this.collision.registerCollider({
        id: this.colliderId,
        type: config.collider.type || 'box',
        category: 'solid',
        x: this.position.x,
        z: this.position.z,
        width: config.collider.width || 2,
        depth: config.collider.depth || 2,
        radius: config.collider.radius || 1,
        enabled: this.storyState !== 'hidden' && this.storyState !== 'opened'
      });
    }
  }

  setStoryState(newState) {
    const validStates = ['normal', 'damaged', 'used', 'hidden', 'locked', 'opened', 'solved', 'questRelevant'];
    if (!validStates.includes(newState)) {
      console.warn(`[EnvironmentObject] Invalid story state: ${newState}`);
      return;
    }
    this.storyState = newState;
    this.group.userData.storyState = newState;

    if (this.storyState === 'hidden') {
      this.group.visible = false;
      if (this.collision && this.colliderId) {
        this.collision.setColliderEnabled(this.colliderId, false);
      }
    } else {
      this.group.visible = true;
      if (this.collision && this.colliderId) {
        this.collision.setColliderEnabled(this.colliderId, this.storyState !== 'opened');
      }
    }
  }

  setInspectHighlight(highlighted) {
    this.isInspected = !!highlighted;
    this.group.traverse((child) => {
      if (child.isMesh && child.material) {
        if (this.isInspected) {
          if (!this.originalMaterials.has(child.id)) {
            this.originalMaterials.set(child.id, child.material);
          }
          // Subtle warm golden ambient rim highlight
          if (child.material.emissive) {
            child.material.emissive.setHex(0x553311);
          }
        } else {
          if (child.material.emissive) {
            child.material.emissive.setHex(0x000000);
          }
        }
      }
    });
  }

  interact(player, interactionType = 'inspect') {
    // Override in derived classes
    return {
      success: true,
      id: this.id,
      action: interactionType,
      message: this.group.userData.description
    };
  }

  dispose() {
    if (this.collision && this.colliderId) {
      this.collision.removeCollider(this.colliderId);
    }
    if (this.scene) {
      this.scene.remove(this.group);
    }
  }
}

window.EnvironmentObject = EnvironmentObject;
