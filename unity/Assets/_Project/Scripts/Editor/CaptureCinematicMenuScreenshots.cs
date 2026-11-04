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
            string brainDir = Environment.GetEnvironmentVariable("BRAIN_DIR") ?? @"C:\Users\mohan\.gemini\antigravity\brain\3d27ecb2-40ff-4f3c-b5c3-b19295e00ad9";

            Directory.CreateDirectory(docsDir);
            Directory.CreateDirectory(brainDir);

            var resolutions = new (int width, int height, string label)[]
            {
                (1920, 1080, "1920x1080"),
                (1600, 900, "1600x900"),
                (1366, 768, "1366x768")
            };

            void CloseAll()
            {
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

            // Restore English as default for remaining shots
            locMgr?.SetLanguage(Language.English);
            titleMenu.ApplyLocalizedLabels();

            // 3. GAME MODE SELECTION (Solo vs Multiplayer cards)
            CloseAll();
            if (gameModeUI != null)
            {
                gameModeUI.SetVisible(true);
                CaptureView("03_game_mode_selection", resolutions, cam, docsDir, brainDir);
            }

            // 4. MULTIPLAYER LOBBY (Numeric 6-digit invite code, join input, player count)
            CloseAll();
            CoopLobbyUI.Show();
            var activeLobby = UnityEngine.Object.FindAnyObjectByType<CoopLobbyUI>(FindObjectsInactive.Include);
            if (activeLobby != null)
            {
                // Set sample 6-digit numeric invite code for visual demonstration
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
            if (savedGamesUI != null)
            {
                savedGamesUI.SetVisible(true);
                CaptureView("05_previous_journey", resolutions, cam, docsDir, brainDir);
            }

            // 6. BACKUPS & SAVES - LOCAL SAVES TAB
            CloseAll();
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
            if (confirmDialog != null)
            {
                confirmDialog.ShowRaw("Are you sure you want to quit The Whispering Wilds?", () => {}, () => {});
                CaptureView("17_quit_confirmation", resolutions, cam, docsDir, brainDir);
                confirmDialog.Dismiss();
            }

            // Restore canvas
            canvas.renderMode = origRenderMode;
            canvas.worldCamera = origCamera;
            canvas.planeDistance = origPlaneDist;

            Debug.Log("<color=#00FF88><b>[CaptureCinematicMenuScreenshots]</b></color> All screenshots captured successfully across all resolutions!");
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
