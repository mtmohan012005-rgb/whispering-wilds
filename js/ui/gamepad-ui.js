// ============================================================================
// THE WHISPERING WILDS - GAMEPAD & CONTEXT-SENSITIVE PROMPT UI
// ============================================================================

(function() {
    const GAMEPAD_BUTTON_LABELS = {
        0: 'A',
        1: 'B',
        2: 'X',
        3: 'Y',
        4: 'LB',
        5: 'RB',
        6: 'LT',
        7: 'RT',
        8: 'VIEW',
        9: 'MENU',
        10: 'LS',
        11: 'RS'
    };

    class GamepadUI {
        getPromptForAction(action) {
            const isGamepad = window.InputManager?.getActiveDevice() === 'GAMEPAD';

            if (isGamepad) {
                const btnIdx = window.DEFAULT_CONTROLS.GAMEPAD[action];
                if (btnIdx !== undefined) {
                    return `<span class="input-prompt-badge gamepad-badge">${GAMEPAD_BUTTON_LABELS[btnIdx] || btnIdx}</span>`;
                }
                return '<span class="input-prompt-badge gamepad-badge">🎮</span>';
            }

            // Keyboard/Mouse
            const bound = window.InputManager?.remapping?.profile?.keyboard?.[action] || 'None';
            const label = window.KeybindUI ? window.KeybindUI.formatKeyCode(bound) : bound;
            return `<span class="input-prompt-badge keyboard-badge">${label}</span>`;
        }

        renderGamepadOverview() {
            const isConnected = window.InputManager?.gamepad?.isConnected();
            return `
                <div class="auth-save-box" style="margin-bottom:12px;">
                    <div class="auth-save-title">Controller Status</div>
                    <div class="auth-save-detail">
                        <strong>Hardware:</strong> ${isConnected ? 'Connected & Active' : 'No Controller Detected'}
                    </div>
                    <div class="auth-save-detail">
                        <strong>Standard Layout:</strong> Xbox / XInput Compatible
                    </div>
                </div>

                <div class="keybind-row">
                    <span class="keybind-label">Movement / Navigation</span>
                    <span class="keybind-btn" style="cursor:default;">Left Stick</span>
                </div>
                <div class="keybind-row">
                    <span class="keybind-label">Camera Look</span>
                    <span class="keybind-btn" style="cursor:default;">Right Stick</span>
                </div>
                <div class="keybind-row">
                    <span class="keybind-label">Jump / Confirm</span>
                    <span class="keybind-btn" style="cursor:default;">A Button</span>
                </div>
                <div class="keybind-row">
                    <span class="keybind-label">Interact / Primary Action</span>
                    <span class="keybind-btn" style="cursor:default;">X Button</span>
                </div>
                <div class="keybind-row">
                    <span class="keybind-label">Satchel / Inventory</span>
                    <span class="keybind-btn" style="cursor:default;">Y Button</span>
                </div>
                <div class="keybind-row">
                    <span class="keybind-label">Crouch / Cancel</span>
                    <span class="keybind-btn" style="cursor:default;">B Button</span>
                </div>
                <div class="keybind-row">
                    <span class="keybind-label">Sprint</span>
                    <span class="keybind-btn" style="cursor:default;">LS Click</span>
                </div>
            `;
        }
    }

    window.GamepadUI = new GamepadUI();
})();
