// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CAMPING SYSTEM
// Manages wilderness camp placement, campfire lifecycle, fuel, and shelter safety
// ============================================================================

(function() {
  'use strict';

  class CampingSystem {
    constructor() {
      this.data = window.CampData || {
        placement: { minDistanceToWater: 5.0, maxTerrainSlope: 22.0, minDistanceBetweenCamps: 25.0, restrictedZones: [] },
        campfire: { maxFuelSeconds: 720, defaultInitialFuel: 240, warmthRadius: 6.5, fuelItems: {} },
        shelters: {},
        restOptions: {}
      };

      this.activeCamps = []; // Array of { id, position, campfire, shelter, isPersistent }
      this.persistentCamps = [];
      this.currentCamp = null;
    }

    /**
     * Validate whether player can pitch a camp at position
     */
    canPitchCamp(pos, options = {}) {
      if (!pos) return { allowed: false, reason: 'Invalid position coordinates.' };

      // 1. Cannot camp during active cinematic, dialogue, or puzzle
      if (window.CinematicSystem && window.CinematicSystem.isPlaying && window.CinematicSystem.isPlaying()) {
        return { allowed: false, reason: 'Cannot camp during a story cinematic.' };
      }
      if (window.DialogueController && window.DialogueController.isActive && window.DialogueController.isActive()) {
        return { allowed: false, reason: 'Cannot camp while conversing with someone.' };
      }
      if (window.puzzleSystem && window.puzzleSystem.activePuzzle) {
        return { allowed: false, reason: 'Cannot camp while actively solving an environmental puzzle.' };
      }

      // 2. Cannot camp while in water / swimming or falling
      if (options.isSwimming || (window.GameState && window.GameState.player && window.GameState.player.movementState === 'SWIM')) {
        return { allowed: false, reason: 'Cannot pitch a camp in deep water.' };
      }

      // 3. Terrain Slope check
      const slope = options.terrainSlope || 0;
      if (slope > this.data.placement.maxTerrainSlope) {
        return { allowed: false, reason: 'Terrain is too steep to set up a safe shelter.' };
      }

      // 4. Restricted Story / Urban Zones check
      const currentRegion = (window.GameState && window.GameState.world && window.GameState.world.currentRegion) || 'george_town';
      if (this.data.placement.restrictedZones.includes(currentRegion)) {
        return { allowed: false, reason: 'Camping is restricted in this municipal / sacred zone.' };
      }

      // 5. Distance to other camps check
      for (const camp of this.activeCamps) {
        const dx = pos.x - camp.position.x;
        const dz = (pos.z || pos.y || 0) - (camp.position.z || camp.position.y || 0);
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < this.data.placement.minDistanceBetweenCamps) {
          return { allowed: false, reason: 'Too close to an existing camp site.' };
        }
      }

      return { allowed: true };
    }

    /**
     * Pitch a new camp at the specified position
     */
    pitchCamp(pos, isPersistent = false) {
      const validation = this.canPitchCamp(pos);
      if (!validation.allowed) {
        return { success: false, reason: validation.reason };
      }

      // Create campfire entity
      const campfire = new window.Campfire({
        position: { x: pos.x, y: pos.y || 0, z: pos.z || 0 },
        isPersistent: isPersistent,
        fuel: this.data.campfire.defaultInitialFuel
      });

      // Create shelter entity (canvas tent)
      const shelter = new window.Shelter({
        type: 'camp_tent',
        name: 'Expedition Tent',
        position: { x: pos.x + 2.0, y: pos.y || 0, z: pos.z + 1.5 },
        radius: 5.0
      });

      const camp = {
        id: `camp_${Date.now()}`,
        position: { ...pos },
        campfire: campfire,
        shelter: shelter,
        isPersistent: isPersistent,
        createdAt: Date.now()
      };

      this.activeCamps.push(camp);
      if (isPersistent) {
        this.persistentCamps.push(camp);
      }
      this.currentCamp = camp;

      if (window.AudioManager && typeof window.AudioManager.playSfx === 'function') {
        window.AudioManager.playSfx('camp_pitch');
      }

      return { success: true, camp: camp };
    }

    update(deltaTime, playerPos) {
      // Update each camp's campfire fuel
      for (let i = this.activeCamps.length - 1; i >= 0; i--) {
        const camp = this.activeCamps[i];
        if (camp.campfire) {
          camp.campfire.update(deltaTime);
        }

        // Cleanup temporary camps if player traveled far (> 250 meters)
        if (!camp.isPersistent && playerPos) {
          const dx = playerPos.x - camp.position.x;
          const dz = (playerPos.z || playerPos.y || 0) - (camp.position.z || camp.position.y || 0);
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 250.0) {
            this.activeCamps.splice(i, 1);
            if (this.currentCamp === camp) this.currentCamp = null;
          }
        }
      }
    }

    getNearbyCampfire(pos, radius = 7.0) {
      if (!pos) return null;
      for (const camp of this.activeCamps) {
        if (camp.campfire && camp.campfire.isBurning && camp.campfire.getDistance(pos) <= radius) {
          return camp.campfire;
        }
      }
      return null;
    }

    getNearbyShelter(pos) {
      if (!pos) return null;
      for (const camp of this.activeCamps) {
        if (camp.shelter && camp.shelter.containsPoint(pos)) {
          return camp.shelter;
        }
      }
      return null;
    }

    /**
     * Add fuel to nearest campfire from player inventory
     */
    addFuelToNearbyCampfire(playerPos) {
      const fire = this.getNearbyCampfire(playerPos, 5.0);
      if (!fire) return { success: false, reason: 'No campfire nearby.' };

      // Consume 1 firewood or wood from authoritative GameState inventory
      if (window.GameState && typeof window.GameState.removeItemFromInventory === 'function') {
        const removed = window.GameState.removeItemFromInventory('wood', 1) || window.GameState.removeItemFromInventory('firewood', 1);
        if (removed) {
          fire.addFuel(180.0);
          return { success: true, newFuel: fire.fuel };
        }
      } else if (window.gameSurvival && window.gameSurvival.inventory) {
        if (window.gameSurvival.inventory.wood >= 1) {
          window.gameSurvival.inventory.wood--;
          fire.addFuel(180.0);
          return { success: true, newFuel: fire.fuel };
        }
      }
      return { success: false, reason: 'You do not have any firewood to feed the fire.' };
    }

    serializePersistentCamps() {
      return this.persistentCamps.map(c => ({
        id: c.id,
        position: { ...c.position },
        campfire: c.campfire.serialize(),
        isPersistent: true
      }));
    }

    loadPersistentCamps(campsData = []) {
      this.persistentCamps = [];
      campsData.forEach(cd => {
        const campfire = Campfire.deserialize(cd.campfire);
        const shelter = new window.Shelter({
          type: 'camp_tent',
          name: 'Expedition Tent',
          position: { x: cd.position.x + 2.0, y: cd.position.y || 0, z: cd.position.z + 1.5 },
          radius: 5.0
        });
        const camp = {
          id: cd.id,
          position: { ...cd.position },
          campfire: campfire,
          shelter: shelter,
          isPersistent: true,
          createdAt: Date.now()
        };
        this.activeCamps.push(camp);
        this.persistentCamps.push(camp);
      });
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampingSystem;
  } else {
    window.CampingSystem = CampingSystem;
  }
})();
