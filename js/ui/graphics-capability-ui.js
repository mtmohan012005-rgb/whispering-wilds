/**
 * The Whispering Wilds - Graphics Capability UI
 * Visual settings sub-panel displaying active graphics backend and feature status.
 */
(function(root) {
  'use strict';

  class GraphicsCapabilityUI {
    constructor() {
      this.container = null;
      this.initDOM();
    }

    initDOM() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('graphics-capability-panel')) {
        this.container = document.getElementById('graphics-capability-panel');
        return;
      }

      this.container = document.createElement('div');
      this.container.id = 'graphics-capability-panel';
      this.container.className = 'graphics-capability-panel hidden';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(15, 23, 20, 0.9);
        border: 1px solid #388e3c;
        border-radius: 6px;
        padding: 16px;
        color: #e8f5e9;
        font-family: monospace;
        font-size: 0.85rem;
        z-index: 9998;
        max-width: 320px;
        display: none;
      `;

      document.body.appendChild(this.container);
    }

    render() {
      if (!this.container) this.initDOM();
      if (!this.container) return;

      const backendMgr = root.GraphicsBackendManagerInstance;
      const status = backendMgr ? backendMgr.getStatus() : { backend: 'WEBGL2', tier: 'STANDARD', features: {} };

      let html = `<div style="font-weight:bold; color:#81c784; margin-bottom:8px;">GRAPHICS BACKEND STATUS</div>`;
      html += `<div>Backend: <strong>${status.backend}</strong></div>`;
      html += `<div>Capability Tier: <strong>${status.tier}</strong></div>`;
      html += `<div>WebGPU: ${status.webgpuStatus}</div>`;
      html += `<div style="margin-top:6px; font-weight:bold;">Features:</div>`;
      for (const [feat, enabled] of Object.entries(status.features || {})) {
        html += `<div style="color: ${enabled ? '#a5d6a7' : '#ef9a9a'};"> - ${feat}: ${enabled ? 'ENABLED' : 'OFF'}</div>`;
      }

      this.container.innerHTML = html;
    }

    show() {
      this.render();
      if (this.container) {
        this.container.classList.remove('hidden');
        this.container.style.display = 'block';
      }
    }

    hide() {
      if (this.container) {
        this.container.classList.add('hidden');
        this.container.style.display = 'none';
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsCapabilityUI;
  } else {
    root.GraphicsCapabilityUI = new GraphicsCapabilityUI();
  }
})(typeof window !== 'undefined' ? window : global);
