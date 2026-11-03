using System;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.UI;
using WhisperingWilds.NPC;
using WhisperingWilds.Loops;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Automated editor generator for all runtime gameplay UI & Canvas HUD prefabs.
    /// Constructs and serializes production-grade UI hierarchies for:
    /// 1. Wildlife Research Viewfinder HUD (optical framing reticle, distance telemetry, photo scoring)
    /// 2. Barter & Trust Trade Shop UI (vendor buy/sell grids, dynamic trust discounts)
    /// 3. Bilingual Tamil/English Dialogue Box UI (typewriter text, speaker badge, branching choices)
    /// 4. Agriculture Moisture & Drought HUD (hydration radial fill, crop status, drought alert)
    /// </summary>
    public static class UIPrefabGenerator
    {
        public const string PrefabsUIDir = "Assets/_Project/Prefabs/UI";

        [MenuItem("Tools/Whispering Wilds/Generate All UI Prefabs")]
        public static void GenerateAllUIPrefabs()
        {
            EnsureDirectory(PrefabsUIDir);

            CreateWildlifeViewfinderHUDPrefab();
            CreateBarterShopUIPrefab();
            CreateDialogueBoxUIPrefab();
            CreateAgricultureMoistureHUDPrefab();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log("<color=#00FF88><b>[Whispering Wilds]</b></color> All 4 UI Canvas HUD prefabs successfully generated in " + PrefabsUIDir);
        }

        public static void EnsureDirectory(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
                AssetDatabase.Refresh();
            }
        }

        // ====================================================================
        // 1. Wildlife Research Viewfinder HUD Prefab
        // ====================================================================
        public static GameObject CreateWildlifeViewfinderHUDPrefab()
        {
            string prefabPath = $"{PrefabsUIDir}/WildlifeViewfinderHUD.prefab";

            var root = new GameObject("WildlifeViewfinderHUD", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster), typeof(WildlifeViewfinderHUD));
            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            var hud = root.GetComponent<WildlifeViewfinderHUD>();

            // Viewfinder Panel (vignette container)
            var panelObj = CreateUIElement("ViewfinderPanel", root.transform);
            var panelRect = panelObj.GetComponent<RectTransform>();
            panelRect.anchorMin = Vector2.zero;
            panelRect.anchorMax = Vector2.one;
            panelRect.sizeDelta = Vector2.zero;
            var panelImg = panelObj.AddComponent<Image>();
            panelImg.color = new Color(0.02f, 0.04f, 0.06f, 0.35f);

            // Optical Reticle Crosshair
            var reticleObj = CreateUIElement("ReticleCrosshair", panelObj.transform);
            var reticleRect = reticleObj.GetComponent<RectTransform>();
            reticleRect.anchorMin = new Vector2(0.5f, 0.5f);
            reticleRect.anchorMax = new Vector2(0.5f, 0.5f);
            reticleRect.sizeDelta = new Vector2(160, 160);
            var reticleImg = reticleObj.AddComponent<Image>();
            reticleImg.color = new Color(0.2f, 0.9f, 0.5f, 0.8f);

            // Species Label
            var speciesObj = CreateTextElement("SpeciesLabel", panelObj.transform, "TARGET: WILDLIFE", 24, TextAnchor.UpperLeft);
            var speciesRect = speciesObj.GetComponent<RectTransform>();
            speciesRect.anchorMin = new Vector2(0.05f, 0.9f);
            speciesRect.anchorMax = new Vector2(0.35f, 0.95f);
            speciesRect.sizeDelta = Vector2.zero;

            // Behavior State Label
            var behaviorObj = CreateTextElement("BehaviorStateLabel", panelObj.transform, "STATE: OBSERVING", 20, TextAnchor.UpperLeft);
            var behaviorRect = behaviorObj.GetComponent<RectTransform>();
            behaviorRect.anchorMin = new Vector2(0.05f, 0.85f);
            behaviorRect.anchorMax = new Vector2(0.35f, 0.9f);
            behaviorRect.sizeDelta = Vector2.zero;

            // Distance Telemetry Text
            var distanceObj = CreateTextElement("DistanceTelemetryText", panelObj.transform, "RANGE: 15.0m", 22, TextAnchor.UpperRight);
            var distanceRect = distanceObj.GetComponent<RectTransform>();
            distanceRect.anchorMin = new Vector2(0.65f, 0.9f);
            distanceRect.anchorMax = new Vector2(0.95f, 0.95f);
            distanceRect.sizeDelta = Vector2.zero;

            // Predicted Score Text
            var scoreObj = CreateTextElement("PredictedScoreText", panelObj.transform, "EST. SCORE: 85 pts", 22, TextAnchor.UpperRight);
            var scoreRect = scoreObj.GetComponent<RectTransform>();
            scoreRect.anchorMin = new Vector2(0.65f, 0.85f);
            scoreRect.anchorMax = new Vector2(0.95f, 0.9f);
            scoreRect.sizeDelta = Vector2.zero;

            // Zoom Multiplier Text
            var zoomObj = CreateTextElement("ZoomMultiplierText", panelObj.transform, "1.0x", 26, TextAnchor.MiddleCenter);
            var zoomRect = zoomObj.GetComponent<RectTransform>();
            zoomRect.anchorMin = new Vector2(0.45f, 0.1f);
            zoomRect.anchorMax = new Vector2(0.55f, 0.16f);
            zoomRect.sizeDelta = Vector2.zero;

            // Wire Serialized Properties
            var so = new SerializedObject(hud);
            so.FindProperty("viewfinderPanel").objectReferenceValue = panelObj;
            so.FindProperty("reticleCrosshair").objectReferenceValue = reticleImg;
            so.FindProperty("speciesLabel").objectReferenceValue = speciesObj.GetComponent<Text>();
            so.FindProperty("behaviorStateLabel").objectReferenceValue = behaviorObj.GetComponent<Text>();
            so.FindProperty("distanceTelemetryText").objectReferenceValue = distanceObj.GetComponent<Text>();
            so.FindProperty("predictedScoreText").objectReferenceValue = scoreObj.GetComponent<Text>();
            so.FindProperty("zoomMultiplierText").objectReferenceValue = zoomObj.GetComponent<Text>();
            so.ApplyModifiedProperties();

            var prefab = PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        // ====================================================================
        // 2. Barter & Trust Trade Shop UI Prefab
        // ====================================================================
        public static GameObject CreateBarterShopUIPrefab()
        {
            string prefabPath = $"{PrefabsUIDir}/BarterShopUI.prefab";

            var root = new GameObject("BarterShopUI", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster), typeof(VendorUI));
            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            var vendorUI = root.GetComponent<VendorUI>();

            // Panel Root
            var panelRoot = CreateUIElement("VendorPanelRoot", root.transform);
            var panelRect = panelRoot.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0.15f, 0.1f);
            panelRect.anchorMax = new Vector2(0.85f, 0.9f);
            panelRect.sizeDelta = Vector2.zero;
            var panelBg = panelRoot.AddComponent<Image>();
            panelBg.color = new Color(0.12f, 0.09f, 0.06f, 0.92f); // Warm Chettinad Teak Tone

            // Header: Vendor Name
            var nameObj = CreateTextElement("VendorNameText", panelRoot.transform, "Chettinad Merchant (வணிகர்)", 28, TextAnchor.MiddleCenter);
            var nameRect = nameObj.GetComponent<RectTransform>();
            nameRect.anchorMin = new Vector2(0.1f, 0.9f);
            nameRect.anchorMax = new Vector2(0.9f, 0.98f);
            nameRect.sizeDelta = Vector2.zero;

            // Coins Readouts
            var playerCoins = CreateTextElement("PlayerCoinsText", panelRoot.transform, "Player Coins: 150", 20, TextAnchor.MiddleLeft);
            var pcRect = playerCoins.GetComponent<RectTransform>();
            pcRect.anchorMin = new Vector2(0.05f, 0.82f);
            pcRect.anchorMax = new Vector2(0.45f, 0.88f);
            pcRect.sizeDelta = Vector2.zero;

            var vendorCoins = CreateTextElement("VendorCoinsText", panelRoot.transform, "Vendor Coins: 500", 20, TextAnchor.MiddleRight);
            var vcRect = vendorCoins.GetComponent<RectTransform>();
            vcRect.anchorMin = new Vector2(0.55f, 0.82f);
            vcRect.anchorMax = new Vector2(0.95f, 0.88f);
            vcRect.sizeDelta = Vector2.zero;

            // Sell Section (Vendor Sells)
            var sellTitle = CreateTextElement("SellSectionTitle", panelRoot.transform, "Goods for Sale (விற்பனை)", 22, TextAnchor.MiddleLeft);
            var stRect = sellTitle.GetComponent<RectTransform>();
            stRect.anchorMin = new Vector2(0.05f, 0.74f);
            stRect.anchorMax = new Vector2(0.48f, 0.80f);
            stRect.sizeDelta = Vector2.zero;

            var sellContainer = CreateUIElement("SellItemsContainer", panelRoot.transform);
            var scRect = sellContainer.GetComponent<RectTransform>();
            scRect.anchorMin = new Vector2(0.05f, 0.1f);
            scRect.anchorMax = new Vector2(0.48f, 0.72f);
            scRect.sizeDelta = Vector2.zero;
            sellContainer.AddComponent<Image>().color = new Color(0.05f, 0.05f, 0.05f, 0.5f);

            // Buy Section (Vendor Buys)
            var buyTitle = CreateTextElement("BuySectionTitle", panelRoot.transform, "Barter Offers (கொள்முதல்)", 22, TextAnchor.MiddleLeft);
            var btRect = buyTitle.GetComponent<RectTransform>();
            btRect.anchorMin = new Vector2(0.52f, 0.74f);
            btRect.anchorMax = new Vector2(0.95f, 0.80f);
            btRect.sizeDelta = Vector2.zero;

            var buyContainer = CreateUIElement("BuyItemsContainer", panelRoot.transform);
            var bcRect = buyContainer.GetComponent<RectTransform>();
            bcRect.anchorMin = new Vector2(0.52f, 0.1f);
            bcRect.anchorMax = new Vector2(0.95f, 0.72f);
            bcRect.sizeDelta = Vector2.zero;
            buyContainer.AddComponent<Image>().color = new Color(0.05f, 0.05f, 0.05f, 0.5f);

            // Item Slot Prefab prototype
            var slotProto = CreateUIElement("TradeItemSlotProto", panelRoot.transform);
            slotProto.SetActive(false);
            var protoRect = slotProto.GetComponent<RectTransform>();
            protoRect.sizeDelta = new Vector2(300, 60);
            slotProto.AddComponent<Image>().color = new Color(0.2f, 0.18f, 0.15f, 0.8f);
            slotProto.AddComponent<Button>();

            // Wire Serialized Properties
            var so = new SerializedObject(vendorUI);
            so.FindProperty("vendorPanelRoot").objectReferenceValue = panelRoot;
            so.FindProperty("vendorNameText").objectReferenceValue = nameObj.GetComponent<Text>();
            so.FindProperty("playerCoinsText").objectReferenceValue = playerCoins.GetComponent<Text>();
            so.FindProperty("vendorCoinsText").objectReferenceValue = vendorCoins.GetComponent<Text>();
            so.FindProperty("sellSectionTitle").objectReferenceValue = sellTitle.GetComponent<Text>();
            so.FindProperty("sellItemsContainer").objectReferenceValue = sellContainer.transform;
            so.FindProperty("sellItemPrefab").objectReferenceValue = slotProto;
            so.FindProperty("buySectionTitle").objectReferenceValue = buyTitle.GetComponent<Text>();
            so.FindProperty("buyItemsContainer").objectReferenceValue = buyContainer.transform;
            so.FindProperty("buyItemPrefab").objectReferenceValue = slotProto;
            so.ApplyModifiedProperties();

            var prefab = PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        // ====================================================================
        // 3. Bilingual Dialogue Box UI Prefab
        // ====================================================================
        public static GameObject CreateDialogueBoxUIPrefab()
        {
            string prefabPath = $"{PrefabsUIDir}/DialogueBoxUI.prefab";

            var root = new GameObject("DialogueBoxUI", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster), typeof(DialogueUI));
            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            var dialogueUI = root.GetComponent<DialogueUI>();

            // Dialogue Panel Root (Lower-Third)
            var panelRoot = CreateUIElement("DialoguePanelRoot", root.transform);
            var panelRect = panelRoot.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0.1f, 0.04f);
            panelRect.anchorMax = new Vector2(0.9f, 0.35f);
            panelRect.sizeDelta = Vector2.zero;
            var panelBg = panelRoot.AddComponent<Image>();
            panelBg.color = new Color(0.06f, 0.08f, 0.1f, 0.94f); // Dravidian Night Slate

            // Speaker Name Badge
            var nameObj = CreateTextElement("SpeakerNameText", panelRoot.transform, "Murugan (முருகன்)", 24, TextAnchor.MiddleLeft);
            var nameRect = nameObj.GetComponent<RectTransform>();
            nameRect.anchorMin = new Vector2(0.04f, 0.82f);
            nameRect.anchorMax = new Vector2(0.4f, 0.96f);
            nameRect.sizeDelta = Vector2.zero;
            nameObj.GetComponent<Text>().color = new Color(1.0f, 0.85f, 0.4f); // Golden Ochre

            // English Speech Text
            var speechEn = CreateTextElement("SpeechTextEn", panelRoot.transform, "Welcome to George Town, traveler. The spice carts have arrived from Thanjavur.", 20, TextAnchor.UpperLeft);
            var seRect = speechEn.GetComponent<RectTransform>();
            seRect.anchorMin = new Vector2(0.04f, 0.45f);
            seRect.anchorMax = new Vector2(0.65f, 0.78f);
            seRect.sizeDelta = Vector2.zero;

            // Tamil Speech Text
            var speechTa = CreateTextElement("SpeechTextTa", panelRoot.transform, "ஜார்ஜ் டவுனுக்கு நல்வரவு, பயணியே. தஞ்சையிலிருந்து நறுமணப் பொருட்கள் வந்துள்ளன.", 20, TextAnchor.UpperLeft);
            var stRect = speechTa.GetComponent<RectTransform>();
            stRect.anchorMin = new Vector2(0.04f, 0.1f);
            stRect.anchorMax = new Vector2(0.65f, 0.42f);
            stRect.sizeDelta = Vector2.zero;
            speechTa.GetComponent<Text>().color = new Color(0.85f, 0.95f, 1.0f);

            // Branching Choice Buttons Container
            var choicesContainer = CreateUIElement("ChoicesContainer", panelRoot.transform);
            var ccRect = choicesContainer.GetComponent<RectTransform>();
            ccRect.anchorMin = new Vector2(0.68f, 0.08f);
            ccRect.anchorMax = new Vector2(0.96f, 0.92f);
            ccRect.sizeDelta = Vector2.zero;
            var layout = choicesContainer.AddComponent<VerticalLayoutGroup>();
            layout.spacing = 10f;
            layout.childForceExpandHeight = false;

            // Choice button prototype
            var choiceProto = CreateUIElement("ChoiceButtonProto", choicesContainer.transform);
            var cpRect = choiceProto.GetComponent<RectTransform>();
            cpRect.sizeDelta = new Vector2(250, 45);
            choiceProto.AddComponent<Image>().color = new Color(0.2f, 0.28f, 0.35f, 0.9f);
            choiceProto.AddComponent<Button>();
            var choiceText = CreateTextElement("ChoiceText", choiceProto.transform, "1. Inquire about trade routes", 16, TextAnchor.MiddleCenter);
            var ctRect = choiceText.GetComponent<RectTransform>();
            ctRect.anchorMin = Vector2.zero;
            ctRect.anchorMax = Vector2.one;
            ctRect.sizeDelta = Vector2.zero;
            choiceProto.SetActive(false);

            // Wire Serialized Properties
            var so = new SerializedObject(dialogueUI);
            so.FindProperty("dialoguePanelRoot").objectReferenceValue = panelRoot;
            so.FindProperty("speakerNameText").objectReferenceValue = nameObj.GetComponent<Text>();
            so.FindProperty("speechTextEn").objectReferenceValue = speechEn.GetComponent<Text>();
            so.FindProperty("speechTextTa").objectReferenceValue = speechTa.GetComponent<Text>();
            so.FindProperty("choicesContainer").objectReferenceValue = choicesContainer.transform;
            so.FindProperty("choiceButtonPrefab").objectReferenceValue = choiceProto;
            so.ApplyModifiedProperties();

            var prefab = PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        // ====================================================================
        // 4. Agriculture Moisture & Drought HUD Prefab
        // ====================================================================
        public static GameObject CreateAgricultureMoistureHUDPrefab()
        {
            string prefabPath = $"{PrefabsUIDir}/AgricultureMoistureHUD.prefab";

            var root = new GameObject("AgricultureMoistureHUD", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster), typeof(AgricultureMoistureHUD));
            var canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            var moistureHUD = root.GetComponent<AgricultureMoistureHUD>();

            // HUD Root (Top-Right HUD widget)
            var hudRoot = CreateUIElement("HudRoot", root.transform);
            var hudRect = hudRoot.GetComponent<RectTransform>();
            hudRect.anchorMin = new Vector2(0.78f, 0.8f);
            hudRect.anchorMax = new Vector2(0.98f, 0.97f);
            hudRect.sizeDelta = Vector2.zero;
            var hudBg = hudRoot.AddComponent<Image>();
            hudBg.color = new Color(0.04f, 0.1f, 0.06f, 0.88f); // Agricultural Delta Emerald

            // Crop Name & Climate
            var cropName = CreateTextElement("CropNameText", hudRoot.transform, "Cauvery IR20 Paddy", 20, TextAnchor.MiddleLeft);
            var cnRect = cropName.GetComponent<RectTransform>();
            cnRect.anchorMin = new Vector2(0.06f, 0.72f);
            cnRect.anchorMax = new Vector2(0.94f, 0.95f);
            cnRect.sizeDelta = Vector2.zero;

            var climate = CreateTextElement("ClimateText", hudRoot.transform, "Cauvery Delta", 16, TextAnchor.MiddleLeft);
            var clRect = climate.GetComponent<RectTransform>();
            clRect.anchorMin = new Vector2(0.06f, 0.52f);
            clRect.anchorMax = new Vector2(0.6f, 0.7f);
            clRect.sizeDelta = Vector2.zero;

            // Moisture Value Text
            var moistureVal = CreateTextElement("MoistureValueText", hudRoot.transform, "65%", 18, TextAnchor.MiddleRight);
            var mvRect = moistureVal.GetComponent<RectTransform>();
            mvRect.anchorMin = new Vector2(0.65f, 0.52f);
            mvRect.anchorMax = new Vector2(0.94f, 0.7f);
            mvRect.sizeDelta = Vector2.zero;

            // Moisture Fill Bar Background
            var barBg = CreateUIElement("MoistureBarBg", hudRoot.transform);
            var bbRect = barBg.GetComponent<RectTransform>();
            bbRect.anchorMin = new Vector2(0.06f, 0.3f);
            bbRect.anchorMax = new Vector2(0.94f, 0.45f);
            bbRect.sizeDelta = Vector2.zero;
            barBg.AddComponent<Image>().color = new Color(0.1f, 0.15f, 0.12f, 0.8f);

            // Moisture Fill Bar
            var barFill = CreateUIElement("MoistureFillBar", barBg.transform);
            var bfRect = barFill.GetComponent<RectTransform>();
            bfRect.anchorMin = Vector2.zero;
            bfRect.anchorMax = Vector2.one;
            bfRect.sizeDelta = Vector2.zero;
            var fillImg = barFill.AddComponent<Image>();
            fillImg.type = Image.Type.Filled;
            fillImg.fillMethod = Image.FillMethod.Horizontal;
            fillImg.fillAmount = 0.65f;
            fillImg.color = Color.cyan;

            // Growth Progress Bar Background
            var growthBg = CreateUIElement("GrowthBarBg", hudRoot.transform);
            var gbRect = growthBg.GetComponent<RectTransform>();
            gbRect.anchorMin = new Vector2(0.06f, 0.12f);
            gbRect.anchorMax = new Vector2(0.94f, 0.22f);
            gbRect.sizeDelta = Vector2.zero;
            growthBg.AddComponent<Image>().color = new Color(0.1f, 0.15f, 0.12f, 0.8f);

            // Growth Progress Bar Fill
            var growthFill = CreateUIElement("GrowthProgressBar", growthBg.transform);
            var gfRect = growthFill.GetComponent<RectTransform>();
            gfRect.anchorMin = Vector2.zero;
            gfRect.anchorMax = Vector2.one;
            gfRect.sizeDelta = Vector2.zero;
            var growthImg = growthFill.AddComponent<Image>();
            growthImg.type = Image.Type.Filled;
            growthImg.fillMethod = Image.FillMethod.Horizontal;
            growthImg.fillAmount = 0.35f;
            growthImg.color = new Color(0.2f, 0.85f, 0.3f); // Fresh Sprout Green

            // Drought Warning Indicator
            var droughtWarning = CreateTextElement("DroughtWarningIndicator", hudRoot.transform, "⚠ DROUGHT ALERT (<30%)", 18, TextAnchor.MiddleCenter);
            var dwRect = droughtWarning.GetComponent<RectTransform>();
            dwRect.anchorMin = new Vector2(0.05f, 0.05f);
            dwRect.anchorMax = new Vector2(0.95f, 0.95f);
            dwRect.sizeDelta = Vector2.zero;
            var dwText = droughtWarning.GetComponent<Text>();
            dwText.color = Color.red;
            droughtWarning.SetActive(false);

            // Wire Serialized Properties
            var so = new SerializedObject(moistureHUD);
            so.FindProperty("hudRoot").objectReferenceValue = hudRoot;
            so.FindProperty("cropNameText").objectReferenceValue = cropName.GetComponent<Text>();
            so.FindProperty("climateText").objectReferenceValue = climate.GetComponent<Text>();
            so.FindProperty("moistureValueText").objectReferenceValue = moistureVal.GetComponent<Text>();
            so.FindProperty("moistureFillBar").objectReferenceValue = fillImg;
            so.FindProperty("growthProgressBar").objectReferenceValue = growthImg;
            so.FindProperty("droughtWarningIndicator").objectReferenceValue = droughtWarning;
            so.ApplyModifiedProperties();

            var prefab = PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            return prefab;
        }

        // ====================================================================
        // Helper Methods
        // ====================================================================
        private static GameObject CreateUIElement(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            return go;
        }

        private static GameObject CreateTextElement(string name, Transform parent, string content, int fontSize, TextAnchor alignment)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            var txt = go.GetComponent<Text>();
            txt.text = content;
            txt.fontSize = fontSize;
            txt.alignment = alignment;
            txt.color = Color.white;
            return go;
        }
    }
}
