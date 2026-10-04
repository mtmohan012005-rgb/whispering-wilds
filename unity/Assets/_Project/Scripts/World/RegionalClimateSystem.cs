using System;
using UnityEngine;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Evaluates current localized temperature, humidity, precipitation odds, and environmental
    /// multipliers based on the active region, current season, and hour of day.
    /// </summary>
    [DisallowMultipleComponent]
    public class RegionalClimateSystem : MonoBehaviour
    {
        public static RegionalClimateSystem Instance { get; private set; }

        [Header("Current Regional State")]
        [SerializeField] private string activeRegionId = "chennai";
        [SerializeField] private RegionalClimateData activeProfile;

        // Dynamic Environmental Metrics
        public float CurrentTemperatureCelsius { get; private set; } = 32f;
        public float CurrentHumidity { get; private set; } = 0.75f;
        public float CurrentWindSpeedKmh { get; private set; } = 15f;
        public float CurrentRainProbability { get; private set; } = 0.3f;
        public float PlantGrowthMultiplier { get; private set; } = 1.0f;
        public float AnimalActivityMultiplier { get; private set; } = 1.0f;
        public float SoilEvaporationRate { get; private set; } = 0.05f;

        public RegionalClimateData ActiveProfile => activeProfile;
        public string ActiveRegionId => activeRegionId;

        public event Action<RegionalClimateData> OnClimateProfileChanged;
        public event Action<float, float> OnConditionsEvaluated; // temperature, humidity

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            SetRegion(activeRegionId);
        }

        private void Start()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged += HandleHourChanged;
                WorldTimeSystem.Instance.OnSeasonChanged += HandleSeasonChanged;
            }

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadCompleted += HandleRegionLoaded;
            }

            EvaluateAtmosphere();
        }

        private void OnDestroy()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged -= HandleHourChanged;
                WorldTimeSystem.Instance.OnSeasonChanged -= HandleSeasonChanged;
            }

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadCompleted -= HandleRegionLoaded;
            }
        }

        public void SetRegion(string regionId)
        {
            activeRegionId = regionId;
            activeProfile = RegionalClimateCatalog.GetProfileForRegion(regionId);
            EvaluateAtmosphere();
            OnClimateProfileChanged?.Invoke(activeProfile);
            Debug.Log($"<color=#00D2FF><b>[RegionalClimateSystem]</b></color> Loaded climate profile: {activeProfile.regionName} ({activeProfile.climateZone})");
        }

        private void HandleRegionLoaded(string newRegionId)
        {
            SetRegion(newRegionId);
        }

        private void HandleHourChanged(int hour)
        {
            EvaluateAtmosphere();
        }

        private void HandleSeasonChanged(TamilNaduSeason season)
        {
            EvaluateAtmosphere();
        }

        /// <summary>
        /// Recalculates temperature, humidity, wind, and rain probability using the current calendar & time.
        /// </summary>
        public void EvaluateAtmosphere()
        {
            if (activeProfile == null)
            {
                activeProfile = RegionalClimateCatalog.GetProfileForRegion(activeRegionId);
            }

            TamilNaduSeason season = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.CurrentSeason : TamilNaduSeason.NortheastMonsoon;
            float hour = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.HourOfDay : 12f;

            // 1. Seasonal Thermal Base
            float tempBase = activeProfile.baseTemperature;
            switch (season)
            {
                case TamilNaduSeason.Summer:
                    tempBase += activeProfile.summerTemperatureModifier;
                    break;
                case TamilNaduSeason.Winter:
                    tempBase += activeProfile.winterTemperatureModifier;
                    break;
                case TamilNaduSeason.SouthwestMonsoon:
                case TamilNaduSeason.NortheastMonsoon:
                    tempBase -= 2.0f; // Evaporative cooling from cloud cover and showers
                    break;
            }

            // 2. Diurnal Solar Curve: Peak at 14:00 (2 PM), lowest at 05:00 (dawn)
            float solarCurve = Mathf.Sin((hour - 8f) / 24f * Mathf.PI * 2f);
            CurrentTemperatureCelsius = tempBase + (solarCurve * (activeProfile.diurnalRange * 0.5f));

            // 3. Humidity (Higher in morning & rainy seasons, boosted near coast)
            float seasonalHumidityBonus = 0f;
            if (season == TamilNaduSeason.NortheastMonsoon) seasonalHumidityBonus = 0.15f;
            else if (season == TamilNaduSeason.SouthwestMonsoon && activeProfile.climateZone == ClimateZone.Hills) seasonalHumidityBonus = 0.20f;
            else if (season == TamilNaduSeason.Summer && activeProfile.climateZone == ClimateZone.DryInland) seasonalHumidityBonus = -0.20f;

            float diurnalHumidityModifier = -solarCurve * 0.10f; // Cooler air has higher relative humidity
            CurrentHumidity = Mathf.Clamp01(activeProfile.baseHumidity + seasonalHumidityBonus + activeProfile.coastalHumidityBonus + diurnalHumidityModifier);

            // 4. Rain Probability based on regional monsoon characteristics
            switch (season)
            {
                case TamilNaduSeason.SouthwestMonsoon:
                    CurrentRainProbability = activeProfile.southwestMonsoonRainChance;
                    break;
                case TamilNaduSeason.NortheastMonsoon:
                    CurrentRainProbability = activeProfile.northeastMonsoonRainChance;
                    break;
                default:
                    CurrentRainProbability = activeProfile.drySeasonRainChance;
                    break;
            }

            // 5. Environmental Modifiers
            PlantGrowthMultiplier = activeProfile.plantGrowthMultiplier;
            if (season == TamilNaduSeason.Summer && CurrentHumidity < 0.5f)
            {
                PlantGrowthMultiplier *= 0.7f; // Water stress without irrigation
            }
            else if (season == TamilNaduSeason.NortheastMonsoon || season == TamilNaduSeason.SouthwestMonsoon)
            {
                PlantGrowthMultiplier *= 1.3f; // Monsoon growth surge
            }

            // Animal activity (Midday summer heat reduces activity; mornings/evenings boost)
            if (season == TamilNaduSeason.Summer && (hour >= 11.5f && hour <= 15.5f))
            {
                AnimalActivityMultiplier = 0.5f; // Seeking shade/rest
            }
            else
            {
                AnimalActivityMultiplier = activeProfile.animalActivityMultiplier;
            }

            SoilEvaporationRate = activeProfile.soilMoistureEvaporationRate * (CurrentTemperatureCelsius / 30f);
            CurrentWindSpeedKmh = activeProfile.averageWindSpeed + (season == TamilNaduSeason.NortheastMonsoon ? UnityEngine.Random.Range(5f, 15f) : 0f);

            OnConditionsEvaluated?.Invoke(CurrentTemperatureCelsius, CurrentHumidity);
        }
    }
}
