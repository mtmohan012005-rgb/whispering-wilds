// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - RENDER QUALITY SYSTEM
// Three.js renderer configuration, dynamic render scale, shadows & shader fallback
// ============================================================================

(function() {
  'use strict';

  class RenderQualitySystem {
    constructor() {
      this.currentRenderScale = 1.0;
      this.currentShadowQuality = 'medium';
      this.currentProfile = null;
      this.fallbackMaterials = new Map();
    }

    applyProfileToRenderer(profile, renderer, scene, camera) {
      if (!profile || !renderer) return;
      this.currentProfile = profile;
      this.currentRenderScale = profile.renderScale || 1.0;
      this.currentShadowQuality = profile.shadowQuality || 'medium';

      // 1. Shadows Configuration
      if (profile.shadowQuality === 'none' || profile.shadowQuality === 'off') {
        renderer.shadowMap.enabled = false;
      } else {
        renderer.shadowMap.enabled = true;
        if (typeof THREE !== 'undefined') {
          renderer.shadowMap.type = (profile.shadowQuality === 'ultra' || profile.shadowQuality === 'high')
            ? THREE.PCFSoftShadowMap
            : THREE.BasicShadowMap;
        }
      }

      // 2. Dynamic Resolution / Pixel Ratio
      const dprCap = profile.dprCap || 1.5;
      const baseDPR = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1.0;
      const effectiveDPR = Math.min(baseDPR, dprCap) * this.currentRenderScale;
      renderer.setPixelRatio(Math.max(0.5, Math.min(2.0, effectiveDPR)));

      // 3. Shadow map resolution on directional lights
      if (scene) {
        scene.traverse((node) => {
          if (node.isDirectionalLight && node.shadow) {
            node.shadow.mapSize.width = profile.shadowMapSize || 1024;
            node.shadow.mapSize.height = profile.shadowMapSize || 1024;
            if (node.shadow.camera) {
              node.shadow.camera.far = profile.shadowDistance || 80;
              node.shadow.camera.updateProjectionMatrix();
            }
            if (node.shadow.map) {
              node.shadow.map.dispose();
              node.shadow.map = null; // Forces Three.js to reallocate at new resolution
            }
          }
        });
      }

      console.log(`[RenderQualitySystem] Applied ${profile.id} quality to Three.js renderer (Scale: ${(this.currentRenderScale * 100).toFixed(0)}%, Shadows: ${this.currentShadowQuality}).`);
    }

    setDynamicRenderScale(scale, renderer) {
      this.currentRenderScale = Math.max(0.5, Math.min(1.0, scale));
      if (renderer) {
        const dprCap = this.currentProfile?.dprCap || 1.5;
        const baseDPR = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1.0;
        const effectiveDPR = Math.min(baseDPR, dprCap) * this.currentRenderScale;
        renderer.setPixelRatio(Math.max(0.5, Math.min(2.0, effectiveDPR)));
      }
    }

    reapplySettings(renderer) {
      if (this.currentProfile && renderer) {
        this.applyProfileToRenderer(this.currentProfile, renderer, window.threeWorld?.scene, window.threeWorld?.camera);
      }
    }

    /**
     * Safe Material Fallback (Section 54)
     * If an advanced shader or PBR material fails compilation, provides an approved safe standard material.
     */
    getSafeFallbackMaterial(colorHex = 0x6e5d48) {
      if (typeof THREE === 'undefined') return null;
      if (!this.fallbackMaterials.has(colorHex)) {
        const mat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.8,
          metalness: 0.1
        });
        this.fallbackMaterials.set(colorHex, mat);
      }
      return this.fallbackMaterials.get(colorHex);
    }
  }

  const instance = new RenderQualitySystem();

  if (typeof window !== 'undefined') {
    window.RenderQualitySystem = RenderQualitySystem;
    window.renderQualitySystem = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RenderQualitySystem, renderQualitySystem: instance };
  }
})();
