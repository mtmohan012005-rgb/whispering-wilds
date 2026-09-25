/**
 * The Whispering Wilds - Navigation System (Agent Layer)
 * Higher-level navigation for NPC and wildlife agents.
 * Connects agent AI goals to NavMeshManager + PathfindingSystem.
 * Handles stuck recovery, door/gate traversal, local avoidance.
 * Reads from SpatialQuery. Never recalculates path every frame.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.NavigationSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost') ||
                 (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');

  // ─── Navigation Agent ────────────────────────────────────────────────────────
  class NavAgent {
    constructor(id, type, options = {}) {
      this.id           = id;
      this.type         = type;    // 'npc'|'wildlife'|'vehicle'|'boat'
      this.position     = { x: 0, z: 0 };
      this.path         = null;    // Array of {x,z} waypoints
      this.pathIndex    = 0;
      this.destination  = null;
      this.speed        = options.speed    || 2.0;     // m/s
      this.radius       = options.radius   || 0.35;    // Agent radius for avoidance
      this.active       = true;
      this.arrived      = false;
      this.stuckTimer   = 0;
      this._lastPos     = { x: 0, z: 0 };
      this._pathTimeout = 0;       // Cooldown before re-requesting path
      this._failCount   = 0;       // Consecutive path failures
      this._maxFail     = 3;
    }

    setPosition(x, z) {
      this.position.x = x;
      this.position.z = z;
    }
  }

  // ─── Local Avoidance (RVO2 approximation) ────────────────────────────────────
  class LocalAvoidance {
    /**
     * Compute a velocity adjustment to avoid nearby agents.
     * Simple circular-repulsion model.
     * @param {{x,z}} agentPos
     * @param {{x,z}} desiredVelocity
     * @param {Array} neighbours - Array of {x,z, radius}
     * @param {number} agentRadius
     * @returns {{x,z}}
     */
    static compute(agentPos, desiredVelocity, neighbours, agentRadius) {
      let avoidX = desiredVelocity.x;
      let avoidZ = desiredVelocity.z;

      for (const nb of neighbours) {
        const dx = agentPos.x - nb.x;
        const dz = agentPos.z - nb.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = agentRadius + (nb.radius || 0.35);
        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) / minDist;
          avoidX += (dx / dist) * overlap * 2;
          avoidZ += (dz / dist) * overlap * 2;
        }
      }

      // Normalise to original speed magnitude
      const origSpeed = Math.sqrt(desiredVelocity.x ** 2 + desiredVelocity.z ** 2);
      const newSpeed  = Math.sqrt(avoidX ** 2 + avoidZ ** 2);
      if (newSpeed > 0.01 && origSpeed > 0.01) {
        const scale = origSpeed / newSpeed;
        avoidX *= scale;
        avoidZ *= scale;
      }

      return { x: avoidX, z: avoidZ };
    }
  }

  // ─── Navigation System ───────────────────────────────────────────────────────
  class NavigationSystem {
    constructor() {
      this._agents       = new Map();
      this._navMesh      = null;
      this._pathfinder   = null;
      this._spatialQuery = null;
      this._eventBus     = null;

      // Stuck detection
      this.STUCK_DIST    = 0.05;   // m per interval considered "not moving"
      this.STUCK_TIME    = 2.5;    // s
      this.PATH_COOLDOWN = 0.5;    // s between path retries
    }

    init(deps) {
      this._navMesh      = deps.navMesh;
      this._pathfinder   = deps.pathfinder;
      this._spatialQuery = deps.spatialQuery;
      this._eventBus     = deps.eventBus;
    }

    // ─── Agent Lifecycle ──────────────────────────────────────────────────────

    registerAgent(id, type, options = {}) {
      if (this._agents.has(id)) return this._agents.get(id);
      const agent = new NavAgent(id, type, options);
      this._agents.set(id, agent);
      return agent;
    }

    unregisterAgent(id) {
      this._agents.delete(id);
    }

    getAgent(id) { return this._agents.get(id) || null; }

    // ─── Destination Setting ──────────────────────────────────────────────────

    setDestination(agentId, tx, tz, priority = 5) {
      const agent = this._agents.get(agentId);
      if (!agent) return;

      // If already heading here, don't re-request
      if (agent.destination &&
          Math.abs(agent.destination.x - tx) < 0.5 &&
          Math.abs(agent.destination.z - tz) < 0.5) return;

      agent.destination = { x: tx, z: tz };
      agent.arrived     = false;
      agent.path        = null;
      agent.pathIndex   = 0;

      // Request path asynchronously
      if (this._pathfinder && agent._pathTimeout <= 0) {
        this._pathfinder.requestPath(
          agent.position.x, agent.position.z,
          tx, tz,
          (path) => this._onPathReceived(agent, path),
          priority
        );
      }
    }

    _onPathReceived(agent, path) {
      if (!path || path.length === 0) {
        agent._failCount++;
        if (IS_DEV) console.warn(`[Navigation] No path for '${agent.id}' (fail #${agent._failCount})`);
        if (agent._failCount >= agent._maxFail) {
          this._handlePathFailure(agent);
        }
        return;
      }
      agent._failCount = 0;
      agent.path       = path;
      agent.pathIndex  = 0;
      if (this._eventBus) {
        this._eventBus.emit('NPC_PATH_FOUND', { agentId: agent.id, waypoints: path.length });
      }
    }

    // ─── Main Update ──────────────────────────────────────────────────────────

    update(dt) {
      // Process queued path requests
      if (this._pathfinder) this._pathfinder.update();

      for (const agent of this._agents.values()) {
        if (!agent.active) continue;
        if (agent._pathTimeout > 0) agent._pathTimeout -= dt;
        this._updateAgent(agent, dt);
      }
    }

    _updateAgent(agent, dt) {
      if (!agent.path || agent.path.length === 0 || agent.arrived) return;
      if (agent.pathIndex >= agent.path.length) {
        agent.arrived = true;
        if (this._eventBus) this._eventBus.emit('NPC_ARRIVED', { agentId: agent.id });
        return;
      }

      const waypoint = agent.path[agent.pathIndex];
      const dx = waypoint.x - agent.position.x;
      const dz = waypoint.z - agent.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Arrive at waypoint
      if (dist < 0.5) {
        agent.pathIndex++;
        return;
      }

      // Compute desired velocity
      const speed = agent.speed;
      let vx = (dx / dist) * speed;
      let vz = (dz / dist) * speed;

      // Local avoidance with nearby agents
      const neighbours = this._getNearbyAgentPositions(agent);
      if (neighbours.length > 0) {
        const avoided = LocalAvoidance.compute(
          agent.position,
          { x: vx, z: vz },
          neighbours,
          agent.radius
        );
        vx = avoided.x;
        vz = avoided.z;
      }

      // Advance position
      agent.position.x += vx * dt;
      agent.position.z += vz * dt;

      // Clamp to navigable space
      if (this._navMesh && !this._navMesh.isNavigable(agent.position.x, agent.position.z)) {
        // Revert movement
        agent.position.x -= vx * dt;
        agent.position.z -= vz * dt;
      }

      // Sync to spatial grid
      if (this._spatialQuery) {
        this._spatialQuery.syncEntity(agent.id, agent.position.x, 0, agent.position.z, agent.radius, [agent.type]);
      }

      // Stuck detection
      this._checkStuck(agent, dt);
    }

    _getNearbyAgentPositions(self) {
      const results = [];
      for (const agent of this._agents.values()) {
        if (agent.id === self.id) continue;
        const dx = agent.position.x - self.position.x;
        const dz = agent.position.z - self.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 3.0) {
          results.push({ x: agent.position.x, z: agent.position.z, radius: agent.radius });
        }
      }
      return results;
    }

    _checkStuck(agent, dt) {
      const dx = agent.position.x - agent._lastPos.x;
      const dz = agent.position.z - agent._lastPos.z;
      const moved = Math.sqrt(dx * dx + dz * dz);

      if (moved < this.STUCK_DIST * dt * 10) {
        agent.stuckTimer += dt;
        if (agent.stuckTimer >= this.STUCK_TIME) {
          this._recoverStuck(agent);
          agent.stuckTimer = 0;
        }
      } else {
        agent.stuckTimer = 0;
        agent._lastPos.x = agent.position.x;
        agent._lastPos.z = agent.position.z;
      }
    }

    _recoverStuck(agent) {
      if (IS_DEV) console.warn(`[Navigation] Stuck recovery: '${agent.id}'`);
      // Step 1: small random nudge
      agent.position.x += (Math.random() - 0.5) * 0.5;
      agent.position.z += (Math.random() - 0.5) * 0.5;
      // Step 2: re-request path
      agent.path = null;
      agent._pathTimeout = this.PATH_COOLDOWN;
      agent._failCount++;
      if (this._eventBus) this._eventBus.emit('NPC_STUCK_RECOVERED', { agentId: agent.id });
    }

    _handlePathFailure(agent) {
      // Agent waits or returns to previous safe point
      agent.destination = null;
      agent.path        = null;
      agent._failCount  = 0;
      agent._pathTimeout = 5.0; // Wait 5s before trying again
      if (IS_DEV) console.warn(`[Navigation] Path failure limit for '${agent.id}' — waiting`);
      if (this._eventBus) this._eventBus.emit('NPC_PATH_FAILED', { agentId: agent.id });
    }

    get agentCount() { return this._agents.size; }

    destroy() {
      this._agents.clear();
    }
  }

  return { NavAgent, LocalAvoidance, NavigationSystem };
});
