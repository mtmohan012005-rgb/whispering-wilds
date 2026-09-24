// ============================================================================
// THE WHISPERING WILDS - CROWD SYSTEM
// ============================================================================

(function() {
    class CrowdSystem {
        constructor(scene) {
            this.scene = scene;
            this.agents = [];
            this.currentRegion = null;
        }

        setRegion(regionId) {
            if (this.currentRegion === regionId && this.agents.length > 0) return;
            this.clear();
            this.currentRegion = regionId;
            this.spawnCrowd(regionId);
        }

        spawnCrowd(regionId) {
            const caps = window.CROWD_DATA?.PERFORMANCE_CAPS?.[regionId] || { maxFull: 3, maxMedium: 3 };
            const totalCount = Math.min(caps.maxFull + caps.maxMedium, 8);

            const zones = (window.CROWD_DATA?.GATHERING_ZONES || []).filter(z => z.region === regionId);
            const center = zones.length > 0 ? zones[0].center : { x: 0, y: 0, z: 0 };

            for (let i = 0; i < totalCount; i++) {
                const angle = (i / totalCount) * Math.PI * 2;
                const dist = 5.0 + (i % 3) * 4.0;
                const pos = {
                    x: center.x + Math.cos(angle) * dist,
                    y: 0,
                    z: center.z + Math.sin(angle) * dist
                };

                const dest = {
                    x: center.x + Math.sin(angle) * (dist * 0.8),
                    y: 0,
                    z: center.z + Math.cos(angle) * (dist * 0.8)
                };

                const agent = new window.CrowdAgent({
                    position: pos,
                    destination: dest,
                    speed: 1.4 + (i % 3) * 0.3
                });

                this.agents.push(agent);
                if (this.scene && agent.mesh) {
                    this.scene.add(agent.mesh);
                }
            }
        }

        update(deltaTime, playerPosition = null) {
            for (const agent of this.agents) {
                agent.update(deltaTime, playerPosition);
            }
        }

        clear() {
            for (const a of this.agents) {
                if (this.scene && a.mesh) {
                    this.scene.remove(a.mesh);
                }
            }
            this.agents = [];
        }
    }

    window.CrowdSystem = CrowdSystem;
})();
