// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - VEGETATION REACTION SYSTEM
// Procedural grass & shrub bending, spring recovery, rustle audio & wind sway
// ============================================================================

(function() {
  'use strict';

  class VegetationCluster {
    constructor(id, x, y, z, radius = 1.2, type = 'grass') {
      this.id = id;
      this.position = { x, y, z };
      this.radius = radius;
      this.type = type; // 'grass', 'reeds', 'shrub'
      this.displacement = { x: 0, z: 0 };
      this.velocity = { x: 0, z: 0 };
      this.isBent = false;
      this.springK = 18.0; // Spring stiffness
      this.damping = 5.5;  // Spring damping
    }

    applyPush(dx, dz, force = 0.45) {
      this.isBent = true;
      this.displacement.x += dx * force;
      this.displacement.z += dz * force;

      // Clamp displacement so vegetation doesn't invert
      const maxBend = 0.65;
      const len = Math.hypot(this.displacement.x, this.displacement.z);
      if (len > maxBend) {
        this.displacement.x = (this.displacement.x / len) * maxBend;
        this.displacement.z = (this.displacement.z / len) * maxBend;
      }
    }

    update(deltaTime, windVector) {
      // Spring physics toward rest + wind oscillation
      const restX = windVector.x * 0.12;
      const restZ = windVector.z * 0.12;

      const fx = -this.springK * (this.displacement.x - restX) - this.damping * this.velocity.x;
      const fz = -this.springK * (this.displacement.z - restZ) - this.damping * this.velocity.z;

      this.velocity.x += fx * deltaTime;
      this.velocity.z += fz * deltaTime;

      this.displacement.x += this.velocity.x * deltaTime;
      this.displacement.z += this.velocity.z * deltaTime;

      if (Math.hypot(this.displacement.x - restX, this.displacement.z - restZ) < 0.01 &&
          Math.hypot(this.velocity.x, this.velocity.z) < 0.01) {
        this.displacement.x = restX;
        this.displacement.z = restZ;
        this.velocity.x = 0;
        this.velocity.z = 0;
        this.isBent = false;
      }
    }
  }

  class VegetationReactionSystem {
    constructor() {
      this.clusters = new Map();
      this.windVector = { x: 0.2, z: 0.1 };
      this._windTime = 0;
      this._lastRustleAudioTime = 0;
    }

    registerCluster(id, x, y, z, radius = 1.2, type = 'grass') {
      const cluster = new VegetationCluster(id, x, y, z, radius, type);
      this.clusters.set(id, cluster);
      return cluster;
    }

    unregisterCluster(id) {
      this.clusters.delete(id);
    }

    update(deltaTime, player, weather) {
      this._windTime += deltaTime;
      // Derive wind from WeatherSystem
      const windSpeed = weather?.current?.windSpeed || 1.0;
      const gust = Math.sin(this._windTime * 1.8) * 0.4 + Math.sin(this._windTime * 0.6) * 0.6;
      this.windVector.x = Math.cos(this._windTime * 0.3) * windSpeed * gust * 0.3;
      this.windVector.z = Math.sin(this._windTime * 0.3) * windSpeed * gust * 0.3;

      if (!player) return;
      const px = player.x || (player.position ? player.position.x : 0);
      const py = player.y || (player.position ? player.position.y : 0);
      const pz = player.z || (player.position ? player.position.z : 0);
      const isMoving = !!player.isMoving;

      // Movement vector
      const moveDx = player.vx || (isMoving ? Math.cos(player.angle || 0) : 0);
      const moveDz = player.vz || (isMoving ? Math.sin(player.angle || 0) : 0);

      // Check distance and push clusters near player
      this.clusters.forEach(cluster => {
        const dx = cluster.position.x - px;
        const dz = cluster.position.z - pz;
        const dist = Math.hypot(dx, dz);

        // Near interaction zone (< 1.6m)
        if (dist < cluster.radius + 0.5 && isMoving) {
          const pushDirX = (dist > 0.01) ? (dx / dist) : moveDx;
          const pushDirZ = (dist > 0.01) ? (dz / dist) : moveDz;
          cluster.applyPush(pushDirX, pushDirZ, 0.45);

          // Rustle Audio feedback
          const now = performance.now();
          if (now - this._lastRustleAudioTime > 400) {
            this._lastRustleAudioTime = now;
            if (window.gameAudio) {
              window.gameAudio.playGrassRustle?.(cluster.position);
            }
          }
        }

        // Run spring simulation
        cluster.update(deltaTime, this.windVector);
      });
    }

    getClusterDisplacement(id) {
      const cluster = this.clusters.get(id);
      return cluster ? cluster.displacement : { x: 0, z: 0 };
    }
  }

  window.VegetationReactionSystem = new VegetationReactionSystem();
  console.log('[VegetationReactionSystem] Initialized procedural vegetation bending & spring recovery engine.');
})();
