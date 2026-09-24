// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SHELTER ENTITY
// Defines environmental shelters, weather insulation zones, and safe rest zones
// ============================================================================

(function() {
  'use strict';

  class Shelter {
    constructor(config = {}) {
      this.id = config.id || `shelter_${Date.now()}`;
      this.type = config.type || 'house'; // house, tea_shop, heritage_house, forest_station, camp_tent, toda_hut
      this.name = config.name || 'Shelter';
      this.position = config.position || { x: 0, y: 0, z: 0 };
      this.radius = config.radius || 8.0; // Circular detection radius
      this.bounds = config.bounds || null; // Optional Axis-Aligned Bounding Box: { minX, maxX, minZ, maxZ }

      // Shelter insulation & recovery properties from CampData if available
      const typeData = (window.CampData && window.CampData.shelters && window.CampData.shelters[this.type]) || {};
      this.warmthBonus = config.warmthBonus !== undefined ? config.warmthBonus : (typeData.warmthBonus || 3.0);
      this.weatherProtection = config.weatherProtection !== undefined ? config.weatherProtection : (typeData.weatherProtection || 0.90);
      this.restEfficiency = config.restEfficiency !== undefined ? config.restEfficiency : (typeData.restEfficiency || 1.3);
      this.isSafeZone = config.isSafeZone !== undefined ? config.isSafeZone : (typeData.safeZone !== undefined ? typeData.safeZone : true);
    }

    containsPoint(pos) {
      if (!pos) return false;
      const px = pos.x !== undefined ? pos.x : 0;
      const pz = pos.z !== undefined ? pos.z : (pos.y !== undefined ? pos.y : 0);

      // Check explicit bounding box if defined
      if (this.bounds) {
        return px >= this.bounds.minX && px <= this.bounds.maxX &&
               pz >= this.bounds.minZ && pz <= this.bounds.maxZ;
      }

      // Default radial check
      const dx = px - this.position.x;
      const dz = pz - (this.position.z !== undefined ? this.position.z : (this.position.y || 0));
      return (dx * dx + dz * dz) <= (this.radius * this.radius);
    }

    getProtectionMultiplier() {
      return Math.max(0, Math.min(1.0, 1.0 - this.weatherProtection));
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Shelter;
  } else {
    window.Shelter = Shelter;
  }
})();
