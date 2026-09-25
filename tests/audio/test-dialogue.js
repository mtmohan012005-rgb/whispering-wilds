// ============================================================================
// THE WHISPERING WILDS - DIALOGUE & SUBTITLE TEST SUITE
// Validates dialogue subtitle synchronization, speaker badges, sound cues,
// accessibility styling, dialogue ducking, and phoneme lip-sync blendshapes.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Dialogue & Subtitle QA Tests ---');
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
      const subUI = window.subtitleUI;
      assert(subUI !== null && typeof subUI === 'object', 'SubtitleUI instance must exist on window');

      // 1. Configure Subtitle UI
      subUI.configure({
        enabled: true,
        language: 'ta',
        scale: 1.0,
        highContrast: false,
        soundCuesEnabled: true
      });
      assert(subUI.settings.enabled === true, 'Subtitles must be enabled');
      assert(subUI.settings.language === 'ta', 'Subtitle language must be Tamil');

      // 2. Display Tamil Subtitle with Speaker Name
      subUI.displaySubtitle({
        speakerName: 'Murugan Annan',
        speakerTamil: 'முருகன் அண்ணன்',
        tamilText: 'தம்பி! இந்த மழையில எங்க ஓடுற?',
        englishText: 'Brother! Where are you running in this rain?',
        durationSec: 3.5
      });

      assert(subUI.badgeEl.textContent.includes('முருகன் அண்ணன்'), 'Speaker badge must display Tamil speaker name in Tamil mode');
      assert(subUI.textEl.textContent.includes('தம்பி'), 'Subtitle text must display Tamil dialogue text');

      // 3. Switch language to English and display subtitle
      subUI.configure({ language: 'en' });
      subUI.displaySubtitle({
        speakerName: 'Murugan Annan',
        speakerTamil: 'முருகன் அண்ணன்',
        tamilText: 'தம்பி! இந்த மழையில எங்க ஓடுற?',
        englishText: 'Brother! Where are you running in this rain?',
        durationSec: 3.5
      });
      assert(subUI.badgeEl.textContent.includes('Murugan Annan'), 'Speaker badge must display English speaker name in English mode');
      assert(subUI.textEl.textContent.includes('Brother'), 'Subtitle text must display English dialogue text');

      // 4. Subtitle Accessibility: High Contrast & Scale
      subUI.configure({ scale: 1.25, highContrast: true });
      assert(subUI.settings.scale === 1.25, 'Subtitle scale must update to 1.25');
      assert(subUI.settings.highContrast === true, 'High contrast must be true');
      assert(subUI.container.style.backgroundColor === 'rgb(0, 0, 0)' || subUI.container.style.backgroundColor === '#000000', 'High contrast container must be solid black');

      // 5. Environmental Sound Cue Display
      subUI.displaySoundCue('இடி முழக்கம்', 'Thunderclap', 2000);
      assert(subUI.soundCueEl.textContent.includes('Thunderclap'), 'Sound cue element must display English cue in English mode');

      subUI.configure({ language: 'ta' });
      subUI.displaySoundCue('இடி முழக்கம்', 'Thunderclap', 2000);
      assert(subUI.soundCueEl.textContent.includes('இடி முழக்கம்'), 'Sound cue element must display Tamil cue in Tamil mode');

      // Dismiss subtitle
      subUI.dismiss();

      // 6. Dialogue Ducking Verification
      const mixer = window.AudioMixer;
      const busMatrix = window.AudioBusMatrix;
      if (mixer && busMatrix) {
        mixer.init(busMatrix);
        const musicBus = busMatrix.getBus('MUSIC');
        const ambienceBus = busMatrix.getBus('AMBIENCE');

        mixer.onDialogueStart('normal');
        assert(mixer.isDuckingDialogue === true, 'AudioMixer must flag isDuckingDialogue = true');
        assert(musicBus.duckingFactor < 0.6, `Music bus must be ducked during dialogue (got ${musicBus.duckingFactor})`);
        assert(ambienceBus.duckingFactor < 0.6, `Ambience bus must be ducked during dialogue (got ${ambienceBus.duckingFactor})`);

        mixer.onDialogueEnd();
        assert(mixer.isDuckingDialogue === false, 'AudioMixer must restore ducking state on dialogue end');
        assert(musicBus.duckingFactor === 1.0, 'Music bus ducking must restore to 1.0');
        assert(ambienceBus.duckingFactor === 1.0, 'Ambience bus ducking must restore to 1.0');
      }

      // 7. DialogueVoiceSystem: Lip-sync & Blendshape fallback
      const dialogueSys = window.DialogueVoiceSystem;
      if (dialogueSys) {
        dialogueSys.init();
        const testLine = window.VoiceData?.getVoiceLine('voice_murugan_intro', 'ta');
        dialogueSys.onVoiceStarted(testLine);
        assert(dialogueSys.activeVoiceLine !== null, 'DialogueVoiceSystem must register active line');

        const mouthValue = dialogueSys.getCurrentMouthOpen();
        assert(typeof mouthValue === 'number' && mouthValue >= 0.0 && mouthValue <= 1.0, 'Mouth blendshape must be in [0, 1]');

        dialogueSys.onVoiceEnded();
        assert(dialogueSys.activeVoiceLine === null, 'DialogueVoiceSystem must clear line on voice end');
        assert(dialogueSys.getCurrentMouthOpen() === 0.0, 'Mouth blendshape must reset to 0.0 on voice end');
      }

      // 8. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testDialogue: ${err.message}`);
    }

    console.log(`✓ Dialogue & Subtitle QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testDialogue = runTests;
})();
