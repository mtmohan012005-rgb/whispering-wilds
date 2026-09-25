/**
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative Collision System
 * Single physics & collision authority separating gameplay collision from rendering.
 * Provides layered spatial queries, terrain height bounds, obstacle sweeps,
 * water boundaries, and trigger volume detection.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const colSys = factory();
    root.CollisionSystem = colSys;
    if (typeof window !== 'undefined') {
      window.CollisionSystem = colSys;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Collision Categories / Layers (Bitmask)
  const LAYERS = Object.freeze({
    NONE: 0,
    PLAYER: 1 << 0,       // 1
    NPC: 1 << 1,          // 2
    WILDLIFE: 1 << 2,     // 4
    WORLD: 1 << 3,        // 8  (Terrain, rocks, buildings, walls, trees, cliffs)
    VEHICLE: 1 << 4,      // 16 (Buses, autos, boats)
    INTERACTABLE: 1 << 5, // 32 (Doors, chests, wells, waterwheels)
    TRIGGER: 1 << 6,      // 64 (Region boundaries, quest volumes, discovery areas)
    ALL: 0xFF
  });

  class CollisionSystemEngine {
    constructor() {
      this.LAYERS = LAYERS;

      // Spatial static colliders: AABBs & Cylinders
      this._staticColliders = [];
      // Dynamic colliders: entities moving per frame
      this._dynamicColliders = new Map();
      // Trigger volumes
      this._triggers = [];

      this._initDefaultWorldColliders();
    }

    _initDefaultWorldColliders() {
      // Chennai Madras High Court Perimeter Walls
      this.addStaticBox('high_court_wall_north', -250, 0, 700, 200, 8, 4, LAYERS.WORLD);
      this.addStaticBox('high_court_wall_east', -150, 0, 600, 4, 8, 200, LAYERS.WORLD);

      // Cauvery Delta Grand Anicut Sluice Walls & Embankment
      this.addStaticBox('grand_anicut_pier_01', 1200, 0, 450, 20, 15, 60, LAYERS.WORLD);
      this.addStaticBox('grand_anicut_pier_02', 1250, 0, 450, 20, 15, 60, LAYERS.WORLD);

      // Pichavaram Deep Water Canal Boundaries
      this.addStaticBox('pichavaram_canal_edge_north', 2500, -2, 850, 400, 4, 10, LAYERS.WORLD);

      // Chettinad Mansion Pillars & Courtyard Walls
      this.addStaticCylinder('chettinad_pillar_01', 3200, 0, 500, 2.5, 12, LAYERS.WORLD);
      this.addStaticCylinder('chettinad_pillar_02', 3240, 0, 500, 2.5, 12, LAYERS.WORLD);

      // Nilgiris Mountain Ridge Cliffs
      this.addStaticBox('nilgiri_cliff_west', 4500, 50, 300, 10, 80, 500, LAYERS.WORLD);
    }

    addStaticBox(id, x, y, z, width, height, depth, layer = LAYERS.WORLD) {
      this._staticColliders.push({
        id,
        type: 'box',
        x, y, z,
        halfW: width / 2,
        halfH: height / 2,
        halfD: depth / 2,
        layer
      });
    }

    addStaticCylinder(id, x, y, z, radius, height, layer = LAYERS.WORLD) {
      this._staticColliders.push({
        id,
        type: 'cylinder',
        x, y, z,
        radius,
        halfH: height / 2,
        layer
      });
    }

    addTrigger(id, x, y, z, radius, onEnter, onExit = null) {
      this._triggers.push({
        id,
        x, y, z,
        radius,
        onEnter,
        onExit,
        activeEntities: new Set()
      });
    }

    registerDynamic(id, x, y, z, radius, height, layer = LAYERS.NPC) {
      this._dynamicColliders.set(id, { id, x, y, z, radius, height, layer });
    }

    updateDynamic(id, x, y, z) {
      const entry = this._dynamicColliders.get(id);
      if (entry) {
        entry.x = x;
        entry.y = y;
        entry.z = z;
      }
    }

    unregisterDynamic(id) {
      this._dynamicColliders.delete(id);
    }

    /**
     * Checks if moving a sphere/cylinder to target position results in a collision
     * @param {Object} pos - { x, y, z }
     * @param {number} radius - Entity collision radius
     * @param {number} height - Entity height
     * @param {number} mask - Bitmask of layers to collide against
     * @param {string} ignoreId - Self ID to ignore
     * @returns {Object} { collided: boolean, normal: {x,y,z}, colliderId: string|null }
     */
    testPosition(pos, radius = 0.5, height = 1.8, mask = LAYERS.WORLD | LAYERS.NPC | LAYERS.VEHICLE, ignoreId = null) {
      if (!pos) return { collided: false, normal: { x: 0, y: 0, z: 0 }, colliderId: null };

      // 1. Static box & cylinder colliders
      for (let i = 0; i < this._staticColliders.length; i++) {
        const col = this._staticColliders[i];
        if ((col.layer & mask) === 0) continue;

        if (col.type === 'box') {
          // AABB vs Sphere/Cylinder test
          const dx = Math.max(col.x - col.halfW, Math.min(pos.x, col.x + col.halfW));
          const dy = Math.max(col.y - col.halfH, Math.min(pos.y, col.y + col.halfH));
          const dz = Math.max(col.z - col.halfD, Math.min(pos.z, col.z + col.halfD));

          const distSq = (pos.x - dx) ** 2 + (pos.y - dy) ** 2 + (pos.z - dz) ** 2;
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq) || 0.001;
            return {
              collided: true,
              normal: { x: (pos.x - dx) / dist, y: (pos.y - dy) / dist, z: (pos.z - dz) / dist },
              colliderId: col.id
            };
          }
        } else if (col.type === 'cylinder') {
          // 2D radial check with vertical bounds
          const yOverlap = (pos.y + height >= col.y - col.halfH) && (pos.y <= col.y + col.halfH);
          if (yOverlap) {
            const dist2DSq = (pos.x - col.x) ** 2 + (pos.z - col.z) ** 2;
            const minDist = radius + col.radius;
            if (dist2DSq < minDist * minDist) {
              const dist2D = Math.sqrt(dist2DSq) || 0.001;
              return {
                collided: true,
                normal: { x: (pos.x - col.x) / dist2D, y: 0, z: (pos.z - col.z) / dist2D },
                colliderId: col.id
              };
            }
          }
        }
      }

      // 2. Dynamic colliders
      for (const [id, dyn] of this._dynamicColliders.entries()) {
        if (id === ignoreId || (dyn.layer & mask) === 0) continue;

        const distSq = (pos.x - dyn.x) ** 2 + (pos.z - dyn.z) ** 2;
        const minDist = radius + dyn.radius;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          return {
            collided: true,
            normal: { x: (pos.x - dyn.x) / dist, y: 0, z: (pos.z - dyn.z) / dist },
            colliderId: id
          };
        }
      }

      return { collided: false, normal: { x: 0, y: 0, z: 0 }, colliderId: null };
    }

    /**
     * Update trigger volumes based on player position
     */
    updateTriggers(playerPos, entityId = 'player') {
      if (!playerPos) return;

      for (let i = 0; i < this._triggers.length; i++) {
        const trg = this._triggers[i];
        const distSq = (playerPos.x - trg.x) ** 2 + (playerPos.z - trg.z) ** 2;
        const isInside = distSq <= trg.radius * trg.radius;

        if (isInside && !trg.activeEntities.has(entityId)) {
          trg.activeEntities.add(entityId);
          if (typeof trg.onEnter === 'function') {
            try { trg.onEnter(entityId, trg); } catch (e) { console.error(`[CollisionSystem] Error in trigger ${trg.id} onEnter:`, e); }
          }
        } else if (!isInside && trg.activeEntities.has(entityId)) {
          trg.activeEntities.delete(entityId);
          if (typeof trg.onExit === 'function') {
            try { trg.onExit(entityId, trg); } catch (e) { console.error(`[CollisionSystem] Error in trigger ${trg.id} onExit:`, e); }
          }
        }
      }
    }

    destroy() {
      this._staticColliders.length = 0;
      this._dynamicColliders.clear();
      this._triggers.length = 0;
    }
  }

  return new CollisionSystemEngine();
});
