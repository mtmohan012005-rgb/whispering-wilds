/**
 * The Whispering Wilds - WebGPU Capability
 * Assesses optional WebGPU support. Strictly OPTIONAL - never mandatory.
 */
(function(root) {
  'use strict';

  class WebGPUCapability {
    constructor() {
      this.status = 'UNAVAILABLE';
      this.adapterInfo = null;
      this.checkCapability();
    }

    async checkCapability() {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        this.status = 'UNAVAILABLE';
        return;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          this.status = 'AVAILABLE';
          if (typeof adapter.requestAdapterInfo === 'function') {
            this.adapterInfo = await adapter.requestAdapterInfo();
          }
        } else {
          this.status = 'UNAVAILABLE';
        }
      } catch (err) {
        this.status = 'UNAVAILABLE';
        console.warn('[WebGPUCapability] WebGPU query caught safely:', err);
      }
    }

    getStatus() {
      return this.status;
    }

    isAvailable() {
      return this.status === 'AVAILABLE';
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebGPUCapability;
  } else {
    root.WebGPUCapability = WebGPUCapability;
  }
})(typeof window !== 'undefined' ? window : global);
