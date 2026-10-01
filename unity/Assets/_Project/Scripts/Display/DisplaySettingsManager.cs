using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Display
{
    /// <summary>UI scale buckets offered in the settings menu.</summary>
    public enum UiScaleLevel
    {
        Small = 0,
        Medium = 1,
        Large = 2
    }

    /// <summary>A resolution the current display can actually output, with its usable refresh rates.</summary>
    public struct DisplayMode
    {
        public int width;
        public int height;
        public int refreshRate;

        public override string ToString() => refreshRate > 0 ? $"{width}x{height} @{refreshRate}Hz" : $"{width}x{height}";
    }

    /// <summary>
    /// Owns everything the player can change about how the game is presented: resolution,
    /// window/fullscreen mode, VSync, frame cap, and UI scale.
    /// </summary>
    /// <remarks>
    /// Deliberately does not own graphics quality or memory budgets: those belong to
    /// <c>QualityPresetManager</c> and <c>MemoryBudgetManager</c>. This manager persists
    /// display-only choices under distinct PlayerPrefs keys so the two systems never overwrite
    /// each other. Nothing here is required for the game to run: every setting falls back to a
    /// safe default, and the component degrades to a no-op when Unity reports no fullscreen
    /// modes (which happens on some headless and remote-desktop setups).
    /// </remarks>
    [DisallowMultipleComponent]
    public class DisplaySettingsManager : MonoBehaviour
    {
        public const string PlayerPrefsKeyResolution = "WW_Resolution";
        public const string PlayerPrefsKeyFullscreen = "WW_Fullscreen";
        public const string PlayerPrefsKeyVSync = "WW_VSync";
        public const string PlayerPrefsKeyFrameLimit = "WW_FrameLimit";
        public const string PlayerPrefsKeyUiScale = "WW_UiScale";

        /// <summary>
        /// Used when nothing is persisted, and when the persisted mode is no longer offered.
        /// <c>readonly</c> rather than <c>const</c>: a struct with value fields can never be a
        /// compile-time constant.
        /// </summary>
        public static readonly DisplayMode DefaultMode = new DisplayMode { width = 1920, height = 1080, refreshRate = 60 };

        private static DisplaySettingsManager _instance;
        public static DisplaySettingsManager Instance => _instance;

        private readonly List<DisplayMode> _modes = new List<DisplayMode>();

        private bool _isFullscreen = true;
        private bool _vsync = true;
        private int _frameLimit = 60;
        private UiScaleLevel _uiScale = UiScaleLevel.Medium;
        private DisplayMode _current;

        /// <summary>Fired after any display setting is committed.</summary>
        public event Action OnDisplaySettingsChanged;

        public IReadOnlyList<DisplayMode> AvailableModes => _modes;
        public DisplayMode CurrentMode => _current;
        public bool IsFullscreen => _isFullscreen;
        public bool VSyncEnabled => _vsync;
        public int FrameLimit => _frameLimit;
        public UiScaleLevel UiScale => _uiScale;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(this);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            RefreshAvailableModes();
            LoadAndApply();
        }

        /// <summary>
        /// Enumerates the display's real output modes. Falls back to a single synthetic entry
        /// built from the current screen size when Unity reports nothing, so the settings menu
        /// is never empty and the game remains playable.
        /// </summary>
        public void RefreshAvailableModes()
        {
            _modes.Clear();

            Resolution[] reported = Array.Empty<Resolution>();
            try
            {
                reported = Screen.resolutions;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> Could not enumerate display modes: {e.Message}");
            }

            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (Resolution r in reported)
            {
                if (r.width <= 0 || r.height <= 0) continue;
                int hz = (int)Math.Round((float)r.refreshRateRatio.value);
                string key = $"{r.width}x{r.height}@{hz}";
                if (!seen.Add(key)) continue;
                _modes.Add(new DisplayMode { width = r.width, height = r.height, refreshRate = hz });
            }

            if (_modes.Count == 0)
            {
                Resolution current = Screen.currentResolution;
                int w = current.width > 0 ? current.width : DefaultMode.width;
                int h = current.height > 0 ? current.height : DefaultMode.height;
                _modes.Add(new DisplayMode { width = w, height = h, refreshRate = DefaultMode.refreshRate });
                Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> No fullscreen modes reported; using fallback {w}x{h}.");
            }

            // Highest resolutions first so the menu opens on a sensible default.
            _modes.Sort((a, b) =>
            {
                int byPixels = (b.width * b.height).CompareTo(a.width * a.height);
                return byPixels != 0 ? byPixels : b.refreshRate.CompareTo(a.refreshRate);
            });
        }

        public bool IsSupported(DisplayMode mode)
        {
            foreach (DisplayMode m in _modes)
            {
                if (m.width == mode.width && m.height == mode.height) return true;
            }
            return false;
        }

        public void ApplyMode(DisplayMode mode)
        {
            RefreshAvailableModes();
            if (!IsSupported(mode))
            {
                Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> Mode {mode} unsupported; keeping {_current}.");
                return;
            }

            _current = mode;
            _isFullscreen = true;

            try
            {
                Screen.SetResolution(mode.width, mode.height, FullScreenMode.FullScreenWindow, mode.refreshRate);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> SetResolution failed: {e.Message}");
                return;
            }

            PlayerPrefs.SetInt(PlayerPrefsKeyResolution, mode.width);
            PlayerPrefs.SetInt(PlayerPrefsKeyResolution + "_h", mode.height);
            PlayerPrefs.SetInt(PlayerPrefsKeyFullscreen, 1);
            PlayerPrefs.Save();
            NotifyChanged();
        }

        public void ApplyWindowed(int width, int height)
        {
            if (width <= 0 || height <= 0) return;

            _current = new DisplayMode { width = width, height = height, refreshRate = 0 };
            _isFullscreen = false;

            try
            {
                Screen.SetResolution(width, height, FullScreenMode.Windowed);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> SetResolution failed: {e.Message}");
                return;
            }

            PlayerPrefs.SetInt(PlayerPrefsKeyResolution, width);
            PlayerPrefs.SetInt(PlayerPrefsKeyResolution + "_h", height);
            PlayerPrefs.SetInt(PlayerPrefsKeyFullscreen, 0);
            PlayerPrefs.Save();
            NotifyChanged();
        }

        /// <summary>Switching modes alone is insufficient on some drivers; this also re-applies the current mode.</summary>
        public void SetFullscreen(bool fullscreen)
        {
            if (fullscreen && _modes.Count > 0)
            {
                if (IsSupported(_current))
                {
                    _isFullscreen = true;
                    try
                    {
                        Screen.SetResolution(_current.width, _current.height, FullScreenMode.FullScreenWindow, _current.refreshRate);
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> SetResolution failed: {e.Message}");
                    }
                }
                else
                {
                    ApplyMode(_modes[0]);
                    return;
                }
            }
            else
            {
                int w = _current.width > 0 ? _current.width : DefaultMode.width;
                int h = _current.height > 0 ? _current.height : DefaultMode.height;
                _isFullscreen = false;
                try
                {
                    Screen.SetResolution(w, h, FullScreenMode.Windowed);
                }
                catch (Exception e)
                {
                    Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> SetResolution failed: {e.Message}");
                }
            }

            PlayerPrefs.SetInt(PlayerPrefsKeyFullscreen, _isFullscreen ? 1 : 0);
            PlayerPrefs.Save();
            NotifyChanged();
        }

        public void SetVSync(bool enabled)
        {
            _vsync = enabled;
            QualitySettings.vSyncCount = enabled ? 1 : 0;
            PlayerPrefs.SetInt(PlayerPrefsKeyVSync, enabled ? 1 : 0);
            PlayerPrefs.Save();
            NotifyChanged();
        }

        /// <summary>
        /// VSync and a frame cap fight each other, so enabling a cap forces VSync off. This is the
        /// standard desktop behaviour and avoids a locked frame rate on slower hardware.
        /// </summary>
        public void SetFrameLimit(int frameLimit)
        {
            _frameLimit = Mathf.Clamp(frameLimit, 30, 240);
            if (_frameLimit < 240) _vsync = false;

            Application.targetFrameRate = _frameLimit;
            QualitySettings.vSyncCount = _vsync ? 1 : 0;

            PlayerPrefs.SetInt(PlayerPrefsKeyFrameLimit, _frameLimit);
            PlayerPrefs.SetInt(PlayerPrefsKeyVSync, _vsync ? 1 : 0);
            PlayerPrefs.Save();
            NotifyChanged();
        }

        public void SetUiScale(UiScaleLevel level)
        {
            _uiScale = level;
            ApplyUiScale();
            PlayerPrefs.SetInt(PlayerPrefsKeyUiScale, (int)level);
            PlayerPrefs.Save();
            NotifyChanged();
        }

        /// <summary>
        /// Scales every CanvasScaler in the loaded scenes. Screen-space canvases use
        /// <see cref="UnityEngine.UI.CanvasScaler.referenceResolution"/> for layout, so a
        /// multiplier on matchWidthOrHeight gives a consistent readable size on any aspect ratio.
        /// </summary>
        public void ApplyUiScale()
        {
            float factor = _uiScale switch
            {
                UiScaleLevel.Small => 0.85f,
                UiScaleLevel.Large => 1.25f,
                _ => 1.0f
            };

            foreach (UnityEngine.UI.CanvasScaler scaler in FindObjectsByType<UnityEngine.UI.CanvasScaler>(FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                if (scaler.uiScaleMode != UnityEngine.UI.CanvasScaler.ScaleMode.ScaleWithScreenSize) continue;
                scaler.matchWidthOrHeight = factor <= 1f ? 0.65f : 0.35f;
            }
        }

        private void LoadAndApply()
        {
            int w = PlayerPrefs.GetInt(PlayerPrefsKeyResolution, DefaultMode.width);
            int h = PlayerPrefs.GetInt(PlayerPrefsKeyResolution + "_h", DefaultMode.height);
            _isFullscreen = PlayerPrefs.GetInt(PlayerPrefsKeyFullscreen, 1) == 1;
            _vsync = PlayerPrefs.GetInt(PlayerPrefsKeyVSync, 1) == 1;
            _frameLimit = PlayerPrefs.GetInt(PlayerPrefsKeyFrameLimit, 60);
            _uiScale = (UiScaleLevel)PlayerPrefs.GetInt(PlayerPrefsKeyUiScale, (int)UiScaleLevel.Medium);

            if (!Enum.IsDefined(typeof(UiScaleLevel), _uiScale))
            {
                _uiScale = UiScaleLevel.Medium;
            }

            _current = new DisplayMode { width = w, height = h, refreshRate = DefaultMode.refreshRate };

            try
            {
                if (_isFullscreen)
                {
                    Screen.SetResolution(w, h, FullScreenMode.FullScreenWindow, _current.refreshRate);
                    // A persisted mode can outlive the monitor it was saved on.
                    if (_modes.Count > 0 && !IsSupported(_current)) _current = _modes[0];
                }
                else
                {
                    Screen.SetResolution(w, h, FullScreenMode.Windowed);
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"<color=#FFCC00><b>[DisplaySettingsManager]</b></color> Could not apply persisted display mode: {e.Message}");
            }

            Application.targetFrameRate = _frameLimit;
            QualitySettings.vSyncCount = _vsync ? 1 : 0;
            ApplyUiScale();

            Debug.Log($"<color=#00D2FF><b>[DisplaySettingsManager]</b></color> {_current}, fullscreen={_isFullscreen}, vSync={_vsync}, cap={_frameLimit}, uiScale={_uiScale} ({_modes.Count} modes)");
        }

        private void NotifyChanged() => OnDisplaySettingsChanged?.Invoke();
    }
}
