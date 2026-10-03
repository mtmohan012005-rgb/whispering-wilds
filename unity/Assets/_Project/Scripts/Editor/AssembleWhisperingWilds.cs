using System;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Player;
using WhisperingWilds.Cameras;
using WhisperingWilds.Inventory;
using WhisperingWilds.Quests;
using WhisperingWilds.Investigation;
using WhisperingWilds.World;
using WhisperingWilds.NPC;
using WhisperingWilds.UI;
using WhisperingWilds.Audio;
using WhisperingWilds.Quality;
using WhisperingWilds.Wildlife;
using WhisperingWilds.Profiling;
using WhisperingWilds.Online;
using WhisperingWilds.Vegetation;
using WhisperingWilds.Persistence;
using WhisperingWilds.Localization;
using WhisperingWilds.Campaign;
using WhisperingWilds.Data;

namespace WhisperingWilds.Editor
{
    public static class AssembleWhisperingWilds
    {
        [MenuItem("Tools/Whispering Wilds/Build Playable Chennai Scene")]
        public static void BuildPlayableChennaiScene()
        {
            try
            {
                string scenePath = "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity";
                Scene scene;
                if (EditorSceneManager.GetActiveScene().path != scenePath)
                {
                    scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                }
                else
                {
                    scene = EditorSceneManager.GetActiveScene();
                }

                Debug.Log("<color=#00D2FF><b>[Whispering Wilds]</b></color> Assembling standalone PC scene: Chennai George Town with REAL 3D Models...");

                // 1. Setup Lighting & Sun
                Light sun = SetupLighting();

                // 2. Setup Core Managers
                GameObject managersRoot = SetupManagers(sun);

                // 3. Setup Player with player.glb and Locomotion BlendTree
                GameObject player = SetupPlayer();

                // 4. Setup Camera
                SetupCamera(player);

                // 5. Setup UI & HUD
                SetupUI(player);

                // 6. Setup Chennai George Town Environment with authored 3D architecture & props
                SetupChennaiEnvironment();

                // 6b. Build the George Town street corridor itself: HDRP-authored surfaces,
                //     kerbs, sidewalks, drainage, cambered carriageway, continuous frontage,
                //     vehicles, vegetation, street lighting, overhead wiring and bilingual
                //     signage. Replaces the stretched-cube road and removes TestCube.
                BuildChennaiStreet.Build();

                // 6c. HDRP 17 lighting: sun, physical sky lighting, exposure and fog so the
                //     corridor reads as a lit exterior instead of relying on RenderSettings.
                WWLightingSetup.Build();

                // 7. Setup Real NPCs (Murugan & Velu)
                SetupNPCs();

                // 8. Step 4 gameplay: region bootstrap, evidence interactables, ingredient pickups,
                //    the photographable tea kadai, and the journal/crafting bench.
                SetupStep4Gameplay();

                // 8b. Convert every importer-generated glTF material to HDRP/Lit. Must run after
                //     all renderers above are instantiated. Leaving these on the glTF Shader Graph
                //     means a URP Lit sub-target under HDRP, which no HDRP light reaches - the scene
                //     renders effectively unlit and near-black.
                var upgradeStats = WWMaterialUpgrade.ConvertScene(scene);
                Debug.Log("<color=#00FF88><b>[WhisperingWilds]</b></color> GLTF->HDRP/Lit conversion: " +
                          upgradeStats.renderersConverted + " renderers, " +
                          upgradeStats.materialsCreated + " material assets, " +
                          upgradeStats.skippedUnlit + " unlit left intact.");

                // Save Scene
                EditorSceneManager.MarkSceneDirty(scene);
                EditorSceneManager.SaveScene(scene);
                AssetDatabase.SaveAssets();

                Debug.Log("<color=#00FF88><b>[Whispering Wilds]</b></color> Playable Chennai George Town scene successfully built with real assets and ready for PC testing!");
            }
            catch (Exception ex)
            {
                Debug.LogError("[Whispering Wilds] Scene assembly error: " + ex);
            }
        }

        private static Light SetupLighting()
        {
            var allLights = UnityEngine.Object.FindObjectsByType<Light>();
            Light sun = null;
            foreach (var l in allLights)
            {
                if (l.type == LightType.Directional)
                {
                    if (sun == null) sun = l;
                    else
                    {
                        UnityEngine.Object.DestroyImmediate(l.gameObject);
                    }
                }
            }

            if (sun == null)
            {
                var sunObj = new GameObject("Directional Light");
                sun = sunObj.AddComponent<Light>();
                sun.type = LightType.Directional;
            }

            sun.color = new Color(1.0f, 0.95f, 0.88f); // Chennai tropical morning sunlight
            sun.intensity = 1.25f;
            sun.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(45f, -30f, 0f);

            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.6f, 0.75f, 0.9f);
            RenderSettings.ambientEquatorColor = new Color(0.7f, 0.65f, 0.55f);
            RenderSettings.ambientGroundColor = new Color(0.35f, 0.3f, 0.25f);

            return sun;
        }

        private static GameObject SetupManagers(Light sun)
        {
            var managersObj = GameObject.Find("--- MANAGERS ---");
            if (managersObj == null) managersObj = new GameObject("--- MANAGERS ---");

            // PHASE 2 - SINGLE AUTHORITIES
            if (managersObj.GetComponent<GameManager>() == null) managersObj.AddComponent<GameManager>();
            if (managersObj.GetComponent<GraphicsPerformanceManager>() == null) managersObj.AddComponent<GraphicsPerformanceManager>();
            if (managersObj.GetComponent<MemoryManager>() == null) managersObj.AddComponent<MemoryManager>();
            if (managersObj.GetComponent<WorldStreamingManager>() == null) managersObj.AddComponent<WorldStreamingManager>();
            if (managersObj.GetComponent<AssetManager>() == null) managersObj.AddComponent<AssetManager>();
            if (managersObj.GetComponent<InputManager>() == null) managersObj.AddComponent<InputManager>();
            if (managersObj.GetComponent<QuestManager>() == null) managersObj.AddComponent<QuestManager>();
            if (managersObj.GetComponent<SaveManager>() == null) managersObj.AddComponent<SaveManager>();
            if (managersObj.GetComponent<RealtimeManager>() == null) managersObj.AddComponent<RealtimeManager>();

            // Gameplay & Environmental Subsystems
            if (managersObj.GetComponent<RegionalSceneManager>() == null) managersObj.AddComponent<RegionalSceneManager>();
            if (managersObj.GetComponent<InventoryManager>() == null) managersObj.AddComponent<InventoryManager>();
            if (managersObj.GetComponent<CraftingManager>() == null) managersObj.AddComponent<CraftingManager>();
            if (managersObj.GetComponent<InvestigationManager>() == null) managersObj.AddComponent<InvestigationManager>();
            if (managersObj.GetComponent<WeatherSystem>() == null) managersObj.AddComponent<WeatherSystem>();
            if (managersObj.GetComponent<AudioManager>() == null) managersObj.AddComponent<AudioManager>();
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

            var timeManager = managersObj.GetComponent<TimeOfDayManager>();
            if (timeManager == null) timeManager = managersObj.AddComponent<TimeOfDayManager>();

            return managersObj;
        }

        private static GameObject SetupPlayer()
        {
            var player = GameObject.FindWithTag("Player");
            if (player == null)
            {
                player = new GameObject("Player");
                player.tag = "Player";

                // Spawn on the west sidewalk of the generated corridor, not the world origin.
                // Origin sits on the carriageway at y=0, which left the CharacterController
                // slightly below the road surface on load.
                player.transform.position = new Vector3(-6.5f, BuildChennaiStreet.SidewalkY + 0.12f, -6f);

                var cc = player.AddComponent<CharacterController>();
                cc.height = 1.8f;
                cc.radius = 0.35f;
                cc.center = new Vector3(0f, 0.9f, 0f);
                cc.stepOffset = 0.4f;
                cc.slopeLimit = 45f;
            }

            if (player.GetComponent<PlayerInputHandler>() == null) player.AddComponent<PlayerInputHandler>();
            if (player.GetComponent<PlayerMovement>() == null) player.AddComponent<PlayerMovement>();
            if (player.GetComponent<PlayerAppearanceManager>() == null) player.AddComponent<PlayerAppearanceManager>();
            if (player.GetComponent<PlayerManager>() == null) player.AddComponent<PlayerManager>();
            if (player.GetComponent<PlayerInteractor>() == null) player.AddComponent<PlayerInteractor>();

            // Photo mode reads its shutter and cancel inputs from the player, so it lives on the
            // same object rather than needing a serialized reference to it.
            if (player.GetComponent<Gameplay.PhotoModeController>() == null)
            {
                player.AddComponent<Gameplay.PhotoModeController>();
            }

            // Remove legacy capsule visual if present
            var existingVisual = player.transform.Find("VisualModel");
            if (existingVisual != null)
            {
                UnityEngine.Object.DestroyImmediate(existingVisual.gameObject);
            }

            // Load and instantiate real authored player GLB model
            var playerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Characters/Player/player.glb");
            if (playerPrefab != null)
            {
                var visual = (GameObject)PrefabUtility.InstantiatePrefab(playerPrefab, player.transform);
                visual.name = "VisualModel";
                visual.transform.localPosition = Vector3.zero;
                visual.transform.localRotation = Quaternion.identity;
                visual.transform.localScale = Vector3.one;

                // Remove any colliders from the visual child to avoid CharacterController collision fighting
                foreach (var col in visual.GetComponentsInChildren<Collider>())
                {
                    UnityEngine.Object.DestroyImmediate(col);
                }

                // Attach and configure Animator with PlayerLocomotionController
                var anim = visual.GetComponent<Animator>();
                if (anim == null) anim = visual.AddComponent<Animator>();
                var animCtrl = AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>("Assets/_Project/Art/Animations/PlayerLocomotionController.controller");
                if (animCtrl != null) anim.runtimeAnimatorController = animCtrl;
            }

            return player;
        }

        private static void SetupCamera(GameObject player)
        {
            var camObj = Camera.main != null ? Camera.main.gameObject : GameObject.Find("Main Camera");
            if (camObj == null)
            {
                camObj = new GameObject("Main Camera");
                camObj.AddComponent<Camera>();
                camObj.AddComponent<AudioListener>();
                camObj.tag = "MainCamera";
            }

            var camCtrl = camObj.GetComponent<CameraController>();
            if (camCtrl == null) camCtrl = camObj.AddComponent<CameraController>();
            camCtrl.SetTarget(player.transform);
        }

        private static void SetupUI(GameObject player)
        {
            var canvasObj = GameObject.Find("HUD_Canvas");
            if (canvasObj == null)
            {
                canvasObj = new GameObject("HUD_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                var canvas = canvasObj.GetComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;

                var scaler = canvasObj.GetComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);

                var hudManager = canvasObj.AddComponent<HUDManager>();
                var dialogueUI = canvasObj.AddComponent<DialogueUI>();

                // Tamil-capable font; the builtin font cannot render Tamil.
                var font = LocalizedFontProvider.Font;

                // Region Banner
                var bannerObj = CreateUIText("RegionBanner", canvasObj.transform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -40f), new Vector2(600, 50), font, 24, TextAnchor.MiddleCenter);

                // Clock
                var clockObj = CreateUIText("ClockText", canvasObj.transform, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(-120f, -40f), new Vector2(200, 40), font, 20, TextAnchor.MiddleRight);

                // Currency & Appearance Counter (Strict 5 Changes Limit Display)
                var coinObj = CreateUIText("CurrencyText", canvasObj.transform, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(-120f, -80f), new Vector2(200, 40), font, 18, TextAnchor.MiddleRight);
                var appearObj = CreateUIText("AppearanceText", canvasObj.transform, new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(140f, -40f), new Vector2(250, 40), font, 16, TextAnchor.MiddleLeft);

                // Interaction Prompt
                var promptPanel = new GameObject("PromptPanel", typeof(RectTransform), typeof(Image));
                promptPanel.transform.SetParent(canvasObj.transform, false);
                var promptImg = promptPanel.GetComponent<Image>();
                promptImg.color = new Color(0f, 0f, 0f, 0.7f);
                var promptRect = promptPanel.GetComponent<RectTransform>();
                promptRect.anchorMin = new Vector2(0.5f, 0.25f);
                promptRect.anchorMax = new Vector2(0.5f, 0.25f);
                promptRect.sizeDelta = new Vector2(400, 50);

                var promptTextObj = CreateUIText("PromptText", promptPanel.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, font, 20, TextAnchor.MiddleCenter);

                // Bind to HUDManager via SerializedObject
                var serializedHUD = new SerializedObject(hudManager);
                serializedHUD.FindProperty("regionText").objectReferenceValue = bannerObj.GetComponent<Text>();
                serializedHUD.FindProperty("clockText").objectReferenceValue = clockObj.GetComponent<Text>();
                serializedHUD.FindProperty("currencyText").objectReferenceValue = coinObj.GetComponent<Text>();
                serializedHUD.FindProperty("appearanceChangesText").objectReferenceValue = appearObj.GetComponent<Text>();
                serializedHUD.FindProperty("interactionPromptRoot").objectReferenceValue = promptPanel;
                serializedHUD.FindProperty("interactionPromptText").objectReferenceValue = promptTextObj.GetComponent<Text>();
                serializedHUD.ApplyModifiedProperties();
            }
        }

        private static GameObject CreateUIText(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta, Font font, int fontSize, TextAnchor alignment)
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
            txt.color = Color.white;
            return textObj;
        }

        private static void SetupChennaiEnvironment()
        {
            var envRoot = GameObject.Find("--- CHENNAI_ENVIRONMENT ---");
            if (envRoot == null) envRoot = new GameObject("--- CHENNAI_ENVIRONMENT ---");

            // 1. Street Asphalt Road (collidable surface for movement)
            var road = GameObject.Find("GeorgeTown_Street");
            if (road == null)
            {
                road = GameObject.CreatePrimitive(PrimitiveType.Cube);
                road.name = "GeorgeTown_Street";
                road.transform.SetParent(envRoot.transform, false);
                road.transform.position = new Vector3(0f, -0.1f, 0f);
                road.transform.localScale = new Vector3(14f, 0.2f, 120f);

                var rend = road.GetComponent<MeshRenderer>();
                Shader litShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");
                var mat = new Material(litShader);
                mat.color = new Color(0.18f, 0.2f, 0.22f); // Wet monsoon asphalt
                rend.sharedMaterial = mat;
            }

            // Remove legacy blockout stall if present
            var legacyStall = GameObject.Find("Murugan_Tea_Kadai");
            if (legacyStall != null && legacyStall.GetComponent<MeshFilter>() != null && legacyStall.GetComponent<MeshFilter>().sharedMesh != null && legacyStall.GetComponent<MeshFilter>().sharedMesh.name.Contains("Cube"))
            {
                UnityEngine.Object.DestroyImmediate(legacyStall);
            }

            // 2. Real Murugan Tea Kadai (tea_kadai_stall.glb)
            var stallPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Architecture/chennai/tea_kadai_stall.glb");
            if (stallPrefab != null && GameObject.Find("Murugan_Tea_Kadai") == null)
            {
                var stall = (GameObject)PrefabUtility.InstantiatePrefab(stallPrefab, envRoot.transform);
                stall.name = "Murugan_Tea_Kadai";
                stall.transform.position = new Vector3(-6.5f, 0f, 6f);
                stall.transform.rotation = Quaternion.Euler(0f, 90f, 0f);
                stall.transform.localScale = Vector3.one;

                var box = stall.AddComponent<BoxCollider>();
                box.center = new Vector3(0f, 1.2f, 0f);
                box.size = new Vector3(3.5f, 2.4f, 4f);
            }

            // 3. Chennai Auto Rickshaw (chennai_auto.glb)
            var autoPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Vehicles/auto_rickshaw/chennai_auto.glb");
            if (autoPrefab != null && GameObject.Find("Chennai_AutoRickshaw") == null)
            {
                var auto = (GameObject)PrefabUtility.InstantiatePrefab(autoPrefab, envRoot.transform);
                auto.name = "Chennai_AutoRickshaw";
                auto.transform.position = new Vector3(4.5f, 0f, 10f);
                auto.transform.rotation = Quaternion.Euler(0f, 15f, 0f);
                auto.transform.localScale = Vector3.one;

                var box = auto.AddComponent<BoxCollider>();
                box.center = new Vector3(0f, 0.9f, 0f);
                box.size = new Vector3(1.8f, 1.8f, 3.2f);
            }

            // 4. Chennai Street Row Buildings (street_row.glb & old_tamil_house.glb)
            var streetPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Architecture/chennai/street_row.glb");
            if (streetPrefab != null && GameObject.Find("Street_Row_Left") == null)
            {
                var streetRow = (GameObject)PrefabUtility.InstantiatePrefab(streetPrefab, envRoot.transform);
                streetRow.name = "Street_Row_Left";
                streetRow.transform.position = new Vector3(-14f, 0f, 15f);
                streetRow.transform.rotation = Quaternion.Euler(0f, 90f, 0f);
                streetRow.transform.localScale = Vector3.one;
            }

            var housePrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Architecture/chennai/old_tamil_house.glb");
            if (housePrefab != null && GameObject.Find("Old_Tamil_House_Right") == null)
            {
                var house = (GameObject)PrefabUtility.InstantiatePrefab(housePrefab, envRoot.transform);
                house.name = "Old_Tamil_House_Right";
                house.transform.position = new Vector3(14f, 0f, -5f);
                house.transform.rotation = Quaternion.Euler(0f, -90f, 0f);
                house.transform.localScale = Vector3.one;
            }

            // 5. Electrical Pole (electrical_pole.glb)
            var polePrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Architecture/chennai/electrical_pole.glb");
            if (polePrefab != null && GameObject.Find("Electrical_Pole_01") == null)
            {
                var pole = (GameObject)PrefabUtility.InstantiatePrefab(polePrefab, envRoot.transform);
                pole.name = "Electrical_Pole_01";
                pole.transform.position = new Vector3(-6f, 0f, -8f);
                pole.transform.localScale = Vector3.one;
            }

            // 6. Flower Cart (flower_cart.glb)
            var flowerCartPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Props/market/flower_cart.glb");
            if (flowerCartPrefab != null && GameObject.Find("Flower_Cart") == null)
            {
                var flowerCart = (GameObject)PrefabUtility.InstantiatePrefab(flowerCartPrefab, envRoot.transform);
                flowerCart.name = "Flower_Cart";
                flowerCart.transform.position = new Vector3(-6f, 0f, 14f);
                flowerCart.transform.rotation = Quaternion.Euler(0f, 45f, 0f);
            }

            // 7. Filter Coffee Tumbler (filter_coffee_tumbler.glb) on the Tea Kadai counter
            var coffeePrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Props/food/filter_coffee_tumbler.glb");
            if (coffeePrefab != null && GameObject.Find("Filter_Coffee_Tumbler") == null)
            {
                var coffee = (GameObject)PrefabUtility.InstantiatePrefab(coffeePrefab, envRoot.transform);
                coffee.name = "Filter_Coffee_Tumbler";
                coffee.transform.position = new Vector3(-5.5f, 1.15f, 6.2f);
                coffee.transform.localScale = Vector3.one * 1.2f;
            }

            // 8. Chennai Coastal/Urban Wildlife Habitat Zone (Strictly Whitelisted)
            if (GameObject.Find("WildlifeHabitat_chennai") == null)
            {
                var habitatObj = new GameObject("WildlifeHabitat_chennai");
                habitatObj.transform.SetParent(envRoot.transform, false);
                habitatObj.transform.position = new Vector3(0f, 0f, 20f);
                var zone = habitatObj.AddComponent<WildlifeHabitatZone>();
                var serializedZone = new SerializedObject(zone);
                serializedZone.FindProperty("regionId").stringValue = "chennai";
                serializedZone.FindProperty("zoneId").stringValue = "chennai_urban_coast_01";
                serializedZone.FindProperty("habitatType").enumValueIndex = (int)HabitatType.CoastalShoreline;
                serializedZone.ApplyModifiedProperties();
                zone.EnforceRegionalWhitelistDefaults();
                habitatObj.AddComponent<WildlifeSpawner>();
            }
        }

        private static void SetupNPCs()
        {
            var npcRoot = GameObject.Find("--- NPCS ---");
            if (npcRoot == null) npcRoot = new GameObject("--- NPCS ---");

            // 1. Murugan (Tea Stall Owner)
            var murugan = GameObject.Find("NPC_Murugan");
            if (murugan != null)
            {
                if (murugan.GetComponent<MeshFilter>() != null && murugan.GetComponent<MeshFilter>().sharedMesh != null && murugan.GetComponent<MeshFilter>().sharedMesh.name.Contains("Capsule"))
                {
                    UnityEngine.Object.DestroyImmediate(murugan);
                    murugan = null;
                }
            }

            if (murugan == null)
            {
                var muruganPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Characters/NPCs/murugan.glb");
                if (muruganPrefab != null)
                {
                    murugan = (GameObject)PrefabUtility.InstantiatePrefab(muruganPrefab, npcRoot.transform);
                }
                else
                {
                    murugan = new GameObject("NPC_Murugan");
                    murugan.transform.SetParent(npcRoot.transform, false);
                }

                murugan.name = "NPC_Murugan";
                murugan.transform.position = new Vector3(-5.2f, 0f, 5.8f);
                murugan.transform.rotation = Quaternion.Euler(0f, 90f, 0f);

                var col = murugan.GetComponent<CapsuleCollider>();
                if (col == null) col = murugan.AddComponent<CapsuleCollider>();
                col.height = 1.8f;
                col.radius = 0.4f;
                col.center = new Vector3(0f, 0.9f, 0f);

                var npcComp = murugan.GetComponent<NPCCharacter>();
                if (npcComp == null) npcComp = murugan.AddComponent<NPCCharacter>();
                var serializedNPC = new SerializedObject(npcComp);
                serializedNPC.FindProperty("npcId").stringValue = "murugan";
                serializedNPC.FindProperty("displayNameEn").stringValue = "Murugan";
                serializedNPC.FindProperty("displayNameTa").stringValue = "முருகன்";
                serializedNPC.FindProperty("occupation").intValue = (int)NPCOccupation.Shopkeeper;
                serializedNPC.ApplyModifiedProperties();
            }

            // 2. Velu (Auto Driver & Regional Guide)
            var velu = GameObject.Find("NPC_Velu");
            if (velu == null)
            {
                var veluPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Art/Models/Characters/NPCs/velu.glb");
                if (veluPrefab != null)
                {
                    velu = (GameObject)PrefabUtility.InstantiatePrefab(veluPrefab, npcRoot.transform);
                }
                else
                {
                    velu = new GameObject("NPC_Velu");
                    velu.transform.SetParent(npcRoot.transform, false);
                }

                velu.name = "NPC_Velu";
                velu.transform.position = new Vector3(3.2f, 0f, 10.2f);
                velu.transform.rotation = Quaternion.Euler(0f, -75f, 0f);

                var col = velu.GetComponent<CapsuleCollider>();
                if (col == null) col = velu.AddComponent<CapsuleCollider>();
                col.height = 1.8f;
                col.radius = 0.4f;
                col.center = new Vector3(0f, 0.9f, 0f);

                var npcComp = velu.GetComponent<NPCCharacter>();
                if (npcComp == null) npcComp = velu.AddComponent<NPCCharacter>();
                var serializedNPC = new SerializedObject(npcComp);
                serializedNPC.FindProperty("npcId").stringValue = "velu";
                serializedNPC.FindProperty("displayNameEn").stringValue = "Velu";
                serializedNPC.FindProperty("displayNameTa").stringValue = "வேலு";
                serializedNPC.FindProperty("occupation").intValue = (int)NPCOccupation.Resident;
                serializedNPC.ApplyModifiedProperties();
            }
        }

        /// <summary>
        /// Places the Step 4 gameplay layer: the region bootstrap that seeds the opening quests and
        /// pushes catalogue dialogue onto the residents, the evidence interactables the quest
        /// objectives name, the ingredient pickups that make crafting possible, the photographable
        /// tea kadai, and the journal/crafting bench.
        ///
        /// Everything here is keyed by the stable identifiers declared in
        /// <c>ChennaiOpeningContent</c>. The builder never invents an identifier, so a scene that
        /// regenerates cannot silently stop satisfying an objective.
        /// </summary>
        private static void SetupStep4Gameplay()
        {
            WhisperingWilds.Gameplay.ChennaiOpeningContent.EnsureInitialized();

            SetupRegionBootstrap();
            SetupEvidenceInteractables();
            SetupIngredientPickups();
            SetupPhotoTargets();
            SetupJournalBench();
        }

        private static void SetupRegionBootstrap()
        {
            var regionObj = GameObject.Find("--- REGION_CHENNAI ---");
            if (regionObj == null) regionObj = new GameObject("--- REGION_CHENNAI ---");

            var bootstrap = regionObj.GetComponent<Gameplay.GameplayRegionBootstrap>();
            if (bootstrap == null) bootstrap = regionObj.AddComponent<Gameplay.GameplayRegionBootstrap>();

            var so = new SerializedObject(bootstrap);
            so.FindProperty("regionId").stringValue = WhisperingWilds.Gameplay.ChennaiOpeningContent.RegionId;
            so.ApplyModifiedProperties();

            // The Chennai scene is played standalone as often as it is reached from the boot scene,
            // so the persistent shell is created here too rather than assumed.
            var managersObj = GameObject.Find("--- MANAGERS ---");
            if (managersObj != null)
            {
                if (managersObj.GetComponent<CampaignFlow>() == null) managersObj.AddComponent<CampaignFlow>();
            }
        }

        /// <summary>
        /// Creates the interactables that satisfy the InvestigateObject and ReachLocation objectives
        /// and reveal the clues the quests require.
        /// </summary>
        private static void SetupEvidenceInteractables()
        {
            var root = GameObject.Find("--- EVIDENCE ---");
            if (root == null) root = new GameObject("--- EVIDENCE ---");

            // The court notice board: satisfying reach_plaza, examine_board, and record_clue.
            CreateEventInteractable(root.transform, "Investigate_HighCourtNoticeBoard",
                new Vector3(8f, 1.2f, -6f), new Vector3(1.2f, 2.4f, 0.2f),
                WhisperingWilds.Gameplay.ChennaiOpeningContent.ObjectHighCourtNoticeBoard,
                QuestObjectiveType.InvestigateObject, "interaction.investigate",
                "Read the court notice board", "நீதிமன்ற அறிவிப்புப் பலகையைப் படி",
                WhisperingWilds.Gameplay.ChennaiOpeningContent.ClueHighCourtSticker, null, 0,
                WhisperingWilds.Gameplay.ChennaiOpeningContent.LocationHighCourtPlaza, true);

            // Murugan's ledger on the tea kadai counter: reveals the ledger clue in the world as well
            // as through conversation.
            CreateEventInteractable(root.transform, "Investigate_TeaKadaiLedger",
                new Vector3(-5.6f, 1.1f, 5.4f), new Vector3(0.5f, 0.3f, 0.4f),
                WhisperingWilds.Gameplay.ChennaiOpeningContent.ObjectTeaKadaiLedger,
                QuestObjectiveType.InvestigateObject, "interaction.read",
                "Read the tea ledger", "தேயிலைப் பதிவேட்டைப் படி",
                WhisperingWilds.Gameplay.ChennaiOpeningContent.ClueMuruganTeaLedger, null, 0,
                WhisperingWilds.Gameplay.ChennaiOpeningContent.LocationTeaKadai, true);
        }

        /// <summary>
        /// Creates the pickups that supply the crafting ingredients. Without these the CraftItem
        /// objective is unreachable, because no recipe ingredient is granted anywhere else.
        /// </summary>
        private static void SetupIngredientPickups()
        {
            var root = GameObject.Find("--- PICKUPS ---");
            if (root == null) root = new GameObject("--- PICKUPS ---");

            CreateEventInteractable(root.transform, "Pickup_Velu_TeaLeaves",
                new Vector3(3.6f, 0.8f, 9.4f), new Vector3(0.45f, 0.45f, 0.45f),
                WhisperingWilds.Gameplay.ChennaiOpeningContent.PickupTeaLeaves,
                QuestObjectiveType.CollectItem, "interaction.collect",
                "Take the tea leaves", "தேயிலைகளை எடு",
                null, WhisperingWilds.Gameplay.ChennaiOpeningContent.ItemTeaLeaves, 4,
                WhisperingWilds.Gameplay.ChennaiOpeningContent.LocationVeluRickshaw, true);

            CreateEventInteractable(root.transform, "Pickup_PalmJaggery",
                new Vector3(-5.9f, 1.25f, 6.6f), new Vector3(0.35f, 0.3f, 0.35f),
                WhisperingWilds.Gameplay.ChennaiOpeningContent.PickupPalmJaggery,
                QuestObjectiveType.CollectItem, "interaction.collect",
                "Take the palm jaggery", "பனை வெல்லத்தை எடு",
                null, WhisperingWilds.Gameplay.ChennaiOpeningContent.ItemPalmJaggery, 3,
                WhisperingWilds.Gameplay.ChennaiOpeningContent.LocationTeaKadai, true);

            CreateEventInteractable(root.transform, "Pickup_BambooPole",
                new Vector3(-5.6f, 0.9f, 14.4f), new Vector3(0.2f, 1.7f, 0.2f),
                WhisperingWilds.Gameplay.ChennaiOpeningContent.PickupBambooPole,
                QuestObjectiveType.CollectItem, "interaction.collect",
                "Take a bamboo pole", "மூங்குக் கம்பத்தை எடு",
                null, WhisperingWilds.Gameplay.ChennaiOpeningContent.ItemBambooStick, 2,
                null, false);
        }

        private static void SetupPhotoTargets()
        {
            var stall = GameObject.Find("Murugan_Tea_Kadai");
            if (stall == null) return;

            // A collider already exists on the stall; PhotoTarget requires one for the photo ray.
            if (stall.GetComponent<Collider>() == null) stall.AddComponent<BoxCollider>();

            var target = stall.GetComponent<Photography.PhotoTarget>();
            if (target == null) target = stall.AddComponent<Photography.PhotoTarget>();

            var so = new SerializedObject(target);
            so.FindProperty("targetId").stringValue = WhisperingWilds.Gameplay.ChennaiOpeningContent.PhotoTargetTeaKadaiStall;
            so.FindProperty("displayNameEn").stringValue = "Murugan's Tea Kadai";
            so.FindProperty("displayNameTa").stringValue = "முருகனின் தேய்கடை";
            so.ApplyModifiedProperties();
        }

        private static void SetupJournalBench()
        {
            var canvasObj = GameObject.Find("HUD_Canvas");
            if (canvasObj == null)
            {
                canvasObj = new GameObject("HUD_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                canvasObj.GetComponent<Canvas>().renderMode = RenderMode.ScreenSpaceOverlay;
                var scaler = canvasObj.GetComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
            }

            if (canvasObj.GetComponent<GameplayJournalUI>() == null)
            {
                canvasObj.AddComponent<GameplayJournalUI>();
            }
        }

        private static GameObject CreateEventInteractable(Transform parent, string name, Vector3 position,
            Vector3 size, string targetId, WhisperingWilds.Data.QuestObjectiveType reportType, string promptKey,
            string promptEn, string promptTa, string revealClueId, string grantItemId, int grantItemCount,
            string locationId, bool reportArrival)
        {
            var existing = GameObject.Find(name);
            if (existing != null) return existing;

            var obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
            obj.name = name;
            obj.transform.SetParent(parent, false);
            obj.transform.position = position;
            obj.transform.localScale = size;

            var renderer = obj.GetComponent<MeshRenderer>();
            if (renderer != null)
            {
                // Shared asset material, not an inline `new Material`. The old code assigned
                // `material.color`, which writes _Color; HDRP/Lit reads _BaseColor, so these
                // placeholders were rendering with default white albedo as well as leaving a
                // per-instance material behind.
                renderer.sharedMaterial = WWMaterialLibrary.Lit(
                    "Assets/_Project/Art/Materials/Chennai/InteractionProp.mat",
                    new Color(0.35f, 0.28f, 0.2f),
                    0.15f,
                    0f);
            }

            var interactable = obj.AddComponent<Gameplay.GameplayEventInteractable>();

            var so = new SerializedObject(interactable);
            so.FindProperty("targetId").stringValue = targetId;
            so.FindProperty("reportType").enumValueIndex = (int)reportType;
            so.FindProperty("promptKey").stringValue = promptKey;
            so.FindProperty("promptEn").stringValue = promptEn;
            so.FindProperty("promptTa").stringValue = promptTa;
            so.FindProperty("interactionType").enumValueIndex =
                (int)(reportType == QuestObjectiveType.CollectItem
                    ? InteractionType.Collect
                    : InteractionType.Investigate);
            so.FindProperty("revealClueId").stringValue = revealClueId ?? string.Empty;
            so.FindProperty("grantItemId").stringValue = grantItemId ?? string.Empty;
            so.FindProperty("grantItemCount").intValue = grantItemCount;
            // Only pickups grant, and a pickup must not be refillable by repeated interaction.
            so.FindProperty("grantOnce").boolValue = true;
            so.FindProperty("locationId").stringValue = locationId ?? string.Empty;
            so.FindProperty("reportArrival").boolValue = reportArrival;
            so.ApplyModifiedProperties();

            return obj;
        }
    }
}
