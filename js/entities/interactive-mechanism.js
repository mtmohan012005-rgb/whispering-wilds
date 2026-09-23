/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Interactive Mechanism & Barrier Entities (InteractiveMechanism & InteractiveBarrier)
 * Implements physical granite waterwheels, sluice gates, levers, and environmental barriers
 * with continuous rotation, vertical translation, audio feedback, and puzzle linkages.
 */

class InteractiveMechanism extends EnvironmentObject {
  /**
   * @param {Object} config - Mechanism configuration
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    super(config, scene, collision);

    this.mechanismType = config.mechanismType || 'waterwheel'; // 'waterwheel' | 'sluice_gate' | 'lever' | 'gear'
    this.currentValue = config.initialValue !== undefined ? config.initialValue : 0;
    this.targetValue = this.currentValue;
    this.animationSpeed = config.animationSpeed || 2.0;
    this.isMoving = false;

    this.buildMechanismGeometry();
  }

  buildMechanismGeometry() {
    const graniteMat = new THREE.MeshStandardMaterial({
      color: 0x5a6065,
      roughness: 0.85,
      metalness: 0.1
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.8,
      metalness: 0.05
    });

    if (this.mechanismType === 'waterwheel') {
      // Build authentic multi-bladed granite waterwheel
      this.wheelMesh = new THREE.Group();

      // Wheel outer rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(2.4, 0.22, 8, 24),
        graniteMat
      );
      this.wheelMesh.add(rim);

      // Hub & Axle
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12),
        graniteMat
      );
      hub.rotation.x = Math.PI * 0.5;
      this.wheelMesh.add(hub);

      // 8 Chola scoop paddles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const paddle = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.8, 0.1),
          woodMat
        );
        paddle.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
        paddle.rotation.z = angle;
        this.wheelMesh.add(paddle);
      }

      this.wheelMesh.position.y = 2.4;
      this.group.add(this.wheelMesh);
    } else if (this.mechanismType === 'sluice_gate') {
      // Sluice gate: stone frame and vertically sliding wooden barrier slab
      this.gateFrame = new THREE.Group();
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.5), graniteMat);
      leftPillar.position.set(-1.1, 1.6, 0);
      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.5), graniteMat);
      rightPillar.position.set(1.1, 1.6, 0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 0.5), graniteMat);
      lintel.position.set(0, 3.2, 0);

      this.gateFrame.add(leftPillar);
      this.gateFrame.add(rightPillar);
      this.gateFrame.add(lintel);

      // Sliding gate slab
      this.gateSlab = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.4, 0.18),
        woodMat
      );
      this.gateSlab.position.set(0, 1.2, 0);
      this.gateFrame.add(this.gateSlab);

      this.group.add(this.gateFrame);
    }
  }

  rotateTo(degrees) {
    this.targetValue = degrees;
    this.isMoving = true;
    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('metal_turn', this.position, 0.9);
    }
  }

  setSluiceOpen(isOpen) {
    this.targetValue = isOpen ? 1 : 0;
    this.isMoving = true;
    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('sluice_open', this.position, 1.0);
    }
  }

  update(deltaTime) {
    if (!this.isMoving) return;

    if (this.mechanismType === 'waterwheel' && this.wheelMesh) {
      const targetRad = (this.targetValue * Math.PI) / 180;
      let diff = targetRad - this.wheelMesh.rotation.z;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      if (Math.abs(diff) < 0.02) {
        this.wheelMesh.rotation.z = targetRad;
        this.currentValue = this.targetValue;
        this.isMoving = false;
      } else {
        this.wheelMesh.rotation.z += diff * Math.min(1.0, deltaTime * this.animationSpeed);
      }
    } else if (this.mechanismType === 'sluice_gate' && this.gateSlab) {
      // Move gate up or down (closed = 1.2m, open = 2.9m)
      const targetY = (this.targetValue === 1) ? 2.9 : 1.2;
      const dy = targetY - this.gateSlab.position.y;
      if (Math.abs(dy) < 0.02) {
        this.gateSlab.position.y = targetY;
        this.currentValue = this.targetValue;
        this.isMoving = false;
      } else {
        this.gateSlab.position.y += Math.sign(dy) * deltaTime * 1.5;
      }
    }
  }
}

/**
 * InteractiveBarrier (Section 15)
 * Farm gates, forest barriers, heritage doors, and sluice spillways.
 * States: 'locked', 'closed', 'opening', 'open'.
 */
class InteractiveBarrier extends EnvironmentObject {
  constructor(config = {}, scene = null, collision = null) {
    super(config, scene, collision);
    this.barrierState = config.barrierState || (config.locked ? 'locked' : 'closed');
    this.locked = !!config.locked;
    this.travelDistance = config.travelDistance || 3.0;
    this.animationDuration = config.animationDuration || 1.4;
    this.currentOffset = (this.barrierState === 'open') ? this.travelDistance : 0;
    this.targetOffset = this.currentOffset;
    this.progress = 1.0;

    // Build barrier gate mesh
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.85 });
    this.barrierMesh = new THREE.Mesh(
      new THREE.BoxGeometry(config.width || 3.5, config.height || 2.0, config.depth || 0.2),
      timberMat
    );
    this.barrierMesh.position.y = (config.height || 2.0) * 0.5;
    this.group.add(this.barrierMesh);

    // Register physical collider
    if (this.collision) {
      this.colliderId = `barrier_${this.id}`;
      this.collision.registerCollider({
        id: this.colliderId,
        type: 'box',
        category: 'gate',
        x: this.position.x,
        z: this.position.z,
        width: config.width || 3.5,
        depth: (config.depth || 0.2) + 0.6,
        enabled: this.barrierState !== 'open'
      });
    }
  }

  setOpen(open) {
    if (open) {
      this.barrierState = 'opening';
      this.targetOffset = this.travelDistance;
      this.progress = 0;
    } else {
      this.barrierState = 'closed';
      this.targetOffset = 0;
      this.progress = 0;
    }
  }

  update(deltaTime) {
    if (this.barrierState === 'opening' || (this.barrierState === 'closed' && this.currentOffset > 0)) {
      this.progress += deltaTime / this.animationDuration;
      const t = Math.min(1.0, this.progress);
      const ease = 0.5 * (1.0 - Math.cos(Math.PI * t));

      if (this.barrierState === 'opening') {
        this.currentOffset = ease * this.travelDistance;
        if (t >= 1.0) {
          this.barrierState = 'open';
          this.storyState = 'opened';
          if (this.collision && this.colliderId) {
            this.collision.setColliderEnabled(this.colliderId, false);
          }
        }
      } else {
        this.currentOffset = (1.0 - ease) * this.travelDistance;
        if (t >= 1.0) {
          this.barrierState = 'closed';
          this.storyState = 'normal';
          if (this.collision && this.colliderId) {
            this.collision.setColliderEnabled(this.colliderId, true);
          }
        }
      }
      this.barrierMesh.position.x = this.currentOffset;
    }
  }
}

window.InteractiveMechanism = InteractiveMechanism;
window.InteractiveBarrier = InteractiveBarrier;
