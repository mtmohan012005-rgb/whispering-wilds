const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/mohan/.gemini/antigravity-ide/brain/e6bbfaa3-5961-457f-97c6-30c32fe741e4';
const projectDir = 'C:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('1. Starting Edge with remote debugging...');
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1920,1080',
    'http://localhost:3000'
  ]);

  await wait(3000);

  console.log('2. Finding target tab...');
  let targets = [];
  for (let i = 0; i < 15; i++) {
    try {
      targets = await getJson('http://localhost:9224/json');
      if (targets.length > 0) break;
    } catch (_) {}
    await wait(500);
  }

  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found!');
    edge.kill();
    process.exit(1);
  }

  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.log('3. Connecting to page WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function sendCmd(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCmd('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.result?.exceptionDetails) {
      console.warn('Eval exception for:', expression, res.result.exceptionDetails);
    }
    return res.result?.result?.value;
  }

  async function captureScreenshot(filename) {
    const res = await sendCmd('Page.captureScreenshot', { format: 'png' });
    if (res.result && res.result.data) {
      const buf = Buffer.from(res.result.data, 'base64');
      const outPathBrain = path.join(brainDir, `${filename}.png`);
      const outPathProj = path.join(projectDir, 'assets', 'screenshots', `${filename}.png`);
      fs.writeFileSync(outPathBrain, buf);
      fs.writeFileSync(outPathProj, buf);
      console.log(`Saved screenshot: ${outPathProj} & ${outPathBrain} (${buf.length} bytes)`);
    }
  }

  await sendCmd('Page.enable');

  console.log('4. Waiting for game to boot into main menu...');
  await wait(4000);

  console.log('5. Clicking New Game...');
  await evaluate(`document.getElementById('ww-menu-new-game')?.click()`);
  await wait(1000);

  console.log('6. Confirming Setup & Beginning Journey...');
  await evaluate(`document.getElementById('ww-setup-confirm')?.click()`);
  await wait(1000);

  await evaluate(`document.getElementById('ww-prologue-begin')?.click()`);

  console.log('7. Waiting for loading to complete and 3D world to render...');
  let playing = false;
  for (let i = 0; i < 40; i++) {
    playing = await evaluate(`window.GameLifecycle?.state === 'PLAYING'`);
    if (playing) break;
    await wait(1000);
  }
  console.log('GameLifecycle state is PLAYING:', playing);

  let threeActive = false;
  for (let i = 0; i < 20; i++) {
    threeActive = await evaluate(`window.threeWorld?.isActive === true`);
    if (threeActive) break;
    await wait(500);
  }
  console.log('ThreeWorld isActive:', threeActive);

  await wait(2000);

  const regions = [
    {
      id: 'chennai',
      name: 'gameplay_chennai',
      x: -250,
      z: 0,
      lookX: -270,
      lookZ: 0,
      regionName: 'CHENNAI'
    },
    {
      id: 'delta',
      name: 'gameplay_delta',
      x: -15,
      z: -20,
      lookX: -15,
      lookZ: -10,
      regionName: 'CAUVERY_DELTA'
    },
    {
      id: 'pichavaram',
      name: 'gameplay_pichavaram',
      x: -25,
      z: 60,
      lookX: -25,
      lookZ: 75,
      regionName: 'PICHAVARAM'
    },
    {
      id: 'chettinad',
      name: 'gameplay_chettinad',
      x: -60,
      z: -35,
      lookX: -60,
      lookZ: -20,
      regionName: 'CHETTINAD'
    },
    {
      id: 'mamallapuram',
      name: 'gameplay_mamallapuram',
      x: -125,
      z: -70,
      lookX: -130,
      lookZ: -75,
      regionName: 'MAMALLAPURAM'
    },
    {
      id: 'nilgiris',
      name: 'gameplay_nilgiris',
      x: 220,
      z: 10,
      lookX: 235,
      lookZ: 10,
      regionName: 'NILGIRIS'
    }
  ];

  console.log('8. Capturing actual in-engine screenshots for all 6 regions...');

  for (const reg of regions) {
    console.log(`Positioning camera and world for ${reg.name} (${reg.regionName})...`);
    await evaluate(`
      (() => {
        if (!window.threeWorld) return;
        const tw = window.threeWorld;
        const x = ${reg.x};
        const z = ${reg.z};
        const y = tw.terrain ? tw.terrain.getElevation(x, z) : 2.0;

        tw.player.x = x;
        tw.player.z = z;
        tw.player.y = y;
        tw.player.group.position.set(x, y, z);

        if (tw.terrain && typeof tw.terrain.setRegion === 'function') {
          tw.terrain.setRegion('${reg.regionName}');
        }
        if (window.GameState && window.GameState.world) {
          window.GameState.world.currentRegion = '${reg.id}';
        }

        const cam = tw.cameraController.camera;
        cam.position.set(x + 10, y + 5, z + 12);
        cam.lookAt(${reg.lookX}, y + 2, ${reg.lookZ});

        tw.renderer.render(tw.scene, cam);
      })()
    `);

    await wait(1500);
    await captureScreenshot(reg.name);
  }

  console.log('9. In-engine screenshots captured successfully!');
  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
