#!/usr/bin/env node
/**
 * The Whispering Wilds - Authoritative Runtime / Error Audit
 *
 * Boots the real game in a real browser, walks the real flow
 * (main menu -> player setup -> prologue -> 3D world), then captures:
 *   - every console message, by type, with deduped counts
 *   - uncaught page exceptions
 *   - every failed network request (404 / 403 / 5xx / transport error)
 *   - WebGL vendor / renderer / version / limits
 *   - live renderer.info (draw calls, triangles, geometries, textures, programs)
 *   - sampled FPS / frame time
 *   - audio context state and audio load failures
 *
 * Writes reports/runtime-error-audit.json and reports/runtime-error-audit.md
 *
 * Usage:
 *   node scripts/runtime-error-audit.js
 *   GAME_URL=http://localhost:3000 HEADFUL=1 node scripts/runtime-error-audit.js
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const GAME_URL = process.env.GAME_URL || 'http://localhost:3000';
const HEADFUL = process.env.HEADFUL === '1';
const BOOT_TIMEOUT_MS = 120000;
const FPS_WINDOW_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findEdge() {
  const candidates = [
    process.env.EDGE_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function serverUp() {
  return new Promise((resolve) => {
    const req = http.get(`${GAME_URL}/api/v1/health`, { timeout: 4000 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function ensureServer() {
  if (await serverUp()) return null;
  process.stdout.write('Server not reachable - starting it...\n');
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT, stdio: 'ignore', detached: false,
  });
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    if (await serverUp()) return child;
  }
  throw new Error('Server failed to start within 40s');
}

const bucketize = (text) => {
  const t = String(text);
  if (/\[WORLD ASSET MISSING\]|Missing or failed load/i.test(t)) return 'world-asset-missing';
  if (/THREE\.GLTFLoader|GLTFLoader|Failed to load.*\.(glb|gltf)/i.test(t)) return 'gltf-load-failure';
  if (/\[world-asset-fallback\]|procedural fallback/i.test(t)) return 'procedural-fallback';
  if (/AudioContext|play\(\) failed|NotAllowedError|DecodingAudioData/i.test(t)) return 'audio';
  if (/404 \(Not Found\)/.test(t)) return 'http-404';
  if (/favicon/i.test(t)) return 'favicon';
  if (/Failed to load resource/i.test(t)) return 'http-other';
  if (/TypeError|ReferenceError|SyntaxError|is not a function|is not defined|Cannot read/i.test(t)) return 'js-exception';
  if (/deprecated|Deprecation/i.test(t)) return 'deprecation';
  if (/WebGL|shader|GPU|context lost/i.test(t)) return 'graphics';
  return 'other';
};

const assetOf = (url) => {
  const clean = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '');
  const m = clean.match(/^\/?(assets\/[^?#]+)/);
  return m ? m[1] : clean;
};

const bucketOfAsset = (p) => {
  const m = p.match(/^\/?assets\/([^/]+)(?:\/([^/]+))?/);
  if (!m) return 'non-asset';
  return m[2] ? `${m[1]}/${m[2]}` : m[1];
};

/**
 * Root causes for the console patterns this game is known to emit.
 * Each entry is matched against captured console text; the location and
 * explanation were confirmed by reading the source at audit time.
 * `detectedCount` is filled from the run, never hardcoded.
 */
const ROOT_CAUSES = [
  {
    id: 'world-cell-queued-to-loaded',
    match: /Illegal state transition for (\S+): QUEUED -> LOADED/,
    severity: 'medium',
    where: 'js/systems/world-cell-manager.js:100-115',
    why: 'The cell state machine at line 100-109 allows QUEUED -> [LOADING, UNLOADED, FAILED] ' +
      'but not QUEUED -> LOADED. A cell is being marked LOADED while it is still QUEUED, so the ' +
      'transition is rejected, the state is never advanced, and the guard warns on every attempt.',
    fix: 'Route the cell through LOADING before LOADED, or add LOADED to the QUEUED allowed list if ' +
      'a queued cell can legitimately complete without entering LOADING.',
  },
  {
    id: 'lambert-roughness-property',
    match: /MeshLambertMaterial: 'roughness' is not a property of this material/,
    severity: 'low',
    where: 'js/engine/streaming-renderer.js:105-108',
    why: 'MeshLambertMaterial has no roughness property; it belongs to MeshStandardMaterial / ' +
      'MeshPhysicalMaterial. three.js warns once per constructed instance, so the count scales with ' +
      'the number of streamed terrain chunks built.',
    fix: 'Use THREE.MeshStandardMaterial with roughness, or drop the roughness key and keep Lambert.',
  },
  {
    id: 'living-world-procedural-silhouette',
    match: /\[LivingWorld\] Missing local (NPC|wildlife) asset: (\S+)/,
    severity: 'medium',
    where: 'js/systems/ (LivingWorld NPC/wildlife spawn path)',
    why: 'The requested authored model does not exist, so the entity is replaced with a procedural ' +
      'silhouette. This is a degraded visual, not a crash, and it is logged rather than hidden.',
    fix: 'Author the missing model, or accept the procedural silhouette as the shipped art and ' +
      'remove the expectation of an authored asset from the registry.',
  },
  {
    id: 'world-asset-missing',
    match: /\[WORLD ASSET MISSING\]|Missing or failed load/,
    severity: 'medium',
    where: 'js/engine/production-world-assets.js:174-175',
    why: 'A registry entry points at a file that is not on disk. The loader logs and continues; ' +
      'the prop is simply absent from the world (it is NOT replaced by a fake mesh).',
    fix: 'Author the asset or point the registry entry at an existing model.',
  },
  {
    id: 'runtime-validator-self-heal',
    match: /\[RuntimeValidator\]\[Self-Healing\]/,
    severity: 'low',
    where: 'js/core/runtime-validator.js',
    why: 'The runtime validator detected invalid state and repaired it in place instead of throwing.',
    fix: 'Inspect the repaired value; a self-heal that fires every session points at an unresolved ' +
      'state bug upstream.',
  },
  {
    id: 'tracking-prevention',
    match: /Tracking Prevention blocked access to storage/,
    severity: 'informational',
    where: 'index.html (Firebase CDN scripts)',
    why: 'Browser storage partitioning applied to the Firebase CDN scripts. Harmless in this run, ' +
      'but it means Firebase storage access can be blocked by privacy settings.',
    fix: 'No action required unless Firebase persistence fails for real users.',
  },
];

(async () => {
  const edge = findEdge();
  if (!edge) { console.error('No Chrome/Edge binary found. Set EDGE_PATH.'); process.exit(1); }

  let server = null;
  let browser = null;
  try {
    server = await ensureServer();
    const puppeteer = require('puppeteer-core');

    browser = await puppeteer.launch({
      executablePath: edge,
      headless: !HEADFUL,
      args: [
        '--no-sandbox', '--disable-dev-shm-usage',
        '--enable-unsafe-swiftshader', '--use-gl=angle',
        '--autoplay-policy=no-user-gesture-required', '--mute-audio',
        '--no-first-run', '--no-default-browser-check',
      ],
      defaultViewport: { width: 1600, height: 900 },
    });

    const page = HEADFUL ? ((await browser.pages())[0] || await browser.newPage()) : await browser.newPage();

    const consoleMsgs = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('pageerror', (e) => pageErrors.push({ message: e.message, stack: (e.stack || '').split('\n').slice(0, 4).join('\n') }));
    page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text(), at: Date.now() }));
    page.on('response', (r) => {
      if (r.status() >= 400) failedRequests.push({ url: r.url(), status: r.status(), kind: 'http' });
    });
    page.on('requestfailed', (r) => {
      failedRequests.push({
        url: r.url(), status: (r.failure() || {}).errorCode || 'requestfailed',
        kind: 'transport', reason: (r.failure() || {}).errorText || '',
      });
    });

    process.stdout.write(`Booting ${GAME_URL} ...\n`);
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: BOOT_TIMEOUT_MS });
    await page.waitForSelector('#ww-menu-new-game', { timeout: BOOT_TIMEOUT_MS });

    const click = (id) => page.evaluate((i) => {
      const b = document.getElementById(i);
      if (b) { b.click(); return true; }
      return false;
    }, id);

    await click('ww-menu-new-game');
    await page.waitForSelector('#ww-setup-proceed', { timeout: 30000 });
    await click('ww-setup-proceed');
    await page.waitForSelector('#ww-prologue-begin', { timeout: 30000 });
    await click('ww-prologue-begin');

    // Wait for the 3D world to actually activate.
    let worldActive = false;
    for (let i = 0; i < 45; i++) {
      await sleep(2000);
      worldActive = await page.evaluate(() => !!(window.threeWorld && window.threeWorld.isActive));
      if (worldActive) break;
    }
    process.stdout.write(`  3D world active: ${worldActive}\n`);

    // Let streaming / audio / NPC work settle before sampling.
    await sleep(6000);

    // ---- WebGL + renderer capability ----
    const webgl = await page.evaluate(() => {
      const w = window.threeWorld;
      const r = w && w.renderer;
      if (!r) return { available: false };
      const gl = r.getContext ? r.getContext() : null;
      const out = { available: true };
      try {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        out.vendor = gl.getParameter(gl.VENDOR);
        out.renderer = gl.getParameter(gl.RENDERER);
        out.unmaskedVendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : null;
        out.unmaskedRenderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null;
        out.version = gl.getParameter(gl.VERSION);
        out.glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
        out.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        out.maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        out.maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        out.maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS);
        out.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        out.anisotropy = r.capabilities.getMaxAnisotropy ? r.capabilities.getMaxAnisotropy() : null;
      } catch (e) { out.glError = e.message; }
      out.shadowsEnabled = !!(r.shadowMap && r.shadowMap.enabled);
      out.shadowType = r.shadowMap ? r.shadowMap.type : null;
      out.pixelRatio = r.getPixelRatio ? r.getPixelRatio() : null;
      out.outputColorSpace = r.outputColorSpace || null;
      out.toneMapping = r.toneMapping || null;
      out.antialias = (gl.getContextAttributes && gl.getContextAttributes()) ? !!gl.getContextAttributes().antialias : null;
      out.isWebGL2 = !!(gl && typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext);
      return out;
    });

    // ---- FPS / frame time sampling over a real window ----
    const perf = await page.evaluate((ms) => new Promise((resolve) => {
      const samples = [];
      let last = performance.now();
      const t0 = last;
      function tick(now) {
        samples.push(now - last);
        last = now;
        if (now - t0 < ms) requestAnimationFrame(tick);
        else {
          const s = samples.slice(1).sort((a, b) => a - b);
          const avg = s.reduce((a, b) => a + b, 0) / (s.length || 1);
          resolve({
            frames: s.length,
            avgFps: +(1000 / avg).toFixed(2),
            avgFrameMs: +avg.toFixed(2),
            p95FrameMs: +(s[Math.floor(s.length * 0.95)] || 0).toFixed(2),
            worstFrameMs: +(s[s.length - 1] || 0).toFixed(2),
            minFps: +(1000 / (s[s.length - 1] || 1)).toFixed(2),
          });
        }
      }
      requestAnimationFrame(tick);
    }), FPS_WINDOW_MS);

    // ---- renderer.info + memory + player model + audio ----
    const runtime = await page.evaluate(() => {
      const w = window.threeWorld;
      const r = w && w.renderer;
      const out = {};

      out.rendererInfo = r ? {
        calls: r.info.render.calls,
        triangles: r.info.render.triangles,
        points: r.info.render.points,
        lines: r.info.render.lines,
        geometries: r.info.memory.geometries,
        textures: r.info.memory.textures,
        programs: (r.info.programs || []).length,
      } : null;

      out.player = (() => {
        const p = w && w.player;
        if (!p) return null;
        const o = { hasModel: false };
        try {
          const root = p.mesh || p.object || p.group || p.root;
          if (root) {
            o.hasModel = true;
            o.rootType = root.type;
            o.meshes = 0; o.skinnedMeshes = 0;
            root.traverse && root.traverse((n) => {
              if (n.isSkinnedMesh) o.skinnedMeshes++;
              else if (n.isMesh) o.meshes++;
            });
          }
          if (p.animations) o.animations = p.animations;
          else if (p.mixer) o.animations = p.mixer.getRoot() ? 'mixer-present' : 'mixer-present';
        } catch (e) { o.err = e.message; }
        const pos = p.getPosition ? p.getPosition() : null;
        out.playerPosition = pos ? { x: +pos.x.toFixed(2), y: +pos.y.toFixed(2), z: +pos.z.toFixed(2) } : null;
        return o;
      })();

      out.globals = {};
      for (const n of ['threeWorld', 'audioManager', 'audioSystem', 'AudioManager', 'audioRegistry',
        'productionWorldAssets', 'ProductionWorldAssets', 'productionAssets', 'worldAssetRegistry',
        'GraphicsSettings', 'DisplayManager', 'PerformanceDiagnostics', 'CraftingSystem', 'gameState',
        'audioCtx', 'AudioContext', 'THREE']) {
        const v = window[n];
        if (v === undefined) continue;
        out.globals[n] = typeof v === 'object' ? (Array.isArray(v) ? 'array' : 'object')
          : typeof v === 'function' ? 'function' : typeof v;
      }

      out.audio = (() => {
        const a = { audioElements: document.querySelectorAll('audio').length };
        const ctxs = [];
        // Probe the usual global holders for a live AudioContext.
        for (const holder of ['audioManager', 'audioSystem', 'AudioManager', 'audio', 'gameAudio']) {
          const h = window[holder];
          if (!h) continue;
          for (const k of ['context', 'ctx', 'audioContext', 'ac']) {
            const c = h[k];
            if (c && typeof c.state === 'string') {
              ctxs.push({ holder: `${holder}.${k}`, state: c.state, sampleRate: c.sampleRate, currentTime: +c.currentTime.toFixed(2) });
            }
          }
        }
        a.contexts = ctxs;
        a.contextCount = ctxs.length;
        a.runningContexts = ctxs.filter((c) => c.state === 'running').length;
        return a;
      })();

      out.dom = {
        visibleCanvas: document.querySelectorAll('canvas').length,
        loadingOverlayVisible: (() => {
          const l = document.getElementById('ww-loading-screen') || document.getElementById('loading-screen');
          return l ? getComputedStyle(l).display !== 'none' && getComputedStyle(l).opacity !== '0' : false;
        })(),
        openModals: Array.from(document.querySelectorAll('[class*="modal"]'))
          .filter((m) => getComputedStyle(m).display !== 'none').length,
      };

      return out;
    });

    await browser.close();
    browser = null;

    // ================= Aggregate =================
    const counts = { log: 0, info: 0, warn: 0, error: 0, debug: 0, other: 0 };
    const consoleByType = {};
    const consoleByBucket = {};
    const seen = new Map();
    for (const m of consoleMsgs) {
      const t = ['log', 'info', 'warn', 'error', 'debug'].includes(m.type) ? m.type : 'other';
      counts[t]++;
      consoleByType[t] = consoleByType[t] || [];
      const b = bucketize(m.text);
      consoleByBucket[b] = consoleByBucket[b] || { count: 0, sample: m.text.slice(0, 300) };
      consoleByBucket[b].count++;
      const key = t + '|' + m.text;
      if (!seen.has(key)) { seen.set(key, { type: t, count: 0, bucket: b, text: m.text.slice(0, 500) }); }
      seen.get(key).count++;
      if (consoleByType[t].length < 40) consoleByType[t].push(m.text.slice(0, 300));
    }

    const failedByAsset = {};
    for (const f of failedRequests) {
      const a = assetOf(f.url);
      const b = bucketOfAsset(a);
      if (!failedByAsset[b]) failedByAsset[b] = { count: 0, examples: [], statuses: {} };
      failedByAsset[b].count++;
      failedByAsset[b].statuses[f.status] = (failedByAsset[b].statuses[f.status] || 0) + 1;
      if (failedByAsset[b].examples.length < 5) failedByAsset[b].examples.push(a);
    }

    // Attach verified root causes to the captured evidence.
    const rootCauses = ROOT_CAUSES.map((rc) => {
      const hits = consoleMsgs.filter((m) => rc.match.test(m.text));
      const examples = [...new Set(hits.map((h) => h.text))].slice(0, 3);
      const affectedAssets = [...new Set(hits
        .map((h) => (h.text.match(/assets\/[^\s'"`,)]+/) || [])[0])
        .filter(Boolean))];
      return { ...rc, detected: hits.length > 0, detectedCount: hits.length, examples, affectedAssets: affectedAssets.slice(0, 12) };
    });

    const report = {
      generatedAt: new Date().toISOString(),
      commit: process.env.AUDIT_COMMIT || 'not-captured',
      target: GAME_URL,
      browser: {
        engine: 'Edge (Chromium) via puppeteer-core',
        headless: !HEADFUL,
        viewport: '1600x900',
        flags: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--mute-audio'],
        note: HEADFUL ? 'headful run' : 'headless run with software WebGL (SwiftShader fallback allowed)',
      },
      verdict: {
        worldActivated: worldActive,
        uncaughtExceptions: pageErrors.length,
        consoleErrors: counts.error,
        consoleWarnings: counts.warn,
        failedRequests: failedRequests.length,
        graphicsAvailable: !!webgl.available,
      },
      console: { totalMessages: consoleMsgs.length, byType: counts, byBucket: consoleByBucket, unique: [...seen.values()].sort((a, b) => b.count - a.count) },
      rootCauses,
      pageErrors,
      failedRequests: {
        total: failedRequests.length,
        byAssetGroup: failedByAsset,
        all: failedRequests,
      },
      webgl,
      performance: { sampled: perf, rendererInfo: runtime.rendererInfo },
      audio: runtime.audio,
      player: runtime.player,
      dom: runtime.dom,
      globals: runtime.globals,
    };

    const dir = path.join(ROOT, 'reports');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'runtime-error-audit.json'), JSON.stringify(report, null, 2));

    const pct = (n) => (report.verdict.uncaughtExceptions + report.verdict.consoleErrors === 0 ? 'PASS' : 'FAIL');
    const L = [];
    L.push('# Runtime / Error Audit', '');
    L.push(`Generated: ${report.generatedAt}  `);
    L.push(`Target: ${GAME_URL}  `);
    L.push(`Browser: ${report.browser.engine}, ${report.browser.headless ? 'headless' : 'headful'}, ${report.browser.viewport}`, '');
    L.push('## Verdict', '');
    L.push('| Check | Result |');
    L.push('| --- | --- |');
    L.push(`| 3D world activated | ${report.verdict.worldActivated ? 'YES' : 'NO'} |`);
    L.push(`| Uncaught exceptions | ${report.verdict.uncaughtExceptions} |`);
    L.push(`| Console errors | ${report.verdict.consoleErrors} |`);
    L.push(`| Console warnings | ${report.verdict.consoleWarnings} |`);
    L.push(`| Failed requests (4xx/5xx/transport) | ${report.verdict.failedRequests} |`);
    L.push(`| WebGL context available | ${report.verdict.graphicsAvailable ? 'YES' : 'NO'} |`);
    L.push(`| Overall | ${pct(report.verdict)} |`);
    L.push('');
    L.push('## Console message counts', '');
    L.push('| Type | Count |');
    L.push('| --- | --- |');
    Object.entries(counts).forEach(([k, v]) => L.push(`| ${k} | ${v} |`));
    L.push('');
    L.push('## Console messages by category', '');
    L.push('| Category | Count | Sample |');
    L.push('| --- | --- | --- |');
    Object.entries(consoleByBucket).sort((a, b) => b[1].count - a[1].count)
      .forEach(([k, v]) => L.push(`| ${k} | ${v.count} | ${v.sample.replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 150)} |`));
    L.push('');
    L.push('## Failed requests by asset group', '');
    L.push('| Asset group | Failed | Statuses | Example |');
    L.push('| --- | --- | --- | --- |');
    Object.entries(failedByAsset).sort((a, b) => b[1].count - a[1].count).forEach(([k, v]) =>
      L.push(`| ${k} | ${v.count} | ${JSON.stringify(v.statuses)} | ${v.examples[0] || ''} |`));
    L.push('');
    L.push('## WebGL / graphics', '');
    L.push('| Property | Value |');
    L.push('| --- | --- |');
    Object.entries(webgl).forEach(([k, v]) => L.push(`| ${k} | ${typeof v === 'object' ? JSON.stringify(v) : v} |`));
    L.push('');
    L.push('## Performance', '');
    L.push('```json', JSON.stringify({ sampled: perf, rendererInfo: runtime.rendererInfo }, null, 2), '```', '');
    L.push('## Audio', '');
    L.push('```json', JSON.stringify(runtime.audio, null, 2), '```', '');
    L.push('## Player model at runtime', '');
    L.push('```json', JSON.stringify(runtime.player, null, 2), '```', '');
    L.push('');
    L.push('## Identified root causes');
    L.push('Each row is matched against the captured console stream for this run. "Occurrences" is the');
    L.push('number of matching messages actually emitted, not a fixed expectation.');
    L.push('');
    L.push('| Root cause | Severity | Occurrences | Location |');
    L.push('| --- | --- | --- | --- |');
    rootCauses.filter((r) => r.detected).forEach((r) =>
      L.push(`| \`${r.id}\` | ${r.severity} | ${r.detectedCount} | \`${r.where}\` |`));
    L.push('');
    for (const r of rootCauses.filter((x) => x.detected)) {
      L.push(`### \`${r.id}\` (${r.severity}, ${r.detectedCount}x)`);
      L.push(`**Location:** \`${r.where}\``);
      L.push('');
      L.push(`**Why:** ${r.why}`);
      L.push('');
      L.push(`**Fix:** ${r.fix}`);
      if (r.affectedAssets.length) {
        L.push('');
        L.push('Affected assets: ' + r.affectedAssets.map((a) => '`' + a + '`').join(', '));
      }
      L.push('');
    }
    if (pageErrors.length) {
      L.push('## Uncaught exceptions', '');
      pageErrors.forEach((e, i) => L.push(`### ${i + 1}. ${e.message}`, '```', e.stack, '```', ''));
    }
    L.push('## Full failed request list', '');
    L.push('| Status | URL |');
    L.push('| --- | --- |');
    failedRequests.forEach((f) => L.push(`| ${f.status} | ${f.url} |`));
    L.push('');
    fs.writeFileSync(path.join(dir, 'runtime-error-audit.md'), L.join('\n'));

    process.stdout.write('\nRUNTIME / ERROR AUDIT\n');
    process.stdout.write(`  3D world activated     : ${report.verdict.worldActivated}\n`);
    process.stdout.write(`  uncaught exceptions    : ${pageErrors.length}\n`);
    process.stdout.write(`  console errors         : ${counts.error}\n`);
    process.stdout.write(`  console warnings       : ${counts.warn}\n`);
    process.stdout.write(`  failed requests        : ${failedRequests.length}\n`);
    process.stdout.write(`  WebGL renderer         : ${webgl.unmaskedRenderer || webgl.renderer || 'n/a'}\n`);
    process.stdout.write(`  FPS (sampled)          : ${perf.avgFps} avg, ${perf.minFps} min\n`);
    process.stdout.write(`  draw calls / triangles : ${runtime.rendererInfo ? runtime.rendererInfo.calls + ' / ' + runtime.rendererInfo.triangles : 'n/a'}\n`);
    process.stdout.write('  -> reports/runtime-error-audit.json\n  -> reports/runtime-error-audit.md\n');
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
    if (server) { try { server.kill(); } catch {} }
  }
})().catch((e) => { console.error('runtime-error-audit failed:', e); process.exit(1); });
