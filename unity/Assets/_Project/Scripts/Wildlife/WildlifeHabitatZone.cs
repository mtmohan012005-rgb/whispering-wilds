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
        PastoralFarmBoundary // Only for cattle/goats
    }

    /// <summary>
    /// Strict spatial habitat boundary ensuring wild animals roam exclusively within
    /// ecologically appropriate natural reserves, sanctuaries, wetlands, and forests.
    /// Wild animals never wander onto urban streets, town roads, or village centers.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeHabitatZone : MonoBehaviour
    {
        [Header("Zone Identification")]
        [SerializeField] private string zoneId = "nilgiris_sanctuary_zone_01";
        [SerializeField] private string regionId = "nilgiris";
        [SerializeField] private HabitatType habitatType = HabitatType.SholaGrassland;

        [Header("Species Whitelist")]
        [SerializeField] private List<WildlifeSpecies> allowedSpecies = new List<WildlifeSpecies>
        {
            WildlifeSpecies.NilgiriTahr,
            WildlifeSpecies.SpottedDeer,
            WildlifeSpecies.BonnetMacaque
        };

        [Header("Spatial Boundaries")]
        [SerializeField] private Bounds roamingBounds = new Bounds(Vector3.zero, new Vector3(80f, 20f, 80f));
        [SerializeField] private int maxCapacity = 12;

        [Header("Waypoints & Ecological Nodes")]
        [SerializeField] private List<WildlifeWaterSource> waterSources = new List<WildlifeWaterSource>();
        [SerializeField] private List<WildlifeFoodSource> feedingAreas = new List<WildlifeFoodSource>();
        [SerializeField] private List<Transform> restingAreas = new List<Transform>();
        [SerializeField] private List<Transform> spawnPoints = new List<Transform>();

        public string ZoneId => zoneId;
        public string RegionId => regionId;
        public HabitatType Habitat => habitatType;
        public List<WildlifeSpecies> AllowedSpecies => allowedSpecies;
        public int Capacity => maxCapacity;
        public Bounds WorldBounds => new Bounds(transform.position + roamingBounds.center, roamingBounds.size);

        private void Awake()
        {
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

        public bool IsPositionInside(Vector3 position)
        {
            return WorldBounds.Contains(position);
        }

        public bool IsSpeciesAllowed(WildlifeSpecies species)
        {
            return allowedSpecies.Contains(species);
        }

        public Vector3 SampleRandomRoamingPoint()
        {
            Bounds b = WorldBounds;
            float rx = UnityEngine.Random.Range(b.min.x, b.max.x);
            float rz = UnityEngine.Random.Range(b.min.z, b.max.z);
            return new Vector3(rx, transform.position.y, rz);
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

        public Vector3 GetSpawnPoint()
        {
            if (spawnPoints.Count > 0)
            {
                var sp = spawnPoints[UnityEngine.Random.Range(0, spawnPoints.Count)];
                if (sp != null) return sp.position;
            }
            return SampleRandomRoamingPoint();
        }

        private void OnDrawGizmos()
        {
            Gizmos.color = new Color(0.1f, 0.8f, 0.3f, 0.3f);
            Bounds b = new Bounds(transform.position + roamingBounds.center, roamingBounds.size);
            Gizmos.DrawWireCube(b.center, b.size);
        }
    }
}
