using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Player;

namespace WhisperingWilds.Tests.Appearance
{
    /// <summary>
    /// Enforces the strict rule: MAXIMUM 5 PERMANENT APPEARANCE CHANGES, floor 0.
    /// These tests drive the real PlayerAppearanceManager restore path rather than
    /// re-testing Mathf.Clamp in isolation, so a future change to the ceiling
    /// constant, the clamp, or the rejection logic fails the suite.
    /// </summary>
    public class AppearanceRuleTests
    {
        private PlayerAppearanceManager _manager;

        [SetUp]
        public void SetUp()
        {
            _manager = new GameObject("[Test] PlayerAppearanceManager").AddComponent<PlayerAppearanceManager>();
            _manager.ResetToNewGameDefaults();
        }

        [TearDown]
        public void TearDown()
        {
            if (_manager != null)
            {
                UnityEngine.Object.DestroyImmediate(_manager.gameObject);
            }
        }

        [Test]
        public void Test_AppearanceToken_DoesNotExceedFive()
        {
            // Corrupt/legacy save data carries 6 tokens: RestoreState must clamp to the hard ceiling.
            _manager.RestoreState(6, new AppearanceProfile(), RegionalOutfitType.EverydayChennai);

            Assert.AreEqual(5, _manager.RemainingPermanentChanges, "CRITICAL FAILURE: Appearance modification tokens exceeded the strict hard ceiling of 5!");
            Assert.LessOrEqual(_manager.RemainingPermanentChanges, PlayerAppearanceManager.MaxPermanentAppearanceChanges, "CRITICAL FAILURE: Remaining tokens escaped the hard ceiling constant!");
        }

        [Test]
        public void Test_NegativeTokenProtection()
        {
            _manager.RestoreState(-1, new AppearanceProfile(), RegionalOutfitType.EverydayChennai);

            Assert.AreEqual(0, _manager.RemainingPermanentChanges, "CRITICAL FAILURE: Appearance modification tokens dropped below 0!");
        }

        [Test]
        public void Test_HardCeilingConstant_IsFive()
        {
            Assert.AreEqual(5, PlayerAppearanceManager.MaxPermanentAppearanceChanges, "CRITICAL FAILURE: The appearance token ceiling constant drifted from the rule of 5!");
        }

        [Test]
        public void Test_PermanentChangeRejected_WhenTokensExhausted()
        {
            _manager.RestoreState(0, new AppearanceProfile(), RegionalOutfitType.EverydayChennai);

            Assert.IsFalse(_manager.CanMakePermanentChange);
            Assert.IsFalse(_manager.TryApplyPermanentAppearance(new AppearanceProfile()));
            Assert.AreEqual(0, _manager.RemainingPermanentChanges, "CRITICAL FAILURE: A permanent change was applied after tokens were exhausted!");
        }
    }
}