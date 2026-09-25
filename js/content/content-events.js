// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT EVENT BUS
// Event-driven decoupled communication bus for quest objectives, world events,
// cultural activities, wildlife interactions, and dialogue progression.
// ============================================================================

(function () {
  'use strict';

  class ContentEvents {
    constructor() {
      this.listeners = new Map(); // eventName -> Set(callback)
      this.history = []; // Debug event ring-buffer
      this.maxHistory = 100;
      this.isPaused = false;
    }

    /**
     * Subscribe to a specific content event
     */
    on(eventName, callback) {
      if (typeof callback !== 'function') return () => {};
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }
      this.listeners.get(eventName).add(callback);

      return () => this.off(eventName, callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(eventName, callback) {
      if (this.listeners.has(eventName)) {
        this.listeners.get(eventName).delete(callback);
      }
    }

    /**
     * Subscribe to an event once
     */
    once(eventName, callback) {
      const unsubscribe = this.on(eventName, (...args) => {
        unsubscribe();
        callback(...args);
      });
      return unsubscribe;
    }

    /**
     * Emit a content event with payload
     */
    emit(eventName, payload = {}) {
      if (this.isPaused) return;

      const eventRecord = {
        name: eventName,
        payload: { ...payload },
        timestamp: Date.now()
      };

      this.history.push(eventRecord);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      if (this.listeners.has(eventName)) {
        for (const cb of this.listeners.get(eventName)) {
          try {
            cb(payload);
          } catch (err) {
            console.error(`[ContentEvents] Error in listener for '${eventName}':`, err);
          }
        }
      }

      // Also fire wild-card listener '*' if registered
      if (this.listeners.has('*')) {
        for (const cb of this.listeners.get('*')) {
          try {
            cb(eventName, payload);
          } catch (err) {
            console.error(`[ContentEvents] Error in wildcard listener for '${eventName}':`, err);
          }
        }
      }

      // Mirror to DOM window event for devtools/UI
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        try {
          window.dispatchEvent(new CustomEvent(`content:${eventName}`, { detail: payload }));
        } catch (_) {}
      }
    }

    /**
     * Canonical Event Dispatchers for Objectives
     */
    reachLocation(locationId, coords = {}) {
      this.emit('reach_location', { locationId, coords });
    }

    interactObject(objectId, objectType, coords = {}) {
      this.emit('interact_object', { objectId, objectType, coords });
    }

    talkNPC(npcId, dialogueId = null) {
      this.emit('talk_npc', { npcId, dialogueId });
    }

    collectItem(itemId, count = 1) {
      this.emit('collect_item', { itemId, count });
    }

    inspectClue(clueId, topic = null) {
      this.emit('inspect_clue', { clueId, topic });
    }

    photographSubject(subjectId, photoData = {}) {
      this.emit('photograph_subject', { subjectId, photoData });
    }

    surviveWeatherEvent(weatherType, durationSeconds = 0) {
      this.emit('survive_weather', { weatherType, durationSeconds });
    }

    completeCulturalActivity(activityId, score = 1.0, details = {}) {
      this.emit('complete_cultural_activity', { activityId, score, details });
    }

    discoverWildlife(speciesId, coords = {}, behavior = 'idle') {
      this.emit('discover_wildlife', { speciesId, coords, behavior });
    }

    deliverItem(npcId, itemId, count = 1) {
      this.emit('deliver_item', { npcId, itemId, count });
    }

    escortNPC(npcId, destinationLocationId) {
      this.emit('escort_npc', { npcId, destinationLocationId });
    }

    investigateArea(regionId, areaId, cluesFound = []) {
      this.emit('investigate_area', { regionId, areaId, cluesFound });
    }

    solvePuzzle(puzzleId, stepsUsed = 0) {
      this.emit('solve_puzzle', { puzzleId, stepsUsed });
    }

    craftItem(recipeId, craftedItemId) {
      this.emit('craft_item', { recipeId, craftedItemId });
    }

    visitLandmark(landmarkId, regionId) {
      this.emit('visit_landmark', { landmarkId, regionId });
    }

    waitUntilTime(timeOfDay, dayNumber = null) {
      this.emit('wait_until_time', { timeOfDay, dayNumber });
    }

    returnToNPC(npcId) {
      this.emit('return_to_npc', { npcId });
    }

    chooseDialogueOption(dialogueId, optionId, branchId) {
      this.emit('choose_dialogue_option', { dialogueId, optionId, branchId });
    }

    /**
     * Clear all registered listeners
     */
    clear() {
      this.listeners.clear();
      this.history = [];
    }
  }

  const instance = new ContentEvents();

  if (typeof window !== 'undefined') {
    window.ContentEvents = instance;
    window.contentEvents = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
