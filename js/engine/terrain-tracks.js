// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DYNAMIC TERRAIN TRACKS ENGINE
// Footprints & Enfield Tyre Tread Decals that imprint in mud/sand & wash away in rain
// ============================================================================

class TerrainTracksManager {
  constructor() {
    this.tracks = [];
    this.maxTracks = 250;
    this.stepCounter = 0;
    this.lastPlayerPos = { x: 0, y: 0 };
  }

  addFootprint(x, y, angle, isLeft = true, surface = 'mud', fpConfig = null) {
    // Offset left or right foot relative to forward angle
    const lateralOffset = isLeft ? -5 : 5;
    const px = x + Math.cos(angle + Math.PI / 2) * lateralOffset;
    const py = y + Math.sin(angle + Math.PI / 2) * lateralOffset;

    const defaultColor = surface === 'shallow_water' ? 'rgba(30, 60, 70, ' : 
                         surface === 'asphalt' ? 'rgba(60, 55, 50, ' : 
                         surface === 'grass' ? 'rgba(30, 45, 20, ' : 'rgba(40, 20, 10, ';

    const cfg = fpConfig || {
      depth: surface === 'asphalt' ? 0.3 : (surface === 'shallow_water' ? 0.2 : 0.7),
      soleWidth: 3.5,
      heelDepth: 0.75,
      splashRing: surface === 'shallow_water',
      color: defaultColor
    };

    this.tracks.push({
      type: 'footprint',
      x: px,
      y: py,
      angle: angle,
      isLeft: isLeft,
      surface: surface,
      fpConfig: cfg,
      alpha: 0.65,
      createdAt: Date.now()
    });

    if (this.tracks.length > this.maxTracks) {
      this.tracks.shift();
    }
  }

  addTyreTrack(x, y, angle) {
    this.tracks.push({
      type: 'tyre',
      x: x,
      y: y,
      angle: angle,
      alpha: 0.85,
      createdAt: Date.now()
    });

    if (this.tracks.length > this.maxTracks) {
      this.tracks.shift();
    }
  }

  // Pre-seed the prologue Enfield bike escape skid marks
  seedPrologueEnfieldTracks() {
    let curX = 320;
    let curY = 620;
    for (let i = 0; i < 45; i++) {
      curX += 16 + Math.sin(i * 0.1) * 2;
      curY += 2 + Math.cos(i * 0.2) * 1.5;
      this.addTyreTrack(curX, curY, 0.15);
    }
  }

  update(weatherState, deltaTime) {
    const isRaining = weatherState.type === 'rain' || weatherState.type === 'storm';
    const decayRate = isRaining ? (weatherState.type === 'storm' ? 0.08 : 0.04) : 0.005;

    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const track = this.tracks[i];
      track.alpha -= decayRate * deltaTime;

      if (track.alpha <= 0) {
        this.tracks.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();

    for (let i = 0; i < this.tracks.length; i++) {
      const t = this.tracks[i];
      const screenX = t.x - camera.x;
      const screenY = t.y - camera.y;

      // Frustum culling
      if (screenX < -30 || screenX > camera.viewportWidth + 30 ||
          screenY < -30 || screenY > camera.viewportHeight + 30) {
        continue;
      }

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(t.angle);

      if (t.type === 'footprint') {
        const cfg = t.fpConfig || { depth: 0.75, soleWidth: 3.5, heelDepth: 0.75, splashRing: false, color: 'rgba(40, 20, 10, ' };
        const baseColor = cfg.color || 'rgba(40, 20, 10, ';
        const soleW = cfg.soleWidth || 3.5;
        const depth = cfg.depth || 0.65;

        // Footprint sole impression
        ctx.fillStyle = `${baseColor}${t.alpha * (0.4 + 0.45 * depth)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, soleW, 6 * (0.8 + 0.3 * depth), 0, 0, Math.PI * 2);
        ctx.fill();

        // Heel indentation
        ctx.fillStyle = `${baseColor}${t.alpha * (0.5 + 0.45 * cfg.heelDepth)})`;
        ctx.beginPath();
        ctx.ellipse(0, 5, soleW * 0.7, 2.5 * depth, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water ripple/splash ring for shallow water
        if (cfg.splashRing) {
          ctx.strokeStyle = `rgba(130, 180, 200, ${t.alpha * 0.45})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, 1, soleW * 2.2, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (t.type === 'tyre') {
        // Royal Enfield Chevron tread
        ctx.fillStyle = `rgba(30, 15, 8, ${t.alpha * 0.8})`;
        ctx.fillRect(-2, -6, 4, 12);
        // Cross grooves
        ctx.strokeStyle = `rgba(15, 8, 4, ${t.alpha * 0.9})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-3, -3);
        ctx.lineTo(3, 0);
        ctx.moveTo(-3, 3);
        ctx.lineTo(3, 6);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

window.TerrainTracksManager = TerrainTracksManager;
