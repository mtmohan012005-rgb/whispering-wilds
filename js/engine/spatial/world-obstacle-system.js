/**
 * The Whispering Wilds - World Obstacle System
 * Runtime obstacle registration: vehicles, festival stalls, boats on land,
 * fallen trees, debris, crowd gatherings, construction.
 * Integrates with NavMesh to cut navigable areas dynamically.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldObstacleSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ObstacleType = Object.freeze({
    VEHICLE:      'vehicle',
    FALLEN_TREE:  'fallen_tree',
    BOULDER:      'boulder',
    STALL:        'stall',
    BOAT:         'boat',
    CONSTRUCTION: 'construction',
    CROWD:        'crowd',
    DEBRIS:       'debris',
    GATE_CLOSED:  'gate_closed',
    FENCE:        'fence'
  });

  class WorldObstacle {
    constructor(id, type, bounds, options = {}) {
      this.id        = id;
      this.type      = type;
      this.bounds    = bounds;    // { minX, maxX, minZ, maxZ }
      this.blockNav  = options.blockNav  ?? true;   // Blocks NPC navigation
      this.blockMove = options.blockMove ?? true;   // Blocks player movement
      this.active    = true;
      this.expiry    = options.expiry ?? Infinity;  // Timestamp to auto-remove
    }
  }

  class WorldObstacleSystem {
    constructor() {
      this._obstacles  = new Map();
      this._navMesh    = null;
      this._proxyReg   = null;
      this._eventBus   = null;
    }

    init(navMesh, proxyRegistry, eventBus) {
      this._navMesh  = navMesh;
      this._proxyReg = proxyRegistry;
      this._eventBus = eventBus;
    }

    /**
     * Register a world obstacle.
     * @param {string} id
     * @param {string} type       - ObstacleType
     * @param {Object} bounds     - { minX, maxX, minZ, maxZ }
     * @param {Object} [options]
     */
    add(id, type, bounds, options = {}) {
      const obs = new WorldObstacle(id, type, bounds, options);
      this._obstacles.set(id, obs);

      // Add to NavMesh as exclusion zone
      if (obs.blockNav && this._navMesh) {
        this._navMesh.addObstacle(id, bounds, type);
      }

      // Add collision proxy for player blocking
      if (obs.blockMove && this._proxyReg) {
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cz = (bounds.minZ + bounds.maxZ) / 2;
        const hx = (bounds.maxX - bounds.minX) / 2;
        const hz = (bounds.maxZ - bounds.minZ) / 2;
        // Create a dynamic BoxProxy
        const BoxProxy = (typeof window !== 'undefined' && window.CollisionProxy?.BoxProxy) ||
                         null;
        if (BoxProxy) {
          const proxy = new BoxProxy(
            `obstacle_${id}`,
            0x0008 /* WORLD */,
            { x: hx, y: 1.5, z: hz }
          );
          proxy.setPosition(cx, 0, cz);
          this._proxyReg.register(proxy);
        }
      }

      if (this._eventBus) {
        this._eventBus.emit('OBSTACLE_ADDED', { id, type, bounds });
      }
    }

    remove(id) {
      const obs = this._obstacles.get(id);
      if (!obs) return;
      this._obstacles.delete(id);

      if (this._navMesh) this._navMesh.removeObstacle(id);
      if (this._proxyReg) this._proxyReg.remove(`obstacle_${id}`);

      if (this._eventBus) {
        this._eventBus.emit('OBSTACLE_REMOVED', { id });
      }
    }

    setActive(id, flag) {
      const obs = this._obstacles.get(id);
      if (!obs) return;
      obs.active = !!flag;
      const proxy = this._proxyReg?.get(`obstacle_${id}`);
      if (proxy) proxy.setActive(flag);
    }

    update(now = Date.now()) {
      // Remove expired obstacles
      for (const [id, obs] of this._obstacles) {
        if (now > obs.expiry) this.remove(id);
      }
    }

    isBlocked(x, z) {
      for (const obs of this._obstacles.values()) {
        if (!obs.active || !obs.blockMove) continue;
        const b = obs.bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
      }
      return false;
    }

    destroy() {
      for (const id of this._obstacles.keys()) this.remove(id);
      this._obstacles.clear();
    }
  }

  return { ObstacleType, WorldObstacle, WorldObstacleSystem };
});
