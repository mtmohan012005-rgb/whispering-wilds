# Player Character Animation Specification & Pipeline

**Target File**: `assets/characters/player/player.glb`  
**Game**: The Whispering Wilds (காட்டு வழி / Thadam)  
**Platform**: PC Only (Target 60 FPS)

---

## 1. Authored Animation Clips & Clip Names

All clips must be authored and embedded inside the single production binary `player.glb` using the exact clip names below:

| Animation Clip Name | Type | Loop | Description & Cultural Motion Dynamics |
| :--- | :--- | :--- | :--- |
| `Player_Idle` | Locomotion | Yes | Natural weight shifting between feet, subtle chest breathing, relaxed arm rest, authentic Tamil explorer posture. |
| `Player_Walk` | Locomotion | Yes | Calibrated ~1.5 m/s. Natural heel-to-toe gait, authentic swinging motion, thundu gentle drape oscillation. |
| `Player_Run` | Locomotion | Yes | Calibrated ~3.2 m/s. Dynamic knee lift, forward spine lean, rhythmic arm pump. |
| `Player_Sprint` | Locomotion | Yes | Calibrated ~5.5 m/s. Full sprint, deep forward lean, powerful arm drive, flared lungi/veshti motion. |
| `Player_Jump_Start` | Action | No | Pre-jump crouch and takeoff push-off. |
| `Player_Jump` | Action | Yes | Airborne apex loop with legs flexed for balance. |
| `Player_Fall` | Action | Yes | Gravity-induced descent pose with arms balancing. |
| `Player_Land` | Action | No | Dual knee flexion absorbing kinetic impact, stabilizing to ground level. |
| `Player_Interact` | Action | No | Upper body reaching forward to touch or converse with NPC/object. |
| `Player_Pickup` | Action | No | Torso bending down, dominant hand grasping item from ground, standing erect. |
| `Player_Inspect` | Action | No | Holding relic / stone fragment at chest level, rotating hand to inspect. |
| `Player_Use_Item` | Action | No | Applying item or drinking tender coconut / tea. |
| `Player_Crouch_Idle` | Locomotion | Yes | Low profile crouch pose, weight planted on balls of feet. |
| `Player_Crouch_Walk` | Locomotion | Yes | Low profile stalking walk (~0.8 m/s). |
| `Player_Climb` | Action | Yes | Alternating hand-over-hand and foot vertical ladder or rock traversal. |
| `Player_Swim` | Locomotion | Yes | Breaststroke / treading water through Pichavaram canals. |
| `Player_Sit` | Action | No | Transition from standing to sitting down on wooden tea kadai bench. |
| `Player_Stand` | Action | No | Transition from bench sit to upright standing. |
| `Player_Eat` | Action | No | Eating crispy medu vadai with right hand. |
| `Player_Drink` | Action | No | Raising traditional brass tumbler / tea cup to lips. |
| `Player_Photo` | Action | No | Raising vintage mechanical camera to eye level with viewfinder framing. |

---

## 2. Rigging & Bone Hierarchy Rules

- Export using standard humanoid naming convention with `Root` placed at (0, 0, 0).
- Fingers must have full 3-segment bones for natural grasping without exploding meshes.
- Secondary cloth bones (`Cloth_Veshti_*`, `Cloth_Thundu_*`) provide secondary inertia during turns and wind without requiring expensive GPU cloth simulators.
- Rig must keep feet flat on ground at Y = 0 in rest pose for Two-Bone Foot IK terrain conformity.

## 3. Blender Export Settings

1. **Format**: `glTF 2.0 (.glb binary)`.
2. **Transform**: `Y Up`, `Apply Modifiers` enabled.
3. **Geometry**: Export Normals, Tangents, Vertex Colors.
4. **Animation**: `Group by NLA Track` disabled (bake actions into NLA before export or export all actions).
5. **Textures**: Embedded WebP PBR maps (Albedo, Normal, Roughness, AO).
