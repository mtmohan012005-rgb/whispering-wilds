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
                "Madurai Jasmine Garland", "Ã Â®Â®Ã Â®Â¤Ã Â¯ÂÃ Â®Â°Ã Â¯Ë† Ã Â®Â®Ã Â®Â²Ã Â¯ÂÃ Â®Â²Ã Â®Â¿Ã Â®â€¢Ã Â¯Ë†Ã Â®ÂªÃ Â¯Â Ã Â®ÂªÃ Â¯â€š Ã Â®Â®Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†",
                "Fragrant GI-tagged Madurai jasmine buds woven into an ceremonial temple garland.",
                "Ã Â®ÂªÃ Â¯ÂÃ Â®ÂµÃ Â®Â¿Ã Â®Å¡Ã Â®Â¾Ã Â®Â°Ã Â¯Â Ã Â®â€¢Ã Â¯ÂÃ Â®Â±Ã Â®Â¿Ã Â®Â¯Ã Â¯â‚¬Ã Â®Å¸Ã Â¯Â Ã Â®ÂªÃ Â¯â€ Ã Â®Â±Ã Â¯ÂÃ Â®Â± Ã Â®Â¨Ã Â®Â±Ã Â¯ÂÃ Â®Â®Ã Â®Â£Ã Â®Â®Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢ Ã Â®Â®Ã Â®Â¤Ã Â¯ÂÃ Â®Â°Ã Â¯Ë† Ã Â®Â®Ã Â®Â²Ã Â¯ÂÃ Â®Â²Ã Â®Â¿Ã Â®â€¢Ã Â¯Ë† Ã Â®Â®Ã Â®Â¾Ã Â®Â²Ã Â¯Ë†.",
                ItemCategory.Material, baseValue: 80, maxStack: 20, weightKg: 0.15f
            );

            GameDataCatalog.RegisterItem(
                ItemPalmyraNectar,
                "Palmyra Palm Nectar", "Ã Â®ÂªÃ Â®Â©Ã Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Â²Ã Â¯Â / Ã Â®ÂªÃ Â®Â¤Ã Â®Â©Ã Â¯â‚¬Ã Â®Â°Ã Â¯Â",
                "Refreshing natural sap harvested from coastal Palmyra palm inflorescence.",
                "Ã Â®Â¤Ã Â¯â€ Ã Â®Â©Ã Â¯Â Ã Â®â€¢Ã Â®Å¸Ã Â®Â²Ã Â¯â€¹Ã Â®Â°Ã Â®ÂªÃ Â¯Â Ã Â®ÂªÃ Â®Â©Ã Â¯Ë†Ã Â®Â®Ã Â®Â°Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â²Ã Â®Â¿Ã Â®Â°Ã Â¯ÂÃ Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â¯Â Ã Â®ÂªÃ Â¯â€ Ã Â®Â±Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸ Ã Â®â€¡Ã Â®Â¯Ã Â®Â±Ã Â¯ÂÃ Â®â€¢Ã Â¯Ë†Ã Â®Â¯Ã Â®Â¾Ã Â®Â© Ã Â®â€¡Ã Â®Â©Ã Â®Â¿Ã Â®Â¯ Ã Â®ÂªÃ Â®Â¤Ã Â®Â©Ã Â¯â‚¬Ã Â®Â°Ã Â¯Â.",
                ItemCategory.Consumable, baseValue: 40, maxStack: 10, weightKg: 0.5f,
                consumable: true, staminaRestore: 35f, hydrationRestore: 50f
            );

            GameDataCatalog.RegisterItem(
                ItemVaigaiScroll,
                "Vaigai Inscribed Copper Scroll", "Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â¯Ë† Ã Â®Å¡Ã Â¯â€ Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯â€¡Ã Â®Å¸Ã Â¯Â",
                "Ancient Tamil-Brahmi inscribed plate excavated from the Vaigai river basin.",
                "Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â¯Ë† Ã Â®Â¨Ã Â®Â¤Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â¯Ë†Ã Â®Â¯Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â¯â€ Ã Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸ Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â-Ã Â®ÂªÃ Â®Â¿Ã Â®Â°Ã Â®Â¾Ã Â®Â®Ã Â®Â¿ Ã Â®ÂªÃ Â¯Å Ã Â®Â±Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸ Ã Â®Â¤Ã Â¯Å Ã Â®Â©Ã Â¯ÂÃ Â®Â®Ã Â¯Ë†Ã Â®Â¯Ã Â®Â¾Ã Â®Â© Ã Â®Å¡Ã Â¯â€ Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯â€¡Ã Â®Å¸Ã Â¯Â.",
                ItemCategory.Quest, baseValue: 500, maxStack: 1, weightKg: 1.2f
            );

            GameDataCatalog.RegisterItem(
                ItemAgasthiyarLeaf,
                "Agasthiyar Medicinal Leaf", "Ã Â®â€¦Ã Â®â€¢Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â¯Ã Â®Â°Ã Â¯Â Ã Â®Â®Ã Â¯â€šÃ Â®Â²Ã Â®Â¿Ã Â®â€¢Ã Â¯Ë† Ã Â®â€¡Ã Â®Â²Ã Â¯Ë†",
                "Rare high-altitude medicinal leaf prized in Siddha healing traditions.",
                "Ã Â®Å¡Ã Â®Â¿Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤ Ã Â®Â®Ã Â®Â°Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Âµ Ã Â®Â®Ã Â®Â°Ã Â®ÂªÃ Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®ÂªÃ Â¯â€¹Ã Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®â€¦Ã Â®Â°Ã Â®Â¿Ã Â®Â¯ Ã Â®Â®Ã Â®Â²Ã Â¯Ë† Ã Â®Â®Ã Â¯â€šÃ Â®Â²Ã Â®Â¿Ã Â®â€¢Ã Â¯Ë† Ã Â®â€¡Ã Â®Â²Ã Â¯Ë†.",
                ItemCategory.Material, baseValue: 120, maxStack: 30, weightKg: 0.05f
            );
        }

        private static void RegisterClues()
        {
            GameDataCatalog.RegisterClue(
                ClueKeeladiSeal,
                "Keeladi Trade Seal", "Ã Â®â€¢Ã Â¯â‚¬Ã Â®Â´Ã Â®Å¸Ã Â®Â¿ Ã Â®ÂµÃ Â®Â£Ã Â®Â¿Ã Â®â€¢ Ã Â®Â®Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â¯Ë†",
                "Terra-cotta trade seal linking Vaigai merchants with maritime Chola ports.",
                "Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â¯Ë† Ã Â®ÂµÃ Â®Â£Ã Â®Â¿Ã Â®â€¢Ã Â®Â°Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Ë† Ã Â®Å¡Ã Â¯â€¹Ã Â®Â´ Ã Â®Â¤Ã Â¯ÂÃ Â®Â±Ã Â¯Ë†Ã Â®Â®Ã Â¯ÂÃ Â®â€¢Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯ÂÃ Â®Å¸Ã Â®Â©Ã Â¯Â Ã Â®â€¡Ã Â®Â£Ã Â¯Ë†Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Å¡Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â®Â£Ã Â¯Â Ã Â®Â®Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°Ã Â¯Ë†.",
                ClueType.ArchaeologicalInscription, "madurai", null, "The seal proves ancient trade routes connected the inland river basin directly to Mamallapuram.", null, false
            );

            GameDataCatalog.RegisterClue(
                ClueCurrentChart,
                "Cape Tri-Sea Navigational Chart", "Ã Â®Â®Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Å¸Ã Â®Â²Ã Â¯Â Ã Â®Â¨Ã Â¯â‚¬Ã Â®Â°Ã Â¯â€¹Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸ Ã Â®ÂµÃ Â®Â°Ã Â¯Ë†Ã Â®ÂªÃ Â®Å¸Ã Â®Â®Ã Â¯Â",
                "Hydrological parchment detailing the confluence currents of the Bay of Bengal and Arabian Sea.",
                "Ã Â®ÂµÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®â€¢Ã Â¯Â Ã Â®â€¢Ã Â®Å¸Ã Â®Â²Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®â€¦Ã Â®Â°Ã Â®ÂªÃ Â®Â¿Ã Â®â€¢Ã Â¯Â Ã Â®â€¢Ã Â®Å¸Ã Â®Â²Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®â€¡Ã Â®Â£Ã Â¯Ë†Ã Â®Â¯Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Â®Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Å¸Ã Â®Â²Ã Â¯Â Ã Â®Â¨Ã Â¯â‚¬Ã Â®Â°Ã Â¯â€¹Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸ Ã Â®ÂµÃ Â®Â°Ã Â¯Ë†Ã Â®ÂªÃ Â®Å¸Ã Â®Â®Ã Â¯Â.",
                ClueType.Document, "kanyakumari", null, "Decodes safe passage windows through the southern rocky shoals.", null, false
            );

            GameDataCatalog.RegisterClue(
                ClueHerbalCodex,
                "Agasthiyar Botanical Codex", "Ã Â®â€¦Ã Â®â€¢Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â¯Ã Â®Â°Ã Â¯Â Ã Â®Â¤Ã Â®Â¾Ã Â®ÂµÃ Â®Â°Ã Â®ÂµÃ Â®Â¿Ã Â®Â¯Ã Â®Â²Ã Â¯Â Ã Â®Å¡Ã Â¯ÂÃ Â®ÂµÃ Â®Å¸Ã Â®Â¿",
                "Palm-leaf manuscript documenting the rare nocturnal flora and fauna of the Western Ghats.",
                "Ã Â®Â®Ã Â¯â€¡Ã Â®Â±Ã Â¯ÂÃ Â®â€¢Ã Â¯Â Ã Â®Â¤Ã Â¯Å Ã Â®Å¸Ã Â®Â°Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿ Ã Â®Â®Ã Â®Â²Ã Â¯Ë†Ã Â®Â¯Ã Â®Â¿Ã Â®Â©Ã Â¯Â Ã Â®â€¦Ã Â®Â°Ã Â®Â¿Ã Â®Â¯ Ã Â®â€¡Ã Â®Â°Ã Â®ÂµÃ Â¯ÂÃ Â®Â¨Ã Â¯â€¡Ã Â®Â° Ã Â®â€°Ã Â®Â¯Ã Â®Â¿Ã Â®Â°Ã Â®Â¿Ã Â®Â©Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Ë† Ã Â®ÂµÃ Â®Â¿Ã Â®ÂµÃ Â®Â°Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®ÂªÃ Â®Â©Ã Â¯Ë† Ã Â®â€œÃ Â®Â²Ã Â¯Ë†Ã Â®Å¡Ã Â¯Â Ã Â®Å¡Ã Â¯ÂÃ Â®ÂµÃ Â®Å¸Ã Â®Â¿.",
                ClueType.Document, "agasthyamalai", null, "Contains the botanical formula for curing high-altitude shola fatigue.", null, false
            );
        }

        private static void RegisterQuests()
        {
            // Quest 1: Madurai
            GameDataCatalog.RegisterQuest(
                QuestMaduraiJasmine,
                "The Scent of the South", "Ã Â®Â¤Ã Â¯â€ Ã Â®Â©Ã Â¯ÂÃ Â®Â©Ã Â®â€¢ Ã Â®Â¨Ã Â®Â±Ã Â¯ÂÃ Â®Â®Ã Â®Â£Ã Â®Â®Ã Â¯Â",
                "Travel to Madurai, consult the weaver at the Meenakshi temple steps, and uncover the Vaigai copper scroll.",
                "Ã Â®Â®Ã Â®Â¤Ã Â¯ÂÃ Â®Â°Ã Â¯Ë† Ã Â®Â®Ã Â¯â‚¬Ã Â®Â©Ã Â®Â¾Ã Â®Å¸Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿ Ã Â®â€¦Ã Â®Â®Ã Â¯ÂÃ Â®Â®Ã Â®Â©Ã Â¯Â Ã Â®â€¢Ã Â¯â€¹Ã Â®Â¯Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®ÂªÃ Â®Å¸Ã Â®Â¿Ã Â®â€¢Ã Â®Â³Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®Â¨Ã Â¯â€ Ã Â®Å¡Ã Â®ÂµÃ Â®Â¾Ã Â®Â³Ã Â®Â°Ã Â¯Ë†Ã Â®Å¡Ã Â¯Â Ã Â®Å¡Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Â, Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â¯Ë† Ã Â®Å¡Ã Â¯â€ Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯â€¡Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â¯Ë† Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â®Â±Ã Â®Â¿Ã Â®Â¯Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â.",
                "madurai",
                new QuestStage[]
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Meet the Flower Weaver",
                        titleTa = "Ã Â®ÂªÃ Â¯â€šÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®ÂªÃ Â®ÂµÃ Â®Â°Ã Â¯Ë† Ã Â®Å¡Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â¯Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "madurai_talk_weaver",
                                descriptionEn = "Speak with Meenakshi the weaver near the temple gopuram.",
                                descriptionTa = "Ã Â®â€¢Ã Â¯â€¹Ã Â®Â¯Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®â€¢Ã Â¯â€¹Ã Â®ÂªÃ Â¯ÂÃ Â®Â°Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â©Ã Â¯Â Ã Â®â€¦Ã Â®Â°Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®â€°Ã Â®Â³Ã Â¯ÂÃ Â®Â³ Ã Â®Â®Ã Â¯â‚¬Ã Â®Â©Ã Â®Â¾Ã Â®Å¸Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿Ã Â®Â¯Ã Â®Â¿Ã Â®Å¸Ã Â®Â®Ã Â¯Â Ã Â®ÂªÃ Â¯â€¡Ã Â®Å¡Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â.",
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
                        titleTa = "Ã Â®ÂµÃ Â¯Ë†Ã Â®â€¢Ã Â¯Ë† Ã Â®Â¤Ã Â¯Å Ã Â®Â²Ã Â¯ÂÃ Â®ÂªÃ Â¯Å Ã Â®Â°Ã Â¯ÂÃ Â®Â³Ã Â¯Ë† Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â®Â±Ã Â®Â¿Ã Â®Â¯Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "madurai_find_scroll",
                                descriptionEn = "Recover the inscribed copper plate from the riverbed.",
                                descriptionTa = "Ã Â®Â¨Ã Â®Â¤Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â¯Ë†Ã Â®Â¯Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®â€¡Ã Â®Â°Ã Â¯ÂÃ Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â¯Â Ã Â®Å¡Ã Â¯â€ Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯â€¡Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â¯Ë† Ã Â®Â®Ã Â¯â‚¬Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â¯â€ Ã Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â.",
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
                "Where Three Oceans Meet", "Ã Â®Â®Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Å¸Ã Â®Â²Ã Â¯Â Ã Â®Å¡Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â®Ã Â®Â®Ã Â¯Â",
                "Navigate to Kanyakumari cape and chart the confluence currents with navigator Kumaran.",
                "Ã Â®â€¢Ã Â®Â©Ã Â¯ÂÃ Â®Â©Ã Â®Â¿Ã Â®Â¯Ã Â®Â¾Ã Â®â€¢Ã Â¯ÂÃ Â®Â®Ã Â®Â°Ã Â®Â¿ Ã Â®Â®Ã Â¯ÂÃ Â®Â©Ã Â¯Ë†Ã Â®Â¯Ã Â¯Ë† Ã Â®â€¦Ã Â®Å¸Ã Â¯Ë†Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â¯Â, Ã Â®Â®Ã Â®Â¾Ã Â®Â²Ã Â¯ÂÃ Â®Â®Ã Â®Â¿ Ã Â®â€¢Ã Â¯ÂÃ Â®Â®Ã Â®Â°Ã Â®Â©Ã Â¯ÂÃ Â®Å¸Ã Â®Â©Ã Â¯Â Ã Â®Â®Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Å¸Ã Â®Â²Ã Â¯Â Ã Â®Â¨Ã Â¯â‚¬Ã Â®Â°Ã Â¯â€¹Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Ë† Ã Â®â€¢Ã Â®Â£Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â.",
                "madurai",
                new QuestStage[]
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Consult the Coastal Lighthouse",
                        titleTa = "Ã Â®â€¢Ã Â®Â²Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â°Ã Â¯Ë† Ã Â®ÂµÃ Â®Â¿Ã Â®Â³Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Ë† Ã Â®â€¦Ã Â®Â£Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "kanya_talk_navigator",
                                descriptionEn = "Speak with Kumaran at the coastal lighthouse.",
                                descriptionTa = "Ã Â®â€¢Ã Â®Â²Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â°Ã Â¯Ë† Ã Â®ÂµÃ Â®Â¿Ã Â®Â³Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®Â®Ã Â®Â¾Ã Â®Â²Ã Â¯ÂÃ Â®Â®Ã Â®Â¿ Ã Â®â€¢Ã Â¯ÂÃ Â®Â®Ã Â®Â°Ã Â®Â©Ã Â¯ÂÃ Â®Å¸Ã Â®Â©Ã Â¯Â Ã Â®ÂªÃ Â¯â€¡Ã Â®Å¡Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â.",
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
                "The High Shola Codex", "Ã Â®â€°Ã Â®Â¯Ã Â®Â°Ã Â¯Â Ã Â®Å¡Ã Â¯â€¹Ã Â®Â²Ã Â¯Ë† Ã Â®Å¡Ã Â¯ÂÃ Â®ÂµÃ Â®Å¸Ã Â®Â¿",
                "Ascend the high shola canopies of Agasthyamalai to document the Slender Loris and uncover the herbal codex.",
                "Ã Â®â€¦Ã Â®â€¢Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â¯Ã Â®Â°Ã Â¯Â Ã Â®Â®Ã Â®Â²Ã Â¯Ë†Ã Â®Â¯Ã Â®Â¿Ã Â®Â©Ã Â¯Â Ã Â®Å¡Ã Â¯â€¹Ã Â®Â²Ã Â¯Ë†Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¾Ã Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Å¡Ã Â¯Â Ã Â®Å¡Ã Â¯â€ Ã Â®Â©Ã Â¯ÂÃ Â®Â±Ã Â¯Â Ã Â®Â¤Ã Â¯â€¡Ã Â®ÂµÃ Â®Â¾Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Ë† Ã Â®â€ Ã Â®ÂµÃ Â®Â£Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿, Ã Â®Â®Ã Â¯â€šÃ Â®Â²Ã Â®Â¿Ã Â®â€¢Ã Â¯Ë†Ã Â®Å¡Ã Â¯Â Ã Â®Å¡Ã Â¯ÂÃ Â®ÂµÃ Â®Å¸Ã Â®Â¿Ã Â®Â¯Ã Â¯Ë† Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â®Â±Ã Â®Â¿Ã Â®Â¯Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â.",
                "madurai",
                new QuestStage[]
                {
                    new QuestStage
                    {
                        stageIndex = 0,
                        titleEn = "Track the Nocturnal Loris",
                        titleTa = "Ã Â®â€¡Ã Â®Â°Ã Â®ÂµÃ Â¯ÂÃ Â®Â¨Ã Â¯â€¡Ã Â®Â° Ã Â®Â¤Ã Â¯â€¡Ã Â®ÂµÃ Â®Â¾Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Ë† Ã Â®Â¤Ã Â¯â€¡Ã Â®Å¸Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
                        objectives = new List<QuestObjective>
                        {
                            new QuestObjective
                            {
                                objectiveId = "agasthya_photo_loris",
                                descriptionEn = "Photograph a Slender Loris under moonlight with your research viewfinder.",
                                descriptionTa = "Ã Â®Â¨Ã Â®Â¿Ã Â®Â²Ã Â®ÂµÃ Â¯Å Ã Â®Â³Ã Â®Â¿Ã Â®Â¯Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®â€ Ã Â®Â°Ã Â®Â¾Ã Â®Â¯Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿ Ã Â®â€¢Ã Â®Â¾Ã Â®Å¸Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿Ã Â®â€¢Ã Â¯Â Ã Â®â€¢Ã Â®Â°Ã Â¯ÂÃ Â®ÂµÃ Â®Â¿ Ã Â®Â®Ã Â¯â€šÃ Â®Â²Ã Â®Â®Ã Â¯Â Ã Â®Â¤Ã Â¯â€¡Ã Â®ÂµÃ Â®Â¾Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Ë† Ã Â®ÂªÃ Â¯ÂÃ Â®â€¢Ã Â¯Ë†Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â®Â®Ã Â¯Â Ã Â®Å½Ã Â®Å¸Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â.",
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
