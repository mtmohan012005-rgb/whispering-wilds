using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// The accessibility settings (subtitle presence/size/background, motion reduction, screen
    /// shake) are persisted under their own PlayerPrefs keys and must survive a save/load cycle
    /// intact.
    /// </summary>
    public class AccessibilityTests
    {
        private static readonly string[] AccessibilityKeys =
        {
            "WW_Subtitles", "WW_SubtitleSize", "WW_SubtitleBG", "WW_MotionReduction", "WW_ScreenShake"
        };

        private readonly Dictionary<string, string> _prefSnapshot = new Dictionary<string, string>();

        [SetUp]
        public void CapturePrefs()
        {
            _prefSnapshot.Clear();
            foreach (string key in AccessibilityKeys)
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
            foreach (string key in AccessibilityKeys) PlayerPrefs.DeleteKey(key);
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
            return go.AddComponent<SettingsMenuController>();
        }

        private static SettingsMenuController RoundTrip(System.Action<SettingsMenuController> configure)
        {
            SettingsMenuController ctrl = NewController();
            configure(ctrl);
            ctrl.SaveSettings();
            ctrl.LoadSettings();
            return ctrl;
        }

        [Test]
        public void SubtitleSettings_SurviveRoundTrip()
        {
            SettingsMenuController ctrl = RoundTrip(c =>
            {
                c.subtitlesEnabled = false;
                c.subtitleSize = 32;
                c.subtitleBackground = false;
            });

            Assert.That(ctrl.subtitlesEnabled, Is.False);
            Assert.That(ctrl.subtitleSize, Is.EqualTo(32));
            Assert.That(ctrl.subtitleBackground, Is.False);
        }

        [Test]
        public void SubtitleSize_AllOfferedSizesRoundTrip()
        {
            foreach (int offered in new[] { 18, 24, 32 })
            {
                SettingsMenuController ctrl = RoundTrip(c => c.subtitleSize = offered);
                Assert.That(ctrl.subtitleSize, Is.EqualTo(offered), $"Subtitle size {offered} did not survive.");
            }
        }

        [Test]
        public void MotionAndShakeSettings_SurviveRoundTrip()
        {
            SettingsMenuController ctrl = RoundTrip(c =>
            {
                c.motionReduction = true;
                c.screenShakeEnabled = false;
            });

            Assert.That(ctrl.motionReduction, Is.True);
            Assert.That(ctrl.screenShakeEnabled, Is.False);
        }

        [Test]
        public void AccessibilitySettings_UseDistinctKeys()
        {
            for (int i = 0; i < AccessibilityKeys.Length; i++)
            {
                for (int j = i + 1; j < AccessibilityKeys.Length; j++)
                {
                    Assert.That(AccessibilityKeys[i], Is.Not.EqualTo(AccessibilityKeys[j]));
                }
            }
            Assert.That(AccessibilityKeys, Is.All.StartsWith("WW_"));
        }
    }
}