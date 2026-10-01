using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using WhisperingWilds.Display;
using WhisperingWilds.Localization;
using WhisperingWilds.Quality;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// The in-game Settings screen: language, UI scale, display, and graphics quality.
    /// </summary>
    /// <remarks>
    /// Pure UI layer. Every control reads and writes through the owning managers rather than
    /// touching <c>PlayerPrefs</c>, <c>Screen</c>, or <c>QualitySettings</c> itself, so there is
    /// exactly one owner per setting:
    /// <list type="bullet">
    /// <item>language - <see cref="LocalizationManager"/></item>
    /// <item>UI scale, fullscreen, VSync, frame cap - <see cref="DisplaySettingsManager"/></item>
    /// <item>graphics quality - <see cref="GraphicsPerformanceManager"/></item>
    /// </list>
    ///
    /// Controls can be built in code by <see cref="BuildIfNeeded"/> or wired in the inspector;
    /// either path works. Everything is rebuilt from localization keys on a language change, so
    /// switching to Tamil while the menu is open updates it in place.
    /// </remarks>
    [DisallowMultipleComponent]
    public class SettingsMenuUI : MonoBehaviour
    {
        [Header("Root")]
        [SerializeField] private GameObject panelRoot;

        [Header("Tabs")]
        [SerializeField] private Button languageTabButton;
        [SerializeField] private Button displayTabButton;
        [SerializeField] private Button qualityTabButton;
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

        private enum Page { Language, Display, Quality }

        private Page _page = Page.Language;
        private Color _englishColor = new Color(0.16f, 0.55f, 0.42f, 1f);
        private Color _tamilColor = new Color(0.16f, 0.55f, 0.42f, 1f);
        private Color _inactiveColor = new Color(0.14f, 0.16f, 0.20f, 1f);

        private bool _visible;

        public bool IsVisible => _visible;

        /// <summary>Opens or closes the settings screen.</summary>
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

        /// <summary>Flips between settings and the previous screen.</summary>
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

        private void ShowPage(Page page)
        {
            _page = page;
            if (languagePage != null) languagePage.SetActive(page == Page.Language);
            if (displayPage != null) displayPage.SetActive(page == Page.Display);
            if (qualityPage != null) qualityPage.SetActive(page == Page.Quality);
        }

        private void FocusFirstControl()
        {
            if (EventSystem.current == null) return;

            // A fresh EventSystem in the editor or a scene without one should not break the menu.
            Button first = languageTabButton != null ? languageTabButton
                        : displayTabButton != null ? displayTabButton
                        : qualityTabButton != null ? qualityTabButton
                        : closeButton;
            if (first != null) EventSystem.current.SetSelectedGameObject(first.gameObject);
        }

        private void RestoreCursor()
        {
            // Leave the cursor state alone if gameplay already expects it to be locked.
            if (UnityEngine.SceneManagement.SceneManager.GetActiveScene().name.StartsWith("00_")) return;
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        // ---------- Language ----------

        public void SelectEnglish() => SetLanguage(Language.English);

        public void SelectTamil() => SetLanguage(Language.Tamil);

        private void SetLanguage(Language language)
        {
            if (LocalizationManager.Instance == null)
            {
                Debug.LogWarning("<color=#FFCC00><b>[SettingsMenuUI]</b></color> No LocalizationManager in the scene; language unchanged.");
                return;
            }

            LocalizationManager.Instance.SetLanguage(language);
            RefreshAll();
        }

        // ---------- Display ----------

        private void CycleUiScale(int direction)
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;

            int next = Mathf.Clamp((int)mgr.UiScale + direction, 0, 2);
            mgr.SetUiScale((UiScaleLevel)next);
        }

        private void ToggleFullscreen()
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;
            mgr.SetFullscreen(!mgr.IsFullscreen);
        }

        private void ToggleVSync()
        {
            DisplaySettingsManager mgr = DisplaySettingsManager.Instance;
            if (mgr == null) return;
            mgr.SetVSync(!mgr.VSyncEnabled);
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
        }

        // ---------- Quality ----------

        /// <summary>
        /// The tiers the menu cycles through, cheapest first. <c>QualityTier.Custom</c> is not
        /// user-selectable, so it is excluded.
        /// </summary>
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

            int current = System.Array.IndexOf(SelectableTiers, mgr.CurrentTier);
            if (current < 0) current = 3; // High

            int next = (current + direction + SelectableTiers.Length) % SelectableTiers.Length;
            mgr.ApplyProfile(SelectableTiers[next]);
            RefreshAll();
        }

        // ---------- Refresh ----------

        private void RefreshAll()
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

            RefreshLanguageSelection();
            RefreshDisplayValues();
            RefreshQualityValue();
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
            label.text = mgr != null ? mgr.Get(key) : key;
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