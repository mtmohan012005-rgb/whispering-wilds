/**
 * Platform Controller & Hotplug Unit Tests
 */

(function(root) {
  const PlatformController = typeof require !== 'undefined' ? require('../../platform/platform-controller') : root.PlatformController;

  function runControllerTests() {
    const results = { name: 'PlatformControllerTests', passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) results.passed++;
      else { results.failed++; results.errors.push(msg); }
    }

    const controller = new PlatformController();

    // 1. Initial default is KEYBOARD_MOUSE
    assert(controller.activeType === PlatformController.ControllerType.KEYBOARD_MOUSE, 'Default input type is Keyboard/Mouse');

    // 2. Connect Xbox controller
    const mockXboxPad = { index: 0, id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)' };
    controller._onGamepadConnected({ gamepad: mockXboxPad });
    assert(controller.activeType === PlatformController.ControllerType.XBOX, 'Detected Xbox controller layout');
    assert(controller.getGlyphForAction('interact').includes('A'), 'Xbox interact prompt is A');

    // 3. Connect PlayStation controller
    const mockPSPad = { index: 1, id: 'Sony Interactive Entertainment Wireless Controller (STANDARD GAMEPAD Vendor: 054c)' };
    controller._onGamepadConnected({ gamepad: mockPSPad });
    assert(controller.activeType === PlatformController.ControllerType.PLAYSTATION, 'Detected PlayStation controller layout');
    assert(controller.getGlyphForAction('interact').includes('Cross'), 'PlayStation interact prompt is Cross');

    // 4. Disconnect controllers
    controller._onGamepadDisconnected({ gamepad: mockPSPad });
    assert(controller.activeType === PlatformController.ControllerType.XBOX, 'Fell back to remaining Xbox pad');

    controller._onGamepadDisconnected({ gamepad: mockXboxPad });
    assert(controller.activeType === PlatformController.ControllerType.KEYBOARD_MOUSE, 'Fell back to Keyboard/Mouse when all gamepads disconnected');

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runControllerTests };
    if (require.main === module) {
      const r = runControllerTests();
      console.log(`[ControllerTest] Passed: ${r.passed}, Failed: ${r.failed}`);
      if (r.failed > 0) process.exit(1);
    }
  } else {
    root.testController = runControllerTests;
  }
})(typeof window !== 'undefined' ? window : global);
