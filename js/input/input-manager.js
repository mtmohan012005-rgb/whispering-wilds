// ============================================================================
// THE WHISPERING WILDS - CENTRAL AUTHORITATIVE INPUT MANAGER
// ============================================================================

(function() {
    class CentralInputManager {
        constructor() {
            this.keyboard = new window.KeyboardInput();
            this.mouse = new window.MouseInput();
            this.gamepad = new window.GamepadInput();
            this.contextManager = new window.InputContextManager();
            this.remapping = new window.InputRemappingSystem();

            this.activeDevice = 'KEYBOARD_MOUSE'; // or 'GAMEPAD'
            this.deviceListeners = new Set();

            this.applyStoredSettings();
        }

        applyStoredSettings() {
            const profile = this.remapping.profile;
            if (profile.mouse) this.mouse.setSettings(profile.mouse);
            if (profile.gamepad) this.gamepad.setSettings(profile.gamepad);
        }

        getActiveDevice() {
            return this.activeDevice;
        }

        onDeviceChange(callback) {
            this.deviceListeners.add(callback);
            return () => this.deviceListeners.delete(callback);
        }

        setDevice(newDevice) {
            if (this.activeDevice !== newDevice) {
                this.activeDevice = newDevice;
                for (const cb of this.deviceListeners) {
                    try { cb(newDevice); } catch (e) {}
                }
            }
        }

        isTextInputFocused() {
            return this.keyboard.isTextInputFocused();
        }

        setContext(ctx) {
            this.contextManager.setContext(ctx);
        }

        pushContext(ctx) {
            this.contextManager.pushContext(ctx);
        }

        popContext() {
            return this.contextManager.popContext();
        }

        getCurrentContext() {
            return this.contextManager.getCurrentContext();
        }

        // --- Action Queries ---

        isDown(action) {
            if (!this.contextManager.isActionAllowed(action)) return false;

            // 1. Check Keyboard
            const boundKey = this.remapping.profile.keyboard[action];
            if (boundKey) {
                if (boundKey.startsWith('Mouse')) {
                    if (this.mouse.isDown(boundKey)) {
                        this.setDevice('KEYBOARD_MOUSE');
                        return true;
                    }
                } else {
                    if (this.keyboard.isDown(boundKey)) {
                        this.setDevice('KEYBOARD_MOUSE');
                        return true;
                    }
                }
            }

            // 2. Check Gamepad
            const gpButton = window.DEFAULT_CONTROLS.GAMEPAD[action];
            if (gpButton !== undefined && this.gamepad.isButtonDown(gpButton)) {
                this.setDevice('GAMEPAD');
                return true;
            }

            return false;
        }

        wasPressed(action) {
            if (!this.contextManager.isActionAllowed(action)) return false;

            const boundKey = this.remapping.profile.keyboard[action];
            if (boundKey) {
                if (boundKey.startsWith('Mouse')) {
                    if (this.mouse.wasPressed(boundKey)) {
                        this.setDevice('KEYBOARD_MOUSE');
                        return true;
                    }
                } else {
                    if (this.keyboard.wasPressed(boundKey)) {
                        this.setDevice('KEYBOARD_MOUSE');
                        return true;
                    }
                }
            }

            const gpButton = window.DEFAULT_CONTROLS.GAMEPAD[action];
            if (gpButton !== undefined && this.gamepad.wasButtonPressed(gpButton)) {
                this.setDevice('GAMEPAD');
                return true;
            }

            return false;
        }

        wasReleased(action) {
            if (!this.contextManager.isActionAllowed(action)) return false;

            const boundKey = this.remapping.profile.keyboard[action];
            if (boundKey) {
                if (boundKey.startsWith('Mouse')) {
                    if (this.mouse.wasReleased(boundKey)) {
                        this.setDevice('KEYBOARD_MOUSE');
                        return true;
                    }
                } else {
                    if (this.keyboard.wasReleased(boundKey)) {
                        this.setDevice('KEYBOARD_MOUSE');
                        return true;
                    }
                }
            }

            const gpButton = window.DEFAULT_CONTROLS.GAMEPAD[action];
            if (gpButton !== undefined && this.gamepad.wasButtonReleased(gpButton)) {
                this.setDevice('GAMEPAD');
                return true;
            }

            return false;
        }

        getAxis(action) {
            if (!this.contextManager.isActionAllowed(action)) return 0;

            if (action === 'MOVE_FORWARD') {
                if (this.isDown('MOVE_FORWARD')) return 1;
                const gpY = -this.gamepad.getLeftStick().y;
                return gpY > 0 ? gpY : 0;
            }
            if (action === 'MOVE_BACK') {
                if (this.isDown('MOVE_BACK')) return 1;
                const gpY = this.gamepad.getLeftStick().y;
                return gpY > 0 ? gpY : 0;
            }
            if (action === 'MOVE_LEFT') {
                if (this.isDown('MOVE_LEFT')) return 1;
                const gpX = -this.gamepad.getLeftStick().x;
                return gpX > 0 ? gpX : 0;
            }
            if (action === 'MOVE_RIGHT') {
                if (this.isDown('MOVE_RIGHT')) return 1;
                const gpX = this.gamepad.getLeftStick().x;
                return gpX > 0 ? gpX : 0;
            }

            return 0;
        }

        getMouseDelta() {
            if (!this.contextManager.isActionAllowed('CAMERA_LOOK_X')) {
                return { x: 0, y: 0 };
            }

            const mouseDelta = this.mouse.getDelta();
            const gpRightStick = this.gamepad.getRightStick();

            // Detect active device
            if (Math.abs(mouseDelta.x) > 0.1 || Math.abs(mouseDelta.y) > 0.1) {
                this.setDevice('KEYBOARD_MOUSE');
            } else if (Math.abs(gpRightStick.x) > 0.05 || Math.abs(gpRightStick.y) > 0.05) {
                this.setDevice('GAMEPAD');
            }

            return {
                x: mouseDelta.x + gpRightStick.x * 12.0,
                y: mouseDelta.y + gpRightStick.y * 12.0
            };
        }

        getMousePosition() {
            return this.mouse.getPosition();
        }

        getPointerLockState() {
            return this.mouse.getPointerLockState();
        }

        requestPointerLock(element) {
            this.mouse.requestPointerLock(element);
        }

        exitPointerLock() {
            this.mouse.exitPointerLock();
        }

        vibrate(duration = 200, weakMagnitude = 0.5, strongMagnitude = 0.5) {
            this.gamepad.vibrate(duration, weakMagnitude, strongMagnitude);
        }

        update() {
            const hasGamepadActivity = this.gamepad.poll();
            if (hasGamepadActivity) {
                this.setDevice('GAMEPAD');
            }
            this.keyboard.update();
            this.mouse.update();
        }

        clearAll() {
            this.keyboard.clearAll();
            this.mouse.clearAll();
        }

        destroy() {
            this.keyboard.destroy();
            this.mouse.destroy();
            this.gamepad.destroy();
        }
    }

    window.InputManager = new CentralInputManager();
})();
