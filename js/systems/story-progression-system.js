// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY PROGRESSION SYSTEM
// Authoritative linear and semi-linear story progression engine.
// Manages node transitions, objective completion, sequence-break prevention,
// and state synchronization across the 7 chapters and climax.
// ============================================================================

(function () {
  'use strict';

  class StoryProgressionSystem {
    constructor() {
      this.currentNodeId = 'node_prologue_heist';
      this.completedNodes = [];
      this.completedObjectives = new Set();
      this.initialized = false;
    }

    init(savedData = null) {
      if (savedData) {
        if (typeof savedData.currentNodeId === 'string') {
          this.currentNodeId = savedData.currentNodeId;
        }
        if (Array.isArray(savedData.completedNodes)) {
          this.completedNodes = [...savedData.completedNodes];
        }
        if (Array.isArray(savedData.completedObjectives)) {
          this.completedObjectives = new Set(savedData.completedObjectives);
        }
      }

      this.initialized = true;
      this.syncWithGameState();

      if (window.SystemRegistry) {
        window.SystemRegistry.register('StoryProgressionSystem', this, {
          version: '1.0.0',
          dependencies: ['GameState']
        });
      }

      return this;
    }

    getCurrentNode() {
      const dataModule = window.StoryProgressionData;
      if (!dataModule) return null;
      return dataModule.getNode(this.currentNodeId);
    }

    getCompletedNodes() {
      return [...this.completedNodes];
    }

    isNodeCompleted(nodeId) {
      return this.completedNodes.includes(nodeId);
    }

    canTransitionTo(targetNodeId) {
      const dataModule = window.StoryProgressionData;
      if (!dataModule) return { valid: false, reason: 'StoryProgressionData not loaded.' };

      return dataModule.validateTransition(
        this.currentNodeId,
        targetNodeId,
        this.completedNodes
      );
    }

    completeObjective(objectiveId) {
      this.completedObjectives.add(objectiveId);

      const currentNode = this.getCurrentNode();
      if (!currentNode) return false;

      // Check if all mandatory objectives of current node are complete
      const allDone = currentNode.mandatoryObjectives.every(objId =>
        this.completedObjectives.has(objId)
      );

      if (allDone && !this.completedNodes.includes(this.currentNodeId)) {
        this.completedNodes.push(this.currentNodeId);

        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('story_node_completed', {
            detail: { nodeId: this.currentNodeId, chapter: currentNode.chapter }
          }));
        }

        // Auto-advance to primary next node if available
        if (currentNode.nextNodes && currentNode.nextNodes.length === 1) {
          this.transitionToNode(currentNode.nextNodes[0]);
        }
      }

      this.syncWithGameState();
      return true;
    }

    transitionToNode(targetNodeId) {
      const check = this.canTransitionTo(targetNodeId);
      if (!check.valid) {
        console.warn(`[StoryProgressionSystem] Transition blocked: ${check.reason}`);
        return false;
      }

      const prevNodeId = this.currentNodeId;
      if (!this.completedNodes.includes(prevNodeId)) {
        this.completedNodes.push(prevNodeId);
      }

      this.currentNodeId = targetNodeId;
      this.syncWithGameState();

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('story_node_transitioned', {
          detail: { fromNodeId: prevNodeId, toNodeId: targetNodeId }
        }));
      }

      return true;
    }

    syncWithGameState() {
      if (!window.GameState) return;

      if (!window.GameState.progression) {
        window.GameState.progression = {};
      }

      window.GameState.progression.story = {
        currentNodeId: this.currentNodeId,
        completedNodes: [...this.completedNodes],
        completedObjectives: Array.from(this.completedObjectives)
      };

      // Strict enforcement of 5-change customization ceiling
      if (window.GameState.player && window.GameState.player.customizationChangesUsed > 5) {
        window.GameState.player.customizationChangesUsed = 5;
      }
    }

    serialize() {
      return {
        currentNodeId: this.currentNodeId,
        completedNodes: [...this.completedNodes],
        completedObjectives: Array.from(this.completedObjectives)
      };
    }

    deserialize(data) {
      if (!data) return;
      if (typeof data.currentNodeId === 'string') this.currentNodeId = data.currentNodeId;
      if (Array.isArray(data.completedNodes)) this.completedNodes = [...data.completedNodes];
      if (Array.isArray(data.completedObjectives)) this.completedObjectives = new Set(data.completedObjectives);
      this.syncWithGameState();
    }
  }

  const instance = new StoryProgressionSystem();

  if (typeof window !== 'undefined') {
    window.StoryProgressionSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryProgressionSystem, instance };
  }
})();
