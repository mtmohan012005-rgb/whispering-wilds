// ============================================================================
// THE WHISPERING WILDS - CONTROLS SETTINGS MODAL UI
// ============================================================================

(function() {
    class ControlsSettingsUI {
        constructor() {
            this.container = null;
            this.currentTab = 'KEYBOARD';
            this.isOpen = false;
        }

        init() {
            if (this.container) return;

            const modal = document.createElement('div');
            modal.id = 'controlsSettingsModal';
            modal.className = 'controls-settings-modal';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="controls-header">
                    <h2 class="controls-title">Control Settings</h2>
                    <button type="button" id="closeControlsBtn" class="keybind-btn" style="min-width:auto; padding:4px 10px;">✕</button>
                </div>

                <div class="controls-tab-bar">
                    <button type="button" id="tabKeyboardBtn" class="controls-tab-btn active">Keyboard & Mouse</button>
                    <button type="button" id="tabGamepadBtn" class="controls-tab-btn">Controller (Gamepad)</button>
                </div>

                <div class="controls-body" id="controlsBodyContainer"></div>

                <div class="controls-footer">
                    <div style="display:flex; gap:10px;">
                        <button type="button" id="presetDefaultBtn" class="controls-tab-btn">Default</button>
                        <button type="button" id="presetLeftHandedBtn" class="controls-tab-btn">Left-Handed</button>
                        <button type="button" id="resetControlsBtn" class="controls-tab-btn" style="color:#ffaaaa;">Restore Defaults</button>
                    </div>
                    <button type="button" id="saveControlsBtn" class="auth-btn-primary" style="width:auto; padding:8px 24px;">
                        Done
                    </button>
                </div>
            `;

            document.body.appendChild(modal);
            this.container = modal;
            this.bindEvents();
        }

        bindEvents() {
            const closeBtn = this.container.querySelector('#closeControlsBtn');
            const saveBtn = this.container.querySelector('#saveControlsBtn');
            const tabKeyBtn = this.container.querySelector('#tabKeyboardBtn');
            const tabGpBtn = this.container.querySelector('#tabGamepadBtn');
            const resetBtn = this.container.querySelector('#resetControlsBtn');
            const defPresetBtn = this.container.querySelector('#presetDefaultBtn');
            const leftPresetBtn = this.container.querySelector('#presetLeftHandedBtn');

            closeBtn.addEventListener('click', () => this.hide());
            saveBtn.addEventListener('click', () => this.hide());

            tabKeyBtn.addEventListener('click', () => {
                this.currentTab = 'KEYBOARD';
                tabKeyBtn.classList.add('active');
                tabGpBtn.classList.remove('active');
                this.renderTabContent();
            });

            tabGpBtn.addEventListener('click', () => {
                this.currentTab = 'GAMEPAD';
                tabGpBtn.classList.add('active');
                tabKeyBtn.classList.remove('active');
                this.renderTabContent();
            });

            resetBtn.addEventListener('click', () => {
                if (confirm('Restore default controls?')) {
                    window.InputManager?.remapping?.resetToDefaults();
                    this.renderTabContent();
                }
            });

            defPresetBtn.addEventListener('click', () => {
                window.InputManager?.remapping?.applyPreset('DEFAULT');
                this.renderTabContent();
            });

            leftPresetBtn.addEventListener('click', () => {
                window.InputManager?.remapping?.applyPreset('LEFT_HANDED');
                this.renderTabContent();
            });
        }

        renderTabContent() {
            const body = this.container.querySelector('#controlsBodyContainer');
            if (!body) return;

            if (this.currentTab === 'KEYBOARD') {
                const bindings = window.InputManager?.remapping?.getBindings() || {};
                body.innerHTML = window.KeybindUI.renderKeybindRows(bindings);

                // Bind click to listen on each button
                body.querySelectorAll('.keybind-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = btn.getAttribute('data-action');
                        window.KeybindUI.startListening(action, btn);
                    });
                });
            } else {
                body.innerHTML = window.GamepadUI.renderGamepadOverview();
            }
        }

        show() {
            if (!this.container) this.init();
            this.isOpen = true;
            this.container.style.display = 'flex';
            this.renderTabContent();
            if (window.InputManager) {
                window.InputManager.pushContext('MenuContext');
            }
        }

        hide() {
            if (!this.container) return;
            this.isOpen = false;
            this.container.style.display = 'none';
            window.KeybindUI.stopListening();
            if (window.InputManager) {
                window.InputManager.popContext();
            }
        }
    }

    window.ControlsSettingsUI = new ControlsSettingsUI();
})();
