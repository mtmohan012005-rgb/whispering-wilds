// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CODEX UI MODAL
// Full-screen encyclopedia window with 9 sections, live search, favorites,
// distinct cultural heritage presentation, and notes.
// ============================================================================

(function() {
    class CodexUI {
        constructor() {
            this.container = null;
            this.currentSection = 'ALL';
            this.currentStatusFilter = 'ALL';
            this.searchQuery = '';
            this.selectedEntryId = null;
            this.isOpen = false;

            this.initDOM();
        }

        initDOM() {
            if (document.getElementById('codex-modal-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'codex-modal-overlay';
            overlay.className = 'codex-modal-overlay';
            overlay.style.display = 'none';

            overlay.innerHTML = `
                <div class="codex-window">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2>காட்டு வழி வரலாற்றுப் பதிவேடு</h2>
                            <span>The Whispering Wilds • Discovery Codex & Encyclopedia</span>
                        </div>
                        <div style="display: flex; gap: 14px; align-items: center;">
                            <div class="codex-search-bar">
                                <span style="color: #ffd700; font-size: 14px;">🔍</span>
                                <input type="text" id="codex-search-input" class="codex-search-input" placeholder="Search entries (Ctrl+F)...">
                            </div>
                            <button id="codex-close-btn" class="close-btn" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">&times;</button>
                        </div>
                    </div>
                    <div class="codex-body">
                        <div class="codex-sidebar">
                            <button class="codex-nav-btn active" data-section="ALL">
                                <span>🌐 ALL ENTRIES</span>
                                <span id="codex-count-all" class="codex-badge-count">0</span>
                            </button>
                            <button class="codex-nav-btn" data-section="PLACES">
                                <span>🏛️ PLACES</span>
                                <span id="codex-count-places" class="codex-badge-count">0</span>
                            </button>
                            <button class="codex-nav-btn" data-section="WILDLIFE">
                                <span>🐾 WILDLIFE</span>
                                <span id="codex-count-wildlife" class="codex-badge-count">0</span>
                            </button>
                            <button class="codex-nav-btn" data-section="CULTURE">
                                <span>📜 CULTURE</span>
                                <span id="codex-count-culture" class="codex-badge-count">0</span>
                            </button>
                            <button class="codex-nav-btn" data-section="FOOD">
                                <span>🍲 FOOD</span>
                                <span id="codex-count-food" class="codex-badge-count">0</span>
                            </button>
                            <button class="codex-nav-btn" data-section="CRAFT">
                                <span>🔨 CRAFT</span>
                                <span id="codex-count-craft" class="codex-badge-count">0</span>
                            </button>
                            <button class="codex-nav-btn" data-section="CHARACTERS">
                                <span>👥 CHARACTERS</span>
                                <span id="codex-count-characters" class="codex-badge-count">0</span>
                            </button>
                            <div style="margin-top: auto; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <button class="codex-nav-btn" data-filter="FAVORITES" style="padding: 6px 0;">⭐ Favorites Only</button>
                            </div>
                        </div>
                        <div class="codex-content-pane">
                            <div id="codex-entries-list" class="codex-entries-list"></div>
                            <div id="codex-detail-pane" class="codex-detail-pane">
                                <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #64748b;">
                                    <span>Select an entry on the left to view documentation.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            this.container = overlay;
            this.bindEvents();
        }

        bindEvents() {
            if (!this.container) return;

            document.getElementById('codex-close-btn')?.addEventListener('click', () => this.close());
            
            // Search input with debounce
            const searchInput = document.getElementById('codex-search-input');
            searchInput?.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderEntriesList();
            });

            // Section buttons
            const navBtns = this.container.querySelectorAll('.codex-nav-btn');
            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    navBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    if (btn.dataset.section) {
                        this.currentSection = btn.dataset.section;
                        this.currentStatusFilter = 'ALL';
                    } else if (btn.dataset.filter === 'FAVORITES') {
                        this.currentStatusFilter = 'FAVORITES';
                    }
                    this.renderEntriesList();
                });
            });

            // Global Ctrl+F listener when open
            window.addEventListener('keydown', (e) => {
                if (this.isOpen && e.ctrlKey && e.code === 'KeyF') {
                    e.preventDefault();
                    searchInput?.focus();
                }
            });
        }

        open() {
            if (!this.container) this.initDOM();
            this.isOpen = true;
            this.container.style.display = 'flex';

            this.updateBadgeCounts();
            this.renderEntriesList();
        }

        close() {
            if (!this.container) return;
            this.isOpen = false;
            this.container.style.display = 'none';
        }

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }

        updateBadgeCounts() {
            if (!window.codexSystem) return;
            const counts = window.codexSystem.getSectionCounts();

            let totalDiscovered = 0;
            let grandTotal = 0;

            for (const [sec, c] of Object.entries(counts)) {
                totalDiscovered += c.discovered;
                grandTotal += c.total;
                const badge = document.getElementById(`codex-count-${sec.toLowerCase()}`);
                if (badge) badge.textContent = `${c.discovered} / ${c.total}`;
            }

            const allBadge = document.getElementById('codex-count-all');
            if (allBadge) allBadge.textContent = `${totalDiscovered} / ${grandTotal}`;
        }

        renderEntriesList() {
            const listEl = document.getElementById('codex-entries-list');
            if (!listEl || !window.codexSystem) return;

            const entries = window.codexSystem.filterEntries({
                section: this.currentSection,
                status: this.currentStatusFilter,
                search: this.searchQuery
            });

            listEl.innerHTML = '';
            if (entries.length === 0) {
                listEl.innerHTML = '<div style="color: #64748b; padding: 16px;">No entries match criteria.</div>';
                return;
            }

            entries.forEach(entry => {
                const card = document.createElement('div');
                card.className = `codex-card ${entry.id === this.selectedEntryId ? 'selected' : ''}`;
                
                const isDisc = entry.discovered;
                const title = isDisc ? entry.title : 'UNDISCOVERED ENTRY';
                const tamil = isDisc && entry.tamilTitle ? entry.tamilTitle : 'அறியப்படாத பதிவு';
                const region = entry.region ? entry.region.replace('_', ' ').toUpperCase() : 'UNKNOWN';

                card.innerHTML = `
                    <div class="codex-card-header">
                        <span class="codex-card-title">${isDisc ? '📖 ' : '🔒 '}${title}</span>
                        ${entry.isFavorite ? '<span style="color: #ffd700;">★</span>' : ''}
                    </div>
                    <div class="codex-card-tamil">${tamil}</div>
                    <div class="codex-card-region">${region}</div>
                `;

                card.addEventListener('click', () => {
                    this.selectedEntryId = entry.id;
                    this.container.querySelectorAll('.codex-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.renderDetailPane(entry);
                });

                listEl.appendChild(card);
            });

            // Auto-select first if none selected
            if (!this.selectedEntryId && entries.length > 0) {
                this.selectedEntryId = entries[0].id;
                this.renderDetailPane(entries[0]);
            }
        }

        renderDetailPane(entry) {
            const pane = document.getElementById('codex-detail-pane');
            if (!pane) return;

            if (!entry.discovered) {
                pane.innerHTML = `
                    <h3 class="codex-detail-title">🔒 UNDISCOVERED ENTRY</h3>
                    <div class="codex-detail-tamil">அறியப்படாத பதிவு</div>
                    <div class="codex-detail-meta-row">
                        <span>Region: ${entry.region ? entry.region.toUpperCase() : 'UNKNOWN'}</span>
                        <span>Section: ${entry.section}</span>
                    </div>
                    <div class="codex-section-block">
                        <div class="codex-section-label">Exploration Hint</div>
                        <div class="codex-section-text">${entry.hint || 'Explore the region to discover this entry.'}</div>
                    </div>
                `;
                return;
            }

            pane.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 class="codex-detail-title">${entry.title}</h3>
                        <div class="codex-detail-tamil">${entry.tamilTitle || ''}</div>
                    </div>
                    <button id="btn-toggle-favorite" style="background: none; border: 1px solid #ffd700; color: #ffd700; border-radius: 4px; padding: 4px 10px; cursor: pointer;">
                        ${entry.isFavorite ? '★ Favorited' : '☆ Add Favorite'}
                    </button>
                </div>
                <div class="codex-detail-meta-row">
                    <span>Region: ${entry.region ? entry.region.toUpperCase() : 'TAMIL NADU'}</span>
                    <span>Section: ${entry.section}</span>
                    <span>Status: Discovered</span>
                </div>
                
                <div class="codex-section-block real-heritage">
                    <div class="codex-section-label">Real Cultural & Ecological Context</div>
                    <div class="codex-section-text">${entry.historicalContext}</div>
                </div>

                <div class="codex-section-block">
                    <div class="codex-section-label">Game Investigation Lore</div>
                    <div class="codex-section-text">${entry.gameLore}</div>
                </div>

                <div style="margin-top: 14px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">Explorer Notes (Local)</div>
                    <textarea id="codex-entry-note" style="width: 100%; height: 70px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 8px; border-radius: 4px; font-family: inherit; font-size: 13px;" placeholder="Add field observation notes...">${entry.note || ''}</textarea>
                </div>
            `;

            document.getElementById('btn-toggle-favorite')?.addEventListener('click', () => {
                if (window.codexSystem) {
                    const isFav = window.codexSystem.toggleFavorite(entry.id);
                    entry.isFavorite = isFav;
                    this.renderDetailPane(entry);
                    this.renderEntriesList();
                }
            });

            document.getElementById('codex-entry-note')?.addEventListener('blur', (e) => {
                if (window.codexSystem) {
                    window.codexSystem.setNote(entry.id, e.target.value);
                }
            });
        }
    }

    window.CodexUI = CodexUI;
})();
