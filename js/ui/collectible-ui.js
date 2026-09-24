// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - COLLECTIBLE UI
// Categorized viewer for field notes, craft patterns, archival documents & maps.
// ============================================================================

(function() {
    class CollectibleUI {
        constructor() {
            this.modalElement = null;
            this.isOpen = false;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'collectible-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 900px;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2>Field Archives & Craft Blueprints</h2>
                            <span>Documents, Botanical Studies & Traditional Patterns</span>
                        </div>
                        <button class="codex-close-btn" id="coll-close-btn" aria-label="Close Collectibles">&times;</button>
                    </div>
                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: rgba(0,0,0,0.3); padding: 12px 18px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.2);">
                            <div>
                                <span style="color:#94a3b8; font-size:13px;">Archived Collectibles:</span>
                                <strong id="coll-count-stat" style="color:#38bdf8; margin-left:6px; font-size:16px;">0 / 8</strong>
                            </div>
                            <div style="font-size:12px; color:#cbd5e1;">Found across historical structures, ruins and botanical study spots.</div>
                        </div>
                        <div id="coll-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#coll-close-btn').addEventListener('click', () => this.close());
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
            const grid = this.modalElement.querySelector('#coll-grid');
            const countEl = this.modalElement.querySelector('#coll-count-stat');
            grid.innerHTML = '';

            const sys = window.CollectibleSystem;
            if (!sys) {
                grid.innerHTML = '<p style="color:#94a3b8;">Collectible data unavailable.</p>';
                return;
            }

            const items = sys.getAllCollectibles();
            const foundCount = sys.foundCount;
            countEl.textContent = `${foundCount} / ${items.length}`;

            items.forEach(c => {
                const card = document.createElement('div');
                card.style.background = c.found ? 'rgba(15, 23, 42, 0.8)' : 'rgba(10, 15, 29, 0.4)';
                card.style.border = c.found ? '1px solid rgba(56,189,248,0.4)' : '1px dashed rgba(100,116,139,0.3)';
                card.style.borderRadius = '8px';
                card.style.padding = '14px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.justifyContent = 'space-between';

                const catLabel = c.category.replace('_', ' ').toUpperCase();

                if (c.found) {
                    card.innerHTML = `
                        <div>
                            <div style="font-size:11px; color:#38bdf8; text-transform:uppercase; margin-bottom:4px;">${catLabel} &bull; ${c.region.replace('_', ' ').toUpperCase()}</div>
                            <h3 style="margin:0 0 6px 0; font-size:15px; color:#f8fafc;">${c.name}</h3>
                            <p style="font-size:12px; color:#cbd5e1; line-height:1.5; margin:0 0 8px 0;">${c.description}</p>
                            <div style="font-size:11px; color:#94a3b8; font-style:italic; border-left:2px solid #38bdf8; padding-left:8px; margin-bottom:8px;">${c.loreSnippet}</div>
                        </div>
                        <div style="font-size:11px; color:#22c55e; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
                            &#10003; Archived in Journal
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div>
                            <div style="font-size:11px; color:#64748b; text-transform:uppercase; margin-bottom:4px;">${catLabel} &bull; ${c.region.replace('_', ' ').toUpperCase()}</div>
                            <h3 style="margin:0 0 6px 0; font-size:14px; color:#94a3b8;">Undiscovered Archive</h3>
                            <p style="font-size:12px; color:#64748b; line-height:1.4; margin:0 0 8px 0;">Explore the region to locate this historical artifact.</p>
                        </div>
                        <div style="font-size:11px; color:#64748b; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
                            &#9675; Not yet recovered
                        </div>
                    `;
                }

                grid.appendChild(card);
            });
        }
    }

    if (typeof window !== 'undefined') {
        window.CollectibleUI = new CollectibleUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CollectibleUI };
    }
})();
