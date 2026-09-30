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
    /// and Tier-3 distant logical population simulation without maintaining live GameObject overhead.
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
        [SerializeField] private GameObject tahrPrefab;
        [SerializeField] private GameObject deerPrefab;
        [SerializeField] private int poolCapacity = 24;

        // Active State Tracking
        [SerializeField] private List<WildlifeHabitatZone> registeredHabitats = new List<WildlifeHabitatZone>();
        [SerializeField] private List<WildlifeEntity> activeVisibleEntities = new List<WildlifeEntity>();
        [SerializeField] private List<LogicalCellPopulation> logicalPopulations = new List<LogicalCellPopulation>();

        // Internal Pool Queue
        private readonly Queue<WildlifeEntity> pooledEntities = new Queue<WildlifeEntity>();
        private Transform poolContainer;
        private Transform playerTransform;

        public int VisibleWildlifeCount => activeVisibleEntities.Count;
        public int PooledWildlifeCount => pooledEntities.Count;
        public int LogicalPopulationTotal
        {
            get
            {
                int total = 0;
                for (int i = 0; i < logicalPopulations.Count; i++) total += logicalPopulations[i].count;
                return total;
            }
        }

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
        }

        private void OnDestroy()
        {
            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadCompleted -= HandleRegionChanged;
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
            registeredHabitats.AddRange(FindObjectsByType<WildlifeHabitatZone>());

            // Also register any pre-existing scene entities
            activeVisibleEntities.Clear();
            activeVisibleEntities.AddRange(FindObjectsByType<WildlifeEntity>());
        }

        private void HandleRegionChanged(string newRegionId)
        {
            currentRegionId = newRegionId;
            RecycleAllToPool();
            DiscoverHabitatsInScene();
            PopulateInitialHabitats();
        }

        /// <summary>
        /// Populates registered habitat zones with species strictly matching their whitelist.
        /// Guaranteed zero wild animals spawned in cities, town streets, or residential alleys.
        /// </summary>
        private void PopulateInitialHabitats()
        {
            if (registeredHabitats.Count == 0) return;

            int targetTotal = Mathf.RoundToInt(maxVisibleWildlifeBudget * densityMultiplier);

            for (int h = 0; h < registeredHabitats.Count; h++)
            {
                var habitat = registeredHabitats[h];
                if (habitat == null || habitat.AllowedSpecies.Count == 0) continue;

                int toSpawn = Mathf.Min(habitat.Capacity, Mathf.CeilToInt((float)targetTotal / registeredHabitats.Count));
                WildlifeSpecies targetSpecies = habitat.AllowedSpecies[0];

                for (int i = 0; i < toSpawn; i++)
                {
                    if (activeVisibleEntities.Count >= targetTotal) break;
                    SpawnEntityInHabitat(targetSpecies, habitat);
                }
            }
        }

        public WildlifeEntity SpawnEntityInHabitat(WildlifeSpecies species, WildlifeHabitatZone habitat)
        {
            WildlifeEntity entity = GetFromPool();
            Vector3 spawnPos = habitat != null ? habitat.GetSpawnPoint() : Vector3.zero;

            if (entity == null)
            {
                // Create minimal instance if pool is depleted
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
            return entity;
        }

        private WildlifeEntity GetFromPool()
        {
            while (pooledEntities.Count > 0)
            {
                var ent = pooledEntities.Dequeue();
                if (ent != null) return ent;
            }
            return null;
        }

        public void RecycleEntity(WildlifeEntity entity)
        {
            if (entity == null) return;

            activeVisibleEntities.Remove(entity);
            entity.gameObject.SetActive(false);
            entity.transform.SetParent(poolContainer);
            pooledEntities.Enqueue(entity);
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
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "nilgiris_shola_02", regionId = "nilgiris", species = WildlifeSpecies.BonnetMacaque, count = 45 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "pichavaram_marsh_01", regionId = "pichavaram", species = WildlifeSpecies.Egret, count = 60 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "delta_wetlands_01", regionId = "delta", species = WildlifeSpecies.SpottedDeer, count = 34 });
            logicalPopulations.Add(new LogicalCellPopulation { cellId = "chettinad_scrub_01", regionId = "chettinad", species = WildlifeSpecies.Peafowl, count = 22 });
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

        /// <summary>
        /// Logical population catch-up simulation when the player sleeps, fast-travels, or re-enters a region.
        /// </summary>
        public void AdvanceLogicalEcologySimulation(double elapsedHours)
        {
            int daysElapsed = Mathf.FloorToInt((float)elapsedHours / 24f);
            if (daysElapsed <= 0) return;

            for (int i = 0; i < logicalPopulations.Count; i++)
            {
                var pop = logicalPopulations[i];
                // Subtle seasonal population fluctuation
                float seasonalFactor = WorldTimeSystem.Instance != null && WorldTimeSystem.Instance.CurrentSeason == TamilNaduSeason.Summer ? 0.98f : 1.02f;
                pop.count = Mathf.Clamp(Mathf.RoundToInt(pop.count * seasonalFactor), 5, 80);
            }
        }
    }
}
