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
                // so the opaque MenuBackground covered all menu buttons — producing the olive-brown
                // blank screen the user reported.
                //
                // Correct order (bottom to top):
                //   1. Background layers (MenuBackground, mist, fireflies, vignette)
                //   2. Cinematic intro layers (IntroBackground, sky gradient, treeline, mist, vignette)
                //   3. MenuRoot (title, subtitle, buttons, rule notice)
                //   4. Intro title group (cinematic title/subtitle)
                //   5. Skip hint text
                //   6. Modal panels (LoginUI, Settings, ConfirmationDialog) — children of MenuRoot
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

                // Menu background gradient — deep teal/blue dawn sky
                var menuBgObj = new GameObject("MenuBackground", typeof(RectTransform), typeof(Image));
                menuBgObj.transform.SetParent(canvasObj.transform, false);
                var menuBgRect = menuBgObj.GetComponent<RectTransform>();
                menuBgRect.anchorMin = Vector2.zero;
                menuBgRect.anchorMax = Vector2.one;
                menuBgRect.offsetMin = Vector2.zero;
                menuBgRect.offsetMax = Vector2.zero;
                var menuBgImg = menuBgObj.GetComponent<Image>();
                menuBgImg.color = new Color(0.04f, 0.06f, 0.09f, 1f);
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
                menuMist1Img.color = new Color(0.3f, 0.35f, 0.4f, 0.06f);
                menuMist1Img.raycastTarget = false;
                menuMist1Obj.SetActive(false);

                // Mist layer 2 — different speed for parallax
                var menuMist2Obj = new GameObject("MenuMistLayer2", typeof(RectTransform), typeof(Image));
                menuMist2Obj.transform.SetParent(canvasObj.transform, false);
                var menuMist2Rect = menuMist2Obj.GetComponent<RectTransform>();
                menuMist2Rect.anchorMin = Vector2.zero;
                menuMist2Rect.anchorMax = Vector2.one;
                menuMist2Rect.offsetMin = Vector2.zero;
                menuMist2Rect.offsetMax = Vector2.zero;
                var menuMist2Img = menuMist2Obj.GetComponent<Image>();
                menuMist2Img.color = new Color(0.25f, 0.3f, 0.35f, 0.04f);
                menuMist2Img.raycastTarget = false;
                menuMist2Obj.SetActive(false);

                // Fireflies — subtle pulsing light particles
                var menuFirefliesObj = new GameObject("MenuFireflies", typeof(RectTransform), typeof(Image));
                menuFirefliesObj.transform.SetParent(canvasObj.transform, false);
                var menuFirefliesRect = menuFirefliesObj.GetComponent<RectTransform>();
                menuFirefliesRect.anchorMin = Vector2.zero;
                menuFirefliesRect.anchorMax = Vector2.one;
                menuFirefliesRect.offsetMin = Vector2.zero;
                menuFirefliesRect.offsetMax = Vector2.zero;
                var menuFirefliesImg = menuFirefliesObj.GetComponent<Image>();
                menuFirefliesImg.color = new Color(1f, 0.9f, 0.5f, 0.3f);
                menuFirefliesImg.raycastTarget = false;
                menuFirefliesObj.SetActive(false);

                // Menu vignette — subtle edge darkening to keep center readable
                var menuVignetteObj = new GameObject("MenuVignette", typeof(RectTransform), typeof(Image));
                menuVignetteObj.transform.SetParent(canvasObj.transform, false);
                var menuVignetteRect = menuVignetteObj.GetComponent<RectTransform>();
                menuVignetteRect.anchorMin = Vector2.zero;
                menuVignetteRect.anchorMax = Vector2.one;
                menuVignetteRect.offsetMin = Vector2.zero;
                menuVignetteRect.offsetMax = Vector2.zero;
                var menuVignetteImg = menuVignetteObj.GetComponent<Image>();
                menuVignetteImg.color = new Color(0f, 0f, 0f, 0.35f);
                menuVignetteImg.raycastTarget = false;

                // --- 2. Cinematic intro layers ---

                // Base background overlay for intro fade-in
                var introBgObj = new GameObject("IntroBackground", typeof(RectTransform), typeof(Image));
                introBgObj.transform.SetParent(canvasObj.transform, false);
                var introBgRect = introBgObj.GetComponent<RectTransform>();
                introBgRect.anchorMin = Vector2.zero;
                introBgRect.anchorMax = Vector2.one;
                introBgRect.offsetMin = Vector2.zero;
                introBgRect.offsetMax = Vector2.zero;
                introBgObj.GetComponent<Image>().color = new Color(0.01f, 0.02f, 0.03f, 0f);
                introBgObj.SetActive(false);

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

                // App Logo above Game Title
                var logoSprite = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/_Project/Resources/UI/AppLogo.png");
                if (logoSprite != null)
                {
                    var logoObj = new GameObject("AppLogo", typeof(RectTransform), typeof(Image));
                    logoObj.transform.SetParent(menuRoot.transform, false);
                    var logoRect = logoObj.GetComponent<RectTransform>();
                    logoRect.anchorMin = new Vector2(0.5f, 0.88f);
                    logoRect.anchorMax = new Vector2(0.5f, 0.88f);
                    logoRect.pivot = new Vector2(0.5f, 0.5f);
                    logoRect.anchoredPosition = Vector2.zero;
                    logoRect.sizeDelta = new Vector2(120f, 120f);
                    var logoImg = logoObj.GetComponent<Image>();
                    logoImg.sprite = logoSprite;
                    logoImg.preserveAspect = true;
                    logoImg.raycastTarget = false;
                }

                // Game Title & Tamil Subtitle — STEP 71: Centered in upper half of screen
                var titleObj = CreateText("GameTitle", menuRoot.transform, new Vector2(0f, 0.72f), new Vector2(1f, 0.72f), Vector2.zero, new Vector2(1400, 100), font, 56, TextAnchor.MiddleCenter, new Color(1f, 0.85f, 0.35f));
                var titleText = titleObj.GetComponent<Text>();
                titleText.text = "THE WHISPERING WILDS";
                titleText.lineSpacing = 1.2f;
                titleText.supportRichText = false;

                // Subtitle
                var subtitleObj = CreateText("GameSubtitle", menuRoot.transform, new Vector2(0f, 0.62f), new Vector2(1f, 0.62f), Vector2.zero, new Vector2(1000, 40), font, 22, TextAnchor.MiddleCenter, new Color(0.8f, 0.85f, 0.9f));
                var subtitleText = subtitleObj.GetComponent<Text>();
                subtitleText.text = "A Living Exploration & Cultural Investigation of Tamil Nadu";

                // Menu Buttons Container — STEP 71: Centered vertically and horizontally
                var menuContainer = new GameObject("MenuContainer", typeof(RectTransform), typeof(VerticalLayoutGroup));
                menuContainer.transform.SetParent(menuRoot.transform, false);
                var menuRect = menuContainer.GetComponent<RectTransform>();
                menuRect.anchorMin = new Vector2(0.5f, 0.5f);
                menuRect.anchorMax = new Vector2(0.5f, 0.5f);
                menuRect.pivot = new Vector2(0.5f, 0.5f);
                menuRect.anchoredPosition = new Vector2(0f, -40f);
                menuRect.sizeDelta = new Vector2(340, 360);

                var layout = menuContainer.GetComponent<VerticalLayoutGroup>();
                layout.spacing = 12f;
                layout.childControlWidth = true;
                layout.childControlHeight = true;
                layout.childForceExpandWidth = true;
                layout.childForceExpandHeight = true;
                layout.childAlignment = TextAnchor.MiddleCenter;
                layout.padding = new RectOffset(10, 10, 10, 10);

                // Buttons — STEP 71: Consistent width/height, evenly spaced
                // Placeholder labels only. TitleMenuController.ApplyLocalizedLabels rewrites these from
                // localization keys on Start, so the visible text always matches the active
                // language instead of being frozen at build time.
                var btnLogin = CreateButton("Btn_Login", menuContainer.transform, font, "Login", new Color(0.3f, 0.35f, 0.5f));
                var btnNew = CreateButton("Btn_NewGame", menuContainer.transform, font, "New Game", new Color(0.15f, 0.45f, 0.35f));
                var btnCont = CreateButton("Btn_Continue", menuContainer.transform, font, "Continue", new Color(0.2f, 0.35f, 0.5f));
                var btnSettings = CreateButton("Btn_Settings", menuContainer.transform, font, "Settings", new Color(0.25f, 0.35f, 0.45f));
                var btnQuit = CreateButton("Btn_Quit", menuContainer.transform, font, "Quit", new Color(0.45f, 0.2f, 0.2f));

                // STEP 70: Add MenuButtonAnimator to each button for hover/press/focus feedback
                foreach (var btnGo in new[] { btnLogin, btnNew, btnCont, btnSettings, btnQuit })
                {
                    btnGo.AddComponent<WhisperingWilds.UI.MenuButtonAnimator>();
                }

                // Strict Appearance Rule Notice at bottom
                var ruleObj = CreateText("RuleNoticeText", menuRoot.transform, new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.12f), Vector2.zero, new Vector2(1000, 60), font, 16, TextAnchor.MiddleCenter, new Color(1f, 0.7f, 0.2f));

                // Settings panel, hidden until the player opens it.
                var settingsUiObj = BuildSettingsPanel(menuRoot.transform, font);
                var settingsUi = settingsUiObj.GetComponent<SettingsMenuUI>();

                // Confirmation dialog, hidden until needed (e.g., New Game overwrites a save).
                var confirmDialogObj = BuildConfirmationDialog(menuRoot.transform, font);
                var confirmDialog = confirmDialogObj.GetComponent<ConfirmationDialog>();

                // --- 4. Intro title group (cinematic title/subtitle) ---
                var introGroup = new GameObject("IntroTitleGroup", typeof(RectTransform));
                introGroup.transform.SetParent(canvasObj.transform, false);
                var introGroupRect = introGroup.GetComponent<RectTransform>();
                introGroupRect.anchorMin = Vector2.zero;
                introGroupRect.anchorMax = Vector2.one;
                introGroupRect.offsetMin = Vector2.zero;
                introGroupRect.offsetMax = Vector2.zero;
                introGroup.SetActive(false);

                var introTitleObj = CreateText("IntroTitleText", introGroup.transform,
                    new Vector2(0.1f, 0.35f), new Vector2(0.9f, 0.65f), Vector2.zero, Vector2.zero,
                    font, 56, TextAnchor.MiddleCenter, new Color(1f, 0.85f, 0.35f, 0f));
                introTitleObj.GetComponent<Text>().text = "THE WHISPERING WILDS";
                introTitleObj.GetComponent<Text>().supportRichText = false;

                var introSubtitleObj = CreateText("IntroSubtitleText", introGroup.transform,
                    new Vector2(0.15f, 0.25f), new Vector2(0.85f, 0.75f), Vector2.zero, Vector2.zero,
                    font, 22, TextAnchor.MiddleCenter, new Color(0.8f, 0.85f, 0.9f, 0f));
                introSubtitleObj.GetComponent<Text>().text = "A Living Exploration & Cultural Investigation of Tamil Nadu";
                introSubtitleObj.GetComponent<Text>().supportRichText = false;

                // --- 5. Skip hint text ---
                var skipObj = CreateText("IntroSkipText", canvasObj.transform,
                    new Vector2(0.2f, 0.05f), new Vector2(0.8f, 0.05f), Vector2.zero, new Vector2(600, 30),
                    font, 14, TextAnchor.MiddleCenter, new Color(0.6f, 0.65f, 0.7f, 0f));
                skipObj.GetComponent<Text>().text = "Press Any Key to Skip";
                skipObj.GetComponent<Text>().supportRichText = false;
                skipObj.SetActive(false);

                // STEP 70: MainMenuAnimator — orchestrates title, subtitle, button, and background animation.
                // Parented to the canvas so it persists in the scene hierarchy and is discoverable by FindObjectOfType.
                var menuAnimatorObj = new GameObject("MainMenuAnimator");
                menuAnimatorObj.transform.SetParent(canvasObj.transform, false);
                var menuAnimator = menuAnimatorObj.AddComponent<WhisperingWilds.UI.MainMenuAnimator>();

                // Cinematic intro controller, placed on its own GameObject so it can manage
                // the intro sequence before the title menu becomes interactive.
                var introObj = new GameObject("CinematicIntro");
                var introCtrl = introObj.AddComponent<CinematicIntroController>();
                // The intro needs references to all its visual elements and the menu root group
                // so it can hide only the menu during the intro and reveal it when finished.
                // The canvas itself stays active so intro visuals (which are canvas children)
                // remain visible throughout the sequence.
                var serializedIntro = new SerializedObject(introCtrl);
                serializedIntro.FindProperty("introBackground").objectReferenceValue = introBgObj;
                serializedIntro.FindProperty("introVignette").objectReferenceValue = vignetteObj;
                serializedIntro.FindProperty("introTitleGroup").objectReferenceValue = introGroup;
                serializedIntro.FindProperty("introTitleText").objectReferenceValue = introTitleObj.GetComponent<Text>();
                serializedIntro.FindProperty("introSubtitleText").objectReferenceValue = introSubtitleObj.GetComponent<Text>();
                serializedIntro.FindProperty("introSkipText").objectReferenceValue = skipObj.GetComponent<Text>();
                serializedIntro.FindProperty("menuRoot").objectReferenceValue = menuRoot;
                serializedIntro.FindProperty("titleMenuController").objectReferenceValue = titleCtrl;
                serializedIntro.FindProperty("introCamera").objectReferenceValue = camObj.GetComponent<Camera>();
                serializedIntro.FindProperty("introSkyGradient").objectReferenceValue = skyGradientObj;
                serializedIntro.FindProperty("introTreeline").objectReferenceValue = treelineObj;
                serializedIntro.ApplyModifiedProperties();

                // STEP 70: Wire MainMenuAnimator references
                var serializedMenuAnim = new SerializedObject(menuAnimator);
                serializedMenuAnim.FindProperty("titleText").objectReferenceValue = titleText;
                serializedMenuAnim.FindProperty("subtitleText").objectReferenceValue = subtitleText;
                serializedMenuAnim.FindProperty("menuContainer").objectReferenceValue = menuContainer;
                serializedMenuAnim.FindProperty("ruleNoticeText").objectReferenceValue = ruleObj.GetComponent<Text>();
                serializedMenuAnim.FindProperty("menuBackground").objectReferenceValue = menuBgImg;
                serializedMenuAnim.FindProperty("menuMistLayer1").objectReferenceValue = menuMist1Obj;
                serializedMenuAnim.FindProperty("menuMistLayer2").objectReferenceValue = menuMist2Obj;
                serializedMenuAnim.FindProperty("menuFireflies").objectReferenceValue = menuFirefliesObj;
                serializedMenuAnim.FindProperty("menuVignette").objectReferenceValue = menuVignetteImg;
                serializedMenuAnim.ApplyModifiedProperties();

                // STEP 73: Create LoginUI panel with all visual elements
                var loginUIObj = new GameObject("LoginUI");
                loginUIObj.transform.SetParent(canvasObj.transform, false);
                var loginUI = loginUIObj.AddComponent<WhisperingWilds.UI.LoginUI>();
                loginUIObj.SetActive(false);

                // Login panel background
                var loginBg = new GameObject("LoginBackground", typeof(RectTransform), typeof(Image));
                loginBg.transform.SetParent(loginUIObj.transform, false);
                var loginBgRect = loginBg.GetComponent<RectTransform>();
                loginBgRect.anchorMin = Vector2.zero;
                loginBgRect.anchorMax = Vector2.one;
                loginBgRect.offsetMin = Vector2.zero;
                loginBgRect.offsetMax = Vector2.zero;
                loginBg.GetComponent<Image>().color = new Color(0.06f, 0.08f, 0.1f, 0.97f);

                // --- Sign In Panel ---
                var signInPanel = new GameObject("SignInPanel", typeof(RectTransform));
                signInPanel.transform.SetParent(loginUIObj.transform, false);
                var signInRect = signInPanel.GetComponent<RectTransform>();
                signInRect.anchorMin = new Vector2(0.3f, 0.2f);
                signInRect.anchorMax = new Vector2(0.7f, 0.8f);
                signInRect.pivot = new Vector2(0.5f, 0.5f);

                // Sign In title
                var signInTitle = CreateText("SignInTitle", signInPanel.transform,
                    new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -30f), new Vector2(0f, 40f),
                    font, 28, TextAnchor.MiddleCenter, Color.white);

                // Email field
                var emailField = CreateInputField("EmailField", signInPanel.transform,
                    new Vector2(0f, 0.65f), new Vector2(1f, 0.65f), new Vector2(0f, -10f), new Vector2(0f, 40f), font, "Email");

                // Password field
                var passwordField = CreateInputField("PasswordField", signInPanel.transform,
                    new Vector2(0f, 0.45f), new Vector2(1f, 0.45f), new Vector2(0f, -10f), new Vector2(0f, 40f), font, "Password");
                passwordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                // Sign In button
                var signInBtn = CreateButton("SignInButton", signInPanel.transform,
                    new Vector2(0.2f, 0.2f), new Vector2(0.8f, 0.2f), new Vector2(0f, 0f), new Vector2(0f, 40f),
                    font, "Sign In", new Color(0.2f, 0.5f, 0.4f));

                // Sign In status text
                var signInStatus = CreateText("SignInStatus", signInPanel.transform,
                    new Vector2(0f, 0.1f), new Vector2(1f, 0.1f), new Vector2(0f, -10f), new Vector2(0f, 30f),
                    font, 12, TextAnchor.MiddleCenter, Color.gray);

                // Switch to register button
                var switchToRegBtn = CreateButton("SwitchToRegisterBtn", signInPanel.transform,
                    new Vector2(0.15f, 0.02f), new Vector2(0.85f, 0.02f), new Vector2(0f, 0f), new Vector2(0f, 36f),
                    font, "No account? Create one", new Color(0.3f, 0.3f, 0.4f));

                // --- Register Panel ---
                var registerPanel = new GameObject("RegisterPanel", typeof(RectTransform));
                registerPanel.transform.SetParent(loginUIObj.transform, false);
                var regRect = registerPanel.GetComponent<RectTransform>();
                regRect.anchorMin = new Vector2(0.3f, 0.15f);
                regRect.anchorMax = new Vector2(0.7f, 0.85f);
                regRect.pivot = new Vector2(0.5f, 0.5f);
                registerPanel.SetActive(false);

                // Register title
                CreateText("RegisterTitle", registerPanel.transform,
                    new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -30f), new Vector2(0f, 40f),
                    font, 28, TextAnchor.MiddleCenter, Color.white);

                // Register email field
                var regEmailField = CreateInputField("RegEmailField", registerPanel.transform,
                    new Vector2(0f, 0.72f), new Vector2(1f, 0.72f), new Vector2(0f, -10f), new Vector2(0f, 40f), font, "Email");

                // Register name field
                var regNameField = CreateInputField("RegNameField", registerPanel.transform,
                    new Vector2(0f, 0.56f), new Vector2(1f, 0.56f), new Vector2(0f, -10f), new Vector2(0f, 40f), font, "Display name");

                // Register password field
                var regPasswordField = CreateInputField("RegPasswordField", registerPanel.transform,
                    new Vector2(0f, 0.40f), new Vector2(1f, 0.40f), new Vector2(0f, -10f), new Vector2(0f, 40f), font, "Password");
                regPasswordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                // Register confirm password field
                var regConfirmPasswordField = CreateInputField("RegConfirmPasswordField", registerPanel.transform,
                    new Vector2(0f, 0.24f), new Vector2(1f, 0.24f), new Vector2(0f, -10f), new Vector2(0f, 40f), font, "Confirm password");
                regConfirmPasswordField.GetComponent<InputField>().contentType = InputField.ContentType.Password;

                // Register button
                var registerBtn = CreateButton("RegisterButton", registerPanel.transform,
                    new Vector2(0.2f, 0.12f), new Vector2(0.8f, 0.12f), new Vector2(0f, 0f), new Vector2(0f, 40f),
                    font, "Create Account", new Color(0.2f, 0.5f, 0.4f));

                // Register status text
                var regStatus = CreateText("RegisterStatus", registerPanel.transform,
                    new Vector2(0f, 0.06f), new Vector2(1f, 0.06f), new Vector2(0f, -10f), new Vector2(0f, 30f),
                    font, 12, TextAnchor.MiddleCenter, Color.gray);

                // Switch to sign in button
                var switchToSignInBtn = CreateButton("SwitchToSignInBtn", registerPanel.transform,
                    new Vector2(0.15f, 0.01f), new Vector2(0.85f, 0.01f), new Vector2(0f, 0f), new Vector2(0f, 36f),
                    font, "Have an account? Sign in", new Color(0.3f, 0.3f, 0.4f));

                // --- Signed In Panel ---
                var signedInPanel = new GameObject("SignedInPanel", typeof(RectTransform));
                signedInPanel.transform.SetParent(loginUIObj.transform, false);
                var signedInRect = signedInPanel.GetComponent<RectTransform>();
                signedInRect.anchorMin = new Vector2(0.3f, 0.35f);
                signedInRect.anchorMax = new Vector2(0.7f, 0.65f);
                signedInRect.pivot = new Vector2(0.5f, 0.5f);
                signedInPanel.SetActive(false);

                // Signed in label
                var signedInLabel = CreateText("SignedInLabel", signedInPanel.transform,
                    new Vector2(0f, 0.6f), new Vector2(1f, 0.6f), new Vector2(0f, 0f), new Vector2(0f, 40f),
                    font, 18, TextAnchor.MiddleCenter, new Color(0.8f, 0.9f, 0.7f));

                // Sign out button
                var signOutBtn = CreateButton("SignOutButton", signedInPanel.transform,
                    new Vector2(0.25f, 0.15f), new Vector2(0.75f, 0.15f), new Vector2(0f, 0f), new Vector2(0f, 40f),
                    font, "Sign Out", new Color(0.5f, 0.2f, 0.2f));

                // --- Back Button (shared, at top of login UI) ---
                var backBtn = CreateButton("BackButton", loginUIObj.transform,
                    new Vector2(0.02f, 0.92f), new Vector2(0.15f, 0.92f), new Vector2(0f, 0f), new Vector2(100f, 40f),
                    font, "Back", new Color(0.3f, 0.3f, 0.3f));

                // --- Guest / Play Offline Button ---
                var guestBtn = CreateButton("GuestButton", loginUIObj.transform,
                    new Vector2(0.80f, 0.92f), new Vector2(0.98f, 0.92f), new Vector2(0f, 0f), new Vector2(160f, 40f),
                    font, "Guest / Offline", new Color(0.2f, 0.35f, 0.45f));

                // Wire all references using SerializedObject
                var serializedLoginUI = new SerializedObject(loginUI);
                serializedLoginUI.FindProperty("emailField").objectReferenceValue = emailField;
                serializedLoginUI.FindProperty("passwordField").objectReferenceValue = passwordField;
                serializedLoginUI.FindProperty("signInButton").objectReferenceValue = signInBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("signInStatusText").objectReferenceValue = signInStatus.GetComponent<Text>();
                serializedLoginUI.FindProperty("registerEmailField").objectReferenceValue = regEmailField;
                serializedLoginUI.FindProperty("registerNameField").objectReferenceValue = regNameField;
                serializedLoginUI.FindProperty("registerPasswordField").objectReferenceValue = regPasswordField;
                serializedLoginUI.FindProperty("registerConfirmPasswordField").objectReferenceValue = regConfirmPasswordField;
                serializedLoginUI.FindProperty("registerButton").objectReferenceValue = registerBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("registerStatusText").objectReferenceValue = regStatus.GetComponent<Text>();
                serializedLoginUI.FindProperty("backButton").objectReferenceValue = backBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("guestButton").objectReferenceValue = guestBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("switchToRegisterButton").objectReferenceValue = switchToRegBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("switchToSignInButton").objectReferenceValue = switchToSignInBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("signedInLabel").objectReferenceValue = signedInLabel.GetComponent<Text>();
                serializedLoginUI.FindProperty("signOutButton").objectReferenceValue = signOutBtn.GetComponent<Button>();
                serializedLoginUI.FindProperty("signInPanel").objectReferenceValue = signInPanel;
                serializedLoginUI.FindProperty("registerPanel").objectReferenceValue = registerPanel;
                serializedLoginUI.FindProperty("signedInPanel").objectReferenceValue = signedInPanel;
                serializedLoginUI.ApplyModifiedProperties();

                // Bind to TitleMenuController via SerializedObject
                var serializedTitle = new SerializedObject(titleCtrl);
                serializedTitle.FindProperty("loginButton").objectReferenceValue = btnLogin.GetComponent<Button>();
                serializedTitle.FindProperty("newGameButton").objectReferenceValue = btnNew.GetComponent<Button>();
                serializedTitle.FindProperty("continueButton").objectReferenceValue = btnCont.GetComponent<Button>();
                serializedTitle.FindProperty("settingsButton").objectReferenceValue = btnSettings.GetComponent<Button>();
                serializedTitle.FindProperty("quitButton").objectReferenceValue = btnQuit.GetComponent<Button>();
                serializedTitle.FindProperty("ruleNoticeText").objectReferenceValue = ruleObj.GetComponent<Text>();
                serializedTitle.FindProperty("settingsMenu").objectReferenceValue = settingsUi;
                serializedTitle.FindProperty("loginUI").objectReferenceValue = loginUI;
                serializedTitle.FindProperty("confirmationDialog").objectReferenceValue = confirmDialog;
                serializedTitle.FindProperty("cinematicIntro").objectReferenceValue = introCtrl;
                serializedTitle.FindProperty("mainMenuAnimator").objectReferenceValue = menuAnimator;
                var ambientClip = AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Ambience/temple_ambience.wav");
                if (ambientClip != null)
                {
                    serializedTitle.FindProperty("menuAmbienceClip").objectReferenceValue = ambientClip;
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
            var btnObj = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            btnObj.transform.SetParent(parent, false);
            var rect = btnObj.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(0, 48); // Width controlled by VerticalLayoutGroup

            var img = btnObj.GetComponent<Image>();
            img.color = btnColor;

            var btn = btnObj.GetComponent<Button>();
            var colors = btn.colors;
            colors.highlightedColor = btnColor * 1.25f;
            colors.pressedColor = btnColor * 0.8f;
            btn.colors = colors;

            var textObj = CreateText("Label", btnObj.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, font, 18, TextAnchor.MiddleCenter, Color.white);
            textObj.GetComponent<Text>().text = label;

            return btnObj;
        }

        private static GameObject CreateButton(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta, Font font, string label, Color btnColor)
        {
            var btnObj = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            btnObj.transform.SetParent(parent, false);
            var rect = btnObj.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = sizeDelta;

            var img = btnObj.GetComponent<Image>();
            img.color = btnColor;

            var btn = btnObj.GetComponent<Button>();
            var colors = btn.colors;
            colors.highlightedColor = btnColor * 1.25f;
            colors.pressedColor = btnColor * 0.8f;
            btn.colors = colors;

            var textObj = CreateText("Label", btnObj.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, font, 18, TextAnchor.MiddleCenter, Color.white);
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
            bg.color = new Color(0.04f, 0.06f, 0.08f, 0.97f);

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
            bg.color = new Color(0.04f, 0.06f, 0.08f, 0.97f);

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
            bg.color = new Color(0.04f, 0.06f, 0.08f, 0.97f);

            var ui = root.AddComponent<CreditsUI>();

            var title = CreateText("Title", root.transform,
                new Vector2(0.5f, 0.9f), new Vector2(0.5f, 0.9f), Vector2.zero, new Vector2(800f, 50f),
                font, 28, TextAnchor.MiddleCenter, new Color(1f, 0.85f, 0.35f));

            var body = CreateText("CreditsBody", root.transform,
                new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(900f, 540f),
                font, 16, TextAnchor.MiddleCenter, new Color(0.9f, 0.92f, 0.95f));
            var bodyText = body.GetComponent<Text>();
            bodyText.lineSpacing = 1.25f;

            var btnClose = CreateButton("Btn_Close", root.transform, font, "Back", new Color(0.25f, 0.3f, 0.35f));
            var closeRect = btnClose.GetComponent<RectTransform>();
            closeRect.anchorMin = new Vector2(0.5f, 0.1f);
            closeRect.anchorMax = new Vector2(0.5f, 0.1f);
            closeRect.pivot = new Vector2(0.5f, 0.5f);
            closeRect.sizeDelta = new Vector2(220f, 44f);

            var so = new SerializedObject(ui);
            so.FindProperty("titleText").objectReferenceValue = title.GetComponent<Text>();
            so.FindProperty("creditsBodyText").objectReferenceValue = body.GetComponent<Text>();
            so.FindProperty("closeButton").objectReferenceValue = btnClose.GetComponent<Button>();
            so.ApplyModifiedProperties();

            root.SetActive(false);
            return root;
        }
    }
}
