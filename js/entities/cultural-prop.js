/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Cultural Prop Entity (CulturalProp)
 * Represents authentic physical Tamil Nadu household, farming, sacred, and artisan props.
 * Connects directly to CulturalLifeSystem for journal discoveries.
 */

class CulturalProp extends EnvironmentObject {
  /**
   * @param {Object} config - Cultural prop configuration
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    super(config, scene, collision);

    this.category = config.category || 'household';
    this.discoverable = config.discoverable !== undefined ? config.discoverable : true;
    this.discovered = false;
    this.assetPath = config.assetPath || '';
    this.discoveryLore = config.discoveryLore || config.description || '';

    this.buildCulturalMesh();
  }

  buildCulturalMesh() {
    const id = this.group.userData.interactionId || this.id;

    if (id.includes('kuthu_vilakku') || this.category === 'household_sacred') {
      // Cast brass lamp
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.85 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.15, 12), brassMat);
      base.position.y = 0.08;
      this.group.add(base);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.2, 8), brassMat);
      shaft.position.y = 0.7;
      this.group.add(shaft);

      const oilCup = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.12, 0.18, 12), brassMat);
      oilCup.position.y = 1.35;
      this.group.add(oilCup);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), brassMat);
      finial.position.y = 1.55;
      this.group.add(finial);
    } else if (id.includes('brass') || id.includes('kudam')) {
      // Brass water pot
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, roughness: 0.4, metalness: 0.8 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), brassMat);
      body.position.y = 0.35;
      this.group.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.15, 10), brassMat);
      neck.position.y = 0.72;
      this.group.add(neck);
    } else if (id.includes('clay') || id.includes('pot') || id.includes('agal')) {
      // Terracotta earthen vessel
      const clayMat = new THREE.MeshStandardMaterial({ color: 0x9e472a, roughness: 0.9, metalness: 0.05 });
      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), clayMat);
      pot.position.y = 0.32;
      this.group.add(pot);
    } else {
      // General artisan prop block
      const mat = new THREE.MeshStandardMaterial({ color: 0x6d503b, roughness: 0.8 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), mat);
      box.position.y = 0.2;
      this.group.add(box);
    }
  }

  interact(player, interactionType = 'inspect') {
    if (this.discoverable && !this.discovered) {
      this.discovered = true;
      if (window.culturalLifeSystem) {
        window.culturalLifeSystem.recordCulturalDiscovery({
          id: this.id,
          name: this.name,
          tamilName: this.tamilName,
          region: this.region,
          lore: this.discoveryLore
        });
      }
    }

    return {
      success: true,
      id: this.id,
      name: this.name,
      tamilName: this.tamilName,
      lore: this.discoveryLore
    };
  }
}

window.CulturalProp = CulturalProp;
