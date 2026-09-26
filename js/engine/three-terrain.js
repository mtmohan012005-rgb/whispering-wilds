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
    this.currentRegion = 'CHENNAI';

    // Terrain world bounds: X from -300 to +300, Z from -110 to +110
    this.width = 600;
    this.depth = 220;
    this.segmentsX = 180;
    this.segmentsZ = 70;

    this.init();
  }

  setRegion(region) {
    this.currentRegion = region ? String(region).toUpperCase() : 'CHENNAI';
  }

  // Pure procedural elevation calculation
  // Real Tamil Nadu Geography:
  // Chennai (X: -300 to -100): Flat coastal red soil plains (Y: 0.5 to 3)
  // Pichavaram/Delta (X: -100 to 100): Low wetland canals & river basins (Y: -1.5 to 4)
  // Western Ghats/Nilgiris (X: 100 to 300): Dramatic steep mountain peaks (Y: 15 to 65)
  getElevation(x, z) {
    if (typeof window !== 'undefined' && window.TerrainElevationSystem) {
      return window.TerrainElevationSystem.getElevation(x, z);
    }

    let y = 1.0;
    if (x < -100) {
      const nx = (x + 300) / 200;
      y = 1.2 + Math.sin(x * 0.05) * 0.8 + Math.cos(z * 0.06) * 0.6 + nx * 2.0;
    } else if (x >= -100 && x < 100) {
      const riverChannel = Math.sin(z * 0.08 + Math.sin(x * 0.03) * 2.0);
      const canalDepth = Math.exp(-Math.pow(riverChannel * 1.5, 2)) * 3.2;
      y = 2.0 + Math.sin(x * 0.06) * 1.2 - canalDepth;
      if (Math.abs(z - 10) < 25 && Math.abs(x) < 70) {
        y = Math.min(y, 0.4);
      }
    } else {
      const t = (x - 100) / 200;
      const mountainBase = Math.pow(t, 1.4) * 48.0;
      const ridge1 = Math.sin(x * 0.035 + z * 0.04) * 12.0 * t;
      const ridge2 = Math.cos(x * 0.07 - z * 0.06) * 6.5 * t;
      const ridge3 = Math.sin(x * 0.12 + z * 0.14) * 3.0 * t;
      const peakCluster = Math.exp(-Math.pow((x - 240) / 45, 2) - Math.pow((z - 30) / 45, 2)) * 18.0;
      y = 4.0 + mountainBase + ridge1 + ridge2 + ridge3 + peakCluster;
    }
    return y;
  }

  init() {
    this.createTerrainMesh();
    this.createDeltaWaterPlane();
    this.createLandmarks();
    this.createRegionalEnvironmentDetails();
    this.scatterBiomeFlora();

    // ─── Production Visual & Landmark Upgrades ──────────────────────────────
    if (typeof window !== 'undefined') {
      if (window.LandmarkVisualizer && typeof window.LandmarkVisualizer.populateWorldLandmarks === 'function') {
        window.LandmarkVisualizer.populateWorldLandmarks(this.scene, window.TerrainElevationSystem);
      }
      if (window.VegetationLibrarySystem && typeof window.VegetationLibrarySystem.populateBiomeFoliage === 'function') {
        window.VegetationLibrarySystem.populateBiomeFoliage(this.scene, window.TerrainElevationSystem);
      }
    }
  }

  createProceduralGroundTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Rich earthy base ground
    ctx.fillStyle = '#7a3e2c';
    ctx.fillRect(0, 0, 512, 512);

    // Procedural mineral noise & fine soil specks
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 38;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.85));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.7));
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle grass and lichen stipples
    ctx.fillStyle = 'rgba(72, 98, 48, 0.22)';
    for (let j = 0; j < 120; j++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const r = 3 + Math.random() * 12;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 12);
    return texture;
  }

  createBrickTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Classic Indo-Saracenic Madras Red-Brick base
    ctx.fillStyle = '#8b271d';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 8;
    const rowH = 512 / rows;
    const colW = 512 / cols;

    // Lime mortar seams
    ctx.strokeStyle = '#dfd6c5';
    ctx.lineWidth = 3;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (r % 2 === 0) ? 0 : colW / 2;
      for (let c = -1; c <= cols + 1; c++) {
        const x = c * colW + offset;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }

    // Weathering variations
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < 35; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 25 + Math.random() * 45, rowH - 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 8);
    return texture;
  }

  createClockTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Clock dial rim
    ctx.fillStyle = '#f8f5eb';
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#2b1f17';
    ctx.stroke();

    // Hour tick marks
    ctx.strokeStyle = '#1b120c';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x1 = 128 + Math.cos(angle) * 94;
      const y1 = 128 + Math.sin(angle) * 94;
      const x2 = 128 + Math.cos(angle) * 112;
      const y2 = 128 + Math.sin(angle) * 112;
      ctx.lineWidth = (i % 3 === 0) ? 7 : 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Hands set to 9:00 PM
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#140c06';
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(62, 128); // Hour hand at 9
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128, 36); // Minute hand at 12
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  createTeaKadaiSignTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Crimson signboard
    ctx.fillStyle = '#b71515';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 116);

    // Tamil & English typography
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('முருகன் டீ கடை', 256, 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('MURUGAN TEA KADAI • ESTD 1988', 256, 96);

    return new THREE.CanvasTexture(canvas);
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

    // Natural color palettes for Tamil Nadu biomes
    const colChennaiRedSoil = new THREE.Color(0x8a4635);  // Rich red earth (செம்மண்)
    const colChennaiGrass = new THREE.Color(0x566d3b);    // Coastal dry grass & turf
    const colChennaiRoad = new THREE.Color(0x5e5a55);     // George Town historic paved stone road
    const colDeltaMud = new THREE.Color(0x283218);        // Wetland silt
    const colDeltaGreen = new THREE.Color(0x254c1e);      // Mangrove moss & paddy emerald
    const colHighlandForest = new THREE.Color(0x133816);  // Shola green
    const colMountainRock = new THREE.Color(0x4a4d52);    // Granite crag
    const colPeakMist = new THREE.Color(0x6b777a);        // Mist summit

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getElevation(vx, vz);
      pos.setY(i, vy);

      const vertexCol = new THREE.Color();

      if (vx < -100) {
        // Chennai & George Town Lowlands
        const distFromRoad = Math.abs(vz - 20);
        const onPlazaRoad = (vx >= -265 && vx <= -165 && distFromRoad < 15);

        if (onPlazaRoad) {
          // Roadway and stone plaza connecting High Court Gate to Tea Kadai
          const roadBlend = Math.min(1.0, distFromRoad / 15);
          vertexCol.copy(colChennaiRoad).lerp(colChennaiGrass, roadBlend * 0.35);
        } else {
          // Organic red earth with natural grass patches
          const grassNoise = Math.sin(vx * 0.12) * Math.cos(vz * 0.12);
          if (grassNoise > 0.1) {
            const blend = Math.min(0.85, (grassNoise - 0.1) * 2.2);
            vertexCol.copy(colChennaiRedSoil).lerp(colChennaiGrass, blend);
          } else {
            vertexCol.copy(colChennaiRedSoil);
          }
        }
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

    const groundTex = this.createProceduralGroundTexture();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure neutral white so vertex colors display true to nature!
      map: groundTex,
      vertexColors: true,
      flatShading: false, // Smooth organic lighting across terrain!
      roughness: 0.88,
      metalness: 0.04
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
    this.landmarksGroup = new THREE.Group();
    this.landmarksGroup.name = 'LandmarksGroup';
    this.scene.add(this.landmarksGroup);

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

    const brickTex = this.createBrickTexture();
    const clockTex = this.createClockTexture();

    const brickMat = new THREE.MeshStandardMaterial({
      color: 0x982a1e,
      map: brickTex,
      roughness: 0.72,
      metalness: 0.05
    });
    const stoneTrimMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c5, roughness: 0.65 });
    const darkArchMat = new THREE.MeshStandardMaterial({ color: 0x1f1412, roughness: 0.95 });
    const goldDomeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.22 });
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x242426, metalness: 0.8, roughness: 0.3 });
    const clockMat = new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.3 });

    // 1. Grand Entrance Stone Terrace & Steps
    const steps = new THREE.Mesh(new THREE.BoxGeometry(32, 1.4, 16), stoneTrimMat);
    steps.position.set(0, 0.7, 0);
    steps.receiveShadow = true;
    group.add(steps);

    // Stone Balustrades along front of steps
    for (let bx = -14; bx <= 14; bx += 2.8) {
      if (Math.abs(bx) < 5) continue; // Entrance portal gap
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.4, 8), stoneTrimMat);
      post.position.set(bx, 1.8, 7.5);
      post.castShadow = true;
      group.add(post);
    }

    // 2. Left Clock Tower with Indo-Saracenic detailing
    const leftTower = new THREE.Mesh(new THREE.BoxGeometry(7.2, 28, 7.2), brickMat);
    leftTower.position.set(-10.5, 14, 0);
    leftTower.castShadow = true;
    leftTower.receiveShadow = true;
    group.add(leftTower);

    // Left Tower Stone Cornice Bands
    const cornice1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.8, 7.8), stoneTrimMat);
    cornice1.position.set(-10.5, 18, 0);
    group.add(cornice1);

    const cornice2 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.8, 7.8), stoneTrimMat);
    cornice2.position.set(-10.5, 26, 0);
    group.add(cornice2);

    // Left Clock Face (South-facing toward player approach)
    if (clockTex) {
      const leftClock = new THREE.Mesh(new THREE.CircleGeometry(1.8, 20), clockMat);
      leftClock.position.set(-10.5, 22.5, 3.65);
      group.add(leftClock);
    }

    // 3. Right Clock Tower
    const rightTower = new THREE.Mesh(new THREE.BoxGeometry(7.2, 28, 7.2), brickMat);
    rightTower.position.set(10.5, 14, 0);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    group.add(rightTower);

    const rightCornice1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.8, 7.8), stoneTrimMat);
    rightCornice1.position.set(10.5, 18, 0);
    group.add(rightCornice1);

    const rightCornice2 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.8, 7.8), stoneTrimMat);
    rightCornice2.position.set(10.5, 26, 0);
    group.add(rightCornice2);

    // Right Clock Face
    if (clockTex) {
      const rightClock = new THREE.Mesh(new THREE.CircleGeometry(1.8, 20), clockMat);
      rightClock.position.set(10.5, 22.5, 3.65);
      group.add(rightClock);
    }

    // 4. Central Grand Facade & Lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 6.5), brickMat);
    lintel.position.set(0, 20, 0);
    lintel.castShadow = true;
    group.add(lintel);

    // Cusped Sandstone Arch Trim around central entrance
    const archTrim = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.2, 6.6), stoneTrimMat);
    archTrim.position.set(0, 14.8, 0);
    group.add(archTrim);

    // Dark arch recess
    const archHole = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 5.8), darkArchMat);
    archHole.position.set(0, 7.5, 0);
    group.add(archHole);

    // Wrought-iron Victorian Carriage Gates
    for (let gx = -4.5; gx <= 4.5; gx += 1.5) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 12, 6), grillMat);
      bar.position.set(gx, 7, 1.2);
      bar.castShadow = true;
      group.add(bar);
    }

    // 5. Gilded Onion Domes with Finials
    const domeGeo = new THREE.SphereGeometry(3.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const finialGeo = new THREE.ConeGeometry(0.4, 2.2, 8);

    // Left Dome
    const leftDome = new THREE.Mesh(domeGeo, goldDomeMat);
    leftDome.position.set(-10.5, 28, 0);
    leftDome.castShadow = true;
    group.add(leftDome);
    const leftFinial = new THREE.Mesh(finialGeo, goldDomeMat);
    leftFinial.position.set(-10.5, 32.5, 0);
    group.add(leftFinial);

    // Right Dome
    const rightDome = new THREE.Mesh(domeGeo, goldDomeMat);
    rightDome.position.set(10.5, 28, 0);
    rightDome.castShadow = true;
    group.add(rightDome);
    const rightFinial = new THREE.Mesh(finialGeo, goldDomeMat);
    rightFinial.position.set(10.5, 32.5, 0);
    group.add(rightFinial);

    // Central Grand Octagonal Drum & Gilded Dome
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 4, 8), stoneTrimMat);
    drum.position.set(0, 27, 0);
    drum.castShadow = true;
    group.add(drum);

    const grandDome = new THREE.Mesh(new THREE.SphereGeometry(5.2, 20, 20), goldDomeMat);
    grandDome.position.set(0, 31, 0);
    grandDome.castShadow = true;
    group.add(grandDome);

    const grandFinial = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3.2, 8), goldDomeMat);
    grandFinial.position.set(0, 37.2, 0);
    group.add(grandFinial);

    // High Court Entrance Lanterns & Warm Illumination
    const courtLight = new THREE.PointLight(0xffbe76, 2.8, 35);
    courtLight.position.set(0, 10, 4.5);
    courtLight.castShadow = true;
    group.add(courtLight);

    group.name = 'MadrasHighCourt';
    this.landmarksGroup.add(group);
    this.landmarks.push({ id: 'high_court', mesh: group, name: 'Madras High Court Gate' });
  }

  // 2. Murugan Annan's Roadside Tea Kadai 3D Model
  createTeaKadai(x, z) {
    const group = new THREE.Group();
    const y = this.getElevation(x, z);
    group.position.set(x, y, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x54371e, roughness: 0.88 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0x9b6b3e, roughness: 0.95 });
    const signTex = this.createTeaKadaiSignTexture();
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.88, roughness: 0.18 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1 });

    // Wooden stall counter with weathered grain
    const counter = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 6), woodMat);
    counter.position.set(0, 2, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    // Four awning bamboo poles
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 8, 8);
    const p1 = new THREE.Mesh(poleGeo, woodMat); p1.position.set(-5.5, 4, 2.8); p1.castShadow = true; group.add(p1);
    const p2 = new THREE.Mesh(poleGeo, woodMat); p2.position.set(5.5, 4, 2.8); p2.castShadow = true; group.add(p2);
    const p3 = new THREE.Mesh(poleGeo, woodMat); p3.position.set(-5.5, 4, -2.8); p3.castShadow = true; group.add(p3);
    const p4 = new THREE.Mesh(poleGeo, woodMat); p4.position.set(5.5, 4, -2.8); p4.castShadow = true; group.add(p4);

    // Thatched bamboo awning roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.5, 4), thatchMat);
    roof.position.set(0, 9.2, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Tamil Roadside Signboard: "முருகன் டீ கடை • MURUGAN TEA KADAI"
    const sign = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.8, 0.35), signMat);
    sign.position.set(0, 7.6, 3.1);
    sign.castShadow = true;
    group.add(sign);

    // Steaming Brass Samovar / Tea Boiler with brass tap
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 2.4, 16), brassMat);
    boiler.position.set(-3.2, 5.2, 0.5);
    boiler.castShadow = true;
    group.add(boiler);

    const boilerCap = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), brassMat);
    boilerCap.position.set(-3.2, 6.5, 0.5);
    group.add(boilerCap);

    // Glass jar with bakery biscuits / snacks
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 12), glassMat);
    jar.position.set(2.8, 4.5, 1.2);
    group.add(jar);

    // Customer wooden benches
    const bench1 = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 2.2), woodMat);
    bench1.position.set(0, 0.6, 6.5);
    bench1.castShadow = true;
    bench1.receiveShadow = true;
    group.add(bench1);

    const bench2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 2.0), woodMat);
    bench2.position.set(-7.5, 0.6, 1.0);
    bench2.rotation.y = Math.PI / 2;
    bench2.castShadow = true;
    group.add(bench2);

    // Warm Samovar & Lantern Glow
    const teaLight = new THREE.PointLight(0xff9f43, 3.6, 38);
    teaLight.position.set(0, 6, 2.5);
    teaLight.castShadow = true;
    group.add(teaLight);

    group.name = 'MuruganTeaKadai';
    this.landmarksGroup.add(group);
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

    group.name = 'CholaWaterwheel';
    this.landmarksGroup.add(group);
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

    group.name = 'TodaHut';
    this.landmarksGroup.add(group);
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

    group.name = 'EcoSanctuaryPortal';
    this.landmarksGroup.add(group);
    this.landmarks.push({ id: 'eco_portal', mesh: group, name: 'Pasumai Thadam Eco-Sanctuary' });
  }

  // ==========================================================================
  // REGIONAL ENVIRONMENT DETAILS (Cauvery Delta Bunds, Pichavaram Canal, Nilgiri Terraces)
  // ==========================================================================
  createRegionalEnvironmentDetails() {
    const rng = (typeof WorldRNG !== 'undefined') ? new WorldRNG(918273) : { range: (a, b) => (a + b) / 2 };

    // 1. CAUVERY DELTA: Raised Mud Bunds, Field Rows & Irrigation Feeder Channels
    const bundMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.95 });
    const paddyMat = new THREE.MeshStandardMaterial({ color: 0x3d7e26, roughness: 0.6, metalness: 0.1 });

    // Grid of raised mud bunds across delta (X: -25 to +35, Z: -50 to +50)
    for (let gx = -20; gx <= 30; gx += 16) {
      const by = this.getElevation(gx, 0) + 0.25;
      const bundZ = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 70), bundMat);
      bundZ.position.set(gx, by, 0);
      bundZ.receiveShadow = true;
      this.scene.add(bundZ);

      // Perpendicular bunds
      for (let gz = -35; gz <= 35; gz += 24) {
        const bx = gx + 8;
        const bby = this.getElevation(bx, gz) + 0.25;
        const bundX = new THREE.Mesh(new THREE.BoxGeometry(15, 0.45, 1.2), bundMat);
        bundX.position.set(bx, bby, gz);
        bundX.receiveShadow = true;
        this.scene.add(bundX);

        // Rectangular paddy field plot inside bunds
        const plot = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 23.5), paddyMat);
        plot.rotateX(-Math.PI / 2);
        plot.position.set(bx, bby - 0.1, gz);
        plot.receiveShadow = true;
        this.scene.add(plot);
      }
    }

    // 2. PICHAVARAM: Wooden Boat Dock & Mud Banks along Waterways (X: -80 to -40)
    const dockWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.95 });

    const dock = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 5), dockWoodMat);
    dock.position.set(-60, 0.9, 5);
    dock.receiveShadow = true;
    dock.castShadow = true;
    this.scene.add(dock);

    // Dock support piles
    const pileGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
    for (let px of [-65, -60, -55]) {
      for (let pz of [3, 7]) {
        const pile = new THREE.Mesh(pileGeo, dockWoodMat);
        pile.position.set(px, 0.4, pz);
        this.scene.add(pile);
      }
    }

    // 3. MAMALLAPURAM: Coastal Granite Boulders & Weathered Rocks (X: -155 to -115)
    const graniteMat = new THREE.MeshStandardMaterial({ color: 0x5a544d, roughness: 0.85 });
    for (let i = 0; i < 8; i++) {
      const rx = rng.range(-150, -120);
      const rz = rng.range(-60, 60);
      const ry = this.getElevation(rx, rz);
      const s = rng.range(2.5, 5.5);
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), graniteMat);
      boulder.position.set(rx, ry + s * 0.4, rz);
      boulder.rotation.set(rng.range(0, 3), rng.range(0, 3), rng.range(0, 3));
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      this.scene.add(boulder);
    }

    // 4. NILGIRIS: Terraced Tea Slopes & Stone Retaining Walls (X: +140 to +260)
    const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.9 });
    for (let tx = 145; tx <= 250; tx += 25) {
      const ty = this.getElevation(tx, 0);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 80), stoneWallMat);
      wall.position.set(tx, ty, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
    }
  }

  // ==========================================================================
  // DETERMINISTIC FLORA SCATTERING (Using WorldRNG - Zero Math.random())
  // ==========================================================================
  scatterBiomeFlora() {
    const rng = (typeof WorldRNG !== 'undefined') ? new WorldRNG(884422) : { range: (a, b) => (a + b) / 2 };

    // 1. Palmyra & Coconut Palms across Chennai & plains (X: -290 to -110)
    for (let i = 0; i < 48; i++) {
      const px = rng.range(-290, -115);
      const pz = rng.range(-95, 95);
      // Skip immediate perimeter of High Court & Tea stall
      if (Math.hypot(px - (-240), pz - 15) < 22) continue;
      if (Math.hypot(px - (-190), pz - 25) < 16) continue;

      if (i % 3 === 0) {
        this.createCoconutTree(px, pz, rng);
      } else {
        this.createPalmyraTree(px, pz, rng);
      }
    }

    // 2. Low-Poly Mangrove Trees in Pichavaram Delta (X: -90 to +80)
    for (let i = 0; i < 50; i++) {
      const px = rng.range(-90, 80);
      const pz = rng.range(-90, 90);
      this.createMangroveTree(px, pz, rng);
    }

    // 3. Shola Pines & Tea Bushes in Western Ghats Highlands (X: +110 to +290)
    for (let i = 0; i < 65; i++) {
      const px = rng.range(110, 285);
      const pz = rng.range(-95, 95);
      if (Math.hypot(px - 210, pz - 20) < 14) continue;
      if (Math.hypot(px - 275, pz - (-15)) < 16) continue;
      this.createSholaPineTree(px, pz, rng);
    }
  }

  // Authentic Tamil Nadu Palmyra Palm (பனை மரம்)
  createPalmyraTree(x, z, rng = null) {
    const y = this.getElevation(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x38281d, roughness: 0.92 });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2d5c1e,
      roughness: 0.65,
      side: THREE.DoubleSide
    });
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0x1c140d, roughness: 0.4, metalness: 0.1 });

    // Tapered columnar trunk with subtle ring scars
    const height = 14 + (rng ? rng.range(0, 5) : 3.0);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.65, height, 10), trunkMat);
    trunk.position.set(0, height / 2, 0);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Trunk ring details
    for (let r = 2; r < height - 1; r += 2.0) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 10), trunkMat);
      ring.position.set(0, r, 0);
      group.add(ring);
    }

    // Crown hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.45, 0.8, 8), trunkMat);
    hub.position.set(0, height, 0);
    group.add(hub);

    // Hanging Nungu clusters (Palmyra fruit)
    for (let f = 0; f < 3; f++) {
      const angle = (f / 3) * Math.PI * 2;
      const fruitGroup = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), fruitMat);
      fruitGroup.position.set(Math.cos(angle) * 0.55, height - 0.4, Math.sin(angle) * 0.55);
      fruitGroup.castShadow = true;
      group.add(fruitGroup);
    }

    // 12 Radiating arching fan fronds in 2 tiers
    const frondGeo = new THREE.PlaneGeometry(1.6, 4.2, 2, 4);
    const frondPos = frondGeo.attributes.position;
    for (let p = 0; p < frondPos.count; p++) {
      const py = frondPos.getY(p);
      if (py > 0) {
        frondPos.setZ(p, -Math.pow((py + 2.1) / 4.2, 2) * 1.4);
      }
    }
    frondGeo.computeVertexNormals();

    const frondCount = 12;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2 + (rng ? rng.range(-0.15, 0.15) : 0);
      const frond = new THREE.Mesh(frondGeo, leafMat);
      frond.position.set(0, height + 0.2, 0);
      frond.rotation.y = angle;
      frond.rotation.x = Math.PI / 4 + ((i % 2 === 0) ? 0.18 : 0.48);
      frond.castShadow = true;
      group.add(frond);
    }

    this.scene.add(group);
    this.trees.push(group);
  }

  // Authentic Coastal Coconut Palm (தென்னை மரம்)
  createCoconutTree(x, z, rng = null) {
    const y = this.getElevation(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x483626, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x235e1d,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x5a752b, roughness: 0.5 });

    // Gently curving trunk
    const curveDir = rng ? rng.range(0, Math.PI * 2) : 0.5;
    const trunkGroup = new THREE.Group();
    const segH = 2.4;
    for (let s = 0; s < 5; s++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.32 - s * 0.02, 0.38 - s * 0.02, segH, 8), trunkMat);
      seg.position.set(Math.cos(curveDir) * s * 0.45, s * segH + segH / 2, Math.sin(curveDir) * s * 0.45);
      seg.rotation.z = Math.cos(curveDir) * 0.08 * s;
      seg.rotation.x = Math.sin(curveDir) * 0.08 * s;
      seg.castShadow = true;
      trunkGroup.add(seg);
    }
    group.add(trunkGroup);

    const topX = Math.cos(curveDir) * 4 * 0.45;
    const topY = 5 * segH;
    const topZ = Math.sin(curveDir) * 4 * 0.45;

    // Coconut clusters
    for (let c = 0; c < 4; c++) {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), nutMat);
      const na = (c / 4) * Math.PI * 2;
      nut.position.set(topX + Math.cos(na) * 0.45, topY - 0.25, topZ + Math.sin(na) * 0.45);
      nut.castShadow = true;
      group.add(nut);
    }

    // Feathery arching pinnate palm leaves
    const featherGeo = new THREE.PlaneGeometry(1.2, 5.0, 2, 5);
    const featherPos = featherGeo.attributes.position;
    for (let p = 0; p < featherPos.count; p++) {
      const py = featherPos.getY(p);
      if (py > 0) featherPos.setZ(p, -Math.pow((py + 2.5) / 5.0, 2) * 1.8);
    }
    featherGeo.computeVertexNormals();

    for (let i = 0; i < 10; i++) {
      const fa = (i / 10) * Math.PI * 2;
      const leaf = new THREE.Mesh(featherGeo, leafMat);
      leaf.position.set(topX, topY + 0.2, topZ);
      leaf.rotation.y = fa;
      leaf.rotation.x = Math.PI / 4 + ((i % 2 === 0) ? 0.25 : 0.55);
      leaf.castShadow = true;
      group.add(leaf);
    }

    this.scene.add(group);
    this.trees.push(group);
  }

  // Mangrove Tree: Aerial stilt roots + twisted canopy
  createMangroveTree(x, z, rng = null) {
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
  createSholaPineTree(x, z, rng = null) {
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

  setQuality(terrainQuality, waterQuality) {
    if (this.waterMesh && this.waterMesh.material) {
      if (waterQuality === 'low') {
        this.waterMesh.material.roughness = 0.5;
        this.waterMesh.material.metalness = 0.1;
      } else if (waterQuality === 'ultra') {
        this.waterMesh.material.roughness = 0.08;
        this.waterMesh.material.metalness = 0.85;
      } else {
        this.waterMesh.material.roughness = 0.18;
        this.waterMesh.material.metalness = 0.6;
      }
      this.waterMesh.material.needsUpdate = true;
    }
  }
}

window.ThreeTerrain = ThreeTerrain;

