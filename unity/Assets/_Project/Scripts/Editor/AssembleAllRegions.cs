using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using WhisperingWilds.Audio;
using WhisperingWilds.Cameras;
using WhisperingWilds.Core;
using WhisperingWilds.Inventory;
using WhisperingWilds.Investigation;
using WhisperingWilds.NPC;
using WhisperingWilds.Online;
using WhisperingWilds.Player;
using WhisperingWilds.Profiling;
using WhisperingWilds.Quality;
using WhisperingWilds.Quests;
using WhisperingWilds.UI;
using WhisperingWilds.Wildlife;
using WhisperingWilds.World;
using WhisperingWilds.Vegetation;
using WhisperingWilds.Persistence;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Master automated scene generator and assembler for all 8 playable Tamil Nadu regions
    /// plus 4 automated benchmark stress-test scenes with real authored 3D models and lighting.
    /// </summary>
    public static class AssembleAllRegions
    {
        private const string SceneFolderPath = "Assets/_Project/Scenes";

        [MenuItem("Tools/Whispering Wilds/Build All Regional & Benchmark Scenes")]
        public static void BuildAllScenes()
        {
            if (!Directory.Exists(SceneFolderPath))
            {
                Directory.CreateDirectory(SceneFolderPath);
            }

            try
            {
                Debug.Log("<color=#00D2FF><b>[AssembleAllRegions]</b></color> Starting full production scene generation for all regions...");

                BuildStateMapScene();
                BuildPichavaramScene();
                BuildDeltaScene();
                BuildChettinadScene();
                BuildMamallapuramScene();
                BuildNilgirisScene();

                // Benchmarks
                BuildBenchmarkScene("WW_Benchmark_Chennai", "chennai");
                BuildBenchmarkScene("WW_Benchmark_Pichavaram", "pichavaram");
                BuildBenchmarkScene("WW_Benchmark_Delta", "delta");
                BuildBenchmarkScene("WW_Benchmark_Nilgiris", "nilgiris");

                RegisterAllScenesInBuildSettings();

                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();

                Debug.Log("<color=#00FF88><b>[AssembleAllRegions]</b></color> ALL 12 Production and Benchmark Scenes generated and registered successfully!");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AssembleAllRegions] Fatal scene generation error: {ex}");
            }
        }

        public static void RegisterAllScenesInBuildSettings()
        {
            string[] scenePaths = new string[]
            {
                "Assets/_Project/Scenes/00_Boot.unity",
                "Assets/_Project/Scenes/01_StateMap_TamilNadu.unity",
                "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
                "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
                "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
                "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
                "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity",
                "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Chennai.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Delta.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity"
            };

            EditorBuildSettingsScene[] buildScenes = new EditorBuildSettingsScene[scenePaths.Length];
            for (int i = 0; i < scenePaths.Length; i++)
            {
                buildScenes[i] = new EditorBuildSettingsScene(scenePaths[i], true);
            }

            EditorBuildSettings.scenes = buildScenes;
            Debug.Log($"<color=#00D2FF><b>[AssembleAllRegions]</b></color> Registered {scenePaths.Length} scenes into EditorBuildSettings.");
        }

        private static GameObject SetupCommonManagers(string regionId, string engName, string tamName)
        {
            var managersObj = new GameObject("--- MANAGERS ---");
            if (managersObj.GetComponent<GameManager>() == null) managersObj.AddComponent<GameManager>();
            if (managersObj.GetComponent<GraphicsPerformanceManager>() == null) managersObj.AddComponent<GraphicsPerformanceManager>();
            if (managersObj.GetComponent<MemoryManager>() == null) managersObj.AddComponent<MemoryManager>();
            if (managersObj.GetComponent<WorldStreamingManager>() == null) managersObj.AddComponent<WorldStreamingManager>();
            if (managersObj.GetComponent<AssetManager>() == null) managersObj.AddComponent<AssetManager>();
            if (managersObj.GetComponent<InputManager>() == null) managersObj.AddComponent<InputManager>();
            if (managersObj.GetComponent<SaveManager>() == null) managersObj.AddComponent<SaveManager>();
            if (managersObj.GetComponent<RealtimeManager>() == null) managersObj.AddComponent<RealtimeManager>();
            if (managersObj.GetComponent<RegionalSceneManager>() == null) managersObj.AddComponent<RegionalSceneManager>();
            if (managersObj.GetComponent<InventoryManager>() == null) managersObj.AddComponent<InventoryManager>();
            if (managersObj.GetComponent<CraftingManager>() == null) managersObj.AddComponent<CraftingManager>();
            if (managersObj.GetComponent<QuestManager>() == null) managersObj.AddComponent<QuestManager>();
            if (managersObj.GetComponent<InvestigationManager>() == null) managersObj.AddComponent<InvestigationManager>();
            if (managersObj.GetComponent<WeatherSystem>() == null) managersObj.AddComponent<WeatherSystem>();
            if (managersObj.GetComponent<AudioManager>() == null) managersObj.AddComponent<AudioManager>();
            if (managersObj.GetComponent<TimeOfDayManager>() == null) managersObj.AddComponent<TimeOfDayManager>();
            if (managersObj.GetComponent<SettingsMenuController>() == null) managersObj.AddComponent<SettingsMenuController>();
            if (managersObj.GetComponent<CloudSaveManager>() == null) managersObj.AddComponent<CloudSaveManager>();
            if (managersObj.GetComponent<NPCScheduleManager>() == null) managersObj.AddComponent<NPCScheduleManager>();
            if (managersObj.GetComponent<NPCPerformanceTierManager>() == null) managersObj.AddComponent<NPCPerformanceTierManager>();
            if (managersObj.GetComponent<WildlifeManager>() == null) managersObj.AddComponent<WildlifeManager>();
            if (managersObj.GetComponent<TrafficSystem>() == null) managersObj.AddComponent<TrafficSystem>();
            if (managersObj.GetComponent<PerformanceBenchmarkManager>() == null) managersObj.AddComponent<PerformanceBenchmarkManager>();
            if (managersObj.GetComponent<PerformanceTelemetryOverlay>() == null) managersObj.AddComponent<PerformanceTelemetryOverlay>();

            // Living World, Ecosystem & Botanical Systems
            if (managersObj.GetComponent<WorldTimeSystem>() == null) managersObj.AddComponent<WorldTimeSystem>();
            if (managersObj.GetComponent<RegionalClimateSystem>() == null) managersObj.AddComponent<RegionalClimateSystem>();
            if (managersObj.GetComponent<VegetationManager>() == null) managersObj.AddComponent<VegetationManager>();
            if (managersObj.GetComponent<WorldPersistenceManager>() == null) managersObj.AddComponent<WorldPersistenceManager>();
            if (managersObj.GetComponent<WorldSimulationDebugOverlay>() == null) managersObj.AddComponent<WorldSimulationDebugOverlay>();

            return managersObj;
        }

        private static GameObject SetupPlayerAndCamera(Vector3 spawnPos)
        {
            var player = new GameObject("Player");
            player.tag = "Player";
            player.transform.position = spawnPos;

            var cc = player.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.35f;
            cc.center = new Vector3(0f, 0.9f, 0f);
            cc.stepOffset = 0.4f;
            cc.slopeLimit = 45f;

            player.AddComponent<PlayerInputHandler>();
            player.AddComponent<PlayerMovement>();
            player.AddComponent<PlayerAppearanceManager>();
            player.AddComponent<PlayerManager>();
            player.AddComponent<PlayerInteractor>();

            var playerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Characters/Player/player.glb");
            if (playerPrefab != null)
            {
                var visual = (GameObject)PrefabUtility.InstantiatePrefab(playerPrefab, player.transform);
                visual.name = "VisualModel";
                visual.transform.localPosition = Vector3.zero;
                visual.transform.localRotation = Quaternion.identity;
                visual.transform.localScale = Vector3.one;

                foreach (var col in visual.GetComponentsInChildren<Collider>())
                {
                    UnityEngine.Object.DestroyImmediate(col);
                }

                var anim = visual.GetComponent<Animator>();
                if (anim == null) anim = visual.AddComponent<Animator>();
                var animCtrl = AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>("Assets/_Project/Art/Animations/PlayerLocomotionController.controller");
                if (animCtrl != null) anim.runtimeAnimatorController = animCtrl;
            }

            var camObj = new GameObject("Main Camera");
            camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();
            camObj.tag = "MainCamera";

            var camCtrl = camObj.AddComponent<CameraController>();
            camCtrl.SetTarget(player.transform);

            return player;
        }

        private static void SetupHUD(string regionEng, string regionTam)
        {
            var canvasObj = new GameObject("HUD_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasObj.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = canvasObj.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var hudManager = canvasObj.AddComponent<HUDManager>();
            canvasObj.AddComponent<DialogueUI>();
            canvasObj.AddComponent<StateMapUI>();

            // Tamil-capable font; the builtin font cannot render Tamil.
            var font = LocalizedFontProvider.Font;

            // Region Banner
            var bannerObj = CreateUIText("RegionBanner", canvasObj.transform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -40f), new Vector2(600, 50), font, 24, TextAnchor.MiddleCenter);
            bannerObj.GetComponent<Text>().text = $"{regionEng} • {regionTam}";

            // Clock
            CreateUIText("ClockDisplay", canvasObj.transform, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(-120f, -40f), new Vector2(200, 40), font, 20, TextAnchor.MiddleRight);

            // Coins
            CreateUIText("CoinDisplay", canvasObj.transform, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(-120f, -80f), new Vector2(200, 40), font, 18, TextAnchor.MiddleRight);

            // Changes Remaining
            var changesObj = CreateUIText("ChangesRemainingText", canvasObj.transform, new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(160f, -40f), new Vector2(300, 40), font, 18, TextAnchor.MiddleLeft);
            changesObj.GetComponent<Text>().text = "Permanent Changes: 5/5";

            // Prompt
            var promptObj = CreateUIText("InteractionPrompt", canvasObj.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, -120f), new Vector2(400, 50), font, 20, TextAnchor.MiddleCenter);
            promptObj.SetActive(false);
        }

        private static GameObject CreateUIText(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 size, Font font, int fontSize, TextAnchor alignment)
        {
            var textObj = new GameObject(name, typeof(RectTransform), typeof(Text));
            textObj.transform.SetParent(parent, false);
            var rect = textObj.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = size;

            var txt = textObj.GetComponent<Text>();
            txt.font = font;
            txt.fontSize = fontSize;
            txt.alignment = alignment;
            txt.color = Color.white;
            return textObj;
        }

        private static void BuildStateMapScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/01_StateMap_TamilNadu.unity";

            SetupSun(new Color(1f, 0.95f, 0.85f), 1.2f, Quaternion.Euler(50f, -30f, 0f));
            SetupCommonManagers("statemap", "Tamil Nadu State Map", "தமிழ்நாடு வரைபடம்");

            // 3D Map Table & Relief Board
            // This board is the MAP SURFACE the real GIS geometry sits on, not the map itself.
            // It must be large enough to underlay the projected state outline, which spans
            // ~450 units east-west by ~607 units north-south at the 1 unit = 1 km scale in
            // TamilNaduGeoReference. The previous 80x100 cube was smaller than the state it was
            // meant to present and hid the real coastline/rivers behind its own edge.
            var table = GameObject.CreatePrimitive(PrimitiveType.Cube);
            table.name = "Map_Relief_Board";
            table.transform.position = new Vector3(0f, -2f, 0f);
            table.transform.localScale = new Vector3(1500f, 2f, 1900f);
            var rend = table.GetComponent<MeshRenderer>();
            // Use the same pre-authored material asset the map layers use. A runtime-created
            // Material here left the board at HDRP/Lit's default base colour (setting .color on
            // HDRP/Lit does not drive _BaseColor), which rendered as a bright warm surface.
            var backdrop = UnityEngine.Resources.Load<Material>("Geography/Materials/Layer_Backdrop");
            if (backdrop != null)
            {
                rend.sharedMaterial = backdrop;
            }
            else
            {
                Shader shader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");
                var mat = new Material(shader) { name = "MapBoardFallback" };
                if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", new Color(0.13f, 0.15f, 0.18f));
                if (mat.HasProperty("_Color")) mat.SetColor("_Color", new Color(0.13f, 0.15f, 0.18f));
                rend.sharedMaterial = mat;
            }

            // Camera: TamilNaduStateMapBootstrap reframes this to fit the outline at runtime, so
            // only the initial authoring values matter here.
            var camObj = new GameObject("Main Camera");
            var cam = camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();
            camObj.tag = "MainCamera";
            cam.transform.position = new Vector3(0f, 900f, -420f);
            cam.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            cam.farClipPlane = 8000f;

            SetupHUD("Tamil Nadu State Map", "தமிழ்நாடு பெருவழி வரைபடம்");

            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[AssembleAllRegions] Saved: {path}");
        }

        private static void BuildPichavaramScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/03_Pichavaram_Wetlands.unity";

            SetupSun(new Color(0.9f, 0.95f, 1.0f), 1.1f, Quaternion.Euler(40f, -45f, 0f));
            SetupCommonManagers("pichavaram", "Pichavaram Mangrove Wetlands", "பிச்சாவரம் சதுப்புநிலக் காடு");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Pichavaram Wetlands", "பிச்சாவரம் சதுப்புநிலக் காடு");

            var envRoot = new GameObject("--- PICHAVARAM_ENVIRONMENT ---");

            // Water Plane (Tidal estuary)
            var water = GameObject.CreatePrimitive(PrimitiveType.Plane);
            water.name = "Tidal_Estuary_Water";
            water.transform.SetParent(envRoot.transform, false);
            water.transform.position = new Vector3(0f, 0f, 0f);
            water.transform.localScale = new Vector3(15f, 1f, 15f);
            Shader waterShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");
            water.GetComponent<MeshRenderer>().sharedMaterial = new Material(waterShader) { color = new Color(0.12f, 0.28f, 0.32f, 0.85f) };

            // Mud dock / bank
            var dock = GameObject.CreatePrimitive(PrimitiveType.Cube);
            dock.name = "Wooden_Boat_Dock";
            dock.transform.SetParent(envRoot.transform, false);
            dock.transform.position = new Vector3(0f, 0.2f, 0f);
            dock.transform.localScale = new Vector3(8f, 0.4f, 16f);

            // Mangrove trees & clusters
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/trees/rhizophora_mangrove.glb", envRoot.transform, new Vector3(-8f, 0f, 10f), Quaternion.identity, Vector3.one * 1.5f);
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/mangroves/mangrove_cluster.glb", envRoot.transform, new Vector3(10f, 0f, 12f), Quaternion.identity, Vector3.one * 1.3f);
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/trees/rhizophora_mangrove.glb", envRoot.transform, new Vector3(14f, 0f, -8f), Quaternion.identity, Vector3.one * 1.5f);

            // Boats
            InstantiateModel("Assets/_Project/Art/Models/Vehicles/mangrove_boat.glb", envRoot.transform, new Vector3(-3.5f, 0.1f, 4f), Quaternion.Euler(0f, 25f, 0f), Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Vehicles/boats/mangrove_rowboat.glb", envRoot.transform, new Vector3(3.5f, 0.1f, 5f), Quaternion.Euler(0f, -20f, 0f), Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Vehicles/boat/fishing_boat.glb", envRoot.transform, new Vector3(0f, 0.1f, 12f), Quaternion.Euler(0f, 90f, 0f), Vector3.one);

            // Props
            InstantiateModel("Assets/_Project/Art/Models/Props/fishing/fishing_net.glb", envRoot.transform, new Vector3(-2f, 0.4f, 2f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/cast_net.glb", envRoot.transform, new Vector3(2f, 0.4f, 1f), Quaternion.identity, Vector3.one);

            // Fisher NPC Mani
            var npcMani = InstantiateModel("Assets/_Project/Art/Models/Characters/NPCs/selvam.glb", envRoot.transform, new Vector3(1.5f, 0.4f, 3f), Quaternion.Euler(0f, -140f, 0f), Vector3.one);
            if (npcMani != null)
            {
                var npcChar = npcMani.AddComponent<NPCCharacter>();
                npcChar.SetCharacterProfile("Mani (Fisher)", "மணி (மீனவர்)", "Pichavaram", "பாரம்பரிய வலை வீசி மீன்பிடிக்கும் படகோட்டி மணி.");
            }

            SetupWildlifeHabitat(envRoot.transform, "pichavaram", HabitatType.WetlandMarsh);

            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[AssembleAllRegions] Saved: {path}");
        }

        private static void BuildDeltaScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/04_Thanjavur_Delta.unity";

            SetupSun(new Color(1f, 0.98f, 0.88f), 1.3f, Quaternion.Euler(55f, -25f, 0f));
            SetupCommonManagers("delta", "Cauvery Delta & Thanjavur", "காவிரி டெல்டா மற்றும் தஞ்சாவூர்");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Cauvery Delta & Thanjavur", "காவிரி டெல்டா மற்றும் தஞ்சாவூர்");

            var envRoot = new GameObject("--- DELTA_ENVIRONMENT ---");

            // Paddy plain terrain
            var plain = GameObject.CreatePrimitive(PrimitiveType.Cube);
            plain.name = "Paddy_Basin_Floor";
            plain.transform.SetParent(envRoot.transform, false);
            plain.transform.position = new Vector3(0f, -0.1f, 0f);
            plain.transform.localScale = new Vector3(100f, 0.2f, 100f);
            Shader shader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");
            plain.GetComponent<MeshRenderer>().sharedMaterial = new Material(shader) { color = new Color(0.32f, 0.42f, 0.22f) };

            // Thanjavur Gopuram (Majestic background landmark)
            InstantiateModel("Assets/_Project/Art/Models/Architecture/thanjavur_gopuram.glb", envRoot.transform, new Vector3(0f, 0f, 45f), Quaternion.identity, Vector3.one * 1.8f);

            // Granary and village architecture
            InstantiateModel("Assets/_Project/Art/Models/Architecture/village/granary.glb", envRoot.transform, new Vector3(-12f, 0f, 10f), Quaternion.Euler(0f, 45f, 0f), Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Architecture/village/village_house.glb", envRoot.transform, new Vector3(12f, 0f, 8f), Quaternion.Euler(0f, -45f, 0f), Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Architecture/village/cattle_shed.glb", envRoot.transform, new Vector3(14f, 0f, 20f), Quaternion.identity, Vector3.one);

            // Chola Waterwheel & Irrigation Sluice
            InstantiateModel("Assets/_Project/Art/Models/Props/chola_waterwheel.glb", envRoot.transform, new Vector3(-6f, 0f, 15f), Quaternion.Euler(0f, 90f, 0f), Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Props/agriculture/irrigation_sluice.glb", envRoot.transform, new Vector3(-4f, 0f, 12f), Quaternion.identity, Vector3.one);

            // Agriculture & Cultural Props
            InstantiateModel("Assets/_Project/Art/Models/Props/agriculture/paddy_bundle.glb", envRoot.transform, new Vector3(-2f, 0f, 5f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/agal_lamp.glb", envRoot.transform, new Vector3(2f, 0f, 4f), Quaternion.identity, Vector3.one * 2f);
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/brass_kudam.glb", envRoot.transform, new Vector3(3f, 0f, 4.5f), Quaternion.identity, Vector3.one);

            // Bullock Cart
            InstantiateModel("Assets/_Project/Art/Models/Vehicles/bullock_cart/bullock_cart.glb", envRoot.transform, new Vector3(6f, 0f, 12f), Quaternion.Euler(0f, -15f, 0f), Vector3.one);

            // Palmyra Palms
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/trees/palmyra_palm.glb", envRoot.transform, new Vector3(-18f, 0f, 5f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/trees/palmyra_palm.glb", envRoot.transform, new Vector3(18f, 0f, -5f), Quaternion.identity, Vector3.one);

            // Farmer NPC Arumugam
            var npcFarmer = InstantiateModel("Assets/_Project/Art/Models/Characters/NPCs/selvam.glb", envRoot.transform, new Vector3(-2f, 0f, 7f), Quaternion.Euler(0f, 180f, 0f), Vector3.one);
            if (npcFarmer != null)
            {
                var npcChar = npcFarmer.AddComponent<NPCCharacter>();
                npcChar.SetCharacterProfile("Arumugam (Farmer)", "ஆறுமுகம் (விவசாயி)", "CauveryDelta", "காவிரி டெல்டா பாரம்பரிய நெல் விவசாயி ஆறுமுகம்.");
            }

            SetupWildlifeHabitat(envRoot.transform, "delta", HabitatType.PastoralFarmBoundary);

            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[AssembleAllRegions] Saved: {path}");
        }

        private static void BuildChettinadScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/05_Chettinad_Mansion.unity";

            SetupSun(new Color(1f, 0.95f, 0.85f), 1.15f, Quaternion.Euler(50f, -20f, 0f));
            SetupCommonManagers("chettinad", "Chettinad Heritage Mansions", "செட்டிநாடு பாரம்பரிய மாளிகை");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Chettinad Kanadukathan", "செட்டிநாடு கானாடுகாத்தான்");

            var envRoot = new GameObject("--- CHETTINAD_ENVIRONMENT ---");

            // Athangudi Tile Courtyard Floor
            var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "Athangudi_Courtyard_Floor";
            floor.transform.SetParent(envRoot.transform, false);
            floor.transform.position = new Vector3(0f, -0.1f, 0f);
            floor.transform.localScale = new Vector3(40f, 0.2f, 40f);
            Shader shader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");
            floor.GetComponent<MeshRenderer>().sharedMaterial = new Material(shader) { color = new Color(0.65f, 0.25f, 0.22f) }; // Terracotta-red Athangudi

            // Courtyard Mansion Architecture
            InstantiateModel("Assets/_Project/Art/Models/Architecture/chettinad/courtyard_mansion.glb", envRoot.transform, new Vector3(0f, 0f, 12f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Architecture/chettinad/wooden_column.glb", envRoot.transform, new Vector3(-4f, 0f, 4f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Architecture/chettinad/wooden_column.glb", envRoot.transform, new Vector3(4f, 0f, 4f), Quaternion.identity, Vector3.one);

            // Cultural Objects
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/ammi_kallu.glb", envRoot.transform, new Vector3(-3f, 0f, 2f), Quaternion.identity, Vector3.one * 1.5f);
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/ural_ulakkai.glb", envRoot.transform, new Vector3(-4f, 0f, 2.5f), Quaternion.identity, Vector3.one * 1.3f);
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb", envRoot.transform, new Vector3(3f, 0f, 2f), Quaternion.identity, Vector3.one * 1.4f);
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/coffee_dabarah.glb", envRoot.transform, new Vector3(0f, 0.8f, 3f), Quaternion.identity, Vector3.one * 1.2f);
            InstantiateModel("Assets/_Project/Art/Models/Props/cultural/korai_mat.glb", envRoot.transform, new Vector3(2f, 0.05f, 1f), Quaternion.identity, Vector3.one);

            // Elder NPC Kamalam
            var npcKamalam = InstantiateModel("Assets/_Project/Art/Models/Characters/NPCs/meenakshi.glb", envRoot.transform, new Vector3(0f, 0f, 4f), Quaternion.Euler(0f, 180f, 0f), Vector3.one);
            if (npcKamalam != null)
            {
                var npcChar = npcKamalam.AddComponent<NPCCharacter>();
                npcChar.SetCharacterProfile("Kamalam (Heritage Elder)", "கமலம் அம்மாள்", "Chettinad", "செட்டிநாடு மாளிகையின் பாரம்பரிய மூத்த காப்பாளர் கமலம் அம்மாள்.");
            }

            SetupWildlifeHabitat(envRoot.transform, "chettinad", HabitatType.PastoralFarmBoundary);

            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[AssembleAllRegions] Saved: {path}");
        }

        private static void BuildMamallapuramScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/06_Mamallapuram_Shore.unity";

            SetupSun(new Color(1f, 0.95f, 0.85f), 1.3f, Quaternion.Euler(42f, -35f, 0f));
            SetupCommonManagers("mamallapuram", "Mamallapuram Shore & Rock Shrines", "மாமல்லபுரம் கடற்கரை கோவில்");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Mamallapuram Shore", "மாமல்லபுரம் கடற்கரை");

            var envRoot = new GameObject("--- MAMALLAPURAM_ENVIRONMENT ---");

            // Coastal Sand Floor
            var sand = GameObject.CreatePrimitive(PrimitiveType.Cube);
            sand.name = "Coastal_Granite_Shore";
            sand.transform.SetParent(envRoot.transform, false);
            sand.transform.position = new Vector3(0f, -0.1f, 0f);
            sand.transform.localScale = new Vector3(80f, 0.2f, 80f);
            Shader shader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");
            sand.GetComponent<MeshRenderer>().sharedMaterial = new Material(shader) { color = new Color(0.72f, 0.65f, 0.52f) };

            // Shore Temple & Stone Workshops
            InstantiateModel("Assets/_Project/Art/Models/Architecture/mamallapuram/heritage_structure.glb", envRoot.transform, new Vector3(0f, 0f, 25f), Quaternion.identity, Vector3.one * 1.5f);
            InstantiateModel("Assets/_Project/Art/Models/Architecture/mamallapuram/stone_workshop.glb", envRoot.transform, new Vector3(-12f, 0f, 8f), Quaternion.Euler(0f, 75f, 0f), Vector3.one);

            // Sculpting Props
            InstantiateModel("Assets/_Project/Art/Models/Props/craft/stone_sculpture.glb", envRoot.transform, new Vector3(-6f, 0f, 6f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Props/craft/stone_carving_tools.glb", envRoot.transform, new Vector3(-5f, 0f, 5f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Props/temple/granite_column.glb", envRoot.transform, new Vector3(8f, 0f, 10f), Quaternion.identity, Vector3.one);

            // Coastal Fishing Boats
            InstantiateModel("Assets/_Project/Art/Models/Vehicles/boat/fishing_boat.glb", envRoot.transform, new Vector3(10f, 0.2f, 2f), Quaternion.Euler(0f, -30f, 0f), Vector3.one);

            // Sculptor NPC Sundaram
            var npcSundaram = InstantiateModel("Assets/_Project/Art/Models/Characters/NPCs/selvam.glb", envRoot.transform, new Vector3(-6.5f, 0f, 7.5f), Quaternion.Euler(0f, 150f, 0f), Vector3.one);
            if (npcSundaram != null)
            {
                var npcChar = npcSundaram.AddComponent<NPCCharacter>();
                npcChar.SetCharacterProfile("Sundaram (Stone Sculptor)", "சுந்தரம் (சிற்பி)", "Mamallapuram", "பல்லவ மரபுவழி கருங்கல் சிற்பி சுந்தரம்.");
            }

            SetupWildlifeHabitat(envRoot.transform, "mamallapuram", HabitatType.CoastalShoreline);

            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[AssembleAllRegions] Saved: {path}");
        }

        private static void BuildNilgirisScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/07_Nilgiris_Sanctuary.unity";

            SetupSun(new Color(0.92f, 0.95f, 1.0f), 1.15f, Quaternion.Euler(45f, -20f, 0f));
            SetupCommonManagers("nilgiris", "Nilgiris Shola-Tea Biosphere", "நீலகிரி சோலை - தேயிலை வனம்");
            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD("Nilgiris Biosphere", "நீலகிரி சோலை - தேயிலை வனம்");

            var envRoot = new GameObject("--- NILGIRIS_ENVIRONMENT ---");

            // Hill slope terrain
            var slope = GameObject.CreatePrimitive(PrimitiveType.Cube);
            slope.name = "Montane_Ridge_Slope";
            slope.transform.SetParent(envRoot.transform, false);
            slope.transform.position = new Vector3(0f, -0.1f, 0f);
            slope.transform.localScale = new Vector3(80f, 0.2f, 80f);
            Shader shader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");
            slope.GetComponent<MeshRenderer>().sharedMaterial = new Material(shader) { color = new Color(0.24f, 0.45f, 0.22f) };

            // Toda Mund Hut & Forest Station
            InstantiateModel("Assets/_Project/Art/Models/Architecture/nilgiris/toda_mund_hut.glb", envRoot.transform, new Vector3(0f, 0f, 15f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Architecture/nilgiris/forest_station.glb", envRoot.transform, new Vector3(-14f, 0f, 10f), Quaternion.Euler(0f, 60f, 0f), Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Architecture/sanctuary/botanical_portal.glb", envRoot.transform, new Vector3(0f, 0f, 32f), Quaternion.identity, Vector3.one);

            // Shola trees and tea rows
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/shola/shola_tree.glb", envRoot.transform, new Vector3(-8f, 0f, 20f), Quaternion.identity, Vector3.one * 1.8f);
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/shola/shola_tree.glb", envRoot.transform, new Vector3(12f, 0f, 18f), Quaternion.identity, Vector3.one * 1.8f);
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/tea/tea_rows.glb", envRoot.transform, new Vector3(8f, 0f, 6f), Quaternion.identity, Vector3.one);
            InstantiateModel("Assets/_Project/Art/Models/Vegetation/bushes/tea_hedge.glb", envRoot.transform, new Vector3(8f, 0f, 10f), Quaternion.identity, Vector3.one);

            // Real Wildlife: Nilgiri Tahr
            var tahr = InstantiateModel("Assets/_Project/Art/Models/Wildlife/nilgiri_tahr.glb", envRoot.transform, new Vector3(6f, 0f, 14f), Quaternion.Euler(0f, -45f, 0f), Vector3.one);
            if (tahr != null)
            {
                tahr.AddComponent<WildlifeEntity>();
            }

            // Forest Guide Raman NPC
            var npcRaman = InstantiateModel("Assets/_Project/Art/Models/Characters/NPCs/forest-guide.glb", envRoot.transform, new Vector3(-4f, 0f, 5f), Quaternion.Euler(0f, 160f, 0f), Vector3.one);
            if (npcRaman != null)
            {
                var npcChar = npcRaman.AddComponent<NPCCharacter>();
                npcChar.SetCharacterProfile("Raman (Forest Guide)", "ராமன் (வன வழிகாட்டி)", "Nilgiris", "நீலகிரி சோலைக்காடு மற்றும் தோடர் பண்பாட்டு வழிகாட்டி ராமன்.");
            }

            SetupWildlifeHabitat(envRoot.transform, "nilgiris", HabitatType.SholaGrassland);

            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[AssembleAllRegions] Saved: {path}");
        }

        private static void BuildBenchmarkScene(string sceneName, string regionId)
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            string path = $"{SceneFolderPath}/{sceneName}.unity";

            SetupSun(new Color(1f, 0.95f, 0.88f), 1.25f, Quaternion.Euler(45f, -30f, 0f));
            var managers = SetupCommonManagers(regionId, $"Benchmark ({regionId})", "செயல்திறன் சோதனை");

            // DO NOT set autoStartOnLoad=true on PerformanceBenchmarkManager.
            // Instead, add BenchmarkSceneBootstrapper which only activates when BenchmarkSessionFlag.IsActive.
            // This prevents accidental benchmark runs during normal gameplay if these scenes load naturally.
            var bootstrapperGO = new GameObject("--- BENCHMARK BOOTSTRAPPER ---");
            bootstrapperGO.AddComponent<BenchmarkSceneBootstrapper>();

            SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
            SetupHUD($"Performance Benchmark ({sceneName})", "தானியங்கி வன்பொருள் சோதனை");

            // Ground floor
            var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "Benchmark_Stress_Floor";
            floor.transform.position = new Vector3(0f, -0.1f, 0f);
            floor.transform.localScale = new Vector3(100f, 0.2f, 100f);

            // Scatter representative models for stress testing
            if (regionId == "chennai")
            {
                InstantiateModel("Assets/_Project/Art/Models/Architecture/chennai/tea_kadai_stall.glb", floor.transform, new Vector3(-6f, 0f, 6f), Quaternion.identity, Vector3.one);
                InstantiateModel("Assets/_Project/Art/Models/Vehicles/auto_rickshaw/chennai_auto.glb", floor.transform, new Vector3(5f, 0f, 8f), Quaternion.identity, Vector3.one);
            }
            else if (regionId == "nilgiris")
            {
                InstantiateModel("Assets/_Project/Art/Models/Architecture/nilgiris/toda_mund_hut.glb", floor.transform, new Vector3(0f, 0f, 12f), Quaternion.identity, Vector3.one);
                InstantiateModel("Assets/_Project/Art/Models/Wildlife/nilgiri_tahr.glb", floor.transform, new Vector3(5f, 0f, 10f), Quaternion.identity, Vector3.one);
            }
            else if (regionId == "pichavaram")
            {
                InstantiateModel("Assets/_Project/Art/Models/Vegetation/trees/rhizophora_mangrove.glb", floor.transform, new Vector3(-8f, 0f, 10f), Quaternion.identity, Vector3.one);
                InstantiateModel("Assets/_Project/Art/Models/Vehicles/mangrove_boat.glb", floor.transform, new Vector3(4f, 0f, 6f), Quaternion.identity, Vector3.one);
            }
            else // delta
            {
                InstantiateModel("Assets/_Project/Art/Models/Architecture/thanjavur_gopuram.glb", floor.transform, new Vector3(0f, 0f, 30f), Quaternion.identity, Vector3.one);
                InstantiateModel("Assets/_Project/Art/Models/Vehicles/bullock_cart/bullock_cart.glb", floor.transform, new Vector3(6f, 0f, 10f), Quaternion.identity, Vector3.one);
            }

            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[AssembleAllRegions] Saved benchmark scene: {path}");
        }

        private static void SetupWildlifeHabitat(Transform parent, string regionId, HabitatType type)
        {
            var habitatObj = new GameObject($"WildlifeHabitat_{regionId}");
            habitatObj.transform.SetParent(parent, false);
            habitatObj.transform.position = Vector3.zero;

            var zone = habitatObj.AddComponent<WildlifeHabitatZone>();
            var serializedZone = new SerializedObject(zone);
            serializedZone.FindProperty("regionId").stringValue = regionId;
            serializedZone.FindProperty("zoneId").stringValue = $"{regionId}_habitat_zone_01";
            serializedZone.FindProperty("habitatType").enumValueIndex = (int)type;
            serializedZone.ApplyModifiedProperties();
            zone.EnforceRegionalWhitelistDefaults();

            habitatObj.AddComponent<WildlifeSpawner>();
        }

        private static GameObject InstantiateModel(string assetPath, Transform parent, Vector3 localPos, Quaternion localRot, Vector3 localScale)
        {
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            if (prefab == null)
            {
                Debug.LogWarning($"[AssembleAllRegions] Model asset missing at: {assetPath}");
                return null;
            }

            var inst = (GameObject)PrefabUtility.InstantiatePrefab(prefab, parent);
            inst.transform.localPosition = localPos;
            inst.transform.localRotation = localRot;
            inst.transform.localScale = localScale;
            return inst;
        }

        private static Light SetupSun(Color color, float intensity, Quaternion rotation)
        {
            var sunObj = new GameObject("Directional Light");
            var sun = sunObj.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = color;
            sun.intensity = intensity;
            sun.shadows = LightShadows.Soft;
            sunObj.transform.rotation = rotation;
            return sun;
        }
    }
}
