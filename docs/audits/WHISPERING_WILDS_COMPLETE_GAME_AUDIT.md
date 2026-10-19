# The Whispering Wilds (காட்டு வழி • தடம்) — Complete Game Audit Report

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-19 18:25 IST  
**Auditing Agent:** Google Antigravity Coding Agent  
**Repository:** `https://github.com/mtmohan012005-rgb/whispering-wilds.git`  
**Default Branch:** `main`  
**Tested Local Commit:** `9384def0ed5adca8da978a510723259f64df52c2`  
**Remote `origin/main` Commit:** `9d6c5bbd5f2e0bc51f1c0d4e4c56797fb4191c0f` (Merged PR #9)  
**Host Platform:** Windows 11 Home 64-bit | Intel Core i3-N305 (8 cores) | 8 GB RAM | Direct3D 11.0  
**Unity Engine Version:** `6000.6.3f1` (HDRP 17.7.0)  

---

## Table of Contents
1. [Executive Summary & Overall Verdict](#1-executive-summary--overall-verdict)
2. [Phase 1: Workspace & GitHub Comparison](#2-phase-1-workspace--github-comparison)
3. [Phase 2: Unity Editor Startup & Licensing Blocker Diagnosis](#3-phase-2-unity-editor-startup--licensing-blocker-diagnosis)
4. [Phase 3: Full Technical & Subsystem Audit](#4-phase-3-full-technical--subsystem-audit)
5. [Phase 4: Scenes, Graphics, Assets & Tamil Nadu Authenticity](#5-phase-4-scenes-graphics-assets--tamil-nadu-authenticity)
6. [Phase 5: Whole-Game Feature Status Summary](#6-phase-5-whole-game-feature-status-summary)
7. [Phase 6: Realism & Production Readiness Scorecard](#7-phase-6-realism--production-readiness-scorecard)
8. [Phase 7: Test Suite & Storage Inventory Audit](#8-phase-7-test-suite--storage-inventory-audit)
9. [Phase 8: Prioritized Repair Roadmap](#9-phase-8-prioritized-repair-roadmap)
10. [Limitations & Unverified Areas](#10-limitations--unverified-areas)

---

## 1. Executive Summary & Overall Verdict

### **VERDICT: FUNCTIONAL ENGINE & LOGIC CORE WITH ART & AUDIO GAPS**

The Whispering Wilds is an open-world narrative exploration game set across the biomes of Tamil Nadu, built with Unity 6 (`6000.6.3f1`) and HDRP. 

Following a rigorous, evidence-based technical audit executing directly on the local Windows machine:
1. **The Game Compiles and Runs:** The Windows standalone build (`unity/Build/Windows/TheWhisperingWilds.exe`) was launched and executed cleanly at **60.0 FPS** (PID 14592 and PID 18084), utilizing Direct3D 11 and PhysX 4.1.2 multi-threaded physics with zero crashes.
2. **Automated Test Coverage (100% Pass Rate on Implemented Tests):**
   - **Unity EditMode:** 78 / 78 passed across all subsystems.
   - **Unity PlayMode:** 34 / 34 passed across campaign flow, clue discovery, corruption recovery, and player data protection.
   - **Node.js Backend & Cloud Save:** 54 / 56 passed (2 skipped due to unprovisioned live Firebase credentials).
   - **Static Verification:** 16 / 16 passed (`verify-game`, `verify-production`, `verify-assets`).
3. **Licensing False Alarm Resolved:** The reported "404" licensing error was diagnosed as an internal IPC query for optional Pro entitlements that cleanly falls back to the user's active **Unity Personal** license (valid through November 17, 2026).
4. **Primary Production Gaps Identified:**
   - **Ancient Temple Ruins Geometry:** While the puzzle logic is fully implemented, the 3D scene geometry in `GenerateTempleScene.cs` consists of primitive Unity cubes, cylinders, and spheres.
   - **Audio Atmosphere:** The 10 audio files in `assets/audio/` are procedurally generated synthetic WAV tones; true Tamil Nadu wildlife and ambient field recordings are absent.
   - **Human Playthrough:** While automated tests verify code contracts in isolation, an interactive, narrative campaign walkthrough requires human physical testing.

---

## 2. Phase 1: Workspace & GitHub Comparison

### Workspace Provenance
- **Local Directory:** `C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds`
- **Git Root:** `C:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds`
- **Active Branch:** `fix/gameplay-runtime-repair-20261019`
- **Local HEAD SHA:** `9384def0ed5adca8da978a510723259f64df52c2`
- **Remote `origin/main` SHA:** `9d6c5bbd5f2e0bc51f1c0d4e4c56797fb4191c0f` (Merged PR #9)
- **Local vs Remote Diff (`git diff HEAD origin/main`):** 0 files changed (Prismatically synchronized).

### Untracked & Working Tree Audit
- `?? .github/`: Contains `backend-ci.yml` (1,028 bytes) and `unity-validation.yml` (3,609 bytes). Held locally because the GitHub PAT lacked the `workflow` scope.
- `?? BuildOutput/`: Standalone D3D12 build artifacts from 18-10-2026 (~160 MB). Safe duplicate of `unity/Build/Windows/`.
- `?? unity/Assets/_Recovery/`: Crash recovery scene `0.unity` (147 KB) from 18-10-2026. Preserved without modification.
- **Git LFS Status:** Git LFS is configured; large binaries (`data.unity3d`, `player.glb`) are tracked properly.

---

## 3. Phase 2: Unity Editor Startup & Licensing Blocker Diagnosis

### Version Verification
- `ProjectSettings/ProjectVersion.txt`: `6000.6.3f1` (changeset `45d8eee7de74`).
- Installed Editor: `C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe` (Verified version: `6000.6.3f1_45d8eee7de74`).

### Log Analysis & Diagnostic Findings
1. **`%LOCALAPPDATA%\Unity\Unity.Licensing.Client.log`:**
   ```text
   REQ-3 | Sending EntitlementDetailsResponse for request EntitlementDetailsRequest from UnityEditor/6000.6.3f1 ... [404]: Found 0 entitlement groups and 0 free entitlements matching requested entitlement ids
   ```
   - **Root Cause:** This 404 is an internal IPC query check where the Editor requests optional Pro entitlement bundles. It is **not** an engine failure.
   - **Fallback:** The client immediately falls back to `Unity Personal`, logging `[200] OK` with 54 free entitlements.
2. **License Status CLI Inspection:**
   Running `Unity.Licensing.Client.exe --showEntitlements` proved that the license is active on this machine:
   - **Product:** Unity Personal
   - **Type:** Assigned
   - **Expiration:** Unlimited (Renewal Date: 2026-11-17)
   - **Entitlements:** `com.unity.editor`, `com.unity.editor.ui`, `com.unity.editor.dark-skin`, `com.unity.editor.headless`, `platforms.android`, `platforms.ios`, `platforms.uwp`.
3. **Network Connectivity:**
   Live TCP connectivity to `services.unity.com:443` tested `TcpTestSucceeded : True` (IP `34.160.10.162`).
4. **Editor Launch Capability:**
   Unity Editor batchmode compiles all assemblies and executes all 78 EditMode and 34 PlayMode tests with a 100% pass rate.

---

## 4. Phase 3: Full Technical & Subsystem Audit

### Architecture & Assembly Definitions
- **`WhisperingWilds.asmdef`:** Runtime core containing Camera, Campaign, Characters, Data, Display, Economy, Gameplay, Geography, Inventory, Investigation, Localization, NPC, Online, Persistence, Player, Quality, Quests, UI, Vegetation, Wildlife, and World systems.
- **`WhisperingWilds.Editor.asmdef`:** Scene generation, build tooling, and greybox generators.
- **`WhisperingWilds.Tests.Editor.asmdef`:** 78 EditMode unit tests.
- **`WhisperingWilds.Tests.PlayMode.asmdef`:** 34 PlayMode simulation tests.

### Subsystem Verification Highlights
- **Save System & Corruption Recovery:** Schema v4 JSON serialization with SHA-256 checksum validation. PlayMode tests prove that if the primary save file becomes corrupted, the system automatically detects the checksum mismatch and restores from `whispering_wilds_save.json.bak`.
- **Localization Engine:** 265 string keys translated into Tamil and English. Noto Sans Tamil dynamic font loaded in Direct3D 11 runtime without tofu glyphs.
- **Investigation & Quests:** Clue database tracking with idempotency guards preventing duplicate clues. Linear region unlock sequence enforced.
- **Backend Security:** Express server enforces `X-WW-CSRF` headers, IP rate limiting, cryptographically random session tokens, and zero stack trace leakage on error.

---

## 5. Phase 4: Scenes, Graphics, Assets & Tamil Nadu Authenticity

### Build Scenes Integrity
All 9 scenes registered in `EditorBuildSettings.asset` exist on disk with valid GUIDs:
1. `00_Boot.unity` (89 KB) — Procedural twilight sky, treeline silhouettes, menu root.
2. `01_MainMenu.unity` (134 KB) — Title typography, language toggle, options modal.
3. `02_Mudumalai_Forest.unity` (312 KB) — Western Ghats deciduous forest biome.
4. `03_Anamalai_Hills.unity` (298 KB) — High-altitude tea plantation hills.
5. `04_Agasthyamalai_Peak.unity` (284 KB) — Endemic tropical peak reserve.
6. `05_Coromandel_Coast.unity` (275 KB) — Pichavaram coastal mangrove wetland.
7. `06_Cauvery_Delta.unity` (291 KB) — Thanjavur agrarian delta basin.
8. `07_Nilgiri_Biosphere.unity` (320 KB) — Shola forest and grassland plateau.
9. `08_Ancient_Temple_Ruins.unity` (194 KB) — Dravidian heritage puzzle ruins.

### Reality Check: Tamil Nadu Vision vs Current State
- **Geography & Biomes:** Strong geographic framework representing authentic eco-zones of Tamil Nadu.
- **Hero Character:** High-quality player model (`player.glb`, 2.8 MB) with 13 meshes, 7 materials, and 24 skeletal animation clips.
- **Ancient Temple Ruins (Greybox Reality):** Inspection of `GenerateTempleScene.cs` confirms lines 130, 265, 293, and 313 use `PrimitiveType.Cube`, `PrimitiveType.Cylinder`, and `PrimitiveType.Sphere` for puzzle pillars, sanctum doors, and artifacts.
- **Audio Atmosphere (Synthesized Placeholders):** The 10 WAV sound files are procedurally synthesized tones. Field recordings of indigenous wildlife (Hornbill, Bonnet Macaque, Nilgiri Tahr) are absent.

---

## 6. Phase 5: Whole-Game Feature Status Summary

| Status Category | Feature Count | Percentage |
|---|---|---|
| **PASS — runtime verified** | **18** | **64.3%** |
| **PASS — automated test verified** | **4** | **14.3%** |
| **PARTIAL** | **3** | **10.7%** |
| **PLACEHOLDER** | **2** | **7.1%** |
| **NOT VERIFIED** | **1** | **3.6%** |
| **FAIL / MISSING / BLOCKED** | **0** | **0.0%** |
| **Total Features Audited** | **28** | **100.0%** |

*(Refer to `docs/audits/WHISPERING_WILDS_FEATURE_MATRIX.csv` for the granular row-by-row matrix).*

---

## 7. Phase 6: Realism & Production Readiness Scorecard

Each dimension is scored from 0 to 5 based on strict empirical evidence:

| # | Evaluation Dimension | Score (0–5) | Justification & Current State | Requirements to Reach 4–5 |
|---|---|---|---|---|
| **1** | Playable core loop & controls | **4.0 / 5** | Player movement, camera, jumping, crouching, sprinting, and scene transitions verified at 60 FPS. | Gamepad stick sensitivity and custom deadzone configuration. |
| **2** | World scale & navigation | **3.5 / 5** | 6 regional biomes with pre-baked NavMesh assets and linear region unlock gating. | Real-time world streaming LODs and fast-travel map UI. |
| **3** | Tamil Nadu authenticity | **3.5 / 5** | Accurate regional names, Northeast Monsoon season calendar, Tamil script, and folklore themes. | Real-world photography references and cultural architectural textures. |
| **4** | Environment art & architecture | **2.5 / 5** | HDRP lighting, procedural sky gradients, but Ancient Temple Ruins consists of greybox primitives. | 3D modelled Dravidian stone masonry, gopuram, and carved granite pillars. |
| **5** | Character / NPC quality & rig | **3.5 / 5** | Hero model has 13 meshes, 7 materials, 24 animations. Guide Murugan and Velu prefabs present. | Facial lip-sync and additional NPC civilian variety. |
| **6** | AI & interaction believability | **3.0 / 5** | Spotted deer and macaque state machines use NavMesh. | Herd flocking steering behaviors and predator-prey hunting loops. |
| **7** | Quest & investigation progression | **4.0 / 5** | Clue discovery by ID, duplicate prevention, ledger tracking, and 4 distinct epilogue endings. | In-engine cinematics for ending cutscenes. |
| **8** | Sound & atmosphere | **2.0 / 5** | 10 procedural WAV synth tones exist for UI/feedback; authentic wildlife recordings absent. | Sourced or commissioned field recordings of Tamil Nadu wildlife and biomes. |
| **9** | UI/UX & localization | **4.0 / 5** | 265 Tamil/English keys; Noto Sans Tamil loaded; clean confirmation dialogs. | Fine-tune complex Tamil ligature kerning. |
| **10** | Save/load reliability | **4.5 / 5** | Schema v4 JSON serialization with SHA-256 checksums and automated `.bak` corruption recovery. | Cloud save auto-sync trigger on game save. |
| **11** | Performance & stability | **4.5 / 5** | Direct3D 11 runtime verified at 60.0 FPS; adaptive render scaling buffer; 0 crashes. | Extended multi-hour stress testing on low-end hardware. |
| **12** | Architecture & maintainability | **4.5 / 5** | 4 clean `.asmdef` assemblies, modular single-responsibility scripts, 0 compiler warnings. | Automated API documentation generation. |
| **13** | Build & release readiness | **3.5 / 5** | Standalone Windows x64 `.exe` compiles and runs; automated build reporting passes (8030ms). | InnoSetup / Steamworks installer packaging. |
| **14** | Security & privacy | **4.5 / 5** | CSRF enforcement, rate limiting, session auth tokens, zero stack trace leakage, MEGA removed. | HTTPS deployment and production secrets management. |
| **TOTAL** | **Composite Readiness Score** | **51.5 / 70** | **73.6% (Functional Vertical Slice / Beta-Ready Core)** | Focus on 3D Temple Art (P1) and Wildlife Audio (P1). |

---

## 8. Phase 7: Test Suite & Storage Inventory Audit

### Tests Executed in this Audit Run
- **Unity EditMode:** 78 passed, 0 failed (`test_results_EditMode_20261019_164327.xml`)
- **Unity PlayMode:** 34 passed, 0 failed (`test_results_PlayMode_20261019_164627.xml`)
- **Windows Executable Smoke:** 1 passed (PIDs 18084 & 14592, Direct3D 11, PhysX 4.1.2)
- **Backend Security:** 34 passed, 0 failed (`npm run test:backend`)
- **Cloud Save Regressions:** 20 passed, 2 skipped (`npm run test:cloudsave`)
- **Static Verifications:** 16 passed (`npm run verify-game`, `verify-production`, `verify-assets`)
- **Build Report & Link Audit:** 1 passed (`npm run build-report`, 8030ms)

### Storage & File Categories (A through I)
*(Detailed in `docs/audits/WHISPERING_WILDS_MISSING_FILES_AND_STORAGE_AUDIT.csv`)*
- **A. Missing Required Files:** Authentic wildlife audio recordings, modular Dravidian temple 3D models, and Firebase service account key.
- **B. Local Untracked Files:** `.github/workflows/backend-ci.yml`, `.github/workflows/unity-validation.yml`.
- **C. Local Files Absent from Remote:** Synchronized on commit `9384def` (merged into `main` via PR #9).
- **D. Remote Files Absent Locally:** None (0 missing).
- **E. Ignored Files:** `Build/`, `unity/Build/`, `unity/Library/`, `unity/Temp/`, `*.log`.
- **F. Generated Caches / Builds:** `BuildOutput/` (160 MB duplicate build), `unity/Build/Windows/` (158 MB active build).
- **G. Large Assets:** `data.unity3d` (158 MB), `player.glb` (2.8 MB).
- **H. Dead / Duplicate Candidates:** `unity/Assets/_Recovery/0.unity` (147 KB crash recovery scene from Oct 18), historical audit logs in `docs/audits/` (>4.5 MB).
- **I. Required Unity Source Files:** All 9 scene files, 6 NavMesh binary assets, 4 `.asmdef` files, and `.meta` files are intact.

---

## 9. Phase 8: Prioritized Repair Roadmap Summary

*(Detailed in `docs/audits/WHISPERING_WILDS_REPAIR_ROADMAP.md`)*

1. **Priority 0 (P0) — Resolved:** Link audit crash fixed, rate limiting test skips resolved, QA runner artifact retention implemented.
2. **Priority 1 (P1) — Essential Gameplay & Content:**
   - Model and import modular Dravidian stone masonry for Ancient Temple Ruins (`GenerateTempleScene.cs`).
   - Source/record authentic Tamil Nadu wildlife audio (Hornbill, Macaque, Nilgiri Tahr).
   - Execute 60-item human playthrough checklist.
3. **Priority 2 (P2) — Environment Realism & Voice:**
   - Record Tamil voice acting for Guide Murugan and Informant Velu.
   - Implement wildlife herd flocking behaviors.
4. **Priority 3 (P3) — UX & Polish:**
   - Expose gamepad deadzone and sensitivity curves.
   - Refine complex Tamil ligature kerning.
5. **Priority 4 (P4) — CI/CD & Deployments:**
   - Grant `workflow` scope to GitHub token to push `.github/workflows/backend-ci.yml`.
   - Provision production Firebase credentials.

---

## 10. Limitations & Unverified Areas

1. **Human Narrative Experience:** Automated tests prove code paths in isolation; end-to-end subjective narrative pacing, dialogue immersion, and quest guidance feel have not been evaluated by a human playtester.
2. **Live Multiplayer Peer Synchronization:** Socket.IO server room capacity and endpoints were verified; simultaneous 2-client live peer movement has not been tested in CI.
3. **Physical Hardware Audio:** Procedural sound generator functions were verified via code; acoustic quality on physical speakers was not evaluated.
