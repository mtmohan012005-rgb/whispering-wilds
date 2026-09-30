// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CLOUD SAVE MANAGER
// Authoritative save snapshot generation, revision tracking, conflict routing,
// and state restoration into GameState and game subsystems.
// ============================================================================

(function() {
    class CloudSaveManager {
        constructor() {
            this.currentRevision = 1;
            // Separate revision counter for the Firebase/server-authoritative
            // path. Kept apart from currentRevision so the legacy
            // CloudSaveClient numbering is not disturbed.
            this.firebaseRevision = 0;
            this.lastSyncTimestamp = null;
            this.isSyncing = false;
        }

        buildFullSavePayload() {
            if (!window.GameState) return null;

            // Enforce customization limit
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            const data = {
                version: 2,
                timestamp: new Date().toISOString(),
                playTime: window.GameState.playTime || 0,
                currency: window.GameState.currency || 0,
                position: window.GameState.position || { x: 0, y: 0, z: 0 },
                region: window.GameState.region || 'george_town',
                customizationChangesUsed: Math.min(window.GameState.customizationChangesUsed || 0, 5),
                characterCustomization: window.GameState.characterCustomization || {},
                wardrobe: window.GameState.wardrobe || {},
                inventory: window.GameState.inventory || [],
                
                // New Phase 1 & 2 Subsystems
                achievements: window.AchievementSystem ? window.AchievementSystem.serialize() : (window.GameState.achievements || {}),
                codex: window.CodexSystem ? window.CodexSystem.serialize() : (window.GameState.codex || {}),
                discoveries: window.DiscoveryProgression ? window.DiscoveryProgression.serialize() : (window.GameState.discoveries || {}),
                story: window.StoryContentSystem ? window.StoryContentSystem.serialize() : (window.GameState.story || {}),
                sideQuests: window.SideQuestSystem ? window.SideQuestSystem.serialize() : (window.GameState.sideQuests || {}),
                secrets: window.SecretDiscoverySystem ? window.SecretDiscoverySystem.serialize() : (window.GameState.secrets || {}),
                collectibles: window.CollectibleSystem ? window.CollectibleSystem.serialize() : (window.GameState.collectibles || {}),
                replay: window.ReplaySystem ? window.ReplaySystem.serialize() : (window.GameState.replay || {})
            };

            return {
                revision: this.currentRevision,
                clientTimestamp: new Date().toISOString(),
                data: data
            };
        }

        async syncToCloud(force = false) {
            if (this.isSyncing) return { success: false, message: 'Sync in progress' };
            this.isSyncing = true;

            try {
                const payload = this.buildFullSavePayload();
                if (!payload) {
                    this.isSyncing = false;
                    return { success: false, message: 'GameState not ready' };
                }

                // 1. Prioritize server-authoritative Firebase persistence.
                //    The server commits inside a transaction; a stale base
                //    revision returns 409 SAVE_CONFLICT and is routed to the
                //    merge UI rather than overwriting newer cloud data.
                if (window.FirebaseService && window.FirebaseService.isAuthenticated()) {
                    const fbRes = await window.FirebaseService.savePlayerData(payload, {
                        baseRevision: this.firebaseRevision
                    });
                    if (fbRes && fbRes.success) {
                        this.firebaseRevision = fbRes.revision || (this.firebaseRevision + 1);
                        this.currentRevision = this.firebaseRevision;
                        this.lastSyncTimestamp = new Date().toISOString();
                        this.isSyncing = false;
                        if (window.NotificationSystem) {
                            window.NotificationSystem.show(`Synced to Firebase Firestore (Rev ${this.firebaseRevision})`, 'success');
                        }
                        return { success: true, revision: this.firebaseRevision, provider: 'firebase' };
                    }
                    if (fbRes && fbRes.code === 'SAVE_CONFLICT') {
                        this.isSyncing = false;
                        if (window.SaveConflictUI) {
                            window.SaveConflictUI.prompt(
                                payload.data,
                                { revision: fbRes.currentRevision, data: fbRes.remoteData || null },
                                fbRes.currentRevision
                            );
                        }
                        return { conflict: true, code: 'SAVE_CONFLICT', currentRevision: fbRes.currentRevision };
                    }
                }

                // 2. Fallback to CloudSaveClient (local/Render backend)
                if (window.CloudSaveClient) {
                    const res = await window.CloudSaveClient.saveGame(payload, force);

                    if (res.status === 409 && res.data.conflict) {
                        this.isSyncing = false;
                        if (window.SaveConflictUI) {
                            window.SaveConflictUI.prompt(payload.data, res.data.cloudSave, res.data.serverRevision);
                        }
                        return { conflict: true, data: res.data };
                    }

                    if (res.ok && res.data.success) {
                        this.currentRevision = res.data.revision;
                        this.lastSyncTimestamp = res.data.serverTimestamp;
                        this.isSyncing = false;

                        if (window.NotificationSystem) {
                            window.NotificationSystem.show(`Game synced to Cloud (Rev ${this.currentRevision})`, 'success');
                        }
                        return { success: true, revision: this.currentRevision };
                    }
                }

                this.isSyncing = false;
                return { success: false, message: 'Cloud save synced locally (offline ready).' };
            } catch (err) {
                this.isSyncing = false;
                return { success: false, error: err.message };
            }
        }

        async loadFromCloud() {
            // 1. Check Firebase Firestore first
            if (window.FirebaseService && window.FirebaseService.isAuthenticated()) {
                const fbSave = await window.FirebaseService.loadPlayerData();
                if (fbSave && fbSave.data) {
                    const storedRevision = Number.isInteger(fbSave.revision) ? fbSave.revision : 0;
                    this.firebaseRevision = storedRevision;
                    this.currentRevision = storedRevision;
                    this.lastSyncTimestamp = fbSave.clientTime || new Date().toISOString();
                    this.applySaveData(fbSave.data);
                    console.log(`[CloudSaveManager] Restored save from Firebase Firestore (Rev ${storedRevision})`);
                    return true;
                }
            }

            // 2. Fallback to CloudSaveClient
            if (!window.CloudSaveClient) return false;

            const res = await window.CloudSaveClient.getLatestSave();
            if (res.ok && res.data.save) {
                const cloudSave = res.data.save;
                this.currentRevision = cloudSave.revision || 1;
                this.lastSyncTimestamp = cloudSave.server_timestamp;
                this.applySaveData(cloudSave.data);
                return true;
            }
            return false;
        }

        applySaveData(saveData) {
            if (!saveData || !window.GameState) return false;

            // Guard customization ceiling
            if (saveData.customizationChangesUsed > 5) {
                saveData.customizationChangesUsed = 5;
            }

            // Restore GameState core
            if (saveData.currency !== undefined) window.GameState.currency = saveData.currency;
            if (saveData.playTime !== undefined) window.GameState.playTime = saveData.playTime;
            if (saveData.customizationChangesUsed !== undefined) {
                window.GameState.customizationChangesUsed = Math.min(saveData.customizationChangesUsed, 5);
            }
            if (saveData.characterCustomization) window.GameState.characterCustomization = saveData.characterCustomization;
            if (saveData.inventory) window.GameState.inventory = saveData.inventory;

            // Restore Subsystems
            if (window.AchievementSystem && saveData.achievements) {
                window.AchievementSystem.init(saveData.achievements);
            }
            if (window.CodexSystem && saveData.codex) {
                window.CodexSystem.init(saveData.codex);
            }
            if (window.DiscoveryProgression && saveData.discoveries) {
                window.DiscoveryProgression.init(saveData.discoveries);
            }
            if (window.StoryContentSystem && saveData.story) {
                window.StoryContentSystem.init(saveData.story);
            }
            if (window.SideQuestSystem && saveData.sideQuests) {
                window.SideQuestSystem.init(saveData.sideQuests);
            }
            if (window.SecretDiscoverySystem && saveData.secrets) {
                window.SecretDiscoverySystem.init(saveData.secrets);
            }
            if (window.CollectibleSystem && saveData.collectibles) {
                window.CollectibleSystem.init(saveData.collectibles);
            }
            if (window.ReplaySystem && saveData.replay) {
                window.ReplaySystem.init(saveData.replay);
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.show('Cloud save state loaded successfully.', 'info');
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('cloud_save_restored', { detail: saveData }));
            }
            return true;
        }
    }

    if (typeof window !== 'undefined') {
        window.CloudSaveManager = new CloudSaveManager();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CloudSaveManager };
    }
})();
