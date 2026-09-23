/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Wooden Boat Controller (BoatController)
 * Authentic Tamil Nadu thoni canoe physics, water navigation zone bounds,
 * paddle animations, wave bobbing, and dock entry/exit mechanics.
 */

class BoatController {
  /**
   * @param {Object} config - Boat configuration
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    this.id = config.id || 'pichavaram_thoni_01';
    this.name = config.name || 'Traditional Wooden Thoni';
    this.tamilName = config.tamilName || 'பிச்சாவரம் நாட்டுப் படகு (தோணி)';
    this.region = config.region || 'PICHAVARAM';
    this.scene = scene;
    this.collision = collision;

    // Navigation Zone Config
    this.zone = config.zone || (window.BOAT_NAVIGATION_ZONES ? window.BOAT_NAVIGATION_ZONES[0] : null);
    this.waterLevelY = this.zone ? this.zone.waterLevelY : 1.0;

    // Transform & Dynamics
    this.x = config.x !== undefined ? config.x : -80;
    this.z = config.z !== undefined ? config.z : -40;
    this.y = this.waterLevelY;
    this.heading = config.heading || 0; // radians
    this.velocity = 0;
    this.maxSpeed = (this.zone && this.zone.maxSpeed) || 20.0;
    this.reverseSpeed = (this.zone && this.zone.reverseSpeed) || 6.0;
    this.turnRate = (this.zone && this.zone.turnRate) || 1.35;
    this.acceleration = 12.0;
    this.friction = 3.5;

    // Wave bobbing dynamics
    this.waveTime = 0;
    this.pitch = 0;
    this.roll = 0;

    // Player occupancy
    this.isOccupied = false;
    this.playerRef = null;

    // Visual Mesh Group
    this.group = new THREE.Group();
    this.group.position.set(this.x, this.y, this.z);
    this.buildBoatMesh();

    if (this.scene) {
      this.scene.add(this.group);
    }

    // userData for interaction
    this.group.userData = {
      interactable: true,
      interactionType: 'boat',
      interactionId: this.id,
      entityRef: this,
      description: 'A handcrafted wooden thoni dugout canoe suited for navigating winding mangrove creeks.'
    };
  }

  buildBoatMesh() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2514,
      roughness: 0.8,
      metalness: 0.1
    });
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x5a371c,
      roughness: 0.75
    });

    // Hull (tapered canoe shape)
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.45, 4.2, 8),
      woodMat
    );
    hull.rotation.z = Math.PI * 0.5;
    hull.rotation.y = Math.PI * 0.5;
    hull.scale.set(0.65, 1.0, 1.3);
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.group.add(hull);

    // Cross benches (sitting planks)
    for (let i = -1; i <= 1; i++) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.35), benchMat);
      bench.position.set(0, 0.12, i * 1.1);
      this.group.add(bench);
    }

    // Paddle resting along the gunwale
    const paddle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6),
      benchMat
    );
    paddle.rotation.x = Math.PI * 0.5;
    paddle.position.set(0.48, 0.25, 0);
    this.group.add(paddle);
  }

  mountPlayer(threePlayer) {
    if (this.isOccupied) return false;
    this.isOccupied = true;
    this.playerRef = threePlayer;

    // Attach player to boat visually
    if (this.playerRef && this.playerRef.characterLoader) {
      this.playerRef.characterLoader.playAction('Player_Idle', 0.2);
    }

    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('water_splash', this.group.position, 1.0);
    }
    return true;
  }

  dismountPlayer() {
    if (!this.isOccupied) return null;
    const dock = this.findNearestDock(4.0);
    if (!dock) {
      return { success: false, message: 'Must be near a dock or safe shore to exit boat.' };
    }

    this.isOccupied = false;
    const player = this.playerRef;
    this.playerRef = null;

    if (player) {
      player.setPosition(dock.x, dock.z);
    }

    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('water_splash', this.group.position, 1.0);
    }
    return { success: true, dock };
  }

  findNearestDock(maxDist = 5.0) {
    if (!this.zone || !Array.isArray(this.zone.dockLocations)) return null;
    let closest = null;
    let minDist = maxDist;

    for (const dock of this.zone.dockLocations) {
      const dx = this.x - dock.x;
      const dz = this.z - dock.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < minDist) {
        minDist = d;
        closest = dock;
      }
    }
    return closest;
  }

  update(inputState, deltaTime) {
    this.waveTime += deltaTime;
    // Subtle natural water bobbing
    this.pitch = Math.sin(this.waveTime * 2.2) * 0.03;
    this.roll = Math.cos(this.waveTime * 1.8) * 0.04;

    if (this.isOccupied && inputState) {
      // W/S Throttle
      if (inputState.up) {
        this.velocity = Math.min(this.maxSpeed, this.velocity + this.acceleration * deltaTime);
        if (this.playerRef && this.playerRef.characterLoader) {
          this.playerRef.characterLoader.playAction('Player_Walk', 0.2);
        }
      } else if (inputState.down) {
        this.velocity = Math.max(-this.reverseSpeed, this.velocity - this.acceleration * deltaTime);
      } else {
        // Friction deceleration
        if (this.velocity > 0) {
          this.velocity = Math.max(0, this.velocity - this.friction * deltaTime);
        } else if (this.velocity < 0) {
          this.velocity = Math.min(0, this.velocity + this.friction * deltaTime);
        }
      }

      // A/D Rudder Steering
      if (inputState.left) {
        this.heading += this.turnRate * deltaTime * (this.velocity >= 0 ? 1 : -1);
      }
      if (inputState.right) {
        this.heading -= this.turnRate * deltaTime * (this.velocity >= 0 ? 1 : -1);
      }
    } else {
      // Natural water drag when empty
      this.velocity *= Math.max(0, 1.0 - this.friction * deltaTime);
    }

    // Displacement
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);

    let nextX = this.x + forwardX * this.velocity * deltaTime;
    let nextZ = this.z + forwardZ * this.velocity * deltaTime;

    // Water zone bounds restriction (Section 13)
    if (this.zone && this.zone.bounds) {
      const b = this.zone.bounds;
      const clampedX = Math.max(b.minX + 1.5, Math.min(b.maxX - 1.5, nextX));
      const clampedZ = Math.max(b.minZ + 1.5, Math.min(b.maxZ - 1.5, nextZ));

      if (clampedX !== nextX || clampedZ !== nextZ) {
        // Hull bumped water boundary
        this.velocity *= 0.2;
      }
      nextX = clampedX;
      nextZ = clampedZ;
    }

    // Obstacle collision against world colliders
    if (this.collision) {
      const res = this.collision.resolveCircle(this.x, this.z, nextX, nextZ, 1.2);
      if (res.collided) {
        this.velocity *= 0.1;
      }
      nextX = res.x;
      nextZ = res.z;
    }

    this.x = nextX;
    this.z = nextZ;

    // Apply transforms
    this.group.position.set(this.x, this.y + Math.sin(this.waveTime * 3.0) * 0.05, this.z);
    this.group.rotation.y = this.heading;
    this.group.rotation.x = this.pitch;
    this.group.rotation.z = this.roll;

    // Synchronize mounted player position
    if (this.isOccupied && this.playerRef) {
      this.playerRef.x = this.x;
      this.playerRef.z = this.z;
      this.playerRef.y = this.y + 0.35;
      if (this.playerRef.group) {
        this.playerRef.group.position.set(this.x, this.y + 0.35, this.z);
      }
      if (this.playerRef.avatarMesh) {
        this.playerRef.avatarMesh.rotation.y = this.heading;
      } else if (this.playerRef.group) {
        this.playerRef.group.rotation.y = this.heading;
      }
    }
  }

  getPosition() {
    return { x: this.x, y: this.y, z: this.z, heading: this.heading };
  }
}

window.BoatController = BoatController;
