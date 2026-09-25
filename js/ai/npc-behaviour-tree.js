/**
 * The Whispering Wilds - NPC Behaviour Tree
 * Modular, data-driven behaviour tree framework for NPC AI.
 * Supports Sequence, Selector, Parallel, Decorator, Action and Condition nodes.
 * Designed for Tamil Nadu daily life: vendor routines, temple rituals, farming schedules.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.NPCBehaviourTree = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Node Status ─────────────────────────────────────────────────────────────
  const Status = Object.freeze({
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    RUNNING: 'RUNNING'
  });

  // ─── Base Node ───────────────────────────────────────────────────────────────
  class BTNode {
    constructor(name) {
      this.name   = name || 'Node';
      this._status = Status.FAILURE;
    }

    /** @param {Object} ctx - NPC blackboard context @returns {string} Status */
    tick(ctx) { return Status.FAILURE; }

    reset() { this._status = Status.FAILURE; }
  }

  // ─── Composite Nodes ─────────────────────────────────────────────────────────

  /** Runs children in order. Fails if any child fails. Succeeds when all succeed. */
  class Sequence extends BTNode {
    constructor(name, children = []) {
      super(name || 'Sequence');
      this.children = children;
      this._runningIndex = 0;
    }

    tick(ctx) {
      while (this._runningIndex < this.children.length) {
        const status = this.children[this._runningIndex].tick(ctx);
        if (status === Status.RUNNING) return Status.RUNNING;
        if (status === Status.FAILURE) {
          this._runningIndex = 0;
          return Status.FAILURE;
        }
        this._runningIndex++;
      }
      this._runningIndex = 0;
      return Status.SUCCESS;
    }

    reset() {
      super.reset();
      this._runningIndex = 0;
      this.children.forEach(c => c.reset());
    }
  }

  /** Runs children until one succeeds. Fails if all fail. */
  class Selector extends BTNode {
    constructor(name, children = []) {
      super(name || 'Selector');
      this.children = children;
    }

    tick(ctx) {
      for (const child of this.children) {
        const status = child.tick(ctx);
        if (status === Status.SUCCESS || status === Status.RUNNING) return status;
      }
      return Status.FAILURE;
    }

    reset() { super.reset(); this.children.forEach(c => c.reset()); }
  }

  /** Runs all children each tick. Succeeds when all succeed. */
  class Parallel extends BTNode {
    constructor(name, children = [], successThreshold = null) {
      super(name || 'Parallel');
      this.children          = children;
      this._successThreshold = successThreshold; // null = all must succeed
    }

    tick(ctx) {
      let successCount = 0;
      const threshold = this._successThreshold ?? this.children.length;
      for (const child of this.children) {
        const status = child.tick(ctx);
        if (status === Status.SUCCESS) successCount++;
        if (status === Status.FAILURE && this._successThreshold === null) return Status.FAILURE;
      }
      return successCount >= threshold ? Status.SUCCESS : Status.RUNNING;
    }
  }

  // ─── Decorator Nodes ──────────────────────────────────────────────────────────

  /** Inverts child result (SUCCESS ↔ FAILURE). */
  class Inverter extends BTNode {
    constructor(child) { super('Inverter'); this.child = child; }
    tick(ctx) {
      const s = this.child.tick(ctx);
      if (s === Status.SUCCESS) return Status.FAILURE;
      if (s === Status.FAILURE) return Status.SUCCESS;
      return Status.RUNNING;
    }
  }

  /** Repeats child up to N times (or until failure). */
  class Repeat extends BTNode {
    constructor(child, times = Infinity) {
      super('Repeat');
      this.child  = child;
      this.times  = times;
      this._count = 0;
    }
    tick(ctx) {
      if (this._count >= this.times) { this._count = 0; return Status.SUCCESS; }
      const s = this.child.tick(ctx);
      if (s === Status.FAILURE) { this._count = 0; return Status.FAILURE; }
      if (s === Status.SUCCESS) this._count++;
      return Status.RUNNING;
    }
    reset() { super.reset(); this._count = 0; this.child.reset(); }
  }

  /** Succeeds only if child returns success within time limit. */
  class Timeout extends BTNode {
    constructor(child, limitSec) {
      super('Timeout');
      this.child    = child;
      this.limit    = limitSec;
      this._elapsed = 0;
    }
    tick(ctx) {
      this._elapsed += (ctx.dt || 0.016);
      if (this._elapsed > this.limit) {
        this._elapsed = 0;
        this.child.reset();
        return Status.FAILURE;
      }
      const s = this.child.tick(ctx);
      if (s !== Status.RUNNING) this._elapsed = 0;
      return s;
    }
    reset() { super.reset(); this._elapsed = 0; this.child.reset(); }
  }

  // ─── Leaf Nodes ───────────────────────────────────────────────────────────────

  /** Condition: wraps a predicate function. */
  class Condition extends BTNode {
    constructor(name, predicate) {
      super(name || 'Condition');
      this._predicate = predicate;
    }
    tick(ctx) { return this._predicate(ctx) ? Status.SUCCESS : Status.FAILURE; }
  }

  /** Action: wraps an action function that returns Status. */
  class Action extends BTNode {
    constructor(name, action) {
      super(name || 'Action');
      this._action = action;
    }
    tick(ctx) {
      const result = this._action(ctx);
      return result || Status.SUCCESS;
    }
  }

  /** Wait for N seconds. */
  class Wait extends BTNode {
    constructor(seconds) {
      super('Wait');
      this._target  = seconds;
      this._elapsed = 0;
    }
    tick(ctx) {
      this._elapsed += (ctx.dt || 0.016);
      if (this._elapsed >= this._target) {
        this._elapsed = 0;
        return Status.SUCCESS;
      }
      return Status.RUNNING;
    }
    reset() { super.reset(); this._elapsed = 0; }
  }

  /** Always succeed/fail. For debug. */
  class AlwaysSucceed extends BTNode { tick() { return Status.SUCCESS; } }
  class AlwaysFail    extends BTNode { tick() { return Status.FAILURE; } }

  // ─── Tree Root ───────────────────────────────────────────────────────────────
  class BehaviourTree {
    constructor(root) {
      this._root = root;
    }

    /**
     * Tick the tree with a blackboard context.
     * @param {Object} ctx - Blackboard with npc, gameState, dt, etc.
     * @returns {string} Status
     */
    tick(ctx) {
      return this._root.tick(ctx);
    }

    reset() { this._root.reset(); }
  }

  // ─── Pre-built Tamil Nadu NPC Trees ──────────────────────────────────────────

  /**
   * Builds a basic daily-routine behaviour tree for NPCs with schedules.
   * Pattern: check time → move to location → perform activity → idle
   */
  function buildDailyRoutineTree(scheduleSlots) {
    const children = scheduleSlots.map(slot => {
      return new Sequence(`Slot_${slot.label}`, [
        new Condition(`IsTime_${slot.label}`, ctx => {
          const hour = ctx.gameState?.world?.time?.hour ?? 6;
          return hour >= slot.startHour && hour < slot.endHour;
        }),
        new Condition('AtLocation', ctx => {
          if (!ctx.npc || !slot.location) return true;
          const pos = ctx.npc.position;
          const dx = pos.x - slot.location.x;
          const dz = (pos.z || pos.z) - slot.location.z;
          return Math.sqrt(dx * dx + dz * dz) < 1.5;
        }),
        new Action(`DoActivity_${slot.label}`, ctx => {
          if (ctx.npc && typeof slot.activity === 'function') slot.activity(ctx);
          return Status.RUNNING;
        })
      ]);
    });

    // Navigation fallback
    const navSequence = new Sequence('NavigateToScheduleLocation', [
      new Action('MoveToScheduledLocation', ctx => {
        const hour = ctx.gameState?.world?.time?.hour ?? 6;
        const slot = scheduleSlots.find(s => hour >= s.startHour && hour < s.endHour);
        if (!slot || !slot.location) return Status.FAILURE;
        if (ctx.navSystem && ctx.npc) {
          ctx.navSystem.setDestination(ctx.npc.id, slot.location.x, slot.location.z);
        }
        return Status.RUNNING;
      })
    ]);

    return new BehaviourTree(
      new Selector('DailyRoutineRoot', [
        new Selector('TryCurrentSlot', children),
        navSequence,
        new Action('Idle', () => Status.RUNNING)
      ])
    );
  }

  /**
   * Build a vendor/merchant tree.
   */
  function buildVendorTree() {
    return new BehaviourTree(
      new Selector('VendorRoot', [
        // Talk to player if nearby
        new Sequence('CustomerInteraction', [
          new Condition('PlayerNearby', ctx => ctx.playerDist != null && ctx.playerDist < 3.0),
          new Action('GreetOrDialogue', ctx => {
            if (ctx.npc && !ctx.npc._greeted) {
              ctx.npc._greeted = true;
              if (ctx.eventBus) ctx.eventBus.emit('NPC_DIALOGUE_STARTED', { npcId: ctx.npc.id });
            }
            return Status.RUNNING;
          })
        ]),
        // Default: stay at stall and look active
        new Sequence('ManageStall', [
          new Action('StallActivity', ctx => {
            if (ctx.npc) ctx.npc.activity = 'vendor_idle';
            return Status.RUNNING;
          })
        ])
      ])
    );
  }

  return {
    Status, BTNode, Sequence, Selector, Parallel,
    Inverter, Repeat, Timeout, Condition, Action, Wait,
    AlwaysSucceed, AlwaysFail, BehaviourTree,
    buildDailyRoutineTree, buildVendorTree
  };
});
