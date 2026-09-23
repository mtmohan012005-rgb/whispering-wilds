// ============================================================================
// THE WHISPERING WILDS - FIELD CAMERA & PHOTO MODE UI (HOTKEY F)
// ============================================================================

class PhotoModeUI {
    constructor() {
        this.overlay = null;
        this.photosTaken = [];
        this.initDOM();
    }

    initDOM() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'pc-photo-overlay';
        this.overlay.className = 'pc-photo-mode-overlay';

        this.overlay.innerHTML = `
            <!-- TOP BAR -->
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.6); backdrop-filter:blur(8px); padding:8px 20px; border-radius:30px; pointer-events:auto;">
                <div style="font-family:'Cinzel', serif; color:#ffd700; font-weight:700;">
                    📷 FIELD CAMERA • VIEWFINDER
                </div>
                <div style="color:#94a3b8; font-size:12px;">Press <kbd>F</kbd> or <kbd>Esc</kbd> to Exit</div>
            </div>

            <!-- RULE OF THIRDS GRID -->
            <div class="photo-grid-lines">
                <div class="photo-grid-cell"></div><div class="photo-grid-cell"></div><div class="photo-grid-cell"></div>
                <div class="photo-grid-cell"></div><div class="photo-grid-cell"></div><div class="photo-grid-cell"></div>
                <div class="photo-grid-cell"></div><div class="photo-grid-cell"></div><div class="photo-grid-cell"></div>
            </div>

            <!-- BOTTOM CONTROLS -->
            <div class="photo-controls-bar" style="pointer-events:auto;">
                <label style="font-size:12px; color:#cbd5e1; display:flex; align-items:center; gap:8px;">
                    Zoom / FOV
                    <input type="range" id="photo-fov-slider" min="30" max="85" value="60" style="width:120px;">
                </label>
                <button class="photo-shutter-btn" id="photo-shutter-btn">
                    <span>🔘 CAPTURE PHOTO</span>
                </button>
            </div>
        `;

        document.body.appendChild(this.overlay);
        this.bindEvents();
    }

    bindEvents() {
        const slider = document.getElementById('photo-fov-slider');
        if (slider) {
            slider.oninput = (e) => {
                const fov = parseFloat(e.target.value);
                if (window.threeWorld && window.threeWorld.camera) {
                    window.threeWorld.camera.fov = fov;
                    window.threeWorld.camera.updateProjectionMatrix();
                }
            };
        }

        const shutter = document.getElementById('photo-shutter-btn');
        if (shutter) {
            shutter.onclick = () => this.captureSnapshot();
        }
    }

    captureSnapshot() {
        // Flash animation
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.inset = '0';
        flash.style.background = '#ffffff';
        flash.style.zIndex = '999';
        flash.style.opacity = '0.9';
        flash.style.transition = 'opacity 0.4s ease-out';
        document.body.appendChild(flash);

        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 400);
        }, 50);

        // Sound effect if available
        if (window.audioProductionEngine) {
            window.audioProductionEngine.playSFX('camera_shutter');
        }

        // Capture data URL from three canvas
        let imgUrl = null;
        if (window.threeWorld && window.threeWorld.renderer) {
            try {
                imgUrl = window.threeWorld.renderer.domElement.toDataURL('image/jpeg', 0.85);
            } catch (_) {}
        }

        const photoRecord = {
            id: 'photo_' + Date.now(),
            timestamp: Date.now(),
            imgUrl: imgUrl,
            caption: 'Survey snapshot recorded in Tamil Nadu.'
        };
        this.photosTaken.push(photoRecord);

        if (window.quests && window.quests.showQuestNotification) {
            window.quests.showQuestNotification('📸 Field photograph pinned to Field Journal!');
        }
    }

    show() {
        if (this.overlay) this.overlay.classList.add('active');
        const hud = document.getElementById('hud-container');
        if (hud) hud.classList.add('hidden');
    }

    hide() {
        if (this.overlay) this.overlay.classList.remove('active');
        const hud = document.getElementById('hud-container');
        if (hud) hud.classList.remove('hidden');

        // Reset camera FOV
        if (window.threeWorld && window.threeWorld.camera) {
            window.threeWorld.camera.fov = 60;
            window.threeWorld.camera.updateProjectionMatrix();
        }
    }
}

window.PhotoModeUI = PhotoModeUI;
