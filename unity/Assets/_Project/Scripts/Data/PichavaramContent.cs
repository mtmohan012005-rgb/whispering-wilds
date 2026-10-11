using System;
using System.Collections.Generic;
using WhisperingWilds.Data;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Static, stable-identifier registry of the Pichavaram mangrove content: the fisher who stays
    /// on the dock, the three pieces of evidence the creeks yield, the items those evidence points
    /// carry, and the single linear quest that walks the player from the boat landing out to the
    /// hidden channel and back to the bank.
    ///
    /// This follows <see cref="ChettinadMansionContent"/> exactly: content is declared once in code
    /// so every save identifier resolves to the same shared instance on any machine, and
    /// <see cref="EnsureInitialized"/> is idempotent.
    ///
    /// The night bundle and the tally slate are invented story props written for this quest. They
    /// reproduce no real cargo, manifest, or family, and the wetlands themselves are described only
    /// at the level of the public record: a mangrove estuary of narrow creeks and prop-rooted trees
    /// that the local fishing community works by hand.
    /// </summary>
    public static class PichavaramContent
    {
        public const string RegionId = "pichavaram";

        /// <summary>Stable npc id for the fisher who works the dock (derived from "Mani (Fisher)").</summary>
        public const string NpcMani = "mani_fisher";

        // ---- Clues / evidence --------------------------------------------------

        /// <summary>Dock edge: a kerosene sheen and a broken crate stave where the water is too slow to tidy itself. First clue.</summary>
        public const string ClueKeroseneSheen = "clue_pichavaram_kerosene_sheen";

        /// <summary>Prop root: a fresh gash below the tide line, cut by a rope dragging a bundle through. Second clue.</summary>
        public const string ClueRootGash = "clue_pichavaram_root_gash";

        /// <summary>Hollowed root: the sealed night bundle with its tally slate. The major evidence of this quest.</summary>
        public const string ClueNightBundle = "clue_pichavaram_night_bundle";

        // ---- Items -------------------------------------------------------------

        /// <summary>Dock edge. A broken crate stave that does not belong to any fishing crate.</summary>
        public const string ItemBrokenStave = "item_pichavaram_broken_stave";

        /// <summary>Hollowed root. The physical prop behind <see cref="ClueNightBundle"/>.</summary>
        public const string ItemTarredBundle = "item_pichavaram_tarred_bundle";

        /// <summary>Hollowed root. Loose wax that sealed the bundle, matching the tally slate inside.</summary>
        public const string ItemWaxSealBit = "item_pichavaram_wax_seal_bit";

        // ---- Quest -------------------------------------------------------------

        /// <summary>
        /// Stable quest id. It is the save key for the whole Pichavaram quest chain, so it is fixed
        /// by the step's acceptance criteria rather than derived from the title.
        /// </summary>
        public const string QuestTheNightCurrent = "PICHAVARAM_01";

        // ---- Interactable locations and objects ---------------------------------

        /// <summary>The wooden boat landing. Where travel sets the player down.</summary>
        public const string LocationPichavaramArrival = "location_pichavaram_arrival";

        /// <summary>The creek mouth past the outer mangroves, where the water runs deep enough for a boat at any tide.</summary>
        public const string LocationCreekMouth = "location_pichavaram_creek_mouth";

        /// <summary>The everyday bank at the landward end of the dock. Reached only by coming back out of the creeks.</summary>
        public const string LocationPichavaramBank = "location_pichavaram_bank";

        public const string ObjectDockEdge = "object_pichavaram_dock_edge";
        public const string ObjectSternCutting = "object_pichavaram_stern_cutting";
        public const string ObjectRootCache = "object_pichavaram_root_cache";
        public const string ObjectNetLogSeat = "object_pichavaram_net_log_seat";

        // ---- Discovery log entries ---------------------------------------------

        public const string DiscoveryNightCurrent = "discovery_pichavaram_night_current";

        private static bool initialized;

        public static bool IsInitialized => initialized;

        /// <summary>
        /// Registers all Pichavaram mangrove content exactly once. Safe to call repeatedly.
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
                discoveryId = DiscoveryNightCurrent,
                regionId = RegionId,
                titleEn = "The Night Current",
                titleTa = "இரவு நீரோட்டம்",
                bodyEn = "The bundle's slate counts crates the same way the tea ledger counts chests: loaded at one place, moved after dark, never opened where they cross water. Whatever this current carries, it runs inland and north, away from the sea it pretends to belong to.",
                bodyTa = "கட்டில் உள்ள கற்பலகை, தேநீர் பதிவேடு பெட்டிகளைக் கணக்கிடும் அதே முறையில் பேழைகளைக் கணக்கிடுகிறது: ஒரே இடத்தில் ஏற்றப்பட்டு, இருளுக்குப் பிறகு நகர்த்தப்படுகிறது, தண்ணீரைக் கடக்கும்போது ஒருபோதும் திறக்கப்படுவதில்லை. இந்த நீரோட்டம் எதைச் சுமந்தாலும் அது உள்நோக்கியும் வடக்கு நோக்கியும் ஓடுகிறது, அது சேர்ந்தது போல நடிக்கும் கடலை விட்டு அகலமாக."
            });
        }

        private static void RegisterItems()
        {
            GameDataCatalog.RegisterItem(
                ItemBrokenStave,
                "Broken Crate Stave", "உடைந்த பெட்டிச் சட்டம்",
                "A stave snapped out of a packing crate, still oily at the break. No fishing crate on this dock is built from wood this dry.",
                "பேக்கிங் பெட்டியிலிருந்து உடைந்த ஒரு சட்டம், உடைந்த இடத்தில் இன்னும் எண்ணெய் படிந்துள்ளது. இந்தக் கப்பல்துறையில் உள்ள மீன்பிடி பெட்டிகள் எதுவும் இவ்வளவு உலர்ந்த மரத்தால் கட்டப்படவில்லை.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.2f);

            GameDataCatalog.RegisterItem(
                ItemTarredBundle,
                "Tarred Night Bundle", "கட்டுத் தோல் கட்டு",
                "A bundle sealed in tarred cloth and wax, stowed inside a hollowed root. Whatever is in it stayed dry through a full tide.",
                "கட்டுத் தோலாலும் மெழுகாலும் மூடப்பட்ட ஒரு கட்டு, வெற்றுப் பட்டைக்குள் வைக்கப்பட்டுள்ளது. அதற்குள் உள்ளது ஒரு முழு ஓதப்பொழுதை உலர்ந்த நிலையில் கடந்தது.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 1.2f);

            GameDataCatalog.RegisterItem(
                ItemWaxSealBit,
                "Broken Wax Seal", "உடைந்த மெழுகு முத்திரை",
                "A scrap of the wax that sealed the bundle. The stamp on it pressed the same narrow ring the tea chests use.",
                "கட்டை மூடிய மெழுகின் ஒரு துண்டு. அதில் பதிந்த அடையாளம், தேநீர் பெட்டிகள் பயன்படுத்தும் அதே குறுகிய வளையமாகும்.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.02f);
        }

        private static void RegisterClues()
        {
            // First clue. Linked forward to the root gash so holding both unlocks the deduction.
            GameDataCatalog.RegisterClue(
                ClueKeroseneSheen,
                "Sheen on the Still Water", "அசையா நீரின் மேல் எண்ணெய்க் குழைவு",
                "At the dock edge, where the water runs too slow to tidy itself, a kerosene sheen turns with the drift. A crate stave lies across it, broken outward, as if something was dragged over the rail in the dark.",
                "நீர் தானாகச் சுத்தமாக முடியாத மெதுவான நீர் ஓடுமிடத்தில், கப்பல்துறையின் விளிம்பில் எண்ணெய்க் குழைவு ஒழுகுடன் சுழல்கிறது. ஒரு உடைந்த பெட்டிச் சட்டம் அதன் குறுக்கே கிடக்கிறது, வெளிநோக்கி உடைந்துள்ளது, இருளில் எதையோ திமிச்சிலிருந்து இழுத்தது போல.",
                ClueType.PhysicalEvidence, RegionId,
                relatedClueId: ClueRootGash,
                deductionNoteEn: "The break is outward, so the crate was pulled apart above water and dropped over the side, not brought ashore whole.",
                deductionNoteTa: "உடைப்பு வெளிநோக்கியது, அதனால் பெட்டி தண்ணீருக்கு மேல் பிரிக்கப்பட்டு பக்கவாட்டில் இறக்கப்பட்டது, முழுதுமாகக் கரைக்குக் கொண்டுவரப்படவில்லை.");

            // Second clue: the prop-root gash, deeper than tide wear.
            GameDataCatalog.RegisterClue(
                ClueRootGash,
                "Gash Below the Tide Line", "ஓதக்கோட்டுக்குக் கீழே உள்ள கீற்று",
                "On a prop-root just under the water line, a fresh gash runs where a rope dragged a load past. The cut is pale inside, younger than anything the tide has had time to smooth.",
                "நீர்க் கோட்டின் கீழ் ஒரு பட்டைவேரில், ஒரு கயிறு சுமையை இழுத்துச் சென்ற அடையாளமாக புதிய கீற்று ஓடுகிறது. உட்பகுதி வெளுத்துள்ளது, ஓதம் மிருதுவாக்க நேரம் கிடைத்த எதையும் விட இளையது.",
                ClueType.PhysicalEvidence, RegionId,
                relatedClueId: ClueKeroseneSheen,
                deductionNoteEn: "Rope work this deep is not fishing. It is mooring: tying a load down below the sightline of the bank, which only a channel boat needs to do.",
                deductionNoteTa: "இவ்வளவு ஆழத்தில் கயிறு வேலை மீன்பிடிப்பில்லை. அது கட்டுவேலை: கரைக்குத் தெரியாத உயரத்தில் சுமையைக் கட்டுதல், அதைச் செயக்கூடியது கால்வாய் படகு மட்டுமே.");

            // Major evidence. Invented story prop written for this quest.
            GameDataCatalog.RegisterClue(
                ClueNightBundle,
                "The Night Bundle", "இரவுக் கட்டு",
                "A bundle sealed in tarred cloth, stowed in a hollowed root at the creek mouth. Inside, a slate tally of crates: numbers, dates, and a wax-stamped ring identical to the one on the tea chests. The rows stop mid-count, as if the load outgrew the book.",
                "கட்டுத் தோலால் மூடப்பட்ட ஒரு கட்டு, கால்வாய்முகத்திலுள்ள வெற்றுப் பட்டைக்குள் வைக்கப்பட்டுள்ளது. உள்ளே பேழைகளின் கற்பலகை எண்ணடு: எண்கள், தேதிகள், தேநீர் பெட்டிகளில் உள்ளதைப் போன்ற மெழுகு வளைய அடையாளம். வரிசைகள் எண்ணிக்கை பாதியில் நிற்கின்றன, சுமை பதிவேட்டை விட பெரிதாகிறது போல.",
                ClueType.Document, RegionId,
                relatedClueId: ClueRootGash,
                deductionNoteEn: "The bundle traveled by water and was hidden where a boat can reach it before the tide turns. It is cargo, not rubbish, and someone is owed it.",
                deductionNoteTa: "கட்டு நீரால் வந்து, ஓதம் திரும்புமுன் படகு அடையக்கூடிய இடத்தில் மறைக்கப்பட்டுள்ளது. அது குப்பையல்ல, சரக்கு, அதை யாரோ பெற எதிர்பார்க்கிறார்கள்.",
                isKeyLead: true);
        }

        private static void RegisterQuests()
        {
            // One objective per stage, in the same strictly-linear shape as the other regions.
            GameDataCatalog.RegisterQuest(
                QuestTheNightCurrent,
                "The Night Current", "இரவு நீரோட்டம்",
                "The fisher on the Pichavaram dock keeps nets, not books, but something that is not fish has been crossing his water after dark. Find out what the creeks are carrying.",
                "பிச்சாவரம் கப்பல்துறையின் மீனவர் வலைகளை வைத்திருக்கிறார், பதிவேடுகளை அல்ல, ஆனால் மீன் அல்லாத எதுவோ இருளுக்குப் பிறகு அவருடைய நீரைக் கடக்கிறது. சதுப்புக் கால்வாய்கள் எதைச் சுமந்துச் செல்கின்றன என்பதைக் கண்டறியுங்கள்.",
                RegionId,
                new[]
                {
                    Stage(0, "Journey", "பயணம்",
                        Objective("travel_pichavaram", QuestObjectiveType.ReachLocation, LocationPichavaramArrival,
                            "Travel to Pichavaram.", "பிச்சாவரத்திற்குச் செல்லவும்.")),

                    Stage(1, "The Fisher Who Stays", "இங்கேயே தங்கும் மீனவர்",
                        Objective("meet_mani", QuestObjectiveType.TalkToNPC, NpcMani,
                            "Meet Mani on the dock.", "கப்பல்துறையில் மணியைச் சந்தியுங்கள்.")),

                    Stage(2, "The Dock Edge", "கப்பல்துறை விளிம்பு",
                        Objective("investigate_dock_edge", QuestObjectiveType.InvestigateObject, ObjectDockEdge,
                            "Examine the edge of the dock.", "கப்பல்துறையின் விளிம்பை ஆராயுங்கள்.")),

                    Stage(3, "First Trace", "முதல் அடையாளம்",
                        Objective("first_clue", QuestObjectiveType.DiscoverClue, ClueKeroseneSheen,
                            "Find the first clue.", "முதல் தடயத்தைக் கண்டுபிடியுங்கள்.")),

                    Stage(4, "The Stern Cutting", "படகின் பின்பகுதி",
                        Objective("investigate_stern", QuestObjectiveType.InvestigateObject, ObjectSternCutting,
                            "Inspect the boats at the mooring.", "நங்கூரமுள்ள படகுகளை ஆராயுங்கள்.")),

                    Stage(5, "Tide Marks", "ஓத அடையாளங்கள்",
                        Objective("second_clue", QuestObjectiveType.DiscoverClue, ClueRootGash,
                            "Find the gash below the tide line.", "ஓதக்கோட்டுக்குக் கீழே உள்ள கீற்றைக் கண்டுபிடியுங்கள்.")),

                    Stage(6, "The Creek Mouth", "கால்வாய்முகம்",
                        Objective("reach_creek_mouth", QuestObjectiveType.ReachLocation, LocationCreekMouth,
                            "Follow the creeks out to the deep channel.", "ஆழமான கால்வாய்க்கு சதுப்பு வழியாகச் செல்லவும்.")),

                    Stage(7, "The Bundle", "கட்டு",
                        Objective("major_evidence", QuestObjectiveType.DiscoverClue, ClueNightBundle,
                            "Find the sealed bundle.", "மூடப்பட்ட கட்டைக் கண்டுபிடியுங்கள்.")),

                    Stage(8, "The Root Cache", "பட்டை மறைவிடம்",
                        Objective("investigate_cache", QuestObjectiveType.InvestigateObject, ObjectRootCache,
                            "Search the root cache for what else is stowed.", "பட்டை மறைவிடத்தில் வேறு என்ன வைக்கப்பட்டுள்ளது என்பதை ஆராயுங்கள்.")),

                    Stage(9, "Back to the Bank", "கரைக்குத் திரும்புதல்",
                        Objective("return_to_bank", QuestObjectiveType.ReachLocation, LocationPichavaramBank,
                            "Return to the landward bank.", "நிலப்புறக் கரைக்குத் திரும்பவும்.")),

                    Stage(10, "Written Down", "பதிவு செய்தல்",
                        Objective("record_discovery", QuestObjectiveType.InvestigateObject, ObjectNetLogSeat,
                            "Record the discovery with Mani's nets.", "மணியின் வலைகளுக்கருகில் கண்டதைப் பதிவு செய்யவும்."))
                },
                rewardCoins: 160);
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
        /// Mani's conversation on the Pichavaram dock. Later beats are gated behind
        /// <see cref="requiredClueId"/>, so the creek-mouth pointer is only offered once the root
        /// gash is found, and the closing beat only after the bundle is read. Nodes are ordered
        /// most-advanced first, as in the other regions. Returns an empty list for any other npc id.
        /// </summary>
        public static List<DialogueNode> BuildDialogueFor(string npcId)
        {
            if (!string.Equals(npcId, NpcMani, StringComparison.OrdinalIgnoreCase))
            {
                return new List<DialogueNode>();
            }

            return new List<DialogueNode>
            {
                // Closing beat: the bundle has been read, so this is the after-quiet conversation.
                new DialogueNode
                {
                    nodeIndex = 4,
                    requiredClueId = ClueNightBundle,
                    speakerTextEn = "You read the slate, so now you know the size of the water you are standing in. Leave the bundle where the root keeps it. The people it belongs to count it the same way they count everything: by what is missing.",
                    speakerTextTa = "கற்பலகையைப் படித்தீர்கள், எனவே இப்போது நீங்கள் நிற்கும் நீரின் அளவையும் அறிந்து கொண்டீர்கள். கட்டை பட்டை வைத்திருக்கும் இடத்திலேயே விட்டுவிடுங்கள். அது உரியவர்கள் எல்லாவற்றையும் ஒரே முறையில் கணக்கிடுகிறார்கள்: எதைக் குறைந்ததோ அதன் வழியே.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "By what is missing.",
                            choiceTextTa = "எதைக் குறைந்ததோ அதன் வழியே.",
                            nextNodeIndex = -1
                        }
                    }
                },

                // Pointer beat: the gash has been found, so the way out to the deep channel is explained.
                new DialogueNode
                {
                    nodeIndex = 3,
                    requiredClueId = ClueRootGash,
                    speakerTextEn = "So you saw the rope cut. That is a mooring line, not a fishing line. It runs out past the near trees to the creek mouth, where a boat can sit through any tide. That is the direction the water is real at night.",
                    speakerTextTa = "கயிறு கீற்றைப் பார்த்தீர்கள். அது மீன்பிடிக் கயிறல்ல, நங்கூரக் கயிறு. அது அருகிலுள்ள மரங்களைத் தாண்டி கால்வாய்முகம் வரை செல்கிறது, அங்கு ஒரு படகு எந்த ஓதத்திலும் நிற்க முடியும். இரவில் நீர் உண்மையாக இருப்பது அந்தத் திசையில்தான்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I will follow the line.",
                            choiceTextTa = "கயிற்றைப் பின்தொடர்கிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                },

                // Mid beat: the sheen is discovered, so the dock talk opens up.
                new DialogueNode
                {
                    nodeIndex = 2,
                    requiredClueId = ClueKeroseneSheen,
                    speakerTextEn = "The sheen is not ours. We light our lamps with coconut oil and it burns clean. Kerosene in this water means a cargo boat came in with the dark and let its tin touch the rail.",
                    speakerTextTa = "குழைவு எங்களுடையதல்ல. நாங்கள் எங்கள் விளக்குகளைத் தேங்காய் எண்ணெயால் ஏற்றுகிறோம், அது தெளிவாக எரிகிறது. இந்த நீரில் மண்ணெண்ணெய் என்றால் ஒரு சரக்கு படகு இருளுடன் வந்து அதன் டப்பாவைக் கப்பல் கைப்பிடியில் தட்ட விட்டது என்று அர்த்தம்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "A cargo boat? On these creeks?",
                            choiceTextTa = "சரக்கு படகா? இந்த கால்வாய்களில்?",
                            nextNodeIndex = 3
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "And the crates?",
                            choiceTextTa = "பெட்டிகளா?",
                            nextNodeIndex = 3
                        }
                    }
                },

                // Opening beat: no requirement, so this is the entry node before any clue is found.
                new DialogueNode
                {
                    nodeIndex = 0,
                    speakerTextEn = "You came out to the landing. Most people do not walk past the nets. What brings you to mangrove water, visitor?",
                    speakerTextTa = "இறங்கும் துறைக்கு வந்தீர்கள். பெரும்பாலானோர் வலைகளைக் கடந்து நடப்பதில்லை. சதுப்பு நீருக்கு உங்களைக் கொண்டுவந்தது என்ன, விருந்தினரே?",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Mani, is it? The boats here keep odd hours.",
                            choiceTextTa = "மணிதானே? இங்குள்ள படகுகள் விசித்திர நேரங்களில் இயங்குகின்றன.",
                            nextNodeIndex = 1
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "Just looking at the water.",
                            choiceTextTa = "தண்ணீரைப் பார்த்துக்கொண்டுதான் இருக்கிறேன்.",
                            nextNodeIndex = 1
                        }
                    }
                },
                new DialogueNode
                {
                    nodeIndex = 1,
                    speakerTextEn = "The creeks run on the tide, and the tide does not keep office hours. If you are here about the water, stay on the dock until you know which way it turns after dark. I can tell you the nets do not lie.",
                    speakerTextTa = "கால்வாய்கள் ஓதத்தில் ஓடுகின்றன, ஓதம் செயலக நேரம் பார்ப்பதில்லை. நீர் பற்றி வந்திருந்தால், இருளுக்குப் பிறகு எந்தத் திசையில் திரும்புகிறது என்பதை அறியும் வரை கப்பல்துறையில் இருங்கள். வலைகள் பொய் சொல்லாது என்பதை நான் சொல்கிறேன்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Then I will mind the dock.",
                            choiceTextTa = "அப்படியானால் துறையில் கவனமாக இருப்பேன்.",
                            nextNodeIndex = -1
                        }
                    }
                }
            };
        }
    }
}