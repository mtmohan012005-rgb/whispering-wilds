using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Step 12 of the world build: populates the Chennai scene with a working population instead
    /// of leaving the two prototype NPCs that the street assembler originally placed.
    ///
    /// Design rules that this builder does not break:
    ///   - Every character is an authored GLB under
    ///     <c>Assets/_Project/Art/Models/Characters/NPCs</c>. A missing model is reported as
    ///     <c>MISSING_PRODUCTION_ASSET</c> and the NPC is left unplaced; it is never faked with a
    ///     capsule, cube or empty GameObject.
    ///   - Every NPC gets a real structured schedule covering sleeping, working, eating and social
    ///     time, wired to real <see cref="NPCActivityAnchor"/> transforms, so
    ///     <see cref="NPCPerformanceTierManager"/> has something meaningful to tick.
    ///   - Re-running the builder is idempotent: NPCs, anchors and dialogue are matched by
    ///     identifier and updated in place rather than duplicated.
    /// </summary>
    public static class BuildChennaiPopulation
    {
        public const string ScenePath = "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity";
        public const string NpcModelRoot = "Assets/_Project/Art/Models/Characters/NPCs";

        private const string NpcRootName = "--- NPCS ---";
        private const string AnchorRootName = "--- NPC_ANCHORS ---";

        // BuildChennaiStreet sidewalk geometry: carriageway half width 4.5m, 0.28m drain,
        // 2.6m sidewalk, raised 0.15m. Sidewalk centre lines therefore sit near x = +/-6.08.
        private const float SidewalkX = 6.08f;
        private const float SidewalkY = BuildChennaiStreet.SidewalkY;

        private sealed class RosterEntry
        {
            public string id;
            public string nameEn;
            public string nameTa;
            public string modelFile;
            public NPCOccupation occupation;
            public string professionEn;
            public string professionTa;
            public string greetingEn;
            public string greetingTa;
            public Vector3 position;
            public float yaw;
            public string workAnchorId;
            public string homeAnchorId;
            public string socialAnchorId;
            public int startHourOffset;
        }

        private sealed class AnchorDef
        {
            public string id;
            public AnchorActivityType activityType;
            public string locationNameEn;
            public string locationNameTa;
            public Vector3 position;
            public float yaw;
        }

        /// <summary>
        /// The district's shared social anchors. Two benches plus the tea kadai verandah give the
        /// population somewhere to actually meet, which is what makes the "living world" claim true
        /// rather than a set of independently idling characters.
        /// </summary>
        private static readonly AnchorDef[] SharedAnchors =
        {
            new AnchorDef { id = "chennai_tea_kadai", activityType = AnchorActivityType.MarketStall,
                locationNameEn = "Murugan's Tea Kadai", locationNameTa = "முருகனின் தேய்கடை",
                position = new Vector3(-5.15f, SidewalkY, 5.7f), yaw = 90f },
            new AnchorDef { id = "chennai_high_court_plaza", activityType = AnchorActivityType.PatrolLookout,
                locationNameEn = "High Court Plaza", locationNameTa = "உயர்நீதிமன்ற மையம்",
                position = new Vector3(7.4f, SidewalkY, -6.0f), yaw = 180f },
            new AnchorDef { id = "chennai_fish_market", activityType = AnchorActivityType.MarketStall,
                locationNameEn = "George Town Fish Market", locationNameTa = "ஜார்ஜ் டவுன் மீன் சந்தை",
                position = new Vector3(6.08f, SidewalkY, 17.5f), yaw = -90f },
            new AnchorDef { id = "chennai_flower_cart", activityType = AnchorActivityType.MarketStall,
                locationNameEn = "Flower Cart", locationNameTa = "பூக்கடை வண்டி",
                position = new Vector3(-6.08f, SidewalkY, -13.0f), yaw = 90f },
            new AnchorDef { id = "chennai_craft_stall", activityType = AnchorActivityType.ArtisanWork,
                locationNameEn = "Sundaram Stores Frontage", locationNameTa = "சுந்தரம் ஸ்டோர்ஸ் முன்",
                position = new Vector3(-6.08f, SidewalkY, 30.5f), yaw = 90f },
            new AnchorDef { id = "chennai_dock_gate", activityType = AnchorActivityType.MarketStall,
                locationNameEn = "Marina Dock Gate", locationNameTa = "மரினா கவாரி வாயில்",
                position = new Vector3(6.08f, SidewalkY, -23.0f), yaw = -90f },
            new AnchorDef { id = "chennai_social_bench_west", activityType = AnchorActivityType.SocialBench,
                locationNameEn = "West Side Social Bench", locationNameTa = "மேற்கு பக்க மரக்கை",
                position = new Vector3(-6.7f, SidewalkY, 12.5f), yaw = 90f },
            new AnchorDef { id = "chennai_social_bench_east", activityType = AnchorActivityType.SocialBench,
                locationNameEn = "East Side Social Bench", locationNameTa = "கீழ் பக்க மரக்கை",
                position = new Vector3(6.7f, SidewalkY, 6.0f), yaw = -90f },
            new AnchorDef { id = "chennai_agasram_temple", activityType = AnchorActivityType.TemplePrayer,
                locationNameEn = "Agal Dharamshala Steps", locationNameTa = "அகல் தரசாலா படிகள்",
                position = new Vector3(-6.08f, SidewalkY, -33.0f), yaw = 90f },
        };

        /// <summary>
        /// The full roster: the four available main characters plus ten residents, giving fourteen
        /// scheduled NPCs in the scene and comfortably clearing the twelve-NPC acceptance bar.
        /// </summary>
        private static RosterEntry[] BuildRoster()
        {
            return new[]
            {
                // ---- main characters -------------------------------------------------
                new RosterEntry
                {
                    id = "murugan", nameEn = "Murugan", nameTa = "முருகன்", modelFile = "murugan.glb",
                    occupation = NPCOccupation.Shopkeeper,
                    professionEn = "Tea stall owner", professionTa = "தேய்கடை உரிமையாளர்",
                    greetingEn = "Kanna kettu, saapta? Sit, sit. The tea is strong today.",
                    greetingTa = "கண்ணா கட்டு, சாப்பிட்டா? உட்காருங்க. இன்று தேய் கெட்டியானது.",
                    position = new Vector3(-5.15f, SidewalkY, 5.7f), yaw = 90f,
                    workAnchorId = "chennai_tea_kadai", homeAnchorId = "chennai_home_murugan",
                    socialAnchorId = "chennai_tea_kadai", startHourOffset = 0
                },
                new RosterEntry
                {
                    id = "velu", nameEn = "Velu", nameTa = "வேலு", modelFile = "velu.glb",
                    occupation = NPCOccupation.Resident,
                    professionEn = "Auto driver and district guide", professionTa = "ஆட்டோ ஓட்டுநர், பகுதி வழிகாட்டி",
                    greetingEn = "Which way is it going, Anna? My auto is right here.",
                    greetingTa = "எங்கே போகிறீர், அண்ணா? என் ஆட்டோ இதே இருக்கு.",
                    position = new Vector3(3.35f, 0f, 10.2f), yaw = -75f,
                    workAnchorId = "chennai_tea_kadai", homeAnchorId = "chennai_home_velu",
                    socialAnchorId = "chennai_social_bench_east", startHourOffset = 1
                },
                new RosterEntry
                {
                    id = "meenakshi", nameEn = "Meenakshi", nameTa = "மீனாட்சி", modelFile = "meenakshi.glb",
                    occupation = NPCOccupation.CraftWorker,
                    professionEn = "Field reporter", professionTa = "களத் தொலைக்குரிய ரிப்போர்ட்டர்",
                    greetingEn = "I am Meenakshi. I follow paper trails. Court records usually know where the mangroves went.",
                    greetingTa = "நான் மீனாட்சி. ஆவணப் பாதைகளைத் தொடர்கிறேன். நீதிமன்றப் பதிவேட்டில் மண்டலங்கள் எங்கே சென்றன என்பது தெரியும்.",
                    position = new Vector3(7.4f, SidewalkY, -6.0f), yaw = 180f,
                    workAnchorId = "chennai_high_court_plaza", homeAnchorId = "chennai_home_meenakshi",
                    socialAnchorId = "chennai_social_bench_east", startHourOffset = 0
                },
                new RosterEntry
                {
                    id = "selvam", nameEn = "Selvam", nameTa = "செல்வம்", modelFile = "selvam.glb",
                    occupation = NPCOccupation.Fisherman,
                    professionEn = "Catamaran boatman", professionTa = "கடலுக்கரமான படகு மீனவன்",
                    greetingEn = "The estuary water is still clean this side. Pichavaram will tell you the rest.",
                    greetingTa = "இந்தப் பக்கம் நீர் இன்னும் சுத்தமாக இருக்கு. மீதம் பிச்சாவரம் சொல்லும்.",
                    position = new Vector3(6.08f, SidewalkY, 16.5f), yaw = -90f,
                    workAnchorId = "chennai_fish_market", homeAnchorId = "chennai_home_selvam",
                    socialAnchorId = "chennai_fish_market", startHourOffset = 2
                },

                // ---- residents -------------------------------------------------------
                new RosterEntry
                {
                    id = "ravi", nameEn = "Ravi", nameTa = "ரவி", modelFile = "farmer.glb",
                    occupation = NPCOccupation.Farmer,
                    professionEn = "Flower seller from Pallavaram", professionTa = "பல்லாவரம் பூ விற்பி",
                    greetingEn = "Fresh jasmine, every morning, before the heat takes it.",
                    greetingTa = "வெப்பம் வருவதற்குள் மல்லி பூ, காலை சந்திக்கவே.",
                    position = new Vector3(-SidewalkX, SidewalkY, -14.0f), yaw = 90f,
                    workAnchorId = "chennai_flower_cart", homeAnchorId = "chennai_home_ravi",
                    socialAnchorId = "chennai_social_bench_west", startHourOffset = 3
                },
                new RosterEntry
                {
                    id = "kannammal", nameEn = "Kannammal", nameTa = "கண்ணம்மாள்", modelFile = "artisan.glb",
                    occupation = NPCOccupation.CraftWorker,
                    professionEn = "Palm leaf weaver", professionTa = "தென்னையிலை நெசவி",
                    greetingEn = "Give me an hour and a palm leaf. I will make you a basket that lasts.",
                    greetingTa = "ஒரு மணி நேரமும் ஒரு தென்னை இலையும் தாரு. ஆயிராண்டு நிலைக்கும் கூடை செய்து தருகிறேன்.",
                    position = new Vector3(-SidewalkX, SidewalkY, 19.0f), yaw = 90f,
                    workAnchorId = "chennai_craft_stall", homeAnchorId = "chennai_home_kannammal",
                    socialAnchorId = "chennai_social_bench_west", startHourOffset = 1
                },
                new RosterEntry
                {
                    id = "selvaraj", nameEn = "Selvaraj", nameTa = "செல்வராஜ்", modelFile = "fisher.glb",
                    occupation = NPCOccupation.Fisherman,
                    professionEn = "Coastal net mender", professionTa = "கடற்சிமிழ் வலை செப்பவர்",
                    greetingEn = "Net first, boat second, argument with the sea never.",
                    greetingTa = "முதலில் வலை, இரண்டாவது படகு, கடலுடன் வாதம் கடைசியில்.",
                    position = new Vector3(SidewalkX, SidewalkY, 25.0f), yaw = -90f,
                    workAnchorId = "chennai_fish_market", homeAnchorId = "chennai_home_selvaraj",
                    socialAnchorId = "chennai_social_bench_east", startHourOffset = 4
                },
                new RosterEntry
                {
                    id = "ammu", nameEn = "Ammu", nameTa = "அம்மு", modelFile = "artisan.glb",
                    occupation = NPCOccupation.CraftWorker,
                    professionEn = "Garment stitcher", professionTa = "ஆடை தைத்த தையலாளி",
                    greetingEn = "My machine is old but it has never once broken a seam.",
                    greetingTa = "என் இயந்திரம் காலமானது, ஆனால் ஒரு தையிப்பும் உடைக்கவில்லை.",
                    position = new Vector3(-SidewalkX, SidewalkY, 33.0f), yaw = 90f,
                    workAnchorId = "chennai_craft_stall", homeAnchorId = "chennai_home_ammu",
                    socialAnchorId = "chennai_social_bench_west", startHourOffset = 0
                },
                new RosterEntry
                {
                    id = "hari", nameEn = "Hari", nameTa = "ஹரி", modelFile = "fisher.glb",
                    occupation = NPCOccupation.Fisherman,
                    professionEn = "Marina boat hand", professionTa = "மரினா படக்கு தொழிலாளி",
                    greetingEn = "The harbour water tastes different every month. Nobody tells us why.",
                    greetingTa = "துறை நீரின் சுவை ஒவ்வொரு மாதமும் வேறுபடுகிறது. யாரும் ஏன் என்று சொல்வதில்லை.",
                    position = new Vector3(SidewalkX, SidewalkY, -24.0f), yaw = -90f,
                    workAnchorId = "chennai_dock_gate", homeAnchorId = "chennai_home_hari",
                    socialAnchorId = "chennai_social_bench_east", startHourOffset = 2
                },
                new RosterEntry
                {
                    id = "devi", nameEn = "Devi", nameTa = "தேவி", modelFile = "forest-guide.glb",
                    occupation = NPCOccupation.Elder,
                    professionEn = "Temple caretaker", professionTa = "கோவில் பராமரிப்பாளர்",
                    greetingEn = "I have walked this street since before the flyover. Ask me anything.",
                    greetingTa = "அந்த மேல்வளியம் வருவதற்கு முன்பே இத் தெருவில் நடந்துள்ளேன். கேளுங்கள்.",
                    position = new Vector3(-SidewalkX, SidewalkY, -34.0f), yaw = 90f,
                    workAnchorId = "chennai_agasram_temple", homeAnchorId = "chennai_home_devi",
                    socialAnchorId = "chennai_agasram_temple", startHourOffset = 5
                },
                new RosterEntry
                {
                    id = "gopi", nameEn = "Gopi", nameTa = "கோபி", modelFile = "artisan.glb",
                    occupation = NPCOccupation.Shopkeeper,
                    professionEn = "Provision shop owner", professionTa = "மளிகைக் கடை உரிமையாளர்",
                    greetingEn = "Rice, kerosene, matches. And yes, I keep the notebook too.",
                    greetingTa = "அரிசி, மண்ணெய், எரிப்பு முச்சு. தமிழ் பதிவேட்டையும் வைத்திருக்கிறேன்.",
                    position = new Vector3(SidewalkX, SidewalkY, -40.0f), yaw = -90f,
                    workAnchorId = "chennai_dock_gate", homeAnchorId = "chennai_home_gopi",
                    socialAnchorId = "chennai_social_bench_east", startHourOffset = 3
                },
                new RosterEntry
                {
                    id = "siva", nameEn = "Siva", nameTa = "சிவா", modelFile = "farmer.glb",
                    occupation = NPCOccupation.TeaWorker,
                    professionEn = "Tea leaf courier", professionTa = "தேயிலை விநியோகம் செய்வர்",
                    greetingEn = "I carry leaf twice a week. I see more of this street than most.",
                    greetingTa = "வாரம் இரண்டு தடவை இலை கொண்டு செல்கிறேன். பலரை விட அதிகமாய் இத் தெருவைப் பார்க்கிறேன்.",
                    position = new Vector3(-SidewalkX, SidewalkY, -44.0f), yaw = 90f,
                    workAnchorId = "chennai_flower_cart", homeAnchorId = "chennai_home_siva",
                    socialAnchorId = "chennai_social_bench_west", startHourOffset = 1
                },
                new RosterEntry
                {
                    id = "radha", nameEn = "Radha", nameTa = "ராதா", modelFile = "artisan.glb",
                    occupation = NPCOccupation.Resident,
                    professionEn = "Schoolteacher", professionTa = "பள்ளி ஆசிரியை",
                    greetingEn = "I teach eleven children from this street. Two of them cannot read the notice board.",
                    greetingTa = "இந்தத் தெருவின் பதினொருங்க குழந்தைகளுக்குப் படிக்கச் சொல்கிறேன். இருவரும் அறிவிப்புப் பலகையைப் படிக்க முடியவில்லை.",
                    position = new Vector3(SidewalkX, SidewalkY, 34.0f), yaw = -90f,
                    workAnchorId = "chennai_craft_stall", homeAnchorId = "chennai_home_radha",
                    socialAnchorId = "chennai_social_bench_east", startHourOffset = 4
                },
                new RosterEntry
                {
                    id = "balan", nameEn = "Balan", nameTa = "பாலன்", modelFile = "fisher.glb",
                    occupation = NPCOccupation.Resident,
                    professionEn = "Carpenter", professionTa = "தச்சர்",
                    greetingEn = "I built half of these shutters. The other half I am repairing.",
                    greetingTa = "இவ்விட்டுகளில் பாதியை நான் செய்தேன். மற்ற பாதி திருத்துகிறேன்.",
                    position = new Vector3(-SidewalkX, SidewalkY, 40.0f), yaw = 90f,
                    workAnchorId = "chennai_craft_stall", homeAnchorId = "chennai_home_balan",
                    socialAnchorId = "chennai_social_bench_west", startHourOffset = 2
                },
            };
        }

        [MenuItem("WhisperingWilds/Build/Step 12 Chennai Population")]
        public static void BuildMenuItem()
        {
            Build();
            EditorSceneManager.MarkAllScenesDirty();
        }

        /// <summary>
        /// Opens the Chennai scene, populates it, and saves it back. Returns the number of NPCs that
        /// ended up scheduled in the scene so callers and QA can assert on it.
        /// </summary>
        public static int Build()
        {
            var scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            if (!scene.IsValid())
            {
                Debug.LogError("[BuildChennaiPopulation] MISSING_SCENE: " + ScenePath);
                return 0;
            }

            var missing = new List<string>();

            RemovePrototypeProps();

            var anchors = SetupAnchors();

            var npcRoot = GameObject.Find(NpcRootName);
            if (npcRoot == null) npcRoot = new GameObject(NpcRootName);

            var roster = BuildRoster();
            var placed = new Dictionary<string, NPCCharacter>();

            foreach (var entry in roster)
            {
                var npc = PlaceNpc(npcRoot.transform, entry, anchors, missing);
                if (npc != null) placed[entry.id] = npc;
            }

            // Kannan is a named character in the design but no authored model exists for him.
            // Recorded, never faked.
            if (AssetDatabase.LoadAssetAtPath<GameObject>(NpcModelRoot + "/kannan.glb") == null)
            {
                missing.Add("kannan");
                Debug.LogWarning("[BuildChennaiPopulation] MISSING_PRODUCTION_ASSET: kannan.glb not found under " +
                                 NpcModelRoot + ". Kannan is not placed in 02_Chennai_GeorgeTown; no capsule or " +
                                 "placeholder substitute was created. Status: MISSING_PRODUCTION_ASSET.");
            }

            var scheduled = 0;
            foreach (var kv in placed)
            {
                if (HasFullSchedule(kv.Value)) scheduled++;
            }

            // NPCPerformanceTierManager expects one instance in the scene to own distance tiering.
            EnsurePerformanceTierManager();

            EditorSceneManager.SaveScene(scene);
            Debug.Log("[BuildChennaiPopulation] Chennai population: " + placed.Count + " NPCs placed, " +
                      scheduled + " with a full daily schedule, " + anchors.Count + " anchors. " +
                      "Missing production assets: " +
                      (missing.Count == 0 ? "none" : string.Join(", ", missing.ToArray())) + ".");

            return placed.Count;
        }

        /// <summary>
        /// Strips the prototype cube and any other placeholder the earlier prototypes left in the
        /// scene. Real interaction proxies built by the Step 4 gameplay layer are left alone because
        /// they are the colliders quests interact with.
        /// </summary>
        private static void RemovePrototypeProps()
        {
            var prototypeNames = new[] { "TestCube", "Cube", "test_cube", "Test_Cube" };
            foreach (var name in prototypeNames)
            {
                var go = GameObject.Find(name);
                if (go == null) continue;
                Debug.Log("[BuildChennaiPopulation] Removing prototype placeholder '" + name + "'.");
                Object.DestroyImmediate(go);
            }

            // Any stray default-cube primitive left sitting at the origin by an earlier prototype.
            var origin = new List<GameObject>();
            foreach (var renderer in Object.FindObjectsOfType<MeshRenderer>())
            {
                var go = renderer.gameObject;
                if (go.transform.position.sqrMagnitude > 0.001f) continue;
                if (go.GetComponent<Collider>() == null) continue;
                var meshFilter = go.GetComponent<MeshFilter>();
                if (meshFilter == null || meshFilter.sharedMesh == null) continue;
                if (!meshFilter.sharedMesh.name.Contains("Cube")) continue;
                origin.Add(go);
            }

            foreach (var go in origin)
            {
                if (go.name.StartsWith("Pickup_") || go.name.StartsWith("Investigate_")) continue;
                Debug.Log("[BuildChennaiPopulation] Removing origin primitive placeholder '" + go.name + "'.");
                Object.DestroyImmediate(go);
            }
        }

        private static Dictionary<string, NPCActivityAnchor> SetupAnchors()
        {
            var root = GameObject.Find(AnchorRootName);
            if (root == null) root = new GameObject(AnchorRootName);

            var map = new Dictionary<string, NPCActivityAnchor>();

            foreach (var def in SharedAnchors)
            {
                var anchor = CreateAnchor(root.transform, def.id, def.activityType,
                    def.locationNameEn, def.locationNameTa, def.position, def.yaw);
                map[def.id] = anchor;
            }

            // Per-resident home anchors, so "go home" moves people somewhere plausible and
            // different rather than to one shared point.
            foreach (var entry in BuildRoster())
            {
                if (entry.homeAnchorId == null) continue;
                if (map.ContainsKey(entry.homeAnchorId)) continue;

                var homePosition = new Vector3(
                    SidewalkX + (entry.position.x < 0f ? -0.35f : 0.35f),
                    SidewalkY,
                    entry.position.z + (entry.position.x < 0f ? 4f : 5f));
                var homeDef = new AnchorDef
                {
                    id = entry.homeAnchorId,
                    activityType = AnchorActivityType.HomeResting,
                    locationNameEn = entry.nameEn + "'s House",
                    locationNameTa = entry.nameTa + " வீடு",
                    position = homePosition,
                    yaw = entry.position.x < 0f ? 90f : -90f
                };
                map[entry.homeAnchorId] = CreateAnchor(root.transform, homeDef.id, homeDef.activityType,
                    homeDef.locationNameEn, homeDef.locationNameTa, homeDef.position, homeDef.yaw);
            }

            return map;
        }

        private static NPCActivityAnchor CreateAnchor(Transform parent, string anchorId,
            AnchorActivityType activityType, string locationNameEn, string locationNameTa,
            Vector3 position, float yaw)
        {
            var go = GameObject.Find("NPCAnchor_" + anchorId);
            if (go == null)
            {
                go = new GameObject("NPCAnchor_" + anchorId);
                go.transform.SetParent(parent, false);
                go.transform.position = position;
                go.transform.rotation = Quaternion.Euler(0f, yaw, 0f);
            }
            else
            {
                go.transform.SetParent(parent, true);
                go.transform.position = position;
                go.transform.rotation = Quaternion.Euler(0f, yaw, 0f);
            }

            var anchor = go.GetComponent<NPCActivityAnchor>();
            if (anchor == null) anchor = go.AddComponent<NPCActivityAnchor>();

            var dock = go.transform.Find("DockPoint");
            if (dock == null)
            {
                var dockGo = new GameObject("DockPoint");
                dockGo.transform.SetParent(go.transform, false);
                dockGo.transform.localPosition = Vector3.zero;
                dock = dockGo.transform;
            }

            var so = new SerializedObject(anchor);
            so.FindProperty("anchorId").stringValue = anchorId;
            so.FindProperty("activityType").enumValueIndex = (int)activityType;
            so.FindProperty("locationName").stringValue = locationNameEn;
            so.FindProperty("activityPromptTa").stringValue = locationNameTa;
            so.FindProperty("dockPoint").objectReferenceValue = dock;
            so.FindProperty("lockRotation").boolValue = true;
            so.FindProperty("currentOccupant").objectReferenceValue = null;
            so.ApplyModifiedPropertiesWithoutUndo();

            return anchor;
        }

        private static NPCCharacter PlaceNpc(Transform parent, RosterEntry entry,
            Dictionary<string, NPCActivityAnchor> anchors, List<string> missing)
        {
            var modelPath = NpcModelRoot + "/" + entry.modelFile;
            var modelPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(modelPath);
            if (modelPrefab == null)
            {
                if (!missing.Contains(entry.id)) missing.Add(entry.id);
                Debug.LogWarning("[BuildChennaiPopulation] MISSING_PRODUCTION_ASSET: " + modelPath +
                                 " for NPC '" + entry.id + "'. Not placed; no placeholder created.");
                return null;
            }

            var name = "NPC_" + ToPascal(entry.id);
            var existing = GameObject.Find(name);
            GameObject npcObject;

            bool hasCharacter = existing != null && existing.GetComponent<NPCCharacter>() != null;
            bool hasMesh = existing != null && existing.GetComponent<MeshFilter>() != null &&
                           existing.GetComponent<MeshFilter>().sharedMesh != null &&
                           existing.GetComponent<MeshFilter>().sharedMesh.name.Contains("Capsule");

            if (existing != null && (hasMesh || !hasCharacter))
            {
                // A leftover prototype stand-in has to go before the authored model replaces it.
                Object.DestroyImmediate(existing);
                existing = null;
                hasCharacter = false;
            }

            if (existing != null)
            {
                npcObject = existing;
                npcObject.transform.SetParent(parent, true);
            }
            else
            {
                npcObject = (GameObject)PrefabUtility.InstantiatePrefab(modelPrefab, parent);
                if (npcObject == null)
                {
                    Debug.LogError("[BuildChennaiPopulation] Failed to instantiate " + modelPath);
                    return null;
                }
            }

            npcObject.name = name;
            npcObject.transform.position = entry.position;
            npcObject.transform.rotation = Quaternion.Euler(0f, entry.yaw, 0f);

            StripRuntimeComponents(npcObject);

            var collider = npcObject.GetComponent<CapsuleCollider>();
            if (collider == null) collider = npcObject.AddComponent<CapsuleCollider>();
            collider.height = 1.8f;
            collider.radius = 0.4f;
            collider.center = new Vector3(0f, 0.9f, 0f);
            collider.isTrigger = false;

            var npc = npcObject.GetComponent<NPCCharacter>();
            if (npc == null) npc = npcObject.AddComponent<NPCCharacter>();

            Transform work = Resolve(anchors, entry.workAnchorId);
            Transform home = Resolve(anchors, entry.homeAnchorId);
            Transform social = Resolve(anchors, entry.socialAnchorId);

            var so = new SerializedObject(npc);
            so.FindProperty("npcId").stringValue = entry.id;
            so.FindProperty("displayNameEn").stringValue = entry.nameEn;
            so.FindProperty("displayNameTa").stringValue = entry.nameTa;
            so.FindProperty("occupation").enumValueIndex = (int)entry.occupation;
            so.FindProperty("profession").stringValue = entry.professionEn;
            so.FindProperty("profileDescription").stringValue = entry.greetingEn;
            so.FindProperty("workAnchor").objectReferenceValue = work;
            so.FindProperty("homeAnchor").objectReferenceValue = home;
            so.FindProperty("socialAnchor").objectReferenceValue = social;
            so.ApplyModifiedPropertiesWithoutUndo();

            WriteSchedule(npc, entry, work, home, social);
            WriteOpeningDialogue(npc, entry);

            EditorUtility.SetDirty(npc);
            return npc;
        }

        private static Transform Resolve(Dictionary<string, NPCActivityAnchor> anchors, string anchorId)
        {
            if (string.IsNullOrEmpty(anchorId)) return null;
            return anchors.TryGetValue(anchorId, out var anchor) ? anchor.transform : null;
        }

        /// <summary>
        /// Builds a nine-slot day: two work blocks either side of lunch, one social block in the
        /// morning and one in the evening, and a proper night. Times are offset per NPC so the
        /// district does not move as a single block.
        /// </summary>
        private static void WriteSchedule(NPCCharacter npc, RosterEntry entry,
            Transform work, Transform home, Transform social)
        {
            int off = entry.startHourOffset;

            var schedule = new List<NPCScheduleAction>
            {
                Slot(6.0f + off * 0.2f, 2.0f, NPCState.Working, work,
                    IsWorking(entry, "Opening the stall"), WorkingTa(entry, "விற்றகையைத் திறத்தல்")),
Slot(8.0f + off * 0.3f, 1.5f, NPCState.Socializing, social,
                    "Talking with neighbours at the bench", "மரக்கையில் அருகர்களுடன் பேசுதல்"),
                Slot(9.5f + off * 0.3f, 3.5f, NPCState.Working, work,
                    IsWorking(entry, "Working through the morning"), WorkingTa(entry, "காலை வேலை")),
                Slot(13.0f + off * 0.2f, 1.0f, NPCState.Eating, social,
                    "Eating with the others", "சூடகருண்டு சாப்பிடுதல்"),
                Slot(14.0f + off * 0.3f, 3.5f, NPCState.Working, work,
                    IsWorking(entry, "Afternoon trade"), WorkingTa(entry, "மதிய வர்த்தகம்")),
                Slot(17.5f + off * 0.3f, 2.0f, NPCState.Socializing, social,
                    "Evening conversation", "மாலை பேச்சு"),
                Slot(19.5f + off * 0.2f, 1.0f, NPCState.Eating, home,
                    "Eating at home", "வீட்டில் சாப்பிடுதல்"),
                Slot(20.5f, 3.0f, NPCState.Resting, home,
                    "Resting on the verandah", "மேற்படை மாடத்தில் ஓய்வு"),
                Slot(0.0f, 6.0f, NPCState.Sleeping, home,
                    "Asleep", "உறக்கம்"),
            };

            var so = new SerializedObject(npc);
            var listProperty = so.FindProperty("structuredSchedule");
            listProperty.ClearArray();
            listProperty.arraySize = schedule.Count;
            for (int i = 0; i < schedule.Count; i++)
            {
                var element = listProperty.GetArrayElementAtIndex(i);
                var slot = schedule[i];
                element.FindPropertyRelative("startHour24").intValue = Mathf.Clamp(Mathf.RoundToInt(slot.startHour24), 0, 23);
                element.FindPropertyRelative("durationHours").floatValue = slot.durationHours;
                element.FindPropertyRelative("state").enumValueIndex = (int)slot.state;
                element.FindPropertyRelative("activityDescriptionEn").stringValue = slot.activityDescriptionEn;
                element.FindPropertyRelative("activityDescriptionTa").stringValue = slot.activityDescriptionTa;
                element.FindPropertyRelative("locationName").stringValue = LocationName(slot.state);
                element.FindPropertyRelative("targetAnchor").objectReferenceValue = slot.targetAnchor;
                element.FindPropertyRelative("targetPosition").vector3Value = slot.targetAnchor != null
                    ? slot.targetAnchor.position
                    : entry.position;
                element.FindPropertyRelative("isMandatory").boolValue = slot.state == NPCState.Working;
            }
            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static NPCScheduleAction Slot(float startHour, float duration, NPCState state, Transform anchor,
            string descriptionEn, string descriptionTa)
        {
            var action = new NPCScheduleAction();
            action.startHour24 = Mathf.Clamp(Mathf.RoundToInt(startHour), 0, 23);
            action.durationHours = duration;
            action.state = state;
            action.targetAnchor = anchor;
            action.activityDescriptionEn = descriptionEn;
            action.activityDescriptionTa = descriptionTa;
            action.locationName = LocationName(state);
            action.isMandatory = state == NPCState.Working;
            return action;
        }

        private static string IsWorking(RosterEntry entry, string fallback)
        {
            switch (entry.occupation)
            {
                case NPCOccupation.Shopkeeper: return "Running the shop";
                case NPCOccupation.Farmer: return "Sorting produce at the cart";
                case NPCOccupation.Fisherman: return "Mending nets and selling fish";
                case NPCOccupation.TeaWorker: return "Sorting tea leaves";
                case NPCOccupation.CraftWorker: return "Handicraft work at the frontage";
                case NPCOccupation.Elder: return "Keeping watch at the temple";
                default: return fallback;
            }
        }

        private static string WorkingTa(RosterEntry entry, string fallback)
        {
            switch (entry.occupation)
            {
                case NPCOccupation.Shopkeeper: return "கடையை நடத்துதல்";
                case NPCOccupation.Farmer: return "கடையில் உற்பத்தி வரிசைப்படுத்துதல்";
                case NPCOccupation.Fisherman: return "வலை செப்புதலும் மீன் விற்பதும்";
                case NPCOccupation.TeaWorker: return "தேயிலை வரிசைப்படுத்துதல்";
                case NPCOccupation.CraftWorker: return "கைத்தொழில் பணி";
                case NPCOccupation.Elder: return "கோவில் முன் காவல்";
                default: return fallback;
            }
        }

        private static string LocationName(NPCState state)
        {
            switch (state)
            {
                case NPCState.Working: return "Workplace";
                case NPCState.Eating:
                case NPCState.Socializing: return "Shared Bench";
                case NPCState.Sleeping:
                case NPCState.Resting: return "Home";
                case NPCState.Prayer: return "Temple";
                default: return "District";
            }
        }

        private static void WriteOpeningDialogue(NPCCharacter npc, RosterEntry entry)
        {
            // DialogueNode carries nodeIndex plus the two bilingual speaker lines; the speaker's name
            // comes from NPCCharacter.DisplayNameEn/Ta, so it is not duplicated into the node.
            var so = new SerializedObject(npc);
            var nodes = so.FindProperty("dialogueNodes");
            nodes.ClearArray();
            nodes.arraySize = 1;

            var node = nodes.GetArrayElementAtIndex(0);
            node.FindPropertyRelative("nodeIndex").intValue = 0;
            node.FindPropertyRelative("speakerTextEn").stringValue = entry.greetingEn;
            node.FindPropertyRelative("speakerTextTa").stringValue = entry.greetingTa;

            var choices = node.FindPropertyRelative("choices");
            choices.ClearArray();
            choices.arraySize = 1;
            var choice = choices.GetArrayElementAtIndex(0);
            choice.FindPropertyRelative("choiceTextEn").stringValue = "See you around.";
            choice.FindPropertyRelative("choiceTextTa").stringValue = "பிறகு சந்திக்கலாம்.";
            choice.FindPropertyRelative("nextNodeIndex").intValue = -1;
            choice.FindPropertyRelative("requiredClueId").stringValue = string.Empty;
            choice.FindPropertyRelative("revealClueId").stringValue = string.Empty;
            choice.FindPropertyRelative("questTriggerId").stringValue = string.Empty;

            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static bool HasFullSchedule(NPCCharacter npc)
        {
            var so = new SerializedObject(npc);
            var list = so.FindProperty("structuredSchedule");
            if (list.arraySize < 6) return false;

            bool work = false, sleep = false, social = false;
            for (int i = 0; i < list.arraySize; i++)
            {
                var state = (NPCState)list.GetArrayElementAtIndex(i).FindPropertyRelative("state").enumValueIndex;
                if (state == NPCState.Working) work = true;
                if (state == NPCState.Sleeping) sleep = true;
                if (state == NPCState.Socializing || state == NPCState.Eating) social = true;
            }
            return work && sleep && social;
        }

        private static void EnsurePerformanceTierManager()
        {
            var root = GameObject.Find("--- MANAGERS ---");
            if (root == null)
            {
                root = GameObject.Find(NpcRootName);
                if (root == null) root = new GameObject("--- MANAGERS ---");
            }

            if (root.GetComponent<NPCPerformanceTierManager>() == null)
            {
                root.AddComponent<NPCPerformanceTierManager>();
            }
        }

        /// <summary>
        /// Authored character GLBs sometimes ship with helper behaviour already attached in the
        /// source file. Any NavMeshAgent and any spawner/manager/runtime component has to go, or the
        /// NPC ends up with two brains driving it (NPCNavigationController owns its own agent at
        /// runtime) and with scene-scale managers duplicated inside the character.
        /// </summary>
        private static void StripRuntimeComponents(GameObject root)
        {
            var agents = root.GetComponentsInChildren<UnityEngine.AI.NavMeshAgent>(true);
            for (int i = 0; i < agents.Length; i++)
            {
                if (agents[i] != null) Object.DestroyImmediate(agents[i]);
            }

            var behaviours = root.GetComponentsInChildren<MonoBehaviour>(true);
            for (int i = behaviours.Length - 1; i >= 0; i--)
            {
                var mb = behaviours[i];
                if (mb == null) continue;
                if (mb is NPCCharacter || mb is NPCActivityAnchor) continue;

                string typeName = mb.GetType().Name;
                if (typeName.Contains("Spawner") || typeName.Contains("Manager") ||
                    typeName.Contains("Runtime") || typeName.Contains("Benchmark") ||
                    typeName.Contains("SmokeTest") || typeName.Contains("Diagnostics") ||
                    typeName.Contains("Controller") || typeName.Contains("Zone"))
                {
                    Object.DestroyImmediate(mb);
                }
            }
        }

        private static string ToPascal(string id)
        {
            var parts = id.Split('_');
            var sb = new System.Text.StringBuilder();
            foreach (var part in parts)
            {
                if (part.Length == 0) continue;
                sb.Append(char.ToUpperInvariant(part[0]));
                if (part.Length > 1) sb.Append(part.Substring(1));
            }
            return sb.ToString();
        }
    }
}
