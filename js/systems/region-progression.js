// ============================================================================
// THE WHISPERING WILDS - REGION PROGRESSION SYSTEM
// ============================================================================

(function() {
    class RegionProgressionSystem {
        constructor() {
            this.states = new Map();
            this.initDefaultStates();
        }

        initDefaultStates() {
            const regions = window.NAVIGATION_DATA?.REGIONS || {};
            for (const [id, data] of Object.entries(regions)) {
                this.states.set(id, data.initialState || 'UNKNOWN');
            }
        }

        getRegionState(regionId) {
            return this.states.get(regionId) || 'UNKNOWN';
        }

        discoverRegion(regionId) {
            const current = this.getRegionState(regionId);
            if (current === 'UNKNOWN' || current === 'KNOWN') {
                this.states.set(regionId, 'DISCOVERED');
                this.notifyDiscovery(regionId);
                return true;
            }
            return false;
        }

        unlockRegion(regionId) {
            this.states.set(regionId, 'UNLOCKED');
        }

        visitRegion(regionId) {
            const current = this.getRegionState(regionId);
            if (current !== 'COMPLETED') {
                this.states.set(regionId, 'VISITED');
            }
        }

        isAccessible(regionId) {
            const state = this.getRegionState(regionId);
            return ['DISCOVERED', 'UNLOCKED', 'VISITED', 'COMPLETED'].includes(state);
        }

        notifyDiscovery(regionId) {
            const reg = window.NAVIGATION_DATA?.REGIONS?.[regionId];
            const name = reg ? reg.displayName : regionId;

            if (window.NotificationUI) {
                window.NotificationUI.show(`New Region Discovered: ${name}`, 'REGION UNLOCKED', 4000);
            }
            if (window.JournalSystem) {
                window.JournalSystem.addEntry?.('DISCOVERY', `Traversed into ${name}`);
            }
            if (window.AudioEngine) {
                window.AudioEngine.playDiscovery?.();
            }
        }

        serialize() {
            const out = {};
            for (const [k, v] of this.states.entries()) {
                out[k] = v;
            }
            return out;
        }

        deserialize(data) {
            if (!data || typeof data !== 'object') return;
            for (const [k, v] of Object.entries(data)) {
                this.states.set(k, v);
            }
        }
    }

    window.RegionProgressionSystem = new RegionProgressionSystem();
})();
