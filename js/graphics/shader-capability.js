/**
 * The Whispering Wilds - Shader Capability & Material Resolver
 * Guarantees primary-to-fallback shader resilience.
 * Replaces failing complex PBR shaders with lightweight compatible materials.
 */
(function(root) {
  'use strict';

  class ShaderCapability {
    constructor(precision = 'mediump') {
      this.precision = precision;
      this.failedShaders = new Set();
      this.fallbackMaterials = new Map();
    }

    resolveSafeMaterial(THREE, originalMaterial, options = {}) {
      if (!THREE || !originalMaterial) return null;

      // If shader is known to fail or if running under safe low-end profile
      const isFailed = this.failedShaders.has(originalMaterial.uuid);
      const forceFallback = options.forceFallback || false;

      if (!isFailed && !forceFallback) {
        return originalMaterial;
      }

      // Check cache for existing fallback material
      if (this.fallbackMaterials.has(originalMaterial.uuid)) {
        return this.fallbackMaterials.get(originalMaterial.uuid);
      }

      // Create fallback: simple Lambert or Standard material without complex maps
      const fallbackMat = new THREE.MeshLambertMaterial({
        color: (originalMaterial.color && originalMaterial.color.clone()) || new THREE.Color(0x888888),
        map: originalMaterial.map || null,
        transparent: originalMaterial.transparent || false,
        opacity: originalMaterial.opacity ?? 1.0,
        wireframe: false
      });

      this.fallbackMaterials.set(originalMaterial.uuid, fallbackMat);
      console.log(`[ShaderCapability] Resolved safe fallback material for: ${originalMaterial.name || originalMaterial.uuid}`);
      return fallbackMat;
    }

    markShaderFailed(materialUuid, shaderId = 'UNKNOWN') {
      console.warn(`[ShaderCapability] Marking shader failed: ${shaderId} (${materialUuid}). Engaging fallback.`);
      this.failedShaders.add(materialUuid);
    }

    clearFailures() {
      this.failedShaders.clear();
      this.fallbackMaterials.clear();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShaderCapability;
  } else {
    root.ShaderCapability = ShaderCapability;
  }
})(typeof window !== 'undefined' ? window : global);
