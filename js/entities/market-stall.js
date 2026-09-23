/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Market Stall Entity (MarketStall)
 * Regional authentic market stalls with dynamic daily states (CLOSED, PREPARING, OPEN, BUSY, CLOSING),
 * canopies, merchandise displays, and Tamil shop signs.
 */

class MarketStall extends EnvironmentObject {
  /**
   * @param {Object} config - Stall configuration
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(config = {}, scene = null, collision = null) {
    super(config, scene, collision);

    this.stallType = config.stallType || 'vegetable'; // 'flower' | 'tea' | 'vegetable' | 'fish' | 'textile' | 'craft'
    this.marketState = config.marketState || 'OPEN';
    this.merchantName = config.merchantName || 'Local Merchant';
    this.merchantTamil = config.merchantTamil || 'வணிகர்';
    this.itemsForSale = config.itemsForSale || [];

    this.buildStallGeometry();
  }

  buildStallGeometry() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.8 });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: this.stallType === 'flower' ? 0x9c27b0 : (this.stallType === 'tea' ? 0xd84315 : 0x2e7d32),
      roughness: 0.6
    });

    // 1. Counter table
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.2), woodMat);
    table.position.y = 0.45;
    table.castShadow = true;
    table.receiveShadow = true;
    this.group.add(table);

    // 2. Corner bamboo poles
    for (let x of [-1.1, 1.1]) {
      for (let z of [-0.5, 0.5]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), woodMat);
        pole.position.set(x, 1.2, z);
        this.group.add(pole);
      }
    }

    // 3. Slanted cloth canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.5), canopyMat);
    canopy.position.set(0, 2.35, 0);
    canopy.rotation.x = 0.12;
    canopy.castShadow = true;
    this.group.add(canopy);

    // 4. Tamil signboard banner
    const signMat = new THREE.MeshStandardMaterial({ color: 0xfff8e1, roughness: 0.5 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.05), signMat);
    sign.position.set(0, 2.5, 0.65);
    this.group.add(sign);

    // 5. Produce baskets on counter
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    for (let i = -1; i <= 1; i++) {
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.22, 8), basketMat);
      basket.position.set(i * 0.7, 1.0, 0);
      this.group.add(basket);
    }
  }

  setMarketState(state) {
    const valid = ['CLOSED', 'PREPARING', 'OPEN', 'BUSY', 'CLOSING'];
    if (!valid.includes(state)) return;
    this.marketState = state;

    if (state === 'CLOSED') {
      this.group.userData.description = `${this.name} is currently shuttered for the night.`;
    } else if (state === 'PREPARING') {
      this.group.userData.description = `${this.name} is unloading fresh morning stock.`;
    } else if (state === 'BUSY') {
      this.group.userData.description = `${this.name} is bustling with local customers and animated bargaining.`;
    } else {
      this.group.userData.description = `${this.name} is open for daily trade.`;
    }
  }

  interact(player) {
    return {
      success: true,
      id: this.id,
      stallType: this.stallType,
      state: this.marketState,
      items: this.itemsForSale,
      message: this.group.userData.description
    };
  }
}

window.MarketStall = MarketStall;
