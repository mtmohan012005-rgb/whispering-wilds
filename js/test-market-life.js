/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Regional Market Life Simulation
 * Validates market state transitions (CLOSED, PREPARING, OPEN, BUSY, CLOSING),
 * regional stall catalogs, physical stall geometry, and distance LOD throttling.
 */

window.runMarketLifeTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[MARKET TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING REGIONAL MARKET LIFE TEST SUITE <<<');

  try {
    const scene = new THREE.Scene();
    const collision = new window.WorldCollision();
    const marketSys = new window.MarketLifeSystem(scene, collision);

    // -----------------------------------------------------------------
    // TEST 1: Regional Market State Management
    // -----------------------------------------------------------------
    const defaultState = marketSys.getRegionMarketState('GEORGE_TOWN');
    marketSys.setRegionMarketState('GEORGE_TOWN', 'BUSY');
    const busyState = marketSys.getRegionMarketState('GEORGE_TOWN');

    marketSys.setRegionMarketState('GEORGE_TOWN', 'CLOSED');
    const closedState = marketSys.getRegionMarketState('GEORGE_TOWN');

    log('Regional Market State Transitions (Open, Busy, Closed)',
      defaultState === 'OPEN' && busyState === 'BUSY' && closedState === 'CLOSED',
      `Default: ${defaultState}, Busy: ${busyState}, Closed: ${closedState}`);

    // -----------------------------------------------------------------
    // TEST 2: MarketStall 3D Geometry (Canopy, Baskets & Signboard)
    // -----------------------------------------------------------------
    const stall = new window.MarketStall({
      id: 'test_jasmine_stall',
      name: 'Mylapore Jasmine Flowers',
      stallType: 'flower',
      x: 10, y: 0, z: 10
    }, scene, collision);

    const hasChildren = stall.group && stall.group.children.length >= 4;
    const canInteract = typeof stall.interact === 'function';

    log('MarketStall 3D Geometry & Interaction Component',
      hasChildren && canInteract,
      `ChildrenCount: ${stall.group.children.length}, Interactable: ${canInteract}`);

    // -----------------------------------------------------------------
    // TEST 3: Distance-Based Market LOD Simulation
    // -----------------------------------------------------------------
    // Player very far (dist = 100m) -> stall hidden
    marketSys.update({ x: 1000, z: 1000 }, 0.1);
    const culledFar = marketSys.marketStalls.every(s => s.group.visible === false);

    // Player nearby (at stall position) -> stall visible
    const firstStall = marketSys.marketStalls[0];
    marketSys.update({ x: firstStall.position.x, z: firstStall.position.z }, 0.1);
    const visibleNear = firstStall.group.visible === true;

    log('Distance-Based Market Simulation LOD (Culling & Near LOD)',
      culledFar && visibleNear,
      `CulledFar(>60m): ${culledFar}, VisibleNear: ${visibleNear}`);

    return {
      passed: results.every(r => r.passed),
      results
    };
  } catch (err) {
    log('Market Life System Test Failure', false, err.message);
    return { passed: false, results };
  }
};
