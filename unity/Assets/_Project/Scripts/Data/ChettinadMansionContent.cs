using System;
using System.Collections.Generic;
using WhisperingWilds.Data;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Static, stable-identifier registry of the Chettinad heritage mansion content: the courtyard
    /// caretaker the player meets, the six pieces of evidence the mansion yields, the investigation
    /// items those evidence points carry, and the single linear quest that walks the player from
    /// the street to the hidden room and back out again.
    ///
    /// This follows <see cref="ChennaiOpeningContent"/> exactly: content is declared once in code so
    /// every save identifier resolves to the same shared instance on any machine, and
    /// <see cref="EnsureInitialized"/> is idempotent.
    ///
    /// The medallion puzzle constants live here as well, because the clue descriptions, the hint
    /// text, and the mechanism itself must agree on the same three numbers. Keeping them in one
    /// place is what makes the puzzle deterministic and therefore safe to save: there is no
    /// randomised state to desynchronise.
    ///
    /// The unsent letter is an invented story prop written for this quest. It is not a reproduction
    /// of any real historical document, and no real Chettiar family, estate, or artefact is depicted.
    /// </summary>
    public static class ChettinadMansionContent
    {
        public const string RegionId = "chettinad";

        /// <summary>Stable npc id for the courtyard caretaker (matches MainCharacterRegistry.VeluId).</summary>
        public const string NpcVelu = "velu";

        // ---- Clues / evidence --------------------------------------------------

        /// <summary>Main hall: the clean circle in the dust where a ledger was removed. First clue.</summary>
        public const string ClueDustRing = "clue_chettinad_dust_ring";

        /// <summary>North colonnade medallion. First of the three architectural puzzle clues.</summary>
        public const string ClueMarkSun = "clue_chettinad_mark_sun";

        /// <summary>East rain gutter medallion. Second of the three architectural puzzle clues.</summary>
        public const string ClueMarkSerpent = "clue_chettinad_mark_serpent";

        /// <summary>West well head medallion. Third of the three architectural puzzle clues.</summary>
        public const string ClueMarkWheel = "clue_chettinad_mark_wheel";

        /// <summary>Side room: the door painted shut and wired, and where its key was left.</summary>
        public const string ClueSealedDoor = "clue_chettinad_sealed_door";

        /// <summary>Hidden room: the invented unsent letter. The major evidence of this quest.</summary>
        public const string ClueUnsentLetter = "clue_chettinad_unsent_letter";

        // ---- Items -------------------------------------------------------------

        /// <summary>Side-room chest. Opens the sealed family room; not required by the medallion lock.</summary>
        public const string ItemOldBrassKey = "item_chettinad_old_brass_key";

        /// <summary>Main hall wall frame. Optional flavour evidence alongside the dust ring.</summary>
        public const string ItemStudioPhotograph = "item_chettinad_studio_photograph";

        /// <summary>Hidden room. The physical prop behind <see cref="ClueUnsentLetter"/>.</summary>
        public const string ItemUnsentLetter = "item_chettinad_unsent_letter";

        // ---- Quest -------------------------------------------------------------

        /// <summary>
        /// Stable quest id. It is the save key for the whole Chettinad quest chain, so it is fixed
        /// by the step's acceptance criteria rather than derived from the title.
        /// </summary>
        public const string QuestTheHouseThatRemembers = "CHETTINAD_01";

        // ---- Interactable locations and objects ---------------------------------

        public const string LocationChettinadArrival = "location_chettinad_arrival";
        public const string LocationMansionEntrance = "location_mansion_entrance";
        public const string LocationMansionHiddenRoom = "location_mansion_hidden_room";

        /// <summary>
        /// The service lane behind the mansion. Only physically reachable once the hidden room is
        /// open, which is what keeps "return outside" from being satisfied on the way in.
        /// </summary>
        public const string LocationChettinadBackLane = "location_chettinad_back_lane";

        public const string ObjectMansionMainHall = "object_mansion_main_hall";
        public const string ObjectMansionSideRoom = "object_mansion_side_room";
        public const string ObjectMansionFamilyRoomDoor = "object_mansion_family_room_door";
        public const string ObjectMansionDialMechanism = "object_mansion_dial_mechanism";
        public const string ObjectMansionLetterBundle = "object_mansion_letter_bundle";
        public const string ObjectMansionCourtyardDesk = "object_mansion_courtyard_desk";

        // ---- Discovery log entries ---------------------------------------------

        public const string DiscoveryHiddenRoom = "discovery_chettinad_hidden_room";
        public const string DiscoveryUnsentLetter = "discovery_chettinad_unsent_letter";

        // ---- Puzzle -------------------------------------------------------------

        /// <summary>
        /// Stable id of the mansion puzzle. Persisted solved state is keyed by this, never by an
        /// object reference, so the lock survives save and load.
        /// </summary>
        public const string PuzzleMedallionOrder = "puzzle_chettinad_medallion_order";

        /// <summary>Each dial runs 0..9 inclusive.</summary>
        public const int DialMinValue = 0;
        public const int DialMaxValue = 9;

        /// <summary>
        /// The solution. Derived from what the three medallion clues describe: the sun shows three
        /// rays, the serpent five bands, the wheel eight spokes, and the courtyard was walked from
        /// the earliest light to the last, so the dials read smallest to largest.
        /// </summary>
        public static readonly int[] MedallionOrderSolution = { 3, 5, 8 };

        public static int DialValueSun => MedallionOrderSolution[0];
        public static int DialValueSerpent => MedallionOrderSolution[1];
        public static int DialValueWheel => MedallionOrderSolution[2];

        /// <summary>The three clues that must all be recorded before the lock will accept a combination.</summary>
        public static readonly string[] MedallionClueIds =
        {
            ClueMarkSun,
            ClueMarkSerpent,
            ClueMarkWheel
        };

        private static bool initialized;

        public static bool IsInitialized => initialized;

        /// <summary>
        /// Registers all Chettinad mansion content exactly once. Safe to call repeatedly.
        /// </summary>
        public static void EnsureInitialized()
        {
            if (initialized) return;
            initialized = true;

            RegisterItems();
            RegisterClues();
            RegisterQuests();
            RegisterDiscoveries();
        }

        private static void RegisterDiscoveries()
        {
            Investigation.DiscoveryLog.Register(new Investigation.DiscoveryDefinition
            {
                discoveryId = DiscoveryHiddenRoom,
                regionId = RegionId,
                titleEn = "Hidden Room Discovered",
                titleTa = "மறைக்கப்பட்ட அறை கண்டுபிடிக்கப்பட்டது",
                bodyEn = "The medallion order moved a wall in the family room. Behind it is a low chamber with a writing desk and a sealed envelope.",
                bodyTa = "மொடிகளின் வரிசை குடும்ப அறையின் சுவரை நகர்த்தது. அதற்குப் பின்புறம் எழுத்துமேசையும் மூடிய மடலையும் உள்ள ஒரு தாழ்ந்த அறை உள்ளது."
            });

            Investigation.DiscoveryLog.Register(new Investigation.DiscoveryDefinition
            {
                discoveryId = DiscoveryUnsentLetter,
                regionId = RegionId,
                titleEn = "The Unsent Letter",
                titleTa = "அனுப்பப்படாத கடிதம்",
                bodyEn = "A sealed envelope that was never posted. It names the remembering room and asks whoever finds it to leave the house exactly as they found it.",
                bodyTa = "ஒருபோதும் அனுப்பப்படாத மூடிய மடலை. அது நினைவுக்கான அறையைக் குறிப்பிடுகிறது, கண்டவர் வீட்டைக் காணப்படுமாற விட்டுவரச் சொல்கிறது."
            });
        }

        private static void RegisterItems()
        {
            GameDataCatalog.RegisterItem(
                ItemOldBrassKey,
                "Old Brass Key", "பழைய பித்தளச் சாவி",
                "A worn brass key from the side-room chest. It still turns in the family room lock.",
                "பக்க அறைப் பெட்டியிலிருந்து பெறப்பட்ட தேய்ந்த பித்தளச் சாவி. குடும்ப அறைப் பூட்டில் இன்னும் சுழல்கிறது.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.05f);

            GameDataCatalog.RegisterItem(
                ItemStudioPhotograph,
                "Studio Photograph", "ஸ்டுடியோ படம்",
                "A framed studio photograph of the family standing in front of this courtyard.",
                "இந்த முற்றாவீட்டின் முன் நின்ற குடும்பத்தின் படச் சுட்டுப் படம், சாட்டையில் பொருந்தியபடி.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.1f);

            GameDataCatalog.RegisterItem(
                ItemUnsentLetter,
                "Unsent Letter", "அனுப்பப்படாத கடிதம்",
                "A folded letter in a sealed envelope that was never posted.",
                "மூடப்பட்ட மடலையில் ஒரு செரிந்த கடிதம், அது ஒருபோதும் அனுப்பப்படவில்லை.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.02f);
        }

        private static void RegisterClues()
        {
            // First clue. Linked forward to the letter so holding both unlocks the deduction.
            GameDataCatalog.RegisterClue(
                ClueDustRing,
                "Dust Ring on the Hall Shelf", "மண்டப அலமரத்தில் வட்டமாக மண்",
                "A clean circle in the dust of the hall shelf, the width of a ledger. Everything around it is thick with dust. Something was taken down and never put back.",
                "மண்டப அலமரத்தின் மண்ணில் தெளிவான வட்டம், பதிவேடு அளவில். அதற்கு மற்ற இடங்கள் மென்மையான மண்வால் மூடியுள்ளன. ஒரு பொருள் இறக்கப்பட்டு மீண்டும் வைக்கப்படவில்லை.",
                ClueType.PhysicalEvidence, RegionId,
                relatedClueId: ClueUnsentLetter,
                deductionNoteEn: "The clean circle is exactly the size of the letter in the sealed envelope. The ledger was never read before it was hidden.",
                deductionNoteTa: "தெளிவான வட்டம், மூடிய மடலையிலுள்ள கடிதத்தின் அளவுக்கு ஒத்தது. பதிவேடு மறைக்கப்படுவதற்கு முன் படிக்கப்படவில்லை.");

            // Puzzle clue 1 of 3: three rays.
            GameDataCatalog.RegisterClue(
                ClueMarkSun,
                "Sun Medallion: Three Rays", "சூரிய மொடி: மூன்று கதிர்",
                "A lime medallion set high on the north colonnade. The sun is carved with three straight rays, and three chisel marks sit under it.",
                "வடக்கு மேடையின் உயரத்தில் வைக்கப்பட்ட சாணக் கல்வெட்டு. சூரியன் மூன்று நேர்கதிர்களுடன் வெட்டப்பட்டுள்ளது, அதன் கீழ் மூன்று கத்தார் குறிகள் உள்ளன.",
                ClueType.PhysicalEvidence, RegionId);

            // Puzzle clue 2 of 3: five bands.
            GameDataCatalog.RegisterClue(
                ClueMarkSerpent,
                "Serpent Medallion: Five Lines", "பாம்பு மொடி: ஐந்து கோடுகள்",
                "A carved serpent on the east rain gutter, its body cut as five straight bands across the stone.",
                "கிழக்கு மழை வடிகாலில் வெட்டப்பட்ட பாம்பு, அதன் உடல் கல்லில் ஐந்து நேர்ப் பட்டைகளாக வெட்டப்பட்டுள்ளது.",
                ClueType.PhysicalEvidence, RegionId);

            // Puzzle clue 3 of 3: eight spokes.
            GameDataCatalog.RegisterClue(
                ClueMarkWheel,
                "Wheel Medallion: Eight Spokes", "சக்கர மொடி: எட்டு அரைகள்",
                "Above the dry well head on the west side, a spoked wheel is cut into the lintel with eight spokes counted out in chisel marks.",
                "மேற்குப் பக்க வறண்ட கிணற்றின் வாயில் உயர்ந்து, சக்கரம் எட்டு அரைகளுடன் வாசலில் வெட்டப்பட்டுள்ளது.",
                ClueType.PhysicalEvidence, RegionId);

            // Side room: explains the key, and points the player at the family room.
            GameDataCatalog.RegisterClue(
                ClueSealedDoor,
                "The Sealed Side Door", "மூடப்பட்ட பக்கக் கதவு",
                "The family room door was painted shut and wired. The key is not lost; someone left it in the side-room chest on purpose, for whoever came next.",
                "குடும்ப அறைக் கதவு சாமத்தால் அடைக்கப்பட்டு இலச்சிக்கப்பட்டுள்ளது. சாவி காணப்படவில்லை; யாரோ அதைப் பக்க அறைப் பெட்டியில் எழுத்துவிட்டுள்ளார், அடுத்தவருக்காக.",
                ClueType.PhysicalEvidence, RegionId);

            // Major evidence. Invented story prop written for this quest.
            GameDataCatalog.RegisterClue(
                ClueUnsentLetter,
                "The Unsent Letter", "அனுப்பப்படாத கடிதம்",
                "A folded letter in a sealed envelope, never posted. It names a room the family called the remembering room, and asks whoever finds it to leave the house exactly as they found it.",
                "மூடப்பட்ட மடலையில் ஒரு செரிந்த கடிதம், அது ஒருபோதும் அனுப்பப்படவில்லை. குடும்பம் 'நினைவுக்கான அறை' என்று அழைத்த அறையைக் குறிப்பிடுகிறது, கண்டவர் வீட்டைக் காணப்படுமாற விட்டுவரச் சொல்கிறது.",
                ClueType.Document, RegionId,
                relatedClueId: ClueDustRing,
                deductionNoteEn: "The letter explains the dust ring: the ledger the family hid is the letter itself, kept in this room.",
                deductionNoteTa: "கடிதம் மண் வட்டத்தை விளக்குகிறது: குடும்பம் மறைத்த பதிவேடு இந்த அறையில் வைக்கப்பட்ட கடிதமே.",
                isKeyLead: true);
        }

        private static void RegisterQuests()
        {
            // One objective per stage. QuestManager advances a stage only when every objective in
            // it is complete, so one-objective stages make the eleven objectives strictly linear
            // and in the authored order, with no way to skip a beat.
            GameDataCatalog.RegisterQuest(
                QuestTheHouseThatRemembers,
                "The House That Remembers", "நினைவுகளை காக்கும் வீடு",
                "An old Chettinad courtyard house has been sealed for years. Find out what it is still keeping.",
                "பல ஆண்டுகளாக மூடப்பட்டிருக்கும் ஓர் பழைய செட்டிநாடு முற்றாவீட்டு வீடு. அது இன்னும் என்னைத் தக்கவைத்திருக்கிறது என்பதைக் கண்டுபிடியுங்கள்.",
                RegionId,
                new[]
                {
                    Stage(0, "Journey", "பயணம்",
                        Objective("travel_chettinad", QuestObjectiveType.ReachLocation, LocationChettinadArrival,
                            "Travel to Chettinad.", "செட்டிநாடுக்குச் செல்யவும்.")),

                    Stage(1, "The Caretaker", "காப்பாளர்",
                        Objective("meet_velu", QuestObjectiveType.TalkToNPC, NpcVelu,
                            "Meet Velu in the courtyard.", "முற்றாவீட்டில் வேலுவைச் சந்தியுங்கள்.")),

                    Stage(2, "Through the Door", "கதவினூடாக",
                        Objective("enter_mansion", QuestObjectiveType.ReachLocation, LocationMansionEntrance,
                            "Enter the mansion.", "மாளிகைக்குள் நுழையவும்.")),

                    Stage(3, "The Main Hall", "முதன்மை மண்டபம்",
                        Objective("investigate_main_hall", QuestObjectiveType.InvestigateObject, ObjectMansionMainHall,
                            "Investigate the main hall.", "முதன்மை மண்டபத்தை ஆராயுங்கள்.")),

                    Stage(4, "First Trace", "முதல் அடையாளம்",
                        Objective("first_clue", QuestObjectiveType.DiscoverClue, ClueDustRing,
                            "Find the first clue.", "முதல் தடயத்தைக் கண்டுபிடியுங்கள்.")),

                    Stage(5, "Side Rooms", "பக்க அறைகள்",
                        Objective("investigate_side_rooms", QuestObjectiveType.InvestigateObject, ObjectMansionSideRoom,
                            "Investigate the side rooms.", "பக்க அறைகளை ஆராயுங்கள்.")),

                    Stage(6, "The Order", "வரிசை",
                        Objective("solve_puzzle", QuestObjectiveType.InvestigateObject, ObjectMansionDialMechanism,
                            "Solve the mansion puzzle.", "மாளிகையின் புதிரைத் தீர்க்கவும்.")),

                    Stage(7, "Behind the Wall", "சுவரின் பின்புறம்",
                        Objective("enter_hidden_room", QuestObjectiveType.ReachLocation, LocationMansionHiddenRoom,
                            "Enter the hidden room.", "மறைக்கப்பட்ட அறைக்குள் நுழையவும்.")),

                    Stage(8, "The Letter", "கடிதம்",
                        Objective("major_evidence", QuestObjectiveType.DiscoverClue, ClueUnsentLetter,
                            "Discover the major evidence.", "முக்கியச் சான்றைக் கண்டுபிடியுங்கள்.")),

                    Stage(9, "Back Lane", "பின்புறத் தெரு",
                        Objective("return_outside", QuestObjectiveType.ReachLocation, LocationChettinadBackLane,
                            "Return outside.", "வெளியே திரும்பவும்.")),

                    Stage(10, "Written Down", "பதிவு செய்தல்",
                        Objective("record_discovery", QuestObjectiveType.InvestigateObject, ObjectMansionCourtyardDesk,
                            "Record the discovery.", "கண்டதைப் பதிவு செய்யவும்."))
                },
                rewardCoins: 150);
        }

        private static QuestStage Stage(int index, string titleEn, string titleTa, QuestObjective objective)
        {
            return new QuestStage
            {
                stageIndex = index,
                titleEn = titleEn,
                titleTa = titleTa,
                objectives = new List<QuestObjective> { objective }
            };
        }

        private static QuestObjective Objective(
            string objectiveId,
            QuestObjectiveType type,
            string targetId,
            string descriptionEn,
            string descriptionTa)
        {
            return new QuestObjective
            {
                objectiveId = objectiveId,
                type = type,
                targetId = targetId,
                descriptionEn = descriptionEn,
                descriptionTa = descriptionTa,
                requiredCount = 1
            };
        }

        /// <summary>
        /// Velu's conversation for the Chettinad courtyard. Built in code so the clue ids a choice
        /// gates or reveals are the same constants the quest objectives and the puzzle reference.
        ///
        /// Later branches are gated behind <see cref="requiredClueId"/>, so the medallion hint is
        /// only offered once the player has the dust ring, and the closing beat only after the letter
        /// is found. Returns an empty list for any other npc id.
        /// </summary>
        public static List<DialogueNode> BuildDialogueFor(string npcId)
        {
            if (!string.Equals(npcId, NpcVelu, StringComparison.OrdinalIgnoreCase))
            {
                return new List<DialogueNode>();
            }

            return new List<DialogueNode>
            {
                // The three beats below depend on evidence, so they are listed ahead of the opening
                // beats: NPCCharacter enters a conversation at the first node whose requirement the
                // player already satisfies, so "most advanced first" is what makes them reachable.
                // The order among them is deliberate too: the letter outranks the medallion hint, and
                // the hint is reached through the dust-ring node rather than entered directly.

                // Closing beat: the letter has been read, so this is the after-quiet conversation.
                new DialogueNode
                {
                    nodeIndex = 5,
                    requiredClueId = ClueUnsentLetter,
                    speakerTextEn = "So you opened the wall. Some stories are better left remembered than read. Put the letter back the way you found it.",
                    speakerTextTa = "அப்படியா சுவரைத் திறந்தீர்கள். சில கதைகளைப் படிவதைவிட நினைவில் வைத்திருப்பதே நல்லது. கடிதத்தை நீங்கள் கண்டபடியே வைத்துவிடுங்கள்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I will. It stays as we found it.",
                            choiceTextTa = "செய்கிறேன். நாங்கள் கண்டபடியே இருக்கும்.",
                            nextNodeIndex = -1
                        }
                    }
                },

                new DialogueNode
                {
                    nodeIndex = 3,
                    requiredClueId = ClueDustRing,
                    speakerTextEn = "You found the dust ring, so you have been in the hall. Then look up. The house keeps an order, and it carved it into the courtyard.",
                    speakerTextTa = "மண் வட்டத்தைக் கண்டீர்கள், அப்போது மண்டபத்திற்குள் நுழைந்திருக்கிறீர்கள். பின்னர் மேலே பாருங்கள். வீடு ஒரு வரிசையை வைத்திருக்கிறது, அதை முற்றாவீட்டில் வெட்டிவைத்திருக்கிறது.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Carved where?",
                            choiceTextTa = "எங்கு வெட்டியிருக்கிறது?",
                            nextNodeIndex = 4
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "I will find it myself.",
                            choiceTextTa = "நானே கண்டுபிடித்துக் கொள்கிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                },

                new DialogueNode
                {
                    nodeIndex = 4,
                    requiredClueId = ClueDustRing,
                    speakerTextEn = "Three medallions. The sun on the north colonnade, the serpent on the east gutter, the wheel over the dry well. Count what each one shows, and remember the order this courtyard was walked in.",
                    speakerTextTa = "மூன்று மொடிகள். வடக்கு மேடையில் சூரியன், கிழக்கு வடிகாலில் பாம்பு, வறண்ட கிணற்றின் மேல் சக்கரம். ஒவ்வொன்றும் என்ன காட்டுகிறது என்பதை எண்ணுங்கள், இந்த முற்றாவீட்டில் நடக்கப்பட்ட வரிசையை நினைவில் கொள்ளுங்கள்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "The order it was walked in.",
                            choiceTextTa = "நடக்கப்பட்ட வரிசை.",
                            nextNodeIndex = -1
                        }
                    }
                },

                new DialogueNode
                {
                    nodeIndex = 0,
                    speakerTextEn = "You found the lane. People stopped coming up here once the family sealed the doors.",
                    speakerTextTa = "இந்தத் தெருவைக் கண்டீர்கள். குடும்பம் கதவுகளை மூடியதும் இங்கே வர மக்கள் நிற்குப் போனார்கள்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "What happened to them?",
                            choiceTextTa = "அவர்களுக்கு என்ன நடந்தது?",
                            nextNodeIndex = 1
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "And who are you?",
                            choiceTextTa = "நீங்கள் யார்?",
                            nextNodeIndex = 2
                        }
                    }
                },
                new DialogueNode
                {
                    nodeIndex = 1,
                    speakerTextEn = "Nobody will say it outright. When the well was sealed the whole lane stopped talking about this house.",
                    speakerTextTa = "அதை யாரும் நேரடியாகச் சொல்வதில்லை. கிணறு மூடப்பட்டதும் இந்த வீட்டைப் பற்றி லேன முழுவதும் பேசுவதை நிறுத்துவிட்டது.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I will look inside.",
                            choiceTextTa = "உள்ளே பார்க்கிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                },
                new DialogueNode
                {
                    nodeIndex = 2,
                    speakerTextEn = "I am Velu. I keep the tile patterns and the door frames. If you go in, go carefully.",
                    speakerTextTa = "நான் வேலு. ஒருகோட்டு வடிவங்களையும் கதவு சட்டகங்களையும் பராமரிக்கிறேன். உள்ளே சென்றால், எச்சரிக்கையுடன் செல்வது நல்லது.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I will look inside.",
                            choiceTextTa = "உள்ளே பார்க்கிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                }
            };
        }
    }
}
