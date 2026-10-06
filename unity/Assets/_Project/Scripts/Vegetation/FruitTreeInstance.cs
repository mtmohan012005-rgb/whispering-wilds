using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.Inventory;
using WhisperingWilds.Data;
using WhisperingWilds.World;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Vegetation
{
    public enum FruitTreeCycleStage
    {
        Dormant,
        Flowering,
        DevelopingFruit,
        RipeFruit,
        Harvested,
        Regrowing
    }

    /// <summary>
    /// Represents a permanent arboreal entity (e.g. Palmyra palm, Mango, Banana grove, Coconut palm).
    /// The tree mesh remains firmly planted in the scene while fruit clusters visibly transition
    /// through flowering, fruit development, ripening, and harvesting cycles.
    /// </summary>
    [DisallowMultipleComponent]
    public class FruitTreeInstance : MonoBehaviour, IInteractable
    {
        [Header("Tree Identification")]
        [SerializeField] private string plantId = "tree_banana";
        [SerializeField] private FruitTreeCycleStage cycleStage = FruitTreeCycleStage.RipeFruit;
        [SerializeField] private float stageProgress = 0.5f;

        [Header("Sub-Mesh Visuals")]
        [SerializeField] private GameObject blossomVisuals;
        [SerializeField] private GameObject smallFruitVisuals;
        [SerializeField] private GameObject ripeFruitVisuals;

        public string PlantId => plantId;
        public FruitTreeCycleStage CycleStage => cycleStage;
        public bool IsRipe => cycleStage == FruitTreeCycleStage.RipeFruit;

        public event Action<FruitTreeCycleStage> OnCycleChanged;

        private PlantDefinition definition;

        private void Awake()
        {
            definition = PlantCatalog.GetDefinition(plantId);
            UpdateFruitVisuals();
        }

        public void AdvanceTreeCycle(float daysElapsed, TamilNaduSeason season, float soilMoisture)
        {
            float rate = (daysElapsed / definition.regrowthDurationDays);

            // Season match boosts flowering & fruiting
            if (season == definition.preferredSeason)
            {
                rate *= 1.5f;
            }

            stageProgress += rate;
            if (stageProgress >= 1.0f)
            {
                stageProgress = 0.0f;
                AdvanceToNextCycleStage();
            }
        }

        private void AdvanceToNextCycleStage()
        {
            switch (cycleStage)
            {
                case FruitTreeCycleStage.Dormant:
                    cycleStage = FruitTreeCycleStage.Flowering;
                    break;
                case FruitTreeCycleStage.Flowering:
                    cycleStage = FruitTreeCycleStage.DevelopingFruit;
                    break;
                case FruitTreeCycleStage.DevelopingFruit:
                    cycleStage = FruitTreeCycleStage.RipeFruit;
                    break;
                case FruitTreeCycleStage.Harvested:
                    cycleStage = FruitTreeCycleStage.Regrowing;
                    break;
                case FruitTreeCycleStage.Regrowing:
                    cycleStage = FruitTreeCycleStage.Flowering;
                    break;
            }

            UpdateFruitVisuals();
            OnCycleChanged?.Invoke(cycleStage);
        }

        private void UpdateFruitVisuals()
        {
            if (blossomVisuals != null) blossomVisuals.SetActive(cycleStage == FruitTreeCycleStage.Flowering);
            if (smallFruitVisuals != null) smallFruitVisuals.SetActive(cycleStage == FruitTreeCycleStage.DevelopingFruit);
            if (ripeFruitVisuals != null) ripeFruitVisuals.SetActive(cycleStage == FruitTreeCycleStage.RipeFruit);
        }

        // --- IInteractable Implementation ---

        public string InteractionPrompt
        {
            get
            {
                if (definition == null) return string.Empty;

                if (IsRipe)
                {
                    return $"{Localized("interaction.pluck", "Pluck")} {LocalizedPlantName()}";
                }
                return $"{LocalizedPlantName()} ({LocalizedStage(cycleStage)})";
            }
        }

        /// <summary>Tree name follows the active language; English mode shows the English name
        /// only, Tamil mode the Tamil name only.</summary>
        private string LocalizedPlantName()
        {
            var mgr = LocalizationManager.Instance;
            bool tamil = mgr != null && mgr.CurrentLanguage == Language.Tamil;
            return tamil ? definition.tamilName : definition.englishName;
        }

        private static string Localized(string key, string fallback)
        {
            var mgr = LocalizationManager.Instance;
            return mgr != null ? mgr.Get(key) : fallback;
        }

        private static string LocalizedStage(FruitTreeCycleStage stage)
        {
            switch (stage)
            {
                case FruitTreeCycleStage.Dormant: return Localized("veg.stage.dormant", "Dormant");
                case FruitTreeCycleStage.Flowering: return Localized("veg.stage.flowering", "Flowering");
                case FruitTreeCycleStage.DevelopingFruit: return Localized("veg.stage.developing_fruit", "Developing Fruit");
                case FruitTreeCycleStage.RipeFruit: return Localized("veg.stage.ripe", "Ripe");
                case FruitTreeCycleStage.Harvested: return Localized("veg.stage.harvested", "Harvested");
                case FruitTreeCycleStage.Regrowing: return Localized("veg.stage.regrowing", "Regrowing");
                default: return stage.ToString();
            }
        }

        public InteractionType Type => InteractionType.Collect;

        public bool CanInteract(PlayerInteractor interactor)
        {
            return IsRipe;
        }

        public void OnFocusEnter()
        {
        }

        public void OnFocusExit()
        {
        }

        public void Interact(PlayerInteractor interactor)
        {
            if (!CanInteract(interactor)) return;

            int count = UnityEngine.Random.Range(definition.minHarvestYield, definition.maxHarvestYield + 1);

            if (InventoryManager.Instance != null)
            {
                var itemObj = ScriptableObject.CreateInstance<ItemData>();
                itemObj.itemId = definition.harvestItemId;
                itemObj.itemNameEn = definition.englishName;
                itemObj.itemNameTa = definition.tamilName;
                itemObj.category = ItemCategory.Consumable;
                InventoryManager.Instance.AddItem(itemObj, count);
            }

            Debug.Log($"<color=#00FF99><b>[Harvest]</b></color> Plucked {count}x {definition.englishName} from tree!");

            cycleStage = FruitTreeCycleStage.Harvested;
            stageProgress = 0f;
            UpdateFruitVisuals();
            OnCycleChanged?.Invoke(cycleStage);
        }
    }
}
