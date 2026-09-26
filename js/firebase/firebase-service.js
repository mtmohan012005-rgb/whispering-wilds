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

  class FirebaseService {
    constructor() {
      this.app = null;
      this.auth = null;
      this.db = null;
      this.currentUser = null;
      this.isInitialized = false;
      this._authListeners = new Set();
      this._offlineQueue = [];
    }

    async init() {
      if (this.isInitialized) return true;

      const config = (typeof window !== 'undefined' && window.FirebaseConfig)
        ? window.FirebaseConfig.config
        : { projectId: 'debug-c26abc33', authDomain: 'debug-c26abc33.firebaseapp.com' };

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

    // ─── CLOUD FIRESTORE PLAYER PERSISTENCE ─────────────────────────────────

    async _syncUserProfile(user, fallbackDisplayName = '') {
      if (!this.db || !user) return;
      const playerRef = this.db.collection('players').doc(user.uid);

      try {
        const doc = await playerRef.get();
        const profileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || fallbackDisplayName || user.email.split('@')[0],
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!doc.exists) {
          profileData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          profileData.role = 'explorer';
          profileData.totalPlayTime = 0;
          profileData.maxCustomizationChanges = 5;
          await playerRef.set(profileData, { merge: true });
        } else {
          await playerRef.update(profileData);
        }
      } catch (err) {
        console.warn('[FirebaseService] User profile sync deferred (offline/permission):', err.message);
      }
    }

    async savePlayerData(savePayload) {
      if (!this.currentUser) {
        // Queue for when user signs in
        this._offlineQueue.push({ action: 'save', payload: savePayload, time: Date.now() });
        return { success: false, message: 'No authenticated Firebase user. Queued locally.' };
      }

      const uid = this.currentUser.uid;
      const saveRef = this.db.collection('players').doc(uid).collection('saves').doc('slot_0');
      const playerRef = this.db.collection('players').doc(uid);

      try {
        const enrichedPayload = {
          ...savePayload,
          uid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          clientTime: new Date().toISOString()
        };

        await saveRef.set(enrichedPayload, { merge: true });

        // Update player header info
        await playerRef.set({
          lastSaveTime: firebase.firestore.FieldValue.serverTimestamp(),
          currentRegion: savePayload.data?.region || 'george_town',
          playTime: savePayload.data?.playTime || 0,
          revision: savePayload.revision || 1
        }, { merge: true });

        console.log(`[FirebaseService] Authoritative save stored in Firestore for ${uid} (Rev ${savePayload.revision})`);
        return { success: true, revision: savePayload.revision };
      } catch (err) {
        console.error('[FirebaseService] Firestore save error:', err);
        return { success: false, error: err.message };
      }
    }

    async loadPlayerData() {
      if (!this.currentUser) return null;
      const uid = this.currentUser.uid;
      const saveRef = this.db.collection('players').doc(uid).collection('saves').doc('slot_0');

      try {
        const doc = await saveRef.get();
        if (doc.exists) {
          console.log(`[FirebaseService] Loaded cloud save for ${uid}`);
          return doc.data();
        }
        return null;
      } catch (err) {
        console.error('[FirebaseService] Firestore load error:', err);
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
          await this.savePlayerData(item.payload);
        }
      }
    }
  }

  const instance = new FirebaseService();
  return instance;
});
