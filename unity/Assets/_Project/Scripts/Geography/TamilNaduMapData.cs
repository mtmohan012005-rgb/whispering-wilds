using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Geography
{
    [System.Serializable]
    public struct MapPlace
    {
        public string nameEnglish;
        public string nameTamil;
        public string kind;
        public double latitude;
        public double longitude;
        public Vector3 worldPosition;
        public long population;
    }

    [System.Serializable]
    public struct MapLineLayer
    {
        public string label;
        public string sourceDataset;
        public Mesh mesh;
        public int featureCount;
    }

    /// <summary>
    /// Lightweight state-scale overview of Tamil Nadu. This is NOT the playable world: it holds
    /// simplified geometry for map/journal use only. Detailed playable content lives in the
    /// per-region scenes referenced by each <see cref="RegionCell"/>.
    /// </summary>
    [CreateAssetMenu(menuName = "Whispering Wilds/Tamil Nadu Map Data", fileName = "TamilNaduMapData")]
    public class TamilNaduMapData : ScriptableObject
    {
        public TamilNaduGeoReference geoReference;

        [Header("Boundary")]
        public Mesh stateOutline;
        public string stateOutlineSource;

        [Header("Vector layers (simplified)")]
        public Mesh coastline;
        public Mesh mountainRegions;
        public List<MapLineLayer> rivers = new List<MapLineLayer>();
        public List<MapLineLayer> roads = new List<MapLineLayer>();

        [Header("Places")]
        public List<MapPlace> places = new List<MapPlace>();

        [Header("Cells")]
        public List<RegionCell> regionCells = new List<RegionCell>();

        [Header("Provenance")]
        [TextArea(3, 8)]
        public string licenceSummary =
            "Natural Earth (public domain) + OpenStreetMap (ODbL). See unity/MapData/SOURCES_AND_LICENSES.md";

        public string generatedByPipeline;
        public string generatedAtUtc;

        public double BoundingLatitudeMin { get; private set; } = 8.076;
        public double BoundingLatitudeMax { get; private set; } = 13.536;
        public double BoundingLongitudeMin { get; private set; } = 76.231;
        public double BoundingLongitudeMax { get; private set; } = 80.348;

        public bool IsGenerated => stateOutline != null;

        public RegionCell FindCell(string regionId)
        {
            for (int i = 0; i < regionCells.Count; i++)
            {
                if (regionCells[i] != null &&
                    string.Equals(regionCells[i].regionId, regionId, System.StringComparison.OrdinalIgnoreCase))
                {
                    return regionCells[i];
                }
            }
            return null;
        }

        public MapPlace? FindPlace(string nameEnglish)
        {
            for (int i = 0; i < places.Count; i++)
            {
                if (string.Equals(places[i].nameEnglish, nameEnglish, System.StringComparison.OrdinalIgnoreCase))
                {
                    return places[i];
                }
            }
            return null;
        }
    }
}