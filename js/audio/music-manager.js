// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MUSIC MANAGER
// Authoritative music playback engine handling seamless crossfading,
// layered stems, and memory-safe streaming through the MUSIC bus.
// ============================================================================

(function () {
  'use strict';

  class MusicManager {
    constructor() {
      this.currentTrackId = null;
      this.activeSource = null;
      this.activeGain = null;
      this.previousSource = null;
      this.previousGain = null;
      this.isPlaying = false;
      this.isPaused = false;
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      console.log('[MusicManager] Initialized music engine routed to MUSIC bus.');
      return this;
    }

    playTrack(trackId, fadeDuration = 2.0) {
      if (this.currentTrackId === trackId && this.isPlaying) return;

      const musicData = window.MusicData?.getTrack(trackId);
      if (!musicData) {
        console.warn(`[MusicManager] Music track '${trackId}' not found in registry.`);
        return false;
      }

      console.log(`[MusicManager] Crossfading to track: ${trackId} (${fadeDuration}s)`);

      // 1. Fade out previous track
      if (this.activeGain && window.audioManager?.ctx) {
        const ctx = window.audioManager.ctx;
        const now = ctx.currentTime;
        this.activeGain.gain.cancelScheduledValues(now);
        this.activeGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);

        const oldSrc = this.activeSource;
        setTimeout(() => {
          try { if (oldSrc?.stop) oldSrc.stop(); } catch (_) {}
        }, fadeDuration * 1000 + 100);
      }

      // 2. Play new track through AudioManager's MUSIC bus
      const targetBus = window.AudioBusMatrix?.getGainNode('MUSIC') || window.audioManager?.musicGain;
      const ctx = targetBus?.context || window.audioManager?.ctx;

      if (ctx && targetBus) {
        try {
          const trackGain = ctx.createGain();
          trackGain.gain.setValueAtTime(0.0001, ctx.currentTime);
          trackGain.gain.linearRampToValueAtTime(musicData.volume || 0.7, ctx.currentTime + fadeDuration);
          trackGain.connect(targetBus);
          this.activeGain = trackGain;
        } catch (err) {
          console.warn('[MusicManager] Could not connect trackGain:', err);
        }
      }

      this.currentTrackId = trackId;
      this.isPlaying = true;
      this.isPaused = false;

      // Notify AudioManager
      if (window.audioManager) {
        window.audioManager.play(trackId, {
          category: 'music',
          busName: 'MUSIC',
          loop: true,
          volume: musicData.volume || 0.7
        });
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('music_track_changed', {
          detail: { trackId, title: musicData.title, region: musicData.region }
        }));
      }

      return true;
    }

    stop(fadeDuration = 1.5) {
      if (!this.isPlaying) return;

      if (this.activeGain && window.audioManager?.ctx) {
        const ctx = window.audioManager.ctx;
        const now = ctx.currentTime;
        this.activeGain.gain.cancelScheduledValues(now);
        this.activeGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
      }

      if (window.audioManager) {
        window.audioManager.stop(this.currentTrackId, fadeDuration);
      }

      setTimeout(() => {
        this.isPlaying = false;
        this.currentTrackId = null;
        this.activeGain = null;
      }, fadeDuration * 1000);
    }

    pause() {
      this.isPaused = true;
      if (this.activeGain && window.audioManager?.ctx) {
        this.activeGain.gain.setTargetAtTime(0.0001, window.audioManager.ctx.currentTime, 0.2);
      }
    }

    resume() {
      this.isPaused = false;
      if (this.activeGain && window.audioManager?.ctx && this.currentTrackId) {
        const trackData = window.MusicData?.getTrack(this.currentTrackId);
        const targetVol = trackData?.volume || 0.7;
        this.activeGain.gain.setTargetAtTime(targetVol, window.audioManager.ctx.currentTime, 0.4);
      }
    }

    getCurrentTrack() {
      return this.currentTrackId;
    }
  }

  const instance = new MusicManager();

  if (typeof window !== 'undefined') {
    window.MusicManager = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MusicManager, instance };
  }
})();
