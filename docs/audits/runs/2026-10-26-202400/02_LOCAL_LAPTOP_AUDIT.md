# The Whispering Wilds — Local Laptop Project Audit
**Workspace Root:** `C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds`
**Unity Project Root:** `C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds\unity`
**Installed Unity Version:** `6000.6.3f1 (45d8eee7de74)`
**License Status:** Valid Personal License (User: `mohan`, Entitlement ID verified)
**Local Branch:** `fix/temple-realism-audio-ci-20261026` (fast-forward tracking)

---

## 1. Engine & Test Execution Results
- **Unity EditMode Suite:** 94 / 94 Passed (1.05s).
- **Unity PlayMode Suite:** 34 / 34 Passed (0.54s).
- **Editor Character Rig Audit:** 10 / 10 Characters Verified (SkinnedMesh, BoneBindings, Animator, Avatar, Controller, Colliders).
- **Unity Asset Reference Audit:** 13 build scenes, 10 character prefabs, 293 materials audited: 0 broken scripts, 0 null materials, 0 missing shaders.
- **Scene Visual Capture Pipeline:** 19 / 19 1080p captures completed.
- **Standalone Benchmark (Run 20261026-202400):**
  - Binary: `unity\Build\Windows\TheWhisperingWilds.exe`
  - Active Display Settings: `1366x768 @60Hz, fullscreen=True, vSync=False, cap=30, uiScale=Medium`
  - Memory: 601.66 MB average working set (Peak 1168.47 MB during cold start).
  - Telemetry: 1 initial cold-start shader compilation spike (0.6 FPS) before stabilizing at 30 FPS.
