// ============================================================================
// THE WHISPERING WILDS - ESCAPE PAUSE MENU
// ============================================================================

class PauseMenuUI {
    constructor() {
        this.backdrop = null;
        this.initDOM();
    }

    initDOM() {
        this.backdrop = document.createElement('div');
        this.backdrop.id = 'pc-pause-backdrop';
        this.backdrop.className = 'pc-modal-backdrop';

        this.backdrop.innerHTML = `
            <div class="pc-modal-window pc-pause-menu">
                <div class="pc-modal-header" style="justify-content: center; border-bottom: none; padding-bottom: 0;">
                    <div class="pc-modal-title" style="font-size: 24px; letter-spacing: 2px;">
                        காட்டு வழி • EXPEDITION PAUSED
                    </div>
                </div>
                <p style="text-align: center; color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">The Whispering Wilds</p>

                <button class="pc-menu-btn" id="pm-btn-resume">
                    <span>▶ Resume Exploration</span> <kbd style="font-size:11px; opacity:0.6;">Esc</kbd>
                </button>
                <button class="pc-menu-btn" id="pm-btn-inventory">
                    <span>🎒 Field Satchel</span> <kbd style="font-size:11px; opacity:0.6;">I</kbd>
                </button>
                <button class="pc-menu-btn" id="pm-btn-map">
                    <span>🗺️ World Map</span> <kbd style="font-size:11px; opacity:0.6;">M</kbd>
                </button>
                <button class="pc-menu-btn" id="pm-btn-journal">
                    <span>📓 Field Journal & Clues</span> <kbd style="font-size:11px; opacity:0.6;">J</kbd>
                </button>
                <button class="pc-menu-btn" id="pm-btn-graphics">
                    <span>⚙️ Display & Graphics</span> <span>⚙️</span>
                </button>
                <button class="pc-menu-btn" id="pm-btn-survival-assist">
                    <span>🛡️ Survival Mode: <strong id="pm-surv-assist-val">NORMAL</strong></span> <span>⚖️</span>
                </button>
                <button class="pc-menu-btn" id="pm-btn-save">
                    <span>💾 Save Game</span> <span>💾</span>
                </button>
                <button class="pc-menu-btn danger" id="pm-btn-quit">
                    <span>🚪 Return to Title</span> <span>⏻</span>
                </button>
            </div>
        `;

        document.body.appendChild(this.backdrop);
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('pm-btn-resume').onclick = () => {
            if (window.uiManager) window.uiManager.closeModal('PAUSED');
        };

        document.getElementById('pm-btn-inventory').onclick = () => {
            if (window.uiManager) {
                window.uiManager.closeModal('PAUSED');
                window.uiManager.openModal('INVENTORY');
            }
        };

        document.getElementById('pm-btn-map').onclick = () => {
            if (window.uiManager) {
                window.uiManager.closeModal('PAUSED');
                window.uiManager.openModal('MAP');
            }
        };

        document.getElementById('pm-btn-journal').onclick = () => {
            if (window.uiManager) {
                window.uiManager.closeModal('PAUSED');
                window.uiManager.openModal('JOURNAL');
            }
        };

        document.getElementById('pm-btn-graphics').onclick = () => {
            if (window.uiManager) {
                window.uiManager.closeModal('PAUSED');
                if (window.graphicsSettingsUI) window.graphicsSettingsUI.show();
            }
        };

        const assistBtn = document.getElementById('pm-btn-survival-assist');
        if (assistBtn) {
            assistBtn.onclick = () => {
                if (window.GameState && window.GameState.settings && window.GameState.settings.accessibility) {
                    const current = window.GameState.settings.accessibility.survivalAssist || 'NORMAL';
                    const next = current === 'NORMAL' ? 'ASSISTED' : 'NORMAL';
                    window.GameState.settings.accessibility.survivalAssist = next;
                    const valEl = document.getElementById('pm-surv-assist-val');
                    if (valEl) valEl.innerText = next;
                    if (window.NotificationUI && typeof window.NotificationUI.showNotification === 'function') {
                        window.NotificationUI.showNotification(`Survival Assistance: ${next}`, 'info');
                    }
                }
            };
        }

        document.getElementById('pm-btn-save').onclick = () => {
            if (window.saveManager) {
                const state = window.saveManager.gatherGameState ? window.saveManager.gatherGameState() : window.saveManager._gatherState();
                window.saveManager.save(state);
                if (window.quests && window.quests.showQuestNotification) {
                    window.quests.showQuestNotification('💾 Game Progress Saved to Local Storage');
                }
            }
        };

        document.getElementById('pm-btn-quit').onclick = () => {
            window.location.reload();
        };
    }

    get isOpen() {
        return !!(this.backdrop && (this.backdrop.classList.contains('active') || this.backdrop.classList.contains('visible')));
    }

    show() {
        if (this.backdrop) {
            this.backdrop.classList.add('active');
            const valEl = document.getElementById('pm-surv-assist-val');
            if (valEl && window.GameState && window.GameState.settings && window.GameState.settings.accessibility) {
                valEl.innerText = window.GameState.settings.accessibility.survivalAssist || 'NORMAL';
            }
        }
    }

    hide() {
        if (this.backdrop) this.backdrop.classList.remove('active');
    }
}

window.PauseMenuUI = PauseMenuUI;
