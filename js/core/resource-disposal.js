// ============================================================================
// THE WHISPERING WILDS — RESOURCE DISPOSAL MANAGER
// Tracks Three.js resources and safely disposes them when regions unload.
// Reference-counted so shared resources are NOT disposed prematurely.
// ============================================================================

(function () {
  'use strict';

  class ResourceDisposalManager {
    constructor() {
      // Map<object, { refs: Set<string>, disposed: bool }>
      this._registry = new WeakMap();
      // Map<regionId, Set<object>>
      this._regionResources = new Map();
      this._disposeCount = 0;
    }

    // ------------------------------------------------------------------
    // Register a Three.js resource for a region
    // ------------------------------------------------------------------
    register(resource, regionId) {
      if (!resource || !regionId) return;
      if (!this._registry.has(resource)) {
        this._registry.set(resource, { refs: new Set(), disposed: false });
      }
      this._registry.get(resource).refs.add(regionId);

      if (!this._regionResources.has(regionId)) {
        this._regionResources.set(regionId, new Set());
      }
      this._regionResources.get(regionId).add(resource);
    }

    // ------------------------------------------------------------------
    // Unload all resources for a region
    // ------------------------------------------------------------------
    unloadRegion(regionId) {
      const resources = this._regionResources.get(regionId);
      if (!resources) return;

      let freed = 0;
      for (const resource of resources) {
        const entry = this._registry.get(resource);
        if (!entry || entry.disposed) continue;

        entry.refs.delete(regionId);
        if (entry.refs.size === 0) {
          this._dispose(resource);
          entry.disposed = true;
          freed++;
          this._disposeCount++;
        }
      }
      this._regionResources.delete(regionId);
      console.log(`[ResourceDisposal] Region "${regionId}" unloaded: ${freed} resources freed. Total freed: ${this._disposeCount}`);
    }

    // ------------------------------------------------------------------
    // Dispose a single object with Three.js patterns
    // ------------------------------------------------------------------
    _dispose(obj) {
      if (!obj) return;
      try {
        // Geometry
        if (obj.isBufferGeometry || obj.isGeometry) {
          obj.dispose();
          return;
        }
        // Material (single or array)
        if (obj.isMaterial) {
          this._disposeMaterial(obj);
          return;
        }
        if (Array.isArray(obj) && obj[0]?.isMaterial) {
          obj.forEach(m => this._disposeMaterial(m));
          return;
        }
        // Texture
        if (obj.isTexture) {
          obj.dispose();
          return;
        }
        // RenderTarget
        if (obj.isWebGLRenderTarget) {
          obj.dispose();
          return;
        }
        // Mesh/SkinnedMesh — dispose geometry & materials
        if (obj.isMesh || obj.isSkinnedMesh || obj.isInstancedMesh) {
          if (obj.geometry) this._dispose(obj.geometry);
          if (obj.material) this._dispose(obj.material);
          if (obj.skeleton) obj.skeleton.dispose?.();
          return;
        }
        // AnimationMixer
        if (obj.isAnimationMixer) {
          obj.stopAllAction();
          obj.uncacheRoot(obj.getRoot?.());
          return;
        }
        // Group / Object3D — recurse
        if (obj.isGroup || obj.isObject3D) {
          obj.traverse(child => {
            if (child !== obj) this._dispose(child);
          });
          return;
        }
        // Audio
        if (obj.disconnect) {
          try { obj.disconnect(); } catch(e) {}
        }
        // Generic dispose
        if (typeof obj.dispose === 'function') {
          obj.dispose();
        }
      } catch (e) {
        console.warn('[ResourceDisposal] Error during dispose:', e.message);
      }
    }

    _disposeMaterial(mat) {
      if (!mat) return;
      // Dispose all map textures
      const mapKeys = [
        'map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
        'emissiveMap', 'envMap', 'lightMap', 'metalnessMap',
        'normalMap', 'roughnessMap', 'specularMap', 'gradientMap',
        'sheenColorMap', 'clearcoatMap', 'clearcoatNormalMap',
        'clearcoatRoughnessMap', 'transmissionMap', 'thicknessMap',
      ];
      for (const key of mapKeys) {
        if (mat[key]) mat[key].dispose();
      }
      mat.dispose();
    }

    // ------------------------------------------------------------------
    // Remove an object from the scene and dispose it immediately
    // (for one-off use, not region-tracked)
    // ------------------------------------------------------------------
    remove(obj, scene) {
      if (scene && obj) scene.remove(obj);
      this._dispose(obj);
    }

    // ------------------------------------------------------------------
    // Dispose a render target if it was created for a feature that is now off
    // ------------------------------------------------------------------
    disposeRenderTarget(rt) {
      if (!rt || !rt.isWebGLRenderTarget) return;
      if (rt.texture) rt.texture.dispose();
      if (rt.depthTexture) rt.depthTexture.dispose();
      rt.dispose();
    }

    getStats() {
      return {
        regions:      this._regionResources.size,
        totalDisposed: this._disposeCount,
      };
    }
  }

  window.ResourceDisposalManager = new ResourceDisposalManager();

})();
