/**
 * The Whispering Wilds - Ground Detection System
 * Detects terrain, roads, stone, stairs, bridges, interior floors, rocks, platforms.
 * Tracks grounded state, ground normal, surface height, surface type and slope angle.
 * Feeds surface type into footsteps, movement speed, particles, audio, animation.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.GroundDetection = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Surface types used throughout all systems
  const SurfaceType = Object.freeze({
    UNKNOWN:    'unknown',
    ASPHALT:    'asphalt',
    CONCRETE:   'concrete',
    STONE:      'stone',
    GRANITE:    'granite',
    SAND:       'sand',
    SOIL:       'soil',
    MUD:        'mud',
    WET_SOIL:   'wet_soil',
    GRASS:      'grass',
    DEEP_GRASS: 'deep_grass',
    PADDY:      'paddy',
    WOOD:       'wood',
    METAL:      'metal',
    ROCK:       'rock',
    WATER:      'water',
    INDOOR:     'indoor',
    STAIRS:     'stairs',
    BRIDGE:     'bridge',
    ROAD:       'road'
  });

  // Surface properties: friction multiplier, movement multiplier, footstep audio key
  const SURFACE_PROPS = {
    [SurfaceType.ASPHALT]:    { friction: 1.0, moveSpeed: 1.0, audio: 'step_asphalt' },
    [SurfaceType.CONCRETE]:   { friction: 1.0, moveSpeed: 1.0, audio: 'step_concrete' },
    [SurfaceType.STONE]:      { friction: 0.9, moveSpeed: 1.0, audio: 'step_stone' },
    [SurfaceType.GRANITE]:    { friction: 0.9, moveSpeed: 0.95, audio: 'step_stone' },
    [SurfaceType.SAND]:       { friction: 0.7, moveSpeed: 0.85, audio: 'step_sand' },
    [SurfaceType.SOIL]:       { friction: 0.8, moveSpeed: 0.95, audio: 'step_soil' },
    [SurfaceType.MUD]:        { friction: 0.5, moveSpeed: 0.75, audio: 'step_mud' },
    [SurfaceType.WET_SOIL]:   { friction: 0.6, moveSpeed: 0.80, audio: 'step_mud' },
    [SurfaceType.GRASS]:      { friction: 0.85, moveSpeed: 0.95, audio: 'step_grass' },
    [SurfaceType.DEEP_GRASS]: { friction: 0.8, moveSpeed: 0.85, audio: 'step_grass' },
    [SurfaceType.PADDY]:      { friction: 0.6, moveSpeed: 0.80, audio: 'step_mud' },
    [SurfaceType.WOOD]:       { friction: 0.9, moveSpeed: 1.0,  audio: 'step_wood' },
    [SurfaceType.METAL]:      { friction: 0.8, moveSpeed: 0.95, audio: 'step_metal' },
    [SurfaceType.ROCK]:       { friction: 0.85, moveSpeed: 0.90, audio: 'step_rock' },
    [SurfaceType.WATER]:      { friction: 0.3, moveSpeed: 0.5,  audio: 'step_water' },
    [SurfaceType.INDOOR]:     { friction: 1.0, moveSpeed: 1.0,  audio: 'step_indoor' },
    [SurfaceType.STAIRS]:     { friction: 0.9, moveSpeed: 0.90, audio: 'step_stone' },
    [SurfaceType.BRIDGE]:     { friction: 0.9, moveSpeed: 0.95, audio: 'step_wood' },
    [SurfaceType.ROAD]:       { friction: 1.0, moveSpeed: 1.0,  audio: 'step_asphalt' },
    [SurfaceType.UNKNOWN]:    { friction: 1.0, moveSpeed: 1.0,  audio: 'step_soil' }
  };

  /**
   * Ground query result for a single cast.
   */
  class GroundHit {
    constructor() {
      this.hit         = false;
      this.point       = { x: 0, y: 0, z: 0 };
      this.normal      = { x: 0, y: 1, z: 0 };
      this.distance    = Infinity;
      this.surfaceType = SurfaceType.UNKNOWN;
      this.slope       = 0;          // degrees from horizontal
      this.proxyId     = null;
    }

    reset() {
      this.hit = false;
      this.distance = Infinity;
      this.surfaceType = SurfaceType.UNKNOWN;
      this.slope = 0;
      this.proxyId = null;
    }
  }

  /**
   * GroundDetector performs downward ray casts against registered ground proxies.
   * It is intentionally lightweight: real terrain height queries integrate with ThreeTerrain.
   */
  class GroundDetector {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.castLength=2.5]  - Max downward cast distance
     * @param {number} [opts.castRadius=0.2]  - Sphere-cast radius (for stair/edge tolerance)
     * @param {number} [opts.groundThreshold=0.08]  - Distance considered "grounded"
     * @param {number} [opts.stepHeight=0.35]  - Auto step-up height
     */
    constructor(opts = {}) {
      this._castLength      = opts.castLength      ?? 2.5;
      this._castRadius      = opts.castRadius      ?? 0.2;
      this._groundThreshold = opts.groundThreshold ?? 0.08;
      this._stepHeight      = opts.stepHeight      ?? 0.35;
      this._groundProxies   = [];  // { bounds, surfaceY, surfaceType, normal }
      this._lastHit         = new GroundHit();
      this._state = {
        grounded:    false,
        height:      0,
        normal:      { x: 0, y: 1, z: 0 },
        slope:       0,
        surfaceType: SurfaceType.UNKNOWN
      };
    }

    /**
     * Register a ground plane or terrain height source.
     * @param {{ id:string, boundsXZ:{minX,maxX,minZ,maxZ}, surfaceY:number, surfaceType:string, normal?:{x,y,z} }} info
     */
    addGroundPlane(info) {
      this._groundProxies.push({
        id: info.id,
        bounds: info.boundsXZ,
        surfaceY: info.surfaceY,
        surfaceType: info.surfaceType || SurfaceType.UNKNOWN,
        normal: info.normal || { x: 0, y: 1, z: 0 }
      });
    }

    removeGroundPlane(id) {
      this._groundProxies = this._groundProxies.filter(p => p.id !== id);
    }

    /**
     * Query ground beneath a world position.
     * Integrates with ThreeTerrain if available via window.ThreeTerrain.
     *
     * @param {number} px  - World X
     * @param {number} py  - Foot Y (capsule base)
     * @param {number} pz  - World Z
     * @returns {GroundHit}
     */
    query(px, py, pz) {
      const hit = this._lastHit;
      hit.reset();

      let bestY = -Infinity;

      // 1. Check registered ground planes
      for (const plane of this._groundProxies) {
        const b = plane.bounds;
        if (px < b.minX || px > b.maxX || pz < b.minZ || pz > b.maxZ) continue;
        const groundY = plane.surfaceY;
        if (groundY > py + this._castLength) continue;  // Too far below cast origin
        if (groundY > bestY) {
          bestY            = groundY;
          hit.hit          = true;
          hit.point        = { x: px, y: groundY, z: pz };
          hit.normal       = { ...plane.normal };
          hit.distance     = py - groundY;
          hit.surfaceType  = plane.surfaceType;
          hit.proxyId      = plane.id;
        }
      }

      // 2. Try ThreeTerrain height sample if available
      const terrain = (typeof window !== 'undefined' && window.ThreeTerrain) ||
                      (typeof globalThis !== 'undefined' && globalThis.ThreeTerrain);
      if (terrain && typeof terrain.getHeightAt === 'function') {
        try {
          const terrainY = terrain.getHeightAt(px, pz);
          if (typeof terrainY === 'number' && !isNaN(terrainY)) {
            if (terrainY > bestY && terrainY <= py + this._castLength) {
              bestY           = terrainY;
              hit.hit         = true;
              hit.point       = { x: px, y: terrainY, z: pz };
              hit.distance    = py - terrainY;
              hit.surfaceType = this._classifyTerrainSurface(terrain, px, pz);
              hit.proxyId     = 'terrain';
              // Approximate normal from terrain slope
              const nx = terrain.getHeightAt(px + 0.5, pz);
              const nz = terrain.getHeightAt(px, pz + 0.5);
              if (typeof nx === 'number' && typeof nz === 'number') {
                const dx = terrainY - nx;
                const dz = terrainY - nz;
                const len = Math.sqrt(dx * dx + 1 + dz * dz);
                hit.normal = { x: dx / len, y: 1 / len, z: dz / len };
              }
            }
          }
        } catch (_) {/* silent */ }
      }

      if (hit.hit) {
        // Calculate slope from normal
        const ny = Math.max(0, Math.min(1, hit.normal.y));
        hit.slope = Math.acos(ny) * (180 / Math.PI);

        // Update cached state
        this._state.grounded    = hit.distance <= this._groundThreshold;
        this._state.height      = hit.point.y;
        this._state.normal      = { ...hit.normal };
        this._state.slope       = hit.slope;
        this._state.surfaceType = hit.surfaceType;
      } else {
        this._state.grounded = false;
      }

      return hit;
    }

    /** Derive surface type from terrain metadata if available */
    _classifyTerrainSurface(terrain, px, pz) {
      if (typeof terrain.getSurfaceType === 'function') {
        return terrain.getSurfaceType(px, pz) || SurfaceType.SOIL;
      }
      return SurfaceType.SOIL;
    }

    isGrounded() { return this._state.grounded; }
    getGroundHeight() { return this._state.height; }
    getGroundNormal() { return this._state.normal; }
    getSlopeAngle()   { return this._state.slope; }
    getSurfaceType()  { return this._state.surfaceType; }

    /** Returns the movement and audio properties for the current surface */
    getSurfaceProps() {
      return SURFACE_PROPS[this._state.surfaceType] || SURFACE_PROPS[SurfaceType.UNKNOWN];
    }
  }

  return { SurfaceType, SURFACE_PROPS, GroundHit, GroundDetector };
});
