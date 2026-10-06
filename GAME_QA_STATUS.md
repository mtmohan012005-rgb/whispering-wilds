# THE WHISPERING WILDS — GAME QA STATUS
**Step 24 status sheet — updated at end of the full-settings-integration + end-to-end QA session**
**Date:** October 2026 | **Branch:** `ai/unity-graphics-world-upgrade` | **Unity:** 6000.6.3f1

---

## Overall Verdict

| Area | Status | Evidence |
| :--- | :--- | :--- |
| Release-code compile (Windows x64 standalone, 8 scenes) | ✅ PASS | `PRODUCTION BUILD SUCCEEDED`, exit 0, 182 MB, `BUILD_REPORT.json` (Section 7 of `WINDOWS_GAMEPLAY_QA_REPORT.md`) |
| Full standalone smoke (19 baseline + settings integration) | ✅ PASS | `passed=20 failed=0 skip=0` (two independent runs) |
| Settings → live-system wiring | ✅ PASS | `settings_integration_applied` step; sensitivity/invertY, 6 audio buses, FOV, `WW_*` persistence, subtitle-consumer runtime probe, localized prompts |
| Localization (English/Tamil purity) | ✅ PASS | `LocalizationTests` (6) + smoke `tamil_ui_renders`/`english_ui_renders`/`language_persists` |
| EditMode automated tests | ✅ PASS | 105 / 105 tests (8.6 s), covering Step 24 + legacy suites |
| Save schema isolation (PlayerPrefs vs. `GameSaveData` v4) | ✅ PASS | `SaveSettingsCompatibilityTests` (3) + smoke save/load/restore steps |
| Release-blocking defects found this session | 1 fixed | `PlayerInputHandler` stale `InputActionType` enum refs (only in deleted `KeyBindings.cs`) — removed; rebuild green |

## Known Captures (non-blocking, pre-existing)

1. **Cascade Shadow atlasing** (error, ×2, non-repeating): only one directional light casts shadows when several—content/quality-config issue; pre-dates Step 24.
2. **World streaming cells** (warning): `chennai` and `pichavaram` regions have no authored streaming cells → streaming evaluation inactive (content gap, not a fail).
3. **Cloud save** (warning): no Firebase signed-in session on this box → local-only persistence; expected offline.
4. **NavMesh agent spawns** (warning, ×4): some NPC agents rejected at spawn distance; population still renders/live-counts correctly.
5. **NPC production assets** (ⓘ): smoke roster lists `kannan, resident_02, resident_05/06/07/08/09` as `MISSING_PRODUCTION_ASSET` — authored placeholder NPCs without shipping models this step.

## NOT_RUNTIME_VERIFIED (Step 24 exe session)

These require interactive UI automation not present in the standalone smoke and were **not** re-exercised on the shipped exe this session (editor-only/manual QA territory):
- Exclusive-fullscreen ↔ windowed switching (smoke runs windowed-fullscreen).
- 144 FPS cap and per-tier VSync behavior on the exe.
- Colorblind simulation shader modes (Protanopia / Deuteranopia / Tritanopia) on the exe.
- Five prior-benchmark headline metrics (FPS/CPU/RAM/VRAM/SFC) — legacy numbers preserved in `WINDOWS_GAMEPLAY_QA_REPORT.md` §5 and marked as not re-measured.

## Test Suite Inventory (EditMode, 105 PASS)

| Fixture | Tests | Status |
| :--- | ---: | :--- |
| SettingsIntegrationTests (new) | 5 | PASS |
| InputRebindTests (new) | 4 | PASS |
| SaveSettingsCompatibilityTests (new) | 3 | PASS |
| DisplaySettingsTests (new) | 5 | PASS |
| AudioSettingsTests (new) | 3 | PASS |
| LocalizationTests (new) | 6 | PASS |
| AccessibilityTests (new) | 4 | PASS |
| InputBindingIntegrationTests (Step 24 PDE) | 6 | PASS |
| SettingsPersistenceIntegrationTests (Step 24 PDE) | 6 | PASS |
| DisplaySettingsIntegrationTests (Step 24 PDE) | 2 | PASS |
| LocalizationCoverageTests (Step 24 PDE) | 3 | PASS |
| SaveSettingsCompatibilityTests (Step 24 PDE) | 3 | PASS |
| SettingsBehaviorTests (legacy) | 22 | PASS |
| PlayerControlsTests (legacy) | 8 | PASS |
| Step4ChennaiGameplayTests (legacy) | 20 | PASS |
| TamilFontCoverageTests (legacy) | 5 | PASS |

## Companion Reports
- `SETTINGS_INTEGRATION_QA_REPORT.md` — settings/controls/audio/display integration + Step 24 executable evidence.
- `LOCALIZATION_QA_REPORT.md` — bilingual purity audit + exe runtime verification.
- `WINDOWS_GAMEPLAY_QA_REPORT.md` — Windows x64 end-to-end compile/smoke evidence and prior benchmarks.

## Notes for the next step
- The release-blocking enum ref found only because the batch compile gate ran; keep `Unity.exe -batchmode` as the required pre-commit gate.
- The three QA `.md` reports and this status sheet are the Step 24 commit payload together with `unity/Assets/_Project/Tests/Editor/*.cs` and the smoke/settings source changes.