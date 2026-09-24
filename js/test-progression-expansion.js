// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PROGRESSION EXPANSION TEST SUITE
// Automated verification for Phases 1, 2, 3, and 4 subsystems
// ============================================================================

(function() {
    function assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // --- PHASE 1: Achievements, Codex & Observation ---
    window.testProgressionSubsystems = function() {
        console.log('[TEST] Verifying Phase 1: Achievements, Codex & Discovery...');

        // 1. Verify AchievementSystem
        assert(window.AchievementSystem, 'AchievementSystem must be defined on window');
        window.AchievementSystem.init();
        assert(window.AchievementSystem.categories.length === 9, `Expected 9 achievement categories, got ${window.AchievementSystem.categories.length}`);
        assert(window.AchievementSystem.achievements.length >= 20, 'Expected at least 20 authored achievements');

        // Test unlocking and title selection
        const testAch = window.AchievementSystem.achievements[0];
        window.AchievementSystem.unlockAchievement(testAch.id);
        assert(window.AchievementSystem.isUnlocked(testAch.id), `Achievement ${testAch.id} should be unlocked`);

        const titles = window.AchievementSystem.getAvailableTitles();
        assert(titles.length >= 1, 'Should have at least 1 available cosmetic title');
        window.AchievementSystem.setActiveTitle(titles[0]);
        assert(window.AchievementSystem.getActiveTitle() === titles[0], 'Active title should match selection');

        // 2. Verify CodexSystem
        assert(window.CodexSystem, 'CodexSystem must be defined on window');
        window.CodexSystem.init();
        assert(window.CodexSystem.sections.length === 9, `Expected 9 codex sections, got ${window.CodexSystem.sections.length}`);
        
        // Unlock codex entry and verify favorite & note
        window.CodexSystem.unlockEntry('world', 'george_town_high_court');
        assert(window.CodexSystem.isUnlocked('world', 'george_town_high_court'), 'George Town High Court should be unlocked');
        window.CodexSystem.toggleFavorite('world', 'george_town_high_court');
        assert(window.CodexSystem.isFavorite('world', 'george_town_high_court'), 'Entry should be favorited');
        window.CodexSystem.saveNote('world', 'george_town_high_court', 'Indo-Saracenic red brick structure');
        assert(window.CodexSystem.getNote('world', 'george_town_high_court') === 'Indo-Saracenic red brick structure', 'Note should match');

        // 3. Verify DiscoveryProgression
        assert(window.DiscoveryProgression, 'DiscoveryProgression must be defined on window');
        window.DiscoveryProgression.init();
        const discPoint = window.DiscoveryProgression.discoverPoint('disc_high_court_gate');
        assert(discPoint !== null, 'Discovery point should be registered');
        const regStats = window.DiscoveryProgression.getRegionalStats('george_town');
        assert(regStats.discovered >= 1, 'George Town should have at least 1 discovered point');

        // 4. Verify WildlifeObservationSystem
        assert(window.WildlifeObservationSystem, 'WildlifeObservationSystem must be defined on window');
        window.WildlifeObservationSystem.init();
        assert(window.WildlifeCodexData && window.WildlifeCodexData.WILDLIFE_SPECIES.length === 9, 'Expected 9 authentic wildlife species');
        const obs = window.WildlifeObservationSystem.recordObservation('nilgiri_tahr', 15.0, 6.0, true);
        assert(obs.completed === true, 'Tahr observation should complete when within bounds');

        // 5. Verify CultureDiscoverySystem
        assert(window.CultureDiscoverySystem, 'CultureDiscoverySystem must be defined on window');
        window.CultureDiscoverySystem.init();
        const cult = window.CultureDiscoverySystem.discoverHeritage('chet_athangudi_tiles');
        assert(cult !== null, 'Athangudi tiles heritage should be discovered');

        return true;
    };

    // --- PHASE 2: Main Story, Quests, Secrets & Collectibles ---
    window.testStoryAndQuestContent = function() {
        console.log('[TEST] Verifying Phase 2: Story, Side Quests, Secrets & Collectibles...');

        // 1. Verify StoryContentSystem
        assert(window.StoryContentSystem, 'StoryContentSystem must be defined on window');
        window.StoryContentSystem.init();
        const chapters = window.StoryContentSystem.getChapters();
        assert(chapters.length === 7, `Expected 7 main story chapters, got ${chapters.length}`);

        // Complete objectives of chapter 1
        const ch1 = chapters[0];
        assert(ch1.id === 'chapter_1', 'Chapter 1 must have id chapter_1');
        window.StoryContentSystem.completeObjective('chapter_1', 'ch1_inspect_courthouse');
        window.StoryContentSystem.completeObjective('chapter_1', 'ch1_talk_murugan');
        window.StoryContentSystem.completeObjective('chapter_1', 'ch1_find_skid_mark');
        window.StoryContentSystem.completeObjective('chapter_1', 'ch1_consult_velu');

        assert(ch1.completed === true, 'Chapter 1 should be marked completed');
        assert(window.StoryContentSystem.isRegionUnlocked('cauvery_delta'), 'Cauvery Delta should be unlocked');

        // Test fast chapter completion to post-game free roam
        for (let i = 1; i < chapters.length; i++) {
            window.StoryContentSystem.completeChapter(chapters[i].id);
        }
        assert(window.StoryContentSystem.storyCompleted === true, 'Story should be marked completed');
        assert(window.StoryContentSystem.isRegionUnlocked('final_sanctuary'), 'Final Sanctuary should be unlocked');

        // 2. Verify SideQuestSystem
        assert(window.SideQuestSystem, 'SideQuestSystem must be defined on window');
        window.SideQuestSystem.init();
        const quests = window.SideQuestSystem.getAllQuests();
        assert(quests.length === 5, `Expected 5 authored side quests, got ${quests.length}`);
        const sq1 = quests[0];
        window.SideQuestSystem.completeStep(sq1.id, 0);
        window.SideQuestSystem.completeStep(sq1.id, 1);
        window.SideQuestSystem.completeStep(sq1.id, 2);
        assert(sq1.completed === true, 'Side quest 1 should be completed');

        // 3. Verify SecretDiscoverySystem
        assert(window.SecretDiscoverySystem, 'SecretDiscoverySystem must be defined on window');
        window.SecretDiscoverySystem.init();
        const secrets = window.SecretDiscoverySystem.getAllSecrets();
        assert(secrets.length >= 7, `Expected at least 7 spatial secrets, got ${secrets.length}`);
        const sec1 = secrets[0];
        // Test proximity discovery
        const foundSec = window.SecretDiscoverySystem.checkProximity(sec1.coordinates);
        assert(foundSec !== null && foundSec.discovered === true, 'Secret should be discovered by proximity');

        // 4. Verify CollectibleSystem
        assert(window.CollectibleSystem, 'CollectibleSystem must be defined on window');
        window.CollectibleSystem.init();
        const collectibles = window.CollectibleSystem.getAllCollectibles();
        assert(collectibles.length >= 8, `Expected at least 8 collectibles, got ${collectibles.length}`);
        const coll1 = collectibles[0];
        const collected = window.CollectibleSystem.collectItem(coll1.id);
        assert(collected === true && coll1.found === true, 'Collectible should be collected');

        // 5. Verify ReplaySystem
        assert(window.ReplaySystem, 'ReplaySystem must be defined on window');
        window.ReplaySystem.init();
        window.ReplaySystem.enableFreeRoam();
        const replayed = window.ReplaySystem.replayChapter('chapter_1');
        assert(replayed === true, 'Should successfully replay chapter 1 in free roam');

        return true;
    };

    // --- PHASE 3: Cloud Saves, Profiles & Strict Customization Ceiling ---
    window.testCloudAndProfileSubsystems = function() {
        console.log('[TEST] Verifying Phase 3: Cloud Saves, Profiles & Customization Guard...');

        // 1. Verify Strict Customization Guard (customizationChangesUsed <= 5)
        if (!window.GameState) window.GameState = {};
        window.GameState.customizationChangesUsed = 4;
        
        // Ensure CloudSaveManager respects ceiling
        assert(window.CloudSaveManager, 'CloudSaveManager must be defined on window');
        const payload = window.CloudSaveManager.buildFullSavePayload();
        assert(payload !== null, 'Save payload should be constructed');
        assert(payload.data.customizationChangesUsed <= 5, 'customizationChangesUsed must not exceed 5');

        // Test ceiling overflow prevention
        window.GameState.customizationChangesUsed = 10;
        const clampedPayload = window.CloudSaveManager.buildFullSavePayload();
        assert(clampedPayload.data.customizationChangesUsed === 5, 'customizationChangesUsed must be clamped to 5');
        assert(window.GameState.customizationChangesUsed === 5, 'GameState must be clamped to 5');

        // 2. Verify CloudConflictEngine
        assert(window.CloudConflictEngine, 'CloudConflictEngine must be defined on window');
        const localData = {
            currency: 500,
            story: { activeChapterIndex: 3, storyCompleted: false },
            achievements: { unlocked: ['ach_first_steps', 'ach_tea_lover'] },
            codex: { unlockedEntries: ['world_court', 'flora_tea'] },
            customizationChangesUsed: 3
        };
        const cloudData = {
            currency: 750,
            story: { activeChapterIndex: 2, storyCompleted: false },
            achievements: { unlocked: ['ach_first_steps', 'ach_mangrove_wanderer'] },
            codex: { unlockedEntries: ['world_court', 'fauna_egret'] },
            customizationChangesUsed: 4
        };

        const merged = window.CloudConflictEngine.createMergedPayload(localData, cloudData);
        assert(merged.currency === 750, 'Max currency should be chosen');
        assert(merged.story.activeChapterIndex === 3, 'Highest chapter should be chosen');
        assert(merged.achievements.unlocked.length === 3, 'Achievements should be unioned');
        assert(merged.codex.unlockedEntries.length === 3, 'Codex should be unioned');
        assert(merged.customizationChangesUsed === 4, 'Customization count should take higher valid value capped at 5');

        // 3. Verify SaveManager integration
        if (window.gameSaveManager) {
            const state = window.gameSaveManager._gatherState();
            assert(state.achievements !== undefined, 'SaveManager state must include achievements');
            assert(state.codex !== undefined, 'SaveManager state must include codex');
            assert(state.storyContent !== undefined, 'SaveManager state must include storyContent');
        }

        return true;
    };

    // --- PHASE 4: Dynamic World Events & Encounters ---
    window.testDynamicWorldEvents = function() {
        console.log('[TEST] Verifying Phase 4: Dynamic World Events, Encounters & Director...');

        // 1. Verify WorldEventData
        assert(window.WorldEventData, 'WorldEventData must be defined on window');
        assert(window.WorldEventData.WORLD_EVENTS.length >= 5, 'Expected at least 5 authored world events');

        // 2. Verify WorldEventSystem
        assert(window.WorldEventSystem, 'WorldEventSystem must be defined on window');
        window.WorldEventSystem.init();
        const testEvt = window.WorldEventData.WORLD_EVENTS[0];
        
        const triggered = window.WorldEventSystem.triggerEvent(testEvt.id);
        assert(triggered === true, `Event ${testEvt.id} should trigger`);
        assert(window.WorldEventSystem.isEventActive(testEvt.id), 'Event should be marked active');

        // Resolve event
        const resolved = window.WorldEventSystem.resolveEvent(testEvt.id, true);
        assert(resolved === true, 'Event should resolve successfully');
        assert(window.WorldEventSystem.isOnCooldown(testEvt.id), 'Event should be on cooldown after resolution');

        // 3. Verify EncounterSystem
        assert(window.EncounterSystem, 'EncounterSystem must be defined on window');
        window.EncounterSystem.init();
        const encounters = window.EncounterSystem.encounters;
        assert(encounters.length >= 4, `Expected at least 4 encounters, got ${encounters.length}`);
        const enc1 = encounters[0];
        const choiceId = enc1.choices[0].id;
        const encResolved = window.EncounterSystem.resolveEncounter(enc1.id, choiceId);
        assert(encResolved === true && enc1.resolved === true, 'Encounter should be resolved with choice');

        // 4. Verify EventChainSystem
        assert(window.EventChainSystem, 'EventChainSystem must be defined on window');
        window.EventChainSystem.init();
        const chain = window.EventChainSystem.chains[0];
        assert(chain.currentStage === 0, 'Chain should start at stage 0');
        window.EventChainSystem.advanceStage(chain.id, 'cleared');
        assert(chain.currentStage === 1, 'Chain should advance to stage 1');

        // 5. Verify EventDirector
        assert(window.EventDirector, 'EventDirector must be defined on window');
        window.EventDirector.init(1337);
        const r1 = window.EventDirector.pseudoRandom();
        const r2 = window.EventDirector.pseudoRandom();
        assert(r1 !== r2, 'Pseudo-random generator should produce varying sequence');

        return true;
    };
})();
