/**
 * The Whispering Wilds (Kaattu Vazhi) - Story Trigger Entity
 * Manages spatial, interaction, and quest milestone triggers.
 * Supports: enterArea, interactObject, discoverLocation, completeQuest, solvePuzzle, talkToNPC.
 */

class StoryTrigger {
  constructor(config = {}) {
    this.id = config.id || `trigger_${Date.now()}`;
    this.type = config.type || 'enterArea';
    this.targetSceneId = config.sceneId || null;
    this.bounds = config.bounds || { x: 0, z: 0, radius: 5.0 };
    this.oneShot = config.oneShot !== undefined ? config.oneShot : true;
    this.condition = typeof config.condition === 'function' ? config.condition : () => true;
    this.hasTriggered = false;
    this.lastTriggerTime = 0;
    this.cooldown = config.cooldown || 0;
  }

  check(playerPos, currentTime = Date.now()) {
    if (this.hasTriggered && this.oneShot) return false;
    if (this.cooldown > 0 && currentTime - this.lastTriggerTime < this.cooldown * 1000) return false;

    // Check spatial proximity if area trigger
    if (this.type === 'enterArea' && playerPos) {
      const dx = playerPos.x - this.bounds.x;
      const dz = playerPos.z - this.bounds.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > this.bounds.radius * this.bounds.radius) {
        return false;
      }
    }

    // Evaluate custom condition
    if (!this.condition()) return false;

    this.hasTriggered = true;
    this.lastTriggerTime = currentTime;
    return true;
  }

  reset() {
    this.hasTriggered = false;
  }
}

window.StoryTrigger = StoryTrigger;
