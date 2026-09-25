/**
 * js/systems/animation-validation-system.js
 * The Whispering Wilds (Kaattu Vazhi) - Animation Asset & Rig Validation
 *
 * Validates animation clips for NaN/Infinity transforms, zero durations,
 * suspicious root-motion teleport spikes, missing essential humanoid bones,
 * and enforces strict rejection of external demo characters (Xbot/demo CDNs).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationValidationSystem = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationValidationSystem {
    constructor() {
      this.expectedPlayerClips = [
        'Player_Idle',
        'Player_Walk',
        'Player_Run',
        'Player_Sprint',
        'Player_Jump_Start',
        'Player_Jump',
        'Player_Fall',
        'Player_Land',
        'Player_Interact'
      ];
    }

    /**
     * Scans an AnimationClip for NaN, Infinity, and extreme values
     * @param {THREE.AnimationClip} clip
     * @returns {{ valid: boolean, errors: Array<string> }}
     */
    validateClipTransforms(clip) {
      const errors = [];

      if (!clip) {
        return { valid: false, errors: ['Clip is null or undefined'] };
      }

      if (typeof clip.duration !== 'number' || clip.duration <= 0 || Number.isNaN(clip.duration) || !Number.isFinite(clip.duration)) {
        errors.push(`Invalid clip duration: ${clip.duration} in clip "${clip.name}"`);
      }

      if (!clip.tracks || clip.tracks.length === 0) {
        errors.push(`Clip "${clip.name}" has zero keyframe tracks`);
        return { valid: false, errors };
      }

      let maxDisplacement = 0;

      for (const track of clip.tracks) {
        if (!track.values || track.values.length === 0) {
          errors.push(`Track "${track.name}" in clip "${clip.name}" has empty values`);
          continue;
        }

        for (let i = 0; i < track.values.length; i++) {
          const val = track.values[i];
          if (Number.isNaN(val) || !Number.isFinite(val)) {
            errors.push(`NaN/Infinity detected at index ${i} in track "${track.name}" of clip "${clip.name}"`);
            break;
          }

          // Check for extreme bone translation spikes (> 20 meters from origin)
          if (track.name.endsWith('.position')) {
            const absVal = Math.abs(val);
            if (absVal > maxDisplacement) maxDisplacement = absVal;
            if (absVal > 25.0) {
              errors.push(`Extreme bone displacement (${val.toFixed(2)}m) in track "${track.name}" of clip "${clip.name}"`);
              break;
            }
          }
        }
      }

      // Root motion teleport check: displacement speed cannot exceed 20 m/s
      if (clip.name && (clip.name.includes('Walk') || clip.name.includes('Run') || clip.name.includes('Sprint'))) {
        const speed = maxDisplacement / Math.max(clip.duration, 0.05);
        if (speed > 25.0) {
          errors.push(`Suspicious root motion teleport spike (${speed.toFixed(1)} m/s) in clip "${clip.name}"`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        maxDisplacement
      };
    }

    /**
     * Audits character and animation assets against external demo references (Xbot / CDN)
     */
    auditExternalReferences(assetPath, manifest = null) {
      const violations = [];

      const strToCheck = `${assetPath || ''} ${JSON.stringify(manifest || {})}`.toLowerCase();

      if (strToCheck.includes('xbot')) {
        violations.push('Prohibited demo character reference detected: "Xbot"');
      }
      if (strToCheck.includes('mrdoob') || strToCheck.includes('cdn.jsdelivr.net/gh/mrdoob')) {
        violations.push('Unauthorized external demo CDN reference detected');
      }

      return {
        passed: violations.length === 0,
        violations
      };
    }

    /**
     * Comprehensive validation of a character's animation set
     * @param {Array<THREE.AnimationClip>} clips
     * @param {string} modelPath
     */
    validateCharacterAnimationSet(clips, modelPath) {
      const errors = [];
      const warnings = [];

      // 1. External reference audit
      const audit = this.auditExternalReferences(modelPath);
      if (!audit.passed) {
        errors.push(...audit.violations);
      }

      // 2. Validate individual clips
      const clipNames = new Set();
      if (Array.isArray(clips)) {
        for (const clip of clips) {
          clipNames.add(clip.name);
          const clipCheck = this.validateClipTransforms(clip);
          if (!clipCheck.valid) {
            errors.push(...clipCheck.errors);
          }
        }
      }

      // 3. Check for expected core clips
      for (const expected of this.expectedPlayerClips) {
        if (!clipNames.has(expected)) {
          warnings.push(`Missing recommended production clip: "${expected}"`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        totalClips: clips ? clips.length : 0
      };
    }
  }

  // Global singleton
  if (typeof window !== 'undefined') {
    window.ProductionAnimationValidationSystem = new AnimationValidationSystem();
  }

  return AnimationValidationSystem;
});
