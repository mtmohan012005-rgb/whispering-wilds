// ============================================================================
// THE WHISPERING WILDS - MASTER NAVIGATION & EXPLORATION SYSTEM
// ============================================================================

(function() {
    class NavigationSystem {
        constructor() {
            this.currentRegionId = 'GEORGE_TOWN';
            this.bearing = 0; // 0..360 deg
            this.cardinal = 'N';
        }

        update(playerPos, cameraRotationY = 0) {
            if (!playerPos) return;

            // 1. Detect region boundary crossing
            const detectedRegion = this.findRegionAt(playerPos.x, playerPos.z);
            if (detectedRegion && detectedRegion !== this.currentRegionId) {
                this.currentRegionId = detectedRegion;

                if (window.RegionProgressionSystem) {
                    window.RegionProgressionSystem.discoverRegion(detectedRegion);
                    window.RegionProgressionSystem.visitRegion(detectedRegion);
                }

                if (window.GameState && window.GameState.world) {
                    window.GameState.world.currentRegion = detectedRegion;
                }
            }

            // 2. Calculate compass heading
            let deg = (cameraRotationY * (180 / Math.PI)) % 360;
            if (deg < 0) deg += 360;
            this.bearing = Math.round(deg);
            this.cardinal = this.calculateCardinal(this.bearing);
        }

        findRegionAt(x, z) {
            const regions = window.NAVIGATION_DATA?.REGIONS || {};
            for (const [id, r] of Object.entries(regions)) {
                const b = r.bounds;
                if (b && x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
                    return id;
                }
            }
            return null;
        }

        calculateCardinal(deg) {
            const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const idx = Math.round(deg / 45) % 8;
            return cardinals[idx];
        }

        getNearbySignposts(playerPos, maxRadius = 10.0) {
            const signs = [];
            const reg = window.NAVIGATION_DATA?.REGIONS?.[this.currentRegionId];
            if (!reg || !reg.signposts) return signs;

            for (const s of reg.signposts) {
                const dist = Math.hypot(s.pos.x - playerPos.x, s.pos.z - playerPos.z);
                if (dist <= maxRadius) {
                    signs.push({ ...s, distance: Math.round(dist) });
                }
            }
            return signs;
        }
    }

    window.NavigationSystem = new NavigationSystem();
})();
