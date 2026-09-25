// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT SHOP & MERCHANT SYSTEM
// Authoritative merchant trading system with single deduction authority.
// Guarantees atomic transactions, prevents double currency deductions, validates
// regional presence, opening hours, reputation discounts, and stock levels.
// ============================================================================

(function () {
  'use strict';

  class ContentShopSystem {
    constructor(registry = null, eventBus = null) {
      this.registry = registry || window.ContentRegistry;
      this.eventBus = eventBus || window.ContentEvents;
      this.activeShop = null;
      this.transactionLock = false; // Prevents race conditions and double deductions
      this.shopStocks = new Map(); // shopId -> Map(itemId, count)
    }

    init(registry = null, eventBus = null) {
      if (registry) this.registry = registry;
      if (eventBus) this.eventBus = eventBus;
      console.log('[ContentShopSystem] Initialized authoritative single-deduction merchant engine.');
      return this;
    }

    /**
     * Open a shop with regional and hours validation
     */
    openShop(shopId, playerRegion = null) {
      const reg = this.registry || window.ContentRegistry;
      const def = reg?.get('shop', shopId);

      if (!def) {
        console.warn(`[ContentShopSystem] Shop '${shopId}' not found.`);
        return { success: false, reason: 'SHOP_NOT_FOUND' };
      }

      // 1. Regional presence validation: cannot purchase from a shop in another region!
      const currentRegion = playerRegion || window.GameState?.world?.currentRegion || window.GameState?.player?.region;
      if (currentRegion && def.region && def.region !== 'all' && def.region !== 'global') {
        if (currentRegion.toLowerCase() !== def.region.toLowerCase()) {
          console.warn(`[ContentShopSystem] Wrong region: player is in '${currentRegion}', shop is in '${def.region}'`);
          return { success: false, reason: 'REGION_MISMATCH', playerRegion: currentRegion, shopRegion: def.region };
        }
      }

      // 2. Opening hours check
      if (Array.isArray(def.openingHours) && def.openingHours.length > 0) {
        const timeOfDay = (window.GameState?.world?.timeOfDay || window.GameState?.timeOfDay || 'morning').toLowerCase();
        if (!def.openingHours.map(h => h.toLowerCase()).includes(timeOfDay)) {
          return { success: false, reason: 'SHOP_CLOSED', openingHours: def.openingHours, currentTime: timeOfDay };
        }
      }

      // 3. Initialize stock tracking if not initialized
      if (!this.shopStocks.has(shopId)) {
        const stockMap = new Map();
        if (Array.isArray(def.inventory)) {
          for (const itemRef of def.inventory) {
            const id = typeof itemRef === 'string' ? itemRef : itemRef.id;
            const stock = typeof itemRef === 'object' ? (itemRef.stock !== undefined ? itemRef.stock : 99) : 99;
            stockMap.set(id, stock);
          }
        }
        this.shopStocks.set(shopId, stockMap);
      }

      this.activeShop = def;

      if (this.eventBus) {
        this.eventBus.emit('shop_opened', { shopId, shop: def });
      }

      return {
        success: true,
        shopId,
        nameEn: def.nameEn,
        nameTa: def.nameTa,
        ownerNpcId: def.ownerNpcId,
        region: def.region,
        items: this.getShopCatalog(shopId)
      };
    }

    /**
     * Get catalog with calculated prices and reputation discounts
     */
    getShopCatalog(shopId) {
      const reg = this.registry || window.ContentRegistry;
      const def = reg?.get('shop', shopId) || this.activeShop;
      if (!def) return [];

      const stockMap = this.shopStocks.get(shopId) || new Map();
      const catalog = [];

      // Calculate reputation discount
      const playerRep = window.GameState?.reputation?.[def.region] || 0;
      let discountMultiplier = 1.0;
      if (playerRep >= 50) discountMultiplier = 0.85; // 15% discount for respected patrons
      else if (playerRep >= 25) discountMultiplier = 0.92; // 8% discount

      if (Array.isArray(def.inventory)) {
        for (const itemRef of def.inventory) {
          const itemId = typeof itemRef === 'string' ? itemRef : itemRef.id;
          const itemDef = reg.get('item', itemId);
          if (!itemDef) continue;

          const basePrice = itemDef.value || 10;
          const finalPrice = Math.max(1, Math.round(basePrice * (itemRef.priceMultiplier || 1.0) * discountMultiplier));
          const currentStock = stockMap.get(itemId) !== undefined ? stockMap.get(itemId) : 99;

          catalog.push({
            id: itemId,
            nameEn: itemDef.nameEn || itemDef.name || itemId,
            nameTa: itemDef.nameTa || itemDef.name || itemId,
            category: itemDef.category || 'general',
            price: finalPrice,
            basePrice,
            stock: currentStock,
            descriptionEn: itemDef.descriptionEn || '',
            descriptionTa: itemDef.descriptionTa || '',
            weight: itemDef.weight || 0.1
          });
        }
      }

      return catalog;
    }

    /**
     * Single Authoritative Purchase Method
     * Enforces atomic single-deduction, zero duplicate charge, stock decrease, and item delivery.
     */
    purchaseItem(shopId, itemId, count = 1) {
      if (this.transactionLock) {
        console.warn('[ContentShopSystem] Transaction currently locked. Purchase rejected to prevent race condition.');
        return { success: false, reason: 'TRANSACTION_BUSY' };
      }

      this.transactionLock = true;

      try {
        const reg = this.registry || window.ContentRegistry;
        const shopDef = reg?.get('shop', shopId) || this.activeShop;
        if (!shopDef) {
          return { success: false, reason: 'SHOP_NOT_FOUND' };
        }

        const catalog = this.getShopCatalog(shopId);
        const itemInfo = catalog.find(i => i.id === itemId);
        if (!itemInfo) {
          return { success: false, reason: 'ITEM_NOT_STOCKED' };
        }

        // Check stock
        const stockMap = this.shopStocks.get(shopId);
        const currentStock = stockMap ? (stockMap.get(itemId) ?? 99) : 99;
        if (currentStock < count) {
          return { success: false, reason: 'OUT_OF_STOCK', stock: currentStock };
        }

        const totalPrice = itemInfo.price * count;
        const state = window.GameState;
        if (!state) {
          return { success: false, reason: 'NO_GAME_STATE' };
        }

        // Check currency balance
        const currentMoney = state.player?.money || 0;
        if (currentMoney < totalPrice) {
          return { success: false, reason: 'INSUFFICIENT_FUNDS', required: totalPrice, available: currentMoney };
        }

        // ATOMIC SINGLE DEDUCTION
        state.player.money = currentMoney - totalPrice;
        console.log(`[ContentShopSystem] ATOMIC DEDUCTION: Charged ₹${totalPrice}. New balance: ₹${state.player.money}`);

        // Decrement stock
        if (stockMap) {
          stockMap.set(itemId, currentStock - count);
        }

        // Deliver items to inventory
        if (state.inventory) {
          if (!Array.isArray(state.inventory.items)) state.inventory.items = [];
          for (let i = 0; i < count; i++) {
            if (window.InventorySystem?.addItem) {
              window.InventorySystem.addItem(itemId);
            } else {
              state.inventory.items.push(itemId);
            }
          }
        }

        // Play register / coins sound
        if (window.audioManager) {
          window.audioManager.play('sfx_ui_menu_confirm', { category: 'ui', busName: 'UI' });
        }

        // Emit purchase event
        if (this.eventBus) {
          this.eventBus.emit('item_purchased', {
            shopId,
            itemId,
            count,
            totalPrice,
            remainingBalance: state.player.money
          });
        }

        return {
          success: true,
          itemId,
          count,
          totalPrice,
          remainingMoney: state.player.money,
          remainingStock: stockMap ? stockMap.get(itemId) : 99
        };
      } finally {
        this.transactionLock = false;
      }
    }

    closeShop() {
      const shopId = this.activeShop?.id;
      this.activeShop = null;
      if (this.eventBus) {
        this.eventBus.emit('shop_closed', { shopId });
      }
    }
  }

  const instance = new ContentShopSystem();

  if (typeof window !== 'undefined') {
    window.ContentShopSystem = instance;
    window.contentShopSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
