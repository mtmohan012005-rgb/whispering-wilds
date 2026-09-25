/**
 * js/animation/animation-blender.js
 * The Whispering Wilds (Kaattu Vazhi) - Animation Cross-Fading & Blend Tree
 *
 * Coordinates non-popping cross-fades, stride-phase synchronization between
 * cyclic gaits (walk, run, sprint), and transition duration matrices.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationBlender = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationBlender {
    constructor(mixer = null) {
      this.mixer = mixer;
      this.currentAction = null;
      this.currentClipId = null;
      this.fadeDuration = 0.25;

      // Transition matrix defining optimal blend times (seconds)
      this.transitionDurations = {
        'IDLE->START': 0.15,
        'START->WALK': 0.2,
        'WALK->FAST_WALK': 0.2,
        'FAST_WALK->RUN': 0.18,
        'RUN->SPRINT': 0.15,
        'SPRINT->RUN': 0.2,
        'RUN->WALK': 0.22,
        'WALK->STOP': 0.15,
        'RUN->STOP': 0.15,
        'STOP->IDLE': 0.2,
        'IDLE->CROUCH': 0.3,
        'CROUCH->IDLE': 0.3,
        'ANY->JUMP': 0.1,
        'JUMP->FALL': 0.2,
        'FALL->LAND': 0.08,
        'LAND->IDLE': 0.25,
        'LAND->WALK': 0.2,
        'ANY->INTERACT': 0.2,
        'INTERACT->IDLE': 0.25,
        'DEFAULT': 0.25
      };

      // Cyclic clips that require phase alignment
      this.cyclicClips = new Set([
        'Player_Walk',
        'Player_Fast_Walk',
        'Player_Run',
        'Player_Sprint',
        'Player_Crouch_Walk',
        'Player_Backward'
      ]);
    }

    setMixer(mixer) {
      this.mixer = mixer;
    }

    /**
     * Calculates calibrated blend time between two animation states
     */
    getBlendDuration(fromState, toState) {
      if (!fromState) return 0.2;
      const key = `${fromState}->${toState}`;
      if (this.transitionDurations[key]) {
        return this.transitionDurations[key];
      }
      const anyKey = `ANY->${toState}`;
      if (this.transitionDurations[anyKey]) {
        return this.transitionDurations[anyKey];
      }
      return this.transitionDurations['DEFAULT'];
    }

    /**
     * Crossfades into the target action smoothly, synchronizing stride phase if cyclic.
     */
    transitionToAction(targetAction, targetClipId, fromState, toState, customDuration = null) {
      if (!targetAction) return false;
      if (this.currentAction === targetAction) return true;

      const duration = typeof customDuration === 'number'
        ? customDuration
        : this.getBlendDuration(fromState, toState);

      const prevAction = this.currentAction;
      const prevClipId = this.currentClipId;

      targetAction.enabled = true;
      targetAction.setEffectiveTimeScale(1.0);
      targetAction.setEffectiveWeight(1.0);

      // Phase-sync locomotion clips to prevent stride snapping
      if (prevAction && this.cyclicClips.has(prevClipId) && this.cyclicClips.has(targetClipId)) {
        const prevDuration = prevAction.getClip().duration;
        const targetDuration = targetAction.getClip().duration;
        if (prevDuration > 0 && targetDuration > 0) {
          const normalizedPhase = (prevAction.time % prevDuration) / prevDuration;
          targetAction.time = normalizedPhase * targetDuration;
        }
      } else {
        targetAction.time = 0.0;
      }

      if (prevAction) {
        targetAction.crossFadeFrom(prevAction, duration, true);
      }
      targetAction.play();

      this.currentAction = targetAction;
      this.currentClipId = targetClipId;
      this.fadeDuration = duration;

      return true;
    }

    /**
     * Immediate hard cut without cross-fade (e.g. for teleport, hard reset)
     */
    cutToAction(targetAction, targetClipId) {
      if (!targetAction) return false;
      if (this.currentAction) {
        this.currentAction.stop();
      }
      targetAction.reset();
      targetAction.setEffectiveWeight(1.0);
      targetAction.play();

      this.currentAction = targetAction;
      this.currentClipId = targetClipId;
      return true;
    }

    stopAll() {
      if (this.mixer) {
        this.mixer.stopAllAction();
      }
      this.currentAction = null;
      this.currentClipId = null;
    }
  }

  return AnimationBlender;
});
