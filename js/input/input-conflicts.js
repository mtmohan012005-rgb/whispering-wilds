// ============================================================================
// THE WHISPERING WILDS - INPUT CONFLICT & PROTECTED KEYS SYSTEM
// ============================================================================

(function() {
    const PROTECTED_KEYS = new Set(['F5', 'F11', 'F12']);

    class InputConflictSystem {
        static isProtected(code) {
            return PROTECTED_KEYS.has(code);
        }

        static findConflicts(targetAction, newCode, currentBindings) {
            if (this.isProtected(newCode)) {
                return {
                    hasConflict: true,
                    isProtected: true,
                    conflictingAction: null,
                    message: `${newCode} is a reserved system key and cannot be assigned.`
                };
            }

            for (const [action, boundCode] of Object.entries(currentBindings)) {
                if (action !== targetAction && boundCode === newCode) {
                    return {
                        hasConflict: true,
                        isProtected: false,
                        conflictingAction: action,
                        message: `Key is already assigned to ${this.formatActionName(action)}.`
                    };
                }
            }

            return { hasConflict: false };
        }

        static formatActionName(action) {
            return action
                .toLowerCase()
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
    }

    window.InputConflictSystem = InputConflictSystem;
})();
