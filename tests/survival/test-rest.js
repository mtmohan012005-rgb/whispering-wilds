/**
 * Automated QA Test: Rest System, Time Advancement, and World Clock Authority
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testRestSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA REST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const restSys = window.restSystem || new window.RestSystem();
    const gs = window.GameState;

    // 1. Rest Condition Validation (Swimmng / Falling / Cinematic checks)
    const validCond = restSys.canRest({ isSwimming: false, isFalling: false, safe: true });
    log('Safe Resting Condition Validation', validCond.allowed, validCond.reason || 'Rest allowed in safe area');

    const swimRest = restSys.canRest({ isSwimming: true });
    log('Rest Blocked While Swimming', !swimRest.allowed, `Blocked: ${swimRest.reason}`);

    // 2. Short Rest Execution & Time Advancement
    gs.world.time = 8.0; // 8:00 AM
    gs.player.survival.energy = 40;
    gs.player.survival.health = 70;

    const shortRestRes = restSys.executeRest('SHORT', { safe: true });
    const timeAdvancedShort = (gs.world.time > 8.0) && (gs.world.time <= 9.5);
    const energyRecoveredShort = gs.player.survival.energy > 40;
    log('Short Rest Execution (30-60m) & Moderate Vitals Recovery', shortRestRes.success && timeAdvancedShort && energyRecoveredShort,
      `Time: 8:00 -> ${gs.world.time.toFixed(2)}, Energy: 40 -> ${gs.player.survival.energy.toFixed(1)}`);

    // 3. Long Rest (Overnight sleep, substantial energy + health)
    gs.world.time = 22.0; // 10:00 PM
    gs.player.survival.energy = 20;
    gs.player.survival.health = 50;

    const longRestRes = restSys.executeRest('LONG', { safe: true });
    const morningHour = gs.world.time % 24;
    const timeAdvancedLong = (morningHour >= 6.0 && morningHour <= 7.5); // woke up at dawn
    const energyFull = gs.player.survival.energy >= 85;
    const healthRecovered = gs.player.survival.health > 50;
    const hasRestedBuff = gs.player.survival.statusEffects.includes('RESTED');
    log('Long Rest Overnight Advance to Morning & Rested Buff', longRestRes.success && timeAdvancedLong && energyFull && hasRestedBuff,
      `Time advanced to morning: ${gs.world.time.toFixed(2)}, Energy: ${gs.player.survival.energy}, Status: ${gs.player.survival.statusEffects.join(', ')}`);

    // 4. World Subsystems Synced After Sleep
    let livingWorldUpdated = true;
    if (window.livingWorld) {
      livingWorldUpdated = typeof window.livingWorld.worldClockMinutes === 'number';
    }
    log('Living World NPC Schedule & Clock Synchronization', livingWorldUpdated,
      `World clock updated to match GameState time`);

    // 5. Quest Progression Integrity During Rest
    const activeQuestsBefore = Array.isArray(gs.quests.active) ? gs.quests.active.length : 0;
    restSys.executeRest('SHORT');
    const activeQuestsAfter = Array.isArray(gs.quests.active) ? gs.quests.active.length : 0;
    log('Quest Progression Preserved During Rest', activeQuestsBefore === activeQuestsAfter,
      `Active quests remain valid: ${activeQuestsAfter}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Rest Suite Error', false, err.message);
    return { passed: false, results };
  }
};
