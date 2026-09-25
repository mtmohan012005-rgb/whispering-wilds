/**
 * tests/streaming/test-priority.js
 * Verifies 8-level streaming priority ordering, velocity-based directional lookahead,
 * active quest dependency protection, and emergency preload escalation.
 */

(function () {
  'use strict';

  async function runTestPriority() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const PrioMgrClass = window.StreamingPriorityManager;
    const CellData = window.WORLD_CELL_DATA;
    assert('StreamingPriorityManager class is available', !!PrioMgrClass);
    assert('WORLD_CELL_DATA is available', !!CellData);

    const prioMgr = new PrioMgrClass();

    // 1. Current Player Cell Priority (Level 1)
    const playerPos = { x: -250, y: 1.5, z: 0 };
    const cellChe1 = CellData.CELLS.CELL_CHE_001;
    const p1 = prioMgr.calculatePriority(cellChe1, playerPos, 'CELL_CHE_001');
    assert('Player current cell receives Priority 1 (PLAYER_CELL)', p1 === 1);

    // 2. Immediate Collision Range Priority (Level 2)
    const cellChe2 = CellData.CELLS.CELL_CHE_002;
    const closePos = { x: -250, y: 1.5, z: 1.0 }; // right on border of CHE_002
    const p2 = prioMgr.calculatePriority(cellChe2, closePos, 'CELL_CHE_001');
    assert('Close cell in collision range receives Priority 2 (COLLISION_CELL)', p2 === 2);

    // 3. Active Quest Dependency Priority (Level 3) & Protection (Section 9)
    prioMgr.updateQuestDependencies(['CELL_CHE_003', 'CELL_THA_001']);
    assert('CELL_CHE_003 is registered in quest dependencies', prioMgr.protectedQuestCellIds.has('CELL_CHE_003'));

    const isQuestProtected = prioMgr.isCellProtected('CELL_CHE_003', 'CELL_CHE_001');
    assert('Quest cell is protected from unloading', isQuestProtected === true);

    const cellChe3 = CellData.CELLS.CELL_CHE_003;
    const farPos = { x: -280, y: 1.5, z: 40 }; // far from CHE_003
    const p3 = prioMgr.calculatePriority(cellChe3, farPos, 'CELL_CHE_001');
    assert('Quest cell receives Priority 3 (ACTIVE_QUEST_CELL)', p3 === 3);

    // 4. Directional Lookahead Velocity Prediction (Section 6, 61)
    // Simulate player running East towards positive X (towards CELL_CHE_004)
    prioMgr.updatePlayerKinematics({ x: -260, y: 1.5, z: 20 }, 0.05, 0, 'RUN'); // Heading East (0 rad)
    prioMgr.updatePlayerKinematics({ x: -250, y: 1.5, z: 20 }, 0.05, 0, 'RUN'); // vx = 200 m/s impulse

    const cellChe4 = CellData.CELLS.CELL_CHE_004; // lies in X [-245, -200]
    const p4 = prioMgr.calculatePriority(cellChe4, { x: -250, y: 1.5, z: 20 }, 'CELL_CHE_001', null, 'RUN');
    assert('Cell directly in front of velocity heading receives Priority 4 (NEXT_MOVEMENT_CELL)', p4 === 4);

    // 5. Emergency Preload Escalation (Section 42)
    assert('Rapid sprint / velocity triggered emergency preload state', prioMgr.isEmergencyPreloadActive === true);

    // 6. Distant Visual Cell (Level 8)
    const distantCell = CellData.CELLS.CELL_NIL_004; // High in Nilgiris, 500m away
    const p8 = prioMgr.calculatePriority(distantCell, { x: -250, y: 1.5, z: 0 }, 'CELL_CHE_001');
    assert('Distant cell receives Priority 8 (DISTANT_VISUAL_CELL)', p8 === 8);

    return results;
  }

  window.runTestPriority = runTestPriority;
})();
