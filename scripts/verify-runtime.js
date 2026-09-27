#!/usr/bin/env node
/**
 * The Whispering Wilds - Boot & Gameplay Smoke Test
 *
 * Boots the real game in a real browser, walks the full menu flow
 * (main menu -> player setup -> prologue -> 3D world), drives real
 * keyboard input, and fails on:
 *   - uncaught exceptions
 *   - console errors
 *   - duplicate DOM ids (modal stacking)
 *   - a 3D world that never activates
 *   - a player that cannot move
 *
 * Usage:
 *   node scripts/smoke-test.js                 # boots server if needed
 *   GAME_URL=http://localhost:3000 node scripts/smoke-test.js
 *   HEADFUL=1 node scripts/smoke-test.js       # watch it run
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const GAME_URL = process.env.GAME_URL || 'http://localhost:3000';
const HEADFUL = process.env.HEADFUL === '1';
const BOOT_TIMEOUT_MS = 120000;

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

const failures = [];
const fail = (msg) => { failures.push(msg); process.stdout.write(`  FAIL  ${msg}\n`); };
const pass = (msg) => process.stdout.write(`  ok    ${msg}\n`);

(async () => {
  const edge = findEdge();
  if (!edge) {
    console.error('No Chrome/Edge binary found. Set EDGE_PATH to run this test.');
    process.exit(1);
  }

  let server = null;
  try {
    server = await ensureServer();

    let puppeteer;
    try {
      puppeteer = require('puppeteer-core');
    } catch {
      console.error('puppeteer-core is required for the smoke test.');
      console.error('Install it with:  npm i -D puppeteer-core');
      process.exit(1);
    }

    const browser = await puppeteer.launch({
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

    const consoleErrors = [];
    const pageErrors = [];
    const failed404 = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('response', (r) => { if (r.status() === 404) failed404.push(r.url()); });

    process.stdout.write(`\nBooting ${GAME_URL} ...\n`);
    await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: BOOT_TIMEOUT_MS });

    // 1. Main menu must appear
    await page.waitForSelector('#ww-menu-new-game', { timeout: BOOT_TIMEOUT_MS });
    pass('main menu reached');

    // 2. UIManager calls window.<Name>.open(), so those must be instances,
    //    not bare classes (a class has no prototype `open` on itself).
    const OPENABLE_UI = ['CodexUI', 'AchievementUI', 'ProfileUI', 'CloudSaveUI',
      'StoryProgressUI', 'SideQuestUI', 'SecretDiscoveryUI', 'CollectibleUI'];
    const uiShape = await page.evaluate((names) => {
      const out = {};
      for (const n of names) {
        const v = window[n];
        out[n] = v ? (typeof v.open === 'function' ? 'ok' : 'NOT_INSTANCE') : 'missing';
      }
      return out;
    }, OPENABLE_UI);
    const badUi = Object.entries(uiShape).filter(([, v]) => v !== 'ok');
    if (badUi.length) fail(`UI modules called as .open() are not instances: ${badUi.map(([k, v]) => `${k}=${v}`).join(', ')}`);
    else pass('all .open() UI modules are instances');

    // 3. Codex modal must actually open without throwing
    const codexOpened = await page.evaluate(() => {
      try { window.CodexUI.open(); return window.CodexUI.isOpen !== false ? 'opened' : 'no-open'; }
      catch (e) { return 'threw: ' + e.message; }
    });
    if (String(codexOpened).startsWith('threw')) fail(`CodexUI.open() ${codexOpened}`);
    else pass('CodexUI.open() works');
    await sleep(600);
    await page.evaluate(() => { try { window.CodexUI.close(); } catch (e) {} });

    const click = (id) => page.evaluate((i) => { const b = document.getElementById(i); if (b) { b.click(); return true; } return false; }, id);

    // 4. NEW GAME -> setup modal, and must not stack duplicates
    await click('ww-menu-new-game');
    await page.waitForSelector('#ww-setup-proceed', { timeout: 30000 });
    pass('player setup modal opened');

    // 5. Prologue
    await click('ww-setup-proceed');
    await page.waitForSelector('#ww-prologue-begin', { timeout: 30000 });
    pass('prologue modal opened');

    // 6. Enter the 3D world
    await click('ww-prologue-begin');

    let world = null;
    for (let i = 0; i < 40; i++) {
      await sleep(2000);
      world = await page.evaluate(() => {
        const w = window.threeWorld;
        if (!w || !w.isActive) return null;
        const p = w.player;
        const pos = p && p.getPosition ? p.getPosition() : null;
        return {
          sceneChildren: w.scene ? w.scene.children.length : 0,
          drawCalls: w.renderer ? w.renderer.info.render.calls : 0,
          triangles: w.renderer ? w.renderer.info.render.triangles : 0,
          pos: pos ? { x: pos.x, y: pos.y, z: pos.z } : null,
        };
      });
      if (world) break;
    }
    if (!world) fail('3D world never became active');
    else pass(`3D world active (${world.sceneChildren} objects, ${world.triangles} tris, ${world.drawCalls} draw calls)`);

    // 7. No duplicate ids
    const dupes = await page.evaluate(() => {
      const seen = {};
      document.querySelectorAll('[id]').forEach((e) => { seen[e.id] = (seen[e.id] || 0) + 1; });
      return Object.entries(seen).filter(([, c]) => c > 1).map(([id, c]) => `${id} x${c}`);
    });
    if (dupes.length) fail(`duplicate DOM ids: ${dupes.join(', ')}`);
    else pass('no duplicate DOM ids');

    // 8. Player must actually move
    if (world) {
      const before = (await page.evaluate(() => { const p = window.threeWorld.player.getPosition(); return { x: p.x, z: p.z }; }));
      await page.keyboard.down('KeyW');
      await sleep(3000);
      await page.keyboard.up('KeyW');
      await sleep(400);
      const after = (await page.evaluate(() => { const p = window.threeWorld.player.getPosition(); return { x: p.x, z: p.z }; }));
      const dist = Math.hypot(after.x - before.x, after.z - before.z);
      if (dist < 0.5) fail(`player did not move (distance ${dist.toFixed(2)}m)`);
      else pass(`player moved ${dist.toFixed(2)}m`);

      // 9. Jump - poll instead of a single sample, so a slow frame rate
      //    cannot make a working jump look like a failure.
      const y0 = (await page.evaluate(() => window.threeWorld.player.getPosition().y));
      await page.keyboard.down('Space');
      let peak = y0;
      for (let i = 0; i < 12; i++) {
        await sleep(100);
        const y = (await page.evaluate(() => window.threeWorld.player.getPosition().y));
        if (y > peak) peak = y;
      }
      await page.keyboard.up('Space');
      await sleep(1200);
      if (peak - y0 < 0.2) fail(`jump did not raise the player (${y0.toFixed(2)} -> peak ${peak.toFixed(2)})`);
      else pass(`jump raised player ${(peak - y0).toFixed(2)}m`);
    }

    // 10. No uncaught exceptions
    if (pageErrors.length) fail(`uncaught exceptions: ${[...new Set(pageErrors)].slice(0, 5).join(' | ')}`);
    else pass('no uncaught exceptions');

    // 11. Console errors. Offline auth (401) and missing *content* assets
    //     (models/audio that fall back to procedural proxies) are expected and
    //     reported separately below. Missing *code* is a real failure.
    const realConsoleErrors = [...new Set(consoleErrors)].filter((t) => {
      if (/status of 40[13]/.test(t)) return false;          // offline auth
      if (/status of 404/.test(t)) return false;             // handled in the asset note
      if (/ERR_SOCKET_NOT_CONNECTED|ERR_CONNECTION/.test(t)) return false; // offline socket.io
      return true;
    });
    if (realConsoleErrors.length) fail(`console errors: ${realConsoleErrors.slice(0, 5).join(' | ')}`);
    else pass('no unexpected console errors');

    // 11b. Missing code files (scripts/styles) are always fatal.
    const missingCode = [...new Set(failed404.filter((u) => /\.(js|css|html|json)$/i.test(u))
      .map((u) => u.replace(GAME_URL, '')))];
    if (missingCode.length) fail(`missing code files: ${missingCode.slice(0, 8).join(', ')}`);
    else pass('no missing script/style files');

    // 12. Report missing assets (non-fatal, they fall back to procedural proxies)
    const missing = [...new Set(failed404.filter((u) => /\.(glb|gltf|png|jpg|webp|mp3|wav|ogg)$/i.test(u))
      .map((u) => u.replace(GAME_URL, '')))];
    if (missing.length) {
      process.stdout.write(`\n  note  ${missing.length} asset(s) 404 and use procedural fallbacks:\n`);
      missing.slice(0, 12).forEach((m) => process.stdout.write(`          ${m}\n`));
    }

    await browser.close();

    process.stdout.write('\n----------------------------------------\n');
    if (failures.length) {
      process.stdout.write(`SMOKE TEST: FAIL (${failures.length} problem(s))\n`);
      process.exit(1);
    }
    process.stdout.write('SMOKE TEST: PASS\n\n');
  } catch (err) {
    fail(`harness error: ${err.message}`);
    process.stdout.write(`\nSMOKE TEST: FAIL\n`);
    process.exitCode = 1;
  } finally {
    if (server) server.kill();
  }
})();
