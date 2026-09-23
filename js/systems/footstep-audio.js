/**
 * The Whispering Wilds (Kaattu Vazhi) - Footstep & Biomechanics Audio System
 * Material surface acoustics (stone, mud, grass, sand, wood, water),
 * stride cadence timing, cloth foley, and air/water movement suppression.
 */

class FootstepAudioSystem {
  constructor(audioManager) {
    this.manager = audioManager || window.audioManager;
    this.stepTimer = 0;
    this.stepInterval = 0.5; // seconds
    this.lastMaterial = 'stone';
    this.isRightFoot = false;
  }

  detectMaterial(x, z, player) {
    // 1. Water check: near canals or Pichavaram wetlands
    if (player && (player.isSwimming || (player.y && player.y > 680 && x > 2000 && x < 3500))) {
      return 'water';
    }

    // 2. Coastal sand check: George Town coast / Mamallapuram shore
    if (x < -150 || (x > 140 && x < 240 && z > 50)) {
      return 'sand';
    }

    // 3. Mud / Alluvial clay check: Cauvery delta & farmlands
    if (x >= -100 && x < 100) {
      return 'mud';
    }

    // 4. Wood: wooden piers, boats, watchtowers
    if (player && player.isOnWoodStructure) {
      return 'wood';
    }

    // 5. Grass / Shola meadow: Nilgiris
    if (x > 200) {
      return 'grass';
    }

    // Default to heritage stone/granite pavement
    return 'stone';
  }

  update(deltaTime, player) {
    if (!player || !this.manager) return;

    // Suppress footsteps when idle, airborne, or swimming
    const isAirborne = player.isJumping || (player.state && (player.state === 'JUMP' || player.state === 'FALL'));
    const isSwimming = player.state === 'SWIM' || player.isSwimming;
    const isMoving = player.isMoving || (Math.hypot(player.vx || 0, player.vy || 0) > 5);

    if (isAirborne || isSwimming || !isMoving) {
      this.stepTimer = 0;
      return;
    }

    // Determine gait cadence interval
    let speed = player.speed || 16;
    if (player.state === 'SPRINT' || player.isSprinting) {
      this.stepInterval = 0.32;
    } else if (player.state === 'RUN') {
      this.stepInterval = 0.42;
    } else if (player.state === 'CROUCH_WALK' || player.isCrouching) {
      this.stepInterval = 0.75;
    } else {
      this.stepInterval = 0.52; // standard walk
    }

    this.stepTimer += deltaTime;
    if (this.stepTimer >= this.stepInterval) {
      this.stepTimer = 0;
      this.triggerStep(player);
    }
  }

  triggerStep(player) {
    const px = (player.x !== undefined) ? player.x : 0;
    const pz = (player.z !== undefined) ? player.z : ((player.y !== undefined) ? player.y : 0);
    const material = this.detectMaterial(px, pz, player);
    this.lastMaterial = material;
    this.isRightFoot = !this.isRightFoot;

    const gait = (player.state && player.state.toLowerCase()) || (player.isSprinting ? 'sprint' : 'walk');
    const stepId = `step_${material}_01`;

    // Play footstep via AudioManager
    this.manager.play(stepId, { category: 'footsteps', volume: 0.65 });

    // Subtle cloth rustle accompanying step
    const outfitId = player.outfitId || 'everyday_veshti';
    const clothData = this.manager.data && this.manager.data.clothMovement && this.manager.data.clothMovement[outfitId];
    if (clothData) {
      this.manager.play(`cloth_${outfitId}`, { category: 'footsteps', volume: clothData.volume });
    }
  }
}

window.FootstepAudioSystem = FootstepAudioSystem;
