// ============================================================================
// THE WHISPERING WILDS - GAMEPAD INPUT TRACKER
// ============================================================================

(function() {
    class GamepadInput {
        constructor() {
            this.gamepadIndex = null;
            this.deadzone = 0.15;
            this.sensitivityX = 1.0;
            this.sensitivityY = 1.0;
            this.invertY = false;
            this.vibrationEnabled = true;

            this.prevButtons = [];
            this.currButtons = [];
            this.axes = [0, 0, 0, 0];

            this.onConnect = this.handleConnect.bind(this);
            this.onDisconnect = this.handleDisconnect.bind(this);

            this.init();
        }

        init() {
            window.addEventListener('gamepadconnected', this.onConnect);
            window.addEventListener('gamepaddisconnected', this.onDisconnect);
        }

        destroy() {
            window.removeEventListener('gamepadconnected', this.onConnect);
            window.removeEventListener('gamepaddisconnected', this.onDisconnect);
        }

        setSettings(settings = {}) {
            if (settings.deadzone !== undefined) this.deadzone = settings.deadzone;
            if (settings.sensitivityX !== undefined) this.sensitivityX = settings.sensitivityX;
            if (settings.sensitivityY !== undefined) this.sensitivityY = settings.sensitivityY;
            if (settings.invertY !== undefined) this.invertY = !!settings.invertY;
            if (settings.vibration !== undefined) this.vibrationEnabled = !!settings.vibration;
        }

        handleConnect(e) {
            this.gamepadIndex = e.gamepad.index;
            console.log(`[Gamepad] Connected: ${e.gamepad.id} (index: ${e.gamepad.index})`);
            if (window.NotificationUI) {
                window.NotificationUI.show('Controller Connected', 'GAMEPAD READY', 3000);
            }
        }

        handleDisconnect(e) {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                console.log(`[Gamepad] Disconnected: ${e.gamepad.id}`);
                if (window.NotificationUI) {
                    window.NotificationUI.show('Controller Disconnected', 'KEYBOARD ACTIVE', 3000);
                }
            }
        }

        isConnected() {
            return this.gamepadIndex !== null;
        }

        getGamepad() {
            if (this.gamepadIndex === null) return null;
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            return gamepads[this.gamepadIndex] || null;
        }

        applyRadialDeadzone(x, y) {
            const mag = Math.sqrt(x * x + y * y);
            if (mag <= this.deadzone) {
                return { x: 0, y: 0 };
            }
            // Normalize and scale smoothly outside deadzone
            const factor = (mag - this.deadzone) / (1 - this.deadzone);
            return {
                x: (x / mag) * factor,
                y: (y / mag) * factor
            };
        }

        poll() {
            const gp = this.getGamepad();
            if (!gp) {
                this.prevButtons = [];
                this.currButtons = [];
                this.axes = [0, 0, 0, 0];
                return false;
            }

            this.prevButtons = [...this.currButtons];
            this.currButtons = gp.buttons.map(b => b.pressed || b.value > 0.5);

            // Left Stick (Axes 0, 1)
            const leftRawX = gp.axes[0] || 0;
            const leftRawY = gp.axes[1] || 0;
            const leftStick = this.applyRadialDeadzone(leftRawX, leftRawY);

            // Right Stick (Axes 2, 3)
            const rightRawX = gp.axes[2] || 0;
            const rightRawY = (this.invertY ? -1 : 1) * (gp.axes[3] || 0);
            const rightStick = this.applyRadialDeadzone(rightRawX, rightRawY);

            this.axes = [
                leftStick.x,
                leftStick.y,
                rightStick.x * this.sensitivityX,
                rightStick.y * this.sensitivityY
            ];

            // Return true if any button pressed or stick moved significantly
            const hasActivity = this.currButtons.some(Boolean) ||
                Math.abs(leftStick.x) > 0.01 || Math.abs(leftStick.y) > 0.01 ||
                Math.abs(rightStick.x) > 0.01 || Math.abs(rightStick.y) > 0.01;

            return hasActivity;
        }

        isButtonDown(btnIndex) {
            return !!this.currButtons[btnIndex];
        }

        wasButtonPressed(btnIndex) {
            return !!this.currButtons[btnIndex] && !this.prevButtons[btnIndex];
        }

        wasButtonReleased(btnIndex) {
            return !this.currButtons[btnIndex] && !!this.prevButtons[btnIndex];
        }

        getLeftStick() {
            return { x: this.axes[0], y: this.axes[1] };
        }

        getRightStick() {
            return { x: this.axes[2], y: this.axes[3] };
        }

        vibrate(duration = 200, weakMagnitude = 0.5, strongMagnitude = 0.5) {
            if (!this.vibrationEnabled) return;
            const gp = this.getGamepad();
            if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
                gp.vibrationActuator.playEffect('dual-rumble', {
                    startDelay: 0,
                    duration,
                    weakMagnitude,
                    strongMagnitude
                }).catch(() => {});
            }
        }
    }

    window.GamepadInput = GamepadInput;
})();
