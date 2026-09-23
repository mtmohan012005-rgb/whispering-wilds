// ============================================================================
// THE WHISPERING WILDS - TOPOGRAPHIC WORLD MAP UI (8 REGIONS)
// ============================================================================

class WorldMapUI {
    constructor() {
        this.backdrop = null;
        this.canvas = null;
        this.ctx = null;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.discoveredRegions = new Set(['chennai', 'mamallapuram']);

        this.initDOM();
    }

    initDOM() {
        this.backdrop = document.createElement('div');
        this.backdrop.id = 'pc-map-backdrop';
        this.backdrop.className = 'pc-modal-backdrop';

        this.backdrop.innerHTML = `
            <div class="pc-modal-window pc-map-modal">
                <div class="pc-modal-header">
                    <div class="pc-modal-title">
                        <span>🗺️</span> TAMIL NADU TOPOGRAPHIC FIELD SURVEY • 1892
                    </div>
                    <button class="pc-close-btn" id="pc-map-close">&times;</button>
                </div>
                <div class="pc-map-canvas-container" id="pc-map-container">
                    <canvas id="pc-map-canvas" width="1280" height="720"></canvas>
                    <div class="pc-map-controls">
                        <button class="map-control-btn" id="map-zoom-in">+</button>
                        <button class="map-control-btn" id="map-zoom-out">−</button>
                        <button class="map-control-btn" id="map-reset-view">⟲</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.backdrop);
        this.canvas = document.getElementById('pc-map-canvas');
        this.ctx = this.canvas.getContext('2d');

        document.getElementById('pc-map-close').onclick = () => {
            if (window.uiManager) window.uiManager.closeModal('MAP');
        };

        document.getElementById('map-zoom-in').onclick = () => {
            this.zoom = Math.min(2.5, this.zoom + 0.25);
            this.render();
        };

        document.getElementById('map-zoom-out').onclick = () => {
            this.zoom = Math.max(0.75, this.zoom - 0.25);
            this.render();
        };

        document.getElementById('map-reset-view').onclick = () => {
            this.zoom = 1.0;
            this.panX = 0;
            this.panY = 0;
            this.render();
        };
    }

    show() {
        if (this.backdrop) {
            this.backdrop.classList.add('active');
            this.render();
        }
    }

    hide() {
        if (this.backdrop) this.backdrop.classList.remove('active');
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.save();

        // Background terrain parchment
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        ctx.translate(w / 2 + this.panX, h / 2 + this.panY);
        ctx.scale(this.zoom, this.zoom);

        // Grid lines (Survey coordinates)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
        ctx.lineWidth = 1;
        for (let x = -600; x <= 600; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, -350);
            ctx.lineTo(x, 350);
            ctx.stroke();
        }
        for (let y = -350; y <= 350; y += 100) {
            ctx.beginPath();
            ctx.moveTo(-600, y);
            ctx.lineTo(600, y);
            ctx.stroke();
        }

        // 8 Key Regions of Tamil Nadu Expedition
        const regions = [
            { id: 'chennai', name: 'George Town & Marina', x: 220, y: -220, color: '#38bdf8' },
            { id: 'mamallapuram', name: 'Mamallapuram Shore Temple', x: 200, y: -140, color: '#f59e0b' },
            { id: 'pichavaram', name: 'Pichavaram Mangroves', x: 180, y: -50, color: '#10b981' },
            { id: 'cauvery_delta', name: 'Cauvery River Delta', x: 100, y: 30, color: '#2dd4bf' },
            { id: 'thanjavur', name: 'Thanjavur Royal Palace', x: 70, y: 70, color: '#d4af37' },
            { id: 'chettinad', name: 'Chettinad Heritage Belt', x: 30, y: 140, color: '#c25438' },
            { id: 'madurai', name: 'Madurai Vaigai River', x: -50, y: 200, color: '#a855f7' },
            { id: 'nilgiris', name: 'Nilgiris Western Ghats', x: -280, y: -80, color: '#22c55e' }
        ];

        // Draw region zones and connection routes
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        regions.forEach((r, i) => {
            if (i === 0) ctx.moveTo(r.x, r.y);
            else ctx.lineTo(r.x, r.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Region nodes
        regions.forEach(r => {
            const isDiscovered = this.discoveredRegions.has(r.id);

            // Region halo
            ctx.fillStyle = isDiscovered ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.arc(r.x, r.y, 40, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = isDiscovered ? r.color : '#475569';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = isDiscovered ? '#f8fafc' : '#64748b';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(r.name, r.x, r.y + 55);
        });

        // Player pin
        const px = 200; // Simulated current coordinate near Mamallapuram / Chennai
        const py = -160;

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('YOU (Explorer)', px, py - 14);

        ctx.restore();
    }
}

window.WorldMapUI = WorldMapUI;
