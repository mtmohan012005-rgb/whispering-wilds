// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SURVIVAL SYSTEM ADAPTER
// Bridges legacy APIs to the single authoritative SurvivalProductionSystem.
// Guarantees zero duplicate state and zero double-drain execution.
// ============================================================================

(function() {
  'use strict';

  class SurvivalSystem {
    constructor() {
      // Connect to GameState.player.survival directly
      this._lastUpdatedFrame = -1;

      // Base Progression (1: Tent & Fire, 2: Woodland Cabin, 3: Upgraded Outpost)
      this.baseTier = 1;
      this.hasRestedBuff = false;
      this.restedTimer = 0;

      // Currency & Supplies (mirrored to GameState)
      this.campfires = [];
      this.tents = [];

      // Define reactive vitals mapping directly to GameState.player.survival
      Object.defineProperty(this, 'health', {
        get: () => (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.health : 100,
        set: (v) => {
          if (window.GameState && window.GameState.player && window.GameState.player.survival) {
            window.GameState.player.survival.health = Math.max(0, Math.min(window.GameState.player.survival.maxHealth, Number(v) || 0));
          }
        },
        configurable: true
      });

      Object.defineProperty(this, 'energy', {
        get: () => (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.energy : 100,
        set: (v) => {
          if (window.GameState && window.GameState.player && window.GameState.player.survival) {
            window.GameState.player.survival.energy = Math.max(0, Math.min(window.GameState.player.survival.maxEnergy, Number(v) || 0));
          }
        },
        configurable: true
      });

      Object.defineProperty(this, 'hunger', {
        get: () => (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.hunger : 100,
        set: (v) => {
          if (window.GameState && window.GameState.player && window.GameState.player.survival) {
            window.GameState.player.survival.hunger = Math.max(0, Math.min(window.GameState.player.survival.maxHunger, Number(v) || 0));
          }
        },
        configurable: true
      });

      Object.defineProperty(this, 'thirst', {
        get: () => (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.hydration : 100,
        set: (v) => {
          if (window.GameState && window.GameState.player && window.GameState.player.survival) {
            window.GameState.player.survival.hydration = Math.max(0, Math.min(window.GameState.player.survival.maxHydration, Number(v) || 0));
          }
        },
        configurable: true
      });

      Object.defineProperty(this, 'coreTemp', {
        get: () => (window.GameState && window.GameState.player && window.GameState.player.survival) ? window.GameState.player.survival.warmth : 80,
        set: (v) => {
          if (window.GameState && window.GameState.player && window.GameState.player.survival) {
            window.GameState.player.survival.warmth = Math.max(0, Math.min(window.GameState.player.survival.maxWarmth, Number(v) || 0));
          }
        },
        configurable: true
      });

      Object.defineProperty(this, 'currency', {
        get: () => (window.GameState && window.GameState.player) ? window.GameState.player.currency : 75,
        set: (v) => {
          if (window.GameState && window.GameState.player) {
            window.GameState.player.currency = Math.max(0, Math.floor(v || 0));
          }
        },
        configurable: true
      });

      // Legacy inventory object referencing GameState player inventory
      this.inventory = {
        get wood() {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'wood');
          return item ? item.count : 0;
        },
        set wood(v) {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'wood');
          if (item) item.count = v;
        },
        get stone() {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'stone');
          return item ? item.count : 0;
        },
        set stone(v) {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'stone');
          if (item) item.count = v;
        },
        get cloth() {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'cloth');
          return item ? item.count : 0;
        },
        set cloth(v) {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'cloth');
          if (item) item.count = v;
        },
        get herbs() {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'herbs');
          return item ? item.count : 0;
        },
        set herbs(v) {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'herbs');
          if (item) item.count = v;
        },
        get canteenWater() {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'canteenWater');
          return item ? item.count : 0;
        },
        set canteenWater(v) {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'canteenWater');
          if (item) item.count = v;
        },
        get vadai() {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'vadai');
          return item ? item.count : 0;
        },
        set vadai(v) {
          const item = window.GameState && window.GameState.player && window.GameState.player.inventory.find(i => i.id === 'vadai');
          if (item) item.count = v;
        }
      };
    }

    /**
     * Authoritative single-update entry point
     * Guards against duplicate calls per frame
     */
    update(deltaTime, playerX, weatherSystem, isNearFire = false) {
      if (!window.survivalProductionSystem) return;

      const currentFrame = (window.threeWorld && typeof window.threeWorld.frameCount === 'number') ? window.threeWorld.frameCount : this._lastUpdatedFrame;
      if (this._lastUpdatedFrame === currentFrame && this._lastUpdatedFrame !== -1) {
        // Already updated this frame; prevent double-drain!
        return;
      }
      this._lastUpdatedFrame = (window.threeWorld && typeof window.threeWorld.frameCount === 'number') ? window.threeWorld.frameCount : Date.now();

      const playerPos = (window.GameState && window.GameState.player && window.GameState.player.position) || { x: playerX || 0, y: 0, z: 0 };
      const region = (window.GameState && window.GameState.world && window.GameState.world.currentRegion) || 'george_town';
      const timeOfDay = (window.GameState && window.GameState.world && window.GameState.world.time) || 12.0;
      const weatherType = (weatherSystem && weatherSystem.current && weatherSystem.current.type) || 'clear';

      const ambientTemp = window.temperatureSystem ?
        window.temperatureSystem.calculateAmbientTemperature({
          region,
          timeOfDay,
          weather: weatherType,
          elevation: playerPos.y || 0
        }) : 30.0;

      const shelter = window.campingSystem ? window.campingSystem.getNearbyShelter(playerPos) : null;
      const campfire = window.campingSystem ? window.campingSystem.getNearbyCampfire(playerPos) : null;

      const context = {
        movementState: (window.GameState && window.GameState.player && window.GameState.player.movementState) || 'IDLE',
        ambientTemperature: ambientTemp,
        weather: weatherType,
        region: region,
        timeOfDay: timeOfDay,
        shelter: shelter,
        isNearCampfire: isNearFire || !!campfire,
        outfitId: window.GameState && window.GameState.player && window.GameState.player.outfitId,
        isPaused: window.pauseMenu && window.pauseMenu.isOpen
      };

      window.survivalProductionSystem.updateSurvival(deltaTime, context);

      // Rested timer update
      if (this.hasRestedBuff) {
        this.restedTimer -= deltaTime;
        if (this.restedTimer <= 0) {
          this.hasRestedBuff = false;
        }
      }
    }

    consumeEnergy(amount) {
      if (window.GameState && window.GameState.player && window.GameState.player.survival) {
        window.GameState.player.survival.energy = Math.max(0, window.GameState.player.survival.energy - amount);
      }
    }

    recoverEnergy(amount) {
      const multiplier = this.hasRestedBuff ? 1.4 : 1.0;
      if (window.GameState && window.GameState.player && window.GameState.player.survival) {
        window.GameState.player.survival.energy = Math.min(
          window.GameState.player.survival.maxEnergy,
          window.GameState.player.survival.energy + (amount * multiplier)
        );
      }
    }

    drinkCanteen() {
      if (this.inventory.canteenWater > 0 && this.thirst < 100) {
        this.inventory.canteenWater--;
        if (window.survivalProductionSystem) {
          window.survivalProductionSystem.consumeItem('canteenWater');
        } else {
          this.thirst = Math.min(100, this.thirst + 35);
        }
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
        if (window.survivalProductionSystem) {
          window.survivalProductionSystem.consumeItem('vadai');
        } else {
          this.hunger = Math.min(100, this.hunger + 40);
          this.energy = Math.min(100, this.energy + 20);
        }
        return true;
      }
      return false;
    }

    placeCampfire(x, y) {
      this.campfires.push({ x, y, duration: 180, isLit: true });
      if (window.campingSystem) {
        window.campingSystem.pitchCamp({ x, y, z: 0 });
      }
      return true;
    }

    pitchTent(x, y) {
      this.tents.push({ x, y, isPitched: true });
      if (window.campingSystem) {
        window.campingSystem.pitchCamp({ x, y, z: 0 });
      }
      return true;
    }

    sleepInTent(lightingEngine, audio) {
      if (lightingEngine) {
        lightingEngine.timeOfDay = 6.5;
      }
      if (window.lightingEngine) {
        window.lightingEngine.timeOfDay = 6.5;
      }
      if (window.restSystem) {
        window.restSystem.performRest('LONG_REST', { safe: true, shelter: true });
        this.hasRestedBuff = true;
        this.restedTimer = 300;
        return true;
      }
      return false;
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
})();
