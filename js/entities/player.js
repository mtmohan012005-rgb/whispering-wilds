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
    this.isLanternOn = false;
    
    // Dynamic equipment & cloth physics
    this.backpackSway = 0;
    this.capeSway = 0;
    this.walkCycle = 0;
    this.lastStepDist = 0;
    this.stepFoot = false;
    
    // Interaction
    this.nearbyInteractable = null;
    this.interactionRadius = 75;
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

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y - this.jumpHeight;

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

    // 1. Weather Cloak / Poncho (Back)
    ctx.fillStyle = '#3a4b35'; // Deep hunter green weather cape
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-24 + this.capeSway, -6);
    ctx.lineTo(-24 + this.capeSway, 6);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    // 2. Explorer Backpack with dynamic sway straps
    ctx.save();
    ctx.translate(-8, this.backpackSway);
    ctx.fillStyle = '#654321'; // Leather rucksack
    ctx.beginPath();
    ctx.roundRect(-8, -9, 10, 18, [3]);
    ctx.fill();
    // Brass buckles
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-6, -6, 2, 3);
    ctx.fillRect(-6, 3, 2, 3);
    ctx.restore();

    // 3. Player Torso / Khaki Field Jacket
    ctx.fillStyle = this.isCrouching ? '#a08a68' : '#bfa27b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Slung Explorer Camera Strap
    ctx.strokeStyle = '#2b1d0c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo(8, 6);
    ctx.stroke();

    // Small Vintage Camera body on hip
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillStyle = '#silver';
    ctx.beginPath();
    ctx.arc(8, 8, 2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Head & Explorer Pith/Bush Hat
    ctx.fillStyle = '#4a3828'; // Hat brim
    ctx.beginPath();
    ctx.ellipse(2, 0, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#685038'; // Crown
    ctx.beginPath();
    ctx.ellipse(2, 0, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Swing Brass Lantern on Belt (Right Side)
    ctx.save();
    ctx.translate(6, -11);
    ctx.fillStyle = '#8b6914'; // Brass housing
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
  }
}

window.Player = Player;
