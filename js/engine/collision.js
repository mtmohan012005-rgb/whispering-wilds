/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Production World Collision Engine (WorldCollision)
 * High-performance spatial hashing of lightweight collision primitives (AABB boxes,
 * vertical cylinders, oriented barriers, and trigger volumes).
 * Prevents walking through locked doors, walls, rocks, and illegal water boundaries.
 */

class WorldCollision {
  constructor(cellSize = 25.0) {
    this.cellSize = cellSize;
    this.colliders = new Map(); // id -> collider definition
    this.spatialHash = new Map(); // 'cellX,cellZ' -> Set(colliderId)
    this.activeTriggers = new Map();
  }

  _hashKey(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  _getIntersectingCells(box) {
    const minCx = Math.floor(box.minX / this.cellSize);
    const maxCx = Math.floor(box.maxX / this.cellSize);
    const minCz = Math.floor(box.minZ / this.cellSize);
    const maxCz = Math.floor(box.maxZ / this.cellSize);

    const cells = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        cells.push(`${cx},${cz}`);
      }
    }
    return cells;
  }

  /**
   * Registers a collision proxy
   * @param {Object} config - { id, type: 'box'|'cylinder'|'water_boundary', enabled: true, ... }
   */
  registerCollider(config) {
    if (!config || !config.id) return;
    this.removeCollider(config.id);

    const collider = {
      id: config.id,
      type: config.type || 'box',
      category: config.category || 'solid', // 'solid' | 'door' | 'gate' | 'barrier' | 'water_bound' | 'climb_surface'
      enabled: config.enabled !== undefined ? config.enabled : true,
      data: config
    };

    // Compute bounding box for spatial hash
    let bbox = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    if (collider.type === 'box') {
      const halfW = (config.width || 2) * 0.5;
      const halfD = (config.depth || 2) * 0.5;
      bbox.minX = config.x - halfW;
      bbox.maxX = config.x + halfW;
      bbox.minZ = config.z - halfD;
      bbox.maxZ = config.z + halfD;
    } else if (collider.type === 'cylinder') {
      const r = config.radius || 1.0;
      bbox.minX = config.x - r;
      bbox.maxX = config.x + r;
      bbox.minZ = config.z - r;
      bbox.maxZ = config.z + r;
    } else if (collider.type === 'boundary') {
      bbox = { ...config.bounds };
    }

    collider.bbox = bbox;
    collider.cells = this._getIntersectingCells(bbox);

    this.colliders.set(collider.id, collider);

    for (const cell of collider.cells) {
      if (!this.spatialHash.has(cell)) {
        this.spatialHash.set(cell, new Set());
      }
      this.spatialHash.get(cell).add(collider.id);
    }

    return collider;
  }

  removeCollider(id) {
    const col = this.colliders.get(id);
    if (!col) return;
    for (const cell of col.cells) {
      const set = this.spatialHash.get(cell);
      if (set) {
        set.delete(id);
        if (set.size === 0) this.spatialHash.delete(cell);
      }
    }
    this.colliders.delete(id);
  }

  setColliderEnabled(id, enabled) {
    const col = this.colliders.get(id);
    if (col) {
      col.enabled = !!enabled;
    }
  }

  /**
   * Resolves horizontal circle collision against nearby active colliders
   * Returns corrected { x, z, collided, hitColliderId }
   */
  resolveCircle(currX, currZ, targetX, targetZ, radius = 0.65) {
    let resolvedX = targetX;
    let resolvedZ = targetZ;
    let anyCollision = false;
    let hitId = null;

    // Determine cells overlapping movement footprint
    const minX = Math.min(currX, targetX) - radius;
    const maxX = Math.max(currX, targetX) + radius;
    const minZ = Math.min(currZ, targetZ) - radius;
    const maxZ = Math.max(currZ, targetZ) + radius;

    const nearbyIds = new Set();
    const cells = this._getIntersectingCells({ minX, maxX, minZ, maxZ });
    for (const cell of cells) {
      const set = this.spatialHash.get(cell);
      if (set) {
        for (const id of set) nearbyIds.add(id);
      }
    }

    // Resolve up to 3 iterative collision passes for smooth corner sliding
    for (let iter = 0; iter < 3; iter++) {
      let movedThisPass = false;

      for (const id of nearbyIds) {
        const col = this.colliders.get(id);
        if (!col || !col.enabled) continue;

        if (col.type === 'box') {
          const cfg = col.data;
          const halfW = (cfg.width || 2) * 0.5;
          const halfD = (cfg.depth || 2) * 0.5;
          const bMinX = cfg.x - halfW;
          const bMaxX = cfg.x + halfW;
          const bMinZ = cfg.z - halfD;
          const bMaxZ = cfg.z + halfD;

          // Closest point on box to circle center
          const closestX = Math.max(bMinX, Math.min(resolvedX, bMaxX));
          const closestZ = Math.max(bMinZ, Math.min(resolvedZ, bMaxZ));

          const diffX = resolvedX - closestX;
          const diffZ = resolvedZ - closestZ;
          const distSq = diffX * diffX + diffZ * diffZ;

          if (distSq < radius * radius) {
            anyCollision = true;
            hitId = id;
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const penetration = radius - dist;
              resolvedX += (diffX / dist) * penetration;
              resolvedZ += (diffZ / dist) * penetration;
            } else {
              // Deep inside, push outward along minimum distance axis
              const dLeft = Math.abs(resolvedX - bMinX);
              const dRight = Math.abs(resolvedX - bMaxX);
              const dTop = Math.abs(resolvedZ - bMinZ);
              const dBottom = Math.abs(resolvedZ - bMaxZ);
              const minD = Math.min(dLeft, dRight, dTop, dBottom);
              if (minD === dLeft) resolvedX = bMinX - radius;
              else if (minD === dRight) resolvedX = bMaxX + radius;
              else if (minD === dTop) resolvedZ = bMinZ - radius;
              else resolvedZ = bMaxZ + radius;
            }
            movedThisPass = true;
          }
        } else if (col.type === 'cylinder') {
          const cfg = col.data;
          const r = cfg.radius || 1.0;
          const totalR = radius + r;
          const dx = resolvedX - cfg.x;
          const dz = resolvedZ - cfg.z;
          const distSq = dx * dx + dz * dz;

          if (distSq < totalR * totalR) {
            anyCollision = true;
            hitId = id;
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const penetration = totalR - dist;
              resolvedX += (dx / dist) * penetration;
              resolvedZ += (dz / dist) * penetration;
            } else {
              resolvedX += totalR;
            }
            movedThisPass = true;
          }
        }
      }

      if (!movedThisPass) break;
    }

    return {
      x: resolvedX,
      z: resolvedZ,
      collided: anyCollision,
      hitColliderId: hitId
    };
  }

  /**
   * Fast line-of-sight raycast against solid colliders
   */
  hasLineOfSight(startX, startZ, endX, endZ) {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return true;

    const steps = Math.ceil(dist / 1.5);
    const stepX = dx / steps;
    const stepZ = dz / steps;

    for (let i = 1; i < steps; i++) {
      const cx = startX + stepX * i;
      const cz = startZ + stepZ * i;
      const res = this.resolveCircle(cx, cz, cx, cz, 0.2);
      if (res.collided) {
        return false;
      }
    }
    return true;
  }
}

window.WorldCollision = WorldCollision;
