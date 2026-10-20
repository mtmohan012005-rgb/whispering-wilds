const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * ModelCompiler: Generates valid binary glTF (GLB 2.0) files with multiple submeshes,
 * vertex positions, normals, UVs, indices, and PBR Metallic-Roughness materials.
 */
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
      // Front
      -w+ox, -h+oy,  d+oz,   w+ox, -h+oy,  d+oz,   w+ox,  h+oy,  d+oz,  -w+ox,  h+oy,  d+oz,
      // Back
       w+ox, -h+oy, -d+oz,  -w+ox, -h+oy, -d+oz,  -w+ox,  h+oy, -d+oz,   w+ox,  h+oy, -d+oz,
      // Top
      -w+ox,  h+oy,  d+oz,   w+ox,  h+oy,  d+oz,   w+ox,  h+oy, -d+oz,  -w+ox,  h+oy, -d+oz,
      // Bottom
      -w+ox, -h+oy, -d+oz,   w+ox, -h+oy, -d+oz,   w+ox, -h+oy,  d+oz,  -w+ox, -h+oy,  d+oz,
      // Right
       w+ox, -h+oy,  d+oz,   w+ox, -h+oy, -d+oz,   w+ox,  h+oy, -d+oz,   w+ox,  h+oy,  d+oz,
      // Left
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

  createCylinder(rt, rb, h, segs = 12, ox = 0, oy = 0, oz = 0) {
    const pos = [], norm = [], uvs = [], idx = [];
    const halfH = h / 2;

    // Side vertices
    for (let y = 0; y <= 1; y++) {
      const v = y;
      const r = y === 0 ? rb : rt;
      const py = (y === 0 ? -halfH : halfH) + oy;
      for (let x = 0; x <= segs; x++) {
        const u = x / segs;
        const theta = u * Math.PI * 2;
        const s = Math.sin(theta);
        const c = Math.cos(theta);
        pos.push(r * s + ox, py, r * c + oz);
        norm.push(s, 0, c);
        uvs.push(u, v);
      }
    }
    const stride = segs + 1;
    for (let x = 0; x < segs; x++) {
      idx.push(x, x + stride, x + 1);
      idx.push(x + 1, x + stride, x + stride + 1);
    }

    // Top cap
    if (rt > 0.001) {
      const topCenterIdx = pos.length / 3;
      pos.push(ox, halfH + oy, oz);
      norm.push(0, 1, 0);
      uvs.push(0.5, 0.5);
      const topStart = pos.length / 3;
      for (let x = 0; x <= segs; x++) {
        const u = x / segs;
        const theta = u * Math.PI * 2;
        pos.push(rt * Math.sin(theta) + ox, halfH + oy, rt * Math.cos(theta) + oz);
        norm.push(0, 1, 0);
        uvs.push(0.5 + 0.5 * Math.sin(theta), 0.5 + 0.5 * Math.cos(theta));
      }
      for (let x = 0; x < segs; x++) {
        idx.push(topCenterIdx, topStart + x, topStart + x + 1);
      }
    }

    // Bottom cap
    if (rb > 0.001) {
      const botCenterIdx = pos.length / 3;
      pos.push(ox, -halfH + oy, oz);
      norm.push(0, -1, 0);
      uvs.push(0.5, 0.5);
      const botStart = pos.length / 3;
      for (let x = 0; x <= segs; x++) {
        const u = x / segs;
        const theta = u * Math.PI * 2;
        pos.push(rb * Math.sin(theta) + ox, -halfH + oy, rb * Math.cos(theta) + oz);
        norm.push(0, -1, 0);
        uvs.push(0.5 + 0.5 * Math.sin(theta), 0.5 + 0.5 * Math.cos(theta));
      }
      for (let x = 0; x < segs; x++) {
        idx.push(botCenterIdx, botStart + x + 1, botStart + x);
      }
    }

    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(idx)
    };
  }

  createCone(rb, h, segs = 12, ox = 0, oy = 0, oz = 0) {
    return this.createCylinder(0.001, rb, h, segs, ox, oy, oz);
  }

  createSphere(radius, rings = 8, segs = 12, ox = 0, oy = 0, oz = 0) {
    const pos = [], norm = [], uvs = [], idx = [];
    for (let r = 0; r <= rings; r++) {
      const v = r / rings;
      const phi = v * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      for (let s = 0; s <= segs; s++) {
        const u = s / segs;
        const theta = u * Math.PI * 2;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        const nx = sinPhi * sinTheta;
        const ny = cosPhi;
        const nz = sinPhi * cosTheta;

        pos.push(radius * nx + ox, radius * ny + oy, radius * nz + oz);
        norm.push(nx, ny, nz);
        uvs.push(u, v);
      }
    }

    const stride = segs + 1;
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segs; s++) {
        const first = r * stride + s;
        const second = first + stride;
        idx.push(first, second, first + 1);
        idx.push(first + 1, second, second + 1);
      }
    }

    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(idx)
    };
  }

  createBarrelVault(radius, length, segs = 16, ox = 0, oy = 0, oz = 0) {
    // Semicircular arch extrusion along Z
    const pos = [], norm = [], uvs = [], idx = [];
    const halfL = length / 2;

    for (let zStep = 0; zStep <= 1; zStep++) {
      const pz = (zStep === 0 ? -halfL : halfL) + oz;
      const v = zStep;
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const theta = u * Math.PI; // 0 to 180 degrees
        const px = Math.cos(theta) * radius + ox;
        const py = Math.sin(theta) * radius + oy;
        const nx = Math.cos(theta);
        const ny = Math.sin(theta);
        pos.push(px, py, pz);
        norm.push(nx, ny, 0);
        uvs.push(u, v);
      }
    }

    const stride = segs + 1;
    for (let i = 0; i < segs; i++) {
      idx.push(i, i + stride, i + 1);
      idx.push(i + 1, i + stride, i + stride + 1);
    }

    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(idx)
    };
  }

  createPyramid(baseW, baseD, height, ox = 0, oy = 0, oz = 0) {
    const hw = baseW / 2, hd = baseD / 2, hh = height / 2;
    const pos = [
      // Base
      -hw+ox, -hh+oy,  hd+oz,   hw+ox, -hh+oy,  hd+oz,   hw+ox, -hh+oy, -hd+oz,  -hw+ox, -hh+oy, -hd+oz,
      // Front face
      -hw+ox, -hh+oy,  hd+oz,   hw+ox, -hh+oy,  hd+oz,   ox, hh+oy, oz,
      // Right face
       hw+ox, -hh+oy,  hd+oz,   hw+ox, -hh+oy, -hd+oz,   ox, hh+oy, oz,
      // Back face
       hw+ox, -hh+oy, -hd+oz,  -hw+ox, -hh+oy, -hd+oz,   ox, hh+oy, oz,
      // Left face
      -hw+ox, -hh+oy, -hd+oz,  -hw+ox, -hh+oy,  hd+oz,   ox, hh+oy, oz
    ];

    const norm = [
      // Base
      0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
      // Front
      0, 0.707, 0.707,  0, 0.707, 0.707,  0, 0.707, 0.707,
      // Right
      0.707, 0.707, 0,  0.707, 0.707, 0,  0.707, 0.707, 0,
      // Back
      0, 0.707, -0.707, 0, 0.707, -0.707, 0, 0.707, -0.707,
      // Left
      -0.707, 0.707, 0, -0.707, 0.707, 0, -0.707, 0.707, 0
    ];

    const uvs = [
      0,0, 1,0, 1,1, 0,1,
      0,0, 1,0, 0.5,1,
      0,0, 1,0, 0.5,1,
      0,0, 1,0, 0.5,1,
      0,0, 1,0, 0.5,1
    ];

    const idx = [
      0, 2, 1, 0, 3, 2,
      4, 5, 6,
      7, 8, 9,
      10, 11, 12,
      13, 14, 15
    ];

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

  saveGLB(outRelPaths) {
    const paths = Array.isArray(outRelPaths) ? outRelPaths : [outRelPaths];
    const rootChildren = this.nodes.map((_, i) => i);
    const gltf = {
      asset: { version: '2.0', generator: 'Whispering Wilds Authentic 3D Asset Pipeline' },
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

    for (const relPath of paths) {
      const fullOut = path.join(ROOT_DIR, relPath);
      fs.mkdirSync(path.dirname(fullOut), { recursive: true });
      fs.writeFileSync(fullOut, outBuf);
      console.log(`  ✓ Built: ${relPath} (${outBuf.length} bytes, ${this.meshes.length} parts)`);
    }
  }
}

// ============================================================================
// 1. TODA MUND HUT (vs Nilgiri estate cottage)
// ============================================================================
function buildTodaMundHut() {
  const m = new ModelCompiler('Nilgiri_Toda_Mund_Hut');
  const matThatch = m.addMaterial('M_Toda_Bamboo_Thatch', [0.68, 0.56, 0.36, 1.0], 0.88, 0.0);
  const matStone = m.addMaterial('M_Toda_DryStone_Facade', [0.55, 0.52, 0.48, 1.0], 0.82, 0.05);
  const matWood = m.addMaterial('M_Toda_Carved_Timber', [0.38, 0.24, 0.16, 1.0], 0.75, 0.0);
  const matEmblem = m.addMaterial('M_Toda_Sacred_Horn_Emblem', [0.18, 0.16, 0.15, 1.0], 0.60, 0.05);

  // Raised stone foundation plinth
  m.addPart('Stone_Plinth_Base', m.createBox(5.6, 0.3, 6.4, 0, 0.15, 0), matStone);

  // Barrel-Vaulted arched semicircular thatched roof (Length 5.8m, Radius 2.4m)
  m.addPart('Arched_Thatch_Roof', m.createBarrelVault(2.4, 5.8, 20, 0, 0.3, 0), matThatch);

  // Front pediment gable wall (dry stone masonry with lime finish)
  m.addPart('Front_Facade_Wall', m.createBox(4.8, 2.5, 0.4, 0, 1.45, 2.7), matStone);
  // Rear pediment gable wall
  m.addPart('Rear_Facade_Wall', m.createBox(4.8, 2.5, 0.4, 0, 1.45, -2.7), matStone);

  // Authentic tiny crawl-in entrance doorway (0.75m wide x 0.85m high)
  m.addPart('Doorway_Frame', m.createBox(0.85, 0.95, 0.5, 0, 0.68, 2.75), matWood);
  m.addPart('Doorway_Recess', m.createBox(0.70, 0.80, 0.3, 0, 0.65, 2.85), matEmblem);

  // Sacred Toda buffalo horn motif emblem carved above the entrance
  m.addPart('Buffalo_Horn_Crest', m.createBox(1.2, 0.25, 0.15, 0, 1.9, 2.92), matEmblem);
  m.addPart('Horn_Left', m.createCone(0.08, 0.4, 6, -0.55, 2.05, 2.92), matEmblem);
  m.addPart('Horn_Right', m.createCone(0.08, 0.4, 6, 0.55, 2.05, 2.92), matEmblem);

  // Low stone porch sitting benches (Thinnai) flanking door
  m.addPart('Sitting_Bench_L', m.createBox(1.6, 0.45, 0.8, -1.6, 0.42, 2.8), matStone);
  m.addPart('Sitting_Bench_R', m.createBox(1.6, 0.45, 0.8, 1.6, 0.42, 2.8), matStone);

  // Buffalo pen perimeter dry-stone enclosure pillars
  m.addPart('Corral_Post_0', m.createCylinder(0.2, 0.25, 1.4, 6, -2.5, 0.9, 3.2), matStone);
  m.addPart('Corral_Post_1', m.createCylinder(0.2, 0.25, 1.4, 6, 2.5, 0.9, 3.2), matStone);

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Nilgiris/nilgiri_cottage.glb',
    'unity/Assets/_Project/Art/Models/Architecture/nilgiris/toda_mund_hut.glb',
    'assets/architecture/nilgiris/toda_mund_hut.glb'
  ]);
}

// ============================================================================
// 2. DRAVIDIAN TEMPLE GATEWAY (vs Iron Colonial Gate)
// ============================================================================
function buildDravidianTempleGate() {
  const m = new ModelCompiler('Dravidian_Temple_Torana_Gateway');
  const matGranite = m.addMaterial('M_Dravidian_Granite_Gate', [0.46, 0.43, 0.39, 1.0], 0.78, 0.05);
  const matCarved = m.addMaterial('M_Chola_Carved_Relief', [0.42, 0.39, 0.35, 1.0], 0.70, 0.08);
  const matGoldBrass = m.addMaterial('M_Temple_Finial_Kalasam', [0.85, 0.70, 0.22, 1.0], 0.30, 0.80);

  // Massive stepped granite foundation threshold (width 8.0m, depth 3.2m)
  m.addPart('Granite_Threshold_Base', m.createBox(8.0, 0.4, 3.2, 0, 0.2, 0), matGranite);
  // Semicircular carved moonstone (Chandrashila) step
  m.addPart('Moonstone_Step', m.createCylinder(1.6, 1.8, 0.2, 12, 0, 0.1, 1.6), matCarved);

  // Left & Right Monumental Dravidian Granite Piers (4.8m tall)
  [-2.6, 2.6].forEach((px, i) => {
    // Stepped Adhisthana plinth
    m.addPart(`Pier_Plinth_${i}`, m.createBox(1.5, 0.8, 1.5, px, 0.7, 0), matGranite);
    // Octagonal main pillar shaft
    m.addPart(`Pier_Shaft_${i}`, m.createCylinder(0.55, 0.65, 3.2, 8, px, 2.7, 0), matGranite);
    // Lotus capital (Palagai cushion & bracket)
    m.addPart(`Pier_Capital_${i}`, m.createBox(1.6, 0.4, 1.6, px, 4.5, 0), matCarved);
    // Projecting carved rearing Yali / Vyala bracket
    m.addPart(`Pier_Yali_${i}`, m.createBox(0.4, 0.9, 0.8, px, 4.0, (px < 0 ? 0.7 : 0.7)), matCarved);
  });

  // Massive Multi-Tiered Architrave & Entablature Lintel
  m.addPart('Lower_Lintel_Beam', m.createBox(7.4, 0.6, 1.8, 0, 5.0, 0), matGranite);
  m.addPart('Carved_Frieze_Band', m.createBox(6.8, 0.5, 1.6, 0, 5.55, 0), matCarved);
  m.addPart('Projecting_Cornice_Kapota', m.createBox(7.8, 0.4, 2.2, 0, 6.0, 0), matGranite);

  // Superstructure: 3 Miniature Dravidian Shikhara/Sala Shrines
  [-2.2, 0, 2.2].forEach((sx, i) => {
    m.addPart(`Mini_Sala_Tier_${i}`, m.createBox(1.6, 0.9, 1.2, sx, 6.65, 0), matGranite);
    m.addPart(`Mini_Sala_Roof_${i}`, m.createPyramid(1.8, 1.4, 0.8, sx, 7.5, 0), matCarved);
    m.addPart(`Kalasam_Finial_${i}`, m.createCone(0.12, 0.5, 8, sx, 8.15, 0), matGoldBrass);
  });

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Structures/temple_gate.glb',
    'unity/Assets/_Project/Art/Models/Architecture/temple/temple_gate.glb',
    'assets/architecture/temple/temple_gate.glb'
  ]);
}

// ============================================================================
// 3. TRADITIONAL BRASS KUTHUVILAKKU (vs Brass Lantern)
// ============================================================================
function buildKuthuVilakku() {
  const m = new ModelCompiler('Traditional_Temple_Kuthuvilakku');
  const matBrass = m.addMaterial('M_Sacred_Kuthuvilakku_Brass', [0.90, 0.74, 0.24, 1.0], 0.28, 0.85);
  const matBase = m.addMaterial('M_Brass_Pedestal_Aadhanam', [0.85, 0.68, 0.20, 1.0], 0.32, 0.82);

  // 1. Tiered Stepped Lotus Base (Aadhanam)
  m.addPart('Base_Ring_0', m.createCylinder(0.38, 0.42, 0.08, 16, 0, 0.04, 0), matBase);
  m.addPart('Base_Petals', m.createCylinder(0.30, 0.38, 0.12, 16, 0, 0.14, 0), matBase);
  m.addPart('Base_Molding', m.createCylinder(0.14, 0.28, 0.10, 12, 0, 0.25, 0), matBrass);

  // 2. Slender Turned Columnar Stem with decorative rudraksha beads and rings
  m.addPart('Stem_Lower', m.createCylinder(0.06, 0.08, 0.35, 10, 0, 0.475, 0), matBrass);
  m.addPart('Stem_Bead_1', m.createSphere(0.09, 6, 10, 0, 0.67, 0), matBrass);
  m.addPart('Stem_Mid', m.createCylinder(0.05, 0.06, 0.35, 10, 0, 0.87, 0), matBrass);
  m.addPart('Stem_Bead_2', m.createSphere(0.08, 6, 10, 0, 1.07, 0), matBrass);
  m.addPart('Stem_Upper', m.createCylinder(0.06, 0.05, 0.20, 10, 0, 1.20, 0), matBrass);

  // 3. Main Circular Oil Basin (Thattu) with 5 distinct radial pointed wick spouts (mukham)
  m.addPart('Oil_Basin_Plate', m.createCylinder(0.32, 0.22, 0.08, 16, 0, 1.34, 0), matBrass);
  // 5 wick cups projecting outward
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const px = Math.sin(angle) * 0.30;
    const pz = Math.cos(angle) * 0.30;
    m.addPart(`Wick_Spout_${i}`, m.createCone(0.05, 0.12, 6, px, 1.38, pz), matBrass);
  }

  // 4. Upper Neck & Secondary Small Lotus Plate
  m.addPart('Upper_Neck', m.createCylinder(0.04, 0.06, 0.15, 8, 0, 1.45, 0), matBrass);
  m.addPart('Secondary_Plate', m.createCylinder(0.14, 0.08, 0.04, 12, 0, 1.54, 0), matBrass);

  // 5. Crowning Annam (Swan / Sacred Hamsa) Finial
  m.addPart('Annam_Body', m.createSphere(0.07, 6, 8, 0, 1.62, 0), matBrass);
  m.addPart('Annam_Neck', m.createCylinder(0.03, 0.04, 0.12, 6, 0, 1.70, 0.03), matBrass);
  m.addPart('Annam_Crest', m.createCone(0.04, 0.10, 6, 0, 1.80, 0), matBrass);

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Temple/temple_lamp.glb',
    'unity/Assets/_Project/Art/Models/Props/temple/kuthu_vilakku.glb',
    'unity/Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb',
    'assets/props/temple/kuthu_vilakku.glb'
  ]);
}

// ============================================================================
// 4. MANICURED TEA HEDGEROW (vs Wild Forest Fern)
// ============================================================================
function buildTeaHedge() {
  const m = new ModelCompiler('Nilgiri_Manicured_Tea_Hedgerow');
  const matLeaf = m.addMaterial('M_Tea_Leaves_Camellia', [0.14, 0.42, 0.12, 1.0], 0.48, 0.0);
  const matFlush = m.addMaterial('M_Tea_Golden_Flush', [0.22, 0.58, 0.16, 1.0], 0.40, 0.0);
  const matWood = m.addMaterial('M_Tea_Stem_Trunk', [0.32, 0.22, 0.16, 1.0], 0.85, 0.0);

  // Woody gnarled lower stems visible at ground level
  [-1.0, 0, 1.0].forEach((ox, i) => {
    m.addPart(`Trunk_${i}`, m.createCylinder(0.08, 0.12, 0.45, 6, ox, 0.22, 0), matWood);
    m.addPart(`Branch_L_${i}`, m.createCylinder(0.05, 0.06, 0.35, 6, ox - 0.15, 0.40, 0.1), matWood);
    m.addPart(`Branch_R_${i}`, m.createCylinder(0.05, 0.06, 0.35, 6, ox + 0.15, 0.40, -0.1), matWood);
  });

  // Dense lower bush body (Width 1.3m, Length 3.2m)
  m.addPart('Lower_Canopy_Block', m.createBox(3.2, 0.45, 1.3, 0, 0.55, 0), matLeaf);
  // Rounded contoured mid canopy tier
  m.addPart('Mid_Canopy_Contour', m.createBox(3.0, 0.35, 1.15, 0, 0.82, 0), matLeaf);
  // Flat-topped manicured plucking table with tender golden green flush
  m.addPart('Plucking_Table_Flush', m.createBox(2.8, 0.18, 1.0, 0, 1.02, 0), matFlush);

  // Undulating bush clumps along the row
  [-0.9, 0, 0.9].forEach((cx, idx) => {
    m.addPart(`Flush_Crown_${idx}`, m.createSphere(0.42, 6, 8, cx, 0.98, (idx % 2 === 0 ? 0.08 : -0.08)), matFlush);
  });

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Vegetation/tea_bush.glb',
    'unity/Assets/_Project/Art/Models/Vegetation/bushes/tea_hedge.glb',
    'unity/Assets/_Project/Art/Models/Vegetation/tea/tea_rows.glb',
    'assets/vegetation/bushes/tea_hedge.glb'
  ]);
}

// ============================================================================
// 5. MAMALLAPURAM CARVED STONE BAS-RELIEF (vs Raw Granite Boulder)
// ============================================================================
function buildMamallapuramRelief() {
  const m = new ModelCompiler('Mamallapuram_Arjunas_Penance_Relief');
  const matGranite = m.addMaterial('M_Mamallapuram_Relief_Granite', [0.58, 0.52, 0.45, 1.0], 0.82, 0.04);
  const matCarving = m.addMaterial('M_Pallava_BasRelief_Carving', [0.50, 0.45, 0.38, 1.0], 0.75, 0.06);

  // Coastal bedrock foundation plinth
  m.addPart('Bedrock_Plinth', m.createBox(5.6, 0.6, 2.2, 0, 0.3, 0), matGranite);

  // Massive vertical carved granite monolith cliff (Width 5.0m, Height 3.6m, Depth 1.4m)
  m.addPart('Left_Cliff_Face', m.createBox(2.3, 3.6, 1.4, -1.25, 2.2, 0), matGranite);
  m.addPart('Right_Cliff_Face', m.createBox(2.3, 3.6, 1.4, 1.25, 2.2, 0), matGranite);

  // Central vertical cleft / fissure (Sacred River Ganges descent channel)
  m.addPart('River_Cleft_Recess', m.createBox(0.4, 3.4, 0.6, 0, 2.3, 0.4), matCarving);
  // Carved Naga/Serpent spirits in the cleft
  [1.2, 2.0, 2.8].forEach((ny, i) => {
    m.addPart(`Naga_Relief_${i}`, m.createSphere(0.18, 6, 8, 0, ny, 0.65), matCarving);
  });

  // Left Panel: Majestic Elephant Family Relief
  m.addPart('Elephant_Body_Relief', m.createBox(1.6, 1.4, 0.3, -1.4, 1.6, 0.75), matCarving);
  m.addPart('Elephant_Head', m.createSphere(0.45, 6, 8, -2.1, 1.9, 0.75), matCarving);
  m.addPart('Elephant_Trunk', m.createCylinder(0.10, 0.16, 0.8, 6, -2.3, 1.4, 0.75), matCarving);
  m.addPart('Elephant_Tusk', m.createCone(0.06, 0.4, 6, -2.1, 1.6, 0.9), matGranite);
  // Baby calf elephant
  m.addPart('Baby_Elephant_Relief', m.createBox(0.8, 0.7, 0.25, -0.6, 1.0, 0.75), matCarving);

  // Right Panel: Standing Ascetic (Arjuna / Bhagiratha Tapas yoga posture)
  m.addPart('Ascetic_Torso', m.createBox(0.4, 0.8, 0.25, 1.2, 2.6, 0.75), matCarving);
  m.addPart('Ascetic_Raised_Arms', m.createBox(0.5, 0.4, 0.2, 1.2, 3.1, 0.75), matCarving);
  m.addPart('Ascetic_Head', m.createSphere(0.16, 6, 8, 1.2, 2.9, 0.75), matCarving);

  // Right Panel: Miniature Draupadi/Pallava Shrine Carving
  m.addPart('Mini_Shrine_Niche', m.createBox(1.0, 1.4, 0.25, 1.6, 1.4, 0.75), matCarving);
  m.addPart('Mini_Shrine_Roof', m.createPyramid(1.2, 0.5, 0.5, 1.6, 2.3, 0.75), matGranite);

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Mamallapuram/stone_sculpted.glb',
    'unity/Assets/_Project/Art/Models/Props/craft/stone_sculpture.glb',
    'assets/props/craft/stone_sculpture.glb'
  ]);
}

// ============================================================================
// 6. GRANITE TEMPLE EPIGRAPH STELE / KALVETTU (vs Wooden Sign Post)
// ============================================================================
function buildTempleStele() {
  const m = new ModelCompiler('Chola_Granite_Temple_Kalvettu');
  const matStele = m.addMaterial('M_Granite_Kalvettu_Epigraph', [0.35, 0.33, 0.31, 1.0], 0.62, 0.08);
  const matPlinth = m.addMaterial('M_Rough_Chiseled_Plinth', [0.42, 0.39, 0.36, 1.0], 0.85, 0.04);
  const matIncised = m.addMaterial('M_Incised_Tamil_Brahmi', [0.24, 0.22, 0.20, 1.0], 0.50, 0.05);

  // Sturdy chiseled socket plinth base set in the courtyard
  m.addPart('Plinth_Base', m.createBox(1.6, 0.4, 0.9, 0, 0.2, 0), matPlinth);
  m.addPart('Plinth_Socket_Lip', m.createBox(1.3, 0.15, 0.55, 0, 0.45, 0), matPlinth);

  // Upright rectangular granite stele slab (Width 1.1m, Height 1.8m, Thickness 0.25m)
  m.addPart('Stele_Body_Slab', m.createBox(1.1, 1.8, 0.24, 0, 1.4, 0), matStele);

  // Rounded arched top crest
  m.addPart('Arched_Top_Crest', m.createCylinder(0.55, 0.55, 0.24, 16, 0, 2.3, 0), matStele);

  // Royal Chola Tiger Crest emblem relief at apex
  m.addPart('Royal_Emblem_Disk', m.createCylinder(0.20, 0.20, 0.08, 12, 0, 2.25, 0.12), matIncised);

  // 12 Chiseled horizontal inscription bands representing Tamil-Brahmi & Grantha charters
  for (let i = 0; i < 12; i++) {
    const y = 0.65 + i * 0.12;
    m.addPart(`Inscription_Line_${i}`, m.createBox(0.92, 0.03, 0.02, 0, y, 0.125), matIncised);
  }

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Temple/temple_stele.glb',
    'unity/Assets/_Project/Art/Models/Props/temple/stone_inscription.glb',
    'assets/props/temple/stone_inscription.glb'
  ]);
}

// ============================================================================
// 7. SACRED TEMPLE BRASS KALASAM (vs Domestic Terracotta Pot)
// ============================================================================
function buildTempleKalasam() {
  const m = new ModelCompiler('Sacred_Temple_Vimana_Kalasam');
  const matKalasam = m.addMaterial('M_Temple_Kalasam_GoldBrass', [0.88, 0.72, 0.22, 1.0], 0.22, 0.90);
  const matLotus = m.addMaterial('M_Lotus_Pedestal_Copper', [0.82, 0.58, 0.20, 1.0], 0.35, 0.75);

  // Multi-tiered stepped circular lotus pedestal (Padma Peedam)
  m.addPart('Lotus_Plinth_0', m.createCylinder(0.55, 0.60, 0.10, 16, 0, 0.05, 0), matLotus);
  m.addPart('Lotus_Plinth_1', m.createCylinder(0.45, 0.55, 0.12, 16, 0, 0.16, 0), matLotus);
  m.addPart('Lotus_Petals', m.createCylinder(0.32, 0.45, 0.15, 16, 0, 0.28, 0), matLotus);

  // Lower Kumbha pot base flange
  m.addPart('Kumbha_Base_Ring', m.createCylinder(0.25, 0.32, 0.10, 16, 0, 0.40, 0), matKalasam);

  // Swelling bulbous vessel belly (Kumbha pot)
  m.addPart('Kumbha_Lower_Belly', m.createCylinder(0.48, 0.25, 0.35, 16, 0, 0.62, 0), matKalasam);
  m.addPart('Kumbha_Mid_Rib', m.createCylinder(0.50, 0.48, 0.08, 16, 0, 0.82, 0), matKalasam);
  m.addPart('Kumbha_Upper_Belly', m.createCylinder(0.26, 0.50, 0.35, 16, 0, 1.02, 0), matKalasam);

  // Tapering vessel neck with flanged rim
  m.addPart('Vessel_Neck', m.createCylinder(0.18, 0.26, 0.22, 16, 0, 1.28, 0), matKalasam);
  m.addPart('Neck_Flange_Lip', m.createCylinder(0.28, 0.18, 0.08, 16, 0, 1.42, 0), matKalasam);

  // Superstructure spire: Conical needle finial (Koor)
  m.addPart('Spire_Cone_Lower', m.createCylinder(0.10, 0.24, 0.30, 12, 0, 1.60, 0), matKalasam);
  m.addPart('Spire_Pinnacle_Tip', m.createCone(0.10, 0.45, 10, 0, 1.95, 0), matKalasam);

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Temple/temple_urn.glb',
    'unity/Assets/_Project/Art/Models/Props/temple/temple_urn.glb',
    'assets/props/temple/temple_urn.glb'
  ]);
}

// ============================================================================
// 8. INTERLOCKING GRANITE TEMPLE ASHLAR WALL (vs Clay Brick Wall)
// ============================================================================
function buildInterlockingGraniteWall() {
  const m = new ModelCompiler('Dravidian_Interlocking_Ashlar_Granite_Wall');
  const matGranite = m.addMaterial('M_Granite_Ashlar_Masonry', [0.48, 0.45, 0.42, 1.0], 0.85, 0.02);
  const matCap = m.addMaterial('M_Granite_Coping_Kapota', [0.52, 0.49, 0.46, 1.0], 0.75, 0.04);
  const matJoint = m.addMaterial('M_Chiseled_Recessed_Joint', [0.28, 0.26, 0.24, 1.0], 0.90, 0.0);

  // Projected foundation plinth course (Adhisthana)
  m.addPart('Plinth_Adhisthana', m.createBox(6.4, 0.45, 1.3, 0, 0.225, 0), matGranite);

  // Course 1: Staggered massive granite blocks (Height 0.65m)
  m.addPart('Course1_BlockA', m.createBox(2.1, 0.65, 1.0, -1.95, 0.775, 0), matGranite);
  m.addPart('Course1_BlockB', m.createBox(2.1, 0.65, 1.0, 0.15, 0.775, 0), matGranite);
  m.addPart('Course1_BlockC', m.createBox(1.8, 0.65, 1.0, 2.1, 0.775, 0), matGranite);

  // Course 2: Alternating interlocking blocks (Height 0.65m)
  m.addPart('Course2_BlockA', m.createBox(1.5, 0.65, 1.0, -2.25, 1.425, 0), matGranite);
  m.addPart('Course2_BlockB', m.createBox(2.4, 0.65, 1.0, -0.3, 1.425, 0), matGranite);
  m.addPart('Course2_BlockC', m.createBox(2.1, 0.65, 1.0, 1.95, 1.425, 0), matGranite);

  // Course 3: Massive center bonding blocks (Height 0.65m)
  m.addPart('Course3_BlockA', m.createBox(2.2, 0.65, 1.0, -1.9, 2.075, 0), matGranite);
  m.addPart('Course3_BlockB', m.createBox(1.9, 0.65, 1.0, 0.15, 2.075, 0), matGranite);
  m.addPart('Course3_BlockC', m.createBox(1.9, 0.65, 1.0, 2.05, 2.075, 0), matGranite);

  // Projecting chiseled horizontal joint lines between courses
  m.addPart('Joint_Line_1', m.createBox(6.1, 0.03, 1.04, 0, 1.10, 0), matJoint);
  m.addPart('Joint_Line_2', m.createBox(6.1, 0.03, 1.04, 0, 1.75, 0), matJoint);

  // Heavy projecting Dravidian coping capstone (Kapota) with water-drip lip
  m.addPart('Coping_Molding', m.createBox(6.5, 0.25, 1.25, 0, 2.525, 0), matCap);
  m.addPart('Coping_Top_Ridge', m.createBox(6.3, 0.20, 1.05, 0, 2.75, 0), matCap);

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Temple/temple_wall.glb',
    'unity/Assets/_Project/Art/Models/Props/agriculture/stone_wall.glb',
    'unity/Assets/_Project/Art/Models/Props/temple/temple_wall.glb',
    'assets/props/temple/temple_wall.glb'
  ]);
}

// ============================================================================
// 9. SACRED STEPPED THEERTHAM WATER TANK / KALYANI (vs Agricultural Well)
// ============================================================================
function buildSteppedTheerthamTank() {
  const m = new ModelCompiler('Sacred_Temple_Theertham_Kalyani');
  const matGranite = m.addMaterial('M_Theertham_Granite_Padi', [0.44, 0.42, 0.40, 1.0], 0.78, 0.05);
  const matWater = m.addMaterial('M_Sacred_Theertham_Water', [0.18, 0.42, 0.38, 0.85], 0.08, 0.15);
  const matParapet = m.addMaterial('M_Temple_Parapet_Stone', [0.50, 0.47, 0.43, 1.0], 0.75, 0.05);

  // Outer dimension: 14m x 14m square tank
  // Perimeter raised parapet wall (height 0.8m, thickness 0.6m) with entrance openings
  m.addPart('Parapet_North', m.createBox(14.0, 0.8, 0.6, 0, 0.4, 6.7), matParapet);
  m.addPart('Parapet_South', m.createBox(14.0, 0.8, 0.6, 0, 0.4, -6.7), matParapet);
  m.addPart('Parapet_West', m.createBox(0.6, 0.8, 12.8, -6.7, 0.4, 0), matParapet);
  m.addPart('Parapet_East', m.createBox(0.6, 0.8, 12.8, 6.7, 0.4, 0), matParapet);

  // 4 Corner stone lamp pillars
  [[-6.7, -6.7], [6.7, -6.7], [-6.7, 6.7], [6.7, 6.7]].forEach(([px, pz], i) => {
    m.addPart(`Corner_Pillar_${i}`, m.createBox(0.8, 1.4, 0.8, px, 0.7, pz), matParapet);
    m.addPart(`Corner_Cap_${i}`, m.createPyramid(1.0, 1.0, 0.4, px, 1.6, pz), matGranite);
  });

  // Top perimeter walkable landing promenade (Depth 1.2m around rim)
  m.addPart('Upper_Promenade_N', m.createBox(12.8, 0.2, 1.2, 0, -0.1, 5.8), matGranite);
  m.addPart('Upper_Promenade_S', m.createBox(12.8, 0.2, 1.2, 0, -0.1, -5.8), matGranite);
  m.addPart('Upper_Promenade_W', m.createBox(1.2, 0.2, 10.4, -5.8, -0.1, 0), matGranite);
  m.addPart('Upper_Promenade_E', m.createBox(1.2, 0.2, 10.4, 5.8, -0.1, 0), matGranite);

  // Tier 1 Descending Granite Steps (Padi Thurai)
  m.addPart('Step_Tier1_N', m.createBox(10.4, 0.5, 0.9, 0, -0.45, 4.75), matGranite);
  m.addPart('Step_Tier1_S', m.createBox(10.4, 0.5, 0.9, 0, -0.45, -4.75), matGranite);
  m.addPart('Step_Tier1_W', m.createBox(0.9, 0.5, 8.6, -4.75, -0.45, 0), matGranite);
  m.addPart('Step_Tier1_E', m.createBox(0.9, 0.5, 8.6, 4.75, -0.45, 0), matGranite);

  // Tier 2 Descending Granite Steps
  m.addPart('Step_Tier2_N', m.createBox(8.6, 0.5, 0.9, 0, -0.95, 3.85), matGranite);
  m.addPart('Step_Tier2_S', m.createBox(8.6, 0.5, 0.9, 0, -0.95, -3.85), matGranite);
  m.addPart('Step_Tier2_W', m.createBox(0.9, 0.5, 6.8, -3.85, -0.95, 0), matGranite);
  m.addPart('Step_Tier2_E', m.createBox(0.9, 0.5, 6.8, 3.85, -0.95, 0), matGranite);

  // Tier 3 Descending Granite Steps
  m.addPart('Step_Tier3_N', m.createBox(6.8, 0.5, 0.9, 0, -1.45, 2.95), matGranite);
  m.addPart('Step_Tier3_S', m.createBox(6.8, 0.5, 0.9, 0, -1.45, -2.95), matGranite);
  m.addPart('Step_Tier3_W', m.createBox(0.9, 0.5, 5.0, -2.95, -1.45, 0), matGranite);
  m.addPart('Step_Tier3_E', m.createBox(0.9, 0.5, 5.0, 2.95, -1.45, 0), matGranite);

  // Tier 4 Deep Water Step
  m.addPart('Step_Tier4_N', m.createBox(5.0, 0.5, 0.9, 0, -1.95, 2.05), matGranite);
  m.addPart('Step_Tier4_S', m.createBox(5.0, 0.5, 0.9, 0, -1.95, -2.05), matGranite);
  m.addPart('Step_Tier4_W', m.createBox(0.9, 0.5, 3.2, -2.05, -1.95, 0), matGranite);
  m.addPart('Step_Tier4_E', m.createBox(0.9, 0.5, 3.2, 2.05, -1.95, 0), matGranite);

  // Submerged Tank Floor Basin
  m.addPart('Tank_Submerged_Floor', m.createBox(5.0, 0.3, 5.0, 0, -2.35, 0), matGranite);

  // Sacred Reflective Water Surface Plane (at Y = -1.5m)
  m.addPart('Sacred_Theertham_Water_Plane', m.createBox(6.4, 0.05, 6.4, 0, -1.5, 0), matWater);

  m.saveGLB([
    'unity/Assets/_Project/Art/Models/Temple/temple_well.glb',
    'unity/Assets/_Project/Art/Models/Props/temple/temple_well.glb',
    'assets/props/temple/temple_well.glb'
  ]);
}

// ============================================================================
// MAIN COMPILATION ENTRY POINT
// ============================================================================
function runEnvironmentCompilations() {
  console.log('================================================================');
  console.log('COMPILING 9 AUTHENTIC 3D ENVIRONMENT QUALITY GAP MODELS (.glb)...');
  console.log('================================================================\n');

  console.log('1. Building Toda Mund Hut (Barrel-vaulted bamboo & dry-stone)...');
  buildTodaMundHut();

  console.log('\n2. Building Dravidian Temple Torana Gateway (Chola granite & carvings)...');
  buildDravidianTempleGate();

  console.log('\n3. Building Traditional Brass Kuthuvilakku (Flared diya with 5 wicks)...');
  buildKuthuVilakku();

  console.log('\n4. Building Manicured Nilgiri Tea Hedgerow (Camellia Sinensis plucking table)...');
  buildTeaHedge();

  console.log('\n5. Building Mamallapuram Bas-Relief Monolith (Arjuna\'s Penance cliff)...');
  buildMamallapuramRelief();

  console.log('\n6. Building Granite Temple Epigraph Stele (Chola Kalvettu with charters)...');
  buildTempleStele();

  console.log('\n7. Building Sacred Temple Brass Kalasam (Panchaloha vimana finial)...');
  buildTempleKalasam();

  console.log('\n8. Building Interlocking Granite Temple Ashlar Wall (Coursed masonry)...');
  buildInterlockingGraniteWall();

  console.log('\n9. Building Sacred Stepped Theertham Water Tank (Kalyani with steps)...');
  buildSteppedTheerthamTank();

  console.log('\n✓ All 9 Environment Models compiled with authentic geometries and PBR materials.');
}

runEnvironmentCompilations();
