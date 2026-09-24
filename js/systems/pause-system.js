// ============================================================================
// THE WHISPERING WILDS - PAUSE SYSTEM
// Coordinates pause/resume across all live simulation systems.
// Reads/writes ONLY through GameLifecycle — no separate isPaused boolean.
// ============================================================================

(function () {
  'use strict';

  class PauseSystem {
    constructor() {
      this._pauseReason    = null;
      this._savedAudioVols = null;
      this._pauseStartTime = null;

      // Register on GameLifecycle events
      if (window.GameLifecycle) {
        window.GameLifecycle.on('enter:PAUSED',  (e) => this._onEnterPaused(e));
        window.GameLifecycle.on('exit:PAUSED',   (e) => this._onExitPaused(e));
      }
    }

    // -------------------------------------------------------------------------
    // PUBLIC: pause / resume
    // -------------------------------------------------------------------------
    pause(reason = 'manual') {
      const lc = window.GameLifecycle;
      if (!lc || lc.state !== 'PLAYING') return false;

      this._pauseReason = reason;
      lc.transitionTo('PAUSED', { reason });
      return true;
    }

    resume() {
      const lc = window.GameLifecycle;
      if (!lc || lc.state !== 'PAUSED') return false;

      lc.transitionTo('PLAYING', { resumedFrom: 'PAUSED' });
      return true;
    }

    toggle() {
      const lc = window.GameLifecycle;
      if (!lc) return;
      if (lc.isPlaying) return this.pause('toggle');
      if (lc.isPaused)  return this.resume();
    }

    isPaused() {
      return window.GameLifecycle?.isPaused === true;
    }

    // stopAll: used when returning to menu (not just pausing)
    stopAll() {
      this._stopSimulation();
    }

    // -------------------------------------------------------------------------
    // PRIVATE: lifecycle hooks
    // -------------------------------------------------------------------------
    _onEnterPaused({ meta = {} } = {}) {
      this._pauseStartTime = Date.now();
      this._stopSimulation();
      this._muteAudio();
      this._resetInputState();

      // In multiplayer: keep network alive, just send paused status
      const mp = window.multiplayerManager;
      if (mp?.emitPlayerPaused) mp.emitPlayerPaused(true);

      // Show pause menu UI
      if (window.PauseMenuUI) window.PauseMenuUI.show({ reason: this._pauseReason });
    }

    _onExitPaused({ meta = {} } = {}) {
      this._resumeSimulation();
      this._restoreAudio();
      this._resetInputState();

      const mp = window.multiplayerManager;
      if (mp?.emitPlayerPaused) mp.emitPlayerPaused(false);

      // Hide pause menu UI
      if (window.PauseMenuUI) window.PauseMenuUI.hide();
    }

    // -------------------------------------------------------------------------
    // SIMULATION STOP / RESUME
    // -------------------------------------------------------------------------
    _stopSimulation() {
      // All systems check GameLifecycle.isSimulationActive() in their update loops.
      // Here we explicitly signal systems that have their own interval/tick.

      const lw = window.threeWorld?.livingWorld || window.livingWorldSystem;
      if (lw?.pause) lw.pause();

      const traffic = window.trafficSystem;
      if (traffic?.pause) traffic.pause();

      const festival = window.festivalSystem;
      if (festival?.pause) festival.pause();

      // Survival production system pauses via lifecycle check
      // Weather system pauses via lifecycle check
      // ThreeWorld update loop checks lifecycle state

      console.log('[PauseSystem] Simulation paused.');
    }

    _resumeSimulation() {
      const lw = window.threeWorld?.livingWorld || window.livingWorldSystem;
      if (lw?.resume) lw.resume();

      const traffic = window.trafficSystem;
      if (traffic?.resume) traffic.resume();

      const festival = window.festivalSystem;
      if (festival?.resume) festival.resume();

      console.log('[PauseSystem] Simulation resumed.');
    }

    // -------------------------------------------------------------------------
    // AUDIO
    // -------------------------------------------------------------------------
    _muteAudio() {
      const am = window.audioManager || window.gameAudio;
      if (!am) return;

      // Save current volumes so we can restore precisely
      if (am.getSettings) {
        this._savedAudioVols = am.getSettings();
      }

      // Lower gameplay audio by 80% (don't destroy state)
      const settings = window.GameState?.settings?.audio;
      if (am.setMasterVolume) {
        am.setMasterVolume((settings?.masterVolume || 0.8) * 0.15);
      }
    }

    _restoreAudio() {
      const am = window.audioManager || window.gameAudio;
      if (!am || !this._savedAudioVols) return;

      if (am.setMasterVolume) {
        am.setMasterVolume(this._savedAudioVols.masterVolume ?? 0.8);
      }
      this._savedAudioVols = null;
    }

    // -------------------------------------------------------------------------
    // INPUT RESET — prevent stuck WASD / sprint / jump after pause
    // -------------------------------------------------------------------------
    _resetInputState() {
      // Clear keyboard state in main.js input object
      if (window.testRef?.input?.keys) {
        window.testRef.input.keys = {};
      }
      // Also clear any InputManager state
      if (window.InputManager?.clearAllKeys) {
        window.InputManager.clearAllKeys();
      }
      // ThreeWorld player locomotion reset
      const p3d = window.threeWorld?.player;
      if (p3d?.resetInputState) p3d.resetInputState();
      else if (p3d?.velocity) { p3d.velocity.set(0, 0, 0); }
    }
  }

  window.PauseSystem = new PauseSystem();

})();
