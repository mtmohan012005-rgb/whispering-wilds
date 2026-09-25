/**
 * The Whispering Wilds (Kaattu Vazhi) - World Streaming Data
 * Hardware profiles, distance hysteresis thresholds, streaming priorities,
 * per-frame budgets, and cell state enumerations.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.STREAMING_DATA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Section 4: Authoritative Cell States
  const CELL_STATES = Object.freeze({
    UNLOADED: 'UNLOADED',
    QUEUED: 'QUEUED',
    LOADING: 'LOADING',
    LOADED: 'LOADED',
    ACTIVE: 'ACTIVE',
    DEACTIVATING: 'DEACTIVATING',
    UNLOADING: 'UNLOADING',
    FAILED: 'FAILED'
  });

  // Section 7: Streaming Priority Hierarchy (1 = highest, 8 = lowest)
  const STREAMING_PRIORITY = Object.freeze({
    PLAYER_CELL: 1,
    COLLISION_CELL: 2,
    ACTIVE_QUEST_CELL: 3,
    NEXT_MOVEMENT_CELL: 4,
    CAMERA_VISIBLE_CELL: 5,
    NPC_WILDLIFE_CELL: 6,
    TRANSPORT_ROUTE_CELL: 7,
    DISTANT_VISUAL_CELL: 8
  });

  // Section 15: Asset Task Priority Levels
  const TASK_PRIORITY = Object.freeze({
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4
  });

  // Section 51: Cache Tier Levels
  const CACHE_TIERS = Object.freeze({
    HOT: 'HOT',     // Currently active cells & rendered assets
    WARM: 'WARM',   // Neighboring cells & preloaded assets ready for fast activation
    COLD: 'COLD'    // Recently deactivated cells retained in memory for instant reentry
  });

  // Section 53 - 57: Hardware Scaled Streaming Profiles
  // Enforces Hysteresis: unloadCellRadius > preloadCellRadius > activeCellRadius
  const HARDWARE_STREAMING_PROFILES = Object.freeze({
    VERY_LOW: {
      tier: 'VERY_LOW',
      name: 'Very Low (Sub-integrated / 2GB)',
      activeCellRadius: 40.0,
      preloadCellRadius: 75.0,
      unloadCellRadius: 110.0,
      hysteresisMargin: 35.0,
      maxLoadTasksPerFrame: 1,
      maxActivationTasksPerFrame: 2,
      cpuFrameBudgetMs: 1.5,
      gpuUploadBudget: 1,
      budgets: {
        terrain: 4,
        textures: 16,
        geometry: 24,
        npcs: 4,
        wildlife: 4,
        traffic: 2,
        audio: 4,
        particles: 400
      },
      coldCacheCapacity: 2,
      enableInstancedFoliage: false,
      textureMaxResolution: '1K',
      predictiveLookaheadSec: 1.0
    },
    LOW: {
      tier: 'LOW',
      name: 'Low (Integrated GPU / 4GB)',
      activeCellRadius: 55.0,
      preloadCellRadius: 95.0,
      unloadCellRadius: 135.0,
      hysteresisMargin: 40.0,
      maxLoadTasksPerFrame: 1,
      maxActivationTasksPerFrame: 3,
      cpuFrameBudgetMs: 2.5,
      gpuUploadBudget: 2,
      budgets: {
        terrain: 6,
        textures: 32,
        geometry: 48,
        npcs: 8,
        wildlife: 8,
        traffic: 4,
        audio: 8,
        particles: 800
      },
      coldCacheCapacity: 4,
      enableInstancedFoliage: true,
      textureMaxResolution: '1K',
      predictiveLookaheadSec: 1.5
    },
    MEDIUM: {
      tier: 'MEDIUM',
      name: 'Medium (Mid-range GPU / 8GB)',
      activeCellRadius: 75.0,
      preloadCellRadius: 130.0,
      unloadCellRadius: 180.0,
      hysteresisMargin: 50.0,
      maxLoadTasksPerFrame: 2,
      maxActivationTasksPerFrame: 5,
      cpuFrameBudgetMs: 4.0,
      gpuUploadBudget: 3,
      budgets: {
        terrain: 9,
        textures: 64,
        geometry: 96,
        npcs: 16,
        wildlife: 14,
        traffic: 8,
        audio: 12,
        particles: 1600
      },
      coldCacheCapacity: 8,
      enableInstancedFoliage: true,
      textureMaxResolution: '2K',
      predictiveLookaheadSec: 2.2
    },
    HIGH: {
      tier: 'HIGH',
      name: 'High (Dedicated GPU / 12GB+)',
      activeCellRadius: 105.0,
      preloadCellRadius: 175.0,
      unloadCellRadius: 235.0,
      hysteresisMargin: 60.0,
      maxLoadTasksPerFrame: 4,
      maxActivationTasksPerFrame: 8,
      cpuFrameBudgetMs: 6.0,
      gpuUploadBudget: 5,
      budgets: {
        terrain: 16,
        textures: 128,
        geometry: 180,
        npcs: 28,
        wildlife: 24,
        traffic: 14,
        audio: 18,
        particles: 2800
      },
      coldCacheCapacity: 14,
      enableInstancedFoliage: true,
      textureMaxResolution: '2K',
      predictiveLookaheadSec: 3.0
    },
    ULTRA: {
      tier: 'ULTRA',
      name: 'Ultra (High-end Desktop / 16GB+ VRAM / 4K)',
      activeCellRadius: 135.0,
      preloadCellRadius: 220.0,
      unloadCellRadius: 295.0,
      hysteresisMargin: 75.0,
      maxLoadTasksPerFrame: 6,
      maxActivationTasksPerFrame: 12,
      cpuFrameBudgetMs: 8.0,
      gpuUploadBudget: 8,
      budgets: {
        terrain: 25,
        textures: 256,
        geometry: 320,
        npcs: 40,
        wildlife: 36,
        traffic: 20,
        audio: 24,
        particles: 4000
      },
      coldCacheCapacity: 20,
      enableInstancedFoliage: true,
      textureMaxResolution: '4K',
      predictiveLookaheadSec: 4.0
    }
  });

  // Movement mode velocity multipliers for predictive streaming
  const MOVEMENT_STREAMING_WEIGHTS = Object.freeze({
    STATIONARY: 1.0,
    WALK: 1.2,
    RUN: 1.6,
    SPRINT: 2.2,
    BOAT: 3.0,
    TRAFFIC: 3.5,
    FAST_TRAVEL: 5.0
  });

  // Recovery & Safeguard Constants
  const RECOVERY_CONFIG = Object.freeze({
    MAX_CELL_LOAD_RETRIES: 3,
    RETRY_BASE_COOLDOWN_MS: 1500,
    RETRY_MAX_COOLDOWN_MS: 8000,
    COLLISION_FALL_Y_THRESHOLD: -25.0,
    MIN_MOVEMENT_REEVAL_DISTANCE: 2.5, // meters moved before re-evaluating streaming state
    EVAL_TIME_INTERVAL_SEC: 0.15,      // 150ms evaluation throttle
    ORIGIN_SHIFT_THRESHOLD: 1500.0,    // World origin shift trigger distance
    SAFE_DEACTIVATION_GRACE_FRAMES: 3  // Frames cell remains in DEACTIVATING before UNLOADING
  });

  return {
    CELL_STATES,
    STREAMING_PRIORITY,
    TASK_PRIORITY,
    CACHE_TIERS,
    HARDWARE_STREAMING_PROFILES,
    MOVEMENT_STREAMING_WEIGHTS,
    RECOVERY_CONFIG
  };
});
