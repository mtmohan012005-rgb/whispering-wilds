// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - QUEST STATE MACHINE
// Authoritative quest lifecycle manager with 8 strict states:
// LOCKED, AVAILABLE, ACTIVE, PAUSED, OPTIONAL, FAILED, COMPLETED, ABANDONED.
// Prevents duplicate rewards, accidental objective bypass, and save corruption.
// ============================================================================

(function () {
  'use strict';

  const QUEST_STATES = {
    LOCKED: 'LOCKED',
    AVAILABLE: 'AVAILABLE',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    OPTIONAL: 'OPTIONAL',
    FAILED: 'FAILED',
    COMPLETED: 'COMPLETED',
    ABANDONED: 'ABANDONED'
  };

  class QuestStateMachine {
    constructor(registry = null, eventBus = null) {
      this.registry = registry || window.ContentRegistry;
      this.eventBus = eventBus || window.ContentEvents;
      this.questStates = new Map(); // questId -> { state, currentObjectiveIndex, completedObjectives: Set, branch: null, startTime, completedTime }
      this.awardedRewardHashes = new Set(); // Guard against duplicate rewards
      this.initialized = false;
      this._eventUnsubscribers = [];
    }

    /**
     * Initialize Quest State Machine and bind to ContentEvents
     */
    init(registry = null, eventBus = null) {
      if (registry) this.registry = registry;
      if (eventBus) this.eventBus = eventBus;

      this._unbindEvents();
      this._bindEvents();

      // Synchronize with existing GameState if available
      this.loadFromGameState();

      this.initialized = true;
      console.log('[QuestStateMachine] Initialized authoritative quest engine.');
      return this;
    }

    _unbindEvents() {
      for (const unsub of this._eventUnsubscribers) {
        if (typeof unsub === 'function') unsub();
      }
      this._eventUnsubscribers = [];
    }

    _bindEvents() {
      const bus = this.eventBus || window.ContentEvents;
      if (!bus) return;

      const handlers = [
        { event: 'reach_location', type: 'reach_location', matchKey: 'locationId' },
        { event: 'interact_object', type: 'interact_object', matchKey: 'objectId' },
        { event: 'talk_npc', type: 'talk_npc', matchKey: 'npcId' },
        { event: 'collect_item', type: 'collect_item', matchKey: 'itemId' },
        { event: 'inspect_clue', type: 'inspect_clue', matchKey: 'clueId' },
        { event: 'photograph_subject', type: 'photograph_subject', matchKey: 'subjectId' },
        { event: 'survive_weather', type: 'survive_weather', matchKey: 'weatherType' },
        { event: 'complete_cultural_activity', type: 'complete_cultural_activity', matchKey: 'activityId' },
        { event: 'discover_wildlife', type: 'discover_wildlife', matchKey: 'speciesId' },
        { event: 'deliver_item', type: 'deliver_item', matchKey: 'itemId' },
        { event: 'solve_puzzle', type: 'solve_puzzle', matchKey: 'puzzleId' },
        { event: 'craft_item', type: 'craft_item', matchKey: 'recipeId' },
        { event: 'visit_landmark', type: 'visit_landmark', matchKey: 'landmarkId' },
        { event: 'return_to_npc', type: 'return_to_npc', matchKey: 'npcId' }
      ];

      for (const h of handlers) {
        const unsub = bus.on(h.event, (payload) => {
          this._handleObjectiveEvent(h.type, payload, h.matchKey);
        });
        this._eventUnsubscribers.push(unsub);
      }
    }

    /**
     * Re-evaluate and handle objective completion events across active quests
     */
    _handleObjectiveEvent(objectiveType, payload, matchKey) {
      const targetVal = payload[matchKey];
      if (!targetVal) return;

      for (const [questId, qState] of this.questStates.entries()) {
        if (qState.state !== QUEST_STATES.ACTIVE && qState.state !== QUEST_STATES.OPTIONAL) continue;

        const def = this._getQuestDef(questId);
        if (!def || !Array.isArray(def.objectives)) continue;

        // Current active main objective
        const curIdx = qState.currentObjectiveIndex || 0;
        const currentObj = def.objectives[curIdx];

        if (currentObj && currentObj.type === objectiveType) {
          const expectedTarget = currentObj.target || currentObj[matchKey];
          if (expectedTarget === targetVal || expectedTarget === 'any' || !expectedTarget) {
            this.progressObjective(questId, currentObj.id, payload);
          }
        }

        // Check optional or parallel objectives
        if (Array.isArray(def.optionalObjectives)) {
          for (const optObj of def.optionalObjectives) {
            if (optObj.type === objectiveType && !qState.completedObjectives.has(optObj.id)) {
              const expectedTarget = optObj.target || optObj[matchKey];
              if (expectedTarget === targetVal || expectedTarget === 'any' || !expectedTarget) {
                this.completeOptionalObjective(questId, optObj.id, payload);
              }
            }
          }
        }
      }
    }

    _getQuestDef(questId) {
      if (this.registry) {
        return this.registry.get('quest', questId);
      }
      return null;
    }

    /**
     * Get or initialize state for a quest
     */
    getQuestState(questId) {
      if (!this.questStates.has(questId)) {
        const def = this._getQuestDef(questId);
        const initialState = (def && def.isDefaultUnlocked) ? QUEST_STATES.AVAILABLE : QUEST_STATES.LOCKED;
        this.questStates.set(questId, {
          id: questId,
          state: initialState,
          currentObjectiveIndex: 0,
          completedObjectives: new Set(),
          optionalCompleted: new Set(),
          branch: null,
          startTime: null,
          completedTime: null
        });
      }
      return this.questStates.get(questId);
    }

    /**
     * Start a quest (Validates prerequisites, prevents accidental start)
     */
    startQuest(questId) {
      const def = this._getQuestDef(questId);
      if (!def) {
        console.warn(`[QuestStateMachine] Cannot start unknown quest '${questId}'`);
        return { success: false, reason: 'QUEST_NOT_FOUND' };
      }

      const qState = this.getQuestState(questId);

      // Cannot start already active or completed quests
      if (qState.state === QUEST_STATES.COMPLETED) {
        return { success: false, reason: 'ALREADY_COMPLETED' };
      }
      if (qState.state === QUEST_STATES.ACTIVE) {
        return { success: false, reason: 'ALREADY_ACTIVE' };
      }

      // Check prerequisites
      if (def.prerequisites && window.ContentUtils) {
        const prereqCheck = window.ContentUtils.evaluatePrerequisites(def.prerequisites, window.GameState);
        if (!prereqCheck.satisfied) {
          console.warn(`[QuestStateMachine] Prerequisites not met for quest '${questId}':`, prereqCheck.unmet);
          return { success: false, reason: 'PREREQUISITES_NOT_MET', unmet: prereqCheck.unmet };
        }
      }

      qState.state = QUEST_STATES.ACTIVE;
      qState.startTime = Date.now();
      qState.currentObjectiveIndex = 0;

      this._saveToGameState();

      if (this.eventBus) {
        this.eventBus.emit('quest_started', { questId, quest: def });
      }

      console.log(`[QuestStateMachine] Quest '${questId}' started!`);
      return { success: true, questId, state: qState.state };
    }

    /**
     * Progress current objective in a quest
     */
    progressObjective(questId, objectiveId, payload = {}) {
      const qState = this.getQuestState(questId);
      if (qState.state !== QUEST_STATES.ACTIVE && qState.state !== QUEST_STATES.OPTIONAL) {
        return { success: false, reason: 'QUEST_NOT_ACTIVE' };
      }

      const def = this._getQuestDef(questId);
      if (!def || !Array.isArray(def.objectives)) {
        return { success: false, reason: 'INVALID_QUEST_DEF' };
      }

      const curIdx = qState.currentObjectiveIndex;
      const curObj = def.objectives[curIdx];

      // Anti-skip guard: Only the current active objective can be progressed!
      if (!curObj || curObj.id !== objectiveId) {
        console.warn(`[QuestStateMachine] Anti-skip guard: objective '${objectiveId}' is not the current active objective for quest '${questId}'`);
        return { success: false, reason: 'OBJECTIVE_OUT_OF_SEQUENCE' };
      }

      qState.completedObjectives.add(objectiveId);

      if (this.eventBus) {
        this.eventBus.emit('objective_completed', { questId, objectiveId, objective: curObj, payload });
      }

      // Check if more objectives remain
      if (curIdx + 1 < def.objectives.length) {
        qState.currentObjectiveIndex = curIdx + 1;
        const nextObj = def.objectives[qState.currentObjectiveIndex];
        if (this.eventBus) {
          this.eventBus.emit('objective_activated', { questId, objectiveId: nextObj.id, objective: nextObj });
        }
        this._saveToGameState();
        return { success: true, completedObjective: objectiveId, nextObjective: nextObj.id, isFinished: false };
      } else {
        // All main objectives complete -> Complete Quest!
        return this.completeQuest(questId);
      }
    }

    /**
     * Complete an optional objective
     */
    completeOptionalObjective(questId, objectiveId, payload = {}) {
      const qState = this.getQuestState(questId);
      if (qState.optionalCompleted.has(objectiveId)) return;

      qState.optionalCompleted.add(objectiveId);

      if (this.eventBus) {
        this.eventBus.emit('optional_objective_completed', { questId, objectiveId, payload });
      }
      this._saveToGameState();
    }

    /**
     * Complete quest with duplicate reward protection
     */
    completeQuest(questId) {
      const qState = this.getQuestState(questId);

      // Duplicate completion guard
      if (qState.state === QUEST_STATES.COMPLETED) {
        console.warn(`[QuestStateMachine] Quest '${questId}' already completed. Duplicate completion blocked.`);
        return { success: false, reason: 'ALREADY_COMPLETED' };
      }

      qState.state = QUEST_STATES.COMPLETED;
      qState.completedTime = Date.now();

      const def = this._getQuestDef(questId);
      const rewardsAwarded = this._awardRewards(questId, def?.rewards);

      // Handle mutually exclusive branches if defined
      if (def?.mutuallyExclusiveWith) {
        for (const mutexQuestId of def.mutuallyExclusiveWith) {
          const mutexState = this.getQuestState(mutexQuestId);
          if (mutexState.state !== QUEST_STATES.COMPLETED) {
            mutexState.state = QUEST_STATES.ABANDONED;
          }
        }
      }

      this._saveToGameState();

      if (this.eventBus) {
        this.eventBus.emit('quest_completed', { questId, quest: def, rewards: rewardsAwarded });
      }

      console.log(`[QuestStateMachine] Quest '${questId}' completed!`);
      return { success: true, questId, state: qState.state, rewards: rewardsAwarded };
    }

    /**
     * Fail quest
     */
    failQuest(questId, reason = 'FAILED') {
      const qState = this.getQuestState(questId);
      if (qState.state === QUEST_STATES.COMPLETED) return false;

      qState.state = QUEST_STATES.FAILED;
      this._saveToGameState();

      if (this.eventBus) {
        this.eventBus.emit('quest_failed', { questId, reason });
      }
      return true;
    }

    /**
     * Award rewards idempotently (prevents duplicate rewards)
     */
    _awardRewards(questId, rewards = {}) {
      if (!rewards) return { xp: 0, coins: 0, items: [] };

      const rewardHash = `${questId}_${rewards.xp || 0}_${rewards.coins || 0}`;
      if (this.awardedRewardHashes.has(rewardHash)) {
        console.warn(`[QuestStateMachine] Duplicate reward claim prevented for hash '${rewardHash}'`);
        return { duplicateBlocked: true };
      }
      this.awardedRewardHashes.add(rewardHash);

      const state = window.GameState;
      if (state) {
        // Experience
        if (rewards.xp && state.player) {
          state.player.experience = (state.player.experience || 0) + rewards.xp;
        }

        // Coins / Currency (Single deduction authority applied to additions too)
        if (rewards.coins) {
          if (window.EconomySystem?.addCurrency) {
            window.EconomySystem.addCurrency(rewards.coins, `quest_reward:${questId}`);
          } else if (state.player) {
            state.player.money = (state.player.money || 0) + rewards.coins;
          }
        }

        // Items
        if (Array.isArray(rewards.items) && state.inventory) {
          for (const it of rewards.items) {
            const itemId = typeof it === 'string' ? it : it.id;
            const count = typeof it === 'object' ? (it.count || 1) : 1;
            for (let i = 0; i < count; i++) {
              if (window.InventorySystem?.addItem) {
                window.InventorySystem.addItem(itemId);
              } else if (Array.isArray(state.inventory.items)) {
                state.inventory.items.push(itemId);
              }
            }
          }
        }

        // Reputation
        if (rewards.reputation && typeof rewards.reputation === 'object') {
          if (!state.reputation) state.reputation = {};
          for (const [faction, delta] of Object.entries(rewards.reputation)) {
            state.reputation[faction] = (state.reputation[faction] || 0) + delta;
          }
        }
      }

      return {
        xp: rewards.xp || 0,
        coins: rewards.coins || 0,
        items: rewards.items || [],
        reputation: rewards.reputation || {}
      };
    }

    /**
     * Persist quest states into GameState
     */
    _saveToGameState() {
      const state = window.GameState;
      if (!state) return;

      if (!state.quests) state.quests = { active: [], completed: [], states: {} };
      if (!state.quests.states) state.quests.states = {};

      const activeList = [];
      const completedList = [];

      for (const [id, qs] of this.questStates.entries()) {
        state.quests.states[id] = {
          state: qs.state,
          currentObjectiveIndex: qs.currentObjectiveIndex,
          completedObjectives: Array.from(qs.completedObjectives),
          optionalCompleted: Array.from(qs.optionalCompleted),
          branch: qs.branch,
          startTime: qs.startTime,
          completedTime: qs.completedTime
        };

        if (qs.state === QUEST_STATES.ACTIVE) activeList.push(id);
        if (qs.state === QUEST_STATES.COMPLETED) completedList.push(id);
      }

      state.quests.active = activeList;
      state.quests.completed = completedList;
      state.quests.rewardHashes = Array.from(this.awardedRewardHashes);
    }

    /**
     * Restore quest states from GameState without resets
     */
    loadFromGameState() {
      const state = window.GameState;
      if (!state || !state.quests || !state.quests.states) return;

      for (const [id, saved] of Object.entries(state.quests.states)) {
        this.questStates.set(id, {
          id,
          state: saved.state || QUEST_STATES.LOCKED,
          currentObjectiveIndex: saved.currentObjectiveIndex || 0,
          completedObjectives: new Set(saved.completedObjectives || []),
          optionalCompleted: new Set(saved.optionalCompleted || []),
          branch: saved.branch || null,
          startTime: saved.startTime || null,
          completedTime: saved.completedTime || null
        });
      }

      if (Array.isArray(state.quests.rewardHashes)) {
        state.quests.rewardHashes.forEach(h => this.awardedRewardHashes.add(h));
      }
    }

    /**
     * Check active quest count
     */
    getActiveQuests() {
      const active = [];
      for (const [id, qs] of this.questStates.entries()) {
        if (qs.state === QUEST_STATES.ACTIVE) {
          active.push({ id, state: qs, def: this._getQuestDef(id) });
        }
      }
      return active;
    }
  }

  const instance = new QuestStateMachine();

  if (typeof window !== 'undefined') {
    window.QuestStateMachine = instance;
    window.questStateMachine = instance;
    window.QUEST_STATES = QUEST_STATES;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestStateMachine, instance, QUEST_STATES };
  }
})();
