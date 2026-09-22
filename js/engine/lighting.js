// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DYNAMIC LIGHTING & DAY/NIGHT ENGINE
// Point lights (lanterns, fires, streetlamps) + Ambient Day/Night Color Shading
// ============================================================================

class LightingEngine {
  constructor() {
    this.lights = [];
    this.timeOfDay = 17.5; // Starts at 5:30 PM (Dusk / Inciting Incident)
    this.timeSpeed = 0.05; // 1 real second = a few game minutes
    this.ambientColor = 'rgba(0, 0, 0, 0)';
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  resize(width, height) {
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
  }

  update(deltaTime, weatherState) {
    this.timeOfDay = (this.timeOfDay + (this.timeSpeed * deltaTime)) % 24;

    // Calculate ambient darkness & color tint based on timeOfDay & weather
    let darkness = 0.0;
    let r = 255, g = 255, b = 255;

    // 0:00 - 4:00 (Deep Night)
    if (this.timeOfDay >= 0 && this.timeOfDay < 4) {
      darkness = 0.88;
      r = 10; g = 18; b = 38;
    }
    // 4:00 - 6:00 (Pre-dawn blue hour)
    else if (this.timeOfDay >= 4 && this.timeOfDay < 6) {
      const factor = (this.timeOfDay - 4) / 2;
      darkness = 0.88 - factor * 0.45;
      r = 30 + factor * 50; g = 35 + factor * 60; b = 65 + factor * 40;
    }
    // 6:00 - 8:00 (Sunrise golden glow)
    else if (this.timeOfDay >= 6 && this.timeOfDay < 8) {
      const factor = (this.timeOfDay - 6) / 2;
      darkness = 0.43 - factor * 0.35;
      r = 255; g = 190 + factor * 50; b = 130 + factor * 110;
    }
    // 8:00 - 16:30 (Daylight)
    else if (this.timeOfDay >= 8 && this.timeOfDay < 16.5) {
      darkness = 0.05;
      r = 250; g = 250; b = 255;
    }
    // 16.5 - 18.5 (Sunset & Twilight)
    else if (this.timeOfDay >= 16.5 && this.timeOfDay < 18.5) {
      const factor = (this.timeOfDay - 16.5) / 2;
      darkness = 0.08 + factor * 0.55;
      r = 255 - factor * 80; g = 160 - factor * 90; b = 90 - factor * 30;
    }
    // 18.5 - 24:00 (Nightfall)
    else {
      const factor = (this.timeOfDay - 18.5) / 5.5;
      darkness = 0.63 + factor * 0.25;
      r = 20 - factor * 10; g = 25 - factor * 7; b = 50 - factor * 12;
    }

    // Weather impact on darkness
    if (weatherState.type === 'storm') {
      darkness = Math.min(0.85, darkness + 0.45);
    } else if (weatherState.type === 'rain') {
      darkness = Math.min(0.75, darkness + 0.25);
    } else if (weatherState.type === 'fog') {
      darkness = Math.min(0.65, darkness + 0.18);
    }

    this.darkness = darkness;
    this.ambientRGB = { r, g, b };
  }

  getFormattedTime() {
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const padMins = minutes < 10 ? '0' + minutes : minutes;
    return `${displayHours}:${padMins} ${period}`;
  }

  drawLightingPass(ctx, camera, player, campfires = []) {
    if (this.darkness < 0.12 && !player.isLanternOn && campfires.length === 0) {
      return; // Skip costly overlay during bright daylight
    }

    const w = this.lightCanvas.width;
    const h = this.lightCanvas.height;
    const lCtx = this.lightCtx;

    // 1. Fill light canvas with dark ambient veil
    lCtx.clearRect(0, 0, w, h);
    lCtx.fillStyle = `rgba(${this.ambientRGB.r * 0.12}, ${this.ambientRGB.g * 0.14}, ${this.ambientRGB.b * 0.22}, ${this.darkness})`;
    lCtx.fillRect(0, 0, w, h);

    // 2. Punch holes with point lights using 'destination-out'
    lCtx.globalCompositeOperation = 'destination-out';

    // Player Lantern Light
    if (player.isLanternOn) {
      const px = player.x - camera.x;
      const py = player.y - camera.y - 15;
      const flicker = Math.sin(Date.now() * 0.015) * 4;
      const radius = 175 + flicker;

      const grad = lCtx.createRadialGradient(px, py, 15, px, py, radius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      lCtx.fillStyle = grad;
      lCtx.beginPath();
      lCtx.arc(px, py, radius, 0, Math.PI * 2);
      lCtx.fill();
    }

    // Campfires Light
    for (let i = 0; i < campfires.length; i++) {
      const fire = campfires[i];
      const fx = fire.x - camera.x;
      const fy = fire.y - camera.y;
      if (fx < -200 || fx > w + 200 || fy < -200 || fy > h + 200) continue;

      const flicker = Math.sin(Date.now() * 0.02 + i) * 6;
      const radius = 210 + flicker;

      const grad = lCtx.createRadialGradient(fx, fy, 20, fx, fy, radius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.75)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      lCtx.fillStyle = grad;
      lCtx.beginPath();
      lCtx.arc(fx, fy, radius, 0, Math.PI * 2);
      lCtx.fill();
    }

    // Fixed Landmark lights (Murugan's Tea Stall samovar glow & streetlights)
    const fixedLights = [
      { x: 810, y: 550, r: 180 }, // Tea stall
      { x: 250, y: 580, r: 160 }, // High court entrance lamp
      { x: 4460, y: 460, r: 190 } // Nilgiri cottage hearth
    ];

    for (let light of fixedLights) {
      const lx = light.x - camera.x;
      const ly = light.y - camera.y;
      if (lx < -200 || lx > w + 200 || ly < -200 || ly > h + 200) continue;

      const flicker = Math.sin(Date.now() * 0.012 + light.x) * 3;
      const rad = light.r + flicker;
      const grad = lCtx.createRadialGradient(lx, ly, 15, lx, ly, rad);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      lCtx.fillStyle = grad;
      lCtx.beginPath();
      lCtx.arc(lx, ly, rad, 0, Math.PI * 2);
      lCtx.fill();
    }

    // Reset composite operation & blend darkness onto game canvas
    lCtx.globalCompositeOperation = 'source-over';

    // Warm golden tint overlay for campfire & lantern halos
    ctx.drawImage(this.lightCanvas, 0, 0);

    // Warm glow color pass
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    if (player.isLanternOn) {
      const px = player.x - camera.x;
      const py = player.y - camera.y - 15;
      const warmGrad = ctx.createRadialGradient(px, py, 0, px, py, 140);
      warmGrad.addColorStop(0, 'rgba(255, 190, 80, 0.35)');
      warmGrad.addColorStop(1, 'rgba(255, 150, 40, 0)');
      ctx.fillStyle = warmGrad;
      ctx.beginPath();
      ctx.arc(px, py, 140, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.LightingEngine = LightingEngine;
