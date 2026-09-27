// ============================================================================
// THE WHISPERING WILDS - INPUT CONTEXT SYSTEM
// ============================================================================

(function() {
    const CONTEXT_RULES = {
        GameplayContext: {
            allowedActions: [
                'MOVE_FORWARD', 'MOVE_BACK', 'MOVE_LEFT', 'MOVE_RIGHT',
                'SPRINT', 'CROUCH', 'JUMP', 'INTERACT',
                'INVENTORY', 'JOURNAL', 'MAP', 'PLAYER', 'PHOTO_MODE', 'PAUSE',
                'PRIMARY_ACTION', 'SECONDARY_ACTION', 'USE_ITEM',
                'CAMERA_LOOK_X', 'CAMERA_LOOK_Y'
            ]
        },
        BoatContext: {
            allowedActions: [
                'BOAT_FORWARD', 'BOAT_REVERSE', 'BOAT_TURN_LEFT', 'BOAT_TURN_RIGHT',
                'INTERACT', 'INVENTORY', 'JOURNAL', 'MAP', 'PAUSE',
                'CAMERA_LOOK_X', 'CAMERA_LOOK_Y'
            ]
        },
        InventoryContext: {
            allowedActions: [
                'MENU_UP', 'MENU_DOWN', 'MENU_LEFT', 'MENU_RIGHT',
                'MENU_CONFIRM', 'MENU_BACK', 'INVENTORY', 'PAUSE'
            ]
        },
        JournalContext: {
            allowedActions: [
                'MENU_UP', 'MENU_DOWN', 'MENU_LEFT', 'MENU_RIGHT',
                'MENU_CONFIRM', 'MENU_BACK', 'JOURNAL', 'PAUSE'
            ]
        },
        MapContext: {
            allowedActions: [
                'MENU_UP', 'MENU_DOWN', 'MENU_LEFT', 'MENU_RIGHT',
                'MENU_CONFIRM', 'MENU_BACK', 'MAP', 'PAUSE',
                'CAMERA_LOOK_X', 'CAMERA_LOOK_Y'
            ]
        },
        DialogueContext: {
            allowedActions: [
                'DIALOGUE_ADVANCE', 'DIALOGUE_CHOICE_1', 'DIALOGUE_CHOICE_2', 'DIALOGUE_CHOICE_3',
                'MENU_UP', 'MENU_DOWN', 'MENU_CONFIRM', 'MENU_BACK'
            ]
        },
        PhotoContext: {
            allowedActions: [
                'PRIMARY_ACTION', 'SECONDARY_ACTION', 'PHOTO_MODE', 'PAUSE',
                'CAMERA_LOOK_X', 'CAMERA_LOOK_Y'
            ]
        },
        PuzzleContext: {
            allowedActions: [
                'PUZZLE_ACTION', 'PRIMARY_ACTION', 'SECONDARY_ACTION',
                'MENU_UP', 'MENU_DOWN', 'MENU_LEFT', 'MENU_RIGHT',
                'MENU_CONFIRM', 'MENU_BACK', 'PAUSE'
            ]
        },
        MenuContext: {
            allowedActions: [
                'MENU_UP', 'MENU_DOWN', 'MENU_LEFT', 'MENU_RIGHT',
                'MENU_CONFIRM', 'MENU_BACK', 'PAUSE'
            ]
        },
        CustomizationContext: {
            allowedActions: [
                'MENU_UP', 'MENU_DOWN', 'MENU_LEFT', 'MENU_RIGHT',
                'MENU_CONFIRM', 'MENU_BACK', 'PLAYER', 'PAUSE'
            ]
        },
        AuthContext: {
            allowedActions: [
                'MENU_CONFIRM', 'MENU_BACK'
            ]
        }
    };

    // Aliases for uppercase context names used across engine modules
    CONTEXT_RULES.GAMEPLAY = CONTEXT_RULES.GameplayContext;
    CONTEXT_RULES.MENU = CONTEXT_RULES.MenuContext;
    CONTEXT_RULES.INVENTORY = CONTEXT_RULES.InventoryContext;
    CONTEXT_RULES.JOURNAL = CONTEXT_RULES.JournalContext;
    CONTEXT_RULES.MAP = CONTEXT_RULES.MapContext;
    CONTEXT_RULES.DIALOGUE = CONTEXT_RULES.DialogueContext;
    CONTEXT_RULES.PHOTO = CONTEXT_RULES.PhotoContext;
    CONTEXT_RULES.PUZZLE = CONTEXT_RULES.PuzzleContext;
    CONTEXT_RULES.BOAT = CONTEXT_RULES.BoatContext;
    CONTEXT_RULES.CUSTOMIZATION = CONTEXT_RULES.CustomizationContext;
    CONTEXT_RULES.AUTH = CONTEXT_RULES.AuthContext;

    class InputContextManager {
        constructor() {
            this.stack = ['GameplayContext'];
        }

        _resolve(name) {
            if (!name) return 'GameplayContext';
            if (CONTEXT_RULES[name]) return name;
            const withContext = name + 'Context';
            if (CONTEXT_RULES[withContext]) return withContext;
            const upper = name.toUpperCase();
            if (CONTEXT_RULES[upper]) return upper;
            return null;
        }

        getCurrentContext() {
            return this.stack[this.stack.length - 1] || 'GameplayContext';
        }

        setContext(contextName) {
            const resolved = this._resolve(contextName);
            if (!resolved) {
                console.warn(`[InputContext] Unknown context: ${contextName}`);
                return;
            }
            this.stack = [resolved];
        }

        pushContext(contextName) {
            const resolved = this._resolve(contextName);
            if (!resolved) return;
            this.stack.push(resolved);
        }

        popContext() {
            if (this.stack.length > 1) {
                return this.stack.pop();
            }
            return this.stack[0];
        }

        isActionAllowed(action) {
            const current = this.getCurrentContext();
            const rules = CONTEXT_RULES[current];
            if (!rules || !rules.allowedActions) return true;
            return rules.allowedActions.includes(action);
        }
    }

    window.InputContextManager = InputContextManager;
})();
