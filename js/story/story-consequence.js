/**
 * The Whispering Wilds - Story Consequence Engine
 * Evaluates player choices and world memory to drive branching narrative consequences.
 * Consequences include: NPC dialogue changes, gate/door unlocks, weather shifts,
 * quest availability, world flag sets, and ending branch updates.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.StoryConsequenceEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost');

  // ─── Consequence Types ────────────────────────────────────────────────────────
  const ConsequenceType = Object.freeze({
    SET_FLAG:          'set_flag',
    NPC_DIALOGUE:      'npc_dialogue',
    QUEST_UNLOCK:      'quest_unlock',
    QUEST_FAIL:        'quest_fail',
    ITEM_GRANT:        'item_grant',
    ITEM_REMOVE:       'item_remove',
    CURRENCY_CHANGE:   'currency_change',
    UNLOCK_AREA:       'unlock_area',
    LOCK_AREA:         'lock_area',
    WEATHER_SHIFT:     'weather_shift',
    NPC_LEAVE:         'npc_leave',
    NPC_APPEAR:        'npc_appear',
    ENDING_BRANCH:     'ending_branch',
    SURVIVAL_AFFECT:   'survival_affect',
    EMIT_EVENT:        'emit_event'
  });

  // ─── Condition Types ──────────────────────────────────────────────────────────
  const ConditionType = Object.freeze({
    FLAG_IS:            'flag_is',
    QUEST_DONE:         'quest_done',
    NPC_TRUST_GTE:      'npc_trust_gte',
    NPC_TRUST_LTE:      'npc_trust_lte',
    HAS_ITEM:           'has_item',
    LOCATION_VISITED:   'location_visited',
    MEMORY_HAS:         'memory_has',
    CHOICE_MADE:        'choice_made',
    TIME_OF_DAY:        'time_of_day',
    WEATHER_IS:         'weather_is',
    PLAYER_STAT_GTE:    'player_stat_gte'
  });

  // ─── Consequence Definition ────────────────────────────────────────────────────
  class ConsequenceDef {
    constructor(id, options = {}) {
      this.id          = id;
      this.trigger     = options.trigger     || 'manual';   // Event name or 'manual'
      this.conditions  = options.conditions  || [];          // Array of condition objects
      this.effects     = options.effects     || [];          // Array of effect objects
      this.once        = options.once        ?? true;        // Apply only once
      this._applied    = false;
      this.priority    = options.priority    || 0;
    }
  }

  // ─── Consequence Engine ───────────────────────────────────────────────────────
  class StoryConsequenceEngine {
    constructor() {
      this._consequences = new Map();
      this._gameState    = null;
      this._eventBus     = null;
      this._worldMemory  = null;
      this._questSystem  = null;
      this._applied      = new Set();   // Track applied once-consequences
    }

    init(deps) {
      this._gameState   = deps.gameState;
      this._eventBus    = deps.eventBus;
      this._worldMemory = deps.worldMemory;
      this._questSystem = deps.questSystem || null;

      if (deps.eventBus) {
        // Evaluate consequences on relevant game events
        deps.eventBus.on('QUEST_COMPLETED',    d => this._onEvent('QUEST_COMPLETED', d));
        deps.eventBus.on('QUEST_FAILED',       d => this._onEvent('QUEST_FAILED', d));
        deps.eventBus.on('MEMORY_RECORDED',    d => this._onEvent('MEMORY_RECORDED', d));
        deps.eventBus.on('LOCATION_DISCOVERED',d => this._onEvent('LOCATION_DISCOVERED', d));
        deps.eventBus.on('DIALOGUE_CHOICE_SELECTED', d => this._onEvent('DIALOGUE_CHOICE', d));
      }

      this._registerDefaultConsequences();
    }

    // ─── Definition Registration ──────────────────────────────────────────────

    register(def) {
      this._consequences.set(def.id, def);
    }

    // ─── Evaluation ──────────────────────────────────────────────────────────

    _onEvent(eventName, data) {
      // Find all consequences triggered by this event
      const candidates = [];
      for (const def of this._consequences.values()) {
        if (def.trigger === eventName || def.trigger === 'any') candidates.push(def);
      }
      // Sort by priority
      candidates.sort((a, b) => b.priority - a.priority);
      for (const def of candidates) {
        this._evaluate(def, data);
      }
    }

    evaluate(consequenceId, context = {}) {
      const def = this._consequences.get(consequenceId);
      if (!def) return false;
      return this._evaluate(def, context);
    }

    _evaluate(def, context) {
      if (def.once && this._applied.has(def.id)) return false;
      if (!this._checkConditions(def.conditions, context)) return false;
      this._applyEffects(def.effects, context);
      if (def.once) this._applied.add(def.id);
      if (IS_DEV) console.log(`[StoryConsequence] Applied: ${def.id}`);
      return true;
    }

    // ─── Condition Checking ───────────────────────────────────────────────────

    _checkConditions(conditions, context) {
      for (const cond of conditions) {
        if (!this._checkCondition(cond, context)) return false;
      }
      return true;
    }

    _checkCondition(cond, context) {
      const gs  = this._gameState;
      const mem = this._worldMemory;

      switch (cond.type) {
        case ConditionType.FLAG_IS:
          return mem?.getFlag(cond.flagId) === cond.value;

        case ConditionType.QUEST_DONE:
          return gs?.world?.completedQuests?.includes(cond.questId) ?? false;

        case ConditionType.NPC_TRUST_GTE:
          return (mem?.getTrustLevel(cond.npcId) ?? 0) >= cond.value;

        case ConditionType.NPC_TRUST_LTE:
          return (mem?.getTrustLevel(cond.npcId) ?? 0) <= cond.value;

        case ConditionType.HAS_ITEM:
          return gs?.player?.inventory?.some(i => i.id === cond.itemId && i.count >= (cond.count || 1)) ?? false;

        case ConditionType.LOCATION_VISITED:
          return gs?.world?.discoveries?.[cond.locationId]?.discovered ?? false;

        case ConditionType.MEMORY_HAS:
          return mem?.hasPlayerEver(cond.eventType, cond.filter || null) ?? false;

        case ConditionType.TIME_OF_DAY: {
          const hour = gs?.world?.time?.hour ?? 12;
          return hour >= cond.fromHour && hour < cond.toHour;
        }

        case ConditionType.PLAYER_STAT_GTE: {
          const stat = gs?.player?.survival?.[cond.stat] ?? gs?.player?.[cond.stat] ?? 0;
          return stat >= cond.value;
        }

        default:
          return true;
      }
    }

    // ─── Effect Application ───────────────────────────────────────────────────

    _applyEffects(effects, context) {
      for (const effect of effects) {
        try {
          this._applyEffect(effect, context);
        } catch (err) {
          if (IS_DEV) console.error(`[StoryConsequence] Effect error:`, err);
        }
      }
    }

    _applyEffect(effect, context) {
      const gs  = this._gameState;
      const mem = this._worldMemory;
      const bus = this._eventBus;

      switch (effect.type) {
        case ConsequenceType.SET_FLAG:
          mem?.setFlag(effect.flagId, effect.value ?? true);
          break;

        case ConsequenceType.NPC_DIALOGUE:
          if (bus) bus.emit('NPC_DIALOGUE_CHANGED', { npcId: effect.npcId, dialogueId: effect.dialogueId });
          break;

        case ConsequenceType.QUEST_UNLOCK:
          if (gs?.world) {
            if (!gs.world.availableQuests) gs.world.availableQuests = [];
            if (!gs.world.availableQuests.includes(effect.questId)) {
              gs.world.availableQuests.push(effect.questId);
              if (bus) bus.emit('QUEST_AVAILABLE', { questId: effect.questId });
            }
          }
          break;

        case ConsequenceType.ITEM_GRANT:
          if (gs?.player?.inventory) {
            const existing = gs.player.inventory.find(i => i.id === effect.itemId);
            if (existing) existing.count += effect.count || 1;
            else gs.player.inventory.push({ id: effect.itemId, name: effect.itemName || effect.itemId, count: effect.count || 1, weight: effect.weight || 0 });
            if (bus) bus.emit('ITEM_ADDED', { id: effect.itemId, count: effect.count || 1 });
          }
          break;

        case ConsequenceType.CURRENCY_CHANGE:
          if (gs?.player) {
            gs.player.currency = Math.max(0, (gs.player.currency || 0) + effect.amount);
            if (bus) bus.emit('CURRENCY_CHANGED', { amount: effect.amount, newTotal: gs.player.currency });
          }
          break;

        case ConsequenceType.UNLOCK_AREA:
          mem?.setFlag(`area_unlocked_${effect.areaId}`, true);
          if (bus) bus.emit('AREA_UNLOCKED', { areaId: effect.areaId });
          break;

        case ConsequenceType.LOCK_AREA:
          mem?.setFlag(`area_unlocked_${effect.areaId}`, false);
          if (bus) bus.emit('AREA_LOCKED', { areaId: effect.areaId });
          break;

        case ConsequenceType.ENDING_BRANCH:
          if (gs?.world) {
            gs.world.endingBranch = effect.branchId;
            if (bus) bus.emit('ENDING_BRANCH_SET', { branchId: effect.branchId });
          }
          break;

        case ConsequenceType.SURVIVAL_AFFECT:
          if (gs?.player?.survival && effect.stat) {
            gs.player.survival[effect.stat] = Math.max(0, Math.min(
              gs.player.survival[`max${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`] ?? 100,
              (gs.player.survival[effect.stat] || 0) + (effect.amount || 0)
            ));
          }
          break;

        case ConsequenceType.EMIT_EVENT:
          if (bus) bus.emit(effect.eventName, effect.payload || {});
          break;
      }
    }

    // ─── Default Consequences ─────────────────────────────────────────────────

    _registerDefaultConsequences() {
      // Example: If player helps Saraswathi Paati and completes her quest,
      // she gives access to the hidden herb garden
      this.register(new ConsequenceDef('paati_trust_reward', {
        trigger:  'QUEST_COMPLETED',
        priority: 10,
        conditions: [
          { type: ConditionType.QUEST_DONE,      questId: 'quest_medicinal_herbs' },
          { type: ConditionType.NPC_TRUST_GTE,   npcId: 'temple_elder', value: 40 }
        ],
        effects: [
          { type: ConsequenceType.UNLOCK_AREA,   areaId: 'herb_garden_secret' },
          { type: ConsequenceType.NPC_DIALOGUE,  npcId: 'temple_elder', dialogueId: 'dlg_grateful_elder' },
          { type: ConsequenceType.ITEM_GRANT,    itemId: 'rare_herb_map', itemName: 'Secret Herb Map', count: 1, weight: 0.1 }
        ]
      }));

      // Example: Ferry unlocked after finding harbour
      this.register(new ConsequenceDef('pichavaram_ferry_unlock', {
        trigger: 'LOCATION_DISCOVERED',
        conditions: [
          { type: ConditionType.LOCATION_VISITED, locationId: 'region_pichavaram' }
        ],
        effects: [
          { type: ConsequenceType.UNLOCK_AREA,   areaId: 'pichavaram_ferry' },
          { type: ConsequenceType.SET_FLAG,       flagId: 'ferry_available', value: true },
          { type: ConsequenceType.EMIT_EVENT,     eventName: 'FAST_TRAVEL_UNLOCKED', payload: { locationId: 'pichavaram_harbour' } }
        ]
      }));

      if (IS_DEV) console.log('[StoryConsequence] Default consequences registered');
    }

    getAppliedCount() { return this._applied.size; }

    destroy() {
      this._consequences.clear();
      this._applied.clear();
    }
  }

  return { ConsequenceType, ConditionType, ConsequenceDef, StoryConsequenceEngine };
});
