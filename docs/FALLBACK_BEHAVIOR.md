# Fallback Behavior & Self-Healing Matrix

## 1. Overview
*The Whispering Wilds* implements a multi-tier fallback architecture ensuring that hardware constraints or optional feature failures never terminate gameplay or corrupt saved progress.

---

## 2. Subsystem Fallback Catalog

| Subsystem / Feature | Normal Production Path | Fallback Path | Trigger Condition | Player Experience Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Graphics API** | WebGL 2.0 with float/depth buffers | WebGL 1.0 with standard 8-bit buffers | Browser/GPU lacks WebGL 2 | Simplified lighting; gameplay 100% functional |
| **PBR Shaders** | Multi-layer PBR with roughness/metal maps | MeshLambertMaterial / MeshBasicMaterial | Shader compilation error or missing extension | Scene remains fully visible with simplified lighting; no black screens |
| **Textures** | 2048x2048 high-definition textures | Clamped 1024x1024 or approved neutral texture (`#6b6155`) | VRAM pressure or missing texture asset | Smooth rendering; zero pink/magenta missing texture glitches |
| **Water Simulation** | Screen-space reflections, depth fog & ripples | Safe uniform water shader | Depth texture unsupported or shader crash | Ocean & canals remain visible and interactive; collision intact |
| **Shadows** | Soft PCF shadow mapping (2048x2048) | PCF 1024x1024 → Shadows OFF | Sustained frame drop (< 30 FPS) | Lighting remains directional; minor visual flatting |
| **Weather & Foliage** | Dense rain particles & wind-blown foliage | Scaled particle budget (25%) & static foliage | GPU fillrate pressure | Weather mood preserved; frame rate stabilizes |
| **Audio Engine** | 3D Spatial Web Audio with panners | Stereo Web Audio → Silent fallback | AudioContext blocked or hardware missing | Gameplay completely playable without sound; no crashes |
| **Storage / Saves** | Native user-data atomic write | LocalStorage with pre-write `.backup` | Desktop API unavailable or storage error | Previous valid save protected; no data loss |
| **Gamepad Input** | Standard Gamepad API polling | Keyboard & Mouse input | Controller disconnected or unsupported | Immediate HUD prompt switch to keyboard keys |
| **World Streaming** | 3-ring cell preloading & background textures | 1-ring radius & deferred decorative cells | I/O stall or approaching unloaded boundary | Critical terrain & collision load first; zero hitching |
| **Delta Time (alt-tab)**| Measured `rAF` elapsed time (16ms) | Strictly clamped to max 100ms (0.1s) | OS sleep, alt-tab, or heavy CPU stall | Player & NPCs do not teleport; physics does not explode |
| **Emergency Safe Mode**| Player's chosen graphics profile | Low render scale, shadows OFF, minimal effects | 3 consecutive launch crashes or critical instability | Windowed launch, 30 FPS stability guaranteed |

---

## 3. Preservation Invariants
Under **NO** fallback or degradation condition may the following be altered or disabled:
1. **Player Customization Ceiling**: Maximum 5 changes permanently enforced.
2. **Quest & Story Prerequisites**: State transitions and chapter progress.
3. **Inventory & Satchel Contents**: Weight and item possession records.
4. **NPC Relationships & Dialogue Memory**: Recorded consequences and affinity.
5. **Terrain Collision & Safe Haven Spawning**: Physical bounds and fall protection.
