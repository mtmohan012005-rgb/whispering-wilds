// ============================================================================
// THE WHISPERING WILDS - CROWD AGENT ENTITY
// ============================================================================

(function() {
    class CrowdAgent {
        constructor(config = {}) {
            this.id = config.id || `crw_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            this.position = config.position ? { ...config.position } : { x: 0, y: 0, z: 0 };
            this.destination = config.destination ? { ...config.destination } : null;
            this.speed = config.speed || 1.8;
            this.state = 'WALKING';
            this.targetActivityPoint = null;
            this.waitTimer = 0;

            this.mesh = this.buildMesh();
        }

        buildMesh() {
            const group = new THREE.Group();
            // Lightweight low-poly stylized character
            const bodyGeo = new THREE.CylinderGeometry(0.22, 0.25, 1.3, 6);
            const headGeo = new THREE.SphereGeometry(0.18, 6, 6);
            const mat = new THREE.MeshStandardMaterial({
                color: (Math.random() > 0.5) ? 0x8d5524 : 0xc68642,
                roughness: 0.8
            });

            const body = new THREE.Mesh(bodyGeo, mat);
            body.position.y = 0.65;
            group.add(body);

            const head = new THREE.Mesh(headGeo, mat);
            head.position.y = 1.45;
            group.add(head);

            group.position.set(this.position.x, this.position.y, this.position.z);
            return group;
        }

        setDestination(dest) {
            this.destination = dest ? { ...dest } : null;
            this.state = dest ? 'WALKING' : 'IDLE';
        }

        update(deltaTime, playerPosition = null) {
            if (this.waitTimer > 0) {
                this.waitTimer -= deltaTime;
                return;
            }

            if (this.state === 'WALKING' && this.destination) {
                const dx = this.destination.x - this.position.x;
                const dz = this.destination.z - this.position.z;
                const dist = Math.hypot(dx, dz);

                if (dist < 0.5) {
                    this.state = 'ARRIVED';
                    this.waitTimer = 3.0 + Math.random() * 4.0;
                    return;
                }

                const move = Math.min(dist, this.speed * deltaTime);
                this.position.x += (dx / dist) * move;
                this.position.z += (dz / dist) * move;

                if (this.mesh) {
                    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                    this.mesh.rotation.y = Math.atan2(dx, dz);
                }
            }
        }
    }

    window.CrowdAgent = CrowdAgent;
})();
