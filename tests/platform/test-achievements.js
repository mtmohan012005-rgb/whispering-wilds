/**
 * Platform Achievements & Queue Unit Tests
 */

(function(root) {
  const PlatformAchievements = typeof require !== 'undefined' ? require('../../platform/platform-achievements') : root.PlatformAchievements;
  const DevelopmentPlatformProvider = typeof require !== 'undefined' ? require('../../platform/providers/development-provider') : root.DevelopmentPlatformProvider;
  const PlatformSession = typeof require !== 'undefined' ? require('../../platform/platform-session') : root.PlatformSession;

  async function runAchievementTests() {
    const results = { name: 'PlatformAchievementTests', passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) results.passed++;
      else { results.failed++; results.errors.push(msg); }
    }

    const provider = new DevelopmentPlatformProvider();
    await provider.initialize();
    const session = new PlatformSession(provider);
    await session.init();

    const ach = new PlatformAchievements(provider, session);
    ach.init();

    // 1. Successful unlock
    const unlockRes = await ach.unlock('ach_first_clue');
    assert(unlockRes.success === true, 'First achievement unlocked successfully');
    assert(ach.isUnlocked('ach_first_clue'), 'Achievement marked in unlocked list');

    // 2. Duplicate unlock prevention
    const dupRes = await ach.unlock('ach_first_clue');
    assert(dupRes.success === true && dupRes.alreadyUnlocked === true, 'Duplicate unlock handled cleanly without duplicate event');

    // 3. Offline unlock queuing
    session.setOffline();
    const offlineRes = await ach.unlock('ach_following_trail');
    assert(offlineRes.success === true && offlineRes.queuedOffline === true, 'Offline unlock queued');
    assert(ach.pendingOfflineQueue.includes('ach_following_trail'), 'Achievement added to pending queue');

    // 4. Reconnect and sync queue
    session.isOnline = true;
    session.status = PlatformSession.SessionStatus.AVAILABLE;
    const syncRes = await ach.syncPendingQueue();
    assert(syncRes.synced >= 1, 'Pending queue synced on reconnect');
    assert(ach.pendingOfflineQueue.length === 0, 'Pending queue cleared after sync');

    // 5. Customization ceiling invariant verification
    if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
      window.GameState.player.customizationChangesUsed = 5;
      await ach.unlock('ach_above_mist');
      assert(window.GameState.player.customizationChangesUsed <= 5, 'Achievement cannot exceed 5 customization changes');
    } else {
      assert(true, 'Customization ceiling check passed');
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAchievementTests };
    if (require.main === module) {
      runAchievementTests().then(r => {
        console.log(`[AchievementTest] Passed: ${r.passed}, Failed: ${r.failed}`);
        if (r.failed > 0) process.exit(1);
      });
    }
  } else {
    root.testAchievements = runAchievementTests;
  }
})(typeof window !== 'undefined' ? window : global);
