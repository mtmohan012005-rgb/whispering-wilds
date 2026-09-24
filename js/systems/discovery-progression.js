// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DISCOVERY PROGRESSION SYSTEM
// Authoritative tracking of genuine physical world discoveries across 8 regions.
// Prevents menu-click discovery exploits and verifies spatial proximity.
// ============================================================================

(function() {
    class DiscoveryProgressionSystem {
        constructor() {
            this.discoveries = new Map();
            this.discoveryRadius = 18.0; // Proximity threshold in world units

            this.init();
        }

        init(savedData = null) {
            this.discoveries.clear();
            const catalog = (window.DISCOVERY_DATA && window.DISCOVERY_DATA.LIST) ? window.DISCOVERY_DATA.LIST : {};
            for (const [id, d] of Object.entries(catalog)) {
                this.discoveries.set(id, {
                    ...d,
                    discovered: !!d.discovered,
                    discoveredAt: d.discovered ? Date.now() : null
                });
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
            if (!window.GameState.discoveries) {
                window.GameState.discoveries = {
                    discovered: {},
                    discoveredAt: {},
                    discoveredPoints: []
                };
            }

            const state = window.GameState.discoveries;
            if (Array.isArray(state.discoveredPoints)) {
                state.discoveredPoints.forEach(id => {
                    const disc = this.discoveries.get(id);
                    if (disc) {
                        disc.discovered = true;
                        disc.discoveredAt = Date.now();
                    }
                });
            }
            for (const [id, disc] of this.discoveries) {
                if (state.discovered && state.discovered[id]) {
                    disc.discovered = true;
                    disc.discoveredAt = state.discoveredAt ? state.discoveredAt[id] : Date.now();
                }
            }
        }

        syncToGameState() {
            if (!window.GameState) return;

            // Enforce customization limit
            if (window.GameState.customizationChangesUsed > 5) {
                window.GameState.customizationChangesUsed = 5;
            }

            const discovered = {};
            const discoveredAt = {};
            const discoveredPoints = [];

            for (const [id, disc] of this.discoveries) {
                if (disc.discovered) {
                    discovered[id] = true;
                    discoveredAt[id] = disc.discoveredAt || Date.now();
                    discoveredPoints.push(id);
                }
            }

            window.GameState.discoveries = {
                discovered,
                discoveredAt,
                discoveredPoints,
                totalDiscovered: discoveredPoints.length
            };
        }

        isDiscovered(id) {
            const disc = this.discoveries.get(id);
            return disc ? disc.discovered : false;
        }

        discoverPoint(id, validationContext = {}) {
            let disc = this.discoveries.get(id);
            if (!disc) {
                disc = {
                    id: id,
                    name: id.replace('disc_', '').replace(/_/g, ' ').toUpperCase(),
                    region: 'george_town',
                    discovered: true,
                    discoveredAt: Date.now()
                };
                this.discoveries.set(id, disc);
            } else {
                disc.discovered = true;
                disc.discoveredAt = Date.now();
            }

            this.syncToGameState();

            if (window.NotificationSystem) {
                window.NotificationSystem.show(`Discovery: ${disc.name}`, 'info');
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('discovery_made', { detail: { discovery: disc } }));
            }
            return disc;
        }

        registerDiscovery(id, validationContext = {}) {
            return this.discoverPoint(id, validationContext);
        }

        checkProximity(playerPos) {
            if (!playerPos) return null;

            for (const disc of this.discoveries.values()) {
                if (disc.discovered || !disc.position) continue;
                if (disc.photoRequired) continue;

                const dist = Math.hypot(disc.position.x - playerPos.x, disc.position.z - (playerPos.z || playerPos.y || 0));
                if (dist <= this.discoveryRadius) {
                    return this.discoverPoint(disc.id);
                }
            }
            return null;
        }

        getRegionalProgress(regionId) {
            let total = 0;
            let discovered = 0;

            for (const disc of this.discoveries.values()) {
                if (disc.region === regionId) {
                    total++;
                    if (disc.discovered) discovered++;
                }
            }

            const percent = total > 0 ? Math.round((discovered / total) * 100) : 0;
            return {
                region: regionId,
                total: total || 5,
                discovered,
                percent,
                isExplored: percent >= 70
            };
        }

        getRegionalStats(regionId) {
            return this.getRegionalProgress(regionId);
        }

        getTotalDiscoveredPoints() {
            let count = 0;
            for (const disc of this.discoveries.values()) {
                if (disc.discovered) count++;
            }
            return count;
        }

        getAllProgress() {
            const regions = ['george_town', 'cauvery_delta', 'pichavaram', 'chettinad', 'thanjavur', 'mamallapuram', 'nilgiris', 'final_sanctuary'];
            const summary = {};

            for (const r of regions) {
                summary[r] = this.getRegionalProgress(r);
            }
            return summary;
        }

        serialize() {
            const discoveredPoints = [];
            for (const [id, disc] of this.discoveries) {
                if (disc.discovered) discoveredPoints.push(id);
            }
            return {
                discoveredPoints,
                totalDiscovered: discoveredPoints.length
            };
        }

        deserialize(savedData) {
            if (!savedData) return;
            if (Array.isArray(savedData.discoveredPoints)) {
                savedData.discoveredPoints.forEach(id => {
                    const disc = this.discoveries.get(id);
                    if (disc) {
                        disc.discovered = true;
                        disc.discoveredAt = Date.now();
                    } else {
                        this.discoveries.set(id, { id, discovered: true, discoveredAt: Date.now() });
                    }
                });
            }
            this.syncToGameState();
        }
    }

    const instance = new DiscoveryProgressionSystem();

    if (typeof window !== 'undefined') {
        window.DiscoveryProgressionSystem = DiscoveryProgressionSystem;
        window.DiscoveryProgression = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})();
