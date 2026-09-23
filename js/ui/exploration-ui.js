/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Exploration HUD & Inspection Interface (ExplorationUI)
 * Handles contextual [E] interaction prompts, full 3D object inspection overlays,
 * and landmark discovery banner toasts.
 */

class ExplorationUI {
  constructor() {
    this.promptEl = null;
    this.inspectModalEl = null;
    this.discoveryToastEl = null;

    this.initDOM();
  }

  initDOM() {
    // 1. Contextual Interaction Prompt
    this.promptEl = document.getElementById('interact-prompt');
    if (!this.promptEl) {
      this.promptEl = document.createElement('div');
      this.promptEl.id = 'interact-prompt';
      this.promptEl.className = 'hidden';
      this.promptEl.style.cssText = 'position: fixed; bottom: 18%; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.9); border: 1.5px solid #d4af37; padding: 10px 22px; border-radius: 24px; color: #fff; font-family: Segoe UI, sans-serif; font-size: 14px; display: flex; align-items: center; gap: 10px; z-index: 1000; box-shadow: 0 8px 24px rgba(0,0,0,0.6); pointer-events: none;';
      document.body.appendChild(this.promptEl);
    }

    // 2. Object Inspection Overlay Modal
    this.inspectModalEl = document.getElementById('inspect-modal');
    if (!this.inspectModalEl) {
      this.inspectModalEl = document.createElement('div');
      this.inspectModalEl.id = 'inspect-modal';
      this.inspectModalEl.className = 'hidden';
      this.inspectModalEl.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(7, 11, 20, 0.82); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: flex-end; padding-bottom: 60px; z-index: 1500; font-family: Segoe UI, sans-serif;';
      document.body.appendChild(this.inspectModalEl);
    }

    // 3. Discovery Toast Banner
    this.discoveryToastEl = document.getElementById('discovery-banner-toast');
    if (!this.discoveryToastEl) {
      this.discoveryToastEl = document.createElement('div');
      this.discoveryToastEl.id = 'discovery-banner-toast';
      this.discoveryToastEl.className = 'hidden';
      this.discoveryToastEl.style.cssText = 'position: fixed; top: 12%; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #1f2937, #111827); border: 2px solid #f59e0b; border-radius: 12px; padding: 16px 28px; color: #fff; text-align: center; z-index: 2000; box-shadow: 0 12px 32px rgba(0,0,0,0.85); min-width: 320px; transition: opacity 0.3s ease;';
      document.body.appendChild(this.discoveryToastEl);
    }
  }

  setInteractPrompt(visible, type = 'interact', targetName = 'Object') {
    if (!this.promptEl) return;
    if (!visible) {
      this.promptEl.classList.add('hidden');
      this.promptEl.style.display = 'none';
      return;
    }

    const verbMap = {
      inspect: 'Inspect (ஆராய்)',
      climb: 'Climb (ஏறு)',
      boat: 'Enter Boat (படகு ஏறு)',
      open: 'Open (திற)',
      close: 'Close (மூடு)',
      turn: 'Turn (சுழற்று)',
      operate: 'Operate (இயக்கு)',
      light: 'Light (விளக்கேற்று)',
      pickup: 'Pick Up (எடு)'
    };

    const verb = verbMap[type] || 'Interact (செயல்படு)';
    this.promptEl.innerHTML = `<span style="background: #f59e0b; color: #000; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 13px;">E</span> <span>${verb} • <strong>${targetName}</strong></span>`;
    this.promptEl.classList.remove('hidden');
    this.promptEl.style.display = 'flex';
  }

  showInspectionModal(entity) {
    if (!this.inspectModalEl || !entity) return;
    const ud = entity.group.userData || {};

    this.inspectModalEl.innerHTML = `
      <div style="background: #1e293b; border: 2px solid #d4af37; border-radius: 14px; max-width: 580px; width: 90%; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.9); color: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <div>
            <h3 style="margin: 0; color: #f59e0b; font-size: 20px;">${entity.name || 'Field Relic'}</h3>
            <span style="font-size: 13px; color: #94a3b8;">${entity.tamilName || ''}</span>
          </div>
          <button id="close-inspect-btn" style="background: none; border: none; color: #cbd5e1; font-size: 24px; cursor: pointer;">✕</button>
        </div>
        <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 16px 0;">${ud.description || 'An artifact shaped by local hands.'}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px;">
          <button id="exit-inspect-btn" class="btn-primary" style="padding: 9px 18px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Resume [E]</button>
        </div>
      </div>
    `;

    this.inspectModalEl.classList.remove('hidden');
    this.inspectModalEl.style.display = 'flex';

    const close = () => {
      if (window.environmentInteraction) {
        window.environmentInteraction.endInspection();
      } else {
        this.hideInspectionModal();
      }
    };

    const closeBtn = this.inspectModalEl.querySelector('#close-inspect-btn');
    const exitBtn = this.inspectModalEl.querySelector('#exit-inspect-btn');
    if (closeBtn) closeBtn.onclick = close;
    if (exitBtn) exitBtn.onclick = close;
  }

  hideInspectionModal() {
    if (this.inspectModalEl) {
      this.inspectModalEl.classList.add('hidden');
      this.inspectModalEl.style.display = 'none';
    }
  }

  showDiscoveryToast(landmark) {
    if (!this.discoveryToastEl || !landmark) return;

    this.discoveryToastEl.innerHTML = `
      <div style="font-size: 11px; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-bottom: 4px;">📍 NEW DISCOVERY (புதிய கண்டுபிடிப்பு)</div>
      <div style="font-size: 18px; font-weight: bold; color: #fff; margin-bottom: 2px;">${landmark.name}</div>
      <div style="font-size: 13px; color: #fbbf24;">${landmark.tamilName || ''}</div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">+${landmark.discoveryXP || 100} Exploration XP • Field Journal Updated</div>
    `;

    this.discoveryToastEl.classList.remove('hidden');
    this.discoveryToastEl.style.display = 'block';
    this.discoveryToastEl.style.opacity = '1';

    setTimeout(() => {
      this.discoveryToastEl.style.opacity = '0';
      setTimeout(() => {
        this.discoveryToastEl.classList.add('hidden');
        this.discoveryToastEl.style.display = 'none';
      }, 400);
    }, 4500);
  }
}

window.ExplorationUI = ExplorationUI;
