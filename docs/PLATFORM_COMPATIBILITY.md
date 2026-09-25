# The Whispering Wilds - Platform & Hardware Compatibility Matrix

## Tested Hardware & Operating System Matrix

> [!NOTE]
> Supported configurations are strictly those listed in this verified test matrix. We do not claim universal support for untested configurations.

| OS | Architecture | Minimum Tested Configuration | GPU Class | Graphics API | Display & Modes | Install Format | Status | Known Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Windows 11** (23H2) | x64 | Intel Core i5-10400 / 16GB RAM | Dedicated (NVIDIA RTX 3060) | D3D11 / Vulkan | 1080p, 1440p, 4K, 21:9 (Windowed, Borderless, Fullscreen) | NSIS Installer / Portable | **VERIFIED** | None |
| **Windows 10** (22H2) | x64 | Intel Core i3-8100 / 8GB RAM | Integrated (Intel UHD 630) | D3D11 | 720p, 900p, 1080p (Windowed, Borderless) | NSIS Installer | **VERIFIED** | Shadows reduced to LOW on UHD 630 |
| **macOS 14** (Sonoma) | Apple Silicon (arm64) | Apple M1 / 8GB Unified RAM | Integrated (Apple 7-Core GPU) | Metal (ANGLE) | Retina Display, 1080p, 1440p (Windowed, Fullscreen) | DMG / App Bundle | **VERIFIED** | DPR capped at 1.5x for thermal pacing |
| **macOS 13** (Ventura) | Intel (x64) | Intel Core i7 9th Gen / 16GB RAM | Dedicated (AMD Radeon Pro 5500M) | Metal (ANGLE) | Retina Display, 1080p (Windowed, Fullscreen) | DMG / App Bundle | **VERIFIED** | Fans ramp on Ultra; recommended preset is HIGH |
| **Ubuntu 22.04 LTS** | x86_64 | AMD Ryzen 5 3600 / 16GB RAM | Dedicated (AMD Radeon RX 6600) | Vulkan (RADV) | 1080p, 1440p (Windowed, Borderless, Fullscreen) | AppImage / .deb | **VERIFIED** | PulseAudio / PipeWire verified |
| **Ubuntu 24.04 LTS** | x86_64 | Intel Core i5-1135G7 / 8GB RAM | Integrated (Intel Iris Xe) | OpenGL ES / Vulkan (ANV) | 1080p (Windowed, Fullscreen) | AppImage | **VERIFIED** | Wayland native requires Ozone platform flag |

---

## Measured Performance Presets

| Preset | Target Hardware Tier | Resolution | Target FPS | Measured FPS Range | Render Scale | Shadow Quality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VERY_LOW** | Office Laptop / Intel HD 620 / 4GB RAM | 720p / 768p | 30 FPS | 30 - 38 FPS | 0.75x | OFF / Minimal |
| **LOW** | Mid-Range Laptop / Vega 7 / 8GB RAM | 900p / 1080p | 30 - 45 FPS | 36 - 48 FPS | 0.85x | LOW (Soft baked) |
| **MEDIUM** | Gaming Laptop / GTX 1650 / 8-16GB RAM | 1080p | 60 FPS | 58 - 62 FPS | 1.0x | MEDIUM |
| **HIGH** | Gaming Desktop / RTX 3060 / 16GB RAM | 1080p / 1440p | 60 - 90 FPS | 75 - 90 FPS | 1.0x | HIGH (Cascaded) |
| **ULTRA** | Enthusiast PC / RTX 4080 / 32GB RAM | 1440p / 4K | 120+ FPS | 115 - 144 FPS | 1.0x | ULTRA (Full PBR + SSAO) |
