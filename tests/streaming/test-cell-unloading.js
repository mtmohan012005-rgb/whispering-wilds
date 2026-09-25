/**
 * tests/streaming/test-cell-unloading.js
 * Verifies safe cell unloading, distance hysteresis, oscillation prevention,
 * player cell protection, and resource disposal.
 */

(function () {
  'use strict';

  async function runTestCellUnloading() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const StreamSysClass = window.WorldStreamingSystem;
    const StreamData = window.STREAMING_DATA;
    assert('WorldStreamingSystem class is available', !!StreamSysClass);
    assert('STREAMING_DATA is available', !!StreamData);

    const streamSys = new StreamSysClass(null, null);

    // 1. Verify Hysteresis Invariant (Section 59, 60)
    // unloadCellRadius > preloadCellRadius > activeCellRadius
    const prof = StreamData.HARDWARE_STREAMING_PROFILES.MEDIUM;
    assert('Medium profile activeRadius < preloadRadius', prof.activeCellRadius < prof.preloadCellRadius);
    assert('Medium profile preloadRadius < unloadRadius', prof.preloadCellRadius < prof.unloadCellRadius);
    assert('Hysteresis margin is at least 30m', prof.hysteresisMargin >= 30.0);

    // 2. Safe Deactivation Flow (Section 96)
    const cell = streamSys.cellManager.getCell('CELL_CHE_002');
    streamSys.activateCell(cell);
    assert('CELL_CHE_002 is ACTIVE', streamSys.cellManager.getCellState('CELL_CHE_002') === 'ACTIVE');

    streamSys.deactivateCell('CELL_CHE_002');
    assert('CELL_CHE_002 is DEACTIVATING', streamSys.cellManager.getCellState('CELL_CHE_002') === 'DEACTIVATING');
    assert('Grace period frame countdown registered', streamSys.deactivatingGraceFrames.has('CELL_CHE_002'));

    // Step grace frames to process safe unload
    streamSys.processPendingUnloads();
    streamSys.processPendingUnloads();
    streamSys.processPendingUnloads();
    streamSys.processPendingUnloads();
    assert('CELL_CHE_002 transitioned to UNLOADED after grace period', streamSys.cellManager.getCellState('CELL_CHE_002') === 'UNLOADED');

    // 3. Player Cell Protection (Section 8)
    // Current player cell must NEVER unload even if simulated distance is far
    const currentCell = streamSys.cellManager.getCell('CELL_CHE_001');
    streamSys.activateCell(currentCell);
    streamSys.currentPlayerCellId = 'CELL_CHE_001';

    const isProtected = streamSys.priorityManager.isCellProtected('CELL_CHE_001', 'CELL_CHE_001');
    assert('Current player cell is unconditionally protected', isProtected === true);

    streamSys.queueCellForUnload('CELL_CHE_001');
    assert('Player cell was rejected from unload queue', streamSys.cellManager.getCellState('CELL_CHE_001') === 'ACTIVE');

    // 4. Collision Range Protection (Section 8, 65)
    const nearPlayerPos = { x: -260, y: 1.5, z: -10 };
    const prio = streamSys.priorityManager.calculatePriority(currentCell, nearPlayerPos, 'CELL_CHE_001');
    assert('Player cell priority is PLAYER_CELL (1)', prio === 1);

    // 5. Complete Unload & Reset Verification (Section 130)
    streamSys.activateCell(streamSys.cellManager.getCell('CELL_CHE_003'));
    streamSys.activateCell(streamSys.cellManager.getCell('CELL_CHE_004'));
    assert('Multiple cells active before reset', streamSys.getActiveCellCount() >= 2);

    streamSys.unloadAllCells();
    assert('unloadAllCells left exactly 0 active gameplay cells', streamSys.getActiveCellCount() === 0);
    assert('Pending unload queue is empty', streamSys.pendingUnloadQueue.length === 0);

    return results;
  }

  window.runTestCellUnloading = runTestCellUnloading;
})();
