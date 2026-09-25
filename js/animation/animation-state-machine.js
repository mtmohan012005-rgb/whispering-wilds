/**
 * js/animation/animation-state-machine.js
 * The Whispering Wilds (Kaattu Vazhi) - Locomotion & Action State Machine
 *
 * Coordinates authoritative animation states, transition rules, locomotion blending,
 * aerial takeoff/landing cycles, vehicle mounting, and action commitments.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationStateMachine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // All 28 standard states required by Section 3
  const STATES = {
    IDLE: 'IDLE',
    WALK: 'WALK',
    FAST_WALK: 'FAST_WALK',
    RUN: 'RUN',
    SPRINT: 'SPRINT',
    START: 'START',
    STOP: 'STOP',
    TURN_LEFT: 'TURN_LEFT',
    TURN_RIGHT: 'TURN_RIGHT',
    STRAFE_LEFT: 'STRAFE_LEFT',
    STRAFE_RIGHT: 'STRAFE_RIGHT',
    BACKWARD: 'BACKWARD',
    JUMP: 'JUMP',
    FALL: 'FALL',
    LAND: 'LAND',
    CROUCH: 'CROUCH',
    BICYCLE: 'BICYCLE',
    BOAT: 'BOAT',
    INTERACT: 'INTERACT',
    INSPECT: 'INSPECT',
    CLIMB: 'CLIMB',
    PUSH: 'PUSH',
    PULL: 'PULL',
    OPEN: 'OPEN',
    CLOSE: 'CLOSE',
    TALK: 'TALK',
    PHOTO_MODE: 'PHOTO_MODE',
    CINEMATIC: 'CINEMATIC'
  };

  class AnimationStateMachine {
    constructor(initialState = STATES.IDLE) {
      this.currentState = initialState;
      this.previousState = null;
      this.stateTime = 0.0;
      this.transitionLockDuration = 0.0;
      this.isLocked = false;
      this.cancellable = true;

      // Speed thresholds (m/s)
      this.walkThreshold = 0.25;
      this.fastWalkThreshold = 1.85;
      this.runThreshold = 2.8;
      this.sprintThreshold = 4.8;

      // State history for debug/diagnostics
      this.history = [];
    }

    /**
     * Determines whether state can be interrupted by a new request
     */
    canTransitionTo(nextState) {
      if (this.currentState === nextState) return false;
      if (this.isLocked && !this.cancellable && this.stateTime < this.transitionLockDuration) {
        return false;
      }
      return true;
    }

    /**
     * Forces immediate transition into target state
     */
    forceTransition(nextState, lockDuration = 0.0, cancellable = true) {
      this.previousState = this.currentState;
      this.currentState = nextState;
      this.stateTime = 0.0;
      this.transitionLockDuration = lockDuration;
      this.isLocked = lockDuration > 0;
      this.cancellable = cancellable;

      this.history.push({
        from: this.previousState,
        to: nextState,
        timestamp: Date.now()
      });
      if (this.history.length > 30) this.history.shift();

      return true;
    }

    /**
     * Evaluates state machine based on movement parameters and action inputs
     * @param {number} deltaTime - Frame delta time in seconds
     * @param {Object} motionInput - Movement and environment input parameters
     * @returns {string} Effective active state
     */
    update(deltaTime, motionInput = {}) {
      this.stateTime += deltaTime;

      if (this.isLocked && this.stateTime >= this.transitionLockDuration) {
        this.isLocked = false;
      }

      // Priority 1: Cinematic and Photo Mode overrides
      if (motionInput.isCinematic) {
        if (this.currentState !== STATES.CINEMATIC) {
          this.forceTransition(STATES.CINEMATIC, 0.0, true);
        }
        return this.currentState;
      }
      if (motionInput.isPhotoMode) {
        if (this.currentState !== STATES.PHOTO_MODE) {
          this.forceTransition(STATES.PHOTO_MODE, 0.0, true);
        }
        return this.currentState;
      }

      // Priority 2: Committed non-cancellable actions
      if (this.isLocked && !this.cancellable) {
        return this.currentState;
      }

      // Priority 3: Action requests (interact, inspect, push, pull, climb, vehicle)
      if (motionInput.actionRequest) {
        const act = motionInput.actionRequest;
        let targetState = null;
        let lockTime = 0.0;
        let canCancel = false;

        switch (act.type) {
          case 'interact':
          case 'open':
          case 'close':
            targetState = act.type === 'open' ? STATES.OPEN : (act.type === 'close' ? STATES.CLOSE : STATES.INTERACT);
            lockTime = act.duration || 1.2;
            canCancel = false;
            break;
          case 'inspect':
            targetState = STATES.INSPECT;
            lockTime = act.duration || 2.2;
            canCancel = true;
            break;
          case 'climb':
            targetState = STATES.CLIMB;
            lockTime = act.duration || 1.0;
            canCancel = true;
            break;
          case 'push':
            targetState = STATES.PUSH;
            lockTime = act.duration || 1.0;
            canCancel = true;
            break;
          case 'pull':
            targetState = STATES.PULL;
            lockTime = act.duration || 1.0;
            canCancel = true;
            break;
          case 'bicycle':
            targetState = STATES.BICYCLE;
            lockTime = act.isMounting ? 1.4 : 0.0;
            canCancel = false;
            break;
          case 'boat':
            targetState = STATES.BOAT;
            lockTime = act.isBoarding ? 1.6 : 0.0;
            canCancel = false;
            break;
        }

        if (targetState && this.canTransitionTo(targetState)) {
          this.forceTransition(targetState, lockTime, canCancel);
          return this.currentState;
        }
      }

      // Priority 4: Aerial Physics (Jump -> Fall -> Land)
      const isGrounded = motionInput.isGrounded !== false;
      const verticalVel = motionInput.verticalVelocity || 0.0;

      if (!isGrounded) {
        if (verticalVel > 1.0) {
          if (this.currentState !== STATES.JUMP) {
            this.forceTransition(STATES.JUMP, 0.25, false);
          }
        } else {
          if (this.currentState !== STATES.FALL) {
            this.forceTransition(STATES.FALL, 0.0, true);
          }
        }
        return this.currentState;
      } else {
        // Transition from airborne to ground -> Trigger LAND
        if (this.currentState === STATES.FALL || this.currentState === STATES.JUMP) {
          this.forceTransition(STATES.LAND, 0.35, false);
          return this.currentState;
        }
      }

      // Priority 5: Land recovery completes -> return to Locomotion
      if (this.currentState === STATES.LAND) {
        if (this.stateTime >= this.transitionLockDuration) {
          // Landing recovery done
          this.isLocked = false;
        } else {
          return this.currentState;
        }
      }

      // Priority 6: Vehicle Locomotion
      if (motionInput.transportMode === 'bicycle') {
        if (this.currentState !== STATES.BICYCLE) {
          this.forceTransition(STATES.BICYCLE, 0.0, true);
        }
        return this.currentState;
      }
      if (motionInput.transportMode === 'boat') {
        if (this.currentState !== STATES.BOAT) {
          this.forceTransition(STATES.BOAT, 0.0, true);
        }
        return this.currentState;
      }

      // Priority 7: Crouch Locomotion
      if (motionInput.isCrouching) {
        if (this.currentState !== STATES.CROUCH) {
          this.forceTransition(STATES.CROUCH, 0.0, true);
        }
        return this.currentState;
      }

      // Priority 8: Ground Locomotion evaluation
      const speed = motionInput.speed || 0.0;
      const turnAngle = motionInput.turnAngle || 0.0;
      const strafe = motionInput.strafe || 0.0; // -1 (left) to 1 (right)
      const backward = !!motionInput.isBackward;

      // Handle Stationary Turning (In-Place Turn)
      if (speed < this.walkThreshold && Math.abs(turnAngle) > Math.PI / 4) {
        const turnState = turnAngle < 0 ? STATES.TURN_LEFT : STATES.TURN_RIGHT;
        if (this.canTransitionTo(turnState)) {
          this.forceTransition(turnState, 0.45, true);
          return this.currentState;
        }
      }

      // Backward locomotion
      if (speed >= this.walkThreshold && backward) {
        if (this.canTransitionTo(STATES.BACKWARD)) {
          this.forceTransition(STATES.BACKWARD, 0.0, true);
        }
        return this.currentState;
      }

      // Strafe locomotion
      if (speed >= this.walkThreshold && Math.abs(strafe) > 0.5) {
        const strafeState = strafe < 0 ? STATES.STRAFE_LEFT : STATES.STRAFE_RIGHT;
        if (this.canTransitionTo(strafeState)) {
          this.forceTransition(strafeState, 0.0, true);
        }
        return this.currentState;
      }

      // Forward locomotion spectrum (Idle -> Start -> Walk -> Fast Walk -> Run -> Sprint)
      if (speed < this.walkThreshold) {
        // Was moving fast and just stopped -> trigger STOP brace
        if ((this.currentState === STATES.RUN || this.currentState === STATES.SPRINT || this.currentState === STATES.FAST_WALK) && this.canTransitionTo(STATES.STOP)) {
          this.forceTransition(STATES.STOP, 0.35, true);
          return this.currentState;
        }

        if (this.currentState === STATES.STOP && this.stateTime < this.transitionLockDuration) {
          return this.currentState;
        }

        if (this.currentState !== STATES.IDLE && this.canTransitionTo(STATES.IDLE)) {
          this.forceTransition(STATES.IDLE, 0.0, true);
        }
        return this.currentState;
      }

      // From Idle starting to move -> trigger START
      if (this.currentState === STATES.IDLE && speed >= this.walkThreshold && this.canTransitionTo(STATES.START)) {
        this.forceTransition(STATES.START, 0.25, true);
        return this.currentState;
      }

      if (this.currentState === STATES.START && this.stateTime < this.transitionLockDuration) {
        return this.currentState;
      }

      // Speed-based locomotion states
      let nextLocomotion = STATES.WALK;
      if (speed >= this.sprintThreshold) {
        nextLocomotion = STATES.SPRINT;
      } else if (speed >= this.runThreshold) {
        nextLocomotion = STATES.RUN;
      } else if (speed >= this.fastWalkThreshold) {
        nextLocomotion = STATES.FAST_WALK;
      } else {
        nextLocomotion = STATES.WALK;
      }

      if (this.currentState !== nextLocomotion && this.canTransitionTo(nextLocomotion)) {
        this.forceTransition(nextLocomotion, 0.0, true);
      }

      return this.currentState;
    }
  }

  AnimationStateMachine.STATES = STATES;

  return AnimationStateMachine;
});
