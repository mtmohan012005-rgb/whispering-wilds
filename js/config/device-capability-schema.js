/**
 * The Whispering Wilds - Device Capability Schema
 * Defines the normalized hardware capability profile and tiers.
 * Strictly no personal identity or tracking information.
 */
(function(root) {
  'use strict';

  const DEVICE_PROFILES = Object.freeze({
    VERY_LOW: 'VERY_LOW',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    ULTRA: 'ULTRA'
  });

  const SAFE_DEFAULT_PROFILE = DEVICE_PROFILES.MEDIUM;

  const OPERATING_SYSTEMS = Object.freeze({
    WINDOWS: 'WINDOWS',
    MACOS: 'MACOS',
    LINUX: 'LINUX',
    UNKNOWN: 'UNKNOWN'
  });

  const ARCHITECTURES = Object.freeze({
    X64: 'x64',
    ARM64: 'arm64',
    UNKNOWN: 'UNKNOWN'
  });

  const GPU_CLASSES = Object.freeze({
    INTEGRATED: 'INTEGRATED',
    ENTRY_DEDICATED: 'ENTRY_DEDICATED',
    MID_DEDICATED: 'MID_DEDICATED',
    HIGH_DEDICATED: 'HIGH_DEDICATED',
    APPLE_SILICON: 'APPLE_SILICON',
    UNKNOWN: 'UNKNOWN'
  });

  const GRAPHICS_APIS = Object.freeze({
    WEBGPU: 'WEBGPU',
    WEBGL2: 'WEBGL2',
    WEBGL_FALLBACK: 'WEBGL_FALLBACK',
    UNAVAILABLE: 'UNAVAILABLE'
  });

  const MEMORY_CLASSES = Object.freeze({
    VERY_LOW: 'VERY_LOW', // <= 2GB
    LOW: 'LOW',           // 4GB
    MEDIUM: 'MEDIUM',     // 8GB
    HIGH: 'HIGH',         // 16GB+
    UNKNOWN: 'UNKNOWN'
  });

  const DISPLAY_CLASSES = Object.freeze({
    ASPECT_16_9: '16:9',
    ASPECT_16_10: '16:10',
    ASPECT_21_9: '21:9',
    ASPECT_UNUSUAL: 'UNUSUAL'
  });

  const DeviceCapabilitySchema = {
    DEVICE_PROFILES,
    SAFE_DEFAULT_PROFILE,
    OPERATING_SYSTEMS,
    ARCHITECTURES,
    GPU_CLASSES,
    GRAPHICS_APIS,
    MEMORY_CLASSES,
    DISPLAY_CLASSES,

    createEmptyProfile() {
      return {
        os: OPERATING_SYSTEMS.UNKNOWN,
        architecture: ARCHITECTURES.UNKNOWN,
        cpuClass: 'UNKNOWN',
        logicalCores: 2,
        gpuClass: GPU_CLASSES.UNKNOWN,
        gpuVendor: 'UNKNOWN',
        gpuRenderer: 'UNKNOWN',
        memoryClass: MEMORY_CLASSES.UNKNOWN,
        deviceMemoryGB: null,
        graphicsApi: GRAPHICS_APIS.WEBGL2,
        displayClass: DISPLAY_CLASSES.ASPECT_16_9,
        screenWidth: 1920,
        screenHeight: 1080,
        dpr: 1.0,
        fullscreenCapable: true,
        inputCapabilities: {
          keyboard: true,
          mouse: true,
          gamepad: false,
          touch: false
        },
        audioCapabilities: {
          webAudio: true,
          spatialAudio: true,
          maxChannels: 32
        },
        recommendedProfile: DEVICE_PROFILES.MEDIUM,
        isSafeFallback: false
      };
    },

    validateProfile(profile) {
      if (!profile || typeof profile !== 'object') return false;
      const validOS = Object.values(OPERATING_SYSTEMS).includes(profile.os);
      const validArch = Object.values(ARCHITECTURES).includes(profile.architecture);
      const validGpu = Object.values(GPU_CLASSES).includes(profile.gpuClass);
      const validApi = Object.values(GRAPHICS_APIS).includes(profile.graphicsApi);
      const validProfile = Object.values(DEVICE_PROFILES).includes(profile.recommendedProfile);
      return validOS && validArch && validGpu && validApi && validProfile;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceCapabilitySchema;
  } else {
    root.DeviceCapabilitySchema = DeviceCapabilitySchema;
  }
})(typeof window !== 'undefined' ? window : global);
