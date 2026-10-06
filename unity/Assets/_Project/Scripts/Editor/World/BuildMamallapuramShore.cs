using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
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
    /// Generates 06_Mamallapuram_Shore.
    ///
    /// Like <see cref="BuildChettinadMansion"/>, this is authored geometry rather than a decorative
    /// arrangement, because the region has to express a route rather than a set of rooms: the player
    /// arrives at the causeway, goes inland to the carving yard, comes back down to the working
    /// shore, and finishes at the seaward end of the causeway again. That ordering is a property of
    /// where things are, so it belongs in geometry.
    ///
    /// The climb to the lookout is a stair on the inland face and a cliff on the landward end, so the
    /// only way back down is the stair the player came up. That is what makes "go back down to the
    /// seaward end of the causeway" a real return trip instead of something the player can satisfy
    /// on the way in. The stair rises 0.25 a step, which is under the player's step offset and
    /// inside a NavMesh agent's default step height, so it is walked rather than jumped.
    ///
    /// What this region does not contain is deliberate and worth stating. There is no fishing
    /// minigame, no boat the player can board, and no shop. No such system exists anywhere in the
    /// project, so building one here would mean inventing a framework rather than reusing a stable
    /// one. The boats and nets on this shore are therefore scenery and evidence: the lantern and the
    /// nets are inspectable objects, and what they tell the player is why the footprints are wet.
    ///
    /// Coordinates are absolute and spelled out, in metres. The layout:
    ///
    ///   z 20..90  the sea: a flat water plane the land ends at, no player footing
    ///   z 20..26  causeway, x -5..5, running out over the water to the seaward signal post at z 24
    ///   z 12..20  working shore, x -18..18, the boat landing and the waterline prints
    ///   z  2..12  settlement strip: carving yard west, workshop east
    ///   z -14..4  the ridge stair, x -5..5, rising 0.25 a step to the lookout
    ///   z -26..-14 lookout platform at y 5.5, reached only by that stair
    ///   z -34..-14 sand behind the ridge, walled off at z -34 and at x +/-40
    /// </summary>
    public static class BuildMamallapuramShore
    {
        private const string ScenePath = "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity";

        // Shore and settlement.
        private const float ShoreMinX = -18f;
        private const float ShoreMaxX = 18f;
        private const float ShoreMinZ = 12f;
        private const float ShoreMaxZ = 20f;

        // Causeway.
        private const float CausewayMinX = -5f;
        private const float CausewayMaxX = 5f;
        private const float CausewayMinZ = 20f;
        private const float CausewayMaxZ = 26f;

        // Settlement strip.
        private const float SettlementMinZ = 2f;
        private const float SettlementMaxZ = 12f;

        // Ridge and lookout. The ridge is a walkable stair, not a scramble: the rise per step has to
        // stay under the player's CharacterController step offset, because the player walks this
        // route and NavMesh agents path it with their own smaller step height.
        private const float RidgeFootMinZ = -14f;
        private const float RidgeFootMaxZ = 4f;
        private const float LookoutMinZ = -26f;
        private const float LookoutMaxZ = -14f;
        private const float LookoutHeight = 5.5f;
        private const float LookoutMinX = -8f;
        private const float LookoutMaxX = 8f;

        // The ridge is 10 wide to match the 10-wide gap between the two settlement back walls, which
        // are what funnel the player onto it.
        private const float RidgeMinX = -5f;
        private const float RidgeMaxX = 5f;
        private const int RidgeSteps = 22;
        private const float RidgeRisePerStep = LookoutHeight / RidgeSteps;

        private const float WallHeight = 4.4f;
        private const float WallThickness = 0.4f;

        /// <summary>
        /// The player arrives on the causeway and walks inland, so the spawn is at the landward end
        /// and faces back toward the settlement rather than out to sea.
        /// </summary>
        private static readonly Vector3 PlayerSpawn = new Vector3(0f, 0.35f, 21.5f);

        [MenuItem("Tools/Whispering Wilds/Build Mamallapuram Shore Scene")]
        public static void BuildMamallapuramShoreScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Coastal daylight: higher and cooler than the Chettinad interior sun, because this is an
            // open shore rather than a courtyard, and the whole region is read against the water.
            AssembleAllRegions.SetupSun(new Color(1f, 0.96f, 0.90f), 1.35f, Quaternion.Euler(58f, -35f, 0f));

            GameObject managers = AssembleAllRegions.SetupCommonManagers(
                MamallapuramShoreContent.RegionId,
                "Mamallapuram Shore",
                "மாமல்லபுரம் கடற்கரை");

            AddRegionManagers(managers);

            AssembleAllRegions.SetupPlayerAndCamera(PlayerSpawn);
            CreateSpawnMarker();

            GameObject hud = AssembleAllRegions.SetupHUD("Mamallapuram Shore", "மாமல்லபுரம் கடற்கரை");
            AddJournal(hud);

            var envRoot = new GameObject("--- MAMALLAPURAM_ENVIRONMENT ---");
            var lightsRoot = new GameObject("--- MAMALLAPURAM_LIGHTING ---");

            BuildGround(envRoot.transform);
            BuildSea(envRoot.transform);
            BuildCauseway(envRoot.transform);
            BuildWorkingShore(envRoot.transform);
            BuildSettlement(envRoot.transform);
            BuildRidgeAndLookout(envRoot.transform);
            BuildMamallapuramContent(envRoot.transform);
            BuildLighting(lightsRoot.transform);

            // CoastalShoreline is the habitat type whose regional whitelist admits the Bonnet macaque,
            // egret, cattle, goat, and stray dog this shore is allowed to carry, and which excludes
            // the Nilgiri tahr and gaur that belong to the deferred high-country region.
            AssembleAllRegions.SetupWildlifeHabitat(envRoot.transform, MamallapuramShoreContent.RegionId, HabitatType.CoastalShoreline);

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, ScenePath);

            Debug.Log(
                "<color=#00FF88><b>[BuildMamallapuramShore]</b></color> Saved: " + ScenePath +
                "\n  Spawn: " + PlayerSpawn +
                "\n  Arrival triggers: causeway arrival, working shore, lookout, seaward causeway" +
                "\n  Quest interactables: stone blocks, carving yard, signal post" +
                "\n  Lookout is ramp-only from the north face; seaward face is a cliff" +
                "\n  No fishing minigame, boat boarding, or shop: no such system exists in the project");
        }

        /// <summary>
        /// Bakes this region's NavMesh. Kept separate from the build because the baker opens the
        /// scene from disk, so it has to run after the scene is saved.
        /// </summary>
        [MenuItem("Tools/Whispering Wilds/Bake Mamallapuram NavMesh")]
        public static void BakeMamallapuramNavMesh()
        {
            if (!EcologyNavMeshBaker.BakeScene(ScenePath))
            {
                Debug.LogError("[BuildMamallapuramShore] NavMesh bake failed; the residents will not be able to path.");
            }
        }

        // ---- Managers --------------------------------------------------------

        private static void AddRegionManagers(GameObject managers)
        {
            // This region is gated, so the unlock manager has to be present to enforce the route
            // that opens it.
            if (managers.GetComponent<RegionUnlockManager>() == null)
            {
                managers.AddComponent<RegionUnlockManager>();
            }

            var bootstrapObj = new GameObject("--- REGION BOOTSTRAP ---");
            var bootstrap = bootstrapObj.AddComponent<GameplayRegionBootstrap>();
            var so = new SerializedObject(bootstrap);
            so.FindProperty("regionId").stringValue = MamallapuramShoreContent.RegionId;
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateSpawnMarker()
        {
            // RegionalSceneManager resolves this by name. It carries no component on purpose: the
            // manager treats a marker as a position, not as an object with behaviour.
            // SetupPlayerAndCamera already created one at PlayerSpawn, so this is only a safety
            // net for older scenes.
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

        // ---- Terrain ---------------------------------------------------------

        // The land stops at the waterline. The causeway stands on its own deck out beyond this edge,
        // which is the whole reason it reads as a made structure rather than as a path on the sand.
        private const float LandMinZ = -34f;
        private const float LandMaxZ = ShoreMaxZ;
        private const float LandHalfWidth = 40f;

        private static void BuildGround(Transform parent)
        {
            // One walkable surface from the ridge foot out to the waterline, stopping at LandMaxZ.
            // Flat, because this is a sand-and-rock shore and the region reads as a walk along a flat
            // strand; the only vertical element that matters to the quest is the ridge, which is built
            // as authored geometry. It does not extend under the water: a ground plane carried out
            // beneath the sea would be the walkable surface the player stood on instead of the water,
            // which would quietly delete the causeway and with it the arrival and the return trip.
            var ground = CreateBox("Shore_Ground", parent,
                new Vector3(0f, -0.15f, (LandMinZ + LandMaxZ) * 0.5f),
                new Vector3(LandHalfWidth * 2f, 0.3f, LandMaxZ - LandMinZ),
                new Color(0.80f, 0.73f, 0.58f));
            MarkBaked(ground);

            // The landing itself is sand; the settlement strip behind it is packed earth. Two surfaces
            // rather than one texture change, because the player crosses the join constantly.
            CreateBox("Working_Shore_Sand", parent, new Vector3(0f, 0.01f, (ShoreMinZ + ShoreMaxZ) * 0.5f),
                new Vector3(ShoreMaxX - ShoreMinX, 0.05f, ShoreMaxZ - ShoreMinZ),
                new Color(0.84f, 0.78f, 0.63f));
            CreateBox("Settlement_Earth", parent, new Vector3(0f, 0.02f, (SettlementMinZ + SettlementMaxZ) * 0.5f),
                new Vector3(ShoreMaxX - ShoreMinX, 0.06f, SettlementMaxZ - SettlementMinZ),
                new Color(0.72f, 0.62f, 0.48f));

            // The land is closed on its three landward sides so the strand is a place rather than an
            // island in a void, and so the player cannot walk off the far end of the ridge foot to
            // reach the north side of the lookout. These are deliberately left out of the NavMesh
            // bake: they are walls to the player and not ground to walk on.
            CreateBox("Land_End_Wall_South", parent,
                new Vector3(0f, 1.6f, LandMinZ - 0.5f), new Vector3(LandHalfWidth * 2f, 3.2f, 1f),
                new Color(0.58f, 0.55f, 0.51f));
            CreateBox("Land_End_Wall_West", parent,
                new Vector3(-LandHalfWidth - 0.5f, 1.6f, (LandMinZ + LandMaxZ) * 0.5f), new Vector3(1f, 3.2f, LandMaxZ - LandMinZ),
                new Color(0.58f, 0.55f, 0.51f));
            CreateBox("Land_End_Wall_East", parent,
                new Vector3(LandHalfWidth + 0.5f, 1.6f, (LandMinZ + LandMaxZ) * 0.5f), new Vector3(1f, 3.2f, LandMaxZ - LandMinZ),
                new Color(0.58f, 0.55f, 0.51f));
        }

        private static void BuildSea(Transform parent)
        {
            // Flat water, starting at the waterline and running out past the causeway to the horizon.
            // The player has no footing on it and no boat to be put in it, so it is a horizon rather
            // than a surface. It sits below the sand rather than level with it, so the shoreline is a
            // small step down rather than a seam the player can stand on the far side of.
            CreateBox("Sea", parent, new Vector3(0f, -0.6f, 55f), new Vector3(400f, 0.4f, 70f),
                new Color(0.24f, 0.42f, 0.52f));

            // The wet line the first clue is about: a band of darker, glossier sand at the tide edge,
            // wide enough that standing in it reads as "below the tide line" without being a trigger.
            CreateBox("Tide_Line", parent, new Vector3(0f, 0.06f, ShoreMaxZ - 0.8f), new Vector3(ShoreMaxX - ShoreMinX, 0.03f, 1.6f),
                new Color(0.62f, 0.58f, 0.50f));

            // Rocks along the strand to close the horizon at either end of the walk. All of these sit on
            // land, at or behind LandMaxZ, because the land now ends at the waterline rather than
            // running out under the bay.
            var rockSpots = new[]
            {
                new Vector3(-26f, 0.6f, 14f), new Vector3(-23f, 0.5f, 19f),
                new Vector3(26f, 0.6f, 14f), new Vector3(23f, 0.5f, 19f),
                new Vector3(-20f, 0.4f, 18.5f), new Vector3(20f, 0.4f, 18.5f)
            };

            var rocks = new GameObject("Shore_Rocks");
            rocks.transform.SetParent(parent, false);
            for (int i = 0; i < rockSpots.Length; i++)
            {
                CreateBox($"Shore_Rock_{i + 1:00}", rocks.transform, rockSpots[i], new Vector3(3.2f, 1.6f, 2.6f),
                    new Color(0.52f, 0.50f, 0.47f));
            }
        }

        // ---- Causeway --------------------------------------------------------

        private static void BuildCauseway(Transform parent)
        {
            var root = new GameObject("Causeway");
            root.transform.SetParent(parent, false);

            // Deck top flush with the land at y 0. It stood 0.3 proud, which is exactly the player's default
            // step offset and therefore a lip the player could catch on walking inland off the causeway.
            CreateBox("Causeway_Deck", root.transform,
                new Vector3(0f, -0.15f, (CausewayMinZ + CausewayMaxZ) * 0.5f),
                new Vector3(CausewayMaxX - CausewayMinX, 0.3f, CausewayMaxZ - CausewayMinZ),
                new Color(0.76f, 0.72f, 0.64f));

            // Piers under the deck, down past the water. The deck is a made structure standing in the
            // bay, so it needs something holding it up, and the sea is excluded from the NavMesh bake.
            for (int i = 0; i < 4; i++)
            {
                float z = CausewayMinZ + (CausewayMaxZ - CausewayMinZ) * (i + 0.5f) / 4f;
                CreateBox($"Causeway_Pier_{i + 1:00}", root.transform, new Vector3(0f, -1.4f, z),
                    new Vector3(2.2f, 2.4f, 0.7f), new Color(0.58f, 0.55f, 0.51f));
            }

            // Low kerbs. They read as a made causeway and, more usefully, they stop the player
            // walking off the side into the water without needing an invisible wall.
            CreateBox("Causeway_Kerb_West", root.transform, new Vector3(CausewayMinX + 0.2f, 0.5f, (CausewayMinZ + CausewayMaxZ) * 0.5f),
                new Vector3(0.4f, 1f, CausewayMaxZ - CausewayMinZ), new Color(0.70f, 0.66f, 0.58f));
            CreateBox("Causeway_Kerb_East", root.transform, new Vector3(CausewayMaxX - 0.2f, 0.5f, (CausewayMinZ + CausewayMaxZ) * 0.5f),
                new Vector3(0.4f, 1f, CausewayMaxZ - CausewayMinZ), new Color(0.70f, 0.66f, 0.58f));

            // Stage 0: the player has arrived. Placed on the causeway because that is where travel
            // deposits them, and the arrival objective should be satisfied by standing where they land
            // rather than by walking away from it and back.
            CreateArrivalTrigger(
                MamallapuramShoreContent.LocationShoreArrival,
                "Arrival_Mamallapuram_Causeway",
                root.transform,
                new Vector3(PlayerSpawn.x, 2.5f, PlayerSpawn.z),
                new Vector3(9f, 5f, 9f));

            // Stage 9: the seaward end. Reaching this is the return trip, and the only way to get back
            // here after the lookout is down the ramp and along the causeway again.
            CreateArrivalTrigger(
                MamallapuramShoreContent.LocationCauseway,
                "Arrival_Mamallapuram_Seaward_End",
                root.transform,
                new Vector3(0f, 2.5f, CausewayMaxZ - 1.5f),
                new Vector3(9f, 5f, 4f));

            // The signal post itself is built in BuildMamallapuramContent, as the stage 10 interactable.
            // It used to also exist here as scenery at the same position, which put two overlapping
            // boxes on one spot and made the invisible hit volume twice as deep as the visible post.

            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb", root.transform,
                new Vector3(3.4f, 0.3f, CausewayMaxZ - 1.4f), Quaternion.identity, Vector3.one * 1.1f);
        }

        // ---- Working shore ---------------------------------------------------

        private static void BuildWorkingShore(Transform parent)
        {
            var root = new GameObject("Working_Shore");
            root.transform.SetParent(parent, false);

            // Stage 2. Placed at the landing so the objective is satisfied by walking down to the
            // water, which is the beat the quest text asks for.
            CreateArrivalTrigger(
                MamallapuramShoreContent.LocationWorkingShore,
                "Arrival_Working_Shore",
                root.transform,
                new Vector3(9f, 2.5f, 18f),
                new Vector3(10f, 5f, 7f));

            // The fishing point. A dock and boats, present as scenery and as evidence: the nets and the
            // lantern are what the player inspects to learn the boats leave before dawn. There is no
            // interaction that catches a fish, because no such system exists to catch one with.
            InstantiateDecorative("Assets/_Project/Art/Models/Props/fishing/boat_dock.glb", root.transform,
                new Vector3(11f, 0f, 19.4f), Quaternion.identity, Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Vehicles/boat/fishing_boat.glb", root.transform,
                new Vector3(13.5f, -0.3f, 21.5f), Quaternion.Euler(0f, 20f, 0f), Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Vehicles/boats/mangrove_rowboat.glb", root.transform,
                new Vector3(15.5f, -0.3f, 22.5f), Quaternion.Euler(0f, 105f, 0f), Vector3.one * 0.9f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/fishing/fishing_net.glb", root.transform,
                new Vector3(9.5f, 0.1f, 18.2f), Quaternion.identity, Vector3.one * 1.2f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/fishing/fish_crate.glb", root.transform,
                new Vector3(10.6f, 0.1f, 17.6f), Quaternion.identity, Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/cast_net.glb", root.transform,
                new Vector3(12.2f, 0.1f, 18.4f), Quaternion.identity, Vector3.one);

            // The lantern hangs from a post at the head of the landing, where it could be reached in
            // the dark. It is the inspectable that explains the wet footprints.
            CreateBox("Lantern_Post", root.transform, new Vector3(8.2f, 1.3f, 17.2f),
                new Vector3(0.22f, 2.6f, 0.22f), new Color(0.55f, 0.42f, 0.30f));
            CreateBox("Lantern_Hook", root.transform, new Vector3(8.6f, 2.5f, 17.2f),
                new Vector3(1f, 0.14f, 0.14f), new Color(0.55f, 0.42f, 0.30f));

            // The lantern itself. Optional flavour rather than a stage objective: it is the physical
            // reason the boats leave before dawn, which is what Kavitha tells the player once they
            // have seen the wet prints, but the quest is completable without ever taking it.
            CreateInteractableBox(
                "Investigate_Fisher_Lantern",
                root.transform,
                new Vector3(9.1f, 2.2f, 17.2f),
                new Vector3(0.5f, 0.5f, 0.5f),
                new Color(0.86f, 0.78f, 0.52f),
                QuestObjectiveType.InvestigateObject,
                "object_mamallapuram_fisher_lantern",
                "mamallapuram.inspect.fisher_lantern",
                "Take the fisher's lantern",
                "மீனவரின் விளக்கை எடுங்கள்",
                grantItemId: MamallapuramShoreContent.ItemFisherLantern);
        }

        // ---- Settlement ------------------------------------------------------

        private static void BuildSettlement(Transform parent)
        {
            var root = new GameObject("Settlement");
            root.transform.SetParent(parent, false);

            // Authored architecture, decorative only.
            InstantiateDecorative("Assets/_Project/Art/Models/Architecture/mamallapuram/heritage_structure.glb", root.transform,
                new Vector3(-13f, 0f, 7f), Quaternion.Euler(0f, 90f, 0f), Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Architecture/mamallapuram/stone_workshop.glb", root.transform,
                new Vector3(12.5f, 0f, 8f), Quaternion.Euler(0f, -90f, 0f), Vector3.one);

            // The carving yard: a working floor with the half-cut blocks on it. The blocks are the
            // stage 3 investigation, and they sit between the yard and the shore so the player passes
            // them on the way down.
            var yard = new GameObject("Carving_Yard");
            yard.transform.SetParent(root.transform, false);
            yard.transform.localPosition = new Vector3(-11f, 0f, 6.5f);

            CreateBox("Yard_Floor", yard.transform, new Vector3(0f, 0.06f, 0f), new Vector3(11f, 0.1f, 9f),
                new Color(0.74f, 0.70f, 0.63f));

            var blockSpots = new[]
            {
                new Vector3(-3.6f, 0.7f, -2.4f),
                new Vector3(-1.2f, 0.6f, -2.9f),
                new Vector3(1.4f, 0.75f, -2.2f),
                new Vector3(3.8f, 0.55f, -3.1f)
            };
            for (int i = 0; i < blockSpots.Length; i++)
            {
                CreateBox($"Granite_Block_{i + 1:00}", yard.transform, blockSpots[i],
                    new Vector3(1.9f, 1.3f, 1.4f), new Color(0.55f, 0.53f, 0.50f));
            }

            // Workshop east, with its working benches and a low wall behind it.
            var workshop = new GameObject("Stone_Workshop");
            workshop.transform.SetParent(root.transform, false);
            workshop.transform.localPosition = new Vector3(12.5f, 0f, 8f);

            CreateBox("Workshop_Bench", workshop.transform, new Vector3(0f, 0.55f, 0f), new Vector3(6f, 1.1f, 1.2f),
                new Color(0.60f, 0.48f, 0.36f));
            CreateBox("Workshop_BackWall", workshop.transform, new Vector3(0f, 2.2f, -3.4f), new Vector3(7f, 4.4f, 0.4f),
                new Color(0.71f, 0.59f, 0.46f));
            CreateBox("Workshop_Porch", workshop.transform, new Vector3(0f, 0.08f, 2.6f), new Vector3(5f, 0.14f, 2f),
                new Color(0.70f, 0.64f, 0.55f));

            InstantiateDecorative("Assets/_Project/Art/Models/Props/temple/granite_column.glb", root.transform,
                new Vector3(-6f, 0f, 10.5f), Quaternion.identity, Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/temple/temple_bell.glb", root.transform,
                new Vector3(6.5f, 0f, 10.5f), Quaternion.identity, Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/clay_pot.glb", root.transform,
                new Vector3(-16f, 0f, 10.8f), Quaternion.identity, Vector3.one * 1.1f);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/cultural/ammi_kallu.glb", root.transform,
                new Vector3(16f, 0f, 10.8f), Quaternion.identity, Vector3.one * 1.3f);

            // A low wall closing the strip behind the settlement, so the ridge reads as the boundary
            // of the inhabited area rather than as somewhere the player was never meant to go.
            CreateWallX("Settlement_BackWall_West", root.transform, -12f, SettlementMinZ - 0.4f, 14f);
            CreateWallX("Settlement_BackWall_East", root.transform, 12f, SettlementMinZ - 0.4f, 14f);
        }

        // ---- Ridge and lookout ----------------------------------------------

        private static void BuildRidgeAndLookout(Transform parent)
        {
            var root = new GameObject("Ridge_And_Lookout");
            root.transform.SetParent(parent, false);

            // Ridge face, rising from the settlement side toward the sea. Built as a stack of stepped
            // boxes rather than a single ramp, so the climb reads as a granite stair cut into the
            // rock and so the NavMesh has distinct landings instead of one steep continuous slope.
            //
            // Each box's top is one rise above the one below it, and the boxes are stacked from the
            // ground rather than floating, so the stair is solid. RidgeRisePerStep is 0.25: below
            // the player's 0.3 step offset, and well inside a NavMesh agent's default 0.4, so both
            // the player and the residents can walk the whole climb without jumping.
            float stepDepth = (RidgeFootMaxZ - RidgeFootMinZ) / RidgeSteps;
            for (int i = 0; i < RidgeSteps; i++)
            {
                float top = RidgeRisePerStep * (i + 1);
                CreateBox($"Ridge_Step_{i + 1:00}", root.transform,
                    new Vector3(0f, top * 0.5f, RidgeFootMaxZ - stepDepth * (i + 0.5f)),
                    new Vector3(RidgeMaxX - RidgeMinX, top, stepDepth),
                    new Color(0.56f, 0.53f, 0.49f));
            }

            // Cheek walls either side of the stair, so the player walks up the middle of the cut
            // rather than being able to step off the flank of it.
            CreateBox("Ridge_Cheek_West", root.transform,
                new Vector3(RidgeMinX - 0.4f, LookoutHeight * 0.5f, (RidgeFootMinZ + RidgeFootMaxZ) * 0.5f),
                new Vector3(0.8f, LookoutHeight, RidgeFootMaxZ - RidgeFootMinZ),
                new Color(0.52f, 0.49f, 0.46f));
            CreateBox("Ridge_Cheek_East", root.transform,
                new Vector3(RidgeMaxX + 0.4f, LookoutHeight * 0.5f, (RidgeFootMinZ + RidgeFootMaxZ) * 0.5f),
                new Vector3(0.8f, LookoutHeight, RidgeFootMaxZ - RidgeFootMinZ),
                new Color(0.52f, 0.49f, 0.46f));

            // The platform itself, reached off the top step.
            CreateBox("Lookout_Platform", root.transform,
                new Vector3(0f, LookoutHeight - 0.25f, (LookoutMinZ + LookoutMaxZ) * 0.5f),
                new Vector3(LookoutMaxX - LookoutMinX, 0.5f, LookoutMaxZ - LookoutMinZ),
                new Color(0.60f, 0.57f, 0.53f));

            // The landward end of the platform is a cliff, and this is what makes it one: a solid wall the
            // full height of the platform along its z-min edge, the side the stair does not reach.
            // Without it the player could walk off the back of the lookout onto the sand behind it.
            //
            // Note the direction, because it is the opposite of what the earlier draft of this file
            // claimed: the sea lies at high z, and the stair already meets the platform on its z-max
            // edge, so that edge is both the seaward outlook and the way down. The seaward face is
            // where the player looks out from, not where they are stopped.
            CreateBox("Lookout_Landward_Cliff", root.transform,
                new Vector3(0f, LookoutHeight * 0.5f, LookoutMinZ - 0.5f),
                new Vector3(LookoutMaxX - LookoutMinX + 4f, LookoutHeight, 1f),
                new Color(0.50f, 0.48f, 0.45f));

            // Stage 7. A generous trigger on the platform, because climbing the stair should not require
            // pixel-accurate placement.
            CreateArrivalTrigger(
                MamallapuramShoreContent.LocationLookout,
                "Arrival_Lookout",
                root.transform,
                new Vector3(0f, LookoutHeight + 2f, (LookoutMinZ + LookoutMaxZ) * 0.5f),
                new Vector3(15f, 5f, 11f));

            // Low parapets on the three open edges, for the same reason the causeway has kerbs: they
            // describe the platform and they keep the player on it.
            CreateBox("Lookout_Parapet_West", root.transform,
                new Vector3(LookoutMinX - 0.3f, LookoutHeight + 0.5f, (LookoutMinZ + LookoutMaxZ) * 0.5f),
                new Vector3(0.5f, 1f, LookoutMaxZ - LookoutMinZ), new Color(0.56f, 0.53f, 0.49f));
            CreateBox("Lookout_Parapet_East", root.transform,
                new Vector3(LookoutMaxX + 0.3f, LookoutHeight + 0.5f, (LookoutMinZ + LookoutMaxZ) * 0.5f),
                new Vector3(0.5f, 1f, LookoutMaxZ - LookoutMinZ), new Color(0.56f, 0.53f, 0.49f));

            // The flat stone at the centre of the platform: the major evidence, and the reason the
            // player climbed. Positioned clear of the parapets so it is reachable from the top step
            // without walking off the edge. It is inspectable rather than scenery, because stage 8 is
            // this clue and the quest has no way to complete it otherwise.
            CreateInteractableBox(
                "Investigate_Tally_Stone",
                root.transform,
                new Vector3(0f, LookoutHeight + 0.4f, (LookoutMinZ + LookoutMaxZ) * 0.5f),
                new Vector3(4.2f, 0.8f, 3f),
                new Color(0.58f, 0.55f, 0.51f),
                QuestObjectiveType.DiscoverClue,
                MamallapuramShoreContent.ClueCarvedManifest,
                "mamallapuram.inspect.tally_stone",
                "Read the carved tally",
                "வெட்டப்பட்ட எண்ணடைப் படியுங்கள்",
                grantItemId: MamallapuramShoreContent.ItemRubbingSheet,
                recordDiscoveryId: MamallapuramShoreContent.DiscoveryCarvedManifest,
                acknowledgeAsImportant: true);

            InstantiateDecorative("Assets/_Project/Art/Models/Props/temple/granite_column.glb", root.transform,
                new Vector3(-5.5f, LookoutHeight, LookoutMinZ + 1.6f), Quaternion.identity, Vector3.one);
            InstantiateDecorative("Assets/_Project/Art/Models/Props/temple/granite_column.glb", root.transform,
                new Vector3(5.5f, LookoutHeight, LookoutMinZ + 1.6f), Quaternion.identity, Vector3.one);
        }

        // ---- Quest content --------------------------------------------------

        private static void BuildMamallapuramContent(Transform parent)
        {
            var content = new GameObject("--- MAMALLAPURAM_CONTENT ---");
            content.transform.SetParent(parent, false);

            // Stage 3: the half-cut blocks in the carving yard. Investigating them reports the
            // investigation and hands over the chisel that supports the yard, which is the physical
            // prop for the yard beat rather than a puzzle part.
            CreateInteractableBox(
                "Investigate_Stone_Blocks",
                content.transform,
                new Vector3(-11f, 1f, 3.4f),
                new Vector3(6f, 2f, 2.4f),
                new Color(0.55f, 0.53f, 0.50f),
                QuestObjectiveType.InvestigateObject,
                MamallapuramShoreContent.ObjectStoneBlocks,
                "mamallapuram.inspect.stone_blocks",
                "Examine the half-worked blocks",
                "நிறைவில்லாத கட்டைகளை ஆராயுங்கள்",
                revealClueId: MamallapuramShoreContent.ClueWetFootprints,
                grantItemId: MamallapuramShoreContent.ItemChippedChisel);

            // Stage 5: the sheltered stone face in the yard, where the tally marks are.
            CreateInteractableBox(
                "Investigate_Carving_Yard",
                content.transform,
                new Vector3(-15.6f, 1.4f, 8.5f),
                new Vector3(0.4f, 2.8f, 4f),
                new Color(0.57f, 0.55f, 0.52f),
                QuestObjectiveType.InvestigateObject,
                MamallapuramShoreContent.ObjectCarvingYard,
                "mamallapuram.inspect.carving_yard",
                "Examine the sheltered stone face",
                "பாதுகாப்பான கல் மேற்பரப்பை ஆராயுங்கள்",
                revealClueId: MamallapuramShoreContent.ClueSaltTally);

            // Stage 10: the signal post, which records the discovery that points north.
            CreateInteractableBox(
                "Investigate_Signal_Post",
                content.transform,
                new Vector3(-3.6f, 1.6f, CausewayMaxZ - 1.2f),
                new Vector3(2.2f, 2.4f, 0.6f),
                new Color(0.58f, 0.44f, 0.32f),
                QuestObjectiveType.InvestigateObject,
                MamallapuramShoreContent.ObjectSignalPost,
                "mamallapuram.inspect.signal_post",
                "Read the signal post",
                "அச்சுக் கம்பத்தைப் படியுங்கள்",
                recordDiscoveryId: MamallapuramShoreContent.DiscoveryNorthRoad);

            // Reuses the existing artisan and fisher models rather than authoring new ones: nothing in
            // this region's content depends on which particular resident model is standing there, and
            // the authored npc ids are what the quest and the dialogue look up.
            BuildResident(content.transform, "artisan", new Vector3(-9f, 0f, 8.5f), 25f,
                "Sundaram (Stone Carver)", "சுந்தரம் (கற்றுவித்தவர்)",
                "கடற்கரைக்கு மேலே உள்ள கற்றுக்கட்டும் தளத்தில் பணியாறும் கற்றுவித்தவர் சுந்தரம்.",
                MamallapuramShoreContent.NpcSundaram);

            BuildResident(content.transform, "fisher", new Vector3(9.5f, 0f, 16.5f), 200f,
                "Kavitha (Fisher)", "கவிதா (மீனவர்)",
                "கப்பல் இறக்கும் இடத்தில் மீன் வேட்டையாடும் மீனவர் கவிதா.",
                MamallapuramShoreContent.NpcKavitha);
        }

        /// <summary>
        /// Places a shore resident.
        ///
        /// Their names and conversations come from MamallapuramShoreContent through
        /// GameplayRegionBootstrap. The npc id is pinned to the authored constant after
        /// SetCharacterProfile, because that method derives the id from the display name and would
        /// otherwise produce "sundaram_stone_carver", which no quest objective or dialogue lookup
        /// would recognise.
        /// </summary>
        private static void BuildResident(
            Transform parent,
            string modelName,
            Vector3 localPos,
            float facingY,
            string nameEn,
            string nameTa,
            string description,
            string npcId)
        {
            var obj = InstantiateDecorative(
                $"Assets/_Project/Art/Models/Characters/NPCs/{modelName}.glb",
                parent, localPos, Quaternion.Euler(0f, facingY, 0f), Vector3.one);

            if (obj == null) return;

            var npc = obj.AddComponent<NPCCharacter>();
            npc.SetCharacterProfile(nameEn, nameTa, "Mamallapuram", description);

            var npcSo = new SerializedObject(npc);
            npcSo.FindProperty("npcId").stringValue = npcId;
            npcSo.ApplyModifiedPropertiesWithoutUndo();

            // The authored model carries its own collision, which would fight the capsule the
            // interaction system and the NavMesh agent both expect.
            foreach (var col in obj.GetComponentsInChildren<Collider>())
            {
                Object.DestroyImmediate(col);
            }

            var capsule = obj.AddComponent<CapsuleCollider>();
            capsule.height = 1.8f;
            capsule.radius = 0.35f;
            capsule.center = new Vector3(0f, 0.9f, 0f);
        }

        // ---- Lighting --------------------------------------------------------

        private static void BuildLighting(Transform parent)
        {
            // Open shore, so the sun does most of the work and the point lights only keep the two
            // places the player has to read small detail in legible: the carving yard and the lookout.
            AddPointLight(parent, "Light_CarvingYard", new Vector3(-11f, 4.5f, 6.5f), new Color(1f, 0.92f, 0.80f), 1.7f, 20f);
            AddPointLight(parent, "Light_WorkingShore", new Vector3(10f, 4.5f, 17f), new Color(1f, 0.90f, 0.76f), 1.5f, 22f);
            AddPointLight(parent, "Light_Lookout", new Vector3(0f, LookoutHeight + 4.5f, -14f), new Color(1f, 0.94f, 0.84f), 2.0f, 20f);
            AddPointLight(parent, "Light_SeawardEnd", new Vector3(0f, 4.5f, CausewayMaxZ - 2f), new Color(1f, 0.88f, 0.74f), 1.4f, 18f);
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

        /// <summary>
        /// Shares one material per surface colour across the region. Keying by colour rather than by
        /// object name is what keeps the geometry batched onto a handful of materials rather than one
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
                $"Assets/_Project/Art/Materials/Mamallapuram/Surface_{r:X2}{g:X2}{b:X2}.mat",
                colour);
        }

        private static void CreateWallX(string name, Transform parent, float centreX, float z, float length)
        {
            CreateBox(name, parent, new Vector3(centreX, WallHeight * 0.5f, z), new Vector3(length, WallHeight, WallThickness),
                new Color(0.71f, 0.59f, 0.46f));
        }

        /// <summary>
        /// An interactable box that reports one gameplay event and nothing else. Every optional output
        /// is opt-in, so a caller can only create an interactable that advances the quest by declaring
        /// what it advances.
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
            string promptEn,
            string promptTa,
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

            // The bilingual fallback is written as well as the key. The key alone would leave these
            // three objects with no prompt text at all, because ResolvePromptLabel returns null for a
            // key the localization tables do not define, and InteractionPrompt then falls through to
            // fields that would also be empty.
            so.FindProperty("promptEn").stringValue = promptEn;
            so.FindProperty("promptTa").stringValue = promptTa;
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
        /// Instantiates an authored model as a visual only, stripping its colliders so this scene's
        /// collision stays entirely in the primitives above and the intended gaps cannot be sealed by
        /// an asset whose collision nobody in this scene intends.
        /// </summary>
        private static GameObject InstantiateDecorative(string assetPath, Transform parent, Vector3 localPos, Quaternion localRot, Vector3 localScale)
        {
            var obj = AssembleAllRegions.InstantiateModel(assetPath, parent, localPos, localRot, localScale);
            if (obj == null) return null;

            foreach (var col in obj.GetComponentsInChildren<Collider>())
            {
                Object.DestroyImmediate(col);
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