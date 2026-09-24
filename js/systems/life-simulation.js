// ============================================================================
// THE WHISPERING WILDS - MASTER LIFE SIMULATION SYSTEM (AI-FREE / DETERMINISTIC)
// ============================================================================

(function() {
    class LifeSimulationSystem {
        constructor(scene = null) {
            this.scene = scene;
            this.traffic = new window.TrafficSystem(scene);
            this.crowd = new window.CrowdSystem(scene);
            this.ambient = new window.AmbientActivitySystem(scene);
            this.activityPoints = new Map();
            this.currentRegion = null;
            this.currentHour = 9; // 0..24
            this.weather = 'clear';

            this.initDefaultActivityPoints();
        }

        initDefaultActivityPoints() {
            const points = [
                { id: 'gt_murugan_tea', region: 'GEORGE_TOWN', position: { x: 5, y: 0, z: -10 }, activityType: 'tea_counter', schedule: { startHour: 5, endHour: 22 } },
                { id: 'delta_paddy_field', region: 'CAUVERY_DELTA', position: { x: 30, y: 0, z: 50 }, activityType: 'farm_field', schedule: { startHour: 6, endHour: 18 } },
                { id: 'pichavaram_dock', region: 'PICHAVARAM', position: { x: -15, y: 0, z: 130 }, activityType: 'boat_dock', schedule: { startHour: 5, endHour: 19 } }
            ];

            for (const p of points) {
                this.activityPoints.set(p.id, new window.ActivityPoint(p));
            }
        }

        setScene(scene) {
            this.scene = scene;
            this.traffic.scene = scene;
            this.crowd.scene = scene;
            this.ambient.scene = scene;
        }

        setRegion(regionId, force = false) {
            if (!force && this.currentRegion === regionId && this.traffic.vehicles.length > 0) return;
            this.currentRegion = regionId;
            this.traffic.setRegion(regionId);
            this.crowd.setRegion(regionId);
        }

        updateTimeAndWeather(hour, weather) {
            this.currentHour = hour;
            this.weather = weather || 'clear';
        }

        update(deltaTime, playerPosition = null) {
            // Update time from GameState if available
            if (window.GameState && window.GameState.world) {
                const worldTime = window.GameState.world.time || 9.0;
                this.currentHour = worldTime;
                this.weather = window.GameState.world.weather || 'clear';
                if (window.GameState.world.currentRegion) {
                    this.setRegion(window.GameState.world.currentRegion);
                }
            }

            // Weather modifier: rain reduces vehicle speeds slightly and dampens crowd
            const rainFactor = (this.weather === 'rain' || this.weather === 'heavy_rain' || this.weather === 'storm') ? 0.7 : 1.0;

            this.traffic.update(deltaTime * rainFactor, playerPosition);
            this.crowd.update(deltaTime * rainFactor, playerPosition);
            this.ambient.update(deltaTime);
        }

        getActivityPoint(id) {
            return this.activityPoints.get(id) || null;
        }

        clear() {
            this.traffic.clear();
            this.crowd.clear();
        }
    }

    window.LifeSimulationSystem = LifeSimulationSystem;
})();
