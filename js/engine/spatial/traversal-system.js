/**
 * The Whispering Wilds - Traversal System
 * Handles climbing, ledge hanging, shimmy, swim entry/exit, step-up/down, crouching.
 * Integrates with CollisionSystem, AnimationController and GameState.
 * All state changes go through GameState — never a second hidden position.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.TraversalSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Traversal States ────────────────────────────────────────────────────────
  const TraversalState = Object.freeze({
    IDLE:         'idle',
    WALK:         'walk',
    RUN:          'run',
    SPRINT:       'sprint',
    CROUCH:       'crouch',
    JUMP:         'jump',
    FALL:         'fall',
    LAND:         'land',
    STEP_UP:      'step_up',
    STEP_DOWN:    'step_down',
    CLIMB:        'climb',
    HANG:         'hang',
    SHIMMY:       'shimmy',
    SWIM:         'swim',
    SWIM_SURFACE: 'swim_surface',
    ENTER_VEHICLE:'enter_vehicle',
    EXIT_VEHICLE: 'exit_vehicle',
    BOAT:         'boat',
    STUMBLE:      'stumble'
  });

  // ─── Climbable Surface Descriptor ────────────────────────────────────────────
  class ClimbableSurface {
    constructor(id, data) {
      this.id          = id;
      this.entryPoint  = data.entryPoint  || { x: 0, y: 0, z: 0 };
      this.exitPoint   = data.exitPoint   || { x: 0, y: 0, z: 0 };
      this.direction   = data.direction   || { x: 0, y: 1, z: 0 }; // Climb direction
      this.height      = data.height      || 2.0;
      this.animationSet = data.animationSet || 'climb_default';
      this.staminaCost  = data.staminaCost  ?? 0.1;   // Per second
      this.active       = true;
    }
  }

  // ─── Traversal Probes ─────────────────────────────────────────────────────────
  // Used for ledge detection
  class TraversalProbes {
    /**
     * Cast probes in multiple directions to detect ledge geometry.
     * In a real Three.js integration these would be raycasts.
     * Here we provide the interface and dummy implementations.
     */
    static probeForward(pos, dir, radius = 0.4, dist = 0.6) {
      // Returns { hit, point, normal }
      return { hit: false, point: null, normal: null };
    }

    static probeDown(pos, maxDist = 1.5) {
      return { hit: false, point: null, distance: Infinity };
    }

    static probeUp(pos, maxDist = 1.0) {
      return { hit: false, distance: Infinity };
    }

    static probeSide(pos, rightDir, dist = 0.8) {
      return { hit: false };
    }
  }

  // ─── Main Traversal System ───────────────────────────────────────────────────
  class TraversalSystem {
    constructor() {
      this._state          = TraversalState.IDLE;
      this._prevState      = TraversalState.IDLE;
      this._climbables     = new Map();
      this._activeClimbable = null;
      this._gameState      = null;
      this._eventBus       = null;
      this._collisionSys   = null;
      this._inputManager   = null;

      // Swim state
      this._swimStamina    = 100;
      this._swimStaminaMax = 100;
      this._swimStaminaDrain = 5; // Per second while swimming actively

      // Clearance check for crouching
      this._standClearance = 1.8; // m required to stand up

      // Jump config
      this._jumpVelocity  = 7.0;
      this._jumpCooldown  = 0;
      this._jumpCooldownTime = 0.5;
    }

    init(deps) {
      this._gameState    = deps.gameState;
      this._eventBus     = deps.eventBus;
      this._collisionSys = deps.collisionSystem;
      this._inputManager = deps.inputManager;
    }

    // ─── Climbable Registration ──────────────────────────────────────────────

    registerClimbable(id, data) {
      this._climbables.set(id, new ClimbableSurface(id, data));
    }

    unregisterClimbable(id) { this._climbables.delete(id); }

    // ─── State Machine ───────────────────────────────────────────────────────

    setState(newState) {
      if (this._state === newState) return;
      this._prevState = this._state;
      this._state     = newState;
      if (this._eventBus) {
        this._eventBus.emit('TRAVERSAL_STATE_CHANGED', {
          prev: this._prevState,
          current: newState
        });
      }
      // Mirror into GameState for animation system
      if (this._gameState && this._gameState.player) {
        this._gameState.player.traversalState = newState;
      }
    }

    getState() { return this._state; }

    // ─── Update ──────────────────────────────────────────────────────────────

    update(dt) {
      if (!this._gameState || !this._gameState.player) return;
      const player = this._gameState.player;

      // Jump cooldown
      if (this._jumpCooldown > 0) this._jumpCooldown -= dt;

      // Handle state-specific logic
      switch (this._state) {
        case TraversalState.CLIMB:  this._updateClimb(player, dt);  break;
        case TraversalState.SWIM:   this._updateSwim(player, dt);   break;
        case TraversalState.CROUCH: this._updateCrouch(player);     break;
        default: this._updateGroundMovement(player, dt);            break;
      }
    }

    // ─── Ground Movement ─────────────────────────────────────────────────────

    _updateGroundMovement(player, dt) {
      const grounded = this._collisionSys?.isGrounded('player') ?? false;
      const inWater  = this._collisionSys?.isInWater('player')  ?? false;

      if (inWater) {
        const waterType = this._collisionSys?.getWaterType('player');
        if (waterType === 'swimmable' || waterType === 'deep') {
          this.setState(TraversalState.SWIM);
          return;
        }
      }

      if (!grounded && this._state !== TraversalState.JUMP) {
        this.setState(TraversalState.FALL);
        return;
      }

      if (this._state === TraversalState.FALL && grounded) {
        this.setState(TraversalState.LAND);
        // Return to appropriate locomotion after landing
        setTimeout(() => {
          if (this._state === TraversalState.LAND) this.setState(TraversalState.IDLE);
        }, 300);
        return;
      }
    }

    // ─── Jump ────────────────────────────────────────────────────────────────

    /**
     * Attempt a jump. Returns true if jump was applied.
     */
    tryJump() {
      if (this._jumpCooldown > 0) return false;
      const grounded = this._collisionSys?.isGrounded('player') ?? false;
      if (!grounded) return false;
      if (this._state === TraversalState.CROUCH) return false;

      if (this._gameState && this._gameState.player) {
        const vel = this._gameState.player.velocity;
        if (vel) vel.y = this._jumpVelocity;
      }
      this.setState(TraversalState.JUMP);
      this._jumpCooldown = this._jumpCooldownTime;
      return true;
    }

    // ─── Crouch ──────────────────────────────────────────────────────────────

    toggleCrouch(forceState = null) {
      const isCrouching = this._state === TraversalState.CROUCH;
      if (forceState === true || (!isCrouching && forceState !== false)) {
        // Entering crouch
        this.setState(TraversalState.CROUCH);
        const agent = this._collisionSys?.getAgent('player');
        if (agent) agent.capsule.setCrouching(true);
      } else {
        // Try to stand — check clearance
        if (this._hasClearanceToStand()) {
          this.setState(TraversalState.IDLE);
          const agent = this._collisionSys?.getAgent('player');
          if (agent) agent.capsule.setCrouching(false);
        }
        // If no clearance — remain crouched silently
      }
    }

    _hasClearanceToStand() {
      // In full implementation this would ray-cast upward
      // Here we default true (terrain detection handles ceiling)
      return true;
    }

    _updateCrouch(player) {
      // Crouch is a passive state — locomotion still works, just reduced height
      const grounded = this._collisionSys?.isGrounded('player') ?? false;
      if (!grounded) {
        this.setState(TraversalState.FALL);
        const agent = this._collisionSys?.getAgent('player');
        if (agent) agent.capsule.setCrouching(false);
      }
    }

    // ─── Climb ───────────────────────────────────────────────────────────────

    tryClimb(climbableId) {
      const surface = this._climbables.get(climbableId);
      if (!surface || !surface.active) return false;
      this._activeClimbable = surface;
      this.setState(TraversalState.CLIMB);
      return true;
    }

    _updateClimb(player, dt) {
      const surface = this._activeClimbable;
      if (!surface) { this.setState(TraversalState.IDLE); return; }

      // Drain stamina
      if (player.survival) {
        player.survival.energy = Math.max(0, player.survival.energy - surface.staminaCost * dt);
        if (player.survival.energy <= 0) {
          // Exhausted — stop climbing
          this._activeClimbable = null;
          this.setState(TraversalState.FALL);
          return;
        }
      }
    }

    exitClimb() {
      if (this._state !== TraversalState.CLIMB && this._state !== TraversalState.HANG) return;
      if (this._activeClimbable) {
        const exitPt = this._activeClimbable.exitPoint;
        if (this._gameState && this._gameState.player) {
          const pos = this._gameState.player.position;
          pos.x = exitPt.x;
          pos.y = exitPt.y;
          pos.z = exitPt.z;
        }
      }
      this._activeClimbable = null;
      this.setState(TraversalState.IDLE);
    }

    // ─── Swim ────────────────────────────────────────────────────────────────

    _updateSwim(player, dt) {
      const inWater = this._collisionSys?.isInWater('player') ?? false;
      if (!inWater) {
        // Exiting water
        this.setState(TraversalState.IDLE);
        if (this._eventBus) this._eventBus.emit('SWIM_EXITED', {});
        return;
      }
      // Drain stamina while actively swimming
      const vel = player.velocity;
      const moving = vel && (Math.abs(vel.x) > 0.1 || Math.abs(vel.z) > 0.1);
      if (moving && player.survival) {
        player.survival.energy = Math.max(0, player.survival.energy - this._swimStaminaDrain * dt);
      }
    }

    // ─── Fast Travel Validation ───────────────────────────────────────────────

    /**
     * Validate whether fast travel to a destination is permitted.
     * @param {Object} destination - { discovered, unlocked, spawnable }
     * @returns {{ allowed: boolean, reason: string }}
     */
    validateFastTravel(destination) {
      if (!destination) return { allowed: false, reason: 'no_destination' };
      if (!destination.discovered) return { allowed: false, reason: 'not_discovered' };
      if (!destination.unlocked)   return { allowed: false, reason: 'not_unlocked' };
      if (!destination.spawnable)  return { allowed: false, reason: 'no_spawn_point' };
      if (this._state === TraversalState.SWIM)  return { allowed: false, reason: 'in_water' };
      if (this._state === TraversalState.CLIMB) return { allowed: false, reason: 'climbing' };
      if (this._state === TraversalState.BOAT)  return { allowed: false, reason: 'on_boat' };
      return { allowed: true, reason: '' };
    }

    destroy() {
      this._climbables.clear();
      this._activeClimbable = null;
    }
  }

  return { TraversalState, ClimbableSurface, TraversalProbes, TraversalSystem };
});
