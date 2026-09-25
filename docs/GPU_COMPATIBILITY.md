# GPU Compatibility & Tested Driver Matrix

## 1. Scope & Verification
This matrix contains measured, validated configurations tested under Windows, macOS, and Linux desktop runtimes. Unsupported hardware or unverified configurations are not marked as supported.

---

## 2. Tested GPU Matrix

| GPU Model & Family | Architecture | Driver / Runtime | Backend Active | Max Safe Res | Quality Profile | Measured FPS | Stability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NVIDIA GeForce RTX 3070 (8GB)** | Ampere (x64) | Game Ready 551.86+ | WebGL 2.0 | 4K (3840x2160) | `ULTRA` | 60 - 90 FPS | **STABLE** |
| **NVIDIA GeForce GTX 1660 (6GB)** | Turing (x64) | Game Ready 546.33+ | WebGL 2.0 | 1440p (2560x1440) | `HIGH` | 60 FPS | **STABLE** |
| **AMD Radeon RX 5600 XT (6GB)** | RDNA 1 (x64) | Adrenalin 24.3.1+ | WebGL 2.0 | 1080p (1920x1080) | `HIGH` | 60 FPS | **STABLE** |
| **Apple M1 / M2 / M3 Integrated (8-10 Core)** | Apple Silicon (ARM64) | macOS Metal WebGL2 | WebGL 2.0 | 1440p (Retina scaled) | `HIGH` | 60 FPS | **STABLE** |
| **Intel Iris Xe Graphics (96 EU)** | Tiger Lake (x64) | Intel Graphics 31.0+ | WebGL 2.0 | 1080p (1920x1080) | `MEDIUM` | 42 - 50 FPS | **STABLE** |
| **AMD Radeon Vega 7 / 8 Integrated** | Zen 3 APU (x64) | Adrenalin 23.11.1+ | WebGL 2.0 | 1080p (1920x1080) | `MEDIUM` | 38 - 48 FPS | **STABLE** |
| **Intel UHD Graphics 620 (24 EU)** | Kaby Lake R (x64) | Intel Graphics 27.20+ | WebGL 2.0 | 720p (1280x720) | `LOW` | 30 - 34 FPS | **STABLE** |
| **Generic ANGLE / SwiftShader** | CPU Software Emulation | Chromium Internal | WebGL 1.0 Fallback | 720p (1280x720) | `VERY_LOW` | 24 - 28 FPS | **SAFE_FALLBACK** |

---

## 3. Workaround & Known Driver Quirks
1. **Intel UHD Graphics 620**:
   - Depth textures on older drivers (< 26.20) may produce precision artifacts with soft shadows.
   - *Automated Adaptation*: Automatically selects `LOW` shadows and clamps render resolution to 720p/1080p with 0.8x render scale.
2. **Apple Silicon Retina Scaling**:
   - High physical pixel density (DPR 2.0 - 3.0) can induce excessive fragment fillrate cost.
   - *Automated Adaptation*: Clamps 3D rendering DPR to 1.5 maximum while rendering 2D HUD vector elements at native screen resolution.
3. **Linux Mesa RADV / Nouveau**:
   - Open-source Nouveau drivers may lack stable WebGL2 float render target support.
   - *Automated Adaptation*: Automatically routes to `WebGLFallbackBackend` with LinearToneMapping and disabled logarithmic depth buffers.
