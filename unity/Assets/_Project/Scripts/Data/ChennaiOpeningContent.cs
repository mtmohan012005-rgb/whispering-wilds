using System;
using System.Collections.Generic;
using WhisperingWilds.Data;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Static, stable-identifier registry of the Chennai George Town opening content: the two
    /// residents the player meets first, the clues they reveal, the quest those clues advance,
    /// and the recipes the player can craft.
    ///
    /// Content is declared once here in code (following the existing PlantCatalog and
    /// WildlifeSpeciesCatalog convention) rather than as scattered .asset files, so every save
    /// identifier resolves to the same shared instance on any machine and any load.
    ///
    /// Initialization is idempotent: <see cref="EnsureInitialized"/> is safe to call from tests,
    /// scene bootstrap, and gameplay, and never duplicates registrations.
    /// </summary>
    public static class ChennaiOpeningContent
    {
        public const string RegionId = "chennai";

        // NPC identifiers (match npcId serialized onto the NPCCharacter components).
        public const string NpcMurugan = "murugan";
        public const string NpcVelu = "velu";

        // Clue identifiers.
        public const string ClueMuruganTeaLedger = "clue_murugan_tea_ledger";
        public const string ClueVeluRickshawTally = "clue_velu_rickshaw_tally";
        public const string ClueHighCourtSticker = "clue_highcourt_sticker";

        // Item identifiers.
        public const string ItemFieldNotebook = "item_field_notebook";
        public const string ItemTeaLeaves = "item_tea_leaves";
        public const string ItemFilterCoffee = "item_filter_coffee";
        public const string ItemBambooStick = "item_bamboo_stick";
        public const string ItemPalmJaggery = "item_palm_jaggery";
        public const string ItemPhotograph = "item_photograph";

        // Recipe identifiers.
        public const string RecipeFilterCoffee = "recipe_filter_coffee";
        public const string RecipeFieldNotebook = "recipe_field_notebook";

        // Quest identifiers.
        public const string QuestFirstDayInGeorgeTown = "quest_first_day_george_town";
        public const string QuestTeaLedgerDiscrepancy = "quest_tea_ledger_discrepancy";

        // Interactable location / object identifiers used by ReachLocation and
        // InvestigateObject objectives.
        public const string LocationHighCourtPlaza = "location_highcourt_plaza";
        public const string LocationTeaKadai = "location_murugan_tea_kadai";
        public const string ObjectTeaKadaiLedger = "object_tea_kadai_ledger";
        public const string ObjectHighCourtNoticeBoard = "object_highcourt_notice_board";

        // Photo target identifiers.
        public const string PhotoTargetTeaKadaiStall = "photo_tea_kadai_stall";

        // Dialogue identifiers.
        public const string ClueRevealForMurugan = "reveal_murugan_ledger";
        public const string ClueRevealForVelu = "reveal_velu_tally";
        public const string ClueRevealForMuruganAfterTally = "reveal_murugan_deduction";

        // Pickup identifiers. These are the stable target ids reported as CollectItem events.
        public const string PickupTeaLeaves = "pickup_velu_tea_leaves";
        public const string PickupPalmJaggery = "pickup_palm_jaggery";
        public const string PickupBambooPole = "pickup_bamboo_pole";

        // Location identifiers used for arrival reporting.
        public const string LocationVeluRickshaw = "location_velu_rickshaw";

        private static bool initialized;

        public static bool IsInitialized => initialized;

        /// <summary>
        /// Registers all opening content exactly once. Safe to call repeatedly.
        /// </summary>
        public static void EnsureInitialized()
        {
            if (initialized) return;
            initialized = true;

            RegisterItems();
            RegisterClues();
            RegisterQuests();
            RegisterRecipes();
        }

        private static void RegisterItems()
        {
            GameDataCatalog.RegisterItem(
                ItemFieldNotebook,
                "Field Notebook", "களப்பேணி",
                "Blank pages for recording evidence as you walk.", "நடக்கும்போதாறும் சான்றுகளைப் பதிவு செய்யும் வெற்று பக்கங்கள்.",
                ItemCategory.Tool, baseValue: 40, maxStack: 1, weightKg: 0.4f);

            GameDataCatalog.RegisterItem(
                ItemTeaLeaves,
                "Tea Leaves", "தேயிலை",
                "Fresh Nilgiri tea leaves from Velu's tin.", "வேலுவின் தேங்கிலியிலிருந்து புதிய நீலகிரித் தேயிலைகள்.",
                ItemCategory.Material, baseValue: 12, maxStack: 20, weightKg: 0.1f);

            GameDataCatalog.RegisterItem(
                ItemFilterCoffee,
                "Filter Coffee", "பால் காபி",
                "Decoction coffee served hot at the tea kadai.", "தேய்கடையில் சூடாக வழங்கப்படும் பால் காபி.",
                ItemCategory.Consumable, baseValue: 20, maxStack: 10, weightKg: 0.3f,
                consumable: true, staminaRestore: 12f, hydrationRestore: 8f);

            GameDataCatalog.RegisterItem(
                ItemBambooStick,
                "Bamboo Pole", "மூங்குக் கம்பம்",
                "A cut length of bamboo from the roadside cart.", "சாலைப் பக்க வண்டிலிருந்து வெட்டப்பட்ட மூங்குக் கம்பம்.",
                ItemCategory.Material, baseValue: 8, maxStack: 10, weightKg: 0.8f);

            GameDataCatalog.RegisterItem(
                ItemPalmJaggery,
                "Palm Jaggery", "பனை வெல்லம்",
                "Dark palm jaggery blocks used to sweeten decoction coffee.", "பால் காபியை இனிப்படுத்தப் பயன்படும் கருமையான பனை வெல்லம்.",
                ItemCategory.Material, baseValue: 15, maxStack: 20, weightKg: 0.2f);

            GameDataCatalog.RegisterItem(
                ItemPhotograph,
                "Photograph", "படம்",
                "A captured photograph kept as evidence.", "சான்றாக வைத்திருக்கப்பட படப்பாடு.",
                ItemCategory.Quest, baseValue: 0, maxStack: 30, weightKg: 0.02f);
        }

        private static void RegisterClues()
        {
            // Murugan's clue. Links forward to the notice board clue.
            GameDataCatalog.RegisterClue(
                ClueMuruganTeaLedger,
                "Murugan's Tea Ledger", "முருகனின் தேயிலைப் பதிவேடு",
                "The daily takings page from the tea kadai. Several mornings are crossed out, and a tally mark runs down the margin.",
                "தேய்கடையின் தினசரி வருவாப் பக்கம். சில காலைகள் குறுக்கிடப்பட்டுள்ளன, ஒரு எண்ணைக் குறி வரிசையாக இறங்குகிறது.",
                ClueType.Document, RegionId,
                relatedClueId: ClueHighCourtSticker,
                deductionNoteEn: "The crossed-out mornings line up with the dates on the court notice.",
                deductionNoteTa: "குறுக்கிடப்பட்ட காலைகள் நீதிமன்ற அறிவிப்பின் தேதிகளுடன் பொருந்துகின்றன.",
                isKeyLead: true);

            // Velu's clue. Links to Murugan's ledger, so holding both unlocks the deduction.
            GameDataCatalog.RegisterClue(
                ClueVeluRickshawTally,
                "Velu's Rickshaw Tally", "வேலுவின் ரிக்கா எண்ணிக்கை",
                "Velu keeps a passenger tally scratched into the seat frame. He says the same passengers keep reappearing at dawn.",
                "வேலு ஆசனத்தின் சட்டையில் பயண எண்ணிக்கையைக் குறித்து வைத்திருக்கிறார். அதே பயணிகள் விடியற்காலையில் மீண்டும் வருவதாகக் கூறுகிறார்.",
                ClueType.WitnessTestimony, RegionId,
                relatedClueId: ClueMuruganTeaLedger,
                deductionNoteEn: "The same travellers appear in Murugan's crossed-out mornings.",
                deductionNoteTa: "அதே பயணிகள் முருகனின் குறுக்கிடப்பட்ட காலைகளிலும் காணப்படுகின்றன.");

            // Found by investigating the notice board. Completing the pair with Murugan's ledger.
            GameDataCatalog.RegisterClue(
                ClueHighCourtSticker,
                "Court Notice Board Sticker", "நீதிமன்ற அறிவிப்புப் பலகை அட்டை",
                "A weathered sticker on the High Court notice board announcing a hearing. The date matches the crossed-out ledger entries.",
                "உயர்நீதிமன்ற அறிவிப்புப் பலகையில் ஒட்டப்பட்ட தேய்ந்த அட்டை. அதன் தேதி பதிவேட்டின் குறுக்கிடப்பட்ட பதிவுகளுடன் பொருந்துகிறது.",
                ClueType.ArchaeologicalInscription, RegionId,
                relatedClueId: ClueMuruganTeaLedger,
                deductionNoteEn: "Ledger dates and hearing dates are the same. Someone is using the kadai to time movements.",
                deductionNoteTa: "பதிவேட்டின் தேதிகளும் விசாரணைத் தேதிகளும் ஒன்றே. யாரோ தேய்கடையை இயக்கங்களை நேரப்படுத்தப் பயன்படுத்துகிறார்.",
                isKeyLead: true);
        }

        private static void RegisterQuests()
        {
            // Quest 1 - the arrival beat. Walks the player through the opening loop:
            // meet both residents, record a clue, reach the plaza, investigate, craft, photograph.
            GameDataCatalog.RegisterQuest(
                QuestFirstDayInGeorgeTown,
                "First Day in George Town", "ஜார்ஜ் டவுனில் முதல் நாள்",
                "Arrive in George Town, meet the locals, and start recording what you find.",
                "ஜார்ஜ் டவுனுக்கு வந்து, அங்குள்ளவர்களைச் சந்தித்து, காண்பனவற்றைப் பதிவு செய்யத் தொடங்கவும்.",
                RegionId,
                new[]
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Arrival",
                        titleTa = "வருகை",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "talk_murugan",
                                type = QuestObjectiveType.TalkToNPC,
                                targetId = NpcMurugan,
                                descriptionEn = "Introduce yourself to Murugan at the tea kadai.",
                                descriptionTa = "தேய்கடையில் முருகனிடம் அறிமுகம் செய்துகொள்ளவும்.",
                                requiredCount = 1
                            },
                            new QuestObjective
                            {
                                objectiveId = "talk_velu",
                                type = QuestObjectiveType.TalkToNPC,
                                targetId = NpcVelu,
                                descriptionEn = "Introduce yourself to Velu by the rickshaw.",
                                descriptionTa = "ரிக்கா அருகில் வேலுவிடம் அறிமுகம் செய்துகொள்ளவும்.",
                                requiredCount = 1
                            }
                        }
                    },
                    new QuestStage
                    {
                        stageIndex = 1,
                        titleEn = "First Record",
                        titleTa = "முதல் பதிவு",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "reach_plaza",
                                type = QuestObjectiveType.ReachLocation,
                                targetId = LocationHighCourtPlaza,
                                descriptionEn = "Walk to the High Court plaza and look around.",
                                descriptionTa = "உயர்நீதிமன்ற மைதானத்திற்கு நடந்து சுற்றிப்பார்க்கவும்.",
                                requiredCount = 1
                            },
                            new QuestObjective
                            {
                                objectiveId = "examine_board",
                                type = QuestObjectiveType.InvestigateObject,
                                targetId = ObjectHighCourtNoticeBoard,
                                descriptionEn = "Investigate the court notice board.",
                                descriptionTa = "நீதிமன்ற அறிவிப்புப் பலகையை ஆராய்கவும்.",
                                requiredCount = 1
                            }
                        }
                    },
                    new QuestStage
                    {
                        stageIndex = 2,
                        titleEn = "Evidence",
                        titleTa = "சான்று",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "record_clue",
                                type = QuestObjectiveType.DiscoverClue,
                                targetId = ClueHighCourtSticker,
                                descriptionEn = "Record the notice board sticker as evidence.",
                                descriptionTa = "அறிவிப்புப் பலகை அட்டையைச் சான்றாகப் பதிவு செய்யவும்.",
                                requiredCount = 1
                            },
                            new QuestObjective
                            {
                                objectiveId = "craft_notebook",
                                type = QuestObjectiveType.CraftItem,
                                targetId = RecipeFieldNotebook,
                                descriptionEn = "Craft a field notebook to keep your records.",
                                descriptionTa = "பதிவுகளை வைத்திருக்க களப்பேணியைத் தயாரிக்கவும்.",
                                requiredCount = 1
                            }
                        }
                    },
                    new QuestStage
                    {
                        stageIndex = 3,
                        titleEn = "Documentary Proof",
                        titleTa = "ஆவணப் பாம்பி",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "photograph_stall",
                                type = QuestObjectiveType.PhotographTarget,
                                targetId = PhotoTargetTeaKadaiStall,
                                descriptionEn = "Photograph the tea kadai stall.",
                                descriptionTa = "தேய்கடையின் அடைப்பையைப் படமெடுக்கவும்.",
                                requiredCount = 1
                            }
                        }
                    }
                },
                rewardCoins: 50,
                rewardItemId: ItemFilterCoffee);

            // Quest 2 - the deduction beat. Requires both linked clues, so it cannot complete
            // from a single conversation.
            GameDataCatalog.RegisterQuest(
                QuestTeaLedgerDiscrepancy,
                "The Ledger Discrepancy", "பதிவேட்டின் முரண்பாடு",
                "Compare Murugan's ledger with what Velu remembers, and put the notice board evidence together.",
                "முருகனின் பதிவேட்டை வேலுவின் நினைவுடன் ஒப்பிட்டு, அறிவிப்புப் பலகைச் சான்றை இணைக்கவும்.",
                RegionId,
                new[]
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Two Accounts",
                        titleTa = "இரு கணக்குகள்",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "clue_ledger",
                                type = QuestObjectiveType.DiscoverClue,
                                targetId = ClueMuruganTeaLedger,
                                descriptionEn = "Record Murugan's tea ledger.",
                                descriptionTa = "முருகனின் தேயிலைப் பதிவேட்டைப் பதிவு செய்யவும்.",
                                requiredCount = 1
                            },
                            new QuestObjective
                            {
                                objectiveId = "clue_tally",
                                type = QuestObjectiveType.DiscoverClue,
                                targetId = ClueVeluRickshawTally,
                                descriptionEn = "Record Velu's rickshaw tally.",
                                descriptionTa = "வேலுவின் ரிக்கா எண்ணிக்கையைப் பதிவு செய்யவும்.",
                                requiredCount = 1
                            }
                        }
                    },
                    new QuestStage
                    {
                        stageIndex = 1,
                        titleEn = "Collate",
                        titleTa = "சேர்க்கவும்",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "return_to_murugan",
                                type = QuestObjectiveType.TalkToNPC,
                                targetId = NpcMurugan,
                                descriptionEn = "Return to Murugan with both accounts.",
                                descriptionTa = "இரு கணக்குகளுடன் முருகனிடம் திரும்பவும்.",
                                requiredCount = 1
                            }
                        }
                    }
                },
                rewardCoins: 120,
                rewardItemId: ItemPalmJaggery);
        }

        private static void RegisterRecipes()
        {
            GameDataCatalog.RegisterRecipe(
                RecipeFilterCoffee,
                "Filter Coffee", "பால் காபி",
                "Brew decoction coffee with milk and palm jaggery.",
                "பாலும் பெருக்காய் வெல்லமும் சேர்த்து பால் காபி தயாரிக்கவும்.",
                ItemFilterCoffee, 1,
                new[] { (ItemTeaLeaves, 2), (ItemPalmJaggery, 1) },
                durationSeconds: 2.0f);

            GameDataCatalog.RegisterRecipe(
                RecipeFieldNotebook,
                "Field Notebook", "களப்பேணி",
                "Bind bamboo slats and leftover leaves into a notebook for recording evidence.",
                "மூங்கு மட்டைகளையும் மிச்சமுள்ள இலைகளையும் பொருத்திச் சான்றுகளைப் பதிவு செய்யும் களப்பேணியை உருவாக்கவும்.",
                ItemFieldNotebook, 1,
                new[] { (ItemBambooStick, 1), (ItemTeaLeaves, 2) },
                durationSeconds: 2.5f);
        }

        /// <summary>
        /// Opening conversation for a Chennai resident, built in code so the clue identifiers a
        /// choice reveals are the same constants the quest objectives reference. Returns an empty
        /// list for an unknown resident.
        ///
        /// Murugan's graph has two branches. The second branch is gated behind the clue Velu
        /// reveals, so the deduction conversation is only reachable once both accounts exist.
        /// </summary>
        public static List<DialogueNode> BuildDialogueFor(string npcId)
        {
            if (string.Equals(npcId, NpcMurugan, StringComparison.OrdinalIgnoreCase))
            {
                return new List<DialogueNode>
                {
                    new DialogueNode
                    {
                        nodeIndex = 0,
                        speakerTextEn = "You are not from the neighbourhood. Tea? The stall is open, but the mornings have been strange.",
                        speakerTextTa = "நீங்கள் இப்பகுதியைச் சேர்ந்தவர் அல்ல. தேயா? கடை திறந்துள்ளது, ஆனால் காலைகள் வழக்கத்திற்கு மாறாக நடந்து வருகின்றன.",
                        choices = new List<DialogueChoice>
                        {
                            new DialogueChoice
                            {
                                choiceTextEn = "Strange how?",
                                choiceTextTa = "எப்படி வழக்கத்திற்கு மாறாக?",
                                nextNodeIndex = 1
                            },
                            new DialogueChoice
                            {
                                choiceTextEn = "Show me the day's takings.",
                                choiceTextTa = "இன்றைய வருவாவைக் காட்டுங்கள்.",
                                nextNodeIndex = 2,
                                revealClueId = ClueMuruganTeaLedger
                            }
                        }
                    },
                    new DialogueNode
                    {
                        nodeIndex = 1,
                        speakerTextEn = "Look at the ledger. Whole mornings crossed out, and the same tally mark down the margin again and again.",
                        speakerTextTa = "பதிவேட்டைப் பாருங்கள். முழுக் காலைகள் குறுக்கிடப்பட்டுள்ளன, ஒரே எண்ணைக் குறி வரிசையாக மீண்டும் மீண்டும்.",
                        choices = new List<DialogueChoice>
                        {
                            new DialogueChoice
                            {
                                choiceTextEn = "Crossed out for a reason, then.",
                                choiceTextTa = "அப்படியெனில் ஒரு காரணம் இருந்திருக்கும்.",
                                nextNodeIndex = 2,
                                revealClueId = ClueMuruganTeaLedger
                            }
                        }
                    },
                    new DialogueNode
                    {
                        nodeIndex = 2,
                        speakerTextEn = "Record what you have. The ledger is evidence, not gossip.",
                        speakerTextTa = "நீங்கள் கண்டதைப் பதிவு செய்யுங்கள். பதிவேடு சான்று, வெறும் பேச்சு அல்ல.",
                        choices = new List<DialogueChoice>
                        {
                            new DialogueChoice
                            {
                                choiceTextEn = "One more thing. Someone else keeps the same hours.",
                                choiceTextTa = "இன்னும் ஒன்று. வேறு ஒருவர் அதே நேரங்களில் இருக்கிறார்.",
                                nextNodeIndex = 3,
                                requiredClueId = ClueVeluRickshawTally,
                                revealClueId = ClueHighCourtSticker
                            },
                            new DialogueChoice
                            {
                                choiceTextEn = "I will record it.",
                                choiceTextTa = "அதைப் பதிவு செய்கிறேன்.",
                                nextNodeIndex = -1
                            }
                        }
                    },
                    new DialogueNode
                    {
                        nodeIndex = 3,
                        speakerTextEn = "Velu's rickshaw and my stall do not open at the same hour. Find the notice board before you accuse anyone.",
                        speakerTextTa = "வேலுவின் ரிக்காவும் என் கடையும் ஒரே நேரத்தில் திறப்பதில்லை. யாரையும் குற்றச்சாட்டுவதற்கு முன் அறிவிப்புப் பலகையைக் கண்டுபிடியுங்கள்.",
                        choices = new List<DialogueChoice>
                        {
                            new DialogueChoice
                            {
                                choiceTextEn = "I will check the board.",
                                choiceTextTa = "பலகையைப் பார்க்கிறேன்.",
                                nextNodeIndex = -1
                            }
                        }
                    }
                };
            }

            if (string.Equals(npcId, NpcVelu, StringComparison.OrdinalIgnoreCase))
            {
                return new List<DialogueNode>
                {
                    new DialogueNode
                    {
                        nodeIndex = 0,
                        speakerTextEn = "Auto for hire, sir. But at dawn I am not only carrying passengers.",
                        speakerTextTa = "ஆட்டோ ஏற்றுக்கு, சார். ஆனால் விடியற்காலையில் பயணிகளை மட்டும் கொண்டு செல்லவில்லை.",
                        choices = new List<DialogueChoice>
                        {
                            new DialogueChoice
                            {
                                choiceTextEn = "What else do you carry?",
                                choiceTextTa = "வேறு என்ன கொண்டுசெல்கிறீர்கள்?",
                                nextNodeIndex = 1
                            },
                            new DialogueChoice
                            {
                                choiceTextEn = "Show me the tally.",
                                choiceTextTa = "எண்ணிக்கையைக் காட்டுங்கள்.",
                                nextNodeIndex = 2,
                                revealClueId = ClueVeluRickshawTally
                            }
                        }
                    },
                    new DialogueNode
                    {
                        nodeIndex = 1,
                        speakerTextEn = "Names scratched into the seat frame. The same faces keep coming back before sunrise.",
                        speakerTextTa = "பெயர்கள் ஆசனச் சட்டையில் குறிக்கப்பட்டுள்ளன. அதே முகங்கள் விடியற்காலைக்கு முன்பே மீண்டும் மீண்டும் வருகின்றன.",
                        choices = new List<DialogueChoice>
                        {
                            new DialogueChoice
                            {
                                choiceTextEn = "Then record it. Names are evidence too.",
                                choiceTextTa = "அப்படியானால் பதிவு செய்யுங்கள். பெயர்களும் சான்றுதான்.",
                                nextNodeIndex = 2,
                                revealClueId = ClueVeluRickshawTally
                            }
                        }
                    },
                    new DialogueNode
                    {
                        nodeIndex = 2,
                        speakerTextEn = "Take tea leaves from the tin if you are recording. Fresh Nilgiri, still warm.",
                        speakerTextTa = "பதிவு செய்யுங்கள் என்றால் தேங்கிலியிலிருந்து தேயிலை எடுங்கள். புதிய நீலகிரித் தேயிலை, இன்னும் வெப்பமாக உள்ளது.",
                        choices = new List<DialogueChoice>
                        {
                            new DialogueChoice
                            {
                                choiceTextEn = "Thank you, Velu.",
                                choiceTextTa = "நன்றி, வேலு.",
                                nextNodeIndex = -1
                            }
                        }
                    }
                };
            }

            return new List<DialogueNode>();
        }
    }
}