// ============================================================================
// THE WHISPERING WILDS — TEMPLE SCENE GENERATOR
// ============================================================================
//
// Unity Editor script to create 08_Ancient_Temple_Ruins.unity with:
// - Terrain (flat stone courtyard)
// - Temple models (heritage_temple_area, gopuram, props)
// - Three stone puzzle mechanisms
// - Hidden chamber door
// - Artifact pickup
// - Player spawn point
// - Lighting (golden hour)
// - AncientTempleLevelController with all references
// ============================================================================

using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.World;
using WhisperingWilds.Investigation;

namespace WhisperingWilds.Editor
{
    public class GenerateTempleScene : EditorWindow
    {
        [MenuItem("Tools/Generate Temple Scene")]
        public static void Generate()
        {
            // Create new scene
            Scene newScene = SceneManager.CreateScene("08_Ancient_Temple_Ruins");
            SceneManager.SetActiveScene(newScene);

            // --- Terrain ---
            CreateTerrain();

            // --- Lighting (Golden Hour) ---
            CreateLighting();

            // --- Temple Models ---
            CreateTempleModels();

            // --- Puzzle Mechanisms ---
            GameObject[] mechanisms = CreatePuzzleMechanisms();

            // --- Hidden Chamber Door ---
            GameObject door = CreateHiddenChamberDoor();

            // --- Artifact Pickup ---
            GameObject artifact = CreateArtifactPickup();

            // --- Player Spawn ---
            CreatePlayerSpawn();

            // --- Level Controller ---
            GameObject controllerObj = new GameObject("TempleLevelController");
            AncientTempleLevelController controller = controllerObj.AddComponent<AncientTempleLevelController>();
            controller.puzzleController = mechanisms[0].GetComponent<TempleFolklorePuzzleController>();
            controller.artifactPickup = artifact.GetComponent<HiddenArtifactPickup>();
            controller.hiddenChamberDoor = door;

            // --- Puzzle Controller ---
            GameObject puzzleObj = new GameObject("PuzzleController");
            TempleFolklorePuzzleController puzzleCtrl = puzzleObj.AddComponent<TempleFolklorePuzzleController>();
            puzzleCtrl.levelController = controller;
            puzzleCtrl.mechanisms = mechanisms;

            // --- Save Scene ---
            string path = "Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity";
            SceneManager.SaveScene(newScene, path);
            AssetDatabase.Refresh();

            // --- Add to Build Settings ---
            AddSceneToBuildSettings(path);

            Debug.Log("[GenerateTempleScene] Temple scene created and added to build settings!");
        }

        private static void CreateTerrain()
        {
            GameObject go = new GameObject("TempleTerrain");
            TerrainData terrainData = new TerrainData();
            terrainData.size = new Vector3(200, 20, 200);
            terrainData.SetHeights(0, 0, new float[513, 513]());
            Terrain terrain = go.AddComponent<Terrain>();
            terrain.terrainData = terrainData;

            // Add stone material
            Material stoneMat = new Material(Shader.Find("HDRP/Lit"));
            stoneMat.name = "TempleStoneGround";
            stoneMat.color = new Color(0.6f, 0.55f, 0.5f);
            terrain.materialTemplate = stoneMat;
        }

        private static void CreateLighting()
        {
            // Main directional light (golden hour)
            GameObject sun = new GameObject("Sun");
            sun.transform.position = new Vector3(50, 30, -50);
            UnityEngine.Light dirLight = sun.AddComponent<UnityEngine.Light>();
            dirLight.type = LightType.Directional;
            dirLight.color = new Color(1f, 0.85f, 0.6f);
            dirLight.intensity = 2f;
            dirLight.shadows = LightShadows.Soft;
            dirLight.transform.rotation = Quaternion.Euler(30, 45, 0);

            // Ambient light
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Skybox;
            RenderSettings.ambientLight = new Color(0.3f, 0.25f, 0.2f);
        }

        private static void CreateTempleModels()
        {
            // Try to load heritage_temple_area.glb if it exists in the project
            string[] templeAssets = AssetDatabase.FindAssets("heritage_temple_area t:Prefab");
            if (templeAssets.Length > 0)
            {
                string path = AssetDatabase.GUIDToAssetPath(templeAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
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
                string path = AssetDatabase.GUIDToAssetPath(gopuramAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
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
                string path = AssetDatabase.GUIDToAssetPath(bellAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
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
                string path = AssetDatabase.GUIDToAssetPath(inscriptionAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
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
                string path = AssetDatabase.GUIDToAssetPath(lampAssets[0]);
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
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
                mech.AddComponent<BoxCollider>();

                // Stone material
                Material stoneMat = new Material(Shader.Find("HDRP/Lit"));
                stoneMat.name = $"MechanismStone_{i}";
                stoneMat.color = new Color(0.5f, 0.45f, 0.4f);
                mech.GetComponent<Renderer>().sharedMaterial = stoneMat;

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
            doorMat.name = "ChamberDoorStone";
            doorMat.color = new Color(0.3f, 0.25f, 0.2f);
            door.GetComponent<Renderer>().sharedMaterial = doorMat;

            door.SetActive(false); // Initially hidden
            return door;
        }

        private static GameObject CreateArtifactPickup()
        {
            GameObject artifact = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            artifact.name = "KaveriStarSeal";
            artifact.transform.position = new Vector3(0, 1, -25);
            artifact.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);

            Material artifactMat = new Material(Shader.Find("HDRP/Lit"));
            artifactMat.name = "KaveriStarSealMaterial";
            artifactMat.color = new Color(1f, 0.84f, 0f); // Gold
            artifact.GetComponent<Renderer>().sharedMaterial = artifactMat;

            HiddenArtifactPickup pickup = artifact.AddComponent<HiddenArtifactPickup>();
            pickup.Initialize(false);

            return artifact;
        }

        private static void CreatePlayerSpawn()
        {
            GameObject spawn = new GameObject("PlayerSpawnPoint");
            spawn.transform.position = new Vector3(0, 1, 20);
            spawn.tag = "PlayerSpawn";
        }

        private static void AddSceneToBuildSettings(string scenePath)
        {
            EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;
            int index = scenes.Length;
            EditorBuildSettingsScene[] newScenes = new EditorBuildSettingsScene[scenes.Length + 1];
            for (int i = 0; i < scenes.Length; i++)
                newScenes[i] = scenes[i];
            newScenes[index] = new EditorBuildSettingsScene(scenePath, true);
            EditorBuildSettings.scenes = newScenes;
        }
    }
}
