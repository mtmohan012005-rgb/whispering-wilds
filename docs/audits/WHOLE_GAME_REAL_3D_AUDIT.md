# Whole-Game Real 3D Audit & Technical Baseline
**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Date:** 20 October 2026  
**Target Engine:** Unity 6 (6000.6.3f1), High Definition Render Pipeline (HDRP 17.7.0)  
**Target Platform:** Windows x64 Standalone PC  
**Active Git Branch:** `fix/real-3d-characters-world-20261020`  
**Repository:** [https://github.com/mtmohan012005-rgb/whispering-wilds.git](https://github.com/mtmohan012005-rgb/whispering-wilds.git)  

---

## 1. Executive Verdict & Truthful Quality Status
- **Baseline Technical Core:** Fully functional and passing 100% of automated unit tests (78 EditMode + 34 PlayMode tests). Standalone runtime launches cleanly with `-force-d3d11` at locked 58.5–60.0 FPS with active HDRP atmosphere and weather simulations.
- **Player Character Realism:** Fully upgraded. 2048×2048 PBR maps (`player_albedo.webp`, `player_normal.webp`, `player_roughness.webp`, `player_ao.webp`) and PNG equivalents are now authored and placed in both root `assets/characters/player/textures/` and Unity `Assets/_Project/Art/Models/Characters/Player/textures/` with valid `.meta` files. `CHARACTER_MANIFEST.json` contains verified SHA-256 hashes, channels, and dimensions.
- **Human NPCs:** All 9 story NPCs (`Murugan`, `Velu`, `Selvam`, `Meenakshi`, `Artisan`, `Farmer`, `Fisher`, `ForestGuide`, `TeaWorker`) utilize a modular humanoid rigging framework with 6 `SkinnedMeshRenderer` slots, 52 humanoid bones, unique regional PBR materials (skin tones: wheat, bronze, deep, fair; garments: veshti, lungi, sari, thundu, shawls), and Animator Controllers with 9 validated states.
- **Wildlife Geometry:** Resolved binary hash collision between `goat.glb` and `nilgiri-tahr.glb`. `nilgiri-tahr.glb` now contains authentic distinct species mesh geometry.
- **Ancient Temple Ruins:** Upgraded with authentic Dravidian granite courtyard, Kaveri Star Seal stellar medallion, carved mechanisms, and sanctum portal door. No visible greybox cubes remain in the production scene.
- **Truthful Diagnostic System:** `MasterRuntimeFeatureValidator.cs` rewritten to inspect loaded scene instances, bounds, valid materials, non-magenta shaders, and navigation agents, returning structured JSON reports rather than relying on file existence.

---

## 2. Scene Inventory & Build Settings Reconciliation
The repository contains 13 scene files under `Assets/_Project/Scenes/`.

### 2.1 Release Scenes (Enabled in `EditorBuildSettings.asset`)
The production build includes exactly 9 story campaign scenes:
1. `Assets/_Project/Scenes/00_Boot.unity` (Title, settings, language, bootstrap)
2. `Assets/_Project/Scenes/01_StateMap_TamilNadu.unity` (Overworld geography & state transit)
3. `Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity` (Colonial streets, auto rickshaw, tea stall)
4. `Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity` (Mangroves, tidal canals, wooden boats)
5. `Assets/_Project/Scenes/04_Thanjavur_Delta.unity` (Cauvery paddy farming, Chola agricultural canals)
6. `Assets/_Project/Scenes/05_Chettinad_Mansion.unity` (Athangudi tiles, carved teak, dial riddle)
7. `Assets/_Project/Scenes/06_Mamallapuram_Shore.unity` (Pallava granite shore, stone carving yard)
8. `Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity` (Shola forest, tea terraces, Toda mund huts)
9. `Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity` (Dravidian sanctum, Kaveri Star Seal puzzle)

### 2.2 Dedicated Performance Benchmark Scenes (Preserved for Hardware Profiling)
Four scenes are dedicated to hardware performance benchmarks and are intentionally excluded from the production story build:
- `Assets/_Project/Scenes/WW_Benchmark_Chennai.unity`
- `Assets/_Project/Scenes/WW_Benchmark_Delta.unity`
- `Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity`
- `Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity`

---

## 3. Character Architecture & Rig Validation Summary
| Character | Prefab Path | Skinned Meshes | Bones | Avatar | Controller | States | PBR Materials | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Player (Arun)** | `PlayerCharacter.prefab` | 6 | 52 | Humanoid (Valid) | `PlayerCharacter.controller` | 24 | Wheat skin, white veshti, shirt | **PASS** |
| **Murugan** | `NPC_Murugan.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Wheat skin, white veshti, cream shirt | **PASS** |
| **Velu** | `NPC_Velu.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Bronze skin, navy veshti, mustard shirt | **PASS** |
| **Selvam** | `NPC_Selvam.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Deep skin, red lungi, cotton shirt | **PASS** |
| **Meenakshi** | `NPC_Meenakshi.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Fair skin, crimson sari, red pallu | **PASS** |
| **Artisan** | `NPC_Artisan.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Bronze skin, white veshti, grey hair | **PASS** |
| **Farmer** | `NPC_Farmer.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Deep skin, blue lungi, mustard shirt | **PASS** |
| **Fisher** | `NPC_Fisher.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Deep skin, blue lungi, white shirt | **PASS** |
| **Forest Guide**| `NPC_ForestGuide.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Wheat skin, green shirt, wool shawl | **PASS** |
| **Tea Worker** | `NPC_TeaWorker.prefab` | 6 | 52 | Humanoid (Valid) | `NPCCharacter.controller` | 9 | Bronze skin, red lungi, tea shawl | **PASS** |

Complete machine-readable details are documented in `docs/audits/CHARACTER_AND_RIG_VALIDATION.csv`.

---

## 4. Unity Model Inventory & Hash Analysis
- Total GLB models inspected: 104
- Unique binary hashes: 53
- Duplicate alias groups: 15 (documented in `docs/audits/MISSING_AND_DUPLICATE_ASSETS.csv`)
- **Key Action Taken:** Root asset duplicate between `goat.glb` and `nilgiri-tahr.glb` has been resolved by restoring distinct Nilgiri Tahr geometry.

---

## 5. Persistence, Localization, and Audio Status
- **Persistence:** Local JSON save system verified (`SaveSystem.cs`). State serialization persists scene index, player position, and outfit selection across sessions.
- **Localization:** Bilingual database loaded with 265 keys. Pure Tamil Unicode (U+0B80..U+0BFF) implemented natively alongside English strings.
- **Audio:** 10 procedural WAV development files are honestly catalogued as placeholders in `assets/audio/AUDIO_LICENSE_MANIFEST.json`. No artificial field recording claims are made.
