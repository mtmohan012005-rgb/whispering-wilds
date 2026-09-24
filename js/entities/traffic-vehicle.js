// ============================================================================
// THE WHISPERING WILDS - TRAFFIC VEHICLE ENTITY
// ============================================================================

(function() {
    class TrafficVehicle {
        constructor(config = {}) {
            this.id = config.id || `veh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            this.type = config.type || 'AUTO_RICKSHAW';
            this.speed = config.speed || 6.0;
            this.waypoints = config.waypoints || [];
            this.currentWaypointIndex = (this.waypoints.length > 1) ? 1 : 0;

            this.position = { x: 0, y: 0, z: 0 };
            if (this.waypoints.length > 0) {
                this.position = { ...this.waypoints[0] };
            }
            this.rotationY = 0;
            this.isStopped = false;
            this.stopTimer = 0;

            this.mesh = this.buildMesh();
        }

        buildMesh() {
            const group = new THREE.Group();
            let bodyGeo, bodyMat;

            if (this.type === 'AUTO_RICKSHAW') {
                bodyGeo = new THREE.BoxGeometry(1.4, 1.3, 2.2);
                bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.3 }); // Iconic yellow auto
                const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.2, 2.22), new THREE.MeshStandardMaterial({ color: 0x111111 }));
                roof.position.y = 0.7;
                group.add(roof);
            } else if (this.type === 'BUS') {
                bodyGeo = new THREE.BoxGeometry(2.4, 2.4, 6.5);
                bodyMat = new THREE.MeshStandardMaterial({ color: 0x2266aa, roughness: 0.5 }); // Blue town bus
            } else if (this.type === 'WOODEN_BOAT') {
                bodyGeo = new THREE.BoxGeometry(1.2, 0.5, 3.2);
                bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.8 }); // Teak boat
            } else {
                bodyGeo = new THREE.BoxGeometry(0.8, 1.0, 1.6);
                bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });
            }

            const mainMesh = new THREE.Mesh(bodyGeo, bodyMat);
            mainMesh.castShadow = true;
            group.add(mainMesh);

            group.position.set(this.position.x, this.position.y, this.position.z);
            return group;
        }

        update(deltaTime, playerPosition = null) {
            if (this.waypoints.length === 0) return;

            if (this.stopTimer > 0) {
                this.stopTimer -= deltaTime;
                return;
            }

            // Simple proximity brake if player is directly ahead
            if (playerPosition) {
                const distToPlayer = Math.hypot(this.position.x - playerPosition.x, this.position.z - playerPosition.z);
                if (distToPlayer < 4.5) {
                    this.stopTimer = 1.0; // pause for pedestrian
                    return;
                }
            }

            const target = this.waypoints[this.currentWaypointIndex];
            const dx = target.x - this.position.x;
            const dz = target.z - this.position.z;
            const dist = Math.hypot(dx, dz);

            if (dist < 1.0) {
                // Advance waypoint
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
                return;
            }

            const moveDist = Math.min(dist, this.speed * deltaTime);
            const dirX = dx / dist;
            const dirZ = dz / dist;

            this.position.x += dirX * moveDist;
            this.position.z += dirZ * moveDist;
            this.rotationY = Math.atan2(dirX, dirZ);

            if (this.mesh) {
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                this.mesh.rotation.y = this.rotationY;
            }
        }
    }

    window.TrafficVehicle = TrafficVehicle;
})();
