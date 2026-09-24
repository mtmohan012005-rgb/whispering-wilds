// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - BASE INTERACTIVE PROP ENTITY
// Core interactive prop instance representing physical world objects
// ============================================================================

(function() {
  'use strict';

  class InteractiveProp {
    constructor(config = {}) {
      this.id = config.id || ('prop_' + Math.random().toString(36).substr(2, 9));
      this.name = config.name || { en: 'Object', ta: 'பொருள்' };
      this.type = config.type || 'prop';
      this.subType = config.subType || 'generic';
      this.region = config.region || 'george_town';

      // 3D Transform
      this.position = {
        x: config.position?.x || 0,
        y: config.position?.y || 0,
        z: config.position?.z || 0
      };
      this.rotation = {
        x: config.rotation?.x || 0,
        y: config.rotation?.y || 0,
        z: config.rotation?.z || 0
      };
      this.scale = {
        x: config.scale?.x || 1,
        y: config.scale?.y || 1,
        z: config.scale?.z || 1
      };

      // Taxonomy & Gameplay Rules
      this.massClass = config.massClass || 'STATIC';
      this.interactionTypes = Array.isArray(config.interactionTypes) ? [...config.interactionTypes] : ['INSPECT'];
      this.priorityTier = config.priorityTier || (window.INTERACTION_PRIORITY ? window.INTERACTION_PRIORITY.NORMAL_PROP : 5);
      this.collisionProfile = config.collisionProfile || { type: 'box', size: { x: 1, y: 1, z: 1 } };
      this.savePolicy = config.savePolicy || 'TRANSIENT';
      this.anchorPoint = config.anchorPoint || 'CRATE_FACE';
      this.soundId = config.soundId || 'wood_scrape';
      this.evidenceId = config.evidenceId || null;
      this.description = config.description || null;

      // State Management
      this.currentState = config.defaultState || 'IDLE';
      this.isLocked = !!config.isLocked;
      this.requiredKey = config.requiredKey || null;
      this.lockHint = config.lockHint || { en: 'Locked', ta: 'பூட்டப்பட்டுள்ளது' };
      this.interactionRadius = config.interactionRadius || 2.4;

      // Internal Three.js mesh binding (if active in 3D world)
      this.mesh = null;
      this.isHighlighted = false;
      this._lastInteractionTime = 0;
    }

    // Distance calculation to player or observer
    getDistanceTo(x, y, z) {
      if (typeof x === 'object') {
        const target = x;
        const dx = this.position.x - (target.x || 0);
        const dy = this.position.y - (target.y || 0);
        const dz = this.position.z - (target.z || 0);
        return Math.hypot(dx, dy, dz);
      }
      const dx = this.position.x - (x || 0);
      const dy = this.position.y - (y || 0);
      const dz = this.position.z - (z || 0);
      return Math.hypot(dx, dy, dz);
    }

    // Validates whether the player can interact given distance and object state
    canInteract(playerPos, category = null) {
      const dist = this.getDistanceTo(playerPos);
      if (dist > this.interactionRadius) return false;

      if (category) {
        return this.interactionTypes.includes(category);
      }
      return this.interactionTypes.length > 0;
    }

    // Returns primary interaction action verb
    getPrimaryAction() {
      return this.interactionTypes[0] || 'INSPECT';
    }

    // Contextual localized prompt
    getInteractionPrompt(lang = 'ta') {
      const primary = this.getPrimaryAction();
      const verbs = window.INTERACTION_VERBS ? window.INTERACTION_VERBS[primary] : null;
      const verbText = verbs ? (verbs[lang] || verbs.en) : primary;
      const propTitle = this.name[lang] || this.name.en || 'Object';
      return {
        action: primary,
        verbText,
        propTitle,
        icon: verbs ? verbs.icon : '✨',
        isLocked: this.isLocked,
        lockHint: this.isLocked ? (this.lockHint[lang] || this.lockHint.en) : null
      };
    }

    // Core Interaction Execution
    onInteract(category, player, context = {}) {
      const now = performance.now();
      // Debounce interaction requests (prevent spam clicks)
      if (now - this._lastInteractionTime < 450) {
        return { success: false, reason: 'rate_limited' };
      }
      this._lastInteractionTime = now;

      // Handle locked state
      if (this.isLocked && category !== 'INSPECT') {
        if (this.requiredKey && context.hasKey && context.hasKey(this.requiredKey)) {
          this.isLocked = false;
          if (window.gameAudio) window.gameAudio.playUnlockClick?.();
        } else {
          if (window.gameAudio) window.gameAudio.playLockedRattle?.();
          return {
            success: false,
            reason: 'locked',
            message: this.lockHint
          };
        }
      }

      // Record evidence if linked to an investigation
      if (this.evidenceId && window.investigationSystem) {
        window.investigationSystem.recordEvidence(this.evidenceId, {
          propId: this.id,
          region: this.region,
          timestamp: Date.now()
        });
      }

      // Audio feedback
      if (this.soundId && window.gameAudio) {
        window.gameAudio.playPropSound?.(this.soundId, this.position);
      }

      // Persist state if configured
      if (this.savePolicy === 'PERSISTENT' && window.PropStateSystem) {
        window.PropStateSystem.recordPropState(this.id, {
          state: this.currentState,
          isLocked: this.isLocked,
          timestamp: Date.now()
        });
      }

      return {
        success: true,
        action: category,
        propId: this.id,
        currentState: this.currentState
      };
    }

    // Highlight visual outline (accessibility setting: none / subtle / clear)
    setHighlight(mode = 'clear') {
      if (this.isHighlighted === mode) return;
      this.isHighlighted = mode;

      if (this.mesh) {
        if (mode === 'none') {
          if (this.mesh.material && this.mesh.material.emissive) {
            this.mesh.material.emissive.setHex(0x000000);
          }
        } else if (mode === 'subtle') {
          if (this.mesh.material && this.mesh.material.emissive) {
            this.mesh.material.emissive.setHex(0x223322);
          }
        } else if (mode === 'clear') {
          if (this.mesh.material && this.mesh.material.emissive) {
            this.mesh.material.emissive.setHex(0x446633);
          }
        }
      }
    }

    // Per-frame entity update
    update(deltaTime) {
      // Subclasses override for hinge rotation, particle updates, or water flow
    }
  }

  window.InteractiveProp = InteractiveProp;
  console.log('[InteractiveProp] Registered base interactive prop entity class.');
})();
