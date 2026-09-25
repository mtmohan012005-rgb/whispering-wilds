# Universal Graphics Backend & Renderer Architecture

## 1. Architectural Authority
`GraphicsBackendManager` is the **sole authority** governing graphics backends, hardware limits, shader compatibility, and WebGL context restoration.

```
GameLifecycle
      ↓
GraphicsBackendManager (Controls WHAT features are available)
      ↓
PerformanceManager (Controls HOW MUCH of them should be used)
      ↓
ThreeWorld (Canvas, Scene, Camera, Render Loop)
```

## 2. Backend Selection Pipeline
At application startup, `GraphicsBackendManager` executes the following sequence:
1. Detect WebGL2 availability and extension support.
2. If WebGL2 is supported: Initialize `WebGL2Backend` with high-performance profile and PCFSoft shadows.
3. If WebGL2 is missing: Initialize `WebGLFallbackBackend` with conservative memory and precision settings.
4. Evaluate optional `WebGPUCapability`: WebGPU is **strictly optional** and never treated as a minimum requirement.
5. If neither WebGL2 nor WebGL1 is supported: Display `GraphicsRecoveryUI` modal without throwing uncaught exceptions.

## 3. Shader Resilience & Material Capability Resolver
Complex PBR materials can fail when legacy drivers lack precision or extension support.
`ShaderCapability` manages a two-tiered material pipeline:
- **PRIMARY**: Standard PBR materials (`MeshStandardMaterial`, `MeshPhysicalMaterial`) with normal, roughness, and metalness maps.
- **FALLBACK**: When a shader compilation fails or when running under low-end profiles, the resolver automatically swaps to lightweight `MeshLambertMaterial` or `MeshBasicMaterial`.
- **Result**: The scene never disappears or turns black.

## 4. Texture Resolution & Format Fallback
- Hardware texture capabilities are capped by profile tier:
  - `ULTRA`: Clamped to 4096px.
  - `HIGH` / `MEDIUM`: Clamped to 2048px.
  - `LOW` / `VERY_LOW`: Clamped to 1024px.
- **Approved Neutral Fallback**: Any missing or corrupted texture is dynamically replaced by an approved 64x64 warm earth-tone canvas texture (`#6b6155`). The game **never** displays black or magenta/pink missing texture artifacts in release builds.

## 5. Render Target Management & Memory Budget
- Centralized through `RenderTargetManager`.
- Maximum FBO memory budget: 256 MB.
- Screenshot captures are clamped to a safe maximum resolution (3840x2160) to prevent GPU out-of-memory spikes.
- Temporary buffers are disposed immediately after use.

## 6. GPU Context Loss & Restoration Lifecycle
The game implements safe event handlers for `webglcontextlost` and `webglcontextrestored`:
1. **Context Lost**:
   - `e.preventDefault()` is invoked immediately to enable browser restoration.
   - Gameplay simulation pauses automatically via `PauseSystem`.
   - Input queues are cleared to avoid stuck key presses.
   - `GameState`, player position, quests, and inventory are preserved in memory without mutation.
2. **Context Restored**:
   - Reconstructs WebGL render targets, compiles active shaders, and restores textures.
   - Preserves existing scene hierarchy; does **NOT** duplicate Three.js scenes, cameras, or players.
   - Resumes gameplay cleanly.
3. **Persistent Loss**:
   - If context loss occurs 3 times consecutively, displays `GraphicsRecoveryUI` offering Retry, Use Safe Settings, or Return to Menu.
