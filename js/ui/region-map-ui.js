// ============================================================================
// THE WHISPERING WILDS - REGION MAP & EXPLORATION NAVIGATION UI
// ============================================================================

(function() {
    class RegionMapUI {
        constructor() {
            this.container = null;
            this.canvas = null;
            this.ctx = null;
            this.isOpen = false;
            this.zoom = 1.0;
            this.panX = 0;
            this.panZ = 0;
            this.isDragging = false;
            this.dragStartX = 0;
            this.dragStartY = 0;
        }

        init() {
            if (this.container) return;

            const modal = document.createElement('div');
            modal.id = 'regionMapModal';
            modal.className = 'controls-settings-modal';
            modal.style.width = '880px';
            modal.style.height = '620px';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="controls-header">
                    <h2 class="controls-title">Map of Tamil Nadu (தமிழ்நாடு வரைபடம்)</h2>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <button type="button" id="mapZoomInBtn" class="keybind-btn" style="min-width:32px;">+</button>
                        <button type="button" id="mapZoomOutBtn" class="keybind-btn" style="min-width:32px;">-</button>
                        <button type="button" id="closeMapBtn" class="keybind-btn" style="min-width:auto; padding:4px 10px;">✕</button>
                    </div>
                </div>

                <div style="position:relative; flex:1; background:#0b140f; overflow:hidden;">
                    <canvas id="regionMapCanvas" width="880" height="520" style="display:block; width:100%; height:100%; cursor:grab;"></canvas>
                </div>

                <div class="controls-footer" style="padding:10px 24px;">
                    <span style="font-size:12px; color:#8fa89b;">Drag to Pan • Scroll / Buttons to Zoom • [M] Close</span>
                    <button type="button" id="openFastTravelFromMap" class="auth-btn-secondary" style="width:auto; padding:6px 16px;">
                        Travel Posts
                    </button>
                </div>
            `;

            document.body.appendChild(modal);
            this.container = modal;
            this.canvas = modal.querySelector('#regionMapCanvas');
            this.ctx = this.canvas.getContext('2d');

            this.bindEvents();
        }

        bindEvents() {
            this.container.querySelector('#closeMapBtn')?.addEventListener('click', () => this.hide());
            this.container.querySelector('#mapZoomInBtn')?.addEventListener('click', () => { this.zoom = Math.min(2.5, this.zoom + 0.2); this.render(); });
            this.container.querySelector('#mapZoomOutBtn')?.addEventListener('click', () => { this.zoom = Math.max(0.6, this.zoom - 0.2); this.render(); });

            this.container.querySelector('#openFastTravelFromMap')?.addEventListener('click', () => {
                this.hide();
                window.FastTravelUI?.show();
            });

            this.canvas.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this.dragStartX = e.clientX - this.panX;
                this.dragStartY = e.clientY - this.panZ;
                this.canvas.style.cursor = 'grabbing';
            });

            window.addEventListener('mousemove', (e) => {
                if (!this.isDragging) return;
                this.panX = e.clientX - this.dragStartX;
                this.panZ = e.clientY - this.dragStartY;
                this.render();
            });

            window.addEventListener('mouseup', () => {
                this.isDragging = false;
                if (this.canvas) this.canvas.style.cursor = 'grab';
            });

            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                this.zoom = Math.max(0.6, Math.min(2.5, this.zoom + delta));
                this.render();
            });
        }

        render() {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);

            // Background Bay of Bengal & Land tint
            ctx.fillStyle = '#08120e';
            ctx.fillRect(0, 0, w, h);

            ctx.save();
            ctx.translate(w / 2 + this.panX, h / 2 + this.panZ);
            ctx.scale(this.zoom, this.zoom);

            // Draw Region outlines
            const regions = window.NAVIGATION_DATA?.REGIONS || {};
            for (const [id, r] of Object.entries(regions)) {
                const b = r.bounds;
                if (!b) continue;

                const state = window.RegionProgressionSystem?.getRegionState(id) || 'UNKNOWN';
                const isDiscovered = state !== 'UNKNOWN';

                // Map coordinate scaling (1 world unit = ~1.8 canvas pixels)
                const rx = b.minX * 1.6;
                const rz = b.minZ * 1.6;
                const rw = (b.maxX - b.minX) * 1.6;
                const rh = (b.maxZ - b.minZ) * 1.6;

                ctx.fillStyle = isDiscovered ? 'rgba(30, 58, 45, 0.45)' : 'rgba(12, 18, 15, 0.7)';
                ctx.fillRect(rx, rz, rw, rh);

                ctx.strokeStyle = isDiscovered ? 'rgba(212, 175, 55, 0.4)' : 'rgba(70, 85, 78, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(rx, rz, rw, rh);

                // Region Name Label
                ctx.fillStyle = isDiscovered ? '#d4af37' : '#55665e';
                ctx.font = 'bold 12px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(isDiscovered ? r.name : 'Unknown Region', rx + rw / 2, rz + rh / 2);
            }

            // Draw Discovered Routes
            const routes = window.NAVIGATION_DATA?.ROUTES || [];
            ctx.strokeStyle = 'rgba(85, 179, 138, 0.6)';
            ctx.lineWidth = 2.0;
            ctx.setLineDash([4, 4]);

            for (const route of routes) {
                if (route.isDiscovered) {
                    const fromReg = regions[route.from];
                    const toReg = regions[route.to];
                    if (fromReg && toReg) {
                        const fx = ((fromReg.bounds.minX + fromReg.bounds.maxX) / 2) * 1.6;
                        const fz = ((fromReg.bounds.minZ + fromReg.bounds.maxZ) / 2) * 1.6;
                        const tx = ((toReg.bounds.minX + toReg.bounds.maxX) / 2) * 1.6;
                        const tz = ((toReg.bounds.minZ + toReg.bounds.maxZ) / 2) * 1.6;

                        ctx.beginPath();
                        ctx.moveTo(fx, fz);
                        ctx.lineTo(tx, tz);
                        ctx.stroke();
                    }
                }
            }
            ctx.setLineDash([]);

            // Draw Fast Travel Posts
            const travelPoints = window.FastTravelSystem?.getDiscoveredPoints?.() || [];
            for (const pt of travelPoints) {
                const px = pt.arrivalMarker.x * 1.6;
                const pz = pt.arrivalMarker.z * 1.6;

                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(px, pz, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw Player Position Marker
            const playerPos = window.GameState?.player?.position || { x: 0, z: 0 };
            const px = playerPos.x * 1.6;
            const pz = playerPos.z * 1.6;

            ctx.fillStyle = '#55b38a';
            ctx.beginPath();
            ctx.arc(px, pz, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }

        show() {
            if (!this.container) this.init();
            this.isOpen = true;
            this.container.style.display = 'flex';
            this.render();
            if (window.InputManager) window.InputManager.pushContext('MapContext');
        }

        hide() {
            if (!this.container) return;
            this.isOpen = false;
            this.container.style.display = 'none';
            if (window.InputManager) window.InputManager.popContext();
        }

        toggle() {
            if (this.isOpen) this.hide();
            else this.show();
        }
    }

    window.RegionMapUI = new RegionMapUI();
})();
