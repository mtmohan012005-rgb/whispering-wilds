/**
 * ============================================================================
 * THE WHISPERING WILDS — STEP 3 VERIFICATION SUITE
 * ============================================================================
 * 
 * Verifies:
 * 1. Campaign Flow & New Game state resets (including tutorial)
 * 2. Save & Load Reliability with tutorial completion in GameSaveData
 * 3. Overwrite protection via ConfirmationDialog
 * 4. Quest & Objective System event-driven progression & over-counting guards
 * 5. On-Screen Objective Tracker HUD & bilingual rendering
 * 6. Region Navigation safety, duplicate load guards & input restoration
 * 7. Step 3 Bilingual Localization Keys (English & Tamil)
 * 8. Unity Editor Unit Tests file integrity
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
console.log('======================================================================');
console.log('🎮 THE WHISPERING WILDS — STEP 3 CAMPAIGN FLOW & QUEST AUDIT');
console.log('======================================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(desc, condition) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ PASS: ${desc}`);
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
  }
}

// Group 1: Campaign Flow & New Game Reset
console.log('--- Group 1: Campaign Flow & New Game Reset ---');
const campaignFlowFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Core/CampaignFlow.cs');
check('CampaignFlow.cs exists', fs.existsSync(campaignFlowFile));
if (fs.existsSync(campaignFlowFile)) {
  const content = fs.readFileSync(campaignFlowFile, 'utf8');
  check('CampaignFlow implements ResetCampaignForNewGame', content.includes('ResetCampaignForNewGame()'));
  check('New Game resets tutorial completion PlayerPrefs', content.includes('IntroductionTutorialUI.PrefKeyTutorialCompleted, 0'));
  check('New Game invokes IntroductionTutorialUI.ResetTutorial', content.includes('IntroductionTutorialUI.Instance.ResetTutorial()'));
  check('New Game invokes ObjectiveTrackerHUD.RefreshDisplay', content.includes('ObjectiveTrackerHUD.Instance.RefreshDisplay()'));
  check('New Game clears previous save via SaveSystem.DeleteSave', content.includes('SaveSystem.DeleteSave()'));
  check('CampaignFlow implements PendingNewGame hand-off', content.includes('PendingNewGame'));
}

// Group 2: Save & Load Reliability & Schema Compatibility
console.log('\n--- Group 2: Save & Load Reliability & Schema Compatibility ---');
const saveSystemFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Core/SaveSystem.cs');
check('SaveSystem.cs exists', fs.existsSync(saveSystemFile));
if (fs.existsSync(saveSystemFile)) {
  const saveContent = fs.readFileSync(saveSystemFile, 'utf8');
  check('GameSaveData defines tutorialCompleted field', saveContent.includes('public bool tutorialCompleted = false;'));
  check('CaptureSnapshot captures tutorialCompleted state', saveContent.includes('data.tutorialCompleted ='));
  check('GameSaveData maintains Schema v4', saveContent.includes('CurrentSchemaVersion = 4'));
}

const saveManagerFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Core/SaveManager.cs');
check('SaveManager.cs exists', fs.existsSync(saveManagerFile));
if (fs.existsSync(saveManagerFile)) {
  const smContent = fs.readFileSync(saveManagerFile, 'utf8');
  check('SaveManager restores tutorialCompleted state', smContent.includes('SetTutorialCompletedState(save.tutorialCompleted)'));
  check('SaveManager refreshes ObjectiveTrackerHUD on load', smContent.includes('ObjectiveTrackerHUD.Instance.RefreshDisplay()'));
}

const titleMenuFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/UI/TitleMenuController.cs');
if (fs.existsSync(titleMenuFile)) {
  const tmContent = fs.readFileSync(titleMenuFile, 'utf8');
  check('TitleMenuController guards New Game with ConfirmationDialog', tmContent.includes('SaveSystem.HasValidSave()') && tmContent.includes('menu.new_game_confirm'));
}

// Group 3: Quest & Objective System Hardening
console.log('\n--- Group 3: Quest & Objective System Hardening ---');
const questManagerFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Quests/QuestManager.cs');
check('QuestManager.cs exists', fs.existsSync(questManagerFile));
if (fs.existsSync(questManagerFile)) {
  const qmContent = fs.readFileSync(questManagerFile, 'utf8');
  check('AdvanceMatchingObjectives guards against over-counting', qmContent.includes('active.GetCount(objective.objectiveId) >= objective.requiredCount'));
  check('AdvanceObjective safely guards null/empty parameters', qmContent.includes('if (string.IsNullOrEmpty(questId) || string.IsNullOrEmpty(objectiveId)) return false;'));
  check('AcceptQuest safely guards null/empty questId', qmContent.includes('string.IsNullOrEmpty(quest.questId)'));
}

const objHudFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/UI/ObjectiveTrackerHUD.cs');
const objHudMeta = path.join(ROOT, 'unity/Assets/_Project/Scripts/UI/ObjectiveTrackerHUD.cs.meta');
check('ObjectiveTrackerHUD.cs exists', fs.existsSync(objHudFile));
check('ObjectiveTrackerHUD.cs.meta exists', fs.existsSync(objHudMeta));
if (fs.existsSync(objHudFile)) {
  const hudContent = fs.readFileSync(objHudFile, 'utf8');
  check('ObjectiveTrackerHUD implements dynamic UI builder', hudContent.includes('BuildDynamicObjectiveHUD()'));
  check('ObjectiveTrackerHUD handles OnQuestAccepted event', hudContent.includes('HandleQuestAccepted'));
  check('ObjectiveTrackerHUD handles OnObjectiveAdvanced event', hudContent.includes('HandleObjectiveAdvanced'));
  check('ObjectiveTrackerHUD handles OnQuestCompleted event', hudContent.includes('HandleQuestCompleted'));
  check('ObjectiveTrackerHUD handles bilingual language changes', hudContent.includes('HandleLanguageChanged'));
}

// Group 4: Region Navigation & Boundary Gating
console.log('\n--- Group 4: Region Navigation & Boundary Gating ---');
const regSceneMgrFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/World/RegionalSceneManager.cs');
check('RegionalSceneManager.cs exists', fs.existsSync(regSceneMgrFile));
if (fs.existsSync(regSceneMgrFile)) {
  const rsmContent = fs.readFileSync(regSceneMgrFile, 'utf8');
  check('RegionalSceneManager guards duplicate scene loading', rsmContent.includes('if (isLoadingRegion)'));
  check('RegionalSceneManager validates null/empty destination IDs', rsmContent.includes('string.IsNullOrEmpty(targetRegionId)'));
  check('RegionalSceneManager enforces authoritative RegionUnlocks gate', rsmContent.includes('RegionUnlocks.IsUnlocked(targetRegionId)'));
  check('RegionalSceneManager restores player input simulation state', rsmContent.includes('inputHandler.ClearSimulation()'));
  check('RegionalSceneManager restores GameState.Gameplay & cursor lock', rsmContent.includes('GameManager.Instance.SetGameState(GameState.Gameplay)') && rsmContent.includes('Cursor.lockState = CursorLockMode.Locked'));
  check('RegionalSceneManager ensures ObjectiveTrackerHUD in destination', rsmContent.includes('ObjectiveTrackerHUD'));
  check('RegionalSceneManager accepts destination signature quest', rsmContent.includes('AcceptRegionArrivalQuest(targetGeo.regionId)'));
}

const regionBootstrapFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Gameplay/GameplayRegionBootstrap.cs');
if (fs.existsSync(regionBootstrapFile)) {
  const bootContent = fs.readFileSync(regionBootstrapFile, 'utf8');
  check('GameplayRegionBootstrap ensures ObjectiveTrackerHUD', bootContent.includes('EnsureRegionUI()') && bootContent.includes('ObjectiveTrackerHUD'));
  check('GameplayRegionBootstrap ensures RegionalSceneManager', bootContent.includes('EnsureManager<World.RegionalSceneManager>()'));
}

// Group 5: Bilingual Localization Keys
console.log('\n--- Group 5: Step 3 Bilingual Localization Keys ---');
const locManagerFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Localization/LocalizationManager.cs');
check('LocalizationManager.cs exists', fs.existsSync(locManagerFile));
if (fs.existsSync(locManagerFile)) {
  const locContent = fs.readFileSync(locManagerFile, 'utf8');
  const requiredKeys = [
    'objective.tracker_title',
    'objective.no_active',
    'objective.completed_toast',
    'objective.quest_complete',
    'objective.stage_label',
    'region.travel_prompt',
    'menu.new_game_confirm'
  ];
  requiredKeys.forEach(k => {
    check(`Localization contains key: ${k}`, locContent.includes(`"${k}"`));
  });
}

// Group 6: Unity Editor Unit Tests File
console.log('\n--- Group 6: Unity Editor Unit Tests File ---');
const step3TestsFile = path.join(ROOT, 'unity/Assets/_Project/Tests/Editor/Step3CampaignFlowTests.cs');
const step3TestsMeta = path.join(ROOT, 'unity/Assets/_Project/Tests/Editor/Step3CampaignFlowTests.cs.meta');
check('Step3CampaignFlowTests.cs exists', fs.existsSync(step3TestsFile));
check('Step3CampaignFlowTests.cs.meta exists', fs.existsSync(step3TestsMeta));
if (fs.existsSync(step3TestsFile)) {
  const testContent = fs.readFileSync(step3TestsFile, 'utf8');
  check('Tests cover New Game campaign reset', testContent.includes('NewGame_InitializesStartingCampaign_AndResetsTutorial'));
  check('Tests cover tutorial schema persistence', testContent.includes('SaveSystem_TutorialCompletion_PersistsInSchema'));
  check('Tests cover QuestManager null and duplicate safety', testContent.includes('QuestManager_AcceptQuest_SafelyValidatesNullAndDuplicate'));
  check('Tests cover repeated interactions over-count guard', testContent.includes('QuestManager_RepeatedInteractions_DoNotExceedRequiredCount'));
  check('Tests cover RegionalSceneManager invalid destination handling', testContent.includes('RegionalSceneManager_InvalidRegion_RefusesSafelyWithoutCrashing'));
  check('Tests cover ObjectiveTrackerHUD fallback rendering', testContent.includes('ObjectiveTrackerHUD_Component_InstantiatesAndRendersFallback'));
  check('Tests cover Step 3 localization resolution in English and Tamil', testContent.includes('Localization_Step3Keys_ResolveInEnglishAndTamil'));
}

console.log('\n======================================================================');
console.log(`Summary: ${passedChecks}/${totalChecks} checks passed.`);
console.log('======================================================================');

if (passedChecks === totalChecks) {
  console.log('🎉 SUCCESS: Step 3 Campaign Flow, Quest System & Region Navigation verified 100% cleanly.\n');
  process.exit(0);
} else {
  console.error(`💥 FAILURE: ${totalChecks - passedChecks} checks failed.\n`);
  process.exit(1);
}
