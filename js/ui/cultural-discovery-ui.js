/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Cultural Discovery Popup Interface (CulturalDiscoveryUI)
 * Displays authentic cultural discovery cards with Tamil script, regional origin,
 * and historical lore when the player observes significant traditional props.
 */

class CulturalDiscoveryUI {
  constructor() {
    this.modalEl = null;
    this.initDOM();
  }

  initDOM() {
    this.modalEl = document.getElementById('cultural-discovery-modal');
    if (!this.modalEl) {
      this.modalEl = document.createElement('div');
      this.modalEl.id = 'cultural-discovery-modal';
      this.modalEl.className = 'hidden';
      this.modalEl.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(12, 10, 8, 0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 1800; font-family: Segoe UI, sans-serif;';
      document.body.appendChild(this.modalEl);
    }
  }

  showDiscovery(record) {
    if (!this.modalEl || !record) return;

    this.modalEl.innerHTML = `
      <div style="background: linear-gradient(145deg, #2b1f14, #19120b); border: 2.5px solid #d4af37; border-radius: 14px; max-width: 520px; width: 88%; padding: 28px; box-shadow: 0 25px 70px rgba(0,0,0,0.9); color: #fff; text-align: center; position: relative;">
        <button id="close-cultural-btn" style="position: absolute; top: 14px; right: 18px; background: none; border: none; color: #d4af37; font-size: 22px; cursor: pointer;">✕</button>
        <div style="font-size: 11px; color: #d4af37; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-bottom: 6px;">📜 CULTURAL DISCOVERY (பாரம்பரியக் கண்டுபிடிப்பு)</div>
        <h2 style="margin: 0 0 4px 0; color: #f59e0b; font-size: 22px;">${record.name}</h2>
        <div style="color: #fcd34d; font-size: 16px; margin-bottom: 12px; font-weight: 500;">${record.tamilName || ''}</div>
        <div style="display: inline-block; background: rgba(212, 175, 55, 0.15); border: 1px solid #d4af37; border-radius: 16px; padding: 4px 14px; font-size: 12px; color: #fef3c7; margin-bottom: 18px;">
          📍 Region: ${record.region || 'Tamil Nadu'}
        </div>
        <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0 0 22px 0; text-align: justify; text-justify: inter-word;">
          ${record.lore || ''}
        </p>
        <button id="ok-cultural-btn" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; font-weight: bold; font-size: 14px; border: none; border-radius: 6px; padding: 10px 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">Filed to Journal [Close]</button>
      </div>
    `;

    this.modalEl.classList.remove('hidden');
    this.modalEl.style.display = 'flex';

    const close = () => {
      this.modalEl.classList.add('hidden');
      this.modalEl.style.display = 'none';
    };

    const closeBtn = this.modalEl.querySelector('#close-cultural-btn');
    const okBtn = this.modalEl.querySelector('#ok-cultural-btn');
    if (closeBtn) closeBtn.onclick = close;
    if (okBtn) okBtn.onclick = close;
  }
}

window.CulturalDiscoveryUI = CulturalDiscoveryUI;
