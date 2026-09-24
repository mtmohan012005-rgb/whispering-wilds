// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CLOUD SAVE UI
// Cloud save status, manual sync triggers, revision inspector, and download modal.
// ============================================================================

(function() {
    class CloudSaveUI {
        constructor() {
            this.modalElement = null;
            this.isOpen = false;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'cloud-save-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 600px; height: auto; max-height: 85vh;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2>Cloud Save & Sync</h2>
                            <span>Cross-Device Synchronization & Save Backup</span>
                        </div>
                        <button class="codex-close-btn" id="cs-close-btn" aria-label="Close Cloud Save">&times;</button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto;">
                        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212,175,55,0.25); border-radius: 8px; padding: 18px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color:#94a3b8; font-size:13px;">Cloud Save Revision:</span>
                                <strong id="cs-rev-val" style="color:#ffd700; font-size:15px;">Rev 1</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                <span style="color:#94a3b8; font-size:13px;">Last Synchronized:</span>
                                <span id="cs-last-sync" style="color:#f8fafc; font-size:13px;">Never</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color:#94a3b8; font-size:13px;">Customization Used:</span>
                                <span id="cs-cust-val" style="color:#38bdf8; font-size:13px;">0 / 5 Max</span>
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <button id="cs-sync-btn" style="flex:1; background:linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.4)); border:1px solid #ffd700; color:#ffd700; padding:12px; border-radius:6px; cursor:pointer; font-weight:600; font-family:inherit;">
                                &#8635; Sync to Cloud Now
                            </button>
                            <button id="cs-download-btn" style="flex:1; background:rgba(15,23,42,0.6); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; padding:12px; border-radius:6px; cursor:pointer; font-weight:600; font-family:inherit;">
                                &#10515; Restore From Cloud
                            </button>
                        </div>
                        <p id="cs-status-msg" style="font-size:12px; color:#94a3b8; text-align:center; margin:0;"></p>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#cs-close-btn').addEventListener('click', () => this.close());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });

            // Action triggers
            modal.querySelector('#cs-sync-btn').addEventListener('click', async () => {
                const msg = modal.querySelector('#cs-status-msg');
                msg.textContent = 'Syncing save state to cloud...';
                msg.style.color = '#ffd700';

                if (window.CloudSaveManager) {
                    const res = await window.CloudSaveManager.syncToCloud(true);
                    if (res && res.success) {
                        msg.textContent = `Successfully saved! Current Revision: ${res.revision}`;
                        msg.style.color = '#22c55e';
                        this.updateStats();
                    } else {
                        msg.textContent = `Sync failed: ${res?.message || res?.error || 'Unknown'}`;
                        msg.style.color = '#ef4444';
                    }
                }
            });

            modal.querySelector('#cs-download-btn').addEventListener('click', async () => {
                const msg = modal.querySelector('#cs-status-msg');
                msg.textContent = 'Fetching latest cloud save...';
                msg.style.color = '#38bdf8';

                if (window.CloudSaveManager) {
                    const ok = await window.CloudSaveManager.loadFromCloud();
                    if (ok) {
                        msg.textContent = 'Cloud save state restored!';
                        msg.style.color = '#22c55e';
                        this.updateStats();
                    } else {
                        msg.textContent = 'Failed to load cloud save.';
                        msg.style.color = '#ef4444';
                    }
                }
            });
        }

        open() {
            this.init();
            this.updateStats();
            this.modalElement.style.display = 'flex';
            this.isOpen = true;
        }

        close() {
            if (!this.modalElement) return;
            this.modalElement.style.display = 'none';
            this.isOpen = false;
        }

        updateStats() {
            const revEl = this.modalElement.querySelector('#cs-rev-val');
            const syncEl = this.modalElement.querySelector('#cs-last-sync');
            const custEl = this.modalElement.querySelector('#cs-cust-val');

            if (window.CloudSaveManager) {
                revEl.textContent = `Rev ${window.CloudSaveManager.currentRevision}`;
                syncEl.textContent = window.CloudSaveManager.lastSyncTimestamp ? new Date(window.CloudSaveManager.lastSyncTimestamp).toLocaleTimeString() : 'Never';
            }

            if (window.GameState) {
                custEl.textContent = `${window.GameState.customizationChangesUsed || 0} / 5 Max`;
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.CloudSaveUI = new CloudSaveUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CloudSaveUI };
    }
})();
