/**
 * The Whispering Wilds (Kaattu Vazhi) - Core Event Bus
 * Lightweight, high-performance, typed event bus for decoupled system communication.
 * Prevents memory leaks with structured subscription handles and auto-cleanup.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const bus = factory();
    root.EventBus = bus;
    root.GameEventBus = bus;
    if (typeof window !== 'undefined') {
      window.EventBus = bus;
      window.GameEventBus = bus;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Canonical Event Types
  const EVENTS = Object.freeze({
    // Player
    PLAYER_MOVED: 'PLAYER_MOVED',
    PLAYER_INTERACTED: 'PLAYER_INTERACTED',
    PLAYER_DIED: 'PLAYER_DIED',
    PLAYER_CUSTOMIZED: 'PLAYER_CUSTOMIZED',

    // Quests
    QUEST_STARTED: 'QUEST_STARTED',
    OBJECTIVE_COMPLETED: 'OBJECTIVE_COMPLETED',
    QUEST_COMPLETED: 'QUEST_COMPLETED',
    QUEST_FAILED: 'QUEST_FAILED',

    // Inventory & Economy
    ITEM_ADDED: 'ITEM_ADDED',
    ITEM_REMOVED: 'ITEM_REMOVED',
    CURRENCY_CHANGED: 'CURRENCY_CHANGED',
    TRANSACTION_COMMITTED: 'TRANSACTION_COMMITTED',

    // World & Exploration
    LOCATION_DISCOVERED: 'LOCATION_DISCOVERED',
    WILDLIFE_DISCOVERED: 'WILDLIFE_DISCOVERED',
    WEATHER_CHANGED: 'WEATHER_CHANGED',
    TIME_CHANGED: 'TIME_CHANGED',
    WORLD_EVENT_STARTED: 'WORLD_EVENT_STARTED',
    WORLD_EVENT_FINISHED: 'WORLD_EVENT_FINISHED',
    REGION_CHANGED: 'REGION_CHANGED',
    SECTOR_STREAMED: 'SECTOR_STREAMED',

    // Dialogue & NPCs
    NPC_DIALOGUE_STARTED: 'NPC_DIALOGUE_STARTED',
    NPC_DIALOGUE_ENDED: 'NPC_DIALOGUE_ENDED',
    DIALOGUE_CHOICE_SELECTED: 'DIALOGUE_CHOICE_SELECTED',

    // Transport & Traversal
    VEHICLE_ENTERED: 'VEHICLE_ENTERED',
    VEHICLE_EXITED: 'VEHICLE_EXITED',

    // Save & State
    SAVE_STARTED: 'SAVE_STARTED',
    SAVE_COMPLETED: 'SAVE_COMPLETED',
    SAVE_FAILED: 'SAVE_FAILED',

    // Game Lifecycle
    GAME_PAUSED: 'GAME_PAUSED',
    GAME_RESUMED: 'GAME_RESUMED',
    GAME_MODE_CHANGED: 'GAME_MODE_CHANGED'
  });

  class EventBusEngine {
    constructor() {
      this._listeners = new Map();
      this._onceListeners = new Map();
      this.EVENTS = EVENTS;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     * @param {Object} context - Optional execution context
     * @returns {Function} Unsubscribe function
     */
    on(event, handler, context = null) {
      if (!event || typeof handler !== 'function') return () => {};

      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }

      const subscription = { handler, context };
      this._listeners.get(event).push(subscription);

      // Return unsubscribe function
      return () => this.off(event, handler);
    }

    /**
     * Subscribe to an event once
     */
    once(event, handler, context = null) {
      if (!event || typeof handler !== 'function') return () => {};

      if (!this._onceListeners.has(event)) {
        this._onceListeners.set(event, []);
      }

      this._onceListeners.get(event).push({ handler, context });
      return () => this.off(event, handler);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, handler) {
      if (!event) return;

      if (this._listeners.has(event)) {
        if (!handler) {
          this._listeners.delete(event);
        } else {
          const list = this._listeners.get(event);
          const filtered = list.filter(sub => sub.handler !== handler);
          if (filtered.length > 0) {
            this._listeners.set(event, filtered);
          } else {
            this._listeners.delete(event);
          }
        }
      }

      if (this._onceListeners.has(event)) {
        if (!handler) {
          this._onceListeners.delete(event);
        } else {
          const list = this._onceListeners.get(event);
          const filtered = list.filter(sub => sub.handler !== handler);
          if (filtered.length > 0) {
            this._onceListeners.set(event, filtered);
          } else {
            this._onceListeners.delete(event);
          }
        }
      }
    }

    /**
     * Emit an event to all subscribers
     */
    emit(event, payload = null) {
      if (!event) return;

      // Regular listeners
      const subs = this._listeners.get(event);
      if (subs && subs.length > 0) {
        // Clone array to prevent issues if a listener removes itself
        const subsCopy = [...subs];
        for (let i = 0; i < subsCopy.length; i++) {
          const { handler, context } = subsCopy[i];
          try {
            if (context) {
              handler.call(context, payload);
            } else {
              handler(payload);
            }
          } catch (err) {
            console.error(`[EventBus] Error in '${event}' handler:`, err);
          }
        }
      }

      // One-time listeners
      const onceSubs = this._onceListeners.get(event);
      if (onceSubs && onceSubs.length > 0) {
        this._onceListeners.delete(event);
        for (let i = 0; i < onceSubs.length; i++) {
          const { handler, context } = onceSubs[i];
          try {
            if (context) {
              handler.call(context, payload);
            } else {
              handler(payload);
            }
          } catch (err) {
            console.error(`[EventBus] Error in '${event}' once-handler:`, err);
          }
        }
      }
    }

    /**
     * Clear all listeners for an event or all events
     */
    clear(event = null) {
      if (event) {
        this._listeners.delete(event);
        this._onceListeners.delete(event);
      } else {
        this._listeners.clear();
        this._onceListeners.clear();
      }
    }

    /**
     * Get count of listeners for an event
     */
    listenerCount(event) {
      const reg = this._listeners.get(event)?.length || 0;
      const onc = this._onceListeners.get(event)?.length || 0;
      return reg + onc;
    }

    destroy() {
      this.clear();
    }
  }

  return new EventBusEngine();
});
