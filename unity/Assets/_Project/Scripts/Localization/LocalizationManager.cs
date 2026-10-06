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
            new LocalizationEntry("menu.title",           "THE WHISPERING WILDS", "காட்டு வழி • தடம்"),
            new LocalizationEntry("menu.subtitle",        "A Living Exploration & Cultural Investigation of Tamil Nadu", "தமிழ்நாட்டின் வாழ்வியல் ஆய்வும் கலாச்சார கண்டறியும் பயணம்"),

            // ---- Settings ----------------------------------------------------
            new LocalizationEntry("settings.language",        "Language",           "மொழி"),
            new LocalizationEntry("settings.language.english", "English",           "ஆங்கிலம்"),
            new LocalizationEntry("settings.language.tamil",   "Tamil",             "தமிழ்"),
            new LocalizationEntry("settings.ui_scale",         "UI Scale",           "இடைமுக அளவு"),
            new LocalizationEntry("settings.ui_scale.small",   "Small",              "சிறியது"),
            new LocalizationEntry("settings.ui_scale.medium",  "Medium",             "நடுத்தரம்"),
            new LocalizationEntry("settings.ui_scale.large",   "Large",              "பெரியது"),
            new LocalizationEntry("settings.display",          "Display",            "காட்சி"),
            new LocalizationEntry("settings.resolution",       "Resolution",         "திரைத் தெளிவு"),
            new LocalizationEntry("settings.fullscreen",       "Fullscreen",         "முழுத் திரை"),
            new LocalizationEntry("settings.vsync",            "VSync",              "செங்குத்து ஒத்திசைவு"),
            new LocalizationEntry("settings.frame_limit",      "Frame Rate Limit",   "படவீதம் வரம்பு"),
            new LocalizationEntry("settings.quality",          "Graphics Quality",   "வரைகலை தரம்"),
            new LocalizationEntry("settings.quality.very_low", "Very Low",           "மிகக் குறைந்தது"),
            new LocalizationEntry("settings.quality.low",      "Low",                "குறைவு"),
            new LocalizationEntry("settings.quality.medium",   "Medium",             "நடுத்தரம்"),
            new LocalizationEntry("settings.quality.high",     "High",               "உயர்ந்தது"),
            new LocalizationEntry("settings.quality.ultra",    "Ultra",              "அதிநவீனம்"),
            new LocalizationEntry("settings.quality.high_hint",
                                                        "Higher tiers raise shadows, effects, and lighting quality.",
                                                        "அதிக தரம் நிலைகள் நிழல்கள், விளைவுகள் மற்றும் ஒளி தரத்தை அதிகரிக்கும்."),
            new LocalizationEntry("settings.fov",              "Field of View",      "காட்சிப் புலம்"),
            new LocalizationEntry("settings.on",               "On",                 "இயக்கு"),
            new LocalizationEntry("settings.off",              "Off",                "நிறுத்து"),
            new LocalizationEntry("settings.unlimited",        "Unlimited",          "வரம்பற்றது"),
            new LocalizationEntry("hud.rule_notice",     "Rule: A strict maximum of 5 permanent character appearance changes is allowed across the entire journey.",
                                                        "விதிமுறை: முழு பயணத்திலும் அதிகபட்சம் 5 நிரந்தர தோற்ற மாற்றங்கள் மட்டுமே அனுமதிக்கப்படும்."),
            new LocalizationEntry("settings.unavailable",      "Not available on this device", "இந்தச் சாதனத்தில் கிடைக்கவில்லை"),
            new LocalizationEntry("settings.disabled",         "Disabled",           "முடக்கப்பட்டது"),

            // ---- Audio Settings (6 Channels) -----------------
            new LocalizationEntry("settings.audio",            "Audio",              "ஒலி"),
            new LocalizationEntry("settings.audio.master",     "Master Volume",      "முதன்மை ஒலி"),
            new LocalizationEntry("settings.audio.music",      "Music",              "இசை"),
            new LocalizationEntry("settings.audio.ambience",   "Ambience",           "சுற்றுப்புற ஒலி"),
            new LocalizationEntry("settings.audio.sfx",        "Sound Effects",      "விளைவு ஒலிகள்"),
            new LocalizationEntry("settings.audio.voice",      "Dialogue",           "உரையாடல் ஒலி"),
            new LocalizationEntry("settings.audio.ui",         "UI Sounds",          "இடைமுக ஒலி"),

            // ---- Controls & Camera ---------------------------
            new LocalizationEntry("settings.controls",         "Controls",           "கட்டுப்பாடுகள்"),
            new LocalizationEntry("settings.controls.sensitivity", "Mouse Sensitivity", "சுட்டி உணர்திறன்"),
            new LocalizationEntry("settings.controls.sensitivity_y", "Vertical Sensitivity", "செங்குத்து உணர்திறன்"),
            new LocalizationEntry("settings.controls.invert_y", "Invert Y-Axis",     "செங்குத்து அச்சு தலைகீழ்"),
            new LocalizationEntry("settings.controls.invert_x", "Invert X-Axis",     "கிடைமட்ட அச்சு தலைகீழ்"),
            new LocalizationEntry("settings.controls.camera_smoothing", "Camera Smoothing", "கேமரா மென்மைப்படுத்தல்"),
            new LocalizationEntry("settings.controls.sprint_mode", "Sprint Mode",    "விரைவோட்ட முறை"),
            new LocalizationEntry("settings.controls.crouch_mode", "Crouch Mode",    "குனிதல் முறை"),
            new LocalizationEntry("settings.controls.hold",    "Hold",               "பிடி"),
            new LocalizationEntry("settings.controls.toggle",  "Toggle",             "மாற்று"),
            new LocalizationEntry("settings.controls.reset_defaults", "Reset to Default", "இயல்புநிலைக்கு மீட்டமை"),

            // ---- Accessibility -------------------------------
            new LocalizationEntry("settings.accessibility",    "Accessibility",      "அணுகல்தன்மை"),
            new LocalizationEntry("settings.accessibility.subtitles", "Subtitles",   "வசனங்கள்"),
            new LocalizationEntry("settings.accessibility.subtitle_bg", "Subtitle Background", "வசன பின்னணி"),
            new LocalizationEntry("settings.accessibility.subtitle_size", "Subtitle Size", "வசன அளவு"),
            new LocalizationEntry("settings.accessibility.screen_shake", "Screen Shake", "திரை அதிர்வு"),
            new LocalizationEntry("settings.accessibility.motion_blur", "Motion Blur", "இயக்க மங்கலாக்கம்"),
            new LocalizationEntry("settings.accessibility.colorblind", "Colorblind Filter", "வண்ணக்குருடு வடிகட்டி"),
            new LocalizationEntry("settings.accessibility.colorblind.none", "Off",   "நிறுத்து"),
            new LocalizationEntry("settings.accessibility.colorblind.protanopia", "Protanopia", "புரோட்டனோபியா"),
            new LocalizationEntry("settings.accessibility.colorblind.deuteranopia", "Deuteranopia", "டியூட்டரனோபியா"),
            new LocalizationEntry("settings.accessibility.colorblind.tritanopia", "Tritanopia", "ட்ரிட்டானோபியா"),

            // ---- Action Bindings -----------------------------
            new LocalizationEntry("action.move_forward",       "Move Forward",       "முன்னேறு"),
            new LocalizationEntry("action.move_backward",      "Move Backward",      "பின்னேறு"),
            new LocalizationEntry("action.move_left",          "Move Left",          "இடப்பக்கம்"),
            new LocalizationEntry("action.move_right",         "Move Right",         "வலப்பக்கம்"),
            new LocalizationEntry("action.sprint",             "Sprint",             "விரைவோட்டம்"),
            new LocalizationEntry("action.jump",               "Jump",               "குதி"),
            new LocalizationEntry("action.crouch",             "Crouch",             "குனி"),
            new LocalizationEntry("action.interact",           "Interact",           "தொடர்புகொள்"),
            new LocalizationEntry("action.primary",            "Primary Action",     "முதன்மை செயல்"),
            new LocalizationEntry("action.secondary",          "Secondary Action",   "இரண்டாம் செயல்"),
            new LocalizationEntry("action.reload",             "Reload",             "மீண்டும் ஏற்று"),
            new LocalizationEntry("action.swap_tool",          "Swap Tool",          "கருவி மாற்று"),
            new LocalizationEntry("action.quick_item",         "Quick Item",         "விரைவுப் பொருள்"),
            new LocalizationEntry("action.pause",              "Pause Menu",         "இடைநிறுத்து"),
            new LocalizationEntry("action.inventory",          "Inventory",          "பொருளடக்கம்"),
            new LocalizationEntry("action.map",                "Map",                "வரைபடம்"),
            new LocalizationEntry("action.journal",            "Journal",            "குறிப்பேடு"),

            // ---- HUD ---------------------------------------------------------
            new LocalizationEntry("hud.clock",               "Time",                   "நேரம்"),
            new LocalizationEntry("hud.currency",            "Coins",                  "காசுகள்"),
            new LocalizationEntry("hud.currency_value",      "Coins: {0}",             "காசுகள்: {0}"),
            new LocalizationEntry("hud.region",              "Region",                 "பகுதி"),
            new LocalizationEntry("hud.region_chennai_georgetown", "George Town, Chennai", "சென்னை ஜார்ஜ் டவுன்"),
            new LocalizationEntry("hud.appearance_changes",  "Appearance Changes",     "தோற்ற மாற்றங்கள்"),
            new LocalizationEntry("hud.appearance_value",     "Appearance Changes: {0}/{1}", "தோற்ற மாற்றங்கள்: {0}/{1}"),
            new LocalizationEntry("hud.press_to_interact",   "Press {0}",              "{0} அழுத்தவும்"),
            new LocalizationEntry("hud.am",                  "AM",                     "காலை"),
            new LocalizationEntry("hud.pm",                  "PM",                     "மாலை"),

            // ---- Antigravity field (schema v3 physics feature) --------------
            new LocalizationEntry("hud.gravity.inverted",   "Gravity Field Inverted",        "புவிஈர்ப்பு விசை மாற்றமடைந்துள்ளது"),
            new LocalizationEntry("hud.gravity.descend",    "C: Descend / Sink",             "C: கீழிறங்கு / மூழ்கு"),
            new LocalizationEntry("hud.gravity.energy",     "Field Energy",                  "விசை ஆற்றல்"),
            new LocalizationEntry("hud.gravity.bodies",     "Floating Objects: {0}",          "மிதிர்வு பொருட்கள்: {0}"),

            // ---- Main character interaction prompts -------------------------
new LocalizationEntry("talk.default",      "Talk to {0}",        "{0} பேசுவதற்கு"),
new LocalizationEntry("talk.meenakshi", "Talk to Meenakshi", "மீனாட்சி பேசுவதற்கு"),
new LocalizationEntry("talk.murugan", "Talk to Murugan", "முருகன் பேசுவதற்கு"),
new LocalizationEntry("talk.selvam", "Talk to Selvam", "செல்வம் பேசுவதற்கு"),
new LocalizationEntry("talk.velu", "Talk to Velu", "வேலு பேசுவதற்கு"),
new LocalizationEntry("talk.kannan", "Talk to Kannan", "கண்ணனுடன் பேசுவதற்கு"),

// Every NPC placed in 02_Chennai_GeorgeTown, plus every role key MainCharacterRegistry.MakeResident()
// generates, so an interaction prompt never falls back to English or to a missing-key placeholder.
new LocalizationEntry("talk.ammu", "Talk to Ammu", "அம்மு பேசுவதற்கு"),
new LocalizationEntry("talk.balan", "Talk to Balan", "பாலன் பேசுவதற்கு"),
new LocalizationEntry("talk.devi", "Talk to Devi", "தேவி பேசுவதற்கு"),
new LocalizationEntry("talk.gopi", "Talk to Gopi", "கோபி பேசுவதற்கு"),
new LocalizationEntry("talk.hari", "Talk to Hari", "ஙரி பேசுவதற்கு"),
new LocalizationEntry("talk.kannammal", "Talk to Kannammal", "கண்ணம்மாள் பேசுவதற்கு"),
new LocalizationEntry("talk.radha", "Talk to Radha", "ராதா பேசுவதற்கு"),
new LocalizationEntry("talk.ravi", "Talk to Ravi", "ரவி பேசுவதற்கு"),
new LocalizationEntry("talk.selvaraj", "Talk to Selvaraj", "செல்வராஜ் பேசுவதற்கு"),
new LocalizationEntry("talk.siva", "Talk to Siva", "சிவா பேசுவதற்கு"),
new LocalizationEntry("talk.resident_01", "Talk to the Farmer", "விவசாயி பேசுவதற்கு"),
new LocalizationEntry("talk.resident_02", "Talk to the Shopkeeper", "கடைக்காரர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_03", "Talk to the Fisherman", "மீனவர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_04", "Talk to the Artisan", "கைப்பொழிலாளர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_05", "Talk to the Tea Worker", "தேயிலைப்பணியாளர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_06", "Talk to the Resident", "குடிமகர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_07", "Talk to the Elder", "முதிர்ந்தோர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_08", "Talk to the Delivery Worker", "குடிமகர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_09", "Talk to the Market Worker", "கடைக்காரர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_10", "Talk to the Craft Worker", "கைப்பொழிலாளர் பேசுவதற்கு"),
new LocalizationEntry("talk.resident_11", "Talk to the Farmer", "விவசாயி பேசுவதற்கு"),
new LocalizationEntry("talk.resident_12", "Talk to the Fisherman", "மீனவர் பேசுவதற்கு"),

            // ---- Notifications / save-load -----------------------------------
            new LocalizationEntry("notify.game_saved",    "Game Saved",    "விளையாட்டு சேமிக்கப்பட்டது"),
            new LocalizationEntry("notify.game_loaded",   "Game Loaded",   "விளையாட்டு ஏற்றப்பட்டது"),
            new LocalizationEntry("notify.region_entered","Entered {0}",   "{0} பகுதியில் நுழைந்தீர்கள்"),
            new LocalizationEntry("notify.item_added",    "Acquired {0}",  "{0} பெறப்பட்டது"),
            new LocalizationEntry("notify.save_recovered_backup", "Save recovered from backup", "சேமிப்பு காப்புப் பிரதியிலிருந்து மீட்டெடுக்கப்பட்டது"),
            new LocalizationEntry("notify.save_corrupt",  "Save file is unreadable", "சேமிப்புக் கோப்பு வாசிக்க முடியவில்லை"),
            new LocalizationEntry("notify.save_none_continue", "No save to continue", "தொடர வேண்டிய சேமிப்பு இல்லை"),
            new LocalizationEntry("notify.save_none_to_load",   "No save to load",     "ஏற்ற விளையாட்டு இல்லை"),

            // ---- Gameplay ----------------------------------------------------
            new LocalizationEntry("dialogue.continue",    "Continue",      "தொடர"),
            new LocalizationEntry("dialogue.talk",        "Talk",          "பேசு"),
            new LocalizationEntry("vegetation.stage",     "{0} ({1})",     "{0} ({1})"),
            new LocalizationEntry("investigation.clue",   "Clue",          "குறிப்பு"),
            new LocalizationEntry("quest.title",          "Quest",         "நோக்கம்"),
            new LocalizationEntry("inventory.items",      "Items",         "பொருட்கள்"),
            new LocalizationEntry("interaction.examine",  "Examine",       "ஆராய்கு"),
            new LocalizationEntry("interaction.harvest",  "Harvest",       "அறுவடு"),
            new LocalizationEntry("interaction.pluck",     "Pluck",         "பறி"),
            new LocalizationEntry("veg.stage.seed",        "Seed",          "விதை"),
            new LocalizationEntry("veg.stage.sprout",      "Sprout",        "தளிர்"),
            new LocalizationEntry("veg.stage.growing",     "Growing",       "வளரும்"),
            new LocalizationEntry("veg.stage.young",       "Young",         "இளம் பயிர்"),
            new LocalizationEntry("veg.stage.mature",      "Mature",        "முதிர்ந்தது"),
            new LocalizationEntry("veg.stage.flowering",   "Flowering",     "பூக்கும்"),
            new LocalizationEntry("veg.stage.fruiting",    "Fruiting",      "காய்க்கும்"),
            new LocalizationEntry("veg.stage.harvestable", "Harvestable",   "அறுவடைக்குத் தயார்"),
            new LocalizationEntry("veg.stage.regrowing",   "Regrowing",     "மீண்டும் வளரும்"),
            new LocalizationEntry("veg.stage.dormant",     "Dormant",       "செயலற்றது"),
            new LocalizationEntry("veg.stage.developing_fruit", "Developing Fruit", "காய்கள் வளர்கின்றன"),
            new LocalizationEntry("veg.stage.ripe",        "Ripe",          "பழுத்தது"),
            new LocalizationEntry("veg.stage.harvested",   "Harvested",     "அறுவடை செய்யப்பட்டது"),
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
        new LocalizationEntry("place.chennai",            "Chennai",            "சென்னை"),
            new LocalizationEntry("place.madurai",            "Madurai",            "மதுரை"),
            new LocalizationEntry("place.coimbatore",         "Coimbatore",         "கோயம்புத்தூர்"),
            new LocalizationEntry("place.thanjavur",          "Thanjavur",          "தஞ்சாவூர்"),
            new LocalizationEntry("place.mamallapuram",       "Mamallapuram",       "மாமல்லபுரம்"),
            new LocalizationEntry("place.mahabalipuram",      "Mahabalipuram",      "மகாலபுரம்"),
            new LocalizationEntry("place.pichavaram",         "Pichavaram",         "பிச்சாவரம்"),
            new LocalizationEntry("place.chettinad",          "Chettinad",          "செட்டிநாடு"),
            new LocalizationEntry("place.nilgiris",           "Nilgiris",           "நீலகிரி"),
            new LocalizationEntry("place.cuddalore",          "Cuddalore",          "கடலூர்"),
            new LocalizationEntry("place.kumbakonam",         "Kumbakonam",         "கும்பகோணம்"),
            new LocalizationEntry("place.karaikudi",          "Karaikudi",          "காரைக்குடி"),
            new LocalizationEntry("place.ooty",               "Ooty",               "ஊட்டி"),
            new LocalizationEntry("place.valparai",           "Valparai",           "வால்பரை"),
            new LocalizationEntry("place.tiruchirappalli",    "Tiruchirappalli",    "திருச்சிராப்பள்ளி"),
            new LocalizationEntry("place.salem",              "Salem",              "சேலம்"),
            new LocalizationEntry("place.tirunelveli",        "Tirunelveli",        "திருநெல்வேலி"),
            new LocalizationEntry("place.tiruppur",           "Tiruppur",           "திருப்பூர்"),
            new LocalizationEntry("place.dindigul",           "Dindigul",           "திண்டுக்கல்"),
            new LocalizationEntry("place.nagercoil",          "Nagercoil",          "நாகர்கோவில்"),
            new LocalizationEntry("place.thoothukudi",        "Thoothukudi",        "தூத்துக்குடி"),
            new LocalizationEntry("place.vellore",            "Vellore",            "வேலூர்"),
            new LocalizationEntry("place.rajapalayam",        "Rajapalayam",        "ராஜபாளையம்"),
            new LocalizationEntry("place.puducherry",         "Puducherry (Union Territory, not Tamil Nadu)", "புதுச்சேரி (ஒரே சுயாதீனப் பிரதேசம், தமிழ்நாடு அல்ல)"),

            // ---- Destination unlock gate -------------------------------------
            new LocalizationEntry("region.unlocked",         "{0} Unlocked",                   "{0} திறக்கப்பட்டது"),
            new LocalizationEntry("region.locked",           "{0} is not available yet",       "{0} இன்னும் கிடைக்கவில்லை"),
            new LocalizationEntry("region.locked_hint",      "Keep exploring to open new destinations.", "புதிய இடங்களைத் திறக்க ஆராய்வைத் தொடரவும்."),
            new LocalizationEntry("region.deferred",       "{0} is not part of this story yet.", "{0} இன்னும் இக்கதையின் பகுதியல்ல."),

            // ---- Investigation feedback --------------------------------------
            // The exact wording the Chettinad investigation brief requires. Keyed rather than
            // hardcoded so the toast follows the active language with no per-object duplication.
            new LocalizationEntry("investigate.important",   "Something about this seems important.",
                                                                          "இதில் ஏதோ முக்கியமான விஷயம் இருக்கிறது."),
            new LocalizationEntry("investigate.already_recorded", "Already recorded.",
                                                                          "ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது."),
            new LocalizationEntry("investigate.clue_recorded",  "Recorded: {0}",
                                                                          "பதிவு செய்யப்பட்டது: {0}"),
            new LocalizationEntry("investigate.item_taken",     "Taken: {0}",
                                                                          "எடுத்துக்கொண்டது: {0}"),

            // ---- Chettinad mansion interactables ------------------------------
            new LocalizationEntry("chettinad.inspect.hall",      "Investigate the main hall",        "முதன்மை மண்டபத்தை ஆராய்க"),
            new LocalizationEntry("chettinad.inspect.shelf",     "Examine the hall shelf",          "மண்டப அலமரத்தைப் பார்க்க"),
            new LocalizationEntry("chettinad.inspect.side_room", "Search the side room",            "பக்க அறையைத் தேடுக"),
            new LocalizationEntry("chettinad.inspect.chest",     "Open the chest in the side room", "பக்க அறையிலுள்ள பெட்டியைத் திறக்க"),
            new LocalizationEntry("chettinad.inspect.mark_sun",     "Examine the medallion above the north colonnade", "வடக்கு மேடையின் மேலுள்ள மொடியைப் பார்க்க"),
            new LocalizationEntry("chettinad.inspect.mark_serpent", "Examine the carving on the east gutter",           "கிழக்கு வடிகாலின் வெட்டைப் பார்க்க"),
            new LocalizationEntry("chettinad.inspect.mark_wheel",   "Examine the carving over the dry well",            "வறண்ட கிணற்றின் மேலுள்ள வெட்டைப் பார்க்க"),
            new LocalizationEntry("chettinad.inspect.photo",     "Take down the framed photograph",  "சாட்டையிலுள்ள படத்தை எடுக்க"),
            new LocalizationEntry("chettinad.inspect.letter",    "Read the sealed letter",           "மூடிய கடிதத்தைப் படிக்க"),
            new LocalizationEntry("chettinad.inspect.desk",      "Record what you found",            "நீங்கள் கண்டதைப் பதிவு செய்க"),
            new LocalizationEntry("chettinad.door.family_room",  "Locked family room door",          "மூடப்பட்ட குடும்ப அறைக் கதவு"),

            // ---- Mamallapuram shore interactables -----------------------------
            // BuildMamallapuramShore writes these keys onto the five investigation
            // boxes. Without the entries ResolvePromptLabel would render the
            // "missing.<key>" placeholder in both languages, since Get() returns that
            // placeholder rather than an empty string.
            new LocalizationEntry("mamallapuram.inspect.fisher_lantern", "Take the fisher's lantern",        "மீனவரின் விளக்கை எடுங்கள்"),
            new LocalizationEntry("mamallapuram.inspect.tally_stone",    "Read the carved tally",            "வெட்டப்பட்ட எண்ணடைப் படியுங்கள்"),
            new LocalizationEntry("mamallapuram.inspect.stone_blocks",   "Examine the half-worked blocks",   "நிறைவில்லாத கட்டைகளை ஆராயுங்கள்"),
            new LocalizationEntry("mamallapuram.inspect.carving_yard",   "Examine the sheltered stone face", "பாதுகாப்பான கல் மேற்பரப்பை ஆராயுங்கள்"),
            new LocalizationEntry("mamallapuram.inspect.signal_post",    "Read the signal post",             "அச்சுக் கம்பத்தைப் படியுங்கள்"),

            // ---- Chettinad medallion lock -------------------------------------
            new LocalizationEntry("chettinad.puzzle.dial",             "Turn the dial ({0})",           "சக்கரத்தைச் சுழற்றுக ({0})"),
            // The combination readout replaces a submit button: three dials cannot each hold a
            // toast, and the player needs the whole reading to reason about the order.
            new LocalizationEntry("chettinad.puzzle.dials",            "Dials: {0} / {1} / {2}",       "சக்கரங்கள்: {0} / {1} / {2}"),
            new LocalizationEntry("chettinad.puzzle.needs_clues",
                "Three dials, and the lock does not move. It wants an order, and this courtyard holds it.",
                "மூன்று சக்கரங்கள், பூட்டு நகரவில்லை. ஒரு வரிசை வேண்டும், அது இந்த முற்றாவீட்டில் உள்ளது."),
            new LocalizationEntry("chettinad.puzzle.wrong",
                // The dials keep the values the player set: the lock judges and refuses, it does not
                // silently rewind them, so this text must not claim it does.
                "The lock does not move. Nothing opens.",
                "பூட்டு நகரவில்லை. எதுவும் திறக்கவில்லை."),
            new LocalizationEntry("chettinad.puzzle.hint_1",
                "Each number is somewhere in this courtyard. Count what the medallions show.",
                "ஒவ்வொரு எண்ணும் இந்த முற்றாவீட்டிலே உள்ளது. மொடிகள் என்ன காட்டுகின்றன என்பதை எண்ணுங்கள்."),
            new LocalizationEntry("chettinad.puzzle.hint_2",
                "The house was walked from the first light to the last. Smallest to largest.",
                "இந்த வீட்டை முதல் வெளிச்சத்திலிருந்து கடைசி வெளிச்சம் வரை நடந்தார்கள். சிறியதிலிருந்து பெரியது வரை."),
            new LocalizationEntry("chettinad.puzzle.solved",
                "The wall moves. There is a room behind it.",
                "சுவர் நகருகிறது. அதற்குப் பின்புறம் ஒரு அறை உள்ளது."),

            // ---- Chettinad locked door ---------------------------------------
            new LocalizationEntry("chettinad.door.needs_key",
                "Painted shut and wired. Something small must open it.",
                "சாமத்தால் அடைக்கப்பட்டு இலச்சிக்கப்பட்டுள்ளது. சிறிய ஒரு உருப்பு ஏதோ திறக்க வேண்டும்."),
            new LocalizationEntry("chettinad.door.unlocked_key",
                "The old key fits.",
                "பழைய சாவி பொருந்துகிறது."),
            new LocalizationEntry("chettinad.door.open",
                "The family room is open.",
                "குடும்ப அறை திறந்துவிட்டது."),

            // ---- Discovery log -------------------------------------------------
            new LocalizationEntry("journal.discoveries",     "Important Discoveries",   "முக்கியக் கண்டுபிடிப்புகள்"),
            new LocalizationEntry("journal.no_discoveries",  "Nothing resolved yet.",   "இன்னும் எதுவும் தீர்மானிக்கப்படவில்லை."),
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

        public static LocalizationDatabase Instance { get; } = new LocalizationDatabase();

        public string Get(string key, string language) => GetEntryString(key, language);

        public static string GetEntryString(string key, string language)
        {
            if (TryGetEntry(key, out var entry))
            {
                if (string.Equals(language, "Tamil", System.StringComparison.OrdinalIgnoreCase))
                    return entry.tamil;
                return entry.english;
            }
            return string.Empty;
        }

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
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
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

        /// <summary>
        /// Display-safe lookup for anything a player can actually read.
        ///
        /// <see cref="Get"/> intentionally returns the <c>missing.</c> placeholder so that
        /// developers notice gaps during testing. That placeholder is an internal identifier,
        /// so UI must never surface it: a missing key is reported once and then rendered as a
        /// neutral label instead.
        /// </summary>
        public string GetForDisplay(string key, string safeFallback = "")
        {
            if (LocalizationDatabase.TryGetEntry(key, out var entry))
            {
                if (CurrentLanguage == Language.Tamil && !string.IsNullOrEmpty(entry.tamil)) return entry.tamil;
                if (!string.IsNullOrEmpty(entry.english)) return entry.english;
                if (!string.IsNullOrEmpty(entry.tamil)) return entry.tamil;
            }

            ReportMissingKey(key);
            return safeFallback ?? string.Empty;
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
