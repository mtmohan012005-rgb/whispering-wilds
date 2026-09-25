/**
 * tests/streaming/test-performance.js
 * Verifies per-frame CPU/GPU streaming budgets, dynamic throttling during frame drops,
 * hardware scaling across LOW, MEDIUM, HIGH, and ULTRA profiles, and zero-stutter batching.
 */

(function () {
  'use strict';

  async function runTestPerformance() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const BudgetMgrClass = window.StreamingBudgetManager;
    const AssetMgrClass = window.AssetStreamingManager;
    const StreamData = window.STREAMING_DATA;
    assert('StreamingBudgetManager class is available', !!BudgetMgrClass);
    assert('AssetStreamingManager class is available', !!AssetMgrClass);
    assert('STREAMING_DATA is available', !!StreamData);

    const budgetMgr = new BudgetMgrClass('MEDIUM');
    const assetMgr = new AssetMgrClass(null, budgetMgr);

    // 1. Hardware Profile Scaling (Section 54-57, 141)
    budgetMgr.applyProfile('LOW');
    assert('LOW profile has smaller CPU budget (2.5ms)', budgetMgr.cpuBudgetMs <= 2.5);
    assert('LOW profile limits max load tasks to 1', budgetMgr.maxLoadTasksPerFrame === 1);

    budgetMgr.applyProfile('MEDIUM');
    assert('MEDIUM profile sets 4.0ms CPU budget', budgetMgr.cpuBudgetMs === 4.0);
    assert('MEDIUM profile permits 3 GPU uploads', budgetMgr.gpuUploadBudget === 3);

    budgetMgr.applyProfile('HIGH');
    assert('HIGH profile scales CPU budget to 6.0ms', budgetMgr.cpuBudgetMs === 6.0);
    assert('HIGH profile permits 5 GPU uploads', budgetMgr.gpuUploadBudget === 5);

    budgetMgr.applyProfile('ULTRA');
    assert('ULTRA profile scales CPU budget to 8.0ms', budgetMgr.cpuBudgetMs === 8.0);
    assert('ULTRA profile permits 8 GPU uploads', budgetMgr.gpuUploadBudget === 8);
    assert('ULTRA profile does NOT assume infinite memory (finite budget)', budgetMgr.profile.budgets.textures === 256);

    // 2. CPU Frame Budget Throttling (Section 16, 93)
    budgetMgr.applyProfile('MEDIUM');
    budgetMgr.beginFrame();
    assert('Initial frame CPU work is 0ms', budgetMgr.cpuWorkMs === 0);

    // Simulate 3.8ms of streaming work
    budgetMgr.recordCpuWork(3.8);
    assert('Work permitted within 4.0ms budget', budgetMgr.canDoCpuWork(0.1) === true);
    assert('Heavy 2.0ms work BLOCKED because it exceeds 4.0ms budget', budgetMgr.canDoCpuWork(2.0) === false);

    // 3. GPU Upload Limit per Frame (Section 17)
    budgetMgr.beginFrame();
    assert('Initial GPU upload permitted', budgetMgr.canDoGpuUpload() === true);
    budgetMgr.recordGpuUpload();
    budgetMgr.recordGpuUpload();
    budgetMgr.recordGpuUpload();
    assert('GPU upload budget limit (3) reached', budgetMgr.currentGpuUploadsThisFrame === 3);
    assert('4th GPU upload in same frame BLOCKED to prevent driver stalls', budgetMgr.canDoGpuUpload() === false);

    // 4. Batch Staged Task Processing & Queue Deferral (Section 94, 95)
    // Enqueue 10 asset tasks
    for (let i = 0; i < 10; i++) {
      assetMgr.enqueueTask({
        cellId: 'CELL_CHE_001',
        assetId: `bazaar_prop_${i}`,
        type: 'prop',
        priority: 3
      });
    }
    assert('Queue received 10 tasks', assetMgr.queue.length === 10);

    // Process single frame with medium budget
    budgetMgr.beginFrame();
    assetMgr.processFrame(budgetMgr);

    // Verify tasks were throttled across frames (not all 10 processed instantly in one frame)
    assert('Asset manager deferred tasks to avoid frame freeze (queue still has tasks or pending items)',
      assetMgr.queue.length > 0 || assetMgr.pendingPrepare.length > 0 || assetMgr.pendingActivate.length > 0);

    // 5. Dynamic Frame Time Spike Feedback (Section 92)
    // Simulate sudden frame drop (33ms = 30 FPS spike on a 60 FPS target)
    budgetMgr.setFrameTimeFeedback(33.0, 60);
    assert('Frame drop triggered dynamic throttle reduction', budgetMgr.throttleFactor < 1.0);
    assert('Frame stressed flag set to true', budgetMgr.isFrameStressed === true);

    // Healthy frames restore throttle factor
    for (let i = 0; i < 15; i++) {
      budgetMgr.setFrameTimeFeedback(15.0, 60);
    }
    assert('Healthy frame times restored throttle factor towards 1.0', budgetMgr.throttleFactor >= 0.9);

    return results;
  }

  window.runTestPerformance = runTestPerformance;
})();
