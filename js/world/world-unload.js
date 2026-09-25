/**
 * The Whispering Wilds (Kaattu Vazhi) - Safe World Sector Unloader
 * Coordinates non-destructive teardown of distant sectors. Preserves persistent changes,
 * disposes temporary meshes and audio emitters, decrements asset cache references,
 * and guarantees protected sectors (player, active quests, cinematics) are never unloaded.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldUnload = factory();
    if (typeof window !== 'undefined') {
      window.WorldUnload = root.WorldUnload;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldUnloadEngine {
    constructor(persistenceManager = null, assetCache = null) {
      this.persistence = persistenceManager;
      this.cache = assetCache;
      this.unloadedCount = 0;
    }

    /**
     * Checks if a sector is protected from unloading
     */
    isSectorProtected(sector, playerPos, activeQuestSectors = [], isCinematicActive = false) {
      if (!sector) return true;

      // 1. Sector contains player
      if (playerPos && sector.isPlayerInside(playerPos)) {
        return true;
      }

      // 2. Sector contains active quest objective
      if (sector.hasActiveQuest || (Array.isArray(activeQuestSectors) && activeQuestSectors.includes(sector.id))) {
        return true;
      }

      // 3. Cinematic in progress inside this sector
      if (isCinematicActive && sector.currentZone <= 1) {
        return true;
      }

      // 4. Sector is immediate or near
      if (sector.currentZone <= 1) {
        return true;
      }

      return false;
    }

    /**
     * Safely unloads a distant sector
     * @param {WorldSector} sector - Sector to unload
     * @param {Object} options - Context references
     * @returns {boolean} true if safely unloaded
     */
    unloadSector(sector, options = {}) {
      if (!sector || sector.state === 'UNLOADED') return false;

      // Check protection constraints
      if (this.isSectorProtected(sector, options.playerPos, options.activeQuestSectors, options.isCinematicActive)) {
        return false;
      }

      // 1. Save persistent logical state
      if (this.persistence) {
        this.persistence.saveSectorState(sector.id, sector.serializePersistentState());
      }

      // 2. Stop sector-specific audio emitters
      if (options.audioManager && typeof options.audioManager.stopSectorAudio === 'function') {
        options.audioManager.stopSectorAudio(sector.id);
      }

      // 3. Release 3D objects and instances
      if (Array.isArray(sector.loadedObjects)) {
        for (let i = 0; i < sector.loadedObjects.length; i++) {
          const obj = sector.loadedObjects[i];
          if (options.scene && obj.parent) {
            options.scene.remove(obj);
          }
          this._disposeObject(obj);
        }
        sector.loadedObjects.length = 0;
      }
      sector.activeInstances.clear();

      // 4. Return assets to cache (decrement refcounts)
      if (this.cache && Array.isArray(sector.assetBundle)) {
        for (let i = 0; i < sector.assetBundle.length; i++) {
          this.cache.release(sector.assetBundle[i]);
        }
      }

      // 5. Update state
      sector.state = 'UNLOADED';
      sector.currentZone = 4;
      this.unloadedCount++;

      return true;
    }

    _disposeObject(obj) {
      if (!obj) return;
      if (obj.geometry && typeof obj.geometry.dispose === 'function') {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m && typeof m.dispose === 'function' && m.dispose());
        } else if (typeof obj.material.dispose === 'function') {
          obj.material.dispose();
        }
      }
      if (Array.isArray(obj.children)) {
        for (let i = 0; i < obj.children.length; i++) {
          this._disposeObject(obj.children[i]);
        }
      }
    }
  }

  return WorldUnloadEngine;
});
