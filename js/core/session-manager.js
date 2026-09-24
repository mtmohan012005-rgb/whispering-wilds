// ============================================================================
// THE WHISPERING WILDS - SESSION MANAGER
// Tracks session identity, play time accumulation, clean shutdown detection,
// and lastKnownSafeState for crash recovery.
// ============================================================================

(function () {
  'use strict';

  const SESSION_KEY = 'ww_session_v1';

  class SessionManager {
    constructor() {
      this.sessionId       = this._generateSessionId();
      this.profileId       = null;
      this.startTime       = Date.now();
      this.lastCheckpoint  = null;
      this.lastSave        = null;
      this.currentRegion   = 'george_town';
      this.cleanShutdown   = false;

      // Accumulated play time (ms) — only increments while PLAYING
      this._accumulatedPlayTimeMs = 0;
      this._playingStartTime      = null;
      this._lastTickTime          = Date.now();

      // Crash recovery: last known safe state reference (slot name in SaveManager)
      this.lastKnownSafeSlot = null;
      this._incompleteSession = false;

      // Detect crash from previous session
      this._loadPreviousSessionState();

      // Register lifecycle listeners
      if (window.GameLifecycle) {
        window.GameLifecycle.on('enter:PLAYING',  () => this._onEnterPlaying());
        window.GameLifecycle.on('exit:PLAYING',   () => this._onExitPlaying());
        window.GameLifecycle.on('enter:EXITING',  () => this._onExiting());
        window.GameLifecycle.on('enter:PAUSED',   () => this._onExitPlaying());
        window.GameLifecycle.on('exit:PAUSED',    () => {
          if (window.GameLifecycle && window.GameLifecycle.state === 'PLAYING') {
            this._onEnterPlaying();
          }
        });
      }

      // Persist session header immediately so we can detect crashes on next launch
      this._persistSessionHeader();
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Set profile for this session
    // -------------------------------------------------------------------------
    setProfile(profileId, savedPlayTimeMs = 0) {
      this.profileId = profileId;
      this._accumulatedPlayTimeMs = savedPlayTimeMs;
      this._persistSessionHeader();
    }

    setRegion(regionId) {
      this.currentRegion = regionId;
      this._persistSessionHeader();
    }

    recordCheckpoint(slotName) {
      this.lastCheckpoint  = Date.now();
      this.lastKnownSafeSlot = slotName;
      this._persistSessionHeader();
    }

    recordSave(slotName) {
      this.lastSave = Date.now();
      if (slotName) this.lastKnownSafeSlot = slotName;
      this._persistSessionHeader();
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Play time accumulation
    // -------------------------------------------------------------------------
    getTotalPlayTimeMs() {
      let total = this._accumulatedPlayTimeMs;
      if (this._playingStartTime !== null) {
        total += Date.now() - this._playingStartTime;
      }
      return total;
    }

    getFormattedPlayTime() {
      const ms   = this.getTotalPlayTimeMs();
      const secs = Math.floor(ms / 1000);
      const h    = Math.floor(secs / 3600);
      const m    = Math.floor((secs % 3600) / 60);
      const s    = secs % 60;
      return `${h}h ${m}m ${s}s`;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Crash recovery detection
    // -------------------------------------------------------------------------
    hadIncompleteSession() {
      return this._incompleteSession;
    }

    getPreviousSessionSafeSlot() {
      return this.lastKnownSafeSlot;
    }

    clearIncompleteSessionFlag() {
      this._incompleteSession = false;
      this._persistSessionHeader();
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Lifecycle hooks
    // -------------------------------------------------------------------------
    _onEnterPlaying() {
      if (this._playingStartTime === null) {
        this._playingStartTime = Date.now();
      }
    }

    _onExitPlaying() {
      if (this._playingStartTime !== null) {
        this._accumulatedPlayTimeMs += Date.now() - this._playingStartTime;
        this._playingStartTime = null;
      }
    }

    _onExiting() {
      this._onExitPlaying();
      this.cleanShutdown = true;
      this._persistSessionHeader();
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Persistence (sessionStorage only — per-tab)
    // -------------------------------------------------------------------------
    _generateSessionId() {
      return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }

    _persistSessionHeader() {
      try {
        const header = {
          sessionId:          this.sessionId,
          profileId:          this.profileId,
          startTime:          this.startTime,
          lastCheckpoint:     this.lastCheckpoint,
          lastSave:           this.lastSave,
          currentRegion:      this.currentRegion,
          cleanShutdown:      this.cleanShutdown,
          playTimeMs:         this._accumulatedPlayTimeMs,
          lastKnownSafeSlot:  this.lastKnownSafeSlot
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(header));

        // Also persist to localStorage for cross-tab crash detection
        localStorage.setItem('ww_last_session', JSON.stringify({
          sessionId:    this.sessionId,
          cleanShutdown: this.cleanShutdown,
          safeSlot:     this.lastKnownSafeSlot,
          timestamp:    Date.now()
        }));
      } catch (_) {}
    }

    _loadPreviousSessionState() {
      try {
        const raw = localStorage.getItem('ww_last_session');
        if (!raw) return;
        const prev = JSON.parse(raw);

        // Detect crash: previous session that did not mark cleanShutdown
        if (prev && prev.sessionId && prev.cleanShutdown === false) {
          this._incompleteSession = true;
          this.lastKnownSafeSlot = prev.safeSlot || null;
          console.warn('[SessionManager] Previous session did not shut down cleanly. Recovery available.');
        }

        // Restore play time from previous sessions if available
        const savedPlaytime = localStorage.getItem('ww_total_playtime');
        if (savedPlaytime) {
          this._accumulatedPlayTimeMs = Math.max(0, parseInt(savedPlaytime, 10) || 0);
        }
      } catch (_) {}
    }

    persistPlayTime() {
      try {
        localStorage.setItem('ww_total_playtime', String(this.getTotalPlayTimeMs()));
      } catch (_) {}
    }

    getDiagnostics() {
      return {
        sessionId:         this.sessionId,
        profileId:         this.profileId,
        currentRegion:     this.currentRegion,
        cleanShutdown:     this.cleanShutdown,
        playTime:          this.getFormattedPlayTime(),
        lastCheckpoint:    this.lastCheckpoint,
        lastSave:          this.lastSave,
        lastKnownSafeSlot: this.lastKnownSafeSlot,
        incompleteSession: this._incompleteSession
      };
    }
  }

  window.SessionManager = new SessionManager();

})();
