using System;
using UnityEngine;

namespace WhisperingWilds.World
{
    public enum ClimateZone
    {
        Coastal = 0,    // Chennai, Mamallapuram (Coromandel Coast, high humidity, major NE monsoon)
        Delta = 1,      // Thanjavur, Cauvery Delta (Alluvial, canal-irrigated, fertile, moderate heat)
        Wetland = 2,    // Pichavaram Mangroves (Tidal, brackish estuary, dense moisture)
        Hills = 3,      // Nilgiris Highlands (High elevation 2240m, cool, misty, heavy SW monsoon)
        DryInland = 4,  // Chettinad (Semi-arid granite terrain, high summer heat, rain shadow)
        Forest = 5      // Western Ghats / Anamalai / Mudumalai wildlife sanctuaries (Dense canopy, river streams)
    }

    [Serializable]
    public class RegionalClimateData
    {
        public ClimateZone climateZone;
        public string regionId;
        public string regionName;

        [Header("Thermal Properties (°Celsius)")]
        public float baseTemperature = 30f;
        public float summerTemperatureModifier = 6f;   // Up to 36-40°C in Summer
        public float winterTemperatureModifier = -5f;  // Down in Winter (e.g. Nilgiris can drop to 8-14°C)
        public float diurnalRange = 8f;                // Day-to-night temperature swing

        [Header("Atmospheric Conditions")]
        [Range(0f, 1f)] public float baseHumidity = 0.65f;
        [Range(0f, 1f)] public float coastalHumidityBonus = 0.2f;
        [Range(0f, 1f)] public float baseCloudProbability = 0.3f;
        public float averageWindSpeed = 12f; // km/h

        [Header("Monsoon Precipitation Probabilities")]
        [Range(0f, 1f)] public float southwestMonsoonRainChance = 0.35f; // Heavy in Hills (Nilgiris), low in East
        [Range(0f, 1f)] public float northeastMonsoonRainChance = 0.65f; // Heavy in Coastal & Delta, moderate elsewhere
        [Range(0f, 1f)] public float drySeasonRainChance = 0.05f;

        [Header("Ecology & Growth Modifiers")]
        public float plantGrowthMultiplier = 1.0f;
        public float soilMoistureEvaporationRate = 0.05f; // Per day
        public float animalActivityMultiplier = 1.0f;
        public float waterAvailability = 1.0f;
    }

    /// <summary>
    /// Static catalog providing authentic climate data for each Tamil Nadu region.
    /// </summary>
    public static class RegionalClimateCatalog
    {
        public static RegionalClimateData GetProfileForRegion(string regionId)
        {
            if (string.IsNullOrEmpty(regionId)) regionId = "chennai";
            regionId = regionId.ToLowerInvariant();

            if (regionId.Contains("nilgiri"))
            {
                // High altitude Shola-Tea Montane Biosphere
                return new RegionalClimateData
                {
                    climateZone = ClimateZone.Hills,
                    regionId = "nilgiris",
                    regionName = "Nilgiris Biosphere",
                    baseTemperature = 16f,
                    summerTemperatureModifier = 4f,
                    winterTemperatureModifier = -8f, // Cold winter nights (8°C)
                    diurnalRange = 10f,
                    baseHumidity = 0.82f,
                    coastalHumidityBonus = 0f,
                    baseCloudProbability = 0.6f,
                    averageWindSpeed = 22f,
                    southwestMonsoonRainChance = 0.85f, // Catchment of SW monsoon
                    northeastMonsoonRainChance = 0.40f,
                    drySeasonRainChance = 0.10f,
                    plantGrowthMultiplier = 1.15f,
                    soilMoistureEvaporationRate = 0.02f,
                    animalActivityMultiplier = 1.1f,
                    waterAvailability = 1.5f
                };
            }
            else if (regionId.Contains("pichavaram"))
            {
                // Estuarine Mangrove Wetland
                return new RegionalClimateData
                {
                    climateZone = ClimateZone.Wetland,
                    regionId = "pichavaram",
                    regionName = "Pichavaram Mangroves",
                    baseTemperature = 31f,
                    summerTemperatureModifier = 5f,
                    winterTemperatureModifier = -4f,
                    diurnalRange = 6f,
                    baseHumidity = 0.88f,
                    coastalHumidityBonus = 0.1f,
                    baseCloudProbability = 0.45f,
                    averageWindSpeed = 16f,
                    southwestMonsoonRainChance = 0.30f,
                    northeastMonsoonRainChance = 0.75f,
                    drySeasonRainChance = 0.05f,
                    plantGrowthMultiplier = 1.25f,
                    soilMoistureEvaporationRate = 0.03f,
                    animalActivityMultiplier = 1.0f,
                    waterAvailability = 2.0f
                };
            }
            else if (regionId.Contains("delta") || regionId.Contains("thanjavur"))
            {
                // Alluvial Agri-Basin
                return new RegionalClimateData
                {
                    climateZone = ClimateZone.Delta,
                    regionId = "delta",
                    regionName = "Cauvery Delta",
                    baseTemperature = 32f,
                    summerTemperatureModifier = 6f,
                    winterTemperatureModifier = -5f,
                    diurnalRange = 9f,
                    baseHumidity = 0.70f,
                    coastalHumidityBonus = 0.05f,
                    baseCloudProbability = 0.35f,
                    averageWindSpeed = 14f,
                    southwestMonsoonRainChance = 0.35f,
                    northeastMonsoonRainChance = 0.70f,
                    drySeasonRainChance = 0.04f,
                    plantGrowthMultiplier = 1.4f, // Prime agricultural conditions
                    soilMoistureEvaporationRate = 0.04f,
                    animalActivityMultiplier = 0.95f,
                    waterAvailability = 1.4f
                };
            }
            else if (regionId.Contains("chettinad"))
            {
                // Semi-Arid Heritage Plains
                return new RegionalClimateData
                {
                    climateZone = ClimateZone.DryInland,
                    regionId = "chettinad",
                    regionName = "Chettinad Heartland",
                    baseTemperature = 34f,
                    summerTemperatureModifier = 7f, // Hot summer (41°C)
                    winterTemperatureModifier = -6f,
                    diurnalRange = 12f,
                    baseHumidity = 0.45f,
                    coastalHumidityBonus = 0f,
                    baseCloudProbability = 0.20f,
                    averageWindSpeed = 10f,
                    southwestMonsoonRainChance = 0.20f, // Rain shadow
                    northeastMonsoonRainChance = 0.45f,
                    drySeasonRainChance = 0.02f,
                    plantGrowthMultiplier = 0.85f,
                    soilMoistureEvaporationRate = 0.08f, // Fast drying
                    animalActivityMultiplier = 0.85f,
                    waterAvailability = 0.6f
                };
            }
            else if (regionId.Contains("mamallapuram"))
            {
                // Coastal Granite Shore
                return new RegionalClimateData
                {
                    climateZone = ClimateZone.Coastal,
                    regionId = "mamallapuram",
                    regionName = "Mamallapuram Coast",
                    baseTemperature = 31f,
                    summerTemperatureModifier = 5f,
                    winterTemperatureModifier = -4f,
                    diurnalRange = 7f,
                    baseHumidity = 0.80f,
                    coastalHumidityBonus = 0.15f,
                    baseCloudProbability = 0.30f,
                    averageWindSpeed = 20f, // Coastal sea breeze
                    southwestMonsoonRainChance = 0.25f,
                    northeastMonsoonRainChance = 0.80f, // Strong coastal cyclone season
                    drySeasonRainChance = 0.03f,
                    plantGrowthMultiplier = 0.95f,
                    soilMoistureEvaporationRate = 0.05f,
                    animalActivityMultiplier = 0.9f,
                    waterAvailability = 1.1f
                };
            }

            // Default: Chennai Coastal
            return new RegionalClimateData
            {
                climateZone = ClimateZone.Coastal,
                regionId = "chennai",
                regionName = "Chennai Urban Coast",
                baseTemperature = 32f,
                summerTemperatureModifier = 6f,
                winterTemperatureModifier = -4f,
                diurnalRange = 7f,
                baseHumidity = 0.78f,
                coastalHumidityBonus = 0.15f,
                baseCloudProbability = 0.35f,
                averageWindSpeed = 16f,
                southwestMonsoonRainChance = 0.30f,
                northeastMonsoonRainChance = 0.80f,
                drySeasonRainChance = 0.03f,
                plantGrowthMultiplier = 1.0f,
                soilMoistureEvaporationRate = 0.06f,
                animalActivityMultiplier = 0.9f,
                waterAvailability = 1.0f
            };
        }
    }
}
