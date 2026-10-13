# The Whispering Wilds — Runtime Inspection Guide

**Safe, live monitoring without breaking the game loop or causing crashes.**

---

## Your Game Stack

| Component | Technology |
|-----------|-----------|
| Game Engine | **Three.js** (WebGL2/WebGL) |
| Runtime | **Browser** (Microsoft Edge / Chromium) |
| Language | **JavaScript** (ES6+) |
| Server | **Local HTTP** (serve.ps1 on port 8080) |
| Profiler | **Chrome/Edge DevTools** + built-in debug tools |

---

## Part 1: Built-in Debug Tools (Already in Your Game)

Your game ships with **6 built-in debug overlays** in `js/debug/`. These are designed to run live without pausing the game.

### 1.1 Performance HUD — `perf-hud.js` ⚡

**What it monitors:** FPS, frame time, draw calls, triangles, geometries, textures, GPU info, world chunks, NPC count, wildlife count, network RTT, asset queue, renderer backend.

**How to enable:**

| Method | Instructions |
|--------|-------------|
| **URL parameter** | Open `http://localhost:8080?devtools=1` |
| **Keyboard shortcut** | Press `Ctrl + Shift + P` (works even in production) |
| **Auto-visible** | Automatically shows on `localhost` / `127.0.0.1` |

**What you'll see:**
- Floating panel at top-right corner
- Updates 4x per second (250ms interval)
- Color-coded values: 🟢 Green = good, 🟡 Yellow = warning, 🔴 Red = critical
- **Export Snapshot** button to copy all metrics to clipboard

**When to use it:**
- Monitoring FPS drops during gameplay
- Checking draw call count after adding new objects
- Verifying GPU tier detection is correct
- Monitoring asset queue during world streaming

---

### 1.2 Runtime QA Monitor — `runtime-overlay.js` 🏥

**What it monitors:** Subsystem health status, event listener count, active timer count, render loop status, recent event breadcrumbs.

**How to enable:**
- Press `F2` at any time during gameplay

**What you'll see:**
- Panel at bottom-right corner
- Overall health: 🟢 OK / 🟡 DEGRADED / 🔴 FAILED
- Subsystem-by-subsystem status list
- Recent event timeline (breadcrumbs)

**When to use it:**
- Checking if a subsystem has failed silently
- Detecting event listener leaks (count should be stable)
- Verifying only one render loop is active
- Tracing recent errors via breadcrumbs

---

### 1.3 Animation Debugger — `animation-debugger.js` 🏃

**What it monitors:** Current animation state, clip name, LOD tier, quality level, Foot IK status, Hand IK status, CPU update time, LOD distribution.

**How to enable:**
- Press `F6` at any time during gameplay

**What you'll see:**
- Panel at top-right corner
- Player animation state and clip
- IK system status (Foot/Hand)
- Animation CPU performance metrics

**When to use it:**
- Debugging animation glitches or stuttering
- Verifying LOD transitions work correctly
- Checking IK is active when it should be
- Measuring animation CPU cost

---

### 1.4 Streaming Debugger — `streaming-debugger.js` 🗺️

**What it monitors:** Active world cells, preload cells, queued tasks, failed cells, CPU/GPU budget usage, cache tiers, memory pressure, world cell topology map.

**How to enable:**
- Press `F7` at any time during gameplay

**What you'll see:**
- Panel at top-right corner
- Region and cell information
- Color-coded world map showing cell states:
  - 🟢 Active cells
  - 🟡 Preload cells
  - 🔵 Queued cells
  - 🟣 Loading cells
  - 🔴 Failed cells
  - ⚪ Unloaded cells
- Player position dot on the map

**When to use it:**
- Debugging pop-in or missing terrain
- Checking if cells are failing to load
- Monitoring streaming CPU/GPU budget
- Verifying memory pressure levels

---

### 1.5 Diagnostics Console — `diagnostics-console.js` 📋

**What it does:** Buffers all errors and events, provides diagnostic reports.

**How to use it (Browser Console):**

```javascript
// Open browser DevTools console (F12) and type:

// Get all recorded errors
window.wwDiag.getErrors()

// Get all recorded events
window.wwDiag.getEvents()

// Generate full diagnostic report
window.wwDiag.report()

// Clear all buffered data
window.wwDiag.clear()
```

**When to use it:**
- After a crash or glitch, check what errors were recorded
- Review event timeline to understand what happened
- Generate diagnostic report for bug reports

---

### 1.6 System Inspector — `system-inspector.js` ✅

**What it does:** Validates 7 release gate criteria (customization guard, render loop singularity, critical systems, asset integrity, save system, currency, region legitimacy).

**How to use it (Browser Console):**

```javascript
// Run full release gate check
window.SystemInspector.evaluateReleaseGate()

// Returns:
// { status: 'READY_FOR_RELEASE' | 'BLOCKED', blocks: [...], checks: {...} }
```

**When to use it:**
- Before building a release, verify all systems are healthy
- After a crash, check if any system invariant was violated
- Verifying no external demo models are loaded

---

## Part 2: Browser DevTools (Edge/Chrome)

Since your game runs in the browser, you have access to the full Chrome DevTools suite. These are the **safest** tools for live inspection.

### 2.1 Performance Tab — Frame Analysis 🎬

**Best for:** CPU/GPU frame times, identifying frame spikes.

**How to use:**
1. Press `F12` to open DevTools
2. Go to **Performance** tab
3. Click **Record** (blue circle) or press `Ctrl + E`
4. Play the game for 5-10 seconds
5. Stop recording

**What you'll see:**
- **Frame Overview:** FPS graph with main thread, style/layout, paint, composite
- **Summary:** Total frames, average FPS, slow frames count
- **Flame Chart:** Detailed breakdown of what ran during each frame
- **Event Log:** Console logs, network requests, errors

**Key metrics to watch:**
| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| FPS | 55-60 | 30-54 | < 30 |
| Frame time | < 16.6ms | 16.6-33ms | > 33ms |
| Main thread blocking | < 2ms | 2-8ms | > 8ms |
| Scripting time | < 5ms | 5-10ms | > 10ms |

**Safest workflow:**
- Record short bursts (5-10 seconds), not long sessions
- Don't record while DevTools Performance tab is open for extended periods — it adds ~5-10% overhead
- Close DevTools after capturing to get accurate gameplay performance

---

### 2.2 Memory Tab — Heap & Leak Detection 🧠

**Best for:** RAM consumption over time, detecting memory leaks.

#### Method A: Heap Snapshot Comparison

1. Press `F12` → **Memory** tab
2. Take **Heap snapshot** #1 (game just started)
3. Play the game for 10-15 minutes
4. Take **Heap snapshot** #2
5. Compare: Sort by "Size" and look for growing arrays/objects

**What to look for:**
- Arrays that grow without bound (event listeners, particle systems)
- Detached DOM nodes (UI panels not properly cleaned up)
- Canvas contexts that accumulate
- Three.js geometries/materials not disposed

#### Method B: Allocation Timeline

1. **Memory** tab → Select **Allocation timeline**
2. Click **Record**
3. Play the game for 2-3 minutes
4. Stop and analyze

**What you'll see:**
- JS Heap graph over time
- If the line constantly climbs and never drops → **memory leak**
- Normal pattern: spikes during loading, then stabilizes

#### Method C: Performance Monitor (Lightweight)

1. Press `F12` → **More tools** → **Performance Monitor** (`Ctrl + Shift + P`)
2. Check: **JS event firing**, **JS heap size**, **DOM nodes**
3. Leave it running while you play

**This is the SAFEST real-time memory monitor** — minimal overhead, live graph.

**Key metrics to watch:**
| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| JS Heap | < 200MB | 200-500MB | > 500MB |
| DOM Nodes | < 10,000 | 10K-50K | > 50K |
| JS Event Listeners | Stable | Growing | Constantly climbing |

---

### 2.3 Applications Tab — Storage & State Inspection 💾

**Best for:** Checking localStorage, sessionStorage, cookies, service workers.

**How to use:**
1. Press `F12` → **Application** tab
2. Left panel: **Local Storage** → `http://localhost:8080`
3. Browse save data, settings, game state

**Useful for:**
- Verifying save data is being written correctly
- Checking settings persistence
- Inspecting quest/progression state
- Clearing save data for testing (`Right-click → Clear`)

---

### 2.4 Sources Tab — Live Variable Inspection 🔍

**Best for:** Checking variable values without pausing via breakpoints.

#### Method A: Console (Safest — No Pause)

```javascript
// Open F12 → Console tab, then type:

// Check player state
window.GameState?.player

// Check current region
window.GameState?.world?.currentRegion

// Check active NPCs
window.GameState?.npcs

// Check quest progress
window.GameState?.quests

// Check inventory
window.GameState?.player?.inventory

// Check survival stats
window.GameState?.player?.vitals
```

#### Method B: Logpoints (No Pause, Records on Hit)

1. **Sources** tab → Find the file you want to monitor
2. **Right-click** on a line number → **Add logpoint** (yellow diamond)
3. Enter expression: `Player position: {{player.position.x}}, {{player.position.y}}, {{player.position.z}}`
4. Game continues running; message appears in console when line is hit

**This is the SAFEST way to inspect variables** — no pause, no breakpoint overhead.

#### Method C: Watch Expressions

1. **Sources** tab → Set a breakpoint (only if you need to pause)
2. When paused, **Watch** panel → Add expressions
3. Expressions are evaluated in current scope

**⚠️ WARNING:** Regular breakpoints WILL pause the game loop. Use logpoints instead for live monitoring.

---

### 2.5 Network Tab — Asset Loading & Bandwidth 📡

**Best for:** Monitoring asset loading, world streaming, save uploads.

**How to use:**
1. Press `F12` → **Network** tab
2. Keep it open while playing
3. Filter by: **JS**, **Img**, **Other**

**What to look for:**
- Slow-loading assets (high "Wait" time)
- Failed requests (red status codes)
- Large texture files taking too long
- Repeated requests for the same asset (caching issue)

---

### 2.6 Rendering Tab — GPU & Visual Debugging 🎨

**Best for:** GPU rendering issues, paint flashing, layer borders.

**How to use:**
1. Press `F12` → **Rendering** tab (may be under "More tools")
2. Useful overlays:
   - **Paint flashing:** Shows what's being repainted each frame
   - **Layer borders:** Shows compositor layers
   - **GPU upload path highlights:** Shows texture upload cost

**For WebGL-specific debugging:**
1. **Rendering** tab → Check **Show rendering bounding boxes**
2. Or use **chrome://gpu** to check GPU feature status

---

## Part 3: External Tools (Optional, Advanced)

### 3.1 RenderDoc — Frame-by-Frame GPU Analysis

**Best for:** Deep GPU debugging, draw call inspection, shader analysis.

**Download:** https://renderdoc.org

**How to use with your game:**
1. Install RenderDoc
2. Launch RenderDoc
3. In the "Capture target" field, browse to `msedge.exe`
4. Click **Launch** to start Edge through RenderDoc
5. Navigate to `http://localhost:8080`
6. Press `Ctrl + G` to capture a frame
7. Analyze: draw calls, textures, shaders, GPU timing

**⚠️ Overhead:** RenderDoc adds ~20-50% GPU overhead. Use only for specific frame analysis, not continuous monitoring.

---

### 3.2 NVIDIA Nsight Graphics (NVIDIA GPU only)

**Best for:** Professional GPU profiling, pipeline analysis.

**Download:** https://developer.nvidia.com/nsight-graphics

**Use when:** You suspect GPU-specific bottlenecks that DevTools can't explain.

---

### 3.3 Intel GPU SysInfo (Intel GPU only)

**Best for:** Quick GPU driver and hardware info.

**Download:** https://www.intel.com/content/www/us/en/download/785597

---

## Part 4: Safe Monitoring Workflows

### Workflow 1: Quick Performance Check (30 seconds)

```
1. Open game: http://localhost:8080?devtools=1
2. PerfHUD appears automatically — note baseline FPS
3. Play game for 30 seconds
4. Watch for FPS drops during:
   - Scene transitions
   - NPC interactions
   - World streaming (moving between regions)
5. If FPS drops, press F2 to check subsystem health
```

### Workflow 2: Memory Leak Investigation (15 minutes)

```
1. Open game: http://localhost:8080
2. Open DevTools (F12) → Performance Monitor
3. Check: JS heap size, DOM nodes, JS event firing
4. Screenshot initial values
5. Play game normally for 10-15 minutes
6. Check values again:
   - JS heap should be stable (±20% is normal)
   - DOM nodes should not grow continuously
   - Event listeners should be stable
7. If values keep climbing → take heap snapshots and compare
```

### Workflow 3: Frame Spike Investigation (2 minutes)

```
1. Open game: http://localhost:8080
2. Open DevTools (F12) → Performance tab
3. Click Record
4. Reproduce the spike (e.g., move to a specific area, open a specific UI)
5. Stop recording after 5-10 seconds
6. Analyze flame chart:
   - Look for long yellow bars (scripting)
   - Look for long blue bars (rendering)
   - Look for gaps between frames (main thread blocking)
7. Identify the function causing the spike
```

### Workflow 4: Live Variable Inspection (No Pause)

```
1. Open game: http://localhost:8080
2. Open DevTools (F12) → Console
3. Type expressions to check state:
   - window.GameState?.player?.position
   - window.GameState?.world?.currentRegion
   - window.GameState?.quests
4. For continuous monitoring, use logpoints:
   - Sources tab → right-click line → Add logpoint
   - Expression: {{variableName}}
```

### Workflow 5: Full System Health Check

```
1. Open game: http://localhost:8080?devtools=1
2. Press F2 — Runtime QA Monitor
3. Press F6 — Animation Debugger
4. Press F7 — Streaming Debugger
5. Check all four overlays (PerfHUD + F2 + F6 + F7)
6. In console, run: window.SystemInspector.evaluateReleaseGate()
7. In console, run: window.wwDiag.report()
```

---

## Part 5: Keyboard Shortcut Reference

| Key | Action | Overlay |
|-----|--------|---------|
| `F12` | Open Browser DevTools | — |
| `F2` | Runtime QA Monitor | Subsystem health |
| `F6` | Animation Debugger | Animation state |
| `F7` | Streaming Debugger | World streaming |
| `Ctrl + Shift + P` | Toggle PerfHUD | Performance metrics |
| `Ctrl + E` (in DevTools) | Record Performance | Frame analysis |
| `Ctrl + Shift + P` (in DevTools) | Performance Monitor | Live memory graph |

---

## Part 6: Overhead Awareness

| Tool | CPU Overhead | GPU Overhead | Safe for continuous use? |
|------|-------------|--------------|--------------------------|
| PerfHUD (built-in) | ~1% | ~0% | ✅ Yes |
| Runtime Overlay (F2) | ~1% | ~0% | ✅ Yes |
| Animation Debugger (F6) | ~1% | ~0% | ✅ Yes |
| Streaming Debugger (F7) | ~1% | ~0% | ✅ Yes |
| DevTools Performance Monitor | ~2% | ~0% | ✅ Yes |
| DevTools Performance tab (recording) | ~10-20% | ~5% | ⚠️ Short bursts only |
| DevTools Memory (heap snapshot) | ~5% (brief) | ~0% | ⚠️ Take, then close |
| DevTools Network tab (open) | ~3% | ~0% | ⚠️ Close when not needed |
| RenderDoc | ~20% | ~20-50% | ❌ Frame capture only |

**Golden rule:** Close DevTools after capturing data. Even with low overhead, it can mask performance issues you're trying to find.

---

## Part 7: Common Issues & Quick Fixes

### FPS Drops During World Streaming
1. Press `F7` to check streaming debugger
2. Look for high "Queued Tasks" count
3. Check "CPU Budget" — if consistently over budget, reduce preload distance
4. Check "Memory Pressure" — if CRITICAL, reduce active cell count

### Memory Leak Suspected
1. Open Performance Monitor (`Ctrl + Shift + P` in DevTools)
2. Watch JS heap for 10+ minutes
3. If constantly climbing, take heap snapshots and compare
4. Common culprits: event listeners not removed, Three.js geometries not disposed, canvas contexts accumulating

### Animation Stuttering
1. Press `F6` to check animation debugger
2. Look for high "Update CPU" time
3. Check LOD distribution — too many LOD0 characters?
4. Check if Foot IK is causing extra computation

### Subsystem Failure
1. Press `F2` to check runtime overlay
2. Look for 🔴 FAILED subsystems
3. In console, run: `window.wwDiag.getErrors()` to see error details
4. In console, run: `window.wwDiag.report()` for full diagnostic

---

## Summary

Your game already has excellent built-in debugging tools. For safe live monitoring:

1. **Start with built-in tools** (PerfHUD, F2, F6, F7) — minimal overhead
2. **Use browser DevTools Performance Monitor** for live memory tracking
3. **Use logpoints, not breakpoints** for live variable inspection
4. **Record short bursts** in Performance tab for frame analysis
5. **Close DevTools** after capturing to get accurate performance
6. **Use RenderDoc** only for deep GPU frame analysis

For the safest continuous monitoring while playing:
- `http://localhost:8080?devtools=1` for PerfHUD
- `F2` for subsystem health
- Browser Performance Monitor for memory graph
