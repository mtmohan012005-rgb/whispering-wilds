// ============================================================================
// THE WHISPERING WILDS — TEMPLE SCENE GENERATOR (REALISM & ASSET UPGRADE)
// ============================================================================
//
// Unity Editor script to create 08_Ancient_Temple_Ruins.unity with:
// - PBR stone courtyard with authentic Dravidian paving materials
// - Heritage temple models (heritage_temple_area, thanjavur_gopuram, props)
// - Three realistic stone puzzle mechanisms with granite columns, carved dials,
//   and StoneMechanism components (NO greybox cubes)
// - Architectural Dravidian sanctum portal door with carved relief leaves and
//   torana framing (NO greybox cube)
// - Designed Kaveri Star Seal 8-pointed stellar medallion resting on a carved altar
//   pedestal with sacred brass lamps (NO greybox sphere)
// - Player spawn point (using "Player" tag) and PlayerCharacter
// - Golden hour directional lighting and atmospheric temple lamps
// - AncientTempleLevelController with all references wired
// - TempleFolklorePuzzleController on separate GameObject
// - Deterministic mesh generation via TempleMeshBuilder with stable GUIDs
// ============================================================================

using System.IO;
using System.Linq;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.World;
using WhisperingWilds.Investigation;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Player;
using WhisperingWilds.Cameras;
using WhisperingWilds.Audio;

namespace WhisperingWilds.Editor
{
    public class GenerateTempleScene : EditorWindow
    {
        private const string SceneName = "08_Ancient_Temple_Ruins";
        private const string ScenePath = "Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity";

        [MenuItem("Tools/Generate Temple Scene")]
        public static void Generate()
        {
            // In interactive mode, confirm overwrite if scene exists; in batchmode, overwrite cleanly
            if (File.Exists(ScenePath) && !Application.isBatchMode)
            {
                bool overwrite = EditorUtility.DisplayDialog(
                    "Temple Scene Exists",
                    $"Scene {ScenePath} already exists. Overwrite with realistic Dravidian temple assets?",
                    "Overwrite",
                    "Cancel");
                if (!overwrite)
                {
                    Debug.LogWarning("[GenerateTempleScene] Cancelled by user.");
                    return;
                }
            }

            // Create new scene using Editor API
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Clear material cache to ensure fresh PBR shader references
            WWMaterialLibrary.ClearCache();

            // --- Ground Courtyard ---
            CreateGround();

            // --- Lighting (Golden Hour & Temple Torches) ---
            CreateLighting();

            // --- Heritage Architecture & Props ---
            CreateTempleModels();

            // --- Realistic Puzzle Mechanisms with StoneMechanism components ---
            GameObject[] mechanisms = CreatePuzzleMechanisms();

            // --- Fitted Dravidian Sanctum Portal Door ---
            GameObject door = CreateHiddenChamberDoor();

            // --- Designed Kaveri Star Seal Medallion Artifact ---
            GameObject artifact = CreateArtifactPickup();

            // --- Player Spawn ---
            CreatePlayerSpawn();

            // --- Player Character ---
            GameObject playerCharacter = CreatePlayerCharacter();

            // --- Gameplay Region Bootstrap ---
            CreateGameplayBootstrap();

            // --- Main Camera with CameraController ---
            CreateMainCamera(playerCharacter);

            // --- Puzzle Controller on its own GameObject ---
            GameObject puzzleObj = new GameObject("PuzzleController");
            TempleFolklorePuzzleController puzzleCtrl = puzzleObj.AddComponent<TempleFolklorePuzzleController>();

            // --- Level Controller with all references wired ---
            GameObject controllerObj = new GameObject("TempleLevelController");
            AncientTempleLevelController controller = controllerObj.AddComponent<AncientTempleLevelController>();
            controller.puzzleController = puzzleCtrl;
            controller.artifactPickup = artifact.GetComponent<HiddenArtifactPickup>();
            controller.hiddenChamberDoor = door;

            // --- Wire Audio Clips ---
            WireAudioClips(controller, puzzleCtrl);

            // --- Save Scene (Preserves existing .meta GUID) ---
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            // --- Add to Build Settings (update existing or add new) ---
            AddOrUpdateSceneInBuildSettings(ScenePath);

            Debug.Log($"<color=#00FF88><b>[GenerateTempleScene]</b></color> Dravidian temple ruins scene successfully created at {ScenePath}!");
        }

        private static void CreateGround()
        {
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "TempleGround";
            ground.transform.position = Vector3.zero;
            ground.transform.localScale = new Vector3(20, 1, 20);

            // Shared HDRP/Lit PBR Courtyard Stone Material
            Material stoneMat = WWMaterialLibrary.Lit(
                "Assets/_Project/Art/Materials/Temple/TempleCourtyardPaving.mat",
                new Color(0.52f, 0.49f, 0.45f),
                0.05f,
                0.28f);

            ground.GetComponent<Renderer>().sharedMaterial = stoneMat;

            if (ground.GetComponent<Collider>() == null)
            {
                ground.AddComponent<BoxCollider>();
            }

            // Courtyard perimeter stone boundary kerbs
            GameObject kerbs = new GameObject("Courtyard_Perimeter_Kerbs");
            kerbs.transform.SetParent(ground.transform, false);

            Material kerbMat = WWMaterialLibrary.Lit(
                "Assets/_Project/Art/Materials/Temple/DravidianCarvedGranite.mat",
                new Color(0.44f, 0.41f, 0.38f),
                0.06f,
                0.32f);

            Mesh kerbMesh = TempleMeshBuilder.GetOrCreateBeveledSlabMesh(
                "Assets/_Project/Art/Meshes/Temple/CourtyardKerb_Long.asset",
                40f, 0.35f, 0.6f, 0.08f);

            void PlaceKerb(string name, Vector3 pos, Quaternion rot)
            {
                GameObject k = new GameObject(name);
                k.transform.SetParent(kerbs.transform, false);
                k.transform.position = pos;
                k.transform.rotation = rot;
                var mf = k.AddComponent<MeshFilter>();
                mf.sharedMesh = kerbMesh;
                var mr = k.AddComponent<MeshRenderer>();
                mr.sharedMaterial = kerbMat;
            }

            PlaceKerb("Kerb_North", new Vector3(0, 0.17f, 40f), Quaternion.identity);
            PlaceKerb("Kerb_South", new Vector3(0, 0.17f, -40f), Quaternion.identity);
            PlaceKerb("Kerb_West", new Vector3(-40f, 0.17f, 0), Quaternion.Euler(0, 90, 0));
            PlaceKerb("Kerb_East", new Vector3(40f, 0.17f, 0), Quaternion.Euler(0, 90, 0));
        }

        private static void CreateLighting()
        {
            // Main directional light (golden hour sunlight across temple towers)
            GameObject sun = new GameObject("Sun");
            sun.transform.position = new Vector3(50, 30, -50);
            Light dirLight = sun.AddComponent<Light>();
            dirLight.type = LightType.Directional;
            dirLight.color = new Color(1f, 0.88f, 0.65f);
            dirLight.intensity = 2.4f;
            dirLight.shadows = LightShadows.Soft;
            dirLight.transform.rotation = Quaternion.Euler(32, 48, 0);

            // Ambient lighting and warm dust atmosphere
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.32f, 0.28f, 0.24f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.78f, 0.70f, 0.58f);
            RenderSettings.fogDensity = 0.012f;
        }

        private static void CreateTempleModels()
        {
            // Heritage temple area
            string templePath = "Assets/_Project/Art/Models/Architecture/thanjavur/heritage_temple_area.glb";
            GameObject templeModel = AssetDatabase.LoadAssetAtPath<GameObject>(templePath);
            if (templeModel != null)
            {
                GameObject instance = GameObject.Instantiate(templeModel, new Vector3(0, 0, 0), Quaternion.identity);
                instance.name = "HeritageTempleArea";
                Debug.Log("[GenerateTempleScene] Loaded heritage_temple_area.glb");
            }
            else
            {
                Debug.LogWarning($"[GenerateTempleScene] Temple model not found at {templePath}");
            }

            // Gopuram
            string gopuramPath = "Assets/_Project/Art/Models/Architecture/thanjavur_gopuram.glb";
            GameObject gopuramModel = AssetDatabase.LoadAssetAtPath<GameObject>(gopuramPath);
            if (gopuramModel != null)
            {
                GameObject instance = GameObject.Instantiate(gopuramModel, new Vector3(0, 0, -30), Quaternion.identity);
                instance.name = "Gopuram";
                Debug.Log("[GenerateTempleScene] Loaded thanjavur_gopuram.glb");
            }
            else
            {
                Debug.LogWarning($"[GenerateTempleScene] Gopuram model not found at {gopuramPath}");
            }

            // Temple bell
            string bellPath = "Assets/_Project/Art/Models/Props/temple/temple_bell.glb";
            GameObject bellModel = AssetDatabase.LoadAssetAtPath<GameObject>(bellPath);
            if (bellModel != null)
            {
                GameObject instance = GameObject.Instantiate(bellModel, new Vector3(5, 2, -5), Quaternion.identity);
                instance.name = "TempleBell";
                Debug.Log("[GenerateTempleScene] Loaded temple_bell.glb");
            }

            // Stone inscription prop in the mandapa
            string inscriptionPath = "Assets/_Project/Art/Models/Props/temple/stone_inscription.glb";
            GameObject inscriptionModel = AssetDatabase.LoadAssetAtPath<GameObject>(inscriptionPath);
            if (inscriptionModel != null)
            {
                GameObject instance = GameObject.Instantiate(inscriptionModel, new Vector3(-6, 0, -5), Quaternion.Euler(0, 25, 0));
                instance.name = "StoneInscription_Mandapa";
                Debug.Log("[GenerateTempleScene] Loaded stone_inscription.glb");
            }

            // Brass lamp with warm point light
            string lampPath = "Assets/_Project/Art/Models/Props/temple/brass_lamp.glb";
            GameObject lampModel = AssetDatabase.LoadAssetAtPath<GameObject>(lampPath);
            if (lampModel != null)
            {
                GameObject lampInstance = GameObject.Instantiate(lampModel, new Vector3(3.5f, 0, 3), Quaternion.identity);
                lampInstance.name = "BrassLamp_Courtyard";
                AddWarmLampLight(lampInstance, 1.2f);
                Debug.Log("[GenerateTempleScene] Loaded brass_lamp.glb");
            }

            // Granite columns forming the colonnade approach
            string columnPath = "Assets/_Project/Art/Models/Props/temple/granite_column.glb";
            GameObject columnModel = AssetDatabase.LoadAssetAtPath<GameObject>(columnPath);
            if (columnModel != null)
            {
                GameObject col1 = GameObject.Instantiate(columnModel, new Vector3(-4.5f, 0, -10), Quaternion.identity);
                col1.name = "Colonnade_Pillar_West";
                GameObject col2 = GameObject.Instantiate(columnModel, new Vector3(4.5f, 0, -10), Quaternion.identity);
                col2.name = "Colonnade_Pillar_East";
                Debug.Log("[GenerateTempleScene] Loaded colonnade granite_column.glb pillars");
            }

            // Sacred standing lamps (kuthu_vilakku) flanking the sanctum vestibule
            string kuthuPath = "Assets/_Project/Art/Models/Props/temple/kuthu_vilakku.glb";
            GameObject kuthuModel = AssetDatabase.LoadAssetAtPath<GameObject>(kuthuPath);
            if (kuthuModel != null)
            {
                GameObject kvWest = GameObject.Instantiate(kuthuModel, new Vector3(-3.2f, 0, -17), Quaternion.identity);
                kvWest.name = "KuthuVilakku_Vestibule_West";
                AddWarmLampLight(kvWest, 1.4f);

                GameObject kvEast = GameObject.Instantiate(kuthuModel, new Vector3(3.2f, 0, -17), Quaternion.identity);
                kvEast.name = "KuthuVilakku_Vestibule_East";
                AddWarmLampLight(kvEast, 1.4f);
                Debug.Log("[GenerateTempleScene] Loaded kuthu_vilakku.glb sanctum lamps");
            }

            // Dravidian monumental torana temple gateway at the courtyard entrance
            string gatePath = "Assets/_Project/Art/Models/Architecture/temple/temple_gate.glb";
            GameObject gateModel = AssetDatabase.LoadAssetAtPath<GameObject>(gatePath);
            if (gateModel != null)
            {
                GameObject gateInstance = GameObject.Instantiate(gateModel, new Vector3(0, 0, -22), Quaternion.identity);
                gateInstance.name = "DravidianTempleGateway_Torana";
                Debug.Log("[GenerateTempleScene] Loaded temple_gate.glb");
            }

            // Interlocking granite ashlar precinct walls flanking the courtyard perimeter
            string wallPath = "Assets/_Project/Art/Models/Props/temple/temple_wall.glb";
            GameObject wallModel = AssetDatabase.LoadAssetAtPath<GameObject>(wallPath);
            if (wallModel != null)
            {
                GameObject wallWest = GameObject.Instantiate(wallModel, new Vector3(-12, 0, 0), Quaternion.identity);
                wallWest.name = "TemplePerimeterWall_West";
                GameObject wallEast = GameObject.Instantiate(wallModel, new Vector3(12, 0, 0), Quaternion.identity);
                wallEast.name = "TemplePerimeterWall_East";
                Debug.Log("[GenerateTempleScene] Loaded temple_wall.glb precinct walls");
            }

            // Sacred brass kalasam finial urns crowning mandapa plinths
            string urnPath = "Assets/_Project/Art/Models/Props/temple/temple_urn.glb";
            GameObject urnModel = AssetDatabase.LoadAssetAtPath<GameObject>(urnPath);
            if (urnModel != null)
            {
                GameObject urnWest = GameObject.Instantiate(urnModel, new Vector3(-2.2f, 0, -14f), Quaternion.identity);
                urnWest.name = "SacredKalasamUrn_West";
                GameObject urnEast = GameObject.Instantiate(urnModel, new Vector3(2.2f, 0, -14f), Quaternion.identity);
                urnEast.name = "SacredKalasamUrn_East";
                Debug.Log("[GenerateTempleScene] Loaded temple_urn.glb finial urns");
            }

            // Sacred stepped theertham water tank (Kalyani) for ritual ablutions
            string wellPath = "Assets/_Project/Art/Models/Props/temple/temple_well.glb";
            GameObject wellModel = AssetDatabase.LoadAssetAtPath<GameObject>(wellPath);
            if (wellModel != null)
            {
                GameObject wellInstance = GameObject.Instantiate(wellModel, new Vector3(16, 0, -6), Quaternion.identity);
                wellInstance.name = "SacredTheerthamTank_Kalyani";
                Debug.Log("[GenerateTempleScene] Loaded temple_well.glb theertham water tank");
            }
        }

        private static GameObject[] CreatePuzzleMechanisms()
        {
            GameObject[] mechanisms = new GameObject[3];

            string columnPath = "Assets/_Project/Art/Models/Props/temple/granite_column.glb";
            GameObject columnModel = AssetDatabase.LoadAssetAtPath<GameObject>(columnPath);

            string inscriptionPath = "Assets/_Project/Art/Models/Props/temple/stone_inscription.glb";
            GameObject inscriptionModel = AssetDatabase.LoadAssetAtPath<GameObject>(inscriptionPath);

            // Shared PBR granite material for carved dial
            Material dialMat = WWMaterialLibrary.Lit(
                "Assets/_Project/Art/Materials/Temple/DravidianCarvedGranite.mat",
                new Color(0.44f, 0.41f, 0.38f),
                0.06f,
                0.32f);

            // Carved stone rotating dial mesh with 3 radial position relief notches
            Mesh dialMesh = TempleMeshBuilder.GetOrCreateCarvedStoneDialMesh(
                "Assets/_Project/Art/Meshes/Temple/StoneMechanismDial.asset",
                0.95f,
                0.28f,
                24);

            // Circular stepped plinth base slab
            Mesh plinthMesh = TempleMeshBuilder.GetOrCreateCarvedStoneDialMesh(
                "Assets/_Project/Art/Meshes/Temple/StoneMechanismPlinth.asset",
                1.35f,
                0.15f,
                24);

            for (int i = 0; i < 3; i++)
            {
                // Root mechanism GameObject: NO primitive cube!
                GameObject mech = new GameObject($"StoneMechanism_{i}");
                mech.transform.position = new Vector3(-10 + i * 10, 0, 10);

                // Invisible interaction and navigation collision bounds
                BoxCollider collider = mech.AddComponent<BoxCollider>();
                collider.center = new Vector3(0, 1.3f, 0);
                collider.size = new Vector3(2.2f, 2.6f, 2.2f);

                // Child 1: Stone Plinth Base
                GameObject plinth = new GameObject("PlinthBase");
                plinth.transform.SetParent(mech.transform, false);
                plinth.transform.localPosition = new Vector3(0, 0.08f, 0);
                var plinthMf = plinth.AddComponent<MeshFilter>();
                plinthMf.sharedMesh = plinthMesh;
                var plinthMr = plinth.AddComponent<MeshRenderer>();
                plinthMr.sharedMaterial = dialMat;

                // Child 2: Carved Granite Pillar Shaft (from granite_column.glb)
                if (columnModel != null)
                {
                    GameObject col = GameObject.Instantiate(columnModel, mech.transform);
                    col.name = "PillarShaft";
                    col.transform.localPosition = Vector3.zero;
                    col.transform.localScale = new Vector3(0.85f, 0.85f, 0.85f);
                }

                // Child 3: Rotating Inscribed Tablet & Capital Dial
                GameObject dial = new GameObject("RotatingMechanismDial");
                dial.transform.SetParent(mech.transform, false);
                dial.transform.localPosition = new Vector3(0, 2.15f, 0);
                var dialMf = dial.AddComponent<MeshFilter>();
                dialMf.sharedMesh = dialMesh;
                var dialMr = dial.AddComponent<MeshRenderer>();
                dialMr.sharedMaterial = dialMat;

                // Child 4: Inscription Tablet mounted on the mechanism capital
                if (inscriptionModel != null)
                {
                    GameObject insc = GameObject.Instantiate(inscriptionModel, mech.transform);
                    insc.name = "CarvedRuneTablet";
                    insc.transform.localPosition = new Vector3(0, 1.35f, 0.42f);
                    insc.transform.localRotation = Quaternion.Euler(-10f, 0, 0);
                    insc.transform.localScale = new Vector3(0.55f, 0.55f, 0.55f);
                }

                // Add StoneMechanism gameplay component
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
            // Root chamber door assembly: NO primitive cube!
            GameObject door = new GameObject("HiddenChamberDoor");
            door.transform.position = new Vector3(0, 2, -20);

            // Invisible collision volume matching exact original door boundaries
            BoxCollider col = door.AddComponent<BoxCollider>();
            col.center = Vector3.zero;
            col.size = new Vector3(6f, 4f, 0.5f);

            // Shared PBR material for the sanctum stone door
            Material doorStoneMat = WWMaterialLibrary.Lit(
                "Assets/_Project/Art/Materials/Temple/SanctumStoneDoor.mat",
                new Color(0.38f, 0.35f, 0.32f),
                0.08f,
                0.35f);

            // Carved door leaves with traditional Dravidian relief panels
            Mesh leafMesh = TempleMeshBuilder.GetOrCreateDoorLeafMesh(
                "Assets/_Project/Art/Meshes/Temple/SanctumDoorLeaf.asset",
                2.8f,
                3.8f,
                0.32f);

            // Left stone door leaf
            GameObject leftLeaf = new GameObject("SanctumDoor_Left");
            leftLeaf.transform.SetParent(door.transform, false);
            leftLeaf.transform.localPosition = new Vector3(-1.45f, 0, 0);
            var leftMf = leftLeaf.AddComponent<MeshFilter>();
            leftMf.sharedMesh = leafMesh;
            var leftMr = leftLeaf.AddComponent<MeshRenderer>();
            leftMr.sharedMaterial = doorStoneMat;

            // Right stone door leaf
            GameObject rightLeaf = new GameObject("SanctumDoor_Right");
            rightLeaf.transform.SetParent(door.transform, false);
            rightLeaf.transform.localPosition = new Vector3(1.45f, 0, 0);
            rightLeaf.transform.localRotation = Quaternion.Euler(0, 180, 0);
            var rightMf = rightLeaf.AddComponent<MeshFilter>();
            rightMf.sharedMesh = leafMesh;
            var rightMr = rightLeaf.AddComponent<MeshRenderer>();
            rightMr.sharedMaterial = doorStoneMat;

            // Carved stone lintel spanning the doorway
            Mesh lintelMesh = TempleMeshBuilder.GetOrCreateBeveledSlabMesh(
                "Assets/_Project/Art/Meshes/Temple/SanctumDoorLintel.asset",
                6.5f,
                0.55f,
                0.75f,
                0.08f);

            GameObject lintel = new GameObject("SanctumLintel");
            lintel.transform.SetParent(door.transform, false);
            lintel.transform.localPosition = new Vector3(0, 2.15f, 0);
            var lintelMf = lintel.AddComponent<MeshFilter>();
            lintelMf.sharedMesh = lintelMesh;
            var lintelMr = lintel.AddComponent<MeshRenderer>();
            lintelMr.sharedMaterial = doorStoneMat;

            // Flanking Torana pillars
            string columnPath = "Assets/_Project/Art/Models/Props/temple/granite_column.glb";
            GameObject columnModel = AssetDatabase.LoadAssetAtPath<GameObject>(columnPath);
            if (columnModel != null)
            {
                GameObject colWest = GameObject.Instantiate(columnModel, door.transform);
                colWest.name = "PortalColumn_West";
                colWest.transform.localPosition = new Vector3(-3.25f, -2f, 0);

                GameObject colEast = GameObject.Instantiate(columnModel, door.transform);
                colEast.name = "PortalColumn_East";
                colEast.transform.localPosition = new Vector3(3.25f, -2f, 0);
            }

            // Warm interior sanctum point light (revealed when door opens)
            GameObject sanctumLightObj = new GameObject("SanctumInnerLight");
            sanctumLightObj.transform.SetParent(door.transform, false);
            sanctumLightObj.transform.localPosition = new Vector3(0, 0.5f, -2.5f);
            Light sanctumLight = sanctumLightObj.AddComponent<Light>();
            sanctumLight.type = LightType.Point;
            sanctumLight.color = new Color(1f, 0.84f, 0.52f);
            sanctumLight.intensity = 2.5f;
            sanctumLight.range = 8f;
            sanctumLight.shadows = LightShadows.Soft;

            door.SetActive(false); // Initially hidden/sealed until puzzle is solved
            return door;
        }

        private static GameObject CreateArtifactPickup()
        {
            // Root artifact pickup GameObject: NO primitive sphere!
            GameObject artifact = new GameObject("KaveriStarSeal");
            artifact.transform.position = new Vector3(0, 1.0f, -25);

            // Trigger collider for player interaction
            SphereCollider sphereCol = artifact.AddComponent<SphereCollider>();
            sphereCol.isTrigger = true;
            sphereCol.radius = 1.25f;

            // Artifact Visual Model Container (assigned to HiddenArtifactPickup.artifactModel)
            GameObject visual = new GameObject("KaveriStarSeal_Visual");
            visual.transform.SetParent(artifact.transform, false);
            visual.transform.localPosition = new Vector3(0, 0.15f, 0);
            visual.transform.localRotation = Quaternion.Euler(25f, 0, 0); // Tilted toward player view

            // 8-Pointed Celestial Star Seal Medallion Mesh
            Mesh sealMesh = TempleMeshBuilder.GetOrCreateStarSealMesh(
                "Assets/_Project/Art/Meshes/Temple/KaveriStarSealMedallion.asset",
                8,
                0.48f,
                0.26f,
                0.12f);

            // Gilded antique bronze and polished Chola gold PBR material
            Material goldMat = WWMaterialLibrary.Lit(
                "Assets/_Project/Art/Materials/Temple/KaveriSealGold.mat",
                new Color(0.96f, 0.80f, 0.28f),
                0.85f,
                0.62f);

            var mf = visual.AddComponent<MeshFilter>();
            mf.sharedMesh = sealMesh;
            var mr = visual.AddComponent<MeshRenderer>();
            mr.sharedMaterial = goldMat;

            // Sacred golden aura point light on the artifact
            GameObject auraObj = new GameObject("SealAura");
            auraObj.transform.SetParent(visual.transform, false);
            auraObj.transform.localPosition = Vector3.zero;
            Light auraLight = auraObj.AddComponent<Light>();
            auraLight.type = LightType.Point;
            auraLight.color = new Color(1f, 0.86f, 0.45f);
            auraLight.intensity = 2.2f;
            auraLight.range = 4.5f;
            auraLight.shadows = LightShadows.None;

            // Stone Altar Pedestal beneath the seal
            GameObject altar = new GameObject("SanctumAltarPedestal");
            altar.transform.SetParent(artifact.transform, false);
            altar.transform.localPosition = new Vector3(0, -0.92f, 0);

            Mesh altarMesh = TempleMeshBuilder.GetOrCreateBeveledSlabMesh(
                "Assets/_Project/Art/Meshes/Temple/SanctumAltarPedestal.asset",
                1.4f,
                0.95f,
                1.4f,
                0.08f);

            Material altarMat = WWMaterialLibrary.Lit(
                "Assets/_Project/Art/Materials/Temple/DravidianCarvedGranite.mat",
                new Color(0.38f, 0.35f, 0.32f),
                0.06f,
                0.30f);

            var altarMf = altar.AddComponent<MeshFilter>();
            altarMf.sharedMesh = altarMesh;
            var altarMr = altar.AddComponent<MeshRenderer>();
            altarMr.sharedMaterial = altarMat;

            // Flanking sacred brass lamp on the altar
            string lampPath = "Assets/_Project/Art/Models/Props/temple/brass_lamp.glb";
            GameObject lampModel = AssetDatabase.LoadAssetAtPath<GameObject>(lampPath);
            if (lampModel != null)
            {
                GameObject altarLamp = GameObject.Instantiate(lampModel, artifact.transform);
                altarLamp.name = "AltarLamp";
                altarLamp.transform.localPosition = new Vector3(1.1f, -0.92f, 0);
                altarLamp.transform.localScale = Vector3.one * 0.75f;
                AddWarmLampLight(altarLamp, 0.8f);
            }

            // Attach HiddenArtifactPickup gameplay component
            HiddenArtifactPickup pickup = artifact.AddComponent<HiddenArtifactPickup>();
            pickup.artifactId = "kaveri_star_seal";
            pickup.displayNameEnglish = "Kaveri Star Seal";
            pickup.displayNameTamil = "காவிரி நட்சத்திர முத்திரை";
            pickup.descriptionEnglish = "An ancient stone seal bearing the constellation of the Kaveri river, said to grant wisdom to those who find it.";
            pickup.descriptionTamil = "காவிரி நதியின் நட்சத்திர வடிவம் பொறிக்கப்பட்ட பழமையான கல் முத்திரை, அதனைக் கண்டுபிடிப்பவர்க்கு ஞானம் தரும் என நம்பப்படுகிறது.";
            pickup.artifactModel = visual; // Wired to visual container so collection hides the seal cleanly

            return artifact;
        }

        private static void CreatePlayerSpawn()
        {
            GameObject spawn = new GameObject("PlayerSpawnPoint");
            spawn.transform.position = new Vector3(0, 1, 20);
            spawn.tag = "Player";
        }

        private static GameObject CreatePlayerCharacter()
        {
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
                Debug.LogWarning("[GenerateTempleScene] PlayerCharacter prefab not found, creating minimal player.");
                playerInstance = new GameObject("PlayerCharacter");
                playerInstance.tag = "Player";
                playerInstance.transform.position = new Vector3(0, 1, 20);
                playerInstance.transform.rotation = Quaternion.Euler(0, 180, 0);

                var capsule = playerInstance.AddComponent<CapsuleCollider>();
                capsule.height = 2f;
                capsule.radius = 0.5f;
                capsule.center = new Vector3(0, 1f, 0);

                var rb = playerInstance.AddComponent<Rigidbody>();
                rb.isKinematic = true;
                rb.useGravity = false;
            }

            if (playerInstance.GetComponent<PlayerMovement>() == null)
            {
                playerInstance.AddComponent<PlayerMovement>();
            }

            if (playerInstance.GetComponent<PlayerInputHandler>() == null)
            {
                playerInstance.AddComponent<PlayerInputHandler>();
            }

            if (playerInstance.GetComponent<PlayerInteractor>() == null)
            {
                playerInstance.AddComponent<PlayerInteractor>();
            }

            return playerInstance;
        }

        private static void CreateGameplayBootstrap()
        {
            GameObject bootstrapObj = new GameObject("GameplayRegionBootstrap");
            GameplayRegionBootstrap bootstrap = bootstrapObj.AddComponent<GameplayRegionBootstrap>();

            FieldInfo regionIdField = typeof(GameplayRegionBootstrap).GetField("regionId", BindingFlags.Instance | BindingFlags.NonPublic);
            if (regionIdField != null)
            {
                regionIdField.SetValue(bootstrap, "thanjavur");
            }
            Debug.Log("[GenerateTempleScene] GameplayRegionBootstrap added with regionId=thanjavur.");
        }

        private static void CreateMainCamera(GameObject playerTarget)
        {
            GameObject cameraObj = new GameObject("Main Camera");
            cameraObj.tag = "MainCamera";
            cameraObj.transform.position = new Vector3(0, 3, 25);
            cameraObj.transform.rotation = Quaternion.Euler(10, 180, 0);

            Camera cam = cameraObj.AddComponent<Camera>();
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 1000f;
            cam.fieldOfView = 60f;

            cameraObj.AddComponent<AudioListener>();

            CameraController camCtrl = cameraObj.AddComponent<CameraController>();
            if (playerTarget != null)
            {
                camCtrl.SetTarget(playerTarget.transform);
            }

            FieldInfo offsetField = typeof(CameraController).GetField("targetOffset", BindingFlags.Instance | BindingFlags.NonPublic);
            if (offsetField != null)
            {
                offsetField.SetValue(camCtrl, new Vector3(0.35f, 1.4f, 0f));
            }

            FieldInfo smoothingField = typeof(CameraController).GetField("cameraSmoothing", BindingFlags.Instance | BindingFlags.NonPublic);
            if (smoothingField != null)
            {
                smoothingField.SetValue(camCtrl, 15f);
            }

            Debug.Log("[GenerateTempleScene] Main Camera created with CameraController.");
        }

        private static void AddWarmLampLight(GameObject parent, float height)
        {
            GameObject lightObj = new GameObject("LampLight");
            lightObj.transform.SetParent(parent.transform, false);
            lightObj.transform.localPosition = new Vector3(0, height, 0);

            Light pLight = lightObj.AddComponent<Light>();
            pLight.type = LightType.Point;
            pLight.color = new Color(1f, 0.78f, 0.45f);
            pLight.intensity = 1.6f;
            pLight.range = 5f;
            pLight.shadows = LightShadows.None;
        }

        private static void WireAudioClips(AncientTempleLevelController levelCtrl, TempleFolklorePuzzleController puzzleCtrl)
        {
            string ambiencePath = "Assets/_Project/Audio/Ambience/temple_ambience.wav";
            string stoneClickPath = "Assets/_Project/Audio/Interactions/stone_click.wav";
            string successPath = "Assets/_Project/Audio/Interactions/puzzle_success.wav";
            string wrongAnswerPath = "Assets/_Project/Audio/Interactions/wrong_answer.wav";
            string doorOpenPath = "Assets/_Project/Audio/Interactions/door_open.wav";

            AudioClip ambience = AssetDatabase.LoadAssetAtPath<AudioClip>(ambiencePath);
            AudioClip stoneClick = AssetDatabase.LoadAssetAtPath<AudioClip>(stoneClickPath);
            AudioClip success = AssetDatabase.LoadAssetAtPath<AudioClip>(successPath);
            AudioClip wrongAnswer = AssetDatabase.LoadAssetAtPath<AudioClip>(wrongAnswerPath);
            AudioClip doorOpen = AssetDatabase.LoadAssetAtPath<AudioClip>(doorOpenPath);

            if (ambience != null) levelCtrl.templeAmbienceClip = ambience;
            if (stoneClick != null) puzzleCtrl.stoneClickSound = stoneClick;
            if (success != null) puzzleCtrl.puzzleSuccessSound = success;
            if (wrongAnswer != null) puzzleCtrl.wrongAnswerSound = wrongAnswer;
            if (doorOpen != null) puzzleCtrl.doorOpenSound = doorOpen;

            Debug.Log("[GenerateTempleScene] Audio clips wired successfully.");
        }

        private static void AddOrUpdateSceneInBuildSettings(string scenePath)
        {
            EditorBuildSettingsScene[] scenes = EditorBuildSettings.scenes;

            for (int i = 0; i < scenes.Length; i++)
            {
                if (scenes[i].path == scenePath)
                {
                    scenes[i].enabled = true;
                    EditorBuildSettings.scenes = scenes;
                    Debug.Log($"[GenerateTempleScene] Updated existing build settings entry for {scenePath}");
                    return;
                }
            }

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
