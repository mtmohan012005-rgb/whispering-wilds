/**
 * The Whispering Wilds (Kaattu Vazhi) - World Unlock System
 * Manages narrative region unlocking, prerequisite verification, transit gating,
 * and state persistence across all 8 Tamil Nadu regions.
 */

class WorldUnlockSystem {
  constructor() {
    this.regions = {
      george_town: {
        id: "george_town",
        name: "George Town (Madras)",
        tamilName: "ஜார்ஜ் டவுன் (மதராஸ்)",
        unlocked: true,
        bounds: { minX: -300, maxX: -100 },
        prerequisites: []
      },
      cauvery_delta: {
        id: "cauvery_delta",
        name: "Villupuram & Cauvery Farmlands",
        tamilName: "விழுப்புரம் மற்றும் காவிரி சமவெளி",
        unlocked: true, // Connected starting farmland area
        bounds: { minX: -100, maxX: 100 },
        prerequisites: ["main_missing_trail:investigate_location"]
      },
      pichavaram: {
        id: "pichavaram",
        name: "Pichavaram Mangrove Wetlands",
        tamilName: "பிச்சாவரம் சதுப்புநிலக் காடுகள்",
        unlocked: false,
        bounds: { minX: 100, maxX: 200 },
        prerequisites: ["side_selvam_bull:completed"]
      },
      chettinad: {
        id: "chettinad",
        name: "Chettinad Heritage Belt",
        tamilName: "செட்டிநாடு பாரம்பரிய பிரதேசம்",
        unlocked: false,
        bounds: { minX: 120, maxX: 220 },
        prerequisites: ["main_pichavaram_water:completed"]
      },
      thanjavur: {
        id: "thanjavur",
        name: "Thanjavur Delta & Great Temple",
        tamilName: "தஞ்சாவூர் காவிரி சமவெளி",
        unlocked: false,
        bounds: { minX: 130, maxX: 230 },
        prerequisites: ["main_pichavaram_water:completed"]
      },
      mamallapuram: {
        id: "mamallapuram",
        name: "Mamallapuram Coastal Monoliths",
        tamilName: "மாமல்லபுரம் கடற்கரைச் சிற்பங்கள்",
        unlocked: false,
        bounds: { minX: 150, maxX: 240 },
        prerequisites: ["main_chettinad_mansion:completed"]
      },
      nilgiris: {
        id: "nilgiris",
        name: "Nilgiri Mountain Cloud Forest",
        tamilName: "நீலகிரி மலை முகடுகள்",
        unlocked: false,
        bounds: { minX: 200, maxX: 269 },
        prerequisites: ["main_thanjavur_artisan:completed", "main_mamallapuram_stone:completed"]
      },
      final_sanctuary: {
        id: "final_sanctuary",
        name: "Pasumai Thadam Subterranean Sanctuary",
        tamilName: "பசுமைத் தடம் நிலத்தடி உயிர்க்கோளம்",
        unlocked: false,
        bounds: { minX: 270, maxX: 300 },
        prerequisites: ["main_nilgiris_mist:completed"]
      }
    };
  }

  isUnlocked(regionId) {
    if (!this.regions[regionId]) return false;
    return !!this.regions[regionId].unlocked;
  }

  getUnlockRequirements(regionId) {
    const reg = this.regions[regionId];
    if (!reg) return [];
    return reg.prerequisites;
  }

  canUnlock(regionId, questSystem) {
    const reg = this.regions[regionId];
    if (!reg) return false;
    if (reg.unlocked) return true;

    const qs = questSystem || window.questProgression || window.gameQuests;
    if (!qs) return false;

    // Verify all prerequisites
    for (const prereq of reg.prerequisites) {
      const [questId, reqState] = prereq.split(':');
      if (reqState === 'completed') {
        if (!qs.isQuestCompleted || !qs.isQuestCompleted(questId)) {
          return false;
        }
      } else {
        // Objective specific check
        if (!qs.isObjectiveDone || !qs.isObjectiveDone(questId, reqState)) {
          return false;
        }
      }
    }

    return true;
  }

  unlock(regionId, audio) {
    const reg = this.regions[regionId];
    if (!reg) return false;
    if (reg.unlocked) return true;

    reg.unlocked = true;

    // Sync with global WORLD_DATA if applicable
    if (window.WORLD_DATA && window.WORLD_DATA.biomes) {
      if (regionId === 'pichavaram' && window.WORLD_DATA.biomes.pichavaram_delta) {
        window.WORLD_DATA.biomes.pichavaram_delta.unlocked = true;
      } else if (regionId === 'nilgiris' && window.WORLD_DATA.biomes.western_ghats) {
        window.WORLD_DATA.biomes.western_ghats.unlocked = true;
      }
    }

    if (audio) {
      audio.playDiscoveryJingle();
    }

    if (window.gameQuests && typeof window.gameQuests.showQuestNotification === 'function') {
      window.gameQuests.showQuestNotification(`🌟 REGION UNLOCKED: ${reg.name} (${reg.tamilName})!`);
    }

    console.log(`[WorldUnlockSystem] Region unlocked: ${reg.name}`);
    return true;
  }

  lock(regionId) {
    const reg = this.regions[regionId];
    if (reg) {
      reg.unlocked = false;
      console.log(`[WorldUnlockSystem] Region locked: ${reg.name}`);
    }
  }

  /**
   * Evaluates if a 3D coordinate traverses into a locked region
   * @param {number} x - 3D X coordinate
   * @param {number} [z] - 3D Z coordinate
   * @returns {{ allowed: boolean, regionId: string|null, reason: string|null }}
   */
  checkCoordinateTraversal(x, z = 0) {
    for (const [id, reg] of Object.entries(this.regions)) {
      if (reg.bounds && x >= reg.bounds.minX && x <= reg.bounds.maxX) {
        if (!reg.unlocked) {
          return {
            allowed: false,
            regionId: id,
            reason: `Access to ${reg.name} is sealed. Complete story requirements to unlock passage.`
          };
        }
      }
    }
    return { allowed: true, regionId: null, reason: null };
  }

  /**
   * Evaluates if player's coordinates enter a locked region
   * @param {number} worldX - 3D or 2D X coordinate
   * @param {boolean} is3D
   * @returns {{ allowed: boolean, regionId: string|null, reason: string|null }}
   */
  canPlayerTraverse(worldX, is3D = false) {
    // Convert 2D coord to 3D equivalent if needed
    const x3D = is3D ? worldX : ((worldX / 10.0) - 300.0);
    return this.checkCoordinateTraversal(x3D, 0);
  }

  getState() {
    const state = {};
    for (const [id, reg] of Object.entries(this.regions)) {
      state[id] = reg.unlocked;
    }
    return state;
  }

  restoreState(state) {
    if (!state) return;
    for (const [id, isUnlocked] of Object.entries(state)) {
      if (this.regions[id]) {
        this.regions[id].unlocked = !!isUnlocked;
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.WorldUnlockSystem = WorldUnlockSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorldUnlockSystem };
}
