/**
 * The Whispering Wilds (Kaattu Vazhi) - Graphics Settings Manager
 * Manages active graphics parameters, persistence via localStorage,
 * and dynamic runtime propagation to Three.js systems.
 */

class GraphicsSettings {
  constructor(config) {
    this.config = config || window.GRAPHICS_CONFIG;
    this.storageKey = 'whispering_wilds_graphics_settings';

    // Active state
    this.currentPreset = 'HIGH';
    this.settings = { ...this.config.PRESETS.HIGH };
    this.fpsLimit = 60;
    this.vsync = true;
    this.fullscreen = false;
    this.adaptiveQuality = true;

    // Listeners for change notifications
    this.listeners = new Set();

    // Load persisted settings or auto-detect
    this.load();
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(changedKey = null) {
    this.listeners.forEach(cb => {
      try { cb(this.settings, changedKey); } catch (e) { console.error('[GraphicsSettings] Listener error:', e); }
    });
  }

  applyPreset(presetId) {
    if (!this.config.PRESETS[presetId]) {
      console.warn(`[GraphicsSettings] Unknown preset "${presetId}". Defaulting to HIGH.`);
      presetId = 'HIGH';
    }

    this.currentPreset = presetId;
    this.settings = { ...this.config.PRESETS[presetId] };
    this.save();
    this.notifyListeners('preset');
    return this.settings;
  }

  setPreset(presetId) {
    return this.applyPreset(presetId);
  }

  setSetting(key, value) {
    if (this.settings[key] === value) return;
    this.settings[key] = value;
    this.currentPreset = 'CUSTOM';
    this.save();
    this.notifyListeners(key);
  }

  setCustomSetting(key, value) {
    this.setSetting(key, value);
  }

  getSetting(key, fallback = null) {
    return this.settings[key] !== undefined ? this.settings[key] : fallback;
  }

  serialize() {
    return {
      preset: this.currentPreset,
      settings: this.settings,
      fpsLimit: this.fpsLimit,
      vsync: this.vsync,
      adaptiveQuality: this.adaptiveQuality
    };
  }

  save() {
    try {
      const payload = {
        preset: this.currentPreset,
        settings: this.settings,
        fpsLimit: this.fpsLimit,
        vsync: this.vsync,
        adaptiveQuality: this.adaptiveQuality
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('[GraphicsSettings] Failed to save to localStorage:', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.preset && this.config.PRESETS[parsed.preset]) {
          this.currentPreset = parsed.preset;
        }
        if (parsed.settings) {
          this.settings = { ...this.config.PRESETS[this.currentPreset], ...parsed.settings };
        }
        if (parsed.fpsLimit !== undefined) this.fpsLimit = parsed.fpsLimit;
        if (parsed.vsync !== undefined) this.vsync = parsed.vsync;
        if (parsed.adaptiveQuality !== undefined) this.adaptiveQuality = parsed.adaptiveQuality;
        return true;
      }
    } catch (e) {
      console.warn('[GraphicsSettings] Failed to parse saved settings:', e);
    }
    return false;
  }

  /**
   * Applies active parameters directly to ThreeWorld instances
   */
  applyToThreeWorld(threeWorld) {
    if (!threeWorld || !threeWorld.renderer) return;

    const renderer = threeWorld.renderer;
    const settings = this.settings;

    // 1. Pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const capDPR = settings.pixelRatioCap || 2.0;
    renderer.setPixelRatio(Math.min(dpr, capDPR));

    // 2. Shadows
    const shadowMapSize = this.config.SHADOW_MAP_SIZES[settings.shadowQuality] || 2048;
    if (settings.shadowQuality === 'off') {
      renderer.shadowMap.enabled = false;
    } else {
      renderer.shadowMap.enabled = true;
      if (threeWorld.lighting && threeWorld.lighting.setShadowQuality) {
        threeWorld.lighting.setShadowQuality(settings.shadowQuality, settings.shadowDistance);
      }
    }

    // 3. Weather particle counts
    if (threeWorld.weather && typeof threeWorld.weather.setParticleCount === 'function') {
      threeWorld.weather.setParticleCount(settings.particleCount);
    }

    // 4. Terrain LOD & draw distance
    if (threeWorld.terrain && typeof threeWorld.terrain.setQuality === 'function') {
      threeWorld.terrain.setQuality(settings.terrainQuality, settings.waterQuality);
    }

    // 5. World Assets LOD Bias
    if (threeWorld.worldAssets && typeof threeWorld.worldAssets.setLODBias === 'function') {
      threeWorld.worldAssets.setLODBias(settings.lodBias);
    }

    // 6. Camera Far / View Distance
    if (threeWorld.cameraController && threeWorld.cameraController.camera) {
      threeWorld.cameraController.camera.far = Math.max(500, settings.viewDistance * 1.5);
      threeWorld.cameraController.camera.updateProjectionMatrix();
    }
  }
}

if (typeof window !== 'undefined') {
  window.GraphicsSettings = GraphicsSettings;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GraphicsSettings };
}
