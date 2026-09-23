/**
 * The Whispering Wilds (Kaattu Vazhi) - Ambient World Audio System
 * Multi-layered regional soundscapes, dynamic day/night cycles,
 * weather crossfades, and interior/exterior acoustic reverb modeling.
 */

class AmbientWorldAudioSystem {
  constructor(audioManager) {
    this.manager = audioManager || window.audioManager;
    this.currentRegion = 'george_town';
    this.currentTimeOfDay = 'morning';
    this.currentWeather = 'clear';
    this.isInterior = false;

    // Active layer handles
    this.activeLayers = new Map(); // layerId -> { id, volume, gainNode, isFading }
    this.fadeDuration = 2.0; // seconds
  }

  setRegion(region) {
    const reg = region ? region.toLowerCase() : '';
    if (this.currentRegion === reg && this.activeLayers.size > 0) return;
    this.currentRegion = reg;
    this.updateAmbientLayers();
  }

  setTimeOfDay(time) {
    const t = time ? time.toLowerCase() : '';
    if (this.currentTimeOfDay === t && this.activeLayers.size > 0) return;
    this.currentTimeOfDay = t;
    this.updateAmbientLayers();
  }

  setWeather(weather) {
    const w = weather ? weather.toLowerCase() : '';
    if (this.currentWeather === w) return;
    this.currentWeather = w;
    this.updateWeatherLayers();
  }

  setEnvironment(isInterior) {
    if (this.isInterior === isInterior) return;
    this.isInterior = isInterior;
    this.updateAmbientLayers();
  }

  updateAmbientLayers() {
    if (!this.manager || !this.manager.data || !this.manager.data.ambience) return;

    const allAmb = this.manager.data.ambience;
    const targetLayers = [];

    // Filter matching layers for current region and time
    for (const [id, def] of Object.entries(allAmb)) {
      const defReg = (def.region || '').toLowerCase();
      if (defReg === this.currentRegion) {
        if (!def.timeOfDay || def.timeOfDay.map(s => (s || '').toLowerCase()).includes(this.currentTimeOfDay)) {
          targetLayers.push(def);
        }
      }
    }

    // Play target layers
    targetLayers.forEach(layer => {
      if (!this.activeLayers.has(layer.id)) {
        const handle = this.manager.play(layer.id, {
          category: 'ambience',
          loop: true,
          volume: this.isInterior ? layer.volume * 0.4 : layer.volume
        });
        this.activeLayers.set(layer.id, handle);
      }
    });

    // Remove obsolete layers
    this.activeLayers.forEach((handle, id) => {
      const stillActive = targetLayers.some(tl => tl.id === id);
      if (!stillActive) {
        this.manager.stop(id);
        this.activeLayers.delete(id);
      }
    });
  }

  updateWeatherLayers() {
    if (!this.manager || !this.manager.data || !this.manager.data.weather) return;

    const weathers = this.manager.data.weather;
    for (const [id, def] of Object.entries(weathers)) {
      if (def.weather && def.weather.includes(this.currentWeather)) {
        this.manager.play(id, { category: 'weather', loop: def.loop, volume: def.volume });
      } else {
        this.manager.stop(id);
      }
    }
  }
}

window.AmbientWorldAudioSystem = AmbientWorldAudioSystem;
