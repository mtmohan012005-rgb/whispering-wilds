/**
 * js/animation/upper-body-layer.js
 * The Whispering Wilds (Kaattu Vazhi) - Upper-Body Animation Layer
 *
 * Masks and overlays upper-body actions (carrying basket, holding camera viewfinder,
 * lantern illumination, reading map/letter) while lower body maintains independent locomotion.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.UpperBodyLayer = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class UpperBodyLayer {
    constructor() {
      this.activeLayerAction = null;
      this.activeLayerId = null;
      this.layerWeight = 0.0;
      this.targetWeight = 0.0;
      this.fadeSpeed = 3.5;

      // Bone mask names for upper-body layering
      this.upperBodyBoneNames = new Set([
        'Spine1',
        'Spine2',
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
        'RightHand'
      ]);

      // Authored upper body presets
      this.presets = {
        HOLD_CAMERA: { id: 'HOLD_CAMERA', rightArmPose: 'camera_to_eye', leftArmPose: 'lens_support' },
        HOLD_LANTERN: { id: 'HOLD_LANTERN', rightArmPose: 'lantern_forward_hold', leftArmPose: 'free' },
        CARRY_BASKET: { id: 'CARRY_BASKET', rightArmPose: 'basket_rim_grip', leftArmPose: 'basket_rim_grip' },
        READ_MAP: { id: 'READ_MAP', rightArmPose: 'parchment_hold', leftArmPose: 'parchment_hold' },
        DRINK_TEA: { id: 'DRINK_TEA', rightArmPose: 'tumbler_to_lips', leftArmPose: 'free' }
      };
    }

    /**
     * Activates an upper-body layer with smooth blend-in
     */
    setUpperBodyAction(actionOrPresetId, targetWeight = 1.0) {
      if (!actionOrPresetId) {
        this.targetWeight = 0.0;
        return;
      }

      this.activeLayerId = typeof actionOrPresetId === 'string' ? actionOrPresetId : actionOrPresetId.name;
      this.activeLayerAction = actionOrPresetId;
      this.targetWeight = Math.max(0.0, Math.min(1.0, targetWeight));
    }

    clearUpperBodyAction() {
      this.targetWeight = 0.0;
    }

    /**
     * Updates cross-fade weight toward target
     */
    update(deltaTime) {
      const step = this.fadeSpeed * deltaTime;
      if (this.layerWeight < this.targetWeight) {
        this.layerWeight = Math.min(this.targetWeight, this.layerWeight + step);
      } else if (this.layerWeight > this.targetWeight) {
        this.layerWeight = Math.max(this.targetWeight, this.layerWeight - step);
      }

      if (this.layerWeight <= 0.001 && this.targetWeight === 0.0) {
        this.activeLayerAction = null;
        this.activeLayerId = null;
        this.layerWeight = 0.0;
      }

      return {
        active: this.layerWeight > 0.0,
        weight: this.layerWeight,
        layerId: this.activeLayerId
      };
    }

    isUpperBodyBone(boneName) {
      return this.upperBodyBoneNames.has(boneName);
    }
  }

  return UpperBodyLayer;
});
