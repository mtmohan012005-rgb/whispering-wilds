// ============================================================================
// QA TEST: Lightweight Physics Props, Soft Pushing & Sleep Optimization
// ============================================================================

window.runTestPhysicsProps = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const sys = window.PhysicsInteractionSystem;
  assert('PhysicsInteractionSystem exists', !!sys);

  const crateDef = {
    id: 'test_push_crate',
    massClass: 'LIGHT',
    massKg: 10.0,
    pushFriction: 0.85,
    collisionProfile: { radius: 0.45 }
  };

  const instance = sys.registerPhysicsProp(crateDef, { x: 50, y: 0, z: 50 });
  assert('Physics prop registered in sleeping state', instance && instance.isSleeping === true);

  // Apply push impulse
  instance.applyImpulse(20.0, 0.0);
  assert('Prop wakes up on impulse', instance.isSleeping === false);
  assert('Velocity increases along impulse direction', instance.velocity.x > 0);

  // Simulate physics update over 1.5 seconds
  for (let step = 0; step < 90; step++) {
    instance.update(0.016, sys.worldBounds, () => 0);
  }

  assert('Friction settles prop back to sleep', instance.isSleeping === true);
  assert('Final velocity reaches zero', instance.velocity.x === 0 && instance.velocity.z === 0);
  assert('Prop position moved forward from push', instance.position.x > 50);

  // Drop safety test: simulate prop falling below terrain (-20m)
  instance.position.y = -25.0;
  instance.isSleeping = false;
  instance.update(0.016, sys.worldBounds, () => 0);
  assert('Drop safety recovers fallen prop to last safe position', instance.position.y >= 0);

  sys.unregisterPhysicsProp('test_push_crate');

  const passed = results.every(r => r.passed);
  return { name: 'Lightweight Physics & Drop Safety', passed, results };
};
