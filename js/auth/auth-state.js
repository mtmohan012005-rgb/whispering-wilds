// ============================================================================
// THE WHISPERING WILDS - AUTH STATE MANAGER
// ============================================================================

(function() {
    const AUTH_STATUS = {
        UNKNOWN: 'UNKNOWN',
        LOGGED_OUT: 'LOGGED_OUT',
        LOGGING_IN: 'LOGGING_IN',
        LOGGED_IN: 'LOGGED_IN',
        REGISTERING: 'REGISTERING',
        VERIFYING: 'VERIFYING',
        RESETTING: 'RESETTING',
        OFFLINE: 'OFFLINE'
    };

    class AuthStateManager {
        constructor() {
            this.status = AUTH_STATUS.UNKNOWN;
            this.user = null; // Account profile: { id, email, displayName, createdAt, lastLoginAt }
            this.isGuest = false;
            this.listeners = new Set();
        }

        getStatus() {
            return this.status;
        }

        isLoggedIn() {
            return this.status === AUTH_STATUS.LOGGED_IN;
        }

        getUser() {
            return this.user ? { ...this.user } : null;
        }

        setState(newStatus, user = null, isGuest = false) {
            const changed = this.status !== newStatus || this.user?.id !== user?.id;
            this.status = newStatus;
            this.user = user;
            this.isGuest = isGuest;

            if (changed) {
                this.notify();
            }
        }

        setGuest() {
            this.setState(AUTH_STATUS.LOGGED_IN, {
                id: 'guest_local',
                displayName: 'Wilds Wanderer (Guest)',
                email: 'guest@whisperingwilds.local',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            }, true);
        }

        setOffline() {
            this.setState(AUTH_STATUS.OFFLINE, null, true);
        }

        subscribe(callback) {
            if (typeof callback === 'function') {
                this.listeners.add(callback);
            }
            return () => this.listeners.delete(callback);
        }

        notify() {
            for (const listener of this.listeners) {
                try {
                    listener({
                        status: this.status,
                        user: this.getUser(),
                        isGuest: this.isGuest
                    });
                } catch (err) {
                    console.error('[AuthState] Listener error:', err);
                }
            }
        }
    }

    window.AUTH_STATUS = AUTH_STATUS;
    window.AuthState = new AuthStateManager();
})();
