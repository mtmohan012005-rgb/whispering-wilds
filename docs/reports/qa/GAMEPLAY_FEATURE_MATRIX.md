# Gameplay Feature Matrix
**Generated:** 2026-10-19 15:12  
**Commit:** 3927489 (main)

## Legend

- ✅ **VERIFIED** — Tested and confirmed working
- ⚠️ **IMPLEMENTED** — Code exists, connected, but not runtime-verified
- ❌ **BLOCKED** — Cannot test due to external dependency
- ❓ **NOT TESTED** — Not yet verified

## Core Gameplay

| Feature | Status | Evidence |
|---------|--------|----------|
| Game launches | ✅ VERIFIED | Process starts, PID verified |
| Cinematic intro | ⚠️ IMPLEMENTED | `CinematicIntroController.cs` (7s, skip on input) |
| Main menu | ⚠️ IMPLEMENTED | `TitleMenuController.cs` (New Game, Continue, Settings, Quit) |
| New Game flow | ⚠️ IMPLEMENTED | `CampaignFlow.cs` → Chennai spawn |
| Continue flow | ⚠️ IMPLEMENTED | `CampaignFlow.cs` → load last save |
| Player movement | ⚠️ IMPLEMENTED | `PlayerMovement.cs` (WASD, mouse, sprint, crouch, jump) |
| Player interaction | ⚠️ IMPLEMENTED | `PlayerInteractor.cs` (E-key) |
| Camera control | ⚠️ IMPLEMENTED | `CameraController.cs` (orbit, follow) |

## Regional Scenes

| Region | Scene | In Build | Visual Assets | NavMesh |
|--------|-------|----------|---------------|---------|
| Chennai | 02_Chennai_GeorgeTown.unity | ✅ | ✅ | ⚠️ Exists |
| Pichavaram | 03_Pichavaram_Wetlands.unity | ✅ | ✅ | ⚠️ Exists |
| Thanjavur | 04_Thanjavur_Delta.unity | ✅ | ✅ | ⚠️ Exists |
| Chettinad | 05_Chettinad_Mansion.unity | ✅ | ✅ | ⚠️ Exists |
| Mamallapuram | 06_Mamallapuram_Shore.unity | ✅ | ✅ | ⚠️ Exists |
| Nilgiris | 07_Nilgiris_Sanctuary.unity | ✅ | ✅ | ⚠️ Exists |
| Temple | 08_Ancient_Temple_Ruins.unity | ✅ | ⚠️ Greybox | ❌ Not needed |

## Quests & Investigation

| Feature | Status | Evidence |
|---------|--------|----------|
| Quest tracking | ⚠️ IMPLEMENTED | `QuestManager.cs` (22KB) |
| Clue discovery | ⚠️ IMPLEMENTED | `InvestigationManager.cs` (12KB) |
| Journal/Discovery log | ⚠️ IMPLEMENTED | `DiscoveryLog.cs`, `GameplayJournalUI.cs` |
| Region unlocks | ⚠️ IMPLEMENTED | `RegionUnlocks.cs` (20KB, clue-gated) |
| Campaign ending | ⚠️ IMPLEMENTED | `EndingController.cs` (18KB, 4 endings) |

## Temple Level

| Feature | Status | Evidence |
|---------|--------|----------|
| Scene exists | ✅ VERIFIED | In build settings, GUID valid |
| Puzzle controller | ⚠️ IMPLEMENTED | `TempleFolklorePuzzleController.cs` |
| Stone mechanisms | ⚠️ IMPLEMENTED | `StoneMechanism.cs` (IInteractable) |
| Hidden chamber door | ⚠️ IMPLEMENTED | Opens on correct sequence |
| Artifact pickup | ⚠️ IMPLEMENTED | `HiddenArtifactPickup.cs` (IInteractable) |
| Audio wired | ⚠️ IMPLEMENTED | 5 clips assigned (procedural WAV) |
| Bilingual clues | ⚠️ IMPLEMENTED | Tamil/English via LocalizationManager |
| **Visual quality** | ❌ GREYBOX | Cubes, planes, spheres — needs 3D models |

## Save/Load

| Feature | Status | Evidence |
|---------|--------|----------|
| Local save | ⚠️ IMPLEMENTED | `SaveSystem.cs` (32KB, v4 schema) |
| Local load | ⚠️ IMPLEMENTED | Save/Load migration |
| Cloud save upload | ⚠️ IMPLEMENTED | `CloudSaveManager.cs` (247 lines) |
| Cloud save download | ⚠️ IMPLEMENTED | Nested save.data parsing |
| Cloud save revision | ⚠️ IMPLEMENTED | Optimistic concurrency |
| **Cloud save runtime** | ❌ BLOCKED | Needs Firebase credentials |

## Localization

| Feature | Status | Evidence |
|---------|--------|----------|
| English mode | ⚠️ IMPLEMENTED | 265+ keys |
| Tamil mode | ⚠️ IMPLEMENTED | 265+ keys |
| Language switching | ⚠️ IMPLEMENTED | `LocalizationManager.cs` |
| Tamil font | ✅ VERIFIED | `TamilFont.ttf` exists |
| **Tamil font rendering** | ❓ NOT TESTED | Needs standalone build test |

## Audio

| Feature | Status | Evidence |
|---------|--------|----------|
| Audio manager | ⚠️ IMPLEMENTED | `AudioManager.cs` |
| Temple ambience | ⚠️ IMPLEMENTED | Procedural WAV (80 Hz tone) |
| Stone click | ⚠️ IMPLEMENTED | Procedural WAV |
| Puzzle success/failure | ⚠️ IMPLEMENTED | Procedural WAV |
| Door open | ⚠️ IMPLEMENTED | Procedural WAV |
| **Production audio** | ❌ MISSING | 125+ audio files absent |

## NPCs

| NPC | Prefab | Model Quality | Rigged | Animated |
|-----|--------|--------------|--------|----------|
| Player | ✅ | ✅ Good | ✅ | ✅ 24 clips |
| NPC_Murugan | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_Velu | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_Selvam | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_Artisan | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_Farmer | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_Fisher | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_ForestGuide | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_TeaWorker | ✅ | ❌ Placeholder | ❌ | ❌ |
| NPC_Meenakshi | ✅ | ❌ Placeholder | ❌ | ❌ |

## Online Features

| Feature | Status | Evidence |
|---------|--------|----------|
| Multiplayer client | ⚠️ IMPLEMENTED | `SocketIOClient.cs` (535 lines) |
| Realtime manager | ⚠️ IMPLEMENTED | `RealtimeManager.cs` (237 lines) |
| Backend server | ✅ VERIFIED | 31/31 security tests pass |
| **Multiplayer runtime** | ❌ BLOCKED | Needs 2 client instances |
| **Cloud save runtime** | ❌ BLOCKED | Needs Firebase credentials |

## Settings

| Feature | Status | Evidence |
|---------|--------|----------|
| Language | ⚠️ IMPLEMENTED | English/Tamil |
| Display | ⚠️ IMPLEMENTED | Resolution, fullscreen, VSync |
| Graphics | ⚠️ IMPLEMENTED | Quality presets |
| Audio | ⚠️ IMPLEMENTED | Master, music, SFX, ambience |
| Controls | ⚠️ IMPLEMENTED | Sensitivity, keybinds |
| Accessibility | ⚠️ IMPLEMENTED | Subtitles, color filters |

---

*21 systems implemented and connected. 4 runtime-verified (launch, compilation, tests, build). 17 need human operator for runtime verification.*
