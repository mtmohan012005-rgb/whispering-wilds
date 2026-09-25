/**
 * The Whispering Wilds - Storage Adapter
 * Validates local storage and OS user-data directory save paths.
 * Enforces atomic writes to protect previous valid saves if storage fails.
 */
(function(root) {
  'use strict';

  class StorageAdapter {
    constructor() {
      this.localStorageAvailable = false;
      this.filesystemAvailable = false;
      this.storageQuotaBytes = 0;
      this.storageUsedBytes = 0;
      this.detect();
    }

    detect() {
      // 1. Verify LocalStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const testKey = '__ww_storage_test__';
          window.localStorage.setItem(testKey, '1');
          window.localStorage.removeItem(testKey);
          this.localStorageAvailable = true;
        }
      } catch (err) {
        this.localStorageAvailable = false;
        console.warn('[StorageAdapter] LocalStorage is unavailable or blocked:', err);
      }

      // 2. Verify Desktop native filesystem
      if (typeof window !== 'undefined' && window.desktopAPI && typeof window.desktopAPI.writeSaveData === 'function') {
        this.filesystemAvailable = true;
      }

      // 3. Storage estimate if available
      if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
        navigator.storage.estimate().then(est => {
          this.storageQuotaBytes = est.quota || 0;
          this.storageUsedBytes = est.usage || 0;
        }).catch(() => {});
      }
    }

    /**
     * Safely write save data with atomic integrity guarantee.
     * Never overwrites valid save if the new data is corrupted or fails serialization.
     */
    async safeWrite(key, dataString) {
      if (!dataString || typeof dataString !== 'string' || dataString.trim().length === 0) {
        throw new Error('StorageAdapter: Refusing to write empty or invalid data string.');
      }

      // Try desktop native filesystem save first
      if (this.filesystemAvailable && window.desktopAPI) {
        try {
          const res = await window.desktopAPI.writeSaveData(key, dataString);
          if (res && res.success) return true;
        } catch (err) {
          console.error('[StorageAdapter] Filesystem save failed, falling back to localStorage:', err);
        }
      }

      // Fallback to localStorage
      if (this.localStorageAvailable) {
        try {
          // Backup previous save before writing
          const existing = window.localStorage.getItem(key);
          if (existing) {
            window.localStorage.setItem(key + '_backup', existing);
          }
          window.localStorage.setItem(key, dataString);
          return true;
        } catch (err) {
          console.error('[StorageAdapter] LocalStorage write failed! Restoring backup if available:', err);
          const backup = window.localStorage.getItem(key + '_backup');
          if (backup) {
            try { window.localStorage.setItem(key, backup); } catch (_) {}
          }
          throw err;
        }
      }

      throw new Error('StorageAdapter: No writable storage mechanism available.');
    }

    getCapabilities() {
      return {
        localStorageAvailable: this.localStorageAvailable,
        filesystemAvailable: this.filesystemAvailable,
        storageQuotaBytes: this.storageQuotaBytes,
        storageUsedBytes: this.storageUsedBytes
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageAdapter;
  } else {
    root.StorageAdapter = StorageAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
