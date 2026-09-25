/**
 * js/animation/animation-controller.js
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative Animation Controller
 *
 * Central authority for character animation playback across Player, NPCs,
 * and Wildlife. Integrates state machine, cross-fade blender, motion matching,
 * Foot/Hand/Full-Body IK, look-at gaze, upper-body layers, additive dynamics,
 * and event dispatching.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationController = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationController {
    constructor(rootObject = null, entityType = 'PLAYER', profileId = null) {
      this.rootObject = rootObject;
      this.entityType = entityType; // 'PLAYER' | 'NPC' | 'WILDLIFE'
      this.profileId = profileId;

      // Centralized animation sub-systems
      const ASM = (typeof window !== 'undefined' && window.AnimationStateMachine) ? window.AnimationStateMachine : null;
      const AB = (typeof window !== 'undefined' && window.AnimationBlender) ? window.AnimationBlender : null;
      const MM = (typeof window !== 'undefined' && window.MotionMatching) ? window.MotionMatching : null;
      const FIK = (typeof window !== 'undefined' && window.FootIKSystem) ? window.FootIKSystem : null;
      const HIK = (typeof window !== 'undefined' && window.HandIKSystem) ? window.HandIKSystem : null;
      const FBIK = (typeof window !== 'undefined' && window.FullBodyIK) ? window.FullBodyIK : null;
      const LAS = (typeof window !== 'undefined' && window.LookAtSystem) ? window.LookAtSystem : null;
      const PC = (typeof window !== 'undefined' && window.PoseController) ? window.PoseController : null;
      const UBL = (typeof window !== 'undefined' && window.UpperBodyLayer) ? window.UpperBodyLayer : null;
      const AA = (typeof window !== 'undefined' && window.AdditiveAnimation) ? window.AdditiveAnimation : null;
      const AE = (typeof window !== 'undefined' && window.AnimationEvents) ? window.AnimationEvents : null;

      this.stateMachine = ASM ? new ASM() : null;
      this.blender = AB ? new AB() : null;
      this.motionMatching = MM ? new MM() : null;
      this.footIK = FIK ? new FIK() : null;
      this.handIK = HIK ? new HIK() : null;
      this.fullBodyIK = FBIK ? new FBIK() : null;
      this.lookAt = LAS ? new LAS() : null;
      this.poseController = PC ? new PC() : null;
      this.upperBodyLayer = UBL ? new UBL() : null;
      this.additive = AA ? new AA() : null;
      this.events = AE ? new AE() : null;

      // Three.js mixer and actions
      this.mixer = null;
      this.actions = new Map(); // clipId -> THREE.AnimationAction
      this.currentClipId = 'Player_Idle';
      this.currentState = 'IDLE';

      // LOD & Quality settings
      this.lodTier = 0; // 0 = LOD0 (Full), 1 = LOD1, 2 = LOD2, 3 = LOD3
      this.qualityLevel = 'HIGH'; // 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'

      // Root motion tracking
      this.rootMotionDelta = { x: 0, y: 0, z: 0 };
      this.rootMotionActive = false;

      // Delta time clamp for Alt+Tab safety (Section 70)
      this.maxDeltaTime = 0.1; // Max 100ms per frame

      if (rootObject) {
        this.bindSkeleton(rootObject);
      }
    }

    /**
     * Binds Three.js skinned mesh or skeleton root
     */
    bindSkeleton(rootObject) {
      this.rootObject = rootObject;
      if (typeof THREE !== 'undefined' && THREE.AnimationMixer) {
        this.mixer = new THREE.AnimationMixer(rootObject);
        if (this.blender) this.blender.setMixer(this.mixer);

        // Register in cache to detect duplicates
        if (typeof window !== 'undefined' && window.ProductionAnimationCache) {
          window.ProductionAnimationCache.registerMixer(this.mixer);
        }
      }

      if (this.poseController) {
        this.poseController.bindSkeleton(rootObject);
      }
    }

    /**
     * Registers an AnimationAction with the controller
     */
    registerAction(clipId, action) {
      if (clipId && action) {
        this.actions.set(clipId, action);
      }
    }

    /**
     * Sets LOD level (0 to 3) to scale features based on distance
     */
    setLOD(tier) {
      this.lodTier = tier;
      if (tier >= 2) {
        if (this.footIK) this.footIK.setQualityLevel('LOW');
        if (this.handIK) this.handIK.enabled = false;
      } else if (tier === 1) {
        if (this.footIK) this.footIK.setQualityLevel('MEDIUM');
        if (this.handIK) this.handIK.enabled = true;
      } else {
        if (this.footIK) this.footIK.setQualityLevel('HIGH');
        if (this.handIK) this.handIK.enabled = true;
      }
    }

    setQualityLevel(quality) {
      this.qualityLevel = quality;
      if (quality === 'LOW') {
        this.setLOD(2);
      } else if (quality === 'MEDIUM') {
        this.setLOD(1);
      } else {
        this.setLOD(0);
      }
    }

    /**
     * Master authoritative animation frame update
     * @param {number} rawDeltaTime - Seconds elapsed
     * @param {Object} motionInput - Velocity, speed, ground, actions
     */
    update(rawDeltaTime, motionInput = {}) {
      // 1. Clamp delta time against pauses / sleep / Alt+Tab (Section 70)
      const deltaTime = Math.min(Math.max(rawDeltaTime, 0.0), this.maxDeltaTime);

      // 2. Evaluate State Machine
      let activeState = 'IDLE';
      if (this.stateMachine) {
        activeState = this.stateMachine.update(deltaTime, motionInput);
        this.currentState = activeState;
      }

      // 3. Evaluate Motion Matching if in Locomotion
      let targetClipId = 'Player_Idle';
      if (this.motionMatching && (activeState === 'WALK' || activeState === 'FAST_WALK' || activeState === 'RUN' || activeState === 'SPRINT')) {
        const query = {
          speed: motionInput.speed,
          direction: motionInput.direction,
          turnAngle: motionInput.turnAngle,
          isGrounded: motionInput.isGrounded,
          currentClipId: this.currentClipId,
          qualityTier: this.qualityLevel
        };
        const match = this.motionMatching.queryBestMatch(query);
        targetClipId = match.clipId;
      } else {
        targetClipId = this._mapStateToClip(activeState, motionInput);
      }

      // 4. Blend to Target Action
      if (this.blender && this.actions.has(targetClipId)) {
        const targetAction = this.actions.get(targetClipId);
        this.blender.transitionToAction(targetAction, targetClipId, this.stateMachine ? this.stateMachine.previousState : null, activeState);
      }
      this.currentClipId = targetClipId;

      // 5. Advance Mixer
      if (this.mixer) {
        this.mixer.update(deltaTime);
      }

      // 6. Evaluate Animation Events
      if (this.events && typeof window !== 'undefined' && window.ProductionAnimationRegistry) {
        const meta = window.ProductionAnimationRegistry.getClip(targetClipId);
        if (meta && meta.events && this.blender && this.blender.currentAction) {
          const action = this.blender.currentAction;
          this.events.update(meta.events, action.time, meta.duration);
        }
      }

      // 7. Procedural IK & Secondary layers (if LOD tier permits)
      if (this.lodTier <= 1) {
        // Foot IK
        if (this.footIK && motionInput.leftFoot && motionInput.rightFoot && motionInput.terrainElevationFn) {
          this.footIK.evaluateFeet(
            motionInput.leftFoot,
            motionInput.rightFoot,
            motionInput.terrainElevationFn,
            motionInput.contactPhases
          );
        }

        // Full Body Pelvis Compensation
        if (this.fullBodyIK && this.footIK) {
          this.fullBodyIK.solveHumanGrounding(
            this.footIK.leftFootOffset,
            this.footIK.rightFootOffset,
            motionInput.groundNormal
          );
        }

        // Slope Adaptation
        if (this.poseController && motionInput.groundNormal) {
          this.poseController.applySlopeAdaptation(motionInput.groundNormal);
        }

        // Secondary Cloth dynamics
        if (this.poseController && motionInput.position) {
          this.poseController.applyClothSecondaryMotion(
            deltaTime,
            motionInput.position,
            motionInput.wind,
            motionInput.outfitType || 'everyday_veshti'
          );
        }

        // Look-At System
        if (this.lookAt && motionInput.headPosition && typeof motionInput.facingAngle === 'number') {
          this.lookAt.update(deltaTime, motionInput.headPosition, motionInput.facingAngle);
        }

        // Upper-Body Layering
        if (this.upperBodyLayer) {
          this.upperBodyLayer.update(deltaTime);
        }

        // Additive Breathing & Fatigue
        if (this.additive) {
          this.additive.setVitals(
            motionInput.stamina || 100,
            motionInput.temperature || 28,
            motionInput.windSpeed || 0
          );
          this.additive.update(deltaTime);
        }
      }

      return {
        state: this.currentState,
        clipId: this.currentClipId,
        lodTier: this.lodTier
      };
    }

    _mapStateToClip(state, motionInput) {
      switch (state) {
        case 'IDLE': return 'Player_Idle';
        case 'START': return 'Player_Start';
        case 'WALK': return 'Player_Walk';
        case 'FAST_WALK': return 'Player_Fast_Walk';
        case 'RUN': return 'Player_Run';
        case 'SPRINT': return 'Player_Sprint';
        case 'STOP': return 'Player_Stop';
        case 'TURN_LEFT': return 'Player_Turn_Left';
        case 'TURN_RIGHT': return 'Player_Turn_Right';
        case 'STRAFE_LEFT': return 'Player_Strafe_Left';
        case 'STRAFE_RIGHT': return 'Player_Strafe_Right';
        case 'BACKWARD': return 'Player_Backward';
        case 'JUMP': return 'Player_Jump_Start';
        case 'FALL': return 'Player_Fall';
        case 'LAND': return 'Player_Land';
        case 'CROUCH': return motionInput.speed > 0.2 ? 'Player_Crouch_Walk' : 'Player_Crouch_Idle';
        case 'INTERACT':
        case 'OPEN':
        case 'CLOSE': return 'Player_Interact';
        case 'INSPECT': return 'Player_Inspect';
        case 'CLIMB': return 'Player_Climb';
        case 'PUSH': return 'Player_Push';
        case 'PULL': return 'Player_Pull';
        case 'BICYCLE': return motionInput.speed > 0.2 ? 'Player_Bicycle_Pedal' : 'Player_Bicycle_Mount';
        case 'BOAT': return motionInput.speed > 0.2 ? 'Player_Boat_Row' : 'Player_Boat_Board';
        case 'PHOTO_MODE': return 'Player_Photo_Pose';
        case 'TALK': return 'Player_Talk';
        case 'CINEMATIC': return 'Player_Cinematic';
        default: return 'Player_Idle';
      }
    }

    /**
     * Clean resource disposal (Section 113)
     */
    dispose() {
      if (this.blender) {
        this.blender.stopAll();
      }
      if (this.mixer && typeof window !== 'undefined' && window.ProductionAnimationCache) {
        window.ProductionAnimationCache.unregisterMixer(this.mixer);
      }
      this.actions.clear();
      this.mixer = null;
      this.rootObject = null;
    }
  }

  return AnimationController;
});
