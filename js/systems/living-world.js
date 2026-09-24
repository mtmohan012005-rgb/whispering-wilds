// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION LIVING WORLD SYSTEM
// Master Entity Registry, Distance-Based LOD, Schedules & Species Simulation
// ============================================================================

/**
 * Fast, deterministic seeded PRNG (Mulberry32)
 * Ensures reproducible spawning and route variations without Math.random() allocations
 */
if (typeof WorldRNG === 'undefined') {
  var WorldRNG = class WorldRNG {
    constructor(seed = 133742) {
      this.s = seed;
    }

    next() {
      let t = (this.s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) {
      return min + this.next() * (max - min);
    }

    choice(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
  };
}

class LivingWorldSystem {
  /**
   * @param {THREE.Scene} scene - The main Three.js Scene
   * @param {Object} terrain - Procedural terrain elevation engine
   */
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // Entity Map Registries
    this.npcs = new Map();
    this.wildlife = new Map();

    // Deterministic Seeded PRNG
    this.rng = new WorldRNG(98765);

    // World Clock state (0 - 1440 minutes)
    this.worldClockMinutes = 540; // Default: 9:00 AM

    // Distance-Based Simulation LOD thresholds (in meters)
    this.LOD_TIER_NEAR = 65.0;  // Full 3D rendering, mesh animation, terrain IK, perception
    this.LOD_TIER_MID = 160.0;  // Throttled animation, basic perception
    // Beyond 160.0 = Tier 3 (Far): Mesh hidden/culled, cheap mathematical coordinate updates only

    // Frame counter for mid-tier animation throttling
    this.frameIndex = 0;

    // Scratch objects to avoid memory allocations in update()
    this._scratchVecA = new THREE.Vector3();
    this._scratchVecB = new THREE.Vector3();

    // Active Biome / Region registry
    this.activeRegions = new Set();

    // Initialize Default Regional Entities
    this.initDefaultWorldEntities();
  }

  /**
   * Registers a production NPC instance into the system
   */
  registerNPC(config, isInitialSeed = false) {
    if (!config || !config.id) return null;
    if (this.npcs.has(config.id)) {
      return this.npcs.get(config.id);
    }
    if (!isInitialSeed && window.performanceManager && !window.performanceManager.canSpawn('npc')) {
      return null;
    }

    const npc = new ProductionNPC(config, this.scene, this.terrain);
    this.npcs.set(config.id, npc);
    if (window.performanceManager) window.performanceManager.incrementSpawn('npc');
    return npc;
  }

  /**
   * Registers a wildlife creature instance into the system
   */
  registerWildlife(speciesConfig, spawnConfig, isInitialSeed = false) {
    if (!speciesConfig) return null;
    if (!isInitialSeed && window.performanceManager && !window.performanceManager.canSpawn('wildlife')) {
      return null;
    }
    const wildlife = new ProductionWildlife(speciesConfig, spawnConfig, this.scene, this.terrain);
    this.wildlife.set(wildlife.id, wildlife);
    if (window.performanceManager) window.performanceManager.incrementSpawn('wildlife');
    return wildlife;
  }

  /**
   * Seeds default production NPCs and Wildlife across all biomes
   */
  initDefaultWorldEntities() {
    // 1. Register production NPCs
    if (typeof NPC_PRODUCTION_DATA !== 'undefined' && Array.isArray(NPC_PRODUCTION_DATA)) {
      NPC_PRODUCTION_DATA.forEach((npcConfig) => {
        this.registerNPC(npcConfig, true);
      });
      console.log(`[LivingWorld] Registered ${this.npcs.size} production NPCs across Tamil Nadu biomes.`);
    }

    // 2. Register production Wildlife Spawns
    if (typeof WILDLIFE_PRODUCTION_SPAWNS !== 'undefined' && Array.isArray(WILDLIFE_PRODUCTION_SPAWNS)) {
      WILDLIFE_PRODUCTION_SPAWNS.forEach((spawnGroup) => {
        const speciesConfig = typeof getWildlifeSpeciesConfig === 'function' ? getWildlifeSpeciesConfig(spawnGroup.species) : null;
        if (!speciesConfig) return;

        const count = spawnGroup.count || 2;
        for (let i = 0; i < count; i++) {
          const offsetX = this.rng.range(-8, 8);
          const offsetZ = this.rng.range(-8, 8);
          const instanceId = `${spawnGroup.id}_${i + 1}`;

          this.registerWildlife(speciesConfig, {
            id: instanceId,
            x: spawnGroup.center.x + offsetX,
            z: spawnGroup.center.z + offsetZ,
            homeX: spawnGroup.center.x,
            homeZ: spawnGroup.center.z,
            isHerdLeader: i === 0,
            initialSeed: (i * 17 + 23) % 100
          }, true);
        }
      });
      console.log(`[LivingWorld] Registered ${this.wildlife.size} production wildlife entities across habitats.`);
    }
  }

  /**
   * Spawns entities associated with a specific geographic region
   */
  spawnRegion(regionName) {
    this.activeRegions.add(regionName);
  }

  /**
   * Despawns or puts to sleep entities in inactive regions
   */
  despawnRegion(regionName) {
    this.activeRegions.delete(regionName);
  }

  /**
   * Sets in-game world time in minutes (0 - 1440)
   */
  setWorldTime(minutes) {
    this.worldClockMinutes = (minutes % 1440 + 1440) % 1440;
    this.updateSchedules(this.worldClockMinutes);
  }

  /**
   * Evaluates all NPC daily schedules against current world clock
   */
  updateSchedules(worldClockMinutes) {
    this.npcs.forEach((npc) => {
      npc.evaluateSchedule(worldClockMinutes);
    });
  }

  /**
   * Master per-frame update called by ThreeWorld renderLoop
   * @param {number} deltaTime - Time step in seconds
   * @param {number} worldClockMinutes - In-game clock (0 - 1440)
   * @param {THREE.Vector3|Object} playerPosition - Current player 3D position
   */
  update(deltaTime, worldClockMinutes, playerPosition) {
    this.frameIndex++;
    if (worldClockMinutes !== undefined) {
      this.worldClockMinutes = worldClockMinutes;
    } else if (window.GameState && window.GameState.world && typeof window.GameState.world.time === 'number') {
      this.worldClockMinutes = (window.GameState.world.time * 60) % 1440;
    }

    const pPos = playerPosition || { x: 0, y: 0, z: 0 };

    // 1. Update NPCs with Distance-Based Simulation LOD
    this.updateNPCs(deltaTime, pPos);

    // 2. Update Wildlife with Species-Specific Perception and Herding
    this.updateWildlife(deltaTime, pPos);
  }

  updateNPCs(deltaTime, playerPosition) {
    const shouldThrottleMidTier = this.frameIndex % 2 !== 0;

    this.npcs.forEach((npc) => {
      const dist = Math.hypot(npc.x - playerPosition.x, npc.z - playerPosition.z);

      let lodTier = 1;
      if (dist > this.LOD_TIER_MID) {
        lodTier = 3; // Far: Culled mesh, low-cost math updates
      } else if (dist > this.LOD_TIER_NEAR) {
        lodTier = 2; // Mid: Throttled animation
      }

      // If mid tier and throttled frame, skip mixer work
      const dt = lodTier === 2 && shouldThrottleMidTier ? deltaTime * 2.0 : deltaTime;
      if (lodTier !== 2 || !shouldThrottleMidTier) {
        npc.update(dt, this.worldClockMinutes, playerPosition, this.terrain, lodTier);
      }
    });
  }

  updateWildlife(deltaTime, playerPosition) {
    const shouldThrottleMidTier = this.frameIndex % 3 !== 0;

    this.wildlife.forEach((creature) => {
      const dist = Math.hypot(creature.x - playerPosition.x, creature.z - playerPosition.z);

      let lodTier = 1;
      if (dist > this.LOD_TIER_MID) {
        lodTier = 3; // Far: Culled
      } else if (dist > this.LOD_TIER_NEAR) {
        lodTier = 2; // Mid
      }

      if (lodTier !== 2 || !shouldThrottleMidTier) {
        creature.update(deltaTime, dist, playerPosition, this.terrain, lodTier);
      }
    });
  }

  /**
   * Queries nearby entities within radius
   */
  getNearbyEntities(playerPosition, radius = 25.0) {
    const results = { npcs: [], wildlife: [] };
    if (!playerPosition) return results;

    this.npcs.forEach((npc) => {
      const d = Math.hypot(npc.x - playerPosition.x, npc.z - playerPosition.z);
      if (d <= radius) {
        results.npcs.push({ entity: npc, distance: d });
      }
    });

    this.wildlife.forEach((creature) => {
      const d = Math.hypot(creature.x - playerPosition.x, creature.z - playerPosition.z);
      if (d <= radius) {
        results.wildlife.push({ entity: creature, distance: d });
      }
    });

    results.npcs.sort((a, b) => a.distance - b.distance);
    results.wildlife.sort((a, b) => a.distance - b.distance);
    return results;
  }

  /**
   * Returns the closest interactable NPC within radius (default 3.5m)
   */
  getNearbyInteractableNPC(playerPosition, maxDist = 3.5) {
    if (!playerPosition) return null;

    let closest = null;
    let minD = maxDist;

    this.npcs.forEach((npc) => {
      const d = Math.hypot(npc.x - playerPosition.x, npc.z - playerPosition.z);
      if (d < minD) {
        minD = d;
        closest = npc;
      }
    });

    return closest;
  }
}

// Global browser and module exports
if (typeof window !== 'undefined') {
  window.WorldRNG = WorldRNG;
  window.LivingWorldSystem = LivingWorldSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorldRNG, LivingWorldSystem };
}
