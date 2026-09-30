using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.Vegetation
{
    /// <summary>
    /// Central botanical governor managing all agricultural crops, farm plots, and fruit trees.
    /// Operates entirely via event-driven daily ticks and batch time-skips,
    /// strictly avoiding per-frame Update loops across hundreds of plant instances.
    /// </summary>
    [DisallowMultipleComponent]
    public class VegetationManager : MonoBehaviour
    {
        public static VegetationManager Instance { get; private set; }

        [Header("Scene Registrations")]
        [SerializeField] private List<FarmPlot> registeredPlots = new List<FarmPlot>();
        [SerializeField] private List<CropInstance> registeredCrops = new List<CropInstance>();
        [SerializeField] private List<FruitTreeInstance> registeredTrees = new List<FruitTreeInstance>();

        public int ActivePlotCount => registeredPlots.Count;
        public int ActiveCropCount => registeredCrops.Count;
        public int ActiveTreeCount => registeredTrees.Count;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            DiscoverVegetationInScene();

            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnDayChanged += HandleDayChanged;
                WorldTimeSystem.Instance.OnWorldTimeAdvanced += HandleBatchTimeAdvanced;
            }

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadCompleted += HandleRegionLoaded;
            }
        }

        private void OnDestroy()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnDayChanged -= HandleDayChanged;
                WorldTimeSystem.Instance.OnWorldTimeAdvanced -= HandleBatchTimeAdvanced;
            }

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadCompleted -= HandleRegionLoaded;
            }
        }

        public void DiscoverVegetationInScene()
        {
            registeredPlots.Clear();
            registeredPlots.AddRange(FindObjectsByType<FarmPlot>());

            registeredCrops.Clear();
            registeredCrops.AddRange(FindObjectsByType<CropInstance>());

            registeredTrees.Clear();
            registeredTrees.AddRange(FindObjectsByType<FruitTreeInstance>());

            Debug.Log($"<color=#00FF99><b>[VegetationManager]</b></color> Registered in active scene: {registeredPlots.Count} plots, {registeredCrops.Count} crops, {registeredTrees.Count} fruit trees.");
        }

        private void HandleRegionLoaded(string regionId)
        {
            DiscoverVegetationInScene();
        }

        private void HandleDayChanged(int day, int month, int year)
        {
            StepDailyBotanicalSimulation(1.0f);
        }

        private void HandleBatchTimeAdvanced(double elapsedHours)
        {
            float days = (float)(elapsedHours / 24.0);
            if (days > 0.05f)
            {
                StepDailyBotanicalSimulation(days);
            }
        }

        /// <summary>
        /// Executes a single consolidated simulation step across all flora.
        /// </summary>
        public void StepDailyBotanicalSimulation(float daysElapsed)
        {
            TamilNaduSeason season = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.CurrentSeason : TamilNaduSeason.NortheastMonsoon;
            RegionalClimateSystem climate = RegionalClimateSystem.Instance;
            WeatherSystem weather = WeatherSystem.Instance;

            float evaporationRate = climate != null ? climate.SoilEvaporationRate * daysElapsed : 0.05f * daysElapsed;
            float rainBonus = 0f;

            if (weather != null && (weather.CurrentWeather == WeatherType.LightRain || 
                                    weather.CurrentWeather == WeatherType.HeavyRain || 
                                    weather.CurrentWeather == WeatherType.Thunderstorm))
            {
                rainBonus = (weather.CurrentWeather == WeatherType.HeavyRain ? 0.6f : 0.3f) * daysElapsed;
            }

            // 1. Advance Farm Plots
            for (int i = 0; i < registeredPlots.Count; i++)
            {
                if (registeredPlots[i] != null)
                {
                    registeredPlots[i].AdvanceDailySimulation(evaporationRate, rainBonus, season);
                }
            }

            // 2. Advance Fruit Trees
            float avgSoil = 0.6f;
            for (int i = 0; i < registeredTrees.Count; i++)
            {
                if (registeredTrees[i] != null)
                {
                    registeredTrees[i].AdvanceTreeCycle(daysElapsed, season, avgSoil);
                }
            }

            Debug.Log($"<color=#77DD77><b>[Vegetation]</b></color> Botanical growth simulation advanced by {daysElapsed:F1} days (Season: {season}, RainBonus: {rainBonus:F2}).");
        }
    }
}
