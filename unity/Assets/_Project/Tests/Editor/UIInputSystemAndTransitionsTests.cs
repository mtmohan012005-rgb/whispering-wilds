#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class UIInputSystemAndTransitionsTests
    {
        private GameObject _testHost;
        private LoginUI _loginUI;

        [SetUp]
        public void SetUp()
        {
            _testHost = new GameObject("TestUIHost");
            _loginUI = _testHost.AddComponent<LoginUI>();
        }

        [TearDown]
        public void TearDown()
        {
            if (_testHost != null)
            {
                Object.DestroyImmediate(_testHost);
            }
        }

        [Test]
        public void TestTitleMenuController_UsesInputSystemGuards_NoUnguardedLegacyInput()
        {
            string path = "Assets/_Project/Scripts/UI/TitleMenuController.cs";
            Assert.IsTrue(File.Exists(path), "TitleMenuController.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("Keyboard.current"), "TitleMenuController must use Keyboard.current under New Input System");
            Assert.IsTrue(code.Contains("#if ENABLE_INPUT_SYSTEM"), "TitleMenuController must guard New Input System with #if ENABLE_INPUT_SYSTEM");
            Assert.IsTrue(code.Contains("CompleteIntro()"), "TitleMenuController must expose CompleteIntro() method");
        }

        [Test]
        public void TestMainMenuAnimator_Update_UsesInputSystemMouseParallax()
        {
            string path = "Assets/_Project/Scripts/UI/MainMenuAnimator.cs";
            Assert.IsTrue(File.Exists(path), "MainMenuAnimator.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("Mouse.current != null ? Mouse.current.position.ReadValue()"),
                "MainMenuAnimator must use Mouse.current.position.ReadValue() with null check");
            Assert.IsTrue(code.Contains("#if ENABLE_INPUT_SYSTEM"),
                "MainMenuAnimator must guard New Input System with #if ENABLE_INPUT_SYSTEM");
        }

        [Test]
        public void TestGameModeSelectionUI_Update_UsesInputSystemGuards()
        {
            string path = "Assets/_Project/Scripts/UI/GameModeSelectionUI.cs";
            Assert.IsTrue(File.Exists(path), "GameModeSelectionUI.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame"),
                "GameModeSelectionUI must check Keyboard.current.escapeKey.wasPressedThisFrame");
            Assert.IsTrue(code.Contains("#if ENABLE_INPUT_SYSTEM"),
                "GameModeSelectionUI must guard New Input System with #if ENABLE_INPUT_SYSTEM");
        }

        [Test]
        public void TestSaveManagementUI_Update_UsesInputSystemGuards()
        {
            string path = "Assets/_Project/Scripts/UI/SaveManagementUI.cs";
            Assert.IsTrue(File.Exists(path), "SaveManagementUI.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame"),
                "SaveManagementUI must check Keyboard.current.escapeKey.wasPressedThisFrame");
            Assert.IsTrue(code.Contains("#if ENABLE_INPUT_SYSTEM"),
                "SaveManagementUI must guard New Input System with #if ENABLE_INPUT_SYSTEM");
        }

        [Test]
        public void TestLoginUI_HasCanvasGroup_AlphaZeroAndTransitionSupported()
        {
            Assert.IsNotNull(_loginUI, "LoginUI component must be present");
            _loginUI.EnsureCanvasGroup();

            var cg = _testHost.GetComponent<CanvasGroup>();
            Assert.IsNotNull(cg, "CanvasGroup must be present on LoginUI host");
            Assert.AreEqual(0f, cg.alpha, 0.01f, "CanvasGroup alpha must be initialized to 0");
            Assert.IsFalse(cg.interactable, "CanvasGroup must not be interactable when hidden");
            Assert.IsFalse(cg.blocksRaycasts, "CanvasGroup must not block raycasts when hidden");
        }

        [Test]
        public void TestCinematicIntroController_DurationAndCompleteIntroCallback()
        {
            string path = "Assets/_Project/Scripts/UI/CinematicIntroController.cs";
            Assert.IsTrue(File.Exists(path), "CinematicIntroController.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("totalDuration = 9.5f"), "CinematicIntroController totalDuration must be ~9.5s");
            Assert.IsTrue(code.Contains("titleMenuController.CompleteIntro()"), "CinematicIntroController must call CompleteIntro on titleMenuController");
        }

        [Test]
        public void TestBootScene_LoginOverlay_AlphaMatchesIntendedOpacity()
        {
            string path = "Assets/_Project/Scripts/Editor/BuildBootScene.cs";
            Assert.IsTrue(File.Exists(path), "BuildBootScene.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("0.72f"), "BuildBootScene.cs must configure login overlay to ~0.72 alpha");
        }

        [Test]
        public void TestCinematicIntroController_CenteredTitleCardAndStartButtonArchitecture()
        {
            string path = "Assets/_Project/Scripts/UI/CinematicIntroController.cs";
            Assert.IsTrue(File.Exists(path), "CinematicIntroController.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("startButton"), "CinematicIntroController must have startButton field");
            Assert.IsTrue(code.Contains("OnStartButtonClicked"), "CinematicIntroController must expose OnStartButtonClicked handler");
            Assert.IsTrue(code.Contains("IntroPhase"), "CinematicIntroController must define IntroPhase enum");
            Assert.IsTrue(code.Contains("TitleScreenReady"), "CinematicIntroController must support TitleScreenReady phase");
            Assert.IsTrue(code.Contains("TransitioningToMenu"), "CinematicIntroController must support TransitioningToMenu phase");
            Assert.IsTrue(code.Contains("ShowTitleScreenImmediately"), "CinematicIntroController must support fast-forwarding to Title Screen on skip");
        }

        [Test]
        public void TestBuildBootScene_BuildsCenteredTitleCardAndStartButton()
        {
            string path = "Assets/_Project/Scripts/Editor/BuildBootScene.cs";
            Assert.IsTrue(File.Exists(path), "BuildBootScene.cs must exist");
            string code = File.ReadAllText(path);

            Assert.IsTrue(code.Contains("Btn_TitleStart"), "BuildBootScene must construct Btn_TitleStart button");
            Assert.IsTrue(code.Contains("TitleBackGlow"), "BuildBootScene must construct TitleBackGlow radial halo");
            Assert.IsTrue(code.Contains("THE WHISPERING WILDS"), "BuildBootScene must set English title");
            Assert.IsTrue(code.Contains(@"\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1"), "BuildBootScene must set Tamil subtitle Unicode");
            Assert.IsTrue(code.Contains("serializedIntro.FindProperty(\"startButton\")"), "BuildBootScene must bind startButton to CinematicIntroController");
        }

        [Test]
        public void TestTitleMenuController_AllTenCoreFeaturesWired()
        {
            string path = "Assets/_Project/Scripts/UI/TitleMenuController.cs";
            Assert.IsTrue(File.Exists(path), "TitleMenuController.cs must exist");
            string code = File.ReadAllText(path);

            // 1. New Game
            Assert.IsTrue(code.Contains("OnNewGameClicked") || code.Contains("ExecuteNewGame"), "TitleMenuController must support New Game");
            // 2. Continue
            Assert.IsTrue(code.Contains("OnContinueClicked"), "TitleMenuController must support Continue");
            // 3. Game Mode Selection
            Assert.IsTrue(code.Contains("OnBeginGameClicked") && code.Contains("gameModeSelectionUI"), "TitleMenuController must support Game Mode Selection");
            // 4. Previous Journey
            Assert.IsTrue(code.Contains("OnPreviousJourneyClicked") && code.Contains("savedGamesUI"), "TitleMenuController must support Previous Journey");
            // 5. Backups & Saves
            Assert.IsTrue(code.Contains("OnBackupsSavesClicked") && code.Contains("saveManagementUI"), "TitleMenuController must support Backups & Saves");
            // 6. Multiplayer Lobby
            Assert.IsTrue(code.Contains("OnCoopClicked") && code.Contains("CoopLobbyUI"), "TitleMenuController must support Multiplayer Lobby");
            // 7. Settings
            Assert.IsTrue(code.Contains("OnSettingsClicked") && code.Contains("settingsMenu"), "TitleMenuController must support Settings");
            // 8. Account / Login
            Assert.IsTrue(code.Contains("OnAccountClicked") && code.Contains("loginUI"), "TitleMenuController must support Account / Login");
            // 9. Developer Credits
            Assert.IsTrue(code.Contains("OnCreditsClicked") && code.Contains("creditsUI"), "TitleMenuController must support Developer Credits");
            // 10. Quit Game
            Assert.IsTrue(code.Contains("OnQuitClicked") && code.Contains("confirmationDialog"), "TitleMenuController must support Quit Game confirmation");
        }
    }
}
#endif
