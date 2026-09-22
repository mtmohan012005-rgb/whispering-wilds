// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - LIGHT SURVIVAL & CAMPING PROGRESSION
// Hunger, Thirst, Energy, Core Body Temp, Base Upgrades & Rested Stamina Buff
// ============================================================================

class SurvivalSystem {
  constructor() {
    // Vitals (0 - 100)
    this.hunger = 85;
    this.thirst = 90;
    this.energy = 100;
    this.coreTemp = 36.1; // Celsius (Chennai thunderstorm at night)

    // Base Progression (1: Tent & Fire, 2: Woodland Cabin, 3: Upgraded Outpost)
    this.baseTier = 1;
    this.hasRestedBuff = false;
    this.restedTimer = 0;

    // Currency & Supplies
    this.currency = 75; // Rupees ₹
    this.inventory = {
      wood: 8,
      stone: 4,
      cloth: 3,
      herbs: 2,
      canteenWater: 3, // sips
      vadai: 1
    };

    // Placed structures
    this.campfires = [];
    this.tents = [];
  }

  update(deltaTime, playerX, weatherSystem, isNearFire = false) {
    // 1. Natural slow decay
    this.hunger = Math.max(0, this.hunger - (0.45 * deltaTime));
    this.thirst = Math.max(0, this.thirst - (0.7 * deltaTime));

    // 2. Core Body Temperature calculation
    // Base biome temp: Chennai ~32C, Pichavaram ~28C, Nilgiris ~13C
    let targetTemp = 37.0;
    if (playerX < 2000) {
      targetTemp = 37.0 + (weatherSystem.current.type === 'sunny' ? 1.5 : -1.0);
    } else if (playerX >= 2000 && playerX < 4000) {
      targetTemp = 36.8 + (weatherSystem.current.type === 'rain' ? -2.5 : 0);
    } else {
      // Freezing Western Ghats
      targetTemp = 33.5 + (weatherSystem.current.type === 'fog' ? -4.0 : -2.0);
    }

    // Warmth from nearby campfire
    if (isNearFire) {
      targetTemp = Math.min(37.5, targetTemp + 5.0);
    }

    // Interpolate core temperature toward target
    this.coreTemp += (targetTemp - this.coreTemp) * (0.04 * deltaTime);

    // 3. Rested Buff timer
    if (this.hasRestedBuff) {
      this.restedTimer -= deltaTime;
      if (this.restedTimer <= 0) {
        this.hasRestedBuff = false;
      }
    }
  }

  consumeEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
  }

  recoverEnergy(amount) {
    const multiplier = this.hasRestedBuff ? 1.4 : 1.0;
    this.energy = Math.min(100, this.energy + (amount * multiplier));
  }

  drinkCanteen() {
    if (this.inventory.canteenWater > 0 && this.thirst < 100) {
      this.inventory.canteenWater--;
      this.thirst = Math.min(100, this.thirst + 35);
      return true;
    }
    return false;
  }

  refillCanteen() {
    this.inventory.canteenWater = 4;
    this.thirst = 100;
  }

  eatVadai() {
    if (this.inventory.vadai > 0 && this.hunger < 100) {
      this.inventory.vadai--;
      this.hunger = Math.min(100, this.hunger + 40);
      this.energy = Math.min(100, this.energy + 15);
      return true;
    }
    return false;
  }

  placeCampfire(x, y) {
    if (this.inventory.wood >= 2) {
      this.inventory.wood -= 2;
      this.campfires.push({ x, y, createdAt: Date.now() });
      return true;
    }
    return false;
  }

  pitchTent(x, y) {
    if (this.inventory.cloth >= 2) {
      this.inventory.cloth -= 2;
      this.tents.push({ x, y, createdAt: Date.now() });
      return true;
    }
    return false;
  }

  sleepInTent(lightingEngine, audio) {
    // Advances time to 6:30 AM (Sunrise)
    lightingEngine.timeOfDay = 6.5;
    this.energy = 100;
    this.hunger = Math.max(20, this.hunger - 15);
    this.thirst = Math.max(20, this.thirst - 20);
    this.hasRestedBuff = true;
    this.restedTimer = 300; // 5 real minutes of rested buff

    if (audio) {
      audio.playDiscoveryJingle();
    }
  }

  upgradeBase() {
    if (this.baseTier === 1 && this.inventory.wood >= 4 && this.inventory.stone >= 2) {
      this.inventory.wood -= 4;
      this.inventory.stone -= 2;
      this.baseTier = 2; // Woodland Cabin
      return 'Woodland Cabin built!';
    } else if (this.baseTier === 2 && this.inventory.wood >= 6 && this.inventory.stone >= 4) {
      this.inventory.wood -= 6;
      this.inventory.stone -= 4;
      this.baseTier = 3; // Upgraded Outpost
      return 'Explorer Outpost fully constructed!';
    }
    return false;
  }
}

window.SurvivalSystem = SurvivalSystem;
