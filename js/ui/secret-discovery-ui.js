// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SECRET DISCOVERY UI
// Spatial secret log, discovered hidden rooms, and regional hints.
// ============================================================================

(function() {
    class SecretDiscoveryUI {
        constructor() {
            this.modalElement = null;
            this.isOpen = false;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'secret-discovery-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 860px;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2>Hidden Chambers & High Viewpoints</h2>
                            <span>Spatial Secrets, Forgotten Rooms & Ancient Relicts</span>
                        </div>
                        <button class="codex-close-btn" id="sec-close-btn" aria-label="Close Secrets">&times;</button>
                    </div>
                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: rgba(0,0,0,0.3); padding: 12px 18px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.2);">
                            <div>
                                <span style="color:#94a3b8; font-size:13px;">Secrets Uncovered:</span>
                                <strong id="secrets-count-stat" style="color:#ffd700; margin-left:6px; font-size:16px;">0 / 7</strong>
                            </div>
                            <div style="font-size:12px; color:#cbd5e1;">Explore world geometry to trigger physical proximity discoveries.</div>
                        </div>
                        <div id="secrets-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px;">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#sec-close-btn').addEventListener('click', () => this.close());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        open() {
            this.init();
            this.renderGrid();
            this.modalElement.style.display = 'flex';
            this.isOpen = true;
        }

        close() {
            if (!this.modalElement) return;
            this.modalElement.style.display = 'none';
            this.isOpen = false;
        }

        renderGrid() {
            const grid = this.modalElement.querySelector('#secrets-grid');
            const countEl = this.modalElement.querySelector('#secrets-count-stat');
            grid.innerHTML = '';

            const sys = window.SecretDiscoverySystem;
            if (!sys) {
                grid.innerHTML = '<p style="color:#94a3b8;">Secrets data unavailable.</p>';
                return;
            }

            const secrets = sys.getAllSecrets();
            const discoveredCount = sys.discoveredCount;
            countEl.textContent = `${discoveredCount} / ${secrets.length}`;

            secrets.forEach(sec => {
                const card = document.createElement('div');
                card.style.background = sec.discovered ? 'rgba(15, 23, 42, 0.75)' : 'rgba(10, 15, 29, 0.45)';
                card.style.border = sec.discovered ? '1px solid rgba(212,175,55,0.4)' : '1px dashed rgba(100,116,139,0.3)';
                card.style.borderRadius = '8px';
                card.style.padding = '14px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.justifyContent = 'space-between';

                if (sec.discovered) {
                    card.innerHTML = `
                        <div>
                            <div style="font-size:11px; color:#ffd700; text-transform:uppercase; margin-bottom:4px;">${sec.region.replace('_', ' ').toUpperCase()}</div>
                            <h3 style="margin:0 0 8px 0; font-size:15px; color:#f8fafc;">${sec.name}</h3>
                            <p style="font-size:12px; color:#cbd5e1; line-height:1.5; margin:0 0 10px 0;">${sec.loreDescription}</p>
                        </div>
                        <div style="font-size:11px; color:#22c55e; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
                            &#10003; Discovered (+${sec.xpReward} XP)
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div>
                            <div style="font-size:11px; color:#64748b; text-transform:uppercase; margin-bottom:4px;">${sec.region.replace('_', ' ').toUpperCase()}</div>
                            <h3 style="margin:0 0 8px 0; font-size:14px; color:#94a3b8;">Undiscovered Chamber</h3>
                            <p style="font-size:12px; color:#64748b; font-style:italic; line-height:1.4; margin:0 0 10px 0;">"${sec.hint}"</p>
                        </div>
                        <div style="font-size:11px; color:#eab308; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
                            &#128065; Hidden in the landscape
                        </div>
                    `;
                }

                grid.appendChild(card);
            });
        }
    }

    if (typeof window !== 'undefined') {
        window.SecretDiscoveryUI = new SecretDiscoveryUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SecretDiscoveryUI };
    }
})();
