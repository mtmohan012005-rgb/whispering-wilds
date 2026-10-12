using System;
using System.Collections.Generic;
using WhisperingWilds.Data;
using WhisperingWilds.Investigation;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Static registry of the Nilgiris sanctuary content: the final region where the player
    /// uncovers the hidden sanctuary (Pasumai Thadam) and triggers the campaign ending.
    /// </summary>
    public static class NilgirisSanctuaryContent
    {
        public const string RegionId = "nilgiris";

        // ---- Residents ---------------------------------------------------------
        public const string NpcForestGuide = "forest_guide";
        public const string NpcElder = "nilgiris_elder";

        // ---- Clues -------------------------------------------------------------
        public const string ClueSurveyMarkers = "clue_nilgiris_survey_markers";
        public const string ClueFadedMap = "clue_nilgiris_faded_map";
        public const string ClueOriginalBlueprint = "clue_nilgiris_original_blueprint";

        // ---- Items -------------------------------------------------------------
        public const string ItemSurveyCompass = "item_nilgiris_survey_compass";
        public const string ItemOldJournal = "item_nilgiris_old_journal";
        public const string ItemBlueprintCopy = "item_nilgiris_blueprint_copy";

        // ---- Quest -------------------------------------------------------------
        public const string QuestNilgirisSanctuaryDestiny = "nilgiris_sanctuary_destiny";

        // ---- Locations ---------------------------------------------------------
        public const string LocationSanctuaryArrival = "location_nilgiris_arrival";
        public const string LocationTrailhead = "location_nilgiris_trailhead";
        public const string LocationWatchtower = "location_nilgiris_watchtower";
        public const string LocationSanctuaryEntrance = "location_nilgiris_sanctuary_entrance";
        public const string LocationInnerChamber = "location_nilgiris_inner_chamber";

        // ---- Objects -----------------------------------------------------------
        public const string ObjectSurveyPost = "object_nilgiris_survey_post";
        public const string ObjectWatchtowerMap = "object_nilgiris_watchtower_map";
        public const string ObjectBlueprintPedestal = "object_nilgiris_blueprint_pedestal";
        public const string ObjectSanctuaryAltar = "object_nilgiris_sanctuary_altar";

        // ---- Discoveries -------------------------------------------------------
        public const string DiscoveryOriginalBlueprint = "discovery_nilgiris_original_blueprint";
        public const string DiscoverySanctuaryTruth = "discovery_nilgiris_sanctuary_truth";

        private static bool initialized;
        public static bool IsInitialized => initialized;

        public static void EnsureInitialized()
        {
            if (initialized) return;
            initialized = true;
            RegisterItems();
            RegisterClues();
            RegisterQuests();
            RegisterDiscoveries();
        }

        private static void RegisterItems()
        {
            GameDataCatalog.RegisterItem(
                ItemSurveyCompass, "Survey Compass", "சுற்றிபார்த்தல் கம்பாஸ்",
                "A brass compass left by the original survey team.",
                "முதல் சுற்றிபார்த்தல் குழுவால் விடப்பட்ட வெண்கல கம்பாஸ்.",
                ItemCategory.Tool, baseValue: 30, maxStack: 1, weightKg: 0.2f);

            GameDataCatalog.RegisterItem(
                ItemOldJournal, "Old Journal", "பழைய நாட்குறிப்பு",
                "The journal of a former sanctuary guardian.",
                "முன்னாள் புனிதநிலம் காப்பாளரின் நாட்குறிப்பு.",
                ItemCategory.Material, baseValue: 20, maxStack: 1, weightKg: 0.3f);

            GameDataCatalog.RegisterItem(
                ItemBlueprintCopy, "Blueprint Copy", "வரைபட நகல்",
                "A rubbing copy of the original blueprint found in the sanctuary.",
                "புனிதநிலத்தில் கிடைத்த மூல வரைபடத்தின் நகல்.",
                ItemCategory.Quest, baseValue: 0, maxStack: 1, weightKg: 0.1f);
        }

        private static void RegisterClues()
        {
            GameDataCatalog.RegisterClue(
                ClueSurveyMarkers,
                "Survey Trail Markers", "சுற்றிபார்த்தல் பாதை குறிகள்",
                "Old survey markers along the trail point to a location matching the blueprint.",
                "பாதையில் உள்ள பழைய சுற்றிபார்த்தல் குறிகள் வரைபடத்துடன் பொருந்துகின்றன.",
                ClueType.PhysicalEvidence, RegionId,
                deductionNoteEn: "The survey markers predate the theft, proving the blueprint was known long before.",
                deductionNoteTa: "சுற்றிபார்த்தல் குறிகள் திருட்டுக்கு முந்தையவை, வரைபடம் முன்பே அறியப்பட்டது என்பதை நிரூபிக்கின்றன.",
                isKeyLead: true);

            GameDataCatalog.RegisterClue(
                ClueFadedMap,
                "Faded Watchtower Map", "மங்கிய காவல் கோபுர வரைபடம்",
                "A faded map in the watchtower shows the water channels described in the blueprint.",
                "காவல் கோபுரத்தில் உள்ள மங்கிய வரைபடம் வரைபடத்தில் விவரிக்கப்பட்ட நீர் சேனல்களைக் காட்டுகிறது.",
                ClueType.Document, RegionId,
                deductionNoteEn: "The watchtower map matches the blueprint's water channels, confirming the sanctuary's purpose.",
                deductionNoteTa: "காவல் கோபுர வரைபடம் வரைபடத்தின் நீர் சேனல்களுடன் பொருந்துகிறது.",
                isKeyLead: true);

            GameDataCatalog.RegisterClue(
                ClueOriginalBlueprint,
                "Original Sanctuary Blueprint", "மூல புனிதநிலம் வரைபடம்",
                "The original blueprint, hidden in the sanctuary chamber. Matches the stolen Chennai copy.",
                "மூல வரைபடம், புனிதநிலம் அறையில் மறைக்கப்பட்டது. திருடப்பட்ட சென்னை நகலுடன் பொருந்துகிறது.",
                ClueType.Document, RegionId,
                deductionNoteEn: "The blueprint is the master plan for Pasumai Thadam. The rider stole the copy to protect it.",
                deductionNoteTa: "வரைபடம் பசுமை தடத்திற்கான முக்கிய வடிவமைப்பு. ரைடர் அதைப் பாதுகாக்க நகலைத் திருடினான்.",
                isKeyLead: true);
        }

        private static void RegisterQuests()
        {
            GameDataCatalog.RegisterQuest(
                QuestNilgirisSanctuaryDestiny,
                "The Sanctuary's Destiny", "புனிதநிலத்தின் விதி",
                "Follow the trail to the hidden sanctuary and uncover the truth about the stolen blueprint.",
                "மறைக்கப்பட்ட புனிதநிலத்திற்கு பாதையைப் பின்தொடர்ந்து திருடப்பட்ட வரைபடம் பற்றிய உண்மையைக் கண்டறியுங்கள்.",
                RegionId,
                new[]
                {
                    Stage(0, "The Ascent", "ஏற்றம்",
                        Objective("travel_nilgiris", QuestObjectiveType.ReachLocation, LocationSanctuaryArrival,
                            "Travel to the Nilgiris sanctuary region.", "நீலகிரி புனிதநிலம் பகுதிக்குச் செல்லவும்.")),

                    Stage(1, "The Forest Guide", "வன வழிகாட்டி",
                        Objective("meet_guide", QuestObjectiveType.TalkToNPC, NpcForestGuide,
                            "Meet the forest guide at the trailhead.", "பாதைத் தலையில் வன வழிகாட்டியைச் சந்தியுங்கள்.")),

                    Stage(2, "Survey Trail", "சுற்றிபார்த்தல் பாதை",
                        Objective("reach_trailhead", QuestObjectiveType.ReachLocation, LocationTrailhead,
                            "Follow the trail to the survey markers.", "சுற்றிபார்த்தல் குறிகளுக்கு பாதையைப் பின்தொடரவும்.")),

                    Stage(3, "First Markers", "முதல் குறிகள்",
                        Objective("investigate_survey", QuestObjectiveType.InvestigateObject, ObjectSurveyPost,
                            "Investigate the survey post.", "சுற்றிபார்த்தல் தூணை ஆராயுங்கள்.")),

                    Stage(4, "Trail Evidence", "பாதை சான்று",
                        Objective("first_clue", QuestObjectiveType.DiscoverClue, ClueSurveyMarkers,
                            "Find the survey trail markers.", "சுற்றிபார்த்தல் பாதை குறிகளைக் கண்டறியுங்கள்.")),

                    Stage(5, "The Watchtower", "காவல் கோபுரம்",
                        Objective("reach_watchtower", QuestObjectiveType.ReachLocation, LocationWatchtower,
                            "Climb to the abandoned watchtower.", "தொலைபரப்பான காவல் கோபுரத்திற்கு ஏறுங்கள்.")),

                    Stage(6, "The Faded Map", "மங்கிய வரைபடம்",
                        Objective("investigate_map", QuestObjectiveType.InvestigateObject, ObjectWatchtowerMap,
                            "Investigate the faded map in the watchtower.", "காவல் கோபுரத்தில் உள்ள மங்கிய வரைபடத்தை ஆராயுங்கள்.")),

                    Stage(7, "Map Evidence", "வரைபட சான்று",
                        Objective("map_clue", QuestObjectiveType.DiscoverClue, ClueFadedMap,
                            "Discover the faded watchtower map.", "மங்கிய காவல் கோபுர வரைபடத்தைக் கண்டறியுங்கள்.")),

                    Stage(8, "The Sanctuary Entrance", "புனிதநிலம் நுழைவு",
                        Objective("reach_entrance", QuestObjectiveType.ReachLocation, LocationSanctuaryEntrance,
                            "Find the hidden sanctuary entrance.", "மறைக்கப்பட்ட புனிதநிலம் நுழைவைக் கண்டறியுங்கள்.")),

                    Stage(9, "The Elder's Warning", "முதியவரின் எச்சரிக்கை",
                        Objective("meet_elder", QuestObjectiveType.TalkToNPC, NpcElder,
                            "Speak with the sanctuary elder.", "புனிதநிலம் முதியவருடன் பேசுங்கள்.")),

                    Stage(10, "The Inner Chamber", "உள் அறை",
                        Objective("reach_chamber", QuestObjectiveType.ReachLocation, LocationInnerChamber,
                            "Enter the inner chamber.", "உள் அறைக்குள் நுழையுங்கள்.")),

                    Stage(11, "The Original Blueprint", "மூல வரைபடம்",
                        Objective("investigate_blueprint", QuestObjectiveType.InvestigateObject, ObjectBlueprintPedestal,
                            "Investigate the blueprint pedestal.", "வரைபடத் தூணை ஆராயுங்கள்.")),

                    Stage(12, "The Truth Revealed", "உண்மை வெளிப்படுத்தப்பட்டது",
                        Objective("final_clue", QuestObjectiveType.DiscoverClue, ClueOriginalBlueprint,
                            "Discover the original blueprint.", "மூல வரைபடத்தைக் கண்டறியுங்கள்.")),

                    Stage(13, "The Sanctuary's Fate", "புனிதநிலத்தின் விதி",
                        Objective("make_verdict", QuestObjectiveType.InvestigateObject, ObjectSanctuaryAltar,
                            "Decide the sanctuary's fate.", "புனிதநிலத்தின் விதியை முடிவு செய்யுங்கள்."))
                },
                rewardCoins: 300);
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
            string objectiveId, QuestObjectiveType type, string targetId,
            string descriptionEn, string descriptionTa)
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

        private static void RegisterDiscoveries()
        {
            DiscoveryLog.Register(new DiscoveryDefinition
            {
                discoveryId = DiscoveryOriginalBlueprint,
                regionId = RegionId,
                titleEn = "Original Blueprint Found",
                titleTa = "மூல வரைபடம் கிடைத்தது",
                bodyEn = "The original blueprint of Pasumai Thadam has been found in the Nilgiris sanctuary.",
                bodyTa = "பசுமை தடத்தின் மூல வரைபடம் நீலகிரி புனிதநிலத்தில் கிடைத்துள்ளது."
            });

            DiscoveryLog.Register(new DiscoveryDefinition
            {
                discoveryId = DiscoverySanctuaryTruth,
                regionId = RegionId,
                titleEn = "The Sanctuary's Truth",
                titleTa = "புனிதநிலத்தின் உண்மை",
                bodyEn = "The rider stole the blueprint copy to protect the sanctuary from developers. The sanctuary is real, and its fate is now in your hands.",
                bodyTa = "ரைடர் வளர்ச்சியாளர்களிடமிருந்து புனிதநிலத்தைப் பாதுகாக்க வரைபட நகலைத் திருடினான். புனிதநிலம் உண்மையானது, அதன் விதி இப்போது உங்கள் கையில் உள்ளது."
            });
        }

        public static List<DialogueNode> BuildDialogueFor(string npcId)
        {
            if (string.Equals(npcId, NpcForestGuide, StringComparison.OrdinalIgnoreCase))
            {
                return new List<DialogueNode>
                {
                    new DialogueNode
                    {
                        nodeIndex = 0,
                        speakerTextEn = "You've come far. The trail ahead is old, but the markers still point the way.",
                        speakerTextTa = "நீங்கள் மிகுதூரம் வந்துள்ளீர்கள். முன் உள்ள பாதை பழையது, ஆனால் குறிகள் இன்னும் வழியைக் காட்டுகின்றன.",
                        requiredClueId = null
                    },
                    new DialogueNode
                    {
                        nodeIndex = 1,
                        speakerTextEn = "You found the markers. The watchtower above has more answers.",
                        speakerTextTa = "நீங்கள் குறிகளைக் கண்டறிந்தீர்கள். மேலே உள்ள காவல் கோபுரத்தில் மேலும் பதில்கள் உள்ளன.",
                        requiredClueId = ClueSurveyMarkers
                    },
                    new DialogueNode
                    {
                        nodeIndex = 2,
                        speakerTextEn = "The map matches what I've heard. The sanctuary is real. The elder will decide if you're worthy.",
                        speakerTextTa = "வரைபடம் நான் கேட்ட கதைகளுடன் பொருந்துகிறது. புனிதநிலம் உண்மையானது.",
                        requiredClueId = ClueFadedMap
                    }
                };
            }

            if (string.Equals(npcId, NpcElder, StringComparison.OrdinalIgnoreCase))
            {
                return new List<DialogueNode>
                {
                    new DialogueNode
                    {
                        nodeIndex = 0,
                        speakerTextEn = "Many have sought this place. The blueprint is a promise to the land.",
                        speakerTextTa = "இடத்தைத் தேடிய பலர். அதன் பொருளைக் குறைவாகவே புரிந்துகொள்கிறார்கள்.",
                        requiredClueId = null
                    },
                    new DialogueNode
                    {
                        nodeIndex = 1,
                        speakerTextEn = "You've seen the blueprint. Now choose: protect this place or let the world decide. The altar awaits your verdict.",
                        speakerTextTa = "நீங்கள் வரைபடத்தைக் கண்டீர்கள். இப்போது நீங்கள் தேர்வு செய்ய வேண்டும்.",
                        requiredClueId = ClueOriginalBlueprint
                    }
                };
            }

            return new List<DialogueNode>();
        }
    }
}
