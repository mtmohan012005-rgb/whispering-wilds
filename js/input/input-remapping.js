// ============================================================================
// THE WHISPERING WILDS - INPUT REMAPPING & PROFILE STORAGE
// ============================================================================

(function() {
    const STORAGE_KEY = 'whispering_wilds_controls';

    class InputRemappingSystem {
        constructor() {
            this.profile = this.loadProfile();
        }

        loadProfile() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.keyboard) {
                        return {
                            ...window.DEFAULT_CONTROLS.PROFILE,
                            ...parsed,
                            keyboard: { ...window.DEFAULT_CONTROLS.KEYBOARD, ...parsed.keyboard }
                        };
                    }
                }
            } catch (err) {
                console.warn('[InputRemapping] Failed to parse stored profile, using defaults');
            }
            return JSON.parse(JSON.stringify(window.DEFAULT_CONTROLS.PROFILE));
        }

        saveProfile() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
            } catch (err) {
                console.error('[InputRemapping] Failed to save controls profile:', err);
            }
        }

        getBindings() {
            return { ...this.profile.keyboard };
        }

        remapAction(action, newCode) {
            const conflictCheck = window.InputConflictSystem?.findConflicts(action, newCode, this.profile.keyboard);
            if (conflictCheck?.isProtected) {
                return { success: false, message: conflictCheck.message };
            }

            if (conflictCheck?.hasConflict) {
                // Swap or clear conflict
                const other = conflictCheck.conflictingAction;
                delete this.profile.keyboard[other];
            }

            this.profile.keyboard[action] = newCode;
            this.profile.preset = 'CUSTOM';
            this.saveProfile();
            return { success: true };
        }

        applyPreset(presetName) {
            if (presetName === 'LEFT_HANDED') {
                this.profile.keyboard = { ...window.DEFAULT_CONTROLS.LEFT_HANDED };
                this.profile.preset = 'LEFT_HANDED';
            } else {
                this.profile.keyboard = { ...window.DEFAULT_CONTROLS.KEYBOARD };
                this.profile.preset = 'DEFAULT';
            }
            this.saveProfile();
        }

        resetToDefaults() {
            this.profile = JSON.parse(JSON.stringify(window.DEFAULT_CONTROLS.PROFILE));
            this.saveProfile();
            return { success: true, message: 'Controls restored to defaults.' };
        }
    }

    window.InputRemappingSystem = InputRemappingSystem;
})();
