/**
 * The Whispering Wilds (Kaattu Vazhi) - Core Authoritative Input Manager
 * Bridges platform input (Keyboard, Mouse, Gamepad) into deterministic action intents.
 * Prevents key repeat duplication, respects active GameMode permissions,
 * and eliminates duplicate global window event listeners.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const inputMgr = factory();
    root.CoreInputManager = inputMgr;
    if (typeof window !== 'undefined') {
      window.CoreInputManager = inputMgr;
      // Retain compatibility with legacy InputManager references
      if (!window.InputManager) {
        window.InputManager = inputMgr;
      }
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Standard Canonical Actions
  const ACTIONS = Object.freeze({
    MOVE: 'move',
    LOOK: 'look',
    JUMP: 'jump',
    CROUCH: 'crouch',
    SPRINT: 'sprint',
    INTERACT: 'interact',
    INVENTORY: 'inventory',
    JOURNAL: 'journal',
    MAP: 'map',
    CAMERA: 'camera',
    PHOTO: 'photo',
    PAUSE: 'pause',
    VEHICLE: 'vehicle',
    PRIMARY: 'primary',
    SECONDARY: 'secondary'
  });

  class AuthoritativeInputManager {
    constructor() {
      this.ACTIONS = ACTIONS;

      // Current Continuous State
      this.movement = { x: 0, y: 0 }; // [-1..1]
      this.lookDelta = { x: 0, y: 0 };
      this.isSprinting = false;
      this.isCrouching = false;

      // Discrete Action States
      this._actionDown = new Map();
      this._actionPressed = new Map();
      this._actionReleased = new Map();
      this._actionConsumed = new Set();

      // Keyboard key tracking with anti-repeat protection
      this._keysDown = new Set();
      this._keysPressedThisFrame = new Set();
      this._keysHandled = new Set();

      // Mouse state
      this._mouseButtons = new Set();
      this._mouseDelta = { x: 0, y: 0 };

      // Subscribed action listeners
      this._actionListeners = new Map();

      this._initialized = false;
      this._initListeners();
    }

    _initListeners() {
      if (typeof window === 'undefined' || this._initialized) return;
      this._initialized = true;

      window.addEventListener('keydown', (e) => this._onKeyDown(e), { passive: false });
      window.addEventListener('keyup', (e) => this._onKeyUp(e), { passive: true });
      window.addEventListener('mousedown', (e) => this._onMouseDown(e), { passive: true });
      window.addEventListener('mouseup', (e) => this._onMouseUp(e), { passive: true });
      window.addEventListener('mousemove', (e) => this._onMouseMove(e), { passive: true });
      window.addEventListener('blur', () => this.resetInputs());
    }

    _onKeyDown(e) {
      // Ignore if text input element has focus
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }

      // Prevent key repeat from firing one-shot actions repeatedly
      if (e.repeat) return;

      const code = e.code;
      this._keysDown.add(code);
      this._keysPressedThisFrame.add(code);

      // Handle pause directly
      if (code === 'Escape') {
        this._triggerAction(ACTIONS.PAUSE);
      }
    }

    _onKeyUp(e) {
      const code = e.code;
      this._keysDown.delete(code);
      this._keysHandled.delete(code);
    }

    _onMouseDown(e) {
      this._mouseButtons.add(e.button);
      if (e.button === 0) {
        this._triggerAction(ACTIONS.PRIMARY);
      } else if (e.button === 2) {
        this._triggerAction(ACTIONS.SECONDARY);
      }
    }

    _onMouseUp(e) {
      this._mouseButtons.delete(e.button);
    }

    _onMouseMove(e) {
      this._mouseDelta.x += e.movementX || 0;
      this._mouseDelta.y += e.movementY || 0;
    }

    _triggerAction(action) {
      // Check mode permission
      const modeMgr = typeof window !== 'undefined' ? window.GameModeManager : null;
      if (modeMgr) {
        if (action === ACTIONS.MOVE && !modeMgr.canMove()) return;
        if (action === ACTIONS.INTERACT && !modeMgr.canInteract()) return;
        if (action === ACTIONS.LOOK && !modeMgr.canLook()) return;
      }

      const cbs = this._actionListeners.get(action);
      if (cbs) {
        cbs.forEach(cb => {
          try { cb(); } catch (err) { console.error(`[InputManager] Error in action '${action}':`, err); }
        });
      }
    }

    /**
     * Called at the start of each frame by FrameScheduler
     */
    update(dt = 0.016) {
      // 1. Query legacy input manager if available for gamepad and custom bindings
      const legacyMgr = typeof window !== 'undefined' ? window.CentralInputManager || window.inputManager : null;

      // 2. Calculate directional movement
      let mx = 0;
      let my = 0;

      if (this._keysDown.has('KeyW') || this._keysDown.has('ArrowUp')) my += 1;
      if (this._keysDown.has('KeyS') || this._keysDown.has('ArrowDown')) my -= 1;
      if (this._keysDown.has('KeyA') || this._keysDown.has('ArrowLeft')) mx -= 1;
      if (this._keysDown.has('KeyD') || this._keysDown.has('ArrowRight')) mx += 1;

      // If legacy has analog vector, blend/use
      if (legacyMgr && typeof legacyMgr.getMovementVector === 'function') {
        const v = legacyMgr.getMovementVector();
        if (v && (Math.abs(v.x) > 0.05 || Math.abs(v.y) > 0.05)) {
          mx = v.x;
          my = v.y;
        }
      }

      // Normalize diagonal
      const len = Math.hypot(mx, my);
      if (len > 1.0) {
        mx /= len;
        my /= len;
      }

      this.movement.x = mx;
      this.movement.y = my;

      this.isSprinting = this._keysDown.has('ShiftLeft') || this._keysDown.has('ShiftRight');
      this.isCrouching = this._keysDown.has('KeyC') || this._keysDown.has('ControlLeft');

      // Mouse look delta
      this.lookDelta.x = this._mouseDelta.x;
      this.lookDelta.y = this._mouseDelta.y;
      this._mouseDelta.x = 0;
      this._mouseDelta.y = 0;

      // Check one-shot action presses
      if (this._keysPressedThisFrame.has('KeyE')) {
        this._triggerAction(ACTIONS.INTERACT);
      }
      if (this._keysPressedThisFrame.has('Space')) {
        this._triggerAction(ACTIONS.JUMP);
      }
      if (this._keysPressedThisFrame.has('KeyI') || this._keysPressedThisFrame.has('Tab')) {
        this._triggerAction(ACTIONS.INVENTORY);
      }
      if (this._keysPressedThisFrame.has('KeyJ')) {
        this._triggerAction(ACTIONS.JOURNAL);
      }
      if (this._keysPressedThisFrame.has('KeyM')) {
        this._triggerAction(ACTIONS.MAP);
      }

      // Reset per-frame edge triggers
      this._keysPressedThisFrame.clear();
    }

    isActionDown(action) {
      if (action === ACTIONS.SPRINT) return this.isSprinting;
      if (action === ACTIONS.CROUCH) return this.isCrouching;
      if (action === ACTIONS.MOVE) return Math.abs(this.movement.x) > 0.01 || Math.abs(this.movement.y) > 0.01;
      return false;
    }

    onAction(action, callback) {
      if (!this._actionListeners.has(action)) {
        this._actionListeners.set(action, []);
      }
      this._actionListeners.get(action).push(callback);
      return () => {
        const arr = this._actionListeners.get(action) || [];
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      };
    }

    resetInputs() {
      this._keysDown.clear();
      this._keysPressedThisFrame.clear();
      this._keysHandled.clear();
      this._mouseButtons.clear();
      this.movement.x = 0;
      this.movement.y = 0;
      this.lookDelta.x = 0;
      this.lookDelta.y = 0;
      this.isSprinting = false;
      this.isCrouching = false;
    }

    destroy() {
      this.resetInputs();
      this._actionListeners.clear();
    }
  }

  return new AuthoritativeInputManager();
});
