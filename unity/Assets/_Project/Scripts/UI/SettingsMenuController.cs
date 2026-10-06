using System;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.Display;
using WhisperingWilds.Player;
using WhisperingWilds.Quality;

namespace WhisperingWilds.UI
{
    public enum ColorblindMode
    {
        None = 0,
        Protanopia = 1,
        Deuteranopia = 2,
        Tritanopia = 3
    }

    /// <summary>
    /// Master PC Settings & Accessibility controller providing exhaustive graphics, display,
    /// audio (6 channels), controls, camera, and accessibility options tailored for low-end laptops to 4K gaming rigs.
    /// </summary>
    [DisallowMultipleComponent]
    public class SettingsMenuController : MonoBehaviour
    {
        private static SettingsMenuController _instance;
        public static SettingsMenuController Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<SettingsMenuController>();
if (_instance == null)
                {
                    var go = new GameObject("--- SettingsMenuController ---");
                    _instance = go.AddComponent<SettingsMenuController>();
                    if (Application.isPlaying) DontDestroyOnLoad(go);
                }
                }
                return _instance;
            }
        }

        [Header("Graphics Options")]
        public QualityTier activeTier = QualityTier.High;
        public bool isFullscreen = true;
        public int resolutionWidth = 1920;
        public int resolutionHeight = 1080;
        public bool vSync = true;
        public float renderScale = 1.0f;
        public float fov = 75f;
        public bool motionBlurEnabled = true;

        [Header("Audio Volumes (0.0 to 1.0)")]
        public float masterVolume = 1.0f;
        public float musicVolume = 0.8f;
        public float ambienceVolume = 0.85f;
        public float sfxVolume = 1.0f;
        public float dialogueVolume = 1.0f;
        public float uiVolume = 0.85f;

        [Header("Controls & Camera")]
        public float mouseSensitivity = 1.0f;
        public float mouseSensitivityY = 1.0f;
        public float gamepadSensitivity = 2.0f;
        public bool invertY = false;
        public bool invertX = false;
        public float cameraSmoothing = 15.0f;
        public bool sprintToggle = false;
        public bool crouchToggle = false;

        [Header("Accessibility")]
        public bool subtitlesEnabled = true;
        public int subtitleSize = 24; // 18, 24, 32
        public bool subtitleBackground = true;
        public float uiScale = 1.0f;
        public bool motionReduction = false;
        public bool screenShakeEnabled = true;
        public ColorblindMode colorblindMode = ColorblindMode.None;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                if (Application.isPlaying) Destroy(this);
                else DestroyImmediate(this);
                return;
            }
            _instance = this;
            if (Application.isPlaying) DontDestroyOnLoad(gameObject);
            LoadSettings();
        }

        private void OnDestroy()
        {
            if (_instance == this) _instance = null;
        }

        public void LoadSettings()
        {
            activeTier = (QualityTier)PlayerPrefs.GetInt("WW_QualityTier", (int)QualityTier.High);
            isFullscreen = PlayerPrefs.GetInt("WW_Fullscreen", 1) == 1;
            vSync = PlayerPrefs.GetInt("WW_VSync", 1) == 1;
            renderScale = PlayerPrefs.GetFloat("WW_RenderScale", 1.0f);
            fov = PlayerPrefs.GetFloat("WW_FOV", 75f);
            motionBlurEnabled = PlayerPrefs.GetInt("WW_MotionBlur", 1) == 1;

            masterVolume = PlayerPrefs.GetFloat("WW_VolMaster", 1.0f);
            musicVolume = PlayerPrefs.GetFloat("WW_VolMusic", 0.8f);
            ambienceVolume = PlayerPrefs.GetFloat("WW_VolAmbience", 0.85f);
            sfxVolume = PlayerPrefs.GetFloat("WW_VolSFX", 1.0f);
            dialogueVolume = PlayerPrefs.GetFloat("WW_VolDialogue", 1.0f);
            uiVolume = PlayerPrefs.GetFloat("WW_VolUI", 0.85f);

            mouseSensitivity = PlayerPrefs.GetFloat("WW_MouseSens", 1.0f);
            mouseSensitivityY = PlayerPrefs.GetFloat("WW_MouseSensY", mouseSensitivity);
            gamepadSensitivity = PlayerPrefs.GetFloat("WW_GamepadSens", 2.0f);
            invertY = PlayerPrefs.GetInt("WW_InvertY", 0) == 1;
            invertX = PlayerPrefs.GetInt("WW_InvertX", 0) == 1;
            cameraSmoothing = PlayerPrefs.GetFloat("WW_CameraSmoothing", 15.0f);
            sprintToggle = PlayerPrefs.GetInt("WW_SprintToggle", 0) == 1;
            crouchToggle = PlayerPrefs.GetInt("WW_CrouchToggle", 0) == 1;

            subtitlesEnabled = PlayerPrefs.GetInt("WW_Subtitles", 1) == 1;
            subtitleSize = PlayerPrefs.GetInt("WW_SubtitleSize", 24);
            subtitleBackground = PlayerPrefs.GetInt("WW_SubtitleBG", 1) == 1;
            uiScale = PlayerPrefs.GetFloat("WW_UIScale", 1.0f);
            motionReduction = PlayerPrefs.GetInt("WW_MotionReduction", 0) == 1;
            screenShakeEnabled = PlayerPrefs.GetInt("WW_ScreenShake", 1) == 1;
            colorblindMode = (ColorblindMode)PlayerPrefs.GetInt("WW_ColorblindMode", 0);

            ApplyAllSettings();
        }

        /// <summary>
        /// Applies and persists the control sensitivities and Y inversion. Called by the controls
        /// integration and the automated suites; the values take effect on PlayerInputHandler and
        /// PlayerMovement on the very next input read because those read the live controller.
        /// </summary>
        public void SetControls(float mouseSens, float gamepadSens, bool invertYSetting)
        {
            mouseSensitivity = mouseSens;
            gamepadSensitivity = gamepadSens;
            invertY = invertYSetting;
            SaveSettings();
        }

        /// <summary>
        /// Applies and persists all six audio bus volumes (Master/Music/Ambience/SFX/Dialogue/UI).
        /// </summary>
        public void SetAudioVolumes(float master, float music, float ambient, float sfx, float dialogue, float ui)
        {
            masterVolume = master;
            musicVolume = music;
            ambienceVolume = ambient;
            sfxVolume = sfx;
            dialogueVolume = dialogue;
            uiVolume = ui;
            SaveSettings();
        }

        /// <summary>
        /// Applies and persists the accessibility options (subtitles, motion reduction, shake).
        /// </summary>
        public void SetAccessibility(bool subtitles, int subtitleSizeValue, bool subtitleBg, bool motionReductionOn, bool screenShakeOn)
        {
            subtitlesEnabled = subtitles;
            subtitleSize = subtitleSizeValue;
            subtitleBackground = subtitleBg;
            motionReduction = motionReductionOn;
            screenShakeEnabled = screenShakeOn;
            SaveSettings();
        }

        /// <summary>
        /// Persists whatever settings are currently live when the application loses focus or is
        /// paused, so programmatically-applied values survive without a dedicated save call site.
        /// </summary>
        private void OnApplicationPause(bool paused)
        {
            if (paused || !Application.isPlaying) return;
            SaveSettings();
        }

        private void OnApplicationFocus(bool focused)
        {
            if (focused || !Application.isPlaying) return;
            SaveSettings();
        }

        public void SaveSettings()
        {
            PlayerPrefs.SetInt("WW_QualityTier", (int)activeTier);
            PlayerPrefs.SetInt("WW_Fullscreen", isFullscreen ? 1 : 0);
            PlayerPrefs.SetInt("WW_VSync", vSync ? 1 : 0);
            PlayerPrefs.SetFloat("WW_RenderScale", renderScale);
            PlayerPrefs.SetFloat("WW_FOV", fov);
            PlayerPrefs.SetInt("WW_MotionBlur", motionBlurEnabled ? 1 : 0);

            PlayerPrefs.SetFloat("WW_VolMaster", masterVolume);
            PlayerPrefs.SetFloat("WW_VolMusic", musicVolume);
            PlayerPrefs.SetFloat("WW_VolAmbience", ambienceVolume);
            PlayerPrefs.SetFloat("WW_VolSFX", sfxVolume);
            PlayerPrefs.SetFloat("WW_VolDialogue", dialogueVolume);
            PlayerPrefs.SetFloat("WW_VolUI", uiVolume);

            PlayerPrefs.SetFloat("WW_MouseSens", mouseSensitivity);
            PlayerPrefs.SetFloat("WW_MouseSensY", mouseSensitivityY);
            PlayerPrefs.SetFloat("WW_GamepadSens", gamepadSensitivity);
            PlayerPrefs.SetInt("WW_InvertY", invertY ? 1 : 0);
            PlayerPrefs.SetInt("WW_InvertX", invertX ? 1 : 0);
            PlayerPrefs.SetFloat("WW_CameraSmoothing", cameraSmoothing);
            PlayerPrefs.SetInt("WW_SprintToggle", sprintToggle ? 1 : 0);
            PlayerPrefs.SetInt("WW_CrouchToggle", crouchToggle ? 1 : 0);

            PlayerPrefs.SetInt("WW_Subtitles", subtitlesEnabled ? 1 : 0);
            PlayerPrefs.SetInt("WW_SubtitleSize", subtitleSize);
            PlayerPrefs.SetInt("WW_SubtitleBG", subtitleBackground ? 1 : 0);
            PlayerPrefs.SetFloat("WW_UIScale", uiScale);
            PlayerPrefs.SetInt("WW_MotionReduction", motionReduction ? 1 : 0);
            PlayerPrefs.SetInt("WW_ScreenShake", screenShakeEnabled ? 1 : 0);
            PlayerPrefs.SetInt("WW_ColorblindMode", (int)colorblindMode);

            PlayerPrefs.Save();
            ApplyAllSettings();
        }

        public void ApplyAllSettings()
        {
            // Quality & Graphics
            if (GraphicsPerformanceManager.Instance != null)
            {
                GraphicsPerformanceManager.Instance.ApplyProfile(activeTier);
            }
            else if (QualityPresetManager.Instance != null)
            {
                QualityPresetManager.Instance.ApplyPreset(activeTier);
            }

            // Display
            if (DisplaySettingsManager.Instance != null)
            {
                DisplaySettingsManager.Instance.SetVSync(vSync);
                if (uiScale > 0f)
                {
                    DisplaySettingsManager.Instance.SetUiScale(DisplaySettingsManager.LegacyUiScaleToLevel(uiScale));
                }
            }

            // Audio: Push live mixer state to all 6 buses
if (AudioManager.Instance != null)
            {
                AudioManager.Instance.SetMasterVolume(masterVolume);
                AudioManager.Instance.SetMusicVolume(musicVolume);
                AudioManager.Instance.SetSFXVolume(sfxVolume);
                AudioManager.Instance.SetAmbientVolume(ambienceVolume);
                AudioManager.Instance.SetVoiceVolume(dialogueVolume);
                AudioManager.Instance.SetUiVolume(uiVolume);
            }

            // Controls: Sync hold/toggle modes to InputBindingManager
            if (InputBindingManager.Instance != null)
            {
                InputBindingManager.Instance.sprintMode = sprintToggle ? ActionMode.Toggle : ActionMode.Hold;
                InputBindingManager.Instance.crouchMode = crouchToggle ? ActionMode.Toggle : ActionMode.Hold;
            }

            // Camera FOV
            Camera[] allCams = UnityEngine.Object.FindObjectsByType<Camera>(FindObjectsSortMode.None);
            for (int i = 0; i < allCams.Length; i++)
            {
                if (allCams[i].CompareTag("MainCamera"))
                {
                    allCams[i].fieldOfView = fov;
                }
            }
            if (Camera.main != null)
            {
                Camera.main.fieldOfView = fov;
            }

            Debug.Log($"<color=#00D2FF><b>[SettingsMenuController]</b></color> Settings applied (Tier: {activeTier}, FOV: {fov}, MasterVol: {masterVolume}, Sens: {mouseSensitivity}, Shake: {screenShakeEnabled})");
        }
    }
}
