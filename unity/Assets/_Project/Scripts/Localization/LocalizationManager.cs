using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Localization
{
    /// <summary>
    /// Supported interface languages. Tamil is a first-class language, not a transliteration
    /// layer: every entry stores real Tamil Unicode text (U+0B80..U+0BFF).
    /// </summary>
    public enum Language
    {
        English = 0,
        Tamil = 1
    }

    /// <summary>
    /// A single bilingual entry. <see cref="tamil"/> may be intentionally empty; lookups then
    /// fall back to <see cref="english"/> rather than returning an empty UI label.
    /// </summary>
    [Serializable]
    public struct LocalizationEntry
    {
        public string key;
        public string english;
        public string tamil;

        public LocalizationEntry(string key, string english, string tamil)
        {
            this.key = key;
            this.english = english;
            this.tamil = tamil;
        }
    }

    /// <summary>
    /// Centralized bilingual string table. Hard-coded English/Tamil conditionals are banned
    /// across the project; all UI reads <see cref="LocalizationManager.Get"/> instead.
    /// </summary>
    public class LocalizationDatabase
    {
        public const string FallbackKeyPrefix = "missing.";

        private static readonly List<LocalizationEntry> Entries = new List<LocalizationEntry>
        {
            // ---- Title menu -------------------------------------------------
            new LocalizationEntry("menu.new_game",        "New Game",            "புதிய விளையாட்டு"),
            new LocalizationEntry("menu.continue",        "Continue",             "தொடரவும்"),
            new LocalizationEntry("menu.settings",        "Settings",             "அமைப்புகள்"),
            new LocalizationEntry("menu.codex",           "Codex",                "குறிப்பேடு"),
            new LocalizationEntry("menu.quit",            "Quit",                 "வெளியேறு"),
            new LocalizationEntry("menu.back",            "Back",                 "பின்செல்"),
            new LocalizationEntry("menu.apply",           "Apply",                "பயன்படுத்து"),
            new LocalizationEntry("menu.title",           "THE WHISPERING WILDS", "காட்டு வழி"),
            new LocalizationEntry("menu.subtitle",        "Tamil Nadu Nature Trail", "தமிழ்நாடு இயற்கை வழி"),

            // ---- Settings ----------------------------------------------------
            new LocalizationEntry("settings.language",        "Language / மொழி", "மொழி / Language"),
            new LocalizationEntry("settings.language.english", "English",           "ஆங்கிலம்"),
            new LocalizationEntry("settings.language.tamil",   "தமிழ்",             "தமிழ்"),
            new LocalizationEntry("settings.ui_scale",         "UI Scale",           "இடைமுக அளவு"),
            new LocalizationEntry("settings.ui_scale.small",   "Small",              "சிறியது"),
            new LocalizationEntry("settings.ui_scale.medium",  "Medium",             "நடுத்தரம்"),
            new LocalizationEntry("settings.ui_scale.large",   "Large",              "பெரியது"),
            new LocalizationEntry("settings.display",          "Display",            "காட்சி"),
            new LocalizationEntry("settings.resolution",       "Resolution",         "திரும்பம்"),
            new LocalizationEntry("settings.fullscreen",       "Fullscreen",         "முழுத் திரை"),
            new LocalizationEntry("settings.vsync",            "VSync",              "VSync"),
            new LocalizationEntry("settings.frame_limit",      "Frame Rate Limit",   "படவீதம் வரம்பு"),
            new LocalizationEntry("settings.quality",          "Graphics Quality",   "வரைகுறு தரம்"),
            new LocalizationEntry("settings.quality.very_low", "Very Low",           "மிகக் குறைந்தது"),
            new LocalizationEntry("settings.quality.low",      "Low",                "குறைவு"),
            new LocalizationEntry("settings.quality.medium",   "Medium",             "நடுத்தரம்"),
            new LocalizationEntry("settings.quality.high",     "High",               "உயர்ந்தது"),
            new LocalizationEntry("settings.quality.ultra",    "Ultra",              "அதிநவீனம்"),
            new LocalizationEntry("settings.quality.high_hint",
                                                        "Higher tiers raise shadows, effects, and lighting quality.",
                                                        "அதிக தரம் நிலைகள் நிழல்கள், விளைவுகள் மற்றும் ஒளி தரத்தை அதிகரிக்கும்."),
            new LocalizationEntry("settings.on",              "On",                 "இயக்கு"),
            new LocalizationEntry("settings.off",             "Off",                "நிறுத்து"),
            new LocalizationEntry("settings.unlimited",       "Unlimited",          "வரம்பற்றது"),
            new LocalizationEntry("hud.rule_notice",     "Rule: A strict maximum of 5 permanent character appearance changes is allowed across the entire journey.",
                                                        "விதிமுறை: முழு பயணத்திலும் அதிகபட்சம் 5 நிரந்தர தோற்ற மாற்றங்கள் மட்டுமே அனுமதிக்கப்படும்."),
            new LocalizationEntry("settings.unavailable",      "Not available on this device", "இந்தச் சாதனத்தில் கிடைக்கவில்லை"),
            new LocalizationEntry("settings.disabled",         "Disabled",           "முடக்கப்பட்டது"),

            // ---- HUD ---------------------------------------------------------
            new LocalizationEntry("hud.clock",               "Time",                   "நேரம்"),
            new LocalizationEntry("hud.currency",            "Coins",                  "காசுகள்"),
            new LocalizationEntry("hud.currency_value",      "Coins: {0}",             "காசுகள்: {0}"),
            new LocalizationEntry("hud.region",              "Region",                 "பகுதி"),
            new LocalizationEntry("hud.appearance_changes",  "Appearance Changes",     "தோற்ற மாற்றங்கள்"),
            new LocalizationEntry("hud.appearance_value",     "Appearance Changes: {0}/{1}", "தோற்ற மாற்றங்கள்: {0}/{1}"),
            new LocalizationEntry("hud.press_to_interact",   "Press {0}",              "{0} அழுத்தவும்"),
            new LocalizationEntry("hud.am",                  "AM",                     "பி.ப"),
            new LocalizationEntry("hud.pm",                  "PM",                     "பி.ப"),

            // ---- Notifications / save-load -----------------------------------
            new LocalizationEntry("notify.game_saved",    "Game Saved",    "விளையாட்டு சேமிக்கப்பட்டது"),
            new LocalizationEntry("notify.game_loaded",   "Game Loaded",   "விளையாட்டு ஏற்றப்பட்டது"),
            new LocalizationEntry("notify.region_entered","Entered {0}",   "{0} பகுதியில் நுழைந்தீர்கள்"),
            new LocalizationEntry("notify.item_added",    "Acquired {0}",  "{0} பெறப்பட்டது"),

            // ---- Gameplay ----------------------------------------------------
            new LocalizationEntry("dialogue.continue",    "Continue",      "தொடர"),
            new LocalizationEntry("dialogue.talk",        "Talk",          "பேசு"),
            new LocalizationEntry("investigation.clue",   "Clue",          "குறிப்பு"),
            new LocalizationEntry("quest.title",          "Quest",         "நோக்கம்"),
            new LocalizationEntry("inventory.items",      "Items",         "பொருட்கள்"),
            new LocalizationEntry("interaction.examine",  "Examine",       "ஆராய்கு"),
            new LocalizationEntry("interaction.harvest",  "Harvest",       "அறுவடு"),
            new LocalizationEntry("interaction.water",    "Water",         "நீர்"),
            new LocalizationEntry("interaction.investigate","Investigate",   "ஆராய்கு"),
            new LocalizationEntry("interaction.collect",   "Collect",        "சேகரி"),
            new LocalizationEntry("interaction.read",      "Read",           "படி"),
            new LocalizationEntry("interaction.pickup",    "Pick up",        "எடு"),

            // ---- Field journal & crafting bench -------------------------------
            new LocalizationEntry("journal.title",       "Field Journal",    "களப்பேணி"),
            new LocalizationEntry("journal.quests",      "Quests",           "நோக்கங்கள்"),
            new LocalizationEntry("journal.clues",       "Recorded Clues",   "பதிவுசெய்த சான்றுகள்"),
            new LocalizationEntry("journal.deductions",  "Deductions",       "முடிவுகள்"),
            new LocalizationEntry("journal.contacts",    "People Met",       "சந்தித்தவர்கள்"),
            new LocalizationEntry("journal.no_quests",    "No active quests.",   "செயலூக்க நோக்கங்கள் இல்லை."),
            new LocalizationEntry("journal.no_clues",     "Nothing recorded yet.", "இன்னும் எதுவும் பதிவு செய்யப்படவில்லை."),
            new LocalizationEntry("journal.no_deductions","Link two records to form a deduction.", "முடிவை உருவாக்க இரு பதிவுகளை இணையுங்கள்."),
            new LocalizationEntry("journal.no_contacts",  "You have not spoken to anyone yet.", "நீங்கள் யாருடனும் பேசவில்லை."),
            new LocalizationEntry("crafting.title",       "Crafting",          "தயாரிப்பு"),
            new LocalizationEntry("crafting.craft",       "Craft",             "தயாரி"),
            new LocalizationEntry("crafting.no_recipes",  "No recipes known.",  "செய்முறைகள் தெரியவில்லை."),
            new LocalizationEntry("crafting.unavailable", "Crafting is unavailable in this region.", "இந்தப் பகுதியில் தயாரிப்பு இல்லை."),

            // ---- Region display names ----------------------------------------
            new LocalizationEntry("region.chennai",      "Chennai George Town",  "சென்னை ஜார்ஜன் டவுன்"),
            new LocalizationEntry("region.pichavaram",   "Pichavaram Wetlands", "பிச்சாவரம் ஈரநிலங்கள்"),
            new LocalizationEntry("region.thanjavur",    "Thanjavur Delta",      "தஞ்சாவூர் குடாநாங்கில்"),
            new LocalizationEntry("region.chettinad",    "Chettinad Mansion",    "செட்டிநாடு அரண்மனை"),
            new LocalizationEntry("region.mamallapuram", "Mamallapuram Shore",   "மாமல்லபுரம் கடற்கரை"),
            new LocalizationEntry("region.nilgiris",     "Nilgiris Sanctuary",   "நீலகிரி சரணக் காடு"),
        };

        private static readonly Dictionary<string, LocalizationEntry> Lookup = BuildLookup();

        private static Dictionary<string, LocalizationEntry> BuildLookup()
        {
            var map = new Dictionary<string, LocalizationEntry>(Entries.Count, StringComparer.Ordinal);
            foreach (var entry in Entries)
            {
                if (string.IsNullOrEmpty(entry.key)) continue;
                map[entry.key] = entry;
            }
            return map;
        }

        public static int Count => Lookup.Count;

        public static bool Has(string key)
        {
            return !string.IsNullOrEmpty(key) && Lookup.ContainsKey(key);
        }

        public static IEnumerable<string> AllKeys => Lookup.Keys;

        /// <summary>
        /// Every entry in declaration order. Exposed so content-validation tooling and tests can
        /// audit the whole database rather than only the keys it happens to know about.
        /// </summary>
        public static IReadOnlyList<LocalizationEntry> AllEntries => Entries;

        /// <summary>Reads a single entry. Used by content-validation tooling and tests.</summary>
        public static bool TryGetEntryForTests(string key, out LocalizationEntry entry) => TryGetEntry(key, out entry);

        public static bool TryGetEntry(string key, out LocalizationEntry entry)
        {
            entry = default;
            if (string.IsNullOrEmpty(key)) return false;
            return Lookup.TryGetValue(key, out entry);
        }
    }

    /// <summary>
    /// Runtime language authority. Owns the active <see cref="Language"/>, persists the choice,
    /// fires a change event so every UI surface updates immediately without a scene reload, and
    /// reports missing keys once in development builds rather than spamming every frame.
    /// </summary>
    [DisallowMultipleComponent]
    public class LocalizationManager : MonoBehaviour
    {
        public const string PlayerPrefsKey = "WW_Language";

        public static LocalizationManager Instance { get; private set; }

        private static readonly HashSet<string> ReportedMissingKeys = new HashSet<string>(StringComparer.Ordinal);

        public Language CurrentLanguage { get; private set; } = Language.English;

        /// <summary>Raised after the active language changes. Subscribers should re-read their text.</summary>
        public event Action<Language> OnLanguageChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            // Loaded here rather than in Start: UI components can run their own Start and read
            // CurrentLanguage before this component's Start, which left the persisted language
            // showing English on first boot and never fired a change event to correct it.
            CurrentLanguage = LoadPersistedLanguage();
        }

        private void Start()
        {
            Debug.Log($"<color=#00D2FF><b>[LocalizationManager]</b></color> Active language: {CurrentLanguage} ({LocalizationDatabase.Count} keys loaded)");

            if (!LocalizedFontProvider.HasTamilCoverage)
            {
                Debug.LogWarning("<color=#FFCC00><b>[LocalizationManager]</b></color> Tamil is selected but no Tamil-capable font is installed. Add one under Assets/_Project/Fonts; see its README.");
            }
        }

        /// <summary>Central lookup. Falls back to English when a Tamil string is absent.</summary>
        public string Get(string key)
        {
            if (LocalizationDatabase.TryGetEntry(key, out var entry))
            {
                if (CurrentLanguage == Language.Tamil && !string.IsNullOrEmpty(entry.tamil))
                {
                    return entry.tamil;
                }
                if (!string.IsNullOrEmpty(entry.english))
                {
                    return entry.english;
                }
                return entry.tamil;
            }

            ReportMissingKey(key);
            return LocalizationDatabase.FallbackKeyPrefix + key;
        }

        /// <summary>Lookup with positional formatting, e.g. Get("hud.press_to_interact", "E").</summary>
        public string Get(string key, params object[] args)
        {
            string template = Get(key);
            if (args == null || args.Length == 0) return template;
            try
            {
                return string.Format(template, args);
            }
            catch (FormatException)
            {
                // A malformed format string must never take down the UI.
                return template;
            }
        }

        public bool HasKey(string key) => LocalizationDatabase.Has(key);

        public void SetLanguage(Language language)
        {
            if (CurrentLanguage == language)
            {
                PersistLanguage(language);
                return;
            }

            CurrentLanguage = language;
            PersistLanguage(language);
            OnLanguageChanged?.Invoke(language);
            Debug.Log($"<color=#00FF99><b>[LocalizationManager]</b></color> Language changed to {language}");
        }

        public void ToggleLanguage()
        {
            SetLanguage(CurrentLanguage == Language.English ? Language.Tamil : Language.English);
        }

        private static Language LoadPersistedLanguage()
        {
            if (!PlayerPrefs.HasKey(PlayerPrefsKey)) return Language.English;
            int raw = PlayerPrefs.GetInt(PlayerPrefsKey, (int)Language.English);
            return Enum.IsDefined(typeof(Language), raw) ? (Language)raw : Language.English;
        }

        private static void PersistLanguage(Language language)
        {
            PlayerPrefs.SetInt(PlayerPrefsKey, (int)language);
            PlayerPrefs.Save();
        }

        private static void ReportMissingKey(string key)
        {
            if (string.IsNullOrEmpty(key)) return;

            // One report per key per session: a UI element calling Get() every frame must not
            // flood the log in development builds.
            if (!ReportedMissingKeys.Add(key)) return;

            Debug.LogWarning($"<color=#FFCC00><b>[LocalizationManager]</b></color> Missing localization key: '{key}'. Falling back to the key placeholder. Add it to LocalizationDatabase.");
        }

        /// <summary>Clears the missing-key report set. Intended for automated validation tests.</summary>
        public static void ResetMissingKeyReports() => ReportedMissingKeys.Clear();
    }
}
