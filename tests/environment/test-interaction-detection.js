// ============================================================================
// QA TEST: Interaction Detection, Raycasting & Priority Tiers
// ============================================================================

window.runTestInteractionDetection = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const sys = window.EnvironmentInteractionSystem;
  assert('EnvironmentInteractionSystem exists', !!sys);

  // 1. Register test props
  const p1 = new window.InteractiveProp({
    id: 'test_ambient_crate',
    name: { en: 'Ambient Crate', ta: 'மரப்பெட்டி' },
    position: { x: 10, y: 0, z: 10 },
    priorityTier: window.INTERACTION_PRIORITY.AMBIENT_PROP,
    interactionTypes: ['INSPECT', 'PUSH']
  });

  const p2 = new window.InteractiveProp({
    id: 'test_story_manuscript',
    name: { en: 'Royal Blueprint', ta: 'அரச வரைபடம்' },
    position: { x: 10, y: 0, z: 10.5 },
    priorityTier: window.INTERACTION_PRIORITY.CRITICAL_STORY,
    interactionTypes: ['READ', 'COLLECT']
  });

  sys.registerProp(p1);
  sys.registerProp(p2);

  // Query nearby
  const nearby = sys.grid.getNearby(10, 10, 3.0);
  assert('Spatial grid returns nearby props', nearby.length >= 2);

  // 2. Camera facing forward, test priority ranking
  const fakePlayer = { x: 10, y: 0, z: 8.5, isMoving: false };
  const fakeCam = {
    position: { x: 10, y: 1.5, z: 8.0 },
    getWorldDirection: () => ({ x: 0, y: 0, z: 1 })
  };

  sys.update(0.016, fakePlayer, fakeCam);
  assert('Critical story object selected over ambient object', sys.activeCandidate?.id === 'test_story_manuscript');

  // 3. Occlusion test
  sys.registerOcclusionObstacle({ x1: 5, z1: 9.5, x2: 15, z2: 9.5 }); // Wall between player and props
  const occluded = sys.isOccluded({ x: 10, z: 8.0 }, { x: 10, z: 10.5 });
  assert('Solid wall occludes interaction', occluded === true);

  // Clean up
  sys.unregisterProp('test_ambient_crate');
  sys.unregisterProp('test_story_manuscript');
  sys.occlusionObstacles = [];

  const passed = results.every(r => r.passed);
  return { name: 'Interaction Detection & Priority', passed, results };
};
