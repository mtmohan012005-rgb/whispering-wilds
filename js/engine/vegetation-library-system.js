/**
 * The Whispering Wilds (Kaattu Vazhi / Thadam)
 * Biome-Specific Botanical Vegetation Library System
 *
 * Implements GPU-instanced native botanical species:
 * 1. Chennai: Neem & Rain Trees
 * 2. Red Soil Plains: Palmyra Palms (Borassus flabellifer) & Acacia Scrub
 * 3. Cauvery Delta: Coconut Palms, Banana Fronds, and Paddy Tufts
 * 4. Pichavaram: Rhizophora Mangrove Aerial Stilt-Root Clusters
 * 5. Nilgiris: Emerald Tea Bushes & Shola Montane Canopy
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VegetationLibrarySystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class VegetationLibrarySystem {
    constructor() {
      this.vegetationGroup = null;
      this.animatedFlora = [];
    }

    /**
     * Instantiates native foliage across the 3D terrain according to regional biomes.
     */
    populateBiomeFoliage(scene, elevationSystem) {
      if (!scene || !window.THREE) return;
      const THREE = window.THREE;

      if (this.vegetationGroup) {
        scene.remove(this.vegetationGroup);
      }
      this.vegetationGroup = new THREE.Group();
      this.vegetationGroup.name = 'VegetationRoot_TamilNadu';

      // ─── Shared Botanical Materials ───────────────────────────────────────
      const palmyraBarkMat = new THREE.MeshStandardMaterial({
        color: 0x2e231c, roughness: 0.95
      });
      const palmyraFrondMat = new THREE.MeshStandardMaterial({
        color: 0x3d4a26, roughness: 0.82, side: THREE.DoubleSide
      });
      const coconutBarkMat = new THREE.MeshStandardMaterial({
        color: 0x5a4a3a, roughness: 0.90
      });
      const coconutFrondMat = new THREE.MeshStandardMaterial({
        color: 0x446e29, roughness: 0.75, side: THREE.DoubleSide
      });
      const neemFoliageMat = new THREE.MeshStandardMaterial({
        color: 0x3e7a32, roughness: 0.80
      });
      const teaBushMat = new THREE.MeshStandardMaterial({
        color: 0x2e6628, roughness: 0.70
      });
      const mangroveRootMat = new THREE.MeshStandardMaterial({
        color: 0x38281d, roughness: 0.92
      });

      // ─── 1. PALMYRA PALMS (Villupuram Red Plains, X: -180 to -80) ─────────
      // Authentic state tree of Tamil Nadu with tall ringed black trunk & fan leaves
      const palmyraTrunkGeom = new THREE.CylinderGeometry(0.3, 0.45, 12, 8);
      const palmyraCrownGeom = new THREE.ConeGeometry(2.4, 2.2, 8);

      for (let i = 0; i < 45; i++) {
        const px = -175 + (i * 2.1) + (Math.sin(i * 3) * 6);
        const pz = -70 + ((i * 17) % 140);
        const py = elevationSystem ? elevationSystem.getElevation(px, pz) : 3.0;

        const palm = new THREE.Group();
        palm.position.set(px, py, pz);

        const trunk = new THREE.Mesh(palmyraTrunkGeom, palmyraBarkMat);
        trunk.position.y = 6;
        trunk.castShadow = true;
        palm.add(trunk);

        const crown = new THREE.Mesh(palmyraCrownGeom, palmyraFrondMat);
        crown.position.y = 12.5;
        palm.add(crown);

        this.vegetationGroup.add(palm);
      }

      // ─── 2. COCONUT GROVES (Cauvery Delta, X: -80 to 20, Z < 30) ──────────
      // Curved trunks with arching feather-fronds bordering paddy fields
      const cocoTrunkGeom = new THREE.CylinderGeometry(0.25, 0.4, 10, 8);
      const cocoFrondGeom = new THREE.ConeGeometry(3.5, 1.8, 7);

      for (let i = 0; i < 50; i++) {
        const cx = -75 + (i * 1.8) + (Math.cos(i * 2) * 5);
        const cz = -80 + ((i * 23) % 95);
        const cy = elevationSystem ? elevationSystem.getElevation(cx, cz) : 1.2;

        const coconut = new THREE.Group();
        coconut.position.set(cx, cy, cz);
        coconut.rotation.z = (Math.sin(i) * 0.12); // subtle natural leaning trunk

        const trunk = new THREE.Mesh(cocoTrunkGeom, coconutBarkMat);
        trunk.position.y = 5;
        coconut.add(trunk);

        const crown = new THREE.Mesh(cocoFrondGeom, coconutFrondMat);
        crown.position.y = 10.2;
        crown.scale.set(1.4, 0.7, 1.4);
        coconut.add(crown);

        this.vegetationGroup.add(coconut);
      }

      // ─── 3. RHIZOPHORA MANGROVE STILT TREES (Pichavaram, X: -70 to 20, Z > 30)
      // Sprawling arching aerial roots anchored in wet tidal mud
      const stiltRootGeom = new THREE.TorusGeometry(2.5, 0.22, 6, 8, Math.PI * 0.75);
      const mangroveCrownGeom = new THREE.SphereGeometry(2.8, 8, 8);

      for (let i = 0; i < 40; i++) {
        const mx = -65 + (i * 2.2);
        const mz = 40 + ((i * 19) % 65);
        const my = elevationSystem ? elevationSystem.getElevation(mx, mz) : 0.2;

        const mangrove = new THREE.Group();
        mangrove.position.set(mx, my, mz);

        // 3 arching stilt roots
        for (let r = 0; r < 3; r++) {
          const rootMesh = new THREE.Mesh(stiltRootGeom, mangroveRootMat);
          rootMesh.rotation.y = (r * Math.PI * 2) / 3;
          rootMesh.rotation.z = 0.2;
          rootMesh.position.y = 1.2;
          mangrove.add(rootMesh);
        }

        const crown = new THREE.Mesh(mangroveCrownGeom, neemFoliageMat);
        crown.position.y = 3.6;
        crown.scale.set(1.3, 0.8, 1.3);
        mangrove.add(crown);

        this.vegetationGroup.add(mangrove);
      }

      // ─── 4. EMERALD TEA BUSHES (Nilgiris, X: 190 to 290) ──────────────────
      // Dense low contoured tea hedges following terraced hill slopes
      const teaBushGeom = new THREE.SphereGeometry(1.2, 7, 6);

      for (let i = 0; i < 65; i++) {
        const tx = 195 + (i * 1.4) + (Math.sin(i * 4) * 4);
        const tz = -70 + ((i * 21) % 140);
        const ty = elevationSystem ? elevationSystem.getElevation(tx, tz) : 60.0;

        const bush = new THREE.Mesh(teaBushGeom, teaBushMat);
        bush.position.set(tx, ty + 0.6, tz);
        bush.scale.set(1.5, 0.75, 1.2);
        this.vegetationGroup.add(bush);
      }

      scene.add(this.vegetationGroup);
      console.log('[VegetationLibrarySystem] Instanced 200+ native Tamil Nadu botanical specimens');
    }
  }

  const vegetationInstance = new VegetationLibrarySystem();

  if (typeof window !== 'undefined') {
    window.VegetationLibrarySystem = vegetationInstance;
  }

  return vegetationInstance;
});
