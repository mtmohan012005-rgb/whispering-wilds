/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Kolam Floor Art & Morning Threshold System (KolamSystem)
 * Simulates traditional rice-flour doorstep art lifecycle (NOT_DRAWN, PREPARING, DRAWING, COMPLETE, DECORATED)
 * with player observation, cultural discovery, and festival adornments.
 */

class KolamSystem {
  /**
   * @param {THREE.Scene} scene - Three.js Scene
   */
  constructor(scene = null) {
    this.scene = scene;
    this.kolamPlacements = [];
    this.globalState = 'COMPLETE';

    this.initDefaultKolams();
  }

  initDefaultKolams() {
    const locations = [
      { id: 'kolam_chettinad_mansion', name: 'Mansion Entrance Sikku Kolam', region: 'CHETTINAD', x: 10, y: 6.55, z: 12, pattern: 'sikku' },
      { id: 'kolam_delta_homestead', name: 'Cauvery Courtyard Padi Kolam', region: 'CAUVERY_DELTA', x: -158, y: 4.85, z: -6, pattern: 'padi' },
      { id: 'kolam_chennai_rowhouse', name: 'Mylapore Lotus Kolam', region: 'GEORGE_TOWN', x: -248, y: 2.25, z: 4, pattern: 'lotus' }
    ];

    for (const loc of locations) {
      const mesh = this.buildKolamMesh(loc);
      this.kolamPlacements.push({
        id: loc.id,
        name: loc.name,
        region: loc.region,
        position: { x: loc.x, y: loc.y, z: loc.z },
        state: 'COMPLETE',
        mesh: mesh
      });
    }
  }

  buildKolamMesh(loc) {
    if (!this.scene) return null;

    // Ground plane decal for authentic rice-flour pattern
    const geom = new THREE.PlaneGeometry(2.4, 2.4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI * 0.5;
    mesh.position.set(loc.x, loc.y, loc.z);

    // userData for interaction
    mesh.userData = {
      interactable: true,
      interactionType: 'inspect',
      interactionId: loc.id,
      kolamRef: this,
      name: loc.name,
      description: 'Hand-drawn rice flour geometric patterns (கோலம்) placed at the doorway at dawn to welcome abundance and feed small birds.'
    };

    this.scene.add(mesh);
    return mesh;
  }

  setGlobalKolamState(newState) {
    const valid = ['NOT_DRAWN', 'PREPARING', 'DRAWING', 'COMPLETE', 'DECORATED'];
    if (!valid.includes(newState)) return;

    this.globalState = newState;

    for (const k of this.kolamPlacements) {
      k.state = newState;
      if (k.mesh) {
        if (newState === 'NOT_DRAWN') {
          k.mesh.visible = false;
        } else if (newState === 'PREPARING' || newState === 'DRAWING') {
          k.mesh.visible = true;
          k.mesh.material.opacity = 0.35;
        } else if (newState === 'DECORATED') {
          k.mesh.visible = true;
          k.mesh.material.opacity = 1.0;
          k.mesh.material.color.setHex(0xffe082); // Tinted with festive red kaavi ochre border
        } else {
          k.mesh.visible = true;
          k.mesh.material.opacity = 0.88;
          k.mesh.material.color.setHex(0xffffff);
        }
      }
    }
  }

  observeKolam(kolamId) {
    const k = this.kolamPlacements.find(item => item.id === kolamId) || this.kolamPlacements[0];
    if (!k) return;

    if (window.culturalLifeSystem) {
      window.culturalLifeSystem.recordCulturalDiscovery({
        id: k.id,
        name: k.name,
        tamilName: 'பாரம்பரிய அரிசி மாவு கோலம்',
        region: k.region,
        lore: 'Drawn freehand using ground raw rice flour, kolams combine symmetrical dot grids (pulli) with looping unbroken lines.'
      });
    }

    return {
      name: k.name,
      state: k.state,
      description: 'An auspicious threshold design honoring welcoming hospitality.'
    };
  }
}

window.KolamSystem = KolamSystem;
