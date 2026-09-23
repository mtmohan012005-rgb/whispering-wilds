// ============================================================================
// THE WHISPERING WILDS - CENTRAL UI MANAGER & INPUT CONTROLLER
// Handles Modal State Machine, Focus Traps, Input Locks, and Hotkey Dispatches
// ============================================================================

class UIManager {
    constructor() {
        this.currentMode = 'GAMEPLAY'; // GAMEPLAY | PAUSED | MAP | JOURNAL | INVENTORY | SETTINGS | DIALOGUE | PHOTO
        this.modalStack = [];

        // Sub-UI instances
        this.hud = null;
        this.pauseMenu = null;
        this.worldMapUI = null;
        this.journalUI = null;
        this.inventoryUI = null;
        this.dialogueUI = null;
        this.photoUI = null;
        this.settingsUI = null;
        this.notificationUI = null;

        this.bindGlobalKeyboard();
    }

    isInputLocked() {
        return this.currentMode !== 'GAMEPLAY' || !!window.uiInputLocked;
    }

    bindGlobalKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Ignore keystrokes when typing inside text inputs
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            switch (e.code) {
                case 'Escape':
                    e.preventDefault();
                    this.handleEscape();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    this.toggleModal('MAP');
                    break;
                case 'KeyJ':
                    e.preventDefault();
                    this.toggleModal('JOURNAL');
                    break;
                case 'KeyI':
                    e.preventDefault();
                    this.toggleModal('INVENTORY');
                    break;
                case 'KeyF':
                    e.preventDefault();
                    this.toggleModal('PHOTO');
                    break;
                case 'F9':
                    e.preventDefault();
                    if (window.performanceManager) {
                        window.performanceManager.toggleOverlay();
                    }
                    break;
                case 'KeyE':
                    // Interaction handled by player / game loop, or dialogue trigger
                    break;
            }
        });
    }

    handleEscape() {
        if (this.modalStack.length > 0) {
            // Close top-most modal
            const top = this.modalStack.pop();
            this.closeModalInternal(top);
            if (this.modalStack.length > 0) {
                this.currentMode = this.modalStack[this.modalStack.length - 1];
            } else {
                this.currentMode = 'GAMEPLAY';
                this.updateInputLock();
            }
        } else {
            // Open pause menu
            this.openModal('PAUSED');
        }
    }

    openModal(mode) {
        if (this.currentMode === mode) return;

        // If in photo mode, don't open another modal
        if (this.currentMode === 'PHOTO' && mode !== 'PHOTO') {
            this.closeModalInternal('PHOTO');
        }

        this.modalStack.push(mode);
        this.currentMode = mode;
        this.openModalInternal(mode);
        this.updateInputLock();
    }

    closeModal(mode) {
        const idx = this.modalStack.lastIndexOf(mode);
        if (idx !== -1) {
            this.modalStack.splice(idx, 1);
        }
        this.closeModalInternal(mode);

        if (this.modalStack.length > 0) {
            this.currentMode = this.modalStack[this.modalStack.length - 1];
        } else {
            this.currentMode = 'GAMEPLAY';
        }
        this.updateInputLock();
    }

    toggleModal(mode) {
        if (this.currentMode === mode) {
            this.closeModal(mode);
        } else {
            this.openModal(mode);
        }
    }

    openModalInternal(mode) {
        switch (mode) {
            case 'PAUSED':
                if (this.pauseMenu) this.pauseMenu.show();
                break;
            case 'MAP':
                if (this.worldMapUI) this.worldMapUI.show();
                break;
            case 'JOURNAL':
                if (this.journalUI) this.journalUI.show();
                break;
            case 'INVENTORY':
                if (this.inventoryUI) this.inventoryUI.show();
                break;
            case 'PHOTO':
                if (this.photoUI) this.photoUI.show();
                break;
            case 'SETTINGS':
                if (this.settingsUI) this.settingsUI.show();
                break;
        }
    }

    closeModalInternal(mode) {
        switch (mode) {
            case 'PAUSED':
                if (this.pauseMenu) this.pauseMenu.hide();
                break;
            case 'MAP':
                if (this.worldMapUI) this.worldMapUI.hide();
                break;
            case 'JOURNAL':
                if (this.journalUI) this.journalUI.hide();
                break;
            case 'INVENTORY':
                if (this.inventoryUI) this.inventoryUI.hide();
                break;
            case 'PHOTO':
                if (this.photoUI) this.photoUI.hide();
                break;
            case 'SETTINGS':
                if (this.settingsUI) this.settingsUI.hide();
                break;
        }
    }

    updateInputLock() {
        const isLocked = this.currentMode !== 'GAMEPLAY';
        window.uiInputLocked = isLocked;

        // If HUD is active, toggle visibility or dimming
        const hudEl = document.getElementById('hud-container');
        if (hudEl) {
            if (this.currentMode === 'PHOTO') {
                hudEl.classList.add('hidden');
            } else {
                hudEl.classList.remove('hidden');
            }
        }
    }
}

window.UIManager = UIManager;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
