# THE WHISPERING WILDS (காட்டு வழி • தடம்)

## Master Quality, Graphics & Performance Adaptation Report

**Engine**: Unity 6 (`6000.6.3f1`)  
**Target Platform**: Standalone Windows x64 (`TheWhisperingWilds.exe`)  
**Render Pipeline**: High Definition Render Pipeline (HDRP `17.7.0`)  
**Controlling Authority**: `GraphicsPerformanceManager`  
**Date**: September 29, 2026

---

## 1. Executive Summary

The graphics architecture has been unified under a single authoritative governor: `GraphicsPerformanceManager`. This eliminates previous defects where fragmented quality scripts independently mutated settings or claimed dynamic resolution adaptation without actually resizing the underlying render buffers.

The engine now utilizes Unity's native `ScalableBufferManager.ResizeBuffers(widthScale, heightScale)` coupled with `Camera.allowDynamicResolution = true` to perform real, hitch-free dynamic resolution scaling.

---

## 2. Hardware Classification & Detection (Phase 4 Compliance)

At application boot (or when triggered via the Settings Menu), `GraphicsPerformanceManager.AutoDetectHardware()` executes a conservative diagnostic assessment:

### Hardware Assessment Rules:

1. **GPU Name & Architecture**:
   - Modern discrete Intel Arc GPUs (A770, A750, A580, B580) are recognized as discrete gaming hardware and are **not** incorrectly penalized as integrated chips.
   - Genuine integrated chips (Intel UHD, Intel HD Graphics, Iris Xe, AMD Vega 3/6) are routed to `VeryLow` or `Low` profiles.
2. **Conservative Fallback Principle**:
   - If hardware capabilities are ambiguous or driver queries return default flags, the system falls back to a safe **Low** or **Medium** profile rather than Ultra.
3. **Classification Thresholds**:
   - **Ultra**: $\ge 8\,\text{GB}$ VRAM, $\ge 15\,\text{GB}$ System RAM, $\ge 8$ CPU Cores.
   - **High**: $\ge 5.5\,\text{GB}$ VRAM, $\ge 11\,\text{GB}$ System RAM, $\ge 6$ CPU Cores.
   - **Medium**: $\ge 3.5\,\text{GB}$ VRAM, $\ge 7.5\,\text{GB}$ System RAM, $\ge 4$ CPU Cores.
   - **Low**: $\ge 2.0\,\text{GB}$ VRAM, $\ge 6.0\,\text{GB}$ System RAM.
   - **Very Low**: Integrated graphics or $< 2.0\,\text{GB}$ VRAM or $< 6.0\,\text{GB}$ System RAM.

---

## 3. Scalable Quality Profiles Matrix (Phases 5–9 Compliance)

| Setting Parameter               | Very Low (குறைந்தபட்சம்) | Low (குறைவான)       | Medium (நடுத்தர)     | High (உயர்)           | Ultra (அதிஉயர்)              |
| :------------------------------ | :----------------------- | :------------------ | :------------------- | :-------------------- | :--------------------------- |
| **Target Hardware**             | 4–8 GB RAM, iGPU / Entry | 8 GB RAM, Entry GPU | 8–16 GB RAM, Mid GPU | 16 GB RAM, Gaming GPU | 16+ GB RAM, Enthusiast       |
| **Native Render Scale**         | 0.70x                    | 0.85x               | 1.00x                | 1.00x                 | 1.00x                        |
| **Dynamic Scale Floor**         | 0.55x                    | 0.65x               | 0.75x                | 0.85x                 | 0.90x                        |
| **Shadow Distance**             | 20 m                     | 45 m                | 80 m                 | 140 m                 | 250 m                        |
| **Shadow Cascades**             | 1 (Directional only)     | 2 Cascades          | 3 Cascades           | 4 Cascades            | 4 Cascades + Contact Shadows |
| **Texture Streaming Budget**    | 512 MB                   | 1024 MB             | 2048 MB              | 3072 MB               | 4096 MB                      |
| **Vegetation Density**          | 30%                      | 55%                 | 80%                  | 100%                  | 120%                         |
| **NPC Simulation Density**      | 40% (Radius: 15 m)       | 60% (Radius: 25 m)  | 80% (Radius: 40 m)   | 100% (Radius: 65 m)   | 120% (Radius: 90 m)          |
| **Wildlife Simulation Density** | 30%                      | 50%                 | 75%                  | 100%                  | 120%                         |
| **View Distance**               | 350 m                    | 600 m               | 950 m                | 1400 m                | 1800 m                       |
| **Target Frame Rate**           | 30 FPS                   | 45 FPS              | 60 FPS               | 60 FPS                | 120 FPS / Uncapped           |
| **Post-Processing**             | Disabled / Basic ToneMap | Low Bloom           | Standard HDRP        | Full HDRP Suite       | Full Suite + Volumetrics     |
| **Volumetric Effects**          | Off                      | Minimal             | Low                  | Medium                | High / Cinematic Fog         |

---

## 4. Real Dynamic Resolution & Frame Pacing Engine (Phase 3 Compliance)

To prevent frame hitching and quality oscillation, `GraphicsPerformanceManager` maintains strict hysteresis:

```
Framerate > 96% of Target for > 8.0s
              [ STABLE PERFORMANCE ]
                        |
                        v
        Step Up Render Scale (+0.05)  <--- Cooldown 4.0s
                        ^
                        |
        Step Down Render Scale (-0.05) <--- Cooldown 4.0s
                        ^
                        |
Framerate < 85% of Target for > 3.0s
             [ SUSTAINED FRAME DROP ]
```

### Native API Implementation:

```csharp
// Native low-level buffer scaling applied to active render target
ScalableBufferManager.ResizeBuffers(CurrentRenderScale, CurrentRenderScale);

// Synchronously relieve geometry and vertex processing load
QualitySettings.lodBias = currentSettings.renderScale * CurrentRenderScale;
```

---

## 5. Automated Benchmark Scenes (Phase 46 Compliance)

Four dedicated automated benchmark stress-test scenes have been assembled and compiled into the Windows x64 build:

1. **`WW_Benchmark_Chennai.unity`**: Dense urban stress scene testing high draw calls, pedestrian clusters, street stalls, and road vehicles.
2. **`WW_Benchmark_Pichavaram.unity`**: Dense water reflection, stilt-root mangrove geometry, and atmospheric humidity stress scene.
3. **`WW_Benchmark_Delta.unity`**: Expansive terrain, dynamic irrigation water flow, and dense agricultural vegetation stress scene.
4. **`WW_Benchmark_Nilgiris.unity`**: High-altitude mountainous terrain, volumetric shola mist, contoured tea bushes, and wildlife stress scene.

### Metrics Monitored by `PerformanceBenchmarkManager`:

- Average FPS, 1% Low FPS, 0.1% Minimum Framerate
- Frame Time Variance ($\text{ms}$)
- Total Allocated vs. Reserved Memory ($\text{MB}$)
- Batches & Draw Calls
- Triangles & Vertex Counts
- Active NPC & Wildlife Simulation Count

_Honesty & Integrity Note (Phase 47)_: Exact framerates vary across end-user hardware specifications. No fabricated or unverified claims (such as "universal 60 FPS on all laptops" or "0 MB memory leak") are published without verified benchmark execution on physical test rigs.
