// ============================================================================
// THE WHISPERING WILDS - AUTHORITATIVE GAME LIFECYCLE STATE MACHINE
// Single source of truth for application state flow.
// Do NOT create separate isPaused/isLoading/isSaving booleans — derive from state.
// ============================================================================

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // LIFECYCLE STATES
  // -------------------------------------------------------------------------
  const LIFECYCLE_STATES = {
    BOOT:              'BOOT',
    INITIALIZING:      'INITIALIZING',
    LOGIN:             'LOGIN',
    PROFILE_SELECT:    'PROFILE_SELECT',
    MAIN_MENU:         'MAIN_MENU',
    LOADING_GAME:      'LOADING_GAME',
    PLAYING:           'PLAYING',
    PAUSED:            'PAUSED',
    TRANSITIONING:     'TRANSITIONING',
    SAVING:            'SAVING',
    RECOVERING:        'RECOVERING',
    GAME_OVER:         'GAME_OVER',
    RETURNING_TO_MENU: 'RETURNING_TO_MENU',
    EXITING:           'EXITING'
  };

  // States where gameplay simulation must NOT run
  const NON_PLAYING_STATES = new Set([
    'BOOT', 'INITIALIZING', 'LOGIN', 'PROFILE_SELECT', 'MAIN_MENU',
    'LOADING_GAME', 'PAUSED', 'TRANSITIONING', 'SAVING',
    'RECOVERING', 'GAME_OVER', 'RETURNING_TO_MENU', 'EXITING'
  ]);

  // States where gameplay INPUT (WASD/movement) must be locked
  const INPUT_LOCKED_STATES = new Set([
    'BOOT', 'INITIALIZING', 'LOGIN', 'PROFILE_SELECT', 'MAIN_MENU',
    'LOADING_GAME', 'TRANSITIONING', 'SAVING', 'RECOVERING',
    'GAME_OVER', 'RETURNING_TO_MENU', 'EXITING'
  ]);

  // Valid state transitions (from -> [allowed to...])
  const VALID_TRANSITIONS = {
    BOOT:              ['INITIALIZING'],
    INITIALIZING:      ['LOGIN', 'PROFILE_SELECT', 'MAIN_MENU', 'RECOVERING'],
    LOGIN:             ['PROFILE_SELECT', 'MAIN_MENU'],
    PROFILE_SELECT:    ['MAIN_MENU', 'LOGIN'],
    MAIN_MENU:         ['LOADING_GAME', 'EXITING', 'PROFILE_SELECT', 'LOGIN'],
    LOADING_GAME:      ['PLAYING', 'RECOVERING', 'MAIN_MENU'],
    PLAYING:           ['PAUSED', 'SAVING', 'TRANSITIONING', 'GAME_OVER', 'RETURNING_TO_MENU', 'EXITING'],
    PAUSED:            ['PLAYING', 'SAVING', 'LOADING_GAME', 'RETURNING_TO_MENU', 'EXITING'],
    TRANSITIONING:     ['PLAYING', 'LOADING_GAME', 'RECOVERING', 'MAIN_MENU'],
    SAVING:            ['PLAYING', 'PAUSED', 'RETURNING_TO_MENU', 'EXITING'],
    RECOVERING:        ['MAIN_MENU', 'LOADING_GAME', 'EXITING'],
    GAME_OVER:         ['MAIN_MENU', 'LOADING_GAME'],
    RETURNING_TO_MENU: ['MAIN_MENU', 'EXITING'],
    EXITING:           []
  };

  class GameLifecycle {
    constructor() {
      this._state = LIFECYCLE_STATES.BOOT;
      this._previousState = null;
      this._listeners = new Map();
      this._stateHistory = [];
      this._stateEnterTime = Date.now();

      // Derived flags (always computed from state — never set directly)
    }

    // -------------------------------------------------------------------------
    // STATE ACCESSORS
    // -------------------------------------------------------------------------
    get state() { return this._state; }
    get previousState() { return this._previousState; }

    // Derived convenience booleans
    get isPlaying()       { return this._state === LIFECYCLE_STATES.PLAYING; }
    get isPaused()        { return this._state === LIFECYCLE_STATES.PAUSED; }
    get isLoading()       { return this._state === LIFECYCLE_STATES.LOADING_GAME; }
    get isSaving()        { return this._state === LIFECYCLE_STATES.SAVING; }
    get isTransitioning() { return this._state === LIFECYCLE_STATES.TRANSITIONING; }
    get isInMenu()        { return this._state === LIFECYCLE_STATES.MAIN_MENU || this._state === LIFECYCLE_STATES.PROFILE_SELECT; }
    get isRecovering()    { return this._state === LIFECYCLE_STATES.RECOVERING; }

    isSimulationActive() {
      return !NON_PLAYING_STATES.has(this._state);
    }

    isInputLocked() {
      return INPUT_LOCKED_STATES.has(this._state);
    }

    // -------------------------------------------------------------------------
    // STATE TRANSITIONS
    // -------------------------------------------------------------------------
    transitionTo(newState, meta = {}) {
      if (!LIFECYCLE_STATES[newState]) {
        this._logError(`Unknown lifecycle state: '${newState}'`);
        return false;
      }

      const allowed = VALID_TRANSITIONS[this._state] || [];
      if (!allowed.includes(newState)) {
        this._logError(
          `Invalid lifecycle transition: '${this._state}' → '${newState}'.` +
          ` Allowed: [${allowed.join(', ')}]`
        );
        return false;
      }

      const oldState = this._state;
      this._previousState = oldState;
      this._state = newState;
      this._stateEnterTime = Date.now();

      this._stateHistory.push({
        from: oldState, to: newState,
        timestamp: this._stateEnterTime,
        meta
      });

      // Keep history bounded
      if (this._stateHistory.length > 50) {
        this._stateHistory.shift();
      }

      console.log(`[GameLifecycle] ${oldState} → ${newState}`, meta);

      // Emit events
      this.emit('stateChanged', { from: oldState, to: newState, meta });
      this.emit(`enter:${newState}`, { from: oldState, meta });
      this.emit(`exit:${oldState}`, { to: newState, meta });

      return true;
    }

    // Force transition (for recovery / error states — bypasses validation)
    forceTransition(newState, meta = {}) {
      const oldState = this._state;
      this._previousState = oldState;
      this._state = newState;
      this._stateEnterTime = Date.now();
      this._stateHistory.push({ from: oldState, to: newState, forced: true, timestamp: Date.now(), meta });
      console.warn(`[GameLifecycle] FORCED transition: ${oldState} → ${newState}`, meta);
      this.emit('stateChanged', { from: oldState, to: newState, forced: true, meta });
      this.emit(`enter:${newState}`, { from: oldState, forced: true, meta });
    }

    timeInCurrentState() {
      return Date.now() - this._stateEnterTime;
    }

    getStateHistory() {
      return [...this._stateHistory];
    }

    // -------------------------------------------------------------------------
    // EVENT SYSTEM
    // -------------------------------------------------------------------------
    on(event, callback) {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event).push(callback);
      return () => this.off(event, callback);
    }

    off(event, callback) {
      const cbs = this._listeners.get(event);
      if (cbs) {
        const idx = cbs.indexOf(callback);
        if (idx !== -1) cbs.splice(idx, 1);
      }
    }

    emit(event, data) {
      const cbs = this._listeners.get(event);
      if (cbs) {
        cbs.slice().forEach(cb => {
          try { cb(data); } catch (e) {
            console.error(`[GameLifecycle] Error in '${event}' listener:`, e);
          }
        });
      }
    }

    // -------------------------------------------------------------------------
    // DEVELOPER DIAGNOSTICS
    // -------------------------------------------------------------------------
    getDiagnostics() {
      return {
        currentState: this._state,
        previousState: this._previousState,
        timeInState: this.timeInCurrentState(),
        isSimulationActive: this.isSimulationActive(),
        isInputLocked: this.isInputLocked(),
        recentHistory: this._stateHistory.slice(-10)
      };
    }

    _logError(msg) {
      console.error(`[GameLifecycle] ${msg}`);
    }
  }

  // -------------------------------------------------------------------------
  // GLOBAL SINGLETON — never replace this instance
  // -------------------------------------------------------------------------
  window.GameLifecycle = new GameLifecycle();
  window.LIFECYCLE_STATES = LIFECYCLE_STATES;

})();
