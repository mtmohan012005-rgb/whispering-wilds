// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REST POINT ENTITY
// Specific world locations (charpoy, camp cot, tea shop bench) for safe rest
// ============================================================================

(function() {
  'use strict';

  class RestPoint {
    constructor(config = {}) {
      this.id = config.id || `rest_${Date.now()}`;
      this.name = config.name || 'Rest Bench (திண்ணை)';
      this.position = config.position || { x: 0, y: 0, z: 0 };
      this.interactionRadius = config.interactionRadius || 3.0;
      this.shelterId = config.shelterId || null;
      this.isSafe = config.isSafe !== undefined ? config.isSafe : true;
      this.allowedRestTypes = config.allowedRestTypes || ['SHORT_REST', 'LONG_REST'];
    }

    isPlayerNearby(playerPos) {
      if (!playerPos) return false;
      const px = playerPos.x !== undefined ? playerPos.x : 0;
      const pz = playerPos.z !== undefined ? playerPos.z : (playerPos.y !== undefined ? playerPos.y : 0);
      const dx = px - this.position.x;
      const dz = pz - (this.position.z !== undefined ? this.position.z : (this.position.y || 0));
      return (dx * dx + dz * dz) <= (this.interactionRadius * this.interactionRadius);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RestPoint;
  } else {
    window.RestPoint = RestPoint;
  }
})();
