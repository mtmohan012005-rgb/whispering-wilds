/**
 * The Whispering Wilds - Spatial Debugger
 * DEVELOPER-ONLY: visualises collision shapes, navmesh, paths, ground rays, water bounds.
 * Automatically disabled in production builds (hostname !== localhost).
 * Integrates with Three.js scene when available.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SpatialDebugger = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  (window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1')) ||
                 (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');

  // Colour palette for visual categories
  const DEBUG_COLOURS = Object.freeze({
    COLLISION:    0xFF4444,
    NAVMESH:      0x44FF44,
    PATH:         0xFFFF00,
    GROUND_RAY:   0x44AAFF,
    WATER:        0x0066FF,
    CLIMBABLE:    0xFF8800,
    TRIGGER:      0xFF00FF,
    AGENT_RADIUS: 0xFFFFFF,
    SLOPE_NORMAL: 0xFF6666,
    VEHICLE_LANE: 0x00FFAA,
    BOAT_LANE:    0x0088FF,
    STUCK_AGENT:  0xFF0000,
    INTERACTION:  0xFFCC00
  });

  class SpatialDebugger {
    constructor() {
      this._enabled   = false;
      this._scene     = null;
      this._helpers   = new Map();   // key → Three.js helper object
      this._systems   = {};          // References to spatial systems
      this._updateHz  = 10;          // Refresh at 10 Hz
      this._lastUpdate = 0;
    }

    /** @param {Object} deps */
    init(deps) {
      if (!IS_DEV) return;  // Hard-disabled in production
      this._systems = {
        collision:   deps.collisionSystem,
        navMesh:     deps.navMesh,
        navigation:  deps.navigationSystem,
        pathfinding: deps.pathfinding,
        water:       deps.waterSystem,
        proxyReg:    deps.proxyRegistry,
        spatialQuery: deps.spatialQuery
      };
      this._scene = deps.scene || null;
      console.log('[SpatialDebugger] Initialized (DEV mode)');
    }

    enable()  { if (IS_DEV) { this._enabled = true;  this._rebuild(); } }
    disable() { this._enabled = false; this._clearAll(); }
    toggle()  { this._enabled ? this.disable() : this.enable(); }

    update(timestamp) {
      if (!IS_DEV || !this._enabled) return;
      if (timestamp - this._lastUpdate < 1000 / this._updateHz) return;
      this._lastUpdate = timestamp;
      this._rebuild();
    }

    // ─── Text Overlay (HUD) ──────────────────────────────────────────────────

    /**
     * Returns an object with debug info to display in the overlay panel.
     * Does not use Three.js — safe for HTML-based display.
     */
    getOverlayData() {
      if (!IS_DEV || !this._enabled) return null;

      const collision = this._systems.collision;
      const nav       = this._systems.navigation;
      const navMesh   = this._systems.navMesh;

      const playerGrounded = collision?.isGrounded('player') ?? '?';
      const playerWater    = collision?.isInWater('player')  ?? '?';
      const playerSlope    = collision?.getSlopeAngle('player')?.toFixed(1) ?? '?';
      const activeAgents   = nav?.agentCount ?? 0;
      const loadedTiles    = navMesh?.loadedTileCount ?? 0;
      const totalTiles     = navMesh?.totalTileCount ?? 0;

      return {
        collision: {
          grounded: playerGrounded,
          inWater: playerWater,
          slopeDeg: playerSlope
        },
        navigation: {
          activeAgents,
          tilesLoaded: `${loadedTiles}/${totalTiles}`,
          queuedPaths: this._systems.pathfinding?.queueLength ?? 0
        }
      };
    }

    // ─── Three.js Visual Helpers ─────────────────────────────────────────────

    _rebuild() {
      if (!this._scene) return;
      this._clearAll();
      this._drawNavMeshTiles();
      this._drawAgentPaths();
      this._drawCollisionProxies();
      this._drawWaterBounds();
    }

    _drawNavMeshTiles() {
      const navMesh = this._systems.navMesh;
      if (!navMesh) return;
      // In production Three.js integration, we'd create LineSegments for each tile bound.
      // Placeholder for integration with ThreeWorld scene.
    }

    _drawAgentPaths() {
      const nav = this._systems.navigation;
      if (!nav) return;
      // Draw agent paths as line segments in scene.
    }

    _drawCollisionProxies() {
      const reg = this._systems.proxyReg;
      if (!reg) return;
      // Draw proxy AABB outlines in scene.
    }

    _drawWaterBounds() {
      // Draw water zone boundaries.
    }

    _clearAll() {
      if (this._scene) {
        for (const helper of this._helpers.values()) {
          if (helper.parent) helper.parent.remove(helper);
          if (helper.geometry) helper.geometry.dispose();
          if (helper.material) helper.material.dispose();
        }
      }
      this._helpers.clear();
    }

    destroy() {
      this._clearAll();
      this._enabled = false;
    }
  }

  // Expose as a singleton only in dev
  return IS_DEV ? new SpatialDebugger() : {
    init() {},
    enable() {},
    disable() {},
    toggle() {},
    update() {},
    getOverlayData() { return null; },
    destroy() {}
  };
});
