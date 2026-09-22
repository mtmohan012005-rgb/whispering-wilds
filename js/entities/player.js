// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLAYER ENTITY & LOCOMOTION
// Walk, Sprint, Crouch, Jump, Equipment Sway (Backpack & Lantern) & Footstep Decals
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
    this.isLanternOn = true; // Illuminated for atmospheric night scene
    
    // Wardrobe & Attire System
    this.outfitId = 'baseOutfit'; // 'baseOutfit' | 'farmlandGear' | 'mountainGear'
    
    // Dynamic equipment & cloth physics
    this.backpackSway = 0;
    this.capeSway = 0;
    this.walkCycle = 0;
    this.lastStepDist = 0;
    this.stepFoot = false;
    this.isShivering = false;
    
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

  update(input, deltaTime, worldBounds, tracksManager, audio, survival) {
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

    let targetSpeed = this.baseSpeed;
    if (this.isSprinting) targetSpeed = this.sprintSpeed;
    if (this.isCrouching) targetSpeed = this.crouchSpeed;

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

    // Apply movement
    this.vx = moveX * targetSpeed;
    this.vy = moveY * targetSpeed;

    const prevX = this.x;
    const prevY = this.y;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // World boundary clamping
    this.x = Math.max(worldBounds.minX + 20, Math.min(worldBounds.maxX - 20, this.x));
    this.y = Math.max(worldBounds.minY + 50, Math.min(worldBounds.maxY - 50, this.y));

    // Dynamic Walk Cycle & Footprint Decals
    const distMoved = Math.hypot(this.x - prevX, this.y - prevY);
    if (distMoved > 0.1 && !this.isJumping) {
      this.walkCycle += distMoved * 0.15;
      this.lastStepDist += distMoved;

      // Equipment & cloth sway oscillation
      this.backpackSway = Math.sin(this.walkCycle) * (this.isSprinting ? 5.5 : 2.5);
      this.capeSway = -Math.cos(this.walkCycle) * (this.isSprinting ? 7 : 3.5);

      // Footstep every ~28px
      if (this.lastStepDist > 28) {
        this.lastStepDist = 0;
        this.stepFoot = !this.stepFoot;
        
        // Determine surface
        let surface = 'mud';
        if (this.x > 2000 && this.x < 3900 && (this.y > 600 && this.y < 850)) {
          surface = 'water';
        } else if (this.x > 4000) {
          surface = 'grass';
        }

        tracksManager.addFootprint(this.x, this.y, this.angle, this.stepFoot, surface);
        audio.playFootstep(surface);
      }
    } else {
      // Return to resting position
      this.backpackSway *= 0.85;
      this.capeSway *= 0.85;
    }
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
    const isCold = survival && survival.coreTemp < 35.0;
    if (isCold) {
      screenX += (Math.random() - 0.5) * 2.5;
      screenY += (Math.random() - 0.5) * 2.5;
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Dynamic Ground Shadow
    const shadowScale = Math.max(0.4, 1.0 - (this.jumpHeight / 80));
    ctx.fillStyle = 'rgba(10, 15, 20, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, this.jumpHeight + 2, 14 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate player body towards movement angle
    ctx.rotate(this.angle);

    const outfit = this.outfitId;
    const isAimingCamera = explorerCamera && explorerCamera.isActive;

    // --- 2. BACK ACCESSORIES (Jhola vs Backpack vs Mountain Poncho) ---
    if (outfit === 'baseOutfit') {
      // Traditional Terracotta Cotton Jhola Sling Bag
      ctx.save();
      ctx.translate(-7, this.backpackSway);
      ctx.fillStyle = '#d35400'; // Terracotta orange cloth
      ctx.beginPath();
      ctx.ellipse(-4, 0, 7, 10, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b33939';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (outfit === 'farmlandGear') {
      // Canvas Explorer Backpack with side bedroll
      ctx.save();
      ctx.translate(-8, this.backpackSway);
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
      // Nilgiri Mountain Hooded Poncho & Cape
      ctx.fillStyle = '#1e382b'; // Dark highland green
      ctx.beginPath();
      ctx.moveTo(-10, -9);
      ctx.lineTo(-26 + this.capeSway, -7);
      ctx.lineTo(-26 + this.capeSway, 7);
      ctx.lineTo(-10, 9);
      ctx.closePath();
      ctx.fill();
    }

    // --- 3. PLAYER TORSO & CLOTHING ---
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
      // Khaki Canvas Shirt
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

    // --- 4. CAMERA & LANTERN POSES ---
    if (isAimingCamera) {
      // Explorer holding Camera up to Eye!
      ctx.save();
      ctx.translate(6, 0);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, -5, 12, 10);
      // Lens pointing forward with flash reflection
      ctx.fillStyle = '#74b9ff';
      ctx.beginPath();
      ctx.arc(12, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Slung Camera on Hip
      ctx.strokeStyle = '#2b1d0c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.lineTo(8, 6);
      ctx.stroke();
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(4, 5, 7, 5);
    }

    // --- 5. HEAD & HEADGEAR ---
    if (outfit === 'baseOutfit') {
      // Natural dark hair with optional forehead Vibhuti / Sandalwood tilak
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(2, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (outfit === 'farmlandGear') {
      // Explorer Bush / Pith Hat
      ctx.fillStyle = '#5a4632';
      ctx.beginPath();
      ctx.ellipse(2, 0, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Warm Woolen Beanie / Hood
      ctx.fillStyle = '#34495e';
      ctx.beginPath();
      ctx.arc(2, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 6. BELT LANTERN ---
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

    ctx.restore();
  };
