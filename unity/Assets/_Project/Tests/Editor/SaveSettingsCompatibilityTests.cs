using System.Collections.Generic;
using System.IO;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Settings persistence must be completely isolated from the save-game pipeline: writing the
    /// settings (PlayerPrefs namespace WW_*) must never touch save JSON files on disk, and save
    /// file filenames must never collide with the settings namespace.
    /// </summary>
    public class SaveSettingsCompatibilityTests
    {
        private static readonly string[] WwKeys =
        {
            "WW_QualityTier", "WW_Fullscreen", "WW_VSync", "WW_Resolution", "WW_Resolution_h",
            "WW_FrameLimit", "WW_UiScale", "WW_RenderScale", "WW_FOV", "WW_MotionBlur",
            "WW_VolMaster", "WW_VolMusic", "WW_VolAmbience", "WW_VolSFX", "WW_VolDialogue",
            "WW_VolUI", "WW_MouseSens", "WW_MouseSensY", "WW_GamepadSens", "WW_InvertY",
            "WW_InvertX", "WW_CameraSmoothing", "WW_SprintToggle", "WW_CrouchToggle",
            "WW_Subtitles", "WW_SubtitleSize", "WW_SubtitleBG", "WW_UIScale", "WW_MotionReduction",
            "WW_ScreenShake", "WW_ColorblindMode"
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

        [Test]
        public void SaveSettings_DoesNotModifyFilesOutsidePlayerPrefs()
        {
            string probePath = Path.Combine(Application.temporaryCachePath, "ww_settings_compat_probe.txt");
            Directory.CreateDirectory(Path.GetDirectoryName(probePath));
            File.WriteAllBytes(probePath, new byte[] { 1, 2, 3, 4, 5 });

            byte[] before = File.ReadAllBytes(probePath);
            var go = new GameObject("TestSettingsController");
            go.AddComponent<SettingsMenuController>().SaveSettings();
            byte[] after = File.ReadAllBytes(probePath);

            Assert.That(after, Is.EqualTo(before), "SaveSettings must not write to the save media.");
        }

        [Test]
        public void SaveFilenames_NeverCollideWithSettingsNamespace()
        {
            foreach (string wwKey in WwKeys)
            {
                Assert.That(wwKey, Does.StartWith("WW_"), $"Unexpected settings key '{wwKey}'.");
            }

            // Save-system file names must live outside the WW_ settings namespace so the two
            // persistence paths can never write to the same location.
            string[] saveFiles =
            {
                "whispering_wilds_save.json",
                "whispering_wilds_save.backup.json",
                "whispering_wilds_save.tmp.json",
                "whispering_wilds_world_state.json"
            };
            foreach (string file in saveFiles)
            {
                Assert.That(file, Does.Not.StartWith("WW_"), $"Save file '{file}' collides with settings namespace.");
                Assert.That(WwKeys, Does.Not.Contain(file));
            }
        }

        [Test]
        public void LoadSettings_BehavesWithDefaultsWhenNothingPersisted()
        {
            foreach (string key in WwKeys) PlayerPrefs.DeleteKey(key);

            var go = new GameObject("TestSettingsController");
            SettingsMenuController ctrl = go.AddComponent<SettingsMenuController>();
            ctrl.LoadSettings();

            Assert.That(ctrl.masterVolume, Is.EqualTo(1f).Within(1e-4f));
            Assert.That(ctrl.sfxVolume, Is.EqualTo(1f).Within(1e-4f));
            Assert.That(ctrl.fov, Is.EqualTo(75f).Within(1e-4f));
            Assert.That(ctrl.invertY, Is.False);
            Assert.That(ctrl.subtitlesEnabled, Is.True);
            Assert.That(ctrl.subtitleSize, Is.EqualTo(24));
            Assert.That(ctrl.subtitleBackground, Is.True);
        }
    }
}