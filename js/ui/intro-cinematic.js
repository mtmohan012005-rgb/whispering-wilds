/**
 * The Whispering Wilds (Kaattu Vazhi) - Cinematic Intro & Logo Sequence
 * Orchestrates an immersive pre-game sequence featuring:
 *  - Atmospheric thunder roll, soft rain, and an epic Tamil Nadu instrumental sting (via Web Audio API)
 *  - Custom animated logo presentation with glowing atmospheric aura
 *  - Particle-driven lightning and mist effects
 *  - Skip option for returning players with localStorage remembrance
 */

(function () {
  'use strict';

  class IntroCinematic {
    constructor() {
      this.container = null;
      this.canvas = null;
      this.ctx = null;
      this.animId = null;
      this.particles = [];
      this.isPlaying = false;
      this.audioCtx = null;
      this.masterGain = null;
      this.onCompleteCallback = null;
      this.sequenceTimers = [];
      this.lightningFlash = 0;
      this.seenKey = 'ww_intro_cinematic_seen';
    }

    /**
     * Check if player has already experienced the intro cinematic
     */
    hasSeen() {
      try {
        return localStorage.getItem(this.seenKey) === 'true';
      } catch (_) {
        return false;
      }
    }

    markAsSeen() {
      try {
        localStorage.setItem(this.seenKey, 'true');
      } catch (_) {}
    }

    /**
     * Start the cinematic intro sequence
     * @param {Function} onComplete - Callback executed when intro finishes or is skipped
     * @param {boolean} force - If false and already seen, auto-allows skip or direct play
     */
    play(onComplete, force = false) {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.onCompleteCallback = onComplete;

      this._buildDOM();
      this._initParticles();
      this._bindInput();
      this._startAudioScape();
      this._runSequence();
    }

    /**
     * Build the DOM overlay and inject into document body
     */
    _buildDOM() {
      if (document.getElementById('ww-intro-cinematic')) {
        this.container = document.getElementById('ww-intro-cinematic');
        this.container.classList.remove('fade-out');
        this.container.style.display = 'flex';
      } else {
        const root = document.createElement('div');
        root.id = 'ww-intro-cinematic';
        root.innerHTML = `
          <canvas id="ww-intro-canvas"></canvas>
          <div class="ww-intro-mist"></div>
          <div class="ww-intro-letterbox top"></div>
          <div class="ww-intro-letterbox bottom"></div>

          <div class="ww-intro-content">
            <div class="ww-intro-logo-wrap" id="ww-intro-logo-wrap">
              <div class="ww-intro-logo-aura"></div>
              <img src="assets/ui/logo/whispering-wilds-logo.png" alt="The Whispering Wilds Logo" class="ww-intro-logo-img" id="ww-intro-logo-img">
            </div>

            <div class="ww-intro-tamil-title" id="ww-intro-tamil-title">காட்டு வழி • தடம்</div>
            <h1 class="ww-intro-main-title" id="ww-intro-main-title">The Whispering Wilds</h1>
            <div class="ww-intro-tagline" id="ww-intro-tagline">An Open-World Narrative Exploration of Tamil Nadu</div>
          </div>

          <div class="ww-intro-controls">
            <span class="ww-intro-audio-hint" id="ww-intro-audio-hint">Click anywhere for audio</span>
            <button class="ww-intro-skip-btn" id="ww-intro-skip-btn" aria-label="Skip Intro">
              <span>SKIP</span>
              <kbd>ESC</kbd>
            </button>
          </div>
        `;

        document.body.appendChild(root);
        this.container = root;
      }

      this.canvas = document.getElementById('ww-intro-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this._resizeCanvas();
        window.addEventListener('resize', this._onResizeBound = () => this._resizeCanvas());
      }
    }

    _resizeCanvas() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    /**
     * Synthesize cinematic soundscape using Web Audio API:
     * - Deep low-frequency thunder rumble
     * - Organic rain texture
     * - Authentic Carnatic Tamil flute/veena instrumental sting
     */
    _startAudioScape() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        this.audioCtx = new AudioContext();
        if (this.audioCtx.state === 'suspended') {
          // If browser policy suspends audio until gesture, unlock on first click/key
          const resumeAudio = () => {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
              this.audioCtx.resume();
            }
            const hint = document.getElementById('ww-intro-audio-hint');
            if (hint) hint.style.opacity = '0';
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
          };
          window.addEventListener('click', resumeAudio);
          window.addEventListener('keydown', resumeAudio);
        } else {
          const hint = document.getElementById('ww-intro-audio-hint');
          if (hint) hint.style.display = 'none';
        }

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.85, this.audioCtx.currentTime + 1.2);
        this.masterGain.connect(this.audioCtx.destination);

        // 1. Rain noise generator
        this._synthesizeRain();

        // 2. Initial distant thunder roll
        this._triggerThunder(0.8);

        // 3. Second closer thunder roll at 2.4s
        const tTimer = setTimeout(() => {
          this._triggerThunder(1.2);
          this.lightningFlash = 1.0;
        }, 2400);
        this.sequenceTimers.push(tTimer);

        // 4. Tamil Nadu Instrumental Sting at logo peak (2.8s)
        const sTimer = setTimeout(() => {
          this._synthesizeTamilSting();
        }, 2800);
        this.sequenceTimers.push(sTimer);

      } catch (err) {
        console.warn('[IntroCinematic] Web Audio initialization deferred:', err.message);
      }
    }

    _synthesizeRain() {
      if (!this.audioCtx || !this.masterGain) return;
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter to simulate gentle rain texture
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      filter.Q.setValueAtTime(1.2, this.audioCtx.currentTime);

      const rainGain = this.audioCtx.createGain();
      rainGain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(this.masterGain);

      whiteNoise.start(0);
      this.rainSource = whiteNoise;
    }

    _triggerThunder(intensity = 1.0) {
      if (!this.audioCtx || !this.masterGain) return;
      const now = this.audioCtx.currentTime;

      // Low rumble oscillator with lowpass sweep
      const osc = this.audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.8);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.frequency.exponentialRampToValueAtTime(45, now + 2.0);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.7 * intensity, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.4);
    }

    /**
     * Synthesize authentic Tamil Nadu melodic sting (Carnatic Mayamalavagowla phrase):
     * C4 (Sa), D#4 (Ri), E4 (Ga), G4 (Pa), G#4 (Dha), C5 (Tara Sa)
     */
    _synthesizeTamilSting() {
      if (!this.audioCtx || !this.masterGain) return;
      const now = this.audioCtx.currentTime;
      const notes = [
        { freq: 261.63, time: 0.0, dur: 0.65 }, // Sa (C4)
        { freq: 277.18, time: 0.35, dur: 0.60 }, // Suddha Ri (C#4)
        { freq: 329.63, time: 0.70, dur: 0.75 }, // Antara Ga (E4)
        { freq: 392.00, time: 1.15, dur: 0.90 }, // Pa (G4)
        { freq: 415.30, time: 1.65, dur: 0.85 }, // Suddha Dha (G#4)
        { freq: 523.25, time: 2.15, dur: 2.40 }  // Tara Sa (C5 with resonant fade)
      ];

      notes.forEach((n) => {
        const osc = this.audioCtx.createOscillator();
        const subOsc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        // Flute / Veena harmonic blend
        osc.type = 'sine';
        subOsc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);
        subOsc.frequency.setValueAtTime(n.freq * 2, now + n.time);

        const startTime = now + n.time;
        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.linearRampToValueAtTime(0.28, startTime + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + n.dur);

        osc.connect(noteGain);
        subOsc.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(startTime);
        subOsc.start(startTime);
        osc.stop(startTime + n.dur + 0.1);
        subOsc.stop(startTime + n.dur + 0.1);
      });
    }

    /**
     * Particle simulation for rain, lightning flash, and ambient embers
     */
    _initParticles() {
      this.particles = [];
      const count = 120;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          speedY: 4 + Math.random() * 8,
          speedX: -1 + Math.random() * 2,
          length: 12 + Math.random() * 18,
          alpha: 0.2 + Math.random() * 0.5,
          isEmber: Math.random() > 0.85
        });
      }

      const loop = () => {
        if (!this.isPlaying) return;
        this._updateParticles();
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    _updateParticles() {
      if (!this.ctx || !this.canvas) return;
      const w = this.canvas.width;
      const h = this.canvas.height;

      this.ctx.clearRect(0, 0, w, h);

      // Render lightning flash if active
      if (this.lightningFlash > 0.01) {
        this.ctx.fillStyle = `rgba(220, 240, 255, ${this.lightningFlash * 0.35})`;
        this.ctx.fillRect(0, 0, w, h);
        this.lightningFlash *= 0.88;
      }

      // Draw particles
      for (const p of this.particles) {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > h) {
          p.y = -20;
          p.x = Math.random() * w;
        }

        if (p.isEmber) {
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(226, 201, 126, ${p.alpha * 0.75})`;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = '#e2c97e';
          this.ctx.fill();
        } else {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
          this.ctx.strokeStyle = `rgba(160, 195, 225, ${p.alpha * 0.5})`;
          this.ctx.lineWidth = 1.2;
          this.ctx.shadowBlur = 0;
          this.ctx.stroke();
        }
      }
    }

    /**
     * Choreograph intro timings
     */
    _runSequence() {
      const logoWrap = document.getElementById('ww-intro-logo-wrap');
      const tamilTitle = document.getElementById('ww-intro-tamil-title');
      const mainTitle = document.getElementById('ww-intro-main-title');
      const tagline = document.getElementById('ww-intro-tagline');

      // 1. Logo reveals with thunder and lightning (2.2s)
      this.sequenceTimers.push(setTimeout(() => {
        if (logoWrap) logoWrap.classList.add('active');
      }, 2200));

      // 2. Tamil typography appears (3.8s)
      this.sequenceTimers.push(setTimeout(() => {
        if (tamilTitle) tamilTitle.classList.add('active');
      }, 3800));

      // 3. Main title illuminates with golden glow (4.6s)
      this.sequenceTimers.push(setTimeout(() => {
        if (mainTitle) mainTitle.classList.add('active');
      }, 4600));

      // 4. Tagline fades in (5.4s)
      this.sequenceTimers.push(setTimeout(() => {
        if (tagline) tagline.classList.add('active');
      }, 5400));

      // 5. Complete intro and crossfade to main menu (7.8s)
      this.sequenceTimers.push(setTimeout(() => {
        this.finish();
      }, 7800));
    }

    _bindInput() {
      this._onKeyDown = (e) => {
        if (['Escape', 'Space', 'Enter'].includes(e.code)) {
          e.preventDefault();
          this.skip();
        }
      };
      window.addEventListener('keydown', this._onKeyDown);

      const skipBtn = document.getElementById('ww-intro-skip-btn');
      if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.skip();
        });
      }
    }

    skip() {
      this.markAsSeen();
      this.finish();
    }

    finish() {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      this.markAsSeen();

      // Clear timers
      this.sequenceTimers.forEach(t => clearTimeout(t));
      this.sequenceTimers = [];

      if (this._onKeyDown) {
        window.removeEventListener('keydown', this._onKeyDown);
      }
      if (this._onResizeBound) {
        window.removeEventListener('resize', this._onResizeBound);
      }

      // Smooth audio fade out
      if (this.masterGain && this.audioCtx) {
        try {
          this.masterGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);
          setTimeout(() => {
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
              this.audioCtx.close().catch(() => {});
            }
          }, 700);
        } catch (_) {}
      }

      // Smooth visual fade out
      if (this.container) {
        this.container.classList.add('fade-out');
        setTimeout(() => {
          if (this.animId) cancelAnimationFrame(this.animId);
          if (this.container) {
            this.container.style.display = 'none';
          }
          if (typeof this.onCompleteCallback === 'function') {
            this.onCompleteCallback();
            this.onCompleteCallback = null;
          }
        }, 850);
      } else {
        if (typeof this.onCompleteCallback === 'function') {
          this.onCompleteCallback();
          this.onCompleteCallback = null;
        }
      }
    }
  }

  window.IntroCinematic = new IntroCinematic();
})();
