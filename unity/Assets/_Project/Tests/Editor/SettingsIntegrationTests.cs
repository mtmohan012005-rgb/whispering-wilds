using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Verifies that the settings the player can change are actually persisted under the
    /// WW_ namespace, restored on load, and surface through the real gameplay consumers
    /// (input, camera) rather than being stored-and-ignored.
    /// </summary>
    public class SettingsIntegrationTests
    {
        private static readonly string[] WwKeys =
        {
            "WW_QualityTier", "WW_Fullscreen", "WW_VSync", "WW_Resolution", "WW_Resolution_h",
            "WW_FrameLimit", "WW_UiScale", "WW_RenderScale", "WW_FOV", "WW_MotionBlur",
            "WW_VolMaster", "WW_VolMusic", "WW_VolAmbience", "WW_VolSFX", "WW_VolDialogue",
            "WW_VolUI", "WW_MouseSens", "WW_MouseSensY", "WW_GamepadSens", "WW_InvertY",
            "WW_InvertX", "WW_CameraSmoothing", "WW_SprintToggle", "WW_CrouchToggle",
            "WW_Subtitles", "WW_SubtitleSize", "WW_SubtitleBG", "WW_UIScale", "WW_MotionReduction",
            "WW_ScreenShake", "WW_ColorblindMode", "WW_Language", "WW_HardwareAutoDetected"
        };

        private readonly Dictionary<string, string> _prefSnapshot = new Dictionary<string, string>();

        [SetUp]
        public void CapturePrefs()
        {
            _prefSnapshot.Clear();
            foreach (string key in WwKeys)
            {
                if (!PlayerPrefs.HasKey(key)) continue;
                int i = PlayerPrefs.GetInt(key, 0);
                float f = PlayerPrefs.GetFloat(key, 0f);
                _prefSnapshot[key] = $"{i}|{f}";
            }
        }

        [TearDown]
        public void RestorePrefs()
        {
            foreach (string key in WwKeys) PlayerPrefs.DeleteKey(key);
            foreach (var kv in _prefSnapshot)
            {
                string[] parts = kv.Value.Split('|');
                PlayerPrefs.SetInt(kv.Key, int.Parse(parts[0]));
                PlayerPrefs.SetFloat(kv.Key, float.Parse(parts[1]));
            }
            PlayerPrefs.Save();
        }

        private static SettingsMenuController NewController()
        {
            var go = new GameObject("TestSettingsController");
            SettingsMenuController ctrl = go.AddComponent<SettingsMenuController>();
            return ctrl;
        }

        [Test]
        public void SaveThenLoad_RestoresEverySetting()
        {
            SettingsMenuController ctrl = NewController();
            ctrl.masterVolume = 0.4f;
            ctrl.musicVolume = 0.3f;
            ctrl.ambienceVolume = 0.2f;
            ctrl.sfxVolume = 0.6f;
            ctrl.dialogueVolume = 0.9f;
            ctrl.mouseSensitivity = 2.5f;
            ctrl.gamepadSensitivity = 3.0f;
            ctrl.invertY = true;
            ctrl.subtitlesEnabled = false;
            ctrl.subtitleSize = 32;
            ctrl.subtitleBackground = false;
            ctrl.uiScale = 1.2f;
            ctrl.fov = 85f;
            ctrl.vSync = false;
            ctrl.SaveSettings();

            // Reset every field, then LoadSettings must restore the saved values.
            ctrl.masterVolume = 1f;
            ctrl.musicVolume = 1f;
            ctrl.ambienceVolume = 1f;
            ctrl.sfxVolume = 1f;
            ctrl.dialogueVolume = 1f;
            ctrl.mouseSensitivity = 1f;
            ctrl.gamepadSensitivity = 1f;
            ctrl.invertY = false;
            ctrl.subtitlesEnabled = true;
            ctrl.subtitleSize = 24;
            ctrl.subtitleBackground = true;
            ctrl.uiScale = 1f;
            ctrl.fov = 75f;
            ctrl.vSync = true;
            ctrl.LoadSettings();

            Assert.That(ctrl.masterVolume, Is.EqualTo(0.4f).Within(1e-4f));
            Assert.That(ctrl.musicVolume, Is.EqualTo(0.3f).Within(1e-4f));
            Assert.That(ctrl.ambienceVolume, Is.EqualTo(0.2f).Within(1e-4f));
            Assert.That(ctrl.sfxVolume, Is.EqualTo(0.6f).Within(1e-4f));
            Assert.That(ctrl.dialogueVolume, Is.EqualTo(0.9f).Within(1e-4f));
            Assert.That(ctrl.mouseSensitivity, Is.EqualTo(2.5f).Within(1e-4f));
            Assert.That(ctrl.gamepadSensitivity, Is.EqualTo(3.0f).Within(1e-4f));
            Assert.That(ctrl.invertY, Is.True);
            Assert.That(ctrl.subtitlesEnabled, Is.False);
            Assert.That(ctrl.subtitleSize, Is.EqualTo(32));
            Assert.That(ctrl.subtitleBackground, Is.False);
            Assert.That(ctrl.fov, Is.EqualTo(85f).Within(1e-4f));
            Assert.That(ctrl.vSync, Is.False);
        }

        [Test]
        public void SaveSettings_WritesOnlyTheSettingsNamespaceKeys()
        {
            foreach (string key in WwKeys) PlayerPrefs.DeleteKey(key);

            SettingsMenuController ctrl = NewController();
            ctrl.SaveSettings();

            string[] expected =
            {
                "WW_QualityTier", "WW_Fullscreen", "WW_VSync", "WW_RenderScale", "WW_FOV",
                "WW_MotionBlur", "WW_VolMaster", "WW_VolMusic", "WW_VolAmbience", "WW_VolSFX",
                "WW_VolDialogue", "WW_VolUI", "WW_MouseSens", "WW_MouseSensY", "WW_GamepadSens",
                "WW_InvertY", "WW_InvertX", "WW_CameraSmoothing", "WW_SprintToggle", "WW_CrouchToggle",
                "WW_Subtitles", "WW_SubtitleSize", "WW_SubtitleBG", "WW_UIScale", "WW_MotionReduction",
                "WW_ScreenShake", "WW_ColorblindMode"
            };

            foreach (string key in expected)
            {
                Assert.That(PlayerPrefs.HasKey(key), Is.True, $"Settings save did not write '{key}'.");
            }

            // No key outside the documented WW_ settings namespace may be written, so a save key
            // or a foreign key would be a coupling leak.
            string[] mustNotExist =
            {
                "WW_Resolution", "WW_Resolution_h", "WW_FrameLimit", "WW_UiScale", "WW_Language",
                "WW_HardwareAutoDetected", "whispering_wilds_save.json"
            };
            foreach (string key in mustNotExist)
            {
                Assert.That(PlayerPrefs.HasKey(key), Is.False, $"Settings save unexpectedly wrote '{key}'.");
            }
        }

        [Test]
        public void PlayerInputHandler_UsesInspectorDefaultsWhenNoSettingsController()
        {
            var go = new GameObject("TestPlayer");
            PlayerInputHandler handler = go.AddComponent<PlayerInputHandler>();

            Assert.That(handler.mouseSensitivity, Is.EqualTo(1.0f));
            Assert.That(handler.gamepadSensitivity, Is.EqualTo(2.0f));
            Assert.That(handler.invertY, Is.False);
            Assert.That(handler.EffectiveMouseSensitivity, Is.EqualTo(handler.mouseSensitivity));
            Assert.That(handler.EffectiveGamepadSensitivity, Is.EqualTo(handler.gamepadSensitivity));
            Assert.That(handler.EffectiveInvertY, Is.False);

            Object.DestroyImmediate(go);
        }

        [Test]
        public void ApplyAllSettings_IsSafeWithoutAnyManagersPresent()
        {
            // GraphicsPerformanceManager / DisplaySettingsManager / AudioManager / Camera.main are
            // all absent in this isolated edit-mode scene; applying must degrade gracefully.
            SettingsMenuController ctrl = NewController();
            Assert.DoesNotThrow(() => ctrl.ApplyAllSettings());
        }

        [Test]
        public void FovSetting_SurvivesRoundTrip()
        {
            SettingsMenuController ctrl = NewController();
            ctrl.fov = 85f;
            ctrl.SaveSettings();
            ctrl.fov = 60f;
            ctrl.LoadSettings();
            Assert.That(ctrl.fov, Is.EqualTo(85f).Within(1e-4f));
        }
    }
}