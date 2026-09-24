// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - THREE.JS WATER REACTION ADAPTER
// Bridges water interaction, ripples, splashes & boat wakes with Three.js rendering
// ============================================================================

(function() {
  'use strict';

  class ThreeWaterReactionAdapter {
    constructor() {
      this.system = window.WaterInteractionSystem;
      this.waterMesh = null;
      this.rippleGroup = null;
      this.splashParticleSystem = null;
    }

    init(threeScene) {
      if (typeof THREE !== 'undefined' && threeScene) {
        this.rippleGroup = new THREE.Group();
        this.rippleGroup.name = 'WaterRipplesGroup';
        threeScene.add(this.rippleGroup);
      }
    }

    update(deltaTime, player, weather) {
      if (!this.system) return;
      const waterState = this.system.update(deltaTime, player, weather);
      return waterState;
    }
  }

  window.ThreeWaterReactionAdapter = new ThreeWaterReactionAdapter();
  console.log('[ThreeWaterReactionAdapter] Initialized Three.js water reaction adapter.');
})();
