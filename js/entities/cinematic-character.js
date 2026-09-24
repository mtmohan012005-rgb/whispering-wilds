/**
 * The Whispering Wilds (Kaattu Vazhi) - Cinematic Character Staging
 * Manages character orientation, natural conversation spacing, and gesture triggers.
 */

class CinematicCharacter {
  constructor(entityMesh, id = 'character') {
    this.mesh = entityMesh;
    this.id = id;
    this.currentGesture = 'idle';
  }

  faceTarget(targetPosition) {
    if (!this.mesh || !targetPosition) return;
    const dx = targetPosition.x - this.mesh.position.x;
    const dz = targetPosition.z - this.mesh.position.z;
    const angle = Math.atan2(dx, dz);
    this.mesh.rotation.y = angle;
  }

  playGesture(gestureName) {
    this.currentGesture = gestureName;
    console.log(`[CinematicCharacter] ${this.id} playing gesture: ${gestureName}`);
    // If procedural rig has gesture triggers
    if (this.mesh && this.mesh.userData && typeof this.mesh.userData.playGesture === 'function') {
      this.mesh.userData.playGesture(gestureName);
    }
  }

  setStandPosition(x, y, z) {
    if (!this.mesh) return;
    this.mesh.position.set(x, y, z);
  }
}

window.CinematicCharacter = CinematicCharacter;
