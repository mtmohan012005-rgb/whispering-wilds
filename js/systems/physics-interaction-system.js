// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PHYSICS INTERACTION SYSTEM
// Lightweight soft-push physics, friction, sleep states & boundary recovery
// ============================================================================

(function() {
  'use strict';

  class PhysicsPropInstance {
    constructor(propDef, initialPos = { x: 0, y: 0, z: 0 }) {
      this.id = propDef.id;
      this.propDef = propDef;
      this.position = { ...initialPos };
      this.lastSafePosition = { ...initialPos };
      this.velocity = { x: 0, y: 0, z: 0 };
      this.massKg = propDef.massKg || (propDef.massClass === 'LIGHT' ? 5.0 : 15.0);
      this.friction = propDef.pushFriction || 0.85;
      this.radius = propDef.collisionProfile?.radius || 0.45;
      this.isSleeping = true;
      this.mesh = null;
    }

    applyImpulse(fx, fz) {
      if (this.propDef.massClass === 'STATIC' || this.propDef.massClass === 'HEAVY') {
        return; // Immovable
      }
      this.isSleeping = false;
      const invMass = 1.0 / this.massKg;
      this.velocity.x += fx * invMass;
      this.velocity.z += fz * invMass;

      // Cap maximum push velocity (prevent cartoon explosions)
      const maxSpeed = 1.8; // m/s
      const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      if (currentSpeed > maxSpeed) {
        this.velocity.x = (this.velocity.x / currentSpeed) * maxSpeed;
        this.velocity.z = (this.velocity.z / currentSpeed) * maxSpeed;
      }
    }

    update(deltaTime, worldBounds, terrainHeightFn) {
      if (this.isSleeping) return;

      // Update position
      this.position.x += this.velocity.x * deltaTime;
      this.position.z += this.velocity.z * deltaTime;

      // Ground height clamp
      if (terrainHeightFn) {
        const groundY = terrainHeightFn(this.position.x, this.position.z);
        if (groundY !== null && !isNaN(groundY)) {
          this.position.y = groundY;
        }
      }

      // World boundary clamp
      if (worldBounds) {
        this.position.x = Math.max(worldBounds.minX, Math.min(worldBounds.maxX, this.position.x));
        this.position.z = Math.max(worldBounds.minZ, Math.min(worldBounds.maxZ, this.position.z));
      }

      // Drop Safety: if object falls into void, restore to last safe position
      if (this.position.y < -15.0 || isNaN(this.position.x) || isNaN(this.position.z)) {
        this.position = { ...this.lastSafePosition };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.isSleeping = true;
        return;
      }

      // Apply friction
      const damp = Math.max(0, 1.0 - (this.friction * 4.5 * deltaTime));
      this.velocity.x *= damp;
      this.velocity.z *= damp;

      // Sleep threshold
      const speed = Math.hypot(this.velocity.x, this.velocity.z);
      if (speed < 0.03) {
        this.velocity.x = 0;
        this.velocity.z = 0;
        this.isSleeping = true;
        this.lastSafePosition = { ...this.position };
      }

      // Sync 3D mesh transform
      if (this.mesh) {
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
      }
    }
  }

  class PhysicsInteractionSystem {
    constructor() {
      this.props = new Map(); // id -> PhysicsPropInstance
      this.worldBounds = { minX: 0, maxX: 6000, minZ: -400, maxZ: 400 };
      this.pushDistanceThreshold = 0.95; // Player-prop contact distance
    }

    registerPhysicsProp(propDef, initialPos) {
      if (!propDef || !propDef.id) return null;
      const instance = new PhysicsPropInstance(propDef, initialPos);
      this.props.set(propDef.id, instance);
      return instance;
    }

    unregisterPhysicsProp(propId) {
      this.props.delete(propId);
    }

    getProp(propId) {
      return this.props.get(propId);
    }

    // Check player-to-prop soft pushing
    handlePlayerPush(player, deltaTime) {
      if (!player) return;
      const px = player.x || (player.position ? player.position.x : 0);
      const pz = player.z || (player.position ? player.position.z : (player.y || 0));

      this.props.forEach(prop => {
        if (prop.propDef.massClass === 'STATIC' || prop.propDef.massClass === 'HEAVY') {
          return;
        }

        const dx = prop.position.x - px;
        const dz = prop.position.z - pz;
        const dist = Math.hypot(dx, dz);

        const contactDist = prop.radius + 0.45; // Contact distance
        if (dist < contactDist && dist > 0.001) {
          const nx = dx / dist;
          const nz = dz / dist;

          // Push force proportional to player movement or slight separation push
          const pushForce = 32.0; // Newton impulse
          prop.applyImpulse(nx * pushForce * deltaTime, nz * pushForce * deltaTime);

          // Audio scrape feedback
          if (window.gameAudio && prop.isSleeping === false && Math.random() < 0.15) {
            window.gameAudio.playPropSound?.(prop.propDef.soundId || 'wood_scrape_pavement', prop.position);
          }
        }
      });
    }

    update(deltaTime, player, terrainHeightFn) {
      this.handlePlayerPush(player, deltaTime);

      this.props.forEach(prop => {
        prop.update(deltaTime, this.worldBounds, terrainHeightFn);
      });
    }
  }

  window.PhysicsInteractionSystem = new PhysicsInteractionSystem();
  console.log('[PhysicsInteractionSystem] Initialized soft-push lightweight physics system.');
})();
