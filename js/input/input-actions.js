// ============================================================================
// THE WHISPERING WILDS - INPUT ACTIONS ENUM
// ============================================================================

(function() {
    const INPUT_ACTIONS = {
        // Locomotion
        MOVE_FORWARD: 'MOVE_FORWARD',
        MOVE_BACK: 'MOVE_BACK',
        MOVE_LEFT: 'MOVE_LEFT',
        MOVE_RIGHT: 'MOVE_RIGHT',
        SPRINT: 'SPRINT',
        CROUCH: 'CROUCH',
        JUMP: 'JUMP',
        INTERACT: 'INTERACT',

        // Screens & HUD
        INVENTORY: 'INVENTORY',
        JOURNAL: 'JOURNAL',
        MAP: 'MAP',
        PLAYER: 'PLAYER',
        PHOTO_MODE: 'PHOTO_MODE',
        PAUSE: 'PAUSE',

        // Actions & Tools
        USE_ITEM: 'USE_ITEM',
        PRIMARY_ACTION: 'PRIMARY_ACTION',
        SECONDARY_ACTION: 'SECONDARY_ACTION',

        // Camera
        CAMERA_LOOK_X: 'CAMERA_LOOK_X',
        CAMERA_LOOK_Y: 'CAMERA_LOOK_Y',

        // Vehicles & Traversal
        BOAT_FORWARD: 'BOAT_FORWARD',
        BOAT_REVERSE: 'BOAT_REVERSE',
        BOAT_TURN_LEFT: 'BOAT_TURN_LEFT',
        BOAT_TURN_RIGHT: 'BOAT_TURN_RIGHT',

        // Specific Modes
        PUZZLE_ACTION: 'PUZZLE_ACTION',
        DIALOGUE_ADVANCE: 'DIALOGUE_ADVANCE',
        DIALOGUE_CHOICE_1: 'DIALOGUE_CHOICE_1',
        DIALOGUE_CHOICE_2: 'DIALOGUE_CHOICE_2',
        DIALOGUE_CHOICE_3: 'DIALOGUE_CHOICE_3',

        // Menus
        MENU_UP: 'MENU_UP',
        MENU_DOWN: 'MENU_DOWN',
        MENU_LEFT: 'MENU_LEFT',
        MENU_RIGHT: 'MENU_RIGHT',
        MENU_CONFIRM: 'MENU_CONFIRM',
        MENU_BACK: 'MENU_BACK'
    };

    window.INPUT_ACTIONS = INPUT_ACTIONS;
})();
