// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MASTER CODEX SYSTEM
// Manages the 9-section reference encyclopedia across Tamil Nadu.
// Supports fast filtering, live search, favorites, notes, and GameState syncing.
// ============================================================================

(function() {
    class CodexSystem {
        constructor() {
            this.sections = ['WORLD', 'WILDLIFE', 'CULTURE', 'PLACES', 'FOOD', 'CRAFT', 'CHARACTERS', 'STORY', 'PHOTOGRAPHY'];
            this.entries = new Map();
            this.favorites = new Set();
            this.notes = new Map(); // entryKey -> noteText
            this.unlockedEntries = new Set();

            this.init();
        }

        init(savedData = null) {
            this.entries.clear();

            // Load base catalog entries from CODEX_DATA
            const baseCatalog = (window.CODEX_DATA && window.CODEX_DATA.ENTRIES) ? window.CODEX_DATA.ENTRIES : {};
            for (const [id, entry] of Object.entries(baseCatalog)) {
                this.entries.set(id, {
                    ...entry,
                    discovered: !!entry.discovered,
                    discoveredAt: entry.discovered ? Date.now() : null
                });
                if (entry.discovered) this.unlockedEntries.add(id);
            }

            // Load Wildlife entries into Codex
            const wildlifeCatalog = window.WILDLIFE_CODEX_DATA || {};
            for (const [id, w] of Object.entries(wildlifeCatalog)) {
                const key = `wildlife_${id}`;
                this.entries.set(key, {
                    id: key,
                    section: 'WILDLIFE',
                    title: w.displayName,
                    tamilTitle: w.tamilName,
                    region: w.region,
                    hint: `Native to ${w.biome}`,
                    historicalContext: `Ecological Status: ${w.status}. ${w.codexDescription}`,
                    gameLore: `Behavior: ${w.behavior ? w.behavior.join(', ') : 'Standard'}. Photo required: ${w.photoRequired ? 'Yes' : 'No'}.`,
                    discovered: !!w.discovered,
                    discoveredAt: w.firstObservedAt || null,
                    speciesKey: id
                });
                if (w.discovered) this.unlockedEntries.add(key);
            }

            // Load Culture entries into Codex
            const cultureCatalog = (window.CULTURE_CODEX_DATA && window.CULTURE_CODEX_DATA.ENTRIES) ? window.CULTURE_CODEX_DATA.ENTRIES : {};
            for (const [id, c] of Object.entries(cultureCatalog)) {
                const key = `culture_${id}`;
                this.entries.set(key, {
                    id: key,
                    section: 'CULTURE',
                    title: c.title,
                    tamilTitle: c.tamilTitle,
                    region: c.region,
                    category: c.category,
                    hint: `Traditional ${c.category ? c.category.toLowerCase() : 'heritage'} artifact.`,
                    historicalContext: c.realContext,
                    gameLore: c.gameStory,
                    discovered: !!c.discovered,
                    discoveredAt: c.discovered ? Date.now() : null,
                    cultureKey: id
                });
                if (c.discovered) this.unlockedEntries.add(key);
            }

            if (savedData) {
                this.deserialize(savedData);
            } else {
                this.loadFromGameState();
            }
            return this;
        }

        loadFromGameState() {
            if (!window.GameState) return;

            if (!window.GameState.codex) {
                window.GameState.codex = {
                    unlockedEntries: Array.from(this.unlockedEntries),
                    favorites: Array.from(this.favorites),
                    notes: Object.fromEntries(this.notes)
                };
            }

            const state = window.GameState.codex;
            if (Array.isArray(state.unlockedEntries)) {
                state.unlockedEntries.forEach(id => {
                    this.unlockedEntries.add(id);
                    const e = this.entries.get(id);
                    if (e) e.discovered = true;
                });
            }
            if (Array.isArray(state.favorites)) {
                state.favorites.forEach(f => this.favorites.add(f));
            }
            if (state.notes && typeof state.notes === 'object') {
                for (const [k, v] of Object.entries(state.notes)) {
                    this.notes.set(k, v);
                }
            }
        }

        syncToGameState() {
            if (!window.GameState) return;

            // Enforce customization limit
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            window.GameState.codex = {
                unlockedEntries: Array.from(this.unlockedEntries),
                favorites: Array.from(this.favorites),
                notes: Object.fromEntries(this.notes)
            };
        }

        _resolveKey(section, entryId) {
            if (!entryId) return section;
            if (this.entries.has(entryId)) return entryId;
            const prefix = section ? section.toLowerCase() + '_' : '';
            if (this.entries.has(`${prefix}${entryId}`)) return `${prefix}${entryId}`;
            return entryId;
        }

        unlockEntry(section, entryId) {
            const key = this._resolveKey(section, entryId);
            this.unlockedEntries.add(key);

            let entry = this.entries.get(key);
            if (!entry) {
                entry = {
                    id: key,
                    section: (section || 'WORLD').toUpperCase(),
                    title: (entryId || key).replace(/_/g, ' ').toUpperCase(),
                    discovered: true,
                    discoveredAt: Date.now()
                };
                this.entries.set(key, entry);
            } else {
                entry.discovered = true;
                entry.discoveredAt = Date.now();
            }

            this.syncToGameState();

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('codex_entry_unlocked', { detail: { entry } }));
            }
            return true;
        }

        isUnlocked(section, entryId) {
            const key = this._resolveKey(section, entryId);
            const entry = this.entries.get(key);
            return (entry && entry.discovered) || this.unlockedEntries.has(key);
        }

        toggleFavorite(section, entryId) {
            const key = this._resolveKey(section, entryId);
            if (this.favorites.has(key)) {
                this.favorites.delete(key);
            } else {
                this.favorites.add(key);
            }
            this.syncToGameState();
            return this.favorites.has(key);
        }

        isFavorite(section, entryId) {
            const key = this._resolveKey(section, entryId);
            return this.favorites.has(key);
        }

        saveNote(section, entryId, noteText) {
            const key = this._resolveKey(section, entryId);
            this.notes.set(key, noteText);
            this.syncToGameState();
        }

        getNote(section, entryId) {
            const key = this._resolveKey(section, entryId);
            return this.notes.get(key) || '';
        }

        getUnlockedCount() {
            return this.unlockedEntries.size;
        }

        getEntry(entryId) {
            return this.entries.get(entryId) || null;
        }

        getSectionCounts() {
            const counts = {};
            for (const entry of this.entries.values()) {
                const sec = entry.section;
                if (!counts[sec]) counts[sec] = { total: 0, discovered: 0 };
                counts[sec].total++;
                if (entry.discovered) counts[sec].discovered++;
            }
            return counts;
        }

        filterEntries(options = {}) {
            const { section = 'ALL', region = 'ALL', status = 'ALL', search = '' } = options;
            const searchLower = search.toLowerCase().trim();
            const results = [];

            for (const entry of this.entries.values()) {
                if (section !== 'ALL' && entry.section !== section) continue;
                if (region !== 'ALL' && entry.region !== region) continue;

                if (status === 'DISCOVERED' && !entry.discovered) continue;
                if (status === 'UNDISCOVERED' && entry.discovered) continue;
                if (status === 'FAVORITES' && !this.favorites.has(entry.id)) continue;

                if (searchLower.length > 0) {
                    const matchTitle = entry.title && entry.title.toLowerCase().includes(searchLower);
                    const matchTamil = entry.tamilTitle && entry.tamilTitle.toLowerCase().includes(searchLower);
                    const matchRegion = entry.region && entry.region.toLowerCase().includes(searchLower);
                    if (!matchTitle && !matchTamil && !matchRegion) continue;
                }

                results.push({
                    ...entry,
                    isFavorite: this.favorites.has(entry.id),
                    note: this.notes.get(entry.id) || ''
                });
            }

            return results;
        }

        serialize() {
            return {
                unlockedEntries: Array.from(this.unlockedEntries),
                favorites: Array.from(this.favorites),
                notes: Object.fromEntries(this.notes)
            };
        }

        deserialize(savedData) {
            if (!savedData) return;
            if (Array.isArray(savedData.unlockedEntries)) {
                savedData.unlockedEntries.forEach(id => {
                    this.unlockedEntries.add(id);
                    const e = this.entries.get(id);
                    if (e) e.discovered = true;
                });
            }
            if (Array.isArray(savedData.favorites)) {
                savedData.favorites.forEach(f => this.favorites.add(f));
            }
            if (savedData.notes && typeof savedData.notes === 'object') {
                for (const [k, v] of Object.entries(savedData.notes)) {
                    this.notes.set(k, v);
                }
            }
            this.syncToGameState();
        }
    }

    const instance = new CodexSystem();

    if (typeof window !== 'undefined') {
        window.CodexSystem = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})();
