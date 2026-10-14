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

                // Background gradient image / overlay
                var bgPanel = new GameObject("BackgroundOverlay", typeof(RectTransform), typeof(Image));
                bgPanel.transform.SetParent(canvasObj.transform, false);
                var bgRect = bgPanel.GetComponent<RectTransform>();
                bgRect.anchorMin = Vector2.zero;
                bgRect.anchorMax = Vector2.one;
                bgRect.sizeDelta = Vector2.zero;
                var bgImg = bgPanel.GetComponent<Image>();
                bgImg.color = new Color(0.05f, 0.07f, 0.09f, 0.95f);

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

                // Game Title & Tamil Subtitle
                var titleObj = CreateText("GameTitle", menuRoot.transform, new Vector2(0.5f, 0.8f), new Vector2(0.5f, 0.8f), Vector2.zero, new Vector2(1200, 90), font, 48, TextAnchor.MiddleCenter, new Color(1f, 0.85f, 0.35f));
                var titleText = titleObj.GetComponent<Text>();
                titleText.text = "THE WHISPERING WILDS";
                titleText.lineSpacing = 1.2f;
                titleText.supportRichText = false;

                // Subtitle
                var subtitleObj = CreateText("GameSubtitle", menuRoot.transform, new Vector2(0.5f, 0.7f), new Vector2(0.5f, 0.7f), Vector2.zero, new Vector2(800, 40), font, 20, TextAnchor.MiddleCenter, new Color(0.8f, 0.85f, 0.9f));
                var subtitleText = subtitleObj.GetComponent<Text>();
                subtitleText.text = "A Living Exploration & Cultural Investigation of Tamil Nadu";

                // Menu Buttons Container
                var menuContainer = new GameObject("MenuContainer", typeof(RectTransform), typeof(VerticalLayoutGroup));
                menuContainer.transform.SetParent(menuRoot.transform, false);
                var menuRect = menuContainer.GetComponent<RectTransform>();
                menuRect.anchorMin = new Vector2(0.5f, 0.45f);
                menuRect.anchorMax = new Vector2(0.5f, 0.45f);
                menuRect.sizeDelta = new Vector2(400, 260);

                var layout = menuContainer.GetComponent<VerticalLayoutGroup>();
                layout.spacing = 14f;
                layout.childControlWidth = true;
                layout.childControlHeight = false;
                layout.childForceExpandWidth = true;
                layout.childForceExpandHeight = false;
                layout.childAlignment = TextAnchor.MiddleCenter;

                // Buttons
                // Placeholder labels only. TitleMenuController.ApplyLocalizedLabels rewrites these from
                // localization keys on Start, so the visible text always matches the active
                // language instead of being frozen at build time.
                var btnNew = CreateButton("Btn_NewGame", menuContainer.transform, font, "New Game", new Color(0.15f, 0.45f, 0.35f));
                var btnCont = CreateButton("Btn_Continue", menuContainer.transform, font, "Continue", new Color(0.2f, 0.35f, 0.5f));
                var btnSettings = CreateButton("Btn_Settings", menuContainer.transform, font, "Settings", new Color(0.25f, 0.35f, 0.45f));
                var btnQuit = CreateButton("Btn_Quit", menuContainer.transform, font, "Quit", new Color(0.45f, 0.2f, 0.2f));

                // Strict Appearance Rule Notice at bottom
                var ruleObj = CreateText("RuleNoticeText", menuRoot.transform, new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.12f), Vector2.zero, new Vector2(1000, 60), font, 16, TextAnchor.MiddleCenter, new Color(1f, 0.7f, 0.2f));

                // Settings panel, hidden until the player opens it.
                var settingsUiObj = BuildSettingsPanel(menuRoot.transform, font);
                var settingsUi = settingsUiObj.GetComponent<SettingsMenuUI>();

                // Confirmation dialog, hidden until needed (e.g., New Game overwrites a save).
                var confirmDialogObj = BuildConfirmationDialog(menuRoot.transform, font);
                var confirmDialog = confirmDialogObj.GetComponent<ConfirmationDialog>();

                // Cinematic intro visuals, created before the title menu so the intro sequence
                // can fade them out and reveal the menu when it finishes or is skipped.
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

                // Skip hint text
                var skipObj = CreateText("IntroSkipText", canvasObj.transform,
                    new Vector2(0.2f, 0.05f), new Vector2(0.8f, 0.05f), Vector2.zero, new Vector2(600, 30),
                    font, 14, TextAnchor.MiddleCenter, new Color(0.6f, 0.65f, 0.7f, 0f));
                skipObj.GetComponent<Text>().text = "Press Any Key to Skip";
                skipObj.GetComponent<Text>().supportRichText = false;
                skipObj.SetActive(false);

                // Background overlay for intro fade-in
                // STEP 61: Use a deeper, more atmospheric starting color that transitions
                // through dawn mist to sunrise tones during the cinematic sequence.
                var introBgObj = new GameObject("IntroBackground", typeof(RectTransform), typeof(Image));
                introBgObj.transform.SetParent(canvasObj.transform, false);
                var introBgRect = introBgObj.GetComponent<RectTransform>();
                introBgRect.anchorMin = Vector2.zero;
                introBgRect.anchorMax = Vector2.one;
                introBgRect.offsetMin = Vector2.zero;
                introBgRect.offsetMax = Vector2.zero;
                introBgObj.GetComponent<Image>().color = new Color(0.01f, 0.02f, 0.03f, 0f);
                introBgObj.SetActive(false);

                // STEP 61: Atmospheric mist particle system for the cinematic intro.
                // Creates a subtle fog/mist effect that drifts across the screen during the intro.
                var mistObj = new GameObject("IntroMist");
                mistObj.transform.SetParent(canvasObj.transform, false);
                var mistRect = mistObj.GetComponent<RectTransform>() ?? mistObj.AddComponent<RectTransform>();
                mistRect.anchorMin = Vector2.zero;
                mistRect.anchorMax = Vector2.one;
                mistRect.offsetMin = Vector2.zero;
                mistRect.offsetMax = Vector2.zero;

                // Create a soft mist overlay using a semi-transparent image
                var mistImage = mistObj.AddComponent<Image>();
                mistImage.color = new Color(0.5f, 0.55f, 0.6f, 0.08f);
                mistObj.SetActive(false);

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
                serializedIntro.ApplyModifiedProperties();

                // Bind to TitleMenuController via SerializedObject
                var serializedTitle = new SerializedObject(titleCtrl);
                serializedTitle.FindProperty("newGameButton").objectReferenceValue = btnNew.GetComponent<Button>();
                serializedTitle.FindProperty("continueButton").objectReferenceValue = btnCont.GetComponent<Button>();
                serializedTitle.FindProperty("settingsButton").objectReferenceValue = btnSettings.GetComponent<Button>();
                serializedTitle.FindProperty("quitButton").objectReferenceValue = btnQuit.GetComponent<Button>();
                serializedTitle.FindProperty("ruleNoticeText").objectReferenceValue = ruleObj.GetComponent<Text>();
                serializedTitle.FindProperty("settingsMenu").objectReferenceValue = settingsUi;
                serializedTitle.FindProperty("confirmationDialog").objectReferenceValue = confirmDialog;
                serializedTitle.FindProperty("cinematicIntro").objectReferenceValue = introCtrl;
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
            rect.sizeDelta = new Vector2(360, 48);

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
            foreach (var b in new[] { btnTabLang, btnTabDisplay, btnTabQuality })
            {
                var bRect = b.GetComponent<RectTransform>();
                bRect.sizeDelta = new Vector2(200f, 48f);
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

            // Bind everything.
            var so = new SerializedObject(ui);
            so.FindProperty("panelRoot").objectReferenceValue = root;
            so.FindProperty("languageTabButton").objectReferenceValue = btnTabLang.GetComponent<Button>();
            so.FindProperty("displayTabButton").objectReferenceValue = btnTabDisplay.GetComponent<Button>();
            so.FindProperty("qualityTabButton").objectReferenceValue = btnTabQuality.GetComponent<Button>();
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
            so.ApplyModifiedProperties();

            // Selection navigation across pages, so a controller can reach Close from a row.
            SetNavigation(btnTabLang, btnTabDisplay, btnTabDisplay, btnTabLang);
            SetNavigation(btnTabDisplay, btnTabQuality, btnTabQuality, btnTabDisplay);
            SetNavigation(btnTabQuality, btnClose, btnClose, btnTabQuality);
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
    }
}
