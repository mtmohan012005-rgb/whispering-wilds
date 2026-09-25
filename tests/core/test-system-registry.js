/**
 * tests/core/test-system-registry.js
 * Unit tests for SystemRegistry duplicate prevention, dependency ordering,
 * and critical system validation.
 */

(function () {
  'use strict';

  function runTestSystemRegistry() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const sr = window.SystemRegistry;
    assert('SystemRegistry is instantiated', !!sr);

    // Test 1: Register subsystems
    const fakeRenderer = { healthCheck: () => 'healthy', shutdown: () => {} };
    const fakeTerrain = { healthCheck: () => 'healthy', shutdown: () => {} };
    const fakeThreeWorld = { healthCheck: () => 'healthy', shutdown: () => {} };

    sr.register('TestRenderer', fakeRenderer, { version: '1.0.0', dependencies: [] });
    sr.register('TestTerrain', fakeTerrain, { version: '1.0.0', dependencies: ['TestRenderer'] });
    sr.register('TestThreeWorld', fakeThreeWorld, { version: '1.0.0', dependencies: ['TestRenderer', 'TestTerrain'] });

    assert('TestRenderer is registered', sr.has('TestRenderer') === true);
    assert('TestThreeWorld is registered', sr.has('TestThreeWorld') === true);

    // Test 2: Duplicate registration prevented
    const duplicateReg = sr.register('TestRenderer', { healthCheck: () => 'failed' });
    assert('Duplicate registration for TestRenderer is rejected', duplicateReg === false);
    assert('Original instance retained', sr.get('TestRenderer') === fakeRenderer);

    // Test 3: Dependency Ordering
    const order = sr.getDependencyOrder();
    const rendererIdx = order.indexOf('TestRenderer');
    const terrainIdx = order.indexOf('TestTerrain');
    const worldIdx = order.indexOf('TestThreeWorld');
    assert('Dependency order places TestRenderer before TestTerrain', rendererIdx < terrainIdx);
    assert('Dependency order places TestTerrain before TestThreeWorld', terrainIdx < worldIdx);

    // Test 4: Health Check
    const health = sr.healthCheckAll();
    assert('Health check runs across registered systems', typeof health === 'object' && health.report !== undefined);

    // Cleanup test systems
    sr.unregister('TestRenderer');
    sr.unregister('TestTerrain');
    sr.unregister('TestThreeWorld');

    return results;
  }

  window.runTestSystemRegistry = runTestSystemRegistry;
})();
