using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;

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
        public float MaxWeightKg => maxWeightKg;
        public IReadOnlyList<InventorySlot> Slots => slots;
        public float CurrentWeight
        {
            get
            {
                float weight = 0f;
                foreach (var s in slots)
                {
                    if (s.item != null) weight += s.item.weightKg * s.count;
                }
                return weight;
            }
        }

        public event Action OnInventoryChanged;
        public event Action<int> OnCurrencyChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public bool AddItem(ItemData item, int amount = 1)
        {
            if (item == null || amount <= 0) return false;

            // Try stacking onto existing slot
            foreach (var slot in slots)
            {
                if (slot.item == item && slot.count < item.maxStackSize)
                {
                    int space = item.maxStackSize - slot.count;
                    int toAdd = Mathf.Min(space, amount);
                    slot.count += toAdd;
                    amount -= toAdd;

                    if (amount <= 0)
                    {
                        OnInventoryChanged?.Invoke();
                        return true;
                    }
                }
            }

            // Add into new slot if space exists
            while (amount > 0 && slots.Count < maxSlots)
            {
                int toAdd = Mathf.Min(item.maxStackSize, amount);
                slots.Add(new InventorySlot(item, toAdd));
                amount -= toAdd;
            }

            OnInventoryChanged?.Invoke();
            return amount <= 0;
        }

        public bool RemoveItem(ItemData item, int amount = 1)
        {
            if (item == null || !HasItem(item, amount)) return false;

            for (int i = slots.Count - 1; i >= 0; i--)
            {
                if (slots[i].item == item)
                {
                    int toRemove = Mathf.Min(slots[i].count, amount);
                    slots[i].count -= toRemove;
                    amount -= toRemove;

                    if (slots[i].count <= 0)
                    {
                        slots.RemoveAt(i);
                    }

                    if (amount <= 0) break;
                }
            }

            OnInventoryChanged?.Invoke();
            return true;
        }

        public bool HasItem(ItemData item, int amount = 1)
        {
            int total = 0;
            foreach (var slot in slots)
            {
                if (slot.item == item) total += slot.count;
                if (total >= amount) return true;
            }
            return false;
        }

        public int GetItemCount(ItemData item)
        {
            int total = 0;
            foreach (var slot in slots)
            {
                if (slot.item == item) total += slot.count;
            }
            return total;
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

        public void RestoreState(int savedCurrency, List<InventorySlot> savedSlots)
        {
            currency = Mathf.Max(0, savedCurrency);
            slots = savedSlots ?? new List<InventorySlot>();
            OnInventoryChanged?.Invoke();
            OnCurrencyChanged?.Invoke(currency);
        }
    }
}
