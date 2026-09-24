/**
 * The Whispering Wilds (Kaattu Vazhi) - Facial Expression & Gaze Tracking System
 * Coordinates facial states, subtle head tilts, and eye direction during dialogue and cutscenes.
 * States: NEUTRAL, HAPPY, CONCERNED, SURPRISED, FOCUSED, SAD, CURIOUS, ALERT.
 */

window.FACIAL_STATE = {
  NEUTRAL: 'NEUTRAL',
  HAPPY: 'HAPPY',
  CONCERNED: 'CONCERNED',
  SURPRISED: 'SURPRISED',
  FOCUSED: 'FOCUSED',
  SAD: 'SAD',
  CURIOUS: 'CURIOUS',
  ALERT: 'ALERT'
};

class FacialExpressionSystem {
  constructor() {
    this.currentExpression = window.FACIAL_STATE.NEUTRAL;
    this.targetGaze = null;
    this.currentGaze = new THREE.Vector3(0, 1.6, 1);
    this.headBone = null;
    this.eyeTarget = new THREE.Vector3();
    this.transitionTime = 0;
    this.transitionDuration = 0.4;
  }

  setExpression(state) {
    if (window.FACIAL_STATE[state]) {
      this.currentExpression = state;
      console.log(`[FacialExpressionSystem] Expression set: ${state}`);
    }
  }

  getExpression() {
    return this.currentExpression;
  }

  lookAt(targetPos) {
    if (!targetPos) {
      this.targetGaze = null;
      return;
    }
    if (targetPos.x !== undefined && targetPos.y !== undefined && targetPos.z !== undefined) {
      this.targetGaze = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    }
  }

  clearGaze() {
    this.targetGaze = null;
  }

  update(deltaTime) {
    // Smoothly interpolate gaze vector toward target
    if (this.targetGaze) {
      this.currentGaze.lerp(this.targetGaze, Math.min(1.0, deltaTime * 4.5));
    }
  }
}

window.FacialExpressionSystem = FacialExpressionSystem;
