// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WATER INTERACTION SYSTEM
// Real-time water depth evaluation, shoreline wading, ripples, boat wakes & splash pooling
// ============================================================================

(function() {
  'use strict';

  class WaterInteractionSystem {
    constructor() {
      this.zones = window.WATER_ZONES || [];
      this.depths = window.WATER_DEPTH || {};
      this.budgets = window.WATER_PARTICLE_BUDGETS || {
        MAX_RIPPLE_RINGS: 48,
        MAX_FOOTSTEP_SPLASHES: 32,
        RIPPLE_LIFETIME_MS: 1500
      };

      // Pooled Ripples & Splashes
      this.ripples = [];
      this.splashes = [];
      this._lastStepRippleTime = 0;
      this._lastRainRippleTime = 0;
    }

    // Determine current water body and depth at coordinate (x, y, z)
    evaluateWaterAt(x, y, z) {
      for (let i = 0; i < this.zones.length; i++) {
        const zone = this.zones[i];
        const b = zone.bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
          const depthMeters = zone.waterLevelY - y;

          if (depthMeters <= 0.0) {
            return { inWater: false, depthClass: this.depths.DRY, depthMeters: 0, zone };
          } else if (depthMeters <= this.depths.SHALLOW.maxDepthMeters) {
            return { inWater: true, depthClass: this.depths.SHALLOW, depthMeters, zone };
          } else if (depthMeters <= this.depths.WAIST.maxDepthMeters) {
            return { inWater: true, depthClass: this.depths.WAIST, depthMeters, zone };
          } else {
            return { inWater: true, depthClass: this.depths.DEEP, depthMeters, zone };
          }
        }
      }
      return { inWater: false, depthClass: this.depths.DRY, depthMeters: 0, zone: null };
    }

    // Spawn water ripple event
    createRipple(x, y, z, initialRadius = 0.25, maxRadius = 1.4, durationMs = 1500) {
      if (this.ripples.length >= this.budgets.MAX_RIPPLE_RINGS) {
        this.ripples.shift(); // Recycle oldest
      }
      this.ripples.push({
        x, y, z,
        radius: initialRadius,
        maxRadius,
        durationMs,
        ageMs: 0,
        opacity: 0.8
      });
    }

    // Spawn water splash droplet
    createSplash(x, y, z, count = 6) {
      const allowed = Math.min(count, this.budgets.MAX_FOOTSTEP_SPLASHES - this.splashes.length);
      for (let i = 0; i < allowed; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 1.4;
        this.splashes.push({
          x, y, z,
          vx: Math.cos(angle) * speed,
          vy: 1.2 + Math.random() * 1.5,
          vz: Math.sin(angle) * speed,
          ageMs: 0,
          maxAgeMs: 600,
          opacity: 0.9
        });
      }
    }

    // Integration called every frame by main / three-world
    update(deltaTime, player, weather) {
      if (!player) return;

      const px = player.x || (player.position ? player.position.x : 0);
      const py = player.y || (player.position ? player.position.y : 0);
      const pz = player.z || (player.position ? player.position.z : 0);
      const isMoving = !!player.isMoving;

      const waterState = this.evaluateWaterAt(px, py, pz);

      // Player in shallow/waist water wading effects
      if (waterState.inWater && isMoving) {
        const now = performance.now();
        if (now - this._lastStepRippleTime > 320) {
          this._lastStepRippleTime = now;
          this.createRipple(px, waterState.zone.waterLevelY, pz, 0.3, 1.6);
          this.createSplash(px, waterState.zone.waterLevelY + 0.05, pz, 4);

          if (window.gameAudio) {
            const sfx = (waterState.depthClass.id === 'WAIST') ? 'water_wade_heavy' : 'water_shallow_step';
            window.gameAudio.playFootstepWater?.(sfx, { x: px, y: py, z: pz });
          }
        }
      }

      // Rain impacts creating ripples across active water bodies
      if (weather && (weather.current?.type === 'rain' || weather.current?.type === 'storm')) {
        const now = performance.now();
        if (now - this._lastRainRippleTime > 120) {
          this._lastRainRippleTime = now;
          if (waterState.zone) {
            const rx = px + (Math.random() - 0.5) * 20.0;
            const rz = pz + (Math.random() - 0.5) * 20.0;
            this.createRipple(rx, waterState.zone.waterLevelY, rz, 0.1, 0.6, 900);
          }
        }
      }

      // Update active ripples
      const dtMs = deltaTime * 1000;
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.ageMs += dtMs;
        if (r.ageMs >= r.durationMs) {
          this.ripples.splice(i, 1);
        } else {
          const progress = r.ageMs / r.durationMs;
          r.radius += deltaTime * ((r.maxRadius - r.radius) * 2.0);
          r.opacity = Math.max(0, 0.8 * (1.0 - progress));
        }
      }

      // Update active splashes
      for (let i = this.splashes.length - 1; i >= 0; i--) {
        const s = this.splashes[i];
        s.ageMs += dtMs;
        if (s.ageMs >= s.maxAgeMs) {
          this.splashes.splice(i, 1);
        } else {
          s.x += s.vx * deltaTime;
          s.y += s.vy * deltaTime;
          s.z += s.vz * deltaTime;
          s.vy -= 9.8 * deltaTime; // Gravity
          s.opacity = Math.max(0, 0.9 * (1.0 - (s.ageMs / s.maxAgeMs)));
        }
      }

      return waterState;
    }
  }

  window.WaterInteractionSystem = new WaterInteractionSystem();
  console.log('[WaterInteractionSystem] Initialized water interaction, ripples & wading engine.');
})();
