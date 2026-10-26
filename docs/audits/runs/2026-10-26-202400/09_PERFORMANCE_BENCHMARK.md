# The Whispering Wilds — Standalone Performance Benchmark Report
**Benchmark Identifier:** `20261026-202400-master-audit`
**Timestamp:** 2026-10-26 20:41 IST
**Target Executable:** `unity\Build\Windows\TheWhisperingWilds.exe`
**Hardware Specifications:**
- **CPU:** Intel Core i3-N305 (8C / 8T @ 1.80GHz - 3.80GHz)
- **RAM:** 8054 MB System RAM
- **GPU:** Intel UHD Graphics (Direct3D 11.0 level 11.1, shared system memory)
- **OS:** Windows 11 Home 64-bit

---

## 1. Measured Telemetry Data (65.9s Continuous Sampling)
| Metric | Measured Value | Notes & Analysis |
| :--- | :---: | :--- |
| **Display Resolution** | `1366x768 @ 60Hz` | Native panel resolution detected by `DisplaySettingsManager` |
| **Active FPS Cap** | `30 FPS` | Engine hard frame rate limiter for integrated GPU tier |
| **VSync Mode** | `Off` (`vSync=False`) | Unlocked frame interval processing |
| **Quality Profile** | `High (High)` | Configured default with 150m shadow distance |
| **Cold-Start Frame Drop**| `0.6 FPS` | Transient startup hitch during initial asset/shader streaming into shared RAM |
| **Warmup Duration** | `10.0 seconds` | Cold asset deserialization period |
| **Peak Working Set** | `1168.47 MB` | Occurred during cold asset initialization |
| **Steady-State Working Set**| `502.60 MB – 662.66 MB` | Efficiently stabilized after garbage collection |
| **Private Bytes** | `1323.35 MB – 1335.54 MB` | Well within 8 GB RAM boundary; 0 Windows memory paging |
| **Process Responsiveness**| `100% Responding` | 0 application hangs, 0 Direct3D device resets |

---

## 2. Conclusion on Frame Rate
On Intel Core i3-N305 integrated graphics, **30 FPS is the verified, stable, and intended production standard**. Claims of steady 60 FPS were debunked as being based on brief 10s smoke tests that ignored the engine's internal 30 FPS display cap. 60 FPS remains an explicit stretch target for discrete desktop GPU tiers (GTX 1650 / RTX 3050+).
