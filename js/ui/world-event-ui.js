// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WORLD EVENT UI
// Floating HUD banner announcing active dynamic world events.
// ============================================================================

(function() {
    class WorldEventUI {
        constructor() {
            this.bannerElement = null;
        }

        init() {
            if (this.bannerElement) return;

            const banner = document.createElement('div');
            banner.id = 'world-event-banner';
            banner.style.cssText = `
                position: fixed;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(15,23,42,0.92), rgba(10,15,29,0.95));
                border: 1px solid rgba(212,175,55,0.5);
                box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                border-radius: 8px;
                padding: 12px 28px;
                z-index: 8500;
                display: none;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
                animation: slideDownBanner 0.4s ease forwards;
            `;

            banner.innerHTML = `
                <div style="font-size: 11px; color: #ffd700; text-transform: uppercase; letter-spacing: 2px;">
                    WORLD OCCURRENCE &bull; <span id="we-banner-type">ENVIRONMENTAL</span>
                </div>
                <div style="font-size: 18px; font-weight: bold; color: #f8fafc; font-family: 'Cinzel', serif; margin: 2px 0;" id="we-banner-title">
                    Cauvery River Swell
                </div>
                <div style="font-size: 12px; color: #38bdf8;" id="we-banner-tamil">
                    காவிரி வெள்ளப்பெருக்கு
                </div>
            `;

            document.body.appendChild(banner);
            this.bannerElement = banner;
        }

        showEventBanner(eventData) {
            this.init();
            this.bannerElement.querySelector('#we-banner-type').textContent = (eventData.type || 'Dynamic').toUpperCase();
            this.bannerElement.querySelector('#we-banner-title').textContent = eventData.title;
            this.bannerElement.querySelector('#we-banner-tamil').textContent = eventData.tamilTitle || '';

            this.bannerElement.style.display = 'flex';

            // Auto hide banner after 8 seconds (event continues running in background)
            setTimeout(() => {
                if (this.bannerElement) {
                    this.bannerElement.style.display = 'none';
                }
            }, 8000);
        }
    }

    if (typeof window !== 'undefined') {
        window.WorldEventUI = new WorldEventUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { WorldEventUI };
    }
})();
