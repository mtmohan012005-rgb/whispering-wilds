# Runtime / Error Audit

Generated: 2026-09-27T19:34:43.233Z  
Target: http://localhost:3000  
Browser: Edge (Chromium) via puppeteer-core, headless, 1600x900

## Verdict

| Check | Result |
| --- | --- |
| 3D world activated | YES |
| Uncaught exceptions | 0 |
| Console errors | 29 |
| Console warnings | 153 |
| Failed requests (4xx/5xx/transport) | 29 |
| WebGL context available | YES |
| Overall | FAIL |

## Console message counts

| Type | Count |
| --- | --- |
| log | 76 |
| info | 0 |
| warn | 153 |
| error | 29 |
| debug | 0 |
| other | 2 |

## Console messages by category

| Category | Count | Sample |
| --- | --- | --- |
| other | 197 | Tracking Prevention blocked access to storage for https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js. |
| http-404 | 28 | Failed to load resource: the server responded with a status of 404 (Not Found) |
| world-asset-missing | 26 | [ProductionWorldAssets] Missing or failed load: assets/architecture/chennai/street_row.glb |
| graphics | 8 | [LaptopOptimization] Hardware: Laptop=true, LowPowerGPU=true, Cores=8, Memory=8GB |
| http-other | 1 | Failed to load resource: the server responded with a status of 401 (Unauthorized) |

## Failed requests by asset group

| Asset group | Failed | Statuses | Example |
| --- | --- | --- | --- |
| characters/wildlife | 8 | {"404":8} | assets/characters/wildlife/egret.glb |
| characters/npcs | 7 | {"404":7} | assets/characters/npcs/murugan.glb |
| architecture/chennai | 4 | {"404":4} | assets/architecture/chennai/street_row.glb |
| props/market | 2 | {"404":2} | assets/props/market/flower_cart.glb |
| props/food | 2 | {"404":2} | assets/props/food/tea_stall.glb |
| props/household | 2 | {"404":2} | assets/props/household/wooden_bench.glb |
| non-asset | 1 | {"401":1} | /api/auth/me |
| vehicles/bicycle | 1 | {"404":1} | assets/vehicles/bicycle/old_bicycle.glb |
| vehicles/motorcycle | 1 | {"404":1} | assets/vehicles/motorcycle/old_motorcycle.glb |
| vehicles/bus | 1 | {"404":1} | assets/vehicles/bus/city_bus.glb |

## WebGL / graphics

| Property | Value |
| --- | --- |
| available | true |
| vendor | WebKit |
| renderer | WebKit WebGL |
| unmaskedVendor | Google Inc. (Intel) |
| unmaskedRenderer | ANGLE (Intel, Intel(R) UHD Graphics (0x000046D0) Direct3D11 vs_5_0 ps_5_0, D3D11) |
| version | WebGL 2.0 (OpenGL ES 3.0 Chromium) |
| glsl | WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium) |
| maxTextureSize | 16384 |
| maxCubeMapSize | 16384 |
| maxTextureUnits | 32 |
| maxVaryings | 30 |
| maxVertexAttribs | 16 |
| anisotropy | 16 |
| shadowsEnabled | false |
| shadowType | 2 |
| pixelRatio | 0.5 |
| outputColorSpace | null |
| toneMapping | 4 |
| antialias | false |
| isWebGL2 | true |

## Performance

```json
{
  "sampled": {
    "frames": 281,
    "avgFps": 56.21,
    "avgFrameMs": 17.79,
    "p95FrameMs": 33.2,
    "worstFrameMs": 50.1,
    "minFps": 19.96
  },
  "rendererInfo": {
    "calls": 279,
    "triangles": 44010,
    "points": 0,
    "lines": 3200,
    "geometries": 221,
    "textures": 4,
    "programs": 16
  }
}
```

## Audio

```json
{
  "audioElements": 0,
  "contexts": [
    {
      "holder": "audioManager.ctx",
      "state": "running",
      "sampleRate": 48000,
      "currentTime": 19.38
    },
    {
      "holder": "gameAudio.ctx",
      "state": "running",
      "sampleRate": 48000,
      "currentTime": 19.38
    }
  ],
  "contextCount": 2,
  "runningContexts": 2
}
```

## Player model at runtime

```json
{
  "hasModel": true,
  "rootType": "Group",
  "meshes": 6,
  "skinnedMeshes": 1
}
```


## Identified root causes
Each row is matched against the captured console stream for this run. "Occurrences" is the
number of matching messages actually emitted, not a fixed expectation.

| Root cause | Severity | Occurrences | Location |
| --- | --- | --- | --- |
| `world-cell-queued-to-loaded` | medium | 69 | `js/systems/world-cell-manager.js:100-115` |
| `lambert-roughness-property` | low | 4 | `js/engine/streaming-renderer.js:105-108` |
| `living-world-procedural-silhouette` | medium | 30 | `js/systems/ (LivingWorld NPC/wildlife spawn path)` |
| `world-asset-missing` | medium | 26 | `js/engine/production-world-assets.js:174-175` |
| `runtime-validator-self-heal` | low | 7 | `js/core/runtime-validator.js` |
| `tracking-prevention` | informational | 12 | `index.html (Firebase CDN scripts)` |

### `world-cell-queued-to-loaded` (medium, 69x)
**Location:** `js/systems/world-cell-manager.js:100-115`

**Why:** The cell state machine at line 100-109 allows QUEUED -> [LOADING, UNLOADED, FAILED] but not QUEUED -> LOADED. A cell is being marked LOADED while it is still QUEUED, so the transition is rejected, the state is never advanced, and the guard warns on every attempt.

**Fix:** Route the cell through LOADING before LOADED, or add LOADED to the QUEUED allowed list if a queued cell can legitimately complete without entering LOADING.

### `lambert-roughness-property` (low, 4x)
**Location:** `js/engine/streaming-renderer.js:105-108`

**Why:** MeshLambertMaterial has no roughness property; it belongs to MeshStandardMaterial / MeshPhysicalMaterial. three.js warns once per constructed instance, so the count scales with the number of streamed terrain chunks built.

**Fix:** Use THREE.MeshStandardMaterial with roughness, or drop the roughness key and keep Lambert.

### `living-world-procedural-silhouette` (medium, 30x)
**Location:** `js/systems/ (LivingWorld NPC/wildlife spawn path)`

**Why:** The requested authored model does not exist, so the entity is replaced with a procedural silhouette. This is a degraded visual, not a crash, and it is logged rather than hidden.

**Fix:** Author the missing model, or accept the procedural silhouette as the shipped art and remove the expectation of an authored asset from the registry.

Affected assets: `assets/characters/npcs/murugan.glb.`, `assets/characters/npcs/selvam.glb.`, `assets/characters/npcs/meenakshi.glb.`, `assets/characters/npcs/fisher.glb.`, `assets/characters/npcs/farmer.glb.`, `assets/characters/npcs/forest-guide.glb.`, `assets/characters/npcs/artisan.glb.`, `assets/characters/wildlife/egret.glb.`, `assets/characters/wildlife/kingfisher.glb.`, `assets/characters/wildlife/cattle.glb.`, `assets/characters/wildlife/goat.glb.`, `assets/characters/wildlife/peafowl.glb.`

### `world-asset-missing` (medium, 26x)
**Location:** `js/engine/production-world-assets.js:174-175`

**Why:** A registry entry points at a file that is not on disk. The loader logs and continues; the prop is simply absent from the world (it is NOT replaced by a fake mesh).

**Fix:** Author the asset or point the registry entry at an existing model.

Affected assets: `assets/architecture/chennai/street_row.glb`, `assets/architecture/chennai/market_building.glb`, `assets/architecture/chennai/old_tamil_house.glb`, `assets/props/market/flower_cart.glb`, `assets/props/food/tea_stall.glb`, `assets/vehicles/bicycle/old_bicycle.glb`, `assets/props/household/wooden_bench.glb`, `assets/props/food/brass_vessels.glb`, `assets/props/household/water_pot.glb`, `assets/props/market/street_sign.glb`, `assets/architecture/chennai/electrical_pole.glb`, `assets/vehicles/motorcycle/old_motorcycle.glb`

### `runtime-validator-self-heal` (low, 7x)
**Location:** `js/core/runtime-validator.js`

**Why:** The runtime validator detected invalid state and repaired it in place instead of throwing.

**Fix:** Inspect the repaired value; a self-heal that fires every session points at an unresolved state bug upstream.

### `tracking-prevention` (informational, 12x)
**Location:** `index.html (Firebase CDN scripts)`

**Why:** Browser storage partitioning applied to the Firebase CDN scripts. Harmless in this run, but it means Firebase storage access can be blocked by privacy settings.

**Fix:** No action required unless Firebase persistence fails for real users.

## Full failed request list

| Status | URL |
| --- | --- |
| 401 | http://localhost:3000/api/auth/me |
| 404 | http://localhost:3000/assets/characters/npcs/murugan.glb |
| 404 | http://localhost:3000/assets/characters/npcs/selvam.glb |
| 404 | http://localhost:3000/assets/characters/npcs/meenakshi.glb |
| 404 | http://localhost:3000/assets/characters/npcs/fisher.glb |
| 404 | http://localhost:3000/assets/characters/npcs/farmer.glb |
| 404 | http://localhost:3000/assets/characters/npcs/forest-guide.glb |
| 404 | http://localhost:3000/assets/characters/npcs/artisan.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/egret.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/kingfisher.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/cattle.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/goat.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/peafowl.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/nilgiri-langur.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/elephant.glb |
| 404 | http://localhost:3000/assets/characters/wildlife/gaur.glb |
| 404 | http://localhost:3000/assets/architecture/chennai/street_row.glb |
| 404 | http://localhost:3000/assets/architecture/chennai/market_building.glb |
| 404 | http://localhost:3000/assets/architecture/chennai/old_tamil_house.glb |
| 404 | http://localhost:3000/assets/props/market/flower_cart.glb |
| 404 | http://localhost:3000/assets/props/food/tea_stall.glb |
| 404 | http://localhost:3000/assets/vehicles/bicycle/old_bicycle.glb |
| 404 | http://localhost:3000/assets/props/household/wooden_bench.glb |
| 404 | http://localhost:3000/assets/props/food/brass_vessels.glb |
| 404 | http://localhost:3000/assets/props/household/water_pot.glb |
| 404 | http://localhost:3000/assets/props/market/street_sign.glb |
| 404 | http://localhost:3000/assets/architecture/chennai/electrical_pole.glb |
| 404 | http://localhost:3000/assets/vehicles/motorcycle/old_motorcycle.glb |
| 404 | http://localhost:3000/assets/vehicles/bus/city_bus.glb |
