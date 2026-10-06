using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Inventory;
using WhisperingWilds.NPC;
using WhisperingWilds.Player;
using WhisperingWilds.Quests;
using WhisperingWilds.UI;
using WhisperingWilds.Wildlife;
using WhisperingWilds.World;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Generates 05_Chettinad_Mansion.
    ///
    /// This lives outside <see cref="AssembleAllRegions"/> because Chettinad is the first region
    /// whose layout is authored rather than decorative. The other region builders place a floor, a
    /// facade, some props, and an NPC, which is the right amount of geometry for a walking-around
    /// region. Chettinad instead has to express a strict eleven-beat investigation: the player must
    /// be able to reach the courtyard before the family room, the family room only after the key,
    /// the medallion lock only after all three clues, and the back lane only through the hidden
    /// room the lock opens. That ordering is a property of the geometry, so it belongs in geometry
    /// rather than in the quest table.
    ///
    /// The authored mesh assets are used for the facade and the courtyard floor, but every
    /// walkable surface, wall, and doorway is a primitive with a deliberate collider. Authored
    /// architectural assets are decorative shells whose collision is stripped, because a shell's
    /// colliders would seal the doorways the flow depends on and would make the region's layout
    /// something nobody can read in the editor.
    ///
    /// Coordinates are absolute and spelled out rather than accumulated, so a wall can be edited by
    /// reading its own box instead of by re-deriving it from every box before it. The layout, in
    /// metres:
    ///
    ///   z 34..24  street lane and the arrival trigger
    ///   z  4..22  mansion block, x -11..11
    ///     z  4..13  courtyard, x -7..7, colonnade on its north edge
    ///     z 13..22  main hall, x -7..7
    ///     z  8..16  side room west, x -11..-7; family room east, x 7..11
    ///   x 11.4..16  hidden room, z 8..16, sealed by the wall the medallion lock opens
    ///   z -1..8     passage, x 13..16
    ///   z -7..-1    back lane, x -13..17
    /// </summary>
    public static class BuildChettinadMansion
    {
        private const string ScenePath = "Assets/_Project/Scenes/05_Chettinad_Mansion.unity";

        // Mansion footprint.
        private const float MansionMinX = -11f;
        private const float MansionMaxX = 11f;
        private const float MansionMinZ = 4f;
        private const float MansionMaxZ = 22f;
        private const float WallHeight = 4.4f;
        private const float WallThickness = 0.4f;

        // Courtyard, colonnade, and main hall.
        private const float CourtyardMinX = -7f;
        private const float CourtyardMaxX = 7f;
        private const float CourtyardMinZ = 4f;
        private const float CourtyardMaxZ = 13f;

        // Side rooms.
        private const float SideRoomMinX = -11f;
        private const float SideRoomMaxX = -7f;
        private const float FamilyRoomMinX = 7f;
        private const float FamilyRoomMaxX = 11f;
        private const float RoomMinZ = 8f;
        private const float RoomMaxZ = 16f;

        // Hidden room and the passage to the back lane.
        private const float HiddenRoomMinX = 11.4f;
        private const float HiddenRoomMaxX = 16f;
        private const float PassageMinX = 13f;
        private const float PassageMaxX = 16f;
        private const float BackLaneMinZ = -7f;
        private const float BackLaneMaxZ = -1f;

        // The player arrives on the street and must walk through the gate into the courtyard.
        private static readonly Vector3 PlayerSpawn = new Vector3(-5f, 0.3f, 27f);
        private static readonly Vector3 DoorwayCentre = new Vector3(0f, 0f, 4f);

        [MenuItem("Tools/Whispering Wilds/Build Chettinad Mansion Scene")]
        public static void BuildChettinadMansionScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            AssembleAllRegions.SetupSun(new Color(1f, 0.95f, 0.85f), 1.15f, Quaternion.Euler(50f, -20f, 0f));

            GameObject managers = AssembleAllRegions.SetupCommonManagers(
                ChettinadMansionContent.RegionId,
                "Chettinad Heritage Mansions",
                "செட்டிநாடு பாரம்பரிய மாளிகை");

            AddRegionManagers(managers);

            AssembleAllRegions.SetupPlayerAndCamera(PlayerSpawn);
            CreateSpawnMarker();

            GameObject hud = AssembleAllRegions.SetupHUD("Chettinad Kanadukathan", "செட்டிநாடு கானாடுகாத்தான்");
            AddJournal(hud);

            var envRoot = new GameObject("--- CHETTINAD_ENVIRONMENT ---");
            var lightsRoot = new GameObject("--- CHETTINAD_LIGHTING ---");

            BuildGround(envRoot.transform);
            BuildStreet(envRoot.transform);
            BuildNeighbours(envRoot.transform);
            BuildMansionShell(envRoot.transform);
            BuildCourtyard(envRoot.transform);
            BuildMainHall(envRoot.transform);
            BuildSideRoom(envRoot.transform);
            GameObject familyRoom = BuildFamilyRoom(envRoot.transform);
            GameObject hiddenWall = BuildHiddenRoom(envRoot.transform);
            BuildBackLane(envRoot.transform);
            BuildMedallionPuzzle(familyRoom.transform, hiddenWall);
            BuildChettinadContent(envRoot.transform);
            BuildLighting(lightsRoot.transform);

            // The mansion lane is a residential edge, not open habitat. UrbanVillageBorder is the zone type
            // that keeps the wildlife spawner from putting animals on the player's street.
            AssembleAllRegions.SetupWildlifeHabitat(envRoot.transform, ChettinadMansionContent.RegionId, HabitatType.UrbanVillageBorder);

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, ScenePath);

            Debug.Log(
                "<color=#00FF88><b>[BuildChettinadMansion]</b></color> Saved: " + ScenePath +
                "\n  Spawn: " + PlayerSpawn +
                "\n  Arrival triggers: chettinad arrival, mansion entrance, hidden room, back lane" +
                "\n  Medallion lock on: " + familyRoom.name +
                "\n  Revealed wall on: " + hiddenWall.name +
                "\n  Solution: 3 / 5 / 8 (sun, serpent, wheel)");
        }

        // ---- Managers --------------------------------------------------------

        /// <summary>
        /// Bakes this region's NavMesh.
        ///
        /// Kept as its own action rather than folded into the scene build because the baker opens
        /// the scene from disk, so it has to run after the scene is saved. Velu carries a real
        /// NavMeshAgent, and an unbaked scene leaves that agent standing nowhere valid.
        /// </summary>
        [MenuItem("Tools/Whispering Wilds/Bake Chettinad NavMesh")]
        public static void BakeChettinadNavMesh()
        {
            if (!EcologyNavMeshBaker.BakeScene(ScenePath))
            {
                Debug.LogError("[BuildChettinadMansion] NavMesh bake failed; Velu will not be able to path.");
            }
        }

        /// <summary>
        /// Adds the managers the shared setup does not know about, because they are specific to a
        /// gated region rather than to every region.
        /// </summary>
        private static void AddRegionManagers(GameObject managers)
        {
            if (managers.GetComponent<RegionUnlockManager>() == null)
            {
                managers.AddComponent<RegionUnlockManager>();
            }

            var bootstrapObj = new GameObject("--- REGION BOOTSTRAP ---");
            var bootstrap = bootstrapObj.AddComponent<GameplayRegionBootstrap>();
            var so = new SerializedObject(bootstrap);
            so.FindProperty("regionId").stringValue = ChettinadMansionContent.RegionId;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateSpawnMarker()
        {
            // RegionalSceneManager finds this by name. It has no component on purpose: the manager
            // treats a marker as a position, not as an object with behaviour. SetupPlayerAndCamera
            // already created one at PlayerSpawn, so this is only a safety net for older scenes.
            if (GameObject.Find("SpawnPoint") == null && GameObject.Find("PlayerSpawn") == null)
            {
                var marker = new GameObject("SpawnPoint");
                marker.transform.position = new Vector3(PlayerSpawn.x, 0f, PlayerSpawn.z);
            }
        }

        private static void AddJournal(GameObject hudCanvas)
        {
            if (hudCanvas.GetComponent<GameplayJournalUI>() == null)
            {
                hudCanvas.AddComponent<GameplayJournalUI>();
            }
        }

        // ---- Ground, street, neighbours --------------------------------------

        private static void BuildGround(Transform parent)
        {
            var ground = CreateBox("Chettinad_Dry_Earth", parent, new Vector3(0f, -0.15f, 10f), new Vector3(90f, 0.3f, 90f),
                new Color(0.66f, 0.47f, 0.33f));
            // The district is flat and walkable, so the ground is a single surface rather than a
            // terrain that would need a bake before the player could spawn on it.
            MarkBaked(ground);
        }

        private static void BuildStreet(Transform parent)
        {
            CreateBox("Street_Lane", parent, new Vector3(0f, 0.01f, 29f), new Vector3(80f, 0.04f, 10f),
                new Color(0.58f, 0.52f, 0.44f));

            CreateArrivalTrigger(
                ChettinadMansionContent.LocationChettinadArrival,
                "Arrival_Chettinad_Street",
                parent,
                new Vector3(PlayerSpawn.x, 2.5f, PlayerSpawn.z),
                new Vector3(14f, 5f, 14f));
        }

        private static void BuildNeighbours(Transform parent)
        {
            // Neighbouring mansions set the street as a residential lane rather than an empty plane,
            // and they also stop the player seeing an unbounded horizon from the spawn point.
            var neighbourColours = new[]
            {
                new Color(0.72f, 0.60f, 0.48f),
                new Color(0.66f, 0.56f, 0.47f),
                new Color(0.74f, 0.62f, 0.50f),
                new Color(0.64f, 0.55f, 0.46f)
            };

            var spots = new[]
            {
                new Vector3(-14f, 0f, 32f),
                new Vector3(-25f, 0f, 33f),
                new Vector3(14f, 0f, 32f),
                new Vector3(25f, 0f, 33f)
            };

            var root = new GameObject("Neighbour_Mansions");
            root.transform.SetParent(parent, false);

            for (int i = 0; i < spots.Length; i++)
            {
                var house = new GameObject($"Neighbour_Mansion_{i + 1:00}");
                house.transform.SetParent(root.transform, false);
                house.transform.localPosition = spots[i];

                CreateBox("Body", house.transform, new Vector3(0f, 2.4f, 0f), new Vector3(9f, 4.8f, 7f), neighbourColours[i]);
                CreateBox("Parapet", house.transform, new Vector3(0f, 5.1f, 0f), new Vector3(9.4f, 0.6f, 7.4f), new Color(0.55f, 0.40f, 0.33f));
                CreateBox("Portch", house.transform, new Vector3(0f, 0.15f, -4.2f), new Vector3(7f, 0.3f, 1.6f), new Color(0.70f, 0.58f, 0.46f));

                for (int c = 0; c < 3; c++)
                {
                    InstantiateDecorative(
                        "Assets/_Project/Art/Models/Architecture/chettinad/wooden_column.glb",
                        house.transform,
                        new Vector3(-2f + c * 2f, 0f, -4.8f),
                        Quaternion.identity,
                        Vector3.one);
                }
            }

            // Street furniture, so the lane reads as a place people walk rather than a corridor.
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb", parent, new Vector3(6.5f, 0f, 24.5f), Quaternion.identity, Vector3.one * 1.2f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/clay_pot.glb", parent, new Vector3(-9f, 0f, 24.8f), Quaternion.identity, Vector3.one * 1.1f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/ammi_kallu.glb", parent, new Vector3(10f, 0f, 24.5f), Quaternion.identity, Vector3.one * 1.4f);
        }

        // ---- Mansion shell --------------------------------------------------

        private static void BuildMansionShell(Transform parent)
        {
            var root = new GameObject("Mansion_Shell");
            root.transform.SetParent(parent, false);

            // Authored facade, used as a visual shell only.
            InstantiateDecorative(
                "Assets/_Project/Art/Models/Architecture/chettinad/courtyard_mansion.glb",
                root.transform,
                new Vector3(0f, 0f, 13f),
                Quaternion.identity,
                Vector3.one);

            InstantiateDecorative(
                "Assets/_Project/Art/Models/Architecture/chettinad/carved_door.glb",
                root.transform,
                new Vector3(DoorwayCentre.x, 0f, DoorwayCentre.z - 0.3f),
                Quaternion.identity,
                Vector3.one);

            // South boundary wall with the gate gap the player walks through.
            CreateWallX("SouthWall_West", root.transform, -6.35f, 4f, 9.3f);
            CreateWallX("SouthWall_East", root.transform, 6.35f, 4f, 9.3f);

            // The gap between x 11 and 16 would otherwise let the player walk from the street
            // straight into the back lane and skip the entire mansion.
            CreateWallX("SouthWall_HiddenWing", root.transform, 14f, 4f, 6f);

            // Outer walls.
            CreateWallZ("OuterWall_West", root.transform, MansionMinX, 13f, 18f);
            CreateWallZ("OuterWall_East", root.transform, MansionMaxX, 13f, 9f); // z 8..16 only; the hidden wing replaces it beyond

            // The entry porch, and the arrival trigger that satisfies "enter the mansion".
            CreateBox("Entry_Porch_Floor", root.transform, new Vector3(0f, 0.02f, 2f), new Vector3(7f, 0.1f, 4.2f),
                new Color(0.62f, 0.45f, 0.33f));
            CreateArrivalTrigger(
                ChettinadMansionContent.LocationMansionEntrance,
                "Arrival_Mansion_Entrance",
                root.transform,
                new Vector3(0f, 1.5f, 2f),
                new Vector3(4.2f, 3f, 3.8f));

            // Courtyard/hall dividing walls, split at the doorway the player uses.
            CreateWallZ("CourtyardWall_West_South", root.transform, CourtyardMinX, 7.5f, 7f);
            CreateWallZ("CourtyardWall_West_North", root.transform, CourtyardMinX, 17.5f, 9f);
            CreateWallZ("CourtyardWall_East_South", root.transform, CourtyardMaxX, 7.5f, 7f);
            CreateWallZ("CourtyardWall_East_North", root.transform, CourtyardMaxX, 17.5f, 9f);

            // Main hall north wall.
            CreateWallX("MainHall_NorthWall", root.transform, 0f, MansionMaxZ, 14f);
        }

        // ---- Courtyard -------------------------------------------------------

        private static void BuildCourtyard(Transform parent)
        {
            var root = new GameObject("Courtyard");
            root.transform.SetParent(parent, false);

            var tileFloor = CreateBox(
                "Athangudi_Tile_Floor",
                root.transform,
                new Vector3(0f, 0.02f, 8.5f),
                new Vector3(14f, 0.06f, 9f),
                new Color(0.60f, 0.24f, 0.20f));

            // The authored tile set is a visual detail laid over the collidable floor so the
            // courtyard reads as Athangudi tilework rather than a painted plane.
            InstantiateDecorative(
                "Assets/_Project/Art/Models/Architecture/chettinad/athangudi_floor.glb",
                tileFloor.transform,
                new Vector3(0f, 0.03f, 0f),
                Quaternion.identity,
                Vector3.one);

            // Colonnade along the courtyard's north edge, dividing it from the main hall.
            var colonnade = new GameObject("Colonnade");
            colonnade.transform.SetParent(root.transform, false);

            for (int i = 0; i < 7; i++)
            {
                float x = -6f + i * 2f;
                InstantiateDecorative(
                    "Assets/_Project/Art/Models/Architecture/chettinad/wooden_column.glb",
                    colonnade.transform,
                    new Vector3(x, 0f, CourtyardMaxZ),
                    Quaternion.identity,
                    Vector3.one);

                // Structural columns for the ones the player can walk between, so the colonnade
                // reads as a wall with openings rather than a row of floating props.
                CreateBox($"Column_{i:00}", colonnade.transform, new Vector3(x, 2f, CourtyardMaxZ), new Vector3(0.34f, 4f, 0.34f),
                    new Color(0.48f, 0.33f, 0.24f));
            }

            CreateBox("Colonnade_Lintel", colonnade.transform, new Vector3(0f, 3.7f, CourtyardMaxZ), new Vector3(14f, 0.5f, 0.5f),
                new Color(0.48f, 0.33f, 0.24f));

            // Dry well, west side. The wheel medallion sits on its lintel, which is where the clue
            // says to look.
            var well = new GameObject("Dry_Well");
            well.transform.SetParent(root.transform, false);
            CreateCylinder("Dry_Well_Shaft", well.transform, new Vector3(-5f, 0.35f, 6f), 0.9f, 0.7f, new Color(0.58f, 0.50f, 0.40f));
            CreateCylinder("Dry_Well_Lintel", well.transform, new Vector3(-5f, 1.7f, 6f), 1.0f, 0.3f, new Color(0.55f, 0.47f, 0.38f));

            // East rain gutter, carrying the serpent medallion.
            var gutter = new GameObject("East_Rain_Gutter");
            gutter.transform.SetParent(root.transform, false);
            CreateBox("Gutter", gutter.transform, new Vector3(6.7f, 3.1f, 9f), new Vector3(0.3f, 0.3f, 7f),
                new Color(0.34f, 0.30f, 0.26f));
            CreateBox("Gutter_Bracket_S", gutter.transform, new Vector3(6.55f, 3.1f, 5.8f), new Vector3(0.3f, 0.3f, 0.3f),
                new Color(0.34f, 0.30f, 0.26f));
            CreateBox("Gutter_Bracket_N", gutter.transform, new Vector3(6.55f, 3.1f, 12.2f), new Vector3(0.3f, 0.3f, 0.3f),
                new Color(0.34f, 0.30f, 0.26f));

            // The courtyard desk, where the player records what they found.
            CreateInteractableBox(
                "Courtyard_Desk",
                root.transform,
                new Vector3(4.5f, 0.45f, 5.6f),
                new Vector3(1.8f, 0.9f, 0.8f),
                new Color(0.42f, 0.28f, 0.20f),
                QuestObjectiveType.InvestigateObject,
                ChettinadMansionContent.ObjectMansionCourtyardDesk,
                "chettinad.inspect.desk",
                acknowledgeAsImportant: true);

            // Courtyard dressing.
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/ammi_kallu.glb", root.transform, new Vector3(-2.4f, 0f, 5.2f), Quaternion.identity, Vector3.one * 1.5f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/ural_ulakkai.glb", root.transform, new Vector3(-3.6f, 0f, 4.6f), Quaternion.identity, Vector3.one * 1.3f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/korai_mat.glb", root.transform, new Vector3(2.2f, 0.05f, 11.5f), Quaternion.identity, Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/coffee_dabarah.glb", root.transform, new Vector3(-1.4f, 0f, 11.8f), Quaternion.identity, Vector3.one);
        }

        // ---- Main hall -------------------------------------------------------

        private static void BuildMainHall(Transform parent)
        {
            var root = new GameObject("Main_Hall");
            root.transform.SetParent(parent, false);

            CreateBox("MainHall_Floor", root.transform, new Vector3(0f, 0.02f, 17.5f), new Vector3(14f, 0.06f, 9f),
                new Color(0.55f, 0.38f, 0.26f));
            CreateBox("MainHall_Roof", root.transform, new Vector3(0f, 4.6f, 17.5f), new Vector3(14.8f, 0.3f, 9.6f),
                new Color(0.40f, 0.28f, 0.22f));

            // Brass lamp stand. Interacting with the hall is the quest's first in-person beat, so it
            // is a distinct object rather than the room itself, which has no collider to focus.
            CreateInteractableBox(
                "MainHall_Brass_Lamp",
                root.transform,
                new Vector3(0f, 0.8f, 18.5f),
                new Vector3(0.4f, 1.6f, 0.4f),
                new Color(0.68f, 0.52f, 0.24f),
                QuestObjectiveType.InvestigateObject,
                ChettinadMansionContent.ObjectMansionMainHall,
                "chettinad.inspect.hall",
                acknowledgeAsImportant: true);

            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb", root.transform, new Vector3(0f, 0f, 18.5f), Quaternion.identity, Vector3.one * 1.3f);

            // Dust-ring shelf: the clue that opens the first objective.
            CreateBox("Hall_Shelf", root.transform, new Vector3(-4f, 0.6f, 20.6f), new Vector3(2.4f, 1.2f, 0.5f),
                new Color(0.44f, 0.30f, 0.21f));
            CreateInteractableBox(
                "Hall_Shelf_Clue",
                root.transform,
                new Vector3(-4f, 0.7f, 20.1f),
                new Vector3(2.2f, 1.1f, 0.3f),
                new Color(0.56f, 0.42f, 0.30f),
                QuestObjectiveType.DiscoverClue,
                ChettinadMansionContent.ClueDustRing,
                "chettinad.inspect.shelf",
                revealClueId: ChettinadMansionContent.ClueDustRing,
                acknowledgeAsImportant: true);

            // Framed studio photograph.
            CreateInteractableBox(
                "Hall_Framed_Photograph",
                root.transform,
                new Vector3(4f, 1.5f, 20.5f),
                new Vector3(0.9f, 0.7f, 0.12f),
                new Color(0.50f, 0.40f, 0.30f),
                QuestObjectiveType.CollectItem,
                ChettinadMansionContent.ItemStudioPhotograph,
                "chettinad.inspect.photo",
                grantItemId: ChettinadMansionContent.ItemStudioPhotograph,
                acknowledgeAsImportant: true);

            // A dark backing plate behind the frame, so the photograph reads as mounted rather than floating.
            CreateBox("Hall_Photo_Frame_Backing", root.transform, new Vector3(4f, 1.5f, 20.44f), new Vector3(1.06f, 0.86f, 0.06f),
                new Color(0.26f, 0.18f, 0.13f));

            // A second lamp and a chest of drawers, so the hall has depth to walk into.
            CreateBox("Hall_Lamp_Stand", root.transform, new Vector3(-6f, 0.8f, 14.5f), new Vector3(0.4f, 1.6f, 0.4f),
                new Color(0.68f, 0.52f, 0.24f));
            CreateBox("Hall_Drawer_Chest", root.transform, new Vector3(5.4f, 0.5f, 14.8f), new Vector3(1.6f, 1f, 0.7f),
                new Color(0.44f, 0.30f, 0.21f));
        }

        // ---- Side room -------------------------------------------------------

        private static void BuildSideRoom(Transform parent)
        {
            var root = new GameObject("Side_Room");
            root.transform.SetParent(parent, false);

            CreateBox("SideRoom_Floor", root.transform, new Vector3(-9f, 0.02f, 12f), new Vector3(4f, 0.06f, 8f),
                new Color(0.52f, 0.36f, 0.25f));
            CreateBox("SideRoom_NorthWall", root.transform, new Vector3(-9f, WallHeight * 0.5f, RoomMaxZ), new Vector3(4f, WallHeight, WallThickness),
                new Color(0.70f, 0.58f, 0.45f));
            CreateBox("SideRoom_SouthWall", root.transform, new Vector3(-9f, WallHeight * 0.5f, RoomMinZ), new Vector3(4f, WallHeight, WallThickness),
                new Color(0.70f, 0.58f, 0.45f));
            CreateBox("SideRoom_Roof", root.transform, new Vector3(-9f, 4.6f, 12f), new Vector3(4.4f, 0.3f, 8.6f),
                new Color(0.40f, 0.28f, 0.22f));

            CreateInteractableBox(
                "SideRoom_Table",
                root.transform,
                new Vector3(-8.2f, 0.45f, 14.2f),
                new Vector3(1.2f, 0.9f, 0.6f),
                new Color(0.42f, 0.28f, 0.20f),
                QuestObjectiveType.InvestigateObject,
                ChettinadMansionContent.ObjectMansionSideRoom,
                "chettinad.inspect.side_room",
                acknowledgeAsImportant: true);

            // The chest holds the key. Reporting a CollectItem event for the key itself is honest
            // and inert: no Chettinad objective is a CollectItem, so picking it up cannot advance
            // the quest out of order.
            CreateInteractableBox(
                "SideRoom_Key_Chest",
                root.transform,
                new Vector3(-9.6f, 0.3f, 10.2f),
                new Vector3(1.2f, 0.6f, 0.8f),
                new Color(0.46f, 0.32f, 0.22f),
                QuestObjectiveType.CollectItem,
                ChettinadMansionContent.ItemOldBrassKey,
                "chettinad.inspect.chest",
                grantItemId: ChettinadMansionContent.ItemOldBrassKey,
                acknowledgeAsImportant: true);

            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/clay_pot.glb", root.transform, new Vector3(-10.2f, 0f, 15f), Quaternion.identity, Vector3.one * 1.1f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/ural_ulakkai.glb", root.transform, new Vector3(-7.8f, 0f, 9.5f), Quaternion.identity, Vector3.one);
        }

        // ---- Family room -----------------------------------------------------

        private static GameObject BuildFamilyRoom(Transform parent)
        {
            var root = new GameObject("Family_Room");
            root.transform.SetParent(parent, false);
            float centreX = (FamilyRoomMinX + FamilyRoomMaxX) * 0.5f;
            float centreZ = (RoomMinZ + RoomMaxZ) * 0.5f;

            CreateBox("FamilyRoom_Floor", root.transform, new Vector3(centreX, 0.02f, centreZ), new Vector3(4f, 0.06f, 8f),
                new Color(0.52f, 0.36f, 0.25f));
            CreateBox("FamilyRoom_NorthWall", root.transform, new Vector3(centreX, WallHeight * 0.5f, RoomMaxZ), new Vector3(4f, WallHeight, WallThickness),
                new Color(0.70f, 0.58f, 0.45f));
            CreateBox("FamilyRoom_SouthWall", root.transform, new Vector3(centreX, WallHeight * 0.5f, RoomMinZ), new Vector3(4f, WallHeight, WallThickness),
                new Color(0.70f, 0.58f, 0.45f));
            CreateBox("FamilyRoom_Roof", root.transform, new Vector3(centreX, 4.6f, centreZ), new Vector3(4.4f, 0.3f, 8.6f),
                new Color(0.40f, 0.28f, 0.22f));

            // The doorway in the courtyard's east wall. The door component is added here rather
            // than by the interactable helper because it needs a blocker collider and a separate
            // closed visual.
            BuildKeyLockedDoor(root.transform, new Vector3(CourtyardMaxX, 0f, centreZ));

            // Dial panel, freestanding against the north wall so the player can circle it.
            CreateBox("DialPanel_Backboard", root.transform, new Vector3(centreX + 0.4f, 1.2f, 13.6f), new Vector3(2.4f, 1.8f, 0.2f),
                new Color(0.40f, 0.27f, 0.19f));
            CreateBox("DialPanel_Plinth", root.transform, new Vector3(centreX + 0.4f, 0.35f, 13.3f), new Vector3(2.2f, 0.7f, 0.6f),
                new Color(0.40f, 0.27f, 0.19f));

            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb", root.transform, new Vector3(7.8f, 0f, 10f), Quaternion.identity, Vector3.one);
            CreateBox("FamilyRoom_Bench", root.transform, new Vector3(centreX, 0.25f, 9.5f), new Vector3(2.4f, 0.5f, 0.8f),
                new Color(0.44f, 0.30f, 0.21f));

            return root;
        }

        private static void BuildKeyLockedDoor(Transform parent, Vector3 position)
        {
            var door = new GameObject("FamilyRoom_Key_Door");
            door.transform.SetParent(parent, false);
            door.transform.localPosition = position;

            var leaf = CreateBox("Closed_Visual", door.transform, Vector3.zero, new Vector3(0.24f, 3.2f, 2f),
                new Color(0.38f, 0.26f, 0.19f));

            var blocker = leaf.GetComponent<BoxCollider>();
            var component = door.AddComponent<KeyLockedDoor>();

            var so = new SerializedObject(component);
            so.FindProperty("openedEventTargetId").stringValue = string.Empty;
            so.FindProperty("clueOnOpenId").stringValue = ChettinadMansionContent.ClueSealedDoor;
            so.FindProperty("requiredItemId").stringValue = ChettinadMansionContent.ItemOldBrassKey;

            var blockers = so.FindProperty("blockers");
            blockers.arraySize = 1;
            blockers.GetArrayElementAtIndex(0).objectReferenceValue = blocker;

            so.FindProperty("closedVisual").objectReferenceValue = leaf.gameObject;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        // ---- Medallion puzzle ------------------------------------------------

        /// <summary>
        /// Places the three dials and the lock that judges them.
        ///
        /// The dial order in the solution is authored data, and each dial is told its position in
        /// that order explicitly. Deriving it from sibling order in the hierarchy would make the
        /// answer depend on how the objects happen to be arranged in the editor, which is exactly
        /// the kind of hidden state a deterministic puzzle must not have.
        /// </summary>
        private static void BuildMedallionPuzzle(Transform parent, GameObject revealedArea)
        {
            float centreX = (FamilyRoomMinX + FamilyRoomMaxX) * 0.5f + 0.4f;

            var lockObj = new GameObject("Mansion_Dial_Lock");
            lockObj.transform.SetParent(parent, false);
            lockObj.transform.localPosition = new Vector3(centreX, 0f, 13.4f);

            var controller = lockObj.AddComponent<MansionPuzzleController>();

            // The dial components are created before anything references them. Reading them in the
            // other order silently writes nulls into the lock's dial array, which compiles, saves,
            // and produces a lock with no dials to turn.
            var dialObjects = new GameObject[ChettinadMansionContent.MedallionOrderSolution.Length];
            var dialComponents = new MansionDial[dialObjects.Length];

            for (int i = 0; i < dialObjects.Length; i++)
            {
                float x = centreX + (i - 1) * 0.8f;
                var dial = new GameObject($"Medallion_Dial_{i + 1:00}");
                dial.transform.SetParent(lockObj.transform, false);
                dial.transform.localPosition = new Vector3(x, 1.35f, -0.05f);

                var medallion = CreateCylinder("Medallion", dial.transform, Vector3.zero, 0.3f, 0.12f, new Color(0.72f, 0.56f, 0.26f));
                medallion.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);

                // The numeral face. Its collider is removed so the medallion below is the dial's
                // single hit volume, which keeps the interaction target unambiguous.
                var numeral = CreateBox("Numeral", dial.transform, new Vector3(0f, 0f, 0.08f), new Vector3(0.26f, 0.26f, 0.04f),
                    new Color(0.30f, 0.22f, 0.16f));
                UnityEngine.Object.DestroyImmediate(numeral.GetComponent<Collider>());

                var dialComponent = dial.AddComponent<MansionDial>();

                var dialSo = new SerializedObject(dialComponent);
                dialSo.FindProperty("controller").objectReferenceValue = controller;
                dialSo.FindProperty("dialIndex").intValue = i;
                dialSo.FindProperty("value").intValue = ChettinadMansionContent.DialMinValue;
                dialSo.ApplyModifiedPropertiesWithoutUndo();

                dialObjects[i] = dial;
                dialComponents[i] = dialComponent;
            }

            // The revealed wall arrives as a reference rather than a name lookup. GameObject.Find would
            // work here, but it searches the whole open scene by string and silently returns null
            // for an inactive object, which is exactly the kind of failure that produces a
            // generated scene that saves cleanly and is wrong in play.
            if (revealedArea == null)
            {
                Debug.LogError("[BuildChettinadMansion] HiddenRoom_Wall was not created; the medallion lock will open nothing.");
            }

            var controllerSo = new SerializedObject(controller);
            controllerSo.FindProperty("puzzleId").stringValue = ChettinadMansionContent.PuzzleMedallionOrder;
            controllerSo.FindProperty("solvedEventTargetId").stringValue = ChettinadMansionContent.ObjectMansionDialMechanism;
            controllerSo.FindProperty("discoveryOnSolvedId").stringValue = ChettinadMansionContent.DiscoveryHiddenRoom;
            controllerSo.FindProperty("wallToReveal").objectReferenceValue = revealedArea;

            var dialsProp = controllerSo.FindProperty("dials");
            dialsProp.arraySize = dialComponents.Length;
            for (int i = 0; i < dialComponents.Length; i++)
            {
                dialsProp.GetArrayElementAtIndex(i).objectReferenceValue = dialComponents[i];
            }
            controllerSo.ApplyModifiedPropertiesWithoutUndo();
        }

        // ---- Hidden room and back lane ---------------------------------------

        private static GameObject BuildHiddenRoom(Transform parent)
        {
            float centreX = (HiddenRoomMinX + HiddenRoomMaxX) * 0.5f;
            float centreZ = (RoomMinZ + RoomMaxZ) * 0.5f;

            var root = new GameObject("Hidden_Room");
            root.transform.SetParent(parent, false);

            CreateBox("HiddenRoom_Floor", root.transform, new Vector3(centreX, 0.02f, centreZ), new Vector3(4.6f, 0.06f, 8f),
                new Color(0.50f, 0.35f, 0.24f));
            CreateBox("HiddenRoom_NorthWall", root.transform, new Vector3(centreX, WallHeight * 0.5f, RoomMaxZ), new Vector3(4.6f, WallHeight, WallThickness),
                new Color(0.68f, 0.56f, 0.43f));
            CreateBox("HiddenRoom_EastWall", root.transform, new Vector3(HiddenRoomMaxX, WallHeight * 0.5f, centreZ), new Vector3(WallThickness, WallHeight, 8f),
                new Color(0.68f, 0.56f, 0.43f));

            // South wall covers only x 11.4 to 13; the rest is the passage mouth, which is how the
            // player leaves toward the back lane without walking back through the family room.
            CreateBox("HiddenRoom_SouthWall", root.transform, new Vector3(12.2f, WallHeight * 0.5f, RoomMinZ), new Vector3(1.6f, WallHeight, WallThickness),
                new Color(0.68f, 0.56f, 0.43f));

            CreateBox("HiddenRoom_Roof", root.transform, new Vector3(centreX, 4.6f, centreZ), new Vector3(5f, 0.3f, 8.6f),
                new Color(0.40f, 0.28f, 0.22f));

            // This is the object the medallion lock disables. It is a single GameObject holding all
            // three panels so the controller needs one reference, and so the whole wall comes back
            // if the puzzle state is ever rolled back.
            var wall = new GameObject("HiddenRoom_Wall");
            wall.transform.SetParent(root.transform, false);
            CreateWallZ("HiddenRoom_Wall_Panel_S", wall.transform, 11.2f, 9.5f, 3f);
            CreateWallZ("HiddenRoom_Wall_Panel_M", wall.transform, 11.2f, 12f, 2f);
            CreateWallZ("HiddenRoom_Wall_Panel_N", wall.transform, 11.2f, 14.5f, 3f);

            CreateArrivalTrigger(
                ChettinadMansionContent.LocationMansionHiddenRoom,
                "Arrival_Mansion_HiddenRoom",
                root.transform,
                new Vector3(centreX, 1.5f, centreZ),
                new Vector3(4.4f, 3f, 7.8f));

            // The writing desk. This single interaction is the major evidence beat: it reveals the
            // clue, hands over the letter, and records the discovery. Those are separate outputs of
            // one moment in fiction, which is why they share one interactable.
            CreateInteractableBox(
                "HiddenRoom_Writing_Desk",
                root.transform,
                new Vector3(14.5f, 0.45f, 12f),
                new Vector3(1.8f, 0.9f, 0.9f),
                new Color(0.40f, 0.27f, 0.19f),
                QuestObjectiveType.InvestigateObject,
                ChettinadMansionContent.ObjectMansionLetterBundle,
                "chettinad.inspect.letter",
                revealClueId: ChettinadMansionContent.ClueUnsentLetter,
                grantItemId: ChettinadMansionContent.ItemUnsentLetter,
                recordDiscoveryId: ChettinadMansionContent.DiscoveryUnsentLetter,
                acknowledgeAsImportant: true);

            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb", root.transform, new Vector3(12.4f, 0f, 15f), Quaternion.identity, Vector3.one);
            CreateBox("HiddenRoom_Chest", root.transform, new Vector3(12.6f, 0.35f, 9.5f), new Vector3(1.2f, 0.7f, 0.8f),
                new Color(0.44f, 0.30f, 0.21f));

            // Passage down to the back lane.
            var passage = new GameObject("Passage");
            passage.transform.SetParent(parent, false);
            float passageCentreX = (PassageMinX + PassageMaxX) * 0.5f;
            CreateBox("Passage_Floor", passage.transform, new Vector3(passageCentreX, 0.02f, 3.5f), new Vector3(3f, 0.06f, 9f),
                new Color(0.54f, 0.38f, 0.26f));
            CreateBox("Passage_EastWall", passage.transform, new Vector3(PassageMaxX, WallHeight * 0.5f, 3.5f), new Vector3(WallThickness, WallHeight, 9f),
                new Color(0.68f, 0.56f, 0.43f));
            CreateWallZ("Passage_WestWall", passage.transform, PassageMinX, 3.5f, 9f);

            return wall;
        }

        private static void BuildBackLane(Transform parent)
        {
            var root = new GameObject("Back_Lane");
            root.transform.SetParent(parent, false);

            CreateBox("BackLane_Floor", root.transform, new Vector3(2f, 0.02f, -4f), new Vector3(30f, 0.06f, 6f),
                new Color(0.50f, 0.40f, 0.30f));

            // Boundary at z -1, open only where the passage arrives (x 13..16).
            CreateWallX("BackLane_Boundary_West", root.transform, 0f, BackLaneMaxZ, 26f);
            CreateWallX("BackLane_Boundary_East", root.transform, 16.5f, BackLaneMaxZ, 1f);
            CreateWallZ("BackLane_EastWall", root.transform, 17f, -1f, 12f);

            CreateArrivalTrigger(
                ChettinadMansionContent.LocationChettinadBackLane,
                "Arrival_Chettinad_BackLane",
                root.transform,
                new Vector3(2f, 1.5f, -4f),
                new Vector3(28f, 3f, 5.4f));

            InstantiateDecorative("Assets/_Project/Art/Models/Props/agriculture/stone_wall.glb", root.transform, new Vector3(-6f, 0f, -6.2f), Quaternion.identity, Vector3.one * 1.3f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/clay_pot.glb", root.transform, new Vector3(-4.4f, 0f, -5.8f), Quaternion.identity, Vector3.one * 1.2f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/household/water_pot.glb", root.transform, new Vector3(-5.6f, 0f, -5.6f), Quaternion.identity, Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/ural_ulakkai.glb", root.transform, new Vector3(9f, 0f, -6f), Quaternion.identity, Vector3.one * 1.2f);

            // Perimeter, so the district ends somewhere the player can read as an edge.
            CreateWallZ("District_West", root.transform, -40f, 10f, 60f);
            CreateWallZ("District_East", root.transform, 40f, 10f, 60f);
            CreateWallX("District_North", root.transform, 0f, 44f, 80f);
            CreateWallX("District_South", root.transform, 0f, -14f, 80f);
        }

        // ---- Quest content ---------------------------------------------------

        /// <summary>
        /// Places the interactables that report quest events, and Velu.
        ///
        /// The three medallion clues are placed here rather than with the geometry because they are
        /// quest content: their positions are chosen so a player who has found one can reason about
        /// where the other two are, following the descriptions in the clue text.
        /// </summary>
        private static void BuildChettinadContent(Transform parent)
        {
            var content = new GameObject("--- CHETTINAD_CONTENT ---");
            content.transform.SetParent(parent, false);

            // Sun medallion: centred on the colonnade lintel above the courtyard's north edge,
            // which is the first thing above eye level the player faces on entering.
            CreateInteractableBox(
                "Medallion_Sun",
                content.transform,
                new Vector3(0f, 3.1f, CourtyardMaxZ + 0.32f),
                new Vector3(0.7f, 0.7f, 0.18f),
                new Color(0.80f, 0.66f, 0.30f),
                QuestObjectiveType.DiscoverClue,
                ChettinadMansionContent.ClueMarkSun,
                "chettinad.inspect.mark_sun",
                revealClueId: ChettinadMansionContent.ClueMarkSun,
                acknowledgeAsImportant: true);

            // Serpent medallion: on the east rain gutter.
            CreateInteractableBox(
                "Medallion_Serpent",
                content.transform,
                new Vector3(6.5f, 3.1f, 9f),
                new Vector3(0.18f, 0.7f, 1.4f),
                new Color(0.55f, 0.62f, 0.45f),
                QuestObjectiveType.DiscoverClue,
                ChettinadMansionContent.ClueMarkSerpent,
                "chettinad.inspect.mark_serpent",
                revealClueId: ChettinadMansionContent.ClueMarkSerpent,
                acknowledgeAsImportant: true);

            // Wheel medallion: on the dry well lintel, west side.
            CreateInteractableBox(
                "Medallion_Wheel",
                content.transform,
                new Vector3(-5f, 1.55f, 6f),
                new Vector3(0.7f, 0.7f, 0.18f),
                new Color(0.62f, 0.50f, 0.34f),
                QuestObjectiveType.DiscoverClue,
                ChettinadMansionContent.ClueMarkWheel,
                "chettinad.inspect.mark_wheel",
                revealClueId: ChettinadMansionContent.ClueMarkWheel,
                acknowledgeAsImportant: true);

            BuildVelu(content.transform);
        }

        /// <summary>
        /// Places Velu. Her name, greeting, and dialogue come from ChettinadMansionContent via
        /// GameplayRegionBootstrap, because both Chennai and Chettinad use the NPC id "velu" and a
        /// profile authored here would collide with the Chennai one.
        /// </summary>
        private static void BuildVelu(Transform parent)
        {
            var velu = InstantiateDecorative(
                "Assets/_Project/Art/Models/Characters/NPCs/velu.glb",
                parent,
                new Vector3(2.5f, 0f, 10.5f),
                Quaternion.Euler(0f, 200f, 0f),
                Vector3.one);

            if (velu == null) return;

            var npc = velu.AddComponent<NPCCharacter>();
            npc.SetCharacterProfile(
                "Velu (Housekeeper)",
                "வேலு (வீட்டுக்காரி)",
                "Chettinad",
                "செட்டிநாடு பாரம்பரிய மாளிகையில் பணியாறும் வீட்டுக்காரி வேலு.");

            // SetCharacterProfile derives npcId from the display name, which would give
            // "velu_housekeeper". The quest objective and BuildDialogueFor both key on "velu", and
            // GameplayRegionBootstrap skips any resident whose npcId it does not recognise, so the
            // id has to be pinned to the authored constant rather than left to the derivation.
            var npcSo = new SerializedObject(npc);
            npcSo.FindProperty("npcId").stringValue = ChettinadMansionContent.NpcVelu;
            npcSo.ApplyModifiedPropertiesWithoutUndo();

            // Velu needs a collider so the player can focus and talk to her.
            foreach (var col in velu.GetComponentsInChildren<Collider>())
            {
                UnityEngine.Object.DestroyImmediate(col);
            }

            var capsule = velu.AddComponent<CapsuleCollider>();
            capsule.height = 1.8f;
            capsule.radius = 0.35f;
            capsule.center = new Vector3(0f, 0.9f, 0f);
        }

        // ---- Lighting --------------------------------------------------------

        private static void BuildLighting(Transform parent)
        {
            // Warm interior lamps. Each is inside its own room so a room reads as lit when the
            // player is in it, and so the back lane is legible when it is reached from the passage.
            AddPointLight(parent, "Light_Street", new Vector3(0f, 5f, 29f), new Color(1f, 0.92f, 0.78f), 1.6f, 28f);
            AddPointLight(parent, "Light_Courtyard", new Vector3(0f, 3.8f, 8.5f), new Color(1f, 0.90f, 0.74f), 1.8f, 20f);
            AddPointLight(parent, "Light_MainHall", new Vector3(0f, 3.4f, 17.5f), new Color(1f, 0.88f, 0.70f), 2.2f, 15f);
            AddPointLight(parent, "Light_SideRoom", new Vector3(-9f, 3f, 12f), new Color(1f, 0.87f, 0.68f), 1.6f, 10f);
            AddPointLight(parent, "Light_FamilyRoom", new Vector3(9f, 3f, 12f), new Color(1f, 0.87f, 0.68f), 1.6f, 10f);
            AddPointLight(parent, "Light_HiddenRoom", new Vector3(13.7f, 3f, 12f), new Color(1f, 0.84f, 0.62f), 1.5f, 10f);
            AddPointLight(parent, "Light_Passage", new Vector3(14.5f, 3f, 3.5f), new Color(0.95f, 0.86f, 0.70f), 1.2f, 10f);
            AddPointLight(parent, "Light_BackLane", new Vector3(2f, 3f, -4f), new Color(0.95f, 0.88f, 0.76f), 1.4f, 22f);
        }

        private static void AddPointLight(Transform parent, string name, Vector3 position, Color color, float intensity, float range)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = position;

            var light = obj.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = color;
            light.intensity = intensity;
            light.range = range;
            light.shadows = LightShadows.None;
        }

        // ---- Primitives ------------------------------------------------------

        private static GameObject CreateBox(string name, Transform parent, Vector3 localPos, Vector3 localScale, Color colour)
        {
            var obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
            obj.name = name;
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = localPos;
            obj.transform.localScale = localScale;
            ApplyColour(obj, colour);
            return obj;
        }

        private static GameObject CreateCylinder(string name, Transform parent, Vector3 localPos, float radius, float height, Color colour)
        {
            var obj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            obj.name = name;
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = localPos;
            obj.transform.localScale = new Vector3(radius * 2f, height * 0.5f, radius * 2f);
            ApplyColour(obj, colour);
            return obj;
        }

        /// <summary>
        /// A wall running along x at a fixed z. Length is the x extent, so the caller states the
        /// span rather than the centre, which keeps a wall's identity readable in the hierarchy.
        /// </summary>
        private static void CreateWallX(string name, Transform parent, float centreX, float z, float length)
        {
            CreateBox(name, parent, new Vector3(centreX, WallHeight * 0.5f, z), new Vector3(length, WallHeight, WallThickness),
                new Color(0.71f, 0.59f, 0.46f));
        }

        /// <summary>
        /// A wall running along z at a fixed x. Length is the z extent.
        /// </summary>
        private static void CreateWallZ(string name, Transform parent, float x, float centreZ, float length)
        {
            CreateBox(name, parent, new Vector3(x, WallHeight * 0.5f, centreZ), new Vector3(WallThickness, WallHeight, length),
                new Color(0.71f, 0.59f, 0.46f));
        }

        /// <summary>
        /// Shares one material per surface colour across the whole mansion.
        ///
        /// Keying by colour rather than by object name is what makes the geometry batch: sixty-odd
        /// walls, floors, and dials collapse onto a handful of materials instead of one material
        /// per object, which is the entire reason WWMaterialLibrary writes assets to disk.
        /// </summary>
        private static void ApplyColour(GameObject obj, Color colour)
        {
            var renderer = obj.GetComponent<MeshRenderer>();
            if (renderer == null) return;

            int r = Mathf.RoundToInt(colour.r * 255f);
            int g = Mathf.RoundToInt(colour.g * 255f);
            int b = Mathf.RoundToInt(colour.b * 255f);

            renderer.sharedMaterial = WWMaterialLibrary.Lit(
                $"Assets/_Project/Art/Materials/Chettinad/Surface_{r:X2}{g:X2}{b:X2}.mat",
                colour);
        }

        /// <summary>
        /// An interactable box that reports one gameplay event and nothing else.
        ///
        /// The event is reported before any grant or clue, and every optional output is opt-in, so a
        /// caller can only create an interactable that advances the quest by declaring what it
        /// advances.
        /// </summary>
        private static void CreateInteractableBox(
            string name,
            Transform parent,
            Vector3 localPos,
            Vector3 localScale,
            Color colour,
            QuestObjectiveType reportType,
            string targetId,
            string promptKey,
            string revealClueId = null,
            string grantItemId = null,
            string recordDiscoveryId = null,
            bool acknowledgeAsImportant = false)
        {
            var obj = CreateBox(name, parent, localPos, localScale, colour);
            var interactable = obj.AddComponent<GameplayEventInteractable>();

            var so = new SerializedObject(interactable);
            so.FindProperty("targetId").stringValue = targetId;
            so.FindProperty("reportType").enumValueIndex = (int)reportType;
            so.FindProperty("promptKey").stringValue = promptKey;
            so.FindProperty("revealClueId").stringValue = revealClueId ?? string.Empty;
            so.FindProperty("grantItemId").stringValue = grantItemId ?? string.Empty;
            so.FindProperty("recordDiscoveryId").stringValue = recordDiscoveryId ?? string.Empty;
            so.FindProperty("acknowledgeAsImportant").boolValue = acknowledgeAsImportant;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateArrivalTrigger(string locationId, string name, Transform parent, Vector3 localPos, Vector3 localSize)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = localPos;

            var box = obj.AddComponent<BoxCollider>();
            box.isTrigger = true;
            box.size = localSize;

            var trigger = obj.AddComponent<ArrivalTrigger>();
            var so = new SerializedObject(trigger);
            so.FindProperty("locationId").stringValue = locationId;
            so.FindProperty("debugLabel").stringValue = name;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        /// <summary>
        /// Instantiates an authored model as a visual only.
        ///
        /// Authored architecture and prop meshes are not authored to collide, and their import
        /// settings are shared with other scenes. Stripping the colliders on the instance keeps this
        /// scene's collision entirely in the primitives above, so the doorway gaps cannot be sealed
        /// by an asset whose collision nobody in this scene intends.
        /// </summary>
        private static GameObject InstantiateDecorative(string assetPath, Transform parent, Vector3 localPos, Quaternion localRot, Vector3 localScale)
        {
            var obj = AssembleAllRegions.InstantiateModel(assetPath, parent, localPos, localRot, localScale);
            if (obj == null) return null;

            foreach (var col in obj.GetComponentsInChildren<Collider>())
            {
                UnityEngine.Object.DestroyImmediate(col);
            }

            return obj;
        }

        private static void MarkBaked(GameObject ground)
        {
            var flags = GameObjectUtility.GetStaticEditorFlags(ground);
            flags |= StaticEditorFlags.BatchingStatic
                     | StaticEditorFlags.OccluderStatic
                     | StaticEditorFlags.OccludeeStatic
                     | StaticEditorFlags.NavigationStatic;
            GameObjectUtility.SetStaticEditorFlags(ground, flags);
        }
    }
}
