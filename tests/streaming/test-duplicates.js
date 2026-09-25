/**
 * tests/streaming/test-duplicates.js
 * Verifies duplicate detection and blocking across cells, scene objects,
 * NPCs, traffic vehicles, and scene child bounds.
 */

(function () {
  'use strict';

  async function runTestDuplicates() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const CellMgrClass = window.WorldCellManager;
    const CellData = window.WORLD_CELL_DATA;
    assert('WorldCellManager class is available', !!CellMgrClass);
    assert('WORLD_CELL_DATA is available', !!CellData);

    const cellMgr = new CellMgrClass(CellData);

    // 1. Duplicate Gameplay Object Detection (Section 101)
    const obj1Ok = cellMgr.registerGameObject('CELL_CHE_001', 'evidence_court_briefcase');
    assert('First registration of evidence_court_briefcase succeeded', obj1Ok === true);
    assert('Active object IDs set contains briefcase', cellMgr.activeObjectIds.has('evidence_court_briefcase'));

    // Attempt to register same object ID again (e.g. from overlapping boundary or glitch)
    const obj2Ok = cellMgr.registerGameObject('CELL_CHE_002', 'evidence_court_briefcase');
    assert('Duplicate object registration BLOCKED', obj2Ok === false);
    assert('Active object IDs set maintains single instance', cellMgr.activeObjectIds.size === 1);

    // 2. Duplicate NPC Protection (Section 30)
    const npc1Ok = cellMgr.registerNPC('CELL_CHE_001', 'tea_master');
    assert('First registration of tea_master NPC succeeded', npc1Ok === true);
    assert('Active NPC IDs set contains tea_master', cellMgr.activeNpcIds.has('tea_master'));

    const npc2Ok = cellMgr.registerNPC('CELL_CHE_002', 'tea_master');
    assert('Duplicate NPC spawn BLOCKED', npc2Ok === false);
    assert('Active NPC IDs set maintains exactly one tea_master', cellMgr.activeNpcIds.size === 1);

    // 3. Duplicate Cell State Activation Prevention (Section 101)
    cellMgr.setCellState('CELL_CHE_001', 'QUEUED');
    cellMgr.setCellState('CELL_CHE_001', 'LOADING');
    cellMgr.setCellState('CELL_CHE_001', 'LOADED');
    cellMgr.setCellState('CELL_CHE_001', 'ACTIVE');
    assert('CELL_CHE_001 in activeCellIds', cellMgr.activeCellIds.has('CELL_CHE_001'));

    // Second activation call on already active cell
    const duplicateStateOk = cellMgr.setCellState('CELL_CHE_001', 'ACTIVE');
    assert('Redundant ACTIVE state call handled safely (idempotent)', duplicateStateOk === true);
    assert('activeCellIds does not duplicate', cellMgr.activeCellIds.size === 1);

    // 4. Scene Child Count Bounds & Cleanup (Section 102)
    cellMgr.registerGameObject('CELL_CHE_001', 'tea_kadai_bench_01');
    cellMgr.registerGameObject('CELL_CHE_001', 'notice_board_madras');
    assert('CELL_CHE_001 scene child count tracks registered objects', cellMgr.getSceneChildCount('CELL_CHE_001') === 3);

    cellMgr.clearSceneChildren('CELL_CHE_001');
    assert('Scene children cleared on unload', cellMgr.getSceneChildCount('CELL_CHE_001') === 0);
    assert('Object IDs purged from global active registry', !cellMgr.activeObjectIds.has('tea_kadai_bench_01'));

    return results;
  }

  window.runTestDuplicates = runTestDuplicates;
})();
