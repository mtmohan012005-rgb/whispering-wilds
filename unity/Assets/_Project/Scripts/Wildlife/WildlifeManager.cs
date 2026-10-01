using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Quality;
using WhisperingWilds.World;

namespace WhisperingWilds.Wildlife
{
    [Serializable]
    public class LogicalCellPopulation
    {
        public string cellId;
        public string regionId;
        public WildlifeSpecies species;
        public int count;
        public float health = 1.0f;
    }

    /// <summary>
    /// Central governor for regional wildlife ecology.
    /// Implements pooled spawning, strict habitat zone registration, performance density scaling,
    /// and distant logical population simulation without maintaining live GameObject overhead.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeManager : MonoBehaviour
    {
        public static WildlifeManager Instance { get; private set; }

        [Header("Regional & Habitat Configuration")]
        [SerializeField] private string currentRegionId = "nilgiris";
        [SerializeField] private int maxVisibleWildlifeBudget = 16;
        [SerializeField] private float densityMultiplier = 1.0f;

        [Header("Object Pooling")]
        [SerializeField] private int poolCapacityPerSpecies = 12;

        // Active State Tracking
        [SerializeField] private List<WildlifeHabitatZone> registeredHabitats = new List<WildlifeHabitatZone>();
        [SerializeField] private List<WildlifeEntity> activeVisibleEntities = new List<WildlifeEntity>();
        [SerializeField] private List<LogicalCellPopulation> logicalPopulations = new List<LogicalCellPopulation>();

        // Internal Pool Dictionaries keyed by WildlifeSpecies
        private readonly Dictionary<WildlifeSpecies, Queue<WildlifeEntity>> speciesPools = new Dictionary<WildlifeSpecies, Queue<WildlifeEntity>>();
        private Transform poolContainer;
        private Transform playerTransform;

        // Telemetry
        public int VisibleWildlifeCount => activeVisibleEntities.Count;
        public int TotalPooledCount
        {
            get
            {
                int total = 0;
                foreach (var q in speciesPools.Values) total += q.Count;
                return total;
            }
        }
        public int PooledWildlifeCount => TotalPooledCount;
        public int LogicalPopulationTotal
        {
            get
            {
                int total = 0;
                for (int i = 0; i < logicalPopulations.Count; i++) total += logicalPopulations[i].count;
                return total;
            }
        }
        public int TotalSpawns { get; private set; }
        public int TotalRecycles { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            CreatePoolContainer();
        }

        private void Start()
        {
            LocatePlayer();
            DiscoverHabitatsInScene();
            InitializeLogicalPopulations();
            PopulateInitialHabitats();

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadCompleted += HandleRegionChanged;
            }

            if (QualityPresetManager.Instance != null)
            {
                QualityPresetManager.Instance.OnQualityPresetChanged += HandleQualityPresetApplied;
                HandleQualityPresetApplied(QualityPresetManager.Instance.CurrentTier, QualityPresetManager.Instance.GetPresetSettings(QualityPresetManager.Instance.CurrentTier));
            }
        }

        private void OnDestroy()
        {
            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadCompleted -= HandleRegionChanged;
            }
            if (QualityPresetManager.Instance != null)
            {
                QualityPresetManager.Instance.OnQualityPresetChanged -= HandleQualityPresetApplied;
            }
        }

        private void CreatePoolContainer()
        {
            if (poolContainer == null)
            {
                var go = new GameObject("--- WILDLIFE_OBJECT_POOL ---");
                go.transform.SetParent(transform);
                poolContainer = go.transform;
            }
        }

        private void LocatePlayer()
        {
            var p = GameObject.FindWithTag("Player");
            if (p != null) playerTransform = p.transform;
        }

        public void DiscoverHabitatsInScene()
        {
            registeredHabitats.Clear();
            var foundHabitats = FindObjectsByType<WildlifeHabitatZone>();
            for (int i = 0; i < foundHabitats.Length; i++)
            {
                foundHabitats[i].EnforceRegionalWhitelistDefaults();
                registeredHabitats.Add(foundHabitats[i]);
            }

            // Also register any pre-existing scene entities
            activeVisibleEntities.Clear();
            var foundEntities = FindObjectsByType<WildlifeEntity>();
            for (int i = 0; i < foundEntities.Length; i++)
            {
                if (foundEntities[i] != null && !activeVisibleEntities.Contains(foundEntities[i]))
                {
                    activeVisibleEntities.Add(foundEntities[i]);
                }
            }
        }

        private void HandleRegionChanged(string newRegionId)
        {
            currentRegionId = newRegionId;
            RecycleAllToPool();
            DiscoverHabitatsInScene();
            PopulateInitialHabitats();
        }

        /// <summary>
        /// Populates registered habitat zones with species strictly matching their regional whitelist.
        /// Guaranteed zero wild animals spawned in cities, town streets, or residential alleys.
        /// </summary>
        private void PopulateInitialHabitats()
        {
            if (registeredHabitats.Count == 0) return;

            LocatePlayer();
            Vector3 playerPos = playerTransform != null ? playerTransform.position : Vector3.zero;
            int targetTotal = Mathf.RoundToInt(maxVisibleWildlifeBudget * densityMultiplier);

            for (int h = 0; h < registeredHabitats.Count; h++)
            {
                var habitat = registeredHabitats[h];
                if (habitat == null || habitat.AllowedSpecies.Count == 0) continue;

                int toSpawn = Mathf.Min(habitat.Capacity, Mathf.CeilToInt((float)targetTotal / registeredHabitats.Count));

                for (int i = 0; i < toSpawn; i++)
                {
                    if (activeVisibleEntities.Count >= targetTotal) break;

                    WildlifeSpecies targetSpecies = habitat.AllowedSpecies[i % habitat.AllowedSpecies.Count];
                    SpawnEntityInHabitat(targetSpecies, habitat, playerPos);
                }
            }
        }

        public WildlifeEntity SpawnEntityInHabitat(WildlifeSpecies species, WildlifeHabitatZone habitat, Vector3 playerPos)
        {
            if (habitat != null && !habitat.IsSpeciesAllowed(species))
            {
                // Safety: Species not permitted in this habitat
                return null;
            }

            WildlifeEntity entity = GetFromPool(species);
            Vector3 spawnPos = habitat != null ? habitat.GetSpawnPoint(playerPos) : Vector3.zero;

            if (entity == null)
            {
                GameObject go = new GameObject($"Wildlife_{species}");
                entity = go.AddComponent<WildlifeEntity>();
                go.transform.position = spawnPos;
            }
            else
            {
                entity.transform.position = spawnPos;
                entity.gameObject.SetActive(true);
            }

            entity.Initialize(species, habitat);
            activeVisibleEntities.Add(entity);
            TotalSpawns++;

            return entity;
        }

        private WildlifeEntity GetFromPool(WildlifeSpecies species)
        {
            if (speciesPools.TryGetValue(species, out var queue) && queue.Count > 0)
            {
                while (queue.Count > 0)
                {
                    var ent = queue.Dequeue();
                    if (ent != null) return ent;
                }
            }
            return null;
        }

        public void RecycleEntity(WildlifeEntity entity)
        {
            if (entity == null) return;

            activeVisibleEntities.Remove(entity);
            entity.gameObject.SetActive(false);
            entity.transform.SetParent(poolContainer);

            WildlifeSpecies sp = entity.Species;
            if (!speciesPools.TryGetValue(sp, out var queue))
            {
                queue = new Queue<WildlifeEntity>();
                speciesPools[sp] = queue;
            }

            queue.Enqueue(entity);
            TotalRecycles++;
        }

        public void RecycleAllToPool()
        {
            for (int i = activeVisibleEntities.Count - 1; i >= 0; i--)
            {
                RecycleEntity(activeVisibleEntities[i]);
            }
            activeVisibleEntities.Clear();
        }

        private void InitializeLogicalPopulations()
        {
            if (logicalPopulations.Count > 0) return;

            // Seed authentic background regional populations for Tamil Nadu
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "nilgiris_plateau_01", regionId = "nilgiris", species = WildlifeSpecies.NilgiriTahr, count = 28 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "nilgiris_shola_02", regionId = "nilgiris", species = WildlifeSpecies.NilgiriLangur, count = 40 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "nilgiris_mudumalai_03", regionId = "nilgiris", species = WildlifeSpecies.AsianElephant, count = 18 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "nilgiris_gaur_04", regionId = "nilgiris", species = WildlifeSpecies.IndianGaur, count = 24 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "pichavaram_marsh_01", regionId = "pichavaram", species = WildlifeSpecies.Egret, count = 65 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "pichavaram_creek_02", regionId = "pichavaram", species = WildlifeSpecies.Kingfisher, count = 30 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "delta_wetlands_01", regionId = "delta", species = WildlifeSpecies.Cattle, count = 50 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "delta_pasture_02", regionId = "delta", species = WildlifeSpecies.Goat, count = 45 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "chettinad_scrub_01", regionId = "chettinad", species = WildlifeSpecies.Peafowl, count = 22 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "mamallapuram_coast_01", regionId = "mamallapuram", species = WildlifeSpecies.BonnetMacaque, count = 35 });
        }

        public void ApplyDensityFactor(float factor)
        {
            densityMultiplier = Mathf.Clamp(factor, 0.25f, 2.0f);
            int targetLimit = Mathf.RoundToInt(maxVisibleWildlifeBudget * densityMultiplier);

            while (activeVisibleEntities.Count > targetLimit && activeVisibleEntities.Count > 0)
            {
                RecycleEntity(activeVisibleEntities[activeVisibleEntities.Count - 1]);
            }
        }

        public void AdvanceLogicalEcologySimulation(double elapsedHours)
        {
            int daysElapsed = Mathf.FloorToInt((float)elapsedHours / 24f);
            if (daysElapsed <= 0) return;

            for (int i = 0; i < logicalPopulations.Count; i++)
            {
                var pop = logicalPopulations[i];
                float seasonalFactor = WorldTimeSystem.Instance != null && WorldTimeSystem.Instance.CurrentSeason == TamilNaduSeason.Summer ? 0.98f : 1.02f;
                pop.count = Mathf.Clamp(Mathf.RoundToInt(pop.count * seasonalFactor), 5, 80);
            }
        }

        private void HandleQualityPresetApplied(QualityTier preset, QualityPresetSettings settings)
        {
            // Visible budget comes from the preset table's own wildlifeDensityFactor rather than a
            // hardcoded ladder, so editing the QualityPresetManager preset actually changes ecology
            // density instead of being silently overridden here.
            int baseBudget = 16;

            switch (preset)
            {
                case QualityTier.VeryLow:
                    baseBudget = 6;
                    break;
                case QualityTier.Low:
                    baseBudget = 10;
                    break;
                case QualityTier.Medium:
                    baseBudget = 16;
                    break;
                case QualityTier.High:
                    baseBudget = 24;
                    break;
                case QualityTier.Ultra:
                    baseBudget = 36;
                    break;
            }

            ApplyDensityFactor(settings.wildlifeDensityFactor);
            maxVisibleWildlifeBudget = Mathf.Max(1, Mathf.RoundToInt(baseBudget * settings.wildlifeDensityFactor));
        }
    }
}
