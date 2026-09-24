// ============================================================================
// THE WHISPERING WILDS - ACCOUNT SYSTEM
// Authoritative account state management: LOGGED_OUT, GUEST, AUTHENTICATED.
// Offline/Guest support with cloud progression for authenticated players.
// Never deletes local saves on login.
// ============================================================================

(function () {
  'use strict';

  const ACCOUNT_STATES = {
    LOGGED_OUT: 'LOGGED_OUT',
    GUEST: 'GUEST',
    AUTHENTICATED: 'AUTHENTICATED'
  };

  class AccountSystem {
    constructor() {
      this._state = ACCOUNT_STATES.GUEST;
      this._user = null;
      this._listeners = new Set();
      this._init();
    }

    get state() {
      return this._state;
    }

    get isGuest() {
      return this._state === ACCOUNT_STATES.GUEST;
    }

    get isAuthenticated() {
      return this._state === ACCOUNT_STATES.AUTHENTICATED;
    }

    get user() {
      return this._user;
    }

    setGuest() {
      this._state = ACCOUNT_STATES.GUEST;
      this._user = {
        displayName: 'Guest Explorer',
        email: 'guest@whisperingwilds.local',
        isGuest: true
      };
      if (window.AuthState) {
        window.AuthState.isGuest = true;
      }
      this._notify();
    }

    setAuthenticated(user, token) {
      this._state = ACCOUNT_STATES.AUTHENTICATED;
      this._user = {
        ...user,
        isGuest: false
      };
      if (token) {
        try { localStorage.setItem('ww_auth_token', token); } catch (_) {}
      }
      if (window.AuthState) {
        window.AuthState.setUser(this._user);
        window.AuthState.isGuest = false;
      }
      console.log(`[AccountSystem] Player authenticated: ${user.displayName || user.email}`);
      this._notify();
    }

    signOut() {
      this._state = ACCOUNT_STATES.LOGGED_OUT;
      this._user = null;
      try { localStorage.removeItem('ww_auth_token'); } catch (_) {}
      if (window.AuthState) {
        window.AuthState.clear();
      }
      // Revert to Guest mode automatically so gameplay remains playable
      this.setGuest();
      this._notify();
    }

    onChange(fn) {
      this._listeners.add(fn);
      return () => this._listeners.delete(fn);
    }

    _notify() {
      for (const fn of this._listeners) {
        try { fn(this._state, this._user); } catch (e) { console.error(e); }
      }
    }

    _init() {
      // Check existing auth session
      const token = localStorage.getItem('ww_auth_token');
      if (token && window.AuthState?.getUser()) {
        this.setAuthenticated(window.AuthState.getUser(), token);
      } else {
        this.setGuest();
      }
    }
  }

  window.AccountSystem = new AccountSystem();
  window.accountSystem = window.AccountSystem;
})();
