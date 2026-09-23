/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Festival HUD Interface Controller (FestivalUI)
 * Displays regional festival banners, celebration status badges, and phase milestones.
 */

class FestivalUI {
  constructor() {
    this.bannerEl = null;
    this.initDOM();
  }

  initDOM() {
    this.bannerEl = document.getElementById('festival-banner-hud');
    if (!this.bannerEl) {
      this.bannerEl = document.createElement('div');
      this.bannerEl.id = 'festival-banner-hud';
      this.bannerEl.className = 'hidden';
      this.bannerEl.style.cssText = 'position: fixed; top: 16px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, rgba(180, 83, 9, 0.95), rgba(120, 53, 15, 0.95)); border: 2px solid #fbbf24; border-radius: 20px; padding: 8px 24px; color: #fff; text-align: center; z-index: 1050; font-family: Segoe UI, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,0.7); display: none;';
      document.body.appendChild(this.bannerEl);
    }
  }

  showFestivalBanner(festival, phaseKey = 'ACTIVE') {
    if (!this.bannerEl || !festival) return;

    this.bannerEl.innerHTML = `
      <div style="font-size: 11px; color: #fde68a; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">🌾 REGIONAL CELEBRATION • ${phaseKey}</div>
      <div style="font-size: 15px; font-weight: bold; color: #fff;">${festival.name} • <span style="color: #fef08a;">${festival.tamilName || ''}</span></div>
    `;

    this.bannerEl.classList.remove('hidden');
    this.bannerEl.style.display = 'block';

    setTimeout(() => {
      if (this.bannerEl) {
        this.bannerEl.classList.add('hidden');
        this.bannerEl.style.display = 'none';
      }
    }, 6000);
  }
}

window.FestivalUI = FestivalUI;
