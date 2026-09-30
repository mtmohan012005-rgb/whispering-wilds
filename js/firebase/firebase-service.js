/**
 * The Whispering Wilds (Kaattu Vazhi) - Firebase Service
 * Production Auth (Email/Password) & Firestore Cloud Persistence
 * Project: debug-c26abc33
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.FirebaseService = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // CHECKSUM (must stay byte-identical to server/firebase/persistence-service.js)
  // ---------------------------------------------------------------------------
  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }

  function computeChecksum(payload) {
    const json = stableStringify(payload);
    let hash = 0x811c9dc5;
    for (let i = 0; i < json.length; i += 1) {
      hash ^= json.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function resolveApiBase() {
    if (typeof window !== 'undefined' && window.MULTIPLAYER_SERVER_URL) {
      return String(window.MULTIPLAYER_SERVER_URL).replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && window.location && window.location.origin
        && window.location.protocol !== 'file:') {
      return window.location.origin;
    }
    return '';
  }

  class FirebaseService {
    constructor() {
      this.app = null;
      this.auth = null;
      this.db = null;
      this.currentUser = null;
      this.isInitialized = false;
      this._disabled = false;
      this._authListeners = new Set();
      this._offlineQueue = [];
    }

    async init() {
      if (this.isInitialized) return true;
      if (this._disabled) return false;

      const cfg = (typeof window !== 'undefined' && window.FirebaseConfig) ? window.FirebaseConfig : null;

      // No real credentials -> stay in offline / guest mode instead of letting
      // initializeApp() throw auth/invalid-api-key on every boot.
      if (!cfg || typeof cfg.isConfigured !== 'function' || !cfg.isConfigured()) {
        this._disabled = true;
        console.warn('[FirebaseService] No Firebase credentials configured - running offline/guest mode.');
        return false;
      }

      const config = cfg.config;

      if (typeof firebase === 'undefined') {
        console.warn('[FirebaseService] Firebase SDK not yet loaded from CDN. Retrying on window load.');
        return false;
      }

      try {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(config);
        } else {
          this.app = firebase.app();
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();

        // Enable offline persistence for Firestore if supported
        try {
          await this.db.enablePersistence({ synchronizeTabs: true });
          console.log('[FirebaseService] Firestore multi-tab offline persistence enabled.');
        } catch (persErr) {
          if (persErr.code === 'failed-precondition') {
            console.warn('[FirebaseService] Multi-tab persistence failed (multiple tabs open).');
          } else if (persErr.code === 'unimplemented') {
            console.warn('[FirebaseService] Browser does not support Firestore persistence.');
          }
        }

        // Setup auth state observer
        this.auth.onAuthStateChanged(async (user) => {
          this.currentUser = user;
          if (user) {
            console.log(`[FirebaseService] User authenticated: ${user.email} (${user.uid})`);
            await this._syncUserProfile(user);
            this._flushOfflineQueue();
          } else {
            console.log('[FirebaseService] User signed out or in guest mode.');
          }
          this._notifyAuthListeners(user);
        });

        this.isInitialized = true;
        console.log('[FirebaseService] Successfully initialized for project debug-c26abc33');
        return true;
      } catch (err) {
        console.error('[FirebaseService] Initialization failed:', err);
        return false;
      }
    }

    // ─── AUTHENTICATION (Email & Password) ───────────────────────────────────

    async signUpWithEmail(email, password, displayName = '') {
      if (!this.auth) await this.init();
      try {
        const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (displayName && user.updateProfile) {
          await user.updateProfile({ displayName });
        }

        await this._syncUserProfile(user, displayName);
        return { success: true, user };
      } catch (err) {
        console.error('[FirebaseService] Sign up error:', err);
        return { success: false, error: err.message, code: err.code };
      }
    }

    async signInWithEmail(email, password) {
      if (!this.auth) await this.init();
      try {
        const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
      } catch (err) {
        console.error('[FirebaseService] Sign in error:', err);
        return { success: false, error: err.message, code: err.code };
      }
    }

    async signOut() {
      if (!this.auth) return { success: true };
      try {
        await this.auth.signOut();
        this.currentUser = null;
        return { success: true };
      } catch (err) {
        console.error('[FirebaseService] Sign out error:', err);
        return { success: false, error: err.message };
      }
    }

    async resetPassword(email) {
      if (!this.auth) await this.init();
      try {
        await this.auth.sendPasswordResetEmail(email);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    getCurrentUser() {
      return this.currentUser;
    }

    isAuthenticated() {
      return Boolean(this.currentUser);
    }

    onAuthStateChanged(callback) {
      this._authListeners.add(callback);
      if (this.isInitialized) {
        callback(this.currentUser);
      }
      return () => this._authListeners.delete(callback);
    }

    _notifyAuthListeners(user) {
      for (const listener of this._authListeners) {
        try {
          listener(user);
        } catch (e) {
          console.error('[FirebaseService] Auth listener error:', e);
        }
      }
    }

    // ─── CLOUD FIRESTORE PLAYER PERSISTENCE ───────────────────────────────
    //
    // WRITE PATH POLICY
    // -----------------
    // Saves are NOT written to Firestore directly from the browser. Doing so
    // would (a) let a modified client write arbitrary economy/achievement
    // fields, and (b) allow a blind `merge: true` overwrite that silently
    // destroys a newer cloud save with stale local data.
    //
    // Instead the client submits to the server, which validates, authorizes,
    // and commits inside a Firestore transaction using the Admin SDK (Admin
    // writes are not subject to client rules). Reads remain direct.

    async _syncUserProfile(user, fallbackDisplayName = '') {
      if (!this.db || !user) return;
      const playerRef = this.db.collection('players').doc(user.uid);

      // Client-owned fields ONLY. uid / email / role / maxCustomizationChanges /
      // appearanceChangeCount / currency / createdAt / lastLogin are
      // server-authoritative and are rejected by firestore.rules if written here.
      const clientProfile = {
        displayName: (user.displayName || fallbackDisplayName
          || (user.email || 'player').split('@')[0]).slice(0, 40)
      };

      try {
        const doc = await playerRef.get();
        if (!doc.exists) {
          await playerRef.set(clientProfile, { merge: true });
        } else if (doc.data().displayName !== clientProfile.displayName) {
          await playerRef.update(clientProfile);
        }
      } catch (err) {
        console.warn('[FirebaseService] User profile sync deferred (offline/permission):', err.message);
      }
    }

    /**
     * Submits a save to the server for authoritative commit.
     *
     * @param {object} savePayload { revision, data }
     * @param {object} [opts] { saveId, baseRevision, idempotencyKey }
     * @returns {Promise<{success:boolean, revision?:number, code?:string, currentRevision?:number}>}
     */
    async savePlayerData(savePayload, opts = {}) {
      if (!this.currentUser) {
        this._offlineQueue.push({ action: 'save', payload: savePayload, opts, time: Date.now() });
        return { success: false, code: 'UNAUTHENTICATED', message: 'No authenticated user. Queued locally.' };
      }

      const apiBase = resolveApiBase();
      if (!apiBase) {
        return { success: false, code: 'NO_API_BASE', message: 'No backend URL configured.' };
      }

      const saveId = opts.saveId || 'slot_0';
      const data = (savePayload && savePayload.data) || {};
      // The revision this save was based on. Required for optimistic
      // concurrency; the server rejects a mismatch with SAVE_CONFLICT instead
      // of overwriting newer data.
      const baseRevision = Number.isInteger(opts.baseRevision)
        ? opts.baseRevision
        : (Number.isInteger(savePayload && savePayload.revision) ? savePayload.revision - 1 : 0);

      const body = {
        saveId,
        saveVersion: data.version === undefined ? 3 : data.version,
        data,
        checksum: computeChecksum(data),
        baseRevision,
        clientTime: new Date().toISOString()
      };
      if (opts.idempotencyKey) body.idempotencyKey = opts.idempotencyKey;

      let response;
      try {
        response = await fetch(`${apiBase}/api/v1/persistence/saves`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WW-CSRF': '1',
            'Authorization': `Bearer ${await this.currentUser.getIdToken()}`
          },
          body: JSON.stringify(body)
        });
      } catch (err) {
        this._offlineQueue.push({ action: 'save', payload: savePayload, opts, time: Date.now() });
        return { success: false, code: 'NETWORK_ERROR', message: err.message };
      }

      let json = null;
      try { json = await response.json(); } catch (err) { json = null; }

      if (response.status === 409) {
        // A newer save exists. Do NOT retry blindly: surface the conflict so
        // the caller can load and merge instead of clobbering.
        return {
          success: false,
          code: (json && json.code) || 'SAVE_CONFLICT',
          currentRevision: json && json.details ? json.details.currentRevision : undefined,
          message: (json && json.message) || 'A newer save already exists.'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          code: (json && json.code) || `HTTP_${response.status}`,
          message: (json && json.message) || `Save failed (${response.status}).`
        };
      }

      const revision = json ? json.revision : baseRevision + 1;
      console.log(`[FirebaseService] Save committed by server for ${this.currentUser.uid} (Rev ${revision})`);
      return { success: true, revision, savedAt: json && json.savedAt };
    }

    async loadPlayerData(saveId = 'slot_0') {
      if (!this.currentUser) return null;
      const uid = this.currentUser.uid;
      const saveRef = this.db.collection('players').doc(uid).collection('saves').doc(saveId);

      try {
        const doc = await saveRef.get();
        if (doc.exists) {
          const data = doc.data();
          console.log(`[FirebaseService] Loaded cloud save for ${uid} (Rev ${data.revision || 0})`);
          return data;
        }
        return null;
      } catch (err) {
        console.error('[FirebaseService] Firestore load error:', err);
        return null;
      }
    }

    async getCustomizationBudget() {
      const apiBase = resolveApiBase();
      if (!apiBase || !this.currentUser) return null;
      try {
        const response = await fetch(`${apiBase}/api/v1/persistence/customization`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${await this.currentUser.getIdToken()}`
          }
        });
        if (!response.ok) return null;
        const json = await response.json();
        return json.budget || null;
      } catch (err) {
        return null;
      }
    }

    async _flushOfflineQueue() {
      if (!this._offlineQueue.length || !this.currentUser) return;
      console.log(`[FirebaseService] Flushing ${this._offlineQueue.length} queued action(s)...`);
      const queue = [...this._offlineQueue];
      this._offlineQueue = [];

      for (const item of queue) {
        if (item.action === 'save' && item.payload) {
          const res = await this.savePlayerData(item.payload, item.opts || {});
          // A conflict must not be silently retried forever; drop it and let
          // the next load reconcile.
          if (res && res.code === 'SAVE_CONFLICT') {
            console.warn('[FirebaseService] Queued save rejected as stale (SAVE_CONFLICT); dropped.');
          }
        }
      }
    }
  }

  const instance = new FirebaseService();
  instance.computeChecksum = computeChecksum;
  instance.stableStringify = stableStringify;
  instance.resolveApiBase = resolveApiBase;
  return instance;
});
