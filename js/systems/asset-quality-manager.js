// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ASSET QUALITY MANAGER
// Texture quality variants, material reuse pooling & gameplay object protection
// ============================================================================

(function() {
  'use strict';

  class AssetQualityManager {
    constructor() {
      this.currentTextureQuality = 'MEDIUM'; // 'LOW' | 'MEDIUM' | 'HIGH'
      this.lodDistanceMultiplier = 1.0;
      this.materialCache = new Map(); // key -> THREE.Material
      this.missingAssetLog = [];
    }

    setTextureQuality(quality) {
      const valid = ['LOW', 'MEDIUM', 'HIGH'];
      if (valid.includes(quality)) {
        this.currentTextureQuality = quality;
      }
    }

    setLODDistanceMultiplier(mult) {
      this.lodDistanceMultiplier = Math.max(0.4, Math.min(2.0, mult || 1.0));
    }

    /**
     * Material Pooling: Reuses materials across thousands of instanced/common props
     */
    getOrCreateMaterial(key, createFn) {
      if (this.materialCache.has(key)) {
        return this.materialCache.get(key);
      }
      if (typeof createFn === 'function') {
        const mat = createFn();
        this.materialCache.set(key, mat);
        return mat;
      }
      return null;
    }

    /**
     * Missing Asset / Texture Graceful Degradation (Section 30)
     */
    handleMissingAsset(assetId, textureId, region, error) {
      const entry = {
        assetId,
        textureId,
        region,
        error: error ? (error.message || String(error)) : 'Missing asset',
        timestamp: Date.now()
      };
      this.missingAssetLog.push(entry);
      console.warn(`[AssetQualityManager] Missing asset fallback: ${assetId} (${textureId}) in ${region}`);

      // Provide safe fallback material
      if (window.renderQualitySystem) {
        return window.renderQualitySystem.getSafeFallbackMaterial(0x5a4d41);
      }
      return null;
    }

    /**
     * Gameplay Object Protection Rule (Section 33 & 142)
     * Strictly verifies whether an entity can be culled or scaled down.
     * Gameplay-critical objects must NEVER be culled.
     */
    isProtectedGameplayObject(entity) {
      if (!entity) return false;
      const grp = entity.group || entity.mesh || entity;
      const ud = grp.userData || entity;

      // 1. Player character & nearby collision
      if (entity.isPlayer || ud.isPlayer || ud.isHeroCollider) return true;

      // 2. Active Quest Dependencies
      if (ud.questObject || ud.requiredForQuest || ud.questId) return true;

      // 3. Critical Story / Investigation NPCs
      if (ud.isCriticalNPC || ud.evidenceId || ud.investigationTarget) return true;

      // 4. Active Puzzle Mechanisms
      if (ud.puzzleId || ud.isPuzzleMechanism || ud.interactionType === 'operate') return true;

      // 5. Current interaction candidate
      if (window.environmentInteractionSystem?.activeCandidate === entity) return true;

      return false;
    }
  }

  const instance = new AssetQualityManager();

  if (typeof window !== 'undefined') {
    window.AssetQualityManager = AssetQualityManager;
    window.assetQualityManager = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AssetQualityManager, assetQualityManager: instance };
  }
})();
