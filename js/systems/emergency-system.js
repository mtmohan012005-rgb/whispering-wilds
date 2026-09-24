// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EMERGENCY & HAZARD SYSTEM
// Non-combat safety, downed state, fall damage protection, and safe respawns
// ============================================================================

(function() {
  'use strict';

  class EmergencySystem {
    constructor() {
      this.data = window.EmergencyData || {
        states: { NORMAL: 'NORMAL', WARNING: 'WARNING', CRITICAL: 'CRITICAL', DOWNED: 'DOWNED', RECOVERING: 'RECOVERING' },
        downed: { recoveryRestore: { health: 35, energy: 50, hydration: 60, hunger: 50, warmth: 75, wetness: 0 } },
        fallDamage: { minDamageVelocity: 8.5, baseDamageRate: 4.5, maxPossibleDamage: 65.0 },
        safeRespawns: {}
      };

      this.currentState = this.data.states.NORMAL;
      this.lastSafePosition = { x: 220, y: 0, z: 630 };
      this.lastSafeRegion = 'george_town';
      this.isDowned = false;
      this.downedTransitionTimer = 0;
      this.lastFallLandingTime = 0;
    }

    setSafeCheckpoint(pos, region) {
      if (pos) {
        this.lastSafePosition = {
          x: pos.x !== undefined ? pos.x : 0,
          y: pos.y !== undefined ? pos.y : 0,
          z: pos.z !== undefined ? pos.z : (pos.y || 0)
        };
      }
      if (region) {
        this.lastSafeRegion = region;
      }
    }

    /**
     * Compute and apply single-impact fall damage
     * @param {number} verticalVelocity - Downward velocity in m/s (positive)
     * @param {boolean} force - Bypass debounce for unit tests
     */
    applyFallDamage(verticalVelocity, force = false) {
      const now = Date.now();
      // Guard against double damage on same landing contact
      if (!force && (now - this.lastFallLandingTime < 800)) {
        return 0;
      }
      this.lastFallLandingTime = now;

      const fd = this.data.fallDamage;
      if (verticalVelocity <= fd.minDamageVelocity) {
        return 0; // Small fall: no damage
      }

      const excessVel = verticalVelocity - fd.minDamageVelocity;
      let damage = excessVel * fd.baseDamageRate;
      damage = Math.min(fd.maxPossibleDamage, damage);

      // Assist mode reduction
      if (window.GameState && window.GameState.settings && window.GameState.settings.accessibility && window.GameState.settings.accessibility.survivalAssist === 'ASSISTED') {
        damage *= 0.4;
      }

      damage = Math.round(damage * 10) / 10;

      // Apply damage directly to authoritative survival state
      if (window.GameState && window.GameState.player && window.GameState.player.survival) {
        window.GameState.player.survival.health = Math.max(0, window.GameState.player.survival.health - damage);
        if (window.GameState.player.survival.health <= 0) {
          this.triggerDownedState('Severe fall impact');
        }
      }

      if (damage > 0 && window.AudioManager && typeof window.AudioManager.playSfx === 'function') {
        window.AudioManager.playSfx('fall_impact');
      }

      return damage;
    }

    handleFallDamage(verticalVelocity, force = false) {
      return this.applyFallDamage(verticalVelocity, force);
    }

    /**
     * Trigger Downed State when health reaches 0
     */
    triggerDownedState(source = 'Exhaustion') {
      if (this.isDowned) return;

      this.isDowned = true;
      this.currentState = this.data.states.DOWNED;

      console.log(`[EmergencySystem] Player DOWNED from: ${source}`);

      // Lock player locomotion controls
      if (window.gamePlayer) {
        window.gamePlayer.isLocked = true;
      }

      // Play subtle heartbeat audio
      if (window.AudioManager && typeof window.AudioManager.playSfx === 'function') {
        window.AudioManager.playSfx('heartbeat_low');
      }

      // Show UI overlay & trigger safe recovery
      if (window.EmergencyUI && typeof window.EmergencyUI.showDownedScreen === 'function') {
        window.EmergencyUI.showDownedScreen(() => {
          this.recoverPlayer();
        });
      } else {
        // Fallback automatic recovery after 2 seconds
        setTimeout(() => {
          this.recoverPlayer();
        }, 2000);
      }
    }

    /**
     * Safe Recovery at nearest checkpoint or shelter
     * PRESERVES: Inventory, Currency, Quests, Story Progression, and Customization Count (<= 5)
     */
    recoverPlayer() {
      const survival = window.GameState && window.GameState.player && window.GameState.player.survival;
      const restore = this.data.downed.recoveryRestore;

      if (survival) {
        survival.health = restore.health || 35;
        survival.energy = restore.energy || 50;
        survival.hydration = restore.hydration || 60;
        survival.hunger = restore.hunger || 50;
        survival.warmth = restore.warmth || 75;
        survival.wetness = restore.wetness || 0;
        survival.statusEffects = [];
        survival.isExhausted = false;
        survival.isCold = false;
        survival.isDehydrated = false;
      }

      // Determine safe respawn position
      let respawnPos = this.lastSafePosition;
      const currentRegion = (window.GameState && window.GameState.world && window.GameState.world.currentRegion) || this.lastSafeRegion || 'george_town';
      if (this.data.safeRespawns && this.data.safeRespawns[currentRegion]) {
        respawnPos = this.data.safeRespawns[currentRegion].position;
      } else if (this.data.safeRespawns && this.data.safeRespawns.george_town) {
        respawnPos = this.data.safeRespawns.george_town.position;
      }

      // Reposition player
      if (window.GameState && window.GameState.player) {
        window.GameState.player.position.x = respawnPos.x;
        window.GameState.player.position.y = respawnPos.y || 0;
        window.GameState.player.position.z = respawnPos.z !== undefined ? respawnPos.z : (respawnPos.y || 0);
      }
      if (window.threeWorld && window.threeWorld.player) {
        if (window.threeWorld.player.group && window.threeWorld.player.group.position) {
          window.threeWorld.player.group.position.set(respawnPos.x, respawnPos.y || 0, respawnPos.z || 0);
        } else if (window.threeWorld.player.mesh && window.threeWorld.player.mesh.position) {
          window.threeWorld.player.mesh.position.set(respawnPos.x, respawnPos.y || 0, respawnPos.z || 0);
        }
      }
      if (window.gamePlayer) {
        window.gamePlayer.x = respawnPos.x;
        window.gamePlayer.y = respawnPos.z || respawnPos.y || 0;
        window.gamePlayer.isLocked = false;
      }

      this.isDowned = false;
      this.currentState = this.data.states.NORMAL;

      console.log(`[EmergencySystem] Player safely recovered at ${currentRegion} (${respawnPos.x}, ${respawnPos.z || respawnPos.y}). Inventory and story intact.`);
      return { success: true, respawnPos };
    }

    recoverFromDowned() {
      return this.recoverPlayer();
    }

    getSafeRespawnPoint() {
      const currentRegion = (window.GameState && window.GameState.world && window.GameState.world.currentRegion) || this.lastSafeRegion || 'george_town';
      if (this.data.safeRespawns && this.data.safeRespawns[currentRegion]) {
        return { ...this.data.safeRespawns[currentRegion].position, name: this.data.safeRespawns[currentRegion].name };
      }
      return { ...this.lastSafePosition, name: 'Safe Zone' };
    }

    evaluateVitals(survival) {
      return this.update(0.1, survival);
    }

    /**
     * Evaluates emergency state from authoritative survival vitals
     */
    update(deltaTime, survival) {
      if (this.isDowned) return;
      if (!survival) return;

      if (survival.health <= 0) {
        this.triggerDownedState('Depleted vitals');
        return;
      }

      if (survival.health <= 25 || survival.energy <= 10 || survival.hydration <= 15 || survival.warmth <= 20) {
        this.currentState = this.data.states.CRITICAL;
      } else if (survival.health <= 50 || survival.energy <= 25 || survival.hydration <= 30 || survival.warmth <= 35) {
        this.currentState = this.data.states.WARNING;
      } else {
        this.currentState = this.data.states.NORMAL;
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencySystem;
  } else {
    window.EmergencySystem = EmergencySystem;
  }
})();
