// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT UTILITIES
// Pure helper functions for condition evaluation, prerequisite verification,
// dependency graph resolution, cycle detection, and data cloning.
// ============================================================================

(function () {
  'use strict';

  const ContentUtils = {
    /**
     * Deep clone a serializable data object
     */
    clone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        console.warn('[ContentUtils] clone fallback:', e);
        return Object.assign({}, obj);
      }
    },

    /**
     * Deep freeze an object to prevent runtime mutations
     */
    deepFreeze(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      Object.freeze(obj);
      for (const key of Object.getOwnPropertyNames(obj)) {
        if (
          obj[key] !== null &&
          (typeof obj[key] === 'object' || typeof obj[key] === 'function') &&
          !Object.isFrozen(obj[key])
        ) {
          ContentUtils.deepFreeze(obj[key]);
        }
      }
      return obj;
    },

    /**
     * Validate ID format (must be lowercase alphanumeric + dots/dashes/underscores, no spaces)
     */
    isValidId(id) {
      if (typeof id !== 'string' || id.trim().length === 0) return false;
      return /^[a-z0-9_.-]+$/.test(id);
    },

    /**
     * Check if a set of prerequisites are satisfied against player state
     */
    evaluatePrerequisites(prereqs = {}, gameState = null) {
      const state = gameState || window.GameState;
      if (!state) return { satisfied: true, unmet: [] };

      const unmet = [];

      // 1. Required Quests
      if (Array.isArray(prereqs.requiredQuests)) {
        const completedQuests = state.quests?.completed || [];
        for (const qId of prereqs.requiredQuests) {
          if (!completedQuests.includes(qId)) {
            unmet.push({ type: 'quest', id: qId, reason: `Quest '${qId}' not completed` });
          }
        }
      }

      // 2. Required Discoveries / Codex
      if (Array.isArray(prereqs.requiredDiscoveries)) {
        const discovered = state.journal?.discoveries || state.codex?.unlocked || [];
        for (const discId of prereqs.requiredDiscoveries) {
          if (!discovered.includes(discId)) {
            unmet.push({ type: 'discovery', id: discId, reason: `Discovery '${discId}' not unlocked` });
          }
        }
      }

      // 3. Required Reputation
      if (prereqs.requiredReputation && typeof prereqs.requiredReputation === 'object') {
        const factions = state.reputation || {};
        for (const [faction, minScore] of Object.entries(prereqs.requiredReputation)) {
          const current = factions[faction] || 0;
          if (current < minScore) {
            unmet.push({ type: 'reputation', faction, current, required: minScore, reason: `Reputation with '${faction}' is ${current}, required ${minScore}` });
          }
        }
      }

      // 4. Required Items
      if (Array.isArray(prereqs.requiredItems)) {
        const inventory = state.inventory?.items || [];
        for (const reqItem of prereqs.requiredItems) {
          const itemId = typeof reqItem === 'string' ? reqItem : reqItem.id;
          const count = typeof reqItem === 'object' ? (reqItem.count || 1) : 1;
          const held = inventory.filter(i => (typeof i === 'string' ? i : i.id) === itemId).length;
          if (held < count) {
            unmet.push({ type: 'item', id: itemId, held, count, reason: `Need ${count} of item '${itemId}', held ${held}` });
          }
        }
      }

      // 5. Time of Day
      if (Array.isArray(prereqs.requiredTimeOfDay) && prereqs.requiredTimeOfDay.length > 0) {
        const currentTime = (state.world?.timeOfDay || state.timeOfDay || 'day').toLowerCase();
        if (!prereqs.requiredTimeOfDay.map(t => t.toLowerCase()).includes(currentTime)) {
          unmet.push({ type: 'timeOfDay', current: currentTime, allowed: prereqs.requiredTimeOfDay, reason: `Time is ${currentTime}, required one of [${prereqs.requiredTimeOfDay.join(', ')}]` });
        }
      }

      // 6. Region Requirement
      if (prereqs.requiredRegion) {
        const currentRegion = (state.world?.currentRegion || state.player?.region || '').toLowerCase();
        if (currentRegion !== prereqs.requiredRegion.toLowerCase()) {
          unmet.push({ type: 'region', current: currentRegion, required: prereqs.requiredRegion, reason: `In region '${currentRegion}', required '${prereqs.requiredRegion}'` });
        }
      }

      return {
        satisfied: unmet.length === 0,
        unmet
      };
    },

    /**
     * Detect circular dependencies in a dependency graph
     * graph: { [id: string]: string[] }
     * returns: { hasCycle: boolean, cycle: string[] }
     */
    detectCycles(graph) {
      const visited = new Set();
      const inStack = new Set();
      const cyclePath = [];

      function dfs(node) {
        visited.add(node);
        inStack.add(node);
        cyclePath.push(node);

        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfs(neighbor)) return true;
          } else if (inStack.has(neighbor)) {
            cyclePath.push(neighbor);
            return true;
          }
        }

        inStack.delete(node);
        cyclePath.pop();
        return false;
      }

      for (const node of Object.keys(graph)) {
        if (!visited.has(node)) {
          if (dfs(node)) {
            return { hasCycle: true, cycle: cyclePath };
          }
        }
      }

      return { hasCycle: false, cycle: [] };
    },

    /**
     * Compute distance between two 2D/3D points
     */
    distance(p1, p2) {
      if (!p1 || !p2) return Infinity;
      const dx = (p1.x || 0) - (p2.x || 0);
      const dy = ((p1.y !== undefined ? p1.y : 0) - (p2.y !== undefined ? p2.y : 0));
      const dz = ((p1.z !== undefined ? p1.z : 0) - (p2.z !== undefined ? p2.z : 0));
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    /**
     * Compare semantic version strings (e.g. "1.2.0" vs "1.1.9")
     * returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
     */
    compareVersions(v1, v2) {
      if (!v1 || !v2) return 0;
      const parts1 = String(v1).split('.').map(n => parseInt(n, 10) || 0);
      const parts2 = String(v2).split('.').map(n => parseInt(n, 10) || 0);
      const maxLen = Math.max(parts1.length, parts2.length);

      for (let i = 0; i < maxLen; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
      }
      return 0;
    }
  };

  if (typeof window !== 'undefined') {
    window.ContentUtils = ContentUtils;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentUtils;
  }
})();
