/**
 * PlatformController - Controller Hotplug & Glyph Detection
 * Detects gamepad vendor layouts, manages connection events, and provides neutral glyph mapping.
 */

(function(root) {
  const ControllerType = {
    KEYBOARD_MOUSE: 'KEYBOARD_MOUSE',
    XBOX: 'XBOX',
    PLAYSTATION: 'PLAYSTATION',
    GENERIC: 'GENERIC'
  };

  class PlatformController {
    constructor() {
      this.activeType = ControllerType.KEYBOARD_MOUSE;
      this.connectedGamepads = new Map();
      this.listeners = new Set();
    }

    init() {
      if (typeof window !== 'undefined') {
        window.addEventListener('gamepadconnected', (e) => this._onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this._onGamepadDisconnected(e));

        // Scan initially if already plugged in
        if (typeof navigator !== 'undefined' && navigator.getGamepads) {
          const pads = navigator.getGamepads();
          for (const pad of pads) {
            if (pad) this._onGamepadConnected({ gamepad: pad });
          }
        }
      }
      return this;
    }

    _detectType(idString = '') {
      const lower = idString.toLowerCase();
      if (lower.includes('xbox') || lower.includes('x-input') || lower.includes('045e')) {
        return ControllerType.XBOX;
      }
      if (lower.includes('playstation') || lower.includes('dualshock') || lower.includes('dualsense') || lower.includes('054c')) {
        return ControllerType.PLAYSTATION;
      }
      return ControllerType.GENERIC;
    }

    _onGamepadConnected(event) {
      const pad = event.gamepad;
      if (!pad) return;

      const type = this._detectType(pad.id);
      this.connectedGamepads.set(pad.index, { id: pad.id, type, index: pad.index });
      this.activeType = type;

      this._notifyListeners({ event: 'connected', padIndex: pad.index, type });
    }

    _onGamepadDisconnected(event) {
      const pad = event.gamepad;
      if (!pad) return;

      this.connectedGamepads.delete(pad.index);

      if (this.connectedGamepads.size > 0) {
        // Switch to next available gamepad
        const nextPad = this.connectedGamepads.values().next().value;
        this.activeType = nextPad.type;
      } else {
        // Fallback to keyboard & mouse
        this.activeType = ControllerType.KEYBOARD_MOUSE;
      }

      this._notifyListeners({ event: 'disconnected', padIndex: pad.index, activeType: this.activeType });
    }

    getGlyphForAction(actionName) {
      const isPS = this.activeType === ControllerType.PLAYSTATION;
      const isXbox = this.activeType === ControllerType.XBOX || this.activeType === ControllerType.GENERIC;

      const glyphMap = {
        interact: isPS ? 'Cross [✕]' : isXbox ? 'A [Ⓐ]' : '[E]',
        jump: isPS ? 'Cross [✕]' : isXbox ? 'A [Ⓐ]' : '[Space]',
        sprint: isPS ? 'L3 / R2' : isXbox ? 'Left Stick / RT' : '[Shift]',
        pause: isPS ? 'Options' : isXbox ? 'Menu' : '[Esc]',
        journal: isPS ? 'Touchpad' : isXbox ? 'View' : '[J]',
        map: isPS ? 'Share / Select' : isXbox ? 'Back' : '[M]'
      };

      return glyphMap[actionName] || '[Key]';
    }

    addListener(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    _notifyListeners(data) {
      this.listeners.forEach(fn => {
        try { fn(data); } catch (e) {}
      });
    }
  }

  PlatformController.ControllerType = ControllerType;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformController;
  } else {
    root.PlatformController = PlatformController;
  }
})(typeof window !== 'undefined' ? window : global);
