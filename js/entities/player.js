// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLAYER ENTITY & BIOMECHANICS
// Realistic Gait, IK-Inspired Foot Placement, Inertial Momentum,
// Fatigue/Weather Modifiers, Outfit Constraints & Dynamic Draw Pipeline
// ============================================================================

class Player {
  constructor(x = 220, y = 630) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.angle = 0; // facing direction in radians
    
    // Locomotion speeds
    this.baseSpeed = 160;   // px/sec
    this.sprintSpeed = 270;
    this.crouchSpeed = 80;
    
    // States
    this.isSprinting = false;
    this.isCrouching = false;
    this.isJumping = false;
    this.jumpHeight = 0;
    this.jumpVelocity = 0;
    this.isLanternOn = true;
    
    // Wardrobe & Attire System
    this.outfitId = 'baseOutfit';
    
    // Locomotion Engine (biomechanics)
    this.locomotion = new window.LocomotionEngine();
    
    // Legacy sway values (now driven by locomotion engine)
    this.backpackSway = 0;
    this.capeSway = 0;
    this.walkCycle = 0;
    this.lastStepDist = 0;
    this.stepFoot = false;
    this.isShivering = false;
    
    // Biomechanics draw state (populated by locomotion engine each frame)
    this.bio = {
      lean: 0,
      headDroop: 0,
      pelvisOffset: 0,
      lateralTilt: 0,
      spineCompensation: 0,
      armPose: 'normal',
      leftLegSwing: 0,
      rightLegSwing: 0,
      gearSwayX: 0,
      gearSwayY: 0,
      isSlipping: false,
      slipAmount: 0,
      gaitState: 'idle',
      surface: 'mud'
    };
    
    // Interaction
    this.nearbyInteractable = null;
    this.interactionRadius = 75;
  }

  setOutfit(outfitId) {
    this.outfitId = outfitId;
    this.currentOutfit = outfitId;
    window.playerCharacter.currentOutfit = outfitId;
  }

  getOutfitConfig() {
    if (this.outfitId === 'baseOutfit') return window.playerCharacter.baseOutfit;
    return window.playerCharacter.upgradedOutfits[this.outfitId] || window.playerCharacter.baseOutfit;
  }

  update(input, deltaTime, worldBounds, tracksManager, audio, survival, weatherSystem) {
    // 1. Process movement inputs
    let moveX = 0;
    let moveY = 0;

    if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

    // Normalize diagonal movement
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
      this.angle = Math.atan2(moveY, moveX);
    }

    // Crouch & Sprint modifiers
    this.isCrouching = input.keys['KeyC'] || input.keys['ControlLeft'];
    const wantsSprint = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
    
    // Stamina check for sprinting
    if (wantsSprint && !this.isCrouching && len > 0 && survival.energy > 5) {
      this.isSprinting = true;
      survival.consumeEnergy(12 * deltaTime);
    } else {
      this.isSprinting = false;
      if (!wantsSprint && len === 0) {
        survival.recoverEnergy(8 * deltaTime);
      }
    }

    let rawTargetSpeed = this.baseSpeed;
    if (this.isSprinting) rawTargetSpeed = this.sprintSpeed;
    if (this.isCrouching) rawTargetSpeed = this.crouchSpeed;

    // Jump physics
    if ((input.keys['Space']) && !this.isJumping && !this.isCrouching) {
      this.isJumping = true;
      this.jumpVelocity = 180;
      audio.playFootstep('dirt');
    }

    if (this.isJumping) {
      this.jumpHeight += this.jumpVelocity * deltaTime;
      this.jumpVelocity -= 520 * deltaTime; // gravity
      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.isJumping = false;
        audio.playFootstep('dirt');
      }
    }

    // 2. Run locomotion engine
    const weatherType = (weatherSystem && weatherSystem.current) ? weatherSystem.current.type : 'sunny';
    const weatherIntensity = (weatherSystem && weatherSystem.current) ? weatherSystem.current.intensity : 0;

    const gait = this.locomotion.updateGait(
      deltaTime,
      this.angle,
      len,
      rawTargetSpeed,
      this.x,
      this.y,
      survival.energy,
      survival.coreTemp,
      weatherType,
      weatherIntensity,
      this.outfitId
    );

    // Store bio state for draw()
    this.bio = gait;

    // 3. Apply inertial speed (from locomotion engine, not instant)
    const effectiveSpeed = this.isJumping ? rawTargetSpeed : gait.effectiveSpeed;

    this.vx = moveX * effectiveSpeed;
    this.vy = moveY * effectiveSpeed;

    // Apply foot slip offset on wet surfaces
    if (gait.isSlipping && !this.isJumping) {
      this.vx -= Math.cos(this.angle) * gait.slipAmount * 30;
      this.vy -= Math.sin(this.angle) * gait.slipAmount * 30;
    }

    const prevX = this.x;
    const prevY = this.y;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // World boundary clamping
    this.x = Math.max(worldBounds.minX + 20, Math.min(worldBounds.maxX - 20, this.x));
    this.y = Math.max(worldBounds.minY + 50, Math.min(worldBounds.maxY - 50, this.y));

    // 4. Equipment sway from locomotion engine
    this.backpackSway = gait.gearSwayX;
    this.capeSway = -gait.gearSwayY;
    this.walkCycle = gait.walkPhase;

    // 5. Footstep decals & audio (driven by locomotion stride accumulator)
    const distMoved = Math.hypot(this.x - prevX, this.y - prevY);
    if (distMoved > 0.1 && !this.isJumping) {
      this.lastStepDist += distMoved;

      const strideDist = 28 * gait.strideScale;
      if (this.lastStepDist > strideDist) {
        this.lastStepDist = 0;
        this.stepFoot = !this.stepFoot;
        
        // Surface-specific footprint
        const fpConfig = this.locomotion.getFootprintConfig();
        tracksManager.addFootprint(this.x, this.y, this.angle, this.stepFoot, gait.surface, fpConfig);
        audio.playFootstep(gait.surface === 'asphalt' ? 'dirt' : gait.surface === 'shallow_water' ? 'water' : gait.surface === 'steep_slope' ? 'grass' : 'mud');
      }
    } else {
      this.backpackSway *= 0.85;
      this.capeSway *= 0.85;
    }

    // 6. Cold shivering
    this.isShivering = survival && survival.coreTemp < 35.0;
  }

  toggleLantern(audio) {
    this.isLanternOn = !this.isLanternOn;
    audio.playPinTap();
    return this.isLanternOn;
  }
}

// Cultural Wardrobe System Data
window.playerCharacter = {
    name: "Explorer",
    currentOutfit: "baseOutfit",
    baseOutfit: {
        id: "baseOutfit",
        name: "Casual Cotton Shirt & Veshti (வழக்கமான ஆடை)",
        clothing: "White cotton shirt & golden-bordered Veshti / Dhoti",
        footwear: "Traditional leather sandals (Slower stamina recovery in mud)",
        accessory: "Shoulder Jhola cloth sling bag",
        staminaMultiplier: 1.25,
        coldProtection: 0
    },
    upgradedOutfits: {
        farmlandGear: {
            id: "farmlandGear",
            name: "Villupuram Farmland Trekker (செம்மண் பயண உடை)",
            clothing: "Durable khaki canvas shirt & reinforced field trousers",
            footwear: "Sturdy trekking boots (Firm mud grip)",
            accessory: "Slung copper water canteen & canvas rucksack",
            staminaMultiplier: 1.0,
            coldProtection: 3
        },
        mountainGear: {
            id: "mountainGear",
            name: "Nilgiri Highland Expedition (நீலகிரி குளிர் கம்பளி உடை)",
            clothing: "Thick knitted Ooty woolen sweater & storm poncho",
            footwear: "Insulated mountain grip boots (Hypothermia defense)",
            accessory: "Slung Explorer Camera & belt brass lantern",
            staminaMultiplier: 0.9,
            coldProtection: 9
        }
    }
};

window.Player = Player;

  Player.prototype.draw = function(ctx, camera, survival, explorerCamera) {
    let screenX = this.x - camera.x;
    let screenY = this.y - camera.y - this.jumpHeight;

    // 1. Shivering animation when cold in mountain fog (Core temp < 35.0°C)
    if (this.isShivering) {
      screenX += (Math.random() - 0.5) * 2.5;
      screenY += (Math.random() - 0.5) * 2.5;
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Dynamic Ground Shadow — shifts with pelvis offset
    const shadowScale = Math.max(0.4, 1.0 - (this.jumpHeight / 80));
    ctx.fillStyle = 'rgba(10, 15, 20, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, this.jumpHeight + 2, 14 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apply biomechanics transforms
    const bio = this.bio;

    // Torso lean (forward on mud/slope, into wind on storm)
    ctx.rotate(this.angle);
    ctx.rotate(bio.lean); // forward lean overlay

    // Pelvis vertical bob
    ctx.translate(0, -bio.pelvisOffset);

    // Lateral tilt
    if (Math.abs(bio.lateralTilt) > 0.001) {
      ctx.rotate(bio.lateralTilt);
    }

    const outfit = this.outfitId;
    const isAimingCamera = explorerCamera && explorerCamera.isActive;

    // --- FOOT SLIP VISUAL (wet clay backward skid) ---
    if (bio.isSlipping) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#5a3320';
      ctx.beginPath();
      ctx.ellipse(-bio.slipAmount * 6, 12, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- 2D IK-INSPIRED LEG RENDERING ---
    // Left leg
    ctx.save();
    ctx.translate(-5, 8);
    ctx.rotate(bio.leftLegSwing);
    ctx.fillStyle = outfit === 'baseOutfit' ? '#f0e6d2' : (outfit === 'farmlandGear' ? '#8b7355' : '#3a4a58');
    ctx.beginPath();
    ctx.ellipse(0, 4, 3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Foot
    ctx.fillStyle = outfit === 'baseOutfit' ? '#8b6914' : '#3d2b1f';
    ctx.beginPath();
    ctx.ellipse(0, 10, 3.5, 2.5, bio.leftLegSwing * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.translate(5, 8);
    ctx.rotate(bio.rightLegSwing);
    ctx.fillStyle = outfit === 'baseOutfit' ? '#f0e6d2' : (outfit === 'farmlandGear' ? '#8b7355' : '#3a4a58');
    ctx.beginPath();
    ctx.ellipse(0, 4, 3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Foot
    ctx.fillStyle = outfit === 'baseOutfit' ? '#8b6914' : '#3d2b1f';
    ctx.beginPath();
    ctx.ellipse(0, 10, 3.5, 2.5, bio.rightLegSwing * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- BACK ACCESSORIES (Jhola vs Backpack vs Mountain Poncho) ---
    if (outfit === 'baseOutfit') {
      // Traditional Terracotta Cotton Jhola Sling Bag
      ctx.save();
      ctx.translate(-7, this.backpackSway - bio.gearSwayY);
      ctx.fillStyle = '#d35400';
      ctx.beginPath();
      ctx.ellipse(-4, 0, 7, 10, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b33939';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (outfit === 'farmlandGear') {
      // Canvas Explorer Backpack with gear inertia
      ctx.save();
      ctx.translate(-8, this.backpackSway - bio.gearSwayY);
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.roundRect(-8, -9, 11, 18, [3]);
      ctx.fill();
      // Copper water canteen on side
      ctx.fillStyle = '#b87333';
      ctx.beginPath();
      ctx.arc(-2, 11, 4, 0, Math.PI * 2);
      ctx.fill();
      // Brass buckles
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-6, -6, 2, 3);
      ctx.fillRect(-6, 3, 2, 3);
      ctx.restore();
    } else {
      // Nilgiri Mountain Hooded Poncho & Cape with drag inertia
      ctx.fillStyle = '#1e382b';
      ctx.beginPath();
      ctx.moveTo(-10, -9);
      ctx.lineTo(-26 + this.capeSway + bio.gearSwayX * 0.3, -7);
      ctx.lineTo(-26 + this.capeSway + bio.gearSwayX * 0.3, 7);
      ctx.lineTo(-10, 9);
      ctx.closePath();
      ctx.fill();
    }

    // --- PLAYER TORSO & CLOTHING ---
    // Apply spine compensation for lateral tilt balance
    ctx.save();
    ctx.rotate(bio.spineCompensation);

    if (outfit === 'baseOutfit') {
      // White Cotton Kurta/Shirt & Folded Veshti (Dhoti)
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Traditional Gold Kasavu Zari Border on Veshti
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.lineTo(8, 8);
      ctx.stroke();
    } else if (outfit === 'farmlandGear') {
      ctx.fillStyle = this.isCrouching ? '#a08a68' : '#bfa27b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Heavy Ooty Woolen Knitted Sweater (Deep Navy Blue)
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore(); // end spine compensation

    // --- ARM POSE OVERLAYS ---
    if (bio.armPose === 'rain_shield') {
      // Arm raised to shield eyes from driving rain
      ctx.save();
      ctx.translate(3, -8);
      ctx.rotate(-0.3);
      ctx.fillStyle = outfit === 'mountainGear' ? '#2c3e50' : '#f8f9fa';
      ctx.beginPath();
      ctx.roundRect(0, -3, 14, 4, [2]);
      ctx.fill();
      // Hand palm
      ctx.fillStyle = '#8d5b4c';
      ctx.beginPath();
      ctx.arc(14, -1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (bio.armPose === 'sweat_wipe') {
      // Forearm wiping brow
      ctx.save();
      ctx.translate(4, -7);
      ctx.rotate(-0.6);
      ctx.fillStyle = '#8d5b4c';
      ctx.beginPath();
      ctx.roundRect(-2, -2, 10, 3, [1]);
      ctx.fill();
      ctx.restore();
    } else if (bio.armPose === 'hands_on_knees') {
      // Exhausted pose — hands resting on knees
      ctx.save();
      ctx.fillStyle = '#8d5b4c';
      // Left hand on left knee
      ctx.beginPath();
      ctx.arc(-6, 9, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Right hand on right knee
      ctx.beginPath();
      ctx.arc(6, 9, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (bio.armPose === 'balance_flare') {
      // Arms flared for balance on slippery surface
      ctx.save();
      ctx.fillStyle = outfit === 'mountainGear' ? '#2c3e50' : '#f8f9fa';
      // Left arm flared out
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-18, -8);
      ctx.lineTo(-16, -5);
      ctx.closePath();
      ctx.fill();
      // Right arm flared out
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(18, -8);
      ctx.lineTo(16, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // --- CAMERA & LANTERN POSES ---
    if (isAimingCamera) {
      ctx.save();
      ctx.translate(6, 0);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, -5, 12, 10);
      ctx.fillStyle = '#74b9ff';
      ctx.beginPath();
      ctx.arc(12, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (bio.armPose === 'normal') {
      // Slung Camera on Hip (only when arms are in normal pose)
      ctx.strokeStyle = '#2b1d0c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.lineTo(8, 6);
      ctx.stroke();
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(4, 5, 7, 5);
    }

    // --- HEAD & HEADGEAR (with droop) ---
    ctx.save();
    ctx.translate(2, 0);
    ctx.rotate(bio.headDroop); // fatigue head nod

    if (outfit === 'baseOutfit') {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (outfit === 'farmlandGear') {
      ctx.fillStyle = '#5a4632';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#34495e';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore(); // end head droop

    // --- BELT LANTERN ---
    ctx.save();
    ctx.translate(6, -11);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, -2, 5, 7);
    if (this.isLanternOn) {
      ctx.fillStyle = '#fff4a3';
      ctx.fillRect(1, -1, 3, 5);
    } else {
      ctx.fillStyle = '#3a3424';
      ctx.fillRect(1, -1, 3, 5);
    }
    ctx.restore();

    // --- DRAG FEET VISUAL (exhaustion) ---
    if (bio.gaitState !== 'idle' && survival && survival.energy < 15) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#4a3520';
      ctx.beginPath();
      ctx.ellipse(-3, 14, 6, 1.5, this.angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  };
