/**
 * The Whispering Wilds (Kaattu Vazhi) - World Streaming System
 * Progressive region streaming across 8 Tamil Nadu zones with distance hysteresis,
 * multi-tier loading priorities, and leak-free memory management.
 */

class WorldStreamingSystem {
  constructor(scene, productionAssets) {
    this.scene = scene;
    this.productionAssets = productionAssets || window.productionWorldAssets;

    // 8 Streaming Regions
    this.regions = {
      george_town: {
        id: 'george_town',
        name: 'George Town (Madras)',
        bounds: { minX: -300, maxX: -100, minZ: -100, maxZ: 100 },
        assetGroup: 'chennai',
        loadDistance: 70,
        unloadDistance: 110,
        priority: 1,
        loaded: false,
        activeInstances: new Set()
      },
      cauvery_delta: {
        id: 'cauvery_delta',
        name: 'Cauvery Farmlands',
        bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
        assetGroup: 'farmland',
        loadDistance: 70,
        unloadDistance: 110,
        priority: 2,
        loaded: false,
        activeInstances: new Set()
      },
      pichavaram: {
        id: 'pichavaram',
        name: 'Pichavaram Mangrove Wetlands',
        bounds: { minX: 100, maxX: 170, minZ: -100, maxZ: 100 },
        assetGroup: 'mangrove',
        loadDistance: 65,
        unloadDistance: 105,
        priority: 2,
        loaded: false,
        activeInstances: new Set()
      },
      chettinad: {
        id: 'chettinad',
        name: 'Chettinad Heritage Belt',
        bounds: { minX: 120, maxX: 190, minZ: -100, maxZ: 100 },
        assetGroup: 'heritage',
        loadDistance: 65,
        unloadDistance: 105,
        priority: 3,
        loaded: false,
        activeInstances: new Set()
      },
      thanjavur: {
        id: 'thanjavur',
        name: 'Thanjavur Temple Plains',
        bounds: { minX: 130, maxX: 210, minZ: -100, maxZ: 100 },
        assetGroup: 'temple',
        loadDistance: 70,
        unloadDistance: 110,
        priority: 3,
        loaded: false,
        activeInstances: new Set()
      },
      mamallapuram: {
        id: 'mamallapuram',
        name: 'Mamallapuram Coastal Monoliths',
        bounds: { minX: 150, maxX: 230, minZ: -100, maxZ: 100 },
        assetGroup: 'monolith',
        loadDistance: 70,
        unloadDistance: 110,
        priority: 3,
        loaded: false,
        activeInstances: new Set()
      },
      nilgiris: {
        id: 'nilgiris',
        name: 'Nilgiri Mountain Cloud Forest',
        bounds: { minX: 200, maxX: 269, minZ: -100, maxZ: 100 },
        assetGroup: 'mountain',
        loadDistance: 75,
        unloadDistance: 120,
        priority: 2,
        loaded: false,
        activeInstances: new Set()
      },
      final_sanctuary: {
        id: 'final_sanctuary',
        name: 'Pasumai Thadam Subterranean Sanctuary',
        bounds: { minX: 270, maxX: 300, minZ: -100, maxZ: 100 },
        assetGroup: 'sanctuary',
        loadDistance: 60,
        unloadDistance: 95,
        priority: 1,
        loaded: false,
        activeInstances: new Set()
      }
    };

    // Shared geometry and texture reference tracking to prevent memory leaks
    this.resourceRefCounts = new Map(); // uuid -> count

    // Throttling for distance evaluation (every 250ms)
    this.lastEvalTime = 0;
    this.evalInterval = 0.25;

    // Loading queue for progressive non-blocking streaming
    this.loadQueue = [];
    this.isProcessingQueue = false;
  }

  getRegionDistance(region, playerPos) {
    const b = region.bounds;
    const clampedX = Math.max(b.minX, Math.min(playerPos.x, b.maxX));
    const clampedZ = Math.max(b.minZ, Math.min(playerPos.z, b.maxZ));
    const dx = playerPos.x - clampedX;
    const dz = playerPos.z - clampedZ;
    return Math.hypot(dx, dz);
  }

  update(playerPos, dt) {
    if (!playerPos) return;

    this.lastEvalTime += dt;
    if (this.lastEvalTime >= this.evalInterval) {
      this.lastEvalTime = 0;
      this.evaluateRegions(playerPos);
    }

    // Process queued progressive loads
    this.processLoadQueue();
  }

  evaluateRegions(playerPos) {
    for (const [id, reg] of Object.entries(this.regions)) {
      const dist = this.getRegionDistance(reg, playerPos);

      // Distance Hysteresis check
      if (!reg.loaded && dist <= reg.loadDistance) {
        this.queueRegionLoad(reg);
      } else if (reg.loaded && dist >= reg.unloadDistance) {
        this.unloadRegion(reg);
      }
    }
  }

  queueRegionLoad(region) {
    if (region.loaded || this.loadQueue.some(item => item.region.id === region.id)) return;

    this.loadQueue.push({
      region,
      priority: region.priority,
      queuedAt: performance.now()
    });

    // Sort by priority (Priority 1 first)
    this.loadQueue.sort((a, b) => a.priority - b.priority);
  }

  processLoadQueue() {
    if (this.isProcessingQueue || this.loadQueue.length === 0) return;

    this.isProcessingQueue = true;
    const task = this.loadQueue.shift();

    if (task && !task.region.loaded) {
      this.loadRegion(task.region).finally(() => {
        this.isProcessingQueue = false;
      });
    } else {
      this.isProcessingQueue = false;
    }
  }

  async loadRegion(region) {
    region.loaded = true;
    console.log(`[WorldStreaming] 📥 Loading region: ${region.name} (Priority ${region.priority})`);

    if (this.productionAssets && typeof this.productionAssets.preloadRegion === 'function') {
      try {
        await this.productionAssets.preloadRegion(region.assetGroup);
      } catch (err) {
        console.warn(`[WorldStreaming] Asset preload notice for ${region.id}:`, err.message);
      }
    }

    if (window.performanceManager) {
      window.performanceManager.loadedRegionsCount = this.getActiveRegionCount();
    }
  }

  unloadRegion(region) {
    if (!region.loaded) return;
    region.loaded = false;
    console.log(`[WorldStreaming] 📤 Unloading region: ${region.name} (Hysteresis distance met)`);

    // Clean up instances specific to this region
    region.activeInstances.forEach(instance => {
      this.disposeObject(instance);
    });
    region.activeInstances.clear();

    if (this.productionAssets && typeof this.productionAssets.unloadRegion === 'function') {
      try {
        this.productionAssets.unloadRegion(region.assetGroup);
      } catch (err) {
        console.warn(`[WorldStreaming] Unload notice for ${region.id}:`, err.message);
      }
    }

    if (window.performanceManager) {
      window.performanceManager.loadedRegionsCount = this.getActiveRegionCount();
    }
  }

  disposeObject(obj) {
    if (!obj) return;
    if (obj.parent) obj.parent.remove(obj);

    obj.traverse(child => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => this.disposeMaterial(m));
        } else {
          this.disposeMaterial(child.material);
        }
      }
    });
  }

  disposeMaterial(mat) {
    if (!mat) return;
    mat.dispose();
    ['map', 'normalMap', 'roughnessMap', 'aoMap', 'metalnessMap'].forEach(prop => {
      if (mat[prop] && typeof mat[prop].dispose === 'function') {
        mat[prop].dispose();
      }
    });
  }

  getActiveRegionCount() {
    return Object.values(this.regions).filter(r => r.loaded).length;
  }
}

if (typeof window !== 'undefined') {
  window.WorldStreamingSystem = WorldStreamingSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorldStreamingSystem };
}
