/**
 * tests/streaming/test-cell-loading.js
 * Verifies cell architecture, spatial AABB queries, neighbor graph traversal,
 * authoritative cell lifecycle transitions, and staged loading.
 */

(function () {
  'use strict';

  async function runTestCellLoading() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    // 1. Availability of Modules
    const cellData = window.WORLD_CELL_DATA;
    const CellMgrClass = window.WorldCellManager;
    const StreamSysClass = window.WorldStreamingSystem;

    assert('WORLD_CELL_DATA is loaded with 28 cells', !!cellData && Object.keys(cellData.CELLS).length === 28);
    assert('WorldCellManager class is available', !!CellMgrClass);
    assert('WorldStreamingSystem class is available', !!StreamSysClass);

    const cellMgr = new CellMgrClass(cellData);

    // 2. Spatial AABB Query Verification (Section 12)
    const cheCell = cellMgr.getCellAt(-260, 1.5, -20);
    assert('Spatial AABB query at (-260, 1.5, -20) resolves to CELL_CHE_001', cheCell && cheCell.id === 'CELL_CHE_001');

    const nilCell = cellMgr.getCellAt(260, 35, 10);
    assert('Spatial AABB query at (260, 35, 10) resolves to CELL_NIL_004', nilCell && nilCell.id === 'CELL_NIL_004');

    const picCell = cellMgr.getCellAt(-85, 0, -50);
    assert('Spatial AABB query in mangroves resolves to CELL_PIC_001', picCell && picCell.id === 'CELL_PIC_001');

    // 3. Fast Neighbor Graph Traversal (Section 11)
    const neighbors = cellMgr.getNeighbors('CELL_CHE_001');
    assert('CELL_CHE_001 has valid neighbors in graph', neighbors.length >= 2);
    const neighborIds = neighbors.map(n => n.id);
    assert('Neighbor graph includes CELL_CHE_002 and CELL_CHE_003', neighborIds.includes('CELL_CHE_002') && neighborIds.includes('CELL_CHE_003'));

    // 4. Authoritative State Lifecycle Transitions (Section 4)
    assert('Initial cell state is UNLOADED', cellMgr.getCellState('CELL_CHE_001') === 'UNLOADED');

    // Valid progression: UNLOADED -> QUEUED -> LOADING -> LOADED -> ACTIVE
    const qOk = cellMgr.setCellState('CELL_CHE_001', 'QUEUED');
    assert('Transition UNLOADED -> QUEUED succeeded', qOk === true && cellMgr.getCellState('CELL_CHE_001') === 'QUEUED');

    const lOk = cellMgr.setCellState('CELL_CHE_001', 'LOADING');
    assert('Transition QUEUED -> LOADING succeeded', lOk === true && cellMgr.getCellState('CELL_CHE_001') === 'LOADING');

    const ldOk = cellMgr.setCellState('CELL_CHE_001', 'LOADED');
    assert('Transition LOADING -> LOADED succeeded', ldOk === true && cellMgr.getCellState('CELL_CHE_001') === 'LOADED');

    const aOk = cellMgr.setCellState('CELL_CHE_001', 'ACTIVE');
    assert('Transition LOADED -> ACTIVE succeeded', aOk === true && cellMgr.getCellState('CELL_CHE_001') === 'ACTIVE');
    assert('activeCellIds tracks activated cell', cellMgr.activeCellIds.has('CELL_CHE_001'));

    // Illegal progression: UNLOADED cell directly to ACTIVE must fail
    const illegalOk = cellMgr.setCellState('CELL_CHE_002', 'ACTIVE');
    assert('Illegal jump from UNLOADED directly to ACTIVE blocked', illegalOk === false && cellMgr.getCellState('CELL_CHE_002') === 'UNLOADED');

    // 5. StreamingRenderer Chunk Construction (Section 20)
    const StreamRendererClass = window.StreamingRenderer;
    assert('StreamingRenderer class is available', !!StreamRendererClass);
    const renderer = new StreamRendererClass(null, null);
    const chunk = renderer.createCellTerrainChunk(cellData.CELLS.CELL_CHE_001);
    assert('StreamingRenderer built terrain chunk for CELL_CHE_001', !!chunk);

    return results;
  }

  window.runTestCellLoading = runTestCellLoading;
})();
