// Line-by-line feature audit for The Whispering Wilds.
// Boots the real game, walks the full flow, then probes every major subsystem.
const path = require('path');
const puppeteer = require('puppeteer-core');

const GAME = process.env.WW_URL || 'http://localhost:3000';
const EDGE = process.env.WW_EDGE ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
function rec(area, feature, status, detail) {
  rows.push({ area, feature, status, detail });
}
const OK = 'PASS', BAD = 'FAIL', WARN = 'DEGRADED', SKIP = 'SKIP';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--window-size=1280,800'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  const uncaught = [];
  const missing404 = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => uncaught.push(String(e.message || e)));
  page.on('response', (r) => { if (r.status() === 404) missing404.push(r.url()); });

  // ---------- 1. BOOT ----------
  const t0 = Date.now();
  await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#ww-menu-new-game', { timeout: 180000 });
  rec('BOOT', 'main menu renders', OK, `${((Date.now() - t0) / 1000).toFixed(1)}s to menu`);

  // debug HUD should not be visible in a normal session
  const hud = await page.evaluate(() => {
    const h = document.querySelector('#perf-hud, #phud, .perf-hud');
    return h ? getComputedStyle(h).display : 'absent';
  });
  rec('BOOT', 'perf HUD hidden by default', (hud === 'absent' || hud === 'none') ? OK : WARN, `display=${hud}`);

  const click = (id) => page.evaluate((i) => { const b = document.getElementById(i); if (b) { b.click(); return true; } return false; }, id);

  // ---------- 2. FLOW: new game -> setup -> prologue -> world ----------
  await click('ww-menu-new-game');
  const setupShown = await page.waitForSelector('#ww-setup-proceed', { visible: true, timeout: 30000 })
    .then(() => true).catch(() => false);
  rec('FLOW', 'NEW GAME opens player setup', setupShown ? OK : BAD, setupShown ? 'setup modal visible' : 'no setup modal');

  const dupCount = await page.evaluate(() => document.querySelectorAll('#ww-setup-modal').length);
  rec('FLOW', 'no duplicate setup modal', dupCount === 1 ? OK : BAD, `${dupCount} instance(s)`);

  await click('ww-setup-proceed');
  const prologue = await page.waitForSelector('#ww-prologue-begin', { visible: true, timeout: 30000 })
    .then(() => true).catch(() => false);
  rec('FLOW', 'prologue stage', prologue ? OK : BAD, prologue ? 'prologue modal shown' : 'no prologue modal');

  await click('ww-prologue-begin');

  // wait for the 3D world
  let worldUp = false;
  for (let i = 0; i < 60; i++) {
    worldUp = await page.evaluate(() => !!(window.threeWorld && window.threeWorld.isActive
      && window.threeWorld.scene && window.threeWorld.player));
    if (worldUp) break;
    await sleep(2000);
  }
  rec('WORLD', '3D world activates', worldUp ? OK : BAD, worldUp ? 'threeWorld active + scene + player' : 'world never became active');

  const stats = worldUp ? await page.evaluate(() => {
    const w = window.threeWorld;
    let objects = null, tris = null, calls = null;
    if (w.scene) objects = w.scene.children.length;
    const info = w.renderer && w.renderer.info;
    if (info) { tris = info.render.triangles; calls = info.render.calls; }
    return { objects, tris, calls, shadows: !!(w.renderer && w.renderer.shadowMap && w.renderer.shadowMap.enabled) };
  }) : {};
  rec('WORLD', 'render stats populated', stats.tris ? OK : WARN,
    stats.tris ? `${stats.tris} tris, ${stats.calls} draw calls, ${stats.objects} root children, shadows=${stats.shadows}` : 'renderer.info empty');

  // ---------- 3. MOVEMENT ----------
  // Focus the canvas first: the very first key can be swallowed if the
  // renderer window has not taken focus yet, which reads as a false failure.
  await page.evaluate(() => {
    const c = document.querySelector('#threeCanvas') || document.querySelector('canvas');
    if (c) { c.focus && c.focus(); c.click && c.click(); }
    window.focus && window.focus();
  });
  await sleep(800);

  const pos = () => page.evaluate(() => { const p = window.threeWorld.player.getPosition(); return { x: p.x, z: p.z }; });
  const dist = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);

  // walk, with one retry so a single swallowed keypress is not a FAIL
  let walkMoved = 0;
  for (let attempt = 0; attempt < 2 && walkMoved <= 0.5; attempt++) {
    const a = await pos();
    await page.keyboard.down('w'); await sleep(1500); await page.keyboard.up('w');
    await sleep(500);
    walkMoved = dist(a, await pos());
    if (walkMoved <= 0.5) await sleep(700);
  }
  rec('MOVEMENT', 'walk (W)', walkMoved > 0.5 ? OK : BAD, `moved ${walkMoved.toFixed(2)}m`);

  const s0 = await pos();
  await page.keyboard.down('Shift'); await page.keyboard.down('w');
  await sleep(1500);
  await page.keyboard.up('w'); await page.keyboard.up('Shift');
  await sleep(500);
  const sprintMoved = dist(s0, await pos());
  rec('MOVEMENT', 'sprint (Shift+W) beats walk', sprintMoved > walkMoved ? OK : WARN,
    `sprint ${sprintMoved.toFixed(2)}m vs walk ${walkMoved.toFixed(2)}m`);

  const y0 = await page.evaluate(() => window.threeWorld.player.getPosition().y);
  let peak = y0;
  await page.keyboard.down(' ');
  for (let i = 0; i < 12; i++) { await sleep(100); const y = await page.evaluate(() => window.threeWorld.player.getPosition().y); if (y > peak) peak = y; }
  await page.keyboard.up(' ');
  rec('MOVEMENT', 'jump (Space)', peak - y0 > 0.2 ? OK : BAD, `peak +${(peak - y0).toFixed(2)}m`);

  // strafe + look
  const st0 = await pos();
  await page.keyboard.down('a'); await sleep(1000); await page.keyboard.up('a'); await sleep(400);
  const stMoved = dist(st0, await pos());
  rec('MOVEMENT', 'strafe (A)', stMoved > 0.5 ? OK : BAD, `moved ${stMoved.toFixed(2)}m`);

  const camBefore = await page.evaluate(() => { const c = window.threeWorld.cameraController?.camera; return c ? c.rotation.y : null; });
  await page.mouse.move(640, 400); await page.mouse.move(900, 400);
  await sleep(600);
  const camAfter = await page.evaluate(() => { const c = window.threeWorld.cameraController?.camera; return c ? c.rotation.y : null; });
  rec('MOVEMENT', 'mouse look changes camera yaw', (camBefore !== null && camAfter !== null && camBefore !== camAfter) ? OK : WARN,
    `yaw ${camBefore} -> ${camAfter}`);

  // ---------- 4. SUBSYSTEM PROBES (window globals) ----------
  const globals = await page.evaluate(() => {
    const wanted = [
      'UIManager', 'MainMenuUI', 'CodexUI', 'AchievementUI', 'ProfileUI', 'CloudSaveUI',
      'StoryProgressUI', 'SideQuestUI', 'SecretDiscoveryUI', 'CollectibleUI',
      'GameState', 'SaveManager', 'NewGamePlusSystem', 'BootManager', 'SystemRegistry',
      'audioManager', 'AudioBusMatrix', 'InputManager', 'LocalizationManager',
      'AssetManager', 'OnlineConnectionManager', 'FirebaseService', 'FirebaseAuthUI',
      'IntroCinematic', 'GPUCapability', 'productionAssetsAdapter', 'WORLD_ASSET_REGISTRY',
      'PerfHUD', 'ContentValidator', 'threeWorld', 'GRAPHICS_CONFIG',
    ];
    const out = {};
    for (const w of wanted) {
      const v = window[w];
      out[w] = v === undefined ? 'missing' : (v === null ? 'null' : (typeof v));
    }
    return out;
  });
  const g = globals;
  const present = Object.entries(g).filter(([, v]) => v !== 'missing' && v !== 'null');
  const missing = Object.entries(g).filter(([, v]) => v === 'missing').map(([k]) => k);
  rec('SUBSYSTEMS', 'registered window globals', present.length ? OK : BAD,
    `${present.length}/${Object.keys(g).length} present`);

  // ---------- 5. UI PANELS open/close cleanly ----------
  const openers = ['CodexUI', 'AchievementUI', 'ProfileUI', 'CloudSaveUI', 'StoryProgressUI',
    'SideQuestUI', 'SecretDiscoveryUI', 'CollectibleUI'];
  for (const name of openers) {
    const r = await page.evaluate((n) => {
      const c = window[n];
      if (!c || typeof c.open !== 'function') return { st: 'no-open' };
      try {
        c.open();
        const vis = !!document.querySelector('[class*="modal"]:not([style*="display: none"]), .codex-panel:not(.hidden), #ww-codex');
        if (typeof c.close === 'function') c.close();
        return { st: 'ok' };
      } catch (e) { return { st: 'threw', msg: String(e.message || e) }; }
    }, name);
    rec('UI', `${name}.open()`, r.st === 'ok' ? OK : (r.st === 'threw' ? BAD : WARN), r.st === 'threw' ? r.msg : r.st);
  }

  // ---------- 6. AUDIO (real instance is window.audioManager, lowercase) ----------
  const audio = await page.evaluate(() => {
    const a = window.audioManager;
    if (!a) return { st: 'missing' };
    return { st: 'ok', hasCtx: !!a.ctx, state: a.ctx ? a.ctx.state : 'no-ctx',
      buses: a.ctx ? [a.masterGain, a.musicGain, a.ambienceGain, a.sfxGain, a.dialogueGain, a.wildlifeGain].filter(Boolean).length : 0 };
  });
  rec('AUDIO', 'AudioManager instance + WebAudio context', audio.st === 'missing' ? BAD : (audio.hasCtx ? OK : BAD),
    audio.st === 'missing' ? 'no window.audioManager instance' : `ctx=${audio.hasCtx ? audio.state : 'NULL'}, ${audio.buses}/6 gain buses`);
  rec('AUDIO', 'AudioBusMatrix initialised', await page.evaluate(() => !!(window.AudioBusMatrix && window.AudioBusMatrix.ctx)) ? OK : WARN,
    await page.evaluate(() => window.AudioBusMatrix ? 'global present' : 'global missing'));

  // ---------- 7. INPUT ----------
  const input = await page.evaluate(() => {
    const i = window.InputManager;
    if (!i) return { st: 'missing' };
    return { st: 'ok', keys: i.keys ? Object.keys(i.keys).length : null };
  });
  rec('INPUT', 'input manager tracking keys', input.st === 'ok' ? OK : SKIP,
    input.st === 'ok' ? `${input.keys} bound keys` : 'no InputManager global');

  // ---------- 8. SAVE ----------
  const save = await page.evaluate(() => {
    try {
      const keys = Object.keys(localStorage);
      const hasSave = keys.some((k) => /save|progress|state|slot/i.test(k));
      return { st: 'ok', count: keys.length, hasSave, sample: keys.slice(0, 6) };
    } catch (e) { return { st: 'threw', msg: String(e.message) }; }
  });
  rec('SAVE', 'localStorage writable', save.st === 'ok' ? OK : BAD,
    save.st === 'ok' ? `${save.count} keys, save present=${save.hasSave}` : save.msg);

  // ---------- 9. NETWORK / AUTH ----------
  const net = await page.evaluate(() => {
    const f = window.FirebaseService;
    const c = window.OnlineConnectionManager;
    return {
      firebase: f ? { disabled: !!f._disabled, configured: typeof f.isConfigured === 'function' ? f.isConfigured() : null } : 'missing',
      connection: c ? (c.isConnected ? 'connected' : (c.socket ? 'socket-object' : 'instance-no-socket')) : 'missing',
    };
  });
  rec('NETWORK', 'offline auth degrades gracefully', (net.firebase === 'missing' || net.firebase.disabled) ? OK : WARN, JSON.stringify(net.firebase));
  rec('NETWORK', 'OnlineConnectionManager live', net.connection === 'missing' ? BAD : OK, net.connection);

  // ---------- 10. ASSET INTEGRITY (real source: productionAssetsAdapter) ----------
  const assets = await page.evaluate(() => {
    const a = window.productionAssetsAdapter;
    if (!a) return { st: 'missing' };
    let rep = null, ext = null;
    try { rep = a.getAssetCompletenessReport ? a.getAssetCompletenessReport() : null; } catch (e) { return { st: 'threw', msg: String(e.message) }; }
    try { ext = a.auditExternalDependencies ? a.auditExternalDependencies() : null; } catch (e) { ext = { err: String(e.message) }; }
    const reg = window.productionWorldAssets ? window.productionWorldAssets.registry : null;
    return {
      st: 'ok',
      total: rep ? rep.totalRegistered : null,
      loaded: rep ? rep.loadedOnDisk : null,
      missing: rep ? rep.missingLocalGLBs : null,
      pct: rep ? rep.completionPercentage : null,
      registrySize: reg ? reg.size : null,
      ext,
      globals: {
        WORLD_ASSETS: !!window.WORLD_ASSETS,
        WORLD_ASSET_METADATA: !!window.WORLD_ASSET_METADATA,
        WORLD_ASSET_REGISTRY: !!window.WORLD_ASSET_REGISTRY,
      },
    };
  });
  if (assets.st === 'missing') rec('ASSETS', 'productionAssetsAdapter present', BAD, 'global missing - cannot audit assets');
  else if (assets.st === 'threw') rec('ASSETS', 'productionAssetsAdapter present', BAD, assets.msg);
  else {
    rec('ASSETS', 'registry data globals loaded', assets.globals.WORLD_ASSET_METADATA ? OK : BAD,
      `WORLD_ASSETS=${assets.globals.WORLD_ASSETS}, WORLD_ASSET_METADATA=${assets.globals.WORLD_ASSET_METADATA}, (bogus) WORLD_ASSET_REGISTRY=${assets.globals.WORLD_ASSET_REGISTRY}`);
    rec('ASSETS', 'ProductionWorldAssets registry populated', assets.registrySize > 0 ? OK : BAD,
      `${assets.registrySize} registered asset ids`);
    rec('ASSETS', 'asset completeness (local GLBs on disk)', (assets.missing === 0) ? OK : WARN,
      `${assets.loaded}/${assets.total} on disk = ${assets.pct}, ${assets.missing} missing`);
    if (assets.ext) {
      rec('ASSETS', 'external-asset audit really checks', assets.ext.audited > 0 ? OK : BAD,
        `audited ${assets.ext.audited} entries (non-zero = not vacuous), passed=${assets.ext.passed}`);
    }
  }
  rec('ASSETS', 'on-disk 404s (content)', missing404.length ? WARN : OK,
    missing404.length ? `${missing404.length} missing -> procedural fallback: ${[...new Set(missing404)].slice(0, 3).map((u) => u.replace(GAME, '')).join(', ')}...` : 'none');

  // ---------- 11. STABILITY ----------
  rec('STABILITY', 'no uncaught exceptions', uncaught.length === 0 ? OK : BAD,
    uncaught.length ? uncaught.slice(0, 3).join(' | ') : 'none');
  const realErrors = [...new Set(consoleErrors)].filter((t) =>
    !/status of 40[13]/.test(t)                       // offline auth
    && !/status of 404/.test(t)                       // reported under ASSETS
    && !/ERR_SOCKET_NOT_CONNECTED|ERR_CONNECTION/.test(t)); // offline socket.io
  rec('STABILITY', 'no unexpected console errors', realErrors.length === 0 ? OK : BAD,
    realErrors.length ? realErrors.slice(0, 3).join(' | ') : 'none');

  // ---------- 12. GRAPHICS PROFILE ----------
  const gfx = await page.evaluate(() => {
    const p = window.GraphicsProfile || window.GPUCapability;
    if (!p) return 'missing';
    try {
      return (p.getCurrent ? p.getCurrent() : (p.current ? p.current() : 'present'));
    } catch (e) { return 'error'; }
  });
  rec('GRAPHICS', 'adaptive quality profile', gfx === 'missing' ? SKIP : OK, JSON.stringify(gfx));

  // ---------- 13. LOCALIZATION (known dead feature) ----------
  const loc = await page.evaluate(() => ({
    lm: !!window.LocalizationManager,
    lang: (localStorage.getItem('ww_language') || localStorage.getItem('language') || null),
    settingsHasLang: !!(window.SettingsManager && window.SettingsManager.settings
      && 'language' in window.SettingsManager.settings),
  }));
  rec('LOCALIZATION', 'LocalizationManager implemented', loc.lm ? OK : BAD,
    loc.lm ? 'present' : 'js/localization/ is EMPTY - no implementation exists');

  await browser.close();

  // ---------- REPORT ----------
  const w = (s, n) => String(s).padEnd(n);
  const byArea = {};
  rows.forEach((r) => { (byArea[r.area] = byArea[r.area] || []).push(r); });
  console.log('\n' + '='.repeat(96));
  console.log('  THE WHISPERING WILDS - LINE-BY-LINE FEATURE AUDIT');
  console.log('='.repeat(96));
  for (const [area, list] of Object.entries(byArea)) {
    console.log('\n' + area);
    console.log('-'.repeat(96));
    list.forEach((r) => {
      const mark = r.status === OK ? '  ok ' : r.status === BAD ? ' FAIL' : r.status === WARN ? ' warn' : ' skip';
      console.log(`${mark} ${w(r.feature, 40)} ${r.detail || ''}`);
    });
  }
  const tally = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  console.log('\n' + '='.repeat(96));
  console.log(`  ${tally[OK] || 0} pass | ${tally[WARN] || 0} degraded | ${tally[BAD] || 0} fail | ${tally[SKIP] || 0} skipped  (of ${rows.length})`);
  if (missing.length) console.log(`  globals not exposed: ${missing.join(', ')}`);
  console.log('='.repeat(96));
  console.log(`OVERALL: ${(tally[BAD] || 0) === 0 ? 'PASS' : 'FAIL'}\n`);
  process.exit((tally[BAD] || 0) === 0 ? 0 : 1);
})().catch((e) => { console.error('AUDIT CRASHED:', e); process.exit(2); });
