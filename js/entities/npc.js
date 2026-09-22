// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - LIVING NPCS & WILDLIFE ENTITIES
// Murugan Annan, Farmer Selvam, Kangayam Bull, Nilgiri Tahr & Weaver Birds
// ============================================================================

class EntityManager {
  constructor() {
    this.wildlife = [];
    this.npcs = [];
    this.initEntities();
  }

  initEntities() {
    // 1. Interactive Living NPCs
    this.npcs = [
      {
        id: 'murugan',
        name: 'Murugan Annan',
        role: 'Tea Kadai Master',
        x: 770,
        y: 535,
        type: 'human',
        actionTime: 0,
        interactId: 'tea_kadai'
      },
      {
        id: 'selvam',
        name: 'Farmer Murugan / Selvam',
        role: 'Village Farmer & Bull Breeder',
        x: 1350,
        y: 650,
        type: 'human',
        actionTime: 0,
        interactId: 'farmer_selvam'
      },
      {
        id: 'karthik',
        name: 'Karthik (மலை வழிகாட்டி)',
        role: 'Nilgiri Trekking Guide',
        x: 4350,
        y: 480,
        type: 'human',
        actionTime: 0,
        interactId: 'hill_guide_karthik'
      }
    ];

    // 2. Roaming Wildlife
    this.wildlife = [
      {
        id: 'jallikattu_bull',
        name: 'Kangayam Bull',
        x: 1580,
        y: 490,
        targetX: 1580,
        targetY: 490,
        vx: 0,
        vy: 0,
        state: 'grazing',
        timer: 0,
        width: 38,
        height: 24,
        color: '#2a2a2a'
      },
      {
        id: 'palmyra_weaver',
        name: 'Baya Weaver Bird',
        x: 880,
        y: 340,
        baseX: 880,
        baseY: 340,
        flyPhase: 0,
        width: 14,
        height: 10
      },
      {
        id: 'great_egret',
        name: 'Pichavaram White Egret',
        x: 2750,
        y: 720,
        targetX: 2750,
        targetY: 720,
        timer: 0,
        width: 22,
        height: 28
      },
      {
        id: 'nilgiri_tahr',
        name: 'Nilgiri Tahr',
        x: 4980,
        y: 360,
        targetX: 4980,
        targetY: 360,
        timer: 0,
        width: 32,
        height: 24
      }
    ];
  }

  update(deltaTime) {
    // 1. Update NPC animations
    for (let npc of this.npcs) {
      npc.actionTime += deltaTime;
    }

    // 2. Wildlife wandering & behaviors
    // Kangayam Bull
    const bull = this.wildlife.find(w => w.id === 'jallikattu_bull');
    if (bull) {
      bull.timer += deltaTime;
      if (bull.timer > 5.0) {
        bull.timer = 0;
        bull.targetX = 1540 + Math.random() * 80;
        bull.targetY = 470 + Math.random() * 50;
      }
      const dx = bull.targetX - bull.x;
      const dy = bull.targetY - bull.y;
      bull.x += dx * 0.02;
      bull.y += dy * 0.02;
    }

    // Weaver Bird flight loop
    const bird = this.wildlife.find(w => w.id === 'palmyra_weaver');
    if (bird) {
      bird.flyPhase += deltaTime * 2;
      bird.x = bird.baseX + Math.sin(bird.flyPhase) * 60;
      bird.y = bird.baseY + Math.cos(bird.flyPhase * 1.5) * 35;
    }

    // Egret wading
    const egret = this.wildlife.find(w => w.id === 'great_egret');
    if (egret) {
      egret.timer += deltaTime;
      if (egret.timer > 6) {
        egret.timer = 0;
        egret.targetX = 2680 + Math.random() * 120;
        egret.targetY = 680 + Math.random() * 60;
      }
      egret.x += (egret.targetX - egret.x) * 0.015;
      egret.y += (egret.targetY - egret.y) * 0.015;
    }

    // Nilgiri Tahr crag grazing
    const tahr = this.wildlife.find(w => w.id === 'nilgiri_tahr');
    if (tahr) {
      tahr.timer += deltaTime;
      if (tahr.timer > 7) {
        tahr.timer = 0;
        tahr.targetX = 4920 + Math.random() * 100;
      }
      tahr.x += (tahr.targetX - tahr.x) * 0.01;
    }
  }

  draw(ctx, camera) {
    // 1. Draw NPCs
    for (let npc of this.npcs) {
      const sx = npc.x - camera.x;
      const sy = npc.y - camera.y;
      if (sx < -40 || sx > camera.viewportWidth + 40 || sy < -40 || sy > camera.viewportHeight + 40) continue;

      ctx.save();
      ctx.translate(sx, sy);

      // Shadow
      ctx.fillStyle = 'rgba(10, 15, 20, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (npc.id === 'murugan') {
        // Murugan Annan - White Veshti / Apron
        ctx.fillStyle = '#f8f8f8';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder towel (Thundu)
        ctx.fillStyle = '#d94b26'; // orange/red traditional checked towel
        ctx.fillRect(-6, -8, 12, 4);

        // Head with moustache
        ctx.fillStyle = '#6e4726';
        ctx.beginPath();
        ctx.arc(0, -1, 5, 0, Math.PI * 2);
        ctx.fill();

        // Arm holding tea strainer / glass tumbler
        const teaArmOffset = Math.sin(npc.actionTime * 3) * 3;
        ctx.fillStyle = '#6e4726';
        ctx.fillRect(5, -4 + teaArmOffset, 5, 3);
        ctx.fillStyle = '#e8d4a2'; // Cutting glass
        ctx.fillRect(10, -5 + teaArmOffset, 3, 5);
      } else if (npc.id === 'selvam') {
        // Farmer Selvam / Murugan with turban & cotton dhoti
        ctx.fillStyle = '#c5a059';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Green farmer turban
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.ellipse(0, -3, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (npc.id === 'karthik') {
        // Mountain Guide Karthik - Woolen sweater & cargo trousers
        ctx.fillStyle = '#1e3799'; // Woolen blue sweater
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cargo trousers
        ctx.fillStyle = '#4a6572';
        ctx.fillRect(-6, 2, 12, 6);

        // Head with woolen beanie cap
        ctx.fillStyle = '#6e4726';
        ctx.beginPath();
        ctx.arc(0, -1, 5, 0, Math.PI * 2);
        ctx.fill();

        // Beanie Cap
        ctx.fillStyle = '#b71540';
        ctx.beginPath();
        ctx.ellipse(0, -4, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trekking Pole
        ctx.strokeStyle = '#c8d6e5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(10, 8);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 2. Draw Wildlife
    // Kangayam Bull
    const bull = this.wildlife.find(w => w.id === 'jallikattu_bull');
    if (bull) {
      const bx = bull.x - camera.x;
      const by = bull.y - camera.y;
      if (bx > -60 && bx < camera.viewportWidth + 60 && by > -60 && by < camera.viewportHeight + 60) {
        ctx.save();
        ctx.translate(bx, by);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Muscular Kangayam Bull Body
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hump (Timir)
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(4, -8, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(16, -2, 7, 0, Math.PI * 2);
        ctx.fill();

        // Magnificent Curved Horns
        ctx.strokeStyle = '#e0d8c0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(18, -6);
        ctx.quadraticCurveTo(24, -18, 16, -22); // Right horn
        ctx.moveTo(14, -6);
        ctx.quadraticCurveTo(18, -17, 10, -20); // Left horn
        ctx.stroke();

        ctx.restore();
      }
    }

    // Weaver Bird
    const bird = this.wildlife.find(w => w.id === 'palmyra_weaver');
    if (bird) {
      const px = bird.x - camera.x;
      const py = bird.y - camera.y;
      if (px > -20 && px < camera.viewportWidth + 20 && py > -20 && py < camera.viewportHeight + 20) {
        ctx.save();
        ctx.translate(px, py);
        // Golden yellow crown
        ctx.fillStyle = '#e6b800';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        // Wings flapping
        const flap = Math.sin(bird.flyPhase * 8) * 4;
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(0, -flap);
        ctx.lineTo(4, 0);
        ctx.fill();
        ctx.restore();
      }
    }

    // Great Egret
    const egret = this.wildlife.find(w => w.id === 'great_egret');
    if (egret) {
      const ex = egret.x - camera.x;
      const ey = egret.y - camera.y;
      if (ex > -30 && ex < camera.viewportWidth + 30 && ey > -30 && ey < camera.viewportHeight + 30) {
        ctx.save();
        ctx.translate(ex, ey);
        // Pure White body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Long slender S-neck
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(4, -18, 2, -24);
        ctx.stroke();
        // Yellow beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(2, -25);
        ctx.lineTo(9, -24);
        ctx.lineTo(2, -23);
        ctx.fill();
        ctx.restore();
      }
    }

    // Nilgiri Tahr
    const tahr = this.wildlife.find(w => w.id === 'nilgiri_tahr');
    if (tahr) {
      const tx = tahr.x - camera.x;
      const ty = tahr.y - camera.y;
      if (tx > -40 && tx < camera.viewportWidth + 40 && ty > -40 && ty < camera.viewportHeight + 40) {
        ctx.save();
        ctx.translate(tx, ty);
        // Saddleback coat (coarse dark brown with greyish saddle patch)
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a7d6e'; // grey saddle
        ctx.fillRect(-4, -6, 8, 5);
        // Head & curved horns
        ctx.fillStyle = '#3a2718';
        ctx.beginPath();
        ctx.arc(11, -3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(11, -6);
        ctx.quadraticCurveTo(14, -13, 8, -14); // backward curved horns
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

window.EntityManager = EntityManager;
