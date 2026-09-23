/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Climbable Object Entity (ClimbableObject)
 * Represents safe climbing surfaces, ladders, rocks, low walls, and ledges.
 * Enforces authored traversal paths with start/end waypoints.
 */

class ClimbableObject extends EnvironmentObject {
  /**
   * @param {Object} config - Climbable config
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    super(config, scene, collision);

    this.climbType = config.type || 'ladder'; // 'ladder' | 'rock' | 'low_wall' | 'small_ledge'
    this.climbHeight = config.climbHeight || 4.0;
    this.climbSpeed = config.climbSpeed || 2.5; // meters per second
    this.waypoints = config.waypoints || [
      { x: this.position.x, y: this.position.y, z: this.position.z },
      { x: this.position.x, y: this.position.y + this.climbHeight, z: this.position.z }
    ];

    // userData configuration (Section 8)
    this.group.userData.climbable = true;
    this.group.userData.climbHeight = this.climbHeight;
    this.group.userData.climbSpeed = this.climbSpeed;
    this.group.userData.climbTarget = this.waypoints[this.waypoints.length - 1];
    this.group.userData.waypoints = this.waypoints;
    this.group.userData.interactionType = 'climb';
    this.group.userData.description = config.description || 'A sturdy bamboo and coir climbing ladder.';

    this.buildClimbMesh();
  }

  buildClimbMesh() {
    if (this.climbType === 'ladder') {
      const bambooMat = new THREE.MeshStandardMaterial({ color: 0x8a7042, roughness: 0.7 });
      const rungMat = new THREE.MeshStandardMaterial({ color: 0x6e5630, roughness: 0.8 });

      // Left upright
      const leftUpright = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, this.climbHeight, 8), bambooMat);
      leftUpright.position.set(-0.35, this.climbHeight * 0.5, 0);
      this.group.add(leftUpright);

      // Right upright
      const rightUpright = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, this.climbHeight, 8), bambooMat);
      rightUpright.position.set(0.35, this.climbHeight * 0.5, 0);
      this.group.add(rightUpright);

      // Rungs every 0.35m
      const rungCount = Math.floor(this.climbHeight / 0.35);
      for (let i = 1; i <= rungCount; i++) {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), rungMat);
        rung.rotation.z = Math.PI * 0.5;
        rung.position.set(0, i * 0.35, 0);
        this.group.add(rung);
      }
    } else if (this.climbType === 'rock') {
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4f54, roughness: 0.9 });
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(this.climbHeight * 0.5, 1), rockMat);
      rock.position.y = this.climbHeight * 0.5;
      this.group.add(rock);
    }
  }

  getClimbPath() {
    return this.waypoints;
  }
}

window.ClimbableObject = ClimbableObject;
