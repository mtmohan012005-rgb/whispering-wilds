# CHARACTER RUNTIME PROOF — STEP 30

**Date:** 2026-10-11
**Status:** NOT_RUNTIME_VERIFIED — Unity editor not available in this environment

## 1. Runtime Verification Status

This report documents the evidence available for character runtime behavior. **Unity editor execution is required** to capture actual gameplay screenshots and verify visual appearance in the built Windows executable.

### 1.1 What Can Be Verified Without Unity Editor

The following has been verified through code and asset inspection:

| Check | Method | Result |
|---|---|---|
| Player prefab exists | File system | **PASS** — `PlayerCharacter.prefab` (2374 lines) |
| Player has SkinnedMeshRenderer | Prefab YAML | **PASS** — 5 renderers found |
| Player has Animator | Prefab YAML | **PASS** — Animator component with Avatar + Controller |
| Player Avatar valid | GenericAvatar.asset | **PASS** — 40+ bones, TOS mapping |
| Player Controller valid | PlayerCharacter.controller | **PASS** — 9 states, 5 parameters |
| Animation clips exist | File system | **PASS** — 9 player clips, 9 NPC clips |
| Animation keyframes exist | .anim YAML | **PASS** — Position/rotation curves with keyframe data |
| NPC_Murugan prefab exists | File system | **PASS** — 6 SkinnedMeshRenderers |
| NPC_Velu prefab exists | File system | **PASS** |
| CharacterPrefabCatalog | Code inspection | **PASS** — Redirects GLB → prefab |
| PlayerMovement → Animator | Code inspection | **PASS** — UpdateAnimator() writes all params |
| NPCCharacter → Animator | Code inspection | **PASS** — NPCAnimationDriver drives states |
| PlayerInteractor → Dialogue | Code inspection | **PASS** — IInteractable interface |
| NavMesh asset exists | File system | **PASS** — Chennai NavMesh asset |
| Smoke test code exists | Code inspection | **PASS** — CharacterRuntimeSmokeTest.cs |

### 1.2 What Requires Unity Editor Execution

| Check | Required Tool | Status |
|---|---|---|
| Player visible in gameplay scene | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Player walking animation plays | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Player sprinting animation plays | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Player crouching works | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Player jumping works | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Murugan visible at tea stall | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Murugan idle animation plays | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Murugan Talk animation on interaction | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Dialogue UI appears | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Tamil text renders correctly | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Quest objective updates | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Save/Load restores character | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |
| Windows build runs | Build pipeline | **NOT_RUNTIME_VERIFIED** |
| Screenshot evidence | Unity Editor / Build | **NOT_RUNTIME_VERIFIED** |

## 2. Automated Evidence Process

### 2.1 CharacterRuntimeSmokeTest

The `CharacterRuntimeSmokeTest` class provides automated runtime verification:

**Chennai Audit (`RunChennaiCharacterAudit`):**
1. **Player rig audit** — Checks for ≥3 skinned meshes, ≥40 bones, valid avatar, valid controller, animation advancing
2. **NPC visual audit** — Finds Murugan and Velu, checks skinned meshes and animator
3. **Appearance swap audit** — Triggers outfit change and verifies material propagation
4. **Locomotion screenshot** — Moves player and captures screenshot to `Character_01_Chennai_Locomotion.png`

**Pichavaram Audit (`RunPichavaramCharacterAudit`):**
1. **NPC talk audit** — Finds an NPC, triggers Talk state, verifies animation transition
2. **NavMesh movement audit** — Moves NPC via NavMesh, verifies position change
3. **NPC talk screenshot** — Captures `Character_02_Pichavaram_NPC_Talk.png`
4. **Player rig after travel** — Confirms player rig survives region transition

### 2.2 How to Run

1. Open the project in Unity 6000.6.3f1
2. Open the Chennai scene (`02_Chennai_GeorgeTown.unity`)
3. Add `RuntimeAutomatedSmokeTest` component to a GameObject
4. Press Play
5. The test runs automatically and writes results to:
   - Console (colored `[QA_TEST]` log messages)
   - `TestReports/` directory (JSON report)
   - `Application.persistentDataPath/` (screenshots)
   - Build output directory (screenshots mirrored for CI)

### 2.3 Expected Test Output

On success, console shows:
```
[QA_TEST] Character.Player.Rig (Chennai): PASS - Player rig animating: 5 skinned meshes, 42 bones, avatar+controller active, motion advancing.
[QA_TEST] Character.NPCs.Visuals (Chennai): PASS - Murugan: 6 skinned meshes, Velu: 6 skinned meshes
[QA_TEST] Character.Appearance.OutfitSwap (Chennai): PASS - Material swap verified
[QA_TEST] Character_01_Chennai_Locomotion: Screenshot saved
```

## 3. Windows Build Status

### 3.1 Existing Build

A Windows x64 build exists at the project root:
- `The Whispering Wilds.exe`
- `The Whispering Wilds_Data/`

**This build was created before STEP 29 character assets were added.** It contains the legacy GLB placeholder characters, not the new procedural characters.

### 3.2 Required Action

A new Windows x64 build must be created after the STEP 29 character assets are imported into the Unity Library. The build process:
1. Open project in Unity 6000.6.3f1
2. Run `Whispering Wilds/Characters/Build All Characters` menu item (if prefabs need regeneration)
3. Run `Whispering Wilds/Regions/Assemble All Regions` to rebuild scenes
4. Build → Windows x64 player
5. Run the executable and verify character appearance

## 4. Performance Requirements

### 4.1 Character Memory Budget

Per `CHARACTER_MANIFEST.json`:
- Hero body triangles: 40,000–80,000
- Clothing triangles: 20,000–60,000
- Total per character: ~60,000–140,000 triangles

### 4.2 LOD System

The manifest specifies 3 LOD tiers:
- LOD0: 100% detail (0–25m)
- LOD1: 50% detail (25–70m)
- LOD2: 25% detail (70–150m)

**Current status:** LOD groups should be configured on character prefabs. Verification requires Unity editor.

### 4.3 Graphics Quality

The existing `GraphicsPerformanceManager` manages quality presets. Characters must remain visible at all presets, including Very Low. The procedural characters use shared materials (`M_skin_tamil`, `M_fabric_*`) which reduces draw calls.

## 5. Evidence Summary

| Evidence Type | Available | Location |
|---|---|---|
| Asset audit | ✅ | `CHARACTER_ASSET_AUDIT.md` |
| Player integration report | ✅ | `PLAYER_CHARACTER_INTEGRATION_REPORT.md` |
| Chennai QA report | ✅ | `CHENNAI_CHARACTER_QA_REPORT.md` |
| Code-level verification | ✅ | This document |
| Unity editor screenshots | ❌ | Requires Unity execution |
| Windows build screenshots | ❌ | Requires new build |
| Runtime smoke test results | ❌ | Requires Unity execution |
| Animation playback proof | ❌ | Requires Unity execution |

## 6. Completion Gate Assessment

**Task requirement:** "The actual player is visibly human, Murugan is visibly human, and their complete interaction loop works in the Windows game."

| Gate | Status |
|---|---|
| Player visibly human | **ASSET_COMPLETE** — Prefab has skinned meshes with human anatomy. Runtime visual not verified. |
| Murugan visibly human | **ASSET_COMPLETE** — Prefab has skinned meshes with human anatomy. Runtime visual not verified. |
| Interaction loop works | **CODE_COMPLETE** — All components wired. Runtime behavior not verified. |
| Windows game runs | **BUILD_NEEDED** — Existing build predates character assets. New build required. |

**Overall: NOT_FULLY_COMPLETE** — All assets and code are in place, but runtime verification in Unity editor and Windows build are required to satisfy the completion gate.

## 7. Recommended Next Steps

1. **Open project in Unity 6000.6.3f1** and let it import all assets
2. **Run the Chennai scene** and verify:
   - Player appears as a visible human character
   - Player can walk, run, sprint, crouch, jump
   - Murugan appears at the tea stall as a visible human
   - Approaching Murugan shows interaction prompt
   - Pressing E opens dialogue UI with Tamil text
   - Murugan plays Talk animation
3. **Run `RuntimeAutomatedSmokeTest`** to capture automated evidence
4. **Build Windows x64 player** and repeat verification in the executable
5. **Capture screenshots** for each evidence requirement:
   - Full player model in gameplay
   - Player walking and sprinting
   - Player interacting with Murugan
   - Murugan visibly animated and facing player
   - Dialogue UI while NPC is visible
   - Character appearance after save/load
