/**
 * Automated QA Test: World Systems, Deterministic RNG, and Region Progression
 */

window.testWorldSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA WORLD] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    // 1. WorldRNG Determinism (Mulberry32)
    if (typeof window.WorldRNG !== 'function') throw new Error('WorldRNG is not defined');
    const rng1 = new window.WorldRNG(4242);
    const seq1 = [rng1.next(), rng1.next(), rng1.next()];
    const rng2 = new window.WorldRNG(4242);
    const seq2 = [rng2.next(), rng2.next(), rng2.next()];
    const isDeterministic = seq1.every((val, idx) => Math.abs(val - seq2[idx]) < 1e-9);
    log('Deterministic WorldRNG Reproducibility', isDeterministic,
      `Seq1: ${seq1.map(v => v.toFixed(4)).join(', ')}`);

    // 2. World Unlock System & Prerequisite Gating
    const wus = window.worldUnlockSystem || (window.WorldUnlockSystem ? new window.WorldUnlockSystem() : null);
    if (!wus) throw new Error('WorldUnlockSystem is not defined');
    const startingUnlocked = wus.isUnlocked('george_town');
    const unearnedLocked = !wus.isUnlocked('nilgiris');
    const nilgirisRequirements = wus.getUnlockRequirements('nilgiris');
    log('Narrative Region Unlock Gating', startingUnlocked && unearnedLocked && nilgirisRequirements.length > 0,
      `George Town: ${startingUnlocked}, Nilgiris Locked: ${unearnedLocked}, Prereqs: ${nilgirisRequirements.join(', ')}`);

    // 3. Region Bounds & Geo-Location Integrity
    const gt = wus.regions['george_town'];
    const picha = wus.regions['pichavaram'];
    const boundsValid = gt && picha && gt.bounds.minX < gt.bounds.maxX && picha.bounds.minX > gt.bounds.maxX;
    log('Region Bounds & Spatial Geography', boundsValid,
      `George Town bounds: [${gt?.bounds?.minX}, ${gt?.bounds?.maxX}], Pichavaram bounds: [${picha?.bounds?.minX}, ${picha?.bounds?.maxX}]`);

    // 4. Dynamic Weather & Environmental Temperature Sync
    const weather = window.gameWeather || (window.Weather ? new window.Weather() : null);
    const hasWeather = weather && typeof weather.currentWeather === 'string';
    log('Dynamic Weather & Environmental Sync', hasWeather,
      `Weather: ${weather?.currentWeather}, Wind: ${weather?.windSpeed}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('World Test Failure', false, err.message);
    return { passed: false, results };
  }
};
