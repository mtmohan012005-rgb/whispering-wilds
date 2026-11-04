using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.UI;
using WhisperingWilds.Online;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Editor
{
    public static class CaptureCinematicMenuScreenshots
    {
        [MenuItem("Whispering Wilds/Build Boot Scene And Capture All")]
        public static void BuildAndCaptureAll()
        {
            BuildBootScene.CreateBootScene();
            CaptureAll();
        }

        [MenuItem("Whispering Wilds/Capture Cinematic Menu Screenshots")]
        public static void CaptureAll()
        {
            Debug.Log("<color=#00D2FF><b>[CaptureCinematicMenuScreenshots]</b></color> Opening 00_Boot scene...");
            var scene = EditorSceneManager.OpenScene("Assets/_Project/Scenes/00_Boot.unity", OpenSceneMode.Single);

            var canvas = UnityEngine.Object.FindAnyObjectByType<Canvas>();
            var cam = Camera.main ?? UnityEngine.Object.FindAnyObjectByType<Camera>();
            var titleMenu = UnityEngine.Object.FindAnyObjectByType<TitleMenuController>(FindObjectsInactive.Include);
            var gameModeUI = UnityEngine.Object.FindAnyObjectByType<GameModeSelectionUI>(FindObjectsInactive.Include);
            var saveMgmtUI = UnityEngine.Object.FindAnyObjectByType<SaveManagementUI>(FindObjectsInactive.Include);
            var savedGamesUI = UnityEngine.Object.FindAnyObjectByType<SavedGamesUI>(FindObjectsInactive.Include);
            var settingsUI = UnityEngine.Object.FindAnyObjectByType<SettingsMenuUI>(FindObjectsInactive.Include);
            var creditsUI = UnityEngine.Object.FindAnyObjectByType<CreditsUI>(FindObjectsInactive.Include);
            var loginUI = UnityEngine.Object.FindAnyObjectByType<LoginUI>(FindObjectsInactive.Include);
            var coopLobbyUI = UnityEngine.Object.FindAnyObjectByType<CoopLobbyUI>(FindObjectsInactive.Include);
            var confirmDialog = UnityEngine.Object.FindAnyObjectByType<ConfirmationDialog>(FindObjectsInactive.Include);
            var introCtrl = UnityEngine.Object.FindAnyObjectByType<CinematicIntroController>(FindObjectsInactive.Include);
            var locMgr = LocalizationManager.Instance;

            if (canvas == null || cam == null || titleMenu == null)
            {
                Debug.LogError($"[CaptureCinematicMenuScreenshots] Missing core references: canvas={canvas}, cam={cam}, titleMenu={titleMenu}");
                return;
            }

            var origRenderMode = canvas.renderMode;
            var origCamera = canvas.worldCamera;
            var origPlaneDist = canvas.planeDistance;

            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = cam;
            canvas.planeDistance = 1.0f;

            string projectRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            string docsDir = Path.Combine(projectRoot, "docs", "screenshots");
            string recordingsDir = Path.Combine(projectRoot, "docs", "recordings");
            string seqDir = Path.Combine(recordingsDir, "sequence");
            string brainDir = Environment.GetEnvironmentVariable("BRAIN_DIR") ?? @"C:\Users\mohan\.gemini\antigravity\brain\3d27ecb2-40ff-4f3c-b5c3-b19295e00ad9";

            Directory.CreateDirectory(docsDir);
            Directory.CreateDirectory(recordingsDir);
            Directory.CreateDirectory(seqDir);
            Directory.CreateDirectory(brainDir);

            var resolutions = new (int width, int height, string label)[]
            {
                (1920, 1080, "1920x1080"),
                (1600, 900, "1600x900"),
                (1366, 768, "1366x768")
            };

            // Grab references to background and intro layers
            var menuBgObj = canvas.transform.Find("MenuBackground")?.gameObject;
            var mist1Obj = canvas.transform.Find("MenuMistLayer1")?.gameObject;
            var mist2Obj = canvas.transform.Find("MenuMistLayer2")?.gameObject;
            var firefliesObj = canvas.transform.Find("MenuFireflies")?.gameObject;
            var raysObj = canvas.transform.Find("MenuLightRays")?.gameObject;
            var vignetteObj = canvas.transform.Find("MenuVignette")?.gameObject;

            var introBgObj = canvas.transform.Find("IntroBackground")?.gameObject;
            var introTempleObj = canvas.transform.Find("IntroTempleLayer")?.gameObject;
            var introSkyObj = canvas.transform.Find("IntroSkyGradient")?.gameObject;
            var introTreeObj = canvas.transform.Find("IntroTreeline")?.gameObject;
            var introMistObj = canvas.transform.Find("IntroMist")?.gameObject;
            var introVigObj = canvas.transform.Find("IntroVignette")?.gameObject;
            var introTitleGroup = canvas.transform.Find("IntroTitleGroup")?.gameObject;
            var introSkipText = canvas.transform.Find("IntroSkipText")?.gameObject;
            var menuRoot = canvas.transform.Find("MenuRoot")?.gameObject;
            var menuContainer = canvas.transform.Find("MenuRoot/MenuContainer")?.gameObject;

            void EnsureBackgroundAtmosphereActive()
            {
                if (menuBgObj != null) menuBgObj.SetActive(true);
                if (mist1Obj != null) mist1Obj.SetActive(true);
                if (mist2Obj != null) mist2Obj.SetActive(true);
                if (firefliesObj != null) firefliesObj.SetActive(true);
                if (raysObj != null) raysObj.SetActive(true);
                if (vignetteObj != null) vignetteObj.SetActive(true);
            }

            void HideIntroLayers()
            {
                if (introBgObj != null) introBgObj.SetActive(false);
                if (introTempleObj != null) introTempleObj.SetActive(false);
                if (introSkyObj != null) introSkyObj.SetActive(false);
                if (introTreeObj != null) introTreeObj.SetActive(false);
                if (introMistObj != null) introMistObj.SetActive(false);
                if (introVigObj != null) introVigObj.SetActive(false);
                if (introTitleGroup != null) introTitleGroup.SetActive(false);
                if (introSkipText != null) introSkipText.SetActive(false);
            }

            void CloseAll()
            {
                HideIntroLayers();
                EnsureBackgroundAtmosphereActive();
                if (menuRoot != null) menuRoot.SetActive(true);
                if (menuContainer != null) menuContainer.SetActive(true);

                titleMenu.CloseAllModals();
                if (gameModeUI != null) gameModeUI.SetVisible(false);
                if (saveMgmtUI != null) saveMgmtUI.SetVisible(false);
                if (savedGamesUI != null) savedGamesUI.SetVisible(false);
                if (settingsUI != null) settingsUI.SetVisible(false);
                if (creditsUI != null) creditsUI.SetVisible(false);
                if (loginUI != null) loginUI.SetVisible(false);
                CoopLobbyUI.Hide();
                if (confirmDialog != null) confirmDialog.Dismiss();
            }

            // -------------------------------------------------------------
            // PHASE 1: CINEMATIC INTRO SHOTS
            // -------------------------------------------------------------
            // 00a. Intro - Temple Reveal through Dawn Mist
            HideIntroLayers();
            EnsureBackgroundAtmosphereActive();
            if (menuRoot != null) menuRoot.SetActive(false);
            if (introTempleObj != null)
            {
                introTempleObj.SetActive(true);
                var tImg = introTempleObj.GetComponent<Image>();
                if (tImg != null) tImg.color = new Color(1f, 1f, 1f, 0.90f);
            }
            if (introSkyObj != null) introSkyObj.SetActive(true);
            if (introTreeObj != null) introTreeObj.SetActive(true);
            if (introMistObj != null) introMistObj.SetActive(true);
            if (introVigObj != null) introVigObj.SetActive(true);
            if (introSkipText != null)
            {
                introSkipText.SetActive(true);
                var sTxt = introSkipText.GetComponent<Text>();
                if (sTxt != null) sTxt.color = new Color(0.8f, 0.85f, 0.9f, 0.8f);
            }
            CaptureView("00_intro_temple_reveal", resolutions, cam, docsDir, brainDir);

            // 00b. Intro - Title & Tamil Subtitle Reveal
            if (introTitleGroup != null)
            {
                introTitleGroup.SetActive(true);
                var tt = introTitleGroup.transform.Find("IntroTitleText")?.GetComponent<Text>();
                if (tt != null) tt.color = new Color(1f, 0.85f, 0.35f, 1f);
                var st = introTitleGroup.transform.Find("IntroSubtitleText")?.GetComponent<Text>();
                if (st != null)
                {
                    st.text = "காட்டு வழி • தடம்";
                    st.color = new Color(0.70f, 0.88f, 0.78f, 0.95f);
                }
            }
            CaptureView("00_intro_title_reveal", resolutions, cam, docsDir, brainDir);

            // -------------------------------------------------------------
            // PHASE 2 & 3: MAIN MENU (ENGLISH & TAMIL)
            // -------------------------------------------------------------
            // 1. MAIN MENU ENGLISH
            locMgr?.SetLanguage(Language.English);
            titleMenu.ApplyLocalizedLabels();
            CloseAll();
            CaptureView("01_main_menu_english", resolutions, cam, docsDir, brainDir);

            // 2. MAIN MENU TAMIL
            locMgr?.SetLanguage(Language.Tamil);
            titleMenu.ApplyLocalizedLabels();
            CloseAll();
            CaptureView("02_main_menu_tamil", resolutions, cam, docsDir, brainDir);

            // Restore English
            locMgr?.SetLanguage(Language.English);
            titleMenu.ApplyLocalizedLabels();

            // -------------------------------------------------------------
            // PHASE 5: MODAL SCREENS
            // -------------------------------------------------------------
            // 3. GAME MODE SELECTION (Solo vs Multiplayer cards)
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (gameModeUI != null)
            {
                gameModeUI.SetVisible(true);
                CaptureView("03_game_mode_selection", resolutions, cam, docsDir, brainDir);
            }

            // 4. MULTIPLAYER LOBBY (Numeric 6-digit invite code, join input, player count)
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            CoopLobbyUI.Show();
            var activeLobby = UnityEngine.Object.FindAnyObjectByType<CoopLobbyUI>(FindObjectsInactive.Include);
            if (activeLobby != null)
            {
                var soLobby = new SerializedObject(activeLobby);
                var codeTextProp = soLobby.FindProperty("roomCodeText");
                if (codeTextProp?.objectReferenceValue is Text codeText)
                {
                    codeText.text = "ROOM CODE: 482910";
                }
                var statusTextProp = soLobby.FindProperty("statusText");
                if (statusTextProp?.objectReferenceValue is Text statusText)
                {
                    statusText.text = "Expedition active • 1/5 Explorers in Lobby";
                }
                CaptureView("04_multiplayer_lobby", resolutions, cam, docsDir, brainDir);
                CoopLobbyUI.Hide();
            }

            // 5. PREVIOUS JOURNEY (SavedGamesUI)
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (savedGamesUI != null)
            {
                savedGamesUI.SetVisible(true);
                CaptureView("05_previous_journey", resolutions, cam, docsDir, brainDir);
            }

            // 6. BACKUPS & SAVES - LOCAL SAVES TAB
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (saveMgmtUI != null)
            {
                saveMgmtUI.SetVisible(true);
                saveMgmtUI.SwitchTab(SaveManagementUI.SaveTab.LocalSaves);
                CaptureView("06_backups_saves_local", resolutions, cam, docsDir, brainDir);

                // 7. BACKUPS & SAVES - RESTORE BACKUP TAB
                saveMgmtUI.SwitchTab(SaveManagementUI.SaveTab.RestoreBackup);
                CaptureView("07_backups_saves_restore", resolutions, cam, docsDir, brainDir);

                // 8. BACKUPS & SAVES - CLOUD SAVES TAB
                saveMgmtUI.SwitchTab(SaveManagementUI.SaveTab.CloudSaves);
                CaptureView("08_backups_saves_cloud", resolutions, cam, docsDir, brainDir);
            }

            // 9. SETTINGS - DISPLAY TAB
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (settingsUI != null)
            {
                settingsUI.SetVisible(true);
                settingsUI.ShowPage(SettingsMenuUI.Page.Display);
                CaptureView("09_settings_display", resolutions, cam, docsDir, brainDir);

                // 10. SETTINGS - QUALITY TAB
                settingsUI.ShowPage(SettingsMenuUI.Page.Quality);
                CaptureView("10_settings_quality", resolutions, cam, docsDir, brainDir);

                // 11. SETTINGS - AUDIO TAB
                settingsUI.ShowPage(SettingsMenuUI.Page.Audio);
                CaptureView("11_settings_audio", resolutions, cam, docsDir, brainDir);

                // 12. SETTINGS - CONTROLS TAB
                settingsUI.ShowPage(SettingsMenuUI.Page.Controls);
                CaptureView("12_settings_controls", resolutions, cam, docsDir, brainDir);

                // 13. SETTINGS - ACCESSIBILITY TAB
                settingsUI.ShowPage(SettingsMenuUI.Page.Accessibility);
                CaptureView("13_settings_accessibility", resolutions, cam, docsDir, brainDir);
            }

            // 14. CREDITS - ENGLISH
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (creditsUI != null)
            {
                locMgr?.SetLanguage(Language.English);
                creditsUI.SetVisible(true);
                creditsUI.ApplyLocalizedLabels();
                CaptureView("14_credits_english", resolutions, cam, docsDir, brainDir);

                // 15. CREDITS - TAMIL
                locMgr?.SetLanguage(Language.Tamil);
                creditsUI.ApplyLocalizedLabels();
                CaptureView("15_credits_tamil", resolutions, cam, docsDir, brainDir);
            }

            // Restore English
            locMgr?.SetLanguage(Language.English);
            titleMenu.ApplyLocalizedLabels();

            // 16. LOGIN / ACCOUNT MODAL
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (loginUI != null)
            {
                loginUI.SetVisible(true);
                loginUI.ShowSignIn();
                var soLogin = new SerializedObject(loginUI);
                var emailProp = soLogin.FindProperty("emailField");
                if (emailProp?.objectReferenceValue is InputField emailInput)
                {
                    emailInput.text = "explorer@whisperingwilds.com";
                }
                var passProp = soLogin.FindProperty("passwordField");
                if (passProp?.objectReferenceValue is InputField passInput)
                {
                    passInput.text = "••••••••••••";
                }
                CaptureView("16_account_login", resolutions, cam, docsDir, brainDir);
            }

            // 17. QUIT CONFIRMATION DIALOG
            CloseAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (confirmDialog != null)
            {
                confirmDialog.ShowRaw("Are you sure you want to quit The Whispering Wilds?", () => {}, () => {});
                CaptureView("17_quit_confirmation", resolutions, cam, docsDir, brainDir);
                confirmDialog.Dismiss();
            }

            // -------------------------------------------------------------
            // RECORDING SEQUENCE (1080p Gameplay Sequence Frames)
            // -------------------------------------------------------------
            CaptureGameplaySequence(seqDir, brainDir, cam, resolutions[0],
                CloseAll, menuContainer, gameModeUI, saveMgmtUI, settingsUI, creditsUI, loginUI, confirmDialog,
                introTempleObj, introTitleGroup, introSkipText, introSkyObj, introTreeObj, introMistObj, introVigObj, menuRoot);

            // Restore canvas
            CloseAll();
            canvas.renderMode = origRenderMode;
            canvas.worldCamera = origCamera;
            canvas.planeDistance = origPlaneDist;

            Debug.Log("<color=#00FF88><b>[CaptureCinematicMenuScreenshots]</b></color> All screenshots and gameplay sequence captured successfully!");
        }

        private static void CaptureGameplaySequence(
            string seqDir, string brainDir, Camera cam, (int width, int height, string label) res,
            Action closeAll, GameObject menuContainer, GameModeSelectionUI gameModeUI,
            SaveManagementUI saveMgmtUI, SettingsMenuUI settingsUI, CreditsUI creditsUI,
            LoginUI loginUI, ConfirmationDialog confirmDialog,
            GameObject introTempleObj, GameObject introTitleGroup, GameObject introSkipText,
            GameObject introSkyObj, GameObject introTreeObj, GameObject introMistObj, GameObject introVigObj,
            GameObject menuRoot)
        {
            int frame = 1;

            void SaveSeqFrame(string stepName)
            {
                Canvas.ForceUpdateCanvases();
                var rt = new RenderTexture(res.width, res.height, 24, RenderTextureFormat.ARGB32);
                rt.antiAliasing = 4;
                var origRt = cam.targetTexture;
                cam.targetTexture = rt;
                cam.Render();
                RenderTexture.active = rt;
                var tex = new Texture2D(res.width, res.height, TextureFormat.RGB24, false);
                tex.ReadPixels(new Rect(0, 0, res.width, res.height), 0, 0);
                tex.Apply();
                cam.targetTexture = origRt;
                RenderTexture.active = null;
                UnityEngine.Object.DestroyImmediate(rt);

                byte[] pngBytes = tex.EncodeToPNG();
                UnityEngine.Object.DestroyImmediate(tex);

                string fileName = $"seq_{frame:D2}_{stepName}.png";
                File.WriteAllBytes(Path.Combine(seqDir, fileName), pngBytes);
                File.WriteAllBytes(Path.Combine(brainDir, fileName), pngBytes);
                Debug.Log($"[Sequence] Captured frame {frame}: {fileName}");
                frame++;
            }

            // Frame 1: Intro - Dawn Mist & Morning Treeline
            closeAll();
            if (menuRoot != null) menuRoot.SetActive(false);
            if (introSkyObj != null) introSkyObj.SetActive(true);
            if (introTreeObj != null) introTreeObj.SetActive(true);
            if (introMistObj != null) introMistObj.SetActive(true);
            if (introSkipText != null) introSkipText.SetActive(true);
            SaveSeqFrame("intro_dawn_mist");

            // Frame 2: Intro - Ancient Dravidian Temple Reveal
            if (introTempleObj != null)
            {
                introTempleObj.SetActive(true);
                var tImg = introTempleObj.GetComponent<Image>();
                if (tImg != null) tImg.color = new Color(1f, 1f, 1f, 0.85f);
            }
            SaveSeqFrame("intro_temple_reveal");

            // Frame 3: Intro - Title Reveal (English & Tamil)
            if (introTitleGroup != null)
            {
                introTitleGroup.SetActive(true);
                var tt = introTitleGroup.transform.Find("IntroTitleText")?.GetComponent<Text>();
                if (tt != null) tt.color = new Color(1f, 0.85f, 0.35f, 1f);
                var st = introTitleGroup.transform.Find("IntroSubtitleText")?.GetComponent<Text>();
                if (st != null)
                {
                    st.text = "காட்டு வழி • தடம்";
                    st.color = new Color(0.70f, 0.88f, 0.78f, 1f);
                }
            }
            SaveSeqFrame("intro_title_reveal");

            // Frame 4: Main Menu - Full Scenic Vista & Left-Center Navigation
            closeAll();
            SaveSeqFrame("main_menu_scenic");

            // Frame 5: Main Menu - Begin Game Button Hover Feedback
            var beginBtn = menuContainer?.transform.Find("Btn_BeginGame")?.gameObject;
            if (beginBtn != null)
            {
                var outline = beginBtn.GetComponent<Outline>();
                if (outline != null) outline.effectColor = new Color(1f, 0.88f, 0.42f, 1f);
                var leftAccent = beginBtn.transform.Find("LeftAccent")?.gameObject;
                if (leftAccent != null) leftAccent.SetActive(true);
                beginBtn.transform.localScale = new Vector3(1.04f, 1.04f, 1f);
            }
            SaveSeqFrame("main_menu_button_hover");

            // Frame 6: Game Mode Selection (Solo vs Multiplayer)
            closeAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (gameModeUI != null)
            {
                gameModeUI.SetVisible(true);
                SaveSeqFrame("game_mode_selection");
            }

            // Frame 7: Multiplayer Expedition Lobby (Numeric 6-digit code)
            closeAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            CoopLobbyUI.Show();
            var activeLobby = UnityEngine.Object.FindAnyObjectByType<CoopLobbyUI>(FindObjectsInactive.Include);
            if (activeLobby != null)
            {
                var soLobby = new SerializedObject(activeLobby);
                var codeTextProp = soLobby.FindProperty("roomCodeText");
                if (codeTextProp?.objectReferenceValue is Text codeText) codeText.text = "ROOM CODE: 482910";
                SaveSeqFrame("multiplayer_lobby_numeric_code");
                CoopLobbyUI.Hide();
            }

            // Frame 8: Backups & Saves Management (3 Tabs)
            closeAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (saveMgmtUI != null)
            {
                saveMgmtUI.SetVisible(true);
                saveMgmtUI.SwitchTab(SaveManagementUI.SaveTab.LocalSaves);
                SaveSeqFrame("backups_and_saves");
            }

            // Frame 9: Settings Configuration
            closeAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (settingsUI != null)
            {
                settingsUI.SetVisible(true);
                settingsUI.ShowPage(SettingsMenuUI.Page.Display);
                SaveSeqFrame("settings_menu");
            }

            // Frame 10: Developer Credits
            closeAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (creditsUI != null)
            {
                creditsUI.SetVisible(true);
                SaveSeqFrame("developer_credits");
            }

            // Frame 11: Account / Sign In Screen
            closeAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (loginUI != null)
            {
                loginUI.SetVisible(true);
                SaveSeqFrame("account_signin");
            }

            // Frame 12: Quit Confirmation Dialog
            closeAll();
            if (menuContainer != null) menuContainer.SetActive(false);
            if (confirmDialog != null)
            {
                confirmDialog.ShowRaw("Are you sure you want to quit The Whispering Wilds?", () => {}, () => {});
                SaveSeqFrame("quit_confirmation_dialog");
                confirmDialog.Dismiss();
            }
        }

        private static void CaptureView(string baseName, (int width, int height, string label)[] resolutions, Camera cam, string docsDir, string brainDir)
        {
            Canvas.ForceUpdateCanvases();

            foreach (var (w, h, label) in resolutions)
            {
                var rt = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32);
                rt.antiAliasing = 4;
                var origRt = cam.targetTexture;
                cam.targetTexture = rt;

                cam.Render();

                RenderTexture.active = rt;
                var tex = new Texture2D(w, h, TextureFormat.RGB24, false);
                tex.ReadPixels(new Rect(0, 0, w, h), 0, 0);
                tex.Apply();

                cam.targetTexture = origRt;
                RenderTexture.active = null;
                UnityEngine.Object.DestroyImmediate(rt);

                byte[] pngBytes = tex.EncodeToPNG();
                UnityEngine.Object.DestroyImmediate(tex);

                string fileName = $"{baseName}_{label}.png";
                string docsPath = Path.Combine(docsDir, fileName);
                string brainPath = Path.Combine(brainDir, fileName);

                File.WriteAllBytes(docsPath, pngBytes);
                File.WriteAllBytes(brainPath, pngBytes);

                Debug.Log($"[CaptureCinematicMenuScreenshots] Saved {fileName} ({pngBytes.Length:N0} bytes)");
            }
        }
    }
}
