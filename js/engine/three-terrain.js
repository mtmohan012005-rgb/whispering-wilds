// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - THREE.JS 3D TERRAIN & BIOMES
// Procedural Heightmap, Biome Color Gradients, Delta Water, and 3D Landmarks
// ============================================================================

class ThreeTerrain {
  constructor(scene) {
    this.scene = scene;
    this.terrainMesh = null;
    this.waterMesh = null;
    this.landmarks = [];
    this.trees = [];

    // Terrain world bounds: X from -300 to +300, Z from -110 to +110
    this.width = 600;
    this.depth = 220;
    this.segmentsX = 180;
    this.segmentsZ = 70;

    this.init();
  }

  // Pure procedural elevation calculation
  // Real Tamil Nadu Geography:
  // Chennai (X: -300 to -100): Flat coastal red soil plains (Y: 0.5 to 3)
  // Pichavaram/Delta (X: -100 to 100): Low wetland canals & river basins (Y: -1.5 to 4)
  // Western Ghats/Nilgiris (X: 100 to 300): Dramatic steep mountain peaks (Y: 15 to 65)
  getElevation(x, z) {
    let y = 1.0;

    if (x < -100) {
      // 1. Chennai Lowlands & Red Soil Plains
      // Gentle coastal undulations and subtle red clay mounds
      const nx = (x + 300) / 200;
      y = 1.2 + Math.sin(x * 0.05) * 0.8 + Math.cos(z * 0.06) * 0.6;
      // Slight elevation rise towards the west
      y += nx * 2.0;
    } else if (x >= -100 && x < 100) {
      // 2. Pichavaram & Thanjavur Wetland Delta
      // River basin depressions and delta marsh mounds
      const riverChannel = Math.sin(z * 0.08 + Math.sin(x * 0.03) * 2.0);
      const canalDepth = Math.exp(-Math.pow(riverChannel * 1.5, 2)) * 3.2;
      y = 2.0 + Math.sin(x * 0.06) * 1.2 - canalDepth;
      // Ensure tidal canals dip near or below water level
      if (Math.abs(z - 10) < 25 && Math.abs(x) < 70) {
        y = Math.min(y, 0.4);
      }
    } else {
      // 3. Western Ghats & Nilgiri Mountain Range (Ooty / Valparai)
      // Steep peaks, craggy ridges, and cascading shola terraces
      const t = (x - 100) / 200; // 0.0 to 1.0
      // Exponential mountain gradient
      const mountainBase = Math.pow(t, 1.4) * 48.0;
      // Multi-octave mountain peak ridges
      const ridge1 = Math.sin(x * 0.035 + z * 0.04) * 12.0 * t;
      const ridge2 = Math.cos(x * 0.07 - z * 0.06) * 6.5 * t;
      const ridge3 = Math.sin(x * 0.12 + z * 0.14) * 3.0 * t;
      // Peak summits
      const peakCluster = Math.exp(-Math.pow((x - 240) / 45, 2) - Math.pow((z - 30) / 45, 2)) * 18.0;

      y = 4.0 + mountainBase + ridge1 + ridge2 + ridge3 + peakCluster;
    }

    return y;
  }

  init() {
    this.createTerrainMesh();
    this.createDeltaWaterPlane();
    this.createLandmarks();
    this.scatterBiomeFlora();
  }

  createTerrainMesh() {
    const geo = new THREE.PlaneGeometry(
      this.width,
      this.depth,
      this.segmentsX,
      this.segmentsZ
    );
    geo.rotateX(-Math.PI / 2); // Orient horizontally in X-Z plane

    const pos = geo.attributes.position;
    const colors = [];

    // Color palettes for biomes (Red soil plains 0x8b3a2b from user boilerplate)
    const colChennaiLow = new THREE.Color(0x8b3a2b);          // Red soil plains (செம்மண்)
    const colChennaiHigh = new THREE.Color(0xa04c38);         // Warm dry clay
    const colDeltaMud = new THREE.Color(0x283218);            // Wetland silt
    const colDeltaGreen = new THREE.Color(0x223614);          // Mangrove moss
    const colHighlandForest = new THREE.Color(0x122612);      // Shola green
    const colMountainRock = new THREE.Color(0x424446);        // Granite crag
    const colPeakMist = new THREE.Color(0x556062);            // Mist summit

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getElevation(vx, vz);
      pos.setY(i, vy);

      // Biome vertex coloring based on X and elevation Y
      const vertexCol = new THREE.Color();

      if (vx < -100) {
        // Chennai Lowlands
        const t = (vx + 300) / 200;
        vertexCol.copy(colChennaiLow).lerp(colChennaiHigh, t + (vy * 0.1));
      } else if (vx >= -100 && vx < 100) {
        // Delta / Wetlands
        const t = (vx + 100) / 200;
        if (vy < 1.0) {
          vertexCol.copy(colDeltaMud);
        } else {
          vertexCol.copy(colDeltaMud).lerp(colDeltaGreen, Math.min(1.0, vy / 4.0));
        }
      } else {
        // Highlands / Western Ghats
        const t = (vx - 100) / 200;
        if (vy < 30) {
          vertexCol.copy(colDeltaGreen).lerp(colHighlandForest, vy / 30);
        } else if (vy < 52) {
          const rockT = (vy - 30) / 22;
          vertexCol.copy(colHighlandForest).lerp(colMountainRock, rockT);
        } else {
          const peakT = Math.min(1.0, (vy - 52) / 15);
          vertexCol.copy(colMountainRock).lerp(colPeakMist, peakT);
        }
      }

      colors.push(vertexCol.r, vertexCol.g, vertexCol.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x8b3a2b,
      vertexColors: true,
      flatShading: true,
      roughness: 0.9,
      metalness: 0.05
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = false;
    this.scene.add(this.terrainMesh);
  }

  createDeltaWaterPlane() {
    // Water plane placed across the Pichavaram delta region
    const waterGeo = new THREE.PlaneGeometry(210, 180, 20, 20);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1b4965,
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.78
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, 0.85, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  // ==========================================================================
  // PROCEDURAL 3D LANDMARKS
  // ==========================================================================
  createLandmarks() {
    this.createMadrasHighCourt(-240, 15);
    this.createTeaKadai(-190, 25);
    this.createCholaWaterwheel(-15, -20);
    this.createTodaHut(210, 20);
    this.createEcoSanctuaryPortal(275, -15);
  }

  // 1. Madras High Court Indo-Saracenic Red-Brick Structure
  createMadrasHighCourt(x, z) {
    const group = new THREE.Group();
    const y = this.getElevation(x, z);
    group.position.set(x, y, z);

    const brickMat = new THREE.MeshStandardMaterial({ color: 0x8b2518, roughness: 0.75 });
    const darkArchMat = new THREE.MeshStandardMaterial({ color: 0x220b08, roughness: 0.9 });
    const goldDomeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.6, roughness: 0.3 });
    const grillMat = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.8, roughness: 0.3 });
    const stoneStepMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, roughness: 0.8 });

    // Entrance stone steps
    const steps = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 14), stoneStepMat);
    steps.position.set(0, 0.6, 0);
    steps.receiveShadow = true;
    group.add(steps);

    // Left Clock Tower
    const leftTower = new THREE.Mesh(new THREE.BoxGeometry(7, 26, 7), brickMat);
    leftTower.position.set(-9.5, 13, 0);
    leftTower.castShadow = true;
    leftTower.receiveShadow = true;
    group.add(leftTower);

    // Right Clock Tower
    const rightTower = new THREE.Mesh(new THREE.BoxGeometry(7, 26, 7), brickMat);
    rightTower.position.set(9.5, 13, 0);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    group.add(rightTower);

    // Central Arch Lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 6), brickMat);
    lintel.position.set(0, 20, 0);
    lintel.castShadow = true;
    group.add(lintel);

    // Dark arch recess
    const archHole = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 5.8), darkArchMat);
    archHole.position.set(0, 7.5, 0);
    group.add(archHole);

    // Wrought-iron Victorian gate grills
    for (let gx = -4; gx <= 4; gx += 1.6) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 12, 6), grillMat);
      bar.position.set(gx, 7, 0.8);
      group.add(bar);
    }

    // Onion Domes on Towers
    const domeGeo = new THREE.SphereGeometry(3.6, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const leftDome = new THREE.Mesh(domeGeo, goldDomeMat);
    leftDome.position.set(-9.5, 26, 0);
    leftDome.castShadow = true;
    group.add(leftDome);

    const rightDome = new THREE.Mesh(domeGeo, goldDomeMat);
    rightDome.position.set(9.5, 26, 0);
    rightDome.castShadow = true;
    group.add(rightDome);

    // Central Grand Dome
    const grandDome = new THREE.Mesh(new THREE.SphereGeometry(5.0, 16, 16), goldDomeMat);
    grandDome.position.set(0, 27, 0);
    grandDome.castShadow = true;
    group.add(grandDome);

    // High Court Entrance Lantern Point-Light
    const courtLight = new THREE.PointLight(0xffbe76, 2.2, 28);
    courtLight.position.set(0, 11, 4);
    courtLight.castShadow = true;
    group.add(courtLight);

    this.scene.add(group);
    this.landmarks.push({ id: 'high_court', mesh: group, name: 'Madras High Court Gate' });
  }

  // 2. Murugan Annan's Roadside Tea Kadai 3D Model
  createTeaKadai(x, z) {
    const group = new THREE.Group();
    const y = this.getElevation(x, z);
    group.position.set(x, y, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3c1e, roughness: 0.85 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xa87140, roughness: 0.95 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.6 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });

    // Wooden stall counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 6), woodMat);
    counter.position.set(0, 2, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    // Four awning bamboo poles
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
    const p1 = new THREE.Mesh(poleGeo, woodMat); p1.position.set(-5.5, 4, 2.8); group.add(p1);
    const p2 = new THREE.Mesh(poleGeo, woodMat); p2.position.set(5.5, 4, 2.8); group.add(p2);
    const p3 = new THREE.Mesh(poleGeo, woodMat); p3.position.set(-5.5, 4, -2.8); group.add(p3);
    const p4 = new THREE.Mesh(poleGeo, woodMat); p4.position.set(5.5, 4, -2.8); group.add(p4);

    // Bamboo Thatched Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.5, 4), thatchMat);
    roof.position.set(0, 9.2, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Red Tamil Signboard
    const sign = new THREE.Mesh(new THREE.BoxGeometry(9, 1.4, 0.4), signMat);
    sign.position.set(0, 7.5, 3.0);
    group.add(sign);

    // Steaming Brass Samovar / Tea Boiler
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 12), brassMat);
    boiler.position.set(-3.2, 5.1, 0.5);
    boiler.castShadow = true;
    group.add(boiler);

    // Customer wooden bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 2.2), woodMat);
    bench.position.set(0, 0.6, 6.5);
    bench.castShadow = true;
    group.add(bench);

    // Tea Kadai Warm Samovar Point-Light
    const teaLight = new THREE.PointLight(0xff9f43, 3.2, 34);
    teaLight.position.set(0, 6, 2);
    teaLight.castShadow = true;
    group.add(teaLight);

    this.scene.add(group);
    this.landmarks.push({ id: 'tea_kadai', mesh: group, name: "Murugan Annan's Tea Kadai" });
  }

  // 3. Ancient Chola Granite Waterwheel in Delta Sluice
  createCholaWaterwheel(x, z) {
    const group = new THREE.Group();
    const y = this.getElevation(x, z);
    group.position.set(x, y, z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4e51, roughness: 0.85 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x274e13, roughness: 0.9 });

    // Granite Sluice Side Walls
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 16), stoneMat);
    wall1.position.set(-7, 3, 0);
    group.add(wall1);

    const wall2 = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 16), stoneMat);
    wall2.position.set(7, 3, 0);
    group.add(wall2);

    // Rotating Granite Wheel
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 2.4, 16), mossMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 4, 0);
    wheel.castShadow = true;
    group.add(wheel);

    // Gear paddles
    for (let i = 0; i < 8; i++) {
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 3.2), stoneMat);
      const angle = (i / 8) * Math.PI * 2;
      paddle.position.set(0, 4 + Math.sin(angle) * 5.4, Math.cos(angle) * 5.4);
      group.add(paddle);
    }

    this.scene.add(group);
    this.landmarks.push({ id: 'chola_wheel', mesh: group, name: 'Chola Hydro-Mechanism' });
  }

  // 4. Toda Indigenous Barrel-Vault Tribal Hut (Western Ghats)
  createTodaHut(x, z) {
    const group = new THREE.Group();
    const y = this.getElevation(x, z);
    group.position.set(x, y, z);

    const thatchMat = new THREE.MeshStandardMaterial({ color: 0x6e5229, roughness: 0.9 });
    const stoneFrontMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x2c1d11, roughness: 0.9 });

    // Barrel-vault half cylinder
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 14, 16, 1, false, 0, Math.PI),
      thatchMat
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0, 0, 0);
    barrel.castShadow = true;
    group.add(barrel);

    // Front stone wall pediment
    const frontWall = new THREE.Mesh(new THREE.CircleGeometry(5.3, 16, 0, Math.PI), stoneFrontMat);
    frontWall.rotation.y = Math.PI / 2;
    frontWall.position.set(-7.02, 0, 0);
    group.add(frontWall);

    // Tiny entrance door
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 1.8), woodMat);
    door.position.set(-7.1, 1.25, 0);
    group.add(door);

    this.scene.add(group);
    this.landmarks.push({ id: 'toda_hut', mesh: group, name: 'Toda Indigenous Buffalo Mund' });
  }

  // 5. Ancient Subterranean Eco-Sanctuary Portal
  createEcoSanctuaryPortal(x, z) {
    const group = new THREE.Group();
    const y = this.getElevation(x, z);
    group.position.set(x, y, z);

    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x3d3a37, roughness: 0.9 });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x55efc4,
      emissive: 0x00b894,
      emissiveIntensity: 0.8
    });

    // Archway rock arch carved into cliff
    const archLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 18, 5), cliffMat);
    archLeft.position.set(-6, 9, 0);
    group.add(archLeft);

    const archRight = new THREE.Mesh(new THREE.BoxGeometry(5, 18, 5), cliffMat);
    archRight.position.set(6, 9, 0);
    group.add(archRight);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(17, 5, 5), cliffMat);
    archTop.position.set(0, 18, 0);
    group.add(archTop);

    // Glowing cyan rune portal threshold
    const portalVoid = new THREE.Mesh(new THREE.PlaneGeometry(8, 14), runeMat);
    portalVoid.position.set(0, 7, -2.4);
    group.add(portalVoid);

    const portalGlow = new THREE.PointLight(0x55efc4, 3.5, 30);
    portalGlow.position.set(0, 8, 2);
    group.add(portalGlow);

    this.scene.add(group);
    this.landmarks.push({ id: 'eco_portal', mesh: group, name: 'Pasumai Thadam Eco-Sanctuary' });
  }

  // ==========================================================================
  // PROCEDURAL FLORA SCATTERING (Palmyra, Mangroves, Shola Pines)
  // ==========================================================================
  scatterBiomeFlora() {
    // 1. Palmyra Trees across Chennai & plains (X: -290 to -110)
    for (let i = 0; i < 45; i++) {
      const px = -290 + Math.random() * 175;
      const pz = -95 + Math.random() * 190;
      // Skip immediate perimeter of High Court & Tea stall
      if (Math.hypot(px - (-240), pz - 15) < 18) continue;
      if (Math.hypot(px - (-190), pz - 25) < 14) continue;
      this.createPalmyraTree(px, pz);
    }

    // 2. Low-Poly Mangrove Trees in Pichavaram Delta (X: -90 to +80)
    for (let i = 0; i < 50; i++) {
      const px = -90 + Math.random() * 170;
      const pz = -90 + Math.random() * 180;
      this.createMangroveTree(px, pz);
    }

    // 3. Shola Pines & Tea Bushes in Western Ghats Highlands (X: +110 to +290)
    for (let i = 0; i < 65; i++) {
      const px = 110 + Math.random() * 175;
      const pz = -95 + Math.random() * 190;
      if (Math.hypot(px - 210, pz - 20) < 14) continue;
      if (Math.hypot(px - 275, pz - (-15)) < 16) continue;
      this.createSholaPineTree(px, pz);
    }
  }

  // Palmyra Tree: Slender fibrous trunk + radiate fan fronds
  createPalmyraTree(x, z) {
    const y = this.getElevation(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2d1f16, roughness: 0.95 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x274e13, roughness: 0.85 });

    // Trunk
    const height = 14 + Math.random() * 5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, height, 7), trunkMat);
    trunk.position.set(0, height / 2, 0);
    trunk.castShadow = true;
    group.add(trunk);

    // Radiating fan fronds
    const frondCrown = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.2, 8), leafMat);
    frondCrown.position.set(0, height, 0);
    frondCrown.castShadow = true;
    group.add(frondCrown);

    this.scene.add(group);
    this.trees.push(group);
  }

  // Mangrove Tree: Aerial stilt roots + twisted canopy
  createMangroveTree(x, z) {
    const y = Math.max(0.6, this.getElevation(x, z));
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const rootMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e4620, roughness: 0.8 });

    // 4 Arching Stilt roots
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 4.2, 6), rootMat);
      root.position.set(Math.sin(angle) * 1.5, 1.8, Math.cos(angle) * 1.5);
      root.rotation.z = Math.sin(angle) * 0.45;
      root.rotation.x = Math.cos(angle) * 0.45;
      root.castShadow = true;
      group.add(root);
    }

    // Dense wetland canopy
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), leafMat);
    canopy.position.set(0, 4.5, 0);
    canopy.castShadow = true;
    group.add(canopy);

    this.scene.add(group);
    this.trees.push(group);
  }

  // Highland Shola Pine: Conical layered evergreen foliage
  createSholaPineTree(x, z) {
    const y = this.getElevation(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x33241b, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x0f2b18, roughness: 0.85 });

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 6, 6), trunkMat);
    trunk.position.set(0, 3, 0);
    trunk.castShadow = true;
    group.add(trunk);

    // 3 layered pine cones
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 4.5, 7), pineMat);
    c1.position.set(0, 5.5, 0);
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.8, 7), pineMat);
    c2.position.set(0, 8.2, 0);
    c2.castShadow = true;
    group.add(c2);

    const c3 = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.0, 7), pineMat);
    c3.position.set(0, 10.6, 0);
    c3.castShadow = true;
    group.add(c3);

    this.scene.add(group);
    this.trees.push(group);
  }
}

window.ThreeTerrain = ThreeTerrain;
