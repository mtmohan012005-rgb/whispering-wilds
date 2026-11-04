using System;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using WhisperingWilds.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Quality;
using WhisperingWilds.World;
using WhisperingWilds.Online;
using WhisperingWilds.Persistence;
using WhisperingWilds.Audio;
using WhisperingWilds.Profiling;
using WhisperingWilds.NPC;
using WhisperingWilds.Wildlife;
using WhisperingWilds.Localization;
using WhisperingWilds.Display;
using WhisperingWilds.Campaign;

namespace WhisperingWilds.Editor
{
    public static class BuildBootScene
    {
        [MenuItem("Tools/Whispering Wilds/Build Boot Scene")]
        public static void CreateBootScene()
        {
            try
            {
                Debug.Log("<color=#00D2FF><b>[Whispering Wilds]</b></color> Building 00_Boot Scene...");

                // Create new scene
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

                // 1. Camera
                var camObj = new GameObject("Boot_Camera", typeof(Camera), typeof(AudioListener));
                camObj.tag = "MainCamera";
                var cam = camObj.GetComponent<Camera>();
                cam.clearFlags = CameraClearFlags.SolidColor;
                cam.backgroundColor = new Color(0.08f, 0.1f, 0.12f); // Deep midnight blue-gray

                // 2. Event System for UI clicks (using modern Unity Input System module)
                var eventSystem = new GameObject("EventSystem", typeof(EventSystem), typeof(UnityEngine.InputSystem.UI.InputSystemUIInputModule));

                // 2b. Core Persistent Managers
                SetupPersistentManagers();

                // 3. Canvas
                var canvasObj = new GameObject("Title_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                var canvas = canvasObj.GetComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;

                var scaler = canvasObj.GetComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);

                var titleCtrl = canvasObj.AddComponent<TitleMenuController>();

                // Tamil-capable font resolved at build time instead of the builtin font, which
                // has no Tamil coverage and rendered every Tamil string as a blank box.
                var font = LocalizedFontProvider.Font;

                // ============================================================
                // STEP 78: Canvas draw order fix.
                // In a ScreenSpaceOverlay Canvas, later siblings render ON TOP of earlier siblings.
                // The previous order created MenuRoot first, then full-screen backgrounds after it,
                // so the opaque MenuBackground covered all menu buttons â€” producing the olive-brown
                // blank screen the user reported.
                //
                // Correct order (bottom to top):
                //   1. Background layers (MenuBackground, mist, fireflies, vignette)
                //   2. Cinematic intro layers (IntroBackground, sky gradient, treeline, mist, vignette)
                //   3. MenuRoot (title, subtitle, buttons, rule notice)
                //   4. Intro title group (cinematic title/subtitle)
                //   5. Skip hint text
                //   6. Modal panels (LoginUI, Settings, ConfirmationDialog) â€” children of MenuRoot
                // ============================================================

                // --- 1. Background layers (rendered first = behind everything) ---

                // Background gradient image / overlay
                var bgPanel = new GameObject("BackgroundOverlay", typeof(RectTransform), typeof(Image));
                bgPanel.transform.SetParent(canvasObj.transform, false);
                var bgRect = bgPanel.GetComponent<RectTransform>();
                bgRect.anchorMin = Vector2.zero;
                bgRect.anchorMax = Vector2.one;
                bgRect.sizeDelta = Vector2.zero;
                var bgImg = bgPanel.GetComponent<Image>();
                bgImg.color = new Color(0.05f, 0.07f, 0.09f, 0.95f);
                bgImg.raycastTarget = false;

                // Menu background — rich cinematic artwork inspired by Tamil Nadu heritage
                var menuBgObj = new GameObject("MenuBackground", typeof(RectTransform), typeof(Image));
                menuBgObj.transform.SetParent(canvasObj.transform, false);
                var menuBgRect = menuBgObj.GetComponent<RectTransform>();
                menuBgRect.anchorMin = Vector2.zero;
                menuBgRect.anchorMax = Vector2.one;
                menuBgRect.offsetMin = Vector2.zero;
                menuBgRect.offsetMax = Vector2.zero;
                var menuBgImg = menuBgObj.GetComponent<Image>();
                var mainBgSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/MainMenuBackground.png");
                if (mainBgSprite != null)
                {
                    menuBgImg.sprite = mainBgSprite;
                    menuBgImg.color = Color.white;
                }
                else
                {
                    menuBgImg.color = new Color(0.04f, 0.06f, 0.09f, 1f);
                }
                menuBgImg.raycastTarget = false;

                // Mist layer 1 — slow horizontal drift
                var menuMist1Obj = new GameObject("MenuMistLayer1", typeof(RectTransform), typeof(Image));
                menuMist1Obj.transform.SetParent(canvasObj.transform, false);
                var menuMist1Rect = menuMist1Obj.GetComponent<RectTransform>();
                menuMist1Rect.anchorMin = Vector2.zero;
                menuMist1Rect.anchorMax = Vector2.one;
                menuMist1Rect.offsetMin = Vector2.zero;
                menuMist1Rect.offsetMax = Vector2.zero;
                var menuMist1Img = menuMist1Obj.GetComponent<Image>();
                var mistSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/MistBand.png");
                if (mistSprite != null) menuMist1Img.sprite = mistSprite;
                menuMist1Img.color = new Color(0.4f, 0.5f, 0.55f, 0.18f);
                menuMist1Img.raycastTarget = false;
                menuMist1Obj.SetActive(false);

                // Mist layer 2 — counter-drifting layer for depth
                var menuMist2Obj = new GameObject("MenuMistLayer2", typeof(RectTransform), typeof(Image));
                menuMist2Obj.transform.SetParent(canvasObj.transform, false);
                var menuMist2Rect = menuMist2Obj.GetComponent<RectTransform>();
                menuMist2Rect.anchorMin = Vector2.zero;
                menuMist2Rect.anchorMax = Vector2.one;
                menuMist2Rect.offsetMin = Vector2.zero;
                menuMist2Rect.offsetMax = Vector2.zero;
                var menuMist2Img = menuMist2Obj.GetComponent<Image>();
                if (mistSprite != null) menuMist2Img.sprite = mistSprite;
                menuMist2Img.color = new Color(0.35f, 0.45f, 0.5f, 0.14f);
                menuMist2Img.raycastTarget = false;
                menuMist2Obj.SetActive(false);

                // Fireflies / Golden Motes — subtle pulsing ambient motes
                var menuFirefliesObj = new GameObject("MenuFireflies", typeof(RectTransform), typeof(Image));
                menuFirefliesObj.transform.SetParent(canvasObj.transform, false);
                var menuFirefliesRect = menuFirefliesObj.GetComponent<RectTransform>();
                menuFirefliesRect.anchorMin = Vector2.zero;
                menuFirefliesRect.anchorMax = Vector2.one;
                menuFirefliesRect.offsetMin = Vector2.zero;
                menuFirefliesRect.offsetMax = Vector2.zero;
                var menuFirefliesImg = menuFirefliesObj.GetComponent<Image>();
                var glowSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/GlowMote.png");
                if (glowSprite != null) menuFirefliesImg.sprite = glowSprite;
                menuFirefliesImg.color = new Color(1f, 0.88f, 0.45f, 0.35f);
                menuFirefliesImg.raycastTarget = false;
                menuFirefliesObj.SetActive(false);

                // Soft animated golden light rays
                var menuLightRaysObj = new GameObject("MenuLightRays", typeof(RectTransform), typeof(Image));
                menuLightRaysObj.transform.SetParent(canvasObj.transform, false);
                var menuLightRaysRect = menuLightRaysObj.GetComponent<RectTransform>();
                menuLightRaysRect.anchorMin = Vector2.zero;
                menuLightRaysRect.anchorMax = Vector2.one;
                menuLightRaysRect.offsetMin = Vector2.zero;
                menuLightRaysRect.offsetMax = Vector2.zero;
                var menuLightRaysImg = menuLightRaysObj.GetComponent<Image>();
                menuLightRaysImg.color = new Color(1f, 0.88f, 0.45f, 0.12f);
                menuLightRaysImg.raycastTarget = false;
                menuLightRaysObj.SetActive(false);

                // Menu vignette — subtle edge darkening
                var menuVignetteObj = new GameObject("MenuVignette", typeof(RectTransform), typeof(Image));
                menuVignetteObj.transform.SetParent(canvasObj.transform, false);
                var menuVignetteRect = menuVignetteObj.GetComponent<RectTransform>();
                menuVignetteRect.anchorMin = Vector2.zero;
                menuVignetteRect.anchorMax = Vector2.one;
                menuVignetteRect.offsetMin = Vector2.zero;
                menuVignetteRect.offsetMax = Vector2.zero;
                var menuVignetteImg = menuVignetteObj.GetComponent<Image>();
                menuVignetteImg.color = new Color(0f, 0f, 0f, 0.42f);
                menuVignetteImg.raycastTarget = false;

                // Dim overlay for modal panel transitions
                var menuDimOverlayObj = new GameObject("MenuDimOverlay", typeof(RectTransform), typeof(Image));
                menuDimOverlayObj.transform.SetParent(canvasObj.transform, false);
                var menuDimRect = menuDimOverlayObj.GetComponent<RectTransform>();
                menuDimRect.anchorMin = Vector2.zero;
                menuDimRect.anchorMax = Vector2.one;
                menuDimRect.offsetMin = Vector2.zero;
                menuDimRect.offsetMax = Vector2.zero;
                var menuDimImg = menuDimOverlayObj.GetComponent<Image>();
                menuDimImg.color = new Color(0f, 0f, 0f, 0f);
                menuDimImg.raycastTarget = false;
                menuDimOverlayObj.SetActive(false);

                // --- 2. Cinematic intro layers ---

                var introBgObj = new GameObject("IntroBackground", typeof(RectTransform), typeof(Image));
                introBgObj.transform.SetParent(canvasObj.transform, false);
                var introBgRect = introBgObj.GetComponent<RectTransform>();
                introBgRect.anchorMin = Vector2.zero;
                introBgRect.anchorMax = Vector2.one;
                introBgRect.offsetMin = Vector2.zero;
                introBgRect.offsetMax = Vector2.zero;
                introBgObj.GetComponent<Image>().color = new Color(0.01f, 0.02f, 0.03f, 0f);
                introBgObj.SetActive(false);

                // Intro Dravidian temple sanctum layer for dramatic sunrise reveal
                var introTempleObj = new GameObject("IntroTempleLayer", typeof(RectTransform), typeof(Image));
                introTempleObj.transform.SetParent(canvasObj.transform, false);
                var introTempleRect = introTempleObj.GetComponent<RectTransform>();
                introTempleRect.anchorMin = Vector2.zero;
                introTempleRect.anchorMax = Vector2.one;
                introTempleRect.offsetMin = Vector2.zero;
                introTempleRect.offsetMax = Vector2.zero;
                var introTempleImg = introTempleObj.GetComponent<Image>();
                var templeSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/Intro_Temple_Dawn.png");
                if (templeSprite != null) introTempleImg.sprite = templeSprite;
                introTempleImg.color = new Color(1f, 1f, 1f, 0f);
                introTempleImg.raycastTarget = false;
                introTempleObj.SetActive(false);

                // Dawn sky gradient overlay
                var skyGradientObj = new GameObject("IntroSkyGradient", typeof(RectTransform), typeof(Image));
                skyGradientObj.transform.SetParent(canvasObj.transform, false);
                var skyGradientRect = skyGradientObj.GetComponent<RectTransform>();
                skyGradientRect.anchorMin = Vector2.zero;
                skyGradientRect.anchorMax = Vector2.one;
                skyGradientRect.offsetMin = Vector2.zero;
                skyGradientRect.offsetMax = Vector2.zero;
                var skyGradientImg = skyGradientObj.GetComponent<Image>();
                skyGradientImg.color = new Color(0.05f, 0.08f, 0.12f, 0.5f);
                skyGradientObj.SetActive(false);

                // Treeline silhouette at the bottom of the screen
                var treelineObj = new GameObject("IntroTreeline", typeof(RectTransform), typeof(Image));
                treelineObj.transform.SetParent(canvasObj.transform, false);
                var treelineRect = treelineObj.GetComponent<RectTransform>();
                treelineRect.anchorMin = new Vector2(0f, 0f);
                treelineRect.anchorMax = new Vector2(1f, 0.15f);
                treelineRect.offsetMin = Vector2.zero;
                treelineRect.offsetMax = Vector2.zero;
                var treelineImg = treelineObj.GetComponent<Image>();
                treelineImg.color = new Color(0.02f, 0.03f, 0.04f, 0.85f);
                treelineObj.SetActive(false);

                // Atmospheric mist overlay for the cinematic intro.
                var mistObj = new GameObject("IntroMist", typeof(RectTransform), typeof(Image));
                mistObj.transform.SetParent(canvasObj.transform, false);
                var mistRect = mistObj.GetComponent<RectTransform>();
                mistRect.anchorMin = Vector2.zero;
                mistRect.anchorMax = Vector2.one;
                mistRect.offsetMin = Vector2.zero;
                mistRect.offsetMax = Vector2.zero;
                var mistImage = mistObj.GetComponent<Image>();
                mistImage.color = new Color(0.5f, 0.55f, 0.6f, 0.08f);
                mistObj.SetActive(false);

                // Vignette overlay for atmospheric fade
                var vignetteObj = new GameObject("IntroVignette", typeof(RectTransform), typeof(Image));
                vignetteObj.transform.SetParent(canvasObj.transform, false);
                var vignetteRect = vignetteObj.GetComponent<RectTransform>();
                vignetteRect.anchorMin = Vector2.zero;
                vignetteRect.anchorMax = Vector2.one;
                vignetteRect.offsetMin = Vector2.zero;
                vignetteRect.offsetMax = Vector2.zero;
                vignetteObj.GetComponent<Image>().color = new Color(0f, 0f, 0f, 0.6f);
                vignetteObj.SetActive(false);

                // --- 3. MenuRoot (title, subtitle, buttons, rule notice) ---
                // MenuRoot: a dedicated child that holds ONLY the main menu content (title,
                // subtitle, buttons, rule notice, settings, confirmation dialog). The cinematic
                // intro controller disables this group during the intro and re-enables it when
                // the menu appears. Intro visuals are siblings of MenuRoot so they remain visible
                // while the canvas stays active.
                var menuRoot = new GameObject("MenuRoot", typeof(RectTransform));
                menuRoot.transform.SetParent(canvasObj.transform, false);
                var menuRootRect = menuRoot.GetComponent<RectTransform>();
                menuRootRect.anchorMin = Vector2.zero;
                menuRootRect.anchorMax = Vector2.one;
                menuRootRect.offsetMin = Vector2.zero;
                menuRootRect.offsetMax = Vector2.zero;

                // --- TOP-LEFT AREA: Branding, Title, and Tamil Subtitle ---
                var brandHeaderObj = new GameObject("BrandHeader", typeof(RectTransform));
                brandHeaderObj.transform.SetParent(menuRoot.transform, false);
                var brandHeaderRect = brandHeaderObj.GetComponent<RectTransform>();
                brandHeaderRect.anchorMin = new Vector2(0.06f, 0.84f);
                brandHeaderRect.anchorMax = new Vector2(0.48f, 0.94f);
                brandHeaderRect.offsetMin = Vector2.zero;
                brandHeaderRect.offsetMax = Vector2.zero;

                // App Logo
                var logoSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/AppLogo.png");
                if (logoSprite != null)
                {
                    var logoObj = new GameObject("AppLogo", typeof(RectTransform), typeof(Image));
                    logoObj.transform.SetParent(brandHeaderObj.transform, false);
                    var logoRect = logoObj.GetComponent<RectTransform>();
                    logoRect.anchorMin = new Vector2(0f, 0.5f);
                    logoRect.anchorMax = new Vector2(0f, 0.5f);
                    logoRect.pivot = new Vector2(0f, 0.5f);
                    logoRect.anchoredPosition = new Vector2(0f, 0f);
                    logoRect.sizeDelta = new Vector2(76f, 76f);
                    var logoImg = logoObj.GetComponent<Image>();
                    logoImg.sprite = logoSprite;
                    logoImg.preserveAspect = true;
                    logoImg.raycastTarget = false;
                }

                // Game Title & Tamil Subtitle
                var titleObj = CreateText("GameTitle", brandHeaderObj.transform, new Vector2(0f, 0.5f), new Vector2(0f, 0.5f), new Vector2(90f, 16f), new Vector2(650f, 44f), font, 36, TextAnchor.MiddleLeft, new Color(1f, 0.85f, 0.35f));
                var titleText = titleObj.GetComponent<Text>();
                titleText.text = "THE WHISPERING WILDS";
                titleText.lineSpacing = 1.1f;
                titleText.supportRichText = false;

                // Subtitle
                var subtitleObj = CreateText("GameSubtitle", brandHeaderObj.transform, new Vector2(0f, 0.5f), new Vector2(0f, 0.5f), new Vector2(90f, -18f), new Vector2(650f, 30f), font, 18, TextAnchor.MiddleLeft, new Color(0.70f, 0.88f, 0.78f));
                var subtitleText = subtitleObj.GetComponent<Text>();
                subtitleText.text = "காட்டு வழி • தடம்";

                // --- LEFT-CENTER: Clean, elegant vertical navigation menu ---
                var menuContainer = new GameObject("MenuContainer", typeof(RectTransform), typeof(VerticalLayoutGroup));
                menuContainer.transform.SetParent(menuRoot.transform, false);
                var menuRect = menuContainer.GetComponent<RectTransform>();
                menuRect.anchorMin = new Vector2(0.06f, 0.5f);
                menuRect.anchorMax = new Vector2(0.06f, 0.5f);
                menuRect.pivot = new Vector2(0f, 0.5f);
                menuRect.anchoredPosition = new Vector2(0f, -40f);
                menuRect.sizeDelta = new Vector2(380, 440);

                var layout = menuContainer.GetComponent<VerticalLayoutGroup>();
                layout.spacing = 14f;
                layout.childControlWidth = true;
                layout.childControlHeight = true;
                layout.childForceExpandWidth = true;
                layout.childForceExpandHeight = true;
                layout.childAlignment = TextAnchor.MiddleLeft;
                layout.padding = new RectOffset(6, 6, 6, 6);

                // Top-Right Account / Sign In Control
                var accountControlObj = new GameObject("AccountControl", typeof(RectTransform));
                accountControlObj.transform.SetParent(menuRoot.transform, false);
                var accountControlRect = accountControlObj.GetComponent<RectTransform>();
                accountControlRect.anchorMin = new Vector2(1f, 1f);
                accountControlRect.anchorMax = new Vector2(1f, 1f);
                accountControlRect.pivot = new Vector2(1f, 1f);
                accountControlRect.anchoredPosition = new Vector2(-40f, -40f);
                accountControlRect.sizeDelta = new Vector2(250f, 44f);

                var btnAccount = CreateButton("Btn_AccountSignIn", accountControlObj.transform, font, "👤 Guest (Offline)", new Color(0.10f, 0.20f, 0.18f, 0.95f));
                var btnAccountRect = btnAccount.GetComponent<RectTransform>();
                btnAccountRect.anchorMin = Vector2.zero;
                btnAccountRect.anchorMax = Vector2.one;
                btnAccountRect.sizeDelta = Vector2.zero;
                btnAccountRect.anchoredPosition = Vector2.zero;
                btnAccount.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();
                var accountStatusText = btnAccount.GetComponentInChildren<Text>();

                // Professional Main Menu Buttons (Section 1 Structure):
                // 1. BEGIN GAME — start a new journey (opens Mode Selection).
                // 2. PREVIOUS JOURNEY — continue or load an existing campaign.
                // 3. BACKUPS & SAVES — local and cloud save management.
                // 4. SETTINGS — audio, display, quality, controls, accessibility.
                // 5. DEVELOPER CREDITS — solo developer Mohanraj.
                // 6. QUIT GAME — exit with confirmation dialog.
                var btnBegin = CreateButton("Btn_BeginGame", menuContainer.transform, font, "🧭  BEGIN GAME", new Color(0.12f, 0.42f, 0.32f, 1f));
                var btnPrevious = CreateButton("Btn_PreviousJourney", menuContainer.transform, font, "📜  PREVIOUS JOURNEY", new Color(0.15f, 0.30f, 0.42f, 1f));
                var btnBackups = CreateButton("Btn_BackupsSaves", menuContainer.transform, font, "💾  BACKUPS & SAVES", new Color(0.18f, 0.28f, 0.38f, 1f));
                var btnSettings = CreateButton("Btn_Settings", menuContainer.transform, font, "⚙  SETTINGS", new Color(0.20f, 0.30f, 0.38f, 1f));
                var btnCredits = CreateButton("Btn_Credits", menuContainer.transform, font, "🎖  DEVELOPER CREDITS", new Color(0.24f, 0.32f, 0.28f, 1f));
                var btnQuit = CreateButton("Btn_Quit", menuContainer.transform, font, "🚪  QUIT GAME", new Color(0.45f, 0.18f, 0.18f, 1f));

                // Add MenuButtonAnimator to all 6 main menu buttons
                foreach (var btnGo in new[] { btnBegin, btnPrevious, btnBackups, btnSettings, btnCredits, btnQuit })
                {
                    btnGo.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();
                }

                var footerObj = CreateText("FooterText", menuRoot.transform, new Vector2(0f, 0.04f), new Vector2(1f, 0.04f), Vector2.zero, new Vector2(1400f, 30f), font, 14, TextAnchor.MiddleCenter, new Color(0.78f, 0.82f, 0.88f, 0.75f));
                footerObj.GetComponent<Text>().text = "Explore • Discover • Survive   |   Version v1.0.2   |   A Solo Adventure by Mohanraj";

                var ruleObj = CreateText("RuleNoticeText", menuRoot.transform, new Vector2(0.5f, 0.08f), new Vector2(0.5f, 0.08f), Vector2.zero, new Vector2(1000, 30), font, 14, TextAnchor.MiddleCenter, new Color(1f, 0.7f, 0.2f, 0f));

                // Modal panels under menuRoot
                var gameModeSelectionObj = BuildGameModeSelectionPanel(menuRoot.transform, font);
                var gameModeSelectionUI = gameModeSelectionObj.GetComponent<GameModeSelectionUI>();

                var savedGamesObj = BuildSavedGamesPanel(menuRoot.transform, font);
                var savedGamesUI = savedGamesObj.GetComponent<SavedGamesUI>();

                var saveManagementObj = BuildSaveManagementPanel(menuRoot.transform, font);
                var saveManagementUI = saveManagementObj.GetComponent<SaveManagementUI>();

                var creditsObj = BuildCreditsPanel(menuRoot.transform, font);
                var creditsUI = creditsObj.GetComponent<CreditsUI>();

                // Settings panel, hidden until the player opens it.
                var settingsUiObj = BuildSettingsPanel(menuRoot.transform, font);
                var settingsUi = settingsUiObj.GetComponent<SettingsMenuUI>();

                // Confirmation dialog, hidden until needed (e.g., New Game overwrites a save).
                var confirmDialogObj = BuildConfirmationDialog(menuRoot.transform, font);
                var confirmDialog = confirmDialogObj.GetComponent<ConfirmationDialog>();

                // --- 4. Intro title group & Centered Title Card (THE WHISPERING WILDS â€¢ Kattu Vazhi Thadam + START Button) ---
                var introGroup = new GameObject("IntroTitleGroup", typeof(RectTransform), typeof(CanvasGroup));
                introGroup.transform.SetParent(canvasObj.transform, false);
                var introGroupRect = introGroup.GetComponent<RectTransform>();
                introGroupRect.anchorMin = new Vector2(0.5f, 0.5f);
                introGroupRect.anchorMax = new Vector2(0.5f, 0.5f);
                introGroupRect.pivot = new Vector2(0.5f, 0.5f);
                introGroupRect.anchoredPosition = Vector2.zero;
                introGroupRect.sizeDelta = new Vector2(920f, 420f);
                var introCanvasGroup = introGroup.GetComponent<CanvasGroup>();
                introCanvasGroup.alpha = 1f;
                introCanvasGroup.interactable = true;
                introCanvasGroup.blocksRaycasts = true;
                introGroup.SetActive(false);

                // Radial Antique Gold Halo Glow behind centered title card
                var glowMoteSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/GlowMote.png");
                var titleBackGlowObj = new GameObject("TitleBackGlow", typeof(RectTransform), typeof(Image));
                titleBackGlowObj.transform.SetParent(introGroup.transform, false);
                var glowRect = titleBackGlowObj.GetComponent<RectTransform>();
                glowRect.anchorMin = new Vector2(0.5f, 0.5f);
                glowRect.anchorMax = new Vector2(0.5f, 0.5f);
                glowRect.pivot = new Vector2(0.5f, 0.5f);
                glowRect.anchoredPosition = new Vector2(0f, 0f);
                glowRect.sizeDelta = new Vector2(740f, 380f);
                var glowImg = titleBackGlowObj.GetComponent<Image>();
                if (glowMoteSprite != null) glowImg.sprite = glowMoteSprite;
                glowImg.color = new Color(0.96f, 0.82f, 0.38f, 0.18f);
                glowImg.raycastTarget = false;

                // English Game Title â€” Centered horizontally & vertically
                var introTitleObj = CreateText("IntroTitleText", introGroup.transform,
                    new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 44f), new Vector2(880f, 68f),
                    font, 54, TextAnchor.MiddleCenter, new Color(0.96f, 0.83f, 0.40f, 0f));
                var introTitleTextComp = introTitleObj.GetComponent<Text>();
                introTitleTextComp.text = "THE WHISPERING WILDS";
                introTitleTextComp.fontStyle = FontStyle.Normal;
                introTitleTextComp.lineSpacing = 1.15f;
                introTitleTextComp.supportRichText = false;

                // Tamil Subtitle â€” Centered directly beneath English title
                var introSubtitleObj = CreateText("IntroSubtitleText", introGroup.transform,
                    new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, -14f), new Vector2(720f, 42f),
                    font, 26, TextAnchor.MiddleCenter, new Color(0.65f, 0.89f, 0.79f, 0f));
                var introSubtitleTextComp = introSubtitleObj.GetComponent<Text>();
                introSubtitleTextComp.text = "\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1 \u0BB5\u0BB4\u0BBF \u2022 \u0BA4\u0B9F\u0BAE\u0BCD";
                introSubtitleTextComp.fontStyle = FontStyle.Normal;
                introSubtitleTextComp.supportRichText = false;

                // Title Screen Primary START Button â€” Centered below subtitle with gold outline
                var startBtnObj = CreateButton("Btn_TitleStart", introGroup.transform,
                    new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, -96f), new Vector2(250f, 54f),
                    font, "\u25B6  START", new Color(0.12f, 0.42f, 0.32f, 1f));
                var startBtn = startBtnObj.GetComponent<Button>();
                var startBtnAnimator = startBtnObj.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();
                var startBtnCg = startBtnObj.AddComponent<CanvasGroup>();
                startBtnCg.alpha = 0f;
                startBtnCg.interactable = false;
                startBtnCg.blocksRaycasts = false;

                // --- 5. Skip Intro Button (translucent pill in bottom right) ---
                var skipBtnObj = CreateButton("IntroSkipText", canvasObj.transform,
                    new Vector2(0.88f, 0.08f), new Vector2(0.88f, 0.08f), Vector2.zero, new Vector2(170f, 40f),
                    font, "\u23ED  SKIP INTRO", new Color(0.18f, 0.24f, 0.30f, 0.85f));
                var skipBtn = skipBtnObj.GetComponent<Button>();
                var skipBtnCg = skipBtnObj.AddComponent<CanvasGroup>();
                skipBtnCg.alpha = 0f;
                var skipTextComp = skipBtnObj.GetComponentInChildren<Text>();
                skipBtnObj.SetActive(false);

                // STEP 70: MainMenuAnimator â€” orchestrates title, subtitle, button, and background animation.
                var menuAnimatorObj = new GameObject("MainMenuAnimator");
                menuAnimatorObj.transform.SetParent(canvasObj.transform, false);
                var menuAnimator = menuAnimatorObj.AddComponent<WhisperingWilds.UI.MainMenuAnimator>();

                // Cinematic intro controller
                var introObj = new GameObject("CinematicIntro");
                var introCtrl = introObj.AddComponent<CinematicIntroController>();
                var serializedIntro = new SerializedObject(introCtrl);
                serializedIntro.FindProperty("introBackground").objectReferenceValue = introBgObj;
                serializedIntro.FindProperty("introVignette").objectReferenceValue = vignetteObj;
                serializedIntro.FindProperty("introTitleGroup").objectReferenceValue = introGroup;
                serializedIntro.FindProperty("introTitleText").objectReferenceValue = introTitleTextComp;
                serializedIntro.FindProperty("introSubtitleText").objectReferenceValue = introSubtitleTextComp;
                serializedIntro.FindProperty("introSkipText").objectReferenceValue = skipTextComp;
                if (serializedIntro.FindProperty("startButton") != null)
                    serializedIntro.FindProperty("startButton").objectReferenceValue = startBtn;
                if (serializedIntro.FindProperty("titleCardCanvasGroup") != null)
                    serializedIntro.FindProperty("titleCardCanvasGroup").objectReferenceValue = introCanvasGroup;
                if (serializedIntro.FindProperty("titleBackGlow") != null)
                    serializedIntro.FindProperty("titleBackGlow").objectReferenceValue = glowImg;
                if (serializedIntro.FindProperty("titleCardContainer") != null)
                    serializedIntro.FindProperty("titleCardContainer").objectReferenceValue = introGroup;
                if (serializedIntro.FindProperty("introSkipButton") != null)
                    serializedIntro.FindProperty("introSkipButton").objectReferenceValue = skipBtn;
                serializedIntro.FindProperty("menuRoot").objectReferenceValue = menuRoot;
                serializedIntro.FindProperty("titleMenuController").objectReferenceValue = titleCtrl;
                serializedIntro.FindProperty("introCamera").objectReferenceValue = camObj.GetComponent<Camera>();
                serializedIntro.FindProperty("introSkyGradient").objectReferenceValue = skyGradientObj;
                serializedIntro.FindProperty("introTreeline").objectReferenceValue = treelineObj;
                if (serializedIntro.FindProperty("introTempleLayer") != null)
                    serializedIntro.FindProperty("introTempleLayer").objectReferenceValue = introTempleObj;

                var bellClip = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Ambience/temple_bell.wav");
                if (bellClip != null && serializedIntro.FindProperty("templeBellClip") != null)
                    serializedIntro.FindProperty("templeBellClip").objectReferenceValue = bellClip;

                var ambClip = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Ambience/temple_ambience.wav");
                if (ambClip != null && serializedIntro.FindProperty("templeAmbienceClip") != null)
                    serializedIntro.FindProperty("templeAmbienceClip").objectReferenceValue = ambClip;

                var birdClip = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Ambience/birds.wav");
                if (birdClip != null && serializedIntro.FindProperty("birdsClip") != null)
                    serializedIntro.FindProperty("birdsClip").objectReferenceValue = birdClip;

                var introClickClip = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Resources/Audio/ui_click.wav");
                if (introClickClip != null && serializedIntro.FindProperty("clickClip") != null)
                    serializedIntro.FindProperty("clickClip").objectReferenceValue = introClickClip;

                serializedIntro.ApplyModifiedProperties();

                // STEP 70: Wire MainMenuAnimator references
                var serializedMenuAnim = new SerializedObject(menuAnimator);
                serializedMenuAnim.FindProperty("titleText").objectReferenceValue = titleText;
                serializedMenuAnim.FindProperty("subtitleText").objectReferenceValue = subtitleText;
                serializedMenuAnim.FindProperty("menuContainer").objectReferenceValue = menuContainer;
                serializedMenuAnim.FindProperty("ruleNoticeText").objectReferenceValue = ruleObj.GetComponent<Text>();
                if (serializedMenuAnim.FindProperty("accountControl") != null)
                    serializedMenuAnim.FindProperty("accountControl").objectReferenceValue = accountControlObj;
                if (serializedMenuAnim.FindProperty("footerText") != null)
                    serializedMenuAnim.FindProperty("footerText").objectReferenceValue = footerObj.GetComponent<Text>();
                serializedMenuAnim.FindProperty("menuBackground").objectReferenceValue = menuBgImg;
                serializedMenuAnim.FindProperty("menuMistLayer1").objectReferenceValue = menuMist1Obj;
                serializedMenuAnim.FindProperty("menuMistLayer2").objectReferenceValue = menuMist2Obj;
                serializedMenuAnim.FindProperty("menuFireflies").objectReferenceValue = menuFirefliesObj;
                serializedMenuAnim.FindProperty("menuLightRays").objectReferenceValue = menuLightRaysObj;
                serializedMenuAnim.FindProperty("menuVignette").objectReferenceValue = menuVignetteImg;
                serializedMenuAnim.FindProperty("menuDimOverlay").objectReferenceValue = menuDimImg;
                serializedMenuAnim.ApplyModifiedProperties();

                // STEP 73: Create PRO LoginUI panel with cinematic Dravidian split-screen experience
                var loginUIObj = new GameObject("LoginUI", typeof(CanvasGroup));
                loginUIObj.transform.SetParent(canvasObj.transform, false);
                var loginUI = loginUIObj.AddComponent<WhisperingWilds.UI.LoginUI>();
                loginUIObj.SetActive(false);

                // Fullscreen dim overlay
                var loginBg = new GameObject("LoginBackground", typeof(RectTransform), typeof(Image));
                loginBg.transform.SetParent(loginUIObj.transform, false);
                var loginBgRect = loginBg.GetComponent<RectTransform>();
                loginBgRect.anchorMin = Vector2.zero;
                loginBgRect.anchorMax = Vector2.one;
                loginBgRect.offsetMin = Vector2.zero;
                loginBgRect.offsetMax = Vector2.zero;
                loginBg.GetComponent<Image>().color = new Color(0.04f, 0.05f, 0.07f, 0.72f);

                // Subtle Dravidian temple hero backdrop
                var loginHeroArt = new GameObject("LoginHeroBackdrop", typeof(RectTransform), typeof(Image));
                loginHeroArt.transform.SetParent(loginUIObj.transform, false);
                var heroArtRect = loginHeroArt.GetComponent<RectTransform>();
                heroArtRect.anchorMin = Vector2.zero;
                heroArtRect.anchorMax = Vector2.one;
                heroArtRect.offsetMin = Vector2.zero;
                heroArtRect.offsetMax = Vector2.zero;
                var heroArtImg = loginHeroArt.GetComponent<Image>();
                var menuBgSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/MainMenuBackground.png");
                if (menuBgSprite != null)
                {
                    heroArtImg.sprite = menuBgSprite;
                    heroArtImg.color = new Color(1f, 1f, 1f, 0.12f);
                    heroArtImg.raycastTarget = false;
                }

                // --- LEFT SIDE: Brand & Dravidian Lore Showcase ---
                var brandPanel = new GameObject("BrandShowcase", typeof(RectTransform));
                brandPanel.transform.SetParent(loginUIObj.transform, false);
                var brandRect = brandPanel.GetComponent<RectTransform>();
                brandRect.anchorMin = new Vector2(0.06f, 0.12f);
                brandRect.anchorMax = new Vector2(0.44f, 0.88f);
                brandRect.offsetMin = Vector2.zero;
                brandRect.offsetMax = Vector2.zero;

                // App Logo
                var loginLogoSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/AppLogo.png");
                if (loginLogoSprite != null)
                {
                    var logoObj = new GameObject("AppLogo", typeof(RectTransform), typeof(Image));
                    logoObj.transform.SetParent(brandPanel.transform, false);
                    var logoRect = logoObj.GetComponent<RectTransform>();
                    logoRect.anchorMin = new Vector2(0.5f, 0.82f);
                    logoRect.anchorMax = new Vector2(0.5f, 0.82f);
                    logoRect.pivot = new Vector2(0.5f, 0.5f);
                    logoRect.sizeDelta = new Vector2(260f, 110f);
                    var logoImg = logoObj.GetComponent<Image>();
                    logoImg.sprite = loginLogoSprite;
                    logoImg.preserveAspect = true;
                    logoImg.raycastTarget = false;
                }

                // Game Title & Tamil Subtitle
                CreateText("BrandTitle", brandPanel.transform,
                    new Vector2(0.5f, 0.64f), new Vector2(0.5f, 0.64f), Vector2.zero, new Vector2(440f, 40f),
                    font, 26, TextAnchor.MiddleCenter, new Color(0.92f, 0.78f, 0.38f));

                CreateText("BrandTamilTitle", brandPanel.transform,
                    new Vector2(0.5f, 0.56f), new Vector2(0.5f, 0.56f), Vector2.zero, new Vector2(440f, 32f),
                    font, 20, TextAnchor.MiddleCenter, new Color(0.68f, 0.85f, 0.65f));

                // Tagline
                CreateText("BrandTagline", brandPanel.transform,
                    new Vector2(0.5f, 0.46f), new Vector2(0.5f, 0.46f), Vector2.zero, new Vector2(420f, 54f),
                    font, 14, TextAnchor.MiddleCenter, new Color(0.82f, 0.85f, 0.9f));

                // Gold divider
                var divider = new GameObject("Divider", typeof(RectTransform), typeof(Image));
                divider.transform.SetParent(brandPanel.transform, false);
                var divRect = divider.GetComponent<RectTransform>();
                divRect.anchorMin = new Vector2(0.15f, 0.38f);
                divRect.anchorMax = new Vector2(0.85f, 0.38f);
                divRect.sizeDelta = new Vector2(0f, 2f);
                divider.GetComponent<Image>().color = new Color(0.83f, 0.69f, 0.22f, 0.6f);

                // Feature Highlights
                CreateText("Feature1", brandPanel.transform,
                    new Vector2(0.5f, 0.30f), new Vector2(0.5f, 0.30f), Vector2.zero, new Vector2(400f, 28f),
                    font, 13, TextAnchor.MiddleLeft, new Color(0.8f, 0.88f, 0.95f));

                CreateText("Feature2", brandPanel.transform,
                    new Vector2(0.5f, 0.23f), new Vector2(0.5f, 0.23f), Vector2.zero, new Vector2(400f, 28f),
                    font, 13, TextAnchor.MiddleLeft, new Color(0.8f, 0.88f, 0.95f));

                CreateText("Feature3", brandPanel.transform,
                    new Vector2(0.5f, 0.16f), new Vector2(0.5f, 0.16f), Vector2.zero, new Vector2(400f, 28f),
                    font, 13, TextAnchor.MiddleLeft, new Color(0.8f, 0.88f, 0.95f));

                // --- RIGHT SIDE: Card Container (Charcoal Glass & Gold Border) ---
                var cardContainer = new GameObject("CardContainer", typeof(RectTransform), typeof(Image));
                cardContainer.transform.SetParent(loginUIObj.transform, false);
                var cardRect = cardContainer.GetComponent<RectTransform>();
                cardRect.anchorMin = new Vector2(0.48f, 0.08f);
                cardRect.anchorMax = new Vector2(0.94f, 0.92f);
                cardRect.offsetMin = Vector2.zero;
                cardRect.offsetMax = Vector2.zero;
                cardContainer.GetComponent<Image>().color = new Color(0.07f, 0.09f, 0.12f, 0.95f);

                // Gold accent border line on top of card
                var cardTopBorder = new GameObject("CardTopBorder", typeof(RectTransform), typeof(Image));
                cardTopBorder.transform.SetParent(cardContainer.transform, false);
                var topBorderRect = cardTopBorder.GetComponent<RectTransform>();
                topBorderRect.anchorMin = new Vector2(0f, 1f);
                topBorderRect.anchorMax = new Vector2(1f, 1f);
                topBorderRect.sizeDelta = new Vector2(0f, 3f);
                cardTopBorder.GetComponent<Image>().color = new Color(0.83f, 0.69f, 0.22f, 0.9f);

                // --- 1. Sign In Panel ---
                var signInPanel = new GameObject("SignInPanel", typeof(RectTransform));
                signInPanel.transform.SetParent(cardContainer.transform, false);
                var signInRect = signInPanel.GetComponent<RectTransform>();
                signInRect.anchorMin = Vector2.zero;
                signInRect.anchorMax = Vector2.one;
                signInRect.offsetMin = new Vector2(25f, 20f);
                signInRect.offsetMax = new Vector2(-25f, -20f);

                // Sign In Header
                var signInTitle = CreateText("SignInTitle", signInPanel.transform,
                    new Vector2(0.5f, 0.93f), new Vector2(0.5f, 0.93f), Vector2.zero, new Vector2(400f, 36f),
                    font, 24, TextAnchor.MiddleCenter, new Color(0.95f, 0.82f, 0.38f));

                // Email field
                var emailField = CreateInputField("EmailField", signInPanel.transform,
                    new Vector2(0.5f, 0.78f), new Vector2(0.5f, 0.78f), Vector2.zero, new Vector2(380f, 42f), font, "Email Address");

                // Password field
                var passwordField = CreateInputField("PasswordField", signInPanel.transform,
                    new Vector2(0.44f, 0.66f), new Vector2(0.44f, 0.66f), Vector2.zero, new Vector2(310f, 42f), font, "Password");
                passwordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                // Toggle Password Visibility Button
                var togglePasswordBtn = CreateButton("TogglePasswordBtn", signInPanel.transform,
                    new Vector2(0.90f, 0.66f), new Vector2(0.90f, 0.66f), Vector2.zero, new Vector2(60f, 42f),
                    font, "SHOW", new Color(0.18f, 0.22f, 0.28f));
                var passwordEyeText = togglePasswordBtn.GetComponentInChildren<Text>();
                passwordEyeText.fontSize = 11;

                // Remember Email toggle row
                var rememberRow = new GameObject("RememberRow", typeof(RectTransform), typeof(Toggle));
                rememberRow.transform.SetParent(signInPanel.transform, false);
                var remRect = rememberRow.GetComponent<RectTransform>();
                remRect.anchorMin = new Vector2(0.05f, 0.55f);
                remRect.anchorMax = new Vector2(0.50f, 0.55f);
                remRect.sizeDelta = new Vector2(180f, 26f);
                var remToggle = rememberRow.GetComponent<Toggle>();

                var remCheckBg = new GameObject("Background", typeof(RectTransform), typeof(Image));
                remCheckBg.transform.SetParent(rememberRow.transform, false);
                var remCheckBgRect = remCheckBg.GetComponent<RectTransform>();
                remCheckBgRect.anchorMin = new Vector2(0f, 0.5f);
                remCheckBgRect.anchorMax = new Vector2(0f, 0.5f);
                remCheckBgRect.pivot = new Vector2(0f, 0.5f);
                remCheckBgRect.sizeDelta = new Vector2(18f, 18f);
                remCheckBg.GetComponent<Image>().color = new Color(0.15f, 0.18f, 0.22f);

                var remCheckmark = new GameObject("Checkmark", typeof(RectTransform), typeof(Image));
                remCheckmark.transform.SetParent(remCheckBg.transform, false);
                var remCheckmarkRect = remCheckmark.GetComponent<RectTransform>();
                remCheckmarkRect.anchorMin = new Vector2(0.15f, 0.15f);
                remCheckmarkRect.anchorMax = new Vector2(0.85f, 0.85f);
                remCheckmarkRect.offsetMin = Vector2.zero;
                remCheckmarkRect.offsetMax = Vector2.zero;
                var checkmarkImg = remCheckmark.GetComponent<Image>();
                checkmarkImg.color = new Color(0.85f, 0.72f, 0.35f);
                remToggle.graphic = checkmarkImg;
                remToggle.targetGraphic = remCheckBg.GetComponent<Image>();

                var remLabel = CreateText("Label", rememberRow.transform,
                    new Vector2(0f, 0.5f), new Vector2(1f, 0.5f), new Vector2(26f, 0f), new Vector2(160f, 24f),
                    font, 13, TextAnchor.MiddleLeft, new Color(0.8f, 0.85f, 0.9f));
                remLabel.GetComponent<Text>().text = "Remember Email";

                // Forgot Password button
                var forgotPasswordBtn = CreateButton("ForgotPasswordBtn", signInPanel.transform,
                    new Vector2(0.76f, 0.55f), new Vector2(0.76f, 0.55f), Vector2.zero, new Vector2(140f, 26f),
                    font, "Forgot Password?", new Color(0f, 0f, 0f, 0f));
                var forgotBtnText = forgotPasswordBtn.GetComponentInChildren<Text>();
                forgotBtnText.fontSize = 12;
                forgotBtnText.color = new Color(0.85f, 0.72f, 0.35f);

                // Sign In button (Deep Forest Green)
                var signInBtn = CreateButton("SignInButton", signInPanel.transform,
                    new Vector2(0.5f, 0.42f), new Vector2(0.5f, 0.42f), Vector2.zero, new Vector2(380f, 44f),
                    font, "Sign In", new Color(0.12f, 0.38f, 0.26f));
                var signInBtnText = signInBtn.GetComponentInChildren<Text>();
                signInBtnText.fontSize = 17;
                signInBtnText.color = new Color(0.96f, 0.92f, 0.82f);

                // Sign In status text
                var signInStatus = CreateText("SignInStatus", signInPanel.transform,
                    new Vector2(0.5f, 0.32f), new Vector2(0.5f, 0.32f), Vector2.zero, new Vector2(380f, 32f),
                    font, 13, TextAnchor.MiddleCenter, Color.gray);

                // Switch to register button
                var switchToRegBtn = CreateButton("SwitchToRegisterBtn", signInPanel.transform,
                    new Vector2(0.5f, 0.20f), new Vector2(0.5f, 0.20f), Vector2.zero, new Vector2(380f, 38f),
                    font, "Don't have an account? Sign up", new Color(0.16f, 0.20f, 0.25f));

                // --- 2. Register Panel ---
                var registerPanel = new GameObject("RegisterPanel", typeof(RectTransform));
                registerPanel.transform.SetParent(cardContainer.transform, false);
                var regRect = registerPanel.GetComponent<RectTransform>();
                regRect.anchorMin = Vector2.zero;
                regRect.anchorMax = Vector2.one;
                regRect.offsetMin = new Vector2(25f, 20f);
                regRect.offsetMax = new Vector2(-25f, -20f);
                registerPanel.SetActive(false);

                // Register title
                CreateText("RegisterTitle", registerPanel.transform,
                    new Vector2(0.5f, 0.94f), new Vector2(0.5f, 0.94f), Vector2.zero, new Vector2(400f, 34f),
                    font, 22, TextAnchor.MiddleCenter, new Color(0.95f, 0.82f, 0.38f));

                // Display name field
                var regNameField = CreateInputField("RegNameField", registerPanel.transform,
                    new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(380f, 38f), font, "Explorer Display Name");

                // Email field
                var regEmailField = CreateInputField("RegEmailField", registerPanel.transform,
                    new Vector2(0.5f, 0.71f), new Vector2(0.5f, 0.71f), Vector2.zero, new Vector2(380f, 38f), font, "Email Address");

                // Password field + Eye Toggle
                var regPasswordField = CreateInputField("RegPasswordField", registerPanel.transform,
                    new Vector2(0.44f, 0.60f), new Vector2(0.44f, 0.60f), Vector2.zero, new Vector2(310f, 38f), font, "Password (min 8 chars)");
                regPasswordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                var toggleRegPasswordBtn = CreateButton("ToggleRegPasswordBtn", registerPanel.transform,
                    new Vector2(0.90f, 0.60f), new Vector2(0.90f, 0.60f), Vector2.zero, new Vector2(60f, 38f),
                    font, "SHOW", new Color(0.18f, 0.22f, 0.28f));
                var regPasswordEyeText = toggleRegPasswordBtn.GetComponentInChildren<Text>();
                regPasswordEyeText.fontSize = 11;

                // Confirm password field
                var regConfirmPasswordField = CreateInputField("RegConfirmPasswordField", registerPanel.transform,
                    new Vector2(0.5f, 0.49f), new Vector2(0.5f, 0.49f), Vector2.zero, new Vector2(380f, 38f), font, "Confirm Password");
                regConfirmPasswordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                // Password strength bar container
                var strengthBarObj = new GameObject("PasswordStrengthBar", typeof(RectTransform), typeof(Image));
                strengthBarObj.transform.SetParent(registerPanel.transform, false);
                var strBarRect = strengthBarObj.GetComponent<RectTransform>();
                strBarRect.anchorMin = new Vector2(0.05f, 0.41f);
                strBarRect.anchorMax = new Vector2(0.95f, 0.41f);
                strBarRect.sizeDelta = new Vector2(0f, 6f);
                var strBarImg = strengthBarObj.GetComponent<Image>();
                strBarImg.color = new Color(0.3f, 0.35f, 0.4f);

                // Password strength label
                var strTextObj = CreateText("PasswordStrengthText", registerPanel.transform,
                    new Vector2(0.5f, 0.36f), new Vector2(0.5f, 0.36f), Vector2.zero, new Vector2(380f, 22f),
                    font, 12, TextAnchor.MiddleLeft, Color.gray);

                // Requirements label
                var reqTextObj = CreateText("RegisterRequirements", registerPanel.transform,
                    new Vector2(0.5f, 0.31f), new Vector2(0.5f, 0.31f), Vector2.zero, new Vector2(380f, 22f),
                    font, 11, TextAnchor.MiddleLeft, new Color(0.65f, 0.7f, 0.75f));

                // Register button
                var registerBtn = CreateButton("RegisterButton", registerPanel.transform,
                    new Vector2(0.5f, 0.22f), new Vector2(0.5f, 0.22f), Vector2.zero, new Vector2(380f, 42f),
                    font, "Create Account", new Color(0.12f, 0.38f, 0.26f));

                // Register status text
                var regStatus = CreateText("RegisterStatus", registerPanel.transform,
                    new Vector2(0.5f, 0.14f), new Vector2(0.5f, 0.14f), Vector2.zero, new Vector2(380f, 26f),
                    font, 12, TextAnchor.MiddleCenter, Color.gray);

                // Switch to sign in button
                var switchToSignInBtn = CreateButton("SwitchToSignInBtn", registerPanel.transform,
                    new Vector2(0.5f, 0.05f), new Vector2(0.5f, 0.05f), Vector2.zero, new Vector2(380f, 36f),
                    font, "Already have an account? Sign in", new Color(0.16f, 0.20f, 0.25f));

                // --- 3. Forgot Password Panel ---
                var forgotPasswordPanel = new GameObject("ForgotPasswordPanel", typeof(RectTransform));
                forgotPasswordPanel.transform.SetParent(cardContainer.transform, false);
                var forgotRect = forgotPasswordPanel.GetComponent<RectTransform>();
                forgotRect.anchorMin = Vector2.zero;
                forgotRect.anchorMax = Vector2.one;
                forgotRect.offsetMin = new Vector2(25f, 20f);
                forgotRect.offsetMax = new Vector2(-25f, -20f);
                forgotPasswordPanel.SetActive(false);

                CreateText("ForgotTitle", forgotPasswordPanel.transform,
                    new Vector2(0.5f, 0.92f), new Vector2(0.5f, 0.92f), Vector2.zero, new Vector2(400f, 34f),
                    font, 22, TextAnchor.MiddleCenter, new Color(0.95f, 0.82f, 0.38f));

                var forgotInstructions = CreateText("ForgotInstructions", forgotPasswordPanel.transform,
                    new Vector2(0.5f, 0.78f), new Vector2(0.5f, 0.78f), Vector2.zero, new Vector2(380f, 50f),
                    font, 13, TextAnchor.MiddleCenter, new Color(0.85f, 0.88f, 0.92f));

                var forgotEmailField = CreateInputField("ForgotEmailField", forgotPasswordPanel.transform,
                    new Vector2(0.5f, 0.62f), new Vector2(0.5f, 0.62f), Vector2.zero, new Vector2(380f, 42f), font, "Registered Email");

                var sendRecoveryBtn = CreateButton("SendRecoveryBtn", forgotPasswordPanel.transform,
                    new Vector2(0.5f, 0.48f), new Vector2(0.5f, 0.48f), Vector2.zero, new Vector2(380f, 42f),
                    font, "Send Recovery Link", new Color(0.14f, 0.35f, 0.42f));

                var forgotStatus = CreateText("ForgotStatus", forgotPasswordPanel.transform,
                    new Vector2(0.5f, 0.36f), new Vector2(0.5f, 0.36f), Vector2.zero, new Vector2(380f, 32f),
                    font, 12, TextAnchor.MiddleCenter, Color.gray);

                var forgotHaveTokenBtn = CreateButton("ForgotHaveTokenBtn", forgotPasswordPanel.transform,
                    new Vector2(0.5f, 0.22f), new Vector2(0.5f, 0.22f), Vector2.zero, new Vector2(380f, 38f),
                    font, "Have a recovery token? Reset Password", new Color(0.18f, 0.24f, 0.30f));

                var forgotBackBtn = CreateButton("ForgotBackToSignInBtn", forgotPasswordPanel.transform,
                    new Vector2(0.5f, 0.10f), new Vector2(0.5f, 0.10f), Vector2.zero, new Vector2(380f, 38f),
                    font, "Back to Sign In", new Color(0.16f, 0.20f, 0.25f));

                // --- 4. Reset Password Panel ---
                var resetPasswordPanel = new GameObject("ResetPasswordPanel", typeof(RectTransform));
                resetPasswordPanel.transform.SetParent(cardContainer.transform, false);
                var resetRect = resetPasswordPanel.GetComponent<RectTransform>();
                resetRect.anchorMin = Vector2.zero;
                resetRect.anchorMax = Vector2.one;
                resetRect.offsetMin = new Vector2(25f, 20f);
                resetRect.offsetMax = new Vector2(-25f, -20f);
                resetPasswordPanel.SetActive(false);

                CreateText("ResetTitle", resetPasswordPanel.transform,
                    new Vector2(0.5f, 0.94f), new Vector2(0.5f, 0.94f), Vector2.zero, new Vector2(400f, 34f),
                    font, 22, TextAnchor.MiddleCenter, new Color(0.95f, 0.82f, 0.38f));

                var resetInstructions = CreateText("ResetInstructions", resetPasswordPanel.transform,
                    new Vector2(0.5f, 0.84f), new Vector2(0.5f, 0.84f), Vector2.zero, new Vector2(380f, 44f),
                    font, 13, TextAnchor.MiddleCenter, new Color(0.85f, 0.88f, 0.92f));

                var resetTokenField = CreateInputField("ResetTokenField", resetPasswordPanel.transform,
                    new Vector2(0.5f, 0.72f), new Vector2(0.5f, 0.72f), Vector2.zero, new Vector2(380f, 38f), font, "Paste Recovery Token");

                var resetPasswordField = CreateInputField("ResetPasswordField", resetPasswordPanel.transform,
                    new Vector2(0.44f, 0.60f), new Vector2(0.44f, 0.60f), Vector2.zero, new Vector2(310f, 38f), font, "New Password (min 8 chars)");
                resetPasswordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                var toggleResetPasswordBtn = CreateButton("ToggleResetPasswordBtn", resetPasswordPanel.transform,
                    new Vector2(0.90f, 0.60f), new Vector2(0.90f, 0.60f), Vector2.zero, new Vector2(60f, 38f),
                    font, "SHOW", new Color(0.18f, 0.22f, 0.28f));
                var resetPasswordEyeText = toggleResetPasswordBtn.GetComponentInChildren<Text>();
                resetPasswordEyeText.fontSize = 11;

                var resetConfirmPasswordField = CreateInputField("ResetConfirmPasswordField", resetPasswordPanel.transform,
                    new Vector2(0.5f, 0.48f), new Vector2(0.5f, 0.48f), Vector2.zero, new Vector2(380f, 38f), font, "Confirm New Password");
                resetConfirmPasswordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                var resetPasswordBtn = CreateButton("ResetPasswordButton", resetPasswordPanel.transform,
                    new Vector2(0.5f, 0.34f), new Vector2(0.5f, 0.34f), Vector2.zero, new Vector2(380f, 42f),
                    font, "Update Password", new Color(0.12f, 0.38f, 0.26f));

                var resetStatus = CreateText("ResetStatus", resetPasswordPanel.transform,
                    new Vector2(0.5f, 0.22f), new Vector2(0.5f, 0.22f), Vector2.zero, new Vector2(380f, 28f),
                    font, 12, TextAnchor.MiddleCenter, Color.gray);

                var resetBackToSignInBtn = CreateButton("ResetBackToSignInBtn", resetPasswordPanel.transform,
                    new Vector2(0.5f, 0.10f), new Vector2(0.5f, 0.10f), Vector2.zero, new Vector2(380f, 38f),
                    font, "Back to Sign In", new Color(0.16f, 0.20f, 0.25f));

                // --- 5. Signed In Panel ---
                var signedInPanel = new GameObject("SignedInPanel", typeof(RectTransform));
                signedInPanel.transform.SetParent(cardContainer.transform, false);
                var signedInRect = signedInPanel.GetComponent<RectTransform>();
                signedInRect.anchorMin = Vector2.zero;
                signedInRect.anchorMax = Vector2.one;
                signedInRect.offsetMin = new Vector2(25f, 20f);
                signedInRect.offsetMax = new Vector2(-25f, -20f);
                signedInPanel.SetActive(false);

                CreateText("SignedInTitle", signedInPanel.transform,
                    new Vector2(0.5f, 0.88f), new Vector2(0.5f, 0.88f), Vector2.zero, new Vector2(400f, 36f),
                    font, 24, TextAnchor.MiddleCenter, new Color(0.95f, 0.82f, 0.38f));

                var signedInLabel = CreateText("SignedInLabel", signedInPanel.transform,
                    new Vector2(0.5f, 0.70f), new Vector2(0.5f, 0.70f), Vector2.zero, new Vector2(380f, 36f),
                    font, 18, TextAnchor.MiddleCenter, new Color(0.85f, 0.95f, 0.85f));

                var accountStatusLabel = CreateText("AccountStatusLabel", signedInPanel.transform,
                    new Vector2(0.5f, 0.58f), new Vector2(0.5f, 0.58f), Vector2.zero, new Vector2(380f, 28f),
                    font, 14, TextAnchor.MiddleCenter, new Color(0.6f, 0.85f, 0.7f));

                var continueBtn = CreateButton("ContinueButton", signedInPanel.transform,
                    new Vector2(0.5f, 0.38f), new Vector2(0.5f, 0.38f), Vector2.zero, new Vector2(380f, 46f),
                    font, "Continue to Game", new Color(0.12f, 0.42f, 0.28f));

                var signOutBtn = CreateButton("SignOutButton", signedInPanel.transform,
                    new Vector2(0.5f, 0.22f), new Vector2(0.5f, 0.22f), Vector2.zero, new Vector2(380f, 42f),
                    font, "Sign Out", new Color(0.48f, 0.18f, 0.18f));

                // --- Shared Top Navigation ---
                var backBtn = CreateButton("BackButton", loginUIObj.transform,
                    new Vector2(0.03f, 0.94f), new Vector2(0.03f, 0.94f), new Vector2(60f, 0f), new Vector2(110f, 38f),
                    font, "Back", new Color(0.20f, 0.24f, 0.30f));

                var guestBtn = CreateButton("GuestButton", loginUIObj.transform,
                    new Vector2(0.97f, 0.94f), new Vector2(0.97f, 0.94f), new Vector2(-95f, 0f), new Vector2(180f, 38f),
                    font, "Play Offline (Guest)", new Color(0.15f, 0.32f, 0.45f));

                // Loading Spinner Indicator
                var spinnerObj = new GameObject("LoadingSpinner", typeof(RectTransform), typeof(Image));
                spinnerObj.transform.SetParent(cardContainer.transform, false);
                var spinRect = spinnerObj.GetComponent<RectTransform>();
                spinRect.anchorMin = new Vector2(0.5f, 0.5f);
                spinRect.anchorMax = new Vector2(0.5f, 0.5f);
                spinRect.sizeDelta = new Vector2(40f, 40f);
                var spinImg = spinnerObj.GetComponent<Image>();
                spinImg.color = new Color(0.85f, 0.72f, 0.35f, 0.8f);
                spinnerObj.SetActive(false);

                // Wire all references via SerializedObject
                var serializedLoginUI = new SerializedObject(loginUI);
                serializedLoginUI.FindProperty("emailField").objectReferenceValue = emailField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("passwordField").objectReferenceValue = passwordField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("togglePasswordVisibilityButton").objectReferenceValue = togglePasswordBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("passwordEyeText").objectReferenceValue = passwordEyeText;
                serializedLoginUI.FindProperty("rememberEmailToggle").objectReferenceValue = remToggle;
                serializedLoginUI.FindProperty("forgotPasswordButton").objectReferenceValue = forgotPasswordBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("signInButton").objectReferenceValue = signInBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("signInStatusText").objectReferenceValue = signInStatus.GetComponent<Text>();
                serializedLoginUI.FindProperty("switchToRegisterButton").objectReferenceValue = switchToRegBtn.GetComponent<Button>();

                serializedLoginUI.FindProperty("registerEmailField").objectReferenceValue = regEmailField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("registerNameField").objectReferenceValue = regNameField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("registerPasswordField").objectReferenceValue = regPasswordField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("registerConfirmPasswordField").objectReferenceValue = regConfirmPasswordField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("toggleRegPasswordVisibilityButton").objectReferenceValue = toggleRegPasswordBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("regPasswordEyeText").objectReferenceValue = regPasswordEyeText;
                serializedLoginUI.FindProperty("passwordStrengthBar").objectReferenceValue = strBarImg;
                serializedLoginUI.FindProperty("passwordStrengthText").objectReferenceValue = strTextObj.GetComponent<Text>();
                serializedLoginUI.FindProperty("registerRequirementsText").objectReferenceValue = reqTextObj.GetComponent<Text>();
                serializedLoginUI.FindProperty("registerButton").objectReferenceValue = registerBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("registerStatusText").objectReferenceValue = regStatus.GetComponent<Text>();
                serializedLoginUI.FindProperty("switchToSignInButton").objectReferenceValue = switchToSignInBtn.GetComponent<Button>();

                serializedLoginUI.FindProperty("forgotEmailField").objectReferenceValue = forgotEmailField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("sendRecoveryButton").objectReferenceValue = sendRecoveryBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("forgotStatusText").objectReferenceValue = forgotStatus.GetComponent<Text>();
                serializedLoginUI.FindProperty("forgotBackToSignInButton").objectReferenceValue = forgotBackBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("forgotHaveTokenButton").objectReferenceValue = forgotHaveTokenBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("forgotInstructionsText").objectReferenceValue = forgotInstructions.GetComponent<Text>();

                serializedLoginUI.FindProperty("resetTokenField").objectReferenceValue = resetTokenField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("resetPasswordField").objectReferenceValue = resetPasswordField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("resetConfirmPasswordField").objectReferenceValue = resetConfirmPasswordField.GetComponent<InputField>();
                serializedLoginUI.FindProperty("toggleResetPasswordVisibilityButton").objectReferenceValue = toggleResetPasswordBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("resetPasswordEyeText").objectReferenceValue = resetPasswordEyeText;
                serializedLoginUI.FindProperty("resetPasswordButton").objectReferenceValue = resetPasswordBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("resetStatusText").objectReferenceValue = resetStatus.GetComponent<Text>();
                serializedLoginUI.FindProperty("resetBackToSignInButton").objectReferenceValue = resetBackToSignInBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("resetInstructionsText").objectReferenceValue = resetInstructions.GetComponent<Text>();

                serializedLoginUI.FindProperty("signedInLabel").objectReferenceValue = signedInLabel.GetComponent<Text>();
                serializedLoginUI.FindProperty("accountStatusLabel").objectReferenceValue = accountStatusLabel.GetComponent<Text>();
                serializedLoginUI.FindProperty("continueButton").objectReferenceValue = continueBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("signOutButton").objectReferenceValue = signOutBtn.GetComponent<Button>();

                serializedLoginUI.FindProperty("backButton").objectReferenceValue = backBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("guestButton").objectReferenceValue = guestBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("loadingSpinner").objectReferenceValue = spinnerObj;

                serializedLoginUI.FindProperty("signInPanel").objectReferenceValue = signInPanel;
                serializedLoginUI.FindProperty("registerPanel").objectReferenceValue = registerPanel;
                serializedLoginUI.FindProperty("forgotPasswordPanel").objectReferenceValue = forgotPasswordPanel;
                serializedLoginUI.FindProperty("resetPasswordPanel").objectReferenceValue = resetPasswordPanel;
                serializedLoginUI.FindProperty("signedInPanel").objectReferenceValue = signedInPanel;
                var loginCg = loginUIObj.GetComponent<CanvasGroup>();
                if (loginCg == null) loginCg = loginUIObj.AddComponent<CanvasGroup>();
                loginCg.alpha = 0f;
                loginCg.interactable = false;
                loginCg.blocksRaycasts = false;
                if (serializedLoginUI.FindProperty("mainCanvasGroup") != null)
                    serializedLoginUI.FindProperty("mainCanvasGroup").objectReferenceValue = loginCg;
                if (serializedLoginUI.FindProperty("cardContainerRect") != null)
                    serializedLoginUI.FindProperty("cardContainerRect").objectReferenceValue = cardRect;
                serializedLoginUI.ApplyModifiedProperties();

                // Bind to TitleMenuController via SerializedObject
                var serializedTitle = new SerializedObject(titleCtrl);
                serializedTitle.FindProperty("beginGameButton").objectReferenceValue = btnBegin.GetComponent<Button>();
                serializedTitle.FindProperty("previousJourneyButton").objectReferenceValue = btnPrevious.GetComponent<Button>();
                serializedTitle.FindProperty("backupsSavesButton").objectReferenceValue = btnBackups.GetComponent<Button>();
                serializedTitle.FindProperty("settingsButton").objectReferenceValue = btnSettings.GetComponent<Button>();
                serializedTitle.FindProperty("creditsButton").objectReferenceValue = btnCredits.GetComponent<Button>();
                serializedTitle.FindProperty("quitButton").objectReferenceValue = btnQuit.GetComponent<Button>();

                serializedTitle.FindProperty("accountButton").objectReferenceValue = btnAccount.GetComponent<Button>();
                serializedTitle.FindProperty("accountStatusText").objectReferenceValue = accountStatusText;

                // Legacy aliases
                serializedTitle.FindProperty("newGameButton").objectReferenceValue = btnBegin.GetComponent<Button>();
                serializedTitle.FindProperty("continueButton").objectReferenceValue = btnPrevious.GetComponent<Button>();
                serializedTitle.FindProperty("savedGamesButton").objectReferenceValue = btnBackups.GetComponent<Button>();
                serializedTitle.FindProperty("loginButton").objectReferenceValue = btnAccount.GetComponent<Button>();

                // Panels
                serializedTitle.FindProperty("gameModeSelectionUI").objectReferenceValue = gameModeSelectionUI;
                serializedTitle.FindProperty("savedGamesUI").objectReferenceValue = savedGamesUI;
                serializedTitle.FindProperty("saveManagementUI").objectReferenceValue = saveManagementUI;
                serializedTitle.FindProperty("settingsMenu").objectReferenceValue = settingsUi;
                serializedTitle.FindProperty("creditsUI").objectReferenceValue = creditsUI;
                serializedTitle.FindProperty("loginUI").objectReferenceValue = loginUI;
                serializedTitle.FindProperty("confirmationDialog").objectReferenceValue = confirmDialog;
                serializedTitle.FindProperty("cinematicIntro").objectReferenceValue = introCtrl;
                if (serializedTitle.FindProperty("menuRoot") != null)
                    serializedTitle.FindProperty("menuRoot").objectReferenceValue = menuRoot;
                if (serializedTitle.FindProperty("menuContainer") != null)
                    serializedTitle.FindProperty("menuContainer").objectReferenceValue = menuContainer;
                serializedTitle.FindProperty("mainMenuAnimator").objectReferenceValue = menuAnimator;
                var ambientClip = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Ambience/temple_ambience.wav");
                if (ambientClip != null)
                {
                    serializedTitle.FindProperty("menuAmbienceClip").objectReferenceValue = ambientClip;
                }
                var uiClickClip = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Resources/Audio/ui_click.wav");
                if (uiClickClip != null && serializedTitle.FindProperty("clickClip") != null)
                {
                    serializedTitle.FindProperty("clickClip").objectReferenceValue = uiClickClip;
                }
                serializedTitle.ApplyModifiedProperties();

                // Save Boot Scene
                EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/00_Boot.unity");

                AssembleAllRegions.RegisterAllScenesInBuildSettings();

                Debug.Log("<color=#00FF88><b>[Whispering Wilds]</b></color> 00_Boot scene created and registered in Build Settings!");
            }
            catch (Exception ex)
            {
                Debug.LogError("[Whispering Wilds] Boot scene creation failed: " + ex);
            }
        }

        private static GameObject CreateText(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta, Font font, int fontSize, TextAnchor alignment, Color color)
        {
            var textObj = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            textObj.transform.SetParent(parent, false);
            var rect = textObj.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = sizeDelta;

            var txt = textObj.GetComponent<Text>();
            txt.font = font;
            txt.fontSize = fontSize;
            txt.alignment = alignment;
            txt.color = color;
            return textObj;
        }

        private static GameObject CreateButton(string name, Transform parent, Font font, string label, Color btnColor)
        {
            var btnObj = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button), typeof(Outline));
            btnObj.transform.SetParent(parent, false);
            var rect = btnObj.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(0, 52); // Comfortable AAA height

            var img = btnObj.GetComponent<Image>();
            // Dark smoked glass tint
            img.color = new Color(Mathf.Clamp01(btnColor.r * 0.30f + 0.07f), Mathf.Clamp01(btnColor.g * 0.30f + 0.09f), Mathf.Clamp01(btnColor.b * 0.30f + 0.12f), 0.92f);

            var outline = btnObj.GetComponent<Outline>();
            outline.effectColor = new Color(0.82f, 0.68f, 0.32f, 0.45f); // Antique gold border
            outline.effectDistance = new Vector2(1.5f, -1.5f);

            var btn = btnObj.GetComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(1.2f, 1.15f, 1.05f, 1f);
            colors.pressedColor = new Color(0.85f, 0.85f, 0.85f, 1f);
            btn.colors = colors;

            // Left Gold Accent Indicator
            var leftAccent = new GameObject("LeftAccent", typeof(RectTransform), typeof(Image));
            leftAccent.transform.SetParent(btnObj.transform, false);
            var laRect = leftAccent.GetComponent<RectTransform>();
            laRect.anchorMin = new Vector2(0f, 0.15f);
            laRect.anchorMax = new Vector2(0f, 0.85f);
            laRect.pivot = new Vector2(0f, 0.5f);
            laRect.anchoredPosition = new Vector2(4f, 0f);
            laRect.sizeDelta = new Vector2(4f, 0f);
            var laImg = leftAccent.GetComponent<Image>();
            laImg.color = new Color(1.0f, 0.88f, 0.42f, 0.95f);
            laImg.raycastTarget = false;
            leftAccent.SetActive(false);

            var textObj = CreateText("Label", btnObj.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, font, 18, TextAnchor.MiddleCenter, new Color(0.94f, 0.92f, 0.84f, 1f));
            textObj.GetComponent<Text>().text = label;

            return btnObj;
        }

        private static GameObject CreateButton(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta, Font font, string label, Color btnColor)
        {
            var btnObj = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button), typeof(Outline));
            btnObj.transform.SetParent(parent, false);
            var rect = btnObj.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = sizeDelta;

            var img = btnObj.GetComponent<Image>();
            img.color = new Color(Mathf.Clamp01(btnColor.r * 0.30f + 0.07f), Mathf.Clamp01(btnColor.g * 0.30f + 0.09f), Mathf.Clamp01(btnColor.b * 0.30f + 0.12f), 0.92f);

            var outline = btnObj.GetComponent<Outline>();
            outline.effectColor = new Color(0.82f, 0.68f, 0.32f, 0.45f);
            outline.effectDistance = new Vector2(1.5f, -1.5f);

            var btn = btnObj.GetComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(1.2f, 1.15f, 1.05f, 1f);
            colors.pressedColor = new Color(0.85f, 0.85f, 0.85f, 1f);
            btn.colors = colors;

            var leftAccent = new GameObject("LeftAccent", typeof(RectTransform), typeof(Image));
            leftAccent.transform.SetParent(btnObj.transform, false);
            var laRect = leftAccent.GetComponent<RectTransform>();
            laRect.anchorMin = new Vector2(0f, 0.15f);
            laRect.anchorMax = new Vector2(0f, 0.85f);
            laRect.pivot = new Vector2(0f, 0.5f);
            laRect.anchoredPosition = new Vector2(4f, 0f);
            laRect.sizeDelta = new Vector2(4f, 0f);
            var laImg = leftAccent.GetComponent<Image>();
            laImg.color = new Color(1.0f, 0.88f, 0.42f, 0.95f);
            laImg.raycastTarget = false;
            leftAccent.SetActive(false);

            var textObj = CreateText("Label", btnObj.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, font, 18, TextAnchor.MiddleCenter, new Color(0.94f, 0.92f, 0.84f, 1f));
            textObj.GetComponent<Text>().text = label;

            return btnObj;
        }

        /// <summary>
        /// Creates an InputField with a placeholder text for the login panel.
        /// </summary>
        private static GameObject CreateInputField(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta, Font font, string placeholder)
        {
            var fieldObj = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(InputField));
            fieldObj.transform.SetParent(parent, false);
            var rect = fieldObj.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = sizeDelta;

            var img = fieldObj.GetComponent<Image>();
            img.color = new Color(0.12f, 0.14f, 0.16f, 0.9f);

            var inputField = fieldObj.GetComponent<InputField>();
            inputField.textComponent = null; // We'll create a separate text child

            // Create placeholder text
            var placeholderObj = new GameObject("Placeholder", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            placeholderObj.transform.SetParent(fieldObj.transform, false);
            var placeholderRect = placeholderObj.GetComponent<RectTransform>();
            placeholderRect.anchorMin = new Vector2(0f, 0f);
            placeholderRect.anchorMax = new Vector2(1f, 1f);
            placeholderRect.offsetMin = new Vector2(10f, 5f);
            placeholderRect.offsetMax = new Vector2(10f, 5f);
            var placeholderText = placeholderObj.GetComponent<Text>();
            placeholderText.font = font;
            placeholderText.fontSize = 16;
            placeholderText.alignment = TextAnchor.MiddleLeft;
            placeholderText.color = new Color(0.5f, 0.5f, 0.5f);
            placeholderText.text = placeholder;
            placeholderText.raycastTarget = false;
            inputField.placeholder = placeholderText;

            // Create text component
            var textObj = new GameObject("Text", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            textObj.transform.SetParent(fieldObj.transform, false);
            var textRect = textObj.GetComponent<RectTransform>();
            textRect.anchorMin = new Vector2(0f, 0f);
            textRect.anchorMax = new Vector2(1f, 1f);
            textRect.offsetMin = new Vector2(10f, 5f);
            textRect.offsetMax = new Vector2(10f, 5f);
            var textComp = textObj.GetComponent<Text>();
            textComp.font = font;
            textComp.fontSize = 16;
            textComp.alignment = TextAnchor.MiddleLeft;
            textComp.color = Color.white;
            textComp.raycastTarget = false;
            inputField.textComponent = textComp;

            return fieldObj;
        }

        /// <summary>
        /// Builds the settings panel as a full-screen overlay on the title canvas: a tab strip
        /// plus one page per settings group. Starts inactive so the title menu looks unchanged
        /// until the player chooses Settings.
        /// </summary>
        private static GameObject BuildSettingsPanel(Transform parent, Font font)
        {
            var root = new GameObject("SettingsPanel", typeof(RectTransform), typeof(Image));
            root.transform.SetParent(parent, false);
            var rect = root.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var bg = root.GetComponent<Image>();
            bg.color = new Color(0.04f, 0.06f, 0.09f, 0.72f);

            var ui = root.AddComponent<SettingsMenuUI>();

            // Tab strip
            var tabs = new GameObject("Tabs", typeof(RectTransform));
            tabs.transform.SetParent(root.transform, false);
            var tabsRect = tabs.GetComponent<RectTransform>();
            tabsRect.anchorMin = new Vector2(0.5f, 1f);
            tabsRect.anchorMax = new Vector2(0.5f, 1f);
            tabsRect.pivot = new Vector2(0.5f, 1f);
            tabsRect.anchoredPosition = new Vector2(0f, -24f);
            tabsRect.sizeDelta = new Vector2(760f, 56f);

            var tabLayout = tabs.AddComponent<HorizontalLayoutGroup>();
            tabLayout.spacing = 16f;
            tabLayout.childControlWidth = false;
            tabLayout.childControlHeight = true;
            tabLayout.childForceExpandWidth = false;
            tabLayout.childAlignment = TextAnchor.MiddleCenter;

            var btnTabLang = CreateButton("Tab_Language", tabs.transform, font, "Language", new Color(0.18f, 0.32f, 0.42f));
            var btnTabDisplay = CreateButton("Tab_Display", tabs.transform, font, "Display", new Color(0.18f, 0.32f, 0.42f));
            var btnTabQuality = CreateButton("Tab_Quality", tabs.transform, font, "Graphics", new Color(0.18f, 0.32f, 0.42f));
            var btnTabAudio = CreateButton("Tab_Audio", tabs.transform, font, "Audio", new Color(0.18f, 0.32f, 0.42f));
            var btnTabControls = CreateButton("Tab_Controls", tabs.transform, font, "Controls", new Color(0.18f, 0.32f, 0.42f));
            var btnTabAccessibility = CreateButton("Tab_Accessibility", tabs.transform, font, "A11y", new Color(0.18f, 0.32f, 0.42f));
            foreach (var b in new[] { btnTabLang, btnTabDisplay, btnTabQuality, btnTabAudio, btnTabControls, btnTabAccessibility })
            {
                var bRect = b.GetComponent<RectTransform>();
                bRect.sizeDelta = new Vector2(120f, 48f);
            }

            var btnClose = CreateButton("Btn_Close", root.transform, font, "Back", new Color(0.4f, 0.24f, 0.24f));
            var closeRect = btnClose.GetComponent<RectTransform>();
            closeRect.anchorMin = new Vector2(0.5f, 0f);
            closeRect.anchorMax = new Vector2(0.5f, 0f);
            closeRect.pivot = new Vector2(0.5f, 0f);
            closeRect.anchoredPosition = new Vector2(0f, 24f);
            closeRect.sizeDelta = new Vector2(240f, 48f);

            // Language page
            var langPage = CreatePage("Page_Language", root.transform);
            var langTitle = CreateText("Title", langPage.transform, new Vector2(0.5f, 0.72f), new Vector2(0.5f, 0.72f), Vector2.zero, new Vector2(640f, 56f), font, 30, TextAnchor.MiddleCenter, new Color(1f, 0.9f, 0.7f));

            var englishBtn = CreateButton("Option_English", langPage.transform, font, "English", new Color(0.16f, 0.55f, 0.42f));
            PositionCenteredOption(englishBtn, 0.56f, 1f);
            var tamilBtn = CreateButton("Option_Tamil", langPage.transform, font, "Tamil", new Color(0.16f, 0.55f, 0.42f));
            PositionCenteredOption(tamilBtn, 0.46f, 1f);

            englishBtn.GetComponent<Button>().onClick.AddListener(ui.SelectEnglish);
            tamilBtn.GetComponent<Button>().onClick.AddListener(ui.SelectTamil);

            // Display page
            var displayPage = CreatePage("Page_Display", root.transform);
            var dispTitle = CreateText("Title", displayPage.transform, new Vector2(0.5f, 0.78f), new Vector2(0.5f, 0.78f), Vector2.zero, new Vector2(640f, 56f), font, 30, TextAnchor.MiddleCenter, new Color(1f, 0.9f, 0.7f));

            Text uiScaleLabel, uiScaleValue, fsLabel, fsValue, resLabel, resValue, vsLabel, vsValue, flLabel, flValue, unavail;
            Button uiScaleLeft, uiScaleRight, fsToggle, resLeft, resRight, vsToggle, flLeft, flRight;

            uiScaleLabel = CreateRowLabel("Row_UiScale", displayPage.transform, font, 0.66f, "UI Scale");
            uiScaleValue = CreateRowValue("Row_UiScale", displayPage.transform, font, 0.66f);
            uiScaleLeft = CreateRowButton("Row_UiScale", displayPage.transform, font, 0.66f, "<");
            uiScaleRight = CreateRowButton("Row_UiScale", displayPage.transform, font, 0.66f, ">");
            SetNavigation(uiScaleLeft, uiScaleRight, uiScaleLeft, uiScaleRight);

            fsLabel = CreateRowLabel("Row_Fullscreen", displayPage.transform, font, 0.58f, "Fullscreen");
            fsValue = CreateRowValue("Row_Fullscreen", displayPage.transform, font, 0.58f);
            fsToggle = CreateRowButton("Row_Fullscreen", displayPage.transform, font, 0.58f, "Toggle");

            resLabel = CreateRowLabel("Row_Resolution", displayPage.transform, font, 0.50f, "Resolution");
            resValue = CreateRowValue("Row_Resolution", displayPage.transform, font, 0.50f);
            resLeft = CreateRowButton("Row_Resolution", displayPage.transform, font, 0.50f, "<");
            resRight = CreateRowButton("Row_Resolution", displayPage.transform, font, 0.50f, ">");
            SetNavigation(resLeft, resRight, resLeft, resRight);

            vsLabel = CreateRowLabel("Row_VSync", displayPage.transform, font, 0.42f, "VSync");
            vsValue = CreateRowValue("Row_VSync", displayPage.transform, font, 0.42f);
            vsToggle = CreateRowButton("Row_VSync", displayPage.transform, font, 0.42f, "Toggle");

            flLabel = CreateRowLabel("Row_FrameLimit", displayPage.transform, font, 0.34f, "Frame Rate Limit");
            flValue = CreateRowValue("Row_FrameLimit", displayPage.transform, font, 0.34f);
            flLeft = CreateRowButton("Row_FrameLimit", displayPage.transform, font, 0.34f, "<");
            flRight = CreateRowButton("Row_FrameLimit", displayPage.transform, font, 0.34f, ">");
            SetNavigation(flLeft, flRight, flLeft, flRight);

unavail = CreateText("UnavailableNote", displayPage.transform,
                new Vector2(0.5f, 0.20f), new Vector2(0.5f, 0.20f), Vector2.zero, new Vector2(1000f, 40f), font, 16, TextAnchor.MiddleCenter, new Color(1f, 0.7f, 0.25f))
                .GetComponent<Text>();

            // Quality page
            var qualityPage = CreatePage("Page_Quality", root.transform);
            var qTitle = CreateText("Title", qualityPage.transform, new Vector2(0.5f, 0.70f), new Vector2(0.5f, 0.70f), Vector2.zero, new Vector2(640f, 56f), font, 30, TextAnchor.MiddleCenter, new Color(1f, 0.9f, 0.7f));

            var qLeft = CreateButton("QualityLeft", qualityPage.transform, font, "<", new Color(0.2f, 0.3f, 0.4f));
            var qValue = CreateText("QualityValue", qualityPage.transform, new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(360f, 60f), font, 28, TextAnchor.MiddleCenter, Color.white);
            var qRight = CreateButton("QualityRight", qualityPage.transform, font, ">", new Color(0.2f, 0.3f, 0.4f));
            PositionCenteredOption(qLeft, 0.52f, -1f);
            PositionCenteredOption(qRight, 0.52f, 1f);
            SetNavigation(qLeft, qRight, qLeft, qRight);

            var qHint = CreateText("QualityHint", qualityPage.transform, new Vector2(0.5f, 0.34f), new Vector2(0.5f, 0.34f), Vector2.zero, new Vector2(760f, 40f), font, 16, TextAnchor.MiddleCenter, new Color(0.75f, 0.8f, 0.85f));

            // Audio page
            var audioPage = CreatePage("Page_Audio", root.transform);
            var aTitle = CreateText("Title", audioPage.transform, new Vector2(0.5f, 0.78f), new Vector2(0.5f, 0.78f), Vector2.zero, new Vector2(640f, 56f), font, 30, TextAnchor.MiddleCenter, new Color(1f, 0.9f, 0.7f));

            Text masterVolValue, musicVolValue, sfxVolValue, ambienceVolValue, dialogueVolValue, uiVolValue;
            Button masterVolLeft, masterVolRight, musicVolLeft, musicVolRight, sfxVolLeft, sfxVolRight;
            Button ambienceVolLeft, ambienceVolRight, dialogueVolLeft, dialogueVolRight, uiVolLeft, uiVolRight;

            masterVolValue = CreateRowValue("Row_MasterVol", audioPage.transform, font, 0.68f);
            masterVolLeft = CreateRowButton("Row_MasterVol", audioPage.transform, font, 0.68f, "<");
            masterVolRight = CreateRowButton("Row_MasterVol", audioPage.transform, font, 0.68f, ">");
            SetNavigation(masterVolLeft, masterVolRight, masterVolLeft, masterVolRight);

            musicVolValue = CreateRowValue("Row_MusicVol", audioPage.transform, font, 0.58f);
            musicVolLeft = CreateRowButton("Row_MusicVol", audioPage.transform, font, 0.58f, "<");
            musicVolRight = CreateRowButton("Row_MusicVol", audioPage.transform, font, 0.58f, ">");
            SetNavigation(musicVolLeft, musicVolRight, musicVolLeft, musicVolRight);

            sfxVolValue = CreateRowValue("Row_SfxVol", audioPage.transform, font, 0.48f);
            sfxVolLeft = CreateRowButton("Row_SfxVol", audioPage.transform, font, 0.48f, "<");
            sfxVolRight = CreateRowButton("Row_SfxVol", audioPage.transform, font, 0.48f, ">");
            SetNavigation(sfxVolLeft, sfxVolRight, sfxVolLeft, sfxVolRight);

            ambienceVolValue = CreateRowValue("Row_AmbienceVol", audioPage.transform, font, 0.38f);
            ambienceVolLeft = CreateRowButton("Row_AmbienceVol", audioPage.transform, font, 0.38f, "<");
            ambienceVolRight = CreateRowButton("Row_AmbienceVol", audioPage.transform, font, 0.38f, ">");
            SetNavigation(ambienceVolLeft, ambienceVolRight, ambienceVolLeft, ambienceVolRight);

            dialogueVolValue = CreateRowValue("Row_DialogueVol", audioPage.transform, font, 0.28f);
            dialogueVolLeft = CreateRowButton("Row_DialogueVol", audioPage.transform, font, 0.28f, "<");
            dialogueVolRight = CreateRowButton("Row_DialogueVol", audioPage.transform, font, 0.28f, ">");
            SetNavigation(dialogueVolLeft, dialogueVolRight, dialogueVolLeft, dialogueVolRight);

            uiVolValue = CreateRowValue("Row_UiVol", audioPage.transform, font, 0.18f);
            uiVolLeft = CreateRowButton("Row_UiVol", audioPage.transform, font, 0.18f, "<");
            uiVolRight = CreateRowButton("Row_UiVol", audioPage.transform, font, 0.18f, ">");
            SetNavigation(uiVolLeft, uiVolRight, uiVolLeft, uiVolRight);

            // Wire audio buttons to SettingsMenuUI methods
            masterVolLeft.GetComponent<Button>().onClick.AddListener(() => ui.AdjustMasterVolume(-0.05f));
            masterVolRight.GetComponent<Button>().onClick.AddListener(() => ui.AdjustMasterVolume(0.05f));
            musicVolLeft.GetComponent<Button>().onClick.AddListener(() => ui.AdjustMusicVolume(-0.05f));
            musicVolRight.GetComponent<Button>().onClick.AddListener(() => ui.AdjustMusicVolume(0.05f));
            sfxVolLeft.GetComponent<Button>().onClick.AddListener(() => ui.AdjustSfxVolume(-0.05f));
            sfxVolRight.GetComponent<Button>().onClick.AddListener(() => ui.AdjustSfxVolume(0.05f));
            ambienceVolLeft.GetComponent<Button>().onClick.AddListener(() => ui.AdjustAmbienceVolume(-0.05f));
            ambienceVolRight.GetComponent<Button>().onClick.AddListener(() => ui.AdjustAmbienceVolume(0.05f));
            dialogueVolLeft.GetComponent<Button>().onClick.AddListener(() => ui.AdjustDialogueVolume(-0.05f));
            dialogueVolRight.GetComponent<Button>().onClick.AddListener(() => ui.AdjustDialogueVolume(0.05f));
            uiVolLeft.GetComponent<Button>().onClick.AddListener(() => ui.AdjustUiVolume(-0.05f));
            uiVolRight.GetComponent<Button>().onClick.AddListener(() => ui.AdjustUiVolume(0.05f));

            // Controls page
            var controlsPage = CreatePage("Page_Controls", root.transform);
            var cTitle = CreateText("Title", controlsPage.transform, new Vector2(0.5f, 0.78f), new Vector2(0.5f, 0.78f), Vector2.zero, new Vector2(640f, 56f), font, 30, TextAnchor.MiddleCenter, new Color(1f, 0.9f, 0.7f));

            Text mouseSensValue, invertYValue, invertXValue, cameraSmoothingValue, sprintModeValue, crouchModeValue;
            Button mouseSensLeft, mouseSensRight, invertYToggle, invertXToggle, sprintToggle, crouchToggle, resetControlsBtn;

            mouseSensValue = CreateRowValue("Row_MouseSens", controlsPage.transform, font, 0.70f);
            mouseSensLeft = CreateRowButton("Row_MouseSens", controlsPage.transform, font, 0.70f, "<");
            mouseSensRight = CreateRowButton("Row_MouseSens", controlsPage.transform, font, 0.70f, ">");
            SetNavigation(mouseSensLeft, mouseSensRight, mouseSensLeft, mouseSensRight);

            invertYValue = CreateRowValue("Row_InvertY", controlsPage.transform, font, 0.60f);
            invertYToggle = CreateRowButton("Row_InvertY", controlsPage.transform, font, 0.60f, "Toggle");

            invertXValue = CreateRowValue("Row_InvertX", controlsPage.transform, font, 0.50f);
            invertXToggle = CreateRowButton("Row_InvertX", controlsPage.transform, font, 0.50f, "Toggle");

            cameraSmoothingValue = CreateRowValue("Row_CameraSmooth", controlsPage.transform, font, 0.40f);

            sprintModeValue = CreateRowValue("Row_SprintMode", controlsPage.transform, font, 0.30f);
            sprintToggle = CreateRowButton("Row_SprintMode", controlsPage.transform, font, 0.30f, "Toggle");

            crouchModeValue = CreateRowValue("Row_CrouchMode", controlsPage.transform, font, 0.20f);
            crouchToggle = CreateRowButton("Row_CrouchMode", controlsPage.transform, font, 0.20f, "Toggle");

            var resetControlsBtnObj = CreateButton("Btn_ResetControls", controlsPage.transform, font, "Reset Defaults", new Color(0.4f, 0.24f, 0.24f));
            resetControlsBtn = resetControlsBtnObj.GetComponent<Button>();
            var resetRect = resetControlsBtnObj.GetComponent<RectTransform>();
            resetRect.anchorMin = new Vector2(0.5f, 0.08f);
            resetRect.anchorMax = new Vector2(0.5f, 0.08f);
            resetRect.pivot = new Vector2(0.5f, 0f);
            resetRect.anchoredPosition = Vector2.zero;
            resetRect.sizeDelta = new Vector2(240f, 40f);

            // Wire controls buttons
            mouseSensLeft.GetComponent<Button>().onClick.AddListener(() => ui.AdjustMouseSensitivity(-0.1f));
            mouseSensRight.GetComponent<Button>().onClick.AddListener(() => ui.AdjustMouseSensitivity(0.1f));
            invertYToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleInvertY);
            invertXToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleInvertX);
            sprintToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleSprintMode);
            crouchToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleCrouchMode);
            resetControlsBtn.GetComponent<Button>().onClick.AddListener(ui.ResetControlsToDefault);

            // Accessibility page
            var accessibilityPage = CreatePage("Page_Accessibility", root.transform);
            var acTitle = CreateText("Title", accessibilityPage.transform, new Vector2(0.5f, 0.78f), new Vector2(0.5f, 0.78f), Vector2.zero, new Vector2(640f, 56f), font, 30, TextAnchor.MiddleCenter, new Color(1f, 0.9f, 0.7f));

            Text subtitlesValue, subtitleBgValue, subtitleSizeValue, screenShakeValue, motionBlurValue, colorblindValue;
            Button subtitlesToggle, subtitleBgToggle, subtitleSizeCycle, screenShakeToggle, motionBlurToggle, colorblindCycle;

            subtitlesValue = CreateRowValue("Row_Subtitles", accessibilityPage.transform, font, 0.70f);
            subtitlesToggle = CreateRowButton("Row_Subtitles", accessibilityPage.transform, font, 0.70f, "Toggle");

            subtitleBgValue = CreateRowValue("Row_SubtitleBg", accessibilityPage.transform, font, 0.60f);
            subtitleBgToggle = CreateRowButton("Row_SubtitleBg", accessibilityPage.transform, font, 0.60f, "Toggle");

            subtitleSizeValue = CreateRowValue("Row_SubtitleSize", accessibilityPage.transform, font, 0.50f);
            subtitleSizeCycle = CreateRowButton("Row_SubtitleSize", accessibilityPage.transform, font, 0.50f, "Cycle");

            screenShakeValue = CreateRowValue("Row_ScreenShake", accessibilityPage.transform, font, 0.40f);
            screenShakeToggle = CreateRowButton("Row_ScreenShake", accessibilityPage.transform, font, 0.40f, "Toggle");

            motionBlurValue = CreateRowValue("Row_MotionBlur", accessibilityPage.transform, font, 0.30f);
            motionBlurToggle = CreateRowButton("Row_MotionBlur", accessibilityPage.transform, font, 0.30f, "Toggle");

            colorblindValue = CreateRowValue("Row_Colorblind", accessibilityPage.transform, font, 0.20f);
            colorblindCycle = CreateRowButton("Row_Colorblind", accessibilityPage.transform, font, 0.20f, "Cycle");

            // Wire accessibility buttons
            subtitlesToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleSubtitles);
            subtitleBgToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleSubtitleBg);
            subtitleSizeCycle.GetComponent<Button>().onClick.AddListener(ui.CycleSubtitleSize);
            screenShakeToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleScreenShake);
            motionBlurToggle.GetComponent<Button>().onClick.AddListener(ui.ToggleMotionBlur);
            colorblindCycle.GetComponent<Button>().onClick.AddListener(ui.CycleColorblindMode);

            // Bind everything.
            var so = new SerializedObject(ui);
            so.FindProperty("panelRoot").objectReferenceValue = root;
            so.FindProperty("languageTabButton").objectReferenceValue = btnTabLang.GetComponent<Button>();
            so.FindProperty("displayTabButton").objectReferenceValue = btnTabDisplay.GetComponent<Button>();
            so.FindProperty("qualityTabButton").objectReferenceValue = btnTabQuality.GetComponent<Button>();
            so.FindProperty("audioTabButton").objectReferenceValue = btnTabAudio.GetComponent<Button>();
            so.FindProperty("controlsTabButton").objectReferenceValue = btnTabControls.GetComponent<Button>();
            so.FindProperty("accessibilityTabButton").objectReferenceValue = btnTabAccessibility.GetComponent<Button>();
            so.FindProperty("closeButton").objectReferenceValue = btnClose.GetComponent<Button>();

            so.FindProperty("languagePage").objectReferenceValue = langPage;
            so.FindProperty("languageTitleText").objectReferenceValue = langTitle.GetComponent<Text>();
            so.FindProperty("englishOptionText").objectReferenceValue = englishBtn.GetComponentInChildren<Text>();
            so.FindProperty("tamilOptionText").objectReferenceValue = tamilBtn.GetComponentInChildren<Text>();
            so.FindProperty("englishOptionBackground").objectReferenceValue = englishBtn.GetComponent<Image>();
            so.FindProperty("tamilOptionBackground").objectReferenceValue = tamilBtn.GetComponent<Image>();

            so.FindProperty("displayPage").objectReferenceValue = displayPage;
            so.FindProperty("displayTitleText").objectReferenceValue = dispTitle.GetComponent<Text>();
            so.FindProperty("uiScaleLabelText").objectReferenceValue = uiScaleLabel;
            so.FindProperty("uiScaleValueText").objectReferenceValue = uiScaleValue;
            so.FindProperty("uiScaleLeftButton").objectReferenceValue = uiScaleLeft.GetComponent<Button>();
            so.FindProperty("uiScaleRightButton").objectReferenceValue = uiScaleRight.GetComponent<Button>();
            so.FindProperty("fullscreenLabelText").objectReferenceValue = fsLabel;
            so.FindProperty("fullscreenValueText").objectReferenceValue = fsValue;
            so.FindProperty("fullscreenToggleButton").objectReferenceValue = fsToggle.GetComponent<Button>();
            so.FindProperty("resolutionLabelText").objectReferenceValue = resLabel;
            so.FindProperty("resolutionValueText").objectReferenceValue = resValue;
            so.FindProperty("resolutionLeftButton").objectReferenceValue = resLeft.GetComponent<Button>();
            so.FindProperty("resolutionRightButton").objectReferenceValue = resRight.GetComponent<Button>();
            so.FindProperty("vsyncLabelText").objectReferenceValue = vsLabel;
            so.FindProperty("vsyncValueText").objectReferenceValue = vsValue;
            so.FindProperty("vsyncToggleButton").objectReferenceValue = vsToggle.GetComponent<Button>();
            so.FindProperty("frameLimitLabelText").objectReferenceValue = flLabel;
            so.FindProperty("frameLimitValueText").objectReferenceValue = flValue;
            so.FindProperty("frameLimitLeftButton").objectReferenceValue = flLeft.GetComponent<Button>();
            so.FindProperty("frameLimitRightButton").objectReferenceValue = flRight.GetComponent<Button>();
            so.FindProperty("unavailableText").objectReferenceValue = unavail;

            so.FindProperty("qualityPage").objectReferenceValue = qualityPage;
            so.FindProperty("qualityTitleText").objectReferenceValue = qTitle.GetComponent<Text>();
            so.FindProperty("qualityValueText").objectReferenceValue = qValue.GetComponent<Text>();
            so.FindProperty("qualityLeftButton").objectReferenceValue = qLeft.GetComponent<Button>();
            so.FindProperty("qualityRightButton").objectReferenceValue = qRight.GetComponent<Button>();
            so.FindProperty("qualityHintText").objectReferenceValue = qHint.GetComponent<Text>();

            // Audio page bindings
            so.FindProperty("audioPage").objectReferenceValue = audioPage;
            so.FindProperty("audioTitleText").objectReferenceValue = aTitle.GetComponent<Text>();
            so.FindProperty("masterVolValueText").objectReferenceValue = masterVolValue;
            so.FindProperty("musicVolValueText").objectReferenceValue = musicVolValue;
            so.FindProperty("sfxVolValueText").objectReferenceValue = sfxVolValue;
            so.FindProperty("ambienceVolValueText").objectReferenceValue = ambienceVolValue;
            so.FindProperty("dialogueVolValueText").objectReferenceValue = dialogueVolValue;
            so.FindProperty("uiVolValueText").objectReferenceValue = uiVolValue;

            // Controls page bindings
            so.FindProperty("controlsPage").objectReferenceValue = controlsPage;
            so.FindProperty("controlsTitleText").objectReferenceValue = cTitle.GetComponent<Text>();
            so.FindProperty("mouseSensValueText").objectReferenceValue = mouseSensValue;
            so.FindProperty("invertYValueText").objectReferenceValue = invertYValue;
            so.FindProperty("invertXValueText").objectReferenceValue = invertXValue;
            so.FindProperty("cameraSmoothingValueText").objectReferenceValue = cameraSmoothingValue;
            so.FindProperty("sprintModeValueText").objectReferenceValue = sprintModeValue;
            so.FindProperty("crouchModeValueText").objectReferenceValue = crouchModeValue;

            // Accessibility page bindings
            so.FindProperty("accessibilityPage").objectReferenceValue = accessibilityPage;
            so.FindProperty("accessibilityTitleText").objectReferenceValue = acTitle.GetComponent<Text>();
            so.FindProperty("subtitlesValueText").objectReferenceValue = subtitlesValue;
            so.FindProperty("subtitleBgValueText").objectReferenceValue = subtitleBgValue;
            so.FindProperty("subtitleSizeValueText").objectReferenceValue = subtitleSizeValue;
            so.FindProperty("screenShakeValueText").objectReferenceValue = screenShakeValue;
            so.FindProperty("motionBlurValueText").objectReferenceValue = motionBlurValue;
            so.FindProperty("colorblindValueText").objectReferenceValue = colorblindValue;
            so.ApplyModifiedProperties();

            // Selection navigation across pages, so a controller can reach Close from a row.
            SetNavigation(btnTabLang, btnTabDisplay, btnTabDisplay, btnTabLang);
            SetNavigation(btnTabDisplay, btnTabQuality, btnTabQuality, btnTabDisplay);
            SetNavigation(btnTabQuality, btnTabAudio, btnTabAudio, btnTabQuality);
            SetNavigation(btnTabAudio, btnTabControls, btnTabControls, btnTabAudio);
            SetNavigation(btnTabControls, btnTabAccessibility, btnTabAccessibility, btnTabControls);
            SetNavigation(btnTabAccessibility, btnClose, btnClose, btnTabAccessibility);
            SetNavigation(btnClose, btnTabLang, btnTabLang, btnClose);

            root.SetActive(false);
            return root;
        }

        private static GameObject CreatePage(string name, Transform parent)
        {
            var page = new GameObject(name, typeof(RectTransform));
            page.transform.SetParent(parent, false);
            var rect = page.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            page.SetActive(false);
            return page;
        }

        private static Text CreateRowLabel(string rowName, Transform parent, Font font, float y, string label)
        {
            var text = CreateText("Label", parent, new Vector2(0f, y), new Vector2(0f, y), new Vector2(90f, 0f), new Vector2(420f, 44f), font, 20, TextAnchor.MiddleLeft, new Color(0.85f, 0.88f, 0.92f));
            text.GetComponent<Text>().text = label;
            text.transform.SetParent(FindRow(parent, rowName), false);
            return text.GetComponent<Text>();
        }

        private static Text CreateRowValue(string rowName, Transform parent, Font font, float y)
        {
            var text = CreateText("Value", parent, new Vector2(1f, y), new Vector2(1f, y), new Vector2(-230f, 0f), new Vector2(340f, 44f), font, 20, TextAnchor.MiddleCenter, new Color(1f, 0.95f, 0.75f));
            text.transform.SetParent(FindRow(parent, rowName), false);
            return text.GetComponent<Text>();
        }

        private static Button CreateRowButton(string rowName, Transform parent, Font font, float y, string label)
        {
            var btn = CreateButton("Toggle", parent, font, label, new Color(0.2f, 0.3f, 0.4f));
            btn.transform.SetParent(FindRow(parent, rowName), false);
            var rect = btn.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(1f, 0.5f);
            rect.anchorMax = new Vector2(1f, 0.5f);
            rect.pivot = new Vector2(1f, 0.5f);
            rect.anchoredPosition = new Vector2(-30f, 0f);
            rect.sizeDelta = new Vector2(150f, 40f);
            return btn.GetComponent<Button>();
        }

        private static Transform FindRow(Transform parent, string rowName)
        {
            var existing = parent.Find(rowName);
            if (existing != null) return existing;

            var row = new GameObject(rowName, typeof(RectTransform));
            row.transform.SetParent(parent, false);
            return row.transform;
        }

        private static void PositionCenteredOption(GameObject option, float y, float xOffset)
        {
            var rect = option.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, y);
            rect.anchorMax = new Vector2(0.5f, y);
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = new Vector2(xOffset * 180f, 0f);
            rect.sizeDelta = new Vector2(340f, 64f);
        }

        /// <summary>
        /// Points a pair of buttons at their left/right neighbours so a controller can traverse
        /// the settings screen. Accepts either form the builders return.
        /// </summary>
        private static void SetNavigation(GameObject a, GameObject b, GameObject left, GameObject right)
        {
            ApplyNavigation(a == null ? null : a.GetComponent<Button>(), left, right);
            ApplyNavigation(b == null ? null : b.GetComponent<Button>(), left, right);
        }

        private static void SetNavigation(Button a, Button b, Button left, Button right)
        {
            ApplyNavigation(a, left, right);
            ApplyNavigation(b, left, right);
        }

        private static void ApplyNavigation(Button button, GameObject left, GameObject right)
        {
            ApplyNavigation(button,
                left == null ? null : left.GetComponent<Selectable>(),
                right == null ? null : right.GetComponent<Selectable>());
        }

        private static void ApplyNavigation(Button button, Selectable left, Selectable right)
        {
            if (button == null) return;

            var nav = button.navigation;
            nav.mode = Navigation.Mode.Explicit;
            nav.selectOnLeft = left;
            nav.selectOnRight = right;
            button.navigation = nav;
        }

        /// <summary>
        /// Builds a centered confirmation dialog panel with a message and two buttons.
        /// Starts inactive so the title menu looks unchanged until the player triggers it.
        /// </summary>
        private static GameObject BuildConfirmationDialog(Transform parent, Font font)
        {
            var root = new GameObject("ConfirmationDialog", typeof(RectTransform), typeof(Image));
            root.transform.SetParent(parent, false);
            root.SetActive(false);

            var rect = root.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var bg = root.GetComponent<Image>();
            bg.color = new Color(0f, 0f, 0f, 0.85f);

            var dialog = root.AddComponent<ConfirmationDialog>();

            // Centered card panel
            var card = new GameObject("Card", typeof(RectTransform), typeof(Image));
            card.transform.SetParent(root.transform, false);
            var cardRect = card.GetComponent<RectTransform>();
            cardRect.anchorMin = new Vector2(0.5f, 0.5f);
            cardRect.anchorMax = new Vector2(0.5f, 0.5f);
            cardRect.pivot = new Vector2(0.5f, 0.5f);
            cardRect.anchoredPosition = Vector2.zero;
            cardRect.sizeDelta = new Vector2(560f, 240f);
            var cardImg = card.GetComponent<Image>();
            cardImg.color = new Color(0.08f, 0.1f, 0.12f, 1f);

            // Message text
            var messageObj = CreateText("MessageText", card.transform, new Vector2(0.05f, 0.25f), new Vector2(0.95f, 0.75f), Vector2.zero, Vector2.zero, font, 20, TextAnchor.MiddleCenter, new Color(0.9f, 0.95f, 1f));
            messageObj.GetComponent<Text>().text = "Confirmation message";
            messageObj.GetComponent<Text>().supportRichText = false;

            // Buttons container
            var btnContainer = new GameObject("Buttons", typeof(RectTransform));
            btnContainer.transform.SetParent(card.transform, false);
            var btnRect = btnContainer.GetComponent<RectTransform>();
            btnRect.anchorMin = new Vector2(0.5f, 0.05f);
            btnRect.anchorMax = new Vector2(0.5f, 0.05f);
            btnRect.pivot = new Vector2(0.5f, 0f);
            btnRect.anchoredPosition = Vector2.zero;
            btnRect.sizeDelta = new Vector2(400f, 50f);

            var btnLayout = btnContainer.AddComponent<HorizontalLayoutGroup>();
            btnLayout.spacing = 20f;
            btnLayout.childControlWidth = false;
            btnLayout.childControlHeight = true;
            btnLayout.childForceExpandWidth = false;
            btnLayout.childAlignment = TextAnchor.MiddleCenter;

            var btnConfirm = CreateButton("Btn_Confirm", btnContainer.transform, font, "Confirm", new Color(0.15f, 0.45f, 0.35f));
            var btnCancel = CreateButton("Btn_Cancel", btnContainer.transform, font, "Cancel", new Color(0.45f, 0.2f, 0.2f));

            // Size the buttons
            foreach (var btn in new[] { btnConfirm, btnCancel })
            {
                var bRect = btn.GetComponent<RectTransform>();
                bRect.sizeDelta = new Vector2(160f, 40f);
            }

            // Bind to ConfirmationDialog via SerializedObject
            var serializedDialog = new SerializedObject(dialog);
            serializedDialog.FindProperty("dialogPanel").objectReferenceValue = root;
            serializedDialog.FindProperty("messageText").objectReferenceValue = messageObj.GetComponent<Text>();
            serializedDialog.FindProperty("confirmButton").objectReferenceValue = btnConfirm.GetComponent<Button>();
            serializedDialog.FindProperty("cancelButton").objectReferenceValue = btnCancel.GetComponent<Button>();
            serializedDialog.ApplyModifiedProperties();

            return root;
        }

        private static void SetupPersistentManagers()
        {
            var managersObj = new GameObject("[--- MANAGERS ---]");
            if (managersObj.GetComponent<GameManager>() == null) managersObj.AddComponent<GameManager>();
            if (managersObj.GetComponent<SaveManager>() == null) managersObj.AddComponent<SaveManager>();
            if (managersObj.GetComponent<QualityPresetManager>() == null) managersObj.AddComponent<QualityPresetManager>();
            if (managersObj.GetComponent<GraphicsPerformanceManager>() == null) managersObj.AddComponent<GraphicsPerformanceManager>();

            // Step 3 settings owners. Added here because 00_Boot is the one scene present in
            // every session: language, display, and UI scale must be live before any other
            // scene's UI enables and reads them.
            if (managersObj.GetComponent<LocalizationManager>() == null) managersObj.AddComponent<LocalizationManager>();
            if (managersObj.GetComponent<DisplaySettingsManager>() == null) managersObj.AddComponent<DisplaySettingsManager>();
            if (managersObj.GetComponent<MemoryManager>() == null) managersObj.AddComponent<MemoryManager>();
            if (managersObj.GetComponent<RealtimeManager>() == null) managersObj.AddComponent<RealtimeManager>();
            if (managersObj.GetComponent<CloudSaveManager>() == null) managersObj.AddComponent<CloudSaveManager>();
            if (managersObj.GetComponent<WhisperingWilds.Online.AuthService>() == null) managersObj.AddComponent<WhisperingWilds.Online.AuthService>();
            if (managersObj.GetComponent<WorldTimeSystem>() == null) managersObj.AddComponent<WorldTimeSystem>();
            if (managersObj.GetComponent<TimeOfDayManager>() == null) managersObj.AddComponent<TimeOfDayManager>();
            if (managersObj.GetComponent<RegionalClimateSystem>() == null) managersObj.AddComponent<RegionalClimateSystem>();
            if (managersObj.GetComponent<WeatherSystem>() == null) managersObj.AddComponent<WeatherSystem>();
            if (managersObj.GetComponent<RegionalSceneManager>() == null) managersObj.AddComponent<RegionalSceneManager>();
            if (managersObj.GetComponent<WorldPersistenceManager>() == null) managersObj.AddComponent<WorldPersistenceManager>();
            if (managersObj.GetComponent<AudioManager>() == null) managersObj.AddComponent<AudioManager>();
            
            if (managersObj.GetComponent<NPCScheduleManager>() == null) managersObj.AddComponent<NPCScheduleManager>();
            if (managersObj.GetComponent<NPCPerformanceTierManager>() == null) managersObj.AddComponent<NPCPerformanceTierManager>();
            if (managersObj.GetComponent<WildlifeManager>() == null) managersObj.AddComponent<WildlifeManager>();
            if (managersObj.GetComponent<WildlifeSimulation>() == null) managersObj.AddComponent<WildlifeSimulation>();
            
            // Settings storage, without the display writes: this component now delegates to
            // DisplaySettingsManager / GraphicsPerformanceManager instead of persisting the
            // same WW_Fullscreen, WW_VSync and WW_QualityTier keys a second time.
if (managersObj.GetComponent<SettingsMenuController>() == null) managersObj.AddComponent<SettingsMenuController>();
            if (managersObj.GetComponent<CampaignFlow>() == null) managersObj.AddComponent<CampaignFlow>();
            if (managersObj.GetComponent<RegionUnlockManager>() == null) managersObj.AddComponent<RegionUnlockManager>();
            if (managersObj.GetComponent<EndingController>() == null) managersObj.AddComponent<EndingController>();
            if (managersObj.GetComponent<QuestEndingBridge>() == null) managersObj.AddComponent<QuestEndingBridge>();
            if (managersObj.GetComponent<PerformanceBenchmarkManager>() == null) managersObj.AddComponent<PerformanceBenchmarkManager>();
            var pbm = managersObj.GetComponent<PerformanceBenchmarkManager>();
            pbm.AutoStartOnLoad = false;

            if (managersObj.GetComponent<PerformanceTelemetryOverlay>() == null) managersObj.AddComponent<PerformanceTelemetryOverlay>();
            if (managersObj.GetComponent<WhisperingWilds.QA.RuntimeAutomatedSmokeTest>() == null) managersObj.AddComponent<WhisperingWilds.QA.RuntimeAutomatedSmokeTest>();
            if (managersObj.GetComponent<WhisperingWilds.QA.RuntimeEcologyAcceptanceTest>() == null) managersObj.AddComponent<WhisperingWilds.QA.RuntimeEcologyAcceptanceTest>();
        }

        private static GameObject BuildSavedGamesPanel(Transform parent, Font font)
        {
            var root = new GameObject("SavedGamesPanel", typeof(RectTransform), typeof(Image));
            root.transform.SetParent(parent, false);
            var rect = root.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var bg = root.GetComponent<Image>();
            bg.color = new Color(0.04f, 0.06f, 0.09f, 0.72f);

            var ui = root.AddComponent<SavedGamesUI>();

            var title = CreateText("Title", root.transform,
                new Vector2(0.5f, 0.85f), new Vector2(0.5f, 0.85f), Vector2.zero, new Vector2(600f, 50f),
                font, 28, TextAnchor.MiddleCenter, new Color(1f, 0.85f, 0.35f));

            var noSave = CreateText("NoSaveText", root.transform,
                new Vector2(0.5f, 0.55f), new Vector2(0.5f, 0.55f), Vector2.zero, new Vector2(600f, 60f),
                font, 20, TextAnchor.MiddleCenter, new Color(0.7f, 0.75f, 0.8f));

            var card = new GameObject("SaveCard", typeof(RectTransform), typeof(Image));
            card.transform.SetParent(root.transform, false);
            var cardRect = card.GetComponent<RectTransform>();
            cardRect.anchorMin = new Vector2(0.5f, 0.55f);
            cardRect.anchorMax = new Vector2(0.5f, 0.55f);
            cardRect.pivot = new Vector2(0.5f, 0.5f);
            cardRect.sizeDelta = new Vector2(560f, 180f);
            var cardBg = card.GetComponent<Image>();
            cardBg.color = new Color(0.1f, 0.14f, 0.18f, 0.9f);

            var region = CreateText("RegionText", card.transform,
                new Vector2(0.5f, 0.75f), new Vector2(0.5f, 0.75f), Vector2.zero, new Vector2(500f, 36f),
                font, 20, TextAnchor.MiddleCenter, Color.white);

            var timestamp = CreateText("TimestampText", card.transform,
                new Vector2(0.5f, 0.45f), new Vector2(0.5f, 0.45f), Vector2.zero, new Vector2(500f, 30f),
                font, 16, TextAnchor.MiddleCenter, new Color(0.8f, 0.85f, 0.9f));

            var stats = CreateText("StatsText", card.transform,
                new Vector2(0.5f, 0.18f), new Vector2(0.5f, 0.18f), Vector2.zero, new Vector2(500f, 30f),
                font, 15, TextAnchor.MiddleCenter, new Color(0.3f, 0.85f, 0.7f));

            var btnLoad = CreateButton("Btn_Load", root.transform, font, "Continue", new Color(0.2f, 0.5f, 0.35f));
            var loadRect = btnLoad.GetComponent<RectTransform>();
            loadRect.anchorMin = new Vector2(0.38f, 0.28f);
            loadRect.anchorMax = new Vector2(0.38f, 0.28f);
            loadRect.pivot = new Vector2(0.5f, 0.5f);
            loadRect.sizeDelta = new Vector2(160f, 44f);

            var btnDelete = CreateButton("Btn_Delete", root.transform, font, "Delete", new Color(0.5f, 0.2f, 0.2f));
            var delRect = btnDelete.GetComponent<RectTransform>();
            delRect.anchorMin = new Vector2(0.62f, 0.28f);
            delRect.anchorMax = new Vector2(0.62f, 0.28f);
            delRect.pivot = new Vector2(0.5f, 0.5f);
            delRect.sizeDelta = new Vector2(160f, 44f);

            var btnClose = CreateButton("Btn_Close", root.transform, font, "Back", new Color(0.25f, 0.3f, 0.35f));
            var closeRect = btnClose.GetComponent<RectTransform>();
            closeRect.anchorMin = new Vector2(0.5f, 0.15f);
            closeRect.anchorMax = new Vector2(0.5f, 0.15f);
            closeRect.pivot = new Vector2(0.5f, 0.5f);
            closeRect.sizeDelta = new Vector2(200f, 44f);

            var so = new SerializedObject(ui);
            so.FindProperty("titleText").objectReferenceValue = title.GetComponent<Text>();
            so.FindProperty("regionText").objectReferenceValue = region.GetComponent<Text>();
            so.FindProperty("timestampText").objectReferenceValue = timestamp.GetComponent<Text>();
            so.FindProperty("statsText").objectReferenceValue = stats.GetComponent<Text>();
            so.FindProperty("noSaveText").objectReferenceValue = noSave.GetComponent<Text>();
            so.FindProperty("saveInfoCard").objectReferenceValue = card;
            so.FindProperty("loadButton").objectReferenceValue = btnLoad.GetComponent<Button>();
            so.FindProperty("deleteButton").objectReferenceValue = btnDelete.GetComponent<Button>();
            so.FindProperty("closeButton").objectReferenceValue = btnClose.GetComponent<Button>();
            so.ApplyModifiedProperties();

            root.SetActive(false);
            return root;
        }

        private static GameObject BuildCreditsPanel(Transform parent, Font font)
        {
            var root = new GameObject("CreditsPanel", typeof(RectTransform), typeof(Image));
            root.transform.SetParent(parent, false);
            var rect = root.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var bg = root.GetComponent<Image>();
            bg.color = new Color(0.04f, 0.06f, 0.09f, 0.72f);

            var ui = root.AddComponent<CreditsUI>();

            // Main Game Title
            var title = CreateText("Title", root.transform,
                new Vector2(0.5f, 0.88f), new Vector2(0.5f, 0.88f), Vector2.zero, new Vector2(800f, 44f),
                font, 26, TextAnchor.MiddleCenter, new Color(0.85f, 0.88f, 0.92f));

            // Role: SOLO DEVELOPER
            var role = CreateText("RoleText", root.transform,
                new Vector2(0.5f, 0.80f), new Vector2(0.5f, 0.80f), Vector2.zero, new Vector2(600f, 32f),
                font, 18, TextAnchor.MiddleCenter, new Color(0.95f, 0.76f, 0.32f));

            // Developer Name: MOHANRAJ
            var devName = CreateText("DevNameText", root.transform,
                new Vector2(0.5f, 0.73f), new Vector2(0.5f, 0.73f), Vector2.zero, new Vector2(600f, 50f),
                font, 36, TextAnchor.MiddleCenter, new Color(1f, 0.84f, 0.35f));

            // Social Links Group
            var socialGroup = new GameObject("SocialLinksGroup", typeof(RectTransform));
            socialGroup.transform.SetParent(root.transform, false);
            var socialRect = socialGroup.GetComponent<RectTransform>();
            socialRect.anchorMin = new Vector2(0.5f, 0.62f);
            socialRect.anchorMax = new Vector2(0.5f, 0.62f);
            socialRect.pivot = new Vector2(0.5f, 0.5f);
            socialRect.sizeDelta = new Vector2(700f, 46f);

            var socialLayout = socialGroup.AddComponent<HorizontalLayoutGroup>();
            socialLayout.spacing = 24f;
            socialLayout.childAlignment = TextAnchor.MiddleCenter;
            socialLayout.childControlWidth = false;
            socialLayout.childControlHeight = false;

            // Instagram Button
            var btnInsta = CreateButton("Btn_Instagram", socialGroup.transform, font, "Instagram: @itz_me_mtmohan", new Color(0.24f, 0.18f, 0.35f, 1f));
            var instaRect = btnInsta.GetComponent<RectTransform>();
            instaRect.sizeDelta = new Vector2(280f, 44f);
            btnInsta.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            // YouTube Button
            var btnYt = CreateButton("Btn_YouTube", socialGroup.transform, font, "YouTube: @its_me_fakemask", new Color(0.42f, 0.16f, 0.16f, 1f));
            var ytRect = btnYt.GetComponent<RectTransform>();
            ytRect.sizeDelta = new Vector2(280f, 44f);
            btnYt.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            // Cultural / Heritage / Technical Acknowledgements
            var body = CreateText("CreditsBody", root.transform,
                new Vector2(0.5f, 0.34f), new Vector2(0.5f, 0.34f), Vector2.zero, new Vector2(900f, 260f),
                font, 15, TextAnchor.MiddleCenter, new Color(0.85f, 0.88f, 0.92f));
            var bodyText = body.GetComponent<Text>();
            bodyText.lineSpacing = 1.25f;

            // Close / Back Button
            var btnClose = CreateButton("Btn_Close", root.transform, font, "Back", new Color(0.20f, 0.28f, 0.35f));
            var closeRect = btnClose.GetComponent<RectTransform>();
            closeRect.anchorMin = new Vector2(0.5f, 0.08f);
            closeRect.anchorMax = new Vector2(0.5f, 0.08f);
            closeRect.pivot = new Vector2(0.5f, 0.5f);
            closeRect.sizeDelta = new Vector2(200f, 44f);
            btnClose.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var so = new SerializedObject(ui);
            so.FindProperty("titleText").objectReferenceValue = title.GetComponent<Text>();
            so.FindProperty("roleText").objectReferenceValue = role.GetComponent<Text>();
            so.FindProperty("devNameText").objectReferenceValue = devName.GetComponent<Text>();
            so.FindProperty("creditsBodyText").objectReferenceValue = body.GetComponent<Text>();
            so.FindProperty("instagramButton").objectReferenceValue = btnInsta.GetComponent<Button>();
            so.FindProperty("youtubeButton").objectReferenceValue = btnYt.GetComponent<Button>();
            so.FindProperty("instagramLabel").objectReferenceValue = btnInsta.GetComponentInChildren<Text>();
            so.FindProperty("youtubeLabel").objectReferenceValue = btnYt.GetComponentInChildren<Text>();
            so.FindProperty("closeButton").objectReferenceValue = btnClose.GetComponent<Button>();
            so.ApplyModifiedProperties();

            root.SetActive(false);
            return root;
        }

        private static GameObject BuildGameModeSelectionPanel(Transform parent, Font font)
        {
            var root = new GameObject("GameModeSelectionPanel", typeof(RectTransform), typeof(Image));
            root.transform.SetParent(parent, false);
            var rect = root.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var bg = root.GetComponent<Image>();
            bg.color = new Color(0.04f, 0.06f, 0.09f, 0.72f);

            var ui = root.AddComponent<GameModeSelectionUI>();

            // Header Title
            var headerTitle = CreateText("HeaderTitle", root.transform,
                new Vector2(0.5f, 0.88f), new Vector2(0.5f, 0.88f), Vector2.zero, new Vector2(800f, 50f),
                font, 32, TextAnchor.MiddleCenter, new Color(1f, 0.84f, 0.35f));

            // Header Subtitle
            var headerSubtitle = CreateText("HeaderSubtitle", root.transform,
                new Vector2(0.5f, 0.81f), new Vector2(0.5f, 0.81f), Vector2.zero, new Vector2(800f, 32f),
                font, 18, TextAnchor.MiddleCenter, new Color(0.80f, 0.85f, 0.90f));

            // Cards Container
            var cardsGroup = new GameObject("CardsGroup", typeof(RectTransform));
            cardsGroup.transform.SetParent(root.transform, false);
            var cardsRect = cardsGroup.GetComponent<RectTransform>();
            cardsRect.anchorMin = new Vector2(0.5f, 0.48f);
            cardsRect.anchorMax = new Vector2(0.5f, 0.48f);
            cardsRect.pivot = new Vector2(0.5f, 0.5f);
            cardsRect.sizeDelta = new Vector2(980f, 420f);

            var cardsLayout = cardsGroup.AddComponent<HorizontalLayoutGroup>();
            cardsLayout.spacing = 40f;
            cardsLayout.childAlignment = TextAnchor.MiddleCenter;
            cardsLayout.childControlWidth = false;
            cardsLayout.childControlHeight = false;

            // Card 1: SOLO EXPEDITION
            var soloCard = new GameObject("SoloCard", typeof(RectTransform), typeof(Image));
            soloCard.transform.SetParent(cardsGroup.transform, false);
            var soloCardRect = soloCard.GetComponent<RectTransform>();
            soloCardRect.sizeDelta = new Vector2(440f, 400f);
            var soloCardBg = soloCard.GetComponent<Image>();
            soloCardBg.color = new Color(0.08f, 0.16f, 0.14f, 0.95f);

            CreateText("SoloIcon", soloCard.transform,
                new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(400f, 40f),
                font, 32, TextAnchor.MiddleCenter, new Color(0.95f, 0.76f, 0.32f)).GetComponent<Text>().text = "🧭";

            var soloTitle = CreateText("SoloTitle", soloCard.transform,
                new Vector2(0.5f, 0.68f), new Vector2(0.5f, 0.68f), Vector2.zero, new Vector2(400f, 40f),
                font, 22, TextAnchor.MiddleCenter, new Color(1f, 0.88f, 0.45f));

            var soloDesc = CreateText("SoloDesc", soloCard.transform,
                new Vector2(0.5f, 0.44f), new Vector2(0.5f, 0.44f), Vector2.zero, new Vector2(380f, 120f),
                font, 15, TextAnchor.MiddleCenter, new Color(0.85f, 0.88f, 0.90f));
            soloDesc.GetComponent<Text>().lineSpacing = 1.2f;

            var btnSelectSolo = CreateButton("Btn_SelectSolo", soloCard.transform, font, "BEGIN SOLO", new Color(0.14f, 0.45f, 0.34f));
            var selectSoloRect = btnSelectSolo.GetComponent<RectTransform>();
            selectSoloRect.anchorMin = new Vector2(0.5f, 0.15f);
            selectSoloRect.anchorMax = new Vector2(0.5f, 0.15f);
            selectSoloRect.pivot = new Vector2(0.5f, 0.5f);
            selectSoloRect.sizeDelta = new Vector2(300f, 46f);
            btnSelectSolo.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            // Card 2: MULTIPLAYER EXPEDITION
            var multiCard = new GameObject("MultiCard", typeof(RectTransform), typeof(Image));
            multiCard.transform.SetParent(cardsGroup.transform, false);
            var multiCardRect = multiCard.GetComponent<RectTransform>();
            multiCardRect.sizeDelta = new Vector2(440f, 400f);
            var multiCardBg = multiCard.GetComponent<Image>();
            multiCardBg.color = new Color(0.08f, 0.14f, 0.18f, 0.95f);

            CreateText("MultiIcon", multiCard.transform,
                new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(400f, 40f),
                font, 32, TextAnchor.MiddleCenter, new Color(0.95f, 0.76f, 0.32f)).GetComponent<Text>().text = "👥";

            var multiTitle = CreateText("MultiTitle", multiCard.transform,
                new Vector2(0.5f, 0.68f), new Vector2(0.5f, 0.68f), Vector2.zero, new Vector2(400f, 40f),
                font, 22, TextAnchor.MiddleCenter, new Color(1f, 0.88f, 0.45f));

            var multiDesc = CreateText("MultiDesc", multiCard.transform,
                new Vector2(0.5f, 0.44f), new Vector2(0.5f, 0.44f), Vector2.zero, new Vector2(380f, 120f),
                font, 15, TextAnchor.MiddleCenter, new Color(0.85f, 0.88f, 0.90f));
            multiDesc.GetComponent<Text>().lineSpacing = 1.2f;

            var btnSelectMulti = CreateButton("Btn_SelectMulti", multiCard.transform, font, "MULTIPLAYER LOBBY", new Color(0.18f, 0.35f, 0.48f));
            var selectMultiRect = btnSelectMulti.GetComponent<RectTransform>();
            selectMultiRect.anchorMin = new Vector2(0.5f, 0.15f);
            selectMultiRect.anchorMax = new Vector2(0.5f, 0.15f);
            selectMultiRect.pivot = new Vector2(0.5f, 0.5f);
            selectMultiRect.sizeDelta = new Vector2(300f, 46f);
            btnSelectMulti.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            // Back Button
            var btnBack = CreateButton("Btn_Back", root.transform, font, "Back", new Color(0.25f, 0.30f, 0.35f));
            var backRect = btnBack.GetComponent<RectTransform>();
            backRect.anchorMin = new Vector2(0.5f, 0.10f);
            backRect.anchorMax = new Vector2(0.5f, 0.10f);
            backRect.pivot = new Vector2(0.5f, 0.5f);
            backRect.sizeDelta = new Vector2(200f, 44f);
            btnBack.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var so = new SerializedObject(ui);
            so.FindProperty("panelRoot").objectReferenceValue = root;
            so.FindProperty("headerTitleText").objectReferenceValue = headerTitle.GetComponent<Text>();
            so.FindProperty("headerSubtitleText").objectReferenceValue = headerSubtitle.GetComponent<Text>();
            so.FindProperty("soloCardButton").objectReferenceValue = btnSelectSolo.GetComponent<Button>();
            so.FindProperty("soloTitleText").objectReferenceValue = soloTitle.GetComponent<Text>();
            so.FindProperty("soloDescriptionText").objectReferenceValue = soloDesc.GetComponent<Text>();
            so.FindProperty("multiCardButton").objectReferenceValue = btnSelectMulti.GetComponent<Button>();
            so.FindProperty("multiTitleText").objectReferenceValue = multiTitle.GetComponent<Text>();
            so.FindProperty("multiDescriptionText").objectReferenceValue = multiDesc.GetComponent<Text>();
            so.FindProperty("backButton").objectReferenceValue = btnBack.GetComponent<Button>();
            so.ApplyModifiedProperties();

            root.SetActive(false);
            return root;
        }

        private static GameObject BuildSaveManagementPanel(Transform parent, Font font)
        {
            var root = new GameObject("SaveManagementPanel", typeof(RectTransform), typeof(Image));
            root.transform.SetParent(parent, false);
            var rect = root.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var bg = root.GetComponent<Image>();
            bg.color = new Color(0.04f, 0.06f, 0.09f, 0.72f);

            var ui = root.AddComponent<SaveManagementUI>();

            // Title
            var title = CreateText("Title", root.transform,
                new Vector2(0.5f, 0.90f), new Vector2(0.5f, 0.90f), Vector2.zero, new Vector2(800f, 44f),
                font, 28, TextAnchor.MiddleCenter, new Color(1f, 0.85f, 0.35f));

            // Tabs container
            var tabsGroup = new GameObject("TabsGroup", typeof(RectTransform));
            tabsGroup.transform.SetParent(root.transform, false);
            var tabsRect = tabsGroup.GetComponent<RectTransform>();
            tabsRect.anchorMin = new Vector2(0.5f, 0.82f);
            tabsRect.anchorMax = new Vector2(0.5f, 0.82f);
            tabsRect.pivot = new Vector2(0.5f, 0.5f);
            tabsRect.sizeDelta = new Vector2(720f, 44f);

            var tabsLayout = tabsGroup.AddComponent<HorizontalLayoutGroup>();
            tabsLayout.spacing = 16f;
            tabsLayout.childAlignment = TextAnchor.MiddleCenter;
            tabsLayout.childControlWidth = false;
            tabsLayout.childControlHeight = false;

            var tabLocal = CreateButton("Tab_Local", tabsGroup.transform, font, "Local Saves", new Color(0.18f, 0.45f, 0.35f));
            tabLocal.GetComponent<RectTransform>().sizeDelta = new Vector2(220f, 40f);
            tabLocal.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var tabRestore = CreateButton("Tab_Restore", tabsGroup.transform, font, "Restore Backup", new Color(0.12f, 0.20f, 0.18f));
            tabRestore.GetComponent<RectTransform>().sizeDelta = new Vector2(220f, 40f);
            tabRestore.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var tabCloud = CreateButton("Tab_Cloud", tabsGroup.transform, font, "Cloud Saves", new Color(0.12f, 0.20f, 0.18f));
            tabCloud.GetComponent<RectTransform>().sizeDelta = new Vector2(220f, 40f);
            tabCloud.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            // Content Container
            var contentObj = new GameObject("ContentArea", typeof(RectTransform));
            contentObj.transform.SetParent(root.transform, false);
            var contentRect = contentObj.GetComponent<RectTransform>();
            contentRect.anchorMin = new Vector2(0.5f, 0.46f);
            contentRect.anchorMax = new Vector2(0.5f, 0.46f);
            contentRect.pivot = new Vector2(0.5f, 0.5f);
            contentRect.sizeDelta = new Vector2(800f, 380f);

            // --- Page 1: Local Saves ---
            var pLocal = new GameObject("Page_Local", typeof(RectTransform), typeof(Image));
            pLocal.transform.SetParent(contentObj.transform, false);
            var pLocalRect = pLocal.GetComponent<RectTransform>();
            pLocalRect.anchorMin = Vector2.zero;
            pLocalRect.anchorMax = Vector2.one;
            pLocalRect.sizeDelta = Vector2.zero;
            pLocal.GetComponent<Image>().color = new Color(0.08f, 0.12f, 0.15f, 0.95f);

            var txtSaveStatus = CreateText("ActiveSaveStatus", pLocal.transform,
                new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(720f, 36f),
                font, 18, TextAnchor.MiddleLeft, Color.white);

            var txtSaveTime = CreateText("ActiveSaveTime", pLocal.transform,
                new Vector2(0.5f, 0.70f), new Vector2(0.5f, 0.70f), Vector2.zero, new Vector2(720f, 32f),
                font, 16, TextAnchor.MiddleLeft, new Color(0.8f, 0.85f, 0.9f));

            var txtSaveVal = CreateText("ActiveSaveValidity", pLocal.transform,
                new Vector2(0.5f, 0.58f), new Vector2(0.5f, 0.58f), Vector2.zero, new Vector2(720f, 32f),
                font, 16, TextAnchor.MiddleLeft, new Color(0.8f, 0.85f, 0.9f));

            var txtBackupStatus = CreateText("LocalBackupStatus", pLocal.transform,
                new Vector2(0.5f, 0.46f), new Vector2(0.5f, 0.46f), Vector2.zero, new Vector2(720f, 32f),
                font, 16, TextAnchor.MiddleLeft, new Color(0.95f, 0.76f, 0.32f));

            var localButtonsGroup = new GameObject("LocalButtons", typeof(RectTransform));
            localButtonsGroup.transform.SetParent(pLocal.transform, false);
            var localButtonsRect = localButtonsGroup.GetComponent<RectTransform>();
            localButtonsRect.anchorMin = new Vector2(0.5f, 0.24f);
            localButtonsRect.anchorMax = new Vector2(0.5f, 0.24f);
            localButtonsRect.pivot = new Vector2(0.5f, 0.5f);
            localButtonsRect.sizeDelta = new Vector2(720f, 44f);
            var localBtnLayout = localButtonsGroup.AddComponent<HorizontalLayoutGroup>();
            localBtnLayout.spacing = 16f;
            localBtnLayout.childAlignment = TextAnchor.MiddleCenter;
            localBtnLayout.childControlWidth = false;
            localBtnLayout.childControlHeight = false;

            var btnCreateBackup = CreateButton("Btn_CreateBackup", localButtonsGroup.transform, font, "Create Backup", new Color(0.18f, 0.45f, 0.35f));
            btnCreateBackup.GetComponent<RectTransform>().sizeDelta = new Vector2(220f, 42f);
            btnCreateBackup.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var btnExport = CreateButton("Btn_Export", localButtonsGroup.transform, font, "Export Save", new Color(0.20f, 0.35f, 0.48f));
            btnExport.GetComponent<RectTransform>().sizeDelta = new Vector2(220f, 42f);
            btnExport.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var btnImport = CreateButton("Btn_Import", localButtonsGroup.transform, font, "Import Save", new Color(0.35f, 0.25f, 0.45f));
            btnImport.GetComponent<RectTransform>().sizeDelta = new Vector2(220f, 42f);
            btnImport.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var txtLocalActionStatus = CreateText("LocalActionStatus", pLocal.transform,
                new Vector2(0.5f, 0.08f), new Vector2(0.5f, 0.08f), Vector2.zero, new Vector2(720f, 30f),
                font, 15, TextAnchor.MiddleCenter, Color.white);

            // --- Page 2: Restore Backup ---
            var pRestore = new GameObject("Page_Restore", typeof(RectTransform), typeof(Image));
            pRestore.transform.SetParent(contentObj.transform, false);
            var pRestoreRect = pRestore.GetComponent<RectTransform>();
            pRestoreRect.anchorMin = Vector2.zero;
            pRestoreRect.anchorMax = Vector2.one;
            pRestoreRect.sizeDelta = Vector2.zero;
            pRestore.GetComponent<Image>().color = new Color(0.08f, 0.12f, 0.15f, 0.95f);

            var txtRestoreHeader = CreateText("RestoreHeader", pRestore.transform,
                new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(720f, 36f),
                font, 18, TextAnchor.MiddleLeft, Color.white);

            var txtRestoreDetails = CreateText("RestoreDetails", pRestore.transform,
                new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(720f, 140f),
                font, 16, TextAnchor.MiddleLeft, new Color(0.85f, 0.9f, 0.95f));
            txtRestoreDetails.GetComponent<Text>().lineSpacing = 1.25f;

            var btnRestoreSelected = CreateButton("Btn_RestoreSelected", pRestore.transform, font, "Restore Selected Backup", new Color(0.45f, 0.22f, 0.22f));
            var restoreSelRect = btnRestoreSelected.GetComponent<RectTransform>();
            restoreSelRect.anchorMin = new Vector2(0.5f, 0.22f);
            restoreSelRect.anchorMax = new Vector2(0.5f, 0.22f);
            restoreSelRect.pivot = new Vector2(0.5f, 0.5f);
            restoreSelRect.sizeDelta = new Vector2(300f, 44f);
            btnRestoreSelected.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var txtRestoreStatus = CreateText("RestoreStatus", pRestore.transform,
                new Vector2(0.5f, 0.08f), new Vector2(0.5f, 0.08f), Vector2.zero, new Vector2(720f, 30f),
                font, 15, TextAnchor.MiddleCenter, Color.white);

            // --- Page 3: Cloud Saves ---
            var pCloud = new GameObject("Page_Cloud", typeof(RectTransform), typeof(Image));
            pCloud.transform.SetParent(contentObj.transform, false);
            var pCloudRect = pCloud.GetComponent<RectTransform>();
            pCloudRect.anchorMin = Vector2.zero;
            pCloudRect.anchorMax = Vector2.one;
            pCloudRect.sizeDelta = Vector2.zero;
            pCloud.GetComponent<Image>().color = new Color(0.08f, 0.12f, 0.15f, 0.95f);

            var txtCloudConn = CreateText("CloudConnStatus", pCloud.transform,
                new Vector2(0.5f, 0.82f), new Vector2(0.5f, 0.82f), Vector2.zero, new Vector2(720f, 36f),
                font, 18, TextAnchor.MiddleLeft, Color.white);

            var txtCloudAcc = CreateText("CloudAccount", pCloud.transform,
                new Vector2(0.5f, 0.70f), new Vector2(0.5f, 0.70f), Vector2.zero, new Vector2(720f, 32f),
                font, 16, TextAnchor.MiddleLeft, new Color(0.85f, 0.9f, 0.95f));

            var txtCloudLast = CreateText("CloudLastSync", pCloud.transform,
                new Vector2(0.5f, 0.58f), new Vector2(0.5f, 0.58f), Vector2.zero, new Vector2(720f, 32f),
                font, 16, TextAnchor.MiddleLeft, new Color(0.85f, 0.9f, 0.95f));

            var cloudButtonsGroup = new GameObject("CloudButtons", typeof(RectTransform));
            cloudButtonsGroup.transform.SetParent(pCloud.transform, false);
            var cloudButtonsRect = cloudButtonsGroup.GetComponent<RectTransform>();
            cloudButtonsRect.anchorMin = new Vector2(0.5f, 0.38f);
            cloudButtonsRect.anchorMax = new Vector2(0.5f, 0.38f);
            cloudButtonsRect.pivot = new Vector2(0.5f, 0.5f);
            cloudButtonsRect.sizeDelta = new Vector2(720f, 44f);
            var cloudBtnLayout = cloudButtonsGroup.AddComponent<HorizontalLayoutGroup>();
            cloudBtnLayout.spacing = 20f;
            cloudBtnLayout.childAlignment = TextAnchor.MiddleCenter;
            cloudBtnLayout.childControlWidth = false;
            cloudBtnLayout.childControlHeight = false;

            var btnCloudSync = CreateButton("Btn_CloudSyncNow", cloudButtonsGroup.transform, font, "Sync Now", new Color(0.18f, 0.45f, 0.35f));
            btnCloudSync.GetComponent<RectTransform>().sizeDelta = new Vector2(240f, 42f);
            btnCloudSync.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var btnCloudDl = CreateButton("Btn_CloudDownload", cloudButtonsGroup.transform, font, "Download Cloud Save", new Color(0.20f, 0.35f, 0.48f));
            btnCloudDl.GetComponent<RectTransform>().sizeDelta = new Vector2(240f, 42f);
            btnCloudDl.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var txtCloudMsg = CreateText("CloudMessage", pCloud.transform,
                new Vector2(0.5f, 0.16f), new Vector2(0.5f, 0.16f), Vector2.zero, new Vector2(720f, 50f),
                font, 15, TextAnchor.MiddleCenter, new Color(0.8f, 0.85f, 0.9f));
            txtCloudMsg.GetComponent<Text>().lineSpacing = 1.2f;

            // Back button
            var btnClose = CreateButton("Btn_Close", root.transform, font, "Back", new Color(0.25f, 0.30f, 0.35f));
            var closeRect = btnClose.GetComponent<RectTransform>();
            closeRect.anchorMin = new Vector2(0.5f, 0.08f);
            closeRect.anchorMax = new Vector2(0.5f, 0.08f);
            closeRect.pivot = new Vector2(0.5f, 0.5f);
            closeRect.sizeDelta = new Vector2(200f, 44f);
            btnClose.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();

            var so = new SerializedObject(ui);
            so.FindProperty("panelRoot").objectReferenceValue = root;
            so.FindProperty("titleText").objectReferenceValue = title.GetComponent<Text>();
            so.FindProperty("tabLocalButton").objectReferenceValue = tabLocal.GetComponent<Button>();
            so.FindProperty("tabRestoreButton").objectReferenceValue = tabRestore.GetComponent<Button>();
            so.FindProperty("tabCloudButton").objectReferenceValue = tabCloud.GetComponent<Button>();
            so.FindProperty("tabLocalLabel").objectReferenceValue = tabLocal.GetComponentInChildren<Text>();
            so.FindProperty("tabRestoreLabel").objectReferenceValue = tabRestore.GetComponentInChildren<Text>();
            so.FindProperty("tabCloudLabel").objectReferenceValue = tabCloud.GetComponentInChildren<Text>();
            so.FindProperty("closeButton").objectReferenceValue = btnClose.GetComponent<Button>();

            so.FindProperty("localSavesPage").objectReferenceValue = pLocal;
            so.FindProperty("activeSaveStatusText").objectReferenceValue = txtSaveStatus.GetComponent<Text>();
            so.FindProperty("activeSaveTimestampText").objectReferenceValue = txtSaveTime.GetComponent<Text>();
            so.FindProperty("activeSaveValidityText").objectReferenceValue = txtSaveVal.GetComponent<Text>();
            so.FindProperty("localBackupStatusText").objectReferenceValue = txtBackupStatus.GetComponent<Text>();
            so.FindProperty("createBackupButton").objectReferenceValue = btnCreateBackup.GetComponent<Button>();
            so.FindProperty("exportSaveButton").objectReferenceValue = btnExport.GetComponent<Button>();
            so.FindProperty("importSaveButton").objectReferenceValue = btnImport.GetComponent<Button>();
            so.FindProperty("localActionStatusText").objectReferenceValue = txtLocalActionStatus.GetComponent<Text>();

            so.FindProperty("restoreBackupPage").objectReferenceValue = pRestore;
            so.FindProperty("backupListHeaderText").objectReferenceValue = txtRestoreHeader.GetComponent<Text>();
            so.FindProperty("backupListDetailsText").objectReferenceValue = txtRestoreDetails.GetComponent<Text>();
            so.FindProperty("restoreSelectedButton").objectReferenceValue = btnRestoreSelected.GetComponent<Button>();
            so.FindProperty("restoreStatusText").objectReferenceValue = txtRestoreStatus.GetComponent<Text>();

            so.FindProperty("cloudSavesPage").objectReferenceValue = pCloud;
            so.FindProperty("cloudConnectionStatusText").objectReferenceValue = txtCloudConn.GetComponent<Text>();
            so.FindProperty("cloudAccountText").objectReferenceValue = txtCloudAcc.GetComponent<Text>();
            so.FindProperty("cloudLastSyncText").objectReferenceValue = txtCloudLast.GetComponent<Text>();
            so.FindProperty("cloudSyncNowButton").objectReferenceValue = btnCloudSync.GetComponent<Button>();
            so.FindProperty("cloudDownloadButton").objectReferenceValue = btnCloudDl.GetComponent<Button>();
            so.FindProperty("cloudStatusMessageText").objectReferenceValue = txtCloudMsg.GetComponent<Text>();

            so.ApplyModifiedProperties();

            root.SetActive(false);
            return root;
        }
    }
}
