// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PROCEDURAL AUDIO ENGINE
// Full Web Audio API synthesizer for acoustic music, weather ambience & SFX
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.ambienceGain = null;
    this.sfxGain = null;
    
    // Ambient nodes
    this.rainNode = null;
    this.rainFilter = null;
    this.windNode = null;
    this.windFilter = null;
    this.cricketTimer = null;
    this.fireNode = null;
    
    // Music state
    this.isMusicPlaying = false;
    this.musicTimer = null;
    this.musicScale = [
      164.81, // E3
      196.00, // G3
      220.00, // A3
      246.94, // B3
      293.66, // D4
      329.63, // E4
      392.00, // G4
      440.00, // A4
      493.88, // B4
      587.33  // D5
    ]; // Folk pentatonic / acoustic exploration scale
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
    }

    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (!this.musicGain && this.ctx && this.masterGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (!this.ambienceGain && this.ctx && this.masterGain) {
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);
    }

    if (!this.sfxGain && this.ctx && this.masterGain) {
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (!this.rainSource && this.ctx && this.ambienceGain) {
      this.setupAmbience();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- AMBIENCE GENERATORS ---
  createNoiseBuffer(seconds = 3) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  setupAmbience() {
    const noiseBuffer = this.createNoiseBuffer(4);
    if (!noiseBuffer) return;

    // Rain Node
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = noiseBuffer;
    this.rainSource.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambienceGain);
    this.rainSource.start(0);

    // Wind Node
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.1, this.ctx.currentTime);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambienceGain);
    this.windSource.start(0);

    this.modulateWind();
    this.startCricketLoop();
  }

  modulateWind() {
    if (!this.ctx) return;
    setInterval(() => {
      if (!this.windFilter || !this.windGain) return;
      const targetFreq = 220 + Math.random() * 250;
      const targetGain = 0.08 + Math.random() * 0.15;
      const now = this.ctx.currentTime;
      this.windFilter.frequency.linearRampToValueAtTime(targetFreq, now + 3);
      this.windGain.gain.linearRampToValueAtTime(targetGain, now + 3);
    }, 4000);
  }

  setWeatherAmbience(weatherType, intensity = 1.0) {
    if (!this.ctx || !this.rainGain) return;
    const now = this.ctx.currentTime;
    
    if (weatherType === 'rain' || weatherType === 'storm') {
      const targetGain = (weatherType === 'storm' ? 0.7 : 0.4) * intensity;
      const targetFreq = weatherType === 'storm' ? 2400 : 1200;
      this.rainGain.gain.linearRampToValueAtTime(targetGain, now + 1.5);
      this.rainFilter.frequency.linearRampToValueAtTime(targetFreq, now + 1.5);
      
      if (weatherType === 'storm' && Math.random() < 0.25) {
        this.playThunder();
      }
    } else if (weatherType === 'fog') {
      this.rainGain.gain.linearRampToValueAtTime(0.001, now + 1.5);
      this.windGain.gain.linearRampToValueAtTime(0.25 * intensity, now + 2);
      this.windFilter.frequency.linearRampToValueAtTime(180, now + 2);
    } else {
      this.rainGain.gain.linearRampToValueAtTime(0.001, now + 2);
      this.windGain.gain.linearRampToValueAtTime(0.08, now + 2);
    }
  }

  startCricketLoop() {
    this.cricketTimer = setInterval(() => {
      if (Math.random() < 0.35 && this.isNightTime) {
        this.playCricketChirp();
      }
    }, 1800);
  }

  playCricketChirp() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4600 + (Math.random() * 400 - 200), now);
    
    gain.gain.setValueAtTime(0.001, now);
    for (let i = 0; i < 3; i++) {
      const t = now + (i * 0.06);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.05);
    }

    osc.connect(gain);
    gain.connect(this.ambienceGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playThunder() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 2.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 2.5);
  }

  playPluckedNote(freq, time, duration = 1.6, velocity = 0.3) {
    if (!this.musicGain) this.init();
    if (!this.ctx || this.isMuted || !this.musicGain) return;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4.5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, time + duration);

    noteGain.gain.setValueAtTime(0.001, time);
    noteGain.gain.linearRampToValueAtTime(velocity, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  startExplorationMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const arpeggioPattern = [
      [0, 3, 5, 7],      // E min phrase
      [2, 4, 6, 8],      // A / D folk phrase
      [1, 3, 5, 8],      // G warmth
      [0, 2, 4, 7]       // Twilight reflection
    ];

    let bar = 0;
    const playBar = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const pattern = arpeggioPattern[bar % arpeggioPattern.length];
      
      pattern.forEach((scaleIdx, step) => {
        const noteFreq = this.musicScale[scaleIdx % this.musicScale.length];
        const stepTime = now + (step * 0.55);
        const vel = step === 0 ? 0.28 : 0.16 + Math.random() * 0.06;
        this.playPluckedNote(noteFreq, stepTime, 2.0, vel);
      });

      const rootFreq = this.musicScale[pattern[0]] / 2;
      this.playPluckedNote(rootFreq, now, 2.5, 0.35);

      bar++;
      const nextDelay = (pattern.length * 550) + 1200 + (Math.random() * 1000);
      this.musicTimer = setTimeout(playBar, nextDelay);
    };

    playBar();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playFootstep(surface = 'dirt') {
    if (!this.sfxGain) this.init();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'mud') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if (surface === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.05);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playCameraShutter() {
    if (!this.sfxGain) this.init();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    // Shutter mirror snap
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(950, now);
    clickGain.gain.setValueAtTime(0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // Second curtain click
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1200, t);
      g2.gain.setValueAtTime(0.25, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc2.connect(g2);
      g2.connect(this.sfxGain);
      osc2.start(t);
      osc2.stop(t + 0.04);
    }, 60);

    // Film winder whirr
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc3 = this.ctx.createOscillator();
      const g3 = this.ctx.createGain();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(420, t);
      osc3.frequency.linearRampToValueAtTime(320, t + 0.18);
      g3.gain.setValueAtTime(0.08, t);
      g3.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      osc3.connect(g3);
      g3.connect(this.sfxGain);
      osc3.start(t);
      osc3.stop(t + 0.2);
    }, 130);
  }

  playEnfieldRoar() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Iconic Royal Enfield 350 "Thump-Thump" rhythm
    const thumpCount = 14;
    for (let i = 0; i < thumpCount; i++) {
      const thumpTime = now + (i * 0.11);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, thumpTime);
      osc.frequency.linearRampToValueAtTime(45, thumpTime + 0.07);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, thumpTime);

      const amp = 0.4 * Math.max(0, 1 - (i / thumpCount));
      gain.gain.setValueAtTime(0.001, thumpTime);
      gain.gain.linearRampToValueAtTime(amp, thumpTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, thumpTime + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(thumpTime);
      osc.stop(thumpTime + 0.1);
    }
  }

  playTeaPour() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.linearRampToValueAtTime(2200, now + 0.7);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.8);
  }

  playPageFlip() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.25);
  }

  playPinTap() {
    if (!this.sfxGain) this.init();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playDiscoveryJingle() {
    if (!this.sfxGain) this.init();
    if (!this.ctx || this.isMuted || !this.sfxGain) return;
    const notes = [440, 554.37, 659.25, 880];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + (idx * 0.09);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

window.gameAudio = new SoundEngine();
