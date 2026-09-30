using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.Vegetation
{
    [Serializable]
    public class PlantDefinition
    {
        public string plantId;
        public string englishName;
        public string tamilName;
        public PlantCategory category;

        [Header("Growth Cycle")]
        public float totalGrowthDays = 8.0f;     // Standard in-game days to full maturity
        public bool canRegrow = true;
        public float regrowthDurationDays = 3.0f;

        [Header("Ecology & Seasonality")]
        public TamilNaduSeason preferredSeason = TamilNaduSeason.NortheastMonsoon;
        public float dailyWaterRequirement = 0.35f; // Needs rain or irrigation
        public float droughtTolerance = 0.3f;       // Health decay resistance in hot summer

        [Header("Economics & Harvest")]
        public string harvestItemId = "raw_crop";
        public int minHarvestYield = 2;
        public int maxHarvestYield = 5;

        [Header("Regional Whitelist")]
        public List<string> suitableRegions = new List<string>();
    }

    /// <summary>
    /// Authoritative data catalog for Tamil Nadu botanical species.
    /// </summary>
    public static class PlantCatalog
    {
        private static readonly Dictionary<string, PlantDefinition> Catalog = new Dictionary<string, PlantDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            {
                "crop_paddy",
                new PlantDefinition
                {
                    plantId = "crop_paddy",
                    englishName = "Samba Rice Paddy",
                    tamilName = "சாம்பா நெற்பயிர் (Nel)",
                    category = PlantCategory.Crop,
                    totalGrowthDays = 10.0f,
                    canRegrow = false,
                    preferredSeason = TamilNaduSeason.NortheastMonsoon,
                    dailyWaterRequirement = 0.65f, // High water immersion requirement
                    droughtTolerance = 0.15f,
                    harvestItemId = "rice_grain",
                    minHarvestYield = 4,
                    maxHarvestYield = 8,
                    suitableRegions = new List<string> { "delta", "pichavaram" }
                }
            },
            {
                "shrub_tea",
                new PlantDefinition
                {
                    plantId = "shrub_tea",
                    englishName = "Nilgiri Highland Tea",
                    tamilName = "நீலகிரி தேயிலை (Theyilai)",
                    category = PlantCategory.Shrub,
                    totalGrowthDays = 7.0f,
                    canRegrow = true,
                    regrowthDurationDays = 3.0f,
                    preferredSeason = TamilNaduSeason.SouthwestMonsoon,
                    dailyWaterRequirement = 0.40f,
                    droughtTolerance = 0.45f,
                    harvestItemId = "tea_leaves",
                    minHarvestYield = 3,
                    maxHarvestYield = 6,
                    suitableRegions = new List<string> { "nilgiris" }
                }
            },
            {
                "tree_banana",
                new PlantDefinition
                {
                    plantId = "tree_banana",
                    englishName = "Poovan Banana Tree",
                    tamilName = "பூவன் வாழை மரம் (Vazhai)",
                    category = PlantCategory.Fruit,
                    totalGrowthDays = 14.0f,
                    canRegrow = true,
                    regrowthDurationDays = 5.0f,
                    preferredSeason = TamilNaduSeason.NortheastMonsoon,
                    dailyWaterRequirement = 0.50f,
                    droughtTolerance = 0.35f,
                    harvestItemId = "banana_cluster",
                    minHarvestYield = 2,
                    maxHarvestYield = 4,
                    suitableRegions = new List<string> { "delta", "chennai", "mamallapuram" }
                }
            },
            {
                "tree_palmyra",
                new PlantDefinition
                {
                    plantId = "tree_palmyra",
                    englishName = "State Palmyra Palm",
                    tamilName = "தமிழ்நாட்டின் பனை மரம் (Panai)",
                    category = PlantCategory.Tree,
                    totalGrowthDays = 20.0f,
                    canRegrow = true,
                    regrowthDurationDays = 6.0f,
                    preferredSeason = TamilNaduSeason.Summer, // Produces Nungu in peak summer
                    dailyWaterRequirement = 0.15f,           // Extremely drought hardy
                    droughtTolerance = 0.95f,
                    harvestItemId = "palmyra_fruit",
                    minHarvestYield = 3,
                    maxHarvestYield = 6,
                    suitableRegions = new List<string> { "chettinad", "mamallapuram", "delta", "chennai" }
                }
            },
            {
                "veg_brinjal",
                new PlantDefinition
                {
                    plantId = "veg_brinjal",
                    englishName = "Country Brinjal (Eggplant)",
                    tamilName = "நாட்டு கத்தரிக்காய் (Kathirikai)",
                    category = PlantCategory.Vegetable,
                    totalGrowthDays = 6.0f,
                    canRegrow = true,
                    regrowthDurationDays = 2.5f,
                    preferredSeason = TamilNaduSeason.Winter,
                    dailyWaterRequirement = 0.30f,
                    droughtTolerance = 0.40f,
                    harvestItemId = "fresh_brinjal",
                    minHarvestYield = 2,
                    maxHarvestYield = 5,
                    suitableRegions = new List<string> { "delta", "chettinad", "chennai" }
                }
            },
            {
                "veg_tomato",
                new PlantDefinition
                {
                    plantId = "veg_tomato",
                    englishName = "Country Tomato",
                    tamilName = "நாட்டுத் தக்காளி (Thakkali)",
                    category = PlantCategory.Vegetable,
                    totalGrowthDays = 5.0f,
                    canRegrow = true,
                    regrowthDurationDays = 2.0f,
                    preferredSeason = TamilNaduSeason.Winter,
                    dailyWaterRequirement = 0.35f,
                    droughtTolerance = 0.30f,
                    harvestItemId = "fresh_tomato",
                    minHarvestYield = 3,
                    maxHarvestYield = 6,
                    suitableRegions = new List<string> { "delta", "chettinad", "nilgiris" }
                }
            }
        };

        public static PlantDefinition GetDefinition(string plantId)
        {
            if (string.IsNullOrEmpty(plantId)) return Catalog["crop_paddy"];
            if (Catalog.TryGetValue(plantId, out var def)) return def;
            return Catalog["crop_paddy"];
        }

        public static List<PlantDefinition> GetAllDefinitions()
        {
            return new List<PlantDefinition>(Catalog.Values);
        }
    }
}
