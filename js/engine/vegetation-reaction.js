// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - THREE.JS VEGETATION REACTION ADAPTER
// Bridges procedural grass and shrub displacement with Three.js instanced rendering
// ============================================================================

(function() {
  'use strict';

  class ThreeVegetationReactionAdapter {
    constructor() {
      this.system = window.VegetationReactionSystem;
      this.instancedFoliage = null;
    }

    init(instancedFoliageManager) {
      this.instancedFoliage = instancedFoliageManager;
    }

    update(deltaTime, player, weather) {
      if (this.system) {
        this.system.update(deltaTime, player, weather);
      }
    }
  }

  window.ThreeVegetationReactionAdapter = new ThreeVegetationReactionAdapter();
  console.log('[ThreeVegetationReactionAdapter] Initialized Three.js vegetation reaction adapter.');
})();
