// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DYNAMIC PARTICLE ENGINE
// Weather particles (rain streaks, splashes, storm hail, mountain fog, embers)
// ============================================================================

class ParticleEngine {
  constructor() {
    this.rainDrops = [];
    this.ripples = [];
    this.fogClouds = [];
    this.embers = [];
    this.maxRain = 400;
    this.maxFog = 25;
    this.initFog();
  }

  initFog() {
    for (let i = 0; i < this.maxFog; i++) {
      this.fogClouds.push({
        x: Math.random() * 6000,
        y: Math.random() * 1200,
        radius: 120 + Math.random() * 180,
        speedX: 0.15 + Math.random() * 0.25,
        alpha: 0.15 + Math.random() * 0.25
      });
    }
  }

  spawnRainDrop(width, height) {
    return {
      x: Math.random() * (width + 400) - 200,
      y: -20 - Math.random() * 100,
      length: 14 + Math.random() * 18,
      speedX: -2.5 - Math.random() * 2,
      speedY: 18 + Math.random() * 8,
      alpha: 0.4 + Math.random() * 0.4
    };
  }

  spawnRipple(x, y) {
    this.ripples.push({
      x: x,
      y: y,
      radius: 2,
      maxRadius: 10 + Math.random() * 8,
      alpha: 0.7
    });
    if (this.ripples.length > 80) this.ripples.shift();
  }

  spawnEmbers(worldX, worldY, count = 2) {
    for (let i = 0; i < count; i++) {
      this.embers.push({
        x: worldX + (Math.random() * 16 - 8),
        y: worldY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1.2 - Math.random() * 1.5,
        size: 1.5 + Math.random() * 2,
        life: 1.0,
        color: Math.random() > 0.3 ? '#ffaa33' : '#ff4411'
      });
    }
    if (this.embers.length > 70) this.embers.shift();
  }

  update(weatherState, deltaTime, viewportWidth, viewportHeight, camera) {
    // 1. Rain & Storm updates
    const isRaining = weatherState.type === 'rain' || weatherState.type === 'storm';
    const targetCount = isRaining ? (weatherState.type === 'storm' ? this.maxRain : this.maxRain / 2) : 0;

    while (this.rainDrops.length < targetCount) {
      this.rainDrops.push(this.spawnRainDrop(viewportWidth, viewportHeight));
    }
    while (this.rainDrops.length > targetCount) {
      this.rainDrops.pop();
    }

    for (let i = 0; i < this.rainDrops.length; i++) {
      const drop = this.rainDrops[i];
      drop.x += drop.speedX;
      drop.y += drop.speedY;

      if (drop.y > viewportHeight + 20 || drop.x < -250) {
        // Chance to spawn ground ripple before recycling
        if (Math.random() < 0.25) {
          this.spawnRipple(drop.x + camera.x, drop.y + camera.y - 10);
        }
        Object.assign(drop, this.spawnRainDrop(viewportWidth, viewportHeight));
      }
    }

    // 2. Ripple updates
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 24 * deltaTime;
      r.alpha -= 1.4 * deltaTime;
      if (r.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    // 3. Embers update
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.x += e.vx + (Math.sin(e.life * 10) * 0.4);
      e.y += e.vy;
      e.life -= 0.6 * deltaTime;
      if (e.life <= 0) {
        this.embers.splice(i, 1);
      }
    }

    // 4. Fog clouds update
    for (let i = 0; i < this.fogClouds.length; i++) {
      const fog = this.fogClouds[i];
      fog.x += fog.speedX;
      if (fog.x > 6200) fog.x = -200;
    }
  }

  drawWeather(ctx, viewportWidth, viewportHeight) {
    // Screen-space rain streaks
    if (this.rainDrops.length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(190, 215, 245, 0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < this.rainDrops.length; i++) {
        const drop = this.rainDrops[i];
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.speedX * 1.6, drop.y + drop.length);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  drawWorldParticles(ctx, camera, weatherState) {
    // 1. Ripples in world space
    if (this.ripples.length > 0) {
      ctx.save();
      for (let i = 0; i < this.ripples.length; i++) {
        const r = this.ripples[i];
        const sx = r.x - camera.x;
        const sy = r.y - camera.y;
        if (sx < -20 || sx > camera.viewportWidth + 20 || sy < -20 || sy > camera.viewportHeight + 20) continue;

        ctx.strokeStyle = `rgba(180, 215, 255, ${r.alpha * 0.6})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(sx, sy, r.radius, r.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Embers in world space
    if (this.embers.length > 0) {
      ctx.save();
      for (let i = 0; i < this.embers.length; i++) {
        const e = this.embers[i];
        const sx = e.x - camera.x;
        const sy = e.y - camera.y;
        ctx.fillStyle = e.color;
        ctx.globalAlpha = Math.max(0, e.life);
        ctx.beginPath();
        ctx.arc(sx, sy, e.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Misty Mountain Fog in Western Ghats or Foggy weather
    const isFoggy = weatherState.type === 'fog' || (camera.x > 3800);
    if (isFoggy) {
      ctx.save();
      for (let i = 0; i < this.fogClouds.length; i++) {
        const f = this.fogClouds[i];
        const sx = f.x - camera.x;
        const sy = f.y - camera.y;
        if (sx < -f.radius || sx > camera.viewportWidth + f.radius ||
            sy < -f.radius || sy > camera.viewportHeight + f.radius) continue;

        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, f.radius);
        grad.addColorStop(0, `rgba(235, 245, 255, ${f.alpha * 0.4})`);
        grad.addColorStop(0.6, `rgba(215, 230, 245, ${f.alpha * 0.15})`);
        grad.addColorStop(1, 'rgba(200, 220, 240, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

window.ParticleEngine = ParticleEngine;
