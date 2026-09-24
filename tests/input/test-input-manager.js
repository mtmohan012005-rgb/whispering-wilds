// ============================================================================
// THE WHISPERING WILDS - INPUT SYSTEM UNIT TESTS
// ============================================================================

(function() {
    function runTests() {
        console.log('--- Running Central Input System Tests ---');
        let passed = 0;
        let failed = 0;

        function assert(cond, msg) {
            if (cond) {
                passed++;
            } else {
                failed++;
                console.error(`[FAIL] ${msg}`);
            }
        }

        const inputMgr = window.InputManager;
        assert(!!inputMgr, 'InputManager singleton must be initialized');

        // 1. Initial Context & Action Allowance
        assert(inputMgr.getCurrentContext() === 'GameplayContext', 'Default context must be GameplayContext');
        assert(inputMgr.contextManager.isActionAllowed('MOVE_FORWARD'), 'MOVE_FORWARD must be allowed in GameplayContext');
        assert(inputMgr.contextManager.isActionAllowed('JUMP'), 'JUMP must be allowed in GameplayContext');

        // 2. Context Switching
        inputMgr.setContext('InventoryContext');
        assert(inputMgr.getCurrentContext() === 'InventoryContext', 'Context must switch to InventoryContext');
        assert(!inputMgr.contextManager.isActionAllowed('MOVE_FORWARD'), 'MOVE_FORWARD must be blocked in InventoryContext');
        assert(inputMgr.contextManager.isActionAllowed('MENU_CONFIRM'), 'MENU_CONFIRM must be allowed in InventoryContext');

        // 3. Context Stack Push/Pop
        inputMgr.pushContext('DialogueContext');
        assert(inputMgr.getCurrentContext() === 'DialogueContext', 'Context must be DialogueContext on stack push');
        assert(inputMgr.contextManager.isActionAllowed('DIALOGUE_ADVANCE'), 'DIALOGUE_ADVANCE allowed in DialogueContext');
        inputMgr.popContext();
        assert(inputMgr.getCurrentContext() === 'InventoryContext', 'Popping context must restore InventoryContext');

        // Reset to gameplay
        inputMgr.setContext('GameplayContext');

        // 4. Gamepad Radial Deadzone Math
        const gp = inputMgr.gamepad;
        const insideDeadzone = gp.applyRadialDeadzone(0.08, 0.08); // mag ~0.113 < 0.15
        assert(insideDeadzone.x === 0 && insideDeadzone.y === 0, 'Stick inputs inside radial deadzone must be zeroed');

        const outsideDeadzone = gp.applyRadialDeadzone(0.5, 0.5); // mag ~0.707 > 0.15
        assert(outsideDeadzone.x > 0 && outsideDeadzone.y > 0, 'Stick inputs outside deadzone must be non-zero');

        // 5. Conflict & Protected Key System
        const f5Conflict = window.InputConflictSystem.findConflicts('MOVE_FORWARD', 'F5', {});
        assert(f5Conflict.hasConflict && f5Conflict.isProtected, 'F5 must be recognized as protected key');

        const existingBindings = { MOVE_FORWARD: 'KeyW', INVENTORY: 'KeyI' };
        const keyWConflict = window.InputConflictSystem.findConflicts('INTERACT', 'KeyW', existingBindings);
        assert(keyWConflict.hasConflict && !keyWConflict.isProtected, 'Binding already assigned key must flag conflict');

        // 6. Remapping Safety
        const remapRes = inputMgr.remapping.remapAction('INTERACT', 'KeyF');
        assert(remapRes.success, 'Remapping to unassigned key must succeed');
        assert(inputMgr.remapping.getBindings().INTERACT === 'KeyF', 'Bindings must reflect remapped key');

        // Restore defaults
        inputMgr.remapping.resetToDefaults();
        assert(inputMgr.remapping.getBindings().INTERACT === 'KeyE', 'Resetting defaults must restore KeyE');

        // 7. Permanent Customization Limit Unaffected
        const customChanges = window.GameState?.customizationChangesUsed || 0;
        inputMgr.remapping.applyPreset('LEFT_HANDED');
        inputMgr.remapping.resetToDefaults();
        assert((window.GameState?.customizationChangesUsed || 0) === customChanges, 'Input remapping must NEVER alter customization counter');

        console.log(`✓ Input System Tests Complete: ${passed} passed, ${failed} failed`);
        return failed === 0;
    }

    window.testInputSystem = runTests;
})();
