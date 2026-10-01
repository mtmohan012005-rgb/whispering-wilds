using System;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.Display;
using WhisperingWilds.Quality;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// PC Settings & Accessibility controller providing exhaustive graphics, display,
    /// audio, controls, and accessibility options tailored for low-end laptops to 4K gaming rigs.
    /// </summary>
    [DisallowMultipleComponent]
    public class SettingsMenuController : MonoBehaviour
    {
        public static SettingsMenuController Instance { get; private set; }

        [Header("Graphics Options")]
        public QualityTier activeTier = QualityTier.High;
        public bool isFullscreen = true;
        public int resolutionWidth = 1920;
        public int resolutionHeight = 1080;
        public bool vSync = true;
        public float renderScale = 1.0f;
        public float fov = 75f;

        [Header("Audio Volumes (0.0 to 1.0)")]
        public float masterVolume = 1.0f;
        public float musicVolume = 0.8f;
        public float ambienceVolume = 0.85f;
        public float sfxVolume = 1.0f;
        public float dialogueVolume = 1.0f;

        [Header("Controls")]
        public float mouseSensitivity = 1.0f;
        public float gamepadSensitivity = 2.0f;
        public bool invertY = false;

        [Header("Accessibility")]
        public bool subtitlesEnabled = true;
        public int subtitleSize = 24; // 18, 24, 32
        public bool subtitleBackground = true;
        public float uiScale = 1.0f;
        public bool motionReduction = false;
        public bool screenShakeEnabled = true;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadSettings();
        }

        public void LoadSettings()
        {
            activeTier = (QualityTier)PlayerPrefs.GetInt("WW_QualityTier", (int)QualityTier.High);
            isFullscreen = PlayerPrefs.GetInt("WW_Fullscreen", 1) == 1;
            vSync = PlayerPrefs.GetInt("WW_VSync", 1) == 1;
            renderScale = PlayerPrefs.GetFloat("WW_RenderScale", 1.0f);
            fov = PlayerPrefs.GetFloat("WW_FOV", 75f);

            masterVolume = PlayerPrefs.GetFloat("WW_VolMaster", 1.0f);
            musicVolume = PlayerPrefs.GetFloat("WW_VolMusic", 0.8f);
            ambienceVolume = PlayerPrefs.GetFloat("WW_VolAmbience", 0.85f);
            sfxVolume = PlayerPrefs.GetFloat("WW_VolSFX", 1.0f);
            dialogueVolume = PlayerPrefs.GetFloat("WW_VolDialogue", 1.0f);

            mouseSensitivity = PlayerPrefs.GetFloat("WW_MouseSens", 1.0f);
            gamepadSensitivity = PlayerPrefs.GetFloat("WW_GamepadSens", 2.0f);
            invertY = PlayerPrefs.GetInt("WW_InvertY", 0) == 1;

            subtitlesEnabled = PlayerPrefs.GetInt("WW_Subtitles", 1) == 1;
            subtitleSize = PlayerPrefs.GetInt("WW_SubtitleSize", 24);
            subtitleBackground = PlayerPrefs.GetInt("WW_SubtitleBG", 1) == 1;
            uiScale = PlayerPrefs.GetFloat("WW_UIScale", 1.0f);
            motionReduction = PlayerPrefs.GetInt("WW_MotionReduction", 0) == 1;
            screenShakeEnabled = PlayerPrefs.GetInt("WW_ScreenShake", 1) == 1;

            ApplyAllSettings();
        }

        public void SaveSettings()
        {
            PlayerPrefs.SetInt("WW_QualityTier", (int)activeTier);
            PlayerPrefs.SetInt("WW_Fullscreen", isFullscreen ? 1 : 0);
            PlayerPrefs.SetInt("WW_VSync", vSync ? 1 : 0);
            PlayerPrefs.SetFloat("WW_RenderScale", renderScale);
            PlayerPrefs.SetFloat("WW_FOV", fov);

            PlayerPrefs.SetFloat("WW_VolMaster", masterVolume);
            PlayerPrefs.SetFloat("WW_VolMusic", musicVolume);
            PlayerPrefs.SetFloat("WW_VolAmbience", ambienceVolume);
            PlayerPrefs.SetFloat("WW_VolSFX", sfxVolume);
            PlayerPrefs.SetFloat("WW_VolDialogue", dialogueVolume);

            PlayerPrefs.SetFloat("WW_MouseSens", mouseSensitivity);
            PlayerPrefs.SetFloat("WW_GamepadSens", gamepadSensitivity);
            PlayerPrefs.SetInt("WW_InvertY", invertY ? 1 : 0);

            PlayerPrefs.SetInt("WW_Subtitles", subtitlesEnabled ? 1 : 0);
            PlayerPrefs.SetInt("WW_SubtitleSize", subtitleSize);
            PlayerPrefs.SetInt("WW_SubtitleBG", subtitleBackground ? 1 : 0);
            PlayerPrefs.SetFloat("WW_UIScale", uiScale);
            PlayerPrefs.SetInt("WW_MotionReduction", motionReduction ? 1 : 0);
            PlayerPrefs.SetInt("WW_ScreenShake", screenShakeEnabled ? 1 : 0);

            PlayerPrefs.Save();
            ApplyAllSettings();
        }

        public void ApplyAllSettings()
        {
            // Quality: GraphicsPerformanceManager is the graphics authority; QualityPresetManager
            // is its preset-table source. Never write QualitySettings directly here, or this
            // controller becomes a second conflicting owner of the same settings.
            if (GraphicsPerformanceManager.Instance != null)
            {
                GraphicsPerformanceManager.Instance.ApplyProfile(activeTier);
            }
            else if (QualityPresetManager.Instance != null)
            {
                QualityPresetManager.Instance.ApplyPreset(activeTier);
            }

            // Display: DisplaySettingsManager owns resolution, fullscreen mode, VSync, frame cap
            // and UI scale, under the WW_Fullscreen / WW_VSync keys. Writing them here as well
            // meant two components persisting the same values independently.
            if (DisplaySettingsManager.Instance != null)
            {
                DisplaySettingsManager.Instance.SetVSync(vSync);
            }

            // UI scale lives in DisplaySettingsManager; uiScale here is a legacy float field
            // kept only so old saves do not throw, and is no longer the source of truth.
            if (DisplaySettingsManager.Instance != null && uiScale > 0f)
            {
                DisplaySettingsManager.Instance.SetUiScale(DisplaySettingsManager.LegacyUiScaleToLevel(uiScale));
            }

            // Audio
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.SetMasterVolume(masterVolume);
                AudioManager.Instance.SetMusicVolume(musicVolume);
                AudioManager.Instance.SetSFXVolume(sfxVolume);
            }

            // Camera FOV
            if (Camera.main != null)
            {
                Camera.main.fieldOfView = fov;
            }

            Debug.Log($"<color=#00D2FF><b>[SettingsMenuController]</b></color> Settings applied (Tier: {activeTier}, VSync: {vSync}, FOV: {fov})");
        }
    }
}
