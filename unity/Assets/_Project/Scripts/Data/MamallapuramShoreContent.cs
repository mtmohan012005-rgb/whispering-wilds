using System;
using System.Collections.Generic;
using WhisperingWilds.Data;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Static, stable-identifier registry of the Mamallapuram shore content: the two residents the
    /// player works alongside, the three pieces of evidence the granite yields, the items those
    /// evidence points carry, and the single linear quest that walks the player from the causeway
    /// up to the lookout and back down to the water.
    ///
    /// This follows <see cref="ChettinadMansionContent"/>: content is declared once in code so every
    /// save identifier resolves to the same shared instance on any machine, and
    /// <see cref="EnsureInitialized"/> is idempotent.
    ///
    /// The region is the second gated destination. The coastal connection discovered in Chettinad is
    /// recorded as a Chettinad-region clue, which <see cref="World.RegionUnlocks"/> uses to open this
    /// route. That gate lives in the unlock module rather than here, so this file stays pure content.
    ///
    /// The carved tally is an invented story prop written for this quest. It reproduces no real
    /// inscription, and no real Mamallapuram monument, family, or vessel is depicted. The heritage
    /// structures referenced by name are real places, and nothing is claimed about them beyond the
    /// public record.
    /// </summary>
    public static class MamallapuramShoreContent
    {
        public const string RegionId = "mamallapuram";

        // ---- Residents ---------------------------------------------------------

        /// <summary>Stable npc id for the stone carver who works the yard above the shore.</summary>
        public const string NpcSundaram = "sundaram";

        /// <summary>Stable npc id for the fisher who works the landing below it.</summary>
        public const string NpcKavitha = "kavitha";

        // ---- Clues / evidence --------------------------------------------------

        /// <summary>Working shore: wet prints crossing granite the tide has not reached. First clue.</summary>
        public const string ClueWetFootprints = "clue_mamallapuram_wet_footprints";

        /// <summary>Carving yard: deep tally cuts in a sheltered face, weathered around but not inside.</summary>
        public const string ClueSaltTally = "clue_mamallapuram_salt_tally";

        /// <summary>Lookout: the full carved tally on the flat stone. The major evidence of this quest.</summary>
        public const string ClueCarvedManifest = "clue_mamallapuram_carved_manifest";

        // ---- Items -------------------------------------------------------------

        /// <summary>Beside the half-worked blocks. Supports the carving-yard investigation.</summary>
        public const string ItemChippedChisel = "item_mamallapuram_chipped_chisel";

        /// <summary>The landing. Optional flavour evidence that the boats leave before dawn.</summary>
        public const string ItemFisherLantern = "item_mamallapuram_fisher_lantern";

        /// <summary>The physical prop behind <see cref="ClueCarvedManifest"/>: a rubbing, not the stone.</summary>
        public const string ItemRubbingSheet = "item_mamallapuram_rubbing_sheet";

        // ---- Quest -------------------------------------------------------------

        /// <summary>
        /// Stable quest id. It is the save key for the whole Mamallapuram quest chain, so it is fixed
        /// by the step's acceptance criteria rather than derived from the title.
        /// </summary>
        public const string QuestEchoesAlongTheShore = "MAMALLAPURAM_01";

        // ---- Interactable locations and objects ---------------------------------

        public const string LocationShoreArrival = "location_mamallapuram_arrival";

        /// <summary>The boat landing, at water level. Where the causeway puts the player down.</summary>
        public const string LocationWorkingShore = "location_mamallapuram_working_shore";

        /// <summary>The ridge platform above the shore, holding the major evidence.</summary>
        public const string LocationLookout = "location_mamallapuram_lookout";

        /// <summary>The seaward end of the causeway. Reached only by coming back down.</summary>
        public const string LocationCauseway = "location_mamallapuram_causeway";

        public const string ObjectStoneBlocks = "object_mamallapuram_stone_blocks";
        public const string ObjectCarvingYard = "object_mamallapuram_carving_yard";
        public const string ObjectSignalPost = "object_mamallapuram_signal_post";

        // ---- Discovery log entries ---------------------------------------------

        public const string DiscoveryCarvedManifest = "discovery_mamallapuram_carved_manifest";

        /// <summary>
        /// The signal post names a route inland and north. This is the narrative hook the Nilgiris
        /// region consumes; the destination itself stays deferred until that region is built.
        /// </summary>
        public const string DiscoveryNorthRoad = "discovery_mamallapuram_north_road";

        private static bool initialized;

        public static bool IsInitialized => initialized;

        /// <summary>
        /// Registers all Mamallapuram shore content exactly once. Safe to call repeatedly.
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
                discoveryId = DiscoveryCarvedManifest,
                regionId = RegionId,
                titleEn = "The Carved Tally",
                titleTa = "வெட்டப்பட்ட எண்ணடு",
                bodyEn = "A sequence of loads and dates cut into the lookout stone, each row closed with a chisel mark. One row was never closed.",
                bodyTa = "பார்வையக் கல்லில் வெட்டப்பட்ட சுமைகளும் தேதிகளும், ஒவ்வொரு வரிசையும் சிதுக்கரண்டி அடையாளத்தால் மூடப்பட்டுள்ள தொடர். ஒரு வரிசை மட்டும் மூடப்படவில்லை."
            });

            Investigation.DiscoveryLog.Register(new Investigation.DiscoveryDefinition
            {
                discoveryId = DiscoveryNorthRoad,
                regionId = RegionId,
                titleEn = "The Road North",
                titleTa = "வடக்குச் சாலை",
                bodyEn = "The signal post carries a route marked inland and north, toward high country the shore trade never reached. Whoever kept this tally was also counting a journey they had not finished.",
                bodyTa = "அச்சுக் கம்பத்தில் உள்ளேயும் வடக்கிலும் செல்லும் ஒரு வழி, கடற்கரை வணிகம் எட்டாத உயர்நிலப் பகுதியை நோக்கி. இந்த எண்ணடை வைத்தவர் ஒரு முடியாத பயணத்தையும் எண்ணிக்கைகளுடன் சேர்த்திருந்தார்."
            });
        }

        private static void RegisterItems()
        {
            GameDataCatalog.RegisterItem(
                ItemChippedChisel,
                "Chipped Chisel", "உடைந்த சிதுக்கரண்டி",
                "A carving chisel snapped at the tip and left in the dust beside the blocks.",
                "கட்டைகளுக்கு அருகில் தூரில் விடப்பட்ட, நுனி உடைந்த கற்றுவெட்டுச் சிதுக்கரண்டி.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.3f);

            GameDataCatalog.RegisterItem(
                ItemFisherLantern,
                "Fisher's Lantern", "மீனவரின் விளக்கு",
                "A small storm lantern, still oily. It is hung where it can be reached in the dark, which says the boats went out before dawn.",
                "சிறிய புயல் விளக்கு, இன்னும் எண்ணெய் உள்ளது. இருளில் எளிதாக அணுகக்கூடிய இடத்தில் தொங்கப்பட்டுள்ளது, அது கப்பல்கள் பிறைப்போம் முன்பே புறப்பட்டன என்பதைக் கூறுகிறது.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.4f);

            GameDataCatalog.RegisterItem(
                ItemRubbingSheet,
                "Rubbing of the Tally", "எண்ணடின் இரப்புப் பட்டம்",
                "A sheet taken as a rubbing of the carved tally, so the numbers can be read without chiseling into the stone again.",
                "வெட்டப்பட்ட எண்ணடின் இரப்புவாக எடுக்கப்பட்ட தாள், இதனால் கலனை மீண்டும் சிதுக்காமலேயே எண்களைப் படிக்க முடியும்.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.05f);
        }

        private static void RegisterClues()
        {
            // First clue. Linked forward to the tally so holding both unlocks the deduction.
            GameDataCatalog.RegisterClue(
                ClueWetFootprints,
                "Wet Prints on Dry Granite", "உலர்ந்த கற்பாறையில் ஈரமான கால்களடகுகள்",
                "A line of wet footprints crosses granite the tide has not reached. They begin at the carving yard and end at the water, and the stone around them is dry enough to keep the prints sharp.",
                "நீர்நிலை அடையாத கற்பாறையில் ஈரமான கால்களடகுகள் ஒரு வரிசையாக உள்ளன. அவை கற்றுக்கட்டும் தளத்தில் தொடங்கி நீரில் முடிகின்றன, கால்களடகுகள் தெளிவாக வைத்திருக்கும் அளவில் சுற்றிய கலம் உலர்ந்துள்ளது.",
                ClueType.PhysicalEvidence, RegionId,
                relatedClueId: ClueSaltTally,
                deductionNoteEn: "The prints are wet, so they were made recently. They point to the water, not back up to the yard.",
                deductionNoteTa: "கால்களடகுகள் ஈரமாக இருப்பதால் அவை சமீபத்தில் ஏற்பட்டவை. அவை தளத்தை நோக்கி அல்ல, நீரை நோக்கிச் செல்கின்றன.");

            // Second clue: the weathered tally in the sheltered face.
            GameDataCatalog.RegisterClue(
                ClueSaltTally,
                "Tally Marks Weathered Round", "சுற்றி தேய்ந்த எண்ணடுகள்",
                "On a sheltered stone face, a line of tally marks cut deep enough that the sea has weathered the stone around them but left the cuts intact. They count loads, not days.",
                "பாதுகாப்பான கல் மேற்பரப்பில் ஆழமாக வெட்டப்பட்ட எண்ணடுகள். கடல் அவற்றைச் சுற்றிய கலத்தைத் தேய்த்துவிட்டது, ஆனால் வெட்டுகளைத் தேய்க்கவில்லை. அவை நாட்களை அல்ல, சுமைகளைக் கண்டிக்கின்றன.",
                ClueType.PhysicalEvidence, RegionId);

            // Major evidence. Invented story prop written for this quest.
            GameDataCatalog.RegisterClue(
                ClueCarvedManifest,
                "The Carved Tally", "வெட்டப்பட்ட எண்ணடு",
                "The full sequence cut into the flat stone at the lookout: loads and dates, each row closed with a chisel mark. One row has no closing mark. It is the only line in the whole sequence still open.",
                "பார்வையகத்தின் தட்டையான கல்லில் வெட்டப்பட்ட முழு தொடர்: சுமைகளும் தேதிகளும், ஒவ்வொரு வரிசையும் சிதுக்கரண்டி அடையாளத்தால் மூடப்பட்டுள்ளது. ஒரு வரிசை மட்டும் மூடப்படவில்லை. முழுத் தொடரிலும் அதுவே திறந்து கிடைக்கும் வரிசை.",
                ClueType.Document, RegionId,
                relatedClueId: ClueWetFootprints,
                deductionNoteEn: "Every other row is closed. The open row is also the one the salt has not reached, so it was cut last.",
                deductionNoteTa: "மற்ற எல்லா வரிசைகளும் மூடப்பட்டுள்ளன. திறந்துள்ள வரிசை உப்பு இன்னும் அடையாத வரிசையும் ஒன்றே, அதனால் அது கடைசியாக வெட்டப்பட்டது.",
                isKeyLead: true);
        }

        private static void RegisterQuests()
        {
            // One objective per stage. QuestManager advances a stage only when every objective in
            // it is complete, so one-objective stages make the eleven objectives strictly linear
            // and in the authored order, with no way to skip a beat.
            //
            // The route deliberately runs inland and upward to the lookout for the major evidence and
            // then back down to the causeway, so the last two stages are a return trip rather than a
            // second lap of the same ground.
            GameDataCatalog.RegisterQuest(
                QuestEchoesAlongTheShore,
                "Echoes Along the Shore", "கரையோரத்தின் எதிரொலிகள்",
                "The stone carvers at Mamallapuram keep counting something that was never finished. Find out what the tally on the lookout stone is still waiting for.",
                "மாமல்லபுரத்தின் கற்றுவித்தவர்கள் முடியாத ஒரு கணக்கை எண்ணிக்கைகொண்டிருக்கிறார்கள். பார்வையக் கல்லிலுள்ள எண்ணடு எதற்காகக் காத்திருக்கிறது என்பதைக் கண்டுபிடியுங்கள்.",
                RegionId,
                new[]
                {
                    Stage(0, "Journey", "பயணம்",
                        Objective("travel_mamallapuram", QuestObjectiveType.ReachLocation, LocationShoreArrival,
                            "Travel to Mamallapuram.", "மாமல்லபுரத்திற்குச் செல்யவும்.")),

                    Stage(1, "The Caretaker", "காப்பாளர்",
                        Objective("meet_sundaram", QuestObjectiveType.TalkToNPC, NpcSundaram,
                            "Meet Sundaram at the carving yard.", "கற்றுக்கட்டும் தளத்தில் சுந்தரத்தைச் சந்தியுங்கள்.")),

                    Stage(2, "The Working Shore", "வேலையாளர் கடற்கரை",
                        Objective("reach_working_shore", QuestObjectiveType.ReachLocation, LocationWorkingShore,
                            "Walk down to the boat landing.", "கப்பல் இறக்கும் இடத்திற்கு இறங்கிச் செல்யவும்.")),

                    Stage(3, "Survey the Blocks", "கட்டைகளை ஆராயும்",
                        Objective("investigate_blocks", QuestObjectiveType.InvestigateObject, ObjectStoneBlocks,
                            "Investigate the half-worked granite blocks.", "நிறைவில்லாத கற்கட்டைகளை ஆராயுங்கள்.")),

                    Stage(4, "First Trace", "முதல் அடையாளம்",
                        Objective("first_clue", QuestObjectiveType.DiscoverClue, ClueWetFootprints,
                            "Find the first clue.", "முதல் தடயத்தைக் கண்டுபிடியுங்கள்.")),

                    Stage(5, "The Carving Yard", "கற்றுக்கட்டும் தளம்",
                        Objective("investigate_yard", QuestObjectiveType.InvestigateObject, ObjectCarvingYard,
                            "Investigate the carving yard.", "கற்றுக்கட்டும் தளத்தை ஆராயுங்கள்.")),

                    Stage(6, "Salt and Tally", "உப்பும் எண்ணும்",
                        Objective("salt_tally", QuestObjectiveType.DiscoverClue, ClueSaltTally,
                            "Find the weathered tally marks.", "தேய்ந்த எண்ணடுகளைக் கண்டுபிடியுங்கள்.")),

                    Stage(7, "The Lookout", "பார்வையகம்",
                        Objective("reach_lookout", QuestObjectiveType.ReachLocation, LocationLookout,
                            "Climb to the lookout.", "பார்வையகத்திற்கு ஏறுங்கள்.")),

                    Stage(8, "What the Stone Records", "கல் என்ன சொல்கிறது",
                        Objective("major_evidence", QuestObjectiveType.DiscoverClue, ClueCarvedManifest,
                            "Discover the major evidence.", "முக்கியச் சான்றைக் கண்டுபிடியுங்கள்.")),

                    Stage(9, "The Descent", "கீழ்நோக்கிய இறக்கம்",
                        Objective("descend_to_causeway", QuestObjectiveType.ReachLocation, LocationCauseway,
                            "Go back down to the seaward end of the causeway.", "கடல்புறத்திலுள்ள பாதைக்கட்டுத் தொடரின் முனைக்குத் திரும்பிச் செல்யவும்.")),

                    Stage(10, "The Road North", "வடக்குச் சாலை",
                        Objective("record_discovery", QuestObjectiveType.InvestigateObject, ObjectSignalPost,
                            "Record what the signal post points to.", "அச்சுக் கம்பம் எதைச் சுட்டுகிறது என்பதைப் பதிவு செய்யவும்."))
                },
                rewardCoins: 180);
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
        /// The two conversations on this shore, built in code so the clue ids a node gates on are the
        /// same constants the quest objectives reference.
        ///
        /// Later beats are not selected by this method. Each node carries a
        /// <see cref="DialogueNode.requiredClueId"/> and <c>NPCCharacter</c> picks the first node whose
        /// requirement the player already satisfies, at the moment they talk. Evaluating that here
        /// instead would freeze the graph at scene load, before any clue in this region has been found.
        ///
        /// Nodes are therefore ordered most-advanced first: the entry resolution walks the list and
        /// takes the first satisfied node, so the closing beat outranks the mid-quest beat, which
        /// outranks the opening. Returns an empty list for any other npc id.
        /// </summary>
        public static List<DialogueNode> BuildDialogueFor(string npcId)
        {
            if (string.Equals(npcId, NpcSundaram, StringComparison.OrdinalIgnoreCase))
            {
                return BuildSundaramGraph();
            }

            if (string.Equals(npcId, NpcKavitha, StringComparison.OrdinalIgnoreCase))
            {
                return BuildKavithaGraph();
            }

            return new List<DialogueNode>();
        }

        private static List<DialogueNode> BuildSundaramGraph()
        {
            return new List<DialogueNode>
            {
                // Closing beat: the lookout has been read, so this is the after-quiet conversation.
                new DialogueNode
                {
                    nodeIndex = 0,
                    requiredClueId = ClueCarvedManifest,
                    speakerTextEn = "You came back down without the stone. Good. People who carry a piece of that rock away stop coming back at all.",
                    speakerTextTa = "கல்லைக் கொண்டு வராமல் கீழே இறிங்கி வந்தீர்கள். நல்லது. அந்தக் கல்லின் ஒரு பகுதியை எடுத்துச் செல்பவர்கள் மீண்டும் வருவதில்லை.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I only took a rubbing.",
                            choiceTextTa = "நான் இரப்பு மட்டும் எடுத்தேன்.",
                            nextNodeIndex = -1
                        }
                    }
                },

                // Mid-quest beat: the sheltered face has been found, so the marks can be explained.
                new DialogueNode
                {
                    nodeIndex = 1,
                    requiredClueId = ClueSaltTally,
                    speakerTextEn = "You found the sheltered face. Then you know the cuts go deeper than the weather does. Every one of us who has worked this shore knows that wall of marks.",
                    speakerTextTa = "பாதுகாப்பான முகத்தைக் கண்டீர்கள். அப்போது வெட்டுகள் வானிலைவிட ஆழமாக இருப்பதை நீங்கள் அறியீர்கள். இந்தக் கடற்கரையில் வேலை செய்த எவரும் அந்த எண்ணடுச் சுவரை அறிந்திருக்கிறார்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Then who counts them?",
                            choiceTextTa = "அப்படியானால் அவற்றை யார் எண்கிறார்?",
                            nextNodeIndex = 2
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "Where is the rest of the tally?",
                            choiceTextTa = "எண்ணடின் மீதி எங்கே இருக்கிறது?",
                            nextNodeIndex = 3
                        }
                    }
                },

                // Reply inside the mid-quest beat. Same requirement, so it is reachable by choice but
                // never chosen as the entry node: node 1 is earlier in the list and also satisfied.
                new DialogueNode
                {
                    nodeIndex = 2,
                    requiredClueId = ClueSaltTally,
                    speakerTextEn = "The same family has counted them since before I could hold a chisel. We take the number and we pass it up. Nobody here asks where it goes.",
                    speakerTextTa = "நான் சிதுக்கரண்டி பிடிக்கும் வயதிற்கு முன்பிருந்தே அதே குடும்பம் அவற்றை எண்கிறது. நாங்கள் எண்ணை எடுத்து மேலே செலுத்துவோம். அது எங்கே செல்கிறது என்று இங்கு யாரும் கேட்பதில்லை.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Up the coast road?",
                            choiceTextTa = "கடற்ச் சாலையின் மேலே?",
                            nextNodeIndex = 3
                        }
                    }
                },

                // The pointer to the lookout. This is what sends the player up the ridge.
                new DialogueNode
                {
                    nodeIndex = 3,
                    requiredClueId = ClueSaltTally,
                    speakerTextEn = "Up the ridge. The lookout stone carries the full sequence, back to the first cut. Go and read it, then decide what you think an open row means.",
                    speakerTextTa = "சிறுவரை மேலே. பார்வையக் கல்லில் முழுத் தொடரும், முதல் வெட்டிலிருந்து வரை உள்ளது. அங்கே சென்று படித்து, திறந்துள்ள வரிசை என்பதால் என்ன என்று நீங்களே முடிவு செய்யுங்கள்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I will read it.",
                            choiceTextTa = "படிக்கிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                },

                // Opening beat: no requirement, so this is the entry node until a clue is found.
                new DialogueNode
                {
                    nodeIndex = 4,
                    speakerTextEn = "You came up from the causeway. Everyone does eventually. Granite takes a long time to learn and a short time to break, so we work it slow.",
                    speakerTextTa = "பாதைக்கட்டுத் தொடரிலிருந்து மேலே வந்தீர்கள். எல்லாரும் ஒரு நாளில் வந்துவிடுகிறார்கள். கற்பாறை கற்றுக்கொள்ள நீண்ட நேரம் ஆகும், உடைக்க மட்டும் குறுகிய நேரம், அதனால் நாங்கள் மெதுவாக வேலை செய்கிறோம்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "What are you carving?",
                            choiceTextTa = "நீங்கள் என்ன வெட்டுகிறீர்கள்?",
                            nextNodeIndex = -1
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "Who works this shore?",
                            choiceTextTa = "இந்தக் கடற்கரையில் யார் வேலை செய்கிறார்?",
                            nextNodeIndex = -1
                        }
                    }
                }
            };
        }

        private static List<DialogueNode> BuildKavithaGraph()
        {
            return new List<DialogueNode>
            {
                new DialogueNode
                {
                    nodeIndex = 0,
                    requiredClueId = ClueWetFootprints,
                    speakerTextEn = "You are looking at those prints the way a person looks when they already know they should not be there. That is the waterline. Nothing should be on it yet.",
                    speakerTextTa = "நீங்கள் அந்தக் கால்களடகுகளைப் பார்ப்பது, அவை இருக்கக்கூடாது என்று முன்பே அறிந்தவரின் பார்வையாக இருக்கிறது. அது நீர்க்கால். அதில் இன்னும் எதுவும் இருக்கக்கூடாது.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "They went out in the dark.",
                            choiceTextTa = "அவர்கள் இருளில் புறப்பட்டார்கள்.",
                            nextNodeIndex = 1
                        }
                    }
                },

                new DialogueNode
                {
                    nodeIndex = 1,
                    requiredClueId = ClueWetFootprints,
                    speakerTextEn = "Before dawn, when the sea is flat and nobody is watching the road. That is when everything here that is not fish gets moved.",
                    speakerTextTa = "பிறைப்போம் முன்பே, கடல் அமைதியாக இருக்கும்போது, சாலையை யாரும் பார்ப்பாதபோது. மீன் அல்லாத இங்குள்ள எல்லாவற்றையும் அப்போதுதான் நகர்த்துவார்கள்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Who would be moving it?",
                            choiceTextTa = "யார் நகர்த்துவார்?",
                            nextNodeIndex = -1
                        }
                    }
                },

                // Opening beat: no requirement.
                new DialogueNode
                {
                    nodeIndex = 2,
                    speakerTextEn = "Careful on the landing, the stone is wet this hour. If you are here about the carvers, they will tell you there is nothing to tell, and then they will talk for an hour.",
                    speakerTextTa = "இறக்கும் இடத்தில் எச்சரிக்கையாக இருங்கள், இந்த நேரத்தில் கலம் ஈரமாக இருக்கும். கற்றுவித்தவர்களைப் பற்றி வந்திருந்தால், சொல்வதற்கு ஏதும் இல்லை என்று சொல்லுவார்கள், பிறகு ஒரு மணி நேரம் பேசுவார்கள்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Then I will go up.",
                            choiceTextTa = "அப்போது மேலே செல்கிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                }
            };
        }
    }
}