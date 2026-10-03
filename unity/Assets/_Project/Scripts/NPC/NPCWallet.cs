using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.NPC
{
    /// <summary>One line of a trade. Prices are whole coins to keep transactions deterministic.</summary>
    [Serializable]
    public struct TradeOffer
    {
        public string itemId;
        public int quantity;
        public int unitPrice;

        public TradeOffer(string itemId, int quantity, int unitPrice)
        {
            this.itemId = itemId;
            this.quantity = Mathf.Max(0, quantity);
            this.unitPrice = Mathf.Max(0, unitPrice);
        }

        public int Total => unitPrice * quantity;
    }

    /// <summary>Outcome of a trade attempt. Failures carry a reason instead of throwing.</summary>
    public struct TradeResult
    {
        public bool success;
        public int quantityMoved;
        public int coinsTransferred;
        public string reason;

        public static TradeResult Fail(string reason)
        {
            return new TradeResult { success = false, quantityMoved = 0, coinsTransferred = 0, reason = reason };
        }

        public static TradeResult Ok(int quantity, int coins)
        {
            return new TradeResult { success = true, quantityMoved = quantity, coinsTransferred = coins, reason = null };
        }
    }

    /// <summary>
    /// Minimal reusable trade contract shared by NPCs and the player adapter.
    /// Intentionally small: prices are supplied by the caller, so no party can mint
    /// value by choosing its own numbers.
    /// </summary>
    public interface INPCTradeParticipant
    {
        string ParticipantId { get; }

        /// <summary>Bounded coin balance. Never negative, never above the wallet cap.</summary>
        int CoinBalance { get; }

        bool CanBuy(TradeOffer offer);
        bool CanSell(TradeOffer offer);

        /// <summary>Participant pays coins and receives stock.</summary>
        TradeResult Buy(TradeOffer offer);

        /// <summary>Participant receives coins and gives up stock.</summary>
        TradeResult Sell(TradeOffer offer);
    }

    /// <summary>
    /// Bounded, deterministic NPC purse and stock.
    ///
    /// Money safety rules, all enforced here rather than by convention:
    ///  - the balance is clamped to [0, maxCoins], so no code path can go negative
    ///    or accumulate unbounded wealth;
    ///  - a sale cannot pay out more than the offer's stated total, and a purchase
    ///    requires the full total up front;
    ///  - daily restock is an explicit allowance, so restocking is bounded per day
    ///    instead of being an unlimited money faucet;
    ///  - there is no randomness. Same inputs always produce the same result, which
    ///    keeps saves reproducible.
    /// </summary>
    [Serializable]
    public class NPCWallet : INPCTradeParticipant
    {
        [SerializeField] private string participantId = "npc";
        [SerializeField] private int coins;
        [SerializeField] private int maxCoins = 4000;

        [SerializeField] private List<StockLine> stock = new List<StockLine>();

        [Serializable]
        public struct StockLine
        {
            public string itemId;
            public int count;
            public int maxCount;
        }

        private readonly Dictionary<string, int> restockAllowance = new Dictionary<string, int>();

        public NPCWallet(string participantId, int startingCoins, int maxCoins)
        {
            this.participantId = participantId;
            this.coins = Mathf.Clamp(startingCoins, 0, maxCoins);
            this.maxCoins = Mathf.Max(1, maxCoins);
        }

        public string ParticipantId => participantId;

        public int CoinBalance => coins;

        public int MaxCoins => maxCoins;

        /// <summary>Total units held across all stock lines.</summary>
        public int TotalStock
        {
            get
            {
                int total = 0;
                for (int i = 0; i < stock.Count; i++) total += stock[i].count;
                return total;
            }
        }

        public int GetStock(string itemId)
        {
            for (int i = 0; i < stock.Count; i++)
            {
                if (stock[i].itemId == itemId) return stock[i].count;
            }
            return 0;
        }

        public bool CanBuy(TradeOffer offer)
        {
            if (offer.quantity <= 0 || offer.unitPrice < 0) return false;
            if (offer.Total <= 0) return false;
            return coins >= offer.Total;
        }

        public bool CanSell(TradeOffer offer)
        {
            if (offer.quantity <= 0 || offer.unitPrice < 0) return false;
            return GetStock(offer.itemId) >= offer.quantity;
        }

        public TradeResult Buy(TradeOffer offer)
        {
            if (!CanBuy(offer)) return TradeResult.Fail("insufficient_funds");

            coins -= offer.Total;
            AddStock(offer.itemId, offer.quantity, int.MaxValue);
            return TradeResult.Ok(offer.quantity, -offer.Total);
        }

        public TradeResult Sell(TradeOffer offer)
        {
            if (!CanSell(offer)) return TradeResult.Fail("insufficient_stock");

            RemoveStock(offer.itemId, offer.quantity);

            // Clamp rather than trusting the caller: this is the only place coins are
            // created, so the wallet ceiling holds no matter who asks.
            coins = Mathf.Clamp(coins + offer.Total, 0, maxCoins);

            return TradeResult.Ok(offer.quantity, offer.Total);
        }

        /// <summary>
        /// Grants a bounded quantity of stock, consuming the day's restock allowance.
        /// Returns the amount actually granted, which may be less than requested.
        /// </summary>
        public int Restock(string itemId, int requested, int maxPerLine, int allowancePerDay)
        {
            if (string.IsNullOrEmpty(itemId) || requested <= 0 || allowancePerDay <= 0) return 0;

            int already;
            restockAllowance.TryGetValue(itemId, out already);
            int remaining = allowancePerDay - already;
            if (remaining <= 0) return 0;

            int granted = Mathf.Min(Mathf.Min(requested, remaining), maxPerLine);
            if (granted <= 0) return 0;

            AddStock(itemId, granted, maxPerLine);
            restockAllowance[itemId] = already + granted;
            return granted;
        }

        /// <summary>Call when the in-game day rolls over to refill restock allowances.</summary>
        public void BeginNewDay()
        {
            restockAllowance.Clear();
        }

        private void AddStock(string itemId, int amount, int capPerLine)
        {
            for (int i = 0; i < stock.Count; i++)
            {
                if (stock[i].itemId != itemId) continue;

                // Struct element: read-modify-write, since stock[i] is a copy.
                StockLine line = stock[i];
                int cap = capPerLine == int.MaxValue ? line.maxCount : Mathf.Min(line.maxCount, capPerLine);
                line.count = Mathf.Clamp(line.count + amount, 0, Mathf.Max(0, cap));
                stock[i] = line;
                return;
            }

            int lineCap = capPerLine == int.MaxValue ? amount : Mathf.Max(0, capPerLine);
            stock.Add(new StockLine { itemId = itemId, count = Mathf.Max(0, amount), maxCount = lineCap });
        }

        private void RemoveStock(string itemId, int amount)
        {
            for (int i = 0; i < stock.Count; i++)
            {
                if (stock[i].itemId != itemId) continue;

                StockLine line = stock[i];
                line.count = Mathf.Max(0, line.count - amount);
                stock[i] = line;
                return;
            }
        }
    }
}