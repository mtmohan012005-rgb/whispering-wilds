// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION ECONOMY SYSTEM
// Single authoritative manager for Rupee (INR) transactions, trade & purchasing.
// Survival, camping, and crafting systems MUST NOT modify currency directly.
// ============================================================================

(function() {
  'use strict';

  class EconomySystem {
    constructor() {
      this.transactionLog = [];
    }

    /**
     * Get player's current authoritative rupee balance
     */
    getBalance() {
      if (window.GameState && window.GameState.player) {
        return Math.max(0, Math.floor(window.GameState.player.currency || 0));
      }
      return 0;
    }

    /**
     * Deduct currency safely with overdraft protection
     * @param {number} amount 
     * @param {string} reason 
     * @returns {boolean} true if successful, false if insufficient funds
     */
    deduct(amount, reason = 'purchase') {
      const amt = Math.floor(Number(amount) || 0);
      if (amt < 0) return false;
      if (amt === 0) return true;

      const current = this.getBalance();
      if (current < amt) {
        if (window.NotificationSystem && typeof window.NotificationSystem.show === 'function') {
          window.NotificationSystem.show('⚠️ Insufficient rupees! (பணம் போதாது)', 'warning');
        }
        return false;
      }

      if (window.GameState && typeof window.GameState.deductCurrency === 'function') {
        const ok = window.GameState.deductCurrency(amt);
        if (!ok) return false;
      } else if (window.GameState && window.GameState.player) {
        window.GameState.player.currency -= amt;
      }

      this._logTransaction(-amt, reason);

      if (window.AudioManager && typeof window.AudioManager.playPinTap === 'function') {
        window.AudioManager.playPinTap();
      }

      // Update HUD rupee chip if present
      this._updateRupeeDisplay();
      return true;
    }

    /**
     * Add currency
     * @param {number} amount 
     * @param {string} reason 
     */
    credit(amount, reason = 'reward') {
      const amt = Math.floor(Number(amount) || 0);
      if (amt <= 0) return false;

      if (window.GameState && typeof window.GameState.addCurrency === 'function') {
        window.GameState.addCurrency(amt);
      } else if (window.GameState && window.GameState.player) {
        window.GameState.player.currency = (window.GameState.player.currency || 0) + amt;
      }

      this._logTransaction(amt, reason);
      this._updateRupeeDisplay();
      return true;
    }

    /**
     * Purchase food, tea, or hydration provisions
     */
    purchaseProvisions(itemId, price, itemName = 'Provision') {
      const success = this.deduct(price, `purchase_food_${itemId}`);
      if (!success) {
        return { success: false, reason: 'insufficient_funds' };
      }

      if (window.inventorySystem && typeof window.inventorySystem.addItem === 'function') {
        window.inventorySystem.addItem(itemId, 1);
      } else if (window.GameState && typeof window.GameState.addItemToInventory === 'function') {
        window.GameState.addItemToInventory(itemId, 1);
      }

      if (window.quests && typeof window.quests.showQuestNotification === 'function') {
        window.quests.showQuestNotification(`Purchased ${itemName} for ₹${price}`);
      }

      return { success: true };
    }

    _logTransaction(amount, reason) {
      this.transactionLog.push({
        timestamp: Date.now(),
        amount,
        reason,
        balanceAfter: this.getBalance()
      });
      if (this.transactionLog.length > 50) {
        this.transactionLog.shift();
      }
    }

    _updateRupeeDisplay() {
      const el = document.getElementById('rupee-count');
      if (el) {
        el.textContent = `₹${this.getBalance()}`;
      }
    }
  }

  const economySystem = new EconomySystem();
  window.EconomySystem = EconomySystem;
  window.economySystem = economySystem;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomySystem;
  }
})();
