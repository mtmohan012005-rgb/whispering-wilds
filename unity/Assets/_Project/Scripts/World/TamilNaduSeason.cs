using System;
using UnityEngine;

namespace WhisperingWilds.World
{
    /// <summary>
    /// The four authoritative seasonal periods of Tamil Nadu's ecological calendar.
    /// </summary>
    public enum TamilNaduSeason
    {
        /// <summary>March to May: Peak solar heat, high coastal humidity, inland heatwave, occasional evening mango showers.</summary>
        Summer = 0,

        /// <summary>June to September: Western Ghats / Nilgiris heavy rainfall, interior rain-shadow, gusty winds.</summary>
        SouthwestMonsoon = 1,

        /// <summary>October to December: Major Coromandel coast & Cauvery Delta monsoon, cyclonic depressions, heavy rainfall.</summary>
        NortheastMonsoon = 2,

        /// <summary>January to February: Pleasant dry days, cool highland nights, dew and morning mist, harvest festivals (Pongal).</summary>
        Winter = 3
    }

    /// <summary>
    /// Metadata and localized nomenclature for Tamil Nadu seasons.
    /// </summary>
    public static class TamilNaduSeasonExtensions
    {
        public static string GetTamilName(this TamilNaduSeason season)
        {
            switch (season)
            {
                case TamilNaduSeason.Summer: return "கோடைக்காலம்";
                case TamilNaduSeason.SouthwestMonsoon: return "தென்மேற்குப் பருவமழை";
                case TamilNaduSeason.NortheastMonsoon: return "வடகிழக்குப் பருவமழை";
                case TamilNaduSeason.Winter: return "குளிர்காலம்";
                default: return season.ToString();
            }
        }

        public static string GetEnglishName(this TamilNaduSeason season)
        {
            switch (season)
            {
                case TamilNaduSeason.Summer: return "Summer";
                case TamilNaduSeason.SouthwestMonsoon: return "Southwest Monsoon";
                case TamilNaduSeason.NortheastMonsoon: return "Northeast Monsoon";
                case TamilNaduSeason.Winter: return "Winter";
                default: return season.ToString();
            }
        }

        public static string GetLocalizedName(this TamilNaduSeason season)
        {
            bool isTamil = WhisperingWilds.Localization.LocalizationManager.Instance != null &&
                           WhisperingWilds.Localization.LocalizationManager.Instance.CurrentLanguage == WhisperingWilds.Localization.Language.Tamil;
            return isTamil ? season.GetTamilName() : season.GetEnglishName();
        }

        public static string GetShortTamilName(this TamilNaduSeason season)
        {
            switch (season)
            {
                case TamilNaduSeason.Summer: return "கோடை";
                case TamilNaduSeason.SouthwestMonsoon: return "தென்மேற்கு மழை";
                case TamilNaduSeason.NortheastMonsoon: return "வடகிழக்கு மழை";
                case TamilNaduSeason.Winter: return "குளிர்";
                default: return season.ToString();
            }
        }

        public static TamilNaduSeason GetSeasonForMonth(int month)
        {
            // Clamped 1-12
            month = Mathf.Clamp(month, 1, 12);

            if (month >= 3 && month <= 5) return TamilNaduSeason.Summer;
            if (month >= 6 && month <= 9) return TamilNaduSeason.SouthwestMonsoon;
            if (month >= 10 && month <= 12) return TamilNaduSeason.NortheastMonsoon;
            return TamilNaduSeason.Winter; // 1 (January) and 2 (February)
        }
    }
}
