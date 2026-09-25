/**
 * launcher/src/launcher-state.js
 * Authoritative state machine for The Whispering Wilds desktop launcher.
 * Coordinates operational phases, running game locks, and crash loop counters.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LauncherState = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STATES = {
    IDLE: 'IDLE',
    CHECKING_UPDATES: 'CHECKING_UPDATES',
    UPDATE_AVAILABLE: 'UPDATE_AVAILABLE',
    DOWNLOADING: 'DOWNLOADING',
    VERIFYING: 'VERIFYING',
    INSTALLING: 'INSTALLING',
    REPAIRING: 'REPAIRING',
    ROLLING_BACK: 'ROLLING_BACK',
    READY_TO_PLAY: 'READY_TO_PLAY',
    GAME_RUNNING: 'GAME_RUNNING',
    ERROR: 'ERROR'
  };

  class LauncherState {
    constructor() {
      this.currentState = STATES.IDLE;
      this.installedVersion = null;
      this.remoteVersion = null;
      this.installPath = 'C:\\Games\\TheWhisperingWilds\\app';
      this.userDataPath = 'C:\\Users\\User\\AppData\\Local\\TheWhisperingWilds\\savedata';
      this.isGameRunning = false;
      this.gamePid = null;
      this.lastLaunchTime = 0;
      this.consecutiveCrashes = 0;
      this.crashThreshold = 3;
      this.lastError = null;
      this.stateHistory = [];
      this.listeners = new Set();
    }

    transitionTo(nextState, details = {}) {
      if (!STATES[nextState]) {
        throw new Error(`[LauncherState] Invalid state: '${nextState}'`);
      }

      const prev = this.currentState;
      this.currentState = nextState;
      const entry = { from: prev, to: nextState, timestamp: Date.now(), details };
      this.stateHistory.push(entry);
      if (this.stateHistory.length > 50) this.stateHistory.shift();

      for (const listener of this.listeners) {
        try {
          listener(this.currentState, prev, details);
        } catch (_) {}
      }

      return entry;
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    recordLaunch(pid = 1234) {
      this.isGameRunning = true;
      this.gamePid = pid;
      this.lastLaunchTime = Date.now();
      this.transitionTo(STATES.GAME_RUNNING, { pid });
    }

    recordGameExit(exitCode = 0) {
      this.isGameRunning = false;
      this.gamePid = null;
      const sessionDurationSec = (Date.now() - this.lastLaunchTime) / 1000;

      // If game exited with non-zero code or closed in under 30 seconds, treat as potential crash
      if (exitCode !== 0 || sessionDurationSec < 30) {
        this.consecutiveCrashes++;
      } else {
        this.consecutiveCrashes = 0; // Clean long session resets crash counter
      }

      if (this.isCrashLoop()) {
        this.transitionTo(STATES.ERROR, {
          reason: 'CRASH_LOOP_DETECTED',
          crashes: this.consecutiveCrashes,
          exitCode
        });
      } else {
        this.transitionTo(STATES.READY_TO_PLAY, { exitCode });
      }
    }

    isCrashLoop() {
      return this.consecutiveCrashes >= this.crashThreshold;
    }

    resetCrashCount() {
      this.consecutiveCrashes = 0;
    }

    setError(err) {
      this.lastError = err;
      this.transitionTo(STATES.ERROR, { error: err.message || String(err) });
    }
  }

  return LauncherState;
});
