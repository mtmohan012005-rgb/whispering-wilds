// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - INTERACTIVE GATE ENTITY
// Authoritative gate entity supporting dual/single wings & navigation path updates
// ============================================================================

(function() {
  'use strict';

  class InteractiveGate extends window.InteractiveProp {
    constructor(config = {}) {
      super({
        ...config,
        type: 'gate',
        anchorPoint: config.anchorPoint || 'GATE_LATCH',
        savePolicy: 'PERSISTENT'
      });

      this.isDualWing = !!config.isDualWing;
      this.isOpen = config.defaultState === 'OPEN';
      this.swingAngle = 0;
      this.targetSwing = this.isOpen ? (Math.PI / 2) : 0;
      this.swingSpeed = 2.4; // Radians per sec
      this.leftWingMesh = null;
      this.rightWingMesh = null;

      this._refreshInteractionTypes();
    }

    _refreshInteractionTypes() {
      this.interactionTypes = this.isOpen ? ['CLOSE', 'INSPECT'] : ['OPEN', 'INSPECT'];
    }

    isPassable() {
      return this.isOpen;
    }

    open() {
      if (this.isLocked) return false;
      if (this.isOpen) return true;
      this.isOpen = true;
      this.targetSwing = Math.PI / 2;
      this._refreshInteractionTypes();

      if (window.gameAudio) {
        window.gameAudio.playGateSound?.(this.soundId || 'gate_creak_wood', this.position);
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
      if (!this.isOpen) return true;
      this.isOpen = false;
      this.targetSwing = 0;
      this._refreshInteractionTypes();

      if (window.gameAudio) {
        window.gameAudio.playGateSound?.(this.soundId || 'gate_creak_wood', this.position);
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
      return this.isOpen ? this.close() : this.open();
    }

    onInteract(category, player, context = {}) {
      if (category === 'INSPECT') {
        return super.onInteract('INSPECT', player, context);
      }

      if (this.isLocked) {
        if (window.gameAudio) window.gameAudio.playLockedRattle?.();
        return {
          success: false,
          reason: 'locked',
          message: this.lockHint
        };
      }

      const success = this.toggle();
      return {
        success,
        action: this.isOpen ? 'OPEN' : 'CLOSE',
        propId: this.id,
        currentState: this.isOpen ? 'OPEN' : 'CLOSED'
      };
    }

    update(deltaTime) {
      if (this.swingAngle !== this.targetSwing) {
        const step = this.swingSpeed * deltaTime;
        if (this.swingAngle < this.targetSwing) {
          this.swingAngle = Math.min(this.targetSwing, this.swingAngle + step);
        } else {
          this.swingAngle = Math.max(this.targetSwing, this.swingAngle - step);
        }

        // Apply swing transforms
        if (this.isDualWing) {
          if (this.leftWingMesh) this.leftWingMesh.rotation.y = this.rotation.y + this.swingAngle;
          if (this.rightWingMesh) this.rightWingMesh.rotation.y = this.rotation.y - this.swingAngle;
        } else if (this.mesh) {
          this.mesh.rotation.y = this.rotation.y + this.swingAngle;
        }
      }
    }
  }

  window.InteractiveGate = InteractiveGate;
  console.log('[InteractiveGate] Registered interactive gate entity class.');
})();
