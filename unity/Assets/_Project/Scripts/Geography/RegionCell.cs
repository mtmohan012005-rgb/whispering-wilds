using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Geography
{
    public enum TamilNaduBiome
    {
        UrbanCoastal,
        MangroveWetland,
        RiverDelta,
        InteriorPlateau,
        ChettiarCountry,
        HeritageCoast,
        MontaneSholaTea,
        DryScrubForest,
        CoastalPlain
    }

    public enum TamilNaduTerrainType
    {
        Urban,
        FlatWetland,
        FlatAlluvial,
        RollingPlateau,
        LateriteUpland,
        CoastalRock,
        Mountain
    }

    /// <summary>
    /// A state-scale geographic cell. Cells are the addressable unit for the world map and for
    /// streaming decisions; the detailed playable region lives in its own optimised scene.
    /// Coordinates are WGS84 and are projected through <see cref="TamilNaduGeoReference"/>.
    /// </summary>
    [CreateAssetMenu(menuName = "Whispering Wilds/Region Cell", fileName = "RegionCell")]
    public class RegionCell : ScriptableObject
    {
        [Header("Identity")]
        [Tooltip("Stable lowercase id, e.g. \"chennai\". Matches GameManager.currentRegion and the region.* localization keys.")]
        public string regionId;

        public string displayNameEnglish;
        public string displayNameTamil;

        [Tooltip("Localization key for the player-facing name, e.g. \"region.chennai\".")]
        public string localizationKey;

        [Header("Location (WGS84)")]
        [Range(-90f, 90f)] public float latitude;
        [Range(-180f, 180f)] public float longitude;

        [Tooltip("Approximate cell extent in kilometres (half-width/half-height of the reserved area).")]
        public Vector2 boundsKilometres = new Vector2(12f, 12f);

        [Header("Character")]
        public TamilNaduBiome biome = TamilNaduBiome.UrbanCoastal;
        public TamilNaduTerrainType terrainType = TamilNaduTerrainType.Urban;

        [Header("Content")]
        public List<string> allowedWildlife = new List<string>();
        public List<string> majorRoads = new List<string>();
        public List<string> pointsOfInterest = new List<string>();

        [Header("Streaming")]
        [Tooltip("Gameplay scene that holds the detailed playable content.")]
        public string playableSceneName;

        [Tooltip("Streaming radius in kilometres: inside this range the detailed scene should be resident.")]
        public float streamingRadiusKm = 40f;

        [Tooltip("Reserved-but-not-yet-built cells stay false so the map does not imply finished content.")]
        public bool implemented;

        public Vector2Int GeoToLocal(TamilNaduGeoReference reference, Vector3Int unused = default)
        {
            Vector3 world = reference.LatLonToLocal(latitude, longitude);
            return new Vector2Int(Mathf.RoundToInt(world.x), Mathf.RoundToInt(world.z));
        }

        public Vector3 GetWorldPosition(TamilNaduGeoReference reference)
        {
            return reference.LatLonToLocal(latitude, longitude);
        }

        /// <summary>Puducherry is a Union Territory, never part of Tamil Nadu; neighbouring states are never Tamil Nadu cells.</summary>
        public static readonly Dictionary<string, string> NonTamilNaduNeighbours = new Dictionary<string, string>
        {
            { "puducherry", "Union Territory of Puducherry (not Tamil Nadu)" },
            { "kerala", "State of Kerala" },
            { "karnataka", "State of Karnataka" },
            { "andhra_pradesh", "State of Andhra Pradesh" },
            { "telangana", "State of Telangana" }
        };

        private void OnValidate()
        {
            if (string.IsNullOrWhiteSpace(regionId))
            {
                regionId = name.ToLowerInvariant().Replace(" ", "_");
            }

            if (string.IsNullOrWhiteSpace(localizationKey) && !string.IsNullOrWhiteSpace(regionId))
            {
                localizationKey = "region." + regionId;
            }
        }
    }
}