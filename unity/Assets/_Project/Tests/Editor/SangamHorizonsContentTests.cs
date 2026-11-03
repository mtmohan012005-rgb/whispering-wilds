#if UNITY_EDITOR
using NUnit.Framework;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class SangamHorizonsContentTests
    {
        [SetUp]
        public void SetUp()
        {
            SangamHorizonsContent.EnsureInitialized();
        }

        [Test]
        public void TestSangamHorizonsContent_ItemsRegistered()
        {
            var jasmine = GameDataCatalog.GetItem(SangamHorizonsContent.ItemMaduraiJasmine);
            Assert.IsNotNull(jasmine);
            Assert.AreEqual("Madurai Jasmine Garland", jasmine.itemNameEn);
            Assert.IsNotEmpty(jasmine.itemNameTa);

            var nectar = GameDataCatalog.GetItem(SangamHorizonsContent.ItemPalmyraNectar);
            Assert.IsNotNull(nectar);
            Assert.IsTrue(nectar.isConsumable);
            Assert.Greater(nectar.staminaRestore, 0f);

            var scroll = GameDataCatalog.GetItem(SangamHorizonsContent.ItemVaigaiScroll);
            Assert.IsNotNull(scroll);
            Assert.AreEqual(ItemCategory.Quest, scroll.category);
        }

        [Test]
        public void TestSangamHorizonsContent_CluesRegistered()
        {
            var keeladiSeal = GameDataCatalog.GetClue(SangamHorizonsContent.ClueKeeladiSeal);
            Assert.IsNotNull(keeladiSeal);
            Assert.AreEqual("Keeladi Trade Seal", keeladiSeal.clueNameEn);
            Assert.IsNotEmpty(keeladiSeal.clueNameTa);

            var currentChart = GameDataCatalog.GetClue(SangamHorizonsContent.ClueCurrentChart);
            Assert.IsNotNull(currentChart);

            var herbalCodex = GameDataCatalog.GetClue(SangamHorizonsContent.ClueHerbalCodex);
            Assert.IsNotNull(herbalCodex);
        }

        [Test]
        public void TestSangamHorizonsContent_QuestsRegistered()
        {
            var maduraiQuest = GameDataCatalog.GetQuest(SangamHorizonsContent.QuestMaduraiJasmine);
            Assert.IsNotNull(maduraiQuest);
            Assert.AreEqual(2, maduraiQuest.stages.Count);
            Assert.AreEqual("Meet the Flower Weaver", maduraiQuest.stages[0].titleEn);

            var kanyaQuest = GameDataCatalog.GetQuest(SangamHorizonsContent.QuestKanyakumariTides);
            Assert.IsNotNull(kanyaQuest);
            Assert.AreEqual("Where Three Oceans Meet", kanyaQuest.questNameEn);

            var agasthyaQuest = GameDataCatalog.GetQuest(SangamHorizonsContent.QuestAgasthyamalaiCodex);
            Assert.IsNotNull(agasthyaQuest);
            Assert.AreEqual(QuestObjectiveType.PhotographTarget, agasthyaQuest.stages[0].objectives[0].type);
        }
    }
}
#endif
