/**
 * The Whispering Wilds - Diegetic Expedition Save System
 * Manages 3 Manual Expedition Slots + 1 Dynamic Autosave Slot in localStorage.
 * Manual saving is strictly diegetic (Journal Daybook, Campfire Rest, Tea Kadai Bench),
 * locked out during active hazard states (extreme hypothermia, sprinting, flash floods).
 */

class SaveSystem {
  constructor(game) {
    this.game = game;
    this.storageKeyPrefix = "whispering_wilds_save_";
    this.slots = ["autosave", "slot_1", "slot_2", "slot_3"];
  }

  /**
   * Evaluates whether the player is in a safe condition to write in their journal or rest.
   * Disables manual saving during active hazards.
   */
  canSaveManual() {
    if (!this.game) return { allowed: true };

    const survival = this.game.survival;
    if (survival) {
      // 1. Extreme hypothermia / hyperthermia hazard
      if (survival.coreTemp < 34.5) {
        return {
          allowed: false,
          reason: "🥶 Extreme Hypothermia! Your hands are shaking too violently to write in the journal. Seek a campfire or hot tea first!"
        };
      }
      if (survival.coreTemp > 39.5) {
        return {
          allowed: false,
          reason: "🔥 Heatstroke Warning! Dizzy spells prevent you from focusing on your expedition notes."
        };
      }

      // 2. Sprinting or exhausted panic state
      if (this.game.player && this.game.player.isSprinting && survival.energy < 20) {
        return {
          allowed: false,
          reason: "🏃 Out of breath! Catch your breath before writing in your daybook."
        };
      }
    }

    // 3. Flood hazard during violent coastal monsoon
    if (this.game.climateEngine && this.game.climateEngine.currentPhase === "MONSOON_THUNDERSTORM" && this.game.climateEngine.groundWetness > 0.85) {
      // Check if near shelter
      if (!this.isNearSafeZone()) {
        return {
          allowed: false,
          reason: "🌊 Rising Flash Flood Waters! Take shelter inside a Tea Kadai or pitch a tent before resting."
        };
      }
    }

    return { allowed: true };
  }

  isNearSafeZone() {
    if (!this.game || !this.game.player) return true;
    const px = this.game.player.x || 0;
    const py = this.game.player.y || 0;

    // Tea Kadai coordinates (~450, 420) or pitch tent active
    if (this.game.player.activeTent) return true;
    const distToTea = Math.hypot(px - 450, py - 420);
    return distToTea < 160;
  }

  /**
   * Captures full game state into a serialized JSON object
   */
  createSavePayload(checkpointLabel = "Manual Expedition Note") {
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const payload = {
      version: "2.5.0",
      timestamp: timestamp,
      realTimeMs: Date.now(),
      label: checkpointLabel,
      player: {
        x: this.game.player ? this.game.player.x : 200,
        y: this.game.player ? this.game.player.y : 300,
        z: this.game.player ? (this.game.player.z || 0) : 0,
        rupees: this.game.player ? (this.game.player.rupees || 75) : 75,
        regionIndex: this.game.player ? (this.game.player.currentRegionIndex || 0) : 0,
        regionName: this.game.currentRegion ? this.game.currentRegion.name : "George Town & Madras High Court",
        gps: (this.game.player && this.game.player.gpsCoords) ? this.game.player.gpsCoords : {
          lat: 13.0827 - ((this.game.player ? this.game.player.x : 0) / 6000) * 1.67,
          lng: 80.2707 - ((this.game.player ? this.game.player.x : 0) / 6000) * 3.57
        }
      },
      survival: {
        hunger: this.game.survival ? this.game.survival.hunger : 85,
        thirst: this.game.survival ? this.game.survival.thirst : 90,
        energy: this.game.survival ? this.game.survival.energy : 100,
        coreTemp: this.game.survival ? this.game.survival.coreTemp : 36.8
      },
      wardrobeAndTrade: {
        equipped: this.game.tradeSystem ? this.game.tradeSystem.playerState.equipped : "cloth_casual",
        inventory: this.game.tradeSystem ? this.game.tradeSystem.playerState.inventory : ["cloth_casual"],
        materials: this.game.tradeSystem ? this.game.tradeSystem.playerState.materials : { teaLeaves: 4, shells: 6, wildHerbs: 2 },
        wallet: this.game.tradeSystem ? this.game.tradeSystem.playerState.wallet : 350,
        discountApplied: this.game.tradeSystem ? this.game.tradeSystem.playerState.discountApplied : false
      },
      quests: this.game.quests ? {
        active: this.game.quests.activeQuests || [],
        completed: this.game.quests.completedQuests || []
      } : {},
      journal: this.game.journal ? {
        photos: this.game.journal.photos || [],
        clues: this.game.journal.discoveredClues || []
      } : {},
      climate: this.game.climateEngine ? {
        hour: this.game.climateEngine.currentTimeInHours,
        phase: this.game.climateEngine.currentPhase,
        groundWetness: this.game.climateEngine.groundWetness
      } : {}
    };

    return payload;
  }

  /**
   * Save game into specified slot
   */
  saveToSlot(slotId, label = "Expedition Journal Entry") {
    if (!this.slots.includes(slotId)) {
      console.error(`Invalid save slot: ${slotId}`);
      return false;
    }

    // If manual save, enforce survival immersion rules
    if (slotId !== "autosave") {
      const check = this.canSaveManual();
      if (!check.allowed) {
        if (this.game && this.game.showToast) {
          this.game.showToast(check.reason, 5000);
        } else {
          alert(check.reason);
        }
        return false;
      }
    }

    const payload = this.createSavePayload(label);
    try {
      localStorage.setItem(this.storageKeyPrefix + slotId, JSON.stringify(payload));
      if (this.game && this.game.showToast) {
        const slotName = slotId === 'autosave' ? '⚡ Checkpoint Autosave' : `📔 Saved to ${slotId.toUpperCase()}`;
        this.game.showToast(`${slotName} (${payload.player.regionName})`, 3500);
      }
      return true;
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
      return false;
    }
  }

  /**
   * Checkpoint autosave called silently during key game milestones
   */
  triggerAutosave(milestoneReason = "Checkpoint") {
    return this.saveToSlot("autosave", `Autosave: ${milestoneReason}`);
  }

  /**
   * Load game state from slot
   */
  loadFromSlot(slotId) {
    const raw = localStorage.getItem(this.storageKeyPrefix + slotId);
    if (!raw) {
      console.warn(`No save data found in ${slotId}`);
      return false;
    }

    try {
      const data = JSON.parse(raw);
      this.applySavePayload(data);
      if (this.game && this.game.showToast) {
        this.game.showToast(`📖 Loaded Expedition Record from ${slotId.toUpperCase()}`, 3500);
      }
      return true;
    } catch (e) {
      console.error("Failed to parse save payload:", e);
      return false;
    }
  }

  /**
   * Restores game world state from deserialized payload
   */
  applySavePayload(data) {
    if (!data) return;

    // 1. Restore Player State
    if (data.player && this.game.player) {
      this.game.player.x = data.player.x;
      this.game.player.y = data.player.y;
      if (data.player.z !== undefined && this.game.player.z !== undefined) {
        this.game.player.z = data.player.z;
      }
      this.game.player.rupees = data.player.rupees;
      if (data.player.gps) {
        this.game.player.gpsCoords = data.player.gps;
      }
    }

    // 2. Restore Survival Vitals
    if (data.survival && this.game.survival) {
      this.game.survival.hunger = data.survival.hunger;
      this.game.survival.thirst = data.survival.thirst;
      this.game.survival.energy = data.survival.energy;
      this.game.survival.coreTemp = data.survival.coreTemp;
      this.game.survival.updateHUD();
    }

    // 3. Restore Wardrobe & Barter Inventory
    if (data.wardrobeAndTrade && this.game.tradeSystem) {
      const ts = this.game.tradeSystem;
      ts.playerState.equipped = data.wardrobeAndTrade.equipped;
      ts.playerState.inventory = data.wardrobeAndTrade.inventory || ["cloth_casual"];
      ts.playerState.materials = data.wardrobeAndTrade.materials || { teaLeaves: 4, shells: 6, wildHerbs: 2 };
      ts.playerState.wallet = data.wardrobeAndTrade.wallet || 350;
      ts.playerState.discountApplied = !!data.wardrobeAndTrade.discountApplied;
      ts.equipOutfit(ts.playerState.equipped);
      ts.updateHUD();
    }

    // 4. Restore Climate Time
    if (data.climate && this.game.climateEngine) {
      this.game.climateEngine.currentTimeInHours = data.climate.hour || 6.0;
      this.game.climateEngine.groundWetness = data.climate.groundWetness || 0.1;
      this.game.climateEngine.tick(0.01);
    }

    // 5. Restore 3D World position if active
    if (this.game.threeWorld && this.game.threeWorld.player && data.player) {
      this.game.threeWorld.player.setPosition(data.player.x, data.player.z || 0, data.player.y);
    }
  }

  /**
   * Retrieves summary of all 4 slots for UI display
   */
  getSlotSummaries() {
    return this.slots.map(slotId => {
      const raw = localStorage.getItem(this.storageKeyPrefix + slotId);
      if (!raw) {
        return {
          slotId: slotId,
          isEmpty: true,
          label: slotId === 'autosave' ? '⚡ Dynamic Autosave (Empty)' : `Slot ${slotId.replace('slot_', '')} (Empty)`
        };
      }

      try {
        const parsed = JSON.parse(raw);
        return {
          slotId: slotId,
          isEmpty: false,
          label: parsed.label || slotId,
          timestamp: parsed.timestamp,
          regionName: parsed.player ? parsed.player.regionName : "Tamil Nadu",
          rupees: parsed.player ? parsed.player.rupees : 0,
          equipped: parsed.wardrobeAndTrade ? parsed.wardrobeAndTrade.equipped : "Casual",
          coreTemp: parsed.survival ? parsed.survival.coreTemp.toFixed(1) + "°C" : "36.8°C"
        };
      } catch (e) {
        return { slotId: slotId, isEmpty: true, error: true };
      }
    });
  }

  deleteSlot(slotId) {
    localStorage.removeItem(this.storageKeyPrefix + slotId);
  }
}

// Expose globally
window.SaveSystem = SaveSystem;
