// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REALISTIC LOCOMOTION & BIOMECHANICS
// Surface-Adaptive Gait, Inertial Momentum, IK Hints, Fatigue/Weather Modifiers
// ============================================================================

class LocomotionEngine {
  constructor() {
    // --- Gait State Machine ---
    // States: 'idle' | 'startStep' | 'walk' | 'sprint' | 'decelerate' | 'pivot'
    this.gaitState = 'idle';
    this.gaitTimer = 0;

    // --- Inertial Velocity ---
    this.currentSpeed = 0;       // actual smoothed speed (px/s)
    this.targetSpeed = 0;        // desired speed from input
    this.accelRate = 420;        // px/s² ramp-up (≈0.25s to walk speed)
    this.decelRate = 550;        // px/s² ramp-down (≈0.3s 2-step stop)
    this.pivotLockTimer = 0;     // seconds remaining in pivot turn
    this.pivotLockDuration = 0.2;

    // --- Walk Cycle Phase ---
    this.walkPhase = 0;          // continuous 0→2π
    this.strideAccum = 0;        // distance accumulator for footstep triggers
    this.stepFoot = false;       // alternating L/R

    // --- Surface State ---
    this.currentSurface = 'mud';
    this.surfaceFriction = 0.55;
    this.surfaceSlope = 0;       // degrees
    this.strideScale = 0.73;
    this.cadence = 92;

    // --- Body Dynamics ---
    this.lean = 0;               // forward/backward lean angle (radians)
    this.leanTarget = 0;
    this.pelvisOffset = 0;       // vertical pelvis shift for IK
    this.lateralTilt = 0;        // lateral pelvis tilt (radians)
    this.headDroop = 0;          // downward nod angle (radians)
    this.spineCompensation = 0;  // counter-rotate for gravity balance

    // --- Gear Inertia ---
    this.gearSwayX = 0;          // backpack/jhola lateral sway
    this.gearSwayY = 0;          // vertical bounce
    this.gearInertiaLag = 0;     // delayed momentum response

    // --- Arm Poses ---
    this.armPose = 'normal';     // 'normal' | 'rain_shield' | 'sweat_wipe' | 'hands_on_knees' | 'balance_flare'
    this.armPoseTimer = 0;
    this.armPoseCooldown = 0;
    this.sweatWipeInterval = 8;  // seconds between sweat wipes

    // --- Foot Slip (wet clay) ---
    this.isSlipping = false;
    this.slipTimer = 0;
    this.slipAmount = 0;

    // --- Previous Input for Pivot Detection ---
    this._prevAngle = 0;
    this._prevMoving = false;
    this._wasMoving = false;

    // --- Deceleration Steps ---
    this.decelStepCount = 0;

    // --- Wind Vector ---
    this.windAngle = 0;          // radians, prevailing wind direction
    this.windStrength = 0;       // 0–1
  }

  // ===========================================================================
  // SURFACE RESOLVER — determines ground properties from world position
  // ===========================================================================
  getSurfaceData(playerX, playerY) {
    // Chennai urban / red soil (X < 2000)
    if (playerX < 800) {
      return { type: 'asphalt', friction: 0.95, slope: 0, strideScale: 1.0, cadence: 112 };
    }
    if (playerX < 2000) {
      return { type: 'wet_clay', friction: 0.55, slope: 2, strideScale: 0.73, cadence: 92 };
    }

    // Pichavaram delta (2000–4000)
    if (playerX >= 2000 && playerX < 4000) {
      // Water channel zone
      if (playerY > 550 && playerY < 850) {
        return { type: 'shallow_water', friction: 0.40, slope: 0, strideScale: 0.87, cadence: 82 };
      }
      return { type: 'wet_clay', friction: 0.52, slope: 1, strideScale: 0.75, cadence: 90 };
    }

    // Western Ghats (X > 4000)
    if (playerX >= 4000) {
      const slopeAngle = 15 + (playerY < 400 ? 12 : 0); // steeper at high altitude
      return { type: 'steep_slope', friction: 0.70, slope: slopeAngle, strideScale: 0.60, cadence: 102 };
    }

    return { type: 'grass', friction: 0.80, slope: 3, strideScale: 0.90, cadence: 108 };
  }

  // ===========================================================================
  // OUTFIT STRIDE CONSTRAINTS
  // ===========================================================================
  getOutfitConstraints(outfitId) {
    switch (outfitId) {
      case 'baseOutfit':
        // Veshti/lungi constrains stride radius
        return { maxStrideAngle: 0.55, speedMod: 0.95, dragInertia: 0 };
      case 'farmlandGear':
        return { maxStrideAngle: 0.85, speedMod: 1.0, dragInertia: 0 };
      case 'mountainGear':
        // Heavy poncho adds drag
        return { maxStrideAngle: 0.75, speedMod: 0.92, dragInertia: 0.12 };
      default:
        return { maxStrideAngle: 0.85, speedMod: 1.0, dragInertia: 0 };
    }
  }

  // ===========================================================================
  // FATIGUE & WEATHER MODIFIERS
  // ===========================================================================
  getFatigueModifiers(energy, coreTemp, weatherType, weatherIntensity) {
    const mods = {
      headDroop: 0,
      speedScale: 1.0,
      armPose: 'normal',
      leanAngle: 0,
      dragFeet: false,
      periodicGesture: null,
      gestureInterval: 0
    };

    // --- Low Stamina / Exhaustion ---
    if (energy < 25) {
      const exhaustionFactor = 1 - (energy / 25); // 0→1 as energy drops
      mods.headDroop = 0.21 * exhaustionFactor;         // ~12° max
      mods.speedScale *= (0.70 + 0.30 * (energy / 25)); // −30% at 0 energy
      mods.dragFeet = energy < 15;
      if (energy < 10) {
        mods.armPose = 'hands_on_knees';
      }
    }

    // --- High Heat ---
    if (coreTemp > 38.5) {
      const heatFactor = Math.min(1, (coreTemp - 38.5) / 2);
      mods.headDroop = Math.max(mods.headDroop, 0.14 * heatFactor);
      mods.speedScale *= (0.90 - 0.10 * heatFactor);
      mods.periodicGesture = 'sweat_wipe';
      mods.gestureInterval = 8 - 3 * heatFactor; // faster wipes when hotter
    }

    // --- Storm / Heavy Rain ---
    if (weatherType === 'storm' || (weatherType === 'rain' && weatherIntensity > 0.6)) {
      const stormFactor = weatherType === 'storm' ? 1.0 : 0.5;
      mods.speedScale *= (0.85 - 0.05 * stormFactor);
      mods.leanAngle = 0.12 * stormFactor;      // lean into wind
      mods.armPose = 'rain_shield';
    }

    return mods;
  }

  // ===========================================================================
  // MAIN UPDATE — called once per frame by both 2D and 3D player controllers
  // ===========================================================================
  updateGait(dt, inputAngle, inputMagnitude, rawTargetSpeed, playerX, playerY, energy, coreTemp, weatherType, weatherIntensity, outfitId) {
    // 1. Resolve surface
    const surf = this.getSurfaceData(playerX, playerY);
    this.currentSurface = surf.type;
    this.surfaceFriction = surf.friction;
    this.surfaceSlope = surf.slope;
    this.strideScale = surf.strideScale;
    this.cadence = surf.cadence;

    // 2. Outfit constraints
    const outfit = this.getOutfitConstraints(outfitId);

    // 3. Fatigue modifiers
    const fatigue = this.getFatigueModifiers(energy, coreTemp, weatherType, weatherIntensity);

    // 4. Compute effective target speed
    this.targetSpeed = rawTargetSpeed * surf.strideScale * surf.friction * outfit.speedMod * fatigue.speedScale;

    // Slope penalty: steeper = slower
    if (surf.slope > 5) {
      this.targetSpeed *= Math.max(0.5, 1 - (surf.slope - 5) * 0.015);
    }

    // 5. Pivot detection (large angle change while moving)
    if (this._prevMoving && inputMagnitude > 0) {
      let angleDiff = inputAngle - this._prevAngle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      if (Math.abs(angleDiff) > 2.2 && this.pivotLockTimer <= 0) {
        // 180° pivot turn detected
        this.gaitState = 'pivot';
        this.pivotLockTimer = this.pivotLockDuration;
        this.currentSpeed *= 0.3; // sharp decel during pivot
      }
    }

    // 6. Gait state machine transitions
    if (this.pivotLockTimer > 0) {
      this.pivotLockTimer -= dt;
      if (this.pivotLockTimer <= 0) {
        this.gaitState = inputMagnitude > 0 ? 'walk' : 'idle';
      }
    } else if (inputMagnitude > 0) {
      if (this.gaitState === 'idle' || this.gaitState === 'decelerate') {
        this.gaitState = 'startStep';
        this.gaitTimer = 0;
      }

      if (this.gaitState === 'startStep') {
        this.gaitTimer += dt;
        // Weight-shift preparatory phase (0.18s)
        if (this.gaitTimer > 0.18) {
          this.gaitState = rawTargetSpeed > 200 ? 'sprint' : 'walk';
        }
        // During startStep, ramp speed slowly
        this.currentSpeed += this.accelRate * 0.4 * dt;
      } else {
        // Normal acceleration
        if (this.currentSpeed < this.targetSpeed) {
          this.currentSpeed += this.accelRate * dt;
          if (this.currentSpeed > this.targetSpeed) this.currentSpeed = this.targetSpeed;
        } else if (this.currentSpeed > this.targetSpeed) {
          this.currentSpeed -= this.decelRate * 0.5 * dt;
          if (this.currentSpeed < this.targetSpeed) this.currentSpeed = this.targetSpeed;
        }
        this.gaitState = rawTargetSpeed > 200 ? 'sprint' : 'walk';
      }
    } else {
      // No input — decelerate to stop
      if (this.gaitState === 'walk' || this.gaitState === 'sprint' || this.gaitState === 'startStep') {
        this.gaitState = 'decelerate';
        this.decelStepCount = 0;
      }

      if (this.gaitState === 'decelerate') {
        this.currentSpeed -= this.decelRate * dt;
        this.decelStepCount++;
        if (this.currentSpeed <= 0) {
          this.currentSpeed = 0;
          this.gaitState = 'idle';
        }
      }
    }

    // Clamp
    this.currentSpeed = Math.max(0, this.currentSpeed);

    // 7. Walk cycle phase advance
    if (this.currentSpeed > 1) {
      const effectiveCadence = this.cadence * (this.currentSpeed / 160); // normalize to walk speed
      const phaseRate = (effectiveCadence / 60) * Math.PI * 2; // rad/s
      this.walkPhase += phaseRate * dt;
      if (this.walkPhase > Math.PI * 2) this.walkPhase -= Math.PI * 2;

      // Stride accumulator for footstep triggers
      this.strideAccum += this.currentSpeed * dt;
      const strideDist = 28 * this.strideScale; // surface-adaptive step distance
      if (this.strideAccum >= strideDist) {
        this.strideAccum -= strideDist;
        this.stepFoot = !this.stepFoot;

        // Wet clay foot slip
        if (surf.type === 'wet_clay' || surf.type === 'shallow_water') {
          this.isSlipping = true;
          this.slipTimer = 0.12;
          this.slipAmount = (1 - surf.friction) * 4;
        }
      }
    } else {
      // Gently decay walk phase back to neutral
      this.walkPhase *= 0.88;
    }

    // 8. Foot slip timer
    if (this.isSlipping) {
      this.slipTimer -= dt;
      if (this.slipTimer <= 0) {
        this.isSlipping = false;
        this.slipAmount = 0;
      }
    }

    // 9. Body dynamics — torso lean
    if (inputMagnitude > 0) {
      // Forward lean on mud, into wind on storm
      let baseLean = 0;
      if (surf.type === 'wet_clay') baseLean = 0.10 + (surf.slope * 0.003);
      else if (surf.type === 'steep_slope') baseLean = 0.18 + (surf.slope * 0.004);
      else if (surf.type === 'shallow_water') baseLean = 0.04;

      // Storm lean overrides
      this.leanTarget = Math.max(baseLean, fatigue.leanAngle);

      // Balance flare arms on mud
      if (surf.type === 'wet_clay' && this.currentSpeed > 100 && fatigue.armPose === 'normal') {
        fatigue.armPose = 'balance_flare';
      }
    } else {
      this.leanTarget = 0;
    }
    this.lean += (this.leanTarget - this.lean) * Math.min(1, dt * 6);

    // 10. Pelvis oscillation (vertical bob synced to walk cycle)
    if (this.currentSpeed > 1) {
      // Double-frequency bob (pelvis dips twice per stride)
      this.pelvisOffset = Math.abs(Math.sin(this.walkPhase * 2)) * 2.5 * (this.currentSpeed / 160);
      // Lateral tilt synchronized to step phase
      this.lateralTilt = Math.sin(this.walkPhase) * 0.05 * (this.currentSpeed / 160);
    } else {
      this.pelvisOffset *= 0.85;
      this.lateralTilt *= 0.85;
    }

    // 11. Head droop from fatigue
    this.headDroop += (fatigue.headDroop - this.headDroop) * Math.min(1, dt * 10);
    this.spineCompensation = -this.lateralTilt * 0.6;

    // 12. Gear inertia (backpack/jhola sway)
    const accel = inputMagnitude > 0 ? 1 : -1;
    const dragExtra = outfit.dragInertia;
    this.gearInertiaLag += (accel * 0.3 + dragExtra) * dt;
    this.gearInertiaLag *= 0.92; // damping

    if (this.currentSpeed > 1) {
      this.gearSwayX = Math.sin(this.walkPhase) * (this.gaitState === 'sprint' ? 5.5 : 2.5);
      this.gearSwayY = Math.abs(Math.sin(this.walkPhase * 2)) * (this.gaitState === 'sprint' ? 3 : 1.5);
    } else {
      this.gearSwayX *= 0.88;
      this.gearSwayY *= 0.88;
    }

    // 13. Arm pose management
    this.armPose = fatigue.armPose;

    if (fatigue.periodicGesture === 'sweat_wipe') {
      this.armPoseCooldown -= dt;
      if (this.armPoseCooldown <= 0 && this.gaitState === 'idle') {
        this.armPose = 'sweat_wipe';
        this.armPoseTimer = 1.2; // wipe gesture duration
        this.armPoseCooldown = fatigue.gestureInterval;
      }
    }

    if (this.armPoseTimer > 0) {
      this.armPoseTimer -= dt;
      if (this.armPoseTimer <= 0) {
        this.armPose = fatigue.armPose === 'normal' ? 'normal' : fatigue.armPose;
      }
    }

    // 14. Wind vector (for storm lean direction)
    if (weatherType === 'storm') {
      this.windAngle = Math.PI * 0.75; // NE prevailing wind
      this.windStrength = weatherIntensity;
    } else {
      this.windStrength *= 0.95;
    }

    // Store for pivot detection
    this._prevAngle = inputAngle;
    this._prevMoving = inputMagnitude > 0;

    // 15. Return computed leg swing values for the renderer
    const maxSwing = outfit.maxStrideAngle;
    const legSwing = Math.sin(this.walkPhase) * maxSwing * (this.currentSpeed / 160);

    return {
      effectiveSpeed: this.currentSpeed,
      walkPhase: this.walkPhase,
      leftLegSwing: legSwing,
      rightLegSwing: -legSwing,
      pelvisOffset: this.pelvisOffset,
      lateralTilt: this.lateralTilt,
      lean: this.lean,
      headDroop: this.headDroop,
      spineCompensation: this.spineCompensation,
      gearSwayX: this.gearSwayX + this.gearInertiaLag * 8,
      gearSwayY: this.gearSwayY,
      armPose: this.armPose,
      isSlipping: this.isSlipping,
      slipAmount: this.slipAmount,
      gaitState: this.gaitState,
      surface: this.currentSurface,
      strideScale: this.strideScale,
      stepFoot: this.stepFoot,
      shouldTriggerStep: false // set by stride accumulator
    };
  }

  // ===========================================================================
  // SURFACE-SPECIFIC FOOTPRINT CONFIG (consumed by TerrainTracksManager)
  // ===========================================================================
  getFootprintConfig() {
    switch (this.currentSurface) {
      case 'asphalt':
        return { depth: 0.3, soleWidth: 3, heelDepth: 0.4, splashRing: false, color: 'rgba(60, 55, 50, ' };
      case 'wet_clay':
        return { depth: 0.85, soleWidth: 4, heelDepth: 0.9, splashRing: false, color: 'rgba(40, 20, 10, ' };
      case 'shallow_water':
        return { depth: 0.2, soleWidth: 3, heelDepth: 0.3, splashRing: true, color: 'rgba(30, 60, 70, ' };
      case 'steep_slope':
        return { depth: 0.6, soleWidth: 3.5, heelDepth: 0.7, splashRing: false, color: 'rgba(35, 50, 30, ' };
      case 'grass':
        return { depth: 0.4, soleWidth: 3, heelDepth: 0.5, splashRing: false, color: 'rgba(30, 45, 20, ' };
      default:
        return { depth: 0.65, soleWidth: 3.5, heelDepth: 0.75, splashRing: false, color: 'rgba(40, 20, 10, ' };
    }
  }

  // Helper: get current force (sprint > walk) for footprint depth scaling
  getCurrentForce() {
    return Math.min(1.5, this.currentSpeed / 160);
  }
}

window.LocomotionEngine = LocomotionEngine;
