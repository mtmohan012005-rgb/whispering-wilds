/**
 * The Whispering Wilds (Kaattu Vazhi) - Instance Manager
 * Centralized GPU Instancing using THREE.InstancedMesh for repeated scenery:
 * palmyra palms, banyan foliage, granite boulders, roadside lamps, fence posts.
 * Utilizes WorldRNG for deterministic procedural placement across Tamil Nadu.
 */

class InstanceManager {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // Batches map: type -> { instancedMesh, count, maxCapacity, dummy }
    this.batches = new Map();
    this.dummy = new THREE.Object3D();
  }

  /**
   * Registers an instanced mesh batch for a repeated prop type
   */
  registerBatch(type, geometry, material, maxCount = 500) {
    if (this.batches.has(type)) {
      return this.batches.get(type).instancedMesh;
    }

    const instancedMesh = new THREE.InstancedMesh(geometry, material, maxCount);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    instancedMesh.frustumCulled = true;
    instancedMesh.count = 0; // Active visible instances

    this.scene.add(instancedMesh);
    this.batches.set(type, {
      instancedMesh,
      count: 0,
      maxCapacity: maxCount
    });

    return instancedMesh;
  }

  /**
   * Adds an instance with position, rotation, and scale
   */
  addInstance(type, position, rotation = { x: 0, y: 0, z: 0 }, scale = { x: 1, y: 1, z: 1 }) {
    const batch = this.batches.get(type);
    if (!batch || batch.count >= batch.maxCapacity) return -1;

    const idx = batch.count;
    this.dummy.position.set(position.x, position.y, position.z);
    this.dummy.rotation.set(rotation.x, rotation.y, rotation.z);
    this.dummy.scale.set(scale.x, scale.y, scale.z);
    this.dummy.updateMatrix();

    batch.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
    batch.count++;
    batch.instancedMesh.count = batch.count;
    batch.instancedMesh.instanceMatrix.needsUpdate = true;

    return idx;
  }

  createBatch(type, geometry, material, maxCount = 500) {
    const mesh = this.registerBatch(type, geometry, material, maxCount);
    mesh.count = maxCount;
    return mesh;
  }

  setInstanceTransform(type, idx, position, rotation = { x: 0, y: 0, z: 0 }, scale = { x: 1, y: 1, z: 1 }) {
    const batch = this.batches.get(type);
    if (!batch) return false;
    this.dummy.position.set(position.x || 0, position.y || 0, position.z || 0);
    this.dummy.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    this.dummy.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
    this.dummy.updateMatrix();
    batch.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
    batch.instancedMesh.instanceMatrix.needsUpdate = true;
    return true;
  }

  disposeBatch(type) {
    const batch = this.batches.get(type);
    if (!batch) return;
    if (batch.instancedMesh.parent) {
      batch.instancedMesh.parent.remove(batch.instancedMesh);
    }
    if (batch.instancedMesh.geometry) batch.instancedMesh.geometry.dispose();
    this.batches.delete(type);
  }

  /**
   * Clears all instances in a batch
   */
  clearBatch(type) {
    const batch = this.batches.get(type);
    if (batch) {
      batch.count = 0;
      batch.instancedMesh.count = 0;
      batch.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Disposes all batches
   */
  dispose() {
    this.batches.forEach(batch => {
      if (batch.instancedMesh.parent) {
        batch.instancedMesh.parent.remove(batch.instancedMesh);
      }
      if (batch.instancedMesh.geometry) batch.instancedMesh.geometry.dispose();
      if (batch.instancedMesh.material) {
        if (Array.isArray(batch.instancedMesh.material)) {
          batch.instancedMesh.material.forEach(m => m.dispose());
        } else {
          batch.instancedMesh.material.dispose();
        }
      }
    });
    this.batches.clear();
  }
}

if (typeof window !== 'undefined') {
  window.InstanceManager = InstanceManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InstanceManager };
}
