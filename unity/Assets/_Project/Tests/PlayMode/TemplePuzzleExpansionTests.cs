using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using WhisperingWilds.Investigation;
using WhisperingWilds.World;

namespace WhisperingWilds.Tests.PlayMode
{
    public class TemplePuzzleExpansionTests
    {
        private GameObject _holder;
        private NavagrahaShadowPuzzle _navagraha;
        private AcousticPillarPuzzle _acoustic;
        private AncientTempleLevelController _controller;

        [SetUp]
        public void SetUp()
        {
            _holder = new GameObject("Test_TemplePuzzleExpansion");
            _navagraha = _holder.AddComponent<NavagrahaShadowPuzzle>();
            _acoustic = _holder.AddComponent<AcousticPillarPuzzle>();
            _controller = _holder.AddComponent<AncientTempleLevelController>();

            _controller.navagrahaPuzzle = _navagraha;
            _controller.acousticPuzzle = _acoustic;

            _navagraha.Initialize();
            _acoustic.Initialize();
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
        public void NavagrahaShadowPuzzle_InitialState_NotSolved()
        {
            _navagraha.ResetPedestals();
            Assert.IsFalse(_navagraha.IsSolved());
            Assert.AreEqual(0, _navagraha.GetPedestalAngle(0));
            Assert.AreEqual(0, _navagraha.GetPedestalAngle(1));
            Assert.AreEqual(0, _navagraha.GetPedestalAngle(2));
        }

        [Test]
        public void NavagrahaShadowPuzzle_RotatePedestal_AdvancesBy45Degrees()
        {
            _navagraha.ResetPedestals();
            _navagraha.RotatePedestal(0);
            Assert.AreEqual(45, _navagraha.GetPedestalAngle(0));

            _navagraha.RotatePedestal(0);
            Assert.AreEqual(90, _navagraha.GetPedestalAngle(0));
        }

        [Test]
        public void NavagrahaShadowPuzzle_CorrectAlignment_MarksSolvedAndRecordsDiscovery()
        {
            _navagraha.ResetPedestals();
            _navagraha.SetPedestalAngle(0, 45);
            _navagraha.SetPedestalAngle(1, 90);
            _navagraha.SetPedestalAngle(2, 135);

            Assert.IsTrue(_navagraha.CheckAlignment());
            Assert.IsTrue(_navagraha.IsSolved());
            Assert.IsTrue(PuzzleStateStore.IsSolved("temple_navagraha_puzzle"));
            Assert.IsTrue(DiscoveryLog.Has("temple_solar_alignment"));
        }

        [Test]
        public void NavagrahaShadowPuzzle_BilingualTexts_ArePopulated()
        {
            string en = _navagraha.GetClueText(false);
            string ta = _navagraha.GetClueText(true);

            Assert.IsNotNull(en);
            Assert.IsNotNull(ta);
            Assert.IsTrue(en.Contains("brass pedestals"));
            Assert.IsTrue(ta.Length > 10);
        }

        [Test]
        public void AcousticPillarPuzzle_InitialState_NotSolved()
        {
            _acoustic.ResetSequence();
            Assert.IsFalse(_acoustic.IsSolved());
            Assert.AreEqual(0, _acoustic.GetCurrentStep());
            Assert.AreEqual(5, _acoustic.GetTargetLength());
        }

        [Test]
        public void AcousticPillarPuzzle_IncorrectSequence_ResetsCurrentStep()
        {
            _acoustic.ResetSequence();
            _acoustic.StrikePillar(0); // Sa (correct)
            Assert.AreEqual(1, _acoustic.GetCurrentStep());

            _acoustic.StrikePillar(4); // Dha (incorrect, expected Ga [2])
            Assert.AreEqual(0, _acoustic.GetCurrentStep(), "Incorrect note should reset sequence due to dissonance.");
            Assert.IsFalse(_acoustic.IsSolved());
        }

        [Test]
        public void AcousticPillarPuzzle_HarmonicSequence_MarksSolvedAndRecordsDiscovery()
        {
            _acoustic.ResetSequence();
            // Target sequence: [0, 2, 3, 1, 4] -> Sa, Ga, Pa, Ri, Dha (Mohanam)
            Assert.IsFalse(_acoustic.StrikePillar(0));
            Assert.IsFalse(_acoustic.StrikePillar(2));
            Assert.IsFalse(_acoustic.StrikePillar(3));
            Assert.IsFalse(_acoustic.StrikePillar(1));
            bool solved = _acoustic.StrikePillar(4);

            Assert.IsTrue(solved);
            Assert.IsTrue(_acoustic.IsSolved());
            Assert.IsTrue(PuzzleStateStore.IsSolved("temple_acoustic_pillar_puzzle"));
            Assert.IsTrue(DiscoveryLog.Has("temple_musical_pillars"));
        }

        [Test]
        public void AcousticPillarPuzzle_BilingualTexts_ArePopulated()
        {
            string en = _acoustic.GetClueText(false);
            string ta = _acoustic.GetClueText(true);

            Assert.IsNotNull(en);
            Assert.IsNotNull(ta);
            Assert.IsTrue(en.Contains("Mohanam raga"));
            Assert.IsTrue(ta.Contains("மோகன ராகம்"));
        }

        [Test]
        public void AncientTempleLevelController_MultiChamberResolution_UnlocksWhenAllSolved()
        {
            _navagraha.ResetPedestals();
            _acoustic.ResetSequence();

            // Set up hidden door dummy
            GameObject door = new GameObject("HiddenDoor");
            door.SetActive(false);
            _controller.hiddenChamberDoor = door;

            Assert.IsFalse(_controller.AreAllTemplePuzzlesSolved());

            // Solve folklore
            _controller.OnPuzzleCompleted();

            // Solve solar
            _navagraha.SetPedestalAngle(0, 45);
            _navagraha.SetPedestalAngle(1, 90);
            _navagraha.SetPedestalAngle(2, 135);

            // Solve acoustic
            _acoustic.StrikePillar(0);
            _acoustic.StrikePillar(2);
            _acoustic.StrikePillar(3);
            _acoustic.StrikePillar(1);
            _acoustic.StrikePillar(4);

            Assert.IsTrue(_controller.AreAllTemplePuzzlesSolved());
            Assert.IsTrue(door.activeSelf, "Door should open when all Dravidian temple chambers are solved.");

            Object.DestroyImmediate(door);
        }
    }
}
