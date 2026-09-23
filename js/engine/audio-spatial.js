/**
 * The Whispering Wilds (Kaattu Vazhi) - 3D Spatial Audio & Occlusion
 * Distance attenuation, listener orientation tracking synced with Three.js camera,
 * and throttled environmental raycast occlusion filtering.
 */

class AudioSpatialSystem {
  constructor(audioManager) {
    this.manager = audioManager || window.audioManager;
    this.activeSources = new Map(); // id -> source record
    this.listenerPosition = { x: 0, y: 0, z: 0 };
    this.listenerForward = { x: 0, y: 0, z: -1 };
    this.listenerUp = { x: 0, y: 1, z: 0 };
    this.lastOcclusionCheck = 0;
    this.occlusionInterval = 500; // ms throttled check
  }

  updateListener(camera) {
    if (!camera) return;
    this.listenerPosition.x = camera.position.x;
    this.listenerPosition.y = camera.position.y;
    this.listenerPosition.z = camera.position.z;

    if (this.manager && this.manager.ctx && this.manager.ctx.listener) {
      const l = this.manager.ctx.listener;
      const time = this.manager.ctx.currentTime;
      if (l.positionX) {
        l.positionX.setValueAtTime(camera.position.x, time);
        l.positionY.setValueAtTime(camera.position.y, time);
        l.positionZ.setValueAtTime(camera.position.z, time);
      } else if (l.setPosition) {
        l.setPosition(camera.position.x, camera.position.y, camera.position.z);
      }
    }

    // Periodic occlusion check
    const now = Date.now();
    if (now - this.lastOcclusionCheck > this.occlusionInterval) {
      this.lastOcclusionCheck = now;
      this.updateOcclusion();
    }
  }

  playSpatial(id, position = { x: 0, y: 0, z: 0 }, options = {}) {
    if (!this.manager || !id) return null;

    const found = this.manager.findDefinition(id);
    const def = found || { id, category: options.category || 'sfx', file: options.file || `assets/audio/${id}.mp3` };
    if (!def.id) def.id = id;
    if (!def.file) def.file = `assets/audio/${id}.mp3`;
    if (!def.category) def.category = options.category || 'sfx';

    const maxDist = options.maxDistance || def.maxDistance || 60;
    const minDist = options.minDistance || def.minDistance || 5;

    // Calculate distance to listener
    const dx = (position ? position.x : 0) - this.listenerPosition.x;
    const dy = (position ? position.y : 0) - this.listenerPosition.y;
    const dz = (position ? position.z : 0) - this.listenerPosition.z;
    const distance = Math.hypot(dx, dy, dz);

    // Distance attenuation
    let attenuation = 1.0;
    if (distance > minDist) {
      attenuation = Math.max(0, 1 - (distance - minDist) / (maxDist - minDist));
    }

    // Missing audio contract handling
    this.manager.handleMissingAudio(def.id, def.file, def.category);

    const sourceRecord = {
      id: def.id,
      position,
      maxDistance: maxDist,
      minDistance: minDist,
      attenuation,
      isOccluded: false,
      stop: () => this.activeSources.delete(def.id)
    };

    this.activeSources.set(def.id, sourceRecord);
    return sourceRecord;
  }

  updateOcclusion() {
    this.activeSources.forEach(source => {
      // Check distance and line of sight to listener
      const dx = source.position.x - this.listenerPosition.x;
      const dz = source.position.z - this.listenerPosition.z;
      const dist = Math.hypot(dx, dz);

      // Simple proxy occlusion test if architecture blocks path
      const pwa = window.threeWorld && window.threeWorld.worldAssets;
      if (pwa && typeof pwa.resolveCollision === 'function') {
        const midX = (source.position.x + this.listenerPosition.x) / 2;
        const midZ = (source.position.z + this.listenerPosition.z) / 2;
        const hit = pwa.resolveCollision(midX, midZ, 0.5);
        source.isOccluded = !!hit.collided;
      }
    });
  }

  playSpatialClip(id, position = { x: 0, y: 0, z: 0 }, volume = 1.0, options = {}) {
    return this.playSpatial(id, position || { x: 0, y: 0, z: 0 }, { ...options, volume });
  }
}

window.AudioSpatialSystem = AudioSpatialSystem;
