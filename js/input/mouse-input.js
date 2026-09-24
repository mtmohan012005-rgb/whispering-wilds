// ============================================================================
// THE WHISPERING WILDS - MOUSE INPUT TRACKER
// ============================================================================

(function() {
    class MouseInput {
        constructor() {
            this.deltaX = 0;
            this.deltaY = 0;
            this.posX = 0;
            this.posY = 0;
            this.wheelDelta = 0;
            this.downButtons = new Set();
            this.pressedButtons = new Set();
            this.releasedButtons = new Set();

            this.isPointerLocked = false;
            this.sensitivityX = 1.0;
            this.sensitivityY = 1.0;
            this.invertY = false;
            this.invertX = false;

            this.onMouseMove = this.handleMouseMove.bind(this);
            this.onMouseDown = this.handleMouseDown.bind(this);
            this.onMouseUp = this.handleMouseUp.bind(this);
            this.onWheel = this.handleWheel.bind(this);
            this.onLockChange = this.handleLockChange.bind(this);

            this.init();
        }

        init() {
            window.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mouseup', this.onMouseUp);
            window.addEventListener('wheel', this.onWheel, { passive: true });
            document.addEventListener('pointerlockchange', this.onLockChange);
        }

        destroy() {
            window.removeEventListener('mousemove', this.onMouseMove);
            window.removeEventListener('mousedown', this.onMouseDown);
            window.removeEventListener('mouseup', this.onMouseUp);
            window.removeEventListener('wheel', this.onWheel);
            document.removeEventListener('pointerlockchange', this.onLockChange);
        }

        setSettings(settings = {}) {
            if (settings.sensitivityX !== undefined) this.sensitivityX = settings.sensitivityX;
            if (settings.sensitivityY !== undefined) this.sensitivityY = settings.sensitivityY;
            if (settings.invertY !== undefined) this.invertY = !!settings.invertY;
            if (settings.invertX !== undefined) this.invertX = !!settings.invertX;
        }

        handleMouseMove(e) {
            this.posX = e.clientX;
            this.posY = e.clientY;

            let dx = e.movementX || 0;
            let dy = e.movementY || 0;

            if (this.invertX) dx = -dx;
            if (this.invertY) dy = -dy;

            this.deltaX += dx * this.sensitivityX;
            this.deltaY += dy * this.sensitivityY;
        }

        handleMouseDown(e) {
            const btnKey = `Mouse${e.button}`;
            if (!this.downButtons.has(btnKey)) {
                this.pressedButtons.add(btnKey);
            }
            this.downButtons.add(btnKey);
        }

        handleMouseUp(e) {
            const btnKey = `Mouse${e.button}`;
            this.downButtons.delete(btnKey);
            this.releasedButtons.add(btnKey);
        }

        handleWheel(e) {
            // Laptop trackpads fire fine fractional deltaY; regular mouse wheels fire larger discrete steps.
            let delta = e.deltaY;
            if (e.ctrlKey) {
                // Trackpad pinch-to-zoom gesture
                delta = e.deltaY * 0.5;
            }
            if (Math.abs(delta) < 20) {
                this.wheelDelta += delta / 20;
            } else {
                this.wheelDelta += Math.sign(delta);
            }
        }

        handleLockChange() {
            this.isPointerLocked = !!document.pointerLockElement;
        }

        requestPointerLock(element = document.body) {
            try {
                if (element.requestPointerLock) {
                    element.requestPointerLock();
                }
            } catch (err) {
                console.warn('[MouseInput] Pointer lock request rejected:', err.message);
            }
        }

        exitPointerLock() {
            try {
                if (document.exitPointerLock) {
                    document.exitPointerLock();
                }
            } catch (err) {
                // Ignore exit errors
            }
        }

        isDown(btnKey) {
            return this.downButtons.has(btnKey);
        }

        wasPressed(btnKey) {
            return this.pressedButtons.has(btnKey);
        }

        wasReleased(btnKey) {
            return this.releasedButtons.has(btnKey);
        }

        getDelta() {
            return { x: this.deltaX, y: this.deltaY };
        }

        getPosition() {
            return { x: this.posX, y: this.posY };
        }

        getWheel() {
            return this.wheelDelta;
        }

        getPointerLockState() {
            return this.isPointerLocked;
        }

        update() {
            this.deltaX = 0;
            this.deltaY = 0;
            this.wheelDelta = 0;
            this.pressedButtons.clear();
            this.releasedButtons.clear();
        }

        clearAll() {
            this.downButtons.clear();
            this.pressedButtons.clear();
            this.releasedButtons.clear();
            this.deltaX = 0;
            this.deltaY = 0;
            this.wheelDelta = 0;
        }
    }

    window.MouseInput = MouseInput;
})();
