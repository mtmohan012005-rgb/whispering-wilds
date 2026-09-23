/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Regional Market Life Simulation System (MarketLifeSystem)
 * Manages daily market lifecycles (CLOSED, PREPARING, OPEN, BUSY, CLOSING),
 * regional stall catalogs, merchant routines, and distance-based shopper crowd LOD.
 */

class MarketLifeSystem {
  /**
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(scene = null, collision = null) {
    this.scene = scene;
    this.collision = collision;

    this.regionMarketStates = new Map(); // regionKey -> 'OPEN' | 'BUSY' | 'CLOSED' ...
    this.marketStalls = [];

    this.initDefaultMarkets();
  }

  initDefaultMarkets() {
    const regions = ['GEORGE_TOWN', 'CAUVERY_DELTA', 'PICHAVARAM', 'CHETTINAD', 'THANJAVUR', 'MAMALLAPURAM', 'NILGIRIS'];
    for (const r of regions) {
      this.regionMarketStates.set(r, 'OPEN');
    }

    // Instantiate representative regional stalls
    if (this.scene) {
      this.marketStalls.push(new window.MarketStall({
        id: 'stall_chennai_flower',
        name: 'Mylapore Jasmine Bazaar Stall',
        region: 'GEORGE_TOWN',
        stallType: 'flower',
        x: -246, y: 2.2, z: 8
      }, this.scene, this.collision));

      this.marketStalls.push(new window.MarketStall({
        id: 'stall_delta_produce',
        name: 'Cauvery Green Paddy & Plantain Stall',
        region: 'CAUVERY_DELTA',
        stallType: 'vegetable',
        x: -155, y: 4.8, z: 18
      }, this.scene, this.collision));

      this.marketStalls.push(new window.MarketStall({
        id: 'stall_pichavaram_fish',
        name: 'Estuary Crab & Fresh Catch Stall',
        region: 'PICHAVARAM',
        stallType: 'fish',
        x: -78, y: 1.2, z: -35
      }, this.scene, this.collision));
    }
  }

  setRegionMarketState(regionKey, newState) {
    const valid = ['CLOSED', 'PREPARING', 'OPEN', 'BUSY', 'CLOSING'];
    if (!valid.includes(newState)) return;

    this.regionMarketStates.set(regionKey, newState);

    for (const stall of this.marketStalls) {
      if (stall.region === regionKey) {
        stall.setMarketState(newState);
      }
    }
  }

  getRegionMarketState(regionKey) {
    return this.regionMarketStates.get(regionKey) || 'OPEN';
  }

  update(playerPos, deltaTime) {
    // Distance LOD: full simulation nearby, throttled far away (Section 20 & 36)
    if (!playerPos) return;

    for (const stall of this.marketStalls) {
      const dx = playerPos.x - stall.position.x;
      const dz = playerPos.z - stall.position.z;
      const distSq = dx * dx + dz * dz;

      // Beyond 60 meters, skip detailed transform animations
      if (distSq > 3600) {
        stall.group.visible = false;
      } else {
        stall.group.visible = true;
      }
    }
  }
}

window.MarketLifeSystem = MarketLifeSystem;
