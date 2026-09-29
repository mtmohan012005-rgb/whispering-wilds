using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.World
{
    [Serializable]
    public struct CulturalItemEntry
    {
        public string id;
        public string englishName;
        public string tamilName;
        public string descriptionTamil;
        public string descriptionEnglish;
        public string region;
        public bool isInteractable;
    }

    /// <summary>
    /// Master catalog of authentic Tamil Nadu heritage artifacts, domestic utensils, and cultural props.
    /// Provides metadata, lore, and inspectable narrative details.
    /// </summary>
    public static class CulturalObjectCatalog
    {
        public static readonly List<CulturalItemEntry> Items = new List<CulturalItemEntry>
        {
            new CulturalItemEntry
            {
                id = "kuthu_vilakku",
                englishName = "Kuthu Vilakku (Standing Brass Lamp)",
                tamilName = "குத்து விளக்கு",
                descriptionEnglish = "Traditional 5-spout ornamental brass oil lamp symbolizing prosperity and spiritual light.",
                descriptionTamil = "மங்கள நிகழ்வுகளில் ஏற்றப்படும் ஐந்து முக பித்தளை விளக்கு.",
                region = "Thanjavur",
                isInteractable = true
            },
            new CulturalItemEntry
            {
                id = "agal_vilakku",
                englishName = "Agal Vilakku (Clay Oil Lamp)",
                tamilName = "அகல் விளக்கு",
                descriptionEnglish = "Hand-spun terracotta oil lamp ignited during Karthigai Deepam festival.",
                descriptionTamil = "கார்த்திகை தீபத்தன்று வீடுகளில் ஏற்றப்படும் சுடுமண் அகல் விளக்கு.",
                region = "CauveryDelta",
                isInteractable = true
            },
            new CulturalItemEntry
            {
                id = "ammi_kallu",
                englishName = "Ammi Kallu (Granite Grinding Stone)",
                tamilName = "அம்மிக்கல்",
                descriptionEnglish = "Flat granite stone and rolling pin used for hand-grinding fresh masala and coconut chutney.",
                descriptionTamil = "மசாலா மற்றும் துவையல் அரைக்கப் பயன்படும் பாரம்பரிய கருங்கல் அம்மிக்கல்.",
                region = "Chettinad",
                isInteractable = true
            },
            new CulturalItemEntry
            {
                id = "filter_coffee_dabarah",
                englishName = "Filter Coffee Dabarah & Tumbler",
                tamilName = "டிகாக்ஷன் டபரா செட்",
                descriptionEnglish = "Brass/steel flared cup and saucer used for cooling and frothing South Indian filter kaapi.",
                descriptionTamil = "பாரம்பரிய கும்பகோணம் டிகிரி பில்டர் காபி டபரா செட்.",
                region = "Chennai",
                isInteractable = true
            },
            new CulturalItemEntry
            {
                id = "brass_kudam",
                englishName = "Brass Kudam (Water Pot)",
                tamilName = "பித்தளை குடம்",
                descriptionEnglish = "Heavy hand-beaten brass vessel used for carrying water from village wells and temple tanks.",
                descriptionTamil = "கிணறு மற்றும் கோயில் தெப்பங்களில் நீர் சுமக்கப் பயன்படும் பித்தளை பாத்திரம்.",
                region = "CauveryDelta",
                isInteractable = true
            }
        };

        public static CulturalItemEntry GetItem(string id)
        {
            foreach (var item in Items)
            {
                if (item.id.Equals(id, StringComparison.OrdinalIgnoreCase)) return item;
            }
            return Items[0];
        }
    }
}
