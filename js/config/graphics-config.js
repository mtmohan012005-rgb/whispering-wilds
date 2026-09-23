/**
 * The Whispering Wilds (Kaattu Vazhi) - PC Graphics Configuration
 * Quality presets (VERY_LOW to ULTRA), resolution modes, FPS caps,
 * and client hardware auto-detection.
 */

window.GRAPHICS_CONFIG = {
  // Preset definitions
  PRESETS: {
    VERY_LOW: {
      id: 'VERY_LOW',
      name: 'Very Low (Performance)',
      resolutionScale: 0.65,
      pixelRatioCap: 1.0,
      shadowQuality: 'off',
      shadowDistance: 30,
      textureQuality: 'low',
      maxAnisotropy: 1,
      terrainQuality: 'low',
      vegetationDensity: 'low',
      grassDensity: 'off',
      waterQuality: 'low',
      fogQuality: 'low',
      weatherQuality: 'low',
      particleCount: 800,
      postProcessingQuality: 'off',
      ambientOcclusion: false,
      reflectionQuality: 'off',
      lodBias: 0.6,
      viewDistance: 120,
      npcSimulationDistance: 30,
      wildlifeSimulationDistance: 35,
      particleQuality: 'low'
    },
    LOW: {
      id: 'LOW',
      name: 'Low',
      resolutionScale: 0.8,
      pixelRatioCap: 1.25,
      shadowQuality: 'low',
      shadowDistance: 50,
      textureQuality: 'low',
      maxAnisotropy: 2,
      terrainQuality: 'low',
      vegetationDensity: 'low',
      grassDensity: 'low',
      waterQuality: 'low',
      fogQuality: 'low',
      weatherQuality: 'low',
      particleCount: 1600,
      postProcessingQuality: 'low',
      ambientOcclusion: false,
      reflectionQuality: 'low',
      lodBias: 0.8,
      viewDistance: 180,
      npcSimulationDistance: 45,
      wildlifeSimulationDistance: 50,
      particleQuality: 'low'
    },
    MEDIUM: {
      id: 'MEDIUM',
      name: 'Medium',
      resolutionScale: 1.0,
      pixelRatioCap: 1.5,
      shadowQuality: 'medium',
      shadowDistance: 80,
      textureQuality: 'medium',
      maxAnisotropy: 4,
      terrainQuality: 'medium',
      vegetationDensity: 'medium',
      grassDensity: 'medium',
      waterQuality: 'medium',
      fogQuality: 'medium',
      weatherQuality: 'medium',
      particleCount: 2400,
      postProcessingQuality: 'medium',
      ambientOcclusion: true,
      reflectionQuality: 'medium',
      lodBias: 1.0,
      viewDistance: 260,
      npcSimulationDistance: 65,
      wildlifeSimulationDistance: 75,
      particleQuality: 'medium'
    },
    HIGH: {
      id: 'HIGH',
      name: 'High (Recommended)',
      resolutionScale: 1.0,
      pixelRatioCap: 2.0,
      shadowQuality: 'high',
      shadowDistance: 130,
      textureQuality: 'high',
      maxAnisotropy: 8,
      terrainQuality: 'high',
      vegetationDensity: 'high',
      grassDensity: 'high',
      waterQuality: 'high',
      fogQuality: 'high',
      weatherQuality: 'high',
      particleCount: 3200,
      postProcessingQuality: 'high',
      ambientOcclusion: true,
      reflectionQuality: 'high',
      lodBias: 1.2,
      viewDistance: 350,
      npcSimulationDistance: 90,
      wildlifeSimulationDistance: 100,
      particleQuality: 'high'
    },
    ULTRA: {
      id: 'ULTRA',
      name: 'Ultra (Cinematic)',
      resolutionScale: 1.0,
      pixelRatioCap: 2.5,
      shadowQuality: 'ultra',
      shadowDistance: 200,
      textureQuality: 'ultra',
      maxAnisotropy: 16,
      terrainQuality: 'ultra',
      vegetationDensity: 'ultra',
      grassDensity: 'ultra',
      waterQuality: 'ultra',
      fogQuality: 'ultra',
      weatherQuality: 'ultra',
      particleCount: 5000,
      postProcessingQuality: 'ultra',
      ambientOcclusion: true,
      reflectionQuality: 'ultra',
      lodBias: 1.5,
      viewDistance: 500,
      npcSimulationDistance: 120,
      wildlifeSimulationDistance: 140,
      particleQuality: 'ultra'
    },
    CUSTOM: {
      id: 'CUSTOM',
      name: 'Custom',
      resolutionScale: 1.0,
      pixelRatioCap: 2.0,
      shadowQuality: 'high',
      shadowDistance: 130,
      textureQuality: 'high',
      maxAnisotropy: 8,
      terrainQuality: 'high',
      vegetationDensity: 'high',
      grassDensity: 'high',
      waterQuality: 'high',
      fogQuality: 'high',
      weatherQuality: 'high',
      particleCount: 3200,
      postProcessingQuality: 'high',
      ambientOcclusion: true,
      reflectionQuality: 'high',
      lodBias: 1.2,
      viewDistance: 350,
      npcSimulationDistance: 90,
      wildlifeSimulationDistance: 100,
      particleQuality: 'high'
    }
  },

  // Target FPS presets
  FPS_TARGETS: [30, 60, 90, 120, 144, 'unlimited'],

  // Standard PC 16:9 and ultrawide resolutions
  RESOLUTIONS: [
    { width: 1280, height: 720, label: '1280 × 720 (720p HD)' },
    { width: 1600, height: 900, label: '1600 × 900 (HD+)' },
    { width: 1920, height: 1080, label: '1920 × 1080 (1080p Full HD)' },
    { width: 2560, height: 1440, label: '2560 × 1440 (1440p QHD)' },
    { width: 3840, height: 2160, label: '3840 × 2160 (4K UHD)' }
  ],

  // Shadow Map dimensions
  SHADOW_MAP_SIZES: {
    off: 0,
    low: 1024,
    medium: 2048,
    high: 2048,
    ultra: 4096
  },

  /**
   * Safe hardware detection to recommend an optimal initial preset.
   * Never uploads hardware information anywhere.
   */
  detectHardwareCapabilities: function(renderer) {
    const dpr = window.devicePixelRatio || 1;
    const screenWidth = window.screen ? window.screen.width : window.innerWidth;
    const screenHeight = window.screen ? window.screen.height : window.innerHeight;

    let maxAnisotropy = 4;
    let maxTextureSize = 4096;
    let gpuTier = 'medium';

    if (renderer && renderer.capabilities) {
      if (typeof renderer.capabilities.getMaxAnisotropy === 'function') {
        maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      if (renderer.capabilities.maxTextureSize) {
        maxTextureSize = renderer.capabilities.maxTextureSize;
      }
    }

    // Heuristic categorization
    if (screenWidth >= 2560 || maxAnisotropy >= 16) {
      gpuTier = 'high';
    }
    if (screenWidth >= 3840 && maxAnisotropy >= 16) {
      gpuTier = 'ultra';
    }
    if (screenWidth < 1600 || maxTextureSize < 4096 || maxAnisotropy <= 2) {
      gpuTier = 'low';
    }

    let recommendedPreset = 'HIGH';
    if (gpuTier === 'ultra') recommendedPreset = 'ULTRA';
    else if (gpuTier === 'high') recommendedPreset = 'HIGH';
    else if (gpuTier === 'medium') recommendedPreset = 'MEDIUM';
    else recommendedPreset = 'LOW';

    return {
      screenWidth,
      screenHeight,
      devicePixelRatio: dpr,
      maxAnisotropy,
      maxTextureSize,
      gpuTier,
      recommendedPreset
    };
  }
};

for (const p of Object.values(window.GRAPHICS_CONFIG.PRESETS)) {
  if (p.weatherParticles === undefined) p.weatherParticles = p.particleCount;
}
window.GRAPHICS_PRESETS = window.GRAPHICS_CONFIG.PRESETS;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRAPHICS_CONFIG: window.GRAPHICS_CONFIG, GRAPHICS_PRESETS: window.GRAPHICS_PRESETS };
}
