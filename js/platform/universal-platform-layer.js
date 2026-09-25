/**
 * The Whispering Wilds - Universal Platform Layer
 * Aggregates all platform adapters into a single normalized, anonymous hardware profile.
 * Strictly zero personal identification information.
 */
(function(root) {
  'use strict';

  class UniversalPlatformLayer {
    constructor() {
      const OSAdapterClass = root.OSAdapter || (typeof require !== 'undefined' && require('./os-adapter'));
      const GPUAdapterClass = root.GPUAdapter || (typeof require !== 'undefined' && require('./gpu-adapter'));
      const DisplayAdapterClass = root.DisplayAdapter || (typeof require !== 'undefined' && require('./display-adapter'));
      const InputAdapterClass = root.InputAdapter || (typeof require !== 'undefined' && require('./input-adapter'));
      const AudioAdapterClass = root.AudioAdapter || (typeof require !== 'undefined' && require('./audio-adapter'));
      const StorageAdapterClass = root.StorageAdapter || (typeof require !== 'undefined' && require('./storage-adapter'));

      this.osAdapter = OSAdapterClass ? new OSAdapterClass() : null;
      this.gpuAdapter = GPUAdapterClass ? new GPUAdapterClass() : null;
      this.displayAdapter = DisplayAdapterClass ? new DisplayAdapterClass() : null;
      this.inputAdapter = InputAdapterClass ? new InputAdapterClass() : null;
      this.audioAdapter = AudioAdapterClass ? new AudioAdapterClass() : null;
      this.storageAdapter = StorageAdapterClass ? new StorageAdapterClass() : null;

      this.profile = this.generateNormalizedProfile();
    }

    generateNormalizedProfile() {
      const os = this.osAdapter ? this.osAdapter.getOS() : 'UNKNOWN';
      const arch = this.osAdapter ? this.osAdapter.getArchitecture() : 'UNKNOWN';

      // CPU detection
      let logicalCores = 2;
      if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        logicalCores = navigator.hardwareConcurrency;
      }
      let cpuClass = 'UNKNOWN';
      if (logicalCores >= 8) cpuClass = 'HIGH';
      else if (logicalCores >= 4) cpuClass = 'MEDIUM';
      else cpuClass = 'LOW';

      // Memory detection
      let memoryClass = 'UNKNOWN';
      let deviceMemoryGB = null;
      if (typeof navigator !== 'undefined' && navigator.deviceMemory) {
        deviceMemoryGB = navigator.deviceMemory;
        if (deviceMemoryGB >= 16) memoryClass = 'HIGH';
        else if (deviceMemoryGB >= 8) memoryClass = 'MEDIUM';
        else if (deviceMemoryGB >= 4) memoryClass = 'LOW';
        else memoryClass = 'VERY_LOW';
      }

      // GPU & Graphics API
      const gpuCaps = this.gpuAdapter ? this.gpuAdapter.getCapabilities() : {};
      const gpuClass = gpuCaps.gpuClass || 'UNKNOWN';
      let graphicsApi = 'WEBGL2';
      if (!gpuCaps.webgl2 && gpuCaps.webgl1) graphicsApi = 'WEBGL_FALLBACK';
      else if (!gpuCaps.webgl2 && !gpuCaps.webgl1) graphicsApi = 'UNAVAILABLE';

      // Display
      const dispInfo = this.displayAdapter ? this.displayAdapter.getDisplayInfo() : {};

      // Input
      const inputCaps = this.inputAdapter ? this.inputAdapter.getCapabilities() : {
        keyboard: true, mouse: true, gamepad: false
      };

      // Audio
      const audioCaps = this.audioAdapter ? this.audioAdapter.getCapabilities() : {
        webAudioSupported: true, spatialAudioSupported: true
      };

      return {
        os: os,
        architecture: arch,
        cpuClass: cpuClass,
        logicalCores: logicalCores,
        gpuClass: gpuClass,
        gpuVendor: gpuCaps.vendor || 'UNKNOWN',
        gpuRenderer: gpuCaps.renderer || 'UNKNOWN',
        memoryClass: memoryClass,
        deviceMemoryGB: deviceMemoryGB,
        graphicsApi: graphicsApi,
        displayClass: dispInfo.aspectClass || '16:9',
        screenWidth: dispInfo.screenWidth || 1920,
        screenHeight: dispInfo.screenHeight || 1080,
        dpr: dispInfo.dpr || 1.0,
        fullscreenCapable: dispInfo.fullscreenCapable ?? true,
        inputCapabilities: inputCaps,
        audioCapabilities: audioCaps
      };
    }

    getProfile() {
      return Object.assign({}, this.profile);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalPlatformLayer;
  } else {
    root.UniversalPlatformLayer = UniversalPlatformLayer;
  }
})(typeof window !== 'undefined' ? window : global);
