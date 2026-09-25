/**
 * The Whispering Wilds - Device Fallback Rules
 * Strictly codified adaptation rules for GPU, CPU, and Memory pressure.
 * Defines hysteresis parameters to prevent rapid High-Low oscillations.
 */
(function(root) {
  'use strict';

  const DeviceFallbackRules = {
    // Adaptation Step Priorities (Order of degradation when under pressure)
    GPU_DEGRADATION_ORDER: Object.freeze([
      'postProcessing',
      'renderScale',
      'shadows',
      'waterEffects',
      'vegetation',
      'particles',
      'distantDetail'
    ]),

    CPU_DEGRADATION_ORDER: Object.freeze([
      'npcUpdateFrequency',
      'wildlifeUpdateFrequency',
      'trafficSimulation',
      'physicsFrequency',
      'backgroundSimulation'
    ]),

    MEMORY_DEGRADATION_ORDER: Object.freeze([
      'coldAssetCache',
      'farTextures',
      'farGeometry',
      'preloadRadius',
      'nonCriticalEffects'
    ]),

    // Hysteresis & Anti-Oscillation settings
    HYSTERESIS_CONFIG: Object.freeze({
      ROLLING_WINDOW_SIZE: 60,       // 60 frame measurements
      DOWNGRADE_FRAME_TIME_MS: 33.3, // Frame time > 33.3ms (< 30 FPS) triggers downgrade consideration
      UPGRADE_FRAME_TIME_MS: 16.0,   // Frame time < 16.0ms (> 60 FPS) triggers upgrade consideration
      SUSTAINED_THRESHOLD_FRAMES: 45, // Must exceed threshold for 45/60 frames before changing
      MIN_ADAPTATION_INTERVAL_MS: 8000, // At least 8 seconds between automatic adjustments
      MAX_AUTOMATIC_DOWNGRADES: 4     // Emergency limit
    }),

    // Safe mode default overrides
    SAFE_MODE_DEFAULTS: Object.freeze({
      renderScale: 0.65,
      shadowQuality: 'OFF',
      waterQuality: 'SAFE',
      vegetationDensity: 0.25,
      particleDensity: 0.2,
      npcDensity: 0.3,
      wildlifeDensity: 0.3,
      trafficDensity: 0.2,
      viewDistance: 50,
      postProcessing: false,
      anisotropy: 1,
      antialiasing: 'NONE',
      streamingPreloadRadius: 1
    }),

    // Features that must NEVER be disabled or degraded even during emergency recovery
    INVIOLABLE_SYSTEMS: Object.freeze([
      'playerLocomotion',
      'collisionDetection',
      'questLogic',
      'saveIntegrity',
      'inputProcessing',
      'customizationCeiling' // <= 5
    ])
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceFallbackRules;
  } else {
    root.DeviceFallbackRules = DeviceFallbackRules;
  }
})(typeof window !== 'undefined' ? window : global);
