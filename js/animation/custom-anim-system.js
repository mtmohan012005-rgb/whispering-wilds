/**
 * The Whispering Wilds (Kaattu Vazhi) - Custom Animation System & Motion Blending
 * Production-grade state machine and motion engine supporting:
 *  - 17 Authoritative Player States (Idle, Walk, Run, Sprint, Jump, Fall, Land, Crouch, Climb, Swim, Interact, Inspect, Eat, Drink, Sit, Rest, Photo)
 *  - Smooth cross-fade blending matrix
 *  - Gait phase cadence scaling to eliminate foot-sliding
 *  - Procedural spine, neck, and head bone tracking toward points of interest
 */

(function () {
  'use strict';

  const ANIM_STATES = {
    IDLE: 'IDLE',
    WALK: 'WALK',
    RUN: 'RUN',
    SPRINT: 'SPRINT',
    JUMP: 'JUMP',
    FALL: 'FALL',
    LAND: 'LAND',
    CROUCH: 'CROUCH',
    CLIMB: 'CLIMB',
    SWIM: 'SWIM',
    INTERACT: 'INTERACT',
    INSPECT: 'INSPECT',
    EAT: 'EAT',
    DRINK: 'DRINK',
    SIT: 'SIT',
    REST: 'REST',
    PHOTO: 'PHOTO'
  };

  // State to GLTF Action name mappings
  const STATE_CLIP_MAP = {
    [ANIM_STATES.IDLE]: 'Player_Idle',
    [ANIM_STATES.WALK]: 'Player_Walk',
    [ANIM_STATES.RUN]: 'Player_Run',
    [ANIM_STATES.SPRINT]: 'Player_Sprint',
    [ANIM_STATES.JUMP]: 'Player_Jump',
    [ANIM_STATES.FALL]: 'Player_Fall',
    [ANIM_STATES.LAND]: 'Player_Land',
    [ANIM_STATES.CROUCH]: 'Player_Crouch_Idle',
    [ANIM_STATES.CLIMB]: 'Player_Climb',
    [ANIM_STATES.SWIM]: 'Player_Swim',
    [ANIM_STATES.INTERACT]: 'Player_Interact',
    [ANIM_STATES.INSPECT]: 'Player_Inspect',
    [ANIM_STATES.EAT]: 'Player_Use_Item',
    [ANIM_STATES.DRINK]: 'Player_Use_Item',
    [ANIM_STATES.SIT]: 'Player_Sit',
    [ANIM_STATES.REST]: 'Player_Rest',
    [ANIM_STATES.PHOTO]: 'Player_Photo'
  };

  // Calibrated nominal reference speeds (units/sec) for foot-sliding elimination
  const NOMINAL_SPEEDS = {
    [ANIM_STATES.IDLE]: 0.0,
    [ANIM_STATES.CROUCH]: 8.5,
    [ANIM_STATES.WALK]: 16.0,
    [ANIM_STATES.RUN]: 32.0,
    [ANIM_STATES.SPRINT]: 55.0,
    [ANIM_STATES.SWIM]: 8.0,
    [ANIM_STATES.CLIMB]: 10.0
  };

  class CustomAnimationSystem {
    constructor(player, characterLoader) {
      this.player = player;
      this.loader = characterLoader;

      this.currentState = ANIM_STATES.IDLE;
      this.previousState = null;
      this.stateTimer = 0;
      this.lockedState = false;
      this.lockDuration = 0;

      // Skeletal bone tracking
      this.skeleton = null;
      this.bones = {
        head: null,
        neck: null,
        spine: null,
        spine1: null
      };

      this.lookAtTarget = null;
      this.lookAtWeight = 0;
      this.targetLookWeight = 0;
      this.currentYaw = 0;
      this.currentPitch = 0;

      // Gait blending
      this.cadenceScale = 1.0;
      this.leanAngle = 0;
    }

    /**
     * Bind skeleton from loaded GLTF
     */
    bindSkeleton(rootObject) {
      if (!rootObject) return;
      this.bones = { head: null, neck: null, spine: null, spine1: null };

      rootObject.traverse((node) => {
        if (node.isBone) {
          const name = node.name.toLowerCase();
          if (name.includes('head') && !this.bones.head) this.bones.head = node;
          else if (name.includes('neck') && !this.bones.neck) this.bones.neck = node;
          else if (name.includes('spine2') || name.includes('spine1')) this.bones.spine1 = node;
          else if (name.includes('spine') && !this.bones.spine) this.bones.spine = node;
        }
      });

      console.log('[CustomAnimationSystem] Rigged skeleton bones bound:', {
        head: !!this.bones.head,
        neck: !!this.bones.neck,
        spine: !!this.bones.spine
      });
    }

    /**
     * Request a state transition with blending and lock rules
     * @param {string} newState - Must be one of ANIM_STATES
     * @param {number} lockDuration - Optional non-interruptible duration
     * @param {number} blendDuration - Cross-fade transition time
     */
    transitionTo(newState, lockDuration = 0, blendDuration = 0.2) {
      // Normalize aliases
      if (newState === 'CROUCH_IDLE' || newState === 'CROUCH_WALK') newState = ANIM_STATES.CROUCH;
      if (newState === 'JUMP_START') newState = ANIM_STATES.JUMP;

      if (!ANIM_STATES[newState]) {
        console.warn(`[CustomAnimationSystem] Unknown state: ${newState}`);
        return false;
      }

      // If currently locked in an action (e.g. Land, Eat, Drink)
      if (this.lockedState && this.stateTimer < this.lockDuration && newState !== ANIM_STATES.FALL) {
        return false;
      }

      if (this.currentState === newState && !this.lockedState) {
        return true;
      }

      this.previousState = this.currentState;
      this.currentState = newState;
      this.stateTimer = 0;
      this.lockedState = lockDuration > 0;
      this.lockDuration = lockDuration;

      const clipName = STATE_CLIP_MAP[newState] || 'Player_Idle';
      if (this.loader && typeof this.loader.playAction === 'function') {
        this.loader.playAction(clipName, blendDuration);
      }

      return true;
    }

    /**
     * Set target position for procedural head and spine tracking
     * @param {THREE.Vector3|Object} targetPos
     * @param {number} weight - 0.0 to 1.0
     */
    setLookAtTarget(targetPos, weight = 1.0) {
      this.lookAtTarget = targetPos;
      this.targetLookWeight = Math.max(0, Math.min(1, weight));
    }

    clearLookAtTarget() {
      this.targetLookWeight = 0;
      setTimeout(() => {
        if (this.targetLookWeight === 0) this.lookAtTarget = null;
      }, 500);
    }

    /**
     * Update animation gait phase, bone tracking, and blend timings
     */
    update(deltaTime, currentSpeed = 0, playerRotation = 0, slopeIncline = 0) {
      this.stateTimer += deltaTime;

      if (this.lockedState && this.stateTimer >= this.lockDuration) {
        this.lockedState = false;
      }

      // 1. Gait cadence scaling to eliminate foot-sliding
      const nominal = NOMINAL_SPEEDS[this.currentState] || 0;
      if (nominal > 0 && currentSpeed > 0.1) {
        // Calculate exact scale factor so animation pace matches physical translation
        this.cadenceScale = Math.max(0.65, Math.min(1.45, currentSpeed / nominal));
        if (this.loader && typeof this.loader.setTimeScale === 'function') {
          this.loader.setTimeScale(this.cadenceScale);
        }
      } else {
        this.cadenceScale = 1.0;
        if (this.loader && typeof this.loader.setTimeScale === 'function') {
          this.loader.setTimeScale(1.0);
        }
      }

      // 2. Procedural Spine/Head bone tracking
      this._updateProceduralLookAt(deltaTime, playerRotation);
    }

    _updateProceduralLookAt(deltaTime, playerRotation) {
      // Smooth look-at weight transition
      this.lookAtWeight += (this.targetLookWeight - this.lookAtWeight) * Math.min(1.0, deltaTime * 5.0);

      if (this.lookAtWeight < 0.01 || !this.lookAtTarget || !this.player) return;

      const pPos = this.player.getPosition ? this.player.getPosition() : this.player;
      const dx = this.lookAtTarget.x - pPos.x;
      const dy = (this.lookAtTarget.y || pPos.y + 1.6) - (pPos.y + 1.6);
      const dz = this.lookAtTarget.z - pPos.z;
      const horizDist = Math.sqrt(dx * dx + dz * dz);

      if (horizDist < 0.5 || horizDist > 25.0) return;

      // Target yaw relative to player rotation
      const targetAngle = Math.atan2(dx, dz);
      let relYaw = targetAngle - playerRotation;
      while (relYaw < -Math.PI) relYaw += Math.PI * 2;
      while (relYaw > Math.PI) relYaw -= Math.PI * 2;

      // Clamp head yaw to natural human range (+/- 65 degrees)
      const clampedYaw = Math.max(-1.13, Math.min(1.13, relYaw));
      // Clamp pitch (+/- 35 degrees)
      const targetPitch = Math.atan2(dy, horizDist);
      const clampedPitch = Math.max(-0.61, Math.min(0.61, targetPitch));

      // Damped interpolation
      this.currentYaw += (clampedYaw - this.currentYaw) * Math.min(1.0, deltaTime * 6.0);
      this.currentPitch += (clampedPitch - this.currentPitch) * Math.min(1.0, deltaTime * 6.0);

      const effectiveWeight = this.lookAtWeight;

      // Apply to Head and Neck bones
      if (this.bones.head) {
        this.bones.head.rotation.y = this.currentYaw * 0.65 * effectiveWeight;
        this.bones.head.rotation.x = -this.currentPitch * 0.65 * effectiveWeight;
      }
      if (this.bones.neck) {
        this.bones.neck.rotation.y = this.currentYaw * 0.25 * effectiveWeight;
        this.bones.neck.rotation.x = -this.currentPitch * 0.25 * effectiveWeight;
      }
      if (this.bones.spine) {
        this.bones.spine.rotation.y = this.currentYaw * 0.10 * effectiveWeight;
      }
    }
  }

  window.CustomAnimationSystem = CustomAnimationSystem;
  window.ANIM_STATES = ANIM_STATES;
})();
