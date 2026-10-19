// ============================================================================
// THE WHISPERING WILDS — TEMPLE SCENE GENERATOR
// ============================================================================
//
// Unity Editor script to create 08_Ancient_Temple_Ruins.unity with:
// - Ground plane (stone courtyard)
// - Temple models (heritage_temple_area, gopuram, props)
// - Three stone puzzle mechanisms with StoneMechanism components
// - Hidden chamber door
// - Artifact pickup
// - Player spawn point (using "Player" tag)
// - Lighting (golden hour)
// - AncientTempleLevelController with all references wired
// - TempleFolklorePuzzleController on separate GameObject
//
// Fixs from previous version:
// 1. Uses UnityEngine.Terrain explicitly to avoid type conflicts
// 2. Puzzle controller is on its own GameObject, not on mechanisms[0]
// 3. Uses "Player" tag instead of non-existent "PlayerSpawn"
// 4. Updates existing build settings entry instead of duplicating
// 5. Adds StoneMechanism IInteractable components to puzzle stones
// 6. Checks for existing scene before regenerating
// ============================================================================

using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.World;
using WhisperingWilds.Investigation;
using WhisperingWilds.Gameplay;

namespace WhisperingWilds.Editor
{
    public class GenerateTempleScene : EditorWindow
    {
        private const string SceneName = "08_Ancient_Temple_Ruins";
        private const string ScenePath = "Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity";

        [MenuItem("Tools/Generate Temple Scene")]
        public static void Generate()
        {
            // Check if scene already exists to avoid duplicates
            if (File.Exists(ScenePath))
            {
                bool overwrite = EditorUtility.DisplayDialog(
                    "Temple Scene Exists",
                    $"Scene {ScenePath} already exists. Overwrite?",
                    "Overwrite",
                    "Cancel");
                if (!overwrite)
                {
                    Debug.LogWarning("[GenerateTempleScene] Cancelled by user.");
                    return;
                }
                File.Delete(ScenePath);
                string metaPath = ScenePath + ".meta";
                if (File.Exists(metaPath))
                {
                    File.Delete(metaPath);
                }
            }

            // Create new scene using Editor API (SceneManager.CreateScene only works in play mode)
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // --- Ground (using flat plane instead of Terrain to avoid type issues) ---
            CreateGround();

            // --- Lighting (Golden Hour) ---
            CreateLighting();

            // --- Temple Models ---
            CreateTempleModels();

            // --- Puzzle Mechanisms with StoneMechanism components ---
            GameObject[] mechanisms = CreatePuzzleMechanisms();

            // --- Hidden Chamber Door ---
            GameObject door = CreateHiddenChamberDoor();

            // --- Artifact Pickup ---
            GameObject artifact = CreateArtifactPickup();

            // --- Player Spawn (using "Player" tag from TagManager) ---
            CreatePlayerSpawn();

            // --- Player Character (instantiate from prefab if available) ---
            CreatePlayerCharacter();

            // --- Gameplay Region Bootstrap (ensures GameManager, SaveManager, CampaignFlow) ---
            CreateGameplayBootstrap();

            // --- Puzzle Controller on its own GameObject ---
            GameObject puzzleObj = new GameObject("PuzzleController");
            TempleFolklorePuzzleController puzzleCtrl = puzzleObj.AddComponent<TempleFolklorePuzzleController>();

            // --- Level Controller with all references ---
            GameObject controllerObj = new GameObject("TempleLevelController");
            AncientTempleLevelController controller = controllerObj.AddComponent<AncientTempleLevelController>();
            controller.puzzleController = puzzleCtrl;
            controller.artifactPickup = artifact.GetComponent<HiddenArtifactPickup>();
            controller.hiddenChamberDoor = door;

            // --- Save Scene ---
            EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), ScenePath);
            AssetDatabase.Refresh();

            // --- Add to Build Settings (update existing or add new) ---
            AddOrUpdateSceneInBuildSettings(ScenePath);

            Debug.Log($"[GenerateTempleScene] Temple scene created at {ScenePath} and added to build settings!");
        }

        private static void CreateGround()
        {
            // Use a flat plane as the ground instead of Terrain to avoid type conflicts
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "TempleGround";
            ground.transform.position = new Vector3(0, 0, 0);
            ground.transform.localScale = new Vector3(20, 1, 20);

            // Stone material
            Material stoneMat = new Material(Shader.Find("HDRP/Lit"));
            if (stoneMat == null)
            {
                stoneMat = new Material(Shader.Find("Standard"));
            }
            stoneMat.name = "TempleStoneGround";
            stoneMat.color = new Color(0.6f, 0.55f, 0.5f);
            ground.GetComponent<Renderer>().sharedMaterial = stoneMat;

            // Add collider
            if (ground.GetComponent<Collider>() == null)
            {
                ground.AddComponent<BoxCollider>();
            }
        }

        private static void CreateLighting()
        {
            // Main directional light (golden hour)
            GameObject sun = new GameObject("Sun");
            sun.transform.position = new Vector3(50, 30, -50);
            Light dirLight = sun.AddComponent<Light>();
            dirLight.type = LightType.Directional;
            dirLight.color = new Color(1f, 0.85f, 0.6f);
            dirLight.intensity = 2f;
            dirLight.shadows = LightShadows.Soft;
            dirLight.transform.rotation = Quaternion.Euler(30, 45, 0);

            // Ambient light and fog
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.3f, 0.25f, 0.2f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.77f, 0.69f, 0.55f);
            RenderSettings.fogDensity = 0.015f;
        }

        private static void CreateTempleModels()
        {
            // Try to load heritage_temple_area if it exists in the project
            string[] templeAssets = AssetDatabase.FindAssets("heritage_temple_area t:Prefab");
            if (templeAssets.Length > 0)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(templeAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                if (prefab != null)
                {
                    GameObject instance = GameObject.Instantiate(prefab, new Vector3(0, 0, 0), Quaternion.identity);
                    instance.name = "HeritageTempleArea";
                }
            }

            // Try to load gopuram
            string[] gopuramAssets = AssetDatabase.FindAssets("thanjavur_gopuram t:Prefab");
            if (gopuramAssets.Length > 0)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(gopuramAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                if (prefab != null)
                {
                    GameObject instance = GameObject.Instantiate(prefab, new Vector3(0, 0, -30), Quaternion.identity);
                    instance.name = "Gopuram";
                }
            }

            // Temple bell
            string[] bellAssets = AssetDatabase.FindAssets("temple_bell t:Prefab");
            if (bellAssets.Length > 0)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(bellAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                if (prefab != null)
                {
                    GameObject instance = GameObject.Instantiate(prefab, new Vector3(5, 2, -5), Quaternion.identity);
                    instance.name = "TempleBell";
                }
            }

            // Stone inscription
            string[] inscriptionAssets = AssetDatabase.FindAssets("stone_inscription t:Prefab");
            if (inscriptionAssets.Length > 0)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(inscriptionAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                if (prefab != null)
                {
                    GameObject instance = GameObject.Instantiate(prefab, new Vector3(-5, 1, -5), Quaternion.identity);
                    instance.name = "StoneInscription";
                }
            }

            // Brass lamp
            string[] lampAssets = AssetDatabase.FindAssets("brass_lamp t:Prefab");
            if (lampAssets.Length > 0)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(lampAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                if (prefab != null)
                {
                    GameObject instance = GameObject.Instantiate(prefab, new Vector3(3, 1, 3), Quaternion.identity);
                    instance.name = "BrassLamp";
                }
            }
        }

        private static GameObject[] CreatePuzzleMechanisms()
        {
            GameObject[] mechanisms = new GameObject[3];
            for (int i = 0; i < 3; i++)
            {
                GameObject mech = GameObject.CreatePrimitive(PrimitiveType.Cube);
                mech.name = $"StoneMechanism_{i}";
                mech.transform.position = new Vector3(-10 + i * 10, 1, 10);
                mech.transform.localScale = new Vector3(2, 2, 2);

                // Stone material
                Material stoneMat = new Material(Shader.Find("HDRP/Lit"));
                if (stoneMat == null)
                {
                    stoneMat = new Material(Shader.Find("Standard"));
                }
                stoneMat.name = $"MechanismStone_{i}";
                stoneMat.color = new Color(0.5f, 0.45f, 0.4f);
                mech.GetComponent<Renderer>().sharedMaterial = stoneMat;

                // Add StoneMechanism component for interaction
                StoneMechanism stoneMech = mech.AddComponent<StoneMechanism>();
                stoneMech.mechanismIndex = i;
                stoneMech.numberOfPositions = 3;
                stoneMech.rotationPerStep = 30f;

                mechanisms[i] = mech;
            }
            return mechanisms;
        }

        private static GameObject CreateHiddenChamberDoor()
        {
            GameObject door = GameObject.CreatePrimitive(PrimitiveType.Cube);
            door.name = "HiddenChamberDoor";
            door.transform.position = new Vector3(0, 2, -20);
            door.transform.localScale = new Vector3(6, 4, 0.5f);

            Material doorMat = new Material(Shader.Find("HDRP/Lit"));
            if (doorMat == null)
            {
                doorMat = new Material(Shader.Find("Standard"));
            }
            doorMat.name = "ChamberDoorStone";
            doorMat.color = new Color(0.3f, 0.25f, 0.2f);
            door.GetComponent<Renderer>().sharedMaterial = doorMat;

            door.SetActive(false); // Initially hidden until puzzle is solved
            return door;
        }

        private static GameObject CreateArtifactPickup()
        {
            GameObject artifact = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            artifact.name = "KaveriStarSeal";
            artifact.transform.position = new Vector3(0, 1, -25);
            artifact.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);

            Material artifactMat = new Material(Shader.Find("HDRP/Lit"));
            if (artifactMat == null)
            {
                artifactMat = new Material(Shader.Find("Standard"));
            }
            artifactMat.name = "KaveriStarSealMaterial";
            artifactMat.color = new Color(1f, 0.84f, 0f); // Gold
            artifact.GetComponent<Renderer>().sharedMaterial = artifactMat;

            HiddenArtifactPickup pickup = artifact.AddComponent<HiddenArtifactPickup>();
            // Initialize will be called by AncientTempleLevelController
            return artifact;
        }

        private static void CreatePlayerSpawn()
        {
            GameObject spawn = new GameObject("PlayerSpawnPoint");
            spawn.transform.position = new Vector3(0, 1, 20);
            // Use "Player" tag which exists in TagManager.asset
            spawn.tag = "Player";
        }

        private static void CreatePlayerCharacter()
        {
            // Try to load PlayerCharacter prefab from the project
            string[] playerAssets = AssetDatabase.FindAssets("PlayerCharacter t:Prefab");
            GameObject playerInstance = null;
            foreach (string guid in playerAssets)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                if (path.Contains("Prefabs/Characters"))
                {
                    GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                    if (prefab != null)
                    {
                        playerInstance = GameObject.Instantiate(prefab, new Vector3(0, 1, 20), Quaternion.Euler(0, 180, 0));
                        playerInstance.name = "PlayerCharacter";
                        break;
                    }
                }
            }

            if (playerInstance == null)
            {
                // Fallback: create a minimal player GameObject with required components
                Debug.LogWarning("[GenerateTempleScene] PlayerCharacter prefab not found, creating minimal player.");
                playerInstance = new GameObject("PlayerCharacter");
                playerInstance.tag = "Player";
                playerInstance.transform.position = new Vector3(0, 1, 20);
                playerInstance.transform.rotation = Quaternion.Euler(0, 180, 0);

                // Add basic components needed for gameplay
                var capsule = playerInstance.AddComponent<CapsuleCollider>();
                capsule.height = 2f;
                capsule.radius = 0.5f;
                capsule.center = new Vector3(0, 1f, 0);

                var rb = playerInstance.AddComponent<Rigidbody>();
                rb.isKinematic = true;
                rb.useGravity = false;
            }
        }

        private static void CreateGameplayBootstrap()
        {
            // GameplayRegionBootstrap ensures GameManager, SaveManager, CampaignFlow exist
            // and sets the region ID for this scene
            GameObject bootstrapObj = new GameObject("GameplayRegionBootstrap");
            GameplayRegionBootstrap bootstrap = bootstrapObj.AddComponent<GameplayRegionBootstrap>();
            // The regionId will be set to "ancient_temple" in the inspector or via script
            // For now, the bootstrap will use the default Chennai region, which is fine for testing
            Debug.Log("[GenerateTempleScene] GameplayRegionBootstrap added to ensure persistent managers.");
        }

        private static void AddOrUpdateSceneInBuildSettings(string scenePath)
        {
            EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;

            // Check if scene already exists in build settings
            for (int i = 0; i < scenes.Length; i++)
            {
                if (scenes[i].path == scenePath)
                {
                    // Update existing entry
                    scenes[i].enabled = true;
                    EditorBuildSettings.scenes = scenes;
                    Debug.Log($"[GenerateTempleScene] Updated existing build settings entry for {scenePath}");
                    return;
                }
            }

            // Add new entry at the end
            EditorBuildSettingsScene[] newScenes = new EditorBuildSettingsScene[scenes.Length + 1];
            for (int i = 0; i < scenes.Length; i++)
            {
                newScenes[i] = scenes[i];
            }
            newScenes[scenes.Length] = new EditorBuildSettingsScene(scenePath, true);
            EditorBuildSettings.scenes = newScenes;
            Debug.Log($"[GenerateTempleScene] Added {scenePath} to build settings at index {scenes.Length}");
        }
    }
}
