// ============================================================================
// THE WHISPERING WILDS - NAVIGATION HUD & COMPASS UI
// ============================================================================

(function() {
    class NavigationUI {
        constructor() {
            this.container = null;
            this.initDOM();
        }

        initDOM() {
            if (document.getElementById('navCompassContainer')) return;

            const div = document.createElement('div');
            div.id = 'navCompassContainer';
            div.style.cssText = `
                position: fixed;
                top: 18px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 6px 18px;
                background: rgba(10, 18, 14, 0.65);
                border: 1px solid rgba(212, 175, 55, 0.35);
                border-radius: 20px;
                backdrop-filter: blur(6px);
                z-index: 1000;
                font-family: 'Outfit', sans-serif;
                color: #e6ede8;
                font-size: 12px;
                letter-spacing: 1px;
                user-select: none;
                pointer-events: none;
            `;

            div.innerHTML = `
                <div id="navRegionText" style="font-weight:700; color:#d4af37;">GEORGE TOWN</div>
                <div style="width:1px; height:14px; background:rgba(212,175,55,0.3);"></div>
                <div id="navCompassBearing" style="font-weight:600; color:#8fa89b;">N 0°</div>
            `;

            document.body.appendChild(div);
            this.container = div;
        }

        update() {
            if (!window.NavigationSystem) return;

            const regEl = document.getElementById('navRegionText');
            const compEl = document.getElementById('navCompassBearing');

            if (regEl) {
                const regData = window.NAVIGATION_DATA?.REGIONS?.[window.NavigationSystem.currentRegionId];
                regEl.textContent = regData ? regData.displayName.split('(')[0].trim() : 'TAMIL NADU';
            }
            if (compEl) {
                compEl.textContent = `${window.NavigationSystem.cardinal} ${window.NavigationSystem.bearing}°`;
            }
        }
    }

    window.NavigationUI = new NavigationUI();
})();
