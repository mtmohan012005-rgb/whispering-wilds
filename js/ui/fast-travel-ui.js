// ============================================================================
// THE WHISPERING WILDS - FAST TRAVEL SELECTION MODAL UI
// ============================================================================

(function() {
    class FastTravelUI {
        constructor() {
            this.container = null;
            this.selectedPointId = null;
            this.isOpen = false;
        }

        init() {
            if (this.container) return;

            const modal = document.createElement('div');
            modal.id = 'fastTravelModal';
            modal.className = 'controls-settings-modal';
            modal.style.width = '520px';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="controls-header">
                    <h2 class="controls-title">Regional Travel Post</h2>
                    <button type="button" id="closeTravelBtn" class="keybind-btn" style="min-width:auto; padding:4px 10px;">✕</button>
                </div>

                <div class="controls-body" id="travelPointsList" style="gap:10px;"></div>

                <div class="controls-footer" style="flex-direction:column; gap:12px; align-items:stretch;">
                    <div id="travelDetailsBox" class="auth-save-box" style="display:none;"></div>
                    <div style="display:flex; justify-content:space-between;">
                        <button type="button" id="cancelTravelBtn" class="auth-btn-secondary" style="width:auto; padding:8px 20px;">Cancel</button>
                        <button type="button" id="confirmTravelBtn" class="auth-btn-primary" style="width:auto; padding:8px 28px;" disabled>Travel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.container = modal;
            this.bindEvents();
        }

        bindEvents() {
            this.container.querySelector('#closeTravelBtn')?.addEventListener('click', () => this.hide());
            this.container.querySelector('#cancelTravelBtn')?.addEventListener('click', () => this.hide());

            const confirmBtn = this.container.querySelector('#confirmTravelBtn');
            confirmBtn?.addEventListener('click', () => {
                if (this.selectedPointId) {
                    const res = window.FastTravelSystem.executeFastTravel(this.selectedPointId);
                    if (res.success) {
                        this.hide();
                    } else {
                        alert(res.reason || 'Cannot travel to this location right now.');
                    }
                }
            });
        }

        renderPoints() {
            const listEl = this.container.querySelector('#travelPointsList');
            const allPoints = window.FAST_TRAVEL_DATA?.POINTS || [];
            const discoveredMap = new Set(window.FastTravelSystem?.getDiscoveredPoints?.().map(p => p.id) || []);

            listEl.innerHTML = allPoints.map(p => {
                const isDiscovered = discoveredMap.has(p.id);
                return `
                    <div class="keybind-row travel-item ${isDiscovered ? '' : 'locked'}" data-id="${p.id}" style="cursor:${isDiscovered ? 'pointer' : 'not-allowed'}; opacity:${isDiscovered ? '1' : '0.45'};">
                        <div style="display:flex; flex-direction:column;">
                            <span class="keybind-label" style="font-weight:700;">${p.name}</span>
                            <span style="font-size:11px; color:#8fa89b;">${p.region.replace('_', ' ')}</span>
                        </div>
                        <span class="keybind-btn" style="min-width:auto; border-color:${isDiscovered ? 'rgba(212,175,55,0.4)' : 'rgba(100,100,100,0.3)'};">
                            ${isDiscovered ? 'AVAILABLE' : '🔒 UNDISCOVERED'}
                        </span>
                    </div>
                `;
            }).join('');

            listEl.querySelectorAll('.travel-item').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.getAttribute('data-id');
                    if (discoveredMap.has(id)) {
                        this.selectPoint(id, el);
                    }
                });
            });
        }

        selectPoint(id, element) {
            this.selectedPointId = id;
            this.container.querySelectorAll('.travel-item').forEach(i => i.classList.remove('highlight'));
            element.classList.add('highlight');

            const pt = (window.FAST_TRAVEL_DATA?.POINTS || []).find(p => p.id === id);
            const detailsBox = this.container.querySelector('#travelDetailsBox');
            const confirmBtn = this.container.querySelector('#confirmTravelBtn');

            if (pt && detailsBox) {
                detailsBox.style.display = 'block';
                detailsBox.innerHTML = `
                    <div class="auth-save-title">Travel Itinerary: ${pt.name}</div>
                    <div class="auth-save-detail"><strong>Est. Travel Time:</strong> ${pt.travelHours} Hours</div>
                    <div class="auth-save-detail"><strong>Energy Depletion:</strong> -${pt.energyCost}%</div>
                    <div class="auth-save-detail"><strong>Hydration Required:</strong> -${pt.hydrationCost}%</div>
                `;
                confirmBtn.disabled = false;
            }
        }

        show() {
            if (!this.container) this.init();
            this.isOpen = true;
            this.container.style.display = 'flex';
            this.renderPoints();
            if (window.InputManager) window.InputManager.pushContext('MenuContext');
        }

        hide() {
            if (!this.container) return;
            this.isOpen = false;
            this.container.style.display = 'none';
            this.selectedPointId = null;
            if (window.InputManager) window.InputManager.popContext();
        }
    }

    window.FastTravelUI = new FastTravelUI();
})();
