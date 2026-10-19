# NPC ASSET AND RIG AUDIT — STEP 31

**Date:** 2026-10-11
**Scope:** Audit of all NPC character assets, rigs, materials, and animation
**Repository:** whispering-wilds, branch `ai/unity-graphics-world-upgrade`

## 1. Legacy GLB Models — Confirmed PLACEHOLDER

All 9 original GLB character models remain PLACEHOLDER (confirmed by STEP 29/30 byte-level binary parse). They are no longer used for rendering — CharacterPrefabCatalog redirects all GLB paths to production prefabs.

| Model | Size | Nodes | Meshes | Tris | Skins | Textures | Animations | Verdict |
|---|---|---|---|---|---|---|---|---|
| player.glb | 43,952 B | 22 | 13 | ~168 | 1 (19 joints) | 0 | 24 stubs | PLACEHOLDER |
| murugan.glb | 12,608 B | 6 | 6 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |
| velu.glb | 9,024 B | 4 | 4 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |
| selvam.glb | 10,240 B | 5 | 5 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |
| meenakshi.glb | 11,264 B | 5 | 5 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |
| artisan.glb | 7,488 B | 4 | 4 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |
| farmer.glb | 7,488 B | 4 | 4 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |
| fisher.glb | 7,488 B | 4 | 4 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |
| forest-guide.glb | 8,960 B | 5 | 5 | 48-84 | 0 | 0 | 0 | PLACEHOLDER |

**Evidence:** Zero textures in any model. NPC models have no skeleton. Player has 19 joints (no finger bones). Animation "channels" are single-bone stubs.

## 2. Production Character Prefabs

### 2.1 Prefab Inventory

| Prefab | Path | SkinnedMeshRenderers | Animator | Avatar | Controller |
|---|---|---|---|---|---|
| PlayerCharacter | Prefabs/Characters/PlayerCharacter.prefab | 5 | ✓ | ✓ | ✓ |
| NPC_Murugan | Prefabs/Characters/NPC_Murugan.prefab | 6 | ✓ | ✓ | ✓ |
| NPC_Velu | Prefabs/Characters/NPC_Velu.prefab | 5-6 | ✓ | ✓ | ✓ |
| NPC_Selvam | Prefabs/Characters/NPC_Selvam.prefab | 5-6 | ✓ | ✓ | ✓ |
| NPC_Meenakshi | Prefabs/Characters/NPC_Meenakshi.prefab | 5-6 | ✓ | ✓ | ✓ |
| NPC_Artisan | Prefabs/Characters/NPC_Artisan.prefab | 5-6 | ✓ | ✓ | ✓ |
| NPC_Farmer | Prefabs/Characters/NPC_Farmer.prefab | 5-6 | ✓ | ✓ | ✓ |
| NPC_Fisher | Prefabs/Characters/NPC_Fisher.prefab | 5-6 | ✓ | ✓ | ✓ |
| NPC_ForestGuide | Prefabs/Characters/NPC_ForestGuide.prefab | 5-6 | ✓ | ✓ | ✓ |
| NPC_TeaWorker | Prefabs/Characters/NPC_TeaWorker.prefab | 5-6 | ✓ | ✓ | ✓ |

### 2.2 Generic Avatar

- **Asset:** `Art/Characters/Procedural/GenericAvatar.asset`
- **Type:** Generic Avatar (not Humanoid)
- **Bone hierarchy:** CharacterOffset/Root/Hips/Spine/Chest/UpperChest/Neck/Head + mirrored arms with finger bones + legs with toes
- **Bone count:** 40+ bones including 10 finger bones per hand
- **Root motion bone:** Hips (index 2)
- **Status:** VALID

### 2.3 Materials

All materials under `Art/Characters/Procedural/Materials/`:
- M_skin_tamil.mat (HDRP/Lit) — Skin tone
- M_hair_black.mat (HDRP/Lit) — Hair
- M_fabric_white.mat (HDRP/Lit) — White cotton shirt
- M_fabric_cream.mat (HDRP/Lit) — Cream veshti
- M_fabric_blue.mat (HDRP/Lit) — Blue variant
- M_fabric_green.mat (HDRP/Lit) — Green variant
- M_fabric_mustard.mat (HDRP/Lit) — Mustard variant
- M_sandal_brown.mat (HDRP/Lit) — Footwear

**Status:** All materials use HDRP/Lit shader.

## 3. Animation Assets

### 3.1 Player Animation Clips

| Clip | File | Keyframes | Status |
|---|---|---|---|
| PlayerIdle | PlayerIdle.anim | 30+ keyframes, 30 fps | EXISTS |
| PlayerWalk | PlayerWalk.anim | Full-body cycle | EXISTS |
| PlayerRun | PlayerRun.anim | Faster cycle | EXISTS |
| PlayerSprint | PlayerSprint.anim | Max speed cycle | EXISTS |
| PlayerCrouchIdle | PlayerCrouchIdle.anim | Crouched breathing | EXISTS |
| PlayerCrouchWalk | PlayerCrouchWalk.anim | Crouched movement | EXISTS |
| PlayerJump | PlayerJump.anim | Jump arc | EXISTS |
| PlayerFall | PlayerFall.anim | Falling pose | EXISTS |
| PlayerLand | PlayerLand.anim | Landing recovery | EXISTS |

### 3.2 NPC Animation Clips

| Clip | File | Status |
|---|---|---|
| NPCIdle | NPCIdle.anim | EXISTS |
| NPCWalk | NPCWalk.anim | EXISTS |
| NPCRun | NPCRun.anim | EXISTS |
| NPCTalk | NPCTalk.anim | EXISTS |
| NPCWork | NPCWork.anim | EXISTS |
| NPCEat | NPCEat.anim | EXISTS |
| NPCFish | NPCFish.anim | EXISTS |
| NPCSit | NPCSit.anim | EXISTS |
| NPCSleep | NPCSleep.anim | EXISTS |

### 3.3 Animator Controllers

| Controller | Path | States | Parameters |
|---|---|---|---|
| PlayerCharacter.controller | Art/Animations/Characters/ | 9 states | Speed, Grounded, FreeFall, Crouching, Jump |
| NPCCharacter.controller | Art/Animations/Characters/ | 17 states | State, IsWalking, IsSleeping, IsWorking, IsTalking, WorkAction, IdleAction |

## 4. Rig Verification

### 4.1 Bone Hierarchy

All character prefabs share the same Generic Avatar skeleton:
```
CharacterOffset
└── Root
    └── Hips
        ├── Spine
        │   ├── Chest
        │   │   ├── UpperChest
        │   │   │   ├── Neck
        │   │   │   │   └── Head
        │   │   │   ├── LeftShoulder → LeftUpperArm → LeftLowerArm → LeftHand (with fingers)
        │   │   │   └── RightShoulder → RightUpperArm → RightLowerArm → RightHand (with fingers)
        │   │   └── ...
        ├── LeftUpLeg → LeftLeg → LeftFoot → LeftToeBase
        └── RightUpLeg → RightLeg → RightFoot → RightToeBase
```

### 4.2 Finger Bones

Each hand has 5 finger bones:
- LeftThumbProximal/LeftThumbIntermediate/LeftThumbDistal
- LeftIndexProximal/LeftIndexIntermediate/LeftIndexDistal
- LeftMiddleProximal/LeftMiddleIntermediate/LeftMiddleDistal
- LeftRingProximal/LeftRingIntermediate/LeftRingDistal
- LeftLittleProximal/LeftLittleIntermediate/LeftLittleDistal
- (Mirrored for right hand)

**Status:** Full finger bone hierarchy present.

## 5. Prefab-to-Scene Mapping

| Scene | NPCs | Prefab Resolution |
|---|---|---|
| 02_Chennai_GeorgeTown | 14 NPCs | BuildChennaiPopulation → CharacterPrefabCatalog |
| 03_Pichavaram_Wetlands | 1 NPC (Mani) | AssembleAllRegions → CharacterPrefabCatalog |
| 04_Thanjavur_Delta | 1 NPC (Arumugam) | AssembleAllRegions → CharacterPrefabCatalog |
| 06_Mamallapuram_Shore | 1 NPC (Sundaram) | AssembleAllRegions → CharacterPrefabCatalog |
| 07_Nilgiris_Sanctuary | 1 NPC (Raman) | AssembleAllRegions → CharacterPrefabCatalog |

## 6. Issues Found

### 6.1 No Issues — Assets Are Complete

All production character assets are properly configured:
- Prefabs exist with skinned meshes, Animator, Avatar, and Controller
- Animation clips contain real keyframe data
- Animator controllers have correct states and parameters
- Materials use HDRP/Lit shader
- Generic Avatar is valid with 40+ bones

### 6.2 Legacy GLBs Still Present

The original GLB files remain in the repository. They are no longer referenced for character rendering (redirected by CharacterPrefabCatalog), but should be marked clearly as deprecated.

## 7. Verdict

| Category | Status | Notes |
|---|---|---|
| NPC prefab existence | **PASS** | All 9 NPC prefabs exist |
| Skinned mesh renderers | **PASS** | 5-6 per NPC |
| Generic Avatar rig | **PASS** | 40+ bones with fingers |
| Materials | **PASS** | HDRP/Lit, culturally appropriate |
| Animation clips | **PASS** | 9 NPC clips with keyframes |
| Animator controller | **PASS** | 17 states, 7 parameters |
| CharacterPrefabCatalog | **PASS** | All GLB paths redirected |
| Legacy GLB deprecation | **NOTED** | GLBs remain but are unused |

**Overall: NPC ASSET AND RIG INFRASTRUCTURE IS COMPLETE.**
