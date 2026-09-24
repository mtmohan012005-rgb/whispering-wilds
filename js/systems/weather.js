// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DYNAMIC WEATHER SYSTEM
// Sunny, Downpour Rain, Thunderstorm, Mountain Fog, Sunset & River Level Synergy
// ============================================================================

class WeatherSystem {
  constructor() {
    this.types = ['sunny', 'rain', 'storm', 'fog'];
    this.current = {
      type: 'storm', // Starts with the inciting downpour storm outside the Madras High Court!
      intensity: 0.9,
      duration: 120, // seconds
      waterLevelRise: 0.8
    };
    this.timer = 0;
    this.weatherNames = {
      sunny: 'Sunny & Clear (வெயில் & தென்றல்)',
      rain: 'Chennai Downpour (சென்னை அடைமழை)',
      storm: 'Thunderstorm & Gale (இடி மின்னல் புயல்)',
      fog: 'Highland Mountain Mist (மலை மூடுபனி)'
    };
  }

  update(deltaTime, playerX, audio) {
    this.timer += deltaTime;

    // Western Ghats (X > 4000) naturally defaults to mountain fog unless stormy
    if (playerX > 4000 && this.current.type === 'sunny' && Math.random() < 0.01) {
      this.setWeather('fog', 0.85, audio);
    }

    // Weather transition cycle
    if (this.timer > this.current.duration) {
      this.timer = 0;
      const nextIdx = Math.floor(Math.random() * this.types.length);
      const nextType = this.types[nextIdx];
      this.setWeather(nextType, 0.5 + Math.random() * 0.5, audio);
    }

    // Weather-Path Synergy: Rain causes river water levels in Pichavaram to rise
    if (this.current.type === 'storm' || this.current.type === 'rain') {
      this.current.waterLevelRise = Math.min(1.0, this.current.waterLevelRise + 0.05 * deltaTime);
    } else {
      this.current.waterLevelRise = Math.max(0.0, this.current.waterLevelRise - 0.03 * deltaTime);
    }
  }

  setWeather(type, intensity = 1.0, audio = null) {
    this.current.type = type;
    this.current.intensity = intensity;
    this.current.duration = 90 + Math.random() * 120;
    this.timer = 0;

    if (audio) {
      audio.setWeatherAmbience(type, intensity);
    }

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('weatherChange', { detail: this.current }));
  }

  getDisplayName() {
    return this.weatherNames[this.current.type] || 'Unknown';
  }

  getTempDelta(playerX) {
    let delta = 0;
    if (this.current.type === 'storm') delta -= 4;
    if (this.current.type === 'rain') delta -= 2.5;
    if (this.current.type === 'fog') delta -= 5;
    if (this.current.type === 'sunny' && playerX < 2000) delta += 3; // Scorching plains sun
    return delta;
  }

  get currentWeather() {
    return this.current.type;
  }

  get windSpeed() {
    return Math.round(this.current.intensity * 40);
  }
}

window.WeatherSystem = WeatherSystem;
window.Weather = WeatherSystem;
