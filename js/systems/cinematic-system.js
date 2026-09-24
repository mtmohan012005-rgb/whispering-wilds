/**
 * The Whispering Wilds (Kaattu Vazhi) - Master Cinematic System
 * Oversees cinematic states, input/movement lockouts, skip controls, and state restoration.
 * Strictly guarantees that character customization limits (max 5) and authoritative GameState
 * are NEVER bypassed or reset.
 */

window.CINEMATIC_STATE = {
  NONE: 'NONE',
  PREPARING: 'PREPARING',
  PLAYING: 'PLAYING',
  DIALOGUE: 'DIALOGUE',
  CHOICE: 'CHOICE',
  TRANSITION: 'TRANSITION',
  ENDING: 'ENDING',
  CANCELLED: 'CANCELLED',
  COMPLETE: 'COMPLETE'
};

class CinematicSystem {
  constructor(cinematicUI, cameraDirector) {
    this.ui = cinematicUI || (window.cinematicUI || new window.CinematicUI());
    this.camera = cameraDirector;
    this.state = window.CINEMATIC_STATE.NONE;
    this.currentScene = null;
    this.savedInputState = null;

    this.attachSkipListener();
  }

  attachSkipListener() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isPlaying()) {
        e.preventDefault();
        e.stopPropagation();
        this.skipCurrentScene();
      }
    });
  }

  isPlaying() {
    return this.state !== window.CINEMATIC_STATE.NONE &&
           this.state !== window.CINEMATIC_STATE.COMPLETE &&
           this.state !== window.CINEMATIC_STATE.CANCELLED;
  }

  startCinematic(scene) {
    if (this.isPlaying()) {
      console.warn(`[CinematicSystem] Cannot play scene "${scene.id}" - another scene is already running.`);
      return false;
    }

    this.currentScene = scene;
    this.state = window.CINEMATIC_STATE.PLAYING;

    // 1. Lock Player Movement & Inputs
    if (window.ThreePlayer) {
      window.ThreePlayer.isInputLocked = true;
      if (typeof window.ThreePlayer.stopMovement === 'function') {
        window.ThreePlayer.stopMovement();
      }
    }
    if (window.ThreeWorld && typeof window.ThreeWorld.clearInputState === 'function') {
      window.ThreeWorld.clearInputState();
    }

    // 2. Lock UI Navigation
    if (window.uiManager) {
      window.uiManager.isCinematicLocked = true;
    }

    // 3. Engage Letterboxing
    if (this.ui) {
      this.ui.showLetterbox();
    }

    // 4. Engage Camera Director
    if (this.camera) {
      this.camera.startCinematic('MEDIUM', 'player');
    }

    console.log(`[CinematicSystem] Cinematic lock engaged for: ${scene.id}`);
    return true;
  }

  stopCinematic() {
    if (!this.isPlaying()) return;

    this.state = window.CINEMATIC_STATE.COMPLETE;
    this.currentScene = null;

    // 1. Restore Player Movement
    if (window.ThreePlayer) {
      window.ThreePlayer.isInputLocked = false;
    }

    // 2. Unlock UI Navigation
    if (window.uiManager) {
      window.uiManager.isCinematicLocked = false;
    }

    // 3. Remove Letterboxing
    if (this.ui) {
      this.ui.hideLetterbox();
    }

    // 4. Restore Gameplay Camera
    if (this.camera) {
      this.camera.stopCinematic(0.8);
    }

    this.state = window.CINEMATIC_STATE.COMPLETE;
    setTimeout(() => {
      this.state = window.CINEMATIC_STATE.NONE;
    }, 850);

    console.log('[CinematicSystem] Cinematic finished. Full gameplay controls restored.');
  }

  skipCurrentScene() {
    if (!this.isPlaying()) return;
    console.log(`[CinematicSystem] Scene ${this.currentScene ? this.currentScene.id : ''} skipped by player.`);
    if (window.storySceneSystem && window.storySceneSystem.activeScene) {
      window.storySceneSystem.finishScene();
    } else {
      this.stopCinematic();
    }
  }

  static isPlaying() {
    return window.cinematicSystem ? window.cinematicSystem.isPlaying() : false;
  }
}

window.CinematicSystem = CinematicSystem;
