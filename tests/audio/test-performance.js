// ============================================================================
// THE WHISPERING WILDS - AUDIO PERFORMANCE & RECOVERY TEST SUITE
// Validates hardware scalability profiles (LOW, MED, HIGH, ULTRA),
// voice budget allocation, priority voice eviction, Alt-Tab ducking, and silent fallback.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Audio Performance & Recovery QA Tests ---');
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
      const perfSys = window.AudioPerformanceSystem;
      const prioritySys = window.AudioPrioritySystem;
      assert(perfSys !== null && (typeof perfSys === 'object' || typeof perfSys === 'function'), 'AudioPerformanceSystem must exist on window');
      assert(prioritySys !== null && (typeof prioritySys === 'object' || typeof prioritySys === 'function'), 'AudioPrioritySystem must exist on window');

      perfSys.init();
      prioritySys.init();

      // 1. Performance Tiers Voice Budgets (LOW 12, MED 20, HIGH 28, ULTRA 36)
      const tiers = [
        { name: 'low', maxVoices: 12 },
        { name: 'medium', maxVoices: 20 },
        { name: 'high', maxVoices: 28 },
        { name: 'ultra', maxVoices: 36 }
      ];

      for (const t of tiers) {
        perfSys.setTier(t.name);
        assert(perfSys.currentTier === t.name, `Performance tier must update to ${t.name}`);
        assert(perfSys.maxVoices === t.maxVoices, `Tier ${t.name} must have budget of ${t.maxVoices} voices (got ${perfSys.maxVoices})`);
      }

      // Reset to HIGH
      perfSys.setTier('high');

      // 2. Priority Mixing & Voice Eviction (Rule 106)
      // Tier values: CRITICAL_STORY 100, ACTIVE_INTERACTION 75, ENVIRONMENT_PRIMARY 50, BACKGROUND_FLUFF 25
      const canPlayStory = prioritySys.canAllocateVoice({ priority: 100, type: 'critical_story' });
      assert(canPlayStory === true, 'Critical story voice must always be allocatable');

      // Fill budget on LOW tier to test voice eviction
      perfSys.setTier('low'); // 12 voices max
      prioritySys.reset();

      // Allocate 12 low priority voices
      for (let i = 0; i < 12; i++) {
        prioritySys.registerVoice(`bg_voice_${i}`, 25);
      }
      assert(prioritySys.getActiveVoiceCount() === 12, 'Active voice count should reach 12');

      // Allocate critical voice: should evict a low priority voice
      const evictRes = prioritySys.requestVoiceSlot('story_dialogue', 100);
      assert(evictRes.allocated === true, 'Critical story voice must be granted slot via priority eviction');
      assert(evictRes.evictedVoiceId !== null, 'Low priority voice must have been evicted');

      // 3. Alt-Tab / Page Visibility Handling (Rule 99, 101)
      perfSys.onVisibilityChange(false); // Minimized / background tab
      assert(perfSys.isBackgrounded === true, 'AudioPerformanceSystem must mark isBackgrounded = true');

      perfSys.onVisibilityChange(true); // Resumed focus
      assert(perfSys.isBackgrounded === false, 'AudioPerformanceSystem must restore focus state');

      // 4. Audio Context Failure Recovery & Silent Fallback (Rule 103, 155)
      const recoveryResult = perfSys.handleContextFailure();
      assert(recoveryResult !== null && typeof recoveryResult === 'object', 'handleContextFailure must return recovery status');
      assert(recoveryResult.gameplaySafe === true, 'Context failure must maintain silent gameplay safety without crashing');

      // 5. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testPerformance: ${err.message}`);
    }

    console.log(`✓ Audio Performance & Recovery QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testPerformance = runTests;
})();
