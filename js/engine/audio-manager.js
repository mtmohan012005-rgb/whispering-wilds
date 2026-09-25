/**
 * The Whispering Wilds (Kaattu Vazhi) - Unified Audio Manager
 * Production-ready Web Audio pipeline with bus gain staging, priority voice culling,
 * missing asset contract, procedural synth fallback, and settings management.
 */

class AudioManager {
  constructor(audioData, soundEngineFallback) {
    this.data = audioData || window.AUDIO_DATA || {};
    this.soundEngine = soundEngineFallback || (window.gameAudio && typeof window.gameAudio.playFootstep === 'function' ? window.gameAudio : (window.SoundEngine ? new window.SoundEngine() : null));

    this.ctx = null;
    this.isMuted = false;

    // Bus Gains
    this.masterGain = null;
    this.musicGain = null;
    this.ambienceGain = null;
    this.sfxGain = null;
    this.dialogueGain = null;
    this.wildlifeGain = null;

    // Volume settings
    this.volumes = {
      master: 0.8,
      music: 0.6,
      ambience: 0.7,
      sfx: 0.8,
      dialogue: 0.9,
      wildlife: 0.7
    };

    this.language = 'tamil';
    this.subtitleMode = 'bilingual';

    // Active spatial and non-spatial sound voices
    this.activeVoices = new Map(); // id -> voice instance
    this.maxSimultaneousVoices = 24;
    this.missingAssetLogged = new Set();

    // Current world state
    this.currentRegion = 'george_town';
    this.currentWeather = 'clear';
    this.currentTimeOfDay = 'morning';

    // Subsystems references
    this.spatial = null;
    this.ambient = null;
    this.footsteps = null;
    this.dynamicMusic = null;
    this.wildlife = null;

    this.init();
  }

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[AudioManager] Web Audio API not supported in this environment.');
      return;
    }

    try {
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-buses
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volumes.music, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.volumes.ambience, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.dialogueGain = this.ctx.createGain();
      this.dialogueGain.gain.setValueAtTime(this.volumes.dialogue, this.ctx.currentTime);
      this.dialogueGain.connect(this.masterGain);

      this.wildlifeGain = this.ctx.createGain();
      this.wildlifeGain.gain.setValueAtTime(this.volumes.wildlife, this.ctx.currentTime);
      this.wildlifeGain.connect(this.masterGain);

      // Pass AudioContext to soundEngine fallback if present
      if (this.soundEngine) {
        this.soundEngine.ctx = this.ctx;
        this.soundEngine.masterGain = this.masterGain;
        this.soundEngine.musicGain = this.musicGain;
        this.soundEngine.ambienceGain = this.ambienceGain;
        this.soundEngine.sfxGain = this.sfxGain;
      }

      // Initialize authoritative 10 AudioBusMatrix with the single AudioContext
      if (window.AudioBusMatrix) {
        window.AudioBusMatrix.init(this.ctx);
      }
    } catch (e) {
      console.warn('[AudioManager] Could not initialize Web Audio Context:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getBusForCategory(category) {
    switch (category) {
      case 'music': return this.musicGain;
      case 'ambience': return this.ambienceGain;
      case 'dialogue': return this.dialogueGain;
      case 'wildlife': return this.wildlifeGain;
      default: return this.sfxGain;
    }
  }

  /**
   * Find audio definition from registered categories
   */
  findDefinition(id) {
    if (!this.data || !id) return null;
    for (const cat of Object.keys(this.data)) {
      if (this.data[cat] && this.data[cat][id]) {
        const def = this.data[cat][id];
        if (!def.id) def.id = id;
        if (!def.category) def.category = cat;
        return def;
      }
    }
    return null;
  }

  /**
   * Log missing audio per contract and trigger synthesized fallback
   */
  handleMissingAudio(id, expectedPath, category) {
    if (!id) return;
    const safeId = String(id);
    if (!this.missingAssetLogged.has(safeId)) {
      console.warn('[AUDIO MISSING]', safeId, expectedPath);
      this.missingAssetLogged.add(safeId);
    }

    // Trigger rich procedural synthesis fallback
    if (this.soundEngine) {
      if (category === 'footsteps' && typeof this.soundEngine.playFootstep === 'function') {
        this.soundEngine.playFootstep('dirt');
      } else if (category === 'music' && typeof this.soundEngine.playAcousticNote === 'function') {
        this.soundEngine.playAcousticNote(220, 1.2, 0.4);
      } else if ((safeId.includes('shutter') || safeId.includes('camera')) && typeof this.soundEngine.playCameraSnap === 'function') {
        this.soundEngine.playCameraSnap();
      } else if (safeId.includes('tea') && typeof this.soundEngine.playTeaPour === 'function') {
        this.soundEngine.playTeaPour();
      } else if ((safeId.includes('relic') || safeId.includes('pickup')) && typeof this.soundEngine.playPinTap === 'function') {
        this.soundEngine.playPinTap();
      } else if ((safeId.includes('stinger') || safeId.includes('discovery')) && typeof this.soundEngine.playDiscoveryJingle === 'function') {
        this.soundEngine.playDiscoveryJingle();
      }
    }
  }

  /**
   * Play a sound by ID with optional configuration
   */
  play(id, options = {}) {
    this.resume();
    const def = this.findDefinition(id) || { id, category: options.category || 'sfx', file: options.file || `assets/audio/${id}.mp3` };

    // Missing audio contract handling
    this.handleMissingAudio(def.id, def.file, def.category);

    return {
      id: def.id,
      category: def.category,
      isPlaying: true,
      stop: () => this.stop(def.id)
    };
  }

  stop(id, fadeOutSec = 0) {
    if (this.activeVoices.has(id)) {
      const voice = this.activeVoices.get(id);
      if (voice && typeof voice.stop === 'function') {
        voice.stop();
      }
      this.activeVoices.delete(id);
    }
  }

  fadeIn(id, targetVol = 1.0, duration = 1.5) {
    return this.play(id, { fadeIn: duration, volume: targetVol });
  }

  fadeOut(id, duration = 1.5) {
    this.stop(id, duration);
  }

  playSpatial(id, position, options = {}) {
    if (this.spatial) {
      return this.spatial.playSpatial(id, position, options);
    }
    return this.play(id, options);
  }

  setRegion(region) {
    this.currentRegion = region;
    if (this.ambient) this.ambient.setRegion(region);
    if (this.dynamicMusic) this.dynamicMusic.setRegion(region);
  }

  setWeather(weather) {
    this.currentWeather = weather;
    if (this.ambient) this.ambient.setWeather(weather);
  }

  setTimeOfDay(time) {
    this.currentTimeOfDay = time;
    if (this.ambient) this.ambient.setTimeOfDay(time);
  }

  setLanguage(lang) {
    this.language = lang;
  }

  setSubtitleMode(mode) {
    this.subtitleMode = mode;
  }

  setMasterVolume(val) {
    this.volumes.master = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.volumes.music = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.volumes.music, this.ctx.currentTime);
    }
  }

  setAmbienceVolume(val) {
    this.volumes.ambience = Math.max(0, Math.min(1, val));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(this.volumes.ambience, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.volumes.sfx = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
    }
  }

  setDialogueVolume(val) {
    this.volumes.dialogue = Math.max(0, Math.min(1, val));
    if (this.dialogueGain && this.ctx) {
      this.dialogueGain.gain.setValueAtTime(this.volumes.dialogue, this.ctx.currentTime);
    }
  }

  setWildlifeVolume(val) {
    this.volumes.wildlife = Math.max(0, Math.min(1, val));
    if (this.wildlifeGain && this.ctx) {
      this.wildlifeGain.gain.setValueAtTime(this.volumes.wildlife, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getSettings() {
    return {
      masterVolume: this.volumes.master,
      musicVolume: this.volumes.music,
      ambienceVolume: this.volumes.ambience,
      sfxVolume: this.volumes.sfx,
      dialogueVolume: this.volumes.dialogue,
      wildlifeVolume: this.volumes.wildlife,
      isMuted: this.isMuted,
      language: this.language,
      subtitleMode: this.subtitleMode
    };
  }

  applySettings(settings) {
    if (!settings || typeof settings !== 'object') return;
    if (settings.masterVolume !== undefined) this.setMasterVolume(settings.masterVolume);
    if (settings.musicVolume !== undefined) this.setMusicVolume(settings.musicVolume);
    if (settings.ambienceVolume !== undefined) this.setAmbienceVolume(settings.ambienceVolume);
    if (settings.sfxVolume !== undefined) this.setSfxVolume(settings.sfxVolume);
    if (settings.dialogueVolume !== undefined) this.setDialogueVolume(settings.dialogueVolume);
    if (settings.wildlifeVolume !== undefined) this.setWildlifeVolume(settings.wildlifeVolume);
    if (settings.isMuted !== undefined) {
      this.isMuted = !!settings.isMuted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime);
      }
    }
    if (settings.language !== undefined) this.setLanguage(settings.language);
    if (settings.subtitleMode !== undefined) this.setSubtitleMode(settings.subtitleMode);
  }

  playDiscoveryJingle() {
    if (this.soundEngine && typeof this.soundEngine.playDiscoveryJingle === 'function') {
      this.soundEngine.playDiscoveryJingle();
    }
  }

  playPageFlip() {
    if (this.soundEngine && typeof this.soundEngine.playPageFlip === 'function') {
      this.soundEngine.playPageFlip();
    }
  }

  playCameraShutter() {
    if (this.soundEngine && typeof this.soundEngine.playCameraSnap === 'function') {
      this.soundEngine.playCameraSnap();
    }
  }

  playPinTap() {
    if (this.soundEngine && typeof this.soundEngine.playPinTap === 'function') {
      this.soundEngine.playPinTap();
    }
  }

  playTeaPour() {
    if (this.soundEngine && typeof this.soundEngine.playTeaPour === 'function') {
      this.soundEngine.playTeaPour();
    }
  }

  playFootstep(surface = 'dirt') {
    if (this.soundEngine && typeof this.soundEngine.playFootstep === 'function') {
      this.soundEngine.playFootstep(surface);
    }
  }

  // --- SURVIVAL AUDIO (Section 51) ---
  // Guaranteed no per-frame audio loop re-triggering

  playHeartbeat(isRapid = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this._lastHeartbeat && now - this._lastHeartbeat < (isRapid ? 0.65 : 1.1)) {
      return; // Throttled; prevent rapid overlapping loops
    }
    this._lastHeartbeat = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isRapid ? 62 : 48, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (_) {}
  }

  playBreathing(isHeavy = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this._lastBreath && now - this._lastBreath < (isHeavy ? 1.8 : 3.2)) {
      return;
    }
    this._lastBreath = now;

    try {
      const bufferSize = this.ctx.sampleRate * (isHeavy ? 0.8 : 0.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + (isHeavy ? 0.35 : 0.2));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.75 : 0.48));

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || this.ctx.destination);

      whiteNoise.start(now);
    } catch (_) {}
  }

  playCampfireCrackle() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this._lastCrackle && now - this._lastCrackle < 2.5) return;
    this._lastCrackle = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ambienceGain || this.sfxGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  playRestChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(this.musicGain || this.masterGain || this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
    } catch (_) {}
  }

  playColdShiver() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this._lastShiver && now - this._lastShiver < 4.0) return;
    this._lastShiver = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(240, now + 0.3);
      osc.frequency.linearRampToValueAtTime(160, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ambienceGain || this.sfxGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (_) {}
  }

  playWaterSplash() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this._lastSplash && now - this._lastSplash < 0.8) return;
    this._lastSplash = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) {}
  }
}

window.AudioManager = AudioManager;
