/**
 * js/animation/animation-registry.js
 * The Whispering Wilds (Kaattu Vazhi) - Production Animation Registry
 *
 * Centralized repository for all authored AnimationClips, metadata,
 * speed calibrations, contact phases, and event definitions.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationRegistry = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationRegistry {
    constructor() {
      this.clips = new Map();       // clipId -> { meta, clip: THREE.AnimationClip }
      this.aliases = new Map();     // alias -> clipId
      this.byCategory = new Map();  // category -> Set of clipId
      this.byState = new Map();     // state -> Set of clipId

      // Load authored defaults from ANIMATION_DATA if present
      if (typeof window !== 'undefined' && window.ANIMATION_DATA && window.ANIMATION_DATA.CLIPS) {
        this.loadDefaultMetadata(window.ANIMATION_DATA.CLIPS);
      }
    }

    /**
     * Initializes metadata from authored database
     */
    loadDefaultMetadata(clipDefs) {
      for (const [clipId, meta] of Object.entries(clipDefs)) {
        this.registerClip(meta, null);
      }
    }

    /**
     * Registers a clip with metadata and optional THREE.AnimationClip object
     */
    registerClip(meta, clipObj = null) {
      if (!meta || !meta.clipId) {
        throw new Error('[AnimationRegistry] Cannot register clip without valid clipId');
      }

      const clipId = meta.clipId;
      const entry = {
        clipId,
        state: meta.state || 'IDLE',
        category: meta.category || 'locomotion',
        duration: meta.duration || (clipObj ? clipObj.duration : 1.0),
        speed: meta.speed || 0.0,
        direction: meta.direction || 0.0,
        turnAngle: meta.turnAngle || 0.0,
        looping: meta.looping !== false,
        rootMotion: !!meta.rootMotion,
        priority: meta.priority || 1,
        style: meta.style || 'default',
        contactPhases: meta.contactPhases || { leftFootPlant: [], rightFootPlant: [] },
        events: Array.isArray(meta.events) ? [...meta.events] : [],
        clip: clipObj
      };

      this.clips.set(clipId, entry);

      // Index by category
      if (!this.byCategory.has(entry.category)) {
        this.byCategory.set(entry.category, new Set());
      }
      this.byCategory.get(entry.category).add(clipId);

      // Index by state
      if (!this.byState.has(entry.state)) {
        this.byState.set(entry.state, new Set());
      }
      this.byState.get(entry.state).add(clipId);

      return entry;
    }

    /**
     * Associates an alias with a canonical clipId
     */
    addAlias(alias, canonicalId) {
      if (this.clips.has(canonicalId)) {
        this.aliases.set(alias, canonicalId);
        return true;
      }
      return false;
    }

    /**
     * Retrieves clip entry by ID or alias
     */
    getClip(clipId) {
      if (!clipId) return null;
      if (this.clips.has(clipId)) {
        return this.clips.get(clipId);
      }
      if (this.aliases.has(clipId)) {
        return this.clips.get(this.aliases.get(clipId));
      }
      return null;
    }

    hasClip(clipId) {
      return this.clips.has(clipId) || this.aliases.has(clipId);
    }

    /**
     * Queries clips matching state, category, speed range, or rootMotion
     */
    queryClips(criteria = {}) {
      const results = [];
      for (const entry of this.clips.values()) {
        if (criteria.state && entry.state !== criteria.state) continue;
        if (criteria.category && entry.category !== criteria.category) continue;
        if (typeof criteria.rootMotion === 'boolean' && entry.rootMotion !== criteria.rootMotion) continue;
        if (typeof criteria.minSpeed === 'number' && entry.speed < criteria.minSpeed) continue;
        if (typeof criteria.maxSpeed === 'number' && entry.speed > criteria.maxSpeed) continue;
        results.push(entry);
      }
      return results;
    }

    /**
     * Validates all registered clips for duration, events, and contact data
     */
    validateRegisteredClips() {
      const issues = [];
      for (const [id, entry] of this.clips.entries()) {
        if (!entry.duration || entry.duration <= 0) {
          issues.push(`Clip ${id} has invalid duration: ${entry.duration}`);
        }
        if (entry.events) {
          for (const ev of entry.events) {
            if (typeof ev.time !== 'number' || ev.time < 0 || ev.time > entry.duration) {
              issues.push(`Clip ${id} event "${ev.name}" has invalid timestamp: ${ev.time}`);
            }
          }
        }
      }
      return {
        valid: issues.length === 0,
        issues,
        totalClips: this.clips.size
      };
    }

    clear() {
      this.clips.clear();
      this.aliases.clear();
      this.byCategory.clear();
      this.byState.clear();
    }
  }

  // Global singleton
  if (typeof window !== 'undefined') {
    window.ProductionAnimationRegistry = new AnimationRegistry();
  }

  return AnimationRegistry;
});
