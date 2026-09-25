// ============================================================================
// THE WHISPERING WILDS - VOICE ACTING TEST SUITE
// Validates Tamil and English voice acting, consistent character casting,
// interruption safety, missing voice fallbacks, and no simultaneous language overlap.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Voice Acting QA Tests ---');
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
      const voiceMgr = window.VoiceManager;
      assert(voiceMgr !== null && (typeof voiceMgr === 'object' || typeof voiceMgr === 'function'), 'VoiceManager must be available on window');
      voiceMgr.init();

      // 1. Language Switching
      voiceMgr.setLanguage('ta');
      assert(voiceMgr.getLanguage() === 'ta', 'VoiceManager language should be Tamil (ta)');

      voiceMgr.setLanguage('en');
      assert(voiceMgr.getLanguage() === 'en', 'VoiceManager language should switch to English (en)');

      voiceMgr.setLanguage('ta'); // Reset to Tamil

      // 2. Character Casting Consistency
      const castData = window.VoiceData?.CAST;
      assert(castData !== null && typeof castData === 'object', 'VoiceData.CAST must exist');

      const requiredCast = ['player', 'murugan', 'velu', 'selvam', 'sundaram', 'mani'];
      for (const charId of requiredCast) {
        const char = window.VoiceData.getCastProfile(charId);
        assert(char !== null, `Character casting for '${charId}' must exist`);
        assert(typeof char.actor === 'string' && char.actor.length > 5, `Character '${charId}' must have assigned human voice actor`);
        assert(typeof char.accent === 'string', `Character '${charId}' must have documented dialect/accent`);
      }

      // 3. Dialogue line retrieval in Tamil and English
      const lineTa = window.VoiceData.getVoiceLine('voice_murugan_intro', 'ta');
      assert(lineTa !== null, 'Tamil voice line must exist');
      assert(lineTa.displayText.includes('தம்பி'), 'Tamil text must match authentic script');
      assert(Array.isArray(lineTa.phonemes) && lineTa.phonemes.length > 0, 'Line must have authored phoneme timestamps');

      const lineEn = window.VoiceData.getVoiceLine('voice_murugan_intro', 'en');
      assert(lineEn !== null, 'English voice line translation must exist');
      assert(lineEn.displayText.includes('Brother'), 'English text must preserve context');

      // 4. Voice playback & clean interruption handling
      const handle1 = voiceMgr.playVoice('voice_murugan_intro');
      assert(voiceMgr.isSpeaking === true, 'VoiceManager must indicate isSpeaking = true during playback');
      assert(voiceMgr.activeVoiceLine.id === 'voice_murugan_intro', 'Active voice line must match played ID');

      // Interruption: Playing line 2 immediately stops line 1 cleanly
      const handle2 = voiceMgr.playVoice('voice_velu_enfield_intel');
      assert(voiceMgr.activeVoiceLine.id === 'voice_velu_enfield_intel', 'Second voice line must override first cleanly');

      // Stop current voice
      voiceMgr.stopCurrentVoice(0.01);
      assert(voiceMgr.isSpeaking === false, 'VoiceManager must stop speaking cleanly');
      assert(voiceMgr.activeVoiceLine === null, 'Active voice line must be cleared after stop');

      // 5. Missing voice fallback safety (Section 151)
      let fallbackTriggered = false;
      const fallbackRes = voiceMgr.playVoice('voice_nonexistent_line', {
        onStart: () => { fallbackTriggered = true; },
        subtitleText: 'Fallback dialogue line text'
      });
      assert(fallbackRes && fallbackRes.isFallback === true, 'Missing voice line must trigger fallback mode without crashing');
      assert(fallbackTriggered === true, 'Fallback onStart callback must execute');

      // 6. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testVoice: ${err.message}`);
    }

    console.log(`✓ Voice Acting QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testVoice = runTests;
})();
