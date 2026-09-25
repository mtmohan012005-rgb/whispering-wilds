/**
 * The Whispering Wilds - Slope System
 * Defines movement rules for slopes: walkable, difficult, non-walkable, slide.
 * Player slows on difficult terrain, is blocked by impossible surfaces,
 * and slides/stops on extreme slopes.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SlopeSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Slope Classification ───────────────────────────────────────────────────
  const SlopeClass = Object.freeze({
    FLAT:         'flat',        // 0–10°
    GENTLE:       'gentle',      // 10–25°
    WALKABLE:     'walkable',    // 25–40°
    DIFFICULT:    'difficult',   // 40–50°
    NON_WALKABLE: 'non_walkable',// 50–60°
    SLIDE:        'slide'        // >60°
  });

  /**
   * Configurable slope thresholds (degrees).
   */
  const DEFAULT_THRESHOLDS = Object.freeze({
    gentle:      25,
    walkable:    40,
    difficult:   50,
    nonWalkable: 60
    // above 60 = slide
  });

  /**
   * Movement speed modifiers for each class (multiplied against base speed).
   */
  const DEFAULT_SPEED_MODIFIERS = Object.freeze({
    [SlopeClass.FLAT]:         1.00,
    [SlopeClass.GENTLE]:       0.98,
    [SlopeClass.WALKABLE]:     0.90,
    [SlopeClass.DIFFICULT]:    0.65,
    [SlopeClass.NON_WALKABLE]: 0.00,  // Blocked
    [SlopeClass.SLIDE]:        0.00   // Forced slide/gravity
  });

  class SlopeSystem {
    /**
     * @param {Object} [opts]
     * @param {Object} [opts.thresholds]      - Custom angle thresholds
     * @param {Object} [opts.speedModifiers]  - Custom speed multipliers
     */
    constructor(opts = {}) {
      this._thresholds     = { ...DEFAULT_THRESHOLDS, ...(opts.thresholds || {}) };
      this._speedModifiers = { ...DEFAULT_SPEED_MODIFIERS, ...(opts.speedModifiers || {}) };
      this._currentClass   = SlopeClass.FLAT;
      this._currentAngle   = 0;
    }

    /**
     * Classify a slope angle (degrees) into a SlopeClass.
     * @param {number} angleDeg
     * @returns {string} SlopeClass
     */
    classify(angleDeg) {
      const t = this._thresholds;
      if (angleDeg >= t.nonWalkable) return SlopeClass.SLIDE;
      if (angleDeg >= t.difficult)   return SlopeClass.NON_WALKABLE;
      if (angleDeg >= t.walkable)    return SlopeClass.DIFFICULT;
      if (angleDeg >= t.gentle)      return SlopeClass.WALKABLE;
      if (angleDeg >= 10)            return SlopeClass.GENTLE;
      return SlopeClass.FLAT;
    }

    /**
     * Update the system with the current ground slope.
     * Called by CollisionSystem each frame when grounded.
     * @param {number} angleDeg
     */
    update(angleDeg) {
      this._currentAngle = angleDeg;
      this._currentClass = this.classify(angleDeg);
    }

    /** Returns the movement speed multiplier for the current slope. */
    getSpeedMultiplier() {
      return this._speedModifiers[this._currentClass] ?? 1.0;
    }

    /** Returns whether the player can walk forward on the current slope. */
    canWalk() {
      return this._currentClass !== SlopeClass.NON_WALKABLE &&
             this._currentClass !== SlopeClass.SLIDE;
    }

    /** Returns whether the player should slide (gravity-driven movement). */
    isSliding() {
      return this._currentClass === SlopeClass.SLIDE;
    }

    /** Returns the slide direction (downhill) given a surface normal. */
    getSlideVector(normal) {
      // Project gravity onto the slope plane
      // gravity = (0, -1, 0)
      // slide = gravity - (gravity · normal) * normal
      const dot = -normal.y; // gravity·normal = (0,-1,0)·(nx,ny,nz) = -ny
      return {
        x: -normal.x * dot,
        y: -1 - (-normal.y * dot),
        z: -normal.z * dot
      };
    }

    getSlopeClass()  { return this._currentClass; }
    getSlopeAngle()  { return this._currentAngle; }
  }

  return { SlopeClass, DEFAULT_THRESHOLDS, DEFAULT_SPEED_MODIFIERS, SlopeSystem };
});
