// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PROP STATE SYSTEM
// Authoritative manager for GameState.world.interactions (Single Source of Truth)
// ============================================================================

(function() {
  'use strict';

  class PropStateSystem {
    constructor() {
      this._ensureAuthoritativeState();
    }

    _ensureAuthoritativeState() {
      if (!window.GameState) return;
      if (!window.GameState.world) {
        window.GameState.world = {};
      }
      if (!window.GameState.world.interactions) {
        window.GameState.world.interactions = {
          persistentProps: {},
          mechanisms: {},
          openedDoors: {},
          openedContainers: {},
          solvedEnvironmentalObjects: {},
          discoveredInteractiveObjects: []
        };
      }
    }

    get interactions() {
      this._ensureAuthoritativeState();
      return window.GameState.world.interactions;
    }

    // Door State
    isDoorOpen(doorId) {
      return !!this.interactions.openedDoors[doorId];
    }

    recordDoorState(doorId, isOpen) {
      this.interactions.openedDoors[doorId] = !!isOpen;
      if (this.interactions.persistentProps[doorId]) {
        this.interactions.persistentProps[doorId].isOpen = !!isOpen;
      }
      this._emitChange('doorStateChanged', { doorId, isOpen });
    }

    // Container / Loot Anti-Duplication
    isContainerClaimed(containerId) {
      return !!this.interactions.openedContainers[containerId];
    }

    recordContainerOpened(containerId, grantedLoot = []) {
      this.interactions.openedContainers[containerId] = true;
      this._emitChange('containerOpened', { containerId, grantedLoot });
    }

    // Lamp State
    isLampLit(lampId) {
      const prop = this.interactions.persistentProps[lampId];
      return prop ? !!prop.isLit : false;
    }

    recordLampState(lampId, isLit) {
      if (!this.interactions.persistentProps[lampId]) {
        this.interactions.persistentProps[lampId] = {};
      }
      this.interactions.persistentProps[lampId].isLit = !!isLit;
      this._emitChange('lampStateChanged', { lampId, isLit });
    }

    // Mechanism & Puzzles
    isMechanismSolved(mechanismId) {
      return !!this.interactions.solvedEnvironmentalObjects[mechanismId];
    }

    recordMechanismState(mechanismId, state, isSolved = false) {
      this.interactions.mechanisms[mechanismId] = {
        state,
        isSolved,
        timestamp: Date.now()
      };
      if (isSolved) {
        this.interactions.solvedEnvironmentalObjects[mechanismId] = true;
      }
      this._emitChange('mechanismStateChanged', { mechanismId, state, isSolved });
    }

    // General Prop State
    recordPropState(propId, stateData = {}) {
      this.interactions.persistentProps[propId] = {
        ...(this.interactions.persistentProps[propId] || {}),
        ...stateData,
        timestamp: Date.now()
      };
      this._emitChange('propStateChanged', { propId, stateData });
    }

    getPropState(propId) {
      return this.interactions.persistentProps[propId] || null;
    }

    // Discovery Tracking
    recordDiscovery(propId) {
      if (!this.interactions.discoveredInteractiveObjects.includes(propId)) {
        this.interactions.discoveredInteractiveObjects.push(propId);
        this._emitChange('discoveryRecorded', { propId });
      }
    }

    // Anti-Cheat & Integrity Validation
    validateInteractionRequest(propId, action, playerPos, maxDist = 3.5) {
      if (!propId || typeof propId !== 'string') {
        return { valid: false, reason: 'invalid_id' };
      }

      // Check registered catalog
      const catalogDef = window.ENVIRONMENT_PROPS ? window.ENVIRONMENT_PROPS[propId] : null;
      if (!catalogDef) {
        // Unknown prop rejection
        return { valid: false, reason: 'unknown_prop' };
      }

      // Action validation
      if (!catalogDef.interactionTypes.includes(action)) {
        return { valid: false, reason: 'invalid_action_for_prop' };
      }

      // Loot double-claim rejection
      if (catalogDef.type === 'container' && action === 'OPEN' && this.isContainerClaimed(propId)) {
        return { valid: false, reason: 'already_looted' };
      }

      return { valid: true };
    }

    _emitChange(event, data) {
      if (window.GameState && window.GameState.emit) {
        window.GameState.emit(event, data);
      }
    }
  }

  window.PropStateSystem = new PropStateSystem();
  console.log('[PropStateSystem] Initialized authoritative environmental state manager.');
})();
