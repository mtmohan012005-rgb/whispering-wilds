/**
 * Automated QA Test: Inventory Satchel Capacity (20kg), Stacking & Quest Item Protection
 */

window.testInventorySuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA INVENTORY] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const inv = new window.InventorySystem(20.0);

    // 1. Initial Satchel Setup
    const maxCap = inv.maxWeight === 20.0;
    log('Inventory Maximum Capacity Specification (20kg)', maxCap, `MaxWeight: ${inv.maxWeight}kg`);

    // 2. Add Normal Item & Stacking
    const add1 = inv.addItem({ id: 'chettinad_spice', name: 'Chettinad Masala', weight: 0.5, maxStack: 5 }, 2);
    const has2 = inv.getItemCount('chettinad_spice') === 2;
    const add2 = inv.addItem({ id: 'chettinad_spice', name: 'Chettinad Masala', weight: 0.5, maxStack: 5 }, 2);
    const has4 = inv.getItemCount('chettinad_spice') === 4;
    log('Item Stacking & Weight Calculation', !!add1 && !!add2 && has4,
      `StackedCount: ${inv.getItemCount('chettinad_spice')}, CurrentWeight: ${inv.currentWeight.toFixed(2)}kg`);

    // 3. 20kg Capacity Limit Rejection
    const heavyItem = { id: 'huge_granite_pillar', name: 'Granite Pillar', weight: 25.0, maxStack: 1 };
    const overWeightResult = inv.addItem(heavyItem, 1);
    const rejected = overWeightResult === false && inv.currentWeight <= 20.0;
    log('Over-Capacity Satchel Enforcement (>20kg Blocked)', rejected,
      `Rejected: ${rejected}`);

    // 4. Quest Item Protection (Cannot be dropped or destroyed)
    const questItem = { id: 'ancient_chola_copper_plate', name: 'Chola Copper Plate', isQuestItem: true, weight: 1.0 };
    inv.addItem(questItem, 1);
    const dropAttempt = inv.removeItem('ancient_chola_copper_plate', 1);
    const dropBlocked = dropAttempt === false && inv.getItemCount('ancient_chola_copper_plate') === 1;
    log('Protected Quest Item Drop Prevention', dropBlocked, `DropBlocked: ${dropBlocked}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Inventory Test Failure', false, err.message);
    return { passed: false, results };
  }
};
