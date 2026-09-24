/**
 * Automated QA Test: Dialogue Controller, Bilingual Subtitles & Choice Branching
 */

window.testDialogueControllerSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA DIALOGUE] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const ui = window.cinematicUI || new window.CinematicUI();
    const choiceUI = new window.DialogueChoiceUI();
    const controller = new window.DialogueController(ui, choiceUI);

    // 1. Start Bilingual Dialogue
    let finished = false;
    const testLines = [
      {
        speaker: 'Velu',
        tamilText: 'வாங்க தம்பி, ஜார்ஜ் டவுன் போகலாமா?',
        englishText: 'Welcome brother, shall we head to George Town?',
        duration: 0.1
      },
      {
        speaker: 'Arun',
        tamilText: 'போகலாம் அண்ணா.',
        englishText: 'Let us go, elder brother.',
        duration: 0.1
      }
    ];

    controller.startDialogue(testLines, () => {
      finished = true;
    });

    const isRunning = controller.isActive && controller.activeLine !== null;
    log('Bilingual Dialogue Activation', isRunning, `Active speaker: ${controller.activeLine ? controller.activeLine.speaker : 'none'}`);

    // Advance to second line
    controller.advance();
    const lineTwoActive = controller.activeLine && controller.activeLine.speaker === 'Arun';
    log('Line Sequencing & Advance', lineTwoActive, `Current speaker: ${controller.activeLine ? controller.activeLine.speaker : 'none'}`);

    // End dialogue
    controller.advance();
    log('Dialogue Sequence Completion', finished, `Finished: ${finished}`);

    // 2. Interactive Choice Selection
    let chosenIdx = -1;
    choiceUI.show([
      { text: 'Investigate Sluice', tamilText: 'மதகை ஆய்வு செய்' },
      { text: 'Ask Farmer', tamilText: 'விவசாயியிடம் கேள்' }
    ], (idx) => {
      chosenIdx = idx;
    });

    choiceUI.selectChoice(1);
    log('Branching Choice Selection via Keyboard/Mouse', chosenIdx === 1, `Selected choice index: ${chosenIdx}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Dialogue Controller Test Failure', false, err.message);
    return { passed: false, results };
  }
};
