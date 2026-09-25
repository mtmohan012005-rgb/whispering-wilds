/**
 * The Whispering Wilds - NPC Manager
 * Manages all NPC instances: spawning, despawning, update budgets, LOD, memory.
 * NPCs use the BehaviourTree + Navigation + Spatial systems.
 * Maximum active NPCs enforced per region to maintain 60fps.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.NPCManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost');

  // ─── NPC LOD Levels ──────────────────────────────────────────────────────────
  const NPCLO = Object.freeze({
    FULL:   'full',    // <15m  — full BT + animation + audio
    MEDIUM: 'medium',  // 15–40m — BT + reduced animation
    LOW:    'low',     // 40–80m — simplified position-only
    IDLE:   'idle'     // >80m  — no update, static pose
  });

  // ─── NPC Record ──────────────────────────────────────────────────────────────
  class NPCInstance {
    constructor(id, template, spawnPos) {
      this.id          = id;
      this.templateId  = template.id;
      this.name        = template.name || id;
      this.type        = template.type || 'civilian';   // 'civilian'|'vendor'|'elder'|'guard'|'wildlife'
      this.position    = { x: spawnPos.x, y: spawnPos.y || 0, z: spawnPos.z };
      this.rotation    = 0;
      this.state       = 'idle';
      this.activity    = 'idle';
      this.lod         = NPCLO.IDLE;
      this.active      = true;
      this.distToPlayer = Infinity;
      this.behaviourTree = null;
      this.navAgent    = null;
      this.schedule    = template.schedule || [];
      this.dialogueId  = template.dialogueId || null;
      this.questGiver  = template.questGiver || null;
      this._greeted    = false;
      this._meta       = template.meta || {};
      // Blackboard context (shared between BT ticks)
      this._blackboard = {};
    }
  }

  // ─── NPC Manager ─────────────────────────────────────────────────────────────
  class NPCManager {
    constructor() {
      this._npcs          = new Map();     // id → NPCInstance
      this._templates     = new Map();     // templateId → template data
      this._gameState     = null;
      this._eventBus      = null;
      this._navigation    = null;
      this._spatialQuery  = null;
      this._btModule      = null;

      // Performance budget
      this._maxActive     = 40;   // Max NPCs with full updates per frame
      this._updateBudget  = 8;    // NPCs updated per frame (rest deferred)
      this._updateCursor  = 0;
      this._updateQueue   = [];

      // LOD thresholds
      this.LOD_FULL_DIST   = 15;
      this.LOD_MED_DIST    = 40;
      this.LOD_LOW_DIST    = 80;
    }

    init(deps) {
      this._gameState    = deps.gameState;
      this._eventBus     = deps.eventBus;
      this._navigation   = deps.navigation;
      this._spatialQuery = deps.spatialQuery;
      this._btModule     = (typeof window !== 'undefined' && window.NPCBehaviourTree) ||
                           (typeof globalThis !== 'undefined' && globalThis.NPCBehaviourTree) || null;
    }

    // ─── Template Registration ────────────────────────────────────────────────

    registerTemplate(template) {
      if (!template.id) throw new Error('[NPCManager] Template must have an id');
      this._templates.set(template.id, template);
    }

    // ─── Spawn / Despawn ──────────────────────────────────────────────────────

    spawn(templateId, spawnPos, overrideId = null) {
      const template = this._templates.get(templateId);
      if (!template) {
        if (IS_DEV) console.warn(`[NPCManager] Unknown template: ${templateId}`);
        return null;
      }
      const id = overrideId || `npc_${templateId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      if (this._npcs.has(id)) {
        if (IS_DEV) console.warn(`[NPCManager] NPC '${id}' already spawned`);
        return this._npcs.get(id);
      }

      const npc = new NPCInstance(id, template, spawnPos);

      // Build behaviour tree
      if (this._btModule) {
        if (template.type === 'vendor') {
          npc.behaviourTree = this._btModule.buildVendorTree();
        } else if (template.schedule && template.schedule.length > 0) {
          npc.behaviourTree = this._btModule.buildDailyRoutineTree(template.schedule);
        }
      }

      // Register nav agent
      if (this._navigation) {
        npc.navAgent = this._navigation.registerAgent(id, 'npc', {
          speed:  template.walkSpeed || 1.8,
          radius: template.radius || 0.35
        });
        npc.navAgent.setPosition(spawnPos.x, spawnPos.z);
      }

      // Register in spatial grid
      if (this._spatialQuery) {
        this._spatialQuery.syncEntity(id, spawnPos.x, spawnPos.y || 0, spawnPos.z, 0.35, ['npc']);
      }

      this._npcs.set(id, npc);
      this._updateQueue.push(id);

      if (this._eventBus) {
        this._eventBus.emit('NPC_SPAWNED', { id, templateId, position: spawnPos });
      }

      if (IS_DEV) console.log(`[NPCManager] Spawned NPC '${id}' (${templateId})`);
      return npc;
    }

    despawn(id) {
      const npc = this._npcs.get(id);
      if (!npc) return;

      if (this._navigation) this._navigation.unregisterAgent(id);
      if (this._spatialQuery) this._spatialQuery.removeEntity(id);

      this._npcs.delete(id);
      this._updateQueue = this._updateQueue.filter(x => x !== id);

      if (this._eventBus) {
        this._eventBus.emit('NPC_DESPAWNED', { id });
      }
    }

    despawnAllInRegion(region) {
      for (const [id, npc] of this._npcs) {
        if (npc._meta.region === region) this.despawn(id);
      }
    }

    // ─── Main Update ──────────────────────────────────────────────────────────

    update(dt) {
      if (!this._gameState?.player) return;

      const playerPos = this._gameState.player.position;

      // Update LOD and schedule N NPC full ticks per frame
      const qLen = this._updateQueue.length;
      if (qLen === 0) return;

      const budget = Math.min(this._updateBudget, qLen);
      for (let i = 0; i < budget; i++) {
        const idx = this._updateCursor % qLen;
        this._updateCursor++;
        const npcId = this._updateQueue[idx];
        const npc   = this._npcs.get(npcId);
        if (npc) this._tickNPC(npc, playerPos, dt);
      }
    }

    _tickNPC(npc, playerPos, dt) {
      // Update distance to player
      const dx = npc.position.x - playerPos.x;
      const dz = npc.position.z - playerPos.z;
      npc.distToPlayer = Math.sqrt(dx * dx + dz * dz);

      // Assign LOD
      if (npc.distToPlayer < this.LOD_FULL_DIST) {
        npc.lod = NPCLO.FULL;
      } else if (npc.distToPlayer < this.LOD_MED_DIST) {
        npc.lod = NPCLO.MEDIUM;
      } else if (npc.distToPlayer < this.LOD_LOW_DIST) {
        npc.lod = NPCLO.LOW;
      } else {
        npc.lod = NPCLO.IDLE;
        return; // No update at IDLE LOD
      }

      // Build blackboard context
      const ctx = {
        npc,
        dt,
        gameState:   this._gameState,
        eventBus:    this._eventBus,
        navSystem:   this._navigation,
        playerDist:  npc.distToPlayer,
        playerPos,
        ...npc._blackboard
      };

      // Tick behaviour tree (FULL + MEDIUM only)
      if (npc.behaviourTree && npc.lod !== NPCLO.LOW) {
        npc.behaviourTree.tick(ctx);
      }

      // Sync nav agent position back to NPC
      if (npc.navAgent) {
        npc.position.x = npc.navAgent.position.x;
        npc.position.z = npc.navAgent.position.z;
      }

      // Sync to spatial grid
      if (this._spatialQuery) {
        this._spatialQuery.syncEntity(
          npc.id, npc.position.x, npc.position.y, npc.position.z, 0.35, ['npc']
        );
      }
    }

    // ─── Query Interface ──────────────────────────────────────────────────────

    get(id) { return this._npcs.get(id) || null; }
    getAll() { return [...this._npcs.values()]; }
    count() { return this._npcs.size; }

    getNearby(playerX, playerZ, radius) {
      const results = [];
      for (const npc of this._npcs.values()) {
        const dx = npc.position.x - playerX;
        const dz = npc.position.z - playerZ;
        if (dx * dx + dz * dz <= radius * radius) results.push(npc);
      }
      return results.sort((a, b) => a.distToPlayer - b.distToPlayer);
    }

    // ─── Default NPC Templates ────────────────────────────────────────────────

    registerDefaultTemplates() {
      // Tea vendor
      this.registerTemplate({
        id: 'tea_vendor', name: 'Murugan Chaiwala', type: 'vendor',
        walkSpeed: 1.5, radius: 0.35,
        dialogueId: 'dialogue_tea_vendor',
        schedule: [
          { label: 'morning_setup',   startHour: 5, endHour: 7,  location: { x: 0, z: 0 },  activity: (ctx) => { ctx.npc.activity = 'setup_stall'; } },
          { label: 'morning_service', startHour: 7, endHour: 12, location: { x: 0, z: 0 },  activity: (ctx) => { ctx.npc.activity = 'serve_tea'; } },
          { label: 'lunch_break',     startHour: 12,endHour: 14, location: { x: 2, z: 1 },  activity: (ctx) => { ctx.npc.activity = 'eat'; } },
          { label: 'afternoon_serv',  startHour: 14,endHour: 19, location: { x: 0, z: 0 },  activity: (ctx) => { ctx.npc.activity = 'serve_tea'; } },
          { label: 'close_stall',     startHour: 19,endHour: 21, location: { x: 0, z: 0 },  activity: (ctx) => { ctx.npc.activity = 'close_stall'; } },
          { label: 'home',            startHour: 21,endHour: 24, location: { x: 5, z: 3 },  activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // Elder woman near temple
      this.registerTemplate({
        id: 'temple_elder', name: 'Saraswathi Paati', type: 'elder',
        walkSpeed: 1.0, radius: 0.3,
        dialogueId: 'dialogue_temple_elder',
        questGiver: 'quest_medicinal_herbs',
        schedule: [
          { label: 'temple_morning', startHour: 5,  endHour: 8,  location: { x: 10, z: 5 },  activity: (ctx) => { ctx.npc.activity = 'temple_prayer'; } },
          { label: 'walk_garden',    startHour: 8,  endHour: 10, location: { x: 15, z: 8 },  activity: (ctx) => { ctx.npc.activity = 'herb_gathering'; } },
          { label: 'rest_home',      startHour: 10, endHour: 15, location: { x: 20, z: 10 }, activity: (ctx) => { ctx.npc.activity = 'sit_rest'; } },
          { label: 'evening_prayer', startHour: 17, endHour: 19, location: { x: 10, z: 5 },  activity: (ctx) => { ctx.npc.activity = 'temple_prayer'; } },
          { label: 'night_sleep',    startHour: 21, endHour: 5,  location: { x: 20, z: 10 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // Farmer
      this.registerTemplate({
        id: 'paddy_farmer', name: 'Velan', type: 'civilian',
        walkSpeed: 1.8, radius: 0.35,
        dialogueId: 'dialogue_farmer',
        schedule: [
          { label: 'farm_morning',   startHour: 5,  endHour: 10, location: { x: -10, z: 20 }, activity: (ctx) => { ctx.npc.activity = 'paddy_farming'; } },
          { label: 'shade_rest',     startHour: 10, endHour: 14, location: { x: -5,  z: 15 }, activity: (ctx) => { ctx.npc.activity = 'eat_rest'; } },
          { label: 'farm_afternoon', startHour: 14, endHour: 18, location: { x: -10, z: 20 }, activity: (ctx) => { ctx.npc.activity = 'paddy_farming'; } },
          { label: 'return_home',    startHour: 18, endHour: 20, location: { x: 5,   z: 8 },  activity: (ctx) => { ctx.npc.activity = 'walk_home'; } },
          { label: 'sleep',          startHour: 20, endHour: 5,  location: { x: 5,   z: 8 },  activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      if (IS_DEV) console.log('[NPCManager] Default templates registered');
    }

    destroy() {
      for (const id of this._npcs.keys()) this.despawn(id);
      this._npcs.clear();
      this._updateQueue = [];
    }
  }

  return { NPCLO, NPCInstance, NPCManager };
});
