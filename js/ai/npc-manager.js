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
      // 1. Chennai Local Man — young adult, urban look, collared shirt and trousers
      this.registerTemplate({
        id: 'chennai_local_man', name: 'Karthik', type: 'civilian',
        walkSpeed: 2.0, radius: 0.35, height: 1.78,
        dialogueId: 'dialogue_chennai_local',
        meta: { region: 'george_town', archetype: 'urban_professional', referenceIndex: 1 },
        schedule: [
          { label: 'morning_commute', startHour: 7,  endHour: 9,  location: { x: 5, z: -10 }, activity: (ctx) => { ctx.npc.activity = 'commute_walk'; } },
          { label: 'office_work',     startHour: 9,  endHour: 13, location: { x: 8, z: -12 }, activity: (ctx) => { ctx.npc.activity = 'office_desk'; } },
          { label: 'lunch_break',     startHour: 13, endHour: 14, location: { x: 2, z: -5 },  activity: (ctx) => { ctx.npc.activity = 'eat_canteen'; } },
          { label: 'afternoon_work',  startHour: 14, endHour: 18, location: { x: 8, z: -12 }, activity: (ctx) => { ctx.npc.activity = 'office_desk'; } },
          { label: 'tea_and_walk',    startHour: 18, endHour: 20, location: { x: 0, z: 0 },   activity: (ctx) => { ctx.npc.activity = 'evening_stroll'; } },
          { label: 'home_rest',       startHour: 20, endHour: 7,  location: { x: 12, z: -20 },activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 2. Chennai Shopkeeper — middle-aged, checked shirt, spectacles, apron/pouch
      this.registerTemplate({
        id: 'chennai_shopkeeper', name: 'Murugesan Annan', type: 'vendor',
        walkSpeed: 1.3, radius: 0.42, height: 1.72,
        dialogueId: 'dialogue_tea_vendor',
        meta: { region: 'george_town', archetype: 'store_owner', referenceIndex: 2 },
        schedule: [
          { label: 'morning_setup',   startHour: 5,  endHour: 7,  location: { x: 0, z: 0 }, activity: (ctx) => { ctx.npc.activity = 'setup_stall'; } },
          { label: 'morning_service', startHour: 7,  endHour: 12, location: { x: 0, z: 0 }, activity: (ctx) => { ctx.npc.activity = 'serve_customers'; } },
          { label: 'afternoon_rest',  startHour: 12, endHour: 14, location: { x: 1, z: 1 }, activity: (ctx) => { ctx.npc.activity = 'sit_rest'; } },
          { label: 'evening_rush',    startHour: 14, endHour: 21, location: { x: 0, z: 0 }, activity: (ctx) => { ctx.npc.activity = 'serve_customers'; } },
          { label: 'accounts_close',  startHour: 21, endHour: 22, location: { x: 0, z: 0 }, activity: (ctx) => { ctx.npc.activity = 'count_cash'; } },
          { label: 'home_sleep',      startHour: 22, endHour: 5,  location: { x: 3, z: 2 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });
      // Backwards-compatible alias for existing tea_vendor calls
      this._templates.set('tea_vendor', this._templates.get('chennai_shopkeeper'));

      // 3. Auto-Rickshaw Driver — wiry adult male, plain t-shirt, towel on neck
      this.registerTemplate({
        id: 'auto_driver', name: 'Guna', type: 'civilian',
        walkSpeed: 2.1, radius: 0.35, height: 1.74,
        dialogueId: 'dialogue_auto_driver',
        meta: { region: 'george_town', archetype: 'transit_operator', referenceIndex: 3 },
        schedule: [
          { label: 'morning_cleaning', startHour: 6,  endHour: 7,  location: { x: -4, z: 6 },  activity: (ctx) => { ctx.npc.activity = 'wipe_auto'; } },
          { label: 'morning_fares',    startHour: 7,  endHour: 12, location: { x: -10, z: 15 },activity: (ctx) => { ctx.npc.activity = 'drive_fares'; } },
          { label: 'chai_chat',        startHour: 12, endHour: 13, location: { x: 0, z: 0 },   activity: (ctx) => { ctx.npc.activity = 'drink_tea'; } },
          { label: 'stand_wait',       startHour: 13, endHour: 17, location: { x: -4, z: 6 },  activity: (ctx) => { ctx.npc.activity = 'stand_idle'; } },
          { label: 'evening_fares',    startHour: 17, endHour: 22, location: { x: -15, z: 25 },activity: (ctx) => { ctx.npc.activity = 'drive_fares'; } },
          { label: 'park_sleep',       startHour: 22, endHour: 6,  location: { x: -6, z: 4 },  activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 4. Village Farmer — weathered skin, white veshti, cotton shirt, shoulder thundu
      this.registerTemplate({
        id: 'paddy_farmer', name: 'Velan', type: 'civilian',
        walkSpeed: 1.7, radius: 0.35, height: 1.70,
        dialogueId: 'dialogue_farmer',
        meta: { region: 'cauvery_delta', archetype: 'delta_agriculturist', referenceIndex: 4 },
        schedule: [
          { label: 'farm_morning',   startHour: 5,  endHour: 10, location: { x: -20, z: 30 }, activity: (ctx) => { ctx.npc.activity = 'paddy_farming'; } },
          { label: 'shade_rest',     startHour: 10, endHour: 14, location: { x: -15, z: 22 }, activity: (ctx) => { ctx.npc.activity = 'eat_rest'; } },
          { label: 'farm_afternoon', startHour: 14, endHour: 18, location: { x: -20, z: 30 }, activity: (ctx) => { ctx.npc.activity = 'paddy_farming'; } },
          { label: 'return_home',    startHour: 18, endHour: 20, location: { x: 5,   z: 8 },  activity: (ctx) => { ctx.npc.activity = 'walk_home'; } },
          { label: 'sleep',          startHour: 20, endHour: 5,  location: { x: 5,   z: 8 },  activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 5. Fisherman — muscular adult male, checked lungi, head wrap, coiled net/basket
      this.registerTemplate({
        id: 'coastal_fisherman', name: 'Selvam', type: 'civilian',
        walkSpeed: 1.9, radius: 0.38, height: 1.77,
        dialogueId: 'dialogue_fisherman',
        meta: { region: 'mamallapuram', archetype: 'marine_harvester', referenceIndex: 5 },
        schedule: [
          { label: 'pre_dawn_launch', startHour: 3,  endHour: 8,  location: { x: 40, z: -50 }, activity: (ctx) => { ctx.npc.activity = 'sea_fishing'; } },
          { label: 'beach_landing',   startHour: 8,  endHour: 10, location: { x: 30, z: -40 }, activity: (ctx) => { ctx.npc.activity = 'unload_catch'; } },
          { label: 'mend_nets',       startHour: 10, endHour: 14, location: { x: 25, z: -35 }, activity: (ctx) => { ctx.npc.activity = 'mend_nets'; } },
          { label: 'shore_market',    startHour: 14, endHour: 18, location: { x: 20, z: -30 }, activity: (ctx) => { ctx.npc.activity = 'sell_fish'; } },
          { label: 'home_rest',       startHour: 18, endHour: 3,  location: { x: 18, z: -25 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 6. Tea-Estate Worker — practical work skirt, head scarf, cane tea basket on back
      this.registerTemplate({
        id: 'tea_estate_worker', name: 'Meenakshi', type: 'civilian',
        walkSpeed: 1.6, radius: 0.35, height: 1.63,
        dialogueId: 'dialogue_tea_estate_worker',
        meta: { region: 'nilgiris', archetype: 'plantation_harvester', referenceIndex: 6 },
        schedule: [
          { label: 'muster_roll',    startHour: 7,  endHour: 8,  location: { x: -30, z: -40 }, activity: (ctx) => { ctx.npc.activity = 'plantation_assembly'; } },
          { label: 'morning_pluck',  startHour: 8,  endHour: 12, location: { x: -38, z: -55 }, activity: (ctx) => { ctx.npc.activity = 'pluck_tea_leaves'; } },
          { label: 'lunch_break',    startHour: 12, endHour: 13, location: { x: -32, z: -45 }, activity: (ctx) => { ctx.npc.activity = 'eat_lunch'; } },
          { label: 'afternoon_pluck',startHour: 13, endHour: 16, location: { x: -42, z: -60 }, activity: (ctx) => { ctx.npc.activity = 'pluck_tea_leaves'; } },
          { label: 'weigh_in',       startHour: 16, endHour: 18, location: { x: -30, z: -40 }, activity: (ctx) => { ctx.npc.activity = 'weigh_leaves'; } },
          { label: 'home_quarters',  startHour: 18, endHour: 7,  location: { x: -25, z: -35 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 7. Female Villager — young adult woman, cotton saree, natural hairstyle
      this.registerTemplate({
        id: 'female_villager', name: 'Kavitha', type: 'civilian',
        walkSpeed: 1.7, radius: 0.34, height: 1.65,
        dialogueId: 'dialogue_female_villager',
        meta: { region: 'cauvery_delta', archetype: 'rural_homemaker', referenceIndex: 7 },
        schedule: [
          { label: 'kolam_morning',  startHour: 5,  endHour: 7,  location: { x: 12, z: 14 }, activity: (ctx) => { ctx.npc.activity = 'draw_kolam'; } },
          { label: 'water_fetch',    startHour: 7,  endHour: 9,  location: { x: 18, z: 20 }, activity: (ctx) => { ctx.npc.activity = 'carry_water'; } },
          { label: 'household_work', startHour: 9,  endHour: 14, location: { x: 12, z: 14 }, activity: (ctx) => { ctx.npc.activity = 'domestic_chores'; } },
          { label: 'temple_visit',   startHour: 16, endHour: 18, location: { x: 10, z: 5 },  activity: (ctx) => { ctx.npc.activity = 'temple_prayer'; } },
          { label: 'evening_family', startHour: 18, endHour: 21, location: { x: 12, z: 14 }, activity: (ctx) => { ctx.npc.activity = 'family_time'; } },
          { label: 'sleep',          startHour: 21, endHour: 5,  location: { x: 12, z: 14 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 8. Elderly Woman — 60s-70s, gray bun, simple cotton saree, walking stick, wrinkles
      this.registerTemplate({
        id: 'village_elder_woman', name: 'Saraswathi Paati', type: 'elder',
        walkSpeed: 0.9, radius: 0.32, height: 1.55,
        dialogueId: 'dialogue_temple_elder',
        questGiver: 'quest_medicinal_herbs',
        meta: { region: 'cauvery_delta', archetype: 'village_matriarch', referenceIndex: 8 },
        schedule: [
          { label: 'temple_morning', startHour: 5,  endHour: 8,  location: { x: 10, z: 5 },  activity: (ctx) => { ctx.npc.activity = 'temple_prayer'; } },
          { label: 'walk_garden',    startHour: 8,  endHour: 10, location: { x: 15, z: 8 },  activity: (ctx) => { ctx.npc.activity = 'herb_gathering'; } },
          { label: 'thinnai_rest',   startHour: 10, endHour: 16, location: { x: 20, z: 10 }, activity: (ctx) => { ctx.npc.activity = 'sit_thinnai'; } },
          { label: 'evening_prayer', startHour: 17, endHour: 19, location: { x: 10, z: 5 },  activity: (ctx) => { ctx.npc.activity = 'temple_prayer'; } },
          { label: 'night_sleep',    startHour: 20, endHour: 5,  location: { x: 20, z: 10 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });
      // Backwards-compatible alias for existing temple_elder calls
      this._templates.set('temple_elder', this._templates.get('village_elder_woman'));

      // 9. Young Student — teen/young adult, college casual wear, backpack
      this.registerTemplate({
        id: 'young_student', name: 'Anand', type: 'civilian',
        walkSpeed: 2.2, radius: 0.33, height: 1.70,
        dialogueId: 'dialogue_young_student',
        meta: { region: 'george_town', archetype: 'curious_scholar', referenceIndex: 9 },
        schedule: [
          { label: 'morning_bus',   startHour: 7,  endHour: 9,  location: { x: -8, z: -5 }, activity: (ctx) => { ctx.npc.activity = 'walk_brisk'; } },
          { label: 'college_class', startHour: 9,  endHour: 13, location: { x: -14, z: -10 },activity: (ctx) => { ctx.npc.activity = 'study_listen'; } },
          { label: 'canteen_hangout',startHour: 13, endHour: 14, location: { x: -6, z: -4 }, activity: (ctx) => { ctx.npc.activity = 'socialize'; } },
          { label: 'library_study', startHour: 14, endHour: 17, location: { x: -16, z: -12 },activity: (ctx) => { ctx.npc.activity = 'read_books'; } },
          { label: 'tea_debates',   startHour: 17, endHour: 20, location: { x: 0, z: 0 },    activity: (ctx) => { ctx.npc.activity = 'discuss_ideas'; } },
          { label: 'home_study',    startHour: 20, endHour: 24, location: { x: -5, z: 12 },  activity: (ctx) => { ctx.npc.activity = 'study_night'; } }
        ]
      });

      // 10. Heritage Artisan — middle-aged craftsman, traditional dhoti, pottery/craft
      this.registerTemplate({
        id: 'heritage_artisan', name: 'Kandhasamy Sthapathi', type: 'civilian',
        walkSpeed: 1.4, radius: 0.36, height: 1.68,
        dialogueId: 'dialogue_artisan',
        meta: { region: 'thanjavur', archetype: 'master_craftsman', referenceIndex: 10 },
        schedule: [
          { label: 'clay_prep',     startHour: 6,  endHour: 8,  location: { x: 22, z: 35 }, activity: (ctx) => { ctx.npc.activity = 'prepare_clay'; } },
          { label: 'wheel_shaping', startHour: 8,  endHour: 12, location: { x: 24, z: 36 }, activity: (ctx) => { ctx.npc.activity = 'spin_wheel'; } },
          { label: 'lunch_rest',    startHour: 12, endHour: 14, location: { x: 20, z: 32 }, activity: (ctx) => { ctx.npc.activity = 'eat_rest'; } },
          { label: 'kiln_firing',   startHour: 14, endHour: 18, location: { x: 26, z: 38 }, activity: (ctx) => { ctx.npc.activity = 'tend_kiln'; } },
          { label: 'craft_display', startHour: 18, endHour: 20, location: { x: 21, z: 33 }, activity: (ctx) => { ctx.npc.activity = 'inspect_wares'; } },
          { label: 'night_rest',    startHour: 20, endHour: 6,  location: { x: 19, z: 30 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 11. Festival Participant — festive silk veshti, flower garland, joyful expression
      this.registerTemplate({
        id: 'festival_participant', name: 'Sundaram', type: 'civilian',
        walkSpeed: 1.8, radius: 0.36, height: 1.76,
        dialogueId: 'dialogue_festival_devotee',
        meta: { region: 'chettinad', archetype: 'festive_devotee', referenceIndex: 11 },
        schedule: [
          { label: 'morning_snanam',   startHour: 5,  endHour: 7,  location: { x: 8, z: 18 },  activity: (ctx) => { ctx.npc.activity = 'temple_tank_bath'; } },
          { label: 'puja_procession',  startHour: 7,  endHour: 12, location: { x: 10, z: 5 },  activity: (ctx) => { ctx.npc.activity = 'festival_walk'; } },
          { label: 'annadhanam_feast', startHour: 12, endHour: 15, location: { x: 15, z: 12 }, activity: (ctx) => { ctx.npc.activity = 'feast_service'; } },
          { label: 'evening_utsavam',  startHour: 17, endHour: 22, location: { x: 10, z: 5 },  activity: (ctx) => { ctx.npc.activity = 'celebrate_music'; } },
          { label: 'night_rest',       startHour: 22, endHour: 5,  location: { x: 14, z: 22 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      // 12. Mountain Worker — thick wool shawl, sturdy trousers, boots, climbing tool
      this.registerTemplate({
        id: 'mountain_worker', name: 'Babu', type: 'civilian',
        walkSpeed: 1.8, radius: 0.40, height: 1.75,
        dialogueId: 'dialogue_mountain_guide',
        meta: { region: 'nilgiris', archetype: 'highland_ranger', referenceIndex: 12 },
        schedule: [
          { label: 'dawn_patrol',     startHour: 5,  endHour: 9,  location: { x: -50, z: -70 }, activity: (ctx) => { ctx.npc.activity = 'trail_inspection'; } },
          { label: 'wood_gathering',  startHour: 9,  endHour: 12, location: { x: -58, z: -80 }, activity: (ctx) => { ctx.npc.activity = 'gather_wood'; } },
          { label: 'campfire_lunch',  startHour: 12, endHour: 14, location: { x: -48, z: -65 }, activity: (ctx) => { ctx.npc.activity = 'shelter_rest'; } },
          { label: 'shola_track',     startHour: 14, endHour: 18, location: { x: -62, z: -90 }, activity: (ctx) => { ctx.npc.activity = 'ridge_survey'; } },
          { label: 'cabin_hearth',    startHour: 18, endHour: 21, location: { x: -45, z: -60 }, activity: (ctx) => { ctx.npc.activity = 'hearth_warmth'; } },
          { label: 'mountain_sleep',  startHour: 21, endHour: 5,  location: { x: -45, z: -60 }, activity: (ctx) => { ctx.npc.activity = 'sleep'; } }
        ]
      });

      if (IS_DEV) console.log('[NPCManager] All 12 production templates registered');
    }

    destroy() {
      for (const id of this._npcs.keys()) this.despawn(id);
      this._npcs.clear();
      this._updateQueue = [];
    }
  }

  return { NPCLO, NPCInstance, NPCManager };
});
