// Verifies the quality/tier fixes and measures REAL frame cost.
const puppeteer = require('puppeteer-core');
const EDGE = process.env.WW_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (page, id) => page.evaluate((i) => { const b = document.getElementById(i); if (b) b.click(); }, id);

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#ww-menu-new-game', { timeout: 180000 });

  // --- 1. What did the detector decide, before entering the world? ---
  const cap = await page.evaluate(() => {
    const g = window.GPUCapability;
    const p = window.GraphicsProfileManager;
    return {
      renderer: g.gpuRenderer, vendor: g.gpuVendor, tier: g.tier,
      webgl2: g.supportsWebGL2, webgpuPresent: g.supportsWebGPU,
      recDPR: g.getRecommendedPixelRatio(),
      quality: p ? p.currentQuality : null,
      profileDPR: p ? p.profile.renderPixelRatio : null,
      shadowsEnabled: p ? p.profile.shadowsEnabled : null,
    };
  });
  console.log('=== GPU / QUALITY SELECTION ===');
  console.log('  renderer        :', cap.renderer);
  console.log('  vendor          :', cap.vendor);
  console.log('  detected tier   :', cap.tier, '   <-- was MEDIUM before the fix');
  console.log('  recommended DPR :', cap.recDPR);
  console.log('  quality preset  :', cap.quality, `(renderPixelRatio=${cap.profileDPR}, shadows=${cap.shadowsEnabled})`);
  console.log('  webgpu in nav   :', cap.webgpuPresent, '(unused - game renders on WebGL)');

  // --- 2. Enter the world ---
  await click(page, 'ww-menu-new-game');
  await page.waitForSelector('#ww-setup-proceed', { timeout: 30000 });
  await click(page, 'ww-setup-proceed');
  await page.waitForSelector('#ww-prologue-begin', { timeout: 30000 });
  await click(page, 'ww-prologue-begin');
  for (let i = 0; i < 60; i++) {
    const up = await page.evaluate(() => !!(window.threeWorld && window.threeWorld.isActive));
    if (up) break; await sleep(2000);
  }

  // --- 3. Applied renderer state in the live world ---
  const live = await page.evaluate(() => {
    const r = window.threeWorld.renderer;
    return {
      pixelRatio: r.getPixelRatio(),
      drawingBuffer: `${r.domElement.width}x${r.domElement.height}`,
      cssSize: `${r.domElement.clientWidth}x${r.domElement.clientHeight}`,
      shadowsOn: r.shadowMap.enabled,
      calls: r.info.render.calls,
      tris: r.info.render.triangles,
      programs: r.info.programs ? r.info.programs.length : null,
      geometries: r.info.memory.geometries,
      textures: r.info.memory.textures,
      degradeStep: window.GraphicsProfileManager ? window.GraphicsProfileManager._degradeStep : null,
      dynRes: window.GraphicsProfileManager ? window.GraphicsProfileManager._dynResScale : null,
    };
  });
  console.log('\n=== LIVE RENDERER STATE ===');
  console.log('  pixel ratio     :', live.pixelRatio.toFixed(3));
  console.log('  drawing buffer  :', live.drawingBuffer, ' from CSS', live.cssSize);
  console.log('  shadows         :', live.shadowsOn ? 'ON' : 'OFF');
  console.log('  draw calls      :', live.calls);
  console.log('  triangles       :', live.tris);
  console.log('  programs        :', live.programs, '| geometries', live.geometries, '| textures', live.textures);
  console.log('  degradeStep     :', live.degradeStep, '| dynResScale', live.dynRes);

  // --- 4. Measure real frame pacing ---
  const perf = await page.evaluate(() => new Promise((resolve) => {
    const times = [];
    let last = performance.now();
    const MAX = 150;
    function tick(now) {
      times.push(now - last); last = now;
      if (times.length < MAX) requestAnimationFrame(tick);
      else {
        times.sort((a, b) => a - b);
        const mean = times.reduce((a, b) => a + b, 0) / times.length;
        resolve({
          frames: times.length,
          meanMs: +mean.toFixed(2),
          medianMs: +times[Math.floor(times.length / 2)].toFixed(2),
          p95Ms: +times[Math.floor(times.length * 0.95)].toFixed(2),
          fpsMean: +(1000 / mean).toFixed(1),
          fpsMedian: +(1000 / times[Math.floor(times.length / 2)]).toFixed(1),
        });
      }
    }
    requestAnimationFrame(tick);
  }));
  console.log('\n=== MEASURED FRAME PACING (150 frames) ===');
  console.log('  mean   ', perf.meanMs + ' ms  ->', perf.fpsMean, 'FPS');
  console.log('  median ', perf.medianMs + ' ms  ->', perf.fpsMedian, 'FPS');
  console.log('  p95    ', perf.p95Ms + ' ms');
  console.log('  NOTE: this VM has no GPU (software rasteriser). Treat these as a');
  console.log('        relative signal only, NOT as your laptop\'s real FPS.');

  await browser.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
