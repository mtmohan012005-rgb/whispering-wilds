// ============================================================================
// THE WHISPERING WILDS - VEHICLE & BOAT AUDIO TEST SUITE
// Validates transport audio for auto-rickshaw, bus, motorcycle, bicycle,
// bullock cart, and boat hydroacoustics (oars, wake, mangrove roots).
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Vehicle & Boat Audio QA Tests ---');
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
      const vehicleSys = window.VehicleAudioSystem;
      const boatSys = window.BoatAudioSystem;
      assert(vehicleSys !== null && (typeof vehicleSys === 'object' || typeof vehicleSys === 'function'), 'VehicleAudioSystem must exist on window');
      assert(boatSys !== null && (typeof boatSys === 'object' || typeof boatSys === 'function'), 'BoatAudioSystem must exist on window');

      vehicleSys.init();
      boatSys.init();

      // 1. Vehicle Audio Types
      const supportedVehicles = ['auto', 'bus', 'motorcycle', 'bicycle', 'bullock_cart'];
      for (const vType of supportedVehicles) {
        const handle = vehicleSys.setVehicleType(vType);
        assert(vehicleSys.currentVehicleType === vType, `Vehicle type must update to ${vType}`);
      }

      // 2. Throttle & Speed Audio Modulation (Auto-Rickshaw 2-stroke engine)
      vehicleSys.setVehicleType('auto');
      vehicleSys.updateSpeed(0.0); // Idle
      assert(vehicleSys.engineState === 'idle', 'Zero speed must set vehicle state to idle');

      vehicleSys.updateSpeed(0.65); // Accelerating
      assert(vehicleSys.engineState === 'accelerating' || vehicleSys.currentSpeed > 0.5, 'Moving speed must trigger acceleration audio state');

      vehicleSys.triggerHorn();
      assert(vehicleSys.lastHornTime > 0, 'Auto horn trigger must record timestamp');

      // 3. Boat Audio System (Pichavaram Mangroves)
      boatSys.onOarStroke({ velocity: 0.8, isForward: true });
      assert(boatSys.lastOarStrokeTime > 0, 'Oar stroke must register stroke timestamp');

      boatSys.updateWake(0.75); // Wake loop
      assert(boatSys.wakeIntensity >= 0.5, 'Boat wake sound intensity must scale with hull speed');

      boatSys.onMangroveRootContact();
      assert(boatSys.lastRootContactTime > 0, 'Mangrove root contact must trigger hollow wood brush SFX');

      // 4. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testVehicleAudio: ${err.message}`);
    }

    console.log(`✓ Vehicle & Boat Audio QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testVehicleAudio = runTests;
})();
