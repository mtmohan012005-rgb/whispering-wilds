// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REGIONAL DISCOVERY UI COMPONENT
// Displays regional discovery progress bars across all 8 regions of Tamil Nadu.
// ============================================================================

(function() {
    class DiscoveryUI {
        static renderRegionalProgress(containerEl) {
            if (!containerEl || !window.discoveryProgressionSystem) return;

            const progress = window.discoveryProgressionSystem.getAllProgress();
            containerEl.innerHTML = '';

            for (const [regionId, p] of Object.entries(progress)) {
                const row = document.createElement('div');
                row.style.cssText = 'background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;';

                const regionName = regionId.replace('_', ' ').toUpperCase();

                row.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #f8fafc;">
                        <span>🧭 ${regionName}</span>
                        <span style="color: #ffd700;">${p.discovered} / ${p.total} (${p.percent}%)</span>
                    </div>
                    <div class="progression-bar-container">
                        <div class="progression-bar-fill" style="width: ${p.percent}%;"></div>
                    </div>
                    <div style="font-size: 11px; color: ${p.isExplored ? '#22c55e' : '#94a3b8'};">
                        ${p.isExplored ? '✓ REGION EXPLORED (70%+ Discovery)' : 'Exploration In Progress'}
                    </div>
                `;

                containerEl.appendChild(row);
            }
        }
    }

    window.DiscoveryUI = DiscoveryUI;
})();
