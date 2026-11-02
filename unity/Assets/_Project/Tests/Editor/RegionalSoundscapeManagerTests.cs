using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Audio;

namespace WhisperingWilds.Tests.Editor
{
    public class RegionalSoundscapeManagerTests
    {
        private GameObject _holder;
        private RegionalSoundscapeManager _manager;

        [SetUp]
        public void SetUp()
        {
            _holder = new GameObject("Test_RegionalSoundscape");
            _manager = _holder.AddComponent<RegionalSoundscapeManager>();
        }

        [TearDown]
        public void TearDown()
        {
            if (_holder != null)
            {
                Object.DestroyImmediate(_holder);
            }
        }

        [Test]
        public void SoundscapeManager_InitializesDefaultProfiles()
        {
            Assert.IsNotNull(_manager.regionalProfiles);
            Assert.IsTrue(_manager.regionalProfiles.Count >= 7, "Should include default profiles for all Tamil Nadu biomes and sacred temple.");

            Assert.IsNotNull(_manager.GetProfile("chennai"));
            Assert.IsNotNull(_manager.GetProfile("thanjavur"));
            Assert.IsNotNull(_manager.GetProfile("nilgiris"));
            Assert.IsNotNull(_manager.GetProfile("chettinad"));
            Assert.IsNotNull(_manager.GetProfile("mamallapuram"));
            Assert.IsNotNull(_manager.GetProfile("pichavaram"));
            Assert.IsNotNull(_manager.GetProfile("ancient_temple"));
        }

        [Test]
        public void GetProfile_CaseInsensitive_ResolvesCorrectProfile()
        {
            var profile = _manager.GetProfile("ThAnJaVuR");
            Assert.IsNotNull(profile);
            Assert.AreEqual("thanjavur", profile.regionId);
            Assert.IsTrue(profile.displayName.Contains("Cauvery Delta"));
        }

        [Test]
        public void TransitionToRegion_UpdatesCurrentRegionId()
        {
            _manager.TransitionToRegion("chettinad", 0f);
            Assert.AreEqual("chettinad", _manager.CurrentRegionId);

            _manager.TransitionToRegion("nilgiris", 0f);
            Assert.AreEqual("nilgiris", _manager.CurrentRegionId);
        }

        [Test]
        public void StopSoundscape_ClearsCurrentProfile()
        {
            _manager.TransitionToRegion("pichavaram", 0f);
            Assert.AreEqual("pichavaram", _manager.CurrentRegionId);

            _manager.StopSoundscape();
            Assert.AreEqual(string.Empty, _manager.CurrentRegionId);
        }
    }
}
