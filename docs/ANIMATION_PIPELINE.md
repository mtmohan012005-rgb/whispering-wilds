# Production Animation Pipeline Specification
**The Whispering Wilds (காட்டு வழி / Thadam)**  
*Platform: Windows PC (Target: 30 / 60 / 120 / 144 / 240 FPS Frame-Independent)*  
*Authoritative Model: `assets/characters/player/player.glb`*  

---

## 1. Authoritative Architecture & Single Animation Authority
All character and creature animation playback in *The Whispering Wilds* flows through one centralized authority:
- **`AnimationController`** (`js/animation/animation-controller.js`): Single point of control. No independent, uncoordinated managers are permitted to fight over the same skeleton.
- **Mixer Ownership**: Skinned meshes register their `THREE.AnimationMixer` with `AnimationCache` to prevent duplicate mixers, memory leaks, and multiple conflicting `requestAnimationFrame` loops.
- **Frame-Rate Independence**: All updates evaluate using `deltaTime` (seconds). The delta is clamped to a maximum of 100ms (`Math.min(deltaTime, 0.1)`) to eliminate time jumps or player teleports upon window focus recovery (Alt+Tab, sleep, debugger pauses).

---

## 2. Canonical Humanoid Skeleton Standard
All production humanoid models (Player, NPCs) adhere to the standard hierarchy defined in `js/data/retarget-data.js`:

```text
Root (at world origin 0, 0, 0)
 └── Hips (Pelvis at Y = ~0.95m)
      ├── Spine ── Spine1 ── Spine2 ── Chest
      │    ├── Neck ── Head (with Eye / Jaw bones)
      │    ├── LeftShoulder ── LeftArm ── LeftForeArm ── LeftHand (Fingers)
      │    └── RightShoulder ── RightArm ── RightForeArm ── RightHand (Fingers)
      ├── LeftUpLeg ── LeftLeg ── LeftFoot ── LeftToeBase
      ├── RightUpLeg ── RightLeg ── RightFoot ── RightToeBase
      └── Secondary Cloth Bones (Cloth_Veshti_*, Cloth_Thundu_*)
```

- **Feet Placement**: In rest pose (T-pose/A-pose), bottom of foot soles must rest exactly at `Y = 0.0`.
- **Secondary Bones**: Attire elements (`Cloth_Veshti_*`, `Cloth_Thundu_*`) provide secondary motion via spring-damper inertia in `PoseController` without requiring expensive GPU cloth simulation.

---

## 3. Clip Naming Standard
To avoid ambiguous or colliding asset identifiers, all clips conform to uppercase prefixed notation:

| Category | Example Clip Names |
|---|---|
| **Player Locomotion** | `Player_Idle`, `Player_Start`, `Player_Walk`, `Player_Fast_Walk`, `Player_Run`, `Player_Sprint`, `Player_Stop`, `Player_Turn_Left`, `Player_Turn_Right`, `Player_Strafe_Left`, `Player_Strafe_Right`, `Player_Backward` |
| **Player Aerial & Crouch**| `Player_Jump_Start`, `Player_Jump`, `Player_Fall`, `Player_Land`, `Player_Crouch_Idle`, `Player_Crouch_Walk` |
| **Player Interactions** | `Player_Interact`, `Player_Pickup`, `Player_Inspect`, `Player_Push`, `Player_Pull`, `Player_Climb`, `Player_Mantle` |
| **Transport** | `Player_Bicycle_Mount`, `Player_Bicycle_Pedal`, `Player_Bicycle_Dismount`, `Player_Boat_Board`, `Player_Boat_Row`, `Player_Boat_Dismount` |
| **NPC Vocations** | `NPC_TEA_SHOP_POUR`, `NPC_FARMER_INSPECT`, `NPC_FISHER_CAST_NET`, `NPC_ARTISAN_CHISEL` |
| **Wildlife** | `WILDLIFE_TAHR_IDLE`, `WILDLIFE_TAHR_RUN`, `WILDLIFE_ELEPHANT_STRIDE` |

---

## 4. Root Motion & Character Controller Authority
- **Authority**: The gameplay transform is owned strictly by `CharacterController` and `GameState`. Animation clips never directly override or teleport world coordinates.
- **Root Motion Reconciliation**: Root bone displacement is extracted per frame, validated against collision geometry via `CollisionSystem`, and passed into `CharacterController.move(delta)`.
- **Teleport Protection**: Any clip with instantaneous root displacement greater than 20 m/s is rejected by `AnimationValidationSystem`.

---

## 5. Motion Matching & Locomotion Blending
- **Curated Database**: Locomotion clips are indexed in `AnimationRegistry` with calibrated velocities, directions, contact phases, and angular turn rates.
- **Matching Metric**: Queries evaluate:
  $$\text{Cost} = w_{\text{speed}}(\Delta \text{speed})^2 + w_{\text{dir}}(\Delta \text{dir})^2 + w_{\text{turn}}(\Delta \text{turn})^2 + \text{bonus}_{\text{continuity}}$$
- **Phase Sync**: Blending between cyclic gaits (e.g. Walk $\to$ Run) normalizes stride phases so foot contact transitions smoothly without cadence snapping.

---

## 6. Procedural IK Systems
1. **Two-Bone Foot IK (`FootIKSystem`)**:
   - Raycasts downward under each foot to sample terrain height and slope normal.
   - Evaluates analytical law-of-cosines knee flexion.
   - Maximum correction is clamped to 0.38m; extreme discrepancies fall back to base animation to prevent leg hyper-extension.
2. **Two-Bone Hand IK (`HandIKSystem`)**:
   - Snaps hands to designated interaction anchors (door handles, gate latches, well pump levers, boat oars).
   - Maximum reach clamped to 0.65m; out-of-reach anchors fall back to authored reach poses without stretching arms.
3. **Full-Body Grounding (`FullBodyIK`)**:
   - Depresses pelvis height when one foot steps down a steep incline so both feet make ground contact.
   - Quadruped alignment tilts the body pitch to conform to terrain contours for animals (Nilgiri Tahr, Gaur, Elephant).

---

## 7. Priority Look-At System (`LookAtSystem`)
- **Hierarchy**:
  1. Critical dialogue speaker (Priority 5)
  2. Active interaction anchor (Priority 4)
  3. Story event or discovery trigger (Priority 3)
  4. Nearby player character (Priority 2)
  5. Ambient environmental landmark (Priority 1)
- **Anatomical Limits**: Yaw is restricted to $\pm 68^\circ$, Pitch to $\pm 35^\circ$. If target moves behind the character ($> 85^\circ$), gaze smoothly recenters and signals a body turn.

---

## 8. Animation LOD & Quality Tiers
Distance-based LOD thresholds managed by `AnimationPerformanceSystem`:

| LOD Tier | Distance Range | Capabilities Active | Update Frequency |
|:---:|:---:|:---|:---:|
| **LOD0** | 0 – 25m | Full animation, Foot IK, Hand IK, Look-At, Cloth physics, Additive breathing | Every frame (60–240 Hz) |
| **LOD1** | 25 – 65m | Normal animation, Medium Foot IK, Simplified Look-At | Every frame |
| **LOD2** | 65 – 130m | Base animation only, No procedural IK, No cloth physics | Every 2nd frame |
| **LOD3** | > 130m | Minimal distant animation | Every 4th frame |

Quality integration with `PerformanceManager`: On low-spec hardware (`LOW` profile), LOD2 is enforced closer to player and distant animation updates are aggressively throttled.

---

## 9. Animation Events & Subsystem Routing
Clips emit standard events (`FOOTSTEP`, `CONTACT`, `GRAB`, `RELEASE`, `LAND`, `INTERACTION_COMPLETE`, `MOUNT`, `DISMOUNT`).
- Events do **not** mutate global game state directly.
- Decoupled routing:
  - `FOOTSTEP` $\to$ `AudioManager.playFootstep(surface, intensity)`
  - `LAND` $\to$ `AudioManager.playLandImpact(surface, intensity)`
  - `INTERACTION_COMPLETE` $\to$ `InteractionSystem.onAnimationComplete()`
  - `MOUNT`/`DISMOUNT` $\to$ `TransportSystem.onMountComplete()`

---

## 10. Cultural Attire Motion Safeguards
- **Veshti / Dhoti**: Restricts maximum knee flexion to $110^\circ$ and stride angle to $0.8\text{ rad}$ to prevent leg mesh penetration through cotton wraps.
- **Saree / Lungi**: Adjusted gait constraints ensuring smooth, dignified, authentic movement without unnatural cloth stretching.
- **Zero-Xbot Rule**: Final character model must always be `assets/characters/player/player.glb`. External demo characters or test CDNs are strictly prohibited in production builds.
