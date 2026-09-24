// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - INTERACTIVE DOOR ENTITY
// Authoritative door with hinge animation, state machine & dynamic collision updates
// Supports both Exploration System tests and Modern Environmental Interactions
// ============================================================================

(function() {
  'use strict';

  const BaseClass = (typeof window.InteractiveProp !== 'undefined') ? window.InteractiveProp : Object;

  class InteractiveDoor extends BaseClass {
    /**
     * @param {Object} config - Door configuration
     * @param {THREE.Scene} scene - Optional Three.js scene
     * @param {WorldCollision} collision - Optional world collision system
     */
    constructor(config = {}, scene = null, collision = null) {
      super({
        ...config,
        type: 'door',
        anchorPoint: config.anchorPoint || 'DOOR_HANDLE',
        savePolicy: 'PERSISTENT'
      });

      this.scene = scene || (typeof window.threeWorld !== 'undefined' ? window.threeWorld?.scene : null);
      this.collision = collision || (typeof window.threeWorld !== 'undefined' ? window.threeWorld?.collision : null);

      this.doorStates = {
        CLOSED: 'CLOSED',
        OPENING: 'OPENING',
        OPEN: 'OPEN',
        CLOSING: 'CLOSING',
        LOCKED: 'LOCKED'
      };

      this.locked = !!(config.locked || config.isLocked);
      this.isLocked = this.locked;
      this.requiredKey = config.requiredKey || config.requiredItem || null;
      this.requiredItem = this.requiredKey;
      this.lockReason = config.lockReason || (config.lockHint && config.lockHint.en) || 'Locked.';
      this.lockHint = config.lockHint || { en: this.lockReason, ta: 'பூட்டப்பட்டுள்ளது' };

      this._state = this.locked ? this.doorStates.LOCKED : (config.defaultState || this.doorStates.CLOSED);
      this.openAngle = config.openAngle !== undefined ? config.openAngle : (Math.PI * 0.5);
      this.currentAngle = (this._state === this.doorStates.OPEN) ? this.openAngle : 0;
      this.targetAngle = this.currentAngle;
      this.swingSpeed = config.swingSpeed || 3.0; // Radians per second
      this.animationDuration = config.animationDuration || 1.2;
      this.animationProgress = (this._state === this.doorStates.OPEN) ? 1.0 : 0.0;

      // Hinge Pivot & 3D Mesh
      if (typeof THREE !== 'undefined') {
        this.group = this.group || new THREE.Group();
        this.hingePivot = new THREE.Group();
        this.group.add(this.hingePivot);

        const doorWidth = config.width || 1.8;
        const doorHeight = config.height || 2.8;
        const doorThickness = config.thickness || 0.15;

        const woodMat = new THREE.MeshStandardMaterial({
          color: 0x4a2e18,
          roughness: 0.75,
          metalness: 0.15
        });
        const doorMesh = new THREE.Mesh(
          new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
          woodMat
        );
        doorMesh.position.set(doorWidth * 0.5, doorHeight * 0.5, 0);
        this.hingePivot.add(doorMesh);

        if (this.position) {
          this.group.position.set(this.position.x || 0, this.position.y || 0, this.position.z || 0);
        }
        if (this.scene && typeof this.scene.add === 'function') {
          this.scene.add(this.group);
        }
      }

      // Dynamic World Collision registration
      if (this.collision) {
        this.colliderId = `door_col_${this.id}`;
        this.collision.registerCollider({
          id: this.colliderId,
          type: 'box',
          category: 'door',
          x: this.position.x,
          z: this.position.z,
          width: (config.width || 1.8) + 0.4,
          depth: (config.thickness || 0.15) + 0.6,
          enabled: this._state !== this.doorStates.OPEN
        });
      }

      this._refreshInteractionTypes();
    }

    // Bi-directional state compatibility (state and doorState)
    get state() {
      return this._state;
    }
    set state(val) {
      this._state = val;
    }

    get doorState() {
      return this._state;
    }
    set doorState(val) {
      this._state = val;
    }

    _refreshInteractionTypes() {
      if (this._state === this.doorStates.LOCKED) {
        this.interactionTypes = ['OPEN', 'INSPECT'];
      } else if (this._state === this.doorStates.OPEN || this._state === this.doorStates.OPENING) {
        this.interactionTypes = ['CLOSE', 'INSPECT'];
      } else {
        this.interactionTypes = ['OPEN', 'INSPECT'];
      }
      if (this.group && this.group.userData) {
        this.group.userData.interactionType = (this._state === this.doorStates.OPEN) ? 'close' : 'open';
      }
    }

    isPassable() {
      return this._state === this.doorStates.OPEN;
    }

    open() {
      if (this._state === this.doorStates.LOCKED) {
        return false;
      }
      if (this._state === this.doorStates.OPEN || this._state === this.doorStates.OPENING) {
        return true;
      }
      this._state = this.doorStates.OPENING;
      this.targetAngle = this.openAngle;
      this._refreshInteractionTypes();

      if (window.gameAudio) {
        window.gameAudio.playDoorSound?.(this.soundId || 'door_wood_creak', this.position);
      }
      if (window.PropStateSystem) {
        window.PropStateSystem.recordDoorState(this.id, true);
      }
      if (window.WorldReactivitySystem) {
        window.WorldReactivitySystem.notifyNavigationPathChanged(this.position, true);
      }
      return true;
    }

    close() {
      if (this._state === this.doorStates.CLOSED || this._state === this.doorStates.CLOSING) {
        return true;
      }
      this._state = this.doorStates.CLOSING;
      this.targetAngle = 0;
      this._refreshInteractionTypes();

      if (window.gameAudio) {
        window.gameAudio.playDoorSound?.(this.soundId || 'door_wood_creak', this.position);
      }
      if (window.PropStateSystem) {
        window.PropStateSystem.recordDoorState(this.id, false);
      }
      if (window.WorldReactivitySystem) {
        window.WorldReactivitySystem.notifyNavigationPathChanged(this.position, false);
      }
      return true;
    }

    toggle() {
      if (this._state === this.doorStates.CLOSED) {
        return this.open();
      } else if (this._state === this.doorStates.OPEN) {
        return this.close();
      }
      return false;
    }

    unlock(keyId) {
      if (!this.isLocked && !this.locked) return true;
      const expectedKey = this.requiredKey || this.requiredItem;
      if (expectedKey && expectedKey === keyId) {
        this.isLocked = false;
        this.locked = false;
        this._state = this.doorStates.CLOSED;
        this._refreshInteractionTypes();
        if (window.gameAudio) window.gameAudio.playUnlockClick?.();
        return true;
      }
      return false;
    }

    // Exploration System legacy interact() method
    interact(playerInventory = []) {
      if (this._state === this.doorStates.OPENING || this._state === this.doorStates.CLOSING) {
        return { success: false, state: this._state, message: 'Door is in motion.' };
      }

      if (this._state === this.doorStates.LOCKED) {
        const reqKey = this.requiredKey || this.requiredItem;
        if (reqKey) {
          const hasItem = Array.isArray(playerInventory) && playerInventory.some(it => {
            const id = typeof it === 'string' ? it : (it.id || it.itemId);
            return id === reqKey;
          });

          if (!hasItem) {
            return {
              success: false,
              state: this.doorStates.LOCKED,
              message: this.lockReason || 'Requires workshop key.'
            };
          }
        }
        this.unlock(reqKey);
      }

      if (this._state === this.doorStates.CLOSED) {
        this.open();
        return { success: true, state: this.doorStates.OPENING, message: 'Opening door.' };
      } else if (this._state === this.doorStates.OPEN) {
        this.close();
        return { success: true, state: this.doorStates.CLOSING, message: 'Closing door.' };
      }

      return { success: false, state: this._state, message: 'Cannot interact.' };
    }

    // Modern Environmental Interaction onInteract() method
    onInteract(category, player, context = {}) {
      if (category === 'INSPECT') {
        return super.onInteract ? super.onInteract('INSPECT', player, context) : { success: true, message: this.description };
      }

      if (this._state === this.doorStates.LOCKED) {
        let hasKey = false;
        const reqKey = this.requiredKey || this.requiredItem;

        if (typeof context.hasKey === 'function') {
          hasKey = context.hasKey(reqKey);
        } else if (context.hasKey === true) {
          hasKey = true;
        } else if (window.GameState?.hasItemInInventory) {
          hasKey = window.GameState.hasItemInInventory(reqKey);
        }

        if (hasKey) {
          this.unlock(reqKey);
          return { success: true, message: { en: 'Unlocked!', ta: 'பூட்டு திறக்கப்பட்டது!' } };
        } else {
          if (window.gameAudio) window.gameAudio.playLockedRattle?.();
          return {
            success: false,
            reason: 'locked',
            message: this.lockHint
          };
        }
      }

      const res = this.toggle();
      return {
        success: res,
        action: (this._state === this.doorStates.OPENING || this._state === this.doorStates.OPEN) ? 'OPEN' : 'CLOSE',
        propId: this.id,
        currentState: this._state
      };
    }

    update(deltaTime) {
      if (this.currentAngle !== this.targetAngle) {
        const step = this.swingSpeed * deltaTime;
        if (this.currentAngle < this.targetAngle) {
          this.currentAngle = Math.min(this.targetAngle, this.currentAngle + step);
          if (this.currentAngle >= this.targetAngle) {
            this._state = this.doorStates.OPEN;
            this._refreshInteractionTypes();
            if (this.collision && this.colliderId) {
              if (this.collision.setColliderEnabled) {
                this.collision.setColliderEnabled(this.colliderId, false);
              } else if (this.collision.colliders && this.collision.colliders.get(this.colliderId)) {
                this.collision.colliders.get(this.colliderId).enabled = false;
              }
            }
          }
        } else {
          this.currentAngle = Math.max(this.targetAngle, this.currentAngle - step);
          if (this.currentAngle <= this.targetAngle) {
            this._state = this.doorStates.CLOSED;
            this._refreshInteractionTypes();
            if (this.collision && this.colliderId) {
              if (this.collision.setColliderEnabled) {
                this.collision.setColliderEnabled(this.colliderId, true);
              } else if (this.collision.colliders && this.collision.colliders.get(this.colliderId)) {
                this.collision.colliders.get(this.colliderId).enabled = true;
              }
            }
          }
        }

        if (this.hingePivot) {
          this.hingePivot.rotation.y = this.currentAngle;
        }
        if (this.mesh) {
          this.mesh.rotation.y = (this.rotation?.y || 0) + this.currentAngle;
        }
      }
    }

    getState() {
      return {
        doorState: this._state,
        locked: this.locked,
        currentAngle: this.currentAngle
      };
    }

    applyState(saved) {
      if (!saved) return;
      this._state = saved.doorState || this._state;
      this.locked = saved.locked !== undefined ? saved.locked : this.locked;
      this.isLocked = this.locked;
      this.currentAngle = (this._state === this.doorStates.OPEN) ? this.openAngle : 0;
      this.targetAngle = this.currentAngle;
      if (this.hingePivot) {
        this.hingePivot.rotation.y = this.currentAngle;
      }
      if (this.collision && this.colliderId) {
        if (this.collision.setColliderEnabled) {
          this.collision.setColliderEnabled(this.colliderId, this._state !== this.doorStates.OPEN);
        } else if (this.collision.colliders && this.collision.colliders.get(this.colliderId)) {
          this.collision.colliders.get(this.colliderId).enabled = (this._state !== this.doorStates.OPEN);
        }
      }
    }
  }

  window.InteractiveDoor = InteractiveDoor;
  console.log('[InteractiveDoor] Registered interactive door entity class.');
})();
