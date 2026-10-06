using System;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.Inventory;
using WhisperingWilds.Data;
using WhisperingWilds.World;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Vegetation
{
    /// <summary>
    /// Represents an individual crop or vegetable plant in the world.
    /// Responds to batched growth advances without per-frame Update overhead.
    /// Implements IInteractable for player harvesting.
    /// </summary>
    [DisallowMultipleComponent]
    public class CropInstance : MonoBehaviour, IInteractable
    {
        [Header("Plant Configuration")]
        [SerializeField] private string plantId = "crop_paddy";
        [SerializeField] private GrowthStage currentStage = GrowthStage.Sprout;
        [SerializeField] private float growthProgress = 0.2f; // 0.0 to 1.0 within stage
        [SerializeField] private float plantHealth = 1.0f;
        [SerializeField] private int plantedWorldDay = 1;

        [Header("Visual Stage References")]
        [SerializeField] private GameObject sproutVisual;
        [SerializeField] private GameObject youngVisual;
        [SerializeField] private GameObject matureVisual;
        [SerializeField] private GameObject harvestableFruitVisual;

        public string PlantId => plantId;
        public GrowthStage CurrentStage => currentStage;
        public float GrowthProgress => growthProgress;
        public float Health => plantHealth;
        public bool IsHarvestable => currentStage == GrowthStage.Harvestable;

        public event Action<GrowthStage> OnStageChanged;

        private PlantDefinition definition;

        private void Awake()
        {
            definition = PlantCatalog.GetDefinition(plantId);
            UpdateVisualStage();
        }

        public void Initialize(string id, int currentDay, GrowthStage startingStage = GrowthStage.Seed)
        {
            plantId = id;
            definition = PlantCatalog.GetDefinition(plantId);
            plantedWorldDay = currentDay;
            currentStage = startingStage;
            growthProgress = 0.0f;
            plantHealth = 1.0f;

            UpdateVisualStage();
        }

        /// <summary>
        /// Central simulation tick called by FarmPlot or VegetationManager (no per-frame Update).
        /// </summary>
        public void AdvanceGrowth(float dailyProgressDelta, float soilMoisture, TamilNaduSeason season)
        {
            if (currentStage == GrowthStage.Harvestable) return; // Awaiting harvest

            // 1. Water stress check
            if (soilMoisture < definition.dailyWaterRequirement * 0.5f)
            {
                plantHealth = Mathf.Max(0.1f, plantHealth - (0.15f * (1f - definition.droughtTolerance)));
                dailyProgressDelta *= 0.35f; // Growth stunted
            }
            else
            {
                plantHealth = Mathf.Min(1.0f, plantHealth + 0.1f);
            }

            // 2. Seasonal compatibility bonus/penalty
            if (season == definition.preferredSeason)
            {
                dailyProgressDelta *= 1.4f;
            }

            // 3. Advance stage
            growthProgress += dailyProgressDelta;
            if (growthProgress >= 1.0f)
            {
                growthProgress = 0.0f;
                AdvanceToNextStage();
            }
        }

        private void AdvanceToNextStage()
        {
            switch (currentStage)
            {
                case GrowthStage.Seed:
                    currentStage = GrowthStage.Sprout;
                    break;
                case GrowthStage.Sprout:
                    currentStage = GrowthStage.Young;
                    break;
                case GrowthStage.Young:
                    currentStage = GrowthStage.Mature;
                    break;
                case GrowthStage.Mature:
                    currentStage = GrowthStage.Flowering;
                    break;
                case GrowthStage.Flowering:
                    currentStage = GrowthStage.Fruiting;
                    break;
                case GrowthStage.Fruiting:
                    currentStage = GrowthStage.Harvestable;
                    break;
                case GrowthStage.Harvested:
                    currentStage = definition.canRegrow ? GrowthStage.Regrowing : GrowthStage.Seed;
                    break;
                case GrowthStage.Regrowing:
                    currentStage = GrowthStage.Fruiting;
                    break;
            }

            UpdateVisualStage();
            OnStageChanged?.Invoke(currentStage);
        }

        private void UpdateVisualStage()
        {
            if (sproutVisual != null) sproutVisual.SetActive(currentStage == GrowthStage.Sprout || currentStage == GrowthStage.Seed);
            if (youngVisual != null) youngVisual.SetActive(currentStage == GrowthStage.Young);
            if (matureVisual != null) matureVisual.SetActive(currentStage == GrowthStage.Mature || currentStage == GrowthStage.Flowering || currentStage == GrowthStage.Fruiting || currentStage == GrowthStage.Harvestable);
            if (harvestableFruitVisual != null) harvestableFruitVisual.SetActive(currentStage == GrowthStage.Harvestable);
        }

        // --- IInteractable Implementation ---

        public string InteractionPrompt
        {
            get
            {
                if (definition == null) return string.Empty;

                if (currentStage == GrowthStage.Harvestable)
                {
                    return $"{Localized("interaction.harvest", "Harvest")} {LocalizedPlantName()}";
                }
                return $"{LocalizedPlantName()} ({LocalizedStage(currentStage)})";
            }
        }

        /// <summary>Plant name follows the active language; English mode shows the English name
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

        private static string LocalizedStage(GrowthStage stage)
        {
            switch (stage)
            {
                case GrowthStage.Seed: return Localized("veg.stage.seed", "Seed");
                case GrowthStage.Sprout: return Localized("veg.stage.sprout", "Sprout");
                case GrowthStage.Young: return Localized("veg.stage.young", "Young");
                case GrowthStage.Mature: return Localized("veg.stage.mature", "Mature");
                case GrowthStage.Flowering: return Localized("veg.stage.flowering", "Flowering");
                case GrowthStage.Fruiting: return Localized("veg.stage.fruiting", "Fruiting");
                case GrowthStage.Harvestable: return Localized("veg.stage.harvestable", "Harvestable");
                default: return stage.ToString();
            }
        }

        public InteractionType Type => InteractionType.Collect;

        public bool CanInteract(PlayerInteractor interactor)
        {
            return currentStage == GrowthStage.Harvestable;
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
                // Create or award item
                var itemObj = ScriptableObject.CreateInstance<ItemData>();
                itemObj.itemId = definition.harvestItemId;
                itemObj.itemNameEn = definition.englishName;
                itemObj.itemNameTa = definition.tamilName;
                itemObj.category = ItemCategory.Material;
                InventoryManager.Instance.AddItem(itemObj, count);
            }

            Debug.Log($"<color=#00FF99><b>[Harvest]</b></color> Harvested {count}x {definition.englishName} ({definition.tamilName})");

            currentStage = GrowthStage.Harvested;
            growthProgress = 0f;
            UpdateVisualStage();
            OnStageChanged?.Invoke(currentStage);
        }
    }
}
