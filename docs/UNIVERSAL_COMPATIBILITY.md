# Universal Compatibility Layer & Device Adaptation

## 1. Architectural Authority
`RuntimeCompatibilitySystem` serves as the **single authoritative manager** for platform capabilities, hardware normalization, dynamic runtime adaptation, and failure recovery in *The Whispering Wilds*.

```
Operating System (Windows / macOS / Linux)
      ↓
UniversalPlatformLayer (Adapters: OS, GPU, Display, Input, Audio, Storage)
      ↓
RuntimeCompatibilitySystem (Sole Compatibility Authority)
      ↓
DeviceProfileSystem (Normalized Tiers: VERY_LOW, LOW, MEDIUM, HIGH, ULTRA)
      ↓
PerformanceManager (Dynamic Render Scale, Quality Levels, Frame Budget)
      ↓
ThreeWorld (Single Active Canvas & Renderer Loop)
      ↓
Gameplay Correctness (Inviolable Quest, Inventory, Save & 5-Customization Limit)
```

## 2. Priority Hierarchy
When system resources become constrained, adaptation adheres strictly to the following priority chain:
1. **STABILITY**: Eliminate unhandled exceptions, GPU crashes, memory leaks, and render loop duplication.
2. **COMPATIBILITY**: Graceful fallback to supported APIs (WebGL2 → WebGL Fallback; silent audio; safe textures).
3. **FRAME PACING**: Consistent frame times (33.3ms for 30 FPS, 16.6ms for 60 FPS) over fluctuating peaks.
4. **RESPONSIVENESS**: Unlocked input polling, zero input lag, rapid camera response.
5. **VISUAL QUALITY**: Scalable PBR materials, shadows, reflections, and dynamic foliage density.

## 3. Normalized Hardware Profile
Introspection produces an anonymous, privacy-safe descriptor containing strictly zero personal identity info (PII):
```json
{
  "os": "WINDOWS" | "MACOS" | "LINUX" | "UNKNOWN",
  "architecture": "x64" | "arm64" | "UNKNOWN",
  "cpuClass": "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
  "logicalCores": 8,
  "gpuClass": "INTEGRATED" | "ENTRY_DEDICATED" | "MID_DEDICATED" | "HIGH_DEDICATED" | "APPLE_SILICON" | "UNKNOWN",
  "memoryClass": "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
  "graphicsApi": "WEBGL2" | "WEBGL_FALLBACK" | "UNAVAILABLE",
  "displayClass": "16:9" | "16:10" | "21:9" | "UNUSUAL",
  "dpr": 1.0,
  "inputCapabilities": { "keyboard": true, "mouse": true, "gamepad": true },
  "audioCapabilities": { "webAudio": true, "spatialAudio": true }
}
```

## 4. Hardware Classification & Default Behavior
- **Known Hardware**: Classified directly into `VERY_LOW`, `LOW`, `MEDIUM`, `HIGH`, or `ULTRA`.
- **Unknown Hardware**: Defaults safely to `MEDIUM` with dynamic performance adaptation active. The game **never** blindly selects `ULTRA` on unrecognized hardware.
- **First Launch Sequence**: `Detect` → `Validate` → `Safe Graphics` → `Short Micro-Benchmark (<= 150ms)` → `Recommend Profile` → `Launch`.

## 5. Inviolable Gameplay Invariants
No compatibility adaptation or emergency recovery is permitted to compromise:
1. **Customization Ceiling**: `0 <= player.customizationChangesUsed <= 5`.
2. **Player Locomotion & World Collision**: Never disabled or clipped.
3. **Story & Quest Progression**: Mission prerequisites, clues, and dialogue trees remain untouched.
4. **Save File Integrity**: Previous valid save files are never overwritten with partial or corrupt data.
