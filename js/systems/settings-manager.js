// ============================================================================
// THE WHISPERING WILDS - UNIFIED SETTINGS MANAGER
// Single authoritative settings manager that coordinates Graphics, Audio,
// Display, Controls, and Localization settings without duplicating storage.
// ============================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'ww_settings_v1';

  const DEFAULT_SETTINGS = {
    version: 1,
    firstRunCompleted: false,
    graphics: {
      preset: 'medium', // low, medium, high, ultra, safe
      resolutionScale: 1.0,
      shadows: true,
      shadowQuality: 'medium',
      postProcessing: true,
      bloom: true,
      rainStreaks: true,
      foliageDensity: 1.0,
      targetFPS: 60,
      ecoMode: false
    },
    display: {
      mode: 'windowed', // 'fullscreen' or 'windowed'
      resolution: '1080p', // '1080p', '1440p', '4k'
      uiScale: 1.0
    },
    audio: {
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      ambientVolume: 0.8,
      weatherVolume: 0.7,
      language: 'tamil', // 'tamil' or 'english'
      subtitles: true,
      subtitlesLanguage: 'both' // 'english', 'tamil', 'both'
    },
    controls: {
      mouseSensitivity: 1.0,
      invertY: false,
      gamepadEnabled: true
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      screenFlashReduced: false
    }
  };

  class SettingsManager {
    constructor() {
      this._settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      this._restartRequired = false;
      this._pendingRestartChanges = [];
      this._listeners = new Set();
      this._safeModeActive = false;
      this._originalBeforeSafeMode = null;

      this.load();
    }

    get settings() {
      return this._settings;
    }

    get isRestartRequired() {
      return this._restartRequired;
    }

    get pendingRestartChanges() {
      return [...this._pendingRestartChanges];
    }

    get isSafeMode() {
      return this._safeModeActive;
    }

    isFirstRun() {
      return !this._settings.firstRunCompleted;
    }

    markFirstRunCompleted() {
      this._settings.firstRunCompleted = true;
      this.save();
    }

    // -------------------------------------------------------------------------
    // LOAD & SAVE
    // -------------------------------------------------------------------------
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Deep merge with defaults to ensure missing keys are filled
          this._mergeDefaults(this._settings, parsed);
        } else {
          // Check legacy graphics settings
          if (window.GraphicsSettings && typeof window.GraphicsSettings.getSettings === 'function') {
            const legacyGraphics = window.GraphicsSettings.getSettings();
            if (legacyGraphics) {
              Object.assign(this._settings.graphics, legacyGraphics);
            }
          }
        }
      } catch (e) {
        console.warn('[SettingsManager] Failed to parse settings, using defaults:', e);
      }

      this._applyToGameState();
      return this._settings;
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
        this._applyToGameState();
        this._notifyListeners();
        return true;
      } catch (e) {
        console.error('[SettingsManager] Failed to persist settings:', e);
        return false;
      }
    }

    // -------------------------------------------------------------------------
    // APPLY SETTINGS
    // -------------------------------------------------------------------------
    setGraphics(key, value) {
      if (this._settings.graphics[key] !== value) {
        this._settings.graphics[key] = value;
        // Check if change requires restart (e.g. major resolution / shadow map tier changes)
        if (['preset', 'resolutionScale'].includes(key)) {
          this._restartRequired = true;
          if (!this._pendingRestartChanges.includes(key)) {
            this._pendingRestartChanges.push(key);
          }
        }
        if (key === 'preset' && window.performanceManager) {
          window.performanceManager.applyProfile(value.toUpperCase());
        }
        if (key === 'targetFPS' && window.performanceManager) {
          window.performanceManager.setTargetFPS(value);
        }
        this.save();
      }
    }

    setAudio(key, value) {
      if (this._settings.audio[key] !== value) {
        this._settings.audio[key] = value;
        if (key === 'language' && window.LocalizationManager) {
          window.LocalizationManager.setLanguage(value);
        }
        this.save();
      }
    }

    setDisplay(key, value) {
      if (this._settings.display[key] !== value) {
        this._settings.display[key] = value;
        if (key === 'mode') {
          if (window.DisplayManager) {
            window.DisplayManager.setMode(value);
          }
        }
        this.save();
      }
    }

    setAccessibility(key, value) {
      if (this._settings.accessibility[key] !== value) {
        this._settings.accessibility[key] = value;
        this.save();
      }
    }

    // -------------------------------------------------------------------------
    // GRAPHICS SAFE MODE
    // -------------------------------------------------------------------------
    applySafeGraphicsMode() {
      if (this._safeModeActive) return;
      this._originalBeforeSafeMode = JSON.parse(JSON.stringify(this._settings.graphics));
      this._safeModeActive = true;

      // Safe graphics settings: low preset, reduced shadows, lower pixel ratio, reduced post-processing
      this._settings.graphics.preset = 'low';
      this._settings.graphics.resolutionScale = 0.75;
      this._settings.graphics.shadows = false;
      this._settings.graphics.postProcessing = false;
      this._settings.graphics.bloom = false;
      this._settings.graphics.rainStreaks = false;
      this._settings.graphics.foliageDensity = 0.5;

      console.warn('[SettingsManager] SAFE GRAPHICS MODE activated.');
      this._applyToGameState();
      this._notifyListeners();
    }

    restoreFromSafeMode(confirmKeep = false) {
      if (!this._safeModeActive) return;
      if (!confirmKeep && this._originalBeforeSafeMode) {
        this._settings.graphics = this._originalBeforeSafeMode;
      }
      this._safeModeActive = false;
      this._originalBeforeSafeMode = null;
      this.save();
    }

    // -------------------------------------------------------------------------
    // EVENT LISTENERS
    // -------------------------------------------------------------------------
    onChange(fn) {
      this._listeners.add(fn);
      return () => this._listeners.delete(fn);
    }

    _notifyListeners() {
      for (const fn of this._listeners) {
        try { fn(this._settings); } catch (e) { console.error(e); }
      }
    }

    _mergeDefaults(target, source) {
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          this._mergeDefaults(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }

    _applyToGameState() {
      if (!window.GameState) return;
      if (!window.GameState.settings) window.GameState.settings = {};
      Object.assign(window.GameState.settings, this._settings);
    }
  }

  window.SettingsManager = new SettingsManager();
})();
