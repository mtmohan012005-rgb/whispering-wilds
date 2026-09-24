// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REST SYSTEM
// Authoritative rest execution, time advancement, world state sync, and recovery
// ============================================================================

(function() {
  'use strict';

  class RestSystem {
    constructor() {
      this.data = window.CampData ? window.CampData.restOptions : {
        SHORT_REST: { durationGameMinutes: 45, energyRestorePct: 35, healthRestorePct: 15 },
        LONG_REST: { durationGameMinutes: 480, targetWakeHour: 6.5, energyRestorePct: 100, healthRestorePct: 40 }
      };

      this.isResting = false;
      this.registeredRestPoints = [];
    }

    registerRestPoint(restPoint) {
      if (restPoint && !this.registeredRestPoints.includes(restPoint)) {
        this.registeredRestPoints.push(restPoint);
      }
    }

    /**
     * Check if player can rest right now
     */
    canRest(context = {}) {
      if (this.isResting) {
        return { allowed: false, reason: 'Already in the middle of a rest.' };
      }

      // Check cinematics
      if (window.CinematicSystem && window.CinematicSystem.isPlaying && window.CinematicSystem.isPlaying()) {
        return { allowed: false, reason: 'Cannot rest during an active cinematic.' };
      }

      // Check dialogue
      if (window.DialogueController && window.DialogueController.isActive && window.DialogueController.isActive()) {
        return { allowed: false, reason: 'Cannot rest while conversing.' };
      }

      // Check active puzzle
      if (window.puzzleSystem && window.puzzleSystem.activePuzzle) {
        return { allowed: false, reason: 'Cannot rest while solving an environmental puzzle.' };
      }

      // Check swimming or falling
      if (context.isSwimming || (window.GameState && window.GameState.player && window.GameState.player.movementState === 'SWIM')) {
        return { allowed: false, reason: 'Cannot rest while in water.' };
      }
      if (context.isFalling || (window.GameState && window.GameState.player && window.GameState.player.movementState === 'FALL')) {
        return { allowed: false, reason: 'Cannot rest while airborne.' };
      }

      // Must be near a campfire, inside a shelter, or at a registered rest point
      const isSheltered = !!(context.shelter || context.isIndoor || context.sheltered);
      const isNearCampfire = !!(context.isNearCampfire || context.warm);
      const isAtRestPoint = !!(context.restPoint || context.isSafePoint);
      const isSafe = !!context.safe;

      if (!isSheltered && !isNearCampfire && !isAtRestPoint && !isSafe) {
        return { allowed: false, reason: 'Rest requires a safe shelter, a lit campfire, or a resting bench.' };
      }

      return { allowed: true, sheltered: isSheltered, warm: isNearCampfire, safe: true };
    }

    /**
     * Perform Rest
     * @param {string} restType 'SHORT' | 'LONG' | 'SHORT_REST' | 'LONG_REST'
     * @param {Object} context
     */
    performRest(restType = 'SHORT_REST', context = { safe: true }) {
      const check = this.canRest(context);
      if (!check.allowed) {
        return { success: false, reason: check.reason };
      }

      let key = restType;
      if (key === 'SHORT') key = 'SHORT_REST';
      if (key === 'LONG') key = 'LONG_REST';

      const restProfile = this.data[key] || this.data.SHORT_REST;
      const survival = window.GameState && window.GameState.player && window.GameState.player.survival;

      this.isResting = true;

      // 1. Advance World Time authoritatively
      const durationHours = restProfile.durationGameMinutes / 60.0;
      let newTime = ((window.GameState.world.time || 9.0) + durationHours);

      // If Long Rest with target sunrise hour (06:30)
      if ((key === 'LONG_REST' || restType === 'LONG_REST' || restType === 'LONG') && restProfile.targetWakeHour !== undefined) {
        let currentHour = window.GameState.world.time % 24;
        let diff = (restProfile.targetWakeHour - currentHour + 24) % 24;
        if (diff < 3.0) diff += 24; // Ensure at least a realistic sleep span
        newTime = window.GameState.world.time + diff;
      }

      window.GameState.world.time = Math.round((newTime % 24) * 100) / 100;

      // 2. Authoritatively Update Survival Vitals
      if (survival) {
        const energyGain = (restProfile.energyRestorePct / 100) * survival.maxEnergy;
        const healthGain = (restProfile.healthRestorePct / 100) * survival.maxHealth;

        survival.energy = Math.min(survival.maxEnergy, survival.energy + energyGain);
        survival.health = Math.min(survival.maxHealth, survival.health + healthGain);

        // Warmth recovers in shelter/fire
        survival.warmth = Math.min(survival.maxWarmth, Math.max(survival.warmth, 80));
        survival.wetness = Math.max(0, survival.wetness - 80); // Dries off completely

        // Modest hunger and hydration consumption during sleep
        if (restProfile.hungerCostPct) {
          survival.hunger = Math.max(15, survival.hunger - (restProfile.hungerCostPct / 100) * survival.maxHunger);
        }
        if (restProfile.hydrationCostPct) {
          survival.hydration = Math.max(15, survival.hydration - (restProfile.hydrationCostPct / 100) * survival.maxHydration);
        }

        // Apply RESTED status
        if (restProfile.grantsRestedBuff) {
          if (!survival.statusEffects.includes('RESTED')) {
            survival.statusEffects.push('RESTED');
          }
        }

        survival.isExhausted = false;
        survival.isCold = false;
      }

      // 3. Notify World Subsystems via existing authoritative hooks
      this._updateWorldSubsystems(window.GameState.world.time);

      // 4. Play audio cue
      if (window.AudioManager && typeof window.AudioManager.playDiscoveryJingle === 'function') {
        window.AudioManager.playDiscoveryJingle();
      }

      this.isResting = false;

      return {
        success: true,
        restType: restType,
        newTime: window.GameState.world.time,
        vitals: survival ? { ...survival } : null
      };
    }

    executeRest(restType = 'SHORT_REST', context = { safe: true }) {
      return this.performRest(restType, context);
    }

    _updateWorldSubsystems(newTime) {
      // 1. Lighting engine
      if (window.lightingEngine) {
        window.lightingEngine.timeOfDay = newTime % 24;
      }
      if (window.threeWorld && window.threeWorld.lightingSystem) {
        window.threeWorld.lightingSystem.setTimeOfDay ? window.threeWorld.lightingSystem.setTimeOfDay(newTime % 24) : null;
      }

      // 2. Living World schedules (NPCs & Wildlife)
      if (window.livingWorldSystem && typeof window.livingWorldSystem.update === 'function') {
        window.livingWorldSystem.update(0.1);
      }

      // 3. Dynamic World Events
      if (window.worldEventSystem && typeof window.worldEventSystem.update === 'function') {
        window.worldEventSystem.update(0.1);
      }

      // 4. Ambient World Audio
      if (window.ambientAudio && typeof window.ambientAudio.updateTime === 'function') {
        window.ambientAudio.updateTime(newTime % 24);
      }

      // 5. Emit GameState time change event
      if (window.GameState && typeof window.GameState.emit === 'function') {
        window.GameState.emit('worldTimeAdvanced', { time: newTime });
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RestSystem;
  } else {
    window.RestSystem = RestSystem;
  }
})();
