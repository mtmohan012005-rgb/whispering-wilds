/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Dynamic Festival Lifecycle System (FestivalSystem)
 * Manages celebration calendars, phase progression (Preparation -> Active -> Cleanup),
 * dynamic decoration spawning, warm lighting shifts, and festive audio ambiances.
 */

class FestivalSystem {
  /**
   * @param {THREE.Scene} scene - Three.js Scene
   * @param {WorldCollision} collision - World Collision instance
   */
  constructor(scene = null, collision = null) {
    this.scene = scene;
    this.collision = collision;

    this.festivals = new Map(); // id -> config
    this.activeFestival = null;
    this.currentPhaseKey = 'INACTIVE'; // 'PREPARATION' | 'ACTIVE' | 'CLEANUP' | 'INACTIVE'
    this.activeDecorations = [];

    // Load definitions
    if (typeof window.FESTIVAL_DEFINITIONS !== 'undefined') {
      for (const f of window.FESTIVAL_DEFINITIONS) {
        this.festivals.set(f.id, f);
      }
    }
  }

  startFestival(festivalId, initialPhase = 'ACTIVE') {
    const f = this.festivals.get(festivalId);
    if (!f) {
      console.warn(`[FestivalSystem] Festival "${festivalId}" not found.`);
      return false;
    }

    this.activeFestival = f;
    this.setPhase(initialPhase);

    // Notify UI
    if (window.festivalUI && typeof window.festivalUI.showFestivalBanner === 'function') {
      window.festivalUI.showFestivalBanner(f, this.currentPhaseKey);
    }

    return true;
  }

  setPhase(phaseKey) {
    if (!this.activeFestival) return;
    const phaseConfig = this.activeFestival.phases[phaseKey];
    if (!phaseConfig && phaseKey !== 'INACTIVE') return;

    this.currentPhaseKey = phaseKey;

    if (phaseKey === 'INACTIVE') {
      this.clearDecorations();
      this.activeFestival = null;
      return;
    }

    // 1. Clear old decorations and spawn phase decorations
    this.clearDecorations();
    if (Array.isArray(phaseConfig.decorations) && this.scene) {
      for (const decType of phaseConfig.decorations) {
        this.spawnDecoration(decType);
      }
    }

    // 2. Adjust lighting
    if (phaseConfig.lightingModifier && window.threeWorld && window.threeWorld.lighting) {
      // Warm golden festival ambient tint
      if (phaseConfig.lightingModifier.warmSunGlow && window.threeWorld.lighting.hemiLight) {
        window.threeWorld.lighting.hemiLight.color.setHex(0xfff2df);
      }
    }

    // 3. Update NPC festive clothing
    if (window.livingWorld && window.livingWorld.npcs) {
      for (const npc of window.livingWorld.npcs.values()) {
        if (this.activeFestival.regions.includes(npc.region)) {
          if (phaseKey === 'ACTIVE') {
            npc.currentAttire = phaseConfig.npcAttireKey || 'festival_veshti';
          } else {
            npc.currentAttire = 'everyday_veshti';
          }
        }
      }
    }

    // 4. Update Markets to Busy
    if (phaseConfig.marketState && window.marketLifeSystem) {
      for (const r of this.activeFestival.regions) {
        window.marketLifeSystem.setRegionMarketState(r, phaseConfig.marketState);
      }
    }

    // 5. Update Kolam state if specified
    if (phaseConfig.kolamState && window.kolamSystem) {
      window.kolamSystem.setGlobalKolamState(phaseConfig.kolamState);
    }
  }

  spawnDecoration(type) {
    if (!this.scene) return;
    // Example anchor points in Cauvery Delta & Thanjavur
    const spawnPoints = [
      { x: -160, y: 4.8, z: -10 },
      { x: -155, y: 4.9, z: 12 },
      { x: 80, y: 8.5, z: -20 },
      { x: 10, y: 6.5, z: 15 }
    ];

    for (let i = 0; i < spawnPoints.length; i++) {
      const pt = spawnPoints[i];
      const dec = new window.FestivalDecoration({
        id: `fest_dec_${type}_${i}`,
        decorationType: type,
        festivalId: this.activeFestival ? this.activeFestival.id : 'fest',
        x: pt.x + (i * 1.5),
        y: pt.y,
        z: pt.z + (i * 0.8)
      }, this.scene, this.collision);

      this.activeDecorations.push(dec);
    }
  }

  clearDecorations() {
    for (const dec of this.activeDecorations) {
      dec.dispose();
    }
    this.activeDecorations = [];
  }

  endFestival() {
    this.setPhase('CLEANUP');
    // After cleanup interval, transition to INACTIVE
    setTimeout(() => {
      this.setPhase('INACTIVE');
    }, 4000);
  }

  getState() {
    return {
      activeFestivalId: this.activeFestival ? this.activeFestival.id : null,
      currentPhaseKey: this.currentPhaseKey
    };
  }

  applyState(saved) {
    if (!saved) return;
    if (saved.activeFestivalId) {
      this.startFestival(saved.activeFestivalId, saved.currentPhaseKey || 'ACTIVE');
    } else {
      this.setPhase('INACTIVE');
    }
  }
}

window.FestivalSystem = FestivalSystem;
