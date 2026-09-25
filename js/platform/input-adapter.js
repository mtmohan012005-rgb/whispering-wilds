/**
 * The Whispering Wilds - Input Adapter
 * Bridges existing InputManager. Strictly NO second input system.
 * Handles controller hotplug, focus loss reset, and input device availability.
 */
(function(root) {
  'use strict';

  class InputAdapter {
    constructor() {
      this.capabilities = {
        keyboard: true,
        mouse: true,
        gamepad: false,
        gamepadCount: 0,
        gamepadName: 'NONE'
      };
      this.detect();
      this.bindEvents();
    }

    detect() {
      if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
        try {
          const gamepads = navigator.getGamepads();
          let count = 0;
          let name = 'NONE';
          for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
              count++;
              if (name === 'NONE') name = gamepads[i].id || 'Generic Gamepad';
            }
          }
          this.capabilities.gamepad = count > 0;
          this.capabilities.gamepadCount = count;
          this.capabilities.gamepadName = name;
        } catch (_) {}
      }
    }

    bindEvents() {
      if (typeof window === 'undefined') return;

      window.addEventListener('gamepadconnected', (e) => {
        this.capabilities.gamepad = true;
        this.capabilities.gamepadCount++;
        this.capabilities.gamepadName = (e.gamepad && e.gamepad.id) || 'Connected Gamepad';
        console.log('[InputAdapter] Gamepad connected safely:', this.capabilities.gamepadName);
        if (root.InputManager && typeof root.InputManager.onGamepadChange === 'function') {
          root.InputManager.onGamepadChange(true, e.gamepad);
        }
      });

      window.addEventListener('gamepaddisconnected', (e) => {
        this.detect();
        console.log('[InputAdapter] Gamepad disconnected safely. Falling back to Keyboard/Mouse.');
        if (root.InputManager && typeof root.InputManager.onGamepadChange === 'function') {
          root.InputManager.onGamepadChange(false, e.gamepad);
        }
      });

      // Window focus/blur resets transient inputs to prevent sticky keys
      window.addEventListener('blur', () => {
        this.resetTransientInputs();
      });

      window.addEventListener('focus', () => {
        this.resetTransientInputs();
      });
    }

    resetTransientInputs() {
      if (root.InputManager && typeof root.InputManager.resetAllInputs === 'function') {
        root.InputManager.resetAllInputs();
      } else if (root.inputState) {
        // Fallback safety
        for (const k in root.inputState) {
          if (typeof root.inputState[k] === 'boolean') root.inputState[k] = false;
        }
      }
    }

    getCapabilities() {
      this.detect();
      return Object.assign({}, this.capabilities);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputAdapter;
  } else {
    root.InputAdapter = InputAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
