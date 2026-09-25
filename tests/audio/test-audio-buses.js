// ============================================================================
// THE WHISPERING WILDS - AUDIO BUSES TEST SUITE
// Validates 10 authoritative audio buses rolling into MASTER, independent
// volume controls, mute toggling, ducking multipliers, and hierarchy gains.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Audio Buses QA Tests ---');
    let passed = 0;
    let failed = 0;
    const errors = [];

    function assert(cond, msg) {
      if (cond) {
        passed++;
      } else {
        failed++;
        errors.push(msg);
        console.error(`[FAIL] ${msg}`);
      }
    }

    try {
      const busMatrix = window.AudioBusMatrix;
      assert(busMatrix !== null && typeof busMatrix === 'object', 'AudioBusMatrix must exist on window');

      // Initialize bus matrix if needed (with dummy or real AudioContext)
      if (!busMatrix.initialized) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const dummyCtx = window.audioManager?.ctx || (AudioContextClass ? new AudioContextClass() : null);
        busMatrix.init(dummyCtx);
      }

      // 1. Verify all 10 authoritative buses exist
      const requiredBuses = [
        'MASTER',
        'MUSIC',
        'VOICE',
        'AMBIENCE',
        'SFX',
        'UI',
        'WEATHER',
        'VEHICLE',
        'WILDLIFE',
        'CINEMATIC'
      ];

      for (const name of requiredBuses) {
        const bus = busMatrix.getBus(name);
        assert(bus !== null && bus.name === name, `Bus '${name}' must be registered and match name`);
      }

      // 2. Verify sub-buses roll up to MASTER
      const masterBus = busMatrix.getBus('MASTER');
      assert(masterBus.parentBus === null, 'MASTER bus must have no parent');

      const musicBus = busMatrix.getBus('MUSIC');
      assert(musicBus.parentBus === masterBus, 'MUSIC bus must roll up into MASTER');

      const voiceBus = busMatrix.getBus('VOICE');
      assert(voiceBus.parentBus === masterBus, 'VOICE bus must roll up into MASTER');

      // 3. Independent volume settings and clamping
      musicBus.setVolume(0.75);
      assert(Math.abs(musicBus.volume - 0.75) < 0.001, 'MUSIC bus volume must be set to 0.75');

      musicBus.setVolume(1.8); // Clamp to 1.0
      assert(musicBus.volume === 1.0, 'Bus volume must clamp above 1.0 to 1.0');

      musicBus.setVolume(-0.5); // Clamp to 0.0
      assert(musicBus.volume === 0.0, 'Bus volume must clamp below 0.0 to 0.0');

      // Reset
      musicBus.setVolume(0.8);

      // 4. Mute toggles without stopping playback or modifying base volume
      voiceBus.setVolume(0.9);
      voiceBus.setMute(true);
      assert(voiceBus.isMuted === true, 'VOICE bus must report isMuted = true');
      assert(voiceBus.volume === 0.9, 'Base volume must remain preserved when muted');
      assert(voiceBus.getEffectiveGain() === 0.0, 'Effective gain of muted bus must be 0.0');

      voiceBus.setMute(false);
      assert(voiceBus.isMuted === false, 'VOICE bus must unmute');
      assert(Math.abs(voiceBus.getEffectiveGain() - 0.9) < 0.01, 'Effective gain must restore to base volume');

      // 5. Dynamic ducking multiplier
      musicBus.setDucking(0.4);
      assert(Math.abs(musicBus.duckingFactor - 0.4) < 0.001, 'Ducking factor must be 0.4');
      assert(Math.abs(musicBus.getEffectiveGain() - (0.8 * 0.4)) < 0.01, 'Effective gain must reflect ducking multiplier');

      busMatrix.resetAllDucking();
      assert(musicBus.duckingFactor === 1.0, 'resetAllDucking must restore ducking factor to 1.0');

      // 6. Hierarchy gain propagation: MASTER attenuation scales child buses
      masterBus.setVolume(0.5);
      voiceBus.setVolume(0.8);
      const effectiveVoice = voiceBus.getEffectiveGain();
      assert(Math.abs(effectiveVoice - 0.4) < 0.01, `Effective voice gain must equal master * voice (expected 0.4, got ${effectiveVoice})`);

      // Reset master
      masterBus.setVolume(1.0);

      // 7. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testAudioBuses: ${err.message}`);
    }

    console.log(`✓ Audio Buses QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testAudioBuses = runTests;
})();
