// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WILDLIFE CODEX UI COMPONENT
// Renders species cards, observation criteria, IUCN status and photo status.
// ============================================================================

(function() {
    class WildlifeCodexUI {
        static renderCards(containerEl) {
            if (!containerEl || !window.WILDLIFE_CODEX_DATA) return;

            const catalog = window.WILDLIFE_CODEX_DATA;
            containerEl.innerHTML = '';

            for (const [id, w] of Object.entries(catalog)) {
                const card = document.createElement('div');
                card.className = 'codex-card';

                const isObserved = window.wildlifeObservationSystem ? window.wildlifeObservationSystem.observedSpecies.has(id) : false;

                card.innerHTML = `
                    <div class="codex-card-header">
                        <span class="codex-card-title">${isObserved ? '🐾 ' : '🔒 '}${isObserved ? w.displayName : 'Undiscovered Species'}</span>
                        <span style="font-size: 11px; color: ${isObserved ? '#22c55e' : '#eab308'};">${isObserved ? 'OBSERVED' : 'TRACKING'}</span>
                    </div>
                    <div class="codex-card-tamil">${isObserved ? w.tamilName : 'காணப்படாத உயிரினம்'}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Region: ${w.region.toUpperCase()}</div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">${w.biome}</div>
                    <div style="font-size: 11px; color: #d4af37; margin-top: 4px;">
                        ${w.photoRequired ? '📷 Photo Required' : '👁️ Visual Observation'}
                    </div>
                `;

                containerEl.appendChild(card);
            }
        }
    }

    window.WildlifeCodexUI = WildlifeCodexUI;
})();
