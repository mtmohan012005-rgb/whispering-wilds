// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WEATHER AUDIO SYSTEM
// Atmospheric precipitation and wind simulation:
// light rain, heavy monsoon, roof/canopy impacts, authored thunder, and wind.
// ============================================================================

(function () {
  'use strict';

  class WeatherAudioSystem {
    constructor() {
      this.currentWeather = 'clear';
      this.currentEnvironment = 'open_field';
      this.currentSurface = 'roof';
      this.rainIntensity = 0.0;
      this.windIntensity = 0.0;
      this.thunderTimer = null;
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      console.log('[WeatherAudioSystem] Initialized dynamic weather acoustics on WEATHER bus.');
      return this;
    }

    setWeatherState(state, intensity = 1.0) {
      this.currentWeather = (state || 'clear').toLowerCase();
      this.rainIntensity = Math.max(0.0, Math.min(1.0, Number(intensity) || 0.0));

      if (this.currentWeather === 'clear') {
        this.rainIntensity = 0.0;
        this.windIntensity = 0.0;
        this._stopPrecipitationAudio();
        this._stopWindAudio();
      } else if (this.currentWeather === 'monsoon' || this.currentWeather === 'storm') {
        this.rainIntensity = 1.0;
        this.windIntensity = 0.9;
        this._startPrecipitationAudio(this.currentWeather, 1.0);
        this._startWindAudio(0.9);
      } else {
        this.windIntensity = 0.4 * this.rainIntensity;
        this._startPrecipitationAudio(this.currentWeather, this.rainIntensity);
        this._startWindAudio(this.windIntensity);
      }
    }

    setWeather(weatherType, intensity = 1.0) {
      this.setWeatherState(weatherType, intensity);
    }

    setEnvironmentSurface(surf) {
      this.currentSurface = (surf || 'roof').toLowerCase();
      this.currentEnvironment = this.currentSurface;
      if (this.rainIntensity > 0) {
        this._startPrecipitationAudio(this.currentWeather, this.rainIntensity);
      }
    }

    setEnvironment(env) {
      this.setEnvironmentSurface(env);
    }

    getActiveRainAsset() {
      const isHeavy = this.rainIntensity > 0.7;
      return isHeavy
        ? `sfx_weather_heavy_rain_${this.currentSurface}`
        : `sfx_weather_light_rain_${this.currentSurface}`;
    }

    triggerThunder(force = false) {
      this._playThunderClap();

      // Dispatch accessible sound cue
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ambient:soundcue', {
          detail: {
            cueTa: 'இடி முழக்கம்',
            cueEn: 'Thunderclap',
            duration: 2500
          }
        }));
      }

      return { triggered: true };
    }

    _startPrecipitationAudio(type, intensity) {
      const soundId = this.getActiveRainAsset();
      if (window.audioManager) {
        window.audioManager.play(soundId, {
          category: 'weather',
          busName: 'WEATHER',
          loop: true,
          volume: Math.min(1.0, 0.8 * intensity)
        });
      }
    }

    _stopPrecipitationAudio() {
      if (this.thunderTimer) clearTimeout(this.thunderTimer);
      if (window.audioManager) {
        window.audioManager.stop(this.getActiveRainAsset(), 1.0);
      }
    }

    _startWindAudio(intensity) {
      if (window.audioManager) {
        window.audioManager.play('sfx_weather_wind_gusts', {
          category: 'weather',
          busName: 'WEATHER',
          loop: true,
          volume: Math.min(0.7, 0.5 * intensity)
        });
      }
    }

    _stopWindAudio() {
      if (window.audioManager) {
        window.audioManager.stop('sfx_weather_wind_gusts', 1.5);
      }
    }

    _playThunderClap() {
      if (window.audioManager) {
        window.audioManager.play('sfx_weather_thunder_crack', {
          category: 'weather',
          busName: 'WEATHER',
          volume: 0.95
        });
      }
    }
  }

  const instance = new WeatherAudioSystem();
  WeatherAudioSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(WeatherAudioSystem.prototype)) {
    if (prop !== 'constructor' && typeof WeatherAudioSystem.prototype[prop] === 'function') {
      WeatherAudioSystem[prop] = function (...args) {
        return WeatherAudioSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(WeatherAudioSystem, {
    currentWeather: {
      get() { return WeatherAudioSystem._instance.currentWeather; },
      set(v) { WeatherAudioSystem._instance.currentWeather = v; }
    },
    rainIntensity: {
      get() { return WeatherAudioSystem._instance.rainIntensity; },
      set(v) { WeatherAudioSystem._instance.rainIntensity = v; }
    },
    windIntensity: {
      get() { return WeatherAudioSystem._instance.windIntensity; },
      set(v) { WeatherAudioSystem._instance.windIntensity = v; }
    },
    currentSurface: {
      get() { return WeatherAudioSystem._instance.currentSurface; },
      set(v) { WeatherAudioSystem._instance.currentSurface = v; }
    }
  });

  if (typeof window !== 'undefined') {
    window.WeatherAudioSystem = WeatherAudioSystem;
    window.weatherAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeatherAudioSystem, instance };
  }
})();
