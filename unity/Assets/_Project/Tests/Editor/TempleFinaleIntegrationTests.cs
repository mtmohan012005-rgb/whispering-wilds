using System.IO;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Investigation;
using WhisperingWilds.World;

namespace WhisperingWilds.Tests.Editor
{
    public class TempleFinaleIntegrationTests
    {
        private GameObject _holder;
        private TempleFolklorePuzzleController _folklore;
        private NavagrahaShadowPuzzle _navagraha;
        private AcousticPillarPuzzle _acoustic;
        private AncientTempleLevelController _controller;
        private HiddenArtifactPickup _artifact;
        private GameObject _door;

        [SetUp]
        public void SetUp()
        {
            _holder = new GameObject("Test_TempleFinaleIntegration");

            _folklore = _holder.AddComponent<TempleFolklorePuzzleController>();
            _navagraha = _holder.AddComponent<NavagrahaShadowPuzzle>();
            _acoustic = _holder.AddComponent<AcousticPillarPuzzle>();

            _door = new GameObject("Test_SanctumDoor");
            _door.SetActive(false);

            GameObject artifactObj = new GameObject("Test_Artifact");
            _artifact = artifactObj.AddComponent<HiddenArtifactPickup>();
            _artifact.artifactId = "kaveri_star_seal";
            _artifact.Initialize(false);

            _controller = _holder.AddComponent<AncientTempleLevelController>();
            _controller.puzzleController = _folklore;
            _controller.navagrahaPuzzle = _navagraha;
            _controller.acousticPuzzle = _acoustic;
            _controller.hiddenChamberDoor = _door;
            _controller.artifactPickup = _artifact;

            _folklore.Initialize();
            _navagraha.Initialize();
            _acoustic.Initialize();
        }

        [TearDown]
        public void TearDown()
        {
            if (_holder != null) Object.DestroyImmediate(_holder);
            if (_door != null) Object.DestroyImmediate(_door);
            if (_artifact != null && _artifact.gameObject != null) Object.DestroyImmediate(_artifact.gameObject);
        }

        [Test]
        public void Defect2_StrictGuard_ReturnsFalse_WhenFolkloreReferenceMissing()
        {
            _controller.puzzleController = null;

            // Even if solar and acoustic are solved, missing folklore reference MUST fail
            _navagraha.SetPedestalAngle(0, 45);
            _navagraha.SetPedestalAngle(1, 90);
            _navagraha.SetPedestalAngle(2, 135);

            _acoustic.StrikePillar(0);
            _acoustic.StrikePillar(2);
            _acoustic.StrikePillar(3);
            _acoustic.StrikePillar(1);
            _acoustic.StrikePillar(4);

            Assert.IsFalse(_controller.AreAllTemplePuzzlesSolved(), "Missing folklore puzzle reference must NEVER evaluate to solved.");
        }

        [Test]
        public void Defect2_StrictGuard_ReturnsFalse_WhenNavagrahaReferenceMissing()
        {
            _controller.navagrahaPuzzle = null;

            _controller.OnFolklorePuzzleCompleted();

            _acoustic.StrikePillar(0);
            _acoustic.StrikePillar(2);
            _acoustic.StrikePillar(3);
            _acoustic.StrikePillar(1);
            _acoustic.StrikePillar(4);

            Assert.IsFalse(_controller.AreAllTemplePuzzlesSolved(), "Missing Navagraha solar puzzle reference must NEVER evaluate to solved.");
        }

        [Test]
        public void Defect2_StrictGuard_ReturnsFalse_WhenAcousticReferenceMissing()
        {
            _controller.acousticPuzzle = null;

            _controller.OnFolklorePuzzleCompleted();

            _navagraha.SetPedestalAngle(0, 45);
            _navagraha.SetPedestalAngle(1, 90);
            _navagraha.SetPedestalAngle(2, 135);

            Assert.IsFalse(_controller.AreAllTemplePuzzlesSolved(), "Missing Acoustic musical puzzle reference must NEVER evaluate to solved.");
        }

        [Test]
        public void Defect1_DecoupledFolklore_DoesNotOpenDoorAlone()
        {
            _door.SetActive(false);

            // Solve folklore puzzle only
            _folklore.SetMechanismPosition(0, 0);
            _folklore.SetMechanismPosition(1, 2);
            _folklore.SetMechanismPosition(2, 1);

            Assert.IsTrue(_folklore.IsPuzzleCompleted());
            Assert.IsFalse(_door.activeSelf, "Hidden chamber door must remain sealed when only folklore stones are aligned.");
            Assert.IsFalse(_controller.AreAllTemplePuzzlesSolved(), "Temple finale must require all 3 chambers, not just folklore.");
        }

        [Test]
        public void PartialCompletion_TwoPuzzlesSolved_KeepsChamberLocked()
        {
            _door.SetActive(false);

            // Solve folklore
            _controller.OnFolklorePuzzleCompleted();

            // Solve solar
            _navagraha.SetPedestalAngle(0, 45);
            _navagraha.SetPedestalAngle(1, 90);
            _navagraha.SetPedestalAngle(2, 135);

            Assert.IsFalse(_acoustic.IsSolved());
            Assert.IsFalse(_controller.AreAllTemplePuzzlesSolved());
            Assert.IsFalse(_door.activeSelf, "Door must remain closed until acoustic resonance is also achieved.");
        }

        [Test]
        public void FullTempleFinale_AllThreeSolved_OpensDoorAndEnablesArtifact()
        {
            _door.SetActive(false);

            // 1. Solve Folklore
            _controller.OnFolklorePuzzleCompleted();

            // 2. Solve Solar (45, 90, 135 degrees)
            _navagraha.SetPedestalAngle(0, 45);
            _navagraha.SetPedestalAngle(1, 90);
            _navagraha.SetPedestalAngle(2, 135);

            // 3. Solve Acoustic (Sa, Ga, Pa, Ri, Dha = 0, 2, 3, 1, 4)
            _acoustic.StrikePillar(0);
            _acoustic.StrikePillar(2);
            _acoustic.StrikePillar(3);
            _acoustic.StrikePillar(1);
            _acoustic.StrikePillar(4);

            Assert.IsTrue(_controller.AreAllTemplePuzzlesSolved(), "All three Dravidian temple chambers must be solved.");
            Assert.IsTrue(_door.activeSelf, "Hidden chamber door must be opened when all 3 chambers are solved.");
        }

        [Test]
        public void Defect4_NavagrahaPedestalInteractable_AdvancesRotationAndChecksAlignment()
        {
            GameObject pedObj = new GameObject("Test_Pedestal");
            NavagrahaPedestalInteractable interactable = pedObj.AddComponent<NavagrahaPedestalInteractable>();
            interactable.pedestalIndex = 0;
            interactable.puzzle = _navagraha;
            interactable.rotationAngleStep = 45f;

            _navagraha.ResetPedestals();
            Assert.AreEqual(0, _navagraha.GetPedestalAngle(0));
            Assert.IsTrue(interactable.CanInteract(null));

            interactable.Interact(null);
            Assert.AreEqual(45, _navagraha.GetPedestalAngle(0));
            Assert.AreEqual(45f, pedObj.transform.localEulerAngles.y, 0.1f);

            Object.DestroyImmediate(pedObj);
        }

        [Test]
        public void Defect4_AcousticPillarInteractable_AdvancesSequenceAndBilingualPrompts()
        {
            GameObject pillarObj = new GameObject("Test_AcousticPillar");
            AcousticPillarInteractable interactable = pillarObj.AddComponent<AcousticPillarInteractable>();
            interactable.pillarIndex = 0; // Sa
            interactable.puzzle = _acoustic;

            _acoustic.ResetSequence();
            Assert.IsTrue(interactable.CanInteract(null));
            Assert.IsTrue(interactable.InteractionPrompt.Contains("Sa") || interactable.InteractionPrompt.Contains("ச"));

            interactable.Interact(null);
            Assert.AreEqual(1, _acoustic.GetCurrentStep());

            Object.DestroyImmediate(pillarObj);
        }
    }
}
