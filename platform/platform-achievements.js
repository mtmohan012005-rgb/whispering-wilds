/**
 * PlatformAchievements - Platform Achievement Dispatcher & Offline Queue
 * Connects authoritative AchievementSystem to platform providers (Steam/Epic/GOG/Generic).
 * Enforces one-time unlocks, offline queuing, and strict customization ceiling preservation.
 */

(function(root) {
  class PlatformAchievements {
    constructor(provider, session) {
      this.provider = provider;
      this.session = session;
      this.unlockedIds = new Set();
      this.pendingOfflineQueue = [];
      this.listeners = new Set();
    }

    init(initialUnlocked = []) {
      this.unlockedIds = new Set(initialUnlocked);
      this._loadPendingQueue();
      return this;
    }

    _loadPendingQueue() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('whispering_wilds_pending_achievements');
          if (raw) {
            this.pendingOfflineQueue = JSON.parse(raw);
          }
        }
      } catch (e) {}
    }

    _savePendingQueue() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('whispering_wilds_pending_achievements', JSON.stringify(this.pendingOfflineQueue));
        }
      } catch (e) {}
    }

    async unlock(achievementId, options = {}) {
      if (!achievementId) return { success: false, error: 'Invalid achievement ID' };

      // Invariant check: Achievements can never increase customizationChangesUsed past 5
      if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
        if (window.GameState.player.customizationChangesUsed > 5) {
          window.GameState.player.customizationChangesUsed = 5;
        }
      }

      // Check if already unlocked on platform
      if (this.unlockedIds.has(achievementId)) {
        return { success: true, alreadyUnlocked: true, achievementId };
      }

      this.unlockedIds.add(achievementId);

      // Check if platform provider is available and online
      const isOnline = this.session && this.session.isOnline;
      if (!isOnline || !this.provider) {
        // Queue for offline sync
        if (!this.pendingOfflineQueue.includes(achievementId)) {
          this.pendingOfflineQueue.push(achievementId);
          this._savePendingQueue();
        }
        this._notifyListeners({ achievementId, status: 'QUEUED_OFFLINE' });
        return { success: true, queuedOffline: true, achievementId };
      }

      try {
        const res = await this.provider.unlockAchievement(achievementId);
        this._notifyListeners({ achievementId, status: 'UNLOCKED_PLATFORM', result: res });
        return { success: true, achievementId, providerResult: res };
      } catch (err) {
        // Fallback to queue
        if (!this.pendingOfflineQueue.includes(achievementId)) {
          this.pendingOfflineQueue.push(achievementId);
          this._savePendingQueue();
        }
        return { success: false, error: err.message, queuedOffline: true };
      }
    }

    async syncPendingQueue() {
      if (!this.session || !this.session.isOnline || !this.provider) {
        return { synced: 0, pending: this.pendingOfflineQueue.length };
      }

      const queue = [...this.pendingOfflineQueue];
      let syncedCount = 0;

      for (const achId of queue) {
        try {
          await this.provider.unlockAchievement(achId);
          syncedCount++;
          const idx = this.pendingOfflineQueue.indexOf(achId);
          if (idx !== -1) {
            this.pendingOfflineQueue.splice(idx, 1);
          }
        } catch (e) {
          break; // Stop syncing on network error
        }
      }

      this._savePendingQueue();
      return { synced: syncedCount, pending: this.pendingOfflineQueue.length };
    }

    isUnlocked(achievementId) {
      return this.unlockedIds.has(achievementId);
    }

    getUnlockedList() {
      return Array.from(this.unlockedIds);
    }

    addListener(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    _notifyListeners(data) {
      this.listeners.forEach(fn => {
        try { fn(data); } catch (e) {}
      });
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformAchievements;
  } else {
    root.PlatformAchievements = PlatformAchievements;
  }
})(typeof window !== 'undefined' ? window : global);
