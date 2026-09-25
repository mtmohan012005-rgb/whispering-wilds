// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DATA-DRIVEN DIALOGUE SYSTEM
// Dynamic bilingual (Tamil + English) branching dialogue engine.
// Supports nuanced tones (friendly, curious, cautious, investigative, humorous,
// culturally respectful, quest-focused), NPC relationships, reputation, and quests.
// ============================================================================

(function () {
  'use strict';

  const CHOICE_TONES = [
    'friendly',
    'curious',
    'cautious',
    'investigative',
    'humorous',
    'culturally_respectful',
    'quest_focused',
    'optional_info'
  ];

  class DataDialogueSystem {
    constructor(registry = null, eventBus = null) {
      this.registry = registry || window.ContentRegistry;
      this.eventBus = eventBus || window.ContentEvents;
      this.activeDialogue = null;
      this.currentNodeId = null;
      this.activeSpeaker = null;
      this.dialogueHistory = [];
      this.npcRelationships = new Map(); // npcId -> relationship score (-100 to 100)
    }

    init(registry = null, eventBus = null) {
      if (registry) this.registry = registry;
      if (eventBus) this.eventBus = eventBus;
      this._loadRelationshipsFromGameState();
      console.log('[DataDialogueSystem] Initialized data-driven bilingual dialogue system.');
      return this;
    }

    /**
     * Start a dialogue by ID
     */
    startDialogue(dialogueId, startNodeId = null) {
      const reg = this.registry || window.ContentRegistry;
      const dialogueDef = reg?.get('dialogue', dialogueId);

      if (!dialogueDef) {
        console.warn(`[DataDialogueSystem] Dialogue '${dialogueId}' not found in registry.`);
        return { success: false, reason: 'DIALOGUE_NOT_FOUND' };
      }

      this.activeDialogue = dialogueDef;
      this.currentNodeId = startNodeId || dialogueDef.startNode || 'start';
      this.activeSpeaker = dialogueDef.speaker || 'unknown';

      const nodeData = this.getCurrentNode();

      // Trigger audio if voiceId bound to node or dialogue
      const voiceId = nodeData?.voiceId || dialogueDef.voiceId;
      if (voiceId && window.audioManager) {
        window.audioManager.play(voiceId, { category: 'voice', busName: 'VOICE' });
      }

      // Emit event
      if (this.eventBus) {
        this.eventBus.emit('dialogue_started', {
          dialogueId,
          speaker: this.activeSpeaker,
          node: nodeData
        });
      }

      return {
        success: true,
        dialogueId,
        node: nodeData,
        speaker: this.activeSpeaker
      };
    }

    /**
     * Get current node data formatted for presentation
     */
    getCurrentNode() {
      if (!this.activeDialogue || !this.currentNodeId) return null;
      const node = this.activeDialogue.nodes?.[this.currentNodeId];
      if (!node) return null;

      // Filter available choices based on prerequisites
      const availableChoices = [];
      if (Array.isArray(node.choices)) {
        for (const ch of node.choices) {
          if (this._evaluateChoicePrerequisites(ch)) {
            availableChoices.push({
              id: ch.id || ch.nextNode,
              tone: ch.tone || 'friendly',
              textEn: ch.textEn || ch.text || '',
              textTa: ch.textTa || ch.text || '',
              nextNode: ch.nextNode,
              consequences: ch.consequences || null
            });
          }
        }
      }

      return {
        id: this.currentNodeId,
        speaker: node.speaker || this.activeSpeaker,
        textEn: node.textEn || node.text || '',
        textTa: node.textTa || node.text || '',
        emotion: node.emotion || 'neutral',
        animation: node.animation || 'talk_normal',
        facialExpression: node.facialExpression || 'normal',
        cameraDirection: node.cameraDirection || 'medium_shot',
        voiceId: node.voiceId || null,
        subtitleTiming: node.subtitleTiming || null,
        choices: availableChoices
      };
    }

    /**
     * Select a dialogue choice option
     */
    selectChoice(choiceIndexOrId) {
      const currentNode = this.getCurrentNode();
      if (!currentNode) return { success: false, reason: 'NO_ACTIVE_DIALOGUE' };

      let choice = null;
      if (typeof choiceIndexOrId === 'number') {
        choice = currentNode.choices[choiceIndexOrId];
      } else {
        choice = currentNode.choices.find(c => c.id === choiceIndexOrId || c.nextNode === choiceIndexOrId);
      }

      if (!choice) {
        return { success: false, reason: 'CHOICE_NOT_FOUND' };
      }

      // Apply choice consequences
      this._applyConsequences(choice.consequences, choice.tone);

      // Record choice in history
      this.dialogueHistory.push({
        dialogueId: this.activeDialogue.id,
        nodeId: this.currentNodeId,
        choiceId: choice.id,
        tone: choice.tone,
        timestamp: Date.now()
      });

      if (this.eventBus) {
        this.eventBus.chooseDialogueOption(this.activeDialogue.id, choice.id, choice.nextNode);
      }

      // Check if end of conversation
      if (!choice.nextNode || choice.nextNode === 'exit' || choice.nextNode === 'end') {
        return this.endDialogue('COMPLETED');
      }

      // Advance to next node
      this.currentNodeId = choice.nextNode;
      const nextNode = this.getCurrentNode();

      // Trigger audio for next node if present
      if (nextNode?.voiceId && window.audioManager) {
        window.audioManager.play(nextNode.voiceId, { category: 'voice', busName: 'VOICE' });
      }

      return {
        success: true,
        dialogueId: this.activeDialogue.id,
        node: nextNode,
        isFinished: false
      };
    }

    /**
     * End active dialogue
     */
    endDialogue(reason = 'EXIT') {
      const dialogueId = this.activeDialogue?.id;
      const speaker = this.activeSpeaker;

      this.activeDialogue = null;
      this.currentNodeId = null;
      this.activeSpeaker = null;

      if (this.eventBus) {
        this.eventBus.emit('dialogue_ended', { dialogueId, speaker, reason });
      }

      return {
        success: true,
        dialogueId,
        isFinished: true,
        reason
      };
    }

    _evaluateChoicePrerequisites(choice) {
      if (!choice.prerequisites) return true;
      if (window.ContentUtils) {
        const check = window.ContentUtils.evaluatePrerequisites(choice.prerequisites, window.GameState);
        return check.satisfied;
      }
      return true;
    }

    _applyConsequences(consequences, tone) {
      if (!consequences && !tone) return;
      const state = window.GameState;

      // 1. Relationship change with current speaker
      if (this.activeSpeaker && this.activeSpeaker !== 'player') {
        let delta = 0;
        if (tone === 'culturally_respectful') delta = 5;
        if (tone === 'friendly') delta = 3;
        if (tone === 'humorous') delta = 2;
        if (tone === 'cautious') delta = 1;
        if (tone === 'investigative') delta = 2;

        if (consequences?.relationshipDelta) {
          delta += consequences.relationshipDelta;
        }

        const current = this.npcRelationships.get(this.activeSpeaker) || 0;
        const updated = Math.max(-100, Math.min(100, current + delta));
        this.npcRelationships.set(this.activeSpeaker, updated);
      }

      // 2. Faction reputation effects
      if (consequences?.reputation && state) {
        if (!state.reputation) state.reputation = {};
        for (const [faction, val] of Object.entries(consequences.reputation)) {
          state.reputation[faction] = (state.reputation[faction] || 0) + val;
        }
      }

      // 3. Quest triggers
      if (consequences?.startQuestId && window.QuestStateMachine) {
        window.QuestStateMachine.startQuest(consequences.startQuestId);
      }

      // 4. Clue inspection / discovery
      if (consequences?.unlockClue && this.eventBus) {
        this.eventBus.inspectClue(consequences.unlockClue);
      }

      this._saveRelationshipsToGameState();
    }

    _saveRelationshipsToGameState() {
      const state = window.GameState;
      if (!state) return;
      if (!state.social) state.social = {};
      state.social.relationships = Object.fromEntries(this.npcRelationships);
    }

    _loadRelationshipsFromGameState() {
      const state = window.GameState;
      if (state?.social?.relationships) {
        for (const [npcId, score] of Object.entries(state.social.relationships)) {
          this.npcRelationships.set(npcId, score);
        }
      }
    }

    getRelationship(npcId) {
      return this.npcRelationships.get(npcId) || 0;
    }
  }

  const instance = new DataDialogueSystem();

  if (typeof window !== 'undefined') {
    window.DataDialogueSystem = instance;
    window.dataDialogueSystem = instance;
    window.CHOICE_TONES = CHOICE_TONES;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataDialogueSystem, instance, CHOICE_TONES };
  }
})();
