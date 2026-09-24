// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENVIRONMENT INTERACTION SYSTEM
// Raycasting, Camera Alignment, Occlusion Checking & Priority-Based Interaction
// Supports both modern Spatial Grid props and legacy Exploration entities
// ============================================================================

(function() {
  'use strict';

  // Spatial Lookup Grid for O(1) Proximity Querying
  class InteractionSpatialGrid {
    constructor(cellSize = 15.0) {
      this.cellSize = cellSize;
      this.cells = new Map();
    }

    _key(x, z) {
      const cx = Math.floor(x / this.cellSize);
      const cz = Math.floor(z / this.cellSize);
      return `${cx}_${cz}`;
    }

    insert(prop) {
      if (!prop || !prop.position) return;
      const key = this._key(prop.position.x, prop.position.z);
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key).add(prop);
    }

    remove(prop) {
      if (!prop || !prop.position) return;
      const key = this._key(prop.position.x, prop.position.z);
      if (this.cells.has(key)) {
        this.cells.get(key).delete(prop);
      }
    }

    getNearby(x, z, radius = 5.0) {
      const results = [];
      const minCx = Math.floor((x - radius) / this.cellSize);
      const maxCx = Math.floor((x + radius) / this.cellSize);
      const minCz = Math.floor((z - radius) / this.cellSize);
      const maxCz = Math.floor((z + radius) / this.cellSize);

      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
          const key = `${cx}_${cz}`;
          const cell = this.cells.get(key);
          if (cell) {
            cell.forEach(prop => results.push(prop));
          }
        }
      }
      return results;
    }

    clear() {
      this.cells.clear();
    }
  }

  class EnvironmentInteractionSystem {
    /**
     * @param {THREE.Scene} scene - Optional Three.js scene
     * @param {ThreeCamera} cameraController - Optional camera controller
     */
    constructor(scene = null, cameraController = null) {
      this.scene = scene;
      this.cameraController = cameraController;

      // Modern Spatial Grid & Registry
      this.grid = new InteractionSpatialGrid(12.0);
      this.props = new Map(); // id -> InteractiveProp
      this.activeCandidate = null;
      this.maxInteractionDistance = 3.5; // meters
      this.maxAngleDegrees = 65; // Cone of interaction facing camera

      // Legacy Exploration System entity registry & cache
      this.interactables = new Set();
      this.nearbyCache = [];
      this.lastCachePlayerPos = { x: -9999, z: -9999 };
      this.cacheUpdateTimer = 0;
      this.cacheUpdateInterval = 0.2; // 200ms
      this.focusedInteractable = null;
      this.isInspecting = false;
      this.inspectedEntity = null;

      // Wall Occlusion Collider Registry
      this.occlusionObstacles = [];

      this._lastInteractRequest = 0;
      this._bindInputListeners();
    }

    // Unified registration supporting InteractiveProp and EnvironmentObject
    register(entity) {
      if (!entity) return;
      this.interactables.add(entity);

      if (entity.id && entity.position) {
        this.props.set(entity.id, entity);
        this.grid.insert(entity);
      }
      return entity;
    }

    registerProp(prop) {
      return this.register(prop);
    }

    unregister(entity) {
      if (!entity) return;
      this.interactables.delete(entity);
      if (this.focusedInteractable === entity) {
        this.focusedInteractable = null;
      }
      if (entity.id) {
        this.unregisterProp(entity.id);
      }
    }

    unregisterProp(propId) {
      const prop = this.props.get(propId);
      if (prop) {
        this.grid.remove(prop);
        this.props.delete(propId);
        if (this.activeCandidate === prop) {
          this.activeCandidate = null;
        }
      }
    }

    registerOcclusionObstacle(obstacle) {
      if (obstacle) {
        this.occlusionObstacles.push(obstacle);
      }
    }

    // Input Handling using InputManager or fallback
    _bindInputListeners() {
      // Centralized fallback key listener
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyE' && !e.repeat) {
          if (window.GameLifecycle && (window.GameLifecycle.isInputLocked() || !window.GameLifecycle.isSimulationActive())) {
            return;
          }
          this.triggerActiveInteraction();
        }
      });
    }

    // Wall Occlusion Check (Raycast line of sight between eye and prop)
    isOccluded(cameraPos, propPos) {
      if (!cameraPos || !propPos || this.occlusionObstacles.length === 0) return false;

      const p1 = { x: cameraPos.x, z: cameraPos.z };
      const p2 = { x: propPos.x, z: propPos.z };

      for (let i = 0; i < this.occlusionObstacles.length; i++) {
        const wall = this.occlusionObstacles[i];
        if (this._lineIntersectsWall(p1, p2, wall)) {
          return true; // Occluded by solid wall
        }
      }
      return false;
    }

    _lineIntersectsWall(p1, p2, wall) {
      const ccw = (A, B, C) => (C.z - A.z) * (B.x - A.x) > (B.z - A.z) * (C.x - A.x);
      const A = p1, B = p2, C = { x: wall.x1, z: wall.z1 }, D = { x: wall.x2, z: wall.z2 };
      return (ccw(A, C, D) !== ccw(B, C, D)) && (ccw(A, B, C) !== ccw(A, B, D));
    }

    // Legacy Throttled Cache Refresh for test-exploration-system
    _refreshNearbyCache(playerPos) {
      this.nearbyCache = [];
      const maxQueryDistSq = 14.0 * 14.0; // 14 meter radius

      for (const ent of this.interactables) {
        const grp = ent.group || ent.mesh || ent;
        if (grp.visible === false) continue;
        const ud = (grp.userData) || ent;
        if (ud.interactable === false) continue;

        const entPos = ent.position || grp.position || { x: ent.x || 0, z: ent.z || 0 };
        const dx = entPos.x - playerPos.x;
        const dz = entPos.z - playerPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq <= maxQueryDistSq) {
          this.nearbyCache.push({
            entity: ent,
            distSq: distSq,
            dist: Math.sqrt(distSq),
            dx: dx,
            dz: dz
          });
        }
      }

      this.lastCachePlayerPos.x = playerPos.x;
      this.lastCachePlayerPos.z = playerPos.z;
    }

    // Legacy Priority Scoring Function for test-exploration-system
    evaluateBestInteractable(playerPos, playerHeading) {
      if (!this.nearbyCache.length) return null;

      const forwardX = Math.sin(playerHeading || 0);
      const forwardZ = Math.cos(playerHeading || 0);

      let bestScore = -9999;
      let bestEntity = null;

      for (const item of this.nearbyCache) {
        const ent = item.entity;
        const grp = ent.group || ent;
        const ud = grp.userData || ent;

        const dirX = item.dx / (item.dist || 0.001);
        const dirZ = item.dz / (item.dist || 0.001);

        const dot = (forwardX * dirX) + (forwardZ * dirZ);
        if (dot < 0.15 && item.dist > 2.2) continue;

        let score = (dot * 40.0) - (item.dist * 6.0);
        if (ud.questObject || ent.priorityTier === 1 || ent.priorityTier === 2) {
          score += 50.0;
        }

        if (score > bestScore) {
          bestScore = score;
          bestEntity = ent;
        }
      }

      return bestEntity;
    }

    // Polymorphic Update method:
    // (deltaTime, player, camera) -> modern update
    // (playerPos, playerHeading, deltaTime) -> legacy update
    update(arg1, arg2, arg3) {
      if (typeof arg1 === 'number') {
        this._updateModern(arg1, arg2, arg3);
      } else if (arg1 && typeof arg1 === 'object') {
        this._updateLegacy(arg1, arg2, arg3);
      }
    }

    _updateLegacy(playerPos, playerHeading, deltaTime = 0.016) {
      if (!playerPos) return;

      this.cacheUpdateTimer += deltaTime;
      const dx = playerPos.x - this.lastCachePlayerPos.x;
      const dz = playerPos.z - this.lastCachePlayerPos.z;
      const movedDistSq = dx * dx + dz * dz;

      if (this.cacheUpdateTimer >= this.cacheUpdateInterval || movedDistSq > 4.0) {
        this.cacheUpdateTimer = 0;
        this._refreshNearbyCache(playerPos);
      }

      const prev = this.focusedInteractable;
      this.focusedInteractable = this.evaluateBestInteractable(playerPos, playerHeading);

      if (this.focusedInteractable !== prev) {
        if (window.explorationUI && typeof window.explorationUI.setInteractPrompt === 'function') {
          if (this.focusedInteractable) {
            const ud = this.focusedInteractable.group ? this.focusedInteractable.group.userData : this.focusedInteractable;
            window.explorationUI.setInteractPrompt(true, ud.interactionType || 'interact', this.focusedInteractable.name || 'Object');
          } else {
            window.explorationUI.setInteractPrompt(false);
          }
        }
      }
    }

    _updateModern(deltaTime, player, camera) {
      if (!player) return;

      // Handle InputManager INTERACT action
      if (window.InputManager && typeof window.InputManager.wasPressed === 'function') {
        if (window.InputManager.wasPressed('INTERACT')) {
          this.triggerActiveInteraction();
        }
      }

      const px = player.x || (player.position ? player.position.x : 0);
      const py = player.y || (player.position ? player.position.y : 0);
      const pz = player.z || (player.position ? player.position.z : 0);
      const pPos = { x: px, y: py, z: pz };

      // Query spatial grid
      const nearby = this.grid.getNearby(px, pz, this.maxInteractionDistance + 1.0);
      if (nearby.length === 0) {
        if (this.activeCandidate) {
          this.activeCandidate.setHighlight('none');
          this.activeCandidate = null;
        }
        this._updateUI(null);
        return;
      }

      // Camera forward direction
      let camDir = { x: 0, z: 1 };
      if (camera && camera.getWorldDirection) {
        const dir3 = camera.getWorldDirection();
        camDir = { x: dir3.x, z: dir3.z };
      } else if (player.angle !== undefined) {
        camDir = { x: Math.cos(player.angle), z: Math.sin(player.angle) };
      }

      let bestCandidate = null;
      let highestScore = -Infinity;

      for (let i = 0; i < nearby.length; i++) {
        const prop = nearby[i];
        const dist = prop.getDistanceTo ? prop.getDistanceTo(pPos) : Math.hypot(prop.position.x - px, prop.position.z - pz);
        if (dist > this.maxInteractionDistance) continue;

        // Check occlusion through walls
        const camPos = camera?.position || pPos;
        if (this.isOccluded(camPos, prop.position)) continue;

        // Angle alignment to camera forward vector
        const toProp = {
          x: (prop.position.x - pPos.x) / (dist || 1),
          z: (prop.position.z - pPos.z) / (dist || 1)
        };
        const dot = toProp.x * camDir.x + toProp.z * camDir.z;
        const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
        if (angleDeg > this.maxAngleDegrees) continue;

        // Priority calculation (Tier 1 = highest, Tier 6 = lowest)
        // Score = (Priority Weight * 100) + (Dot Product * 20) - (Distance * 10)
        const priorityTier = prop.priorityTier || 5;
        const priorityWeight = (7 - priorityTier) * 100;
        const score = priorityWeight + (dot * 20) - (dist * 10);

        if (score > highestScore) {
          highestScore = score;
          bestCandidate = prop;
        }
      }

      // Update candidate & visual highlight
      if (this.activeCandidate !== bestCandidate) {
        if (this.activeCandidate && this.activeCandidate.setHighlight) {
          this.activeCandidate.setHighlight('none');
        }
        this.activeCandidate = bestCandidate;

        if (this.activeCandidate && this.activeCandidate.setHighlight) {
          const highlightSetting = window.GameState?.settings?.accessibility?.interactionHighlight || 'clear';
          this.activeCandidate.setHighlight(highlightSetting);
        }
      }

      this._updateUI(this.activeCandidate);
    }

    _updateUI(candidate) {
      if (window.environmentInteractionUI) {
        if (candidate) {
          const lang = window.GameState?.settings?.audio?.language || 'ta';
          const prompt = candidate.getInteractionPrompt ? candidate.getInteractionPrompt(lang) : (candidate.name || 'Interact');
          window.environmentInteractionUI.showPrompt(prompt, candidate.position);
        } else {
          window.environmentInteractionUI.hidePrompt();
        }
      }
    }

    // Player presses interact [E]
    triggerActiveInteraction() {
      const now = performance.now();
      if (now - this._lastInteractRequest < 350) return; // Anti-spam debounce
      this._lastInteractRequest = now;

      const target = this.activeCandidate || this.focusedInteractable;
      if (!target) return;

      const player = window.threeWorld?.player || window.gamePlayer || window.player;
      
      if (target.onInteract) {
        const primaryAction = target.getPrimaryAction ? target.getPrimaryAction() : 'INSPECT';
        const res = target.onInteract(primaryAction, player, {
          hasKey: (keyId) => window.GameState?.hasItemInInventory?.(keyId)
        });

        // Notify reactivity system
        if (res && res.success && window.WorldReactivitySystem) {
          window.WorldReactivitySystem.notifyInteractionCompleted(target, res);
        }
        return res;
      }

      return this.triggerInteraction(player);
    }

    // Legacy trigger interaction method
    triggerInteraction(player) {
      const ent = this.focusedInteractable || this.activeCandidate;
      if (!ent) return null;

      const grp = ent.group || ent;
      const ud = grp.userData || ent;
      const type = ud.interactionType || 'inspect';

      if (type === 'inspect') {
        return this.startInspection(ent);
      } else if (type === 'climb' && ent.waypoints) {
        if (window.traversalSystem) {
          window.traversalSystem.startClimb(ent);
        }
        return { action: 'climb', success: true };
      } else if (type === 'boat') {
        if (ent.mountPlayer && window.threeWorld && window.threeWorld.player) {
          const ok = ent.mountPlayer(window.threeWorld.player);
          if (ok && window.explorationSystem) {
            window.explorationSystem.setExplorationState('BOATING');
          }
          return { action: 'boat', success: ok };
        }
      } else if (typeof ent.interact === 'function') {
        const res = ent.interact(player ? player.inventory : []);
        if (ud.puzzleId && window.puzzleSystem) {
          window.puzzleSystem.performAction(ud.puzzleId, ud.interactionId || type);
        }
        return res;
      }

      return { success: true, action: type, message: ud.description };
    }

    startInspection(entity) {
      if (!entity) return;
      this.isInspecting = true;
      this.inspectedEntity = entity;

      if (entity.setInspectHighlight) {
        entity.setInspectHighlight(true);
      }

      if (window.explorationSystem) {
        window.explorationSystem.setExplorationState('INSPECTING');
      }

      if (window.explorationUI && typeof window.explorationUI.showInspectionModal === 'function') {
        window.explorationUI.showInspectionModal(entity);
      }

      return { action: 'inspect', success: true, entity };
    }

    endInspection() {
      if (!this.isInspecting) return;
      if (this.inspectedEntity && this.inspectedEntity.setInspectHighlight) {
        this.inspectedEntity.setInspectHighlight(false);
      }

      this.isInspecting = false;
      this.inspectedEntity = null;

      if (window.explorationSystem) {
        window.explorationSystem.setExplorationState('NORMAL');
      }

      if (window.explorationUI && typeof window.explorationUI.hideInspectionModal === 'function') {
        window.explorationUI.hideInspectionModal();
      }
    }

    // Static Accessors & Proxies for global access compatibility
    static get instance() {
      if (!window.environmentInteractionSystem) {
        window.environmentInteractionSystem = new EnvironmentInteractionSystem();
      }
      return window.environmentInteractionSystem;
    }

    static get grid() { return EnvironmentInteractionSystem.instance.grid; }
    static get activeCandidate() { return EnvironmentInteractionSystem.instance.activeCandidate; }
    static set activeCandidate(v) { EnvironmentInteractionSystem.instance.activeCandidate = v; }
    static get occlusionObstacles() { return EnvironmentInteractionSystem.instance.occlusionObstacles; }
    static set occlusionObstacles(v) { EnvironmentInteractionSystem.instance.occlusionObstacles = v; }

    static registerProp(prop) { return EnvironmentInteractionSystem.instance.registerProp(prop); }
    static unregisterProp(id) { return EnvironmentInteractionSystem.instance.unregisterProp(id); }
    static register(entity) { return EnvironmentInteractionSystem.instance.register(entity); }
    static unregister(entity) { return EnvironmentInteractionSystem.instance.unregister(entity); }
    static update(...args) { return EnvironmentInteractionSystem.instance.update(...args); }
    static isOccluded(p1, p2) { return EnvironmentInteractionSystem.instance.isOccluded(p1, p2); }
    static registerOcclusionObstacle(obs) { return EnvironmentInteractionSystem.instance.registerOcclusionObstacle(obs); }
    static triggerActiveInteraction() { return EnvironmentInteractionSystem.instance.triggerActiveInteraction(); }
  }

  // Export both Class and Singleton Instance
  window.EnvironmentInteractionSystem = EnvironmentInteractionSystem;
  window.environmentInteractionSystem = new EnvironmentInteractionSystem();
  console.log('[EnvironmentInteractionSystem] Initialized interaction detection & priority system.');
})();
