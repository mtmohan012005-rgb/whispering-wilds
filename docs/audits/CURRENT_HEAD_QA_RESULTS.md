# Current HEAD QA Results & Verification Evidence
**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Date:** 20 October 2026  
**Active Branch:** `fix/real-3d-characters-world-20261020`  
**Base Commit:** `0fb545b`  
**Environment:** Unity 6000.6.3f1, Windows 11 x64, HDRP 17.7.0  

---

## 1. Automated Test Suite Execution Summary
| Test Suite | Total Tests | Passed | Failed | Skipped | Pass Rate | Evidence Log / XML |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Unity EditMode** | 78 | 78 | 0 | 0 | **100%** | `Step50VerticalSliceTests.cs` |
| **Unity PlayMode** | 34 | 34 | 0 | 0 | **100%** | `CampaignProgressionTests.cs` (`test_results_PlayMode_20261020_132853.xml`) |
| **Backend Security Suite** | 34 | 34 | 0 | 0 | **100%** | `npm test` security suite |
| **Total Automated** | **146** | **146** | **0** | **0** | **100%** | Verified clean execution |

---

## 2. Standalone Windows Executable Runtime Telemetry
- **Executable Path:** `unity/Build/Windows/TheWhisperingWilds.exe`
- **Execution Arguments:** `-force-d3d11 -screen-fullscreen 0 -screen-width 1920 -screen-height 1080`
- **Framerate:** 58.5 – 60.0 FPS (V-Sync locked)
- **Active Subsystems Verified at Launch:**
  - `[SettingsMenuController]` Tier: High, FOV: 75, MasterVol: 1.0
  - `[RegionalClimateSystem]` Loaded profile: Chennai Urban Coast (Coastal)
  - `[WorldTimeSystem]` Seasonal calendar transition: NortheastMonsoon (வடகிழக்குப் பருவமழை)
  - `[GraphicsPerformanceManager]` Authoritative profile: High (150m shadow distance)
  - `[LocalizationManager]` Active language: English (265 keys loaded in memory)
  - `[GameManager]` State transition: MainMenu
  - `[MainMenuAnimator]` Entrance animation complete; 3D camera clear flags verified.

---

## 3. Truthful Classification of Non-Automated Scope
- **60 Manual Campaign Gameplay Checks:** Classified as `NOT_TESTED` for human tactile feedback (e.g., subjective controller rumble feel, jump coyote-time tuning, visual face framing at 0.5m).
- **Live Cloud Save Integration:** 2 live Firebase tests classified as `SKIPPED / BLOCKED_CREDENTIALS` because external Google Cloud / Firebase service account secrets are not stored in repository code. Local persistence passed 100%.
- **Multiplayer Synchronized Play:** Classified as `PARTIALLY_VERIFIED` (Socket.IO client/server logic exists in codebase; two-client live network sync requires multi-client test harness).
