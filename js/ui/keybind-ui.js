// ============================================================================
// THE WHISPERING WILDS - KEYBIND REBINDING UI COMPONENT
// ============================================================================

(function() {
    class KeybindUI {
        constructor() {
            this.listeningAction = null;
            this.onKeyCaptured = this.handleKeyCaptured.bind(this);
        }

        renderKeybindRows(bindings) {
            const displayActions = [
                { id: 'MOVE_FORWARD', label: 'Move Forward' },
                { id: 'MOVE_BACK', label: 'Move Backward' },
                { id: 'MOVE_LEFT', label: 'Move Left' },
                { id: 'MOVE_RIGHT', label: 'Move Right' },
                { id: 'SPRINT', label: 'Sprint' },
                { id: 'CROUCH', label: 'Crouch' },
                { id: 'JUMP', label: 'Jump' },
                { id: 'INTERACT', label: 'Interact / Talk' },
                { id: 'INVENTORY', label: 'Open Satchel / Inventory' },
                { id: 'JOURNAL', label: 'Field Journal / Clue Board' },
                { id: 'MAP', label: 'World Map' },
                { id: 'PLAYER', label: 'Player Wardrobe / Appearance' },
                { id: 'PHOTO_MODE', label: 'Explorer Camera' },
                { id: 'PAUSE', label: 'Pause Menu' }
            ];

            return displayActions.map(item => {
                const rawCode = bindings[item.id] || 'None';
                const formatted = this.formatKeyCode(rawCode);
                return `
                    <div class="keybind-row">
                        <span class="keybind-label">${item.label}</span>
                        <button type="button" class="keybind-btn" data-action="${item.id}" id="bindBtn_${item.id}">
                            ${formatted}
                        </button>
                    </div>
                `;
            }).join('');
        }

        formatKeyCode(code) {
            if (code.startsWith('Key')) return code.substring(3);
            if (code.startsWith('Digit')) return code.substring(5);
            if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
            if (code === 'ControlLeft' || code === 'ControlRight') return 'CTRL';
            if (code === 'Space') return 'SPACE';
            if (code === 'Escape') return 'ESC';
            if (code === 'Mouse0') return 'L-CLICK';
            if (code === 'Mouse2') return 'R-CLICK';
            return code.toUpperCase();
        }

        startListening(action, btn) {
            if (this.listeningAction) {
                this.stopListening();
            }

            this.listeningAction = action;
            btn.classList.add('listening');
            btn.textContent = 'PRESS KEY...';

            window.addEventListener('keydown', this.onKeyCaptured, { capture: true, once: true });
        }

        stopListening() {
            if (!this.listeningAction) return;
            const btn = document.getElementById(`bindBtn_${this.listeningAction}`);
            if (btn) {
                btn.classList.remove('listening');
                const bindings = window.InputManager?.remapping?.getBindings?.() || {};
                btn.textContent = this.formatKeyCode(bindings[this.listeningAction] || 'None');
            }
            window.removeEventListener('keydown', this.onKeyCaptured, { capture: true });
            this.listeningAction = null;
        }

        handleKeyCaptured(e) {
            e.preventDefault();
            e.stopPropagation();

            const action = this.listeningAction;
            this.listeningAction = null;

            if (e.code === 'Escape') {
                this.stopListening();
                return;
            }

            const result = window.InputManager.remapping.remapAction(action, e.code);
            if (!result.success) {
                if (window.NotificationUI) {
                    window.NotificationUI.show(result.message, 'KEY CONFLICT', 3000);
                } else {
                    alert(result.message);
                }
            }

            const btn = document.getElementById(`bindBtn_${action}`);
            if (btn) {
                btn.classList.remove('listening');
                const bindings = window.InputManager.remapping.getBindings();
                btn.textContent = this.formatKeyCode(bindings[action] || 'None');
            }
        }
    }

    window.KeybindUI = new KeybindUI();
})();
