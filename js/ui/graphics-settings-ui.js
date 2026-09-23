/**
 * The Whispering Wilds (Kaattu Vazhi) - Graphics Settings UI
 * Polished PC settings interface for Display, Graphics Presets,
 * Performance Targets, and Telemetry options.
 */

class GraphicsSettingsUI {
  constructor(graphicsSettings) {
    this.graphicsSettings = graphicsSettings || window.graphicsSettings;
    this.isOpen = false;
    this.activeTab = 'GRAPHICS'; // 'DISPLAY' | 'GRAPHICS' | 'PERFORMANCE'

    this.container = null;
    this.initDOM();
  }

  initDOM() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('graphics-settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'graphics-settings-modal';
      modal.className = 'pc-modal-backdrop hidden';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(8, 12, 20, 0.85);
        backdrop-filter: blur(14px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      modal.innerHTML = `
        <div class="pc-settings-card" style="
          width: 780px; max-width: 90vw; max-height: 85vh;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(226, 177, 112, 0.3);
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
          display: flex; flex-direction: column; overflow: hidden;
          color: #f1f5f9;
        ">
          <!-- Header -->
          <div style="
            padding: 18px 24px;
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex; justify-content: space-between; align-items: center;
          ">
            <div>
              <h2 style="margin: 0; font-size: 1.25rem; color: #e2b170; letter-spacing: 0.5px;">⚙️ PC GRAPHICS & DISPLAY SETTINGS</h2>
              <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 3px;">The Whispering Wilds • Optimization Engine</div>
            </div>
            <button id="close-graphics-btn" style="
              background: transparent; border: 1px solid rgba(255,255,255,0.2);
              color: #cbd5e1; border-radius: 6px; padding: 6px 12px; cursor: pointer;
            ">✕ Close [Esc]</button>
          </div>

          <!-- Nav Tabs -->
          <div style="
            display: flex; gap: 8px; padding: 12px 24px;
            background: rgba(15, 23, 42, 0.6);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          ">
            <button class="settings-tab-btn" data-tab="GRAPHICS" style="
              padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; font-size: 0.85rem;
              background: #e2b170; color: #0f172a;
            ">GRAPHICS</button>
            <button class="settings-tab-btn" data-tab="DISPLAY" style="
              padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 0.85rem;
              background: transparent; color: #cbd5e1;
            ">DISPLAY</button>
            <button class="settings-tab-btn" data-tab="PERFORMANCE" style="
              padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 0.85rem;
              background: transparent; color: #cbd5e1;
            ">PERFORMANCE</button>
          </div>

          <!-- Body Content Area -->
          <div id="settings-tab-content" style="
            padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px;
          "></div>

          <!-- Footer Actions -->
          <div style="
            padding: 14px 24px;
            background: rgba(15, 23, 42, 0.8);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex; justify-content: space-between; align-items: center;
          ">
            <button id="auto-detect-btn" style="
              padding: 8px 16px; background: rgba(51, 65, 85, 0.6); border: 1px solid rgba(255,255,255,0.15);
              color: #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
            ">🔍 Auto-Detect Optimal Preset</button>
            <div style="display: flex; gap: 10px;">
              <button id="apply-graphics-btn" style="
                padding: 8px 20px; background: #27ae60; color: white; border: none;
                border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.88rem;
              ">Apply & Save</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    this.container = modal;
    this.bindEvents();
    this.renderActiveTab();
  }

  bindEvents() {
    if (!this.container) return;

    this.container.querySelector('#close-graphics-btn').onclick = () => this.close();
    this.container.querySelector('#auto-detect-btn').onclick = () => this.autoDetect();
    this.container.querySelector('#apply-graphics-btn').onclick = () => {
      if (this.graphicsSettings) {
        this.graphicsSettings.save();
        if (window.threeWorld) {
          this.graphicsSettings.applyToThreeWorld(window.threeWorld);
        }
      }
      this.close();
    };

    // Tab buttons
    const tabs = this.container.querySelectorAll('.settings-tab-btn');
    tabs.forEach(btn => {
      btn.onclick = () => {
        tabs.forEach(b => {
          b.style.background = 'transparent';
          b.style.color = '#cbd5e1';
          b.style.border = '1px solid rgba(255,255,255,0.1)';
        });
        btn.style.background = '#e2b170';
        btn.style.color = '#0f172a';
        btn.style.border = 'none';

        this.activeTab = btn.getAttribute('data-tab');
        this.renderActiveTab();
      };
    });
  }

  autoDetect() {
    if (!this.graphicsSettings) return;
    const renderer = window.threeWorld ? window.threeWorld.renderer : null;
    const caps = window.GRAPHICS_CONFIG.detectHardwareCapabilities(renderer);
    this.graphicsSettings.applyPreset(caps.recommendedPreset);
    if (window.threeWorld) {
      this.graphicsSettings.applyToThreeWorld(window.threeWorld);
    }
    this.renderActiveTab();
    alert(`Hardware Auto-Detection complete!\nRecommended Preset: ${caps.recommendedPreset}\nScreen: ${caps.screenWidth}×${caps.screenHeight} (${caps.devicePixelRatio}x DPR)`);
  }

  renderActiveTab() {
    const content = this.container.querySelector('#settings-tab-content');
    if (!content || !this.graphicsSettings) return;

    const s = this.graphicsSettings.settings;

    if (this.activeTab === 'GRAPHICS') {
      content.innerHTML = `
        <!-- Preset Selector -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08);">
          <div>
            <div style="font-weight:600; color:#e2b170;">Overall Quality Preset</div>
            <div style="font-size:0.8rem; color:#94a3b8;">Adjusts fidelity, shadow map resolutions, and asset distance scaling.</div>
          </div>
          <select id="preset-select" style="padding:6px 12px; background:#1e293b; border:1px solid rgba(255,255,255,0.2); color:#f8fafc; border-radius:6px;">
            ${['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA', 'CUSTOM'].map(p => `
              <option value="${p}" ${this.graphicsSettings.currentPreset === p ? 'selected' : ''}>${p}</option>
            `).join('')}
          </select>
        </div>

        <!-- Shadow Quality -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Shadow Quality</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Shadow map resolution (1024 / 2048 / 4096 px)</div>
          </div>
          <select class="setting-change" data-key="shadowQuality" style="padding:6px 10px; background:#1e293b; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px;">
            ${['off', 'low', 'medium', 'high', 'ultra'].map(opt => `<option value="${opt}" ${s.shadowQuality === opt ? 'selected' : ''}>${opt.toUpperCase()}</option>`).join('')}
          </select>
        </div>

        <!-- Texture Quality -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Texture Anisotropy & Filtering</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Texture filtering sharpness at grazing angles</div>
          </div>
          <select class="setting-change" data-key="textureQuality" style="padding:6px 10px; background:#1e293b; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px;">
            ${['low', 'medium', 'high', 'ultra'].map(opt => `<option value="${opt}" ${s.textureQuality === opt ? 'selected' : ''}>${opt.toUpperCase()}</option>`).join('')}
          </select>
        </div>

        <!-- Vegetation & Foliage -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Vegetation & Banyan Canopy Density</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Number of GPU-instanced trees, palmyra palms, and ground foliage</div>
          </div>
          <select class="setting-change" data-key="vegetationDensity" style="padding:6px 10px; background:#1e293b; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px;">
            ${['low', 'medium', 'high', 'ultra'].map(opt => `<option value="${opt}" ${s.vegetationDensity === opt ? 'selected' : ''}>${opt.toUpperCase()}</option>`).join('')}
          </select>
        </div>

        <!-- Weather Particle Intensity -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Monsoon Rain & Storm Streaks</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Rain streak count (${s.particleCount} particles)</div>
          </div>
          <select class="setting-change" data-key="weatherQuality" style="padding:6px 10px; background:#1e293b; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px;">
            ${['low', 'medium', 'high', 'ultra'].map(opt => `<option value="${opt}" ${s.weatherQuality === opt ? 'selected' : ''}>${opt.toUpperCase()}</option>`).join('')}
          </select>
        </div>

        <!-- View Distance -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">View & Terrain Draw Distance</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Horizon culling boundary (${s.viewDistance}m)</div>
          </div>
          <select class="setting-change" data-key="viewDistance" style="padding:6px 10px; background:#1e293b; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px;">
            ${[120, 180, 260, 350, 500].map(d => `<option value="${d}" ${s.viewDistance === d ? 'selected' : ''}>${d}m</option>`).join('')}
          </select>
        </div>
      `;

      // Preset change handler
      content.querySelector('#preset-select').onchange = (e) => {
        this.graphicsSettings.applyPreset(e.target.value);
        if (window.threeWorld) {
          this.graphicsSettings.applyToThreeWorld(window.threeWorld);
        }
        this.renderActiveTab();
      };
    } else if (this.activeTab === 'DISPLAY') {
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Display Mode</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Toggle Fullscreen or Windowed mode</div>
          </div>
          <button id="toggle-fullscreen-btn" style="padding:6px 14px; background:#334155; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px; cursor:pointer;">
            ${document.fullscreenElement ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Target Framerate (FPS Limit)</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Supports 30, 60, 90, 120, 144, or Unlimited</div>
          </div>
          <select id="fps-limit-select" style="padding:6px 10px; background:#1e293b; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px;">
            ${window.GRAPHICS_CONFIG.FPS_TARGETS.map(f => `
              <option value="${f}" ${this.graphicsSettings.fpsLimit === f ? 'selected' : ''}>${f === 'unlimited' ? 'Unlimited' : f + ' FPS'}</option>
            `).join('')}
          </select>
        </div>
      `;

      content.querySelector('#toggle-fullscreen-btn').onclick = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      };

      content.querySelector('#fps-limit-select').onchange = (e) => {
        const val = e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value);
        this.graphicsSettings.fpsLimit = val;
        if (window.performanceManager && typeof val === 'number') {
          window.performanceManager.setTargetFPS(val);
        }
      };
    } else if (this.activeTab === 'PERFORMANCE') {
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Adaptive Dynamic Quality</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Dynamically scales shadow & foliage fidelity if framerate drops</div>
          </div>
          <input type="checkbox" id="adaptive-toggle" ${this.graphicsSettings.adaptiveQuality ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;" />
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500;">Developer Telemetry Overlay [F9]</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Real-time FPS, frame budget, draw calls, and triangle counter</div>
          </div>
          <button id="toggle-telemetry-btn" style="padding:6px 14px; background:#334155; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px; cursor:pointer;">
            Toggle [F9]
          </button>
        </div>
      `;

      content.querySelector('#adaptive-toggle').onchange = (e) => {
        this.graphicsSettings.adaptiveQuality = e.target.checked;
        if (window.performanceManager) {
          window.performanceManager.adaptiveQualityEnabled = e.target.checked;
        }
      };

      content.querySelector('#toggle-telemetry-btn').onclick = () => {
        if (window.performanceManager) {
          window.performanceManager.toggleTelemetry();
        }
      };
    }

    // Attach individual setting change listeners
    content.querySelectorAll('.setting-change').forEach(select => {
      select.onchange = (e) => {
        const key = e.target.getAttribute('data-key');
        let val = e.target.value;
        if (!isNaN(Number(val))) val = Number(val);
        this.graphicsSettings.setSetting(key, val);
        if (window.threeWorld) {
          this.graphicsSettings.applyToThreeWorld(window.threeWorld);
        }
      };
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.classList.add('active');
      this.renderActiveTab();
    }
  }

  close() {
    this.isOpen = false;
    if (this.container) {
      this.container.classList.add('hidden');
      this.container.classList.remove('active');
    }
  }

  show() {
    this.open();
  }

  hide() {
    this.close();
  }
}

if (typeof window !== 'undefined') {
  window.GraphicsSettingsUI = GraphicsSettingsUI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GraphicsSettingsUI };
}
