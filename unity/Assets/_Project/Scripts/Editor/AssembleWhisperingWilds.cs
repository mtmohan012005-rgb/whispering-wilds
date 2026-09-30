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

                // 7. Setup Real NPCs (Murugan & Velu)
                SetupNPCs();

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
                player.transform.position = new Vector3(0f, 0f, 0f);

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

                var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

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
                serializedNPC.FindProperty("profession").stringValue = "Tea Stall Owner (தேநீர் கடை உரிமையாளர்)";
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
                serializedNPC.FindProperty("profession").stringValue = "Auto Driver & Regional Guide (ஆட்டோ ஓட்டுநர்)";
                serializedNPC.ApplyModifiedProperties();
            }
        }
    }
}
