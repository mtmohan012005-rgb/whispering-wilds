// ============================================================================
// THE WHISPERING WILDS — GPU CAPABILITY DETECTOR
// Detects GPU vendor, WebGPU/WebGL2 support, memory hints, screen info.
// Must run BEFORE ThreeWorld is initialised.
// ============================================================================

(function () {
  'use strict';

  const GPUCapability = {
    // --- Detected values ---
    gpuRenderer:      'unknown',
    gpuVendor:        'unknown',
    supportsWebGPU:   false,
    supportsWebGL2:   false,
    maxTextureSize:   2048,
    devicePixelRatio: window.devicePixelRatio || 1.0,
    screenWidth:      window.screen.width,
    screenHeight:     window.screen.height,
    isMobile:         false,
    browserName:      'unknown',
    // Estimated tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'
    tier:             'MEDIUM',
    detected:         false,

    // --- Detect everything synchronously ---
    detect() {
      if (this.detected) return this;

      // Mobile detection
      this.isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

      // Browser name
      const ua = navigator.userAgent;
      if (ua.includes('Edg/'))    this.browserName = 'Edge';
      else if (ua.includes('Chrome/')) this.browserName = 'Chrome';
      else if (ua.includes('Firefox/')) this.browserName = 'Firefox';
      else if (ua.includes('Safari/')) this.browserName = 'Safari';

      // WebGPU support
      this.supportsWebGPU = !!(navigator.gpu);

      // WebGL2 probe
      try {
        const probe = document.createElement('canvas');
        const gl2 = probe.getContext('webgl2');
        if (gl2) {
          this.supportsWebGL2 = true;
          this.maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) || 2048;

          // GPU renderer string
          const dbgExt = gl2.getExtension('WEBGL_debug_renderer_info');
          if (dbgExt) {
            this.gpuRenderer = gl2.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) || 'unknown';
            this.gpuVendor   = gl2.getParameter(dbgExt.UNMASKED_VENDOR_WEBGL)   || 'unknown';
          }
          gl2.getExtension('WEBGL_lose_context')?.loseContext();
          probe.remove();
        } else {
          // Try WebGL 1
          const gl1 = probe.getContext('webgl') || probe.getContext('experimental-webgl');
          this.supportsWebGL2 = false;
          if (gl1) {
            const dbgExt = gl1.getExtension('WEBGL_debug_renderer_info');
            if (dbgExt) {
              this.gpuRenderer = gl1.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) || 'unknown';
              this.gpuVendor   = gl1.getParameter(dbgExt.UNMASKED_VENDOR_WEBGL)   || 'unknown';
            }
          }
          probe.remove();
        }
      } catch (e) {
        console.warn('[GPUCapability] WebGL probe failed:', e.message);
      }

      // Determine tier from GPU string + resolution + mobile
      this.tier = this._selectTier();
      this.detected = true;

      console.log(`[GPUCapability] GPU: "${this.gpuRenderer}" | Vendor: "${this.gpuVendor}" | WebGPU: ${this.supportsWebGPU} | WebGL2: ${this.supportsWebGL2} | MaxTex: ${this.maxTextureSize} | DPR: ${this.devicePixelRatio} | Tier: ${this.tier}`);
      return this;
    },

    _selectTier() {
      if (this.isMobile) return 'LOW';
      if (!this.supportsWebGL2) return 'LOW';

      const renderer = this.gpuRenderer.toLowerCase();

      // ULTRA — modern discrete GPUs
      if (/rtx [34]\d{3}|rx 7[6-9]\d{2}|radeon rx 7|arc a7|intel arc a7/i.test(renderer)) return 'ULTRA';

      // HIGH — solid mid-high discrete
      if (/rtx [12]\d{3}|gtx 1[06-9]\d{1}|rx 6[5-9]\d{2}|rx 5[5-9]\d{2}|radeon rx 6|radeon rx 5|arc a5/i.test(renderer)) return 'HIGH';

      // MEDIUM — older discrete or modern integrated
      if (/gtx 1[0-5]\d{1}|gtx [7-9]\d{2}|rx [56]00|radeon (rx )?[4-5]|intel (iris|uhd|hd) (6[2-9]\d|[7-9]\d\d|[1-9]\d{3})|apple m/i.test(renderer)) return 'MEDIUM';

      // LOW — everything else
      if (/intel (hd|gma)|intel (4|3)\d{3}|llvmpipe|swiftshader|software|mali|adreno [2-5]|imagination|videocore/i.test(renderer)) return 'LOW';

      // Default: if maxTexture is large enough, assume at least MEDIUM
      if (this.maxTextureSize >= 8192 && this.screenWidth >= 1920) return 'HIGH';
      if (this.maxTextureSize >= 4096) return 'MEDIUM';

      return 'MEDIUM';
    },

    // Call from renderer selection to get clamped pixel ratio for each tier
    getRecommendedPixelRatio() {
      const dpr = this.devicePixelRatio;
      switch (this.tier) {
        case 'ULTRA':  return Math.min(dpr, 1.5);
        case 'HIGH':   return Math.min(dpr, 1.25);
        case 'MEDIUM': return Math.min(dpr, 1.0);
        case 'LOW':
        default:       return Math.min(dpr, 0.85);
      }
    },

    // Summary object for diagnostics HUD
    getSummary() {
      return {
        gpuRenderer:    this.gpuRenderer,
        gpuVendor:      this.gpuVendor,
        supportsWebGPU: this.supportsWebGPU,
        supportsWebGL2: this.supportsWebGL2,
        maxTextureSize: this.maxTextureSize,
        devicePixelRatio: this.devicePixelRatio,
        screenRes:      `${this.screenWidth}×${this.screenHeight}`,
        isMobile:       this.isMobile,
        browser:        this.browserName,
        tier:           this.tier,
        recommendedDPR: this.getRecommendedPixelRatio()
      };
    }
  };

  window.GPUCapability = GPUCapability;

})();
