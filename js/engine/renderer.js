// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - 2.5D CANVAS WORLD RENDERER
// Multi-Biome Landscapes, Depth Y-Sorting, Isometric Structures & Water Shader
// ============================================================================

class WorldRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = {
      x: 0,
      y: 0,
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
      targetX: 0,
      targetY: 0
    };
    this.waterTime = 0;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
  }

  updateCamera(player, worldBounds) {
    // Smooth camera follow with lerp
    this.camera.targetX = player.x - this.camera.viewportWidth / 2;
    this.camera.targetY = player.y - this.camera.viewportHeight / 2;

    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.08;

    // Clamp camera within world bounds
    this.camera.x = Math.max(worldBounds.minX, Math.min(worldBounds.maxX - this.camera.viewportWidth, this.camera.x));
    this.camera.y = Math.max(worldBounds.minY, Math.min(worldBounds.maxY - this.camera.viewportHeight, this.camera.y));
  }

  drawTerrain(worldData, weatherState, deltaTime) {
    this.waterTime += deltaTime;
    const ctx = this.ctx;
    const cam = this.camera;

    // 1. Biome Ground Bases
    // Phase 1: Chennai Red Soil (0 - 2000px)
    if (cam.x < 2000) {
      const redSoilGrad = ctx.createLinearGradient(0 - cam.x, 0, 2000 - cam.x, 0);
      redSoilGrad.addColorStop(0, '#8c3822');
      redSoilGrad.addColorStop(0.5, '#a3482d');
      redSoilGrad.addColorStop(1, '#693826');
      ctx.fillStyle = redSoilGrad;
      ctx.fillRect(0 - cam.x, 0 - cam.y, 2000, 1200);

      // Clay path through plains
      ctx.fillStyle = '#b35436';
      ctx.beginPath();
      ctx.moveTo(0 - cam.x, 620 - cam.y);
      ctx.bezierCurveTo(600 - cam.x, 600 - cam.y, 1400 - cam.x, 660 - cam.y, 2000 - cam.x, 640 - cam.y);
      ctx.lineWidth = 90;
      ctx.strokeStyle = '#78321e';
      ctx.stroke();
    }

    // Phase 2: Pichavaram Mangrove Wetlands (2000 - 4000px)
    if (cam.x + cam.viewportWidth >= 2000 && cam.x < 4000) {
      // Wetland mud bank
      ctx.fillStyle = '#3a4430';
      ctx.fillRect(2000 - cam.x, 0 - cam.y, 2000, 1200);

      // Tidal Mangrove Water Channel (500 - 850 Y)
      const waterGrad = ctx.createLinearGradient(0, 520 - cam.y, 0, 850 - cam.y);
      waterGrad.addColorStop(0, '#1c4a4e');
      waterGrad.addColorStop(0.5, '#163d42');
      waterGrad.addColorStop(1, '#0e2b2f');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(2000 - cam.x, 520 - cam.y, 2000, 330);

      // Dynamic Water Wave Ripples
      ctx.strokeStyle = 'rgba(180, 240, 255, 0.22)';
      ctx.lineWidth = 1.4;
      for (let y = 540; y < 840; y += 30) {
        ctx.beginPath();
        for (let x = 2000; x < 4000; x += 60) {
          const wave = Math.sin(this.waterTime * 2 + (x * 0.02) + (y * 0.05)) * 3;
          ctx.lineTo(x - cam.x, y - cam.y + wave);
        }
        ctx.stroke();
      }
    }

    // Phase 3: Western Ghats Mist Terraces (4000 - 6000px)
    if (cam.x + cam.viewportWidth >= 4000) {
      const ghatsGrad = ctx.createLinearGradient(4000 - cam.x, 0, 6000 - cam.x, 0);
      ghatsGrad.addColorStop(0, '#2d4529');
      ghatsGrad.addColorStop(0.6, '#1e381f');
      ghatsGrad.addColorStop(1, '#152b17');
      ctx.fillStyle = ghatsGrad;
      ctx.fillRect(4000 - cam.x, 0 - cam.y, 2000, 1200);

      // Stepped Tea Terrace Contour Lines
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.25)';
      ctx.lineWidth = 6;
      for (let y = 200; y < 1100; y += 70) {
        ctx.beginPath();
        ctx.moveTo(4000 - cam.x, y - cam.y);
        ctx.bezierCurveTo(4600 - cam.x, y - 30 - cam.y, 5400 - cam.x, y + 25 - cam.y, 6000 - cam.x, y - cam.y);
        ctx.stroke();
      }
    }
  }

  // Draw static world structures with bespoke cultural architecture
  drawStructure(ctx, landmark, cam) {
    const sx = landmark.x - cam.x;
    const sy = landmark.y - cam.y;

    if (landmark.id === 'high_court_gates') {
      // Madras High Court Indo-Saracenic Red-Brick Gates
      ctx.save();
      ctx.translate(sx, sy);

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-10, 8, 160, 20);

      // Red Brick Main Archway
      ctx.fillStyle = '#8b2518';
      ctx.fillRect(0, -110, 40, 120); // Left tower
      ctx.fillRect(100, -110, 40, 120); // Right tower
      ctx.fillRect(0, -130, 140, 30); // Top lintel

      // Ornate Pointed Saracenic Arch opening
      ctx.fillStyle = '#220b08';
      ctx.beginPath();
      ctx.moveTo(40, 10);
      ctx.lineTo(40, -60);
      ctx.quadraticCurveTo(70, -100, 100, -60);
      ctx.lineTo(100, 10);
      ctx.fill();

      // Wrought-iron Victorian gate grills
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 1.5;
      for (let gx = 48; gx < 95; gx += 8) {
        ctx.beginPath();
        ctx.moveTo(gx, 10);
        ctx.lineTo(gx, -55);
        ctx.stroke();
      }

      // Onion dome minarets on towers
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(20, -125, 12, Math.PI, 0);
      ctx.arc(120, -125, 12, Math.PI, 0);
      ctx.fill();

      // Stone Plaque: "MADRAS HIGH COURT - 1892"
      ctx.fillStyle = '#e8d8b8';
      ctx.fillRect(30, -122, 80, 14);
      ctx.fillStyle = '#5c1b12';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('MADRAS HIGH COURT', 32, -112);

      ctx.restore();
    } else if (landmark.id === 'tea_kadai') {
      // Murugan Annan's Roadside Tea Kadai
      ctx.save();
      ctx.translate(sx, sy);

      // Stall Wooden Base & Thatched Palmyra Roof
      ctx.fillStyle = '#654321';
      ctx.fillRect(0, -45, 120, 50);

      // Bamboo thatched awning
      ctx.fillStyle = '#8b6914';
      ctx.beginPath();
      ctx.moveTo(-10, -45);
      ctx.lineTo(130, -45);
      ctx.lineTo(120, -70);
      ctx.lineTo(0, -70);
      ctx.fill();

      // Bright Tamil Signboard
      ctx.fillStyle = '#d63031';
      ctx.fillRect(10, -65, 100, 16);
      ctx.fillStyle = '#ffeaa7';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('முருகன் டீ ஸ்டால்', 16, -53);

      // Steaming Brass Samovar / Tea Boiler
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(20, -40, 18, 24);
      ctx.beginPath();
      ctx.arc(29, -40, 9, Math.PI, 0);
      ctx.fill();

      // Steam puffs from kettle
      const steamShift = Math.sin(Date.now() * 0.005) * 4;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(29 + steamShift, -52, 4, 0, Math.PI * 2);
      ctx.fill();

      // Glass Tumblers shelf
      ctx.fillStyle = 'rgba(220, 240, 255, 0.7)';
      for (let tx = 48; tx < 80; tx += 7) {
        ctx.fillRect(tx, -32, 5, 8);
      }

      // Yellow Banana Bunch hanging
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.ellipse(98, -35, 8, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Wooden bench for customers
      ctx.fillStyle = '#4a2f13';
      ctx.fillRect(10, 15, 100, 10);

      ctx.restore();
    } else if (landmark.id === 'panchayat_well') {
      // Panchayat Stone Well
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.ellipse(40, 40, 36, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Well water deep dark blue
      ctx.fillStyle = '#0a2336';
      ctx.beginPath();
      ctx.ellipse(40, 38, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wooden pulley frame
      ctx.strokeStyle = '#5a3d28';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(15, 38);
      ctx.lineTo(40, -10);
      ctx.lineTo(65, 38);
      ctx.stroke();
      ctx.restore();
    } else if (landmark.id === 'chola_waterwheel') {
      // Ancient Chola Carved Granite Waterwheel
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = '#5c635b'; // Granite
      ctx.beginPath();
      ctx.arc(60, 60, 52, 0, Math.PI * 2);
      ctx.fill();

      // Carved Spokes & Lotus glyphs
      ctx.strokeStyle = '#2b332a';
      ctx.lineWidth = 4;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(60, 60);
        ctx.lineTo(60 + Math.cos(a) * 50, 60 + Math.sin(a) * 50);
        ctx.stroke();
      }

      // Center Tiger Emblem Dial
      ctx.fillStyle = '#c5a059';
      ctx.beginPath();
      ctx.arc(60, 60, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (landmark.id === 'nilgiri_tea_factory') {
      // Nilgiri Stone Cottage Outpost
      ctx.save();
      ctx.translate(sx, sy);
      // Stone Cottage Body
      ctx.fillStyle = '#5a554c';
      ctx.fillRect(0, -30, 140, 80);
      // Terracotta Tiled Sloped Roof
      ctx.fillStyle = '#a8422b';
      ctx.beginPath();
      ctx.moveTo(-15, -30);
      ctx.lineTo(70, -75);
      ctx.lineTo(155, -30);
      ctx.fill();
      // Warm glowing windows
      ctx.fillStyle = '#ffcc66';
      ctx.fillRect(20, -5, 25, 25);
      ctx.fillRect(95, -5, 25, 25);
      // Chimney with woodsmoke
      ctx.fillStyle = '#3a352c';
      ctx.fillRect(110, -70, 18, 28);
      ctx.restore();
    } else if (landmark.id === 'eco_sanctuary_portal') {
      // The Lost Underground Eco-Sanctuary Portal
      ctx.save();
      ctx.translate(sx, sy);
      // Massive ancient stone megalith arch
      ctx.fillStyle = '#22382c';
      ctx.fillRect(0, -100, 180, 120);
      // Luminous emerald bio-luminescent doorway
      const bioGrad = ctx.createLinearGradient(0, -80, 0, 20);
      bioGrad.addColorStop(0, '#00b894');
      bioGrad.addColorStop(0.5, '#55efc4');
      bioGrad.addColorStop(1, '#00cec9');
      ctx.fillStyle = bioGrad;
      ctx.beginPath();
      ctx.arc(90, -30, 45, Math.PI, 0);
      ctx.lineTo(135, 20);
      ctx.lineTo(45, 20);
      ctx.fill();
      // Tamil Brahmi carvings in gold
      ctx.fillStyle = '#f1c40f';
      ctx.font = '10px serif';
      ctx.fillText('வாழிய இயற்கை • பசுமைத் தடம்', 30, -85);
      ctx.restore();
    } else if (landmark.id === 'chennai_auto') {
      // Madras Yellow-and-Black Auto Rickshaw
      ctx.save();
      ctx.translate(sx, sy);
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(30, 25, 34, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Yellow Canopy Roof
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.roundRect(0, -32, 62, 34, [6]);
      ctx.fill();
      // Black lower body chassis
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(0, -5, 62, 28);
      // Windshield & side openings
      ctx.fillStyle = 'rgba(200, 235, 255, 0.7)';
      ctx.fillRect(4, -26, 14, 18);
      ctx.fillRect(22, -26, 34, 18);
      // Black wheels
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(10, 24, 7, 0, Math.PI * 2);
      ctx.arc(52, 24, 7, 0, Math.PI * 2);
      ctx.fill();
      // Tamil Text on Auto back: "அம்மா ஆசிர்வாதம்"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('அம்மா ஆசிர்வாதம்', 10, 15);
      ctx.restore();
    } else if (landmark.id === 'elaneer_cart') {
      // Tender Coconut Roadside Cart (இளநீர் வண்டி)
      ctx.save();
      ctx.translate(sx, sy);
      // Wooden cart bed
      ctx.fillStyle = '#5a3d28';
      ctx.fillRect(0, -10, 75, 24);
      // Wheels
      ctx.strokeStyle = '#2d1a0c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(16, 18, 14, 0, Math.PI * 2);
      ctx.arc(60, 18, 14, 0, Math.PI * 2);
      ctx.stroke();
      // Pile of Green Pollachi Tender Coconuts
      ctx.fillStyle = '#44bd32';
      for (let i = 0; i < 14; i++) {
        const cx = 8 + (i % 5) * 13 + (Math.floor(i / 5) * 4);
        const cy = -15 - Math.floor(i / 5) * 11;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 7, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Curved iron Aruval (sickle)
      ctx.strokeStyle = '#dcdde1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(62, -26);
      ctx.quadraticCurveTo(72, -18, 68, -8);
      ctx.stroke();
      ctx.restore();
    } else if (landmark.id === 'toda_hut') {
      // Sacred Toda Barrel-Vaulted Mund Hut (தோடா மந்து)
      ctx.save();
      ctx.translate(sx, sy);
      // Arched barrel vault thatch roof
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.arc(55, 30, 52, Math.PI, 0);
      ctx.lineTo(107, 30);
      ctx.lineTo(3, 30);
      ctx.fill();
      // Front stone facade
      ctx.fillStyle = '#dfdcd7';
      ctx.fillRect(20, -10, 70, 40);
      // Tiny crawling door
      ctx.fillStyle = '#1e1610';
      ctx.fillRect(45, 10, 20, 20);
      // Toda Red & Black geometric Poothkuly embroidery motif on lintel
      ctx.fillStyle = '#d63031';
      ctx.fillRect(20, -10, 70, 6);
      ctx.fillStyle = '#000000';
      for (let tx = 25; tx < 85; tx += 10) {
        ctx.fillRect(tx, -9, 4, 4);
      }
      // Buffalo Horn carving above door
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(42, 2);
      ctx.quadraticCurveTo(55, -6, 68, 2);
      ctx.stroke();
      ctx.restore();
    } else if (landmark.id === 'kurinji_shola') {
      // Neelakurinji Blossom Cluster (நீலக்குறிஞ்சி மலர்கள்)
      ctx.save();
      ctx.translate(sx, sy);
      // Shola Grass patch
      ctx.fillStyle = '#2f5731';
      ctx.beginPath();
      ctx.ellipse(40, 25, 45, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hundreds of Lavender-Blue bell flowers
      ctx.fillStyle = '#9c88ff';
      for (let k = 0; k < 22; k++) {
        const kx = 10 + Math.sin(k * 3.7) * 32 + 25;
        const ky = 10 + Math.cos(k * 2.3) * 14 + 10;
        ctx.beginPath();
        ctx.arc(kx, ky, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Draw natural foliage based on tree type
  drawFoliage(ctx, tree, cam) {
    const sx = tree.x - cam.x;
    const sy = tree.y - cam.y;

    if (tree.type === 'palmyra') {
      // Tamil Nadu State Tree: Palmyra Palm (Panai Maram)
      ctx.save();
      ctx.translate(sx, sy);
      // Trunk shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tall slender rough black trunk
      ctx.fillStyle = '#2d241e';
      ctx.fillRect(-4, -130, 8, 130);
      // Crown of fan-shaped palmyra fronds
      ctx.fillStyle = '#204018';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
        ctx.beginPath();
        ctx.moveTo(0, -130);
        ctx.lineTo(Math.cos(a) * 35, -130 + Math.sin(a) * 35);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#2d5a22';
        ctx.stroke();
      }
      // Weaver bird woven nest hanging
      ctx.fillStyle = '#8b6914';
      ctx.beginPath();
      ctx.ellipse(-15, -105, 5, 10, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (tree.type === 'mangrove') {
      // Pichavaram Rhizophora Mangrove with arched aerial stilt roots
      ctx.save();
      ctx.translate(sx, sy);
      // Dense arched roots dipping into water
      ctx.strokeStyle = '#3e2716';
      ctx.lineWidth = 3.5;
      for (let r = -25; r <= 25; r += 10) {
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.quadraticCurveTo(r * 1.4, -10, r, 5);
        ctx.stroke();
      }
      // Dense round canopy
      ctx.fillStyle = '#1e4822';
      ctx.beginPath();
      ctx.arc(0, -45, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (tree.type === 'pine') {
      // Nilgiri Highland Mountain Pine
      ctx.save();
      ctx.translate(sx, sy);
      // Trunk
      ctx.fillStyle = '#4a2f1b';
      ctx.fillRect(-5, -25, 10, 25);
      // Tiered triangular pine needles
      ctx.fillStyle = '#14381d';
      for (let tier = 0; tier < 3; tier++) {
        const ty = -30 - (tier * 22);
        const w = 32 - (tier * 7);
        ctx.beginPath();
        ctx.moveTo(-w, ty + 18);
        ctx.lineTo(0, ty - 12);
        ctx.lineTo(w, ty + 18);
        ctx.fill();
      }
      ctx.restore();
    } else if (tree.type === 'tea_bush') {
      // Emerald Tea Estate Bush
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = '#22722b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#39aa45'; // tender tea tips
      ctx.beginPath();
      ctx.ellipse(-2, -3, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw campfires and player tents
  drawCampItems(ctx, campfires, tents, cam) {
    // Campfires
    for (let fire of campfires) {
      const fx = fire.x - cam.x;
      const fy = fire.y - cam.y;
      if (fx < -50 || fx > cam.viewportWidth + 50 || fy < -50 || fy > cam.viewportHeight + 50) continue;

      ctx.save();
      ctx.translate(fx, fy);

      // Stone ring
      ctx.fillStyle = '#555';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 14, Math.sin(a) * 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Burning logs
      ctx.strokeStyle = '#3e2716';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -3);
      ctx.lineTo(10, 3);
      ctx.moveTo(-8, 4);
      ctx.lineTo(8, -4);
      ctx.stroke();

      // Flickering fire flame
      const flameHeight = 12 + Math.sin(Date.now() * 0.02) * 5;
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, -flameHeight, 0, -flameHeight - 5);
      ctx.quadraticCurveTo(2, -flameHeight * 0.7, 6, 0);
      ctx.fill();

      // Inner golden core
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.arc(0, -3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Canvas Tents
    for (let tent of tents) {
      const tx = tent.x - cam.x;
      const ty = tent.y - cam.y;
      if (tx < -80 || tx > cam.viewportWidth + 80 || ty < -80 || ty > cam.viewportHeight + 80) continue;

      ctx.save();
      ctx.translate(tx, ty);
      // Canvas A-frame tent
      ctx.fillStyle = '#d7c49e';
      ctx.beginPath();
      ctx.moveTo(-28, 12);
      ctx.lineTo(0, -28);
      ctx.lineTo(28, 12);
      ctx.fill();

      // Tent flap entrance
      ctx.fillStyle = '#2d241e';
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.lineTo(0, -8);
      ctx.lineTo(10, 12);
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw HUD prompt when player is within range of an interactable
  drawInteractionPrompt(ctx, player, cam) {
    if (!player.nearbyInteractable) return;
    const item = player.nearbyInteractable;
    const sx = item.x - cam.x;
    const sy = (item.y - (item.height || 30)) - cam.y - 25;

    ctx.save();
    ctx.translate(sx, sy);

    // Glowing badge
    ctx.fillStyle = 'rgba(25, 20, 15, 0.9)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-80, -14, 160, 26, [6]);
    ctx.fill();
    ctx.stroke();

    // Text & Key hint
    ctx.fillStyle = '#f5e6cb';
    ctx.font = 'bold 11px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[E] ${item.interactionPrompt || 'Interact'}`, 0, 3);

    ctx.restore();
  }
}

window.WorldRenderer = WorldRenderer;
