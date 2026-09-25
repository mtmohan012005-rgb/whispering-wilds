# Display Compatibility, Scaling & Aspect Ratio Architecture

## 1. Principles
- **Display Safe Limit**: The game never automatically renders 3D viewports at maximum native monitor resolution on 4K or Retina displays. Render scale is strictly mediated by `PerformanceManager` and clamped by `DisplayScalingManager` (maximum 3D DPR = 1.5).
- **HUD Crispness**: While 3D rendering uses clamped DPR, the 2D UI and HUD vector fonts are rendered at native monitor DPI for maximum readability.
- **Aspect Ratio Agility**: Natural camera framing across standard, widescreen, and ultrawide formats without stretching or distortion.

---

## 2. DPI & OS Scaling Matrix

| OS Environment | Scaling Factor | Internal 3D Render DPR | UI Behavior | Visual Result |
| :--- | :--- | :--- | :--- | :--- |
| **Windows Standard** | 100% (1.0x) | 1.0 | 1:1 layout scaling | Crisp standard interface |
| **Windows Scaling** | 125% (1.25x) | 1.25 | Relative rem/percent units | No overlapping text or clipped buttons |
| **Windows Scaling** | 150% (1.50x) | 1.50 (clamped max) | Proportional HUD scaling | Crisp interface, zero GPU fillrate penalty |
| **Windows Hi-DPI** | 200% (2.00x) | 1.50 (clamped max) | 2.0x vector UI scale | Ultra-sharp text, smooth 60 FPS 3D rendering |
| **macOS Retina** | 2.0x (Retina) | 1.50 (clamped max) | Native Cocoa window DPR | Sharp text, prevented 4K fillrate collapse |
| **Linux GNOME/KDE** | 100% / 200% | 1.0 - 1.5 | DPI-aware container padding | Readable UI across Wayland / X11 |

---

## 3. Aspect Ratio Standards & Camera Projection

### 16:9 Standard (1920x1080, 2560x1440, 3840x2160)
- Baseline target configuration.
- Vertical FOV: 60°.
- Full screen width utilized for HUD status bars and minimap.

### 16:10 Productivity (1920x1200, 2560x1600)
- Vertical field of view preserved at 60°.
- Additional vertical pixel space provided for UI clearance. Zero vertical stretching.

### 21:9 Ultrawide (2560x1080, 3440x1440)
- Camera vertical FOV slightly tuned (57°) to prevent extreme peripheral fish-eye distortion.
- **HUD Containment**: The status HUD and dialog boxes are centered within a virtual 16:9 safe boundary (max width 1920px), preventing critical vital bars from being pushed to the extreme physical edges of the player's vision.

### Unusual Aspect Ratios (e.g. 4:3, 5:4, Vertical Window Resizing)
- Automatically recalculates projection matrices on every window resize.
- FOV is dynamically clamped between 45° and 95° to guarantee visual stability.

---

## 4. Multi-Monitor Hot-Swap & Windowing
- Dynamic listeners on `resize` and `screen.onchange` recalculate viewport layout immediately.
- Moving the game between a 1080p monitor and a 4K monitor reconfigures DPR and projection without destroying or rebuilding `GameState`, `ThreeWorld`, or active scene meshes.
