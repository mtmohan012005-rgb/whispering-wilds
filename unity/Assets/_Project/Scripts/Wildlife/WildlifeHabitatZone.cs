using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.Wildlife
{
    public enum HabitatType
    {
        DenseForest,
        OpenForestGlade,
        WetlandMarsh,
        HighlandMountainCrag,
        SholaGrassland,
        RiverRiparianCorridor,
        PastoralFarmBoundary,
        CoastalShoreline,
        UrbanVillageBorder
    }

    /// <summary>
    /// Strict spatial habitat boundary ensuring wild animals roam exclusively within
    /// ecologically appropriate natural reserves, sanctuaries, wetlands, and forests.
    /// Wild animals never wander onto urban streets, town roads, or village centers.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeHabitatZone : MonoBehaviour
    {
        [Header("Zone Identification & Region Whitelist")]
        [SerializeField] private string zoneId = "nilgiris_sanctuary_zone_01";
        [SerializeField] private string regionId = "nilgiris";
        [SerializeField] private HabitatType habitatType = HabitatType.SholaGrassland;

        [Header("Species Whitelist")]
        [SerializeField] private List<WildlifeSpecies> allowedSpecies = new List<WildlifeSpecies>();

        [Header("Spatial Boundaries")]
        [SerializeField] private Bounds roamingBounds = new Bounds(Vector3.zero, new Vector3(100f, 30f, 100f));
        [SerializeField] private List<Bounds> exclusionZones = new List<Bounds>();
        [SerializeField] private int maxCapacity = 12;
        [SerializeField] private float minSpawnDistanceFromPlayer = 15.0f;

        [Header("Waypoints & Ecological Nodes")]
        [SerializeField] private List<WildlifeWaterSource> waterSources = new List<WildlifeWaterSource>();
        [SerializeField] private List<WildlifeFoodSource> feedingAreas = new List<WildlifeFoodSource>();
        [SerializeField] private List<Transform> restingAreas = new List<Transform>();
        [SerializeField] private List<Transform> perchingSpots = new List<Transform>();
        [SerializeField] private List<Transform> spawnPoints = new List<Transform>();

        public string ZoneId => zoneId;
        public string RegionId => regionId;
        public HabitatType Habitat => habitatType;
        public List<WildlifeSpecies> AllowedSpecies => allowedSpecies;
        public int Capacity => maxCapacity;
        public Bounds WorldBounds => new Bounds(transform.position + roamingBounds.center, roamingBounds.size);

        private void Awake()
        {
            EnforceRegionalWhitelistDefaults();

            // Auto-discover child or adjacent nodes if unassigned
            if (waterSources.Count == 0)
            {
                waterSources.AddRange(GetComponentsInChildren<WildlifeWaterSource>());
            }
            if (feedingAreas.Count == 0)
            {
                feedingAreas.AddRange(GetComponentsInChildren<WildlifeFoodSource>());
            }
        }

        /// <summary>
        /// Guarantees that forbidden regional species (such as wild elephants in Chennai) can never be assigned.
        /// </summary>
        public void EnforceRegionalWhitelistDefaults()
        {
            if (allowedSpecies == null) allowedSpecies = new List<WildlifeSpecies>();

            string r = !string.IsNullOrEmpty(regionId) ? regionId.ToLowerInvariant() : "nilgiris";

            if (r.Contains("chennai"))
            {
                // Chennai: Urban coastal only. NEVER large forest animals.
                allowedSpecies.RemoveAll(s => s == WildlifeSpecies.AsianElephant ||
                                              s == WildlifeSpecies.IndianGaur ||
                                              s == WildlifeSpecies.NilgiriTahr ||
                                              s == WildlifeSpecies.NilgiriLangur ||
                                              s == WildlifeSpecies.WildBoar);
                if (allowedSpecies.Count == 0)
                {
                    allowedSpecies.Add(WildlifeSpecies.Egret);
                }
            }
            else if (r.Contains("pichavaram"))
            {
                // Pichavaram: Mangrove & wetland compatible species
                if (allowedSpecies.Count == 0)
                {
                    allowedSpecies.Add(WildlifeSpecies.Egret);
                    allowedSpecies.Add(WildlifeSpecies.Kingfisher);
                    allowedSpecies.Add(WildlifeSpecies.SpottedDeer);
                }
                allowedSpecies.Remove(WildlifeSpecies.AsianElephant);
                allowedSpecies.Remove(WildlifeSpecies.NilgiriTahr);
                allowedSpecies.Remove(WildlifeSpecies.IndianGaur);
            }
            else if (r.Contains("delta"))
            {
                // Thanjavur Delta: Rural agricultural plains
                if (allowedSpecies.Count == 0)
                {
                    allowedSpecies.Add(WildlifeSpecies.Cattle);
                    allowedSpecies.Add(WildlifeSpecies.Goat);
                    allowedSpecies.Add(WildlifeSpecies.Peafowl);
                    allowedSpecies.Add(WildlifeSpecies.Egret);
                }
                allowedSpecies.Remove(WildlifeSpecies.AsianElephant);
                allowedSpecies.Remove(WildlifeSpecies.NilgiriTahr);
                allowedSpecies.Remove(WildlifeSpecies.IndianGaur);
            }
            else if (r.Contains("chettinad"))
            {
                // Chettinad: Heritage village & scrub
                if (allowedSpecies.Count == 0)
                {
                    allowedSpecies.Add(WildlifeSpecies.Cattle);
                    allowedSpecies.Add(WildlifeSpecies.Goat);
                    allowedSpecies.Add(WildlifeSpecies.Peafowl);
                    allowedSpecies.Add(WildlifeSpecies.WildBoar);
                }
                allowedSpecies.Remove(WildlifeSpecies.AsianElephant);
                allowedSpecies.Remove(WildlifeSpecies.NilgiriTahr);
                allowedSpecies.Remove(WildlifeSpecies.IndianGaur);
            }
            else if (r.Contains("mamallapuram"))
            {
                // Mamallapuram: Coastal rocky shore
                if (allowedSpecies.Count == 0)
                {
                    allowedSpecies.Add(WildlifeSpecies.BonnetMacaque);
                    allowedSpecies.Add(WildlifeSpecies.Egret);
                    allowedSpecies.Add(WildlifeSpecies.Cattle);
                }
                allowedSpecies.Remove(WildlifeSpecies.AsianElephant);
                allowedSpecies.Remove(WildlifeSpecies.NilgiriTahr);
                allowedSpecies.Remove(WildlifeSpecies.IndianGaur);
            }
            else if (r.Contains("nilgiris"))
            {
                // Nilgiris: Western Ghats Montane Reserve
                if (allowedSpecies.Count == 0)
                {
                    allowedSpecies.Add(WildlifeSpecies.NilgiriTahr);
                    allowedSpecies.Add(WildlifeSpecies.NilgiriLangur);
                    allowedSpecies.Add(WildlifeSpecies.AsianElephant);
                    allowedSpecies.Add(WildlifeSpecies.IndianGaur);
                    allowedSpecies.Add(WildlifeSpecies.SpottedDeer);
                    allowedSpecies.Add(WildlifeSpecies.Peafowl);
                }
            }
        }

        public bool IsPositionInside(Vector3 position)
        {
            if (!WorldBounds.Contains(position)) return false;

            // Check exclusion zones (buildings, player spawn zones)
            for (int i = 0; i < exclusionZones.Count; i++)
            {
                Bounds eb = new Bounds(transform.position + exclusionZones[i].center, exclusionZones[i].size);
                if (eb.Contains(position)) return false;
            }

            return true;
        }

        public bool IsSpeciesAllowed(WildlifeSpecies species)
        {
            return allowedSpecies.Contains(species);
        }

        public Vector3 ClampToZone(Vector3 position)
        {
            Bounds b = WorldBounds;
            position.x = Mathf.Clamp(position.x, b.min.x + 1f, b.max.x - 1f);
            position.z = Mathf.Clamp(position.z, b.min.z + 1f, b.max.z - 1f);
            return position;
        }

        public Vector3 SampleRandomRoamingPoint()
        {
            Bounds b = WorldBounds;
            for (int attempt = 0; attempt < 5; attempt++)
            {
                float rx = UnityEngine.Random.Range(b.min.x + 2f, b.max.x - 2f);
                float rz = UnityEngine.Random.Range(b.min.z + 2f, b.max.z - 2f);
                Vector3 pt = new Vector3(rx, transform.position.y, rz);
                if (IsPositionInside(pt)) return pt;
            }
            return transform.position;
        }

        public Vector3 GetSpawnPoint(Vector3 playerPosition)
        {
            // First check authored spawn points that are safely away from player
            for (int i = 0; i < spawnPoints.Count; i++)
            {
                var sp = spawnPoints[i];
                if (sp != null && Vector3.Distance(sp.position, playerPosition) >= minSpawnDistanceFromPlayer)
                {
                    return sp.position;
                }
            }

            // Fallback: Sample a random point adhering to safe player distance
            for (int attempt = 0; attempt < 10; attempt++)
            {
                Vector3 pt = SampleRandomRoamingPoint();
                if (Vector3.Distance(pt, playerPosition) >= minSpawnDistanceFromPlayer)
                {
                    return pt;
                }
            }

            return SampleRandomRoamingPoint();
        }

        public WildlifeWaterSource GetBestWaterSource()
        {
            if (waterSources.Count == 0) return null;
            var available = waterSources.FindAll(w => w != null && w.IsAvailable);
            if (available.Count == 0) return waterSources[0];
            return available[UnityEngine.Random.Range(0, available.Count)];
        }

        public WildlifeFoodSource GetBestFoodSource(WildlifeDietType diet)
        {
            if (feedingAreas.Count == 0) return null;
            return feedingAreas[UnityEngine.Random.Range(0, feedingAreas.Count)];
        }

        public Vector3 GetRestingPoint()
        {
            if (restingAreas.Count > 0)
            {
                var r = restingAreas[UnityEngine.Random.Range(0, restingAreas.Count)];
                if (r != null) return r.position;
            }
            return SampleRandomRoamingPoint();
        }

        public Vector3 GetPerchingSpot()
        {
            if (perchingSpots.Count > 0)
            {
                var p = perchingSpots[UnityEngine.Random.Range(0, perchingSpots.Count)];
                if (p != null) return p.position;
            }
            return SampleRandomRoamingPoint() + (Vector3.up * 4.0f);
        }
    }
}
