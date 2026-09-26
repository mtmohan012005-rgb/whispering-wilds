/**
 * The Whispering Wilds (Kaattu Vazhi / Thadam)
 * Authentic Tamil Nadu 3D Landmark & Architectural Visualizer
 *
 * Implements high-fidelity architectural dioramas directly derived from
 * photographic references:
 * 1. Madras High Court & George Town Indo-Saracenic Red Brick (Photo 2)
 * 2. Mamallapuram Shore Temple Pallava Monolithic Granite (Photo 3)
 * 3. Pichavaram Mangrove Stilt-Root Canal & Boat Jetty (Photo 5)
 * 4. Nilgiri Rolling Tea Terraces & Shola Vista (Photo 4)
 * 5. Western Ghats 70-Hairpin Winding Mountain Switchbacks (Photo 1)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LandmarkVisualizer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class LandmarkVisualizer {
    constructor() {
      this.landmarkGroups = new Map();
    }

    /**
     * Builds and adds all 5 reference-grounded landmarks to the Three.js scene.
     */
    populateWorldLandmarks(scene, elevationSystem) {
      if (!scene || !window.THREE) return;
      const THREE = window.THREE;

      // ─── 1. MADRAS HIGH COURT (CHENNAI, X: -270, Z: 0) ────────────────────
      // Ref: Photo 2 — Red-brick Indo-Saracenic architecture, central dome, minarets, arches
      const highCourtGroup = new THREE.Group();
      highCourtGroup.name = 'Landmark_MadrasHighCourt';
      const hcY = elevationSystem ? elevationSystem.getElevation(-270, 0) : 1.5;
      highCourtGroup.position.set(-270, hcY, 0);

      // Red-brick terracotta material & cream sandstone trim
      const redBrickMat = new THREE.MeshStandardMaterial({
        color: 0xa93226, roughness: 0.85, metalness: 0.05
      });
      const sandstoneMat = new THREE.MeshStandardMaterial({
        color: 0xf5cba7, roughness: 0.70, metalness: 0.02
      });
      const copperDomeMat = new THREE.MeshStandardMaterial({
        color: 0xd4ac0d, roughness: 0.45, metalness: 0.65
      });

      // Central Main Hall (Two-tiered Indo-Saracenic block)
      const baseBuilding = new THREE.Mesh(new THREE.BoxGeometry(28, 12, 18), redBrickMat);
      baseBuilding.position.y = 6;
      baseBuilding.castShadow = true;
      baseBuilding.receiveShadow = true;
      highCourtGroup.add(baseBuilding);

      // Second Tier with Arched Windows
      const upperTier = new THREE.Mesh(new THREE.BoxGeometry(22, 6, 14), redBrickMat);
      upperTier.position.y = 15;
      highCourtGroup.add(upperTier);

      // Central Onion Dome (Iconic High Court Skyline)
      const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 3, 16), sandstoneMat);
      domeBase.position.y = 19.5;
      highCourtGroup.add(domeBase);

      const onionDome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7), copperDomeMat);
      onionDome.position.y = 21;
      onionDome.scale.set(1.0, 1.35, 1.0);
      highCourtGroup.add(onionDome);

      // Minarets / Octagonal Corner Towers (4 corners)
      const towerOffsets = [
        [-13, -8], [13, -8], [-13, 8], [13, 8]
      ];
      towerOffsets.forEach(([ox, oz]) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 22, 8), redBrickMat);
        tower.position.set(ox, 11, oz);
        highCourtGroup.add(tower);

        const turretCap = new THREE.Mesh(new THREE.ConeGeometry(2.0, 4.5, 8), copperDomeMat);
        turretCap.position.set(ox, 24, oz);
        highCourtGroup.add(turretCap);
      });

      // Front Colonial Arched Portico & Steps
      const portico = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 4), sandstoneMat);
      portico.position.set(0, 2.5, 11);
      highCourtGroup.add(portico);

      scene.add(highCourtGroup);
      this.landmarkGroups.set('madras_high_court', highCourtGroup);

      // ─── 2. MAMALLAPURAM SHORE TEMPLE (MAMALLAPURAM, X: -130, Z: -75) ─────
      // Ref: Photo 3 — Pallava monolithic granite twin stepped sanctums facing ocean surf
      const shoreTempleGroup = new THREE.Group();
      shoreTempleGroup.name = 'Landmark_ShoreTemple';
      const stY = elevationSystem ? elevationSystem.getElevation(-130, -75) : 0.8;
      shoreTempleGroup.position.set(-130, stY, -75);

      const pallavaGraniteMat = new THREE.MeshStandardMaterial({
        color: 0x8d8276, roughness: 0.72, metalness: 0.05
      });
      const weatheredBasaltMat = new THREE.MeshStandardMaterial({
        color: 0x5a534c, roughness: 0.65, metalness: 0.08
      });

      // Main East-Facing Stepped Vimana Pyramid (5 tiers)
      const tiers = [
        { w: 10, h: 3, y: 1.5 },
        { w: 8,  h: 2.5, y: 4.25 },
        { w: 6.5,h: 2.2, y: 6.6 },
        { w: 5,  h: 2.0, y: 8.7 },
        { w: 3.5,h: 1.8, y: 10.6 }
      ];
      tiers.forEach((t) => {
        const tierMesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.w), pallavaGraniteMat);
        tierMesh.position.y = t.y;
        tierMesh.castShadow = true;
        shoreTempleGroup.add(tierMesh);
      });

      // Shikara Finial / Kalasam
      const kalasam = new THREE.Mesh(new THREE.OctahedronGeometry(1.4), pallavaGraniteMat);
      kalasam.position.y = 12.5;
      shoreTempleGroup.add(kalasam);

      // Smaller West-Facing Sanctum (Rajasimhesvara Shrine)
      const smallVimana = new THREE.Mesh(new THREE.BoxGeometry(5.5, 6.5, 5.5), pallavaGraniteMat);
      smallVimana.position.set(-7, 3.25, 0);
      shoreTempleGroup.add(smallVimana);

      // Surrounding Granite Prakara Enclosure Wall with Monolithic Nandi Bull Statues
      const nandiMat = weatheredBasaltMat;
      const wallPerimeter = [
        [-9, -8], [0, -8], [9, -8],
        [-9, 8], [0, 8], [9, 8]
      ];
      wallPerimeter.forEach(([nx, nz]) => {
        const nandiStatue = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.8), nandiMat);
        nandiStatue.position.set(nx, 0.4, nz);
        shoreTempleGroup.add(nandiStatue);
      });

      scene.add(shoreTempleGroup);
      this.landmarkGroups.set('shore_temple', shoreTempleGroup);

      // ─── 3. PICHAVARAM MANGROVE CANOPY & BOAT JETTY (X: -25, Z: 65) ────────
      // Ref: Photo 5 — Thick Rhizophora stilt root arches, boat channel, hanging mangrove canopy
      const mangroveGroup = new THREE.Group();
      mangroveGroup.name = 'Landmark_PichavaramMangroves';
      const mgY = elevationSystem ? elevationSystem.getElevation(-25, 65) : 0.0;
      mangroveGroup.position.set(-25, mgY, 65);

      const stiltRootMat = new THREE.MeshStandardMaterial({
        color: 0x3d2b1f, roughness: 0.88, metalness: 0.02
      });
      const mangroveFoliageMat = new THREE.MeshStandardMaterial({
        color: 0x2e6930, roughness: 0.75, metalness: 0.0
      });
      const boatWoodMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513, roughness: 0.55, metalness: 0.05
      });

      // Wooden Boat Jetty / Floating Dock
      const jettyPlanks = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 4), boatWoodMat);
      jettyPlanks.position.set(0, 0.2, 0);
      mangroveGroup.add(jettyPlanks);

      // Moored Wooden Rowboat in Tidal Channel
      const boatHull = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 1.8), boatWoodMat);
      boatHull.position.set(3, 0.1, 4.5);
      boatHull.rotation.y = 0.2;
      mangroveGroup.add(boatHull);

      // Dense Stilt Root Arches flanking the boat channel
      for (let i = -18; i <= 18; i += 6) {
        // Left Root Arch
        const rootL = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.35, 8, 12, Math.PI * 0.8), stiltRootMat);
        rootL.position.set(i, 1.8, -4.5);
        rootL.rotation.z = Math.PI * 0.15;
        mangroveGroup.add(rootL);

        // Right Root Arch
        const rootR = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.35, 8, 12, Math.PI * 0.8), stiltRootMat);
        rootR.position.set(i + 2, 1.8, 7.5);
        rootR.rotation.z = -Math.PI * 0.15;
        mangroveGroup.add(rootR);

        // Overhead Mangrove Leaf Canopy
        const canopyL = new THREE.Mesh(new THREE.SphereGeometry(3.8, 8, 8), mangroveFoliageMat);
        canopyL.position.set(i, 4.8, -4.5);
        canopyL.scale.set(1.4, 0.8, 1.2);
        mangroveGroup.add(canopyL);

        const canopyR = new THREE.Mesh(new THREE.SphereGeometry(4.0, 8, 8), mangroveFoliageMat);
        canopyR.position.set(i + 2, 5.0, 7.5);
        canopyR.scale.set(1.5, 0.85, 1.3);
        mangroveGroup.add(canopyR);
      }

      scene.add(mangroveGroup);
      this.landmarkGroups.set('pichavaram_mangroves', mangroveGroup);

      // ─── 4. NILGIRIS TEA ESTATE & ROLLING TERRACES (X: 230, Z: 10) ─────────
      // Ref: Photo 4 — Emerald terraced tea rows, montane misty atmosphere, shola ridge
      const teaEstateGroup = new THREE.Group();
      teaEstateGroup.name = 'Landmark_NilgiriTeaEstate';
      const teaY = elevationSystem ? elevationSystem.getElevation(230, 10) : 62.0;
      teaEstateGroup.position.set(230, teaY, 10);

      const teaBushMat = new THREE.MeshStandardMaterial({
        color: 0x3d7e2f, roughness: 0.68, metalness: 0.0
      });
      const colonialBungalowMat = new THREE.MeshStandardMaterial({
        color: 0xecf0f1, roughness: 0.80
      });
      const slopedRoofMat = new THREE.MeshStandardMaterial({
        color: 0x922b21, roughness: 0.65
      });

      // Planter's Heritage Stone Bungalow
      const bungalowBase = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 10), colonialBungalowMat);
      bungalowBase.position.y = 2.5;
      bungalowBase.castShadow = true;
      teaEstateGroup.add(bungalowBase);

      const bungalowRoof = new THREE.Mesh(new THREE.ConeGeometry(12, 4, 4), slopedRoofMat);
      bungalowRoof.position.y = 7.0;
      bungalowRoof.rotation.y = Math.PI * 0.25;
      teaEstateGroup.add(bungalowRoof);

      // Distinct Terraced Curved Rows of Tea Bushes
      for (let r = 0; r < 8; r++) {
        const rowRadius = 15 + r * 3.5;
        const rowGroup = new THREE.Group();
        for (let a = -1.2; a <= 1.2; a += 0.22) {
          const tx = Math.cos(a) * rowRadius;
          const tz = Math.sin(a) * rowRadius;
          const teaBush = new THREE.Mesh(new THREE.SphereGeometry(1.1, 7, 7), teaBushMat);
          teaBush.scale.set(1.3, 0.7, 1.1);
          teaBush.position.set(tx, -r * 0.45, tz);
          rowGroup.add(teaBush);
        }
        teaEstateGroup.add(rowGroup);
      }

      scene.add(teaEstateGroup);
      this.landmarkGroups.set('nilgiri_tea_estate', teaEstateGroup);

      // ─── 5. WESTERN GHATS 70-HAIRPIN SWITCHBACK CORRIDOR (X: 100, Z: 5) ───
      // Ref: Photo 1 — Kolli Hills aerial hairpin bends, stone retaining walls, steep crags
      const hairpinGhatGroup = new THREE.Group();
      hairpinGhatGroup.name = 'Landmark_GhatHairpins';
      const ghY = elevationSystem ? elevationSystem.getElevation(100, 5) : 32.0;
      hairpinGhatGroup.position.set(100, ghY, 5);

      const retainingWallMat = new THREE.MeshStandardMaterial({
        color: 0x5d6d7e, roughness: 0.88, metalness: 0.05
      });
      const guardStoneMat = new THREE.MeshStandardMaterial({
        color: 0xfafafa, roughness: 0.60
      });

      // Curving Retaining Wall along hairpin bend
      for (let b = -4; b <= 4; b++) {
        const angle = b * 0.35;
        const radius = 18.0;
        const wx = Math.cos(angle) * radius;
        const wz = Math.sin(angle) * radius;

        const wallBlock = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4.0, 1.0), retainingWallMat);
        wallBlock.position.set(wx, 0, wz);
        wallBlock.rotation.y = -angle + Math.PI * 0.5;
        hairpinGhatGroup.add(wallBlock);

        // White-painted Highway Guard Stones
        const guardStone = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.9, 6), guardStoneMat);
        guardStone.position.set(wx, 2.4, wz);
        hairpinGhatGroup.add(guardStone);
      }

      scene.add(hairpinGhatGroup);
      this.landmarkGroups.set('ghat_hairpins', hairpinGhatGroup);

      console.log('[LandmarkVisualizer] 5 authentic Tamil Nadu landmarks instantiated in 3D world');
    }
  }

  const visualizerInstance = new LandmarkVisualizer();

  if (typeof window !== 'undefined') {
    window.LandmarkVisualizer = visualizerInstance;
  }

  return visualizerInstance;
});
