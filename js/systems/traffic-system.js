// ============================================================================
// THE WHISPERING WILDS - TRAFFIC SYSTEM
// ============================================================================

(function() {
    class TrafficSystem {
        constructor(scene) {
            this.scene = scene;
            this.vehicles = [];
            this.currentRegion = null;
        }

        setRegion(regionId) {
            if (this.currentRegion === regionId && this.vehicles.length > 0) return;
            this.clear();
            this.currentRegion = regionId;
            this.spawnRegionTraffic(regionId);
        }

        spawnRegionTraffic(regionId) {
            const routes = window.TRAFFIC_DATA?.ROUTES?.[regionId];
            if (!routes || !Array.isArray(routes)) return;

            for (const route of routes) {
                const vehicle = new window.TrafficVehicle({
                    type: route.vehicleType,
                    speed: route.speed,
                    waypoints: route.waypoints
                });
                this.vehicles.push(vehicle);
                if (this.scene && vehicle.mesh) {
                    this.scene.add(vehicle.mesh);
                }
            }
        }

        update(deltaTime, playerPosition = null) {
            for (const v of this.vehicles) {
                v.update(deltaTime, playerPosition);
            }
        }

        clear() {
            for (const v of this.vehicles) {
                if (this.scene && v.mesh) {
                    this.scene.remove(v.mesh);
                }
            }
            this.vehicles = [];
        }
    }

    window.TrafficSystem = TrafficSystem;
})();
