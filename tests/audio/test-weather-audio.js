// ============================================================================
// THE WHISPERING WILDS - WEATHER AUDIO TEST SUITE
// Validates environmental weather acoustics, surface-specific rain impacts
// (roof, forest, street, open, interior), wind scaling, and thunder variation.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Weather Audio QA Tests ---');
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
      const weatherSys = window.WeatherAudioSystem;
      assert(weatherSys !== null && (typeof weatherSys === 'object' || typeof weatherSys === 'function'), 'WeatherAudioSystem must exist on window');

      weatherSys.init();

      // 1. Weather State Updates (clear, drizzle, rain, storm, monsoon)
      weatherSys.setWeatherState('rain', 0.6);
      assert(weatherSys.currentWeather === 'rain', 'Weather audio state must be rain');
      assert(weatherSys.rainIntensity === 0.6, 'Rain intensity must match 0.6');

      // 2. Surface-specific Rain Acoustics (Rule 35)
      const rainSurfaces = ['roof', 'forest', 'field', 'street', 'interior'];
      for (const surf of rainSurfaces) {
        weatherSys.setEnvironmentSurface(surf);
        assert(weatherSys.currentSurface === surf, `Weather environment surface must update to ${surf}`);
        assert(typeof weatherSys.getActiveRainAsset() === 'string', `Surface ${surf} must resolve to authored rain asset`);
      }

      // 3. Heavy Rain / Monsoon Scaling (Rule 36)
      weatherSys.setWeatherState('monsoon', 1.0);
      assert(weatherSys.rainIntensity === 1.0, 'Monsoon must set max rain intensity');
      assert(weatherSys.windIntensity >= 0.8, 'Monsoon must increase wind intensity within budget');

      // 4. Thunder Audio Trigger & Accessible Sound Cue
      let cueReceived = false;
      const cueListener = (e) => {
        if (e.detail && (e.detail.cueEn === 'Thunderclap' || e.detail.cueTa === 'இடி முழக்கம்')) {
          cueReceived = true;
        }
      };
      window.addEventListener('ambient:soundcue', cueListener);

      const thunderRes = weatherSys.triggerThunder(true);
      assert(thunderRes && thunderRes.triggered === true, 'Thunder trigger must execute successfully');
      assert(cueReceived === true, 'Thunder trigger must dispatch accessible sound cue');

      window.removeEventListener('ambient:soundcue', cueListener);

      // Return weather to clear
      weatherSys.setWeatherState('clear', 0.0);
      assert(weatherSys.rainIntensity === 0.0, 'Clear weather must reduce rain intensity to zero');

      // 5. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testWeatherAudio: ${err.message}`);
    }

    console.log(`✓ Weather Audio QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testWeatherAudio = runTests;
})();
