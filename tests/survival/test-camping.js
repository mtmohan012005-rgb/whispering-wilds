/**
 * Automated QA Test: Camping System, Placement Validation, and Campfire Lifecycle
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testCampingSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA CAMPING] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const campSys = window.campingSystem || new window.CampingSystem();

    // 1. Placement Validation - Terrain, Swimming & Restricted Zones
    const validPos = { x: 500, y: 10, z: 200 };
    const validCheck = campSys.canPitchCamp(validPos, { terrainSlope: 5, isSwimming: false });
    log('Valid Camp Placement Permission', validCheck.allowed, validCheck.reason || 'Allowed on gentle wilderness terrain');

    const waterCheck = campSys.canPitchCamp(validPos, { terrainSlope: 5, isSwimming: true });
    log('Deep Water Camping Restriction', !waterCheck.allowed, `Blocked: ${waterCheck.reason}`);

    const steepCheck = campSys.canPitchCamp(validPos, { terrainSlope: 35, isSwimming: false });
    log('Steep Cliff Slope Camping Restriction', !steepCheck.allowed, `Blocked: ${steepCheck.reason}`);

    // 2. Pitch Camp Creation & Campfire Properties
    const pitchRes = campSys.pitchCamp(validPos, false);
    const camp = pitchRes.camp;
    const campCreated = pitchRes.success && camp && camp.campfire && camp.shelter;
    log('Camp Deployment & Entity Instantiation', campCreated,
      `Camp ID: ${camp ? camp.id : 'none'}, Campfire Fuel: ${camp && camp.campfire ? camp.campfire.fuel : 0}s`);

    // 3. Proximity to another camp restriction
    const nearbyPos = { x: 505, y: 10, z: 205 }; // 7 meters away
    const tooCloseCheck = campSys.canPitchCamp(nearbyPos);
    log('Minimum Distance Between Camps Enforcement', !tooCloseCheck.allowed, `Blocked: ${tooCloseCheck.reason}`);

    // 4. Campfire Fuel Depletion & Extinguishment
    const initialFuel = camp.campfire.fuel;
    camp.campfire.update(60.0); // burn for 1 minute
    const fuelReduced = camp.campfire.fuel < initialFuel && camp.campfire.isBurning;
    log('Campfire Fuel Consumption Over Time', fuelReduced,
      `Initial: ${initialFuel}s -> After 60s: ${camp.campfire.fuel.toFixed(1)}s`);

    // Extinguish on fuel depletion
    camp.campfire.fuel = 5;
    camp.campfire.update(10.0);
    const extinguished = (camp.campfire.fuel === 0) && (!camp.campfire.isBurning);
    log('Campfire Extinguishes on Fuel Depletion', extinguished,
      `Burning state: ${camp.campfire.isBurning}, Fuel: ${camp.campfire.fuel}`);

    // Add fuel / re-light
    const refueled = camp.campfire.addFuel(120);
    log('Campfire Refueling & Re-ignition', refueled && camp.campfire.isBurning && camp.campfire.fuel >= 120,
      `Refueled Fuel: ${camp.campfire.fuel}s`);

    // 5. Shelter Detection & Warmth Radius
    const nearbyFire = campSys.getNearbyCampfire({ x: 501, y: 10, z: 201 }, 10.0);
    const hasNearbyFire = !!nearbyFire;
    const shelter = campSys.getNearbyShelter({ x: 502, y: 10, z: 201 });
    log('Campfire & Shelter Radial Detection', hasNearbyFire && !!shelter,
      `Campfire detected: ${hasNearbyFire}, Shelter detected: ${!!shelter}`);

    // 6. Temporary Camp Cleanup when Player Travels Far (> 250m)
    const farPlayerPos = { x: 900, y: 10, z: 800 }; // > 400m away
    campSys.update(1.0, farPlayerPos);
    const cleanedUp = !campSys.activeCamps.some(c => c.id === camp.id);
    log('Distant Temporary Camp Auto-Cleanup', cleanedUp,
      `Active camps count after player departs: ${campSys.activeCamps.length}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Camping Suite Error', false, err.message);
    return { passed: false, results };
  }
};
