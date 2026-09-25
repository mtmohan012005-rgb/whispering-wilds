// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CULTURAL ACTIVITY SYSTEM
// Reusable authored cultural activities (kolam drawing, Pongal prep,
// oil lamp lighting, tea preparation, traditional weaving/craft, cattle care).
// Integrates deep cultural context, step-by-step loops, audio, and reward events.
// ============================================================================

(function () {
  'use strict';

  class CulturalActivitySystem {
    constructor(registry = null, eventBus = null) {
      this.registry = registry || window.ContentRegistry;
      this.eventBus = eventBus || window.ContentEvents;
      this.currentActivity = null;
      this.currentStepIndex = 0;
      this.completedActivities = new Set();
      this.stepResults = [];
    }

    init(registry = null, eventBus = null) {
      if (registry) this.registry = registry;
      if (eventBus) this.eventBus = eventBus;
      console.log('[CulturalActivitySystem] Initialized authentic Tamil Nadu cultural activity engine.');
      return this;
    }

    /**
     * Start a cultural activity by ID
     */
    startActivity(activityId) {
      const reg = this.registry || window.ContentRegistry;
      const def = reg?.get('culture', activityId);

      if (!def) {
        console.warn(`[CulturalActivitySystem] Activity '${activityId}' not found in registry.`);
        return { success: false, reason: 'ACTIVITY_NOT_FOUND' };
      }

      this.currentActivity = def;
      this.currentStepIndex = 0;
      this.stepResults = [];

      const firstStep = def.steps?.[0] || null;

      // Play start sound if defined
      if (def.audio?.start && window.audioManager) {
        window.audioManager.play(def.audio.start, { category: 'sfx', busName: 'SFX' });
      }

      if (this.eventBus) {
        this.eventBus.emit('cultural_activity_started', {
          activityId,
          activity: def,
          firstStep
        });
      }

      return {
        success: true,
        activityId,
        titleEn: def.titleEn,
        titleTa: def.titleTa,
        culturalExplanationEn: def.culturalExplanationEn,
        culturalExplanationTa: def.culturalExplanationTa,
        currentStep: firstStep,
        stepIndex: 0,
        totalSteps: def.steps ? def.steps.length : 0
      };
    }

    /**
     * Complete current interaction step
     */
    completeStep(stepData = {}) {
      if (!this.currentActivity) {
        return { success: false, reason: 'NO_ACTIVE_ACTIVITY' };
      }

      const steps = this.currentActivity.steps || [];
      const currentStep = steps[this.currentStepIndex];

      if (!currentStep) {
        return { success: false, reason: 'INVALID_STEP' };
      }

      this.stepResults.push({
        stepId: currentStep.id,
        accuracy: stepData.accuracy !== undefined ? stepData.accuracy : 1.0,
        data: stepData
      });

      // Play step audio
      if (currentStep.soundEffect && window.audioManager) {
        window.audioManager.play(currentStep.soundEffect, { category: 'sfx', busName: 'SFX' });
      }

      if (this.eventBus) {
        this.eventBus.emit('cultural_activity_step_done', {
          activityId: this.currentActivity.id,
          stepId: currentStep.id,
          stepIndex: this.currentStepIndex
        });
      }

      // Check if more steps remain
      if (this.currentStepIndex + 1 < steps.length) {
        this.currentStepIndex++;
        const nextStep = steps[this.currentStepIndex];
        return {
          success: true,
          isFinished: false,
          nextStep,
          stepIndex: this.currentStepIndex,
          totalSteps: steps.length
        };
      } else {
        // Complete the activity!
        return this.finishActivity();
      }
    }

    /**
     * Finish and award cultural activity completion
     */
    finishActivity() {
      if (!this.currentActivity) return { success: false, reason: 'NO_ACTIVE_ACTIVITY' };

      const def = this.currentActivity;
      const activityId = def.id;

      // Calculate average quality score
      const totalAccuracy = this.stepResults.reduce((acc, cur) => acc + (cur.accuracy || 1.0), 0);
      const avgScore = this.stepResults.length > 0 ? (totalAccuracy / this.stepResults.length) : 1.0;

      this.completedActivities.add(activityId);

      // Play finish audio
      if (def.audio?.finish && window.audioManager) {
        window.audioManager.play(def.audio.finish, { category: 'sfx', busName: 'SFX' });
      }

      // Dispatch event to ContentEvents bus
      if (this.eventBus) {
        this.eventBus.completeCulturalActivity(activityId, avgScore, {
          titleTa: def.titleTa,
          titleEn: def.titleEn,
          stepsCompleted: this.stepResults.length
        });
      }

      // Award rewards if first completion or repeated
      if (def.rewards && window.GameState) {
        if (def.rewards.culturalKnowledge) {
          const state = window.GameState;
          if (!state.culturalKnowledge) state.culturalKnowledge = 0;
          state.culturalKnowledge += def.rewards.culturalKnowledge;
        }
      }

      const summary = {
        success: true,
        isFinished: true,
        activityId,
        score: avgScore,
        culturalExplanationTa: def.culturalExplanationTa,
        culturalExplanationEn: def.culturalExplanationEn
      };

      this.currentActivity = null;
      this.currentStepIndex = 0;
      this.stepResults = [];

      return summary;
    }

    isCompleted(activityId) {
      return this.completedActivities.has(activityId);
    }
  }

  const instance = new CulturalActivitySystem();

  if (typeof window !== 'undefined') {
    window.CulturalActivitySystem = instance;
    window.culturalActivitySystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
