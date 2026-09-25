/**
 * The Whispering Wilds - Core Collision System
 * Production-grade character collision for player, NPCs, wildlife, vehicles, boats.
 * Uses capsule for character agents, integrates GroundDetector and SlopeSystem.
 * Reads from and writes to authoritative GameState only.
 * Never performs full-world collision scans every frame.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CollisionSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost') ||
                 (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');

  // ─── Agent Record ────────────────────────────────────────────────────────────
  class CollisionAgent {
    constructor(id, capsule, options = {}) {
      this.id         = id;
      this.capsule    = capsule;    // CapsuleProxy
      this.grounded   = false;
      this.groundY    = 0;
      this.groundNormal = { x: 0, y: 1, z: 0 };
      this.slopeAngle = 0;
      this.velocity   = { x: 0, y: 0, z: 0 };
      this.inWater    = false;
      this.waterType  = null;
      this.lastSafePos = { x: 0, y: 0, z: 0 };
      this.stuckTimer = 0;
      this.fallHeight = 0;   // Y at which agent left ground
      this.type       = options.type || 'npc'; // 'player'|'npc'|'wildlife'|'vehicle'|'boat'
    }
  }

  // ─── Fall Categories ─────────────────────────────────────────────────────────
  const FallCategory = Object.freeze({
    NONE:   'none',
    SMALL:  'small',   // <1.2m  → step-down
    MEDIUM: 'medium',  // 1.2–4m → controlled descent
    LARGE:  'large'    // >4m    → fall state / recovery
  });

  // ─── Main System ─────────────────────────────────────────────────────────────
  class CollisionSystem {
    constructor() {
      this._agents           = new Map();   // agentId → CollisionAgent
      this._groundDetector   = null;
      this._slopeSystem      = null;
      this._proxyRegistry    = null;
      this._gameState        = null;
      this._eventBus         = null;
      this._spatialQuerySys  = null;
      this._initialized      = false;

      // Per-frame budget: max agents evaluated for ground per tick
      this._groundBudget = 8;

      // Agent update queue (round-robin for ground checks)
      this._updateQueue  = [];
      this._updateCursor = 0;

      // Gravity constant
      this.GRAVITY = 18.0;  // world-units per second²

      // Recovery constants
      this.STUCK_THRESHOLD_TIME  = 2.5;   // seconds without meaningful movement
      this.STUCK_THRESHOLD_DIST  = 0.1;   // m of expected movement
      this.SAFE_POS_INTERVAL     = 1.0;   // seconds between safe-position saves
      this._safePosTick          = 0;
    }

    // ─── Initialisation ──────────────────────────────────────────────────────

    /**
     * @param {Object} deps
     * @param {Object} deps.groundDetector   - GroundDetector instance
     * @param {Object} deps.slopeSystem      - SlopeSystem instance
     * @param {Object} deps.proxyRegistry    - CollisionProxyRegistry
     * @param {Object} deps.gameState        - GameStateEngine
     * @param {Object} deps.eventBus         - EventBus
     * @param {Object} [deps.spatialQuery]   - SpatialQuery instance
     */
    init(deps) {
      this._groundDetector  = deps.groundDetector;
      this._slopeSystem     = deps.slopeSystem;
      this._proxyRegistry   = deps.proxyRegistry;
      this._gameState       = deps.gameState;
      this._eventBus        = deps.eventBus;
      this._spatialQuerySys = deps.spatialQuery || null;
      this._initialized     = true;
      if (IS_DEV) console.log('[CollisionSystem] Initialized');
    }

    // ─── Agent Registration ──────────────────────────────────────────────────

    registerAgent(id, capsule, options = {}) {
      if (this._agents.has(id)) {
        if (IS_DEV) console.warn(`[CollisionSystem] Agent '${id}' already registered`);
        return this._agents.get(id);
      }
      const agent = new CollisionAgent(id, capsule, options);
      this._agents.set(id, agent);
      this._updateQueue.push(id);
      return agent;
    }

    unregisterAgent(id) {
      this._agents.delete(id);
      this._updateQueue = this._updateQueue.filter(x => x !== id);
    }

    getAgent(id) { return this._agents.get(id) || null; }

    // ─── Main Update ─────────────────────────────────────────────────────────

    /**
     * Called by GameRuntime each frame.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
      if (!this._initialized) return;
      if (dt <= 0 || dt > 0.2) return; // Guard against bad deltas

      this._safePosTick += dt;

      // Process ground checks for a budget of agents per frame
      const qLen = this._updateQueue.length;
      if (qLen > 0) {
        const count = Math.min(this._groundBudget, qLen);
        for (let i = 0; i < count; i++) {
          const idx = this._updateCursor % qLen;
          this._updateCursor++;
          const agentId = this._updateQueue[idx];
          const agent = this._agents.get(agentId);
          if (agent) this._updateAgentGround(agent, dt);
        }
      }

      // Always update player at full rate
      const gs = this._gameState;
      if (gs && gs.player) {
        this._updatePlayerCollision(gs.player, dt);
      }

      // Store safe position periodically
      if (this._safePosTick >= this.SAFE_POS_INTERVAL && gs && gs.player) {
        this._tryStoreSafePosition(gs.player);
        this._safePosTick = 0;
      }
    }

    // ─── Player Collision ────────────────────────────────────────────────────

    _updatePlayerCollision(player, dt) {
      const pos = player.position;
      const vel = player.velocity || { x: 0, y: 0, z: 0 };
      const agentId = 'player';
      let agent = this._agents.get(agentId);

      if (!agent) return; // Player not registered yet

      const capsule = agent.capsule;
      capsule.setPosition(pos.x, pos.y, pos.z);

      // Ground detection
      const hit = this._groundDetector.query(pos.x, pos.y, pos.z);

      if (hit.hit) {
        this._slopeSystem.update(hit.slope);
        agent.grounded    = hit.distance <= capsule._groundThreshold ?? 0.08;
        agent.groundY     = hit.point.y;
        agent.groundNormal = { ...hit.normal };
        agent.slopeAngle  = hit.slope;

        // Surface type → update GameState
        if (player.groundSurface !== hit.surfaceType) {
          player.groundSurface = hit.surfaceType;
          if (this._eventBus) {
            this._eventBus.emit('SURFACE_CHANGED', { surface: hit.surfaceType, agentId });
          }
        }

        if (agent.grounded) {
          // Clamp player to ground
          const targetY = hit.point.y;
          const snapDelta = pos.y - targetY;
          if (snapDelta < 0) {
            // Penetrating terrain — push up
            pos.y = targetY;
            vel.y = Math.max(0, vel.y);
          } else if (snapDelta < capsule.stepHeight) {
            // Step-up logic
            pos.y = Math.min(pos.y, targetY + capsule.stepHeight);
          }

          // Check fall landing
          if (agent.fallHeight > 0) {
            const fallDist = agent.fallHeight - pos.y;
            this._handleLanding(player, agent, fallDist);
            agent.fallHeight = 0;
          }
        } else {
          // Airborne — record height for fall calculation
          if (agent.fallHeight === 0) agent.fallHeight = pos.y;
          vel.y -= this.GRAVITY * dt;
        }

        // Slope blocking
        if (!this._slopeSystem.canWalk() && (vel.x !== 0 || vel.z !== 0)) {
          if (this._slopeSystem.isSliding()) {
            const sv = this._slopeSystem.getSlideVector(hit.normal);
            vel.x = sv.x * 4;
            vel.z = sv.z * 4;
          } else {
            // Block horizontal movement on non-walkable slope
            vel.x = 0;
            vel.z = 0;
          }
        }

        // Speed modifier from slope
        const speedMod = this._slopeSystem.getSpeedMultiplier();
        if (player.slopeSpeedMultiplier !== speedMod) {
          player.slopeSpeedMultiplier = speedMod;
        }

        // Update surface audio
        if (player.currentSurface !== hit.surfaceType) {
          player.currentSurface = hit.surfaceType;
        }
      } else {
        agent.grounded = false;
        if (agent.fallHeight === 0) agent.fallHeight = pos.y;
        vel.y -= this.GRAVITY * dt;
      }

      // Wall collision sweep
      this._sweepCapsuleXZ(agent, vel, dt);

      // Water detection
      this._detectWater(agent, pos, player);

      // Stuck detection
      this._detectStuck(agent, pos, dt);
    }

    // ─── Wall Sweep ──────────────────────────────────────────────────────────

    _sweepCapsuleXZ(agent, vel, dt) {
      if (!this._proxyRegistry) return;
      const cap = agent.capsule;
      const pos = cap.position;

      const projX = pos.x + vel.x * dt;
      const projZ = pos.z + vel.z * dt;

      const queryMin = {
        x: Math.min(pos.x, projX) - cap.radius - 0.2,
        y: pos.y,
        z: Math.min(pos.z, projZ) - cap.radius - 0.2
      };
      const queryMax = {
        x: Math.max(pos.x, projX) + cap.radius + 0.2,
        y: pos.y + cap.effectiveHeight,
        z: Math.max(pos.z, projZ) + cap.radius + 0.2
      };

      // Only check WORLD layer boxes
      const candidates = this._proxyRegistry.queryAABBOverlap(queryMin, queryMax, 0x0008 /*WORLD*/);

      for (const proxy of candidates) {
        if (proxy.shape !== 'box') continue;
        const aabb = proxy.getAABB();
        if (!aabb) continue;
        // Simple push-out: find closest edge and push capsule out
        const cx = Math.max(aabb.min.x, Math.min(projX, aabb.max.x));
        const cz = Math.max(aabb.min.z, Math.min(projZ, aabb.max.z));
        const dx = projX - cx;
        const dz = projZ - cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < cap.radius) {
          const push = cap.radius - dist;
          const nx = dist > 0.001 ? dx / dist : 1;
          const nz = dist > 0.001 ? dz / dist : 0;
          vel.x += nx * push / dt;
          vel.z += nz * push / dt;
        }
      }
    }

    // ─── NPC/Other Agent Ground ──────────────────────────────────────────────

    _updateAgentGround(agent, dt) {
      const cap = agent.capsule;
      const pos = cap.position;
      const hit = this._groundDetector.query(pos.x, pos.y, pos.z);

      if (hit.hit) {
        agent.grounded   = hit.distance <= 0.15;
        agent.groundY    = hit.point.y;
        agent.slopeAngle = hit.slope;
        if (agent.grounded && pos.y < hit.point.y) {
          pos.y = hit.point.y;
        }
      } else {
        agent.grounded = false;
      }
    }

    // ─── Water Detection ─────────────────────────────────────────────────────

    _detectWater(agent, pos, player) {
      if (!this._proxyRegistry) return;
      const waterProxies = this._proxyRegistry.queryByLayer(0x0100 /*WATER*/);
      let inWater = false;
      for (const wp of waterProxies) {
        if (wp.containsPoint(pos.x, pos.y, pos.z)) {
          inWater = true;
          if (agent.inWater !== true) {
            agent.inWater  = true;
            agent.waterType = wp.type;
            if (this._eventBus) this._eventBus.emit('WATER_ENTERED', { type: wp.type });
            if (player) player.inWater = true;
          }
          break;
        }
      }
      if (!inWater && agent.inWater) {
        agent.inWater  = false;
        agent.waterType = null;
        if (this._eventBus) this._eventBus.emit('WATER_EXITED', {});
        if (player) player.inWater = false;
      }
    }

    // ─── Stuck Detection ─────────────────────────────────────────────────────

    _detectStuck(agent, pos, dt) {
      if (!agent._lastStuckPos) {
        agent._lastStuckPos = { ...pos };
        agent.stuckTimer = 0;
        return;
      }
      const dx = pos.x - agent._lastStuckPos.x;
      const dz = pos.z - agent._lastStuckPos.z;
      const moved = Math.sqrt(dx * dx + dz * dz);

      // Check if agent has velocity but isn't moving
      const vel = agent.capsule._meta.velocity || { x: 0, z: 0 };
      const hasIntent = Math.abs(vel.x) > 0.5 || Math.abs(vel.z) > 0.5;

      if (hasIntent && moved < this.STUCK_THRESHOLD_DIST * dt * 10) {
        agent.stuckTimer += dt;
        if (agent.stuckTimer >= this.STUCK_THRESHOLD_TIME) {
          this._recoverStuck(agent, pos);
          agent.stuckTimer = 0;
        }
      } else {
        agent.stuckTimer = 0;
        agent._lastStuckPos = { ...pos };
      }
    }

    _recoverStuck(agent, pos) {
      if (IS_DEV) console.warn(`[CollisionSystem] Stuck recovery for '${agent.id}'`);
      if (agent.type === 'player' && agent.lastSafePos.x !== 0) {
        // Move toward last safe position, not teleport
        pos.x += (agent.lastSafePos.x - pos.x) * 0.3;
        pos.z += (agent.lastSafePos.z - pos.z) * 0.3;
      }
      if (this._eventBus) {
        this._eventBus.emit('AGENT_STUCK_RECOVERED', { agentId: agent.id });
      }
    }

    // ─── Safe Position Storage ───────────────────────────────────────────────

    _tryStoreSafePosition(player) {
      const agent = this._agents.get('player');
      if (!agent) return;
      if (agent.grounded && !agent.inWater) {
        const pos = player.position;
        agent.lastSafePos = { x: pos.x, y: pos.y, z: pos.z };
        // Mirror to GameState for save system
        if (!player.lastSafePosition) player.lastSafePosition = {};
        player.lastSafePosition.x = pos.x;
        player.lastSafePosition.y = pos.y;
        player.lastSafePosition.z = pos.z;
      }
    }

    // ─── Landing Handler ─────────────────────────────────────────────────────

    _handleLanding(player, agent, fallDist) {
      let category = FallCategory.NONE;
      if (fallDist > 4.0)      category = FallCategory.LARGE;
      else if (fallDist > 1.2) category = FallCategory.MEDIUM;
      else if (fallDist > 0.3) category = FallCategory.SMALL;

      if (category !== FallCategory.NONE && this._eventBus) {
        this._eventBus.emit('PLAYER_LANDED', { category, fallDist });
      }
      // Large falls can affect survival
      if (category === FallCategory.LARGE && player.survival) {
        const damage = Math.floor((fallDist - 4.0) * 5);
        player.survival.health = Math.max(0, player.survival.health - damage);
        if (IS_DEV) console.log(`[CollisionSystem] Fall damage: ${damage} (${fallDist.toFixed(1)}m)`);
      }
    }

    // ─── Multiplayer Validation ──────────────────────────────────────────────

    /**
     * Server-side: validate that a proposed position delta is physically plausible.
     * Prevents teleport exploits and speed hacks.
     * @param {Object} currentPos
     * @param {Object} proposedPos
     * @param {number} dt
     * @param {number} [maxSpeed=12]
     * @returns {{ valid:boolean, reason:string }}
     */
    validateMultiplayerMove(currentPos, proposedPos, dt, maxSpeed = 12) {
      const dx = proposedPos.x - currentPos.x;
      const dy = proposedPos.y - currentPos.y;
      const dz = proposedPos.z - currentPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const speed = dist / Math.max(dt, 0.016);
      if (speed > maxSpeed * 1.5) {
        return { valid: false, reason: `speed_hack(${speed.toFixed(1)}>max${maxSpeed * 1.5})` };
      }
      if (!isFinite(proposedPos.x) || !isFinite(proposedPos.y) || !isFinite(proposedPos.z)) {
        return { valid: false, reason: 'invalid_coordinates' };
      }
      return { valid: true, reason: '' };
    }

    // ─── Public Queries ──────────────────────────────────────────────────────

    isGrounded(agentId)    { return this._agents.get(agentId)?.grounded ?? false; }
    getGroundY(agentId)    { return this._agents.get(agentId)?.groundY  ?? 0; }
    isInWater(agentId)     { return this._agents.get(agentId)?.inWater  ?? false; }
    getWaterType(agentId)  { return this._agents.get(agentId)?.waterType ?? null; }
    getSlopeAngle(agentId) { return this._agents.get(agentId)?.slopeAngle ?? 0; }

    destroy() {
      this._agents.clear();
      this._updateQueue = [];
      this._initialized = false;
    }
  }

  return { CollisionSystem, CollisionAgent, FallCategory };
});
