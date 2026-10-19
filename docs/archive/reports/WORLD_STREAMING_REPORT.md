# THE WHISPERING WILDS (காட்டு வழி • தடம்)
## Master World Streaming & Seamless Regional Transitions Report
**Target Engine**: Unity 6 (`6000.6.3f1`)  
**Pipeline**: High Definition Render Pipeline (HDRP `17.7.0`)  
**Date**: September 29, 2026  
**Status**: **ACTIVE — SINGLE AUTHORITY `WorldStreamingManager` OPERATIONAL**  

---

## 1. Executive Summary
The world streaming architecture has been fully consolidated into a single authoritative manager—`WorldStreamingManager`—coordinating with `MemoryManager` to deliver seamless traversal across the vast cultural landscapes of Tamil Nadu. 

Split-brain streaming, duplicate scene loaders, and periodic 60-second garbage collection stalls have been completely eliminated. Heavy asset unloads are strictly deferred to loading boundaries, chunk unloads, or critical memory pressure thresholds (>92% RAM usage).

---

## 2. Regional World Structure (8 Authoritative Hubs)

```
                           +-------------------------------------+
                           |        00_Boot.unity                |
                           |   (Hardware Auto-Detect & Init)     |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |   01_StateMap_TamilNadu.unity       |
                           |      (Macro Geographic Atlas)       |
                           +-------------------------------------+
                                              |
        +------------------+------------------+------------------+------------------+
        |                  |                  |                  |                  |
        v                  v                  v                  v                  v
+----------------+ +----------------+ +----------------+ +----------------+ +----------------+
|  02_Chennai    | | 03_Pichavaram  | | 04_Thanjavur   | |  05_Chettinad  | | 06_Mamallapuram|
|  George Town   | |   Wetlands     | |     Delta      | |    Mansion     | |     Shore      |
+----------------+ +----------------+ +----------------+ +----------------+ +----------------+
        |
        +--------------------------------------------------------+
        |                                                        |
        v                                                        v
+----------------+                                       +----------------+
|  07_Nilgiris   |                                       | 4 Benchmark    |
|   Sanctuary    |                                       | Stress Scenes  |
+----------------+                                       +----------------+
```

1. **`00_Boot.unity`**: Initializes single authorities (`GameManager`, `GraphicsPerformanceManager`, `MemoryManager`, `WorldStreamingManager`, `AssetManager`, `InputManager`, `SaveManager`, `RealtimeManager`).
2. **`01_StateMap_TamilNadu.unity`**: Geographic macro atlas connecting all 7 playable regions with true relative spatial coordinates.
3. **`02_Chennai_GeorgeTown.unity`**: Dense urban benchmark featuring Madras High Court, Kotwal Chavadi flower bazaar, street stalls, and road traffic.
4. **`03_Pichavaram_Wetlands.unity`**: Tidal estuarine mangrove labyrinths with stilt-root vegetation, shallow waterways, and boat navigation.
5. **`04_Thanjavur_Delta.unity`**: Grand Anicut irrigation sluices, fertile paddy cultivation fields, palmyra groves, and bronze craft agraharams.
6. **`05_Chettinad_Mansion.unity`**: Heritage courtyard mansions featuring Athangudi tiles, carved teak pillars, open inner courtyards (*muttam*), and shaded verandahs (*thinnai*).
7. **`06_Mamallapuram_Shore.unity`**: Coastal granite outcrops, UNESCO Shore Temple promontory, stone sculpting workshops, and breaking waves.
8. **`07_Nilgiris_Sanctuary.unity`**: High-altitude tea plantations, montane shola evergreen forests, misty gorges, and Toda tribal mund settlements.

---

## 3. Streaming Cell State Machine
Inside each regional hub, the world is subdivided into spatial cells governed by a strict 6-state finite state machine:

```
[ UNLOADED ] <=========================================+
      |                                                |
      | Player within prefetch radius                  | Cell beyond unload radius
      v                                                |
[  LOADING ] (Async Resources / Addressables)          |
      |                                                |
      v                                                |
[  LOADED  ] (Meshes, colliders in memory)             |
      |                                                |
      | Player within active radius                    |
      v                                                v
[  ACTIVE  ] (Full simulation, rendering, NavMesh) --> [ UNLOADING ] (Deferred Async Release)
      |                                                ^
      | Player leaves active radius                    |
      v                                                |
[ INACTIVE ] (Colliders sleep, renderers culled) ------+
```

### Cell Lifecycle Rules:
- **`UNLOADED`**: Zero memory overhead. Only bounding box (AABB) cached in memory.
- **`LOADING`**: Asynchronous streaming background thread initiated. No frame hitches.
- **`LOADED`**: Prefetched assets resident in memory, gameobjects dormant.
- **`ACTIVE`**: Full rendering, physics colliders enabled, AI and navigation tick routines awake.
- **`INACTIVE`**: Visual renderers disabled, physics hibernated; ready for immediate reactivation without disk access.
- **`UNLOADING`**: Queued for asynchronous buffer and handle release via `AssetManager`.

---

## 4. Directional Predictive Prefetching
`WorldStreamingManager` continuously tracks player velocity vector $\vec{v}$ and displacement $\Delta \vec{p}$:
$$\vec{P}_{\text{lookahead}} = \vec{P}_{\text{player}} + \vec{v} \cdot t_{\text{lead}}$$
- The leading cell along the player's movement trajectory is elevated to priority `PREFETCH`.
- Surrounding cells in the backward direction are downgraded to `INACTIVE`.
- Total simultaneously loaded cells are bounded by the active `QualityTier` budget, strictly preventing runaway memory accumulation.

---

## 5. Controlled Memory Deference (Phase 10 & 57 Compliance)
- **Normal Gameplay**: In-game periodic GC calls (`GC.Collect()` / `Resources.UnloadUnusedAssets()`) are **STRICTLY DISABLED**.
- **Boundary Deference**: Heavy resource purges are executed exclusively during:
  1. Scene / Regional transitions
  2. World chunk full unloads
  3. Controlled loading screens
  4. Emergency memory guard threshold (>92% allocated RAM)
This architecture guarantees that high-speed traversal through George Town or the Cauvery Delta remains free of periodic micro-stutters.
