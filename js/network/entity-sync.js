// ============================================================================
// THE WHISPERING WILDS - REMOTE ENTITY SYNCHRONIZER
// ============================================================================

class EntitySyncManager {
    constructor(scene) {
        this.scene = scene;
        // Map of socketId -> { data, mesh, bodyMesh, nameSprite, interpolator }
        this.entities = new Map();
    }

    setScene(scene) {
        this.scene = scene;
    }

    has(id) {
        return this.entities.has(id);
    }

    get(id) {
        return this.entities.get(id);
    }

    spawn(playerData) {
        if (!this.scene || this.entities.has(playerData.id)) return null;

        const isHost = playerData.role === 'HOST';
        const group = new THREE.Group();
        group.position.set(playerData.position.x || 0, playerData.position.y || 0, playerData.position.z || 0);

        const coatColor = isHost ? 0xd4af37 : 0x2980b9;
        const dhotiColor = isHost ? 0xfff2a3 : 0xecdcb9;

        const bodyMat = new THREE.MeshStandardMaterial({
            color: coatColor,
            roughness: 0.7,
            metalness: isHost ? 0.35 : 0.1
        });
        const dhotiMat = new THREE.MeshStandardMaterial({
            color: dhotiColor,
            roughness: 0.8
        });
        const skinMat = new THREE.MeshLambertMaterial({ color: 0x8d5b4c });

        // Torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.25, 8), bodyMat);
        torso.position.y = 1.4;
        torso.castShadow = true;
        group.add(torso);

        // Dhoti
        const dhoti = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 1.0, 8), dhotiMat);
        dhoti.position.y = 0.65;
        dhoti.castShadow = true;
        group.add(dhoti);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
        head.position.y = 2.25;
        head.castShadow = true;
        group.add(head);

        // Crown / Headgear
        let crownMesh = null;
        if (isHost) {
            const crownGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.25, 6);
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
            crownMesh = new THREE.Mesh(crownGeo, goldMat);
            crownMesh.position.y = 2.5;
            group.add(crownMesh);
        }

        // Lantern light
        const lanternLight = new THREE.PointLight(isHost ? 0xffbb33 : 0x66ccff, 1.6, 15, 2.0);
        lanternLight.position.set(0.6, 1.4, 0.3);
        group.add(lanternLight);

        // Name Billboard Sprite
        const nameSprite = this.createNameSprite(playerData.name, isHost ? '👑 [HOST]' : '🧭');
        nameSprite.position.y = 2.9;
        group.add(nameSprite);

        this.scene.add(group);

        const interpolator = new (window.NetworkInterpolator || NetworkInterpolator)();
        interpolator.pushSnapshot(
            playerData.position.x || 0,
            playerData.position.y || 0,
            playerData.position.z || 0,
            playerData.rotationY || 0,
            playerData.currentAnim || 'idle',
            Date.now()
        );

        const entity = {
            id: playerData.id,
            data: playerData,
            mesh: group,
            bodyMesh: torso,
            crownMesh: crownMesh,
            nameSprite: nameSprite,
            interpolator: interpolator
        };

        this.entities.set(playerData.id, entity);
        return entity;
    }

    createNameSprite(name, rolePrefix) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(15, 20, 30, 0.75)';
        if (ctx.roundRect) {
            ctx.roundRect(8, 8, 240, 48, [12]);
        } else {
            ctx.rect(8, 8, 240, 48);
        }
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${rolePrefix} ${name}`, 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(3.0, 0.75, 1.0);
        return sprite;
    }

    onTransformReceived(id, position, rotationY, currentAnim) {
        const entity = this.entities.get(id);
        if (!entity) return;

        entity.interpolator.pushSnapshot(
            position.x,
            position.y,
            position.z,
            rotationY,
            currentAnim,
            Date.now()
        );
    }

    updateRole(id, newRole) {
        const entity = this.entities.get(id);
        if (!entity) return;

        entity.data.role = newRole;
        const isHost = newRole === 'HOST';

        if (entity.bodyMesh) {
            entity.bodyMesh.material.color.setHex(isHost ? 0xd4af37 : 0x2980b9);
        }

        if (entity.nameSprite) {
            entity.mesh.remove(entity.nameSprite);
            const newSprite = this.createNameSprite(entity.data.name, isHost ? '👑 [HOST]' : '🧭');
            newSprite.position.y = 2.9;
            entity.mesh.add(newSprite);
            entity.nameSprite = newSprite;
        }

        if (isHost && !entity.crownMesh) {
            const crownGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.25, 6);
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
            entity.crownMesh = new THREE.Mesh(crownGeo, goldMat);
            entity.crownMesh.position.y = 2.5;
            entity.mesh.add(entity.crownMesh);
        } else if (!isHost && entity.crownMesh) {
            entity.mesh.remove(entity.crownMesh);
            entity.crownMesh = null;
        }
    }

    remove(id) {
        const entity = this.entities.get(id);
        if (!entity) return;

        if (this.scene && entity.mesh) {
            this.scene.remove(entity.mesh);
        }
        this.entities.delete(id);
    }

    clear() {
        for (const [id] of this.entities) {
            this.remove(id);
        }
    }

    update(renderTimeMs = Date.now()) {
        for (const [, entity] of this.entities) {
            const state = entity.interpolator.interpolate(renderTimeMs);
            if (state && entity.mesh) {
                entity.mesh.position.set(state.x, state.y, state.z);
                entity.mesh.rotation.y = state.rotY;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.EntitySyncManager = EntitySyncManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntitySyncManager;
}
