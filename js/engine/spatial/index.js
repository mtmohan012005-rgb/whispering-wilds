/**
 * The Whispering Wilds - Spatial Systems Index
 * Single entry point that initialises and connects all spatial subsystems.
 * Load order: CollisionLayers → CollisionProxy → GroundDetection → SlopeSystem
 *           → CollisionSystem → SpatialQuery → NavMeshManager → Pathfinding
 *           → NavigationSystem → TraversalSystem → InteractionProbes
 *           → WorldObstacleSystem → SpatialDebugger
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SpatialSystems = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  (window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1'));

  /**
   * SpatialSystemsManager
   * Owned by GameRuntime. Exposes sub-systems to all other game systems.
   */
  class SpatialSystemsManager {
    constructor() {
      // Will be populated after init()
      this.collision         = null;
      this.ground            = null;
      this.slope             = null;
      this.proxyRegistry     = null;
      this.spatialQuery      = null;
      this.navMesh           = null;
      this.pathfinding       = null;
      this.navigation        = null;
      this.traversal         = null;
      this.interactionProbes = null;
      this.obstacles         = null;
      this.debugger          = null;
      this._initialized      = false;
    }

    /**
     * Bootstrap all spatial systems.
     * @param {Object} deps
     * @param {Object} deps.gameState
     * @param {Object} deps.eventBus
     * @param {Object} [deps.inputManager]
     * @param {Object} [deps.scene]  - Three.js scene (if available)
     */
    init(deps) {
      const gs  = deps.gameState;
      const bus = deps.eventBus;

      // ── 1. Collision Proxy Registry ─────────────────────────────────────────
      const CP = (typeof window !== 'undefined' && window.CollisionProxy) ||
                 (typeof globalThis !== 'undefined' && globalThis.CollisionProxy);
      if (CP) {
        this.proxyRegistry = new CP.CollisionProxyRegistry();
      } else {
        console.warn('[SpatialSystems] CollisionProxy module not loaded — proxy registry unavailable');
        this.proxyRegistry = null;
      }

      // ── 2. Ground Detection ─────────────────────────────────────────────────
      const GD = (typeof window !== 'undefined' && window.GroundDetection) ||
                 (typeof globalThis !== 'undefined' && globalThis.GroundDetection);
      this.ground = GD ? new GD.GroundDetector({
        castLength:      2.5,
        groundThreshold: 0.08,
        stepHeight:      0.35
      }) : null;

      // ── 3. Slope System ─────────────────────────────────────────────────────
      const SS = (typeof window !== 'undefined' && window.SlopeSystem) ||
                 (typeof globalThis !== 'undefined' && globalThis.SlopeSystem);
      this.slope = SS ? new SS.SlopeSystem() : null;

      // ── 4. Collision System ─────────────────────────────────────────────────
      const CSMod = (typeof window !== 'undefined' && window.CollisionSystem) ||
                    (typeof globalThis !== 'undefined' && globalThis.CollisionSystem);
      if (CSMod) {
        this.collision = new CSMod.CollisionSystem();
        this.collision.init({
          groundDetector: this.ground,
          slopeSystem:    this.slope,
          proxyRegistry:  this.proxyRegistry,
          gameState:      gs,
          eventBus:       bus
        });

        // Register player capsule
        if (CP) {
          const { CapsuleProxy } = CP;
          const { CollisionLayers } = (typeof window !== 'undefined' && window.CollisionLayers)
            ? { CollisionLayers: window.CollisionLayers }
            : { CollisionLayers: { PLAYER: 0x0001 } };
          const playerCapsule = new CapsuleProxy(
            'player_capsule', CollisionLayers.PLAYER || 0x0001,
            0.35, 1.8,
            { stepHeight: 0.35, slopeLimit: 45 }
          );
          this.collision.registerAgent('player', playerCapsule, { type: 'player' });
        }
      }

      // ── 5. Spatial Query ────────────────────────────────────────────────────
      const SQ = (typeof window !== 'undefined' && window.SpatialQuery) ||
                 (typeof globalThis !== 'undefined' && globalThis.SpatialQuery);
      if (SQ) {
        this.spatialQuery = new SQ.SpatialQuery();
        this.spatialQuery.init(gs, this.proxyRegistry);
      }

      // ── 6. NavMesh Manager ──────────────────────────────────────────────────
      const NM = (typeof window !== 'undefined' && window.NavMeshManager) ||
                 (typeof globalThis !== 'undefined' && globalThis.NavMeshManager);
      if (NM) {
        this.navMesh = new NM.NavMeshManager();
        this.navMesh.init(bus);
        this.navMesh.registerDefaultWorldTiles();
      }

      // ── 7. Pathfinding ──────────────────────────────────────────────────────
      const PF = (typeof window !== 'undefined' && window.Pathfinding) ||
                 (typeof globalThis !== 'undefined' && globalThis.Pathfinding);
      if (PF && this.navMesh) {
        this.pathfinding = new PF.PathfindingSystem();
        this.pathfinding.init(this.navMesh);
      }

      // ── 8. Navigation System ────────────────────────────────────────────────
      const NAV = (typeof window !== 'undefined' && window.NavigationSystem) ||
                  (typeof globalThis !== 'undefined' && globalThis.NavigationSystem);
      if (NAV) {
        this.navigation = new NAV.NavigationSystem();
        this.navigation.init({
          navMesh:      this.navMesh,
          pathfinder:   this.pathfinding,
          spatialQuery: this.spatialQuery,
          eventBus:     bus
        });
      }

      // ── 9. Traversal System ─────────────────────────────────────────────────
      const TS = (typeof window !== 'undefined' && window.TraversalSystem) ||
                 (typeof globalThis !== 'undefined' && globalThis.TraversalSystem);
      if (TS) {
        this.traversal = new TS.TraversalSystem();
        this.traversal.init({
          gameState:       gs,
          eventBus:        bus,
          collisionSystem: this.collision,
          inputManager:    deps.inputManager || null
        });
      }

      // ── 10. Interaction Probes ──────────────────────────────────────────────
      const IP = (typeof window !== 'undefined' && window.InteractionProbes) ||
                 (typeof globalThis !== 'undefined' && globalThis.InteractionProbes);
      if (IP) {
        this.interactionProbes = new IP.InteractionProbeSystem();
        this.interactionProbes.init(gs, bus, this.spatialQuery);
      }

      // ── 11. World Obstacle System ───────────────────────────────────────────
      const WO = (typeof window !== 'undefined' && window.WorldObstacleSystem) ||
                 (typeof globalThis !== 'undefined' && globalThis.WorldObstacleSystem);
      if (WO) {
        this.obstacles = new WO.WorldObstacleSystem();
        this.obstacles.init(this.navMesh, this.proxyRegistry, bus);
      }

      // ── 12. Spatial Debugger (dev-only) ─────────────────────────────────────
      const DBG = (typeof window !== 'undefined' && window.SpatialDebugger) ||
                  (typeof globalThis !== 'undefined' && globalThis.SpatialDebugger);
      if (DBG) {
        this.debugger = DBG;
        this.debugger.init({
          collisionSystem:  this.collision,
          navMesh:          this.navMesh,
          navigationSystem: this.navigation,
          pathfinding:      this.pathfinding,
          proxyRegistry:    this.proxyRegistry,
          spatialQuery:     this.spatialQuery,
          scene:            deps.scene || null
        });
      }

      this._initialized = true;
      if (IS_DEV) console.log('[SpatialSystems] All spatial subsystems initialized');
      if (bus) bus.emit('SPATIAL_SYSTEMS_READY', {});
    }

    /**
     * Main update — called by GameRuntime each frame.
     * @param {number} dt - Delta time in seconds
     * @param {number} timestamp - Performance.now()
     */
    update(dt, timestamp) {
      if (!this._initialized) return;
      if (this.collision)         this.collision.update(dt);
      if (this.traversal)         this.traversal.update(dt);
      if (this.interactionProbes) this.interactionProbes.update(dt);
      if (this.navigation)        this.navigation.update(dt);
      if (this.obstacles)         this.obstacles.update(Date.now());
      if (this.debugger)          this.debugger.update(timestamp);
    }

    /**
     * Quickly check if a world position is walkable (player can stand there).
     * Combines collision proxy + navmesh checks.
     */
    isPositionWalkable(x, z) {
      if (this.obstacles?.isBlocked(x, z)) return false;
      if (this.navMesh && !this.navMesh.isNavigable(x, z)) return false;
      if (this.spatialQuery?.queryObstacle(x, 0, z)) return false;
      return true;
    }

    destroy() {
      this.collision?.destroy();
      this.traversal?.destroy();
      this.interactionProbes?.destroy();
      this.navigation?.destroy();
      this.navMesh?.destroy();
      this.obstacles?.destroy();
      this.debugger?.destroy();
      this._initialized = false;
    }
  }

  return new SpatialSystemsManager();
});
