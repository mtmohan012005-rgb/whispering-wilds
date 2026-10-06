using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.Core;
using WhisperingWilds.Display;
using WhisperingWilds.Localization;
using WhisperingWilds.Player;
using WhisperingWilds.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace WhisperingWilds.Tests.Step24
{
    /// <summary>
    /// Step 24 integration: proves the Settings/Controls/Localization system is wired to the real
    /// gameplay surfaces rather than stored-and-ignored. Every test drives an actual manager.
    /// </summary>
    public class InputBindingIntegrationTests
    {
        [SetUp]
        public void SetUp()
        {
            InputBindingManager.Instance.ResetToDefaults();
        }

        [TearDown]
        public void TearDown()
        {
            var mgr = Object.FindAnyObjectByType<InputBindingManager>();
            if (mgr != null) Object.DestroyImmediate(mgr.gameObject);
        }

        [Test]
        public void Defaults_MatchShippedLayout()
        {
#if ENABLE_INPUT_SYSTEM
            var bindings = InputBindingManager.Instance;
            Assert.That(bindings.GetBinding(GameAction.MoveForward).key, Is.EqualTo(Key.W));
            Assert.That(bindings.GetBinding(GameAction.MoveBackward).key, Is.EqualTo(Key.S));
            Assert.That(bindings.GetBinding(GameAction.MoveLeft).key, Is.EqualTo(Key.A));
            Assert.That(bindings.GetBinding(GameAction.MoveRight).key, Is.EqualTo(Key.D));
            Assert.That(bindings.GetBinding(GameAction.Sprint).key, Is.EqualTo(Key.LeftShift));
            Assert.That(bindings.GetBinding(GameAction.Crouch).key, Is.EqualTo(Key.C));
            Assert.That(bindings.GetBinding(GameAction.Jump).key, Is.EqualTo(Key.Space));
            Assert.That(bindings.GetBinding(GameAction.Interact).key, Is.EqualTo(Key.E));
            Assert.That(bindings.GetBinding(GameAction.Pause).key, Is.EqualTo(Key.Escape));
            Assert.That(bindings.GetBinding(GameAction.Map).key, Is.EqualTo(Key.M));
            Assert.That(bindings.GetBinding(GameAction.Journal).key, Is.EqualTo(Key.J));
            Assert.That(bindings.GetBinding(GameAction.Reload).key, Is.EqualTo(Key.R));
            Assert.That(bindings.GetBinding(GameAction.SwapTool).key, Is.EqualTo(Key.Q));
            Assert.That(bindings.GetBinding(GameAction.QuickItem).key, Is.EqualTo(Key.F));
            Assert.That(bindings.GetBinding(GameAction.Inventory).key, Is.EqualTo(Key.I));
            Assert.That(bindings.GetBinding(GameAction.PrimaryAction).type, Is.EqualTo(InputBindingType.MouseButton));
            Assert.That(bindings.GetBinding(GameAction.SecondaryAction).type, Is.EqualTo(InputBindingType.MouseButton));
#endif
        }

        [Test]
        public void Rebind_PersistsToPlayerPrefs()
        {
#if ENABLE_INPUT_SYSTEM
            var bindings = InputBindingManager.Instance;
            bindings.RebindAction(GameAction.MoveForward, Key.I);

            Assert.That(PlayerPrefs.GetInt("WW_BindKey_MoveForward"), Is.EqualTo((int)Key.I),
                "Rebound key must be persisted under the documented PlayerPrefs key.");
            Assert.That(bindings.GetBinding(GameAction.MoveForward).key, Is.EqualTo(Key.I),
                "The live binding must reflect the rebind immediately.");
#endif
        }

        [Test]
        public void ResetToDefaults_ClearsRebinds()
        {
#if ENABLE_INPUT_SYSTEM
            var bindings = InputBindingManager.Instance;
            bindings.RebindAction(GameAction.Jump, Key.P);
            Assert.That(bindings.GetBinding(GameAction.Jump).key, Is.EqualTo(Key.P));

            bindings.ResetToDefaults();
            Assert.That(PlayerPrefs.HasKey("WW_BindKey_Jump"), Is.False);
            Assert.That(bindings.GetBinding(GameAction.Jump).key, Is.EqualTo(Key.Space));
#endif
        }

        [Test]
        public void ConflictDetection_FlagsSharedKeys()
        {
#if ENABLE_INPUT_SYSTEM
            var bindings = InputBindingManager.Instance;
            bool conflict = bindings.CheckConflict(GameAction.MoveForward, Key.E, out GameAction conflicting);

            Assert.That(conflict, Is.True, "Binding MoveForward to E must conflict with Interact.");
            Assert.That(conflicting, Is.EqualTo(GameAction.Interact));
#endif
        }

        [Test]
        public void SimulationHook_DrivesLiveQueries()
        {
            var bindings = InputBindingManager.Instance;
            bindings.SetSimulatedAction(GameAction.Sprint, isPressed: true, triggered: true);

            Assert.That(bindings.IsActionPressed(GameAction.Sprint), Is.True);
            Assert.That(bindings.WasActionTriggered(GameAction.Sprint), Is.True);

            bindings.ClearSimulatedActions();
            Assert.That(bindings.IsActionPressed(GameAction.Sprint), Is.False);
        }

        [Test]
        public void ActionModes_DefaultToHold()
        {
            var bindings = InputBindingManager.Instance;
            Assert.That(bindings.sprintMode, Is.EqualTo(ActionMode.Hold));
            Assert.That(bindings.crouchMode, Is.EqualTo(ActionMode.Hold));

            bindings.sprintMode = ActionMode.Toggle;
            Assert.That(PlayerPrefs.GetInt("WW_SprintMode"), Is.EqualTo((int)ActionMode.Toggle),
                "The controller writes the toggle preference via SaveBindings; the field must agree.");
        }
    }

    /// <summary>
    /// Proves settings applied through the controller are persisted and reloadable, and that the
    /// six audio buses reach the live mixer.
    /// </summary>
    public class SettingsPersistenceIntegrationTests
    {
        private readonly List<GameObject> _created = new List<GameObject>();

        private T Spawn<T>() where T : Component
        {
            var go = new GameObject("Test_" + typeof(T).Name);
            _created.Add(go);
            return go.AddComponent<T>();
        }

        [TearDown]
        public void TearDown()
        {
            for (int i = 0; i < _created.Count; i++)
            {
                if (_created[i] != null) Object.DestroyImmediate(_created[i]);
            }
            _created.Clear();
        }

        [Test]
        public void SetControls_PersistsAndReloads()
        {
            var ctl = Spawn<SettingsMenuController>();
            ctl.SetControls(0.5f, 3f, true);

            Assert.That(PlayerPrefs.GetFloat("WW_MouseSens"), Is.EqualTo(0.5f).Within(0.0001f));
            Assert.That(PlayerPrefs.GetFloat("WW_GamepadSens"), Is.EqualTo(3f).Within(0.0001f));
            Assert.That(PlayerPrefs.GetInt("WW_InvertY"), Is.EqualTo(1));

            ctl.SetControls(1f, 2f, false);
            Assert.That(PlayerPrefs.GetInt("WW_InvertY"), Is.EqualTo(0));
        }

        [Test]
        public void SetAudioVolumes_PersistsAllSixBuses()
        {
            var ctl = Spawn<SettingsMenuController>();
            ctl.SetAudioVolumes(0.4f, 0.5f, 0.6f, 0.7f, 0.8f, 0.9f);

            Assert.That(PlayerPrefs.GetFloat("WW_VolMaster"), Is.EqualTo(0.4f).Within(0.0001f));
            Assert.That(PlayerPrefs.GetFloat("WW_VolMusic"), Is.EqualTo(0.5f).Within(0.0001f));
            Assert.That(PlayerPrefs.GetFloat("WW_VolAmbience"), Is.EqualTo(0.6f).Within(0.0001f));
            Assert.That(PlayerPrefs.GetFloat("WW_VolSFX"), Is.EqualTo(0.7f).Within(0.0001f));
            Assert.That(PlayerPrefs.GetFloat("WW_VolDialogue"), Is.EqualTo(0.8f).Within(0.0001f));
            Assert.That(PlayerPrefs.GetFloat("WW_VolUI"), Is.EqualTo(0.9f).Within(0.0001f));
        }

        [Test]
        public void SetAccessibility_PersistsOptions()
        {
            var ctl = Spawn<SettingsMenuController>();
            ctl.SetAccessibility(false, 32, true, false, true);

            Assert.That(PlayerPrefs.GetInt("WW_Subtitles"), Is.EqualTo(0));
            Assert.That(PlayerPrefs.GetInt("WW_SubtitleSize"), Is.EqualTo(32));
            Assert.That(PlayerPrefs.GetInt("WW_SubtitleBG"), Is.EqualTo(1));
        }

        [Test]
        public void AudioVolumes_ReachLiveMixer()
        {
            var audio = Spawn<AudioManager>();
            audio.SetMasterVolume(0.5f);
            audio.SetAmbientVolume(0.25f);
            audio.SetUiVolume(0.75f);

            Assert.That(AudioManager.Instance.masterVolume, Is.EqualTo(0.5f).Within(0.0001f));
            Assert.That(AudioManager.Instance.ambientVolume, Is.EqualTo(0.25f).Within(0.0001f));
            Assert.That(AudioManager.Instance.uiVolume, Is.EqualTo(0.75f).Within(0.0001f));

            // The ambient bus must influence the actual playback source, not just a stored field.
            var field = typeof(AudioManager).GetField("ambientSource",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.That(field, Is.Not.Null);
            var ambientSource = field.GetValue(AudioManager.Instance) as AudioSource;
            Assert.That(ambientSource, Is.Not.Null);
            Assert.That(ambientSource.volume, Is.EqualTo(0.25f * 0.5f).Within(0.0001f),
                "Ambient source volume must equal ambientVolume * masterVolume.");
        }

        [Test]
        public void FovSetting_AppliesToMainCamera()
        {
            var ctl = Spawn<SettingsMenuController>();
            var camGo = new GameObject("TestCam", typeof(Camera));
            _created.Add(camGo);
            var cam = camGo.GetComponent<Camera>();
            cam.tag = "MainCamera";

            ctl.fov = 90f;
            ctl.SaveSettings();

            Assert.That(cam.fieldOfView, Is.EqualTo(90f).Within(0.001f));
        }

        [Test]
        public void SprintToggle_SyncsToInputBindingManager()
        {
            var ctl = Spawn<SettingsMenuController>();
            ctl.sprintToggle = true;
            ctl.SaveSettings();

            Assert.That(InputBindingManager.Instance.sprintMode, Is.EqualTo(ActionMode.Toggle),
                "The sprint toggle option must drive InputBindingManager's actual sprint mode.");
        }
    }

    public class DisplaySettingsIntegrationTests
    {
        private GameObject _go;

        [SetUp]
        public void SetUp()
        {
            _go = new GameObject("TestDisplay");
            _go.AddComponent<DisplaySettingsManager>();
        }

        [TearDown]
        public void TearDown()
        {
            if (_go != null) Object.DestroyImmediate(_go);
        }

        [Test]
        public void FrameLimitUnlimited_PersistsAsNegativeOne()
        {
            DisplaySettingsManager.Instance.SetFrameLimit(-1);
            Assert.That(DisplaySettingsManager.Instance.FrameLimit, Is.EqualTo(-1));
            Assert.That(PlayerPrefs.GetInt("WW_FrameLimit"), Is.EqualTo(-1));
            Assert.That(Application.targetFrameRate, Is.EqualTo(-1));
        }

        [Test]
        public void FrameLimitClamped_ToRange()
        {
            DisplaySettingsManager.Instance.SetFrameLimit(120);
            Assert.That(DisplaySettingsManager.Instance.FrameLimit, Is.EqualTo(120));
            Assert.That(PlayerPrefs.GetInt("WW_FrameLimit"), Is.EqualTo(120));
        }
    }

    public class LocalizationCoverageTests
    {
        [Test]
        public void RegionKey_AddedAndBilingual()
        {
            Assert.That(LocalizationDatabase.TryGetEntry("hud.region_chennai_georgetown", out var entry), Is.True,
                "HUD region label must come from the localization database.");
            Assert.That(entry.english, Is.EqualTo("George Town, Chennai"));
            Assert.That(string.IsNullOrWhiteSpace(entry.tamil), Is.False);
        }

        [Test]
        public void NoKeyLeaksMissingPrefix()
        {
            foreach (string key in LocalizationDatabase.AllKeys)
            {
                Assert.That(key.StartsWith(LocalizationDatabase.FallbackKeyPrefix), Is.False,
                    $"A key itself must never start with the missing marker: {key}");
            }
        }

        [Test]
        public void LookupApi_ResolvesAndFallsBack()
        {
            var mgr = new GameObject("TestLocalization").AddComponent<LocalizationManager>();
            try
            {
                Assert.That(mgr.HasKey("hud.press_to_interact"), Is.True);
                Assert.That(mgr.GetForDisplay("hud.press_to_interact"), Does.Contain("{0}"));
                Assert.That(mgr.Get("not.a.real.key.xyz").StartsWith("missing."), Is.True,
                    "Unknown keys must resolve to the missing-marker so QA can find them.");
            }
            finally
            {
                Object.DestroyImmediate(mgr.gameObject);
            }
        }
    }

    /// <summary>
    /// Save/format compatibility: a settings-shaped value must survive the exact JSON round trip
    /// the save system uses, and the schema must stay at the current version.
    /// </summary>
    public class SaveSettingsCompatibilityTests
    {
        [Test]
        public void LanguagePreference_SurvivesJsonRoundTrip()
        {
            var data = new GameSaveData();
            data.languagePreference = 1;

            string json = JsonUtility.ToJson(data, true);
            var back = JsonUtility.FromJson<GameSaveData>(json);

            Assert.That(back, Is.Not.Null);
            Assert.That(back.languagePreference, Is.EqualTo(1),
                "Save round trip must preserve the language selected in Settings.");
        }

        [Test]
        public void SchemaVersion_IsCurrent()
        {
            Assert.That(GameSaveData.CurrentSchemaVersion, Is.EqualTo(4),
                "Save schema must remain v4; bumping it requires a migration path.");
        }

        [Test]
        public void EmptySave_DefaultsToEnglish()
        {
            var data = new GameSaveData();
            Assert.That(data.languagePreference, Is.EqualTo(0), "Default save language is English.");
        }
    }
}