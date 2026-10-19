# The Whispering Wilds — Gameplay Integration Matrix

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:00 – 16:50:30 IST  

This matrix correlates every core gameplay subsystem with its underlying C#/JS implementations, the exact tests that validate it, its runtime execution status, and notes on production readiness versus placeholder/greybox state.

---

## 1. Subsystem Integration Matrix

| Subsystem | Primary Implementation Files | Test Coverage | Runtime Status | Notes on Behavior / Implementation Reality |
|---|---|---|---|---|
| **Boot & Title UI** | `TitleMenuController.cs`, `CinematicIntroController.cs`, `ConfirmationDialog.cs` | EditMode (25 tests), PlayMode (2 tests), Standalone Smoke | `PASS_RUNTIME` | Fast startup flow, skip-intro support, new game confirmation modal, Tamil/English string switching verified. |
| **Locomotion & Controller** | `PlayerMovement.cs`, `PlayerCamera.cs`, `Player.prefab` | EditMode: `PlayerMovement_RequiresCharacterController`, `PlayerPrefab_FileExists`, verify-assets | `PASS_RUNTIME` | CharacterController-based movement; sprint/crouch/jump curves implemented. Manual controller feel is `NOT_TESTED`. |
| **Hero 3D Model & Rig** | `assets/characters/player/player.glb`, `Player.prefab` | `npm run verify-assets`, `animations:validate`, `textures:validate` | `PASS_STATIC` | 13 meshes, 7 materials, 24 animations verified. 43 animation tracks confirmed across rig. |
| **Investigation & Clues** | `InvestigationManager.cs`, `ClueData.cs`, `ClueDatabase.cs` | EditMode: 3 tests; PlayMode: 3 tests | `PASS_RUNTIME` | Dynamic discovery by ID, duplicate prevention, and clue ledger serialization operate cleanly. |
| **Campaign & Epilogues** | `CampaignFlow.cs`, `EndingController.cs`, `QuestEndingBridge.cs` | EditMode: 9 tests; PlayMode: 5 tests | `PASS_RUNTIME` | 4 distinct endings (A, B, C, D) with fallback logic to Ending C when prerequisites are unfulfilled. |
| **Region Unlock Gating** | `RegionUnlockManager.cs`, `RegionData.cs` | EditMode: 3 tests; PlayMode: 6 tests | `PASS_RUNTIME` | Linear progression order verified: Chennai -> Pichavaram -> Thanjavur -> Chettinad -> Madurai -> Western Ghats. |
| **AI & NavMesh** | `WildlifeAI.cs`, `PredatorPreyController.cs`, `NavMeshData/` | EditMode: `AllRegionalNavMeshData_Exist`, `verify-game` | `PASS_STATIC` | 6 regional NavMesh binary data assets exist and link cleanly. Live AI fleeing/hunting behavior is `NOT_TESTED` manually. |
| **Ancient Temple Puzzle** | `GenerateTempleScene.cs`, `TemplePuzzleManager.cs` | EditMode: `AllRegionalScenes_Exist`, `verify-game` | `PASS_STATIC` (Logic) / `GREYBOX` (Art) | **Important:** Inspection of `GenerateTempleScene.cs` (lines 130, 265, 293, 313) confirms puzzle pillars, sanctum doors, and artifacts are Unity primitive cubes/spheres/planes. Functional logic works, but 3D art is greybox. |
| **Localization & Tamil Font** | `LocalizationManager.cs`, `TamilFont` (Noto Sans Tamil) | EditMode: 5 tests; Standalone Smoke (`Player.log`) | `PASS_RUNTIME` | 265 string keys loaded; Noto Sans Tamil dynamic font loaded in Direct3D 11 runtime. |
| **Local Save System** | `SaveSystem.cs`, `GameSaveData.cs` | PlayMode: 8 tests | `PASS_RUNTIME` | Schema v4 serialization, SHA-256 checksums, and automatic recovery from `.bak` on corrupt primary save verified. |
| **Backend & Cloud Save** | `server/server.js`, `server/auth/auth-service.js`, `server/routes/cloud-save.js` | `npm run test:backend` (34 tests), `npm run test:cloudsave` (20 tests) | `PASS_RUNTIME` | CSRF protection, rate limiting, and session tokens verified. Live Firebase round-trip `BLOCKED` (no cloud credentials in test environment). |
| **Multiplayer Socket.io** | `server/server.js`, `unity/Assets/_Project/Scripts/Multiplayer/` | `verify-production`, `test:backend` | `PASS_RUNTIME` (Server) / `BLOCKED` (2-Client Peer) | Max room cap (5 players) enforced; single socket handshake works. Simultaneous 2-player peer simulation not tested in CI. |
| **Audio & SFX** | `AudioManager.cs`, `AUDIO_LICENSE_MANIFEST.json` | `verify-assets`, Standalone Smoke | `PASS_STATIC` (Engine) / `GAP` (Content) | 10 procedural synthetic WAV tones exist for UI/feedback. Authentic field recordings for wildlife/ambience are missing. |

---

## 2. Status Category Key

- **`PASS_RUNTIME`:** Verified by code executing in a running process (Unity Editor, Standalone Executable, or Node backend).
- **`PASS_STATIC`:** Verified by parsing asset headers, file trees, JSON schemas, or assembly definitions.
- **`GREYBOX`:** Functional gameplay code exists, but 3D geometry consists of primitive shapes rather than production art.
- **`BLOCKED`:** Requires external credentials, hardware, or multi-seat infrastructure not present in the local CI environment.
- **`NOT_TESTED`:** Requires physical human interaction (hands on keyboard/mouse/gamepad, ears on speakers, subjective eyes).
