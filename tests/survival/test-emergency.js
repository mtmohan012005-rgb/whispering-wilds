/**
 * Automated QA Test: Emergency System, Fall Damage Calibration, and Downed State
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testEmergencySuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA EMERGENCY] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const emergSys = window.emergencySystem || new window.EmergencySystem();
    const gs = window.GameState;

    // 1. Fall Damage Calibration (Small vs Moderate vs Large)
    gs.player.survival.health = 100;
    emergSys.handleFallDamage(12.0, true); // Below threshold (14.5)
    const smallFallSafe = gs.player.survival.health === 100;
    log('Small Fall Velocity (No Damage)', smallFallSafe,
      `Health: ${gs.player.survival.health}`);

    emergSys.handleFallDamage(18.0, true); // Moderate fall: (18 - 14.5)*4 = 14 damage
    const moderateDamage = 100 - gs.player.survival.health;
    const moderateDamageOk = moderateDamage >= 5 && moderateDamage <= 30;
    log('Moderate Fall Damage Calibration', moderateDamageOk,
      `Damage taken: ${moderateDamage.toFixed(1)}, Remaining HP: ${gs.player.survival.health}`);

    gs.player.survival.health = 100;
    emergSys.handleFallDamage(28.0, true); // High fall: (28 - 14.5)*4 = 54 damage
    const largeDamage = 100 - gs.player.survival.health;
    const largeDamageOk = largeDamage >= 35 && largeDamage <= 70;
    log('High Fall Significant Damage Calibration', largeDamageOk,
      `Damage taken: ${largeDamage.toFixed(1)}, Remaining HP: ${gs.player.survival.health}`);

    // 2. State Machine Transitions (NORMAL -> WARNING -> CRITICAL)
    gs.player.survival.health = 80;
    emergSys.evaluateVitals(gs.player.survival);
    const isNormal = emergSys.currentState === 'NORMAL';

    gs.player.survival.health = 40;
    emergSys.evaluateVitals(gs.player.survival);
    const isWarning = emergSys.currentState === 'WARNING';

    gs.player.survival.health = 10;
    emergSys.evaluateVitals(gs.player.survival);
    const isCritical = emergSys.currentState === 'CRITICAL';
    log('Emergency State Hierarchy (NORMAL -> WARNING -> CRITICAL)', isNormal && isWarning && isCritical,
      `Final State: ${emergSys.currentState}`);

    // 3. Downed State Transition (0 HP does not trigger instant death/reload)
    gs.player.survival.health = 0;
    emergSys.evaluateVitals(gs.player.survival);
    const isDowned = emergSys.currentState === 'DOWNED';
    log('Downed State Transition on 0 HP', isDowned,
      `Current State: ${emergSys.currentState}`);

    // 4. Non-Destructive Safe Respawn & Progression Invariance
    // Snapshot player assets
    const preInvCount = gs.player.inventory.length;
    const preCurrency = gs.player.currency;
    const preCustomLimit = gs.player.customizationChangesUsed;

    const recoveryRes = emergSys.recoverFromDowned();
    const isRecovered = recoveryRes.success && emergSys.currentState === 'NORMAL';

    // Verify recovery vitals
    const vitalsRestored = (
      gs.player.survival.health >= 30 &&
      gs.player.survival.energy >= 35 &&
      gs.player.survival.hydration >= 40
    );

    // Verify assets preservation
    const inventoryPreserved = gs.player.inventory.length === preInvCount;
    const currencyPreserved = gs.player.currency === preCurrency;
    const customizationPreserved = (gs.player.customizationChangesUsed === preCustomLimit) && (gs.player.customizationChangesUsed <= 5);

    log('Safe Haven Non-Destructive Respawn & Asset Preservation', isRecovered && vitalsRestored && inventoryPreserved && currencyPreserved && customizationPreserved,
      `HP: ${gs.player.survival.health}, Energy: ${gs.player.survival.energy}, Inv Items: ${gs.player.inventory.length}, Currency: ₹${gs.player.currency}, Customization Used: ${gs.player.customizationChangesUsed}/5`);

    // 5. Safe Respawn Location Validation
    const respawnPos = emergSys.getSafeRespawnPoint();
    const hasValidCoords = typeof respawnPos.x === 'number' && typeof respawnPos.z === 'number';
    log('Regional Safe Respawn Coordinates Validation', hasValidCoords,
      `Respawn point: [${respawnPos.x}, ${respawnPos.y}, ${respawnPos.z}] (${respawnPos.name || 'Safe Zone'})`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Emergency Suite Error', false, err.message);
    return { passed: false, results };
  }
};
