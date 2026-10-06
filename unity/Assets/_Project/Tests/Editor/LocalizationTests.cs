using System.Collections.Generic;
using System.Text.RegularExpressions;
using NUnit.Framework;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Integrity checks for the localization database: every runtime-referenced key must exist
    /// in both languages, format placeholders must align across languages, and the restored
    /// marketing bilingual title/subtitle must not be a mongrel of both scripts in one string.
    /// </summary>
    public class LocalizationTests
    {
        private static readonly Regex TamilBlock = new Regex("[\u0B80-\u0BFF]");
        private static readonly Regex AsciiLetters = new Regex("[A-Za-z]");

        private static LocalizationDatabase Database() => LocalizationDatabase.Instance;

        private static readonly string[] RequiredRuntimeKeys =
        {
            "menu.title",
            "menu.subtitle",
            "talk.default",
            "dialogue.continue",
            "dialogue.talk",
            "interaction.pickup",
            "interaction.harvest",
            "interaction.pluck",
            "notify.game_saved",
            "notify.save_recovered_backup",
            "notify.save_corrupt",
            "notify.save_none_continue",
            "notify.save_none_to_load",
            "chettinad.door.open",
            "vegetation.stage"
        };

        [Test]
        public void RequiredRuntimeKeys_ExistForBothLanguages()
        {
            LocalizationDatabase db = Database();
            Assert.That(db, Is.Not.Null);

            foreach (string key in RequiredRuntimeKeys)
            {
                string en = db.Get(key, "English");
                string ta = db.Get(key, "Tamil");

                Assert.That(en, Is.Not.Null.And.Not.Empty, $"'{key}' has no English value.");
                Assert.That(ta, Is.Not.Null.And.Not.Empty, $"'{key}' has no Tamil value.");
            }
        }

        [Test]
        public void EveryEntry_HasNonEmptyEnglishAndTamilValues()
        {
            Assert.That(LocalizationDatabase.AllEntries, Is.Not.Null);

            foreach (LocalizationEntry entry in LocalizationDatabase.AllEntries)
            {
                if (string.IsNullOrEmpty(entry.key)) continue;
                Assert.That(entry.english, Is.Not.Null.And.Not.Empty, $"'{entry.key}' has empty English.");
                Assert.That(entry.tamil, Is.Not.Null.And.Not.Empty, $"'{entry.key}' has empty Tamil.");
            }
        }

        [Test]
        public void FormatPlaceholderCounts_MatchAcrossLanguages()
        {
            foreach (LocalizationEntry entry in LocalizationDatabase.AllEntries)
            {
                if (string.IsNullOrEmpty(entry.key)) continue;
                int enPlaceholders = Regex.Matches(entry.english, @"\{\d+\}").Count;
                int taPlaceholders = Regex.Matches(entry.tamil, @"\{\d+\}").Count;
                Assert.That(taPlaceholders, Is.EqualTo(enPlaceholders),
                    $"'{entry.key}' has {enPlaceholders} EN placeholders but {taPlaceholders} TA.");
            }
        }

        [Test]
        public void TitleAndSubtitle_AreNotScriptMongrels()
        {
            LocalizationDatabase db = Database();

            string titleEn = db.Get("menu.title", "English");
            string titleTa = db.Get("menu.title", "Tamil");
            string subEn = db.Get("menu.subtitle", "English");
            string subTa = db.Get("menu.subtitle", "Tamil");

            Assert.That(TamilBlock.IsMatch(titleEn), Is.False, "English title must not contain Tamil glyphs.");
            Assert.That(AsciiLetters.IsMatch(titleTa), Is.False, "Tamil title must be pure Tamil script.");
            Assert.That(TamilBlock.IsMatch(subEn), Is.False, "English subtitle must not contain Tamil glyphs.");
            Assert.That(AsciiLetters.IsMatch(subTa), Is.False, "Tamil subtitle must be pure Tamil script.");
        }

        [Test]
        public void HarvestAndPluckPrompts_NoLongerEmbedControlHints()
        {
            // Prompts are prefixed by the HUD ("Press [E]") so the database must not duplicate it.
            LocalizationDatabase db = Database();
            foreach (string key in new[] { "interaction.harvest", "interaction.pluck", "interaction.pickup" })
            {
                Assert.That(db.Get(key, "English"), Does.Not.Contain("[E]"), $"'{key}' still embeds [E] hint.");
                Assert.That(db.Get(key, "Tamil"), Does.Not.Contain("[E]"), $"'{key}' still embeds [E] hint.");
            }
        }

        [Test]
        public void VegetableStageKeys_ExistForThreeStagesInBothLanguages()
        {
            LocalizationDatabase db = Database();
            foreach (string key in new[] { "veg.stage.sprout", "veg.stage.growing", "veg.stage.ripe" })
            {
                string en = db.Get(key, "English");
                string ta = db.Get(key, "Tamil");
                Assert.That(en, Is.Not.Null.And.Not.Empty, $"'{key}' English missing.");
                Assert.That(ta, Is.Not.Null.And.Not.Empty, $"'{key}' Tamil missing.");
            }
        }
    }
}