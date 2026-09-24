// ============================================================================
// QA TEST: Procedural Vegetation Reaction, Bending & Spring Recovery
// ============================================================================

window.runTestVegetationReaction = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const sys = window.VegetationReactionSystem;
  assert('VegetationReactionSystem exists', !!sys);

  const cluster = sys.registerCluster('test_grass_cluster', 20, 0, 20, 1.2, 'grass');
  assert('Vegetation cluster registered', !!cluster);

  // Moving player approaches cluster
  const player = { x: 19.8, y: 0, z: 19.8, isMoving: true, angle: Math.PI / 4 };
  sys.update(0.016, player, { current: { windSpeed: 1.0 } });

  assert('Vegetation bends away from player movement', cluster.isBent === true);
  const initialBend = Math.hypot(cluster.displacement.x, cluster.displacement.z);
  assert('Displacement registered', initialBend > 0);

  // Player leaves area — simulate spring return over 1.2 seconds
  const distantPlayer = { x: 100, y: 0, z: 100, isMoving: false };
  for (let i = 0; i < 75; i++) {
    sys.update(0.016, distantPlayer, { current: { windSpeed: 0.0 } });
  }

  const finalBend = Math.hypot(cluster.displacement.x, cluster.displacement.z);
  assert('Vegetation springs back toward rest', finalBend < initialBend);

  sys.unregisterCluster('test_grass_cluster');

  const passed = results.every(r => r.passed);
  return { name: 'Vegetation Bending & Spring Recovery', passed, results };
};
