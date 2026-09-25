/**
 * The Whispering Wilds (Kaattu Vazhi) - Game Mode Controller
 * Single authoritative state machine managing discrete game execution modes,
 * input masks, simulation gating, camera locking, and UI modal states.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const modeSystem = factory();
    root.GameMode = modeSystem.MODES;
    root.GameModeManager = modeSystem.manager;
    if (typeof window !== 'undefined') {
      window.GameMode = modeSystem.MODES;
      window.GameModeManager = modeSystem.manager;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MODES = Object.freeze({
    BOOT: 'BOOT',
    MAIN_MENU: 'MAIN_MENU',
    LOADING: 'LOADING',
    GAMEPLAY: 'GAMEPLAY',
    DIALOGUE: 'DIALOGUE',
    CUTSCENE: 'CUTSCENE',
    PHOTO_MODE: 'PHOTO_MODE',
    INVENTORY: 'INVENTORY',
    MAP: 'MAP',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    MULTIPLAYER: 'MULTIPLAYER',
    DEVELOPER: 'DEVELOPER'
  });

  // System permissions and input gating per mode
  const MODE_PERMISSIONS = Object.freeze({
    [MODES.BOOT]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: false,
      allowDialogueInput: false
    },
    [MODES.MAIN_MENU]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.LOADING]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.GAMEPLAY]: {
      canMove: true,
      canLook: true,
      canInteract: true,
      canSimulateWorld: true,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.DIALOGUE]: {
      canMove: false,
      canLook: true,
      canInteract: false,
      canSimulateWorld: true,
      isUIVisible: true,
      allowDialogueInput: true
    },
    [MODES.CUTSCENE]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: true,
      isUIVisible: false,
      allowDialogueInput: false
    },
    [MODES.PHOTO_MODE]: {
      canMove: false,
      canLook: true,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.INVENTORY]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.MAP]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.PAUSED]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.GAME_OVER]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.MULTIPLAYER]: {
      canMove: false,
      canLook: false,
      canInteract: false,
      canSimulateWorld: false,
      isUIVisible: true,
      allowDialogueInput: false
    },
    [MODES.DEVELOPER]: {
      canMove: true,
      canLook: true,
      canInteract: true,
      canSimulateWorld: true,
      isUIVisible: true,
      allowDialogueInput: true
    }
  });

  class GameModeManager {
    constructor() {
      this.currentMode = MODES.BOOT;
      this.previousMode = MODES.BOOT;
      this._history = [];
    }

    get mode() {
      return this.currentMode;
    }

    get permissions() {
      return MODE_PERMISSIONS[this.currentMode] || MODE_PERMISSIONS[MODES.GAMEPLAY];
    }

    canMove() {
      return this.permissions.canMove;
    }

    canLook() {
      return this.permissions.canLook;
    }

    canInteract() {
      return this.permissions.canInteract;
    }

    canSimulateWorld() {
      return this.permissions.canSimulateWorld;
    }

    isUIVisible() {
      return this.permissions.isUIVisible;
    }

    allowDialogueInput() {
      return this.permissions.allowDialogueInput;
    }

    setMode(newMode) {
      if (!MODES[newMode]) {
        console.warn(`[GameModeManager] Unknown game mode: '${newMode}'`);
        return false;
      }

      if (this.currentMode === newMode) return true;

      this.previousMode = this.currentMode;
      this.currentMode = newMode;
      this._history.push({ from: this.previousMode, to: newMode, timestamp: Date.now() });

      // Keep history bounded
      if (this._history.length > 50) this._history.shift();

      // Emit event
      if (typeof window !== 'undefined' && window.EventBus) {
        window.EventBus.emit('GAME_MODE_CHANGED', {
          current: this.currentMode,
          previous: this.previousMode,
          permissions: this.permissions
        });
      }

      return true;
    }

    restorePreviousMode() {
      return this.setMode(this.previousMode || MODES.GAMEPLAY);
    }
  }

  const manager = new GameModeManager();
  return { MODES, manager };
});
