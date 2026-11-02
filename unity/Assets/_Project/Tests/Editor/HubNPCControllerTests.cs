using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Characters;
using WhisperingWilds.Economy;
using WhisperingWilds.NPC;
using WhisperingWilds.Player;

namespace WhisperingWilds.Tests.Editor
{
    public class HubNPCControllerTests
    {
        private GameObject _holder;
        private HubNPCController _npcController;
        private VendorSystem _vendorSystem;

        [SetUp]
        public void SetUp()
        {
            _holder = new GameObject("Test_HubNPC");
            _holder.AddComponent<BoxCollider>();
            _npcController = _holder.AddComponent<HubNPCController>();
            _vendorSystem = _holder.AddComponent<VendorSystem>();

            _npcController.npcId = "murugan";
            _npcController.npcDisplayName = "Murugan";
            _npcController.npcDisplayNameTamil = "முருகன்";
            _npcController.regionalHubName = "CauveryDelta";
            _npcController.associatedVendor = _vendorSystem;
            _npcController.requiredMemoryFlagId = "helped_paddy_irrigation";

            NPCMemoryStore.Clear();
        }

        [TearDown]
        public void TearDown()
        {
            NPCMemoryStore.Clear();
            if (_holder != null)
            {
                Object.DestroyImmediate(_holder);
            }
        }

        [Test]
        public void HubNPCController_Implements_IInteractable()
        {
            Assert.IsInstanceOf<IInteractable>(_npcController);
            Assert.AreEqual(InteractionType.Talk, _npcController.Type);
        }

        [Test]
        public void InteractionPrompt_Formats_WithDisplayName()
        {
            string prompt = _npcController.InteractionPrompt;
            Assert.IsNotNull(prompt);
            Assert.IsTrue(prompt.Contains("Murugan") || prompt.Contains("முருகன்"));
        }

        [Test]
        public void CanInteract_Reflects_InteractableState()
        {
            Assert.IsTrue(_npcController.CanInteract(null));

            _npcController.SetInteractable(false);
            Assert.IsFalse(_npcController.CanInteract(null));
            Assert.AreEqual(string.Empty, _npcController.InteractionPrompt);

            _npcController.SetInteractable(true);
            Assert.IsTrue(_npcController.CanInteract(null));
        }

        [Test]
        public void Interact_Triggers_OnInteractedEvent()
        {
            bool eventFired = false;
            _npcController.OnInteracted += (npc) => { eventFired = true; };

            _npcController.Interact((PlayerInteractor)null);
            Assert.IsTrue(eventFired, "Interact should fire OnInteracted event.");
        }

        [Test]
        public void MemoryFlag_And_VendorSystem_Integration()
        {
            // Initial memory state
            Assert.IsFalse(NPCMemoryStore.HasMemory("murugan", "helped_paddy_irrigation"));

            // Record memory
            NPCMemoryStore.RecordMemory("murugan", "helped_paddy_irrigation");
            Assert.IsTrue(NPCMemoryStore.HasMemory("murugan", "helped_paddy_irrigation"));

            // Vendor trust tier
            Assert.AreEqual(TrustTier.Stranger, _vendorSystem.currentTrustTier);
            _vendorSystem.SetTrustScore(60);
            Assert.AreEqual(TrustTier.Trusted, _vendorSystem.currentTrustTier);

            // Execute dialogue evaluation without exception
            Assert.DoesNotThrow(() => _npcController.EvaluateRelationshipAndTriggerDialogue());
        }
    }
}
