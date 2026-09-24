// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SAVE CONFLICT RESOLUTION UI
// Side-by-side visual diff inspector and resolution chooser (Local / Cloud / Merge).
// ============================================================================

(function() {
    class SaveConflictUI {
        constructor() {
            this.modalElement = null;
            this.currentLocal = null;
            this.currentCloud = null;
            this.cloudRevision = null;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'save-conflict-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 760px; height: auto;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2 style="color:#ef4444;">Save State Conflict Detected</h2>
                            <span>Choose how to reconcile conflicting save files</span>
                        </div>
                    </div>
                    <div style="padding: 24px; overflow-y: auto;">
                        <p style="color:#cbd5e1; font-size:14px; margin-top:0;">
                            A newer save file was found on the cloud (Rev <span id="conf-cloud-rev"></span>) than your current session. Please select which progression state to retain:
                        </p>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
                            <!-- Local Card -->
                            <div style="background: rgba(15,23,42,0.8); border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 16px;">
                                <h3 style="color:#ffd700; margin:0 0 12px 0; font-size:16px;">Local Machine Save</h3>
                                <div id="conf-local-stats" style="font-size:13px; color:#cbd5e1; line-height:1.8;">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>

                            <!-- Cloud Card -->
                            <div style="background: rgba(15,23,42,0.8); border: 1px solid rgba(56,189,248,0.3); border-radius: 8px; padding: 16px;">
                                <h3 style="color:#38bdf8; margin:0 0 12px 0; font-size:16px;">Cloud Server Save</h3>
                                <div id="conf-cloud-stats" style="font-size:13px; color:#cbd5e1; line-height:1.8;">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button id="conf-btn-merge" style="flex:2; background:linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.6)); border:1px solid #22c55e; color:#f0fdf4; padding:12px; border-radius:6px; cursor:pointer; font-weight:bold; font-family:inherit;">
                                &#10024; Smart Merge (Recommended)
                            </button>
                            <button id="conf-btn-local" style="flex:1; background:rgba(212,175,55,0.15); border:1px solid #ffd700; color:#ffd700; padding:12px; border-radius:6px; cursor:pointer; font-weight:600; font-family:inherit;">
                                Keep Local
                            </button>
                            <button id="conf-btn-cloud" style="flex:1; background:rgba(56,189,248,0.15); border:1px solid #38bdf8; color:#38bdf8; padding:12px; border-radius:6px; cursor:pointer; font-weight:600; font-family:inherit;">
                                Keep Cloud
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#conf-btn-local').addEventListener('click', () => this.resolve('local'));
            modal.querySelector('#conf-btn-cloud').addEventListener('click', () => this.resolve('cloud'));
            modal.querySelector('#conf-btn-merge').addEventListener('click', () => this.resolve('merge'));
        }

        prompt(localData, cloudSaveRecord, cloudRevision) {
            this.init();
            this.currentLocal = localData;
            this.currentCloud = cloudSaveRecord.data || cloudSaveRecord;
            this.cloudRevision = cloudRevision || cloudSaveRecord.revision || 1;

            this.modalElement.querySelector('#conf-cloud-rev').textContent = this.cloudRevision;

            const localStats = this.modalElement.querySelector('#conf-local-stats');
            const cloudStats = this.modalElement.querySelector('#conf-cloud-stats');

            const diff = window.CloudConflictEngine 
                ? window.CloudConflictEngine.compare(this.currentLocal, this.currentCloud)
                : null;

            if (diff) {
                localStats.innerHTML = `
                    <div>Story Progress: Chapter ${diff.chapter.local + 1}</div>
                    <div>Copper Coins: <strong>${diff.currency.local}</strong></div>
                    <div>Achievements: ${diff.achievements.local}</div>
                    <div>Codex Entries: ${diff.codex.local}</div>
                    <div>Customizations: ${diff.customizationChangesUsed.local} / 5</div>
                `;

                cloudStats.innerHTML = `
                    <div>Story Progress: Chapter ${diff.chapter.cloud + 1}</div>
                    <div>Copper Coins: <strong>${diff.currency.cloud}</strong></div>
                    <div>Achievements: ${diff.achievements.cloud}</div>
                    <div>Codex Entries: ${diff.codex.cloud}</div>
                    <div>Customizations: ${diff.customizationChangesUsed.cloud} / 5</div>
                `;
            }

            this.modalElement.style.display = 'flex';
        }

        async resolve(strategy) {
            this.modalElement.style.display = 'none';

            if (strategy === 'local') {
                if (window.CloudSaveManager) {
                    await window.CloudSaveManager.syncToCloud(true);
                }
            } else if (strategy === 'cloud') {
                if (window.CloudSaveManager) {
                    window.CloudSaveManager.applySaveData(this.currentCloud);
                }
            } else if (strategy === 'merge') {
                if (window.CloudConflictEngine && window.CloudSaveManager) {
                    const mergedData = window.CloudConflictEngine.createMergedPayload(this.currentLocal, this.currentCloud);
                    window.CloudSaveManager.applySaveData(mergedData);
                    await window.CloudSaveManager.syncToCloud(true);
                }
            }

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`Save conflict resolved via ${strategy.toUpperCase()}`, 'success');
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.SaveConflictUI = new SaveConflictUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SaveConflictUI };
    }
})();
