// ============================================================================
// THE WHISPERING WILDS - UNIFIED SETTINGS UI (GRAPHICS, AUDIO, CONTROLS)
// ============================================================================

class UnifiedSettingsUI {
    constructor() {
        this.backdrop = null;
        this.initDOM();
    }

    initDOM() {
        this.backdrop = document.createElement('div');
        this.backdrop.id = 'pc-settings-backdrop';
        this.backdrop.className = 'pc-modal-backdrop';

        this.backdrop.innerHTML = `
            <div class="pc-modal-window" style="width: 720px; max-height: 80vh;">
                <div class="pc-modal-header">
                    <div class="pc-modal-title">⚙️ SYSTEM & GRAPHICS CONFIGURATION</div>
                    <button class="pc-close-btn" id="pc-settings-close">&times;</button>
                </div>
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto;">
                    <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                        <h4 style="color:#ffd700; margin:0 0 10px 0;">Audio Levels</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <label style="display:flex; justify-content:space-between; font-size:13px; color:#cbd5e1;">
                                Master Volume:
                                <input type="range" id="vol-master" min="0" max="100" value="80" style="width:200px;">
                            </label>
                            <label style="display:flex; justify-content:space-between; font-size:13px; color:#cbd5e1;">
                                Ambient Nature & Wildlife:
                                <input type="range" id="vol-ambience" min="0" max="100" value="85" style="width:200px;">
                            </label>
                            <label style="display:flex; justify-content:space-between; font-size:13px; color:#cbd5e1;">
                                Traditional Instruments / Music:
                                <input type="range" id="vol-music" min="0" max="100" value="70" style="width:200px;">
                            </label>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="color:#ffd700; margin:0 0 4px 0;">PC Graphics & Performance</h4>
                            <p style="color:#94a3b8; font-size:12px; margin:0;">Resolution, Shadows, Weather Density & Dynamic Presets</p>
                        </div>
                        <button class="inv-action-btn" id="open-graphics-settings-btn" style="flex:none; width:auto; padding:8px 16px;">
                            Open Graphics Settings ➔
                        </button>
                    </div>

                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                        <h4 style="color:#ffd700; margin:0 0 10px 0;">PC Control Bindings</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; color:#94a3b8;">
                            <div><kbd>W, A, S, D</kbd> Movement</div>
                            <div><kbd>Shift</kbd> Sprint</div>
                            <div><kbd>Mouse</kbd> Camera Orbit</div>
                            <div><kbd>E</kbd> Interact / Talk</div>
                            <div><kbd>I</kbd> Field Satchel</div>
                            <div><kbd>M</kbd> Topographic Map</div>
                            <div><kbd>J</kbd> Field Journal</div>
                            <div><kbd>F</kbd> Photo Viewfinder</div>
                            <div><kbd>F9</kbd> Performance Telemetry</div>
                            <div><kbd>Esc</kbd> Pause Menu</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.backdrop);
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('pc-settings-close').onclick = () => {
            if (window.uiManager) window.uiManager.closeModal('SETTINGS');
        };

        document.getElementById('open-graphics-settings-btn').onclick = () => {
            if (window.uiManager) window.uiManager.closeModal('SETTINGS');
            if (window.graphicsSettingsUI) window.graphicsSettingsUI.show();
        };

        const masterSlider = document.getElementById('vol-master');
        if (masterSlider) {
            masterSlider.oninput = (e) => {
                const vol = parseFloat(e.target.value) / 100;
                if (window.audioProductionEngine) {
                    window.audioProductionEngine.setMasterVolume(vol);
                }
            };
        }
    }

    show() {
        if (this.backdrop) this.backdrop.classList.add('active');
    }

    hide() {
        if (this.backdrop) this.backdrop.classList.remove('active');
    }
}

window.UnifiedSettingsUI = UnifiedSettingsUI;
