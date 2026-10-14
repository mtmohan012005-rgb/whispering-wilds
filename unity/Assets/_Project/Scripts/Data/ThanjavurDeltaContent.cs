using System;
using System.Collections.Generic;
using WhisperingWilds.Data;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Static, stable-identifier registry of the Thanjavur Brihadisvara content: the bronze caster
    /// who works near the temple, the three pieces of evidence the royal quarter yields, and the
    /// single linear quest that walks the player from the temple steps through the library archive
    /// to the workshop where the old records are kept.
    ///
    /// This follows <see cref="PichavaramContent"/> exactly: content is declared once in code so
    /// every save identifier resolves to the same shared instance, and <see cref="EnsureInitialized"/>
    /// is idempotent.
    ///
    /// The temple ledger and the brass seal are invented story props written for this quest. They
    /// reproduce no real artifact or family, and the temple itself is described only at the level
    /// of the public record: an 11th-century Chola granite vimana with bronze casting workshops
    /// and the Saraswathi Mahal Library.
    /// </summary>
    public static class ThanjavurDeltaContent
    {
        public const string RegionId = "thanjavur";

        /// <summary>Stable npc id for the bronze caster who works near the temple.</summary>
        public const string NpcSelvam = "selvam";

        // ---- Clues / evidence --------------------------------------------------

        /// <summary>Temple steps: a faded ledger page listing shipments that match the tea chest ring. First clue.</summary>
        public const string ClueTempleLedger = "clue_thanjavur_temple_ledger";

        /// <summary>Library archive: a brass seal impression matching the wax seal from Pichavaram. Second clue.</summary>
        public const string ClueBrassSeal = "clue_thanjavur_brass_seal";

        /// <summary>Workshop: an unsent dispatch listing names connected to the Chettinad letter. Major evidence.</summary>
        public const string ClueUnsentDispatch = "clue_thanjavur_unsent_dispatch";

        // ---- Items -------------------------------------------------------------

        /// <summary>Temple steps. A torn ledger page with shipment records.</summary>
        public const string ItemTornLedgerPage = "item_thanjavur_torn_ledger_page";

        /// <summary>Library archive. A rubbing of the brass seal impression.</summary>
        public const string ItemSealRubbing = "item_thanjavur_seal_rubbing";

        /// <summary>Workshop. The physical dispatch document.</summary>
        public const string ItemDispatchCopy = "item_thanjavur_dispatch_copy";

        // ---- Quest -------------------------------------------------------------

        /// <summary>
        /// Stable quest id for the Thanjavur investigation chain.
        /// </summary>
        public const string QuestTheTempleRecord = "THANJAVUR_01";

        // ---- Interactable locations and objects ---------------------------------

        /// <summary>The temple entrance. Where travel sets the player down.</summary>
        public const string LocationThanjavurArrival = "location_thanjavur_arrival";

        /// <summary>The Saraswathi Mahal Library reading room.</summary>
        public const string LocationLibraryArchive = "location_thanjavur_library";

        /// <summary>The bronze casting workshop behind the temple.</summary>
        public const string LocationBronzeWorkshop = "location_thanjavur_workshop";

        public const string ObjectTempleSteps = "object_thanjavur_temple_steps";
        public const string ObjectLibraryShelf = "object_thanjavur_library_shelf";
        public const string ObjectWorkshopAnvil = "object_thanjavur_workshop_anvil";
        public const string ObjectWorkshopTable = "object_thanjavur_workshop_table";

        // ---- Discovery log entries ---------------------------------------------

        public const string DiscoveryTempleRecord = "discovery_thanjavur_temple_record";

        // ---- Dialogue ----------------------------------------------------------

        public const string ClueRevealForSelvam = "reveal_selvam_ledger";
        public const string ClueRevealForSelvamAfterSeal = "reveal_selvam_dispatch";

        private static bool initialized;

        public static bool IsInitialized => initialized;

        /// <summary>
        /// Registers all Thanjavur content exactly once. Safe to call repeatedly.
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
                discoveryId = DiscoveryTempleRecord,
                regionId = RegionId,
                titleEn = "The Temple Record",
                titleTa = "கோயிலின் பதிகம்",
                bodyEn = "The Chola temple kept records of every shipment that passed through its gates. The ledger page matches the wax seal from Pichavaram, and the dispatch names the same families found in the Chettinad letter. Whatever network moves goods through the wetlands also moves them through the temple — and the temple has been watching.",
                bodyTa = "சோழர் கோயில் அதன் வாசல்களின் வழியாகக் கடந்த ஒவ்வொரு சரக்கையும் பதிவு செய்து வைத்திருந்தது. பதிகம் பக்கம் பிச்சாவரத்தின் மெழுகு முத்திரையுடன் பொருந்துகிறது, மற்றும் அனுப்புகை செட்டிநாட்டுக் கடிதத்தில் உள்ள அதே குடும்பங்களைப் பெயரிடுகிறது. சதுப்பு நிலத்தின் வழியாகச் சரக்குகளை நகர்த்தும் வலையமைப்பு கோயிலின் வழியாகவும் நகர்கிறது — கோயில் கண்காணித்து வருகிறது."
            });
        }

        private static void RegisterItems()
        {
            GameDataCatalog.RegisterItem(
                ItemTornLedgerPage,
                "Torn Ledger Page", "கிழிந்த பதிகம் பக்கம்",
                "A page torn from an old temple ledger. It lists shipments with dates and a wax-stamped ring identical to the one found on the tea chests.",
                "பழைய கோயில் பதிகத்திலிருந்து கிழிந்த ஒரு பக்கம். தேநீர் பெட்டிகளில் உள்ள அதே மெழுகு வளைய முத்திரையுடன் தேதிகளுடன் சரக்குகளைப் பட்டியலிடுகிறது.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.05f);

            GameDataCatalog.RegisterItem(
                ItemSealRubbing,
                "Seal Rubbing", "முத்திரை அச்சு",
                "A charcoal rubbing of the brass seal found in the library archive. The ring pattern matches the wax seal from the Pichavaram bundle.",
                "சரஸ்வதி மகால் நூலகக் காப்பகத்தில் கிடைத்த வெண்கல முத்திரையின் கரி அச்சு. வளைய வடிவம் பிச்சாவரம் கட்டியின் மெழுகு முத்திரையுடன் பொருந்துகிறது.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.03f);

            GameDataCatalog.RegisterItem(
                ItemDispatchCopy,
                "Dispatch Copy", "அனுப்புகை நகல்",
                "A copy of an unsent dispatch listing names and routes. The names connect to the families mentioned in the Chettinad unsent letter.",
                "பெயர்களையும் வழிகளையும் பட்டியலிட்ட அனுப்பப்படாத அனுப்புகையின் நகல். பெயர்கள் செட்டிநாட்டு அனுப்பப்படாத கடிதத்தில் குறிப்பிடப்பட்ட குடும்பங்களுடன் இணைகின்றன.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.08f);
        }

        private static void RegisterClues()
        {
            // First clue. Linked forward to the brass seal so holding both unlocks the deduction.
            GameDataCatalog.RegisterClue(
                ClueTempleLedger,
                "Temple Ledger Page", "கோயில் பதிகம் பக்கம்",
                "On the temple steps, a torn ledger page lies half-buried in dust. It lists shipments with dates, quantities, and a wax-stamped ring — the same narrow ring found on the tea chests in George Town.",
                "கோயில் படிகங்களில், ஒரு கிழிந்த பதிகம் பக்கம் தூளில் பாதியாகக் புதைந்திருக்கிறது. தேதிகள், அளவுகள் மற்றும் ஒரு மெழுகு வளைய முத்திரையுடன் சரக்குகளைப் பட்டியலிடுகிறது — ஜார்ஜ் டவுனின் தேநீர் பெட்டிகளில் உள்ள அதே குறுகிய வளையம்.",
                ClueType.Document, RegionId,
                relatedClueId: ClueBrassSeal,
                deductionNoteEn: "The temple ledger uses the same seal as the tea chests. Whatever network controls the shipments also controls the temple records.",
                deductionNoteTa: "கோயில் பதிகம் தேநீர் பெட்டிகளின் அதே முத்திரையைப் பயன்படுத்துகிறது. சரக்குகளைக் கட்டுப்படுத்தும் வலையமைப்பு கோயில் பதிவுகளையும் கட்டுப்படுத்துகிறது.");

            // Second clue: the brass seal in the library archive.
            GameDataCatalog.RegisterClue(
                ClueBrassSeal,
                "Brass Seal Impression", "வெண்கல முத்திரை அச்சு",
                "In the library archive, a brass seal sits behind a shelf of old folios. Its ring pattern matches the wax seal from the Pichavaram bundle and the stamp on the temple ledger.",
                "நூலகக் காப்பகத்தில், பழைய கையெழுத்துப் பிரதிகளின் அலமாரியின் பின்னால் ஒரு வெண்கல முத்திரை இருக்கிறது. அதன் வளைய வடிவம் பிச்சாவரம் கட்டியின் மெழுகு முத்திரையையும் கோயில் பதிகத்தின் முத்திரையையும் பொருந்துகிறது.",
                ClueType.PhysicalEvidence, RegionId,
                relatedClueId: ClueTempleLedger,
                deductionNoteEn: "Three seals, one pattern: the tea chests, the Pichavaram bundle, and the temple ledger all use the same mark. This is a single network, not separate operations.",
                deductionNoteTa: "மூன்று முத்திரைகள், ஒரு வடிவம்: தேநீர் பெட்டிகள், பிச்சாவரம் கட்டி மற்றும் கோயில் பதிகம் அனைத்தும் அதே அடையாளத்தைப் பயன்படுத்துகின்றன. இது ஒரு வலையமைப்பு, தனித்தனி செயல்பாடுகள் அல்ல.");

            // Major evidence. Invented story prop written for this quest.
            GameDataCatalog.RegisterClue(
                ClueUnsentDispatch,
                "The Unsent Dispatch", "அனுப்பப்படாத அறிக்கை",
                "In the bronze workshop, a dispatch lies on the anvil table, never sealed for sending. It lists names, routes, and quantities — connecting the Chettinad families to the temple shipments and the Pichavaram night current. The dispatch was meant for the High Court, but whoever wrote it changed their mind.",
                "வெண்கலத் தொழிற்சாலையில், ஒரு அறிக்கை தட்டி மேசையில் கிடக்கிறது, அனுப்ப மூடப்படவில்லை. பெயர்கள், வழிகள் மற்றும் அளவுகளைப் பட்டியலிடுகிறது — செட்டிநாட்டுக் குடும்பங்களை கோயில் சரக்குகள் மற்றும் பிச்சாவரம் இரவு ஓட்டத்துடன் இணைக்கிறது. அறிக்கை உயர்நீதிமன்றத்திற்காக எழுதப்பட்டது, ஆனால் எழுதியவர் மனம் மாறினார்.",
                ClueType.Document, RegionId,
                relatedClueId: ClueBrassSeal,
                deductionNoteEn: "The dispatch connects every thread: Chettinad families, temple shipments, Pichavaram cargo, and the tea ledger. Someone inside the network tried to expose it, then stopped. The question is why.",
                deductionNoteTa: "அறிக்கை ஒவ்வொரு நூலையும் இணைக்கிறது: செட்டிநாட்டுக் குடும்பங்கள், கோயில் சரக்குகள், பிச்சாவரம் சரக்கு மற்றும் தேநீர் பதிகம். வலையமைப்பிற்குள் ஒருவர் அதை வெளிப்படுத்த முயற்சித்தார், பின்னர் நிறுத்தினார். ஏன் என்பது கேள்வி.",
                isKeyLead: true);
        }

        private static void RegisterQuests()
        {
            // One objective per stage, following the same strictly-linear shape as the other regions.
            GameDataCatalog.RegisterQuest(
                QuestTheTempleRecord,
                "The Temple Record", "கோயிலின் பதிகம்",
                "The bronze caster near the Brihadisvara temple knows more about the old records than he lets on. Find what the temple ledger says about the shipments crossing Tamil Nadu.",
                "பிரகதிசுவரர் கோயிலருகே உள்ள வெண்கலக் கலைஞர் பழைய பதிவுகள் பற்றி அவர் காட்டுவதை விட அதிகமாக அறிவார். தமிழ்நாட்டைக் கடக்கும் சரக்குகள் பற்றி கோயில் பதிகம் என்ன சொல்கிறது என்பதைக் கண்டறியுங்கள்.",
                RegionId,
                new[]
                {
                    Stage(0, "Arrival", "வருகை",
                        Objective("travel_thanjavur", QuestObjectiveType.ReachLocation, LocationThanjavurArrival,
                            "Travel to Thanjavur.", "தஞ்சாவூருக்குச் செல்லவும்.")),

                    Stage(1, "The Bronze Caster", "வெண்கலக் கலைஞர்",
                        Objective("meet_selvam", QuestObjectiveType.TalkToNPC, NpcSelvam,
                            "Meet Selvam at the workshop.", "தொழிற்சாலையில் செல்வத்தைச் சந்தியுங்கள்.")),

                    Stage(2, "The Temple Steps", "கோயில் படிகள்",
                        Objective("investigate_temple", QuestObjectiveType.InvestigateObject, ObjectTempleSteps,
                            "Examine the temple steps for records.", "பதிவுகளுக்காக கோயில் படிகளை ஆராயுங்கள்.")),

                    Stage(3, "The Ledger Page", "பதிகம் பக்கம்",
                        Objective("first_clue", QuestObjectiveType.DiscoverClue, ClueTempleLedger,
                            "Find the torn ledger page.", "கிழிந்த பதிகம் பக்கத்தைக் கண்டறியுங்கள்.")),

                    Stage(4, "The Library", "நூலகம்",
                        Objective("reach_library", QuestObjectiveType.ReachLocation, LocationLibraryArchive,
                            "Enter the Saraswathi Mahal Library.", "சரஸ்வதி மகால் நூலகத்திற்குள் செல்லவும்.")),

                    Stage(5, "The Seal", "முத்திரை",
                        Objective("second_clue", QuestObjectiveType.DiscoverClue, ClueBrassSeal,
                            "Find the brass seal impression.", "வெண்கல முத்திரை அச்சைக் கண்டறியுங்கள்.")),

                    Stage(6, "The Workshop", "தொழிற்சாலை",
                        Objective("reach_workshop", QuestObjectiveType.ReachLocation, LocationBronzeWorkshop,
                            "Return to Selvam's workshop.", "செல்வத்தின் தொழிற்சாலைக்குத் திரும்பவும்.")),

                    Stage(7, "The Dispatch", "அறிக்கை",
                        Objective("major_evidence", QuestObjectiveType.DiscoverClue, ClueUnsentDispatch,
                            "Find the unsent dispatch.", "அனுப்பப்படாத அறிக்கையைக் கண்டறியுங்கள்.")),

                    Stage(8, "The Anvil", "தட்டி",
                        Objective("investigate_anvil", QuestObjectiveType.InvestigateObject, ObjectWorkshopAnvil,
                            "Examine the workshop anvil for clues.", "தொழிற்சாலை தட்டியை ஆராயுங்கள்.")),

                    Stage(9, "Recorded", "பதிவு செய்யப்பட்டது",
                        Objective("record_discovery", QuestObjectiveType.InvestigateObject, ObjectWorkshopTable,
                            "Record the discovery with Selvam.", "செல்வத்துடன் கண்டுபிடிப்பைப் பதிவு செய்யவும்."))
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
        /// Selvam's conversation at the Thanjavur workshop. Later beats are gated behind
        /// <see cref="requiredClueId"/>, so the library pointer is only offered once the ledger
        /// page is found, and the closing beat only after the dispatch is read.
        /// </summary>
        public static List<DialogueNode> BuildDialogueFor(string npcId)
        {
            if (!string.Equals(npcId, NpcSelvam, StringComparison.OrdinalIgnoreCase))
            {
                return new List<DialogueNode>();
            }

            return new List<DialogueNode>
            {
                // Closing beat: the dispatch has been read.
                new DialogueNode
                {
                    nodeIndex = 4,
                    requiredClueId = ClueUnsentDispatch,
                    speakerTextEn = "You read the dispatch. Now you see the whole path: from the tea kadai to the wetlands, through the temple, to the mansion that keeps its doors locked. My grandfather wrote that dispatch. He stopped before he sealed it, because the people in those names were not far away. They were in the next room.",
                    speakerTextTa = "அறிக்கையைப் படித்தீர்கள். இப்போது முழு வழியையும் பார்க்கிறீர்கள்: தேநீர் கடையிலிருந்து சதுப்பு நிலத்திற்கு, கோயிலின் வழியாக, கதவுகளைப் பூட்டி வைக்கும் மாளிகைக்கு. என் தாத்தா அந்த அறிக்கையை எழுதினார். முத்திரை வைப்பதற்கு முன் நிறுத்தினார், அந்தப் பெயர்களில் உள்ள மக்கள் தொலைவில் இல்லை. அடுத்த அறையில் இருந்தனர்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "The next room.",
                            choiceTextTa = "அடுத்த அறை.",
                            nextNodeIndex = -1
                        }
                    }
                },

                // Pointer beat: the seal has been found, so the workshop is explained.
                new DialogueNode
                {
                    nodeIndex = 3,
                    requiredClueId = ClueBrassSeal,
                    speakerTextEn = "The seal matches, then. You have the ledger and the seal — two pieces of the same mark. Come to the workshop. There is something my grandfather left on the anvil table. He never sent it, but it tells the whole story.",
                    speakerTextTa = "முத்திரை பொருந்துகிறது. பதிகமும் முத்திரையும் உள்ளன — அதே அடையாளத்தின் இரண்டு பகுதிகள். தொழிற்சாலைக்கு வா. என் தாத்தா தட்டி மேசையில் விட்டுச் சென்ற ஒன்று உள்ளது. அவர் அனுப்பவில்லை, ஆனால் முழு கதையையும் சொல்கிறது.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I will come to the workshop.",
                            choiceTextTa = "தொழிற்சாலைக்கு வருகிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                },

                // Mid beat: the ledger is discovered.
                new DialogueNode
                {
                    nodeIndex = 2,
                    requiredClueId = ClueTempleLedger,
                    speakerTextEn = "You found the ledger page. That ring on the stamp — I have seen it before. The library keeps the brass seal that made it. If you can match them, you will know whose mark this is.",
                    speakerTextTa = "பதிகம் பக்கத்தைக் கண்டறிந்தீர்கள். முத்திரையின் அந்த வளையம் — நான் முன்பு பார்த்தேன். நூலகம் அதை உருவாக்கிய வெண்கல முத்திரையை வைத்திருக்கிறது. அவை பொருந்தினால், யாரின் அடையாளம் என்பதை அறிவீர்கள்.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "The library seal?",
                            choiceTextTa = "நூலக முத்திரையா?",
                            nextNodeIndex = 3
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "Whose mark?",
                            choiceTextTa = "யாரின் அடையாளம்?",
                            nextNodeIndex = 3
                        }
                    }
                },

                // Opening beat: no requirement.
                new DialogueNode
                {
                    nodeIndex = 0,
                    speakerTextEn = "You have come to the temple quarter. Most visitors look at the vimana and leave. You are looking at the steps. What do you see down there, visitor?",
                    speakerTextTa = "கோயில் பகுதிக்கு வந்துள்ளீர்கள். பெரும்பாலான பயணிகள் விமானத்தைப் பார்த்துச் சென்றுவிடுகிறார்கள். நீங்கள் படிகளைப் பார்க்கிறீர்கள். கீழே என்ன பார்க்கிறீர்கள், பயணி?",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "Selvam, is it? I am looking for records.",
                            choiceTextTa = "செல்வம் தானே? பதிவுகளைத் தேடுகிறேன்.",
                            nextNodeIndex = 1
                        },
                        new DialogueChoice
                        {
                            choiceTextEn = "Just examining the temple.",
                            choiceTextTa = "கோயிலை ஆராய்வது மட்டுமே.",
                            nextNodeIndex = 1
                        }
                    }
                },
                new DialogueNode
                {
                    nodeIndex = 1,
                    speakerTextEn = "Records. The temple keeps more than prayers. If you are looking for what passes through these gates, start with the steps — the dust keeps what the wind does not take.",
                    speakerTextTa = "பதிவுகள். கோயில் பிரார்த்தனைகளை விட அதிகமாக வைத்திருக்கிறது. இந்த வாசல்களின் வழியாக என்ன கடக்கிறது என்பதைத் தேடுகிறீர்கள் என்றால், படிகளில் தொடங்குங்கள் — காற்று எடுக்காததை தூள் வைத்திருக்கிறது.",
                    choices = new List<DialogueChoice>
                    {
                        new DialogueChoice
                        {
                            choiceTextEn = "I will check the steps.",
                            choiceTextTa = "படிகளைச் சரிபார்க்கிறேன்.",
                            nextNodeIndex = -1
                        }
                    }
                }
            };
        }
    }
}
