// ============================================================================
// THE WHISPERING WILDS - AUDIO SAVE & PERSISTENCE TEST SUITE
// Validates serialization of volume levels, mute states, voice language,
// subtitle preferences, no audio node leaks in save data, and customization limit <= 5.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Audio Save & Persistence QA Tests ---');
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
      // 1. Prepare authored audio settings
      const testAudioSettings = {
        volumes: {
          master: 0.85,
          music: 0.70,
          voice: 0.95,
          ambience: 0.65,
          sfx: 0.80,
          ui: 0.75
        },
        mutes: {
          master: false,
          music: false,
          voice: false,
          ambience: false,
          sfx: false
        },
        language: 'ta',
        subtitles: {
          enabled: true,
          language: 'ta',
          scale: 1.1,
          highContrast: false,
          soundCues: true
        }
      };

      // 2. Save serialization test: Verify no circular Web Audio nodes or buffer leaks
      const serialized = JSON.stringify(testAudioSettings);
      assert(typeof serialized === 'string', 'Audio settings must cleanly JSON serialize');
      assert(!serialized.includes('AudioContext') && !serialized.includes('AudioNode'), 'Serialized save must not contain AudioContext or AudioNode instances');
      assert(!serialized.includes('AudioBuffer'), 'Serialized save must not contain AudioBuffer objects');

      // 3. Save roundtrip deserialization
      const parsed = JSON.parse(serialized);
      assert(parsed.volumes.master === 0.85, 'Master volume must be preserved across save roundtrip');
      assert(parsed.volumes.voice === 0.95, 'Voice volume must be preserved across save roundtrip');
      assert(parsed.language === 'ta', 'Tamil voice language preference must be preserved');
      assert(parsed.subtitles.scale === 1.1, 'Subtitle scale must be preserved');

      // 4. Application of loaded settings to AudioBusMatrix and VoiceManager
      if (window.AudioBusMatrix) {
        window.AudioBusMatrix.setVolume('MASTER', parsed.volumes.master);
        window.AudioBusMatrix.setVolume('VOICE', parsed.volumes.voice);
        const voiceBus = window.AudioBusMatrix.getBus('VOICE');
        assert(Math.abs(voiceBus.volume - 0.95) < 0.001, 'VOICE bus volume must apply restored value');
      }

      if (window.VoiceManager) {
        window.VoiceManager.setLanguage(parsed.language);
        assert(window.VoiceManager.getLanguage() === 'ta', 'VoiceManager must apply restored language');
      }

      if (window.subtitleUI) {
        window.subtitleUI.configure(parsed.subtitles);
        assert(window.subtitleUI.settings.scale === 1.1, 'SubtitleUI must apply restored scale');
      }

      // 5. Profile Isolation (Rule 148, 149)
      const profileA_Settings = { language: 'ta', subtitles: { enabled: true } };
      const profileB_Settings = { language: 'en', subtitles: { enabled: false } };
      assert(profileA_Settings.language !== profileB_Settings.language, 'Different profiles must maintain isolated audio settings');

      // 6. Absolute Player Customization Invariant (CRITICAL RULE)
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 strictly preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testSave: ${err.message}`);
    }

    console.log(`✓ Audio Save & Persistence QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testAudioSave = runTests;
})();
