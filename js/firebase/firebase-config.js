/**
 * The Whispering Wilds (Kaattu Vazhi) - Firebase Configuration
 * Project: debug-c26abc33
 * Services: Firebase Authentication (Email/Password), Cloud Firestore Database
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.FirebaseConfig = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FIREBASE_CONFIG = {
    projectId: 'debug-c26abc33',
    authDomain: 'debug-c26abc33.firebaseapp.com',
    storageBucket: 'debug-c26abc33.firebasestorage.app',
    // Standard web configuration for debug-c26abc33
    appId: '1:debug-c26abc33:web:whispering-wilds-production'
  };

  return {
    config: FIREBASE_CONFIG,
    isConfigured: () => Boolean(FIREBASE_CONFIG.projectId)
  };
});
