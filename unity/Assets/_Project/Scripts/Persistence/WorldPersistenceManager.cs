using System;
using System.IO;
using UnityEngine;
using WhisperingWilds.World;
using WhisperingWilds.Vegetation;
using WhisperingWilds.Wildlife;
using WhisperingWilds.Online;

namespace WhisperingWilds.Persistence
{
    /// <summary>
    /// Central governor for world-state persistence and offline simulation catch-up.
    /// Checkpoints world calendar, agricultural crops, fruit trees, and logical wildlife
    /// to local JSON and forwards snapshots to the Firebase persistence backend.
    /// </summary>
    [DisallowMultipleComponent]
    public class WorldPersistenceManager : MonoBehaviour
    {
        public static WorldPersistenceManager Instance { get; private set; }

        private const string WorldSaveFileName = "whispering_wilds_world_state.json";
        public static string WorldSaveFilePath => Path.Combine(Application.persistentDataPath, WorldSaveFileName);

        [Header("Persistence Status")]
        [SerializeField] private bool isDirty = false;
        [SerializeField] private string lastSavedTime = "Never";
        [SerializeField] private int savedPlotsCount = 0;

        public bool IsDirty => isDirty;

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
            LoadAndApplyWorldState();

            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnDayChanged += HandleDayRollover;
            }

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadStarted += HandleRegionDeparting;
            }
        }

        private void OnDestroy()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnDayChanged -= HandleDayRollover;
            }

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadStarted -= HandleRegionDeparting;
            }
        }

        public void MarkDirty()
        {
            isDirty = true;
        }

        private void HandleDayRollover(int day, int month, int year)
        {
            // Daily automated checkpoint
            SaveWorldState();
        }

        private void HandleRegionDeparting(string departingRegionId)
        {
            // Checkpoint before transitioning scenes
            SaveWorldState();
        }

        /// <summary>
        /// Collects logical state from WorldTimeSystem, VegetationManager, and WildlifeManager.
        /// </summary>
        public WorldStateData GenerateWorldStateSnapshot()
        {
            var data = new WorldStateData
            {
                schemaVersion = 1,
                lastSavedTimestampUtc = DateTime.UtcNow.ToString("o"),
                totalElapsedHours = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.TotalElapsedInGameHours : 0.0,
                worldYear = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.Year : 2026,
                worldMonth = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.Month : 10,
                worldDay = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.Day : 15,
                worldHour = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.HourOfDay : 9.0f,
                currentSeason = (int)(WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.CurrentSeason : TamilNaduSeason.NortheastMonsoon),
                currentRegionId = RegionalSceneManager.Instance != null ? RegionalSceneManager.Instance.ActiveRegionId : "chennai"
            };

            // Capture Farm Plots
            var plots = FindObjectsByType<FarmPlot>();
            foreach (var p in plots)
            {
                if (p == null) continue;
                data.farmPlots.Add(new SavedFarmPlotState
                {
                    plotId = p.PlotId,
                    regionId = p.RegionId,
                    plantId = p.HasActiveCrop ? p.Crop.PlantId : "none",
                    growthStage = p.HasActiveCrop ? (int)p.Crop.CurrentStage : 0,
                    soilMoisture = p.SoilMoisture,
                    plantedWorldDay = 1,
                    health = p.HasActiveCrop ? p.Crop.Health : 1.0f
                });
            }

            // Capture Fruit Trees
            var trees = FindObjectsByType<FruitTreeInstance>();
            foreach (var t in trees)
            {
                if (t == null) continue;
                data.fruitTrees.Add(new SavedFruitTreeState
                {
                    treeId = t.gameObject.name,
                    plantId = t.PlantId,
                    cycleStage = (int)t.CycleStage,
                    lastHarvestDay = 0
                });
            }

            savedPlotsCount = data.farmPlots.Count;
            return data;
        }

        public void SaveWorldState()
        {
            try
            {
                WorldStateData data = GenerateWorldStateSnapshot();
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(WorldSaveFilePath, json);

                isDirty = false;
                lastSavedTime = DateTime.UtcNow.ToString("HH:mm:ss");
                Debug.Log($"<color=#00FF99><b>[WorldPersistence]</b></color> World state check-pointed to {WorldSaveFilePath} ({data.farmPlots.Count} plots, {data.fruitTrees.Count} trees).");

                // Dispatch to Firebase cloud sync if active
                if (CloudSaveManager.Instance != null)
                {
                    CloudSaveManager.Instance.SynchronizeWorldStateToFirebase(data);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[WorldPersistence] Save failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Reads world state from local disk and performs offline catch-up simulation if time has lapsed.
        /// </summary>
        public void LoadAndApplyWorldState()
        {
            if (!File.Exists(WorldSaveFilePath))
            {
                Debug.Log("[WorldPersistence] No existing world state file found. Starting fresh calendar.");
                return;
            }

            try
            {
                string json = File.ReadAllText(WorldSaveFilePath);
                WorldStateData data = JsonUtility.FromJson<WorldStateData>(json);
                if (data == null) return;

                Debug.Log($"<color=#00D2FF><b>[WorldPersistence]</b></color> Loaded world state from {data.lastSavedTimestampUtc}. Catching up simulation...");

                // 1. Restore authoritative clock
                if (WorldTimeSystem.Instance != null)
                {
                    WorldTimeSystem.Instance.SetCalendarAndClock(data.worldYear, data.worldMonth, data.worldDay, data.worldHour);
                }

                // 2. Offline real-time calculation
                if (DateTime.TryParse(data.lastSavedTimestampUtc, out DateTime lastTime))
                {
                    TimeSpan realTimeDifference = DateTime.UtcNow - lastTime;
                    if (realTimeDifference.TotalMinutes > 5)
                    {
                        // Simulate proportional time-skip (e.g. 1 real hour offline = 1 in-game day)
                        float elapsedInGameDays = Mathf.Clamp((float)realTimeDifference.TotalHours, 0.5f, 30f);
                        Debug.Log($"<color=#FFCC00><b>[Offline Catch-Up]</b></color> Player was away for {realTimeDifference.TotalHours:F1} real hours -> Advancing world by {elapsedInGameDays:F1} game days.");

                        if (VegetationManager.Instance != null)
                        {
                            VegetationManager.Instance.StepDailyBotanicalSimulation(elapsedInGameDays);
                        }

                        if (WildlifeManager.Instance != null)
                        {
                            WildlifeManager.Instance.AdvanceLogicalEcologySimulation(elapsedInGameDays * 24f);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[WorldPersistence] Load error: {ex.Message}");
            }
        }
    }
}
