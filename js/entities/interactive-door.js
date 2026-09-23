/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Interactive Door Entity (InteractiveDoor)
 * Handles authentic physical door animation, locks, key validation,
 * and dynamic collision mesh toggling.
 */

class InteractiveDoor extends EnvironmentObject {
  /**
   * @param {Object} config - Door configuration
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    super(config, scene, collision);

    this.doorState = config.doorState || (config.locked ? 'LOCKED' : 'CLOSED');
    this.openAngle = config.openAngle !== undefined ? config.openAngle : (Math.PI * 0.5);
    this.animationDuration = config.animationDuration || 1.2;
    this.locked = !!config.locked;
    this.requiredItem = config.requiredItem || null;
    this.requiredQuest = config.requiredQuest || null;
    this.requiredEvidence = config.requiredEvidence || null;
    this.lockReason = config.lockReason || 'Locked.';

    this.currentAngle = (this.doorState === 'OPEN') ? this.openAngle : 0;
    this.targetAngle = this.currentAngle;
    this.animationProgress = 1.0;

    // Hinge container to allow realistic swinging
    this.hingePivot = new THREE.Group();
    // Offset door mesh relative to hinge
    const doorWidth = config.width || 1.8;
    const doorHeight = config.height || 2.8;
    const doorThickness = config.thickness || 0.15;

    // Create authentic weathered teak wood door mesh
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.75,
      metalness: 0.15
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.8
    });

    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
      woodMat
    );
    doorMesh.position.set(doorWidth * 0.5, doorHeight * 0.5, 0);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    this.hingePivot.add(doorMesh);

    // Add heavy brass handle and studs
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8),
      brassMat
    );
    handle.position.set(doorWidth * 0.85, doorHeight * 0.45, doorThickness * 0.7);
    handle.rotation.z = Math.PI * 0.5;
    this.hingePivot.add(handle);

    this.group.add(this.hingePivot);
    this.hingePivot.rotation.y = this.currentAngle;

    // Update userData
    this.group.userData.interactionType = (this.doorState === 'OPEN') ? 'close' : 'open';
    this.group.userData.description = config.description || 'A sturdy Chettinad carved teak doorway with heavy brass corner clasps.';

    // Register door collider
    if (this.collision) {
      this.colliderId = `door_col_${this.id}`;
      this.collision.registerCollider({
        id: this.colliderId,
        type: 'box',
        category: 'door',
        x: this.position.x,
        z: this.position.z,
        width: doorWidth + 0.4,
        depth: doorThickness + 0.6,
        enabled: this.doorState !== 'OPEN'
      });
    }
  }

  interact(playerInventory = []) {
    if (this.doorState === 'OPENING' || this.doorState === 'CLOSING') {
      return { success: false, state: this.doorState, message: 'Door is in motion.' };
    }

    if (this.doorState === 'LOCKED') {
      // Check required item
      if (this.requiredItem) {
        const hasItem = Array.isArray(playerInventory) && playerInventory.some(it => {
          const id = typeof it === 'string' ? it : (it.id || it.itemId);
          return id === this.requiredItem;
        });

        if (!hasItem) {
          return {
            success: false,
            state: 'LOCKED',
            message: this.lockReason || 'Locked.'
          };
        }
      }
      // Unlocked by key!
      this.locked = false;
      this.doorState = 'CLOSED';
    }

    if (this.doorState === 'CLOSED') {
      this.open();
      return { success: true, state: 'OPENING', message: 'Opening door.' };
    } else if (this.doorState === 'OPEN') {
      this.close();
      return { success: true, state: 'CLOSING', message: 'Closing door.' };
    }

    return { success: false, state: this.doorState, message: 'Cannot interact.' };
  }

  open() {
    this.doorState = 'OPENING';
    this.targetAngle = this.openAngle;
    this.animationProgress = 0;
    this.group.userData.interactionType = 'close';

    // Play physical audio
    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('door_open', this.position, 1.0);
    }
  }

  close() {
    this.doorState = 'CLOSING';
    this.targetAngle = 0;
    this.animationProgress = 0;
    this.group.userData.interactionType = 'open';

    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('door_close', this.position, 1.0);
    }
  }

  update(deltaTime) {
    if (this.doorState === 'OPENING' || this.doorState === 'CLOSING') {
      this.animationProgress += deltaTime / this.animationDuration;
      const t = Math.min(1.0, this.animationProgress);
      // Smooth sinusoidal ease
      const ease = 0.5 * (1.0 - Math.cos(Math.PI * t));

      if (this.doorState === 'OPENING') {
        this.currentAngle = ease * this.openAngle;
      } else {
        this.currentAngle = (1.0 - ease) * this.openAngle;
      }

      this.hingePivot.rotation.y = this.currentAngle;

      if (t >= 1.0) {
        if (this.doorState === 'OPENING') {
          this.doorState = 'OPEN';
          this.storyState = 'opened';
          // Disable collider when fully open so player walks through
          if (this.collision && this.colliderId) {
            this.collision.setColliderEnabled(this.colliderId, false);
          }
        } else {
          this.doorState = 'CLOSED';
          this.storyState = 'normal';
          // Re-enable collider when closed
          if (this.collision && this.colliderId) {
            this.collision.setColliderEnabled(this.colliderId, true);
          }
        }
      }
    }
  }

  getState() {
    return {
      doorState: this.doorState,
      locked: this.locked,
      currentAngle: this.currentAngle
    };
  }

  applyState(saved) {
    if (!saved) return;
    this.doorState = saved.doorState || this.doorState;
    this.locked = saved.locked !== undefined ? saved.locked : this.locked;
    this.currentAngle = (this.doorState === 'OPEN') ? this.openAngle : 0;
    this.hingePivot.rotation.y = this.currentAngle;
    if (this.collision && this.colliderId) {
      this.collision.setColliderEnabled(this.colliderId, this.doorState !== 'OPEN');
    }
  }
}

window.InteractiveDoor = InteractiveDoor;
