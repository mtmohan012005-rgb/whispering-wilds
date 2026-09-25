/**
 * IPC Validation & Payload Security Unit Tests
 */

const { registerSystemIPC } = require('../electron/ipc/system-api');
const { registerSaveIPC } = require('../electron/ipc/save-api');

function runIpcTests() {
  const results = { name: 'IpcTests', passed: 0, failed: 0, errors: [] };

  function assert(condition, message) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(message);
    }
  }

  const handlers = {};
  const mockIpcMain = {
    handle(channel, fn) {
      handlers[channel] = fn;
    },
    on(channel, fn) {
      handlers[channel] = fn;
    }
  };

  registerSystemIPC(mockIpcMain);
  registerSaveIPC(mockIpcMain);

  // 1. Handlers registered
  assert(typeof handlers['system:get-info'] === 'function', 'system:get-info registered');
  assert(typeof handlers['system:set-window-mode'] === 'function', 'system:set-window-mode registered');
  assert(typeof handlers['save:write'] === 'function', 'save:write registered');
  assert(typeof handlers['save:read'] === 'function', 'save:read registered');

  // 2. Reject malformed window mode
  handlers['system:set-window-mode']({}, { mode: 'INVALID_MODE' }).then(res => {
    assert(res.success === false, 'Invalid window mode rejected');
  });

  // 3. Reject oversized or corrupt save payload
  handlers['save:write']({}, null).then(res => {
    assert(res.success === false, 'Null save payload rejected');
  });

  // 4. Reject customization ceiling violation (>5 changes)
  const illegalSavePayload = {
    slotId: 'slot_illegal',
    data: {
      player: {
        customizationChangesUsed: 6 // Exceeds absolute ceiling!
      }
    }
  };

  handlers['save:write']({}, illegalSavePayload).then(res => {
    assert(res.success === false, 'Save exceeding customization ceiling (>5) rejected');
  });

  // 5. Allow valid save payload (changes <= 5)
  const validSavePayload = {
    slotId: 'slot_valid_test',
    data: {
      version: '1.0.0',
      player: {
        customizationChangesUsed: 3
      }
    }
  };

  handlers['save:write']({}, validSavePayload).then(res => {
    assert(res.success === true, 'Valid save payload accepted');
  });

  return results;
}

if (require.main === module) {
  const r = runIpcTests();
  console.log(`[IpcTest] Passed: ${r.passed}, Failed: ${r.failed}`);
  if (r.failed > 0) {
    r.errors.forEach(e => console.error(' *', e));
    process.exit(1);
  }
}

module.exports = { runIpcTests };
