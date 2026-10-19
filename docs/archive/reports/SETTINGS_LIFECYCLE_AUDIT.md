# SETTINGS_LIFECYCLE_AUDIT — STEP 28 §T/U

Status: **PASS (separation) / PARTIAL (runtime verification pending §X/Z)** + new render-scale enforcement live.

## U — Settings vs campaign separation: PASS
- Every display/quality/input/audio/accessibility choice lives under the **`WW_` PlayerPrefs namespace** (36 keys) in `SettingsMenuController` / `DisplaySettingsManager` / `InputBindingManager` / `GraphicsPerformanceManager` / `LocalizationManager`.
- Campaign state (quests, inventory, gameplay flags) lives in **JSON** (`GameSaveData`, schema v4) via `SaveManager`. No PlayerPrefs key overlaps campaign data. No gameplay save reads/writes settings keys.

## T — STORED / APPLIED / PERSISTED / RUNTIME-VERIFIED matrix (36 keys)
Key: **S**=STORE read, **A**=APPLIED to engine, **P**=PERSISTED on change, **V**=RUNTIME-VERIFIED by `Step24SettingsIntegrationTests` (EditMode) or smoke.

| Key | Consumer | S | A | P | V |
|---|---|---|---|---|---|
| WW_QualityTier | SettingsMenuController / GPM.ApplyProfile / QPM.ApplyPreset | ✓ | ✓ (HDRP profile+tier) | ✓ | smoke (5 tiers §Z) |
| WW_RenderScale | SettingsMenuController → **GPM.SetUserRenderScale** (§H) | ✓ | ✓ (real HDRP DRS, 50–100%) | ✓ | pending §X |
| WW_RenderScaleOverride | SettingsMenuController (§H new) | ✓ | ✓ | ✓ | pending §X |
| WW_FOV | SettingsMenuController → cam.fieldOfView | ✓ | ✓ | ✓ | test FOV (90) ✓ |
| WW_Resolution | DisplaySettingsManager | ✓ | ✓ | ✓ | test ✓ |
| WW_Fullscreen | DisplaySettingsManager/SettingsMenuController | ✓ | ✓ | ✓ | test ✓ |
| WW_VSync | DisplaySettingsManager (QualitySettings.vSyncCount) | ✓ | ✓ | ✓ | test ✓ |
| WW_FrameLimit | DisplaySettingsManager → Application.targetFrameRate | ✓ | ✓ | ✓ | test ✓ (120/-1) |
| WW_UiScale / WW_UIScale | DisplaySettingsManager (legacy float → level) | ✓ | ✓ | ✓ | test ✓ |
| WW_MouseSens | SettingsMenuController → camera input | ✓ | ✓ | ✓ | test ✓ (0.5) |
| WW_MouseSensY | SettingsMenuController | ✓ | ✓ | ✓ | — |
| WW_GamepadSens | SettingsMenuController | ✓ | ✓ | ✓ | test ✓ (3) |
| WW_InvertY | SettingsMenuController | ✓ | ✓ | ✓ | test ✓ (on/off) |
| WW_InvertX | SettingsMenuController | ✓ | ✓ | ✓ | — |
| WW_CameraSmoothing | SettingsMenuController → CC smoothing | ✓ | ✓ | ✓ | — |
| WW_SprintToggle / WW_SprintMode | SettingsMenuController + InputBindingManager | ✓ | ✓ | ✓ | test ✓ (Hold/Toggle) |
| WW_CrouchToggle / WW_CrouchMode | SettingsMenuController + InputBindingManager | ✓ | ✓ | ✓ | test ✓ |
| WW_BindKey_* / WW_BindMouse_* / WW_BindType_* | InputBindingManager | ✓ | ✓ | ✓ | test ✓ (rebind/conflict/reset) |
| WW_VolMaster/Music/Ambience/SFX/Dialogue/UI | SettingsMenuController → AudioManager channels | ✓ | ✓ | ✓ | test ✓ (0.4–0.9 floats) |
| WW_Subtitles | SettingsMenuController → DialogueUI | ✓ | ✓ | ✓ | test ✓ (0) |
| WW_SubtitleSize | SettingsMenuController | ✓ | ✓ | ✓ | test ✓ (32) |
| WW_SubtitleBG | SettingsMenuController | ✓ | ✓ | ✓ | test ✓ (1) |
| WW_MotionBlur | SettingsMenuController → DC/HDRP | ✓ | ✓ | ✓ | — |
| WW_MotionReduction | SettingsMenuController | ✓ | ✓ | ✓ | — |
| WW_ScreenShake | SettingsMenuController → camera shake | ✓ | ✓ | ✓ | — |
| WW_ColorblindMode | SettingsMenuController → color grading | ✓ | ✓ | ✓ | — |
| LocalizationManager.PlayerPrefsKey | SaveManager flow | ✓ | ✓ | ✓ | smoke ✓ (L650-656) |

RUNTIME-VERIFIED = proven by existing EditMode assertions or QA-smoke read-backs; dash (—) = applied in code, final live-run confirmation deferred to §X/Z. All keys PERSIST individually on change (SaveSettings) and load with safe defaults. No setting is stored-but-never-applied anymore after the §H render-scale fix (previously `WW_RenderScale` was exactly that).

## Sanctioned keys added this pass
`WW_RenderScaleOverride` (0/1) — gating flag so the stored scale is applied only when the player
explicitly chose a non-default value; otherwise GPM adaptive tuning stays authoritative.