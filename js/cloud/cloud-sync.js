// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - BACKGROUND CLOUD SYNC
// Periodic heartbeat synchronization, event-driven debounce, and offline queue.
// ============================================================================

(function() {
    class CloudSyncEngine {
        constructor() {
            this.intervalId = null;
            this.syncIntervalMs = 60000; // 60 seconds
            this.debounceTimer = null;
            this.pendingSync = false;
        }

        start() {
            if (this.intervalId) return;

            this.intervalId = setInterval(() => {
                this.triggerSync();
            }, this.syncIntervalMs);

            // Listen to important progression events for debounced auto-sync
            const events = [
                'achievement_unlocked',
                'story_chapter_completed',
                'side_quest_completed',
                'secret_discovered',
                'collectible_found',
                'wildlife_observed'
            ];

            events.forEach(evtName => {
                window.addEventListener(evtName, () => {
                    this.queueDebouncedSync();
                });
            });

            window.addEventListener('online', () => {
                if (this.pendingSync) {
                    this.triggerSync();
                }
            });
        }

        stop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        queueDebouncedSync(delayMs = 4000) {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.triggerSync();
            }, delayMs);
        }

        async triggerSync() {
            if (!navigator.onLine) {
                this.pendingSync = true;
                return;
            }

            if (window.CloudSaveManager) {
                const res = await window.CloudSaveManager.syncToCloud(false);
                if (res && res.success) {
                    this.pendingSync = false;
                }
            }

            if (window.CloudProfile) {
                window.CloudProfile.syncStats();
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.CloudSyncEngine = new CloudSyncEngine();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CloudSyncEngine };
    }
})();
