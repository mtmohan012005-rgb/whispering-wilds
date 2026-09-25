/**
 * js/core/lifecycle-validator.js
 * Lifecycle validation and watchdogs: loading, transition, save, and stuck state detection.
 */

(function () {
  'use strict';

  class LifecycleValidator {
    constructor() {
      this._allowedTransitions = new Map([
        ['UNINITIALIZED', ['BOOT', 'INITIALIZING']],
        ['BOOT', ['INITIALIZING', 'RECOVERING']],
        ['INITIALIZING', ['SPLASH', 'MAIN_MENU', 'RECOVERING']],
        ['SPLASH', ['MAIN_MENU', 'RECOVERING']],
        ['MAIN_MENU', ['PROFILE_SELECT', 'LOADING_GAME', 'SETTINGS', 'RECOVERING', 'EXITING']],
        ['PROFILE_SELECT', ['MAIN_MENU', 'LOADING_GAME', 'RECOVERING']],
        ['SETTINGS', ['MAIN_MENU', 'PLAYING', 'PAUSED']],
        ['LOADING_GAME', ['PLAYING', 'MAIN_MENU', 'RECOVERING']],
        ['PLAYING', ['PAUSED', 'SAVING', 'REGION_TRANSITION', 'MAIN_MENU', 'RECOVERING', 'CUTSCENE']],
        ['CUTSCENE', ['PLAYING', 'PAUSED', 'MAIN_MENU', 'RECOVERING']],
        ['PAUSED', ['PLAYING', 'SAVING', 'SETTINGS', 'MAIN_MENU', 'RECOVERING']],
        ['SAVING', ['PLAYING', 'PAUSED', 'MAIN_MENU', 'RECOVERING']],
        ['REGION_TRANSITION', ['PLAYING', 'RECOVERING', 'MAIN_MENU']],
        ['RECOVERING', ['MAIN_MENU', 'PLAYING', 'LOADING_GAME', 'BOOT']],
        ['EXITING', []]
      ]);

      this._watchdogs = {
        loading: { timer: null, startTime: 0, timeoutMs: 15000 },
        transition: { timer: null, startTime: 0, previousRegion: null, timeoutMs: 12000 },
        save: { inProgress: false, startTime: 0, timeoutMs: 8000 }
      };
    }

    /**
     * Validates whether transition from currentState to targetState is legal.
     */
    canTransition(fromState, toState) {
      if (fromState === toState) return true;
      const validNext = this._allowedTransitions.get(fromState);
      return validNext ? validNext.includes(toState) : false;
    }

    assertTransition(fromState, toState) {
      if (!this.canTransition(fromState, toState)) {
        const msg = `[LifecycleValidator] Illegal state transition: '${fromState}' -> '${toState}'`;
        if (window.Assertions) {
          window.Assertions.assert(false, msg, 'ILLEGAL_LIFECYCLE_TRANSITION', { fromState, toState });
        } else {
          throw new Error(msg);
        }
      }
    }

    // -------------------------------------------------------------------------
    // WATCHDOGS
    // -------------------------------------------------------------------------

    startLoadingWatchdog(onStallCallback) {
      this.clearLoadingWatchdog();
      this._watchdogs.loading.startTime = Date.now();
      this._watchdogs.loading.timer = setTimeout(() => {
        console.warn('[LifecycleValidator] Loading watchdog triggered: stage stalled for > 15s.');
        if (typeof onStallCallback === 'function') {
          onStallCallback();
        } else if (window.CrashRecoverySystem) {
          window.CrashRecoverySystem.handleStalledOperation('loading');
        }
      }, this._watchdogs.loading.timeoutMs);
    }

    clearLoadingWatchdog() {
      if (this._watchdogs.loading.timer) {
        clearTimeout(this._watchdogs.loading.timer);
        this._watchdogs.loading.timer = null;
      }
    }

    startTransitionWatchdog(previousRegion, onStallCallback) {
      this.clearTransitionWatchdog();
      this._watchdogs.transition.previousRegion = previousRegion;
      this._watchdogs.transition.startTime = Date.now();
      this._watchdogs.transition.timer = setTimeout(() => {
        console.warn(`[LifecycleValidator] Transition watchdog triggered: region change stalled for > 12s. Reverting to '${previousRegion}'.`);
        if (typeof onStallCallback === 'function') {
          onStallCallback(previousRegion);
        } else if (window.CrashRecoverySystem) {
          window.CrashRecoverySystem.handleStalledOperation('transition', { previousRegion });
        }
      }, this._watchdogs.transition.timeoutMs);
    }

    clearTransitionWatchdog() {
      if (this._watchdogs.transition.timer) {
        clearTimeout(this._watchdogs.transition.timer);
        this._watchdogs.transition.timer = null;
      }
    }

    startSaveWatchdog() {
      if (this._watchdogs.save.inProgress) {
        console.warn('[LifecycleValidator] Concurrent save prevented by SaveWatchdog.');
        return false;
      }
      this._watchdogs.save.inProgress = true;
      this._watchdogs.save.startTime = Date.now();
      return true;
    }

    completeSaveWatchdog() {
      this._watchdogs.save.inProgress = false;
      this._watchdogs.save.startTime = 0;
    }

    isSaveInProgress() {
      return this._watchdogs.save.inProgress;
    }
  }

  window.LifecycleValidator = new LifecycleValidator();
})();
