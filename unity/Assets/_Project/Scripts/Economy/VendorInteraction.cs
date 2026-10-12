using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Inventory;
using WhisperingWilds.Localization;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Economy
{
    /// <summary>
    /// Attaches to an NPCCharacter to make it a reachable in-world vendor.
    /// 
    /// Connects the NPCWallet trade contract to the player's InventoryManager,
    /// providing buy and sell operations through dialogue choices.
    /// 
    /// Transactions are atomic: a failed transaction does not partially modify
    /// the player's inventory, vendor stock, or wallet balance.
    /// </summary>
    [RequireComponent(typeof(NPCCharacter))]
    [DisallowMultipleComponent]
    public class VendorInteraction : MonoBehaviour
    {
        [Header("Vendor Configuration")]
        [Tooltip("Starting coins this vendor has for buying/selling.")]
        [SerializeField] private int startingCoins = 500;

        [Tooltip("Maximum coins this vendor can hold.")]
        [SerializeField] private int maxCoins = 4000;

        [Header("Stock")]
        [Tooltip("Items this vendor sells to the player.")]
        [SerializeField] private List<VendorStockItem> sellStock = new List<VendorStockItem>();

        [Tooltip("Items this vendor buys from the player.")]
        [SerializeField] private List<VendorStockItem> buyStock = new List<VendorStockItem>();

        // Runtime state
        private NPCWallet wallet;
        private NPCCharacter npcCharacter;
        private bool isTrading = false;

        // Events
        public event Action<string, int, int> OnItemBought;  // itemId, quantity, totalCost
        public event Action<string, int, int> OnItemSold;    // itemId, quantity, totalEarned

        public bool IsTrading => isTrading;
        public NPCWallet Wallet => wallet;
        public IReadOnlyList<VendorStockItem> SellStock => sellStock;
        public IReadOnlyList<VendorStockItem> BuyStock => buyStock;

        private void Awake()
        {
            npcCharacter = GetComponent<NPCCharacter>();
            wallet = new NPCWallet(npcCharacter?.NpcId ?? "vendor", startingCoins, maxCoins);

            // Initialize stock
            foreach (var item in sellStock)
            {
                if (item != null)
                {
                    wallet.AddStockPublic(item.itemId, item.quantity, item.maxQuantity);
                }
            }
            foreach (var item in buyStock)
            {
                if (item != null)
                {
                    wallet.AddStockPublic(item.itemId, item.quantity, item.maxQuantity);
                }
            }
        }

        // ------------------------------------------------------------------
        // Buy from vendor (player pays coins, receives items)
        // ------------------------------------------------------------------

        /// <summary>
        /// Attempts to buy an item from this vendor.
        /// Returns true if the transaction succeeded.
        /// </summary>
        public bool TryBuyItem(string itemId, int quantity, out string resultMessage)
        {
            resultMessage = "";

            if (quantity <= 0)
            {
                resultMessage = GetLocalizedMessage("vendor.invalid_quantity");
                return false;
            }

            // Find the item in sell stock
            VendorStockItem stockItem = null;
            for (int i = 0; i < sellStock.Count; i++)
            {
                if (string.Equals(sellStock[i].itemId, itemId, StringComparison.OrdinalIgnoreCase))
                {
                    stockItem = sellStock[i];
                    break;
                }
            }

            if (stockItem == null)
            {
                resultMessage = GetLocalizedMessage("vendor.item_not_found");
                return false;
            }

            int totalCost = stockItem.unitPrice * quantity;

            // Check vendor has enough stock
            int availableStock = wallet.GetStock(itemId);
            if (availableStock < quantity)
            {
                resultMessage = GetLocalizedMessage("vendor.insufficient_stock");
                return false;
            }

            // Check player has enough currency
            var inv = InventoryManager.Instance;
            if (inv == null)
            {
                resultMessage = GetLocalizedMessage("vendor.inventory_unavailable");
                return false;
            }

            if (inv.Currency < totalCost)
            {
                resultMessage = GetLocalizedMessage("vendor.insufficient_funds");
                return false;
            }

            // Atomic transaction: validate everything before modifying state
            // 1. Deduct player currency
            if (!inv.SpendCurrency(totalCost))
            {
                resultMessage = GetLocalizedMessage("vendor.insufficient_funds");
                return false;
            }

            // 2. Remove from vendor stock
            wallet.RemoveStockPublic(itemId, quantity);

            // 3. Add to player inventory
            var itemData = GameDataCatalog.GetItem(itemId);
            if (itemData == null)
            {
                // Rollback: refund player
                inv.AddCurrency(totalCost);
                wallet.AddStockPublic(itemId, quantity, stockItem.maxQuantity);
                resultMessage = GetLocalizedMessage("vendor.item_not_found");
                return false;
            }
            bool itemAdded = inv.AddItem(itemData, quantity);
            if (!itemAdded)
            {
                // Rollback: refund player
                inv.AddCurrency(totalCost);
                wallet.AddStockPublic(itemId, quantity, stockItem.maxQuantity);
                resultMessage = GetLocalizedMessage("vendor.inventory_full");
                return false;
            }

            // 4. Add coins to vendor wallet
            wallet.AddCoins(totalCost);

            isTrading = true;
            OnItemBought?.Invoke(itemId, quantity, totalCost);
            resultMessage = GetLocalizedMessage("vendor.purchase_success");
            Debug.Log($"<color=#00FF99><b>[Vendor]</b></color> Player bought {quantity}x {itemId} for {totalCost} coins");
            return true;
        }

        // ------------------------------------------------------------------
        // Sell to vendor (player gives items, receives coins)
        // ------------------------------------------------------------------

        /// <summary>
        /// Attempts to sell an item to this vendor.
        /// Returns true if the transaction succeeded.
        /// </summary>
        public bool TrySellItem(string itemId, int quantity, out string resultMessage)
        {
            resultMessage = "";

            if (quantity <= 0)
            {
                resultMessage = GetLocalizedMessage("vendor.invalid_quantity");
                return false;
            }

            // Find the item in buy stock
            VendorStockItem stockItem = null;
            for (int i = 0; i < buyStock.Count; i++)
            {
                if (string.Equals(buyStock[i].itemId, itemId, StringComparison.OrdinalIgnoreCase))
                {
                    stockItem = buyStock[i];
                    break;
                }
            }

            if (stockItem == null)
            {
                resultMessage = GetLocalizedMessage("vendor.wont_buy_item");
                return false;
            }

            int totalEarned = stockItem.unitPrice * quantity;

            // Check player has enough items
            var inv = InventoryManager.Instance;
            if (inv == null)
            {
                resultMessage = GetLocalizedMessage("vendor.inventory_unavailable");
                return false;
            }

            int playerCount = inv.GetItemCountById(itemId);
            if (playerCount < quantity)
            {
                resultMessage = GetLocalizedMessage("vendor.insufficient_items");
                return false;
            }

            // Check vendor has enough coins
            if (wallet.CoinBalance < totalEarned)
            {
                resultMessage = GetLocalizedMessage("vendor.insufficient_vendor_funds");
                return false;
            }

            // Atomic transaction
            // 1. Remove from player inventory
            var sellItemData = GameDataCatalog.GetItem(itemId);
            if (sellItemData == null)
            {
                resultMessage = GetLocalizedMessage("vendor.item_not_found");
                return false;
            }
            inv.RemoveItem(sellItemData, quantity);

            // 2. Remove coins from vendor wallet
            wallet.RemoveCoins(totalEarned);

            // 3. Add coins to player
            inv.AddCurrency(totalEarned);

            // 4. Add to vendor stock
            wallet.AddStockPublic(itemId, quantity, int.MaxValue);

            isTrading = true;
            OnItemSold?.Invoke(itemId, quantity, totalEarned);
            resultMessage = GetLocalizedMessage("vendor.sale_success");
            Debug.Log($"<color=#00FF99><b>[Vendor]</b></color> Player sold {quantity}x {itemId} for {totalEarned} coins");
            return true;
        }

        // ------------------------------------------------------------------
        // Localization helper
        // ------------------------------------------------------------------

        private string GetLocalizedMessage(string key)
        {
            var lm = LocalizationManager.Instance;
            if (lm != null)
            {
                string result = lm.Get(key);
                if (!string.IsNullOrEmpty(result)) return result;
            }

            // Fallback English messages
            switch (key)
            {
                case "vendor.invalid_quantity": return "Invalid quantity.";
                case "vendor.item_not_found": return "Item not available.";
                case "vendor.insufficient_stock": return "Not enough stock available.";
                case "vendor.insufficient_funds": return "Not enough coins.";
                case "vendor.inventory_unavailable": return "Inventory unavailable.";
                case "vendor.inventory_full": return "Inventory is full.";
                case "vendor.purchase_success": return "Purchase successful.";
                case "vendor.wont_buy_item": return "Vendor won't buy this item.";
                case "vendor.insufficient_items": return "You don't have enough items.";
                case "vendor.insufficient_vendor_funds": return "Vendor doesn't have enough coins.";
                case "vendor.sale_success": return "Sale successful.";
                default: return key;
            }
        }

        // ------------------------------------------------------------------
        // Save/Load
        // ------------------------------------------------------------------

        /// <summary>Serializes vendor state for save.</summary>
        public VendorSaveData Snapshot()
        {
            return new VendorSaveData
            {
                coinBalance = wallet.CoinBalance,
                stockSnapshot = wallet.SnapshotStock()
            };
        }

        /// <summary>Restores vendor state from save.</summary>
        public void Restore(VendorSaveData data)
        {
            if (data == null) return;
            wallet = new NPCWallet(npcCharacter?.NpcId ?? "vendor", data.coinBalance, maxCoins);
            if (data.stockSnapshot != null)
            {
                foreach (var line in data.stockSnapshot)
                {
                    wallet.AddStockPublic(line.itemId, line.count, line.maxCount);
                }
            }
        }
    }

    /// <summary>One item in a vendor's stock list.</summary>
    [Serializable]
    public class VendorStockItem
    {
        public string itemId;
        public string displayNameEn;
        public string displayNameTa;
        public int unitPrice;
        public int quantity;
        public int maxQuantity;
    }

    /// <summary>Serializable snapshot of vendor state for save/load.</summary>
    [Serializable]
    public class VendorSaveData
    {
        public int coinBalance;
        public List<NPCWallet.StockLine> stockSnapshot = new List<NPCWallet.StockLine>();
    }
}
