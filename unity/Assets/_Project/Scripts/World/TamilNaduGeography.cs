using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.World
{
    [Serializable]
    public struct RegionGeoLocation
    {
        public string regionId;
        public string englishName;
        public string tamilName;
        public double latitude;
        public double longitude;
        public float elevationMeters;
        public string highwayRoute;
        public string historicalSignificance;
        public string biomeType;
        public string sceneName;
    }

    /// <summary>
    /// Grounded geographic foundation for Tamil Nadu based on authentic OpenStreetMap
    /// coordinates, national highway corridors, and regional elevation data.
    /// </summary>
    public static class TamilNaduGeography
    {
        public static readonly RegionGeoLocation Chennai = new RegionGeoLocation
        {
            regionId = "chennai",
            englishName = "Chennai George Town",
            tamilName = "சென்னை ஜார்ஜ் டவுன்",
            latitude = 13.0880,
            longitude = 80.2885,
            elevationMeters = 6.0f,
            highwayRoute = "NH 16 / Coromandel Coastal Trunk",
            historicalSignificance = "Historic British-era commercial mercantile core, High Court Indo-Saracenic plaza, spice markets.",
            biomeType = "Urban Coastal / Monsoon Estuary",
            sceneName = "02_Chennai_GeorgeTown"
        };

        public static readonly RegionGeoLocation Mamallapuram = new RegionGeoLocation
        {
            regionId = "mamallapuram",
            englishName = "Mamallapuram Shore",
            tamilName = "மாமல்லபுரம் கடற்கரை",
            latitude = 12.6186,
            longitude = 80.1983,
            elevationMeters = 12.0f,
            highwayRoute = "East Coast Road (ECR / SH 49)",
            historicalSignificance = "7th-century Pallava granite monoliths, Shore Temple, Arjuna's Penance, active stone sculptors.",
            biomeType = "Coastal Granite Shore / Salt Spray",
            sceneName = "06_Mamallapuram_Shore"
        };

        public static readonly RegionGeoLocation Pichavaram = new RegionGeoLocation
        {
            regionId = "pichavaram",
            englishName = "Pichavaram Mangrove Wetlands",
            tamilName = "பிச்சாவரம் சதுப்புநிலக் காடு",
            latitude = 11.4289,
            longitude = 79.7797,
            elevationMeters = 2.0f,
            highwayRoute = "NH 32 / Kollidam Delta Route",
            historicalSignificance = "World's second largest mangrove ecosystem, Vellar-Coleroon estuarine labyrinth, fishing catamarans.",
            biomeType = "Tidal Mangrove Swamp / Estuary",
            sceneName = "03_Pichavaram_Wetlands"
        };

        public static readonly RegionGeoLocation CauveryDelta = new RegionGeoLocation
        {
            regionId = "delta",
            englishName = "Cauvery Delta Agri-Basin",
            tamilName = "காவிரி டெல்டா பாசன நிலங்கள்",
            latitude = 10.9602,
            longitude = 79.3845,
            elevationMeters = 24.0f,
            highwayRoute = "NH 81 / Grand Anicut Expressway",
            historicalSignificance = "Granary of Tamil Nadu, Chola Grand Anicut (Kallanai) hydraulic irrigation network, paddy bund roads.",
            biomeType = "Alluvial Agricultural Plain / Paddy Wetlands",
            sceneName = "04_Thanjavur_Delta"
        };

        public static readonly RegionGeoLocation Thanjavur = new RegionGeoLocation
        {
            regionId = "thanjavur",
            englishName = "Thanjavur Brihadisvara Royal Quarter",
            tamilName = "தஞ்சாவூர் பெரிய கோயில் பகுதி",
            latitude = 10.7828,
            longitude = 79.1318,
            elevationMeters = 57.0f,
            highwayRoute = "NH 83 / Trichy-Thanjavur Highway",
            historicalSignificance = "11th-century Chola granite vimana (Peruvudaiyar Kovil), Saraswathi Mahal Library, bronze casting workshops.",
            biomeType = "Heritage Granite Citadel / Urban Culture",
            sceneName = "04_Thanjavur_Delta"
        };

        public static readonly RegionGeoLocation Chettinad = new RegionGeoLocation
        {
            regionId = "chettinad",
            englishName = "Chettinad Kanadukathan Mansions",
            tamilName = "செட்டிநாடு கானாடுகாத்தான் மாளிகை",
            latitude = 10.0673,
            longitude = 78.7844,
            elevationMeters = 88.0f,
            highwayRoute = "NH 38 / Karaikudi Trunk Route",
            historicalSignificance = "Nattukottai Chettiar courtyard palaces, Athangudi handmade cement tiles, Burmese teak pillars, rainwater muttams.",
            biomeType = "Semi-Arid Heritage Plains / Mansion Estates",
            sceneName = "05_Chettinad_Mansion"
        };

        public static readonly RegionGeoLocation Nilgiris = new RegionGeoLocation
        {
            regionId = "nilgiris",
            englishName = "Nilgiris Shola-Tea Biosphere",
            tamilName = "நீலகிரி சோலை - தேயிலை வனம்",
            latitude = 11.4102,
            longitude = 76.6950,
            elevationMeters = 2240.0f,
            highwayRoute = "NH 181 / Sigur Ghat Mountain Highway",
            historicalSignificance = "Western Ghats montane evergreen shola forest, Toda indigenous mund hamlets, Nilgiri Tahr habitat.",
            biomeType = "Montane Cloud Forest / Tea Slopes",
            sceneName = "07_Nilgiris_Sanctuary"
        };

        public static readonly RegionGeoLocation AncientTemple = new RegionGeoLocation
        {
            regionId = "ancient_temple",
            englishName = "Ancient Dravidian Temple Ruins",
            tamilName = "பண்டைய திராவிடக் கோயில் சிதிலங்கள்",
            latitude = 10.7850,
            longitude = 79.1350,
            elevationMeters = 55.0f,
            highwayRoute = "Kaveri River Tributary Access",
            historicalSignificance = "Historic Chola and Nayakar mandapas, acoustic swara musical pillars, and sun-aligned sanctum.",
            biomeType = "Sacred Heritage Complex / Granite Mandapa",
            sceneName = "08_Ancient_Temple_Ruins"
        };

        public static readonly RegionGeoLocation Madurai = new RegionGeoLocation
        {
            regionId = "madurai",
            englishName = "Madurai Meenakshi Royal Quarter",
            tamilName = "மதுரை மீனாட்சி சுந்தரேஸ்வரர் பகுதி",
            latitude = 9.9195,
            longitude = 78.1193,
            elevationMeters = 136.0f,
            highwayRoute = "NH 44 / Vaigai Corridor",
            historicalSignificance = "Ancient Pandyan capital, Sangam literature center, Meenakshi temple 5-tier gopurams and Nayakar colonnade.",
            biomeType = "Historic Temple City / Jasmine Bazaar",
            sceneName = "09_Madurai_Meenakshi"
        };

        public static readonly RegionGeoLocation Kanyakumari = new RegionGeoLocation
        {
            regionId = "kanyakumari",
            englishName = "Kanyakumari Cape Triveni Sangam",
            tamilName = "கன்னியாகுமரி முக்கடல் சங்கமம்",
            latitude = 8.0883,
            longitude = 77.5385,
            elevationMeters = 10.0f,
            highwayRoute = "NH 66 / Southern Coastal Highway",
            historicalSignificance = "Southernmost tip of the Indian subcontinent, confluence of Arabian Sea, Indian Ocean, and Bay of Bengal.",
            biomeType = "Coastal Cape / Ocean Confluence",
            sceneName = "10_Kanyakumari_Cape"
        };

        public static readonly RegionGeoLocation Agasthyamalai = new RegionGeoLocation
        {
            regionId = "agasthyamalai",
            englishName = "Agasthyamalai Biosphere Wilds",
            tamilName = "அகத்தியர் மலை உயிர்க்கோள வனம்",
            latitude = 8.6167,
            longitude = 77.2500,
            elevationMeters = 1868.0f,
            highwayRoute = "Western Ghats Forest Reserve Corridor",
            historicalSignificance = "Protected UNESCO biosphere, indigenous Siddha medicinal flora, montane shola forest and sacred mist peaks.",
            biomeType = "Montane Evergreen Shola / Sacred Forest",
            sceneName = "11_Agasthyamalai_Wilds"
        };

        public static readonly List<RegionGeoLocation> AllRegions = new List<RegionGeoLocation>
        {
            Chennai,
            Mamallapuram,
            Pichavaram,
            CauveryDelta,
            Thanjavur,
            Chettinad,
            Nilgiris,
            AncientTemple,
            Madurai,
            Kanyakumari,
            Agasthyamalai
        };

        public static bool IsValidRegion(string regionId)
        {
            if (string.IsNullOrEmpty(regionId)) return false;
            foreach (var r in AllRegions)
            {
                if (r.regionId.Equals(regionId, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }

        public static bool TryGetRegion(string regionId, out RegionGeoLocation region)
        {
            if (!string.IsNullOrEmpty(regionId))
            {
                foreach (var r in AllRegions)
                {
                    if (r.regionId.Equals(regionId, StringComparison.OrdinalIgnoreCase))
                    {
                        region = r;
                        return true;
                    }
                }
            }
            region = default;
            return false;
        }

        public static RegionGeoLocation GetRegion(string regionId)
        {
            if (TryGetRegion(regionId, out RegionGeoLocation found))
            {
                return found;
            }
            Debug.LogWarning($"[TamilNaduGeography] Unknown region '{regionId}'. Falling back to default Chennai.");
            return Chennai;
        }

        /// <summary>
        /// Haversine formula to compute great-circle distance between two geographic coordinates in kilometers.
        /// </summary>
        public static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
        {
            double r = 6371.0; // Earth radius in km
            double dLat = ToRadians(lat2 - lat1);
            double dLon = ToRadians(lon2 - lon1);
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return r * c;
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
    }
}
