# STEP 39 — Realistic Human Character Integration Guide

## Executive Summary

**Status: BLOCKED — Requires Unity 6 Editor and 3D Asset Downloads**

This document provides the complete integration infrastructure for replacing the procedural blockout characters with realistic 3D human models. The source code and editor tools are ready; the remaining work requires:
1. **Unity 6000.6.3f1 Editor** — to import FBX files, configure Humanoid Avatars, and build prefabs
2. **3D Model Downloads** — realistic human character models from Mixamo or other free sources
3. **Runtime Verification** — to validate the characters render and animate correctly

## Current State

All 10 character models (1 player + 9 NPCs) are **procedurally generated from primitive shapes**:
- **player.glb**: 43KB, ~168 triangles, built from boxes/cylinders
- **murugan.glb**: 12KB, no skeletal rig or animations
- All other NPC GLBs: similarly tiny procedural blockouts

The procedural pipeline (`CharacterFactory.cs`, `MeshOps.cs`, `CharacterAssetBuilder.cs`) generates:
- 42-bone skeleton hierarchy (including finger bones)
- Primitive meshes (boxes for limbs, cylinders for torso)
- Procedural textures (solid colors, no real skin/cloth textures)
- Simple animation clips (sinusoidal keyframe curves)

## Animation Parameter Contracts

### Player Animator (PlayerCharacter.controller)
**Script:** `PlayerMovement.UpdateAnimator()`
```csharp
animator.SetFloat("Speed", animationBlend);       // 0-1 blend
animator.SetBool("Grounded", isGrounded);
animator.SetBool("FreeFall", verticalVelocity < -4.0f && !isGrounded);
animator.SetBool("Crouching", input.IsCrouching);
```

**Required states:** Idle, Walk, Run, Jump, Crouch, Ground (landing)

### NPC Animator (NPCCharacter.controller)
**Script:** `NPCAnimationDriver.RequestState(NPCAnimState)`

**Required states:** Idle, Walk, Run, Work, Talk, Eat, Drink, Carry, Buy, Sell, Craft, Fish, Farm, TeaWork, Sit, Sleep, React

## Recommended Asset Sources

### Primary: Mixamo (Adobe) — FREE with Adobe ID
- **URL:** https://www.mixamo.com
- **License:** Free for commercial use with Adobe ID
- **Format:** FBX (Unity-compatible)
- **Rigging:** Auto-rigger with Mixamo skeleton (Unity Humanoid compatible)
- **Animations:** 1700+ free animations
- **Character count:** 100+ pre-made characters

**Recommended Mixamo Characters for Tamil Nadu Setting:**
| Character | Mixamo Model | Rationale |
|-----------|--------------|-----------|
| Player (male) | Search "Indian male" or use generic male + custom clothing | Protagonist |
| Murugan (male) | Search "Indian shopkeeper" or mature male | Tea shop owner |
| Velu (male) | Search "Indian laborer" or working-class male | Local resident |
| Selvam (male) | Search "Indian farmer" | Farmer/trader |
| Meenakshi (female) | Search "Indian woman" | Story character |
| Artisan (male) | Search "Indian craftsman" | Workshop NPC |
| Fisher (male) | Search "Indian fisherman" | Coastal NPC |
| Forest Guide (male) | Search "Indian guide" or ranger | Nilgiris NPC |
| Farmer (male) | Search "Indian farmer" (distinct from Selvam) | Delta NPC |

### Secondary: Meshy AI — CC0
- **URL:** https://www.meshy.ai/tags/mixamo
- **License:** CC0 (public domain)
- **Format:** FBX, GLB, OBJ
- **Note:** AI-generated, quality varies

### Tertiary: Cinevva — CC0
- **URL:** https://app.cinevva.com/game-assets/free-3d-character-models
- **License:** CC0
- **Note:** Limited South Asian characters

## Integration Workflow

### Phase 1: Download and Prepare Models

1. **Create Adobe ID** at https://id.adobe.com
2. **Log into Mixamo** at https://www.mixamo.com
3. **For each character:**
   a. Search for a suitable character model
   b. Select the character
   c. Download the character model (FBX format, "With Skin")
   d. Save to `unity/Assets/_Project/Art/Models/Characters/Production/`

4. **Download animations** for each character:
   - Idle (multiple variants)
   - Walk
   - Run
   - Jump
   - Crouch
   - Talk/Conversation
   - Work/Interaction
   - Sit
   - Role-specific animations (tea preparation, fishing, farming, etc.)

### Phase 2: Import into Unity

1. **Open Unity 6000.6.3f1**
2. **Import FBX files** into the project
3. **For each character model:**
   a. Select the FBX in Project window
   b. In Inspector → Rig tab:
      - Animation Type: **Humanoid**
      - Avatar Definition: **Create From This Model**
      - Click "Apply"
   c. In Inspector → Model tab:
      - Scale Factor: Adjust to match game scale (typically 1.0 for Mixamo)
      - Compression: **Optimal**
   d. In Inspector → Materials tab:
      - Material Location: **External (Model/CharacterName)**
      - Material Location: **Override**
   e. Click "Apply"

4. **Configure HDRP materials:**
   - Select each imported material
   - Change Shader to **HDRP/Lit** or **HDRP/Skin** (for skin)
   - Configure PBR properties

### Phase 3: Build Production Prefabs

Run the editor menu: **Whispering Wilds/Characters/Build Production Characters**

This will:
1. Load each production FBX model
2. Create a prefab with the correct bone hierarchy
3. Attach required components:
   - `NPCCharacter` (profile, dialogue, occupation)
   - `NPCNavigationController` (NavMesh movement)
   - `NPCAnimationDriver` (animation state machine)
   - `NPCScheduleManager` (daily schedule)
   - `CapsuleCollider` (interaction detection)
4. Configure the Animator with the NPCCharacter.controller
5. Save the prefab to `Assets/_Project/Prefabs/Characters/`

### Phase 4: Animation Integration

1. **For each character's Animator Controller:**
   a. Create or update the controller
   b. Add states for each animation clip
   c. Configure transitions matching the parameter contract
   d. Test in Unity Editor

2. **Player animations:**
   - Map Mixamo animations to PlayerCharacter.controller states
   - Ensure "Speed", "Grounded", "FreeFall", "Crouching" parameters work

3. **NPC animations:**
   - Map Mixamo animations to NPCCharacter.controller states
   - Ensure NPCAnimationDriver state names match

### Phase 5: Visual Customization

1. **Clothing:** Replace or modify materials to reflect Tamil Nadu attire
2. **Skin tones:** Adjust material colors for cultural accuracy
3. **Hair:** Customize or replace hair meshes
4. **Distinct appearances:** Ensure each NPC looks different

### Phase 6: Testing

1. **Run Editor tests:** `Tools/Whispering Wilds/QA/Run Character Tests`
2. **Build Windows x64 player**
3. **Launch and verify:**
   - Player model is visible and animated
   - NPCs are visible, animated, and interactable
   - Dialogue works with visible characters
   - Movement and navigation function correctly

## Technical Requirements

### Model Requirements
- **Format:** FBX (preferred) or GLB
- **Rig:** Humanoid-compatible skeleton
- **Triangles:** 15,000-60,000 for LOD0
- **Textures:** PBR maps (albedo, normal, roughness, metallic)
- **Animations:** T-pose or A-pose for auto-rigging
- **Scale:** Unity-compatible (1 unit = 1 meter)

### Unity Import Settings
- **Animation Type:** Humanoid
- **Avatar Definition:** Create From This Model
- **Generate Materials:** External
- **Optimize Game Objects:** Enabled
- **Read/Write Enabled:** Disabled (unless needed)

### Component Requirements
Each character prefab must have:
- `Animator` with valid controller
- `SkinnedMeshRenderer` (visible mesh)
- `CapsuleCollider` (interaction detection)
- `NPCCharacter` or `PlayerMovement` (gameplay logic)
- `NPCNavigationController` (for NPCs)
- `NPCAnimationDriver` (for NPCs)

## Asset License Documentation

For each imported model, record:
- Source URL
- License type (CC0, CC BY, Mixamo Terms, etc.)
- Attribution requirements
- Commercial use permission
- Modification permission

## Known Limitations

1. **Mixamo skeleton** differs from the procedural 42-bone rig. The integration script must map Mixamo bones to the expected hierarchy.
2. **Facial animation** is not yet implemented; body-only animation.
3. **Root motion** must be disabled; movement is driven by CharacterController/NavMeshAgent.
4. **LOD generation** requires manual setup or automated LOD generation tool.

## Next Steps

1. Download realistic character models from Mixamo
2. Open project in Unity 6000.6.3f1
3. Import models and configure Humanoid Avatars
4. Run the production character builder
5. Test in Editor and standalone build
6. Update this report with actual results
