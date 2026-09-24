// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CAMPFIRE ENTITY
// Manages campfire fuel consumption, thermal aura, wetness drying, and lighting
// ============================================================================

(function() {
  'use strict';

  class Campfire {
    constructor(config = {}) {
      this.id = config.id || `campfire_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.position = config.position || { x: 0, y: 0, z: 0 };
      this.isBurning = config.isBurning !== undefined ? config.isBurning : true;
      this.fuel = config.fuel !== undefined ? config.fuel : (window.CampData ? window.CampData.campfire.defaultInitialFuel : 240.0);
      this.maxFuel = config.maxFuel || (window.CampData ? window.CampData.campfire.maxFuelSeconds : 720.0);
      this.warmthRadius = config.warmthRadius || (window.CampData ? window.CampData.campfire.warmthRadius : 6.5);
      this.lightRadius = config.lightRadius || (window.CampData ? window.CampData.campfire.lightRadius : 11.0);
      this.isPersistent = !!config.isPersistent;
      this.createdAt = config.createdAt || Date.now();
    }

    update(deltaTime) {
      if (!this.isBurning) return;

      this.fuel = Math.max(0, this.fuel - deltaTime);
      if (this.fuel <= 0) {
        this.extinguish();
      }
    }

    extinguish() {
      this.isBurning = false;
      this.fuel = 0;
      if (window.AudioManager && typeof window.AudioManager.playSfx === 'function') {
        window.AudioManager.playSfx('fire_extinguish');
      }
    }

    light() {
      if (this.fuel > 0) {
        this.isBurning = true;
        if (window.AudioManager && typeof window.AudioManager.playSfx === 'function') {
          window.AudioManager.playSfx('fire_light');
        }
        return true;
      }
      return false;
    }

    addFuel(seconds) {
      if (seconds <= 0) return false;
      this.fuel = Math.min(this.maxFuel, this.fuel + seconds);
      if (!this.isBurning) {
        this.isBurning = true;
      }
      return true;
    }

    isPlayerNearby(playerPos) {
      if (!playerPos) return false;
      const dx = (playerPos.x || 0) - this.position.x;
      const dz = (playerPos.z || playerPos.y || 0) - (this.position.z || this.position.y || 0);
      const dist = Math.sqrt(dx * dx + dz * dz);
      return dist <= this.warmthRadius;
    }

    getDistance(pos) {
      if (!pos) return Infinity;
      const dx = (pos.x || 0) - this.position.x;
      const dz = (pos.z || pos.y || 0) - (this.position.z || this.position.y || 0);
      return Math.sqrt(dx * dx + dz * dz);
    }

    serialize() {
      return {
        id: this.id,
        position: { ...this.position },
        isBurning: this.isBurning,
        fuel: Math.round(this.fuel * 10) / 10,
        isPersistent: this.isPersistent,
        createdAt: this.createdAt
      };
    }

    static deserialize(data) {
      return new Campfire(data);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Campfire;
  } else {
    window.Campfire = Campfire;
  }
})();
