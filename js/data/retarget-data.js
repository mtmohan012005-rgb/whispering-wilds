/**
 * js/data/retarget-data.js
 * The Whispering Wilds (Kaattu Vazhi) - Animation Retargeting & Skeleton Mapping
 *
 * Defines the canonical humanoid skeleton bone hierarchy, standard bone aliases,
 * retargeting tables from external sources, and anatomical joint rotation limits.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RETARGET_DATA = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RETARGET_DATA = {
    // Canonical production rig standard
    canonicalRig: {
      name: 'humanoid_production_rig',
      rootBone: 'Root',
      pelvisBone: 'Hips',
      referenceHeightMeters: 1.78,
      restPose: 'T_POSE',

      requiredBones: [
        'Root',
        'Hips',
        'Spine',
        'Spine1',
        'Chest',
        'Neck',
        'Head',
        'LeftShoulder',
        'LeftArm',
        'LeftForeArm',
        'LeftHand',
        'RightShoulder',
        'RightArm',
        'RightForeArm',
        'RightHand',
        'LeftUpLeg',
        'LeftLeg',
        'LeftFoot',
        'LeftToeBase',
        'RightUpLeg',
        'RightLeg',
        'RightFoot',
        'RightToeBase'
      ],

      optionalBones: [
        'Spine2',
        'LeftEye',
        'RightEye',
        'Jaw',
        'Cloth_Veshti_Front_01',
        'Cloth_Veshti_Front_02',
        'Cloth_Veshti_Back_01',
        'Cloth_Veshti_Back_02',
        'Cloth_Thundu_Front_01',
        'Cloth_Thundu_Front_02',
        'Cloth_Thundu_Back_01'
      ],

      hierarchy: {
        Root: null,
        Hips: 'Root',
        Spine: 'Hips',
        Spine1: 'Spine',
        Spine2: 'Spine1',
        Chest: 'Spine1',
        Neck: 'Chest',
        Head: 'Neck',

        LeftShoulder: 'Chest',
        LeftArm: 'LeftShoulder',
        LeftForeArm: 'LeftArm',
        LeftHand: 'LeftForeArm',

        RightShoulder: 'Chest',
        RightArm: 'RightShoulder',
        RightForeArm: 'RightArm',
        RightHand: 'RightForeArm',

        LeftUpLeg: 'Hips',
        LeftLeg: 'LeftUpLeg',
        LeftFoot: 'LeftLeg',
        LeftToeBase: 'LeftFoot',

        RightUpLeg: 'Hips',
        RightLeg: 'RightUpLeg',
        RightFoot: 'RightLeg',
        RightToeBase: 'RightFoot'
      }
    },

    // Source Rig to Canonical Mapping Tables
    SOURCE_MAPPINGS: {
      mixamo: {
        'mixamorig:Hips': 'Hips',
        'mixamorig:Spine': 'Spine',
        'mixamorig:Spine1': 'Spine1',
        'mixamorig:Spine2': 'Chest',
        'mixamorig:Neck': 'Neck',
        'mixamorig:Head': 'Head',
        'mixamorig:LeftShoulder': 'LeftShoulder',
        'mixamorig:LeftArm': 'LeftArm',
        'mixamorig:LeftForeArm': 'LeftForeArm',
        'mixamorig:LeftHand': 'LeftHand',
        'mixamorig:RightShoulder': 'RightShoulder',
        'mixamorig:RightArm': 'RightArm',
        'mixamorig:RightForeArm': 'RightForeArm',
        'mixamorig:RightHand': 'RightHand',
        'mixamorig:LeftUpLeg': 'LeftUpLeg',
        'mixamorig:LeftLeg': 'LeftLeg',
        'mixamorig:LeftFoot': 'LeftFoot',
        'mixamorig:LeftToeBase': 'LeftToeBase',
        'mixamorig:RightUpLeg': 'RightUpLeg',
        'mixamorig:RightLeg': 'RightLeg',
        'mixamorig:RightFoot': 'RightFoot',
        'mixamorig:RightToeBase': 'RightToeBase'
      },

      blender_rigify: {
        'torso': 'Hips',
        'spine': 'Spine',
        'chest': 'Chest',
        'neck': 'Neck',
        'head': 'Head',
        'shoulder.L': 'LeftShoulder',
        'upper_arm.L': 'LeftArm',
        'forearm.L': 'LeftForeArm',
        'hand.L': 'LeftHand',
        'shoulder.R': 'RightShoulder',
        'upper_arm.R': 'RightArm',
        'forearm.R': 'RightForeArm',
        'hand.R': 'RightHand',
        'thigh.L': 'LeftUpLeg',
        'shin.L': 'LeftLeg',
        'foot.L': 'LeftFoot',
        'toe.L': 'LeftToeBase',
        'thigh.R': 'RightUpLeg',
        'shin.R': 'RightLeg',
        'foot.R': 'RightFoot',
        'toe.R': 'RightToeBase'
      },

      unreal_mannequin: {
        'pelvis': 'Hips',
        'spine_01': 'Spine',
        'spine_02': 'Spine1',
        'spine_03': 'Chest',
        'neck_01': 'Neck',
        'head': 'Head',
        'clavicle_l': 'LeftShoulder',
        'upperarm_l': 'LeftArm',
        'lowerarm_l': 'LeftForeArm',
        'hand_l': 'LeftHand',
        'clavicle_r': 'RightShoulder',
        'upperarm_r': 'RightArm',
        'lowerarm_r': 'RightForeArm',
        'hand_r': 'RightHand',
        'thigh_l': 'LeftUpLeg',
        'calf_l': 'LeftLeg',
        'foot_l': 'LeftFoot',
        'ball_l': 'LeftToeBase',
        'thigh_r': 'RightUpLeg',
        'calf_r': 'RightLeg',
        'foot_r': 'RightFoot',
        'ball_r': 'RightToeBase'
      }
    },

    // Anatomical Joint Limits for Procedural IK & Look-At
    JOINT_LIMITS: {
      neck: { minPitch: -0.6, maxPitch: 0.7, maxYaw: 1.25, maxRoll: 0.4 }, // Radians
      head: { minPitch: -0.4, maxPitch: 0.5, maxYaw: 0.8, maxRoll: 0.3 },
      spine: { minPitch: -0.35, maxPitch: 0.45, maxYaw: 0.5, maxRoll: 0.3 },
      knee: { minAngle: 0.0, maxAngle: 2.45 }, // Flexion in radians (0 to ~140 deg)
      elbow: { minAngle: 0.0, maxAngle: 2.35 },
      footPitch: { minPitch: -0.6, maxPitch: 0.7 } // Slope ground adaptation
    }
  };

  return RETARGET_DATA;
});
