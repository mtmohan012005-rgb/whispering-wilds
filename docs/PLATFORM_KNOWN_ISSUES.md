# The Whispering Wilds - Platform Known Issues & Troubleshooting

| OS | Subsystem | Issue Summary | Severity | Workaround / Recovery | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Linux (Wayland)** | Windowing | Fractional scaling may occasionally cause cursor flicker | Low | Switch window mode to BORDERLESS or launch with `--ozone-platform=x11` | Documented |
| **Windows** | Graphics | Extremely outdated Intel HD graphics drivers (< 2018) fail WebGL2 init | Medium | Launch app with Safe Graphics Mode; update Intel DCH drivers | Handled automatically |
| **macOS** | Display | 4K Retina defaults to high DPR causing increased GPU thermal load | Low | Renderer automatically caps DPR to 1.5x on integrated Apple GPUs | Handled automatically |
| **Linux** | Audio | PipeWire daemon restart while game is running halts stream | Low | AudioManager detects device disconnect and re-binds default sink without crash | Handled automatically |
| **Windows** | Multi-monitor | Disconnecting secondary monitor while window resides there | Low | WindowManager detects missing display and re-centers on primary monitor | Handled automatically |
