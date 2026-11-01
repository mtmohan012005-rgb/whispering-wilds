/**
 * ============================================================================
 * THE WHISPERING WILDS — STEP 6.1 PERSISTENT NPC RELATIONSHIPS VERIFICATION
 * ============================================================================
 * 
 * Verifies:
 * 1. Consequential Dialogue Choices Data Model (choiceId, trust, memory, faction)
 * 2. Persistent NPC Memory Store (NPCMemoryStore.cs)
 * 3. Relationship Tiers & Trust Bounds (EndingController.cs)
 * 4. Dialogue Consequence Execution & Anti-Exploit Guard (DialogueUI.cs)
 * 5. Schema v5 Persistence & Migration (SaveSystem, SaveManager, SaveMigrator)
 * 6. Bilingual Localization & Journal Relationship Formatting
 * 7. Authored Consequential Content for Murugan and Velu
 * 8. Step 6.1 Unity Editor Unit Tests File Integrity
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
console.log('======================================================================');
console.log('🤝 THE WHISPERING WILDS — STEP 6.1 NPC RELATIONSHIPS & DIALOGUE AUDIT');
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

// Group 1: Consequential Dialogue Choice Model
console.log('--- Group 1: Consequential Dialogue Choice Model ---');
const npcCharFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/NPC/NPCCharacter.cs');
check('NPCCharacter.cs exists', fs.existsSync(npcCharFile));
if (fs.existsSync(npcCharFile)) {
  const content = fs.readFileSync(npcCharFile, 'utf8');
  check('DialogueChoice defines choiceId', content.includes('public string choiceId;'));
  check('DialogueChoice defines trustDelta', content.includes('public int trustDelta;'));
  check('DialogueChoice defines targetNpcId', content.includes('public string targetNpcId;'));
  check('DialogueChoice defines memoryFlag', content.includes('public string memoryFlag;'));
  check('DialogueChoice defines factionId', content.includes('public string factionId;'));
  check('DialogueChoice defines factionDelta', content.includes('public int factionDelta;'));
  check('DialogueChoice defines hasConsequence property', content.includes('hasConsequence =>'));
  check('NPCCharacter.RecordMemory delegates to NPCMemoryStore', content.includes('NPCMemoryStore.RecordMemory'));
  check('NPCCharacter.HasMemory checks NPCMemoryStore', content.includes('NPCMemoryStore.HasMemory'));
}

// Group 2: Persistent NPC Memory Store
console.log('\n--- Group 2: Persistent NPC Memory Store ---');
const memoryStoreFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/NPC/NPCMemoryStore.cs');
check('NPCMemoryStore.cs exists', fs.existsSync(memoryStoreFile));
check('NPCMemoryStore.cs.meta exists', fs.existsSync(memoryStoreFile + '.meta'));
if (fs.existsSync(memoryStoreFile)) {
  const content = fs.readFileSync(memoryStoreFile, 'utf8');
  check('NPCMemoryStore is in WhisperingWilds.NPC namespace', content.includes('namespace WhisperingWilds.NPC'));
  check('NPCMemoryStore implements RecordMemory', content.includes('public static bool RecordMemory('));
  check('NPCMemoryStore implements HasMemory', content.includes('public static bool HasMemory('));
  check('NPCMemoryStore implements RecordChoiceApplied', content.includes('public static bool RecordChoiceApplied('));
  check('NPCMemoryStore implements IsChoiceApplied', content.includes('public static bool IsChoiceApplied('));
  check('NPCMemoryStore implements SnapshotMemories', content.includes('public static List<SavedNPCMemory> SnapshotMemories()'));
  check('NPCMemoryStore implements RestoreMemories', content.includes('public static void RestoreMemories('));
  check('NPCMemoryStore implements SnapshotAppliedChoices', content.includes('public static List<string> SnapshotAppliedChoices()'));
  check('NPCMemoryStore implements RestoreAppliedChoices', content.includes('public static void RestoreAppliedChoices('));
  check('NPCMemoryStore implements Clear', content.includes('public static void Clear()'));
}

// Group 3: Relationship Tiers & Trust Bounds
console.log('\n--- Group 3: Relationship Tiers & Trust Bounds ---');
const endingFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Campaign/EndingController.cs');
check('EndingController.cs exists', fs.existsSync(endingFile));
if (fs.existsSync(endingFile)) {
  const content = fs.readFileSync(endingFile, 'utf8');
  check('EndingController defines NPCRelationshipTier enum', content.includes('enum NPCRelationshipTier'));
  check('NPCRelationshipTier defines Stranger, Acquaintance, Familiar, Trusted, CloseAlly',
    content.includes('Stranger') && content.includes('Acquaintance') && content.includes('Familiar') &&
    content.includes('Trusted') && content.includes('CloseAlly'));
  check('EndingController defines GetRelationshipTier', content.includes('GetRelationshipTier(int trust)'));
  check('EndingController defines SetTrust', content.includes('SetTrust(string npcId, int value)'));
  check('EndingController defines SetAffinity', content.includes('SetAffinity(string factionId, int value)'));
  check('EndingController clamps trust to 0-100', content.includes('Mathf.Clamp(value, 0, 100)'));
  check('EndingController clamps affinity to -100-100', content.includes('Mathf.Clamp(value, -100, 100)'));
  check('EndingController defines RestoreRelationships', content.includes('public void RestoreRelationships('));
}

// Group 4: Dialogue Consequence Execution
console.log('\n--- Group 4: Dialogue Consequence Execution ---');
const dialogueUIFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/UI/DialogueUI.cs');
check('DialogueUI.cs exists', fs.existsSync(dialogueUIFile));
if (fs.existsSync(dialogueUIFile)) {
  const content = fs.readFileSync(dialogueUIFile, 'utf8');
  check('SelectChoice evaluates choice.hasConsequence', content.includes('choice.hasConsequence'));
  check('SelectChoice guards one-time execution with !NPCMemoryStore.IsChoiceApplied', content.includes('!NPCMemoryStore.IsChoiceApplied(choice.choiceId)'));
  check('SelectChoice applies trust delta via EndingController', content.includes('EndingController.Instance.AdjustTrust'));
  check('SelectChoice records memory flag via NPCMemoryStore', content.includes('NPCMemoryStore.RecordMemory'));
  check('SelectChoice applies faction delta via EndingController', content.includes('EndingController.Instance.AdjustAffinity'));
  check('SelectChoice records applied choice ID', content.includes('NPCMemoryStore.RecordChoiceApplied(choice.choiceId)'));
}

// Group 5: Schema v5 Persistence & Migration
console.log('\n--- Group 5: Schema v5 Persistence & Migration ---');
const saveSystemFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Core/SaveSystem.cs');
const saveManagerFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Core/SaveManager.cs');
const saveMigratorFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Core/SaveMigrator.cs');
const campaignFlowFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Core/CampaignFlow.cs');

check('SaveSystem.cs exists', fs.existsSync(saveSystemFile));
if (fs.existsSync(saveSystemFile)) {
  const content = fs.readFileSync(saveSystemFile, 'utf8');
  check('GameSaveData sets CurrentSchemaVersion = 5', content.includes('CurrentSchemaVersion = 5;'));
  check('SaveSystem defines SavedNPCTrust', content.includes('public class SavedNPCTrust'));
  check('SaveSystem defines SavedNPCMemory', content.includes('public class SavedNPCMemory'));
  check('SaveSystem defines SavedFactionAffinity', content.includes('public class SavedFactionAffinity'));
  check('GameSaveData declares npcTrustScores', content.includes('public List<SavedNPCTrust> npcTrustScores'));
  check('GameSaveData declares npcMemories', content.includes('public List<SavedNPCMemory> npcMemories'));
  check('GameSaveData declares appliedChoiceIds', content.includes('public List<string> appliedChoiceIds'));
  check('GameSaveData declares factionAffinities', content.includes('public List<SavedFactionAffinity> factionAffinities'));
  check('CaptureSnapshot snapshots trust, memories, applied choices', content.includes('data.npcTrustScores =') && content.includes('NPCMemoryStore.SnapshotMemories()'));
}

check('SaveManager.cs exists', fs.existsSync(saveManagerFile));
if (fs.existsSync(saveManagerFile)) {
  const content = fs.readFileSync(saveManagerFile, 'utf8');
  check('SaveManager calls EndingController.Instance.RestoreRelationships', content.includes('EndingController.Instance.RestoreRelationships(save.npcTrustScores, save.factionAffinities)'));
  check('SaveManager restores npcTrustScores', content.includes('save.npcTrustScores'));
  check('SaveManager restores factionAffinities', content.includes('save.factionAffinities'));
  check('SaveManager restores NPC memories via NPCMemoryStore.RestoreMemories', content.includes('NPCMemoryStore.RestoreMemories(save.npcMemories)'));
  check('SaveManager restores applied choices via NPCMemoryStore.RestoreAppliedChoices', content.includes('NPCMemoryStore.RestoreAppliedChoices(save.appliedChoiceIds)'));
}

check('SaveMigrator.cs exists', fs.existsSync(saveMigratorFile));
if (fs.existsSync(saveMigratorFile)) {
  const content = fs.readFileSync(saveMigratorFile, 'utf8');
  check('SaveMigrator handles migration to schema v5', content.includes('data.schemaVersion < 5'));
  check('SaveMigrator initializes v5 lists safely', content.includes('data.npcTrustScores = new List<SavedNPCTrust>()'));
}

check('CampaignFlow.cs exists', fs.existsSync(campaignFlowFile));
if (fs.existsSync(campaignFlowFile)) {
  const content = fs.readFileSync(campaignFlowFile, 'utf8');
  check('ResetCampaignForNewGame clears NPCMemoryStore', content.includes('NPC.NPCMemoryStore.Clear()'));
}

// Group 6: Bilingual Localization & Journal Formatting
console.log('\n--- Group 6: Bilingual Localization & Journal Formatting ---');
const locFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Localization/LocalizationManager.cs');
check('LocalizationManager.cs exists', fs.existsSync(locFile));
if (fs.existsSync(locFile)) {
  const content = fs.readFileSync(locFile, 'utf8');
  check('Localization contains key: relationship.stranger', content.includes('"relationship.stranger"'));
  check('Localization contains key: relationship.acquaintance', content.includes('"relationship.acquaintance"'));
  check('Localization contains key: relationship.familiar', content.includes('"relationship.familiar"'));
  check('Localization contains key: relationship.trusted', content.includes('"relationship.trusted"'));
  check('Localization contains key: relationship.close_ally', content.includes('"relationship.close_ally"'));
  check('Localization contains key: npc.murugan', content.includes('"npc.murugan"'));
  check('Localization contains key: npc.velu', content.includes('"npc.velu"'));
}

const journalFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/UI/GameplayJournalUI.cs');
check('GameplayJournalUI.cs exists', fs.existsSync(journalFile));
if (fs.existsSync(journalFile)) {
  const content = fs.readFileSync(journalFile, 'utf8');
  check('AddContactRows queries EndingController.GetRelationshipTier', content.includes('EndingController.GetRelationshipTier'));
  check('AddContactRows formats relationship tier and trust score', content.includes('• {displayName} — {tierText} ({trust})'));
}

// Group 7: Authored Chennai Content
console.log('\n--- Group 7: Authored Chennai Content ---');
const contentFile = path.join(ROOT, 'unity/Assets/_Project/Scripts/Data/ChennaiOpeningContent.cs');
check('ChennaiOpeningContent.cs exists', fs.existsSync(contentFile));
if (fs.existsSync(contentFile)) {
  const content = fs.readFileSync(contentFile, 'utf8');
  check('Murugan dialogue defines choice_murugan_ask_ledger with trustDelta & memoryFlag',
    content.includes('choice_murugan_ask_ledger') && content.includes('asked_about_ledger'));
  check('Murugan dialogue defines choice_murugan_share_clue with trustDelta & factionDelta',
    content.includes('choice_murugan_share_clue') && content.includes('shared_clue_with_murugan'));
  check('Murugan dialogue defines choice_murugan_accuse_unfounded with negative trust',
    content.includes('choice_murugan_accuse_unfounded') && content.includes('-15'));
  check('Velu dialogue defines choice_velu_investigate_records with trustDelta & memoryFlag',
    content.includes('choice_velu_investigate_records') && content.includes('helped_with_records'));
  check('Velu dialogue defines choice_velu_ask_dawn_routes', content.includes('choice_velu_ask_dawn_routes'));
}

// Group 8: Unit Tests File Integrity
console.log('\n--- Group 8: Unit Tests File Integrity ---');
const testsFile = path.join(ROOT, 'unity/Assets/_Project/Tests/Editor/Step6PersistentRelationshipsTests.cs');
check('Step6PersistentRelationshipsTests.cs exists', fs.existsSync(testsFile));
check('Step6PersistentRelationshipsTests.cs.meta exists', fs.existsSync(testsFile + '.meta'));
if (fs.existsSync(testsFile)) {
  const content = fs.readFileSync(testsFile, 'utf8');
  check('Tests cover TrustScore_Clamping_EnforcesZeroToHundredRange', content.includes('TrustScore_Clamping_EnforcesZeroToHundredRange'));
  check('Tests cover FactionAffinity_Clamping_EnforcesMinusHundredToPlusHundred', content.includes('FactionAffinity_Clamping_EnforcesMinusHundredToPlusHundred'));
  check('Tests cover RelationshipTier_CalculatesCorrectLevels', content.includes('RelationshipTier_CalculatesCorrectLevels'));
  check('Tests cover NPCMemoryStore_RecordsAndQueriesMemories', content.includes('NPCMemoryStore_RecordsAndQueriesMemories'));
  check('Tests cover DialogueChoice_OneTimeConsequence_GuardsAgainstExploits', content.includes('DialogueChoice_OneTimeConsequence_GuardsAgainstExploits'));
  check('Tests cover SaveSystem_SchemaV5_SerializationRoundTrip', content.includes('SaveSystem_SchemaV5_SerializationRoundTrip'));
  check('Tests cover SaveMigrator_MigratesV4ToV5_WithoutDataLoss', content.includes('SaveMigrator_MigratesV4ToV5_WithoutDataLoss'));
  check('Tests cover CampaignFlow_ResetCampaign_ClearsMemoriesAndTrust', content.includes('CampaignFlow_ResetCampaign_ClearsMemoriesAndTrust'));
  check('Tests cover Localization_RelationshipTiers_ResolveBilingual', content.includes('Localization_RelationshipTiers_ResolveBilingual'));
  check('Tests cover ChennaiOpeningContent_AuthoredChoices_ContainConsequences', content.includes('ChennaiOpeningContent_AuthoredChoices_ContainConsequences'));
  check('Tests cover EndingController_RestoreRelationships_ReplacesExistingState_WithoutLeakage', content.includes('EndingController_RestoreRelationships_ReplacesExistingState_WithoutLeakage'));
  check('Tests cover SaveManager_ApplySaveDataToGame_ReplacesStaleTrustAndMemoriesOnLoad', content.includes('SaveManager_ApplySaveDataToGame_ReplacesStaleTrustAndMemoriesOnLoad'));
  check('Tests cover DialogueConsequences_OneTimeExecution_AndStateIsolation', content.includes('DialogueConsequences_OneTimeExecution_AndStateIsolation'));
}

console.log('\n======================================================================');
console.log(`Summary: ${passedChecks}/${totalChecks} checks passed.`);
console.log('======================================================================');
if (passedChecks === totalChecks) {
  console.log('🎉 SUCCESS: Step 6.1 Persistent NPC Relationships & Dialogue verified 100% cleanly.\n');
  process.exit(0);
} else {
  console.error(`❌ FAILURE: ${totalChecks - passedChecks} check(s) failed.\n`);
  process.exit(1);
}
