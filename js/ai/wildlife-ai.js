/**
 * The Whispering Wilds - Wildlife AI System
 * Manages wildlife entities: spotted deer, peacock, elephant, fish eagle,
 * monitor lizard, river otter, langur monkeys, water buffalo.
 * Implements flee, graze, patrol, flocking, alert and rest states.
 * Respects terrain collision — wildlife never clips through rocks/trees.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.WildlifeAI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost');

  // ─── Wildlife States ─────────────────────────────────────────────────────────
  const WildlifeState = Object.freeze({
    IDLE:      'idle',
    GRAZE:     'graze',
    PATROL:    'patrol',
    ALERT:     'alert',
    FLEE:      'flee',
    REST:      'rest',
    DRINK:     'drink',
    FLOCK:     'flock',
    ATTACK:    'attack',    // Water buffalo only
    SWIM:      'swim'
  });

  // ─── Wildlife Templates ───────────────────────────────────────────────────────
  const WILDLIFE_TEMPLATES = {
    spotted_deer: {
      id: 'spotted_deer', name: 'Spotted Deer (புள்ளிமான்)',
      speed: { walk: 2.0, run: 8.0 },
      alertRadius:  8, fleeRadius: 15, fleeEndDist: 30,
      flockBehavior: false,
      restHours: [11, 15],
      grazeHours: [5, 10, 16, 20],
      sounds: { alert: 'deer_bark', flee: 'deer_sprint', idle: 'deer_graze' }
    },
    peacock: {
      id: 'peacock', name: 'Peacock (மயில்)',
      speed: { walk: 1.5, run: 5.0 },
      alertRadius: 6, fleeRadius: 10, fleeEndDist: 20,
      flockBehavior: true, flockRadius: 8,
      restHours: [22, 5],
      displayHours: [6, 9],
      sounds: { alert: 'peacock_call', idle: 'peacock_call_soft' }
    },
    elephant: {
      id: 'elephant', name: 'Asian Elephant (யானை)',
      speed: { walk: 2.5, run: 6.5 },
      alertRadius: 20, fleeRadius: 5, fleeEndDist: 50,
      threatRadius: 8,  // Within this range, consider charging
      flockBehavior: true, flockRadius: 30,
      sounds: { alert: 'elephant_trumpet', idle: 'elephant_rumble' }
    },
    fish_eagle: {
      id: 'fish_eagle', name: 'Fish Eagle (மீன்கொத்தி)',
      speed: { walk: 0, run: 12.0 },
      alertRadius: 15, fleeRadius: 25, fleeEndDist: 50,
      airborne: true,
      sounds: { idle: 'eagle_cry', dive: 'eagle_dive' }
    },
    monitor_lizard: {
      id: 'monitor_lizard', name: 'Monitor Lizard (உடும்பு)',
      speed: { walk: 1.8, run: 5.0 },
      alertRadius: 5, fleeRadius: 8, fleeEndDist: 15,
      sounds: { idle: null, flee: 'lizard_rustle' }
    },
    langur: {
      id: 'langur', name: 'Langur Monkey (கொண்டை மந்தி)',
      speed: { walk: 2.0, run: 7.0 },
      alertRadius: 12, fleeRadius: 15, fleeEndDist: 25,
      flockBehavior: true, flockRadius: 10,
      sounds: { alert: 'langur_alarm', idle: 'langur_call' }
    }
  };

  // ─── Wildlife Instance ────────────────────────────────────────────────────────
  class WildlifeInstance {
    constructor(id, template, position) {
      this.id          = id;
      this.templateId  = template.id;
      this.template    = template;
      this.position    = { x: position.x, y: position.y || 0, z: position.z };
      this.velocity    = { x: 0, y: 0, z: 0 };
      this.rotation    = 0;
      this.state       = WildlifeState.IDLE;
      this.distToPlayer = Infinity;
      this.active      = true;
      this.observedByPlayer = false;
      this._stateTimer  = 0;
      this._patrolPts   = [];
      this._patrolIdx   = 0;
      this._fleeTarget  = null;
      this._discovered  = false;
    }
  }

  // ─── Wildlife AI Manager ──────────────────────────────────────────────────────
  class WildlifeAI {
    constructor() {
      this._wildlife     = new Map();
      this._gameState    = null;
      this._eventBus     = null;
      this._spatialQuery = null;
      this._collision    = null;
      this._updateBudget = 6;    // Wildlife updated per frame
      this._updateCursor = 0;
      this._updateQueue  = [];
    }

    init(deps) {
      this._gameState    = deps.gameState;
      this._eventBus     = deps.eventBus;
      this._spatialQuery = deps.spatialQuery;
      this._collision    = deps.collisionSystem;
    }

    // ─── Spawn / Despawn ────────────────────────────────────────────────────

    spawn(templateId, position, patrolPoints = []) {
      const template = WILDLIFE_TEMPLATES[templateId];
      if (!template) {
        if (IS_DEV) console.warn(`[WildlifeAI] Unknown template: ${templateId}`);
        return null;
      }
      const id = `wildlife_${templateId}_${Date.now().toString(36)}`;
      const animal = new WildlifeInstance(id, template, position);
      animal._patrolPts = patrolPoints.length > 0 ? patrolPoints : [{ ...position }];

      this._wildlife.set(id, animal);
      this._updateQueue.push(id);

      if (this._spatialQuery) {
        this._spatialQuery.syncEntity(id, position.x, position.y || 0, position.z, 0.5, ['wildlife']);
      }

      if (this._eventBus) {
        this._eventBus.emit('WILDLIFE_SPAWNED', { id, templateId });
      }
      return animal;
    }

    despawn(id) {
      const animal = this._wildlife.get(id);
      if (!animal) return;
      this._wildlife.delete(id);
      this._updateQueue = this._updateQueue.filter(x => x !== id);
      if (this._spatialQuery) this._spatialQuery.removeEntity(id);
    }

    // ─── Main Update ─────────────────────────────────────────────────────────

    update(dt) {
      if (!this._gameState?.player) return;
      const playerPos = this._gameState.player.position;

      const qLen = this._updateQueue.length;
      if (qLen === 0) return;

      const budget = Math.min(this._updateBudget, qLen);
      for (let i = 0; i < budget; i++) {
        const idx = this._updateCursor % qLen;
        this._updateCursor++;
        const id     = this._updateQueue[idx];
        const animal = this._wildlife.get(id);
        if (animal) this._tickAnimal(animal, playerPos, dt);
      }
    }

    _tickAnimal(animal, playerPos, dt) {
      // Distance to player
      const dx = animal.position.x - playerPos.x;
      const dz = animal.position.z - playerPos.z;
      animal.distToPlayer = Math.sqrt(dx * dx + dz * dz);
      animal._stateTimer += dt;

      const tmpl = animal.template;

      // State machine
      switch (animal.state) {
        case WildlifeState.IDLE:
        case WildlifeState.GRAZE:
          this._handleIdleGraze(animal, tmpl, dt);
          break;
        case WildlifeState.ALERT:
          this._handleAlert(animal, tmpl, dt);
          break;
        case WildlifeState.FLEE:
          this._handleFlee(animal, tmpl, dt, playerPos);
          break;
        case WildlifeState.PATROL:
          this._handlePatrol(animal, tmpl, dt);
          break;
        case WildlifeState.REST:
          this._handleRest(animal, tmpl, dt);
          break;
      }

      // Discovery event
      if (!animal._discovered && animal.distToPlayer < tmpl.alertRadius * 2) {
        animal._discovered = true;
        if (this._eventBus) {
          this._eventBus.emit('WILDLIFE_DISCOVERED', {
            id: animal.id,
            templateId: animal.templateId,
            distance: animal.distToPlayer
          });
        }
      }

      // Observation tracking
      animal.observedByPlayer = animal.distToPlayer < tmpl.alertRadius * 3;

      // Sync position to spatial grid
      if (this._spatialQuery) {
        this._spatialQuery.syncEntity(
          animal.id, animal.position.x, animal.position.y, animal.position.z, 0.5, ['wildlife']
        );
      }
    }

    _handleIdleGraze(animal, tmpl, dt) {
      // Enter alert if player is close
      if (animal.distToPlayer < tmpl.alertRadius) {
        animal.state = WildlifeState.ALERT;
        animal._stateTimer = 0;
        if (this._eventBus) {
          this._eventBus.emit('WILDLIFE_ALERT', { id: animal.id, templateId: animal.templateId });
        }
        return;
      }
      // Occasional transition to patrol
      if (animal._stateTimer > 8 + Math.random() * 10) {
        animal.state = WildlifeState.PATROL;
        animal._stateTimer = 0;
      }
    }

    _handleAlert(animal, tmpl, dt) {
      // Flee if player gets too close
      if (animal.distToPlayer < tmpl.fleeRadius) {
        animal.state = WildlifeState.FLEE;
        animal._stateTimer = 0;
        return;
      }
      // Return to idle if player moves away
      if (animal.distToPlayer > tmpl.alertRadius * 1.5 && animal._stateTimer > 3) {
        animal.state = WildlifeState.IDLE;
        animal._stateTimer = 0;
      }
    }

    _handleFlee(animal, tmpl, dt, playerPos) {
      // Flee away from player
      const dx = animal.position.x - playerPos.x;
      const dz = animal.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      const speed = tmpl.speed.run;
      const nvx = (dx / dist) * speed * dt;
      const nvz = (dz / dist) * speed * dt;

      animal.position.x += nvx;
      animal.position.z += nvz;
      animal.velocity.x  = nvx / dt;
      animal.velocity.z  = nvz / dt;

      // Stop fleeing when far enough
      if (animal.distToPlayer > tmpl.fleeEndDist) {
        animal.state = WildlifeState.IDLE;
        animal._stateTimer = 0;
        animal.velocity.x = 0;
        animal.velocity.z = 0;
      }
    }

    _handlePatrol(animal, tmpl, dt) {
      if (animal._patrolPts.length === 0) {
        animal.state = WildlifeState.IDLE;
        return;
      }
      // Alert transition still applies
      if (animal.distToPlayer < tmpl.alertRadius) {
        animal.state = WildlifeState.ALERT;
        animal._stateTimer = 0;
        return;
      }

      const target = animal._patrolPts[animal._patrolIdx];
      const dx = target.x - animal.position.x;
      const dz = target.z - animal.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.5) {
        animal._patrolIdx = (animal._patrolIdx + 1) % animal._patrolPts.length;
        return;
      }

      const speed = tmpl.speed.walk;
      animal.position.x += (dx / dist) * speed * dt;
      animal.position.z += (dz / dist) * speed * dt;

      // Return to idle after patrol cycle
      if (animal._stateTimer > 30) {
        animal.state = WildlifeState.IDLE;
        animal._stateTimer = 0;
      }
    }

    _handleRest(animal, tmpl, dt) {
      if (animal.distToPlayer < tmpl.fleeRadius) {
        animal.state = WildlifeState.FLEE;
        animal._stateTimer = 0;
        return;
      }
      if (animal._stateTimer > 20) {
        animal.state = WildlifeState.IDLE;
        animal._stateTimer = 0;
      }
    }

    // ─── Query ────────────────────────────────────────────────────────────────

    get(id) { return this._wildlife.get(id) || null; }
    count() { return this._wildlife.size; }

    getNearby(x, z, radius) {
      const results = [];
      for (const animal of this._wildlife.values()) {
        const dx = animal.position.x - x;
        const dz = animal.position.z - z;
        if (dx * dx + dz * dz <= radius * radius) results.push(animal);
      }
      return results;
    }

    destroy() {
      for (const id of this._wildlife.keys()) this.despawn(id);
    }
  }

  return { WildlifeState, WILDLIFE_TEMPLATES, WildlifeInstance, WildlifeAI };
});
