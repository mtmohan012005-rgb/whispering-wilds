/**
 * The Whispering Wilds (Kaattu Vazhi) - Production World Asset Manager
 * Handles local GLTF asset registration, deterministic placement, region streaming,
 * 3-tier distance LOD, instanced vegetation, and lightweight collision resolution.
 *
 * Target: PC 60 FPS
 * Strict Rule: Never pretend placeholder meshes are final; log missing local assets explicitly.
 */

class ProductionWorldAssets {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // Loader
    this.gltfLoader = (typeof THREE !== 'undefined' && THREE.GLTFLoader) ? new THREE.GLTFLoader() : null;

    // Registries
    this.registry = new Map();         // assetId -> { id, url, region, category, collider, interactable, etc. }
    this.loadedAssets = new Map();     // assetId -> THREE.Object3D (template)
    this.activeInstances = new Set();  // Set of all spawned THREE.Object3D
    this.missingAssets = new Map();    // assetId -> { region, expectedPath }
    this.colliders = [];               // Registered collision obstacles

    // Streaming regions
    this.REGION_LOAD_DISTANCE = 110.0;
    this.REGION_UNLOAD_DISTANCE = 180.0;
    this.loadedRegions = new Set();
    this.regionInstances = new Map();  // regionName -> Set of instances

    // Region definitions & center coordinates along Tamil Nadu east-west gradient
    this.regionCenters = {
      chennai:       { x: -235, z: 0 },
      mamallapuram:  { x: -135, z: 10 },
      pichavaram:    { x: -65,  z: 0 },
      cauvery_delta: { x: 5,    z: 0 },
      thanjavur:     { x: 75,   z: -10 },
      chettinad:     { x: 145,  z: 0 },
      nilgiris:      { x: 240,  z: 15 }
    };

    // PRNG for deterministic placement
    this.rng = (typeof WorldRNG !== 'undefined') ? new WorldRNG(421337) : null;

    // Instanced Foliage Meshes
    this.instancedFoliage = new Map();

    // Auto-register assets from WORLD_ASSET_METADATA if available
    this.initDefaultRegistry();

    // Shared collision resolver scratchpad
    this._tempVec = (typeof THREE !== 'undefined') ? new THREE.Vector3() : null;
  }

  /**
   * Initializes asset registry from WORLD_ASSETS and WORLD_ASSET_METADATA
   */
  initDefaultRegistry() {
    if (typeof WORLD_ASSET_METADATA !== 'undefined') {
      for (const [id, meta] of Object.entries(WORLD_ASSET_METADATA)) {
        this.registerAsset(id, meta.path, meta);
      }
    }
  }

  /**
   * Register asset metadata and expected local path
   */
  registerAsset(id, url, options = {}) {
    // Validation: enforce local asset path constraint
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      console.error(`[ProductionWorldAssets] SECURITY VIOLATION: External URLs are forbidden: ${url}`);
      return;
    }

    this.registry.set(id, {
      id,
      url,
      region: options.region || 'chennai',
      category: options.category || 'props',
      collider: options.collider || null,
      interactable: !!options.interactable,
      interactionType: options.interactionType || null,
      interactionPrompt: options.interactionPrompt || null,
      isFictionalWriting: !!options.isFictionalWriting,
      lod: options.lod || { lod0: 25, lod1: 70, lod2: 150 },
      isHeroLandmark: !!options.isHeroLandmark
    });
  }

  /**
   * Loads a local GLTF asset by ID.
   * If missing, logs standard missing-asset warning without crashing.
   * @param {string} id
   * @returns {Promise<THREE.Object3D|null>}
   */
  async loadAsset(id) {
    if (this.loadedAssets.has(id)) {
      return this.loadedAssets.get(id);
    }

    const meta = this.registry.get(id);
    if (!meta) {
      console.warn(`[ProductionWorldAssets] Unknown asset ID: ${id}`);
      return null;
    }

    const url = meta.url;

    // Production Missing Asset Rule Contract:
    // Check local availability via fetch HEAD or GET
    let assetExists = false;
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          assetExists = true;
        }
      }
    } catch (e) {
      assetExists = false;
    }

    if (!assetExists || !this.gltfLoader) {
      // Mandatory Contract Output:
      console.warn(`[ProductionWorldAssets] Missing: ${url}`);
      console.warn(`[WORLD ASSET MISSING]\nRegion: ${meta.region}\nAsset: ${id}\nExpected:\n${url}`);
      this.missingAssets.set(id, { region: meta.region, expected: url });
      return null;
    }

    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene || gltf.scenes[0];
          model.userData.assetId = id;
          model.userData.isProductionAsset = true;
          this.loadedAssets.set(id, model);
          resolve(model);
        },
        undefined,
        (err) => {
          console.warn(`[ProductionWorldAssets] Missing: ${url}`);
          console.warn(`[WORLD ASSET MISSING]\nRegion: ${meta.region}\nAsset: ${id}\nExpected:\n${url}`);
          this.missingAssets.set(id, { region: meta.region, expected: url });
          resolve(null);
        }
      );
    });
  }

  /**
   * Batch load asset IDs
   * @param {string[]} ids
   */
  async loadAssets(ids) {
    const promises = ids.map(id => this.loadAsset(id));
    return Promise.all(promises);
  }

  /**
   * Instantiate an asset into the world with LOD, collision, and interaction metadata
   * @param {string} id
   * @param {THREE.Vector3|Object} position
   * @param {THREE.Euler|Object} rotation
   * @param {THREE.Vector3|Object|number} scale
   * @param {Object} options
   * @returns {THREE.Object3D}
   */
  instantiate(id, position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }, scale = 1, options = {}) {
    const meta = this.registry.get(id) || {
      id,
      region: options.region || 'chennai',
      collider: options.collider || null,
      interactable: !!options.interactable,
      interactionType: options.interactionType || null,
      lod: { lod0: 25, lod1: 70, lod2: 150 }
    };

    const group = new THREE.Group();
    group.name = `instance_${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const posX = position.x || 0;
    const posY = (position.y !== undefined) ? position.y : (this.terrain ? this.terrain.getElevation(posX, position.z || 0) : 0);
    const posZ = position.z || 0;
    group.position.set(posX, posY, posZ);

    if (rotation) {
      group.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    }

    if (typeof scale === 'number') {
      group.scale.set(scale, scale, scale);
    } else if (scale) {
      group.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
    }

    // Attach LOD manager
    const lod = new ProductionLOD({
      lod0: meta.lod ? meta.lod.lod0 : 25,
      lod1: meta.lod ? meta.lod.lod1 : 70,
      lod2: meta.lod ? meta.lod.lod2 : 150,
      isHeroLandmark: meta.isHeroLandmark
    });
    group.userData.lod = lod;
    group.userData.assetId = id;
    group.userData.region = meta.region;

    // Interaction flags per Section 18
    if (meta.interactable) {
      group.userData.interactable = true;
      group.userData.interactionType = meta.interactionType;
      group.userData.interactionPrompt = meta.interactionPrompt;
      group.userData.isFictionalWriting = meta.isFictionalWriting;
    }

    // If real production model is already loaded, clone it
    if (this.loadedAssets.has(id)) {
      const template = this.loadedAssets.get(id);
      const clone = template.clone(true);
      clone.userData.isProductionAsset = true;
      group.add(clone);
      group.userData.hasProductionMesh = true;
    } else {
      // Missing local asset: log notice per Section 21
      const expectedUrl = meta.url || `assets/architecture/${meta.region}/${id}.glb`;
      if (!this.missingAssets.has(id)) {
        console.warn(`[ProductionWorldAssets] Missing: ${expectedUrl}`);
        console.warn(`[WORLD ASSET MISSING]\nRegion: ${meta.region}\nAsset: ${id}\nExpected:\n${expectedUrl}`);
        this.missingAssets.set(id, { region: meta.region, expected: expectedUrl });
      }

      // Diagnostic proxy: Clean wireframe bounding marker (Does NOT pretend to be final production asset)
      const proxy = this.createDiagnosticProxy(meta);
      proxy.userData.isDiagnosticProxy = true;
      proxy.userData.isProductionAsset = false;
      group.add(proxy);
      group.userData.hasProductionMesh = false;
    }

    // Register simple collision geometry per Section 17
    if (meta.collider) {
      this.registerCollider(group, meta.collider);
    }

    this.scene.add(group);
    this.activeInstances.add(group);

    // Track in region map for distance streaming
    const reg = meta.region || 'chennai';
    if (!this.regionInstances.has(reg)) {
      this.regionInstances.set(reg, new Set());
    }
    this.regionInstances.get(reg).add(group);

    return group;
  }

  /**
   * Diagnostic placeholder proxy marked as non-final
   */
  createDiagnosticProxy(meta) {
    const size = (meta.collider && meta.collider.size) ? meta.collider.size : [2, 2, 2];
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff6b6b,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = size[1] / 2;
    mesh.userData.isMissingProductionAsset = true;
    return mesh;
  }

  /**
   * Register invisible collision geometry
   */
  registerCollider(group, colliderMeta) {
    const pos = group.position;
    const col = {
      id: group.name,
      group: group,
      type: colliderMeta.type || 'box',
      cx: pos.x,
      cz: pos.z
    };

    if (col.type === 'box') {
      const sx = (colliderMeta.size ? colliderMeta.size[0] : 2.0) * group.scale.x;
      const sz = (colliderMeta.size ? colliderMeta.size[2] : 2.0) * group.scale.z;
      const halfX = sx / 2.0;
      const halfZ = sz / 2.0;
      col.minX = pos.x - halfX;
      col.maxX = pos.x + halfX;
      col.minZ = pos.z - halfZ;
      col.maxZ = pos.z + halfZ;
      col.halfX = halfX;
      col.halfZ = halfZ;
    } else if (col.type === 'cylinder') {
      col.radius = (colliderMeta.radius || 1.0) * Math.max(group.scale.x, group.scale.z);
    }

    this.colliders.push(col);
    group.userData.collider = col;
  }

  /**
   * Circle-to-obstacle collision resolver for player and NPCs
   * @param {number} x - Target X position
   * @param {number} z - Target Z position
   * @param {number} radius - Entity collision radius
   * @returns {{ x: number, z: number, collided: boolean }}
   */
  resolveCollision(x, z, radius = 0.6) {
    let resolvedX = x;
    let resolvedZ = z;
    let collided = false;

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (!c.group.visible) continue; // Culled objects don't block

      if (c.type === 'box') {
        // Nearest point on AABB
        const nearestX = Math.max(c.minX, Math.min(resolvedX, c.maxX));
        const nearestZ = Math.max(c.minZ, Math.min(resolvedZ, c.maxZ));

        const dx = resolvedX - nearestX;
        const dz = resolvedZ - nearestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          collided = true;
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = radius - dist;
            resolvedX += (dx / dist) * push;
            resolvedZ += (dz / dist) * push;
          } else {
            // Center inside box: push out to closest edge
            const dLeft = Math.abs(resolvedX - c.minX);
            const dRight = Math.abs(c.maxX - resolvedX);
            const dTop = Math.abs(resolvedZ - c.minZ);
            const dBottom = Math.abs(c.maxZ - resolvedZ);
            const minEdge = Math.min(dLeft, dRight, dTop, dBottom);
            if (minEdge === dLeft) resolvedX = c.minX - radius;
            else if (minEdge === dRight) resolvedX = c.maxX + radius;
            else if (minEdge === dTop) resolvedZ = c.minZ - radius;
            else resolvedZ = c.maxZ + radius;
          }
        }
      } else if (c.type === 'cylinder') {
        const dx = resolvedX - c.cx;
        const dz = resolvedZ - c.cz;
        const distSq = dx * dx + dz * dz;
        const minDist = radius + c.radius;

        if (distSq < minDist * minDist) {
          collided = true;
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = minDist - dist;
            resolvedX += (dx / dist) * push;
            resolvedZ += (dz / dist) * push;
          } else {
            resolvedX += minDist;
          }
        }
      }
    }

    return { x: resolvedX, z: resolvedZ, collided };
  }

  /**
   * Preload a region and instantiate its registered environment & props deterministically
   */
  preloadRegion(region) {
    if (this.loadedRegions.has(region)) return;
    this.loadedRegions.add(region);

    const center = this.regionCenters[region];
    if (!center) return;

    // Deterministic seed per region
    const seed = (region.charCodeAt(0) * 1000) + (region.charCodeAt(1) || 50);
    const rng = new WorldRNG(seed);

    const regionAssets = (typeof WORLD_ASSETS !== 'undefined') ? WORLD_ASSETS[region] : null;
    if (!regionAssets) return;

    // 1. Buildings (Placed along main path or streets)
    if (regionAssets.buildings) {
      regionAssets.buildings.forEach((bldId, idx) => {
        const offsetX = (idx - 1.5) * 24.0 + rng.range(-4, 4);
        const offsetZ = ((idx % 2 === 0) ? -1 : 1) * rng.range(18, 32);
        const px = center.x + offsetX;
        const pz = center.z + offsetZ;
        const rotY = rng.range(-0.3, 0.3) + ((offsetZ > 0) ? Math.PI : 0);
        this.instantiate(bldId, { x: px, z: pz }, { x: 0, y: rotY, z: 0 });
      });
    }

    // 2. Props & Cultural Objects
    if (regionAssets.props) {
      regionAssets.props.forEach((propId, idx) => {
        const px = center.x + rng.range(-35, 35);
        const pz = center.z + rng.range(-28, 28);
        const rotY = rng.range(0, Math.PI * 2);
        this.instantiate(propId, { x: px, z: pz }, { x: 0, y: rotY, z: 0 });
      });
    }

    // 3. Vehicles
    if (regionAssets.vehicles) {
      regionAssets.vehicles.forEach((vehId, idx) => {
        const px = center.x + rng.range(-25, 25);
        const pz = center.z + rng.range(-15, 15);
        const rotY = rng.range(-0.2, 0.2);
        this.instantiate(vehId, { x: px, z: pz }, { x: 0, y: rotY, z: 0 });
      });
    }

    // 4. Environment Features
    if (regionAssets.environment) {
      regionAssets.environment.forEach((envId, idx) => {
        const px = center.x + rng.range(-40, 40);
        const pz = center.z + rng.range(-35, 35);
        this.instantiate(envId, { x: px, z: pz });
      });
    }
  }

  /**
   * Unload region to maintain 60 FPS performance on PC
   */
  unloadRegion(region) {
    if (!this.loadedRegions.has(region)) return;
    this.loadedRegions.delete(region);

    const instances = this.regionInstances.get(region);
    if (instances) {
      for (const inst of instances) {
        this.disposeInstance(inst);
      }
      instances.clear();
    }
  }

  /**
   * Removes an instance from scene and active sets
   */
  removeInstance(instance) {
    if (!instance) return;

    if (instance.userData && instance.userData.collider) {
      const idx = this.colliders.indexOf(instance.userData.collider);
      if (idx !== -1) this.colliders.splice(idx, 1);
    }

    this.activeInstances.delete(instance);
    if (instance.parent) {
      instance.parent.remove(instance);
    }
  }

  /**
   * Full memory disposal for geometries, materials, and textures
   */
  disposeInstance(instance) {
    if (!instance) return;

    this.removeInstance(instance);

    instance.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => this.disposeMaterial(m));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });
  }

  disposeMaterial(mat) {
    if (!mat) return;
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'lightMap'].forEach(mapName => {
      if (mat[mapName]) {
        mat[mapName].dispose();
      }
    });
    mat.dispose();
  }

  /**
   * Instanced Foliage Initializer (Section 11)
   * High-performance InstancedMesh for Palmyra, Coconut, Mangroves, Paddy, Banana, Tea, and Shola trees
   */
  initInstancedVegetation() {
    if (this.foliageInitialized || !this.scene || !this.terrain) return;
    this.foliageInitialized = true;

    const rng = new WorldRNG(771122);
    const dummy = new THREE.Object3D();

    // 1. Palmyra Trees across Chennai & plains (X: -290 to -110)
    this.createInstancedFoliageGroup('palmyra', 60, () => {
      const px = rng.range(-285, -115);
      const pz = rng.range(-90, 90);
      const py = this.terrain.getElevation(px, pz);
      const scale = rng.range(0.85, 1.25);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      return dummy.matrix;
    }, 0x3d2817, 0x243314);

    // 2. Pichavaram Mangrove clusters (X: -95 to +30)
    this.createInstancedFoliageGroup('mangrove', 80, () => {
      const px = rng.range(-90, 25);
      const pz = rng.range(-85, 85);
      const py = this.terrain.getElevation(px, pz);
      const scale = rng.range(0.8, 1.2);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      return dummy.matrix;
    }, 0x1f1912, 0x1b3b19);

    // 3. Cauvery Delta Paddy Rows (X: -25 to +40)
    this.createInstancedFoliageGroup('paddy', 140, () => {
      const px = rng.range(-22, 38);
      const pz = rng.range(-75, 75);
      const py = this.terrain.getElevation(px, pz);
      const scale = rng.range(0.7, 1.1);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, rng.range(0, 0.4), 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      return dummy.matrix;
    }, 0x4a7c28, 0x82c836);

    // 4. Nilgiris Tea Bushes (X: +130 to +280)
    this.createInstancedFoliageGroup('tea', 120, () => {
      const px = rng.range(135, 275);
      const pz = rng.range(-80, 80);
      const py = this.terrain.getElevation(px, pz);
      const scale = rng.range(0.75, 1.15);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      return dummy.matrix;
    }, 0x2b4c1e, 0x3d7e26);

    // 5. Nilgiris Shola Trees (X: +160 to +290)
    this.createInstancedFoliageGroup('shola', 50, () => {
      const px = rng.range(165, 285);
      const pz = rng.range(-85, 85);
      const py = this.terrain.getElevation(px, pz);
      const scale = rng.range(0.9, 1.4);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      return dummy.matrix;
    }, 0x2e2318, 0x172c15);
  }

  createInstancedFoliageGroup(name, count, matrixGenerator, trunkColor, foliageColor) {
    const geo = new THREE.ConeGeometry(1.4, 4.5, 6);
    geo.translate(0, 2.25, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: foliageColor,
      roughness: 0.85,
      metalness: 0.05
    });

    const instancedMesh = new THREE.InstancedMesh(geo, mat, count);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    for (let i = 0; i < count; i++) {
      const mat4 = matrixGenerator();
      instancedMesh.setMatrixAt(i, mat4);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    this.scene.add(instancedMesh);
    this.instancedFoliage.set(name, instancedMesh);
  }

  /**
   * Main per-frame update: handles streaming distance, LOD, and culling
   * @param {THREE.Vector3|Object} playerPos
   * @param {number} dt
   */
  update(playerPos, dt = 0.016) {
    if (!playerPos) return;

    const px = playerPos.x;
    const pz = playerPos.z;

    // 1. Region Streaming Check
    for (const [regionName, center] of Object.entries(this.regionCenters)) {
      const dx = px - center.x;
      const dz = pz - center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < this.REGION_LOAD_DISTANCE) {
        if (!this.loadedRegions.has(regionName)) {
          this.preloadRegion(regionName);
        }
      } else if (dist > this.REGION_UNLOAD_DISTANCE) {
        if (this.loadedRegions.has(regionName)) {
          this.unloadRegion(regionName);
        }
      }
    }

    // 2. Per-instance LOD & Culling Evaluation
    for (const inst of this.activeInstances) {
      const dx = inst.position.x - px;
      const dz = inst.position.z - pz;
      const distSq = dx * dx + dz * dz;

      if (inst.userData && inst.userData.lod) {
        inst.userData.lod.applyToObject(inst, distSq);
      } else {
        // Fallback culling
        inst.visible = distSq < (150 * 150);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.ProductionWorldAssets = ProductionWorldAssets;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProductionWorldAssets };
}
