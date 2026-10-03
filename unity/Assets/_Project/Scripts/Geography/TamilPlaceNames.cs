using System.Collections.Generic;

namespace WhisperingWilds.Geography
{
    /// <summary>
    /// English/Tamil naming authority for geographic places exposed to the player.
    ///
    /// These are the standard official Tamil exonyms, not translations invented for the game.
    /// Neighbouring states and union territories are deliberately present so the map can label
    /// them correctly: Puducherry is a Union Territory and must never be presented as Tamil Nadu.
    /// </summary>
    public static class TamilPlaceNames
    {
        public readonly struct Place
        {
            public readonly string English;
            public readonly string Tamil;
            public readonly bool IsTamilNadu;
            public readonly string Note;

            public Place(string english, string tamil, bool isTamilNadu, string note = null)
            {
                English = english;
                Tamil = tamil;
                IsTamilNadu = isTamilNadu;
                Note = note;
            }
        }

        public static readonly Place[] All =
        {
            new Place("Chennai",           "சென்னை",           true,  "State capital, Coromandel Coast"),
            new Place("Madurai",           "மதுரை",            true,  "Temple city, south Tamil Nadu"),
            new Place("Coimbatore",        "கோயம்புத்தூர்",      true,  "Western Ghats foothills"),
            new Place("Thanjavur",         "தஞ்சாவூர்",         true,  "Cauvery delta, Brihadeeswarar temple"),
            new Place("Tiruchirappalli",   "திருச்சிராப்பள்ளி",   true,  "Cauvery delta"),
            new Place("Salem",             "சேலம்",            true),
            new Place("Tirunelveli",       "திருநெல்வேலி",       true,  "Tamiraparani basin"),
            new Place("Erode",             "ஈரோடு",            true),
            new Place("Vellore",           "வேலூர்",            true),
            new Place("Thoothukudi",       "தூத்துக்குடி",       true,  "Gulf of Mannar coast"),
            new Place("Dindigul",          "திண்டுக்கல்",        true,  "Western Ghats foothills"),
            new Place("Tiruppur",          "திருப்பூர்",         true),
            new Place("Kumbakonam",        "கும்பகோணம்",        true,  "Cauvery delta temple town"),
            new Place("Karaikudi",         "காரைக்குடி",        true,  "Chettinad country"),
            new Place("Cuddalore",         "கடலூர்",            true,  "Pichavaram mangrove belt"),
            new Place("Rajapalayam",       "ராஜபாளையம்",        true,  "Western Ghats"),
            new Place("Valparai",          "வால்பரை",           true,  "Nilgiri hills"),
            new Place("Nagercoil",         "நாகர்கோவில்",        true,  "Southernmost TN, Western Ghats"),
            new Place("Ooty",              "ஊட்டி",             true,  "Nilgiri highlands"),
            new Place("Mamallapuram",      "மாமல்லபுரம்",        true,  "Pallava heritage coast, south of Chennai"),
            new Place("Mahabalipuram",     "மகாலபுரம்",         true,  "Alternate name of Mamallapuram"),
            new Place("Puducherry",        "புதுச்சேரி",         false, "Union Territory of Puducherry - NOT part of Tamil Nadu"),
            new Place("Kerala",            "കേരളം",             false, "Neighbouring state"),
            new Place("Karnataka",         "ಕರ್ನಾಟಕ",          false, "Neighbouring state"),
            new Place("Andhra Pradesh",    "ఆంధ్రప్రదేశ్",     false, "Neighbouring state")
        };

        private static Dictionary<string, string> _tamilByEnglish;

        private static Dictionary<string, string> TamilByEnglish()
        {
            if (_tamilByEnglish != null) return _tamilByEnglish;
            _tamilByEnglish = new Dictionary<string, string>();
            for (int i = 0; i < All.Length; i++)
            {
                _tamilByEnglish[All[i].English] = All[i].Tamil;
            }
            return _tamilByEnglish;
        }

        public static bool TryGetTamil(string english, out string tamil)
        {
            return TamilByEnglish().TryGetValue(english, out tamil);
        }

        public static string GetDisplayName(string english)
        {
            return TryGetTamil(english, out string tamil) ? tamil : english;
        }

        public static bool IsTamilNadu(string english)
        {
            for (int i = 0; i < All.Length; i++)
            {
                if (string.Equals(All[i].English, english, System.StringComparison.OrdinalIgnoreCase))
                {
                    return All[i].IsTamilNadu;
                }
            }
            return false;
        }
    }
}