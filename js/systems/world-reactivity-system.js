// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WORLD REACTIVITY SYSTEM
// Environmental event broadcasting, NPC commentary, wildlife startle & navigation
// ============================================================================

(function() {
  'use strict';

  class WorldReactivitySystem {
    constructor() {
      this.listeners = new Map();
      this.recentEvents = [];
    }

    notifyInteractionCompleted(prop, interactionResult) {
      if (!prop || !interactionResult) return;

      const event = {
        propId: prop.id,
        propType: prop.type,
        action: interactionResult.action,
        position: { ...prop.position },
        timestamp: Date.now()
      };
      this.recentEvents.push(event);
      if (this.recentEvents.length > 50) this.recentEvents.shift();

      // 1. Notify Nearby Wildlife
      this._triggerWildlifeReaction(prop, interactionResult);

      // 2. Notify Nearby NPCs
      this._triggerNPCReaction(prop, interactionResult);

      // 3. Quest & Journal Discovery
      this._checkDiscoveries(prop);
    }

    notifyNavigationPathChanged(position, isPassable) {
      // Notify LivingWorld navigation mesh
      if (window.livingWorld && window.livingWorld.onObstacleStateChanged) {
        window.livingWorld.onObstacleStateChanged(position, isPassable);
      }
      if (window.threeWorld && window.threeWorld.updateNavMeshObstacle) {
        window.threeWorld.updateNavMeshObstacle(position, isPassable);
      }
    }

    notifyLampStateChanged(lampId, isLit, position) {
      // Dynamic lighting reaction for ambient living world
      if (window.livingWorld && window.livingWorld.onLampStateChanged) {
        window.livingWorld.onLampStateChanged(lampId, isLit, position);
      }
    }

    notifyPropDestroyed(propId, debrisConfig, position) {
      // Startle nearby wildlife with loud break
      this._startleWildlifeNearby(position, 14.0);

      // Audio shatter
      if (window.gameAudio) {
        window.gameAudio.playPropSound?.('pot_shatter_clay', position);
      }
    }

    _triggerWildlifeReaction(prop, result) {
      // Loud interactions startle birds and flighty fauna
      const loudActions = ['OPEN', 'ACTIVATE', 'PUSH'];
      if (loudActions.includes(result.action)) {
        this._startleWildlifeNearby(prop.position, 12.0);
      }
    }

    _startleWildlifeNearby(pos, radius = 10.0) {
      if (!window.livingWorld?.wildlife) return;

      window.livingWorld.wildlife.forEach(animal => {
        const ax = animal.x || animal.position?.x || 0;
        const az = animal.z || animal.position?.z || (animal.y || 0);
        const dist = Math.hypot(ax - pos.x, az - pos.z);

        if (dist < radius) {
          // Flight response for skittish species (egrets, kingfishers, deer, tahr)
          const species = animal.speciesId || animal.type || '';
          if (species.includes('egret') || species.includes('kingfisher') || species.includes('peafowl')) {
            if (animal.startle) animal.startle('fly');
          } else if (species.includes('tahr') || species.includes('deer')) {
            if (animal.startle) animal.startle('flee');
          } else if (species.includes('langur')) {
            if (animal.startle) animal.startle('alert');
          }
          // Cattle & elephants remain calm
        }
      });
    }

    _triggerNPCReaction(prop, result) {
      if (!window.livingWorld?.npcs) return;

      window.livingWorld.npcs.forEach(npc => {
        const nx = npc.x || npc.position?.x || 0;
        const nz = npc.z || npc.position?.z || (npc.y || 0);
        const dist = Math.hypot(nx - prop.position.x, nz - prop.position.z);

        if (dist < 8.0) {
          // NPC glances or speaks ambient barks
          if (prop.type === 'door' && result.action === 'OPEN') {
            if (npc.sayAmbientBark) npc.sayAmbientBark('door_opened');
          } else if (prop.type === 'well' && result.action === 'WATER_INTERACT') {
            if (npc.sayAmbientBark) npc.sayAmbientBark('well_used');
          }
        }
      });
    }

    _checkDiscoveries(prop) {
      if (prop.type === 'cultural' && window.fieldJournal) {
        window.fieldJournal.recordCulturalDiscovery?.(prop.id, prop.name);
      }
    }
  }

  window.WorldReactivitySystem = new WorldReactivitySystem();
  console.log('[WorldReactivitySystem] Initialized world reactivity & environmental response engine.');
})();
