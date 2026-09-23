/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Traversal & Locomotion State System (TraversalSystem)
 * Manages authored climbing splines, shallow wading vs deep swimming physics,
 * crouch clearances, jump airborne lifecycles, and survival vitals integration.
 */

class TraversalSystem {
  /**
   * @param {ThreePlayer} player - ThreePlayer controller reference
   * @param {ThreeCamera} camera - ThreeCamera controller reference
   * @param {WorldCollision} collision - WorldCollision engine reference
   */
  constructor(player = null, camera = null, collision = null) {
    this.player = player;
    this.camera = camera;
    this.collision = collision;

    // Water state
    this.waterZones = (typeof window.WATER_ZONES_CONFIG !== 'undefined') ? window.WATER_ZONES_CONFIG : [];
    this.currentWaterZone = null;
    this.isSwimming = false;
    this.waterState = 'OUT_OF_WATER'; // 'OUT_OF_WATER' | 'ENTER_WATER' | 'SWIM' | 'EXIT_WATER'

    // Climbing state
    this.isClimbing = false;
    this.climbWaypoints = [];
    this.currentWaypointIndex = 0;
    this.climbProgress = 0;
    this.climbSpeed = 2.5;

    // Crouch state
    this.isCrouched = false;

    // Authoritative Movement Lock
    this.movementLocked = false;
    this.lockReason = '';
  }

  setMovementLocked(locked, reason = '') {
    this.movementLocked = !!locked;
    this.lockReason = reason;
  }

  isMovementAllowed() {
    return !this.movementLocked && !this.isClimbing;
  }

  /**
   * Initiates authored climb traversal along waypoints (Section 8)
   */
  startClimb(climbableObject) {
    if (!climbableObject || !climbableObject.waypoints || climbableObject.waypoints.length < 2) {
      return false;
    }

    this.isClimbing = true;
    this.climbWaypoints = climbableObject.waypoints;
    this.currentWaypointIndex = 0;
    this.climbProgress = 0;
    this.climbSpeed = climbableObject.climbSpeed || 2.5;

    if (this.player) {
      this.player.state = window.PLAYER_STATE.CLIMB;
      if (this.player.characterLoader) {
        this.player.characterLoader.playAction('Player_Climb_Start', 0.15);
      }
    }

    if (this.camera && typeof this.camera.setClimbingMode === 'function') {
      this.camera.setClimbingMode(true);
    }

    if (window.explorationSystem) {
      window.explorationSystem.setExplorationState('CLIMBING');
    }

    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('climb_grab', climbableObject.position, 1.0);
    }

    return true;
  }

  updateClimbing(deltaTime) {
    if (!this.isClimbing || this.climbWaypoints.length < 2 || !this.player) return;

    const p0 = this.climbWaypoints[this.currentWaypointIndex];
    const p1 = this.climbWaypoints[this.currentWaypointIndex + 1];

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dz = p1.z - p0.z;
    const segmentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const step = (this.climbSpeed * deltaTime) / Math.max(0.1, segmentLength);
    this.climbProgress += step;

    const t = Math.min(1.0, this.climbProgress);
    const currX = p0.x + dx * t;
    const currY = p0.y + dy * t;
    const currZ = p0.z + dz * t;

    this.player.x = currX;
    this.player.y = currY;
    this.player.z = currZ;
    this.player.group.position.set(currX, currY, currZ);

    if (this.player.characterLoader) {
      this.player.characterLoader.playAction('Player_Climb_Loop', 0.1);
    }

    if (t >= 1.0) {
      this.currentWaypointIndex++;
      this.climbProgress = 0;

      if (this.currentWaypointIndex >= this.climbWaypoints.length - 1) {
        // Reached end of climb
        this.endClimb();
      }
    }
  }

  endClimb() {
    this.isClimbing = false;
    if (this.player) {
      this.player.state = window.PLAYER_STATE.IDLE;
      if (this.player.characterLoader) {
        this.player.characterLoader.playAction('Player_Climb_End', 0.15);
      }
    }

    if (this.camera && typeof this.camera.setClimbingMode === 'function') {
      this.camera.setClimbingMode(false);
    }

    if (window.explorationSystem) {
      window.explorationSystem.setExplorationState('NORMAL');
    }
  }

  /**
   * Water detection & swimming physics (Section 11)
   */
  updateWater(playerPos, deltaTime) {
    if (!playerPos) return;

    let inZone = null;
    for (const z of this.waterZones) {
      const b = z.bounds;
      if (playerPos.x >= b.minX && playerPos.x <= b.maxX && playerPos.z >= b.minZ && playerPos.z <= b.maxZ) {
        inZone = z;
        break;
      }
    }

    this.currentWaterZone = inZone;

    if (inZone && inZone.swimmable) {
      const waterSurfaceY = inZone.surfaceY;
      const playerY = playerPos.y;
      const depth = waterSurfaceY - playerY;

      if (depth > 0.8) {
        // Deep water: Swimming state
        if (!this.isSwimming) {
          this.isSwimming = true;
          this.waterState = 'ENTER_WATER';
          if (this.player) {
            this.player.state = window.PLAYER_STATE.SWIM;
            if (this.player.characterLoader) {
              this.player.characterLoader.playAction('Player_Swim', 0.2);
            }
          }
          if (this.camera && typeof this.camera.setSwimmingMode === 'function') {
            this.camera.setSwimmingMode(true);
          }
          if (window.explorationSystem) {
            window.explorationSystem.setExplorationState('SWIMMING');
          }
          if (window.audioManager && window.audioManager.spatial) {
            window.audioManager.spatial.playSpatialClip('water_splash', playerPos, 1.0);
          }
        }

        // Apply swimming survival penalties
        if (window.gameSurvival) {
          window.gameSurvival.consumeEnergy(inZone.energyDrainPerSec * deltaTime);
          if (inZone.warmthDrainPerSec && window.gameSurvival.coreTemp) {
            window.gameSurvival.coreTemp = Math.max(34.0, window.gameSurvival.coreTemp - inZone.warmthDrainPerSec * deltaTime);
          }
        }
      } else {
        // Shallow wade
        if (this.isSwimming) {
          this.exitWater();
        }
      }
    } else {
      if (this.isSwimming) {
        this.exitWater();
      }
    }
  }

  exitWater() {
    this.isSwimming = false;
    this.waterState = 'EXIT_WATER';
    if (this.player) {
      this.player.state = window.PLAYER_STATE.IDLE;
    }
    if (this.camera && typeof this.camera.setSwimmingMode === 'function') {
      this.camera.setSwimmingMode(false);
    }
    if (window.explorationSystem) {
      window.explorationSystem.setExplorationState('NORMAL');
    }
  }

  /**
   * Main per-frame tick
   */
  update(inputState, deltaTime, playerPos) {
    if (this.isClimbing) {
      this.updateClimbing(deltaTime);
      return;
    }

    if (playerPos) {
      this.updateWater(playerPos, deltaTime);
    }
  }
}

window.TraversalSystem = TraversalSystem;
