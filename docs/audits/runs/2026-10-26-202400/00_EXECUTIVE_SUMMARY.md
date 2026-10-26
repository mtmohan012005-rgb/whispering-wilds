# The Whispering Wilds (காட்டு வழி • தடம்) — Master Audit Executive Summary
**Audit Run Identifier:** `2026-10-26-202400`
**Execution Timestamp:** 2026-10-26 20:24 IST
**Host Hardware:** Windows 11 Home 64-bit, Intel Core i3-N305 (8 Cores / 8 Threads @ 1.80GHz - 3.80GHz), 8054 MB RAM, Intel UHD Graphics (Direct3D 11)
**Unity Version:** 6000.6.3f1 (HDRP 17.7.0)
**Remote Main SHA Verified:** `cfca83a8ba7b8431b64b48a7d74e14a6209b1454` (PR #27 merged)
**Local Working Base SHA:** `ad181d4a32b562538710dc2f77874ee554718803` (fast-forward ancestor of PR #27)

---

## 1. Verified Truth & Key Findings
1. **GitHub Remote Baseline:**
   - Remote `origin/main` verified at `cfca83a8ba7b8431b64b48a7d74e14a6209b1454`.
   - PR #27 (`fix/temple-realism-audio-ci-20261026`) merged cleanly.
   - Latest GitHub Actions runs on main passed: Unity Validation (Run ID 40340247554, 6s) and Backend CI (Run ID 40340246247, 54s).
   - Linux CI runner accurately acknowledges that Unity Editor compilation, PlayMode tests, and NavMesh baking are blocked in CI due to lack of a licensed Unity Editor on Ubuntu.
2. **Local Machine & Engine Verification:**
   - Unity 6000.6.3f1 installed and licensed on host Windows machine.
   - In-engine automated tests executed directly on machine:
     - **EditMode Tests:** 94 / 94 Passed (0 failed, 0 skipped).
     - **PlayMode Tests:** 34 / 34 Passed (0 failed, 0 skipped).
     - **Editor Character Rig Audit:** 10 / 10 Characters Passed (Player + 9 NPCs).
     - **Asset Reference Audit:** 13 build scenes, 10 prefabs, 293 materials audited: 0 missing scripts, 0 null materials, 0 error shaders.
     - **Visual Capture Pipeline:** 19 native 1080p rendered screenshots captured (9 campaign scenes + 10 characters).
3. **Repository & Backend Suite:**
   - All 11 repository test suites passed (Backend Security, Cloud Save Regression, Game Verification, Candidate Launcher Provenance & Safety with 85 checks, Map GIS Data, Room Lifecycle).
4. **Performance Telemetry:**
   - Standalone executable benchmarked for 65.9 continuous seconds.
   - Active display cap: 30 FPS (`DisplaySettingsManager`).
   - Memory footprint: 601.7 MB average working set (Peak 1168.5 MB), 1335.5 MB private bytes.
   - 30 FPS under Low/Medium preset confirmed as the realistic, stable target for an Intel Core i3-N305 integrated GPU.
5. **Asset Reconciliation:**
   - Curated Manifest (`assets/manifest.json`): 36 / 36 entries verified on disk.
   - Codebase Scan: 39 unrecorded audio cues marked BLOCKED pending field capture; 4 hero textures verified embedded directly in `player.glb` as 7 native glTF PBR materials; 100 legacy browser-game assets marked RETIRED.

---

## 2. Top Gaps & Unverified Areas
- **Authentic Audio Acquisition:** 30 regional Tamil Nadu audio cues (Nadaswaram music, Western Ghats bioacoustics, village beds) remain unrecorded field assets; Unity currently uses verified development placeholder tones.
- **Live Cloud Firestore:** 2 live Firestore integration tests remain skipped (HTTP 503) due to absent `GOOGLE_APPLICATION_CREDENTIALS`.
- **Human Playthrough:** Campaign narrative walkthrough remains to be verified by a human player across all 6 regional acts.
