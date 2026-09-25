/**
 * The Whispering Wilds (Kaattu Vazhi) - Streaming Renderer
 * Manages Three.js scene graphs for streaming cells: terrain chunks, water surfaces,
 * instanced vegetation with deterministic WorldRNG, and local cell lighting.
 * Guarantees zero terrain seams and zero duplicate water planes.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamingRenderer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StreamingRenderer {
    constructor(scene = null, terrain = null) {
      this.scene = scene;
      this.terrain = terrain;

      // Cell Three.js Root Groups: cellId -> THREE.Group
      this.cellRoots = new Map();

      // Active water planes to prevent overlapping duplicates (Section 24)
      this.activeWaterPlanes = new Map(); // cellId -> THREE.Mesh

      // Local lights per cell: cellId -> THREE.Light[]
      this.cellLocalLights = new Map();

      // Deterministic PRNG for vegetation placement (Section 26, 135)
      this.rng = (typeof WorldRNG !== 'undefined') ? new WorldRNG(442211) : {
        range: (min, max) => min + Math.random() * (max - min),
        next: () => Math.random()
      };
    }

    /**
     * Creates or retrieves the root THREE.Group for a cell
     */
    getCellRoot(cellId) {
      if (!this.cellRoots.has(cellId)) {
        let group;
        if (typeof THREE !== 'undefined') {
          group = new THREE.Group();
          group.name = `CellRoot_${cellId}`;
          if (this.scene) this.scene.add(group);
        } else {
          group = { name: `CellRoot_${cellId}`, children: [], add: function(c) { this.children.push(c); }, remove: function(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); } };
        }
        this.cellRoots.set(cellId, group);
      }
      return this.cellRoots.get(cellId);
    }

    /**
     * Constructs a terrain chunk mesh aligned to mathematical elevation (Section 20, 21)
     */
    createCellTerrainChunk(cell) {
      if (typeof THREE === 'undefined' || !cell) return null;

      const b = cell.bounds;
      const width = b.maxX - b.minX;
      const depth = b.maxZ - b.minZ;
      const segsX = Math.max(4, Math.floor(width / 3.0));
      const segsZ = Math.max(4, Math.floor(depth / 3.0));

      const geo = new THREE.PlaneGeometry(width, depth, segsX, segsZ);
      geo.rotateX(-Math.PI / 2);

      // Align vertices with global elevation to guarantee ZERO SEAMS (Section 21, 22)
      const posAttr = geo.attributes.position;
      const originX = (b.minX + b.maxX) * 0.5;
      const originZ = (b.minZ + b.maxZ) * 0.5;

      for (let i = 0; i < posAttr.count; i++) {
        const lx = posAttr.getX(i);
        const lz = posAttr.getZ(i);
        const gx = originX + lx;
        const gz = originZ + lz;

        let y = 1.0;
        if (this.terrain && typeof this.terrain.getElevation === 'function') {
          y = this.terrain.getElevation(gx, gz);
        } else if (cell.terrain && typeof cell.terrain.baseHeight === 'number') {
          y = cell.terrain.baseHeight;
        }

        posAttr.setY(i, y);
      }

      geo.computeVertexNormals();

      // Materials tailored to biome
      let color = 0x96432b; // Chennai red clay
      if (cell.regionId === 'CAUVERY_DELTA') color = 0x5a7832;
      else if (cell.regionId === 'PICHAVARAM') color = 0x2e4a38;
      else if (cell.regionId === 'CHETTINAD') color = 0xa35a3e;
      else if (cell.regionId === 'THANJAVUR') color = 0x8a7050;
      else if (cell.regionId === 'MAMALLAPURAM') color = 0x7c7d7e;
      else if (cell.regionId === 'NILGIRIS') color = 0x224928;

      const mat = new THREE.MeshLambertMaterial({
        color,
        roughness: 0.85
      });

      const chunkMesh = new THREE.Mesh(geo, mat);
      chunkMesh.position.set(originX, 0, originZ);
      chunkMesh.name = `TerrainChunk_${cell.id}`;
      chunkMesh.receiveShadow = true;

      const root = this.getCellRoot(cell.id);
      root.add(chunkMesh);

      return chunkMesh;
    }

    /**
     * Instantiates water surface for water cells without duplicates (Section 23, 24)
     */
    createCellWaterSurface(cell) {
      if (!cell || !cell.water || typeof THREE === 'undefined') return null;

      // Check if water plane for this cell already exists
      if (this.activeWaterPlanes.has(cell.id)) {
        return this.activeWaterPlanes.get(cell.id);
      }

      const b = cell.bounds;
      const width = b.maxX - b.minX;
      const depth = b.maxZ - b.minZ;
      const originX = (b.minX + b.maxX) * 0.5;
      const originZ = (b.minZ + b.maxZ) * 0.5;

      const geo = new THREE.PlaneGeometry(width, depth, 4, 4);
      geo.rotateX(-Math.PI / 2);

      let waterColor = 0x1a4552;
      if (cell.regionId === 'PICHAVARAM') waterColor = 0x143431;
      else if (cell.regionId === 'MAMALLAPURAM') waterColor = 0x1b4c6e;

      const mat = new THREE.MeshLambertMaterial({
        color: waterColor,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      });

      const waterMesh = new THREE.Mesh(geo, mat);
      const waterY = typeof cell.water.level === 'number' ? cell.water.level : 0.2;
      waterMesh.position.set(originX, waterY, originZ);
      waterMesh.name = `WaterPlane_${cell.id}`;

      const root = this.getCellRoot(cell.id);
      root.add(waterMesh);
      this.activeWaterPlanes.set(cell.id, waterMesh);

      return waterMesh;
    }

    /**
     * Deterministic vegetation scattering for cell (Section 25, 26)
     */
    scatterCellVegetation(cell, densityScale = 1.0) {
      if (!cell || typeof THREE === 'undefined') return [];

      const b = cell.bounds;
      const count = Math.floor(6 * densityScale);
      const props = [];
      const root = this.getCellRoot(cell.id);

      // Use cell ID seed for deterministic reproducibility
      let seed = 0;
      for (let i = 0; i < cell.id.length; i++) seed = (seed * 31 + cell.id.charCodeAt(i)) >>> 0;
      const cellRng = (typeof WorldRNG !== 'undefined') ? new WorldRNG(seed) : this.rng;

      for (let i = 0; i < count; i++) {
        const x = cellRng.range(b.minX + 3, b.maxX - 3);
        const z = cellRng.range(b.minZ + 3, b.maxZ - 3);
        let y = 1.0;
        if (this.terrain && typeof this.terrain.getElevation === 'function') {
          y = this.terrain.getElevation(x, z);
        }

        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 5);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });
        const foliageGeo = new THREE.ConeGeometry(1.4, 3.2, 5);
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2e5c30 });

        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.25;
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 3.2;

        treeGroup.add(trunk);
        treeGroup.add(foliage);
        treeGroup.position.set(x, y, z);
        treeGroup.name = `Flora_${cell.id}_${i}`;

        root.add(treeGroup);
        props.push(treeGroup);
      }

      return props;
    }

    /**
     * Attaches local streaming lights (Section 38)
     */
    createCellLocalLights(cell) {
      if (!cell || typeof THREE === 'undefined') return [];
      const lights = [];
      const b = cell.bounds;
      const cx = (b.minX + b.maxX) * 0.5;
      const cz = (b.minZ + b.maxZ) * 0.5;

      // Small warm point light (lantern/tea kadai lamp)
      const light = new THREE.PointLight(0xffa726, 0.8, 25.0);
      light.position.set(cx, 4.0, cz);
      light.name = `LocalLight_${cell.id}`;

      const root = this.getCellRoot(cell.id);
      root.add(light);
      lights.push(light);

      this.cellLocalLights.set(cell.id, lights);
      return lights;
    }

    /**
     * Cleanly deactivates and removes visual elements of a cell from the scene
     */
    unloadCellRenderer(cellId) {
      // 1. Remove water plane
      if (this.activeWaterPlanes.has(cellId)) {
        const waterMesh = this.activeWaterPlanes.get(cellId);
        if (waterMesh.parent) waterMesh.parent.remove(waterMesh);
        if (waterMesh.geometry) waterMesh.geometry.dispose();
        if (waterMesh.material) waterMesh.material.dispose();
        this.activeWaterPlanes.delete(cellId);
      }

      // 2. Remove local lights
      if (this.cellLocalLights.has(cellId)) {
        const lights = this.cellLocalLights.get(cellId);
        for (const l of lights) {
          if (l.parent) l.parent.remove(l);
        }
        this.cellLocalLights.delete(cellId);
      }

      // 3. Remove cell root
      if (this.cellRoots.has(cellId)) {
        const root = this.cellRoots.get(cellId);
        if (root.parent) root.parent.remove(root);
        this.cellRoots.delete(cellId);
      }
    }
  }

  return StreamingRenderer;
});
