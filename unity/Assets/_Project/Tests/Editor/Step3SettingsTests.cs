using System.Collections.Generic;
using System.Text;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Display;
using WhisperingWilds.Localization;
using WhisperingWilds.Quality;

namespace WhisperingWilds.Tests
{
    /// <summary>
    /// Verifies that a candidate font can actually render the Tamil the game displays.
    /// </summary>
    /// <remarks>
    /// Glyph coverage is checked through <c>Font.HasCharacter</c>, which is Unity's own glyph
    /// lookup for dynamic fonts. A font that loads fine but has no Tamil coverage renders every
    /// string as blank boxes, and this is what catches that.
    ///
    /// When no Tamil-capable font is present these tests fail and name the fix, rather than
    /// passing quietly. A silently passing font test is exactly how broken Tamil ships.
    /// </remarks>
    public class TamilFontCoverageTests
    {
        /// <summary>Assigned Tamil block, U+0B80 to U+0BFF.</summary>
        private const int TamilBlockStart = 0x0B80;
        private const int TamilBlockEnd = 0x0BFF;

        /// <summary>Strings the game renders, including the hard cases named in the brief.</summary>
        private static readonly string[] RequiredStrings =
        {
            // Bare consonants with no vowel, which form the largest conjunct-only group.
            "ழ ற ள ண ன ங",
            // Every independent vowel.
            "அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ ஃ",
            // Dependent vowel signs including pulli and the two-part and chillu forms.
            "அ் ஆ் இ் ஈ் உ் ஊ் எ் ஏ் ஐ் ஒ் ஓ் ஔ்",
            "க் ச் ட் த் ண் ந் ப் ம் ய் ர் ல் வ் ள் ற் ன்",
            // Conjunct clusters plus chillu letters.
            "க்கு ஞ்சு ட்டு ண்ணு ந்று ற்பு ல்லு வ்வு ள்ளு ற்று",
            // Grantha letters used in Tamil proper nouns.
            "ஸ்ரீ ஶ்ரீ க்ஷ",
            // Mixed-script lines, which is what the title screen and HUD actually show.
            "Settings • அமைப்புகள்",
            "காட்டு வழி • தடம்",
            // Numerals and punctuation.
            "1234567890",
            "!?.,:;-()[]/",
            // Region and menu names as stored in the localization database.
            "அமைப்புகள் தொடரவும் வெளியேறு குறிப்பேடு",
            "சென்னை பிச்சாவரம் தஞ்சாவூர் செட்டினாடு மாமல்லபுரம் நீலகிரி"
        };

        private Font _font;

        [SetUp]
        public void ResolveFont()
        {
            _font = LocalizedFontProvider.Font;
            Assert.That(_font, Is.Not.Null, "LocalizedFontProvider returned no font at all.");
        }

        [Test]
        public void ResolvedFontIsReportedAsTamilCapable()
        {
            Assert.That(
                LocalizedFontProvider.HasTamilCoverage,
                Is.True,
                "No Tamil-capable font is available. Add NotoSansTamil-Regular.ttf (SIL OFL) under " +
                "Assets/_Project/Fonts and reference it from LocalizedFontProvider. On a Windows " +
                "development machine an OS font such as Nirmala UI should satisfy this.");
        }

        [Test]
        public void EveryAssignedTamilCodepointHasAGlyph()
        {
            StringBuilder missing = new StringBuilder();
            int checkedCount = 0;

            for (int cp = TamilBlockStart; cp <= TamilBlockEnd; cp++)
            {
                if (IsUnassignedCodepoint(cp)) continue;
                checkedCount++;

                if (HasGlyph(cp)) continue;

                if (missing.Length > 0) missing.Append(", ");
                missing.Append($"U+{cp:X4}");
            }

            Assert.That(checkedCount, Is.GreaterThan(60),
                "Assigned Tamil codepoint count is implausibly low; the Unicode data source may be wrong.");
            Assert.That(missing.ToString(), Is.Empty, $"Font '{_font.name}' is missing glyphs for: {missing}");
        }

        [Test]
        public void AllRequiredStringsRenderWithoutMissingGlyphs()
        {
            StringBuilder failures = new StringBuilder();

            for (int i = 0; i < RequiredStrings.Length; i++)
            {
                string missing = FindMissingIn(RequiredStrings[i]);
                if (missing == null) continue;
                failures.AppendLine($"  '{RequiredStrings[i]}' -> {missing}");
            }

            Assert.That(failures.ToString(), Is.Empty,
                $"Font '{_font.name}' cannot render every required string:\n{failures}");
        }

        [Test]
        public void TamilAndLatinDigitsShareOneFont()
        {
            // Mixed digits and Tamil in a single label is the title-screen case; a font that
            // covers Tamil letters but not ASCII numerals fails here.
            Assert.That(FindMissingIn("2026 • நீலகிரி"), Is.Null,
                $"Font '{_font.name}' cannot render mixed numerals and Tamil.");
        }

        [Test]
        public void LongTamilSentenceRendersCompletely()
        {
            // Long strings exercise the shaping path that short probes miss.
            const string longSentence =
                "நீலகிரி மேகக்குன்றுகள் பகுதியில் பறவைகளின் குரல்களை கேட்டு, " +
                "அவற்றின் இசையை நினைவு வைத்து ஆய்வு முன்னெடுக்கவும்.";

            Assert.That(FindMissingIn(longSentence), Is.Null,
                $"Font '{_font.name}' cannot render a long Tamil sentence.");
        }

        /// <summary>
        /// Reports the codepoints in <paramref name="text"/> the font cannot render, or null
        /// when every glyph resolves.
        /// </summary>
        private string FindMissingIn(string text)
        {
            StringBuilder missing = new StringBuilder();

            for (int i = 0; i < text.Length; i++)
            {
                // Supplementary-plane characters (emoji, and some chillu in non-Unicode-15
                // fonts) cannot be shaped by legacy uGUI dynamic fonts, so they are skipped
                // rather than reported as a font defect.
                if (char.IsSurrogate(text[i])) { i++; continue; }

                int cp = text[i];
                if (cp <= 0x20) continue;

                if (HasGlyph(cp)) continue;

                if (missing.Length > 0) missing.Append(", ");
                missing.Append($"U+{cp:X4}");
            }

            return missing.Length == 0 ? null : missing.ToString();
        }

        private bool HasGlyph(int codepoint)
        {
            return _font.HasCharacter((char)codepoint);
        }

        /// <summary>
        /// True when the codepoint is unassigned in Unicode. Reserved codepoints inside the
        /// Tamil block are not font defects, so requiring glyphs for them would be wrong.
        /// </summary>
        private static bool IsUnassignedCodepoint(int codepoint)
        {
            return char.GetUnicodeCategory((char)codepoint)
                   == System.Globalization.UnicodeCategory.OtherNotAssigned;
        }
    }

    /// <summary>
    /// Covers the settings state layer that the in-game Settings screen drives.
    /// </summary>
    /// <remarks>
    /// These are pure logic checks: database integrity, value clamping, and preset ordering.
    /// Anything that changes the real screen resolution, VSync state, or HDRP scaler is a
    /// runtime concern and belongs to the player runs.
    /// </remarks>
    public class SettingsBehaviorTests
    {
        // ---------- Localization database integrity ----------

        [Test]
        public void EveryDatabaseKeyIsUnique()
        {
            var entries = LocalizationDatabase.AllEntries;
            var seen = new HashSet<string>();

            for (int i = 0; i < entries.Count; i++)
            {
                Assert.That(seen.Add(entries[i].key), Is.True, $"Duplicate localization key: {entries[i].key}");
            }
        }

        [Test]
        public void EveryEntryHasEnglishText()
        {
            var entries = LocalizationDatabase.AllEntries;

            for (int i = 0; i < entries.Count; i++)
            {
                Assert.That(string.IsNullOrWhiteSpace(entries[i].english), Is.False,
                    $"Localization key '{entries[i].key}' has no English text; English is the required fallback.");
            }
        }

        [Test]
        public void EveryEntryHasTamilText()
        {
            var entries = LocalizationDatabase.AllEntries;

            for (int i = 0; i < entries.Count; i++)
            {
                Assert.That(string.IsNullOrWhiteSpace(entries[i].tamil), Is.False,
                    $"Localization key '{entries[i].key}' has no Tamil text.");
            }
        }

        [Test]
        public void FormatPlaceholdersMatchAcrossLanguages()
        {
            // Tamil and English must carry the same {0} placeholders. A mismatch either throws
            // FormatException at runtime or silently drops the value from the label.
            var entries = LocalizationDatabase.AllEntries;

            for (int i = 0; i < entries.Count; i++)
            {
                Assert.That(CountPlaceholders(entries[i].tamil), Is.EqualTo(CountPlaceholders(entries[i].english)),
                    $"Localization key '{entries[i].key}' has a different number of format placeholders in each language.");
            }
        }

        [Test]
        public void NoEntryHasWhitespaceOnlyTamil()
        {
            var entries = LocalizationDatabase.AllEntries;

            for (int i = 0; i < entries.Count; i++)
            {
                Assert.That(string.IsNullOrWhiteSpace(entries[i].tamil), Is.False,
                    $"Localization key '{entries[i].key}' has a whitespace-only Tamil value.");
            }
        }

        [Test]
        public void UnknownKeyIsReportedAsMissing()
        {
            Assert.That(LocalizationDatabase.TryGetEntryForTests("definitely.not.a.real.key", out var found), Is.False);
            Assert.That(found.key, Is.Null);
        }

        [Test]
        public void KeysRequestedByMenuAndHudAllExist()
        {
            // These are the keys SettingsMenuUI, TitleMenuController and HUDManager request. A
            // missing one renders the raw key in the UI instead of a readable label.
            string[] required =
            {
                "menu.new_game", "menu.continue", "menu.settings", "menu.codex",
                "menu.quit", "menu.back",
                "settings.language", "settings.language.english", "settings.language.tamil",
                "settings.ui_scale", "settings.ui_scale.small", "settings.ui_scale.medium", "settings.ui_scale.large",
                "settings.display", "settings.resolution", "settings.fullscreen",
                "settings.vsync", "settings.frame_limit",
                "settings.quality", "settings.quality.very_low", "settings.quality.low",
                "settings.quality.medium", "settings.quality.high", "settings.quality.ultra",
                "settings.quality.high_hint",
                "settings.on", "settings.off", "settings.unlimited", "settings.unavailable",
                "hud.rule_notice", "hud.currency_value", "hud.appearance_value",
                "hud.press_to_interact", "hud.am", "hud.pm"
            };

            for (int i = 0; i < required.Length; i++)
            {
                Assert.That(LocalizationDatabase.Has(required[i]), Is.True, $"Missing localization key: {required[i]}");
            }
        }

        // ---------- UI scale ----------

        [Test]
        public void UiScaleFactorScalesAroundOneToOne()
        {
            Assert.That(DisplaySettingsManager.UiScaleFactor(UiScaleLevel.Small), Is.LessThan(1f));
            Assert.That(DisplaySettingsManager.UiScaleFactor(UiScaleLevel.Medium), Is.EqualTo(1f).Within(0.001f));
            Assert.That(DisplaySettingsManager.UiScaleFactor(UiScaleLevel.Large), Is.GreaterThan(1f));
        }

        [Test]
        public void UiScaleLevelsAreOrderedSmallestToLargest()
        {
            Assert.That((int)UiScaleLevel.Small, Is.LessThan((int)UiScaleLevel.Medium));
            Assert.That((int)UiScaleLevel.Medium, Is.LessThan((int)UiScaleLevel.Large));
        }

        [TestCase(0.7f, UiScaleLevel.Small)]
        [TestCase(0.9f, UiScaleLevel.Small)]
        [TestCase(1.0f, UiScaleLevel.Medium)]
        [TestCase(1.1f, UiScaleLevel.Medium)]
        [TestCase(1.25f, UiScaleLevel.Large)]
        [TestCase(2.0f, UiScaleLevel.Large)]
        public void LegacyUiScaleFloatMapsToLevel(float legacy, UiScaleLevel expected)
        {
            Assert.That(DisplaySettingsManager.LegacyUiScaleToLevel(legacy), Is.EqualTo(expected));
        }

        // ---------- Display ----------

        [Test]
        public void DefaultModeIsAPlausibleResolution()
        {
            Assert.That(DisplaySettingsManager.DefaultMode.width, Is.GreaterThan(0));
            Assert.That(DisplaySettingsManager.DefaultMode.height, Is.GreaterThan(0));
        }

        [Test]
        public void DisplayModeShowsRefreshRateOnlyWhenKnown()
        {
            var withHz = new DisplayMode { width = 1920, height = 1080, refreshRate = 60 };
            var withoutHz = new DisplayMode { width = 1920, height = 1080, refreshRate = 0 };

            Assert.That(withHz.ToString(), Does.Contain("@60Hz"));
            Assert.That(withoutHz.ToString(), Does.Not.Contain("@"));
        }

        // ---------- Quality tiers ----------

        /// <summary>
        /// The five tiers the settings menu exposes, cheapest first. <see cref="QualityTier.Custom"/>
        /// exists in the enum but is not user-selectable and has no references anywhere, so it is
        /// deliberately excluded here.
        /// </summary>
        private static readonly QualityTier[] SelectableTiers =
        {
            QualityTier.VeryLow,
            QualityTier.Low,
            QualityTier.Medium,
            QualityTier.High,
            QualityTier.Ultra
        };

        [Test]
        public void FiveQualityTiersAreSelectable()
        {
            Assert.That(SelectableTiers.Length, Is.EqualTo(5));
            Assert.That(SelectableTiers, Is.Unique);
        }

        [Test]
        public void SelectableTiersAreOrderedCheapestToMostExpensive()
        {
            for (int i = 1; i < SelectableTiers.Length; i++)
            {
                Assert.That((int)SelectableTiers[i], Is.EqualTo((int)SelectableTiers[i - 1] + 1),
                    $"Quality tiers are not contiguous from VeryLow to Ultra around {SelectableTiers[i]}.");
            }

            Assert.That((int)SelectableTiers[0], Is.EqualTo((int)QualityTier.VeryLow));
            Assert.That((int)SelectableTiers[4], Is.EqualTo((int)QualityTier.Ultra));
        }

        [Test]
        public void EveryQualityTierHasAPreset()
        {
            for (int i = 0; i < SelectableTiers.Length; i++)
            {
                Assert.That(QualityPresetManager.GetPreset(SelectableTiers[i]), Is.Not.Null,
                    $"No preset defined for {SelectableTiers[i]}.");
            }
        }

        [Test]
        public void QualityTiersRenderScaleIncreasesWithQuality()
        {
            // VeryLow must not render at a higher resolution than Ultra, or the tier ordering is
            // inverted and the cheap presets cost more than the expensive ones.
            float veryLow = QualityPresetManager.GetPreset(QualityTier.VeryLow).renderScale;
            float ultra = QualityPresetManager.GetPreset(QualityTier.Ultra).renderScale;

            Assert.That(veryLow, Is.LessThanOrEqualTo(ultra),
                $"VeryLow renderScale {veryLow} exceeds Ultra {ultra}.");
        }

        [Test]
        public void QualityPresetStaticTableIsTheOnlySourceOfTiers()
        {
            // GraphicsPerformanceManager previously carried a second, conflicting copy of the
            // tier table. It must delegate to QualityPresetManager instead, so it must not hold
            // any static collection of QualityPresetSettings.
            var fields = typeof(WhisperingWilds.Quality.GraphicsPerformanceManager)
                .GetFields(System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

            for (int i = 0; i < fields.Length; i++)
            {
                var fieldType = fields[i].FieldType;
                bool holdsPresets =
                    (fieldType.IsArray && fieldType.GetElementType() == typeof(QualityPresetSettings))
                    || typeof(IEnumerable<QualityPresetSettings>).IsAssignableFrom(fieldType);

                Assert.That(holdsPresets, Is.False,
                    $"GraphicsPerformanceManager holds a static preset collection in '{fields[i].Name}'; " +
                    "the tier table belongs to QualityPresetManager.");
            }
        }

        private static int CountPlaceholders(string value)
        {
            if (string.IsNullOrEmpty(value)) return 0;

            int count = 0;
            for (int i = 0; i < value.Length - 1; i++)
            {
                if (value[i] == '{' && char.IsDigit(value[i + 1])) count++;
            }
            return count;
        }
    }
}