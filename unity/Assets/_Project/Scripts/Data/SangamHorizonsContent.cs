using System;
using System.Collections.Generic;
using WhisperingWilds.Data;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Static code-defined registry of the Sangam Horizons expansion content:
    /// - Regional NPCs: Madurai flower curator (Meenakshi), Kanyakumari lighthouse watchman (Kumaran), and Agasthyamalai herbal botanist (Siddhar Maruthuvar).
    /// - Items, clues, and 3 full narrative investigation quests covering southern Tamil Nadu.
    /// Idempotent registration into GameDataCatalog.
    /// </summary>
    public static class SangamHorizonsContent
    {
        public const string RegionMadurai = "madurai";
        public const string RegionKanyakumari = "kanyakumari";
        public const string RegionAgasthyamalai = "agasthyamalai";

        // ---- NPCs --------------------------------------------------------------
        public const string NpcMeenakshiWeaver = "meenakshi_weaver";
        public const string NpcKumaranNavigator = "kumaran_navigator";
        public const string NpcAgasthiyarBotanist = "agasthiyar_botanist";

        // ---- Items -------------------------------------------------------------
        public const string ItemMaduraiJasmine = "item_madurai_jasmine_garland";
        public const string ItemPalmyraNectar = "item_palmyra_palm_nectar";
        public const string ItemVaigaiScroll = "item_vaigai_copper_scroll";
        public const string ItemAgasthiyarLeaf = "item_agasthiyar_herbal_leaf";

        // ---- Clues -------------------------------------------------------------
        public const string ClueKeeladiSeal = "clue_vaigai_keeladi_seal";
        public const string ClueCurrentChart = "clue_kanyakumari_current_chart";
        public const string ClueHerbalCodex = "clue_agasthyamalai_herbal_codex";

        // ---- Quests ------------------------------------------------------------
        public const string QuestMaduraiJasmine = "SANGAM_01";
        public const string QuestKanyakumariTides = "SANGAM_02";
        public const string QuestAgasthyamalaiCodex = "SANGAM_03";

        private static bool isInitialized = false;

        public static void EnsureInitialized()
        {
            if (isInitialized) return;
            isInitialized = true;

            RegisterItems();
            RegisterClues();
            RegisterQuests();
        }

        private static void RegisterItems()
        {
            GameDataCatalog.RegisterItem(
                ItemMaduraiJasmine,
                "Madurai Jasmine Garland", "மதுரை மல்லிகைப் பூ மாலை",
                "Fragrant GI-tagged Madurai jasmine buds woven into an ceremonial temple garland.",
                "புவிசார் குறியீடு பெற்ற நறுமணமிக்க மதுரை மல்லிகை மாலை.",
                ItemCategory.CraftingMaterial, baseValue: 80, maxStack: 20, weightKg: 0.15f
            );

            GameDataCatalog.RegisterItem(
                ItemPalmyraNectar,
                "Palmyra Palm Nectar", "பனம்பால் / பதனீர்",
                "Refreshing natural sap harvested from coastal Palmyra palm inflorescence.",
                "தென் கடலோரப் பனைமரத்திலிருந்து பெறப்பட்ட இயற்கையான இனிய பதனீர்.",
                ItemCategory.Consumable, baseValue: 40, maxStack: 10, weightKg: 0.5f,
                consumable: true, staminaRestore: 35f, hydrationRestore: 50f
            );

            GameDataCatalog.RegisterItem(
                ItemVaigaiScroll,
                "Vaigai Inscribed Copper Scroll", "வைகை செப்பேடு",
                "Ancient Tamil-Brahmi inscribed plate excavated from the Vaigai river basin.",
                "வைகை நதிப்படுகையில் கண்டெடுக்கப்பட்ட தமிழ்-பிராமி பொறிக்கப்பட்ட தொன்மையான செப்பேடு.",
                ItemCategory.Quest, baseValue: 500, maxStack: 1, weightKg: 1.2f
            );

            GameDataCatalog.RegisterItem(
                ItemAgasthiyarLeaf,
                "Agasthiyar Medicinal Leaf", "அகத்தியர் மூலிகை இலை",
                "Rare high-altitude medicinal leaf prized in Siddha healing traditions.",
                "சித்த மருத்துவ மரபில் போற்றப்படும் அரிய மலை மூலிகை இலை.",
                ItemCategory.CraftingMaterial, baseValue: 120, maxStack: 30, weightKg: 0.05f
            );
        }

        private static void RegisterClues()
        {
            GameDataCatalog.RegisterClue(
                ClueKeeladiSeal,
                "Keeladi Trade Seal", "கீழடி வணிக முத்திரை",
                "Terra-cotta trade seal linking Vaigai merchants with maritime Chola ports.",
                "வைகை வணிகர்களை சோழ துறைமுகங்களுடன் இணைக்கும் சுடுமண் முத்திரை.",
                "The seal proves ancient trade routes connected the inland river basin directly to Mamallapuram.",
                false
            );

            GameDataCatalog.RegisterClue(
                ClueCurrentChart,
                "Cape Tri-Sea Navigational Chart", "முக்கடல் நீரோட்ட வரைபடம்",
                "Hydrological parchment detailing the confluence currents of the Bay of Bengal and Arabian Sea.",
                "வங்கக் கடலும் அரபிக் கடலும் இணையும் முக்கடல் நீரோட்ட வரைபடம்.",
                "Decodes safe passage windows through the southern rocky shoals.",
                false
            );

            GameDataCatalog.RegisterClue(
                ClueHerbalCodex,
                "Agasthiyar Botanical Codex", "அகத்தியர் தாவரவியல் சுவடி",
                "Palm-leaf manuscript documenting the rare nocturnal flora and fauna of the Western Ghats.",
                "மேற்கு தொடர்ச்சி மலையின் அரிய இரவுநேர உயிரினங்களை விவரிக்கும் பனை ஓலைச் சுவடி.",
                "Contains the botanical formula for curing high-altitude shola fatigue.",
                false
            );
        }

        private static void RegisterQuests()
        {
            // Quest 1: Madurai
            GameDataCatalog.RegisterQuest(
                QuestMaduraiJasmine,
                "The Scent of the South", "தென்னக நறுமணம்",
                "Travel to Madurai, consult the weaver at the Meenakshi temple steps, and uncover the Vaigai copper scroll.",
                "மதுரை மீனாட்சி அம்மன் கோயில் படிகளில் நெசவாளரைச் சந்தித்து, வைகை செப்பேட்டை கண்டறியுங்கள்.",
                QuestCategory.Side,
                new List<QuestStage>
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Meet the Flower Weaver",
                        titleTa = "பூக்கட்டுபவரை சந்தியுங்கள்",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "madurai_talk_weaver",
                                descriptionEn = "Speak with Meenakshi the weaver near the temple gopuram.",
                                descriptionTa = "கோயில் கோபுரத்தின் அருகில் உள்ள மீனாட்சியிடம் பேசுங்கள்.",
                                type = QuestObjectiveType.TalkToNPC,
                                targetId = NpcMeenakshiWeaver,
                                requiredCount = 1
                            }
                        }
                    },
                    new QuestStage
                    {
                        stageIndex = 1,
                        titleEn = "Unearth the Vaigai Relic",
                        titleTa = "வைகை தொல்பொருளை கண்டறியுங்கள்",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "madurai_find_scroll",
                                descriptionEn = "Recover the inscribed copper plate from the riverbed.",
                                descriptionTa = "நதிப்படுகையில் இருந்து செப்பேட்டை மீட்டெடுக்கவும்.",
                                type = QuestObjectiveType.DiscoverClue,
                                targetId = ClueKeeladiSeal,
                                requiredCount = 1
                            }
                        }
                    }
                }
            );

            // Quest 2: Kanyakumari
            GameDataCatalog.RegisterQuest(
                QuestKanyakumariTides,
                "Where Three Oceans Meet", "முக்கடல் சங்கமம்",
                "Navigate to Kanyakumari cape and chart the confluence currents with navigator Kumaran.",
                "கன்னியாகுமரி முனையை அடைந்து, மாலுமி குமரனுடன் முக்கடல் நீரோட்டத்தை கணிக்கவும்.",
                QuestCategory.Side,
                new List<QuestStage>
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Consult the Coastal Lighthouse",
                        titleTa = "கலங்கரை விளக்கத்தை அணுகுங்கள்",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "kanya_talk_navigator",
                                descriptionEn = "Speak with Kumaran at the coastal lighthouse.",
                                descriptionTa = "கலங்கரை விளக்கத்தில் மாலுமி குமரனுடன் பேசுங்கள்.",
                                type = QuestObjectiveType.TalkToNPC,
                                targetId = NpcKumaranNavigator,
                                requiredCount = 1
                            }
                        }
                    }
                }
            );

            // Quest 3: Agasthyamalai
            GameDataCatalog.RegisterQuest(
                QuestAgasthyamalaiCodex,
                "The High Shola Codex", "உயர் சோலை சுவடி",
                "Ascend the high shola canopies of Agasthyamalai to document the Slender Loris and uncover the herbal codex.",
                "அகத்தியர் மலையின் சோலைக்காடுகளுக்குச் சென்று தேவாங்குகளை ஆவணப்படுத்தி, மூலிகைச் சுவடியை கண்டறியுங்கள்.",
                QuestCategory.Side,
                new List<QuestStage>
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Track the Nocturnal Loris",
                        titleTa = "இரவுநேர தேவாங்கை தேடுங்கள்",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "agasthya_photo_loris",
                                descriptionEn = "Photograph a Slender Loris under moonlight with your research viewfinder.",
                                descriptionTa = "நிலவொளியில் ஆராய்ச்சி காட்சிக் கருவி மூலம் தேவாங்கை புகைப்படம் எடுக்கவும்.",
                                type = QuestObjectiveType.PhotographTarget,
                                targetId = "slender_loris",
                                requiredCount = 1
                            }
                        }
                    }
                }
            );
        }
    }
}
