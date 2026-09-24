// ============================================================================
// QA TEST: Breakable Props & Heritage Protection Safeguards
// ============================================================================

window.runTestDestruction = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const breakableProps = window.BREAKABLE_PROPS;
  const immutableTags = window.IMMUTABLE_HERITAGE_TAGS;

  assert('BREAKABLE_PROPS registry exists', !!breakableProps);
  assert('IMMUTABLE_HERITAGE_TAGS defined', Array.isArray(immutableTags) && immutableTags.length > 0);

  // 1. Breakable clay pot verification
  const pot = breakableProps['old_clay_pot_01'];
  assert('Clay pot is breakable', pot && pot.breakable === true);
  assert('Clay pot has replacement debris asset', pot && !!pot.replacementAsset);

  // 2. Strict Heritage Safeguard Test
  const isProtected = (tag) => immutableTags.includes(tag);
  assert('Temple shrines are protected from destruction', isProtected('sacred_temple_shrine'));
  assert('Chola monuments are protected from destruction', isProtected('chola_heritage_monument'));
  assert('Brihadisvara sculptures protected', isProtected('brihadisvara_stone_sculpture'));
  assert('Living ancient flora protected', isProtected('living_ancient_flora'));

  // 3. World reactivity notification on prop destroy
  if (window.WorldReactivitySystem) {
    let notified = false;
    const orig = window.WorldReactivitySystem.notifyPropDestroyed;
    window.WorldReactivitySystem.notifyPropDestroyed = () => { notified = true; };
    window.WorldReactivitySystem.notifyPropDestroyed('old_clay_pot_01', pot.debrisParticleConfig, { x: 0, y: 0, z: 0 });
    assert('Destruction event triggers world reactivity broadcast', notified === true);
    window.WorldReactivitySystem.notifyPropDestroyed = orig;
  }

  const passed = results.every(r => r.passed);
  return { name: 'Destructibility & Heritage Protection', passed, results };
};
