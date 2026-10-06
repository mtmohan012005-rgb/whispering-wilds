using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using WhisperingWilds.Audio;
using WhisperingWilds.Display;
using WhisperingWilds.Localization;
using WhisperingWilds.Player;
using WhisperingWilds.Quality;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Comprehensive PC Settings UI covering Language, Display, Quality, Audio (6 channels),
    /// Controls (rebinding & sensitivity), and Accessibility (subtitles, shake, colorblind).
    /// </summary>
    [DisallowMultipleComponent]
    public class SettingsMenuUI : MonoBehaviour
    {
        [Header("Root")]
        [SerializeField] private GameObject panelRoot;

        [Header("Tabs")]
        [SerializeField] private Button languageTabButton;
        [SerializeField] private Button displayTabButton;
        [SerializeField] private Button qualityTabButton;
        [SerializeField] private Button audioTabButton;
        [SerializeField] private Button controlsTabButton;
        [SerializeField] private Button accessibilityTabButton;
        [SerializeField] private Button closeButton;

        [Header("Language Page")]
        [SerializeField] private GameObject languagePage;
        [SerializeField] private Text languageTitleText;
        [SerializeField] private Text englishOptionText;
        [SerializeField] private Text tamilOptionText;
        [SerializeField] private Image englishOptionBackground;
        [SerializeField] private Image tamilOptionBackground;

        [Header("Display Page")]
        [SerializeField] private GameObject displayPage;
        [SerializeField] private Text displayTitleText;
        [SerializeField] private Text uiScaleLabelText;
        [SerializeField] private Text uiScaleValueText;
        [SerializeField] private Button uiScaleLeftButton;
        [SerializeField] private Button uiScaleRightButton;
        [SerializeField] private Text fullscreenLabelText;
        [SerializeField] private Text fullscreenValueText;
        [SerializeField] private Button fullscreenToggleButton;
        [SerializeField] private Text resolutionLabelText;
        [SerializeField] private Text resolutionValueText;
        [SerializeField] private Button resolutionLeftButton;
        [SerializeField] private Button resolutionRightButton;
        [SerializeField] private Text vsyncLabelText;
        [SerializeField] private Text vsyncValueText;
        [SerializeField] private Button vsyncToggleButton;
        [SerializeField] private Text frameLimitLabelText;
        [SerializeField] private Text frameLimitValueText;
        [SerializeField] private Button frameLimitLeftButton;
        [SerializeField] private Button frameLimitRightButton;
        [SerializeField] private Text unavailableText;

        [Header("Quality Page")]
        [SerializeField] private GameObject qualityPage;
        [SerializeField] private Text qualityTitleText;
        [SerializeField] private Text qualityValueText;
        [SerializeField] private Button qualityLeftButton;
        [SerializeField] private Button qualityRightButton;
        [SerializeField] private Text qualityHintText;

        [Header("Audio Page")]
        [SerializeField] private GameObject audioPage;
        [SerializeField] private Text audioTitleText;
        [SerializeField] private Text masterVolValueText;
        [SerializeField] private Text musicVolValueText;
        [SerializeField] private Text sfxVolValueText;
        [SerializeField] private Text ambienceVolValueText;
        [SerializeField] private Text dialogueVolValueText;
        [SerializeField] private Text uiVolValueText;

        [Header("Controls Page")]
        [SerializeField] private GameObject controlsPage;
        [SerializeField] private Text controlsTitleText;
        [SerializeField] private Text mouseSensValueText;
        [SerializeField] private Text invertYValueText;
        [SerializeField] private Text invertXValueText;
        [SerializeField] private Text cameraSmoothingValueText;
        [SerializeField] private Text sprintModeValueText;
        [SerializeField] private Text crouchModeValueText;

        [Header("Accessibility Page")]
        [SerializeField] private GameObject accessibilityPage;
        [SerializeField] private Text accessibilityTitleText;
        [SerializeField] private Text subtitlesValueText;
        [SerializeField] private Text subtitleBgValueText;
        [SerializeField] private Text subtitleSizeValueText;
        [SerializeField] private Text screenShakeValueText;
        [SerializeField] private Text motionBlurValueText;
        [SerializeField] private Text colorblindValueText;

        public enum Page { Language, Display, Quality, Audio, Controls, Accessibility }

        private Page _page = Page.Language;
        private Color _englishColor = new Color(0.16f, 0.55f, 0.42f, 1f);
        private Color _tamilColor = new Color(0.16f, 0.55f, 0.42f, 1f);
        private Color _inactiveColor = new Color(0.14f, 0.16f, 0.20f, 1f);

        private bool _visible;
        public bool IsVisible => _visible;
        public Page CurrentPage => _page;

        public void SetVisible(bool visible)
        {
            _visible = visible;
            if (panelRoot != null) panelRoot.SetActive(visible);

            if (visible)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
                RefreshAll();
                ShowPage(_page);
                FocusFirstControl();
            }
            else
            {
                RestoreCursor();
            }
        }

        public void Toggle() => SetVisible(!_visible);

        private void OnEnable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += OnLanguageChanged;
            }
            if (DisplaySettingsManager.Instance != null)
            {
                DisplaySettingsManager.Instance.OnDisplaySettingsChanged += RefreshAll;
            }

            HookButtons();
            ApplyFontsToAllLabels();
            RefreshAll();
        }

        private void OnDisable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= OnLanguageChanged;
            }
            if (DisplaySettingsManager.Instance != null)
            {
                DisplaySettingsManager.Instance.OnDisplaySettingsChanged -= RefreshAll;
            }
        }

        private void OnLanguageChanged(Language language)
        {
            ApplyFontsToAllLabels();
            RefreshAll();
        }

        private void HookButtons()
        {
            if (languageTabButton != null) languageTabButton.onClick.AddListener(() => ShowPage(Page.Language));
            if (displayTabButton != null) displayTabButton.onClick.AddListener(() => ShowPage(Page.Display));
            if (qualityTabButton != null) qualityTabButton.onClick.AddListener(() => ShowPage(Page.Quality));
            if (audioTabButton != null) audioTabButton.onClick.AddListener(() => ShowPage(Page.Audio));
            if (controlsTabButton != null) controlsTabButton.onClick.AddListener(() => ShowPage(Page.Controls));
            if (accessibilityTabButton != null) accessibilityTabButton.onClick.AddListener(() => ShowPage(Page.Accessibility));
            if (closeButton != null) closeButton.onClick.AddListener(() => SetVisible(false));

            if (uiScaleLeftButton != null) uiScaleLeftButton.onClick.AddListener(() => CycleUiScale(-1));
            if (uiScaleRightButton != null) uiScaleRightButton.onClick.AddListener(() => CycleUiScale(1));
            if (fullscreenToggleButton != null) fullscreenToggleButton.onClick.AddListener(ToggleFullscreen);
            if (resolutionLeftButton != null) resolutionLeftButton.onClick.AddListener(() => CycleResolution(-1));
            if (resolutionRightButton != null) resolutionRightButton.onClick.AddListener(() => CycleResolution(1));
            if (vsyncToggleButton != null) vsyncToggleButton.onClick.AddListener(ToggleVSync);
            if (frameLimitLeftButton != null) frameLimitLeftButton.onClick.AddListener(() => CycleFrameLimit(-1));
            if (frameLimitRightButton != null) frameLimitRightButton.onClick.AddListener(() => CycleFrameLimit(1));
            if (qualityLeftButton != null) qualityLeftButton.onClick.AddListener(() => CycleQuality(-1));
            if (qualityRightButton != null) qualityRightButton.onClick.AddListener(() => CycleQuality(1));
        }

        public void ShowPage(Page page)
        {
            _page = page;
            if (languagePage != null) languagePage.SetActive(page == Page.Language);
            if (displayPage != null) displayPage.SetActive(page == Page.Display);
            if (qualityPage != null) qualityPage.SetActive(page == Page.Quality);
            if (audioPage != null) audioPage.SetActive(page == Page.Audio);
            if (controlsPage != null) controlsPage.SetActive(page == Page.Controls);
            if (accessibilityPage != null) accessibilityPage.SetActive(page == Page.Accessibility);
            RefreshAll();
        }

        private void FocusFirstControl()
        {
            if (EventSystem.current == null) return;
            Button first = languageTabButton != null ? languageTabButton
                        : displayTabButton != null ? displayTabButton
                        : qualityTabButton != null ? qualityTabButton
                        : closeButton;
            if (first != null) EventSystem.current.SetSelectedGameObject(first.gameObject);
        }

        private void RestoreCursor()
        {
            if (UnityEngine.SceneManagement.SceneManager.GetActiveScene().name.StartsWith("00_")) return;
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        // ---------- Language ----------

        public void SelectEnglish() => SetLanguage(Language.English);
        public void SelectTamil() => SetLanguage(Language.Tamil);

        private void SetLanguage(Language language)
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.SetLanguage(language);
            }
            RefreshAll();
        }

        // ---------- Display ----------

        private void CycleUiScale(int direction)
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;
            int next = Mathf.Clamp((int)mgr.UiScale + direction, 0, 2);
            mgr.SetUiScale((UiScaleLevel)next);
            RefreshAll();
        }

        private void ToggleFullscreen()
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;
            mgr.SetFullscreen(!mgr.IsFullscreen);
            RefreshAll();
        }

        private void ToggleVSync()
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;
            mgr.SetVSync(!mgr.VSyncEnabled);
            RefreshAll();
        }

        private void CycleResolution(int direction)
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;
            int index = mgr.SupportedModes.FindIndex(m =>
                m.width == mgr.CurrentMode.width && m.height == mgr.CurrentMode.height);
            if (index < 0) index = 0;
            else index = Mathf.Clamp(index + direction, 0, mgr.SupportedModes.Count - 1);
            mgr.ApplyMode(mgr.SupportedModes[index]);
            RefreshAll();
        }

        private static readonly int[] FrameLimitSteps = { 30, 60, 120, 144, 240, -1 };

        private void CycleFrameLimit(int direction)
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;
            int index = Array.IndexOf(FrameLimitSteps, mgr.FrameLimit);
            if (index < 0) index = 1;
            else index = (index + direction + FrameLimitSteps.Length) % FrameLimitSteps.Length;
            mgr.SetFrameLimit(FrameLimitSteps[index]);
            RefreshAll();
        }

        // ---------- Quality ----------

        private static readonly QualityTier[] SelectableTiers =
        {
            QualityTier.VeryLow,
            QualityTier.Low,
            QualityTier.Medium,
            QualityTier.High,
            QualityTier.Ultra
        };

        private void CycleQuality(int direction)
        {
            GraphicsPerformanceManager mgr = GraphicsPerformanceManager.Instance;
            if (mgr == null) return;
            int current = Array.IndexOf(SelectableTiers, mgr.CurrentTier);
            if (current < 0) current = 3; // High
            int next = (current + direction + SelectableTiers.Length) % SelectableTiers.Length;
            mgr.ApplyProfile(SelectableTiers[next]);
            RefreshAll();
        }

        // ---------- Audio Operations ----------

        public void AdjustMasterVolume(float delta)
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.masterVolume = Mathf.Clamp01(s.masterVolume + delta);
            s.SaveSettings();
            RefreshAll();
        }

        public void AdjustMusicVolume(float delta)
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.musicVolume = Mathf.Clamp01(s.musicVolume + delta);
            s.SaveSettings();
            RefreshAll();
        }

        public void AdjustSfxVolume(float delta)
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.sfxVolume = Mathf.Clamp01(s.sfxVolume + delta);
            s.SaveSettings();
            RefreshAll();
        }

        public void AdjustAmbienceVolume(float delta)
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.ambienceVolume = Mathf.Clamp01(s.ambienceVolume + delta);
            s.SaveSettings();
            RefreshAll();
        }

        public void AdjustDialogueVolume(float delta)
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.dialogueVolume = Mathf.Clamp01(s.dialogueVolume + delta);
            s.SaveSettings();
            RefreshAll();
        }

        public void AdjustUiVolume(float delta)
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.uiVolume = Mathf.Clamp01(s.uiVolume + delta);
            s.SaveSettings();
            RefreshAll();
        }

        // ---------- Controls Operations ----------

        public void AdjustMouseSensitivity(float delta)
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.mouseSensitivity = Mathf.Clamp(s.mouseSensitivity + delta, 0.2f, 5.0f);
            s.SaveSettings();
            RefreshAll();
        }

        public void ToggleInvertY()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.invertY = !s.invertY;
            s.SaveSettings();
            RefreshAll();
        }

        public void ToggleInvertX()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.invertX = !s.invertX;
            s.SaveSettings();
            RefreshAll();
        }

        public void ToggleSprintMode()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.sprintToggle = !s.sprintToggle;
            s.SaveSettings();
            RefreshAll();
        }

        public void ToggleCrouchMode()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.crouchToggle = !s.crouchToggle;
            s.SaveSettings();
            RefreshAll();
        }

        public void ResetControlsToDefault()
        {
            if (InputBindingManager.Instance != null)
            {
                InputBindingManager.Instance.ResetToDefaults();
            }
            var s = SettingsMenuController.Instance;
            if (s != null)
            {
                s.mouseSensitivity = 1.0f;
                s.mouseSensitivityY = 1.0f;
                s.invertY = false;
                s.invertX = false;
                s.sprintToggle = false;
                s.crouchToggle = false;
                s.SaveSettings();
            }
            RefreshAll();
        }

        // ---------- Accessibility Operations ----------

        public void ToggleSubtitles()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.subtitlesEnabled = !s.subtitlesEnabled;
            s.SaveSettings();
            RefreshAll();
        }

        public void ToggleSubtitleBg()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.subtitleBackground = !s.subtitleBackground;
            s.SaveSettings();
            RefreshAll();
        }

        public void CycleSubtitleSize()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.subtitleSize = s.subtitleSize switch
            {
                18 => 24,
                24 => 32,
                _ => 18
            };
            s.SaveSettings();
            RefreshAll();
        }

        public void ToggleScreenShake()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.screenShakeEnabled = !s.screenShakeEnabled;
            s.SaveSettings();
            RefreshAll();
        }

        public void ToggleMotionBlur()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            s.motionBlurEnabled = !s.motionBlurEnabled;
            s.SaveSettings();
            RefreshAll();
        }

        public void CycleColorblindMode()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;
            int next = ((int)s.colorblindMode + 1) % 4;
            s.colorblindMode = (ColorblindMode)next;
            s.SaveSettings();
            RefreshAll();
        }

        // ---------- Refresh ----------

        public void RefreshAll()
        {
            SetText(languageTitleText, "settings.language");
            SetText(englishOptionText, "settings.language.english");
            SetText(tamilOptionText, "settings.language.tamil");
            SetText(displayTitleText, "settings.display");
            SetText(uiScaleLabelText, "settings.ui_scale");
            SetText(fullscreenLabelText, "settings.fullscreen");
            SetText(resolutionLabelText, "settings.resolution");
            SetText(vsyncLabelText, "settings.vsync");
            SetText(frameLimitLabelText, "settings.frame_limit");
            SetText(unavailableText, "settings.unavailable");
            SetText(qualityTitleText, "settings.quality");
            SetText(qualityHintText, "settings.quality.high_hint");
            SetText(audioTitleText, "settings.audio");
            SetText(controlsTitleText, "settings.controls");
            SetText(accessibilityTitleText, "settings.accessibility");

            RefreshLanguageSelection();
            RefreshDisplayValues();
            RefreshQualityValue();
            RefreshAudioValues();
            RefreshControlsValues();
            RefreshAccessibilityValues();
        }

        private void RefreshLanguageSelection()
        {
            Language current = LocalizationManager.Instance != null
                ? LocalizationManager.Instance.CurrentLanguage
                : Language.English;

            if (englishOptionBackground != null)
                englishOptionBackground.color = current == Language.English ? _englishColor : _inactiveColor;
            if (tamilOptionBackground != null)
                tamilOptionBackground.color = current == Language.Tamil ? _tamilColor : _inactiveColor;
        }

        private void RefreshDisplayValues()
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;

            SetText(uiScaleValueText, UiScaleKey(mgr.UiScale));
            SetText(fullscreenValueText, mgr.IsFullscreen ? "settings.on" : "settings.off");
            SetText(vsyncValueText, mgr.VSyncEnabled ? "settings.on" : "settings.off");
            SetText(frameLimitValueText, mgr.FrameLimit < 0 ? "settings.unlimited" : mgr.FrameLimit.ToString());
            SetText(resolutionValueText, $"{mgr.CurrentMode.width} x {mgr.CurrentMode.height}");

            bool modesAvailable = mgr.SupportedModes.Count > 0;
            if (resolutionLeftButton != null) resolutionLeftButton.interactable = modesAvailable;
            if (resolutionRightButton != null) resolutionRightButton.interactable = modesAvailable;
        }

        private void RefreshQualityValue()
        {
            GraphicsPerformanceManager mgr = GraphicsPerformanceManager.Instance;
            QualityTier tier = mgr != null ? mgr.CurrentTier : QualityTier.High;
            SetText(qualityValueText, QualityKey(tier));
        }

        private void RefreshAudioValues()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;

            if (masterVolValueText != null) masterVolValueText.text = $"{Mathf.RoundToInt(s.masterVolume * 100)}%";
            if (musicVolValueText != null) musicVolValueText.text = $"{Mathf.RoundToInt(s.musicVolume * 100)}%";
            if (sfxVolValueText != null) sfxVolValueText.text = $"{Mathf.RoundToInt(s.sfxVolume * 100)}%";
            if (ambienceVolValueText != null) ambienceVolValueText.text = $"{Mathf.RoundToInt(s.ambienceVolume * 100)}%";
            if (dialogueVolValueText != null) dialogueVolValueText.text = $"{Mathf.RoundToInt(s.dialogueVolume * 100)}%";
            if (uiVolValueText != null) uiVolValueText.text = $"{Mathf.RoundToInt(s.uiVolume * 100)}%";
        }

        private void RefreshControlsValues()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;

            if (mouseSensValueText != null) mouseSensValueText.text = $"{s.mouseSensitivity:0.0}x";
            SetText(invertYValueText, s.invertY ? "settings.on" : "settings.off");
            SetText(invertXValueText, s.invertX ? "settings.on" : "settings.off");
            if (cameraSmoothingValueText != null) cameraSmoothingValueText.text = $"{s.cameraSmoothing:0}";
            SetText(sprintModeValueText, s.sprintToggle ? "settings.controls.toggle" : "settings.controls.hold");
            SetText(crouchModeValueText, s.crouchToggle ? "settings.controls.toggle" : "settings.controls.hold");
        }

        private void RefreshAccessibilityValues()
        {
            var s = SettingsMenuController.Instance;
            if (s == null) return;

            SetText(subtitlesValueText, s.subtitlesEnabled ? "settings.on" : "settings.off");
            SetText(subtitleBgValueText, s.subtitleBackground ? "settings.on" : "settings.off");
            if (subtitleSizeValueText != null) subtitleSizeValueText.text = s.subtitleSize.ToString();
            SetText(screenShakeValueText, s.screenShakeEnabled ? "settings.on" : "settings.off");
            SetText(motionBlurValueText, s.motionBlurEnabled ? "settings.on" : "settings.off");
            SetText(colorblindValueText, s.colorblindMode switch
            {
                ColorblindMode.Protanopia => "settings.accessibility.colorblind.protanopia",
                ColorblindMode.Deuteranopia => "settings.accessibility.colorblind.deuteranopia",
                ColorblindMode.Tritanopia => "settings.accessibility.colorblind.tritanopia",
                _ => "settings.accessibility.colorblind.none"
            });
        }

        private static string UiScaleKey(UiScaleLevel level) => level switch
        {
            UiScaleLevel.Small => "settings.ui_scale.small",
            UiScaleLevel.Large => "settings.ui_scale.large",
            _ => "settings.ui_scale.medium"
        };

        private static string QualityKey(QualityTier tier) => tier switch
        {
            QualityTier.VeryLow => "settings.quality.very_low",
            QualityTier.Low => "settings.quality.low",
            QualityTier.Medium => "settings.quality.medium",
            QualityTier.Ultra => "settings.quality.ultra",
            _ => "settings.quality.high"
        };

        private static void SetText(Text label, string key)
        {
            if (label == null) return;
            LocalizationManager mgr = LocalizationManager.Instance;
            label.text = mgr != null ? mgr.GetForDisplay(key) : string.Empty;
        }

        private void ApplyFontsToAllLabels()
        {
            foreach (Text label in GetComponentsInChildren<Text>(true))
            {
                LocalizedFontProvider.Apply(label);
            }
        }
    }
}