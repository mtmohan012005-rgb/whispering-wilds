/**
 * The Whispering Wilds (Kaattu Vazhi) - Wildlife Audio System
 * Species-specific acoustic vocalisations (Nilgiri Tahr, Langur, Elephant, Peafowl, etc.),
 * distance falloff, behavior triggers, and interval throttling.
 */

class WildlifeAudioSystem {
  constructor(audioManager) {
    this.manager = audioManager || window.audioManager;
    this.lastCallTimes = new Map(); // entityId -> timestamp
    this.minCallInterval = 8000; // ms minimum between calls per animal
  }

  triggerCall(species, behavior, position = { x: 0, y: 0, z: 0 }, entityId = null) {
    if (!this.manager || !this.manager.data || !this.manager.data.wildlife) return;

    const id = entityId || `${species}_${behavior}`;
    const now = Date.now();
    const lastTime = this.lastCallTimes.get(id) || 0;

    if (now - lastTime < this.minCallInterval) {
      return; // Throttled to prevent cacophony
    }
    this.lastCallTimes.set(id, now);

    const speciesData = this.manager.data.wildlife[species];
    if (!speciesData) return;

    const soundPath = speciesData[behavior] || speciesData.idle || speciesData.call;
    if (soundPath) {
      this.manager.playSpatial(`wildlife_${species}_${behavior}`, position, {
        category: 'wildlife',
        volume: speciesData.volume || 0.7,
        maxDistance: speciesData.maxDistance || 60
      });
    }
  }

  update(wildlifeEntities, listenerPos) {
    if (!Array.isArray(wildlifeEntities)) return;
    // Iterate entities and trigger natural ambient calls when within audible range
    wildlifeEntities.forEach(ent => {
      if (!ent.isAlive) return;
      const dx = ent.x - (listenerPos ? listenerPos.x : 0);
      const dz = (ent.z !== undefined ? ent.z : ent.y) - (listenerPos ? listenerPos.z : 0);
      const dist = Math.hypot(dx, dz);

      if (dist < 50 && Math.random() < 0.002) {
        this.triggerCall(ent.species || ent.type, ent.state || 'idle', { x: ent.x, y: 0, z: ent.z || ent.y }, ent.id);
      }
    });
  }
}

window.WildlifeAudioSystem = WildlifeAudioSystem;
