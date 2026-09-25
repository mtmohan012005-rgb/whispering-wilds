/**
 * tests/animation/test-retargeting.js
 * Verifies humanoid skeleton validation, source format detection (Mixamo/Rigify/Unreal),
 * and bone track remapping to canonical hierarchy.
 */

(function () {
  'use strict';

  function runTestRetargeting() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const AnimationRetargeter = window.AnimationRetargeter;
    assert('AnimationRetargeter class is available', !!AnimationRetargeter);

    const retargeter = new AnimationRetargeter();

    // 1. Validate complete canonical skeleton
    const fullRigBones = [
      'Root', 'Hips', 'Spine', 'Spine1', 'Chest', 'Neck', 'Head',
      'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
      'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
      'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
      'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'
    ];
    const fullRigCheck = retargeter.validateSkeleton(fullRigBones);
    assert('Complete canonical skeleton passes validation', fullRigCheck.valid === true);

    // 2. Reject incomplete rig
    const brokenRigBones = ['Root', 'Hips', 'Spine']; // Missing limbs
    const brokenRigCheck = retargeter.validateSkeleton(brokenRigBones);
    assert('Incomplete rig fails validation with missing limbs flagged', brokenRigCheck.valid === false && brokenRigCheck.missingBones.length > 5);

    // 3. Format detection
    const mixamoTracks = [
      'mixamorig:Hips.position',
      'mixamorig:Spine.quaternion',
      'mixamorig:LeftArm.quaternion',
      'mixamorig:RightArm.quaternion',
      'mixamorig:LeftLeg.quaternion',
      'mixamorig:RightLeg.quaternion'
    ];
    assert('Detects Mixamo source format', retargeter.detectSourceFormat(mixamoTracks) === 'mixamo');

    // 4. Retargeting track remapping
    const mockMixamoClip = {
      name: 'Mixamo_Walk',
      duration: 1.2,
      tracks: [
        {
          name: 'mixamorig:Hips.position',
          values: [0, 95, 0], // In centimeters
          clone: function() { return { ...this, values: [...this.values] }; }
        },
        {
          name: 'mixamorig:Spine.quaternion',
          values: [0, 0, 0, 1],
          clone: function() { return { ...this, values: [...this.values] }; }
        },
        {
          name: 'mixamorig:LeftArm.quaternion',
          values: [0.1, 0, 0, 0.99],
          clone: function() { return { ...this, values: [...this.values] }; }
        }
      ]
    };

    const retargeted = retargeter.retargetClip(mockMixamoClip, 'mixamo', 0.01); // 0.01 scale for cm -> meters
    assert('Retargeted clip has matching track count', retargeted.tracks.length === 3);
    assert('mixamorig:Hips remapped to Hips', retargeted.tracks[0].name === 'Hips.position');
    assert('mixamorig:Spine remapped to Spine', retargeted.tracks[1].name === 'Spine.quaternion');
    assert('mixamorig:LeftArm remapped to LeftArm', retargeted.tracks[2].name === 'LeftArm.quaternion');

    // Scale check: 95cm -> 0.95m
    assert('Position values scaled from cm to meters (95 -> 0.95)', Math.abs(retargeted.tracks[0].values[1] - 0.95) < 0.001);

    return results;
  }

  window.runTestRetargeting = runTestRetargeting;
})();
