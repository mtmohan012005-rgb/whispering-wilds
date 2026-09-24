// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CULTURE CODEX UI COMPONENT
// Renders cultural heritage cards, category filters, and dual context blocks.
// ============================================================================

(function() {
    class CultureCodexUI {
        static renderCards(containerEl) {
            if (!containerEl || !window.CULTURE_CODEX_DATA) return;

            const catalog = window.CULTURE_CODEX_DATA.ENTRIES;
            containerEl.innerHTML = '';

            for (const [id, c] of Object.entries(catalog)) {
                const isDiscovered = window.cultureDiscoverySystem ? window.cultureDiscoverySystem.isDiscovered(id) : false;
                const card = document.createElement('div');
                card.className = 'codex-card';

                card.innerHTML = `
                    <div class="codex-card-header">
                        <span class="codex-card-title">${isDiscovered ? '🏛️ ' : '🔒 '}${isDiscovered ? c.title : 'Undiscovered Heritage Item'}</span>
                        <span style="font-size: 11px; color: ${isDiscovered ? '#22c55e' : '#64748b'};">${isDiscovered ? 'DISCOVERED' : 'LOCKED'}</span>
                    </div>
                    <div class="codex-card-tamil">${isDiscovered ? c.tamilTitle : 'அறியப்படாத மரபுக்கூறு'}</div>
                    <div style="font-size: 11px; color: #d4af37; margin-top: 4px;">Category: ${c.category}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Region: ${c.region.toUpperCase()}</div>
                `;

                containerEl.appendChild(card);
            }
        }
    }

    window.CultureCodexUI = CultureCodexUI;
})();
