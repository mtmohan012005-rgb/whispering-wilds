// ============================================================================
// THE WHISPERING WILDS - CLOUD SAVE SYSTEM FACADE
// Bridges existing CloudSaveManager with lifecycle state, conflict UI, and offline fallback.
// ============================================================================

(function () {
  'use strict';

  class CloudSaveSystemFacade {
    constructor() {
      this._offlineQueue = [];
      this._isOffline = !navigator.onLine;

      window.addEventListener('online', () => {
        this._isOffline = false;
        this.flushOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this._isOffline = true;
      });
    }

    get manager() {
      if (!window.cloudSaveManager && window.CloudSaveManager) {
        window.cloudSaveManager = new window.CloudSaveManager();
      }
      return window.cloudSaveManager;
    }

    async syncToCloud(force = false) {
      if (this._isOffline) {
        console.log('[CloudSaveSystem] Offline mode: queuing sync.');
        this._offlineQueue.push({ type: 'sync', timestamp: Date.now() });
        return { success: false, offline: true, message: 'Offline mode — progress saved locally.' };
      }

      if (this.manager) {
        return await this.manager.syncToCloud(force);
      }
      return { success: false, message: 'CloudSaveManager unavailable' };
    }

    resolveConflict(choice, localPayload, cloudPayload) {
      // choice: 'local' | 'cloud' | 'merge'
      if (window.cloudConflictResolver && typeof window.cloudConflictResolver.resolve === 'function') {
        return window.cloudConflictResolver.resolve(choice, localPayload, cloudPayload);
      }
      if (choice === 'local') return localPayload;
      return cloudPayload;
    }

    async flushOfflineQueue() {
      if (this._offlineQueue.length === 0) return;
      console.log(`[CloudSaveSystem] Online restored. Flushing ${this._offlineQueue.length} queued sync(s).`);
      this._offlineQueue = [];
      if (this.manager) {
        await this.manager.syncToCloud(true);
      }
    }
  }

  window.CloudSaveSystem = new CloudSaveSystemFacade();
  window.cloudSaveSystem = window.CloudSaveSystem;
})();
