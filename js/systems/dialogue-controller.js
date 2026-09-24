/**
 * The Whispering Wilds (Kaattu Vazhi) - Dialogue Controller
 * Manages conversational line sequencing, bilingual Tamil + English subtitles,
 * voice playback with automatic subtitle fallback, and interactive choice branching.
 */

class DialogueController {
  constructor(cinematicUI, dialogueChoiceUI) {
    this.ui = cinematicUI;
    this.choiceUI = dialogueChoiceUI;
    this.isActive = false;
    this.isPaused = false;
    this.lines = [];
    this.currentLineIndex = -1;
    this.onCompleteCallback = null;
    this.activeLine = null;
    this.lineTimer = null;
  }

  startDialogue(dialogueSequence = [], onComplete = null) {
    if (!Array.isArray(dialogueSequence) || dialogueSequence.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    this.lines = dialogueSequence;
    this.currentLineIndex = -1;
    this.onCompleteCallback = onComplete;
    this.isActive = true;
    this.isPaused = false;

    console.log(`[DialogueController] Starting dialogue sequence (${this.lines.length} lines)`);
    this.advance();
  }

  advance() {
    if (!this.isActive || this.isPaused) return;

    if (this.lineTimer) {
      clearTimeout(this.lineTimer);
      this.lineTimer = null;
    }

    this.currentLineIndex++;
    if (this.currentLineIndex >= this.lines.length) {
      this.endDialogue();
      return;
    }

    const line = this.lines[this.currentLineIndex];
    this.showLine(line);
  }

  showLine(line) {
    this.activeLine = line;

    // Apply facial expression if specified
    if (line.facialExpression && window.facialExpressionSystem) {
      window.facialExpressionSystem.setExpression(line.facialExpression);
    }

    // Trigger camera framing if specified
    if (line.cameraShot && window.cameraDirector) {
      window.cameraDirector.setShot(line.cameraShot, line.speaker === 'player' ? 'player' : 'target', 0.8);
    }

    // Display subtitle in UI
    if (this.ui) {
      this.ui.showSubtitle({
        speaker: line.speaker || 'Narrator',
        tamilText: line.tamilText || '',
        englishText: line.englishText || ''
      });
    }

    // Attempt voice playback or fallback to subtitle timer
    const voiceClip = line.voiceTamil || line.voiceEnglish;
    if (voiceClip && window.audioManager && window.audioManager.playVoice) {
      window.audioManager.playVoice(voiceClip);
    }

    // If duration specified, schedule auto-advance unless waiting for player input
    if (line.duration && line.duration > 0) {
      this.lineTimer = setTimeout(() => {
        this.advance();
      }, line.duration * 1000);
    }
  }

  showChoice(choices = [], onSelect = null) {
    if (!this.choiceUI) return;
    this.isPaused = true;
    this.choiceUI.show(choices, (selectedIdx) => {
      this.isPaused = false;
      if (onSelect) onSelect(selectedIdx);
      this.advance();
    });
  }

  choose(choiceIndex) {
    if (this.choiceUI) {
      this.choiceUI.selectChoice(choiceIndex);
    }
  }

  pause() {
    this.isPaused = true;
    if (this.lineTimer) {
      clearTimeout(this.lineTimer);
      this.lineTimer = null;
    }
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.advance();
  }

  endDialogue() {
    if (!this.isActive) return;
    this.isActive = false;
    this.activeLine = null;

    if (this.lineTimer) {
      clearTimeout(this.lineTimer);
      this.lineTimer = null;
    }

    if (this.ui) {
      this.ui.hideSubtitle();
    }

    console.log('[DialogueController] Dialogue sequence ended.');
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }
}

window.DialogueController = DialogueController;
