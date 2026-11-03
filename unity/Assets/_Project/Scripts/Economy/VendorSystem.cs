using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Campaign;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Economy
{
    public enum TrustTier
    {
        Stranger = 0,
        Acquaintance = 1,
        Trusted = 2,
        Confidant = 3
    }

    [System.Serializable]
    public struct VendorItemSlot
    {
        public string itemId;
        public int basePrice;
        public TrustTier requiredTrust;
        public int stockCount;
        public bool isSpecialtyBlueprint;
        public string requiredMemoryFlag;
    }

    /// <summary>
    /// Step 6.2: Core dynamic economy and barter component for merchant NPCs.
    /// Handles trust-based pricing discounts, barter valuation ratios, and tiered inventory slot gating.
    /// Integrates with EndingController and NPCMemoryStore for persistent relationship state.
    /// </summary>
    public class VendorSystem : MonoBehaviour
    {
        [Header("Vendor Identity")]
        public string vendorId;
        public string vendorName;
        public TrustTier currentTrustTier = TrustTier.Stranger;
        [Range(0, 100)] public int trustPoints = 0;

        [Header("Economic Modifiers")]
        [Tooltip("Base markup applied when buying from the player.")]
        public float baseBuyMultiplier = 0.5f; 
        [Tooltip("Base markdown applied when selling to the player.")]
        public float baseSellMultiplier = 1.0f;
        [Tooltip("Discount percentage per trust tier (e.g., 0.05 = 5% off per tier).")]
        public float trustDiscountRate = 0.05f;

        [Header("Tiered Inventory")]
        public List<VendorItemSlot> inventory = new List<VendorItemSlot>();

        private void Start()
        {
            SyncWithPersistentState();
        }

        /// <summary>
        /// Synchronizes this vendor's trust points and tier with the persistent campaign relationship state.
        /// </summary>
        public void SyncWithPersistentState()
        {
            if (EndingController.Instance != null && !string.IsNullOrEmpty(vendorId))
            {
                trustPoints = EndingController.Instance.GetTrust(vendorId);
                EvaluateTrustTier();
            }
        }

        /// <summary>
        /// Updates trust points based on player actions, quests, or persistent memories.
        /// </summary>
        public void SetTrustScore(int points)
        {
            trustPoints = Mathf.Clamp(points, 0, 100);
            EvaluateTrustTier();

            if (EndingController.Instance != null && !string.IsNullOrEmpty(vendorId))
            {
                EndingController.Instance.SetTrust(vendorId, trustPoints);
            }
        }

        public void AddTrustPoints(int amount)
        {
            trustPoints = Mathf.Clamp(trustPoints + amount, 0, 100);
            EvaluateTrustTier();

            if (EndingController.Instance != null && !string.IsNullOrEmpty(vendorId))
            {
                EndingController.Instance.SetTrust(vendorId, trustPoints);
            }
        }

        public void EvaluateTrustTier()
        {
            if (trustPoints >= 80) currentTrustTier = TrustTier.Confidant;
            else if (trustPoints >= 50) currentTrustTier = TrustTier.Trusted;
            else if (trustPoints >= 20) currentTrustTier = TrustTier.Acquaintance;
            else currentTrustTier = TrustTier.Stranger;
        }

        /// <summary>
        /// Calculates final purchase price for the player based on trust and regional scarcity.
        /// </summary>
        public int CalculatePurchasePrice(int baseValue, float regionalScarcityModifier = 1.0f)
        {
            float discount = 1.0f - ((int)currentTrustTier * trustDiscountRate);
            float finalPrice = baseValue * baseSellMultiplier * discount * regionalScarcityModifier;
            return Mathf.Max(1, Mathf.RoundToInt(finalPrice));
        }

        /// <summary>
        /// Calculates payout when the vendor buys an item from the player via barter or coin.
        /// </summary>
        public int CalculateBarterPayout(int baseValue)
        {
            float bonus = 1.0f + ((int)currentTrustTier * 0.02f); // Better sell rates at higher trust
            return Mathf.RoundToInt(baseValue * baseBuyMultiplier * bonus);
        }

        /// <summary>
        /// Determines whether a specific item slot is unlocked based on trust tier and optional narrative memory.
        /// </summary>
        public bool IsSlotUnlocked(VendorItemSlot slot)
        {
            if (slot.requiredTrust > currentTrustTier)
                return false;

            if (!string.IsNullOrEmpty(slot.requiredMemoryFlag))
            {
                return NPCMemoryStore.HasMemory(vendorId, slot.requiredMemoryFlag);
            }

            return true;
        }

        /// <summary>
        /// Retrieves unlocked inventory items available for the player's current trust tier and narrative memories.
        /// </summary>
        public List<VendorItemSlot> GetAvailableStock()
        {
            List<VendorItemSlot> available = new List<VendorItemSlot>();
            foreach (var slot in inventory)
            {
                if (IsSlotUnlocked(slot) && slot.stockCount > 0)
                {
                    available.Add(slot);
                }
            }
            return available;
        }
    }
}
