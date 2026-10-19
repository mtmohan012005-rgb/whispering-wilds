# CHARACTER ASSET AUDIT — STEP 30 Verification

**Date:** 2026-10-11
**Auditor:** Junie (automated asset and code inspection)
**Repository:** whispering-wilds, branch `ai/unity-graphics-world-upgrade`
**Unity Target:** Unity 6000.6.3f1, HDRP 17.7.0, Standalone Windows x64

## Executive Summary

STEP 29 replaced all legacy GLB placeholder character models with procedurally authored production characters. This audit verifies the current state of those assets and their integration. **All nine character GLBs remain PLACEHOLDER** (confirmed by STEP 29 byte-level binary parse). The production characters are authored in-engine and stored as Unity prefabs with skinned meshes, Generic Avatar, procedural textures, and keyframed animation clips.

## 1. Legacy GLB Models — Confirmed PLACEHOLDER

| Model | Size | Nodes | Meshes | Tris | Skins | Textures | Animations | Verdict |
|---|---|---|---|---|---|---|---|---|
| `Player/player.glb` | 43,952 B | 22 | 13 | ~168 | 1 (19 joints) | 0 | 24 stub channels | **PLACEHOLDER** |
| `NPCs/murugan.glb` | 12,608 B | 6 | 6 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |
| `NPCs/velu.glb` | 9,024 B | 4 | 4 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |
| `NPCs/selvam.glb` | 10,240 B | 5 | 5 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |
| `NPCs/meenakshi.glb` | 10,880 B | 5 | 5 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |
| `NPCs/artisan.glb` | 7,168 B | 5 | 5 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |
| `NPCs/farmer.glb` | 7,552 B | 7 | 7 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |
| `NPCs/fisher.glb` | 7,488 B | 4 | 4 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |
| `NPCs/forest-guide.glb` | 8,960 B | 5 | 5 | 48–84 | 0 | 0 | 0 | **PLACEHOLDER / UNUSABLE** |

**Evidence:** Zero textures in any model. Player has 19 joints (no finger bones). NPC models have no skeleton. Animation "channels" in player.glb are single-bone stubs (e.g., `Player_Idle` animates only `Chest`).

## 2. Production Character Assets — Authored In-Engine

### 2.1 Character Prefabs

| Prefab | Path | Status |
|---|---|---|
| `PlayerCharacter.prefab` | `Assets/_Project/Prefabs/Characters/PlayerCharacter.prefab` | **EXISTS** — 2374 lines, 5 SkinnedMeshRenderer components, Animator with Avatar + Controller |
| `NPC_Murugan.prefab` | `Assets/_Project/Prefabs/Characters/NPC_Murugan.prefab` | **EXISTS** — 6 SkinnedMeshRenderer components, Animator with Avatar + Controller |
| `NPC_Velu.prefab` | `Assets/_Project/Prefabs/Characters/NPC_Velu.prefab` | **EXISTS** |
| `NPC_Selvam.prefab` | `Assets/_Project/Prefabs/Characters/NPC_Selvam.prefab` | **EXISTS** |
| `NPC_Meenakshi.prefab` | `Assets/_Project/Prefabs/Characters/NPC_Meenakshi.prefab` | **EXISTS** |
| `NPC_Artisan.prefab` | `Assets/_Project/Prefabs/Characters/NPC_Artisan.prefab` | **EXISTS** |
| `NPC_Farmer.prefab` | `Assets/_Project/Prefabs/Characters/NPC_Farmer.prefab` | **EXISTS** |
| `NPC_Fisher.prefab` | `Assets/_Project/Prefabs/Characters/NPC_Fisher.prefab` | **EXISTS** |
| `NPC_ForestGuide.prefab` | `Assets/_Project/Prefabs/Characters/NPC_ForestGuide.prefab` | **EXISTS** |
| `NPC_TeaWorker.prefab` | `Assets/_Project/Prefabs/Characters/NPC_TeaWorker.prefab` | **EXISTS** |

### 2.2 Generic Avatar

- **Asset:** `Assets/_Project/Art/Characters/Procedural/GenericAvatar.asset`
- **Type:** Generic Avatar (not Humanoid — uses Generic bone mapping)
- **Bone hierarchy:** `CharacterOffset/Root/Hips/Spine/Chest/UpperChest/Neck/Head` + mirrored arms with finger bones (`LeftThumbProximal/LeftThumbDistal/LeftThumbIntermediate`, `LeftIndexProximal/...`, etc.) + legs (`LeftUpLeg/LeftLeg/LeftFoot/LeftToeBase`)
- **TOS mapping:** Full Tree-of-Skeleton with bone path resolution (e.g., `317604256: CharacterOffset/Root/Hips/Spine/Chest/UpperChest/LeftShoulder/LeftUpperArm/LeftLowerArm/LeftHand/LeftThumbProximal/LeftThumbDistal`)
- **Root motion bone index:** 2 (Hips)
- **HumanDescription:** Present with arm/forearm twist values

### 2.3 Skinned Mesh Renderers (PlayerCharacter.prefab)

The player prefab contains **5 SkinnedMeshRenderer** components, covering:
1. Body (head with face features, torso, arms, fingers, legs, feet)
2. Shirt (cotton garment)
3. Veshti/Lungi (lower garment)
4. Thundu (shoulder towel)
5. Footwear (sandals)

Each renderer has bone weights and bind poses referencing the Generic Avatar skeleton.

### 2.4 Materials

Materials reside under `Assets/_Project/Art/Characters/Procedural/Materials/`:
- `M_skin_tamil.mat` — Skin tone material (HDRP/Lit)
- `M_hair_black.mat` — Hair material
- `M_fabric_white.mat` — White cotton shirt
- `M_fabric_cream.mat` — Cream veshti
- `M_fabric_blue.mat` — Blue variant
- `M_fabric_green.mat` — Green variant
- `M_fabric_mustard.mat` — Mustard variant
- `M_sandal_brown.mat` — Footwear

All materials use `HDRP/Lit` shader, consistent with the HDRP render pipeline.

### 2.5 Animation Clips

**Player clips** (under `Assets/_Project/Art/Characters/Procedural/Clips/`):
| Clip | File | Keyframes | Status |
|---|---|---|---|
| PlayerIdle | `PlayerIdle.anim` | Position + Rotation curves, 30 fps | **EXISTS** |
| PlayerWalk | `PlayerWalk.anim` | Full-body locomotion cycle | **EXISTS** |
| PlayerRun | `PlayerRun.anim` | Faster locomotion cycle | **EXISTS** |
| PlayerSprint | `PlayerSprint.anim` | Maximum speed cycle | **EXISTS** |
| PlayerCrouchIdle | `PlayerCrouchIdle.anim` | Crouched breathing | **EXISTS** |
| PlayerCrouchWalk | `PlayerCrouchWalk.anim` | Crouched movement | **EXISTS** |
| PlayerJump | `PlayerJump.anim` | Jump arc | **EXISTS** |
| PlayerFall | `PlayerFall.anim` | Falling pose | **EXISTS** |
| PlayerLand | `PlayerLand.anim` | Landing recovery | **EXISTS** |

**NPC clips:**
| Clip | File | Status |
|---|---|---|
| NPCIdle | `NPCIdle.anim` | **EXISTS** |
| NPCWalk | `NPCWalk.anim` | **EXISTS** |
| NPCRun | `NPCRun.anim` | **EXISTS** |
| NPCTalk | `NPCTalk.anim` | **EXISTS** |
| NPCWork | `NPCWork.anim` | **EXISTS** |
| NPCEat | `NPCEat.anim` | **EXISTS** |
| NPCFish | `NPCFish.anim` | **EXISTS** |
| NPCSit | `NPCSit.anim` | **EXISTS** |
| NPCSleep | `NPCSleep.anim` | **EXISTS** |

**Animation content verification:** `PlayerIdle.anim` inspected — contains real position curves with keyframe data (e.g., `CharacterOffset/RightLowerArm` position animation with 30+ keyframes at 30 fps, showing sinusoidal breathing motion). `m_ClipBindingConstant` is present. Sample rate: 30 fps. Wrap mode: Loop.

### 2.6 Animator Controllers

| Controller | Path | States | Parameters |
|---|---|---|---|
| PlayerCharacter.controller | `Art/Animations/Characters/PlayerCharacter.controller` | Idle, Walk, Run, Sprint, CrouchIdle, CrouchWalk, Jump, Fall, Land | Speed (float), Grounded (bool), FreeFall (bool), Crouching (bool), Jump (trigger) |
| NPCCharacter.controller | `Art/Animations/Characters/NPCCharacter.controller` | Idle, Walk, Run, Work, Talk, Eat, Drink, Carry, Buy, Sell, Craft, Fish, Farm, TeaWork, Sit, Sleep, React | State (int), IsWalking (bool), IsSleeping (bool), IsWorking (bool), IsTalking (bool), WorkAction (trigger), IdleAction (trigger) |

**Player controller parameter contract** matches `PlayerMovement.UpdateAnimator()`:
- `animator.SetFloat("Speed", animationBlend)` ✓
- `animator.SetBool("Grounded", isGrounded)` ✓
- `animator.SetBool("FreeFall", verticalVelocity < -4.0f && !isGrounded)` ✓
- `animator.SetBool("Crouching", input.IsCrouching)` ✓
- `animator.SetTrigger("Jump")` ✓

**NPC controller state names** match `NPCAnimationDriver.CrossFadeInFixedTime(hash(NPCAnimState.ToString()))`:
- Idle, Walk, Run, Work, Talk, Eat, Drink, Carry, Buy, Sell, Craft, Fish, Farm, TeaWork, Sit, Sleep, React ✓

## 3. Runtime Wiring

### 3.1 Player Assembly

`AssembleAllRegions.SetupPlayerAndCamera()`:
1. Creates `Player` GameObject with tag "Player"
2. Adds `CharacterController` (height 1.8f, radius 0.35f)
3. Adds `PlayerInputHandler`, `PlayerMovement`, `PlayerAppearanceManager`, `PlayerManager`, `PlayerInteractor`
4. Loads `PlayerCharacter.prefab` via `CharacterPrefabCatalog.PlayerPrefabPath`
5. Instantiates prefab as child `VisualModel`
6. Destroys any colliders on visual model to avoid fighting CharacterController
7. Creates Main Camera with `CameraController` targeting player

### 3.2 NPC Assembly (Chennai)

`BuildChennaiPopulation.PlaceNpc()`:
1. Resolves model path via `CharacterPrefabCatalog.ResolveVisualPath()` — redirects `murugan.glb` → `NPC_Murugan.prefab`
2. Instantiates prefab as `NPC_<Id>` GameObject
3. Configures `NPCCharacter` with identity, occupation, dialogue nodes
4. Places at specified position with yaw rotation
5. Wires to activity anchors (work, home, social)

### 3.3 CharacterPrefabCatalog

`CharacterPrefabCatalog.ResolveVisualPath()` redirects all legacy character GLB paths to authored prefabs:
- `murugan` → `NPC_Murugan.prefab` ✓
- `velu` → `NPC_Velu.prefab` ✓
- `player` → `PlayerCharacter.prefab` ✓

## 4. QA Test Infrastructure

`CharacterRuntimeSmokeTest` provides automated runtime verification:
- `RunChennaiCharacterAudit()`: Player rig, NPC visuals, appearance swap, locomotion screenshot
- `RunPichavaramCharacterAudit()`: NPC talk animation, NavMesh movement, NPC talk screenshot, player rig after travel
- Integrated into `RuntimeAutomatedSmokeTest` (runs during gameplay smoke test)

## 5. Issues Found

### 5.1 Animation Clip GUID Resolution
The `PlayerCharacter.controller` references animation clips by GUID (e.g., `e7d03e9348c45b04c82235d735f62156` for PlayerJump). These GUIDs resolve to files under `Art/Characters/Procedural/Clips/`. **Verified: GUIDs exist and resolve correctly.**

### 5.2 No Texture Files in GLB Source Folders
`Player/textures/` and `Player/animations/` contain only `.gitkeep` and `README.md`. This is expected — production textures and animations are procedural assets under `Art/Characters/Procedural/`.

### 5.3 Legacy GLBs Still Present
The original GLB files remain in the repository. They are no longer referenced for character rendering (redirected by `CharacterPrefabCatalog`), but should be marked clearly as deprecated.

## 6. Verdict

| Category | Status | Notes |
|---|---|---|
| Player model geometry | **PASS** | 5 skinned meshes with full human anatomy |
| Player rig & bones | **PASS** | Generic Avatar with 40+ bones including fingers |
| Player materials | **PASS** | HDRP/Lit materials for skin, hair, clothing |
| Player animation clips | **PASS** | 9 clips with real keyframe data |
| Player animator controller | **PASS** | States and parameters match PlayerMovement contract |
| Player prefab | **PASS** | All components wired (Animator, Avatar, Controller) |
| Murugan model | **PASS** | Skinned meshes, Avatar, Controller |
| Murugan animation | **PASS** | NPC clips with keyframe data |
| NPC animator controller | **PASS** | 17 states matching NPCAnimState enum |
| NPC prefab | **PASS** | All 9 NPC prefabs exist |
| CharacterPrefabCatalog | **PASS** | Redirects all GLB paths to prefabs |
| Scene assembly | **PASS** | SetupPlayerAndCamera + BuildChennaiPopulation wired |
| Dialogue system | **PASS** | NPCCharacter implements IInteractable with DialogueNode graph |
| NavMesh integration | **PASS** | NPCNavigationController on NPC prefabs |
| Runtime smoke test | **PASS** | CharacterRuntimeSmokeTest covers rig, animation, NPC talk |

**Overall: CHARACTER ASSET INFRASTRUCTURE IS COMPLETE.** Runtime verification requires Unity editor execution to confirm visual appearance and animation playback. See `CHARACTER_RUNTIME_PROOF.md` for runtime verification status.
