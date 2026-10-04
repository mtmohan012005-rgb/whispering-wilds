using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;

namespace WhisperingWilds.Inventory
{
    [Serializable]
    public class InventorySlot
    {
        public ItemData item;
        public int count;

        public InventorySlot(ItemData item, int count)
        {
            this.item = item;
            this.count = count;
        }
    }

    /// <summary>
    /// Player inventory and currency management.
    ///
    /// Save and load works purely on stable item identifiers. A load resolves each id through
    /// <see cref="GameDataCatalog"/> and rebuilds slots from scratch, so a save never depends on
    /// Unity object references surviving a process restart, and a restored inventory matches the
    /// save file exactly.
    /// </summary>
    [DisallowMultipleComponent]
    public class InventoryManager : MonoBehaviour
    {
        public static InventoryManager Instance { get; private set; }

        [Header("Capacity & Currency")]
        [SerializeField] private int maxSlots = 24;
        [SerializeField] private float maxWeightKg = 30.0f;
        [SerializeField] private int currency = 100; // Chola coins / cash

        [Header("Contents")]
        [SerializeField] private List<InventorySlot> slots = new List<InventorySlot>();

        public int Currency => currency;
        public int MaxSlots => maxSlots;
        public float MaxWeightKg => maxWeightKg;
        public IReadOnlyList<InventorySlot> Slots => slots;

        public float CurrentWeight
        {
            get
            {
                float weight = 0f;
                for (int i = 0; i < slots.Count; i++)
                {
                    var s = slots[i];
                    if (s != null && s.item != null) weight += s.item.weightKg * s.count;
                }
                return weight;
            }
        }

        /// <summary>True when the next single unit would exceed the carried weight limit.</summary>
        public bool IsOverWeight => CurrentWeight > maxWeightKg + 0.0001f;

        public event Action OnInventoryChanged;
        public event Action<int> OnCurrencyChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
            if (Application.isPlaying)
            {
                DontDestroyOnLoad(gameObject);
            }
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>
        /// Where an incoming item grant came from. Only <see cref="Collected"/> is a player action,
        /// so only that source may satisfy a CollectItem objective.
        /// </summary>
        public enum ItemGrantSource
        {
            Collected,
            Crafted,
            Rewarded,
            Restored
        }

        public bool AddItem(ItemData item, int amount = 1)
        {
            return AddItem(item, amount, ItemGrantSource.Collected);
        }

        /// <summary>
        /// Adds items with an explicit origin. Craft results and quest rewards must not be reported
        /// as collection, otherwise a crafted item silently satisfies a CollectItem objective.
        /// </summary>
        public bool AddItem(ItemData item, int amount, ItemGrantSource source)
        {
            return TryAddItem(item, amount, source, out _);
        }

        /// <summary>
        /// Adds items, respecting stacking, slot capacity, and weight. Reports how many units were
        /// actually accepted so callers can award partial results rather than silently losing them.
        /// Returns true only when the whole amount was accepted.
        /// </summary>
        public bool TryAddItem(ItemData item, int amount, out int addedCount)
        {
            return TryAddItem(item, amount, ItemGrantSource.Collected, out addedCount);
        }

        /// <summary>
        /// Adds items, respecting stacking, slot capacity, and weight, and reports how many units
        /// were actually accepted so callers can award partial results rather than silently losing
        /// them. Returns true only when the whole amount was accepted; a full rejection still
        /// returns false, so callers must read <paramref name="addedCount"/> before treating a false
        /// result as "nothing happened".
        /// </summary>
        public bool TryAddItem(ItemData item, int amount, ItemGrantSource source, out int addedCount)
        {
            addedCount = 0;
            if (item == null || amount <= 0) return false;

            int remaining = amount;

            // Try stacking onto existing slots first.
            for (int i = 0; i < slots.Count && remaining > 0; i++)
            {
                var slot = slots[i];
                if (slot == null || slot.item != item) continue;
                if (slot.count >= item.maxStackSize) continue;

                int space = item.maxStackSize - slot.count;
                int toAdd = MaxAffordableCount(item, Mathf.Min(space, remaining));
                if (toAdd <= 0) break;

                slot.count += toAdd;
                remaining -= toAdd;
                addedCount += toAdd;
            }

            // Then open new slots if any remain.
            while (remaining > 0 && slots.Count < maxSlots)
            {
                int toAdd = MaxAffordableCount(item, Mathf.Min(item.maxStackSize, remaining));
                if (toAdd <= 0) break;

                slots.Add(new InventorySlot(item, toAdd));
                remaining -= toAdd;
                addedCount += toAdd;
            }

            if (addedCount > 0)
            {
                OnInventoryChanged?.Invoke();
                if (source == ItemGrantSource.Collected) ReportItemCollected(item, addedCount);
            }

            return remaining <= 0;
        }

        /// <summary>
        /// Largest number of units of <paramref name="item"/> that fit under the weight limit,
        /// capped at <paramref name="requested"/>. Truncating to the affordable amount is what lets a
        /// partially carried stack succeed: the previous "does the whole stack fit" check rejected
        /// the entire item even when most of it would have fit.
        /// </summary>
        private int MaxAffordableCount(ItemData item, int requested)
        {
            if (item == null || requested <= 0) return 0;

            float unitWeight = item.weightKg;
            if (unitWeight <= 0f) return requested;

            float remaining = maxWeightKg - CurrentWeight;
            if (remaining < 0f) return 0;

            int affordable = Mathf.FloorToInt((remaining + 0.0001f) / unitWeight);
            return Mathf.Min(requested, affordable);
        }

        /// <summary>
        /// Reports a genuine collection so CollectItem quest objectives advance. Ignored for items
        /// granted by quest rewards or loaded from a save, which are not new player actions.
        /// </summary>
        private static void ReportItemCollected(ItemData item, int count)
        {
            if (item == null || count <= 0) return;
            if (string.IsNullOrEmpty(item.itemId)) return;
            GameplayEventBus.Report(QuestObjectiveType.CollectItem, item.itemId);
        }

        public bool RemoveItem(ItemData item, int amount = 1)
        {
            if (item == null || !HasItem(item, amount)) return false;

            int remaining = amount;

            for (int i = slots.Count - 1; i >= 0 && remaining > 0; i--)
            {
                var slot = slots[i];
                if (slot == null || slot.item != item) continue;

                int toRemove = Mathf.Min(slot.count, remaining);
                slot.count -= toRemove;
                remaining -= toRemove;

                if (slot.count <= 0) slots.RemoveAt(i);
            }

            OnInventoryChanged?.Invoke();
            return remaining <= 0;
        }

        public bool HasItem(ItemData item, int amount = 1)
        {
            return GetItemCount(item) >= amount;
        }

        public bool HasItemById(string itemId, int amount = 1)
        {
            var item = GameDataCatalog.GetItem(itemId);
            return item != null && GetItemCount(item) >= amount;
        }

        public int GetItemCount(ItemData item)
        {
            if (item == null) return 0;

            int total = 0;
            for (int i = 0; i < slots.Count; i++)
            {
                var slot = slots[i];
                if (slot != null && slot.item == item) total += slot.count;
            }
            return total;
        }

        public int GetItemCountById(string itemId)
        {
            var item = GameDataCatalog.GetItem(itemId);
            return item == null ? 0 : GetItemCount(item);
        }

        public void AddCurrency(int amount)
        {
            if (amount <= 0) return;
            currency += amount;
            OnCurrencyChanged?.Invoke(currency);
        }

        public bool SpendCurrency(int amount)
        {
            if (amount <= 0 || currency < amount) return false;
            currency -= amount;
            OnCurrencyChanged?.Invoke(currency);
            return true;
        }

        /// <summary>Clears currency directly. Used by save restore, which sets an absolute value.</summary>
        public void SetCurrency(int value)
        {
            currency = Mathf.Max(0, value);
            OnCurrencyChanged?.Invoke(currency);
        }

        /// <summary>
        /// Rebuilds the whole inventory from saved item identifiers and counts.
        ///
        /// This is the repair that was missing: the save file already stored itemId and count, but
        /// nothing consumed them on load. Handles, defensively:
        /// unknown item ids (skipped with a warning), negative or zero counts (rejected),
        /// duplicate entries for one id (merged), counts beyond a stack size (split across
        /// slots), and slot or weight overflow (truncated, and reported).
        ///
        /// Returns the resolved contents so the caller can compare against the save file.
        /// </summary>
        public List<SavedInventoryItem> RestoreFromSave(List<SavedInventoryItem> savedItems, int savedCurrency)
        {
            slots.Clear();

            // Merge first: a save listing the same id twice must not produce two partial stacks
            // that overflow a stack size or consume two slots unnecessarily.
            var merged = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var order = new List<string>();

            if (savedItems != null)
            {
                for (int i = 0; i < savedItems.Count; i++)
                {
                    var entry = savedItems[i];
                    if (entry == null || string.IsNullOrEmpty(entry.itemId)) continue;

                    if (!GameDataCatalog.HasItem(entry.itemId))
                    {
                        Debug.LogWarning($"[Inventory] Save references unknown item '{entry.itemId}'; skipping it.");
                        continue;
                    }

                    if (entry.count <= 0)
                    {
                        Debug.LogWarning($"[Inventory] Save references item '{entry.itemId}' with invalid count {entry.count}; ignoring that entry.");
                        continue;
                    }

                    if (!merged.TryGetValue(entry.itemId, out int existing))
                    {
                        order.Add(entry.itemId);
                        merged[entry.itemId] = entry.count;
                    }
                    else
                    {
                        // Saturate rather than overflow: a hostile or corrupt save listing huge
                        // counts must not wrap into a negative count that restores as nothing.
                        long sum = (long)existing + entry.count;
                        merged[entry.itemId] = sum > int.MaxValue ? int.MaxValue : (int)sum;
                    }
                }
            }

            var resolved = new List<SavedInventoryItem>();

            for (int i = 0; i < order.Count; i++)
            {
                string itemId = order[i];
                var item = GameDataCatalog.GetItem(itemId);
                int wanted = merged[itemId];
                int granted = 0;

                while (granted < wanted && slots.Count < maxSlots)
                {
                    int chunk = MaxAffordableCount(item, Mathf.Min(item.maxStackSize, wanted - granted));
                    if (chunk <= 0) break;

                    slots.Add(new InventorySlot(item, chunk));
                    granted += chunk;
                }

                if (granted < wanted)
                {
                    Debug.LogWarning($"[Inventory] Item '{itemId}' restored partially: {granted}/{wanted}. Capacity or weight limit reached.");
                }

                resolved.Add(new SavedInventoryItem { itemId = itemId, count = granted });
            }

            SetCurrency(savedCurrency);

            OnInventoryChanged?.Invoke();
            return resolved;
        }

        /// <summary>Empties the inventory and resets currency to a new-game default. Used by New Game.</summary>
        public void ResetToNewGameDefaults()
        {
            slots.Clear();
            currency = 100;
            OnInventoryChanged?.Invoke();
            OnCurrencyChanged?.Invoke(currency);
        }
    }
}