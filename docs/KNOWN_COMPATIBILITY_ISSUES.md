# THE WHISPERING WILDS (KAATTU VAZHI)
## Known Hardware & Browser Compatibility Issues & Workarounds

This document records real compatibility scenarios observed across Windows PC browsers, drivers, and displays, along with their automated engine mitigations.

---

### Issue Registry

#### 1. Intel UHD Graphics (Gen 9 - 11) WebGL 2 Context Loss on High DPI Displays
- **Environment**: Intel Core i5/i7 (8th to 11th Gen) with Intel UHD 620/630 on 4K / High-DPI laptop screens running Edge / Chrome.
- **Symptom**: Attempting to allocate 4K native render targets with $2.0\times$ devicePixelRatio causes periodic WebGL context loss (`webglcontextlost`).
- **Engine Mitigations**:
  - `DeviceCompatibilitySystem` automatically clamps `dprCap` to `1.0` on `VERY_LOW` and `LOW`, and `1.25` on `MEDIUM`.
  - `GPUResourceManager` intercepts context loss, halts render loop, pauses simulation, and safely restores without reloading the page.
- **Status**: **RESOLVED / AUTOMATICALLY MITIGATED**.

#### 2. High Refresh Rate (144Hz - 240Hz) Physics Teleportation on Tab Switch
- **Environment**: High refresh rate monitors running with uncapped browser requestAnimationFrame.
- **Symptom**: Moving the browser tab to background or switching windows produces sudden multi-second delta-time spikes causing player clipping through terrain.
- **Engine Mitigations**:
  - `FrameBudgetSystem.clampDelta()` enforces an absolute `maxDeltaTime = 0.1s` (100ms ceiling).
  - `DeviceCompatibilitySystem` hooks `visibilitychange` to auto-pause the single-player simulation when focus is lost.
- **Status**: **RESOLVED / VERIFIED**.

#### 3. Battery Power Throttling on Ultrabooks
- **Environment**: Windows laptops on battery power with Intel/AMD integrated graphics entering OS battery saver.
- **Symptom**: GPU core clocks drop, increasing frame time by ~50% after unplugging AC adapter.
- **Engine Mitigations**:
  - `ThermalSafetySystem` queries Battery API and monitors sustained frame time variance over 35 seconds.
  - Automatically recommends switching to 30 FPS cap or `LOW` preset to maintain smooth pacing.
- **Status**: **RESOLVED / MITIGATED**.

#### 4. Ultrawide 21:9 Screen Distortion
- **Environment**: 2560×1080 / 3440×1440 ultrawide displays.
- **Symptom**: Standard 60° vertical FOV produces horizontal stretching and distorted edge perspective.
- **Engine Mitigations**:
  - `DeviceCompatibilitySystem` calculates aspect ratio $> 2.1$ and automatically adjusts Three.js vertical FOV to 55° with horizon compensation.
- **Status**: **RESOLVED / VERIFIED**.

#### 5. Software WebGL Fallback (SwiftShader / Mesa LLVMpipe)
- **Environment**: Virtual machines or older machines without hardware acceleration flags enabled.
- **Symptom**: WebGL renderer is purely CPU-emulated, yielding sub-15 FPS on normal presets.
- **Engine Mitigations**:
  - Detected via `HardwareProfiles` matching `llvmpipe` or `swiftshader`.
  - Automatically defaults to `VERY_LOW` profile with 0.60 render scale and disabled shadows.
  - `CompatibilityWarningUI` provides actionable guidance to enable hardware acceleration.
- **Status**: **RESOLVED / AUTOMATICALLY HANDLED**.
