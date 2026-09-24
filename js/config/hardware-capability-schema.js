// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - HARDWARE CAPABILITY SCHEMA
// Defines capability tiers, validation rules, quality scales, and schemas.
// ============================================================================

(function() {
  'use strict';

  const CAPABILITY_TIERS = {
    VERY_LOW: 'VERY_LOW',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    ULTRA: 'ULTRA'
  };

  const QUALITY_STEPS = [100, 90, 80, 70, 60, 50];

  const SUPPORTED_TARGET_FPS = [30, 40, 60, 75, 90, 120, 144, 165, 240];

  const COMMON_RESOLUTIONS = [
    { width: 1280, height: 720, label: '720p (HD)' },
    { width: 1366, height: 768, label: '1366x768 (Laptop)' },
    { width: 1600, height: 900, label: '900p (HD+)' },
    { width: 1920, height: 1080, label: '1080p (Full HD)' },
    { width: 2560, height: 1440, label: '1440p (QHD)' },
    { width: 3840, height: 2160, label: '4K (UHD)' }
  ];

  const DOWNGRADE_SEQUENCE = [
    'postProcessing',
    'renderScale',
    'shadows',
    'vegetation',
    'particles',
    'waterEffects',
    'distantSimulation',
    'textureQuality'
  ];

  function validateHardwareConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return false;
    const hasCores = typeof cfg.cpuCores === 'number' && cfg.cpuCores > 0;
    const hasMem = typeof cfg.deviceMemoryGB === 'number' && cfg.deviceMemoryGB > 0;
    const hasWebGL = cfg.webglVersion === 1 || cfg.webglVersion === 2;
    return hasCores && hasMem && hasWebGL;
  }

  function validatePerformanceSettings(settings) {
    if (!settings || typeof settings !== 'object') return false;
    if (typeof settings.renderScale === 'number' && (settings.renderScale < 0.4 || settings.renderScale > 1.5)) {
      return false;
    }
    if (settings.targetFPS && !SUPPORTED_TARGET_FPS.includes(settings.targetFPS)) {
      return false;
    }
    if (settings.tier && !CAPABILITY_TIERS[settings.tier]) {
      return false;
    }
    return true;
  }

  const schema = {
    CAPABILITY_TIERS,
    QUALITY_STEPS,
    SUPPORTED_TARGET_FPS,
    COMMON_RESOLUTIONS,
    DOWNGRADE_SEQUENCE,
    validateHardwareConfig,
    validatePerformanceSettings
  };

  if (typeof window !== 'undefined') {
    window.HardwareCapabilitySchema = schema;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = schema;
  }
})();
