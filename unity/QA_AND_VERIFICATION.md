# The Whispering Wilds (காட்டு வழி • தடம்)
## Unity 6 PC Standalone Game — QA & Verification Guide

This document provides complete, line-by-line verification procedures for every subsystem of **The Whispering Wilds** running as a native Windows x64 Unity 6 PC game.

---

### 1. Build Verification & Deliverable Inspection

- **Target Executable**: `Build/Windows/TheWhisperingWilds.exe`
- **Engine**: Unity 6 (6000.6.3f1)
- **Render Pipeline**: High Definition Render Pipeline (HDRP 17.7.0) with scalable quality presets
- **Input System**: Unity New Input System (`com.unity.inputsystem` v1.20.0)
- **Scenes Included in Build (12 Scenes)**:
  1. `00_Boot.unity` (Build Index 0) — Title screen, New Game, Continue, Settings, Codex archive, Appearance limit rules display.
  2. `01_StateMap_TamilNadu.unity` (Build Index 1) — State-level macro relief map and highway transit system.
  3. `02_Chennai_GeorgeTown.unity` (Build Index 2) — George Town street level, Madras High Court perimeter, Murugan Tea Kadai, Velu auto-rickshaw, full NPC interactions.
  4. `03_Pichavaram_Wetlands.unity` (Build Index 3) — Tidal mangrove waterways, wooden docks, rowboats, fisher Mani NPC.
  5. `04_Thanjavur_Delta.unity` (Build Index 4) — Cauvery alluvial paddy fields, Brihadisvara granite gopuram, irrigation sluice, granary, farmer Arumugam NPC.
  6. `05_Chettinad_Mansion.unity` (Build Index 5) — Kanadukathan courtyard palace, Athangudi floor tiles, teak pillars, domestic brass utensils, elder Kamalam NPC.
  7. `06_Mamallapuram_Shore.unity` (Build Index 6) — Coastal granite shoreline, Shore Temple heritage structure, stone carving workshop, sculptor Sundaram NPC.
  8. `07_Nilgiris_Sanctuary.unity` (Build Index 7) — Montane shola forest, Toda mund huts, tea terrace hedges, Nilgiri Tahr wildlife, forest guide Raman NPC.
  9. `WW_Benchmark_Chennai.unity` (Build Index 8) — Automated 15-second urban market stress benchmark.
  10. `WW_Benchmark_Pichavaram.unity` (Build Index 9) — Automated 15-second wetland and overdraw benchmark.
  11. `WW_Benchmark_Delta.unity` (Build Index 10) — Automated 15-second open terrain and shadow cascade benchmark.
  12. `WW_Benchmark_Nilgiris.unity` (Build Index 11) — Automated 15-second foliage and physics benchmark.

---

### 2. Locomotion & Controls

| Action | Keyboard & Mouse | Gamepad (Xbox / DualSense) | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` | Left Stick | Camera-relative character movement with smooth acceleration (`speedChangeRate: 10 m/s²`). Analog stick angle drives character facing smoothly via `Mathf.SmoothDampAngle`. |
| **Walk / Jog** | Gentle stick tilt / partial keying | Partial tilt (< 0.6) | 3.5 m/s walk speed driving `Player_Walk` animation. |
| **Run** | Full keypress / full tilt | Full tilt (≥ 0.6) | 6.0 m/s run speed driving `Player_Run` animation. |
| **Sprint** | Hold `Left Shift` | Click `Left Stick` (L3) | 8.5 m/s sprint speed driving `Player_Sprint` animation. |
| **Crouch** | `C` | `B` / `Circle` | 2.0 m/s crouch locomotion driving `Player_Crouch_Idle` & `Player_Crouch_Walk`. |
| **Jump** | `Space` | `A` / `Cross` | Vertical jump (`1.4m` peak height, `gravity: -18 m/s²`) with coyote time (`0.12s`) and jump buffering (`0.15s`). Triggers `Jump` animation state. |
| **Camera Orbit** | Mouse Delta | Right Stick | 3rd-person orbital framing with `SphereCast` occlusion pushout (min distance `0.8m`, normal distance `3.5m`). |
| **Interact** | `E` | `X` / `Square` | Contextual interaction (`Talk`, `Inspect`, `Pickup`, `Photograph`). |
| **State Map** | `M` | Select / Back | Toggles interactive Tamil Nadu highway and regional travel map. |
| **Inventory / Codex**| `Tab` / `I` | `View` / `Touchpad` | Opens bilingual cultural codex and inventory bag. |

---

### 3. Absolute Constraint: Strict 5-Permanent Appearance Changes

#### Rule Specification:
- **Maximum Changes**: Exactly **5 permanent appearance changes** are permitted across the player's entire playthrough.
- **Enforcement Layers**:
  1. **Runtime Logic (`PlayerAppearanceManager.cs`)**:
     - `TryApplyPermanentAppearance(AppearanceProfile newProfile)` checks `remainingPermanentChanges > 0`.
     - When `remainingPermanentChanges == 0`, subsequent attempts are strictly rejected with a console warning and the event `OnAppearanceLimitReached`.
  2. **User Interface (`HUDManager.cs` & `TitleMenuController.cs`)**:
     - Displays `Appearance Changes Remaining: X / 5` in the HUD at all times.
     - Displays cultural rules notice on the Title Screen:
       *"விதிமுறை: முழு பயணத்திலும் அதிகபட்சம் 5 நிரந்தர தோற்ற மாற்றங்கள் மட்டுமே அனுமதிக்கப்படும் (Rule: Strict maximum of 5 permanent appearance changes across the entire journey)."*
  3. **Save System Integrity (`SaveSystem.cs`)**:
     - `SaveGame()` writes `remainingPermanentAppearanceChanges` to the JSON payload.
     - `RestoreState()` executes `Mathf.Clamp(remainingChanges, 0, MaxPermanentAppearanceChanges)` upon load to ensure save file tampering cannot exceed the limit of 5.
  4. **Regional Outfits Distinction**:
     - Regional cultural attire swaps (Everyday Chennai veshti, Cauvery village cottons, Thanjavur festival silks, Pichavaram boatman wear, Nilgiri mountain wools) are **unrestricted** and do **not** consume permanent appearance tokens.

#### Verification Steps:
1. Start a New Game. Verify HUD displays `Appearance Changes: 5/5`.
2. Apply 5 modifications. Observe the counter decrementing: `4/5`, `3/5`, `2/5`, `1/5`, `0/5`.
3. Attempt a 6th modification. Verify that the UI and console reject the change with:
   `[Appearance] Permanent appearance change REJECTED: Maximum of 5 permanent changes reached!`
4. Save the game and reload. Verify the remaining count remains strictly `0/5`.

---

### 4. Hardware Scalability & Quality Profiles Verification

1. **Auto Quality Detection (`AutoQualityDetector.cs`)**:
   - On first launch, queries `SystemInfo.graphicsDeviceName`, `SystemInfo.graphicsMemorySize`, `SystemInfo.processorCount`, and `SystemInfo.systemMemorySize`.
   - Recommends and applies the appropriate preset (Very Low for < 2GB VRAM/integrated GPU, Low for 2-4GB, Medium for 4-6GB, High for 6-8GB, Ultra for 8GB+).
2. **Quality Presets (`QualityPresetManager.cs`)**:
   - `VeryLow`: 0.70x render scale, 20m shadow distance, 1 cascade, 256MB texture budget, 30 FPS target.
   - `Low`: 0.80x render scale, 40m shadow distance, 2 cascades, 512MB texture budget, 30 FPS target.
   - `Medium`: 0.90x render scale, 75m shadow distance, 2 cascades, 1024MB texture budget, 60 FPS target.
   - `High`: 1.00x render scale, 150m shadow distance, 4 cascades, 2048MB texture budget, 60 FPS target.
   - `Ultra`: 1.00x render scale, 250m shadow distance, 4 cascades, 4096MB texture budget, 120 FPS target.
3. **Adaptive Performance Adaptation (`AdaptiveQualityManager.cs`)**:
   - Monitors rolling average frame time. If FPS drops below 85% of target for > 3.0s, scales render scale down by 0.05 steps (minimum 0.65).
   - Once FPS stabilizes above 96% of target for > 8.0s, gracefully restores quality step by step. Hysteresis prevents rapid oscillation.
4. **Memory Budget & Texture Streaming (`MemoryBudgetManager.cs`)**:
   - Dynamic mipmap texture streaming budget active on all cameras.
   - Triggers `Resources.UnloadUnusedAssets()` and GC sweep on regional scene transitions to guarantee zero memory accumulation over long play sessions.

---

### 5. Automated Benchmark Suite Verification

Run any of the 4 benchmark scenes:
- `WW_Benchmark_Chennai`
- `WW_Benchmark_Pichavaram`
- `WW_Benchmark_Delta`
- `WW_Benchmark_Nilgiris`

The engine samples unscaled delta times over 15.0 seconds, computes average FPS, 1% low FPS, minimum FPS, peak RAM, and exports a verified log to:
`Application.persistentDataPath/benchmark_report.json`
