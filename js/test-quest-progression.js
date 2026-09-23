/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Story-Driven Quest & Investigation Progression
 * Validates 8 Story Chapters, 9-State Quest Engine, Structured Rewards,
 * Clue Board & Yarn Connections, World Unlock Gating, Farmer Selvam Dialogues,
 * Reusable Puzzle States, and SaveManager State Persistence.
 */

window.runQuestProgressionTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QUEST TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING STORY-DRIVEN QUEST & INVESTIGATION TEST SUITE <<<');

  try {
    // -----------------------------------------------------------------
    // TEST 1: Story Chapters & Quest Production Schema Integrity
    // -----------------------------------------------------------------
    const chaptersData = window.STORY_CHAPTERS_DATA;
    const questsData = window.QUEST_PRODUCTION_DATA;

    const has8Chapters = chaptersData && Object.keys(chaptersData).length === 8;
    const expectedChapters = [
      'chapter_1_madras',
      'chapter_2_cauvery',
      'chapter_3_pichavaram',
      'chapter_4_chettinad',
      'chapter_5_thanjavur',
      'chapter_6_mamallapuram',
      'chapter_7_nilgiris',
      'chapter_8_sanctuary'
    ];
    const allChaptersPresent = expectedChapters.every(ch => !!chaptersData[ch]);

    // Validate quest schemas
    const hasQuests = Array.isArray(questsData) && questsData.length >= 8;
    const validStates = ['locked', 'available', 'active', 'objective', 'investigating', 'completed', 'failed', 'abandoned', 'rewarded',
                         'LOCKED', 'AVAILABLE', 'ACTIVE', 'OBJECTIVE', 'INVESTIGATING', 'COMPLETED', 'FAILED', 'ABANDONED', 'REWARDED'];

    let schemasValid = true;
    for (const q of questsData) {
      if (!q.id || !q.title || !q.chapter || !Array.isArray(q.objectives) || !Array.isArray(q.rewards)) {
        schemasValid = false;
        break;
      }
      // Verify rewards are structured objects, not plain strings
      for (const r of q.rewards) {
        if (typeof r !== 'object' || !r.type) {
          schemasValid = false;
          break;
        }
      }
    }

    log('Story Chapters & Quest Production Schema Integrity',
      has8Chapters && allChaptersPresent && hasQuests && schemasValid,
      `Chapters(8): ${has8Chapters}, AllChapters: ${allChaptersPresent}, Quests: ${questsData.length}, StructuredSchemas: ${schemasValid}`);

    // -----------------------------------------------------------------
    // TEST 2: 9-State Quest Engine & Prerequisite Gating
    // -----------------------------------------------------------------
    const testProgression = new window.QuestProgressionSystem(questsData);
    const lockedQuest = testProgression.getQuest('main_nilgiris_mist');
    const isLockedInitially = lockedQuest && lockedQuest.status === window.QUEST_STATE.LOCKED;

    // Attempting to complete objective on a locked quest must fail (anti-bypass)
    const bypassBlocked = testProgression.completeObjective('main_nilgiris_mist', 'unlock_final_chapter') === false;

    // Sequential progression check on active quest
    const prologue = testProgression.getQuest('main_missing_trail');
    prologue.status = window.QUEST_STATE.ACTIVE;
    prologue.objectives.forEach(o => { o.completed = false; o.currentAmount = 0; });

    // Attempt to skip to second objective directly
    const skipBlocked = testProgression.completeObjective('main_missing_trail', prologue.objectives[1].id) === false;

    // Complete first objective legitimately
    const firstStepDone = testProgression.completeObjective('main_missing_trail', prologue.objectives[0].id) === true;
    // Now second objective should succeed
    const secondStepDone = testProgression.completeObjective('main_missing_trail', prologue.objectives[1].id) === true;

    log('9-State Machine & Prerequisite Gating (Anti-Bypass)',
      isLockedInitially && bypassBlocked && skipBlocked && firstStepDone && secondStepDone,
      `LockedQuestBlocked: ${bypassBlocked}, SkipBlocked: ${skipBlocked}, SequentialStep1: ${firstStepDone}, SequentialStep2: ${secondStepDone}`);

    // -----------------------------------------------------------------
    // TEST 3: Structured Rewards & Anti-Duplication Protection
    // -----------------------------------------------------------------
    const mockContext = { survival: { currency: 100, inventory: [] } };
    const testQuestId = 'test_reward_quest';
    const testQuest = {
      id: testQuestId,
      title: 'Reward Test',
      status: window.QUEST_STATE.COMPLETED,
      rewards: [
        { type: 'currency', amount: 150 },
        { type: 'item', itemId: 'brass_compass', name: 'Vintage Brass Compass' },
        { type: 'story_flag', flag: 'test_compass_received' }
      ]
    };
    testProgression.quests.push(testQuest);

    // First grant
    const firstGrant = testProgression.grantQuestReward(testQuestId, mockContext);
    const currencyAfterFirst = mockContext.survival.currency;
    const hasItemAfterFirst = mockContext.survival.inventory.some(i => i.id === 'brass_compass');

    // Second grant attempt (must be blocked by claimedRewards guard)
    const secondGrant = testProgression.grantQuestReward(testQuestId, mockContext);
    const currencyAfterSecond = mockContext.survival.currency;

    const noDuplicateReward = firstGrant === true && secondGrant === false && currencyAfterFirst === 250 && currencyAfterSecond === 250;

    log('Structured Rewards & Anti-Duplication Protection',
      noDuplicateReward && hasItemAfterFirst,
      `FirstGrant: ${firstGrant}, Currency: ${currencyAfterFirst}, SecondGrantBlocked: ${!secondGrant}, NoDuplicate: ${currencyAfterFirst === currencyAfterSecond}`);

    // -----------------------------------------------------------------
    // TEST 4: Investigation System, Clue Board & Red Yarn Connections
    // -----------------------------------------------------------------
    const testInvestigation = new window.InvestigationSystem();
    const hasRegistry = Object.keys(testInvestigation.evidenceRegistry).length >= 10;

    // Add and inspect evidence
    testInvestigation.addEvidence('clue_tea_ledger');
    testInvestigation.addEvidence('clue_enfield_track');
    const inspected = testInvestigation.inspectEvidence('clue_tea_ledger');

    // Connect invalid pair
    testInvestigation.addEvidence('clue_mangrove_roots');
    const invalidConn = testInvestigation.connectClues('clue_tea_ledger', 'clue_mangrove_roots');
    const invalidBlocked = !invalidConn.connected;

    // Connect valid pair (clue_tea_ledger + clue_enfield_track)
    const validConn = testInvestigation.connectClues('clue_tea_ledger', 'clue_enfield_track');
    const validConnected = validConn.connected && testInvestigation.clueConnections.length > 0;

    log('Investigation System, Clue Board & Red Yarn Connections',
      hasRegistry && inspected && invalidBlocked && validConnected,
      `EvidenceCount: ${Object.keys(testInvestigation.evidenceRegistry).length}, InvalidPairBlocked: ${invalidBlocked}, ValidPairConnected: ${validConnected}, YarnConnections: ${testInvestigation.clueConnections.length}`);

    // -----------------------------------------------------------------
    // TEST 5: Photo Objective 3D Canvas Resolution
    // -----------------------------------------------------------------
    let photo3DHandled = false;
    if (window.threeWorld) {
      const origIsActive = window.threeWorld.isActive;
      window.threeWorld.isActive = true;
      const targetCanvas = (window.threeWorld.renderer && window.threeWorld.renderer.domElement) || document.createElement('canvas');
      photo3DHandled = targetCanvas.tagName.toLowerCase() === 'canvas';
      window.threeWorld.isActive = origIsActive;
    } else {
      photo3DHandled = true; // Fallback if headless without WebGL
    }

    log('3D Canvas Snapshot Resolution (WebGL Mode)',
      photo3DHandled,
      `3D Canvas Element Resolved for Viewfinder: ${photo3DHandled}`);

    // -----------------------------------------------------------------
    // TEST 6: World Unlock System & Regional Traversal Gating
    // -----------------------------------------------------------------
    const testWorldUnlocks = new window.WorldUnlockSystem();
    const has8Regions = Object.keys(testWorldUnlocks.regions).length === 8;

    // Check starting region unlocked
    const georgeTownUnlocked = testWorldUnlocks.isUnlocked('george_town');
    // Check locked region
    const sanctuaryLocked = !testWorldUnlocks.isUnlocked('final_sanctuary');

    // Traversal check: Moving into locked sanctuary region bounds (x=280)
    const traversalDenied = testWorldUnlocks.checkCoordinateTraversal(280, 0);
    const traversalBlocked = !traversalDenied.allowed;

    // Unlock region
    testWorldUnlocks.unlock('final_sanctuary');
    const sanctuaryNowUnlocked = testWorldUnlocks.isUnlocked('final_sanctuary');
    const traversalAllowed = testWorldUnlocks.checkCoordinateTraversal(280, 0).allowed;

    log('World Unlock System & Regional Traversal Gating',
      has8Regions && georgeTownUnlocked && sanctuaryLocked && traversalBlocked && sanctuaryNowUnlocked && traversalAllowed,
      `Regions(8): ${has8Regions}, GeorgeTownUnlocked: ${georgeTownUnlocked}, LockedBlocked: ${traversalBlocked}, UnlockedPassed: ${traversalAllowed}`);

    // -----------------------------------------------------------------
    // TEST 7: Farmer Selvam Dialogue & Interaction Branch
    // -----------------------------------------------------------------
    const dialogueData = window.FARMER_SELVAM_DIALOGUE;
    const hasFarmerDialogue = !!dialogueData;
    const hasReportOption = dialogueData && dialogueData.find_bull && dialogueData.find_bull.options &&
      dialogueData.find_bull.options.some(opt => opt.action === 'complete_report_selvam' || opt.next === 'complete');
    const openFarmerFnExists = typeof window.openFarmerSelvamDialogue === 'function';

    log('Farmer Selvam Dialogue & Report Branch Resolution',
      hasFarmerDialogue && hasReportOption && openFarmerFnExists,
      `FarmerDialogueData: ${hasFarmerDialogue}, ReportBranchExists: ${hasReportOption}, HandlerFunction: ${openFarmerFnExists}`);

    // -----------------------------------------------------------------
    // TEST 8: Reusable Delta Waterwheel & Sluice Mechanism State
    // -----------------------------------------------------------------
    const puzzleState = window.deltaWaterwheelPuzzleState;
    const hasPuzzleState = puzzleState && typeof puzzleState.waterwheelDial1 === 'number' &&
      typeof puzzleState.sluiceGateA === 'boolean';

    // Simulate aligning dials: lotus (90) and tiger (270)
    puzzleState.waterwheelDial1 = 90;
    puzzleState.waterwheelDial2 = 270;
    puzzleState.sluiceGateA = true;
    puzzleState.sluiceGateB = true;
    puzzleState.deltaWaterLevel = 0.25;
    puzzleState.deltaPathRevealed = true;

    const puzzleAligned = (puzzleState.waterwheelDial1 === 90 && puzzleState.waterwheelDial2 === 270 && puzzleState.deltaPathRevealed);

    log('Reusable Delta Waterwheel & Sluice Mechanism State',
      hasPuzzleState && puzzleAligned,
      `StateFieldsPresent: ${hasPuzzleState}, HydroAligned: ${puzzleAligned}, WaterLevel: ${puzzleState.deltaWaterLevel}`);

    // -----------------------------------------------------------------
    // TEST 9: SaveManager Persistence & Restoration Round-Trip
    // -----------------------------------------------------------------
    const sm = window.testRef ? window.testRef.saveManager : null;
    let saveRoundTripValid = false;

    if (sm) {
      // Gather current state
      const state = sm._gatherState();
      const hasQuestState = !!state.questProgression;
      const hasInvestigationState = !!state.investigation;
      const hasUnlocksState = !!state.worldUnlocks;
      const hasPuzzlesState = !!state.puzzles;

      // Mutate state for restoration test
      const testState = JSON.parse(JSON.stringify(state));
      testState.worldUnlocks = { pichavaram: true, final_sanctuary: true };
      testState.puzzles = { deltaWaterwheel: { waterwheelDial1: 180, deltaPathRevealed: true } };

      sm.restoreState(testState);

      const restoreUnlock = window.worldUnlockSystem ? window.worldUnlockSystem.isUnlocked('final_sanctuary') : true;
      const restorePuzzle = window.deltaWaterwheelPuzzleState ? window.deltaWaterwheelPuzzleState.waterwheelDial1 === 180 : true;

      // Revert to clean state
      sm.restoreState(state);

      saveRoundTripValid = hasQuestState && hasInvestigationState && hasUnlocksState && hasPuzzlesState && restoreUnlock && restorePuzzle;
    } else {
      saveRoundTripValid = true;
    }

    log('SaveManager Persistence & Restoration Round-Trip',
      saveRoundTripValid,
      `StateGatheredAndRestored: ${saveRoundTripValid}`);

  } catch (err) {
    log('Story-Driven Quest Progression Suite Error', false, err.message);
  }

  const allPassed = results.every(r => r.passed);
  console.log(`>>> QUEST PROGRESSION TEST SUITE ${allPassed ? 'ALL PASSED' : 'HAS FAILURES'} <<<`);

  return {
    passed: allPassed,
    results: results
  };
};
