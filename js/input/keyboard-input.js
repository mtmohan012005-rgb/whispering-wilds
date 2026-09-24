// ============================================================================
// THE WHISPERING WILDS - KEYBOARD INPUT TRACKER
// ============================================================================

(function() {
    class KeyboardInput {
        constructor() {
            this.downKeys = new Set();
            this.pressedKeys = new Set();
            this.releasedKeys = new Set();

            this.onKeyDown = this.handleKeyDown.bind(this);
            this.onKeyUp = this.handleKeyUp.bind(this);
            this.onReset = this.clearAll.bind(this);

            this.init();
        }

        init() {
            window.addEventListener('keydown', this.onKeyDown);
            window.addEventListener('keyup', this.onKeyUp);
            window.addEventListener('blur', this.onReset);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.clearAll();
            });
        }

        destroy() {
            window.removeEventListener('keydown', this.onKeyDown);
            window.removeEventListener('keyup', this.onKeyUp);
            window.removeEventListener('blur', this.onReset);
        }

        isTextInputFocused() {
            const el = document.activeElement;
            if (!el) return false;
            const tag = el.tagName?.toUpperCase();
            return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
        }

        handleKeyDown(e) {
            if (this.isTextInputFocused()) {
                return; // Let native typing handle text inputs without triggering gameplay actions
            }

            // Suppress space / arrow default page scroll during game
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (!this.downKeys.has(e.code)) {
                this.pressedKeys.add(e.code);
            }
            this.downKeys.add(e.code);
        }

        handleKeyUp(e) {
            this.downKeys.delete(e.code);
            this.releasedKeys.add(e.code);
        }

        isDown(code) {
            if (this.isTextInputFocused()) return false;
            return this.downKeys.has(code);
        }

        wasPressed(code) {
            if (this.isTextInputFocused()) return false;
            return this.pressedKeys.has(code);
        }

        wasReleased(code) {
            if (this.isTextInputFocused()) return false;
            return this.releasedKeys.has(code);
        }

        update() {
            // Clear one-shot sets at the end of each frame update
            this.pressedKeys.clear();
            this.releasedKeys.clear();
        }

        clearAll() {
            this.downKeys.clear();
            this.pressedKeys.clear();
            this.releasedKeys.clear();
        }
    }

    window.KeyboardInput = KeyboardInput;
})();
