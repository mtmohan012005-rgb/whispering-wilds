/**
 * js/animation/animation-events.js
 * The Whispering Wilds (Kaattu Vazhi) - Animation Event Dispatcher
 *
 * Tracks clip playback positions, detects event time threshold crossings,
 * and routes events (FOOTSTEP, CONTACT, GRAB, RELEASE, LAND, INTERACTION_COMPLETE)
 * to AudioManager, InteractionSystem, and TransportSystem.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationEvents = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const EVENT_NAMES = {
    FOOTSTEP: 'FOOTSTEP',
    CONTACT: 'CONTACT',
    GRAB: 'GRAB',
    RELEASE: 'RELEASE',
    LAND: 'LAND',
    INTERACTION_COMPLETE: 'INTERACTION_COMPLETE',
    MOUNT: 'MOUNT',
    DISMOUNT: 'DISMOUNT'
  };

  class AnimationEvents {
    constructor() {
      this.listeners = new Map(); // eventName -> Set of callbacks
      this.triggeredThisCycle = new Set();
      this.prevTime = 0.0;
    }

    /**
     * Subscribes a listener to a specific animation event
     */
    addEventListener(eventName, callback) {
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }
      this.listeners.get(eventName).add(callback);
      return () => this.removeEventListener(eventName, callback);
    }

    removeEventListener(eventName, callback) {
      if (this.listeners.has(eventName)) {
        this.listeners.get(eventName).delete(callback);
      }
    }

    /**
     * Dispatches an animation event to subscribers and system singletons
     */
    dispatchEvent(eventName, payload = {}) {
      const fullEvent = {
        name: eventName,
        timestamp: Date.now(),
        ...payload
      };

      // 1. Direct subscribers
      if (this.listeners.has(eventName)) {
        for (const cb of this.listeners.get(eventName)) {
          try {
            cb(fullEvent);
          } catch (e) {
            console.warn(`[AnimationEvents] Listener error on "${eventName}":`, e);
          }
        }
      }

      // 2. Authoritative system routing (Section 65, 148)
      if (typeof window !== 'undefined') {
        if (eventName === EVENT_NAMES.FOOTSTEP) {
          if (window.AudioManager && typeof window.AudioManager.playFootstep === 'function') {
            window.AudioManager.playFootstep(payload.surface || 'ground', payload.intensity || 0.7);
          }
        } else if (eventName === EVENT_NAMES.LAND) {
          if (window.AudioManager && typeof window.AudioManager.playLandImpact === 'function') {
            window.AudioManager.playLandImpact(payload.surface || 'ground', payload.intensity || 1.0);
          }
        } else if (eventName === EVENT_NAMES.INTERACTION_COMPLETE) {
          if (window.InteractionSystem && typeof window.InteractionSystem.onAnimationComplete === 'function') {
            window.InteractionSystem.onAnimationComplete(payload);
          }
        }
      }

      return fullEvent;
    }

    /**
     * Evaluates clip events against playback delta
     * @param {Array<Object>} events - Defined events for clip
     * @param {number} currentTime - Current action time
     * @param {number} duration - Clip duration
     */
    update(events, currentTime, duration) {
      if (!events || events.length === 0) {
        this.prevTime = currentTime;
        return;
      }

      // Detect wrap-around on looping animations
      if (currentTime < this.prevTime) {
        this.triggeredThisCycle.clear();
      }

      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const eventKey = `${ev.name}_${ev.time.toFixed(3)}`;

        // Trigger if timestamp was crossed in this frame
        if (!this.triggeredThisCycle.has(eventKey)) {
          if ((this.prevTime <= ev.time && currentTime >= ev.time) ||
              (currentTime < this.prevTime && (ev.time >= this.prevTime || ev.time <= currentTime))) {
            
            this.triggeredThisCycle.add(eventKey);
            this.dispatchEvent(ev.name, ev);
          }
        }
      }

      this.prevTime = currentTime;
    }

    reset() {
      this.triggeredThisCycle.clear();
      this.prevTime = 0.0;
    }
  }

  AnimationEvents.EVENT_NAMES = EVENT_NAMES;

  return AnimationEvents;
});
