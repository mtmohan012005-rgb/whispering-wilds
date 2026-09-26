const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

class ModelCompiler {
  constructor(name) {
    this.name = name;
    this.binaryChunks = [];
    this.byteLength = 0;
    this.bufferViews = [];
    this.accessors = [];
    this.meshes = [];
    this.nodes = [];
    this.materials = [];
  }

  addBuffer(data, target = null) {
    let buf;
    if (data instanceof Float32Array || data instanceof Uint16Array || data instanceof Uint8Array || data instanceof Uint32Array) {
      buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    } else if (Buffer.isBuffer(data)) {
      buf = data;
    } else {
      throw new Error('Unsupported buffer type');
    }

    const padding = (4 - (buf.length % 4)) % 4;
    let alignedBuf = buf;
    if (padding > 0) {
      alignedBuf = Buffer.concat([buf, Buffer.alloc(padding)]);
    }

    const byteOffset = this.byteLength;
    const byteLength = buf.length;
    this.binaryChunks.push(alignedBuf);
    this.byteLength += alignedBuf.length;

    const bufferViewIndex = this.bufferViews.length;
    const viewDef = { buffer: 0, byteOffset, byteLength };
    if (target) viewDef.target = target;
    this.bufferViews.push(viewDef);
    return bufferViewIndex;
  }

  addAccessor(bufferViewIndex, componentType, count, type, min = null, max = null) {
    const accIndex = this.accessors.length;
    const acc = { bufferView: bufferViewIndex, byteOffset: 0, componentType, count, type };
    if (min) acc.min = min;
    if (max) acc.max = max;
    this.accessors.push(acc);
    return accIndex;
  }

  addMaterial(name, baseColor, roughness = 0.6, metallic = 0.05) {
    const matIndex = this.materials.length;
    this.materials.push({
      name,
      pbrMetallicRoughness: {
        baseColorFactor: baseColor,
        roughnessFactor: roughness,
        metallicFactor: metallic
      },
      doubleSided: true
    });
    return matIndex;
  }

  createBox(width, height, depth, ox = 0, oy = 0, oz = 0) {
    const w = width / 2, h = height / 2, d = depth / 2;
    const positions = new Float32Array([
      -w+ox, -h+oy,  d+oz,   w+ox, -h+oy,  d+oz,   w+ox,  h+oy,  d+oz,  -w+ox,  h+oy,  d+oz,
       w+ox, -h+oy, -d+oz,  -w+ox, -h+oy, -d+oz,  -w+ox,  h+oy, -d+oz,   w+ox,  h+oy, -d+oz,
      -w+ox,  h+oy,  d+oz,   w+ox,  h+oy,  d+oz,   w+ox,  h+oy, -d+oz,  -w+ox,  h+oy, -d+oz,
      -w+ox, -h+oy, -d+oz,   w+ox, -h+oy, -d+oz,   w+ox, -h+oy,  d+oz,  -w+ox, -h+oy,  d+oz,
       w+ox, -h+oy,  d+oz,   w+ox, -h+oy, -d+oz,   w+ox,  h+oy, -d+oz,   w+ox,  h+oy,  d+oz,
      -w+ox, -h+oy, -d+oz,  -w+ox, -h+oy,  d+oz,  -w+ox,  h+oy,  d+oz,  -w+ox,  h+oy, -d+oz
    ]);

    const normals = new Float32Array([
       0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
       0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,
       0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
       0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,
       1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
      -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0
    ]);

    const uvs = new Float32Array([
      0,0, 1,0, 1,1, 0,1,
      0,0, 1,0, 1,1, 0,1,
      0,0, 1,0, 1,1, 0,1,
      0,0, 1,0, 1,1, 0,1,
      0,0, 1,0, 1,1, 0,1,
      0,0, 1,0, 1,1, 0,1
    ]);

    const indices = new Uint16Array([
       0,  1,  2,   0,  2,  3,
       4,  5,  6,   4,  6,  7,
       8,  9, 10,   8, 10, 11,
      12, 13, 14,  12, 14, 15,
      16, 17, 18,  16, 18, 19,
      20, 21, 22,  20, 22, 23
    ]);

    return { positions, normals, uvs, indices };
  }

  createCylinder(rt, rb, h, segs = 8, oy = 0) {
    const pos = [], norm = [], uvs = [], idx = [];
    const halfH = h / 2;
    for (let y = 0; y <= 1; y++) {
      const v = y;
      const r = y === 0 ? rb : rt;
      const py = (y === 0 ? -halfH : halfH) + oy;
      for (let x = 0; x <= segs; x++) {
        const u = x / segs;
        const theta = u * Math.PI * 2;
        const s = Math.sin(theta);
        const c = Math.cos(theta);
        pos.push(r * s, py, r * c);
        norm.push(s, 0, c);
        uvs.push(u, v);
      }
    }
    const stride = segs + 1;
    for (let x = 0; x < segs; x++) {
      idx.push(x, x + stride, x + 1);
      idx.push(x + 1, x + stride, x + stride + 1);
    }
    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(idx)
    };
  }

  addPart(name, geo, materialIndex) {
    const vertexCount = geo.positions.length / 3;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < geo.positions.length; i += 3) {
      const x = geo.positions[i];
      const y = geo.positions[i + 1];
      const z = geo.positions[i + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const posView = this.addBuffer(geo.positions, 34962);
    const posAcc = this.addAccessor(posView, 5126, vertexCount, 'VEC3', [minX, minY, minZ], [maxX, maxY, maxZ]);

    const normView = this.addBuffer(geo.normals, 34962);
    const normAcc = this.addAccessor(normView, 5126, vertexCount, 'VEC3');

    const uvView = this.addBuffer(geo.uvs, 34962);
    const uvAcc = this.addAccessor(uvView, 5126, vertexCount, 'VEC2');

    const idxView = this.addBuffer(geo.indices, 34963);
    const idxAcc = this.addAccessor(idxView, 5123, geo.indices.length, 'SCALAR');

    const meshIdx = this.meshes.length;
    this.meshes.push({
      name,
      primitives: [{
        attributes: { POSITION: posAcc, NORMAL: normAcc, TEXCOORD_0: uvAcc },
        indices: idxAcc,
        material: materialIndex,
        mode: 4
      }]
    });

    const nodeIdx = this.nodes.length;
    this.nodes.push({ name: `${name}_Node`, mesh: meshIdx });
    return nodeIdx;
  }

  saveGLB(outRelPath) {
    const fullOut = path.join(ROOT_DIR, outRelPath);
    const rootChildren = this.nodes.map((_, i) => i);
    // Insert Root node at the beginning if needed, or make scene contain all nodes
    const gltf = {
      asset: { version: '2.0', generator: 'Whispering Wilds Regional Asset Compiler' },
      scene: 0,
      scenes: [{ name: this.name, nodes: rootChildren }],
      nodes: this.nodes,
      materials: this.materials,
      meshes: this.meshes,
      accessors: this.accessors,
      bufferViews: this.bufferViews,
      buffers: [{ byteLength: this.byteLength }]
    };

    const jsonString = JSON.stringify(gltf);
    let jsonBuffer = Buffer.from(jsonString, 'utf8');
    const jsonPad = (4 - (jsonBuffer.length % 4)) % 4;
    if (jsonPad > 0) jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPad, 0x20)]);

    const binBuffer = Buffer.concat(this.binaryChunks);
    const totalLength = 12 + (8 + jsonBuffer.length) + (8 + binBuffer.length);

    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546C67, 0); // "glTF"
    header.writeUInt32LE(2, 4);          // version 2
    header.writeUInt32LE(totalLength, 8);

    const jsonHdr = Buffer.alloc(8);
    jsonHdr.writeUInt32LE(jsonBuffer.length, 0);
    jsonHdr.writeUInt32LE(0x4E4F534A, 4); // "JSON"

    const binHdr = Buffer.alloc(8);
    binHdr.writeUInt32LE(binBuffer.length, 0);
    binHdr.writeUInt32LE(0x004E4942, 4);  // "BIN\0"

    const outBuf = Buffer.concat([header, jsonHdr, jsonBuffer, binHdr, binBuffer]);
    fs.mkdirSync(path.dirname(fullOut), { recursive: true });
    fs.writeFileSync(fullOut, outBuf);
    console.log(`  ✓ Built: ${outRelPath} (${outBuf.length} bytes, ${this.meshes.length} parts)`);
  }
}

// -------------------------------------------------------------
// COMPILATION RECIPES
// -------------------------------------------------------------

function compileChennaiHighCourt() {
  const m = new ModelCompiler('Madras_High_Court');
  const matBrick = m.addMaterial('M_RedBrick_IndoSaracenic', [0.72, 0.22, 0.16, 1.0], 0.75, 0.05);
  const matDome = m.addMaterial('M_White_Dome_Marble', [0.92, 0.90, 0.85, 1.0], 0.35, 0.02);
  const matSandstone = m.addMaterial('M_Golden_Sandstone_Arch', [0.82, 0.65, 0.42, 1.0], 0.65, 0.0);

  // Main block (width 32m, height 14m, depth 16m)
  m.addPart('MainHall', m.createBox(32, 14, 16, 0, 7, 0), matBrick);
  // Central Indo-Saracenic Dome
  m.addPart('CentralDomeDrum', m.createCylinder(4, 4, 3, 12, 15.5), matSandstone);
  m.addPart('CentralDomeHemisphere', m.createCylinder(0.2, 4, 4, 12, 19), matDome);
  // Corner Minarets
  const minaretRadius = 1.2;
  const minaretH = 26;
  [[-15, -7], [15, -7], [-15, 7], [15, 7]].forEach(([mx, mz], idx) => {
    m.addPart(`Minaret_${idx}`, m.createCylinder(minaretRadius, minaretRadius * 1.2, minaretH, 8, minaretH / 2), matBrick);
    m.addPart(`Minaret_Dome_${idx}`, m.createCylinder(0.1, minaretRadius, 2.5, 8, minaretH + 1.25), matDome);
  });
  // Grand Entrance Arched Portico
  m.addPart('ArchedPortico', m.createBox(12, 10, 5, 0, 5, 9.5), matSandstone);
  m.saveGLB('assets/landmarks/chennai/madras_high_court.glb');
}

function compileTeaKadai() {
  const m = new ModelCompiler('Chennai_Tea_Kadai');
  const matWood = m.addMaterial('M_Teak_Weathered', [0.42, 0.26, 0.16, 1.0], 0.80, 0.02);
  const matTin = m.addMaterial('M_Corrugated_Roof', [0.38, 0.42, 0.44, 1.0], 0.60, 0.30);
  const matBrass = m.addMaterial('M_Brass_Samovar', [0.85, 0.68, 0.22, 1.0], 0.25, 0.85);

  // Stall structure
  m.addPart('Stall_Counter', m.createBox(3.0, 1.1, 1.4, 0, 0.55, 0), matWood);
  m.addPart('Tin_Canopy', m.createBox(3.4, 0.1, 2.2, 0, 2.3, 0.2), matTin);
  // Roof wooden posts
  [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.8], [1.4, 0.8]].forEach(([px, pz], i) => {
    m.addPart(`Post_${i}`, m.createCylinder(0.06, 0.06, 2.3, 6, 1.15), matWood);
  });
  // Brass Samovar Boiler
  m.addPart('Brass_Samovar', m.createCylinder(0.24, 0.20, 0.75, 8, 1.45), matBrass);
  // Bench for customers
  m.addPart('Wooden_Bench', m.createBox(2.2, 0.45, 0.35, 0, 0.25, 1.4), matWood);
  m.saveGLB('assets/architecture/chennai/tea_kadai_stall.glb');
}

function compileAutoRickshaw() {
  const m = new ModelCompiler('Chennai_Auto_Rickshaw');
  const matYellow = m.addMaterial('M_Auto_Yellow_Roof', [0.95, 0.78, 0.05, 1.0], 0.45, 0.05);
  const matBlack = m.addMaterial('M_Auto_Black_Chassis', [0.10, 0.10, 0.11, 1.0], 0.50, 0.15);
  const matTire = m.addMaterial('M_Rubber_Tire', [0.08, 0.08, 0.08, 1.0], 0.85, 0.0);

  // Body cabin
  m.addPart('LowerChassis', m.createBox(1.3, 0.6, 2.4, 0, 0.6, 0), matBlack);
  m.addPart('CanvasTop', m.createBox(1.35, 0.8, 1.8, 0, 1.3, -0.2), matYellow);
  // 3 Wheels (front 1, rear 2)
  m.addPart('FrontWheel', m.createCylinder(0.25, 0.25, 0.15, 8, 0.25), matTire);
  m.addPart('RearWheel_L', m.createCylinder(0.25, 0.25, 0.15, 8, 0.25), matTire);
  m.addPart('RearWheel_R', m.createCylinder(0.25, 0.25, 0.15, 8, 0.25), matTire);
  m.saveGLB('assets/vehicles/auto_rickshaw/chennai_auto.glb');
}

function compilePalmyraPalm() {
  const m = new ModelCompiler('Palmyra_Palm');
  const matTrunk = m.addMaterial('M_Palmyra_Bark', [0.32, 0.24, 0.18, 1.0], 0.85, 0.0);
  const matFronds = m.addMaterial('M_Palmyra_Fronds', [0.18, 0.42, 0.14, 1.0], 0.60, 0.0);

  // Tall dark trunk (height 14m)
  m.addPart('Trunk', m.createCylinder(0.22, 0.35, 14.0, 8, 7.0), matTrunk);
  // Fan fronds canopy cluster
  m.addPart('FrondCrown_0', m.createBox(3.0, 0.15, 3.0, 0, 14.2, 0), matFronds);
  m.addPart('FrondCrown_1', m.createBox(2.6, 0.15, 2.6, 0, 14.5, 0), matFronds);
  m.addPart('FrondCrown_2', m.createBox(2.2, 0.20, 2.2, 0, 14.8, 0), matFronds);
  m.saveGLB('assets/vegetation/trees/palmyra_palm.glb');
}

function compileDeltaSluice() {
  const m = new ModelCompiler('Cauvery_Irrigation_Sluice');
  const matGranite = m.addMaterial('M_Granite_Sluice', [0.45, 0.44, 0.42, 1.0], 0.70, 0.05);
  const matIron = m.addMaterial('M_Sluice_IronGate', [0.20, 0.20, 0.22, 1.0], 0.50, 0.70);

  m.addPart('Sluice_LeftWall', m.createBox(0.8, 3.0, 4.0, -1.6, 1.5, 0), matGranite);
  m.addPart('Sluice_RightWall', m.createBox(0.8, 3.0, 4.0, 1.6, 1.5, 0), matGranite);
  m.addPart('Sluice_TopCrankBeam', m.createBox(4.0, 0.5, 0.8, 0, 3.25, 0), matGranite);
  m.addPart('Iron_Gate', m.createBox(2.4, 2.2, 0.15, 0, 1.1, 0), matIron);
  m.saveGLB('assets/architecture/delta/irrigation_sluice.glb');
}

function compileMangroveDock() {
  const m = new ModelCompiler('Pichavaram_Mangrove_Dock');
  const matWood = m.addMaterial('M_Weathered_Mangrove_Timber', [0.35, 0.25, 0.18, 1.0], 0.85, 0.0);
  const matRope = m.addMaterial('M_Coir_Rope', [0.55, 0.45, 0.30, 1.0], 0.90, 0.0);

  // Deck
  m.addPart('Deck_Planks', m.createBox(2.5, 0.25, 6.0, 0, 0.8, 0), matWood);
  // Pilings
  [[-1.1, -2.5], [1.1, -2.5], [-1.1, 0], [1.1, 0], [-1.1, 2.5], [1.1, 2.5]].forEach(([px, pz], i) => {
    m.addPart(`Piling_${i}`, m.createCylinder(0.12, 0.12, 2.4, 6, 0.4), matWood);
  });
  // Mooring post with coir rope
  m.addPart('MooringPost', m.createCylinder(0.14, 0.14, 1.4, 6, 1.3), matWood);
  m.addPart('CoirRopeWrap', m.createCylinder(0.16, 0.16, 0.3, 6, 1.2), matRope);
  m.saveGLB('assets/landmarks/pichavaram/mangrove_dock.glb');
}

function compileMangroveTree() {
  const m = new ModelCompiler('Rhizophora_Mangrove');
  const matRoot = m.addMaterial('M_Mangrove_Stilt_Root', [0.30, 0.20, 0.14, 1.0], 0.70, 0.0);
  const matLeaf = m.addMaterial('M_Mangrove_Glossy_Leaves', [0.15, 0.40, 0.12, 1.0], 0.45, 0.0);

  // Stilt arching roots
  m.addPart('RootCore', m.createCylinder(0.35, 0.60, 2.2, 8, 1.1), matRoot);
  m.addPart('Stilt_0', m.createBox(0.18, 2.0, 1.4, 0.8, 0.9, 0.5), matRoot);
  m.addPart('Stilt_1', m.createBox(0.18, 2.0, 1.4, -0.8, 0.9, -0.5), matRoot);
  m.addPart('Stilt_2', m.createBox(1.4, 2.0, 0.18, 0.5, 0.9, -0.8), matRoot);
  // Lush Canopy
  m.addPart('Canopy_Low', m.createBox(3.4, 1.8, 3.4, 0, 3.2, 0), matLeaf);
  m.addPart('Canopy_High', m.createBox(2.4, 1.4, 2.4, 0, 4.4, 0), matLeaf);
  m.saveGLB('assets/vegetation/trees/rhizophora_mangrove.glb');
}

function compileMangroveRowboat() {
  const m = new ModelCompiler('Pichavaram_Rowboat');
  const matWood = m.addMaterial('M_Teak_Boat_Hull', [0.38, 0.24, 0.15, 1.0], 0.75, 0.0);
  const matOar = m.addMaterial('M_Oar_Bamboo', [0.65, 0.52, 0.32, 1.0], 0.65, 0.0);

  // Hull
  m.addPart('BoatHull_Bottom', m.createBox(1.2, 0.25, 4.5, 0, 0.2, 0), matWood);
  m.addPart('BoatHull_SideL', m.createBox(0.15, 0.6, 4.5, -0.6, 0.5, 0), matWood);
  m.addPart('BoatHull_SideR', m.createBox(0.15, 0.6, 4.5, 0.6, 0.5, 0), matWood);
  m.addPart('BoatSeat_0', m.createBox(1.1, 0.1, 0.4, 0, 0.5, -1.0), matWood);
  m.addPart('BoatSeat_1', m.createBox(1.1, 0.1, 0.4, 0, 0.5, 1.0), matWood);
  // Twin Oars
  m.addPart('Oar_Left', m.createCylinder(0.04, 0.04, 2.2, 6, 0.7), matOar);
  m.addPart('Oar_Right', m.createCylinder(0.04, 0.04, 2.2, 6, 0.7), matOar);
  m.saveGLB('assets/vehicles/boats/mangrove_rowboat.glb');
}

function compileChettinadMansion() {
  const m = new ModelCompiler('Chettinad_Heritage_Mansion');
  const matPlaster = m.addMaterial('M_EggWhite_Lime_Plaster', [0.93, 0.91, 0.86, 1.0], 0.70, 0.0);
  const matTeak = m.addMaterial('M_Burma_Teak_Pillar', [0.36, 0.20, 0.12, 1.0], 0.50, 0.05);
  const matTile = m.addMaterial('M_Terracotta_Roof_Tile', [0.74, 0.32, 0.18, 1.0], 0.75, 0.0);
  const matAthangudi = m.addMaterial('M_Athangudi_Pattern_Tile', [0.22, 0.45, 0.52, 1.0], 0.30, 0.02);

  // Main two-story facade
  m.addPart('GroundFloor', m.createBox(22, 5.0, 16, 0, 2.5, 0), matPlaster);
  m.addPart('UpperFloor', m.createBox(20, 4.5, 14, 0, 7.25, 0), matPlaster);
  m.addPart('Terracotta_Roof', m.createBox(23, 1.2, 17, 0, 10.1, 0), matTile);
  // Grand Thinnai (Raised front veranda)
  m.addPart('ThinnaiVeranda', m.createBox(18, 0.8, 3.5, 0, 0.4, 9.5), matAthangudi);
  // Burma Teak Pillars
  [-6, -2, 2, 6].forEach((px, i) => {
    m.addPart(`TeakPillar_${i}`, m.createCylinder(0.20, 0.28, 4.2, 8, 2.9), matTeak);
  });
  // Ornate Carved Doorway
  m.addPart('CarvedDoorway', m.createBox(2.4, 3.2, 0.4, 0, 2.4, 8.1), matTeak);
  m.saveGLB('assets/architecture/chettinad/courtyard_mansion.glb');
}

function compileShoreTemple() {
  const m = new ModelCompiler('Mamallapuram_Shore_Temple');
  const matGranite = m.addMaterial('M_Pallava_Weathered_Granite', [0.65, 0.58, 0.50, 1.0], 0.75, 0.05);
  const matRock = m.addMaterial('M_Coastal_Bedrock', [0.55, 0.50, 0.45, 1.0], 0.85, 0.0);

  // Granite foundation bedrock
  m.addPart('BedrockBase', m.createBox(20, 1.5, 20, 0, 0.75, 0), matRock);
  // Main Vimana sanctum (multi-tiered Dravidian pyramid)
  m.addPart('Tier_1', m.createBox(12, 3.5, 12, 0, 3.25, 0), matGranite);
  m.addPart('Tier_2', m.createBox(9.5, 3.0, 9.5, 0, 6.5, 0), matGranite);
  m.addPart('Tier_3', m.createBox(7.2, 2.5, 7.2, 0, 9.25, 0), matGranite);
  m.addPart('Tier_4', m.createBox(5.0, 2.0, 5.0, 0, 11.5, 0), matGranite);
  // Shikhara octagon cap
  m.addPart('ShikharaCap', m.createCylinder(1.5, 2.8, 2.2, 8, 13.6), matGranite);
  m.addPart('KalasaFinial', m.createCylinder(0.1, 0.8, 1.2, 8, 15.3), matGranite);
  // Perimeter Nandi Bull Statues
  [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([nx, nz], i) => {
    m.addPart(`Nandi_${i}`, m.createBox(1.2, 0.9, 1.8, nx, 1.95, nz), matGranite);
  });
  m.saveGLB('assets/landmarks/mamallapuram/shore_temple.glb');
}

function compileNilgiriTeaFactory() {
  const m = new ModelCompiler('Nilgiri_Heritage_Tea_Factory');
  const matStone = m.addMaterial('M_Colonial_Mountain_Stone', [0.48, 0.44, 0.40, 1.0], 0.78, 0.05);
  const matTin = m.addMaterial('M_Green_Corrugated_Roof', [0.18, 0.32, 0.22, 1.0], 0.65, 0.25);
  const matBrick = m.addMaterial('M_Chimney_Brick', [0.65, 0.28, 0.20, 1.0], 0.75, 0.05);

  // Main 3-story tea processing building
  m.addPart('MainFactoryBlock', m.createBox(26, 11, 14, 0, 5.5, 0), matStone);
  m.addPart('GabledGreenRoof', m.createBox(27, 2.5, 15, 0, 12.25, 0), matTin);
  // Industrial drying chimney
  m.addPart('FactoryChimney', m.createCylinder(0.9, 1.4, 18, 8, 9.0), matBrick);
  m.saveGLB('assets/landmarks/nilgiris/tea_factory_heritage.glb');
}

function compileTodaMundHut() {
  const m = new ModelCompiler('Nilgiri_Toda_Mund_Hut');
  const matThatch = m.addMaterial('M_Bamboo_Grass_Thatch', [0.65, 0.54, 0.35, 1.0], 0.88, 0.0);
  const matDryStone = m.addMaterial('M_Dry_Stone_Wall', [0.48, 0.46, 0.42, 1.0], 0.80, 0.05);

  // Barrel-vaulted arched hut
  m.addPart('VaultedRoof', m.createCylinder(2.4, 2.4, 5.5, 12, 1.8), matThatch);
  m.addPart('FrontWall', m.createBox(4.5, 3.2, 0.4, 0, 1.6, 2.75), matDryStone);
  m.addPart('RearWall', m.createBox(4.5, 3.2, 0.4, 0, 1.6, -2.75), matDryStone);
  // Tiny traditional entrance
  m.addPart('TinyEntrance', m.createBox(0.8, 0.9, 0.5, 0, 0.45, 2.8), matDryStone);
  m.saveGLB('assets/architecture/nilgiris/toda_mund_hut.glb');
}

function compileTeaHedge() {
  const m = new ModelCompiler('Nilgiri_Tea_Hedge');
  const matLeaf = m.addMaterial('M_Tea_Leaves_Camellia', [0.12, 0.38, 0.10, 1.0], 0.55, 0.0);
  const matWood = m.addMaterial('M_Tea_Stem', [0.32, 0.22, 0.16, 1.0], 0.85, 0.0);

  m.addPart('StemCluster', m.createCylinder(0.2, 0.25, 0.4, 6, 0.2), matWood);
  m.addPart('PrunedHedge_Tier0', m.createBox(2.2, 0.5, 1.0, 0, 0.65, 0), matLeaf);
  m.addPart('PrunedHedge_Tier1', m.createBox(2.0, 0.35, 0.85, 0, 0.95, 0), matLeaf);
  m.saveGLB('assets/vegetation/bushes/tea_hedge.glb');
}

function compileNilgiriTahr() {
  const m = new ModelCompiler('Nilgiri_Tahr_Species');
  const matCoat = m.addMaterial('M_Tahr_Coarse_Coat', [0.42, 0.30, 0.22, 1.0], 0.70, 0.0);
  const matHorn = m.addMaterial('M_Tahr_Curved_Horns', [0.18, 0.16, 0.14, 1.0], 0.45, 0.10);

  // Body
  m.addPart('Torso', m.createBox(0.55, 0.55, 1.1, 0, 0.85, 0), matCoat);
  m.addPart('NeckHead', m.createBox(0.28, 0.35, 0.45, 0, 1.25, 0.45), matCoat);
  // Swept-back curved horns
  m.addPart('Horn_L', m.createCylinder(0.04, 0.08, 0.45, 6, 1.55), matHorn);
  m.addPart('Horn_R', m.createCylinder(0.04, 0.08, 0.45, 6, 1.55), matHorn);
  // 4 Legs
  [[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.35], [0.2, 0.35]].forEach(([lx, lz], i) => {
    m.addPart(`Leg_${i}`, m.createCylinder(0.06, 0.05, 0.65, 6, 0.32), matCoat);
  });
  m.saveGLB('assets/wildlife/nilgiri_tahr.glb');
}

function compileElderNPC() {
  const m = new ModelCompiler('Tamil_Elder_NPC');
  const matSkin = m.addMaterial('M_Elder_Skin', [0.42, 0.26, 0.18, 1.0], 0.60, 0.02);
  const matVeshti = m.addMaterial('M_White_Veshti', [0.94, 0.92, 0.86, 1.0], 0.80, 0.0);
  const matShirt = m.addMaterial('M_LightBrown_Shirt', [0.65, 0.52, 0.40, 1.0], 0.75, 0.0);
  const matHair = m.addMaterial('M_Grey_Hair', [0.75, 0.75, 0.78, 1.0], 0.50, 0.05);

  m.addPart('Torso', m.createBox(0.40, 0.50, 0.24, 0, 1.22, 0), matShirt);
  m.addPart('Head', m.createBox(0.20, 0.22, 0.20, 0, 1.62, 0), matSkin);
  m.addPart('GreyHair', m.createBox(0.22, 0.08, 0.22, 0, 1.72, 0), matHair);
  m.addPart('Veshti', m.createBox(0.36, 0.72, 0.26, 0, 0.56, 0), matVeshti);
  m.addPart('WalkingStick', m.createCylinder(0.02, 0.02, 1.1, 6, 0.55), matShirt);
  m.saveGLB('assets/characters/npcs/velu.glb');
}

function runAllCompilations() {
  console.log('Compiling 15 Authentic Tamil Nadu Regional 3D Production Assets (.glb)...');
  compileChennaiHighCourt();
  compileTeaKadai();
  compileAutoRickshaw();
  compilePalmyraPalm();
  compileDeltaSluice();
  compileMangroveDock();
  compileMangroveTree();
  compileMangroveRowboat();
  compileChettinadMansion();
  compileShoreTemple();
  compileNilgiriTeaFactory();
  compileTodaMundHut();
  compileTeaHedge();
  compileNilgiriTahr();
  compileElderNPC();
  console.log('\n✓ All 15 Production Regional 3D Assets compiled successfully.');
}

runAllCompilations();
