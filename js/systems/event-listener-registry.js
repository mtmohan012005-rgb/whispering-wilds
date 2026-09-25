/**
 * js/systems/event-listener-registry.js
 * Tracks DOM event listeners by owner to prevent leaks and enable clean mass-removal
 * upon UI destruction or region transitions.
 */

(function () {
  'use strict';

  class EventListenerRegistry {
    constructor() {
      this._listeners = []; // Array of { target, type, listener, options, owner }
    }

    /**
     * Attaches an event listener and registers ownership.
     */
    addEventListener(target, type, listener, options = false, owner = 'global') {
      if (!target || typeof target.addEventListener !== 'function') return false;

      // Duplicate registration check
      const exists = this._listeners.some(
        l => l.target === target && l.type === type && l.listener === listener && l.owner === owner
      );
      if (exists) {
        console.warn(`[EventListenerRegistry] Prevented duplicate listener on '${type}' for owner '${owner}'`);
        return false;
      }

      target.addEventListener(type, listener, options);
      this._listeners.push({ target, type, listener, options, owner });
      return true;
    }

    /**
     * Removes an event listener manually.
     */
    removeEventListener(target, type, listener, options = false) {
      if (!target || typeof target.removeEventListener !== 'function') return false;

      const idx = this._listeners.findIndex(
        l => l.target === target && l.type === type && l.listener === listener
      );
      if (idx !== -1) {
        target.removeEventListener(type, listener, options);
        this._listeners.splice(idx, 1);
        return true;
      }
      return false;
    }

    /**
     * Cleans up all listeners owned by a specific subsystem or scope (e.g. 'region', 'ui', 'dialogue').
     */
    cleanupByOwner(owner) {
      if (!owner) return 0;
      let removed = 0;

      for (let i = this._listeners.length - 1; i >= 0; i--) {
        const item = this._listeners[i];
        if (item.owner === owner) {
          try {
            item.target.removeEventListener(item.type, item.listener, item.options);
          } catch (_) {}
          this._listeners.splice(i, 1);
          removed++;
        }
      }

      return removed;
    }

    getTotalCount() {
      return this._listeners.length;
    }

    getCountByOwner(owner) {
      return this._listeners.filter(l => l.owner === owner).length;
    }

    healthCheck() {
      return {
        status: 'healthy',
        details: { totalTrackedListeners: this._listeners.length }
      };
    }
  }

  window.EventListenerRegistry = new EventListenerRegistry();
})();
