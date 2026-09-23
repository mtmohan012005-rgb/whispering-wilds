/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Festival Decoration Entity (FestivalDecoration)
 * Dynamic 3D decorations instantiated during festival life cycles (sugarcane bundles,
 * mango leaf thoranam arches, rows of agal oil lamps, and festive flags).
 */

class FestivalDecoration extends EnvironmentObject {
  /**
   * @param {Object} config - Decoration config
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    super(config, scene, collision);

    this.decorationType = config.decorationType || 'sugarcane_bundles';
    this.festivalId = config.festivalId || 'festival_pongal';
    this.fadeAlpha = 1.0;

    this.buildDecorationMesh();
  }

  buildDecorationMesh() {
    if (this.decorationType === 'sugarcane_bundles') {
      const caneMat = new THREE.MeshStandardMaterial({ color: 0x4a1525, roughness: 0.6 }); // Dark purple-red cane
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e6b27, roughness: 0.7 });

      // Stalk 1
      const stalk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 8), caneMat);
      stalk1.position.set(-0.15, 1.6, 0);
      stalk1.rotation.z = 0.08;
      this.group.add(stalk1);

      // Stalk 2
      const stalk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 8), caneMat);
      stalk2.position.set(0.15, 1.6, 0);
      stalk2.rotation.z = -0.08;
      this.group.add(stalk2);

      // Top leafy tuft
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 6), leafMat);
      leaves.position.set(0, 3.4, 0);
      this.group.add(leaves);
    } else if (this.decorationType === 'mango_leaf_thoranam') {
      const twineMat = new THREE.MeshStandardMaterial({ color: 0x826944, roughness: 0.8 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x255c1e, roughness: 0.6 });

      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.5, 6), twineMat);
      string.rotation.z = Math.PI * 0.5;
      string.position.y = 2.2;
      this.group.add(string);

      for (let i = -4; i <= 4; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), leafMat);
        leaf.rotation.x = Math.PI;
        leaf.position.set(i * 0.38, 2.1, 0);
        this.group.add(leaf);
      }
    } else if (this.decorationType === 'boiling_pongal_pot') {
      const potMat = new THREE.MeshStandardMaterial({ color: 0x8b3a1e, roughness: 0.85 });
      const frothMat = new THREE.MeshBasicMaterial({ color: 0xfffaea });

      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), potMat);
      pot.position.y = 0.45;
      this.group.add(pot);

      const froth = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.1, 10), frothMat);
      froth.position.y = 0.85;
      this.group.add(froth);
    } else if (this.decorationType === 'agal_lamp_row') {
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x9c482b, roughness: 0.9 });
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });

      for (let i = -2; i <= 2; i++) {
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.06, 8), lampMat);
        lamp.position.set(i * 0.35, 0.03, 0);
        this.group.add(lamp);

        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), flameMat);
        flame.position.set(i * 0.35, 0.09, 0);
        this.group.add(flame);
      }
    }
  }

  setFade(alpha) {
    this.fadeAlpha = Math.max(0, Math.min(1.0, alpha));
    this.group.traverse((c) => {
      if (c.isMesh && c.material) {
        c.material.transparent = true;
        c.material.opacity = this.fadeAlpha;
      }
    });
    this.group.visible = this.fadeAlpha > 0.05;
  }
}

window.FestivalDecoration = FestivalDecoration;
