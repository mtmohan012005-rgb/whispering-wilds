// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - THREE.JS ENVIRONMENT PHYSICS BRIDGE
// Synchronizes lightweight physics simulation with Three.js Scene and Colliders
// ============================================================================

(function() {
  'use strict';

  class EnvironmentPhysicsBridge {
    constructor() {
      this.physicsSystem = window.PhysicsInteractionSystem;
      this.scene = null;
      this.terrain = null;
    }

    init(threeScene, threeTerrain) {
      this.scene = threeScene;
      this.terrain = threeTerrain;
      console.log('[EnvironmentPhysicsBridge] Attached to Three.js scene & terrain elevation.');
    }

    getTerrainElevation(x, z) {
      if (this.terrain && typeof this.terrain.getHeightAt === 'function') {
        return this.terrain.getHeightAt(x, z);
      }
      return 0.0;
    }

    attachMeshToProp(propId, mesh) {
      if (!this.physicsSystem) return;
      const prop = this.physicsSystem.getProp(propId);
      if (prop && mesh) {
        prop.mesh = mesh;
        mesh.position.set(prop.position.x, prop.position.y, prop.position.z);
      }
    }

    update(deltaTime, player) {
      if (!this.physicsSystem) return;
      this.physicsSystem.update(deltaTime, player, (x, z) => this.getTerrainElevation(x, z));
    }
  }

  window.EnvironmentPhysicsBridge = new EnvironmentPhysicsBridge();
  console.log('[EnvironmentPhysicsBridge] Initialized Three.js environment physics adapter.');
})();
