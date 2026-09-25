/**
 * The Whispering Wilds - Collision Proxy System
 * Provides lightweight collision proxies (capsule, box, sphere, terrain, water, trigger).
 * Decouples expensive render meshes from gameplay collision.
 * Integrated with GameState for authoritative position tracking.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CollisionProxy = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Shape Types ────────────────────────────────────────────────────────────
  const ProxyShape = Object.freeze({
    CAPSULE:  'capsule',
    BOX:      'box',
    SPHERE:   'sphere',
    CONVEX:   'convex',
    TERRAIN:  'terrain',
    WATER:    'water',
    TRIGGER:  'trigger'
  });

  // ─── Base Proxy ──────────────────────────────────────────────────────────────
  class CollisionProxy {
    /**
     * @param {string} id  - Unique identifier
     * @param {string} shape - ProxyShape value
     * @param {number} layer - CollisionLayers bit
     * @param {Object} [options]
     */
    constructor(id, shape, layer, options = {}) {
      this.id       = id;
      this.shape    = shape;
      this.layer    = layer;
      this.active   = true;
      this.position = { x: 0, y: 0, z: 0 };
      this.rotation = { x: 0, y: 0, z: 0 };  // Euler radians
      this._meta    = options.meta || {};
    }

    setPosition(x, y, z) {
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;
    }

    setActive(flag) { this.active = !!flag; }
    isActive() { return this.active; }

    /** Abstract: returns an axis-aligned bounding box {min, max} in world space */
    getAABB() { return null; }

    /** Abstract: returns true if point {x,y,z} is inside this proxy */
    containsPoint(/*px, py, pz*/) { return false; }
  }

  // ─── Capsule (player / NPC) ──────────────────────────────────────────────────
  class CapsuleProxy extends CollisionProxy {
    /**
     * @param {string} id
     * @param {number} layer
     * @param {number} radius  - Horizontal radius
     * @param {number} height  - Total height (cylinder + 2 hemispheres)
     * @param {Object} [opts]
     */
    constructor(id, layer, radius, height, opts = {}) {
      super(id, ProxyShape.CAPSULE, layer, opts);
      this.radius = radius;
      this.height = height;  // Total capsule height
      this.stepHeight  = opts.stepHeight  ?? 0.35; // Max climbable step
      this.slopeLimit  = opts.slopeLimit  ?? 45;   // Max walkable slope degrees
      this.crouching   = false;
      this._crouchScale = 0.6; // Crouching reduces height to 60%
    }

    get effectiveHeight() {
      return this.crouching ? this.height * this._crouchScale : this.height;
    }

    getAABB() {
      const r = this.radius;
      const h = this.effectiveHeight;
      return {
        min: { x: this.position.x - r, y: this.position.y,     z: this.position.z - r },
        max: { x: this.position.x + r, y: this.position.y + h, z: this.position.z + r }
      };
    }

    containsPoint(px, py, pz) {
      const dx = px - this.position.x;
      const dz = pz - this.position.z;
      if (dx * dx + dz * dz > this.radius * this.radius) return false;
      const h = this.effectiveHeight;
      return py >= this.position.y && py <= this.position.y + h;
    }

    setCrouching(flag) { this.crouching = !!flag; }
  }

  // ─── Box ─────────────────────────────────────────────────────────────────────
  class BoxProxy extends CollisionProxy {
    constructor(id, layer, halfExtents, opts = {}) {
      super(id, ProxyShape.BOX, layer, opts);
      this.halfExtents = halfExtents; // { x, y, z }
    }

    getAABB() {
      const { x: hx, y: hy, z: hz } = this.halfExtents;
      return {
        min: { x: this.position.x - hx, y: this.position.y - hy, z: this.position.z - hz },
        max: { x: this.position.x + hx, y: this.position.y + hy, z: this.position.z + hz }
      };
    }

    containsPoint(px, py, pz) {
      const { x: hx, y: hy, z: hz } = this.halfExtents;
      return Math.abs(px - this.position.x) <= hx &&
             Math.abs(py - this.position.y) <= hy &&
             Math.abs(pz - this.position.z) <= hz;
    }
  }

  // ─── Sphere ──────────────────────────────────────────────────────────────────
  class SphereProxy extends CollisionProxy {
    constructor(id, layer, radius, opts = {}) {
      super(id, ProxyShape.SPHERE, layer, opts);
      this.radius = radius;
    }

    getAABB() {
      const r = this.radius;
      return {
        min: { x: this.position.x - r, y: this.position.y - r, z: this.position.z - r },
        max: { x: this.position.x + r, y: this.position.y + r, z: this.position.z + r }
      };
    }

    containsPoint(px, py, pz) {
      const dx = px - this.position.x;
      const dy = py - this.position.y;
      const dz = pz - this.position.z;
      return (dx * dx + dy * dy + dz * dz) <= (this.radius * this.radius);
    }
  }

  // ─── Trigger Volume (AABB-based) ─────────────────────────────────────────────
  class TriggerProxy extends BoxProxy {
    constructor(id, halfExtents, opts = {}) {
      super(id, 0x0080 /* TRIGGER */, halfExtents, opts);
      this.shape       = ProxyShape.TRIGGER;
      this.onEnter     = opts.onEnter || null;
      this.onExit      = opts.onExit  || null;
      this._inside     = new Set();
    }

    checkAgent(agentId, px, py, pz) {
      const inside = this.containsPoint(px, py, pz);
      const wasInside = this._inside.has(agentId);
      if (inside && !wasInside) {
        this._inside.add(agentId);
        if (typeof this.onEnter === 'function') this.onEnter(agentId);
      } else if (!inside && wasInside) {
        this._inside.delete(agentId);
        if (typeof this.onExit === 'function') this.onExit(agentId);
      }
    }

    clearAgent(agentId) { this._inside.delete(agentId); }
  }

  // ─── Water Boundary ──────────────────────────────────────────────────────────
  class WaterProxy extends CollisionProxy {
    /**
     * @param {string} id
     * @param {Object} bounds  { minX, maxX, minZ, maxZ }
     * @param {number} surfaceY - Water surface world-Y
     * @param {string} type   - 'shallow'|'deep'|'swimmable'|'boat_only'|'unsafe'
     * @param {Object} [opts]
     */
    constructor(id, bounds, surfaceY, type, opts = {}) {
      super(id, ProxyShape.WATER, 0x0100 /* WATER */, opts);
      this.bounds   = bounds;    // { minX, maxX, minZ, maxZ }
      this.surfaceY = surfaceY;
      this.type     = type;
      this.depth    = opts.depth ?? 2.0;
    }

    containsPoint(px, py, pz) {
      return px >= this.bounds.minX && px <= this.bounds.maxX &&
             pz >= this.bounds.minZ && pz <= this.bounds.maxZ &&
             py <= this.surfaceY && py >= (this.surfaceY - this.depth);
    }

    isBoatNavigable() { return this.type === 'boat_only' || this.type === 'swimmable' || this.type === 'deep'; }
    isSwimmable()     { return this.type === 'swimmable'; }
    isShallow()       { return this.type === 'shallow'; }
    isUnsafe()        { return this.type === 'unsafe'; }
  }

  // ─── Proxy Registry ──────────────────────────────────────────────────────────
  class CollisionProxyRegistry {
    constructor() {
      this._proxies = new Map();
    }

    /** Register a proxy. Returns the proxy. */
    register(proxy) {
      if (!(proxy instanceof CollisionProxy)) throw new TypeError('Must be a CollisionProxy');
      if (this._proxies.has(proxy.id)) {
        console.warn(`[CollisionProxy] Overwriting existing proxy '${proxy.id}'`);
      }
      this._proxies.set(proxy.id, proxy);
      return proxy;
    }

    get(id) { return this._proxies.get(id) || null; }

    remove(id) { this._proxies.delete(id); }

    /** Returns all active proxies that match the layer mask */
    queryByLayer(layerMask) {
      const results = [];
      for (const proxy of this._proxies.values()) {
        if (proxy.active && (proxy.layer & layerMask)) results.push(proxy);
      }
      return results;
    }

    /** Returns all active proxies whose AABB overlaps the query AABB */
    queryAABBOverlap(queryMin, queryMax, layerMask = 0xFFFF) {
      const results = [];
      for (const proxy of this._proxies.values()) {
        if (!proxy.active) continue;
        if (!(proxy.layer & layerMask)) continue;
        const aabb = proxy.getAABB();
        if (!aabb) continue;
        if (aabb.max.x < queryMin.x || aabb.min.x > queryMax.x) continue;
        if (aabb.max.y < queryMin.y || aabb.min.y > queryMax.y) continue;
        if (aabb.max.z < queryMin.z || aabb.min.z > queryMax.z) continue;
        results.push(proxy);
      }
      return results;
    }

    clear() { this._proxies.clear(); }

    get size() { return this._proxies.size; }
  }

  return {
    ProxyShape,
    CollisionProxy,
    CapsuleProxy,
    BoxProxy,
    SphereProxy,
    TriggerProxy,
    WaterProxy,
    CollisionProxyRegistry
  };
});
