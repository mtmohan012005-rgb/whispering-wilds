using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.UI;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Tests.Editor
{
    /// <summary>
    /// STEP 40 — Tests for cinematic intro and main menu overhaul.
    /// Verifies Codex removal, menu button presence, intro controller behavior,
    /// and localization keys.
    /// </summary>
    [TestFixture]
    public class Step40MainMenuTests
    {
        [Test]
        public void TitleMenuController_HasNoCodexButton_Field()
        {
            // Verify that TitleMenuController no longer has a codexButton field
            var type = typeof(TitleMenuController);
            var field = type.GetField("codexButton", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNull(field, "TitleMenuController should not have a codexButton field");
        }

        [Test]
        public void TitleMenuController_HasNoCodexPanel_Field()
        {
            var type = typeof(TitleMenuController);
            var field = type.GetField("codexPanel", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNull(field, "TitleMenuController should not have a codexPanel field");
        }

        [Test]
        public void TitleMenuController_HasNoOnOpenCodexClicked_Method()
        {
            var type = typeof(TitleMenuController);
            var method = type.GetMethod("OnOpenCodexClicked", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNull(method, "TitleMenuController should not have OnOpenCodexClicked method");
        }

        [Test]
        public void TitleMenuController_HasNoOnCloseCodexClicked_Method()
        {
            var type = typeof(TitleMenuController);
            var method = type.GetMethod("OnCloseCodexClicked", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNull(method, "TitleMenuController should not have OnCloseCodexClicked method");
        }

        [Test]
        public void TitleMenuController_HasNewGameButton_Field()
        {
            var type = typeof(TitleMenuController);
            var field = type.GetField("newGameButton", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(field, "TitleMenuController should have a newGameButton field");
            Assert.AreEqual(typeof(Button), field.FieldType, "newGameButton should be of type Button");
        }

        [Test]
        public void TitleMenuController_HasContinueButton_Field()
        {
            var type = typeof(TitleMenuController);
            var field = type.GetField("continueButton", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(field, "TitleMenuController should have a continueButton field");
            Assert.AreEqual(typeof(Button), field.FieldType, "continueButton should be of type Button");
        }

        [Test]
        public void TitleMenuController_HasSettingsButton_Field()
        {
            var type = typeof(TitleMenuController);
            var field = type.GetField("settingsButton", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(field, "TitleMenuController should have a settingsButton field");
            Assert.AreEqual(typeof(Button), field.FieldType, "settingsButton should be of type Button");
        }

        [Test]
        public void TitleMenuController_HasQuitButton_Field()
        {
            var type = typeof(TitleMenuController);
            var field = type.GetField("quitButton", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(field, "TitleMenuController should have a quitButton field");
            Assert.AreEqual(typeof(Button), field.FieldType, "quitButton should be of type Button");
        }

        [Test]
        public void TitleMenuController_HasCinematicIntro_Field()
        {
            var type = typeof(TitleMenuController);
            var field = type.GetField("cinematicIntro", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(field, "TitleMenuController should have a cinematicIntro field");
            Assert.AreEqual(typeof(CinematicIntroController), field.FieldType, "cinematicIntro should be of type CinematicIntroController");
        }

        [Test]
        public void CinematicIntroController_Exists()
        {
            var type = typeof(CinematicIntroController);
            Assert.IsNotNull(type, "CinematicIntroController should exist");
            Assert.IsTrue(type.IsSubclassOf(typeof(MonoBehaviour)), "CinematicIntroController should inherit from MonoBehaviour");
        }

        [Test]
        public void CinematicIntroController_HasSkipIntro_Method()
        {
            var type = typeof(CinematicIntroController);
            var method = type.GetMethod("SkipIntro", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(method, "CinematicIntroController should have SkipIntro method");
        }

        [Test]
        public void CinematicIntroController_HasReplayIntro_Method()
        {
            var type = typeof(CinematicIntroController);
            var method = type.GetMethod("ReplayIntro", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(method, "CinematicIntroController should have ReplayIntro method");
        }

        [Test]
        public void CinematicIntroController_HasIntroPlayed_Property()
        {
            var type = typeof(CinematicIntroController);
            var prop = type.GetProperty("IntroPlayed");
            Assert.IsNotNull(prop, "CinematicIntroController should have IntroPlayed property");
            Assert.AreEqual(typeof(bool), prop.PropertyType, "IntroPlayed should be of type bool");
        }

        [Test]
        public void CinematicIntroController_HasIsPlaying_Property()
        {
            var type = typeof(CinematicIntroController);
            var prop = type.GetProperty("IsPlaying");
            Assert.IsNotNull(prop, "CinematicIntroController should have IsPlaying property");
            Assert.AreEqual(typeof(bool), prop.PropertyType, "IsPlaying should be of type bool");
        }

        [Test]
        public void LocalizationManager_HasIntroSkip_Key()
        {
            // Verify the intro.skip localization key exists
            var type = typeof(LocalizationManager);
            var entriesField = type.GetField("Entries", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            Assert.IsNotNull(entriesField, "LocalizationManager should have Entries field");

            var entries = entriesField.GetValue(null) as System.Collections.IList;
            Assert.IsNotNull(entries, "Entries should not be null");

            bool found = false;
            foreach (var entry in entries)
            {
                var keyProp = entry.GetType().GetProperty("Key");
                if (keyProp != null)
                {
                    var key = keyProp.GetValue(entry) as string;
                    if (key == "intro.skip")
                    {
                        found = true;
                        break;
                    }
                }
            }
            Assert.IsTrue(found, "LocalizationManager should have intro.skip key");
        }

        [Test]
        public void LocalizationManager_HasIntroReplay_Key()
        {
            var type = typeof(LocalizationManager);
            var entriesField = type.GetField("Entries", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var entries = entriesField.GetValue(null) as System.Collections.IList;

            bool found = false;
            foreach (var entry in entries)
            {
                var keyProp = entry.GetType().GetProperty("Key");
                if (keyProp != null)
                {
                    var key = keyProp.GetValue(entry) as string;
                    if (key == "intro.replay")
                    {
                        found = true;
                        break;
                    }
                }
            }
            Assert.IsTrue(found, "LocalizationManager should have intro.replay key");
        }

        [Test]
        public void LocalizationManager_HasNoCodex_Key()
        {
            var type = typeof(LocalizationManager);
            var entriesField = type.GetField("Entries", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var entries = entriesField.GetValue(null) as System.Collections.IList;

            bool found = false;
            foreach (var entry in entries)
            {
                var keyProp = entry.GetType().GetProperty("Key");
                if (keyProp != null)
                {
                    var key = keyProp.GetValue(entry) as string;
                    if (key == "menu.codex")
                    {
                        found = true;
                        break;
                    }
                }
            }
            Assert.IsFalse(found, "LocalizationManager should not have menu.codex key");
        }

        [Test]
        public void LocalizationManager_HasMenuNewGame_Key()
        {
            var type = typeof(LocalizationManager);
            var entriesField = type.GetField("Entries", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var entries = entriesField.GetValue(null) as System.Collections.IList;

            bool found = false;
            foreach (var entry in entries)
            {
                var keyProp = entry.GetType().GetProperty("Key");
                if (keyProp != null)
                {
                    var key = keyProp.GetValue(entry) as string;
                    if (key == "menu.new_game")
                    {
                        found = true;
                        break;
                    }
                }
            }
            Assert.IsTrue(found, "LocalizationManager should have menu.new_game key");
        }

        [Test]
        public void LocalizationManager_HasMenuContinue_Key()
        {
            var type = typeof(LocalizationManager);
            var entriesField = type.GetField("Entries", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var entries = entriesField.GetValue(null) as System.Collections.IList;

            bool found = false;
            foreach (var entry in entries)
            {
                var keyProp = entry.GetType().GetProperty("Key");
                if (keyProp != null)
                {
                    var key = keyProp.GetValue(entry) as string;
                    if (key == "menu.continue")
                    {
                        found = true;
                        break;
                    }
                }
            }
            Assert.IsTrue(found, "LocalizationManager should have menu.continue key");
        }

        [Test]
        public void LocalizationManager_HasMenuSettings_Key()
        {
            var type = typeof(LocalizationManager);
            var entriesField = type.GetField("Entries", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var entries = entriesField.GetValue(null) as System.Collections.IList;

            bool found = false;
            foreach (var entry in entries)
            {
                var keyProp = entry.GetType().GetProperty("Key");
                if (keyProp != null)
                {
                    var key = keyProp.GetValue(entry) as string;
                    if (key == "menu.settings")
                    {
                        found = true;
                        break;
                    }
                }
            }
            Assert.IsTrue(found, "LocalizationManager should have menu.settings key");
        }

        [Test]
        public void LocalizationManager_HasMenuQuit_Key()
        {
            var type = typeof(LocalizationManager);
            var entriesField = type.GetField("Entries", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var entries = entriesField.GetValue(null) as System.Collections.IList;

            bool found = false;
            foreach (var entry in entries)
            {
                var keyProp = entry.GetType().GetProperty("Key");
                if (keyProp != null)
                {
                    var key = keyProp.GetValue(entry) as string;
                    if (key == "menu.quit")
                    {
                        found = true;
                        break;
                    }
                }
            }
            Assert.IsTrue(found, "LocalizationManager should have menu.quit key");
        }

        [Test]
        public void TitleMenuController_HasOnNewGameClicked_Method()
        {
            var type = typeof(TitleMenuController);
            var method = type.GetMethod("OnNewGameClicked", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(method, "TitleMenuController should have OnNewGameClicked method");
        }

        [Test]
        public void TitleMenuController_HasOnContinueClicked_Method()
        {
            var type = typeof(TitleMenuController);
            var method = type.GetMethod("OnContinueClicked", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(method, "TitleMenuController should have OnContinueClicked method");
        }

        [Test]
        public void TitleMenuController_HasOnSettingsClicked_Method()
        {
            var type = typeof(TitleMenuController);
            var method = type.GetMethod("OnSettingsClicked", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(method, "TitleMenuController should have OnSettingsClicked method");
        }

        [Test]
        public void TitleMenuController_HasOnQuitClicked_Method()
        {
            var type = typeof(TitleMenuController);
            var method = type.GetMethod("OnQuitClicked", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(method, "TitleMenuController should have OnQuitClicked method");
        }

        [Test]
        public void TitleMenuController_HasApplyLocalizedLabels_Method()
        {
            var type = typeof(TitleMenuController);
            var method = type.GetMethod("ApplyLocalizedLabels", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(method, "TitleMenuController should have ApplyLocalizedLabels method");
        }
    }
}
