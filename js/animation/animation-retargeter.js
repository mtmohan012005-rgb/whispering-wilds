/**
 * js/animation/animation-retargeter.js
 * The Whispering Wilds (Kaattu Vazhi) - Animation Retargeting & Bone Remapping
 *
 * Remaps animation tracks between standard humanoid skeletons (Mixamo, Rigify, Unreal)
 * and the canonical production player/NPC rig ('assets/characters/player/player.glb').
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationRetargeter = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationRetargeter {
    constructor(retargetData = null) {
      this.retargetData = retargetData || (typeof window !== 'undefined' ? window.RETARGET_DATA : null);
      this.canonicalRig = this.retargetData ? this.retargetData.canonicalRig : null;
      this.sourceMappings = this.retargetData ? this.retargetData.SOURCE_MAPPINGS : {};
    }

    /**
     * Validates a skeleton against the canonical rig specification
     * @param {THREE.Skeleton|Array<string>} skeletonOrBoneNames
     * @returns {{ valid: boolean, missingBones: Array<string> }}
     */
    validateSkeleton(skeletonOrBoneNames) {
      const names = Array.isArray(skeletonOrBoneNames)
        ? skeletonOrBoneNames
        : (skeletonOrBoneNames && skeletonOrBoneNames.bones ? skeletonOrBoneNames.bones.map(b => b.name) : []);

      const boneSet = new Set(names);
      const required = this.canonicalRig ? this.canonicalRig.requiredBones : [
        'Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head',
        'LeftArm', 'LeftForeArm', 'LeftHand',
        'RightArm', 'RightForeArm', 'RightHand',
        'LeftUpLeg', 'LeftLeg', 'LeftFoot',
        'RightUpLeg', 'RightLeg', 'RightFoot'
      ];

      const missing = required.filter(b => !boneSet.has(b));
      return {
        valid: missing.length === 0,
        missingBones: missing,
        boneCount: names.length
      };
    }

    /**
     * Detects source format (mixamo, blender_rigify, unreal_mannequin, or canonical)
     */
    detectSourceFormat(trackNames) {
      let mixamoCount = 0;
      let rigifyCount = 0;
      let unrealCount = 0;
      let canonicalCount = 0;

      for (const track of trackNames) {
        if (track.includes('mixamorig:')) mixamoCount++;
        else if (track.includes('.L') || track.includes('.R') || track.includes('spine')) rigifyCount++;
        else if (track.includes('clavicle_') || track.includes('upperarm_')) unrealCount++;
        else canonicalCount++;
      }

      if (mixamoCount > 5) return 'mixamo';
      if (rigifyCount > 5) return 'blender_rigify';
      if (unrealCount > 5) return 'unreal_mannequin';
      return 'canonical';
    }

    /**
     * Retargets a THREE.AnimationClip from a recognized source format to canonical bone names
     * @param {THREE.AnimationClip} sourceClip
     * @param {string} sourceFormatOverride
     * @param {number} scaleFactor - Position track multiplier (e.g. 1.0 or 0.01 for cm->m)
     * @returns {THREE.AnimationClip} Retargeted animation clip
     */
    retargetClip(sourceClip, sourceFormatOverride = null, scaleFactor = 1.0) {
      if (!sourceClip || !Array.isArray(sourceClip.tracks)) {
        throw new Error('[AnimationRetargeter] Invalid source clip supplied for retargeting');
      }

      const trackNames = sourceClip.tracks.map(t => t.name);
      const format = sourceFormatOverride || this.detectSourceFormat(trackNames);
      const mapping = this.sourceMappings[format] || {};

      const retargetedTracks = [];

      for (const track of sourceClip.tracks) {
        // Track format: "boneName.property" (e.g. "mixamorig:Hips.position")
        const dotIndex = track.name.lastIndexOf('.');
        if (dotIndex === -1) continue;

        const boneName = track.name.substring(0, dotIndex);
        const property = track.name.substring(dotIndex);

        // Map to canonical bone name
        const canonicalBone = mapping[boneName] || boneName;
        const newTrackName = `${canonicalBone}${property}`;

        // Clone track
        const clonedTrack = track.clone();
        clonedTrack.name = newTrackName;

        // Apply position scaling if this is a position track
        if (property === '.position' && scaleFactor !== 1.0) {
          for (let i = 0; i < clonedTrack.values.length; i++) {
            clonedTrack.values[i] *= scaleFactor;
          }
        }

        retargetedTracks.push(clonedTrack);
      }

      // If THREE is available, construct genuine THREE.AnimationClip
      if (typeof THREE !== 'undefined' && THREE.AnimationClip) {
        return new THREE.AnimationClip(
          sourceClip.name,
          sourceClip.duration,
          retargetedTracks
        );
      }

      return {
        name: sourceClip.name,
        duration: sourceClip.duration,
        tracks: retargetedTracks
      };
    }
  }

  return AnimationRetargeter;
});
