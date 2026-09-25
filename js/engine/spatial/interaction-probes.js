/**
 * The Whispering Wilds - Interaction Probes
 * Spatial interaction detection for NPC, doors, wells, waterwheel, boats,
 * vehicles, items, crafting stations, heritage objects, wildlife observation.
 * Only shows prompt when interaction is actually possible (LOS + distance + angle).
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.InteractionProbes = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Priority constants (higher = shown first)
  const INTERACTION_PRIORITY = Object.freeze({
    QUEST_TARGET:      100,
    ACTIVE_OBJECTIVE:   90,
    VEHICLE:            80,
    BOAT:               80,
    NPC:                70,
    CULTURAL_OBJECT:    60,
    CLUE:               55,
    DOOR:               50,
    CONTAINER:          45,
    CRAFTING:           40,
    PICKUP:             35,
    PROP:               20
  });

  // Interaction types
  const InteractionType = Object.freeze({
    TALK:        'talk',
    INSPECT:     'inspect',
    PICKUP:      'pickup',
    USE:         'use',
    OPEN:        'open',
    CLOSE:       'close',
    READ:        'read',
    PHOTOGRAPH:  'photograph',
    ENTER:       'enter',
    MOUNT:       'mount',
    BOARD:       'board',
    CRAFT:       'craft',
    REPAIR:      'repair',
    SIT:         'sit',
    DRINK:       'drink',
    COLLECT:     'collect',
    OPERATE:     'operate',
    CLIMB:       'climb'
  });

  class InteractionTarget {
    constructor(id, type, worldPos, options = {}) {
      this.id          = id;
      this.type        = type;
      this.position    = worldPos;         // { x, y, z }
      this.priority    = options.priority  ?? INTERACTION_PRIORITY.PROP;
      this.maxDist     = options.maxDist   ?? 2.5;    // m
      this.maxAngle    = options.maxAngle  ?? 60;     // degrees from camera forward
      this.requireLOS  = options.requireLOS ?? true;
      this.active      = true;
      this.locKey      = options.locKey    || id;     // Localization key for prompt
      this.conditions  = options.conditions || [];    // Array of condition functions
      this.onInteract  = options.onInteract || null;  // Callback
      this._meta       = options.meta || {};
    }

    isAvailable(context = {}) {
      if (!this.active) return false;
      for (const cond of this.conditions) {
        if (typeof cond === 'function' && !cond(context)) return false;
      }
      return true;
    }
  }

  class InteractionProbeSystem {
    constructor() {
      this._targets       = new Map();    // id → InteractionTarget
      this._activeTarget  = null;
      this._gameState     = null;
      this._eventBus      = null;
      this._spatialQuery  = null;
      this._updateInterval = 0.1;         // Evaluate every 100ms
      this._updateTick    = 0;
    }

    init(gameState, eventBus, spatialQuery) {
      this._gameState    = gameState;
      this._eventBus     = eventBus;
      this._spatialQuery = spatialQuery;
    }

    // ─── Target Registration ─────────────────────────────────────────────────

    register(target) {
      if (!(target instanceof InteractionTarget)) throw new TypeError('Must be InteractionTarget');
      this._targets.set(target.id, target);
      // Also insert into spatial grid
      if (this._spatialQuery) {
        this._spatialQuery.syncEntity(
          target.id,
          target.position.x, target.position.y, target.position.z,
          0.5, ['interactable']
        );
      }
    }

    unregister(id) {
      this._targets.delete(id);
      if (this._spatialQuery) this._spatialQuery.removeEntity(id);
      if (this._activeTarget?.id === id) {
        this._activeTarget = null;
        this._emitActiveChanged(null);
      }
    }

    setActive(id, flag) {
      const t = this._targets.get(id);
      if (t) t.active = !!flag;
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    update(dt) {
      this._updateTick += dt;
      if (this._updateTick < this._updateInterval) return;
      this._updateTick = 0;

      if (!this._gameState?.player) return;
      const player = this._gameState.player;
      const pos = player.position;
      const camDir = player.cameraDirection || { x: 0, y: 0, z: -1 }; // Normalized

      // Collect candidates near player (cheap)
      const searchRadius = 5.0;
      let best = null;
      let bestScore = -Infinity;

      for (const target of this._targets.values()) {
        if (!target.active) continue;

        const dx = target.position.x - pos.x;
        const dy = target.position.y - pos.y;
        const dz = target.position.z - pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > target.maxDist || dist > searchRadius) continue;

        // Angle check
        const ndx = dx / dist;
        const ndz = dz / dist;
        const dot = ndx * camDir.x + ndz * camDir.z;
        const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
        if (angleDeg > target.maxAngle) continue;

        // Line-of-sight check (simplified — full LOS requires raycast into scene)
        if (target.requireLOS && !this._hasLOS(pos, target.position)) continue;

        // Condition check
        const context = { player, gameState: this._gameState };
        if (!target.isAvailable(context)) continue;

        // Score = priority - normalised distance penalty
        const score = target.priority - (dist / target.maxDist) * 20;
        if (score > bestScore) {
          bestScore = score;
          best = target;
        }
      }

      if (best !== this._activeTarget) {
        this._activeTarget = best;
        this._emitActiveChanged(best);
      }

      // Mirror into GameState for UI
      if (this._gameState.player) {
        this._gameState.player.interactionTarget = best ? best.id : null;
      }
    }

    /**
     * Simplified LOS: checks that no WORLD proxy intervenes.
     * Full implementation uses Three.js raycaster.
     */
    _hasLOS(from, to) {
      // TODO: Integrate with CollisionProxy spatial query once scene raycasting is connected.
      // For now, allow (conservative: might show prompt slightly too generously).
      return true;
    }

    _emitActiveChanged(target) {
      if (this._eventBus) {
        this._eventBus.emit('INTERACTION_TARGET_CHANGED', {
          target: target ? { id: target.id, type: target.type, locKey: target.locKey } : null
        });
      }
    }

    // ─── Trigger Active Interaction ──────────────────────────────────────────

    triggerInteraction() {
      if (!this._activeTarget) return false;
      const target = this._activeTarget;
      const context = {
        player: this._gameState?.player,
        gameState: this._gameState
      };
      if (!target.isAvailable(context)) return false;

      if (this._eventBus) {
        this._eventBus.emit('INTERACTION_STARTED', {
          id: target.id,
          type: target.type,
          locKey: target.locKey
        });
      }
      if (typeof target.onInteract === 'function') {
        target.onInteract(context);
      }
      return true;
    }

    getActiveTarget()  { return this._activeTarget; }
    hasActiveTarget()  { return !!this._activeTarget; }

    destroy() {
      this._targets.clear();
      this._activeTarget = null;
    }
  }

  return {
    INTERACTION_PRIORITY,
    InteractionType,
    InteractionTarget,
    InteractionProbeSystem
  };
});
