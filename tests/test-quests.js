/**
 * Automated QA Test: Quest State Machine, Prerequisites & Anti-Duplication
 */

window.testQuestsSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA QUESTS] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const qp = new window.QuestProgressionSystem();

    // 1. Initial Quest State Structure
    const prologue = qp.getQuest('main_missing_trail');
    const hasPrologue = prologue && (prologue.status === window.QUEST_STATE.ACTIVE || prologue.status === window.QUEST_STATE.AVAILABLE);
    log('Authoritative Quest Progression Registry', hasPrologue, `PrologueStatus: ${prologue ? prologue.status : 'none'}`);

    // 2. Strict Sequential Progression on Isolated Test Quest
    const testQuest = {
      id: 'qa_sequential_test_quest',
      title: 'QA Sequential Verification',
      status: window.QUEST_STATE.ACTIVE,
      prerequisites: [],
      rewards: [{ type: 'currency', amount: 50 }],
      objectives: [
        { id: 'seq_step_1', text: 'Step 1', completed: false, requiredAmount: 1, currentAmount: 0 },
        { id: 'seq_step_2', text: 'Step 2', completed: false, requiredAmount: 1, currentAmount: 0 }
      ]
    };
    qp.quests.push(testQuest);

    // Attempting step 2 before step 1 must be blocked
    const skipBlocked = qp.completeObjective('qa_sequential_test_quest', 'seq_step_2') === false;
    log('Sequential Objective Enforcement (Anti-Bypass)', skipBlocked, `SkipBlocked: ${skipBlocked}`);

    // 3. Normal Objective Progression
    const step1Done = qp.completeObjective('qa_sequential_test_quest', 'seq_step_1') === true;
    const step2Done = qp.completeObjective('qa_sequential_test_quest', 'seq_step_2') === true;
    const questCompleted = testQuest.status === window.QUEST_STATE.COMPLETED || testQuest.status === window.QUEST_STATE.REWARDED;
    log('Objective Completion & Quest State Transition', step1Done && step2Done && questCompleted,
      `Step1: ${step1Done}, Step2: ${step2Done}, Completed: ${questCompleted}`);

    // 4. Anti-Duplication Reward Protection
    const mockContext = { survival: { currency: 100 } };
    const duplicateBlocked = qp.grantQuestReward('qa_sequential_test_quest', mockContext) === false;
    log('Reward Anti-Duplication Guard (Single Grant Rule)', duplicateBlocked,
      `DuplicateClaimBlocked: ${duplicateBlocked}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Quests Test Failure', false, err.message);
    return { passed: false, results };
  }
};
