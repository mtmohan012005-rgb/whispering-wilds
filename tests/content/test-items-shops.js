// ============================================================================
// THE WHISPERING WILDS - ITEMS & SHOPS TEST SUITE
// Validates authoritative single-deduction currency transactions,
// regional purchase match, stock decrement, and inventory delivery.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Items & Shops QA Tests ---');
    let passed = 0;
    let failed = 0;
    const errors = [];

    function assert(cond, msg) {
      if (cond) {
        passed++;
      } else {
        failed++;
        errors.push(msg);
        console.error(`[FAIL] ${msg}`);
      }
    }

    try {
      const shopSys = window.ContentShopSystem;
      const reg = window.ContentRegistry;
      assert(shopSys !== null && typeof shopSys === 'object', 'ContentShopSystem must exist on window');

      // 1. Author a test item and shop
      const testItem = {
        id: 'item_test_athangudi_coaster',
        nameEn: 'Handmade Athangudi Tile Coaster',
        nameTa: 'ஆத்தங்குடி கைவினை டைல் கோஸ்டர்',
        category: 'cultural_objects',
        weight: 0.3,
        value: 20
      };

      const testShop = {
        id: 'shop_test_chettinad_crafts',
        nameEn: 'Chettinad Heritage Craft Emporium',
        nameTa: 'செட்டிநாடு பாரம்பரிய கைவினை அங்காடி',
        region: 'chettinad',
        inventory: [
          { id: 'item_test_athangudi_coaster', stock: 5, priceMultiplier: 1.0 }
        ]
      };

      reg.register('item', testItem);
      reg.register('shop', testShop);
      shopSys.init(reg);

      // 2. Regional mismatch guard: player in 'chennai' cannot buy from 'chettinad' shop
      const wrongRegionAttempt = shopSys.openShop('shop_test_chettinad_crafts', 'chennai');
      assert(wrongRegionAttempt.success === false && wrongRegionAttempt.reason === 'REGION_MISMATCH',
        'Attempting to purchase from a shop in another region must be blocked');

      // 3. Open shop in correct region
      const openRes = shopSys.openShop('shop_test_chettinad_crafts', 'chettinad');
      assert(openRes.success === true, 'Opening shop in matching region must succeed');
      assert(Array.isArray(openRes.items) && openRes.items.length === 1, 'Shop catalog must display stocked items');

      // Setup initial player funds
      if (!window.GameState) window.GameState = {};
      if (!window.GameState.player) window.GameState.player = { money: 100 };
      if (!window.GameState.inventory) window.GameState.inventory = { items: [] };

      const initialMoney = window.GameState.player.money;

      // 4. Perform single purchase
      const purchaseRes = shopSys.purchaseItem('shop_test_chettinad_crafts', 'item_test_athangudi_coaster', 1);
      assert(purchaseRes.success === true, 'Purchase must succeed when funds and stock are available');
      assert(purchaseRes.totalPrice === 20, 'Item price must be exactly ₹20');

      // 5. Single deduction authority check: Money must decrease by exactly 20 (no double deduction)
      const afterFirstPurchase = window.GameState.player.money;
      assert(afterFirstPurchase === initialMoney - 20, `Player money must decrease by exactly ₹20 (was ${initialMoney}, now ${afterFirstPurchase})`);

      // 6. Check stock decrement
      assert(purchaseRes.remainingStock === 4, 'Stock must decrement by purchased count');

      // 7. Check inventory item receipt
      const held = (window.GameState?.inventory?.items || []).filter(i => (typeof i === 'string' ? i : i.id) === 'item_test_athangudi_coaster');
      assert(held.length > 0, 'Purchased item must be delivered into player inventory');

      // Clean up test item & shop
      reg.stores.get('item').delete('item_test_athangudi_coaster');
      reg.idIndex.delete('item_test_athangudi_coaster');
      reg.stores.get('shop').delete('shop_test_chettinad_crafts');
      reg.idIndex.delete('shop_test_chettinad_crafts');

    } catch (err) {
      failed++;
      errors.push(`Unhandled items & shops test error: ${err.message}`);
    }

    return {
      suite: 'ItemsAndShops',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testItemsShops = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
