/**
 * PlatformSession - Storefront Connection & Session State Machine
 * Manages connection states, offline fallbacks, and bounded reconnection retries.
 */

(function(root) {
  const SessionStatus = {
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    NOT_SUPPORTED: 'NOT_SUPPORTED',
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    TEMPORARY_FAILURE: 'TEMPORARY_FAILURE',
    PERMANENT_FAILURE: 'PERMANENT_FAILURE'
  };

  class PlatformSession {
    constructor(provider) {
      this.provider = provider;
      this.status = SessionStatus.UNAVAILABLE;
      this.currentUser = null;
      this.isOnline = false;
      this.retryAttempts = 0;
      this.maxRetryAttempts = 3;
      this.listeners = new Set();
    }

    async init() {
      if (!this.provider) {
        this.status = SessionStatus.NOT_SUPPORTED;
        return this.status;
      }

      try {
        const available = await this.provider.isAvailable();
        if (!available) {
          this.status = SessionStatus.UNAVAILABLE;
          this.isOnline = false;
          return this.status;
        }

        const user = await this.provider.getUser();
        if (user) {
          this.currentUser = user;
          this.status = SessionStatus.AVAILABLE;
          this.isOnline = true;
          this.retryAttempts = 0;
        } else {
          this.status = SessionStatus.AUTH_REQUIRED;
          this.isOnline = false;
        }
      } catch (err) {
        this.status = SessionStatus.TEMPORARY_FAILURE;
        this.isOnline = false;
      }

      this._notifyListeners();
      return this.status;
    }

    async retryConnection() {
      if (this.retryAttempts >= this.maxRetryAttempts) {
        this.status = SessionStatus.PERMANENT_FAILURE;
        this._notifyListeners();
        return false;
      }
      this.retryAttempts++;
      const res = await this.init();
      return res === SessionStatus.AVAILABLE;
    }

    setOffline() {
      this.status = SessionStatus.UNAVAILABLE;
      this.isOnline = false;
      this._notifyListeners();
    }

    addListener(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    _notifyListeners() {
      const payload = {
        status: this.status,
        isOnline: this.isOnline,
        user: this.currentUser ? this.currentUser.getSanitizedSummary() : null
      };
      this.listeners.forEach(fn => {
        try { fn(payload); } catch (e) {}
      });
    }

    getStatus() {
      return this.status;
    }
  }

  PlatformSession.SessionStatus = SessionStatus;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformSession;
  } else {
    root.PlatformSession = PlatformSession;
  }
})(typeof window !== 'undefined' ? window : global);
