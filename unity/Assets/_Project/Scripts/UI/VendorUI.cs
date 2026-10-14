using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Economy;
using WhisperingWilds.Inventory;
using WhisperingWilds.Localization;
using WhisperingWilds.NPC;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Visual trade interface for vendor buy/sell operations.
    /// 
    /// Opens when the player interacts with a vendor NPC. Displays items the vendor
    /// sells and items the vendor buys, with prices, stock, and player currency.
    /// Transactions are atomic: a failed transaction does not partially modify state.
    /// </summary>
    public class VendorUI : MonoBehaviour
    {
        public static VendorUI Instance { get; private set; }

        [Header("UI Panels")]
        [SerializeField] private GameObject vendorPanelRoot;
        [SerializeField] private Text vendorNameText;
        [SerializeField] private Text playerCoinsText;
        [SerializeField] private Text vendorCoinsText;

        [Header("Sell Section (Vendor sells to player)")]
        [SerializeField] private Text sellSectionTitle;
        [SerializeField] private Transform sellItemsContainer;
        [SerializeField] private GameObject sellItemPrefab;

        [Header("Buy Section (Vendor buys from player)")]
        [SerializeField] private Text buySectionTitle;
        [SerializeField] private Transform buyItemsContainer;
        [SerializeField] private GameObject buyItemPrefab;

        [Header("Buttons")]
        [SerializeField] private Button closeButton;

        [Header("Feedback")]
        [SerializeField] private Text feedbackText;
        [SerializeField] private float feedbackDisplayTime = 3f;

        // Runtime state
        private VendorInteraction activeVendor;
        private NPCCharacter activeNPC;
        private bool isOpen;

        private GameState stateBeforeVendor = GameState.Gameplay;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;
        }

        private void OnEnable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += OnLanguageChanged;
            }
        }

        private void OnDisable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= OnLanguageChanged;
            }
        }

        private void Start()
        {
            if (closeButton != null) closeButton.onClick.AddListener(OnCloseClicked);
            SetVisible(false);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>
        /// Opens the vendor UI for the given vendor.
        /// </summary>
        public void Open(VendorInteraction vendor, NPCCharacter npc)
        {
            if (isOpen || vendor == null) return;

            activeVendor = vendor;
            activeNPC = npc;
            isOpen = true;

            // Save the game state so we can restore it on close
            if (GameManager.Instance != null)
            {
                stateBeforeVendor = GameManager.Instance.CurrentState;
                GameManager.Instance.SetGameState(GameState.VendorMenu);
            }

            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;

            ApplyLocalizedLabels();
            RefreshDisplay();

            if (vendorPanelRoot != null) vendorPanelRoot.SetActive(true);

            Debug.Log("<color=#FFD700><b>[VendorUI]</b></color> Opened trade with " + (npc != null ? npc.DisplayNameEn : "vendor"));
        }

        /// <summary>
        /// Closes the vendor UI and returns control to gameplay.
        /// </summary>
        public void Close()
        {
            if (!isOpen) return;

            isOpen = false;
            activeVendor = null;
            activeNPC = null;

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(stateBeforeVendor);
            }

            // Restore cursor lock for gameplay
            if (stateBeforeVendor == GameState.Gameplay)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }

            SetVisible(false);
        }

        public void SetVisible(bool visible)
        {
            if (vendorPanelRoot != null) vendorPanelRoot.SetActive(visible);
        }

        private void OnCloseClicked()
        {
            Close();
        }

        private void OnLanguageChanged(Language language)
        {
            ApplyLocalizedLabels();
            if (isOpen) RefreshDisplay();
        }

        /// <summary>
        /// Applies localized labels to all UI elements.
        /// </summary>
        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            if (mgr == null) return;

            if (sellSectionTitle != null)
                sellSectionTitle.text = mgr.Get("vendor.sell_to_player");
            if (buySectionTitle != null)
                buySectionTitle.text = mgr.Get("vendor.buy_from_player");
            if (playerCoinsText != null)
                playerCoinsText.text = mgr.Get("hud.currency");
            if (vendorCoinsText != null)
                vendorCoinsText.text = mgr.Get("vendor.coins");
        }

        /// <summary>
        /// Refreshes the entire display: vendor name, coins, and item lists.
        /// </summary>
        public void RefreshDisplay()
        {
            if (activeVendor == null) return;

            // Update vendor name
            if (vendorNameText != null && activeNPC != null)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                string name = (mgr != null && mgr.CurrentLanguage == Language.Tamil)
                    ? activeNPC.DisplayNameTa
                    : activeNPC.DisplayNameEn;
                vendorNameText.text = name;
            }

            // Update player coins
            int playerCoins = 0;
            if (InventoryManager.Instance != null)
            {
                playerCoins = InventoryManager.Instance.Currency;
            }
            if (playerCoinsText != null)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                playerCoinsText.text = mgr != null ? mgr.Get("hud.currency_value", playerCoins) : $"{playerCoins} coins";
            }

            // Update vendor coins
            if (activeVendor.Wallet != null && vendorCoinsText != null)
            {
                int vendorCoins = activeVendor.Wallet.CoinBalance;
                LocalizationManager mgr = LocalizationManager.Instance;
                vendorCoinsText.text = mgr != null ? mgr.Get("vendor.coins_value", vendorCoins) : $"{vendorCoins} coins";
            }

            // Refresh item lists
            RefreshSellItems();
            RefreshBuyItems();
        }

        /// <summary>
        /// Refreshes the sell items list (vendor sells to player).
        /// </summary>
        private void RefreshSellItems()
        {
            if (sellItemsContainer == null || activeVendor == null) return;

            // Clear existing items
            foreach (Transform child in sellItemsContainer)
            {
                GameObject.Destroy(child.gameObject);
            }

            InventoryManager inv = InventoryManager.Instance;
            foreach (var stockItem in activeVendor.SellStock)
            {
                // Check if vendor still has stock
                int availableStock = 0;
                if (activeVendor.Wallet != null)
                {
                    availableStock = activeVendor.Wallet.GetStock(stockItem.itemId);
                }

                if (availableStock <= 0) continue;

                // Get item data
                ItemData itemData = GameDataCatalog.GetItem(stockItem.itemId);
                if (itemData == null) continue;

                // Create item entry
                CreateItemEntry(sellItemsContainer, sellItemPrefab, itemData, stockItem.unitPrice,
                    availableStock, true, (itemId, qty) => OnBuyItem(itemId, qty));
            }
        }

        /// <summary>
        /// Refreshes the buy items list (vendor buys from player).
        /// </summary>
        private void RefreshBuyItems()
        {
            if (buyItemsContainer == null || activeVendor == null) return;

            // Clear existing items
            foreach (Transform child in buyItemsContainer)
            {
                GameObject.Destroy(child.gameObject);
            }

            InventoryManager inv = InventoryManager.Instance;
            foreach (var stockItem in activeVendor.BuyStock)
            {
                // Check if player has this item
                if (inv == null) continue;

                int playerCount = inv.GetItemCountById(stockItem.itemId);
                if (playerCount <= 0) continue;

                // Get item data
                ItemData itemData = GameDataCatalog.GetItem(stockItem.itemId);
                if (itemData == null) continue;

                // Create item entry
                CreateItemEntry(buyItemsContainer, buyItemPrefab, itemData, stockItem.unitPrice,
                    playerCount, false, (itemId, qty) => OnSellItem(itemId, qty));
            }
        }

        /// <summary>
        /// Creates a UI entry for a single item in the vendor list.
        /// </summary>
        private void CreateItemEntry(Transform container, GameObject prefab, ItemData itemData,
            int price, int availableCount, bool isVendorSelling, Action<string, int> onBuy)
        {
            if (prefab == null) return;

            GameObject entryObj = GameObject.Instantiate(prefab, container);
            entryObj.SetActive(true);

            // Find UI elements by name (standard Unity UI pattern)
            Text nameText = entryObj.GetComponentInChildren<Text>();
            Button buyButton = entryObj.GetComponentInChildren<Button>();

            if (nameText != null)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                string itemName = (mgr != null && mgr.CurrentLanguage == Language.Tamil)
                    ? itemData.itemNameTa
                    : itemData.itemNameEn;

                nameText.text = $"{itemName} - {price} coins (x{availableCount})";
            }

            if (buyButton != null)
            {
                string itemId = itemData.itemId;
                buyButton.onClick.RemoveAllListeners();
                buyButton.onClick.AddListener(() => onBuy?.Invoke(itemId, 1));
            }
        }

        /// <summary>
        /// Handles buying an item from the vendor.
        /// </summary>
        private void OnBuyItem(string itemId, int quantity)
        {
            if (activeVendor == null) return;

            string resultMessage;
            bool success = activeVendor.TryBuyItem(itemId, quantity, out resultMessage);

            if (success)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                ShowFeedback(mgr != null ? mgr.Get("vendor.buy_success", itemId) : $"Bought {itemId}");
                RefreshDisplay();
            }
            else
            {
                ShowFeedback(resultMessage);
            }
        }

        /// <summary>
        /// Handles selling an item to the vendor.
        /// </summary>
        private void OnSellItem(string itemId, int quantity)
        {
            if (activeVendor == null) return;

            string resultMessage;
            bool success = activeVendor.TrySellItem(itemId, quantity, out resultMessage);

            if (success)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                ShowFeedback(mgr != null ? mgr.Get("vendor.sell_success", itemId) : $"Sold {itemId}");
                RefreshDisplay();
            }
            else
            {
                ShowFeedback(resultMessage);
            }
        }

        /// <summary>
        /// Shows a feedback message to the player.
        /// </summary>
        private void ShowFeedback(string message)
        {
            if (feedbackText != null)
            {
                feedbackText.text = message;
                feedbackText.gameObject.SetActive(true);

                // Hide after delay using a simple coroutine-like approach
                StartCoroutine(HideFeedbackAfterDelay(feedbackText, feedbackDisplayTime));
            }
        }

        /// <summary>
        /// Called by the vendor when the player walks away or interaction is broken.
        /// </summary>
        public void OnInteractionBroken()
        {
            Close();
        }

        /// <summary>
        /// Coroutine that hides the feedback text after a delay.
        /// </summary>
        private IEnumerator HideFeedbackAfterDelay(Text text, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (text != null) text.gameObject.SetActive(false);
        }
    }
}
