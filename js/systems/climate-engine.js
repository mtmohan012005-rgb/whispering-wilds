/**
 * The Whispering Wilds - Real-Time Dynamic Climate & Celestial Engine
 * Computes solar/lunar trajectories mapped to Tamil Nadu's geographic latitudes (8°N to 13°N),
 * 5-phase chronological weather timelapse transitions, heat index, and ground wetness/mud pooling.
 */

class DynamicClimateEngine {
  constructor(game) {
    this.game = game;

    // Temporal Settings
    this.timeScale = 12.0; // 1 second real-time = 12 seconds game-time (1 day = ~2 hours or accelerated for gameplay)
    this.currentTimeInHours = 6.0; // Starts at 06:00 AM (Dawn)

    // Environmental Parameters
    this.currentPhase = "DAWN_MIST";
    this.phaseLabel = "Dawn Mist & Cool Breeze (காலை பனி)";
    this.groundWetness = 0.15; // 0.0 (bone dry) to 1.0 (waterlogged mud)
    this.heatIndex = 25.5; // Celsius ambient temperature
    this.sunElevation = 0.0;
    this.sunAzimuth = 0.0;
    this.solarLightColor = { r: 1.0, g: 0.9, b: 0.7 };
    this.skyColor = "#1a2436";
    this.lightningActive = false;
    this.lightningTimer = 0;

    // Atmospheric Constants (Tamil Nadu coastal & inland latitudes ~8°N - 13°N)
    this.latitudeRad = (11.0 * Math.PI) / 180.0;
  }

  tick(deltaTime) {
    // Advance chronological time
    const deltaHours = (deltaTime * this.timeScale) / 3600.0;
    this.currentTimeInHours = (this.currentTimeInHours + deltaHours) % 24.0;

    // Calculate celestial arc
    this.updateSunPosition(this.currentTimeInHours);

    // Evaluate 5 chronological climate states
    this.updateWeatherState(this.currentTimeInHours, deltaTime);

    // Apply physiochemical survival impact
    this.applySurvivalImpact(deltaTime);

    // Sync with Three.js rendering if available
    this.syncLightingAndAtmosphere();
  }

  updateSunPosition(hour) {
    // Celestial trajectory: 6.0 = 0 rad (Sunrise), 12.0 = PI/2 (Zenith), 18.0 = PI (Sunset)
    const solarHourAngle = ((hour - 6.0) / 12.0) * Math.PI;
    this.sunElevation = Math.sin(solarHourAngle);
    this.sunAzimuth = solarHourAngle;

    // Compute dynamic Rayleigh & Mie scattering light colors
    if (this.sunElevation > 0) {
      // Daytime
      if (this.sunElevation < 0.25) {
        // Dawn / Golden hour deep amber
        this.solarLightColor = { r: 1.0, g: 0.72, b: 0.42 };
      } else if (this.sunElevation < 0.7) {
        // Morning / Afternoon warm daylight
        this.solarLightColor = { r: 1.0, g: 0.92, b: 0.78 };
      } else {
        // High noon white-gold scorching light
        this.solarLightColor = { r: 1.0, g: 0.98, b: 0.92 };
      }
    } else {
      // Nighttime lunar illumination (Cool indigo-blue)
      this.solarLightColor = { r: 0.22, g: 0.32, b: 0.55 };
    }
  }

  updateWeatherState(hour, deltaTime) {
    const prevPhase = this.currentPhase;

    if (hour >= 5.5 && hour < 8.0) {
      // 1. Dawn Mist & Cool Breeze (05:30 AM - 08:00 AM)
      this.currentPhase = "DAWN_MIST";
      this.phaseLabel = "Dawn Mist & Cool Breeze (காலை பனி)";
      this.heatIndex = 24.0;
      this.groundWetness = Math.max(0.1, this.groundWetness - 0.005 * deltaTime);
      this.skyColor = "#2b3447";
    } else if (hour >= 8.0 && hour < 16.0) {
      // 2. Scorching Tropical Heat (08:00 AM - 04:00 PM)
      this.currentPhase = "SCORCHING_HEAT";
      this.phaseLabel = "Scorching Tropical Heat (கடும் வெயில்)";
      // Peak heat at noon ~38.5°C
      const heatPeakFactor = Math.sin(((hour - 8.0) / 8.0) * Math.PI);
      this.heatIndex = 30.0 + heatPeakFactor * 8.5; // up to 38.5°C
      this.groundWetness = Math.max(0.0, this.groundWetness - 0.015 * deltaTime);
      this.skyColor = "#1a3556";
    } else if (hour >= 16.0 && hour < 18.5) {
      // 3. Golden Hour & Wind Shift (04:00 PM - 06:30 PM)
      this.currentPhase = "GOLDEN_HOUR";
      this.phaseLabel = "Golden Hour & Wind Shift (மாலை தென்றல்)";
      this.heatIndex = 28.5;
      this.skyColor = "#4a2c20";
    } else if (hour >= 18.5 && hour < 22.0) {
      // 4. Coastal Thunderstorm & Gale (06:30 PM - 10:00 PM)
      this.currentPhase = "MONSOON_THUNDERSTORM";
      this.phaseLabel = "Coastal Thunderstorm & Gale (திடீர் இடி மின்னல் புயல்)";
      this.heatIndex = 23.5;
      this.groundWetness = Math.min(1.0, this.groundWetness + 0.04 * deltaTime);
      this.skyColor = "#080c14";

      // Spontaneous lightning trigger
      if (Math.random() < 0.015) {
        this.triggerLightning();
      }
    } else {
      // 5. Cold Night Dampness & Clearing Skies (10:00 PM - 05:30 AM)
      this.currentPhase = "NIGHT_DAMP";
      this.phaseLabel = "Cold Night Dampness (இரவு பனி அமைதி)";
      this.heatIndex = 21.0;
      this.skyColor = "#06090f";
    }

    // Notify HUD if phase changed
    if (prevPhase !== this.currentPhase && this.game) {
      this.updateWeatherHUD();
    }
  }

  triggerLightning() {
    this.lightningActive = true;
    this.lightningTimer = 0.2; // 200ms flash

    if (this.game && this.game.audioEngine) {
      this.game.audioEngine.playSfx('thunder');
    }
  }

  applySurvivalImpact(deltaTime) {
    if (!this.game || !this.game.survival) return;

    const survival = this.game.survival;

    // Scorching heat accelerates thirst depletion by 40% unless protected by Veshti
    if (this.currentPhase === "SCORCHING_HEAT") {
      let thirstMultiplier = 1.4;
      if (this.game.tradeSystem && this.game.tradeSystem.playerState.equipped === "cloth_veshti") {
        thirstMultiplier = 0.95; // Veshti provides heat & thirst mitigation
      }
      survival.thirstDrainModifier = thirstMultiplier;
    } else if (this.currentPhase === "MONSOON_THUNDERSTORM") {
      // Rain replenishes moisture slightly if outside, but lowers core temp
      survival.tempModifier = -0.4;
    } else if (this.currentPhase === "NIGHT_DAMP") {
      // Cold night drops core temp without woolen cloaks or campfire
      if (this.game.tradeSystem && this.game.tradeSystem.playerState.equipped === "cloth_woolen") {
        survival.tempModifier = 0.2; // Woolen preserves body warmth
      } else {
        survival.tempModifier = -0.3;
      }
    }
  }

  syncLightingAndAtmosphere() {
    // Sync with 3D ThreeWorld lighting if present
    if (this.game && this.game.threeWorld && this.game.threeWorld.lighting) {
      const lights = this.game.threeWorld.lighting;
      if (lights.dirLight) {
        const rad = this.sunAzimuth;
        lights.dirLight.position.set(
          Math.cos(rad) * 40,
          Math.max(5, this.sunElevation * 60),
          Math.sin(rad) * 40
        );
        lights.dirLight.color.setRGB(
          this.solarLightColor.r,
          this.solarLightColor.g,
          this.solarLightColor.b
        );
      }
      if (lights.ambientLight) {
        if (this.sunElevation > 0) {
          lights.ambientLight.intensity = 0.4 + this.sunElevation * 0.4;
        } else {
          lights.ambientLight.intensity = 0.18; // Night ambient
        }
      }
    }

    // Sync with 2D lighting engine if present
    if (this.game && this.game.lightingEngine) {
      if (this.sunElevation > 0) {
        this.game.lightingEngine.ambientDarkness = Math.max(0.1, 0.85 - this.sunElevation * 0.75);
      } else {
        this.game.lightingEngine.ambientDarkness = 0.92;
      }
    }
  }

  updateWeatherHUD() {
    const weatherBadge = document.getElementById('weather-badge');
    if (weatherBadge) {
      weatherBadge.innerText = this.phaseLabel;
    }

    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
      const hours = Math.floor(this.currentTimeInHours);
      const minutes = Math.floor((this.currentTimeInHours - hours) * 60);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const formattedMin = minutes < 10 ? `0${minutes}` : minutes;
      timeDisplay.innerText = `${displayHours}:${formattedMin} ${ampm}`;
    }
  }

  getTimeFormatted() {
    const hours = Math.floor(this.currentTimeInHours);
    const minutes = Math.floor((this.currentTimeInHours - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMin = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${formattedMin} ${ampm}`;
  }
}

// Expose globally
window.DynamicClimateEngine = DynamicClimateEngine;
