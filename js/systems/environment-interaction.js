/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Environmental Interaction & Proximity Raycast System (EnvironmentInteractionSystem)
 * High-performance spatial query and camera-facing dot product scoring to identify the
 * best interactable entity without per-frame global scans.
 */

class EnvironmentInteractionSystem {
  /**
   * @param {THREE.Scene} scene - Three.js World Scene
   * @param {ThreeCamera} cameraController - Camera Controller reference
   */
  constructor(scene = null, cameraController = null) {
    this.scene = scene;
    this.cameraController = cameraController;

    // Registry of all registered interactable candidates
    this.interactables = new Set();

    // Throttled Nearby Cache (5Hz or player delta > 2m)
    this.nearbyCache = [];
    this.lastCachePlayerPos = { x: -9999, z: -9999 };
    this.cacheUpdateTimer = 0;
    this.cacheUpdateInterval = 0.2; // 200ms

    // Currently focused best interactable
    this.focusedInteractable = null;

    // Inspection state
    this.isInspecting = false;
    this.inspectedEntity = null;
  }

  register(entity) {
    if (entity) {
      this.interactables.add(entity);
    }
  }

  unregister(entity) {
    if (entity) {
      this.interactables.delete(entity);
      if (this.focusedInteractable === entity) {
        this.focusedInteractable = null;
      }
    }
  }

  /**
   * Updates nearby candidate cache
   */
  _refreshNearbyCache(playerPos) {
    this.nearbyCache = [];
    const maxQueryDistSq = 14.0 * 14.0; // 14 meter radius

    for (const ent of this.interactables) {
      if (!ent.group || !ent.group.visible) continue;
      const ud = ent.group.userData;
      if (!ud || !ud.interactable) continue;

      const entPos = ent.position || ent.group.position;
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

  /**
   * Priority scoring function (Section 5)
   * 1. Object directly in front of player/camera
   * 2. Nearest valid object
   * 3. Quest-important object
   */
  evaluateBestInteractable(playerPos, playerHeading) {
    if (!this.nearbyCache.length) return null;

    const forwardX = Math.sin(playerHeading || 0);
    const forwardZ = Math.cos(playerHeading || 0);

    let bestScore = -9999;
    let bestEntity = null;

    for (const item of this.nearbyCache) {
      const ent = item.entity;
      const ud = ent.group.userData;

      // Normalize direction vector to object
      const dirX = item.dx / (item.dist || 0.001);
      const dirZ = item.dz / (item.dist || 0.001);

      // Dot product: 1.0 = directly in front, -1.0 = behind
      const dot = (forwardX * dirX) + (forwardZ * dirZ);

      // We only consider objects generally in front (dot > 0.15) or very close (< 2.2m)
      if (dot < 0.15 && item.dist > 2.2) continue;

      // Scoring formula:
      // - Higher facing alignment (dot * 40)
      // - Lower distance penalty (-dist * 6)
      // - Quest priority bonus (+50)
      let score = (dot * 40.0) - (item.dist * 6.0);
      if (ud.questObject) {
        score += 50.0;
      }

      if (score > bestScore) {
        bestScore = score;
        bestEntity = ent;
      }
    }

    return bestEntity;
  }

  update(playerPos, playerHeading, deltaTime) {
    if (!playerPos) return;

    // Check if player moved > 2m or 200ms elapsed to refresh nearby cache
    this.cacheUpdateTimer += deltaTime;
    const dx = playerPos.x - this.lastCachePlayerPos.x;
    const dz = playerPos.z - this.lastCachePlayerPos.z;
    const movedDistSq = dx * dx + dz * dz;

    if (this.cacheUpdateTimer >= this.cacheUpdateInterval || movedDistSq > 4.0) {
      this.cacheUpdateTimer = 0;
      this._refreshNearbyCache(playerPos);
    }

    // Evaluate best interactable
    const prev = this.focusedInteractable;
    this.focusedInteractable = this.evaluateBestInteractable(playerPos, playerHeading);

    // Update HUD prompt if changed
    if (this.focusedInteractable !== prev) {
      if (window.explorationUI && typeof window.explorationUI.setInteractPrompt === 'function') {
        if (this.focusedInteractable) {
          const ud = this.focusedInteractable.group.userData;
          window.explorationUI.setInteractPrompt(true, ud.interactionType || 'interact', this.focusedInteractable.name || 'Object');
        } else {
          window.explorationUI.setInteractPrompt(false);
        }
      }
    }
  }

  /**
   * Executes interaction on focused entity (Section 4)
   */
  triggerInteraction(player) {
    if (!this.focusedInteractable) return null;

    const ent = this.focusedInteractable;
    const ud = ent.group.userData;
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
      // If puzzle linked, update puzzle system
      if (ud.puzzleId && window.puzzleSystem) {
        window.puzzleSystem.performAction(ud.puzzleId, ud.interactionId || type);
      }
      return res;
    }

    return { success: true, action: type, message: ud.description };
  }

  /**
   * Inspection mode (Section 6)
   */
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
}

window.EnvironmentInteractionSystem = EnvironmentInteractionSystem;
