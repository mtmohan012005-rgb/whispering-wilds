/**
 * The Whispering Wilds (Kaattu Vazhi) - Core Authoritative Game Runtime
 * Master coordinator connecting Input, Game Runtime, Authoritative State, Systems, and Presentation.
 * Provides transactional state actions, centralized interaction detection,
 * error boundaries, autosaving checkpoints, and strict validation.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const runtime = factory();
    root.GameRuntime = runtime;
    if (typeof window !== 'undefined') {
      window.GameRuntime = runtime;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class GameRuntimeEngine {
    constructor() {
      this.isInitialized = false;
      this.currentInteractionTarget = null;
      this.activeTransaction = null;
      this._subsystemErrors = new Map();
      this._autosaveDebounceTimer = null;
    }

    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      // Connect EventBus listeners
      if (typeof window !== 'undefined' && window.EventBus) {
        window.EventBus.on('GAME_PAUSED', () => this.onPause());
        window.EventBus.on('GAME_RESUMED', () => this.onResume());
      }

      // Initialize frame scheduler pipeline steps
      this._bindPipelineSteps();

      console.log('[GameRuntime] 🌟 Authoritative Core Runtime initialized.');
    }

    _bindPipelineSteps() {
      const scheduler = typeof window !== 'undefined' ? window.FrameScheduler : null;
      if (!scheduler) return;

      // Step 1: Input
      scheduler.registerStep('INPUT', (dt) => {
        if (window.CoreInputManager) window.CoreInputManager.update(dt);
      });

      // Step 2: Game Clock
      scheduler.registerStep('GAME_CLOCK', (dt) => {
        if (window.GameClock) window.GameClock.update(dt);
      });

      // Step 3: Player Movement (Authoritative)
      scheduler.registerStep('PLAYER_MOVEMENT', (dt) => {
        this._updatePlayerMovement(dt);
      });

      // Step 4: Collision
      scheduler.registerStep('COLLISION', (dt) => {
        this._updateCollision(dt);
      });

      // Step 5: Interaction Target Calculation
      scheduler.registerStep('INTERACTION', (dt) => {
        this._updateInteractionTarget(dt);
      });

      // Step 8: Quest Progression & Triggers
      scheduler.registerStep('QUEST_PROGRESSION', (dt) => {
        if (window.QuestStateMachine && typeof window.QuestStateMachine.update === 'function') {
          window.QuestStateMachine.update(dt);
        }
      });

      // Step 10: Survival Authority Tick
      scheduler.registerStep('SURVIVAL', (dt) => {
        this._updateSurvival(dt);
      });

      // Step 16: Telemetry
      scheduler.registerStep('TELEMETRY', (dt, now) => {
        if (window.PerformanceMonitor) {
          window.PerformanceMonitor.recordFrame(scheduler.frameTimeMs, 4.0, 6.0);
        }
      });
    }

    // ------------------------------------------------------------------------
    // STATE ACTIONS (Controlled, validated mutations with EventBus emission)
    // ------------------------------------------------------------------------

    setPlayerPosition(x, y, z) {
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        console.warn(`[GameRuntime] Rejecting NaN position update: [${x}, ${y}, ${z}]`);
        return false;
      }
      const state = this.getState();
      if (!state || !state.player) return false;

      state.player.position.x = x;
      state.player.position.y = y;
      state.player.position.z = z;

      // Sync legacy 2D coordinates if present
      state.player.x = x;
      state.player.y = z;

      if (window.EventBus) {
        window.EventBus.emit('PLAYER_MOVED', { position: state.player.position });
      }
      return true;
    }

    setPlayerRotation(x, y, z) {
      const state = this.getState();
      if (!state || !state.player) return false;
      state.player.rotation = { x: x || 0, y: y || 0, z: z || 0 };
      return true;
    }

    setPlayerMovement(vx, vy, vz, movementState = 'idle') {
      const state = this.getState();
      if (!state || !state.player) return false;
      state.player.velocity = { x: vx || 0, y: vy || 0, z: vz || 0 };
      state.player.movementState = movementState;
      return true;
    }

    movePlayer(dx, dz, dt = 0.016) {
      const state = this.getState();
      if (!state || !state.player) return false;

      const p = state.player.position;
      const targetPos = { x: p.x + dx, y: p.y, z: p.z + dz };

      // Query Collision System
      if (window.CollisionSystem) {
        const test = window.CollisionSystem.testPosition(targetPos, 0.5, 1.8);
        if (test.collided) {
          // Slide along collision normal
          const dot = dx * test.normal.x + dz * test.normal.z;
          targetPos.x -= dot * test.normal.x;
          targetPos.z -= dot * test.normal.z;
        }
      }

      this.setPlayerPosition(targetPos.x, targetPos.y, targetPos.z);
      return true;
    }

    // ── ECONOMY TRANSACTION AUTHORITY ───────────────────────────────────────

    beginTransaction(transactionId = null) {
      if (this.activeTransaction) {
        console.warn('[GameRuntime] A transaction is already active. Rolling back previous before starting new.');
        this.rollback();
      }
      const state = this.getState();
      this.activeTransaction = {
        id: transactionId || `tx_${Date.now()}`,
        snapshot: {
          currency: state?.player?.currency ?? 0,
          inventory: state?.player?.inventory ? JSON.parse(JSON.stringify(state.player.inventory)) : []
        },
        operations: []
      };
      return this.activeTransaction.id;
    }

    changeCurrency(amount, reason = '') {
      const delta = Math.floor(Number(amount) || 0);
      const state = this.getState();
      if (!state || !state.player) return false;

      const current = state.player.currency ?? state.player.money ?? 0;
      if (delta < 0 && current + delta < 0) {
        console.warn(`[GameRuntime] Insufficient funds for transaction (${current} + ${delta} < 0)`);
        return false;
      }

      const newBal = current + delta;
      state.player.currency = newBal;
      state.player.money = newBal; // Keep legacy synchronized

      if (window.EventBus) {
        window.EventBus.emit('CURRENCY_CHANGED', { currency: newBal, delta, reason });
      }
      return true;
    }

    addItem(item, count = 1) {
      if (!item || !item.id) return false;
      const state = this.getState();
      if (!state) return false;

      if (typeof state.addInventoryItem === 'function') {
        const res = state.addInventoryItem({ ...item, count });
        if (res && window.EventBus) {
          window.EventBus.emit('ITEM_ADDED', { item, count });
        }
        return res;
      }
      return false;
    }

    removeItem(itemId, count = 1) {
      const state = this.getState();
      if (!state) return false;

      if (typeof state.removeInventoryItem === 'function') {
        const res = state.removeInventoryItem(itemId, count);
        if (res && window.EventBus) {
          window.EventBus.emit('ITEM_REMOVED', { itemId, count });
        }
        return res;
      }
      return false;
    }

    commit() {
      if (!this.activeTransaction) return false;
      const txId = this.activeTransaction.id;
      this.activeTransaction = null;
      if (window.EventBus) {
        window.EventBus.emit('TRANSACTION_COMMITTED', { transactionId: txId });
      }
      this.requestCheckpoint('transaction');
      return true;
    }

    rollback() {
      if (!this.activeTransaction) return false;
      const state = this.getState();
      if (state && state.player) {
        state.player.currency = this.activeTransaction.snapshot.currency;
        state.player.money = this.activeTransaction.snapshot.currency;
        state.player.inventory = this.activeTransaction.snapshot.inventory;
      }
      console.warn(`[GameRuntime] Transaction '${this.activeTransaction.id}' rolled back.`);
      this.activeTransaction = null;
      return true;
    }

    // ── QUEST ACTIONS ───────────────────────────────────────────────────────

    startQuest(questId) {
      if (window.QuestStateMachine) {
        return window.QuestStateMachine.startQuest(questId);
      }
      return false;
    }

    advanceQuest(questId, objectiveId) {
      if (window.QuestStateMachine) {
        return window.QuestStateMachine.advanceObjective(questId, objectiveId);
      }
      return false;
    }

    completeObjective(questId, objectiveId) {
      return this.advanceQuest(questId, objectiveId);
    }

    failQuest(questId, reason) {
      if (window.QuestStateMachine) {
        return window.QuestStateMachine.failQuest(questId, reason);
      }
      return false;
    }

    // ── DISCOVERY & PROGRESSION ACTIONS ─────────────────────────────────────

    discoverLocation(locationId) {
      const state = this.getState();
      if (!state || !state.world) return false;

      if (!state.world.discoveredLocations) state.world.discoveredLocations = [];
      if (!state.world.discoveredLocations.includes(locationId)) {
        state.world.discoveredLocations.push(locationId);
        if (window.EventBus) {
          window.EventBus.emit('LOCATION_DISCOVERED', { locationId });
        }
        this.requestCheckpoint('discovery');
        return true;
      }
      return false;
    }

    discoverWildlife(speciesId) {
      const state = this.getState();
      if (!state || !state.world) return false;

      if (!state.world.discoveredWildlife) state.world.discoveredWildlife = [];
      if (!state.world.discoveredWildlife.includes(speciesId)) {
        state.world.discoveredWildlife.push(speciesId);
        if (window.EventBus) {
          window.EventBus.emit('WILDLIFE_DISCOVERED', { speciesId });
        }
        return true;
      }
      return false;
    }

    unlockAchievement(achievementId) {
      const state = this.getState();
      if (!state) return false;

      if (!state.achievements) state.achievements = [];
      if (!state.achievements.includes(achievementId)) {
        state.achievements.push(achievementId);
        if (window.EventBus) {
          window.EventBus.emit('ACHIEVEMENT_UNLOCKED', { achievementId });
        }
        return true;
      }
      return false;
    }

    changeRelationship(npcId, delta) {
      const state = this.getState();
      if (!state) return 0;
      if (!state.relationships) state.relationships = {};
      const current = state.relationships[npcId] || 0;
      state.relationships[npcId] = Math.max(-100, Math.min(100, current + delta));
      return state.relationships[npcId];
    }

    changeReputation(regionId, delta) {
      const state = this.getState();
      if (!state) return 0;
      if (!state.reputation) state.reputation = {};
      const current = state.reputation[regionId] || 0;
      state.reputation[regionId] = Math.max(-100, Math.min(100, current + delta));
      return state.reputation[regionId];
    }

    // ── ENVIRONMENT ACTIONS ─────────────────────────────────────────────────

    setWeather(weatherConfig) {
      const state = this.getState();
      if (!state || !state.world) return false;

      if (typeof weatherConfig === 'string') {
        state.world.weather = {
          type: weatherConfig,
          intensity: 0.5,
          humidity: 60,
          temperature: 30,
          wind: 5,
          visibility: 100,
          duration: 3600,
          forecast: 'clear'
        };
      } else if (typeof weatherConfig === 'object') {
        state.world.weather = { ...state.world.weather, ...weatherConfig };
      }

      if (window.EventBus) {
        window.EventBus.emit('WEATHER_CHANGED', state.world.weather);
      }
      return true;
    }

    setTime(hour, minute = 0) {
      if (window.GameClock) {
        window.GameClock.setTime(hour, minute);
        return true;
      }
      return false;
    }

    startWorldEvent(eventId, eventData = {}) {
      if (window.EventBus) {
        window.EventBus.emit('WORLD_EVENT_STARTED', { eventId, data: eventData });
      }
      return true;
    }

    finishWorldEvent(eventId, outcome = 'completed') {
      if (window.EventBus) {
        window.EventBus.emit('WORLD_EVENT_FINISHED', { eventId, outcome });
      }
      this.requestCheckpoint('world_event');
      return true;
    }

    enterVehicle(vehicleId, vehicleType = 'auto') {
      const state = this.getState();
      if (state && state.player) {
        state.player.vehicleState = { inVehicle: true, vehicleId, vehicleType };
      }
      if (window.EventBus) {
        window.EventBus.emit('VEHICLE_ENTERED', { vehicleId, vehicleType });
      }
      return true;
    }

    exitVehicle() {
      const state = this.getState();
      if (state && state.player) {
        state.player.vehicleState = { inVehicle: false, vehicleId: null, vehicleType: null };
      }
      if (window.EventBus) {
        window.EventBus.emit('VEHICLE_EXITED', {});
      }
      return true;
    }

    // ── SURVIVAL AUTHORITY ──────────────────────────────────────────────────

    consumeFood(foodItem) {
      const state = this.getState();
      if (!state || !state.player || !state.player.survival) return false;
      const s = state.player.survival;
      s.hunger = Math.min(s.maxHunger || 100, (s.hunger || 0) + (foodItem.nourishment || 25));
      s.health = Math.min(s.maxHealth || 100, (s.health || 0) + (foodItem.healthGain || 10));
      return true;
    }

    drinkWater(amount = 35) {
      const state = this.getState();
      if (!state || !state.player || !state.player.survival) return false;
      const s = state.player.survival;
      s.hydration = Math.min(s.maxHydration || 100, (s.hydration || 0) + amount);
      return true;
    }

    rest(durationHours = 1) {
      const state = this.getState();
      if (!state || !state.player || !state.player.survival) return false;
      const s = state.player.survival;
      s.energy = Math.min(s.maxEnergy || 100, (s.energy || 0) + durationHours * 20);
      if (window.GameClock) window.GameClock.advanceHours(durationHours);
      return true;
    }

    sleep(hours = 8) {
      const state = this.getState();
      if (!state || !state.player || !state.player.survival) return false;
      const s = state.player.survival;
      s.energy = s.maxEnergy || 100;
      s.health = Math.min(s.maxHealth || 100, (s.health || 0) + 30);
      s.warmth = 85;
      if (window.GameClock) window.GameClock.sleep(hours);
      this.requestCheckpoint('sleep');
      return true;
    }

    warmUp(delta = 10) {
      const state = this.getState();
      if (!state || !state.player || !state.player.survival) return false;
      state.player.survival.warmth = Math.min(100, (state.player.survival.warmth || 80) + delta);
      return true;
    }

    coolDown(delta = 10) {
      const state = this.getState();
      if (!state || !state.player || !state.player.survival) return false;
      state.player.survival.warmth = Math.max(0, (state.player.survival.warmth || 80) - delta);
      return true;
    }

    // ── INTERNAL PIPELINE HELPERS ───────────────────────────────────────────

    _updatePlayerMovement(dt) {
      const modeMgr = window.GameModeManager;
      if (modeMgr && !modeMgr.canMove()) return;

      const input = window.CoreInputManager;
      if (!input) return;

      const speed = input.isSprinting ? 6.5 : (input.isCrouching ? 2.0 : 4.0);
      const dx = input.movement.x * speed * dt;
      const dz = input.movement.y * speed * dt;

      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        this.movePlayer(dx, dz, dt);
        this.setPlayerMovement(dx / dt, 0, dz / dt, input.isSprinting ? 'sprint' : 'walk');
      } else {
        this.setPlayerMovement(0, 0, 0, 'idle');
      }
    }

    _updateCollision(dt) {
      const state = this.getState();
      if (!state || !state.player || !state.player.position) return;
      if (window.CollisionSystem) {
        window.CollisionSystem.updateTriggers(state.player.position, 'player');
      }
    }

    _updateInteractionTarget(dt) {
      const state = this.getState();
      if (!state || !state.player || !state.player.position) return;
      const p = state.player.position;

      // Authoritative proximity check against interactive objects
      let bestTarget = null;
      let minDistance = 3.5; // Max interaction distance

      const candidates = (state.world?.interactions?.discoveredInteractiveObjects) || [];
      for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i];
        if (item.x !== undefined && item.z !== undefined) {
          const d = Math.hypot(item.x - p.x, item.z - p.z);
          if (d < minDistance) {
            minDistance = d;
            bestTarget = { ...item, distance: d };
          }
        }
      }

      this.currentInteractionTarget = bestTarget;
    }

    _updateSurvival(dt) {
      const state = this.getState();
      if (!state || !state.player || !state.player.survival) return;
      const s = state.player.survival;

      // Slow passive depletion
      s.hydration = Math.max(0, (s.hydration || 100) - (0.015 * dt));
      s.hunger = Math.max(0, (s.hunger || 100) - (0.008 * dt));

      if (s.hydration <= 0 || s.hunger <= 0) {
        s.health = Math.max(0, (s.health || 100) - (0.1 * dt));
      }
    }

    // ── CHECKPOINT & AUTOSAVE ───────────────────────────────────────────────

    requestCheckpoint(reason = 'milestone') {
      if (this._autosaveDebounceTimer) clearTimeout(this._autosaveDebounceTimer);
      this._autosaveDebounceTimer = setTimeout(() => {
        if (window.SaveManager && typeof window.SaveManager.saveGame === 'function') {
          window.SaveManager.saveGame('auto', reason);
        } else if (window.saveManager && typeof window.saveManager.saveGame === 'function') {
          window.saveManager.saveGame('auto', reason);
        }
      }, 500); // 500ms debounce
    }

    onPause() {
      if (window.GameModeManager) window.GameModeManager.setMode('PAUSED');
      if (window.GameClock) window.GameClock.pause();
    }

    onResume() {
      if (window.GameModeManager) window.GameModeManager.setMode('GAMEPLAY');
      if (window.GameClock) window.GameClock.resume();
    }

    getState() {
      return typeof window !== 'undefined' ? window.GameState : null;
    }
  }

  return new GameRuntimeEngine();
});
