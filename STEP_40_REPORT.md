# STEP 40 — Cinematic Introduction & Main Menu Overhaul Report

## Executive Summary

**Status: SOURCE READY — RUNTIME NOT VERIFIED**

Implemented a cinematic introduction sequence and redesigned the main menu for The Whispering Wilds. The Codex button has been completely removed from the main menu as requested. All source code changes are complete; runtime verification requires Unity 6 Editor.

## Changes Made

### 1. CinematicIntroController.cs (NEW, 399 lines)
**Path:** `unity/Assets/_Project/Scripts/UI/CinematicIntroController.cs`

A 25-second atmospheric opening sequence with:
- **Phase 1 (0-5s):** Fade in from black with atmospheric background
- **Phase 2 (3-8s):** "Press Any Key to Skip" prompt appears
- **Phase 3 (5-15s):** Camera smoothly moves toward a mysterious trail
- **Phase 4 (14-18s):** Title "THE WHISPERING WILDS" fades in with Tamil subtitle
- **Phase 5 (21-25s):** Fade transition to main menu

Features:
- Skip via any keyboard/mouse input
- PlayerPrefs persistence (`WW_IntroPlayed`) — doesn't replay on return from settings
- Replay capability via `ReplayIntro()` method
- Bilingual title/subtitle via LocalizationManager
- Atmospheric fog and dawn lighting
- Smooth camera interpolation with smoothstep easing

### 2. TitleMenuController.cs (MODIFIED)
**Path:** `unity/Assets/_Project/Scripts/UI/TitleMenuController.cs`

**Removed:**
- `codexButton` field
- `codexPanel` field
- `closeCodexButton` field
- `OnOpenCodexClicked()` method
- `OnCloseCodexClicked()` method
- Codex button onClick listener
- Codex panel visibility management
- `SetButtonLabel(codexButton, "menu.codex")` call

**Added:**
- `cinematicIntro` field (CinematicIntroController reference)
- Class-level documentation comment

**Preserved:**
- New Game, Continue, Settings, Quit buttons
- CampaignFlow integration
- Localization support
- SettingsMenuUI integration
- Language change handling

### 3. BuildBootScene.cs (MODIFIED)
**Path:** `unity/Assets/_Project/Scripts/Editor/BuildBootScene.cs`

**Removed:**
- `btnCodex` button creation (line 108)
- `codexButton` binding in SerializedObject (line 123)

**Result:** Menu now creates exactly 4 buttons: New Game, Continue, Settings, Quit

### 4. LocalizationManager.cs (MODIFIED)
**Path:** `unity/Assets/_Project/Scripts/Localization/LocalizationManager.cs`

**Removed:**
- `menu.codex` localization entry

**Added:**
- `intro.skip` — "Press Any Key to Skip" / "வெளியேறவென எந்த விசையையும் அழுததவும்"
- `intro.replay` — "Replay Intro" / "மீண்டும் காட்டு"

### 5. Step40MainMenuTests.cs (NEW, 350 lines, 24 tests)
**Path:** `unity/Assets/_Project/Tests/Editor/Step40MainMenuTests.cs`

| Test Category | Count | Description |
|---|---|---|
| Codex Removal | 4 | Verifies no codexButton, codexPanel, OnOpenCodexClicked, OnCloseCodexClicked |
| Menu Buttons | 4 | Verifies newGameButton, continueButton, settingsButton, quitButton exist |
| Cinematic Intro | 4 | Verifies CinematicIntroController exists, has SkipIntro, ReplayIntro, IntroPlayed, IsPlaying |
| Localization | 8 | Verifies intro.skip, intro.replay keys exist; menu.codex removed; menu keys present |
| Menu Methods | 4 | Verifies OnNewGameClicked, OnContinueClicked, OnSettingsClicked, OnQuitClicked exist |

## Verification

### Code-Level Checks
- ✓ Codex button completely removed from TitleMenuController
- ✓ Codex button creation removed from BuildBootScene
- ✓ menu.codex localization key removed
- ✓ CinematicIntroController implements skip, replay, and persistence
- ✓ All 4 menu buttons (New Game, Continue, Settings, Quit) preserved
- ✓ Localization keys for intro added with Tamil translations
- ✓ 24 editor tests created

### Runtime Verification
- **NOT_RUNTIME_VERIFIED:** Unity 6 editor not available
- Cannot build boot scene, compile, or test in standalone player

## Menu Button Order

The main menu displays buttons in this order:
1. **New Game** — Starts the campaign via CampaignFlow
2. **Continue** — Loads saved game (enabled only when valid save exists)
3. **Settings** — Opens SettingsMenuUI (Language, Display, Quality, Audio, Controls, Accessibility)
4. **Quit** — Exits the application

**No Codex button is present.**

## Cinematic Intro Behavior

1. **First launch:** Plays the full 25-second cinematic intro
2. **Skip:** Press any key at any time to skip directly to main menu
3. **Subsequent launches:** Intro is skipped (PlayerPrefs `WW_IntroPlayed = 1`)
4. **Return from Settings:** Intro does NOT replay
5. **Replay:** Available via `CinematicIntroController.ReplayIntro()` method

## Localization

| Key | English | Tamil |
|---|---|---|
| `menu.new_game` | New Game | புதிய விளையாட்டு |
| `menu.continue` | Continue | தொடரவும் |
| `menu.settings` | Settings | அமைப்புகள் |
| `menu.quit` | Quit | வெளியேறு |
| `menu.title` | THE WHISPERING WILDS | காட்டு வழி • தடம் |
| `menu.subtitle` | A Living Exploration & Cultural Investigation of Tamil Nadu | தமிழ்நாட்டின் வாழ்வியல் ஆய்வும் கலாச்சார கண்டறியும் பயணம் |
| `intro.skip` | Press Any Key to Skip | வெளியேறவென எந்த விசையையும் அழுத்தவும் |
| `intro.replay` | Replay Intro | மீண்டும் காட்டு |

## Known Limitations

1. **Visual quality:** The cinematic intro's visual quality depends on the environment assets available in the Unity project. Without high-quality Tamil Nadu landscape assets, the background will use the existing procedural environments.
2. **No audio integration yet:** The CinematicIntroController is structured for audio but doesn't yet connect to AudioManager for ambient soundscape. This can be added when audio assets are available.
3. **No actual landscape scene:** The intro uses camera movement and fog effects but doesn't have a dedicated cinematic environment scene. For full visual impact, a dedicated intro scene with a Tamil Nadu dawn landscape would be needed.

## Build Status

**SOURCE READY — RUNTIME NOT VERIFIED**

All source code changes are complete. The following Unity Editor steps are required to complete integration:

1. Open project in Unity 6000.6.3f1
2. Run `Tools/Whispering Wilds/Build Boot Scene` to regenerate `00_Boot.unity`
3. Run Editor tests to verify Step40MainMenuTests (24 tests)
4. Build Windows x64 player
5. Launch and verify:
   - Cinematic intro plays on first launch
   - Skip works via any key press
   - Main menu shows 4 buttons (no Codex)
   - New Game, Continue, Settings, Quit all work
   - English and Tamil modes display correct text
   - Intro doesn't replay when returning from Settings

## Files Changed

| File | Action | Lines |
|---|---|---|
| `CinematicIntroController.cs` | NEW | 399 |
| `TitleMenuController.cs` | MODIFIED | -13 (Codex removal) |
| `BuildBootScene.cs` | MODIFIED | -2 (Codex button) |
| `LocalizationManager.cs` | MODIFIED | +3, -1 |
| `Step40MainMenuTests.cs` | NEW | 350 |
| `QA_RUN_SUMMARY.json` | UPDATED | — |
| `STEP_40_REPORT.md` | NEW | — |

## Release Verdict

**RELEASE_BLOCKED** — Runtime verification requires Unity 6 Editor. Source code is complete and ready for integration.
