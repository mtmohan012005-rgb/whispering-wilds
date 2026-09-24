// ============================================================================
// THE WHISPERING WILDS - DEFAULT CONTROLS CONFIGURATION
// ============================================================================

(function() {
    const DEFAULT_KEYBOARD_BINDINGS = {
        MOVE_FORWARD: 'KeyW',
        MOVE_BACK: 'KeyS',
        MOVE_LEFT: 'KeyA',
        MOVE_RIGHT: 'KeyD',
        SPRINT: 'ShiftLeft',
        CROUCH: 'ControlLeft',
        JUMP: 'Space',
        INTERACT: 'KeyE',

        INVENTORY: 'KeyI',
        JOURNAL: 'KeyJ',
        MAP: 'KeyM',
        PLAYER: 'KeyP',
        PHOTO_MODE: 'KeyF',
        PAUSE: 'Escape',

        PRIMARY_ACTION: 'Mouse0',
        SECONDARY_ACTION: 'Mouse2',
        USE_ITEM: 'KeyU',

        BOAT_FORWARD: 'KeyW',
        BOAT_REVERSE: 'KeyS',
        BOAT_TURN_LEFT: 'KeyA',
        BOAT_TURN_RIGHT: 'KeyD',

        PUZZLE_ACTION: 'Space',
        DIALOGUE_ADVANCE: 'Enter',
        DIALOGUE_CHOICE_1: 'Digit1',
        DIALOGUE_CHOICE_2: 'Digit2',
        DIALOGUE_CHOICE_3: 'Digit3',

        MENU_UP: 'ArrowUp',
        MENU_DOWN: 'ArrowDown',
        MENU_LEFT: 'ArrowLeft',
        MENU_RIGHT: 'ArrowRight',
        MENU_CONFIRM: 'Enter',
        MENU_BACK: 'Escape'
    };

    const LEFT_HANDED_KEYBOARD_BINDINGS = {
        ...DEFAULT_KEYBOARD_BINDINGS,
        MOVE_FORWARD: 'ArrowUp',
        MOVE_BACK: 'ArrowDown',
        MOVE_LEFT: 'ArrowLeft',
        MOVE_RIGHT: 'ArrowRight',
        SPRINT: 'ShiftRight',
        CROUCH: 'ControlRight',
        JUMP: 'Numpad0',
        INTERACT: 'Numpad1',
        INVENTORY: 'Numpad4',
        JOURNAL: 'Numpad5',
        MAP: 'Numpad6'
    };

    const DEFAULT_GAMEPAD_BINDINGS = {
        // Buttons
        JUMP: 0,            // A
        MENU_CONFIRM: 0,    // A
        DIALOGUE_ADVANCE: 0,// A
        CROUCH: 1,          // B
        MENU_BACK: 1,       // B
        INTERACT: 2,        // X
        PRIMARY_ACTION: 2,  // X
        INVENTORY: 3,       // Y
        SECONDARY_ACTION: 3,// Y
        SPRINT: 10,         // Left Stick Click
        PAUSE: 9,           // Start
        MAP: 8,             // Select / Back
        JOURNAL: 4,         // LB
        PHOTO_MODE: 5,      // RB

        // Triggers / Axes
        BOAT_FORWARD: 7,    // RT
        BOAT_REVERSE: 6     // LT
    };

    const DEFAULT_INPUT_PROFILE = {
        version: 1,
        preset: 'DEFAULT',
        keyboard: { ...DEFAULT_KEYBOARD_BINDINGS },
        mouse: {
            sensitivityX: 1.0,
            sensitivityY: 1.0,
            invertY: false,
            invertX: false,
            smoothing: true
        },
        gamepad: {
            deadzone: 0.15,
            sensitivityX: 1.0,
            sensitivityY: 1.0,
            invertY: false,
            vibration: true
        }
    };

    window.DEFAULT_CONTROLS = {
        KEYBOARD: DEFAULT_KEYBOARD_BINDINGS,
        LEFT_HANDED: LEFT_HANDED_KEYBOARD_BINDINGS,
        GAMEPAD: DEFAULT_GAMEPAD_BINDINGS,
        PROFILE: DEFAULT_INPUT_PROFILE
    };
})();
