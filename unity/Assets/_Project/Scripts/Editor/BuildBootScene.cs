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
                var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

                // Background gradient image / overlay
                var bgPanel = new GameObject("BackgroundOverlay", typeof(RectTransform), typeof(Image));
                bgPanel.transform.SetParent(canvasObj.transform, false);
                var bgRect = bgPanel.GetComponent<RectTransform>();
                bgRect.anchorMin = Vector2.zero;
                bgRect.anchorMax = Vector2.one;
                bgRect.sizeDelta = Vector2.zero;
                var bgImg = bgPanel.GetComponent<Image>();
                bgImg.color = new Color(0.05f, 0.07f, 0.09f, 0.95f);

                // Game Title & Tamil Subtitle
                var titleObj = CreateText("GameTitle", canvasObj.transform, new Vector2(0.5f, 0.8f), new Vector2(0.5f, 0.8f), Vector2.zero, new Vector2(1200, 90), font, 48, TextAnchor.MiddleCenter, new Color(1f, 0.85f, 0.35f));
                var titleText = titleObj.GetComponent<Text>();
                titleText.text = "THE WHISPERING WILDS\nகாட்டு வழி • தடம்";
                titleText.lineSpacing = 1.2f;

                // Subtitle
                var subtitleObj = CreateText("GameSubtitle", canvasObj.transform, new Vector2(0.5f, 0.7f), new Vector2(0.5f, 0.7f), Vector2.zero, new Vector2(800, 40), font, 20, TextAnchor.MiddleCenter, new Color(0.8f, 0.85f, 0.9f));
                var subtitleText = subtitleObj.GetComponent<Text>();
                subtitleText.text = "A Living Exploration & Cultural Investigation of Tamil Nadu";

                // Menu Buttons Container
                var menuContainer = new GameObject("MenuContainer", typeof(RectTransform), typeof(VerticalLayoutGroup));
                menuContainer.transform.SetParent(canvasObj.transform, false);
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
                var btnNew = CreateButton("Btn_NewGame", menuContainer.transform, font, "New Game • புதிய ஆட்டம்", new Color(0.15f, 0.45f, 0.35f));
                var btnCont = CreateButton("Btn_Continue", menuContainer.transform, font, "Continue • தொடர", new Color(0.2f, 0.35f, 0.5f));
                var btnSettings = CreateButton("Btn_Settings", menuContainer.transform, font, "Settings • அமைப்புகள்", new Color(0.25f, 0.35f, 0.45f));
                var btnCodex = CreateButton("Btn_Codex", menuContainer.transform, font, "Cultural Archive • கலைக் களஞ்சியம்", new Color(0.35f, 0.3f, 0.45f));
                var btnQuit = CreateButton("Btn_Quit", menuContainer.transform, font, "Quit • வெளியேறு", new Color(0.45f, 0.2f, 0.2f));

                // Strict Appearance Rule Notice at bottom
                var ruleObj = CreateText("RuleNoticeText", canvasObj.transform, new Vector2(0.5f, 0.12f), new Vector2(0.5f, 0.12f), Vector2.zero, new Vector2(1000, 60), font, 16, TextAnchor.MiddleCenter, new Color(1f, 0.7f, 0.2f));

                // Bind to TitleMenuController via SerializedObject
                var serializedTitle = new SerializedObject(titleCtrl);
                serializedTitle.FindProperty("newGameButton").objectReferenceValue = btnNew.GetComponent<Button>();
                serializedTitle.FindProperty("continueButton").objectReferenceValue = btnCont.GetComponent<Button>();
                serializedTitle.FindProperty("settingsButton").objectReferenceValue = btnSettings.GetComponent<Button>();
                serializedTitle.FindProperty("codexButton").objectReferenceValue = btnCodex.GetComponent<Button>();
                serializedTitle.FindProperty("quitButton").objectReferenceValue = btnQuit.GetComponent<Button>();
                serializedTitle.FindProperty("ruleNoticeText").objectReferenceValue = ruleObj.GetComponent<Text>();
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

        private static void SetupPersistentManagers()
        {
            var managersObj = new GameObject("[--- MANAGERS ---]");
            if (managersObj.GetComponent<GameManager>() == null) managersObj.AddComponent<GameManager>();
            if (managersObj.GetComponent<SaveManager>() == null) managersObj.AddComponent<SaveManager>();
            if (managersObj.GetComponent<GraphicsPerformanceManager>() == null) managersObj.AddComponent<GraphicsPerformanceManager>();
            if (managersObj.GetComponent<MemoryManager>() == null) managersObj.AddComponent<MemoryManager>();
            if (managersObj.GetComponent<OnlineConnectionManager>() == null) managersObj.AddComponent<OnlineConnectionManager>();
            if (managersObj.GetComponent<CloudSaveManager>() == null) managersObj.AddComponent<CloudSaveManager>();
            if (managersObj.GetComponent<WorldTimeSystem>() == null) managersObj.AddComponent<WorldTimeSystem>();
            if (managersObj.GetComponent<RegionalClimateSystem>() == null) managersObj.AddComponent<RegionalClimateSystem>();
            if (managersObj.GetComponent<WeatherSystem>() == null) managersObj.AddComponent<WeatherSystem>();
            if (managersObj.GetComponent<RegionalSceneManager>() == null) managersObj.AddComponent<RegionalSceneManager>();
            if (managersObj.GetComponent<WorldPersistenceManager>() == null) managersObj.AddComponent<WorldPersistenceManager>();
            if (managersObj.GetComponent<AudioManager>() == null) managersObj.AddComponent<AudioManager>();
            if (managersObj.GetComponent<PerformanceBenchmarkManager>() == null) managersObj.AddComponent<PerformanceBenchmarkManager>();
            if (managersObj.GetComponent<PerformanceTelemetryOverlay>() == null) managersObj.AddComponent<PerformanceTelemetryOverlay>();
        }
    }
}
